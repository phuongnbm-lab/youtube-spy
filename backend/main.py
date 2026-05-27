from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timezone, timedelta
from collections import Counter
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="YouTube Spy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("YOUTUBE_API_KEY")
ICT = timezone(timedelta(hours=7))
DAYS_VN = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]


def get_youtube(request_key: str | None = None):
    key = request_key or API_KEY
    if not key:
        raise HTTPException(status_code=500, detail="Chưa có API Key. Nhập key trong phần cài đặt (⚙️) trên giao diện.")
    return build("youtube", "v3", developerKey=key)


def resolve_channel_id(youtube, query: str) -> str:
    query = query.strip()

    # Direct channel ID (UCxxxxxxxxxxxxxxxxxxxxxxxx)
    if re.match(r"^UC[\w-]{22}$", query):
        return query

    # Channel ID inside URL
    url_id_match = re.search(r"youtube\.com/channel/(UC[\w-]{22})", query)
    if url_id_match:
        return url_id_match.group(1)

    # @handle from URL or plain text
    handle_match = re.search(r"youtube\.com/@([\w.-]+)", query)
    if handle_match:
        handle = handle_match.group(1)
    elif query.startswith("@"):
        handle = query[1:]
    else:
        handle = query

    # Try forHandle endpoint (official @handle lookup)
    try:
        resp = youtube.channels().list(part="id", forHandle=handle).execute()
        if resp.get("items"):
            return resp["items"][0]["id"]
    except Exception:
        pass

    # Fallback: search
    resp = youtube.search().list(
        part="snippet", q=handle, type="channel", maxResults=1
    ).execute()
    if resp.get("items"):
        return resp["items"][0]["snippet"]["channelId"]

    raise HTTPException(status_code=404, detail=f"Không tìm thấy kênh: {query}")


def get_uploads_playlist(youtube, channel_id: str) -> str:
    resp = youtube.channels().list(part="contentDetails,snippet,statistics", id=channel_id).execute()
    if not resp.get("items"):
        raise HTTPException(status_code=404, detail="Kênh không tồn tại hoặc là kênh riêng tư")
    item = resp["items"][0]
    playlist_id = item["contentDetails"]["relatedPlaylists"]["uploads"]
    snippet = item["snippet"]
    stats = item.get("statistics", {})
    channel_meta = {
        "name": snippet["title"],
        "thumbnail": snippet["thumbnails"].get("medium", snippet["thumbnails"].get("default", {})).get("url", ""),
        "description": snippet.get("description", "")[:120],
        "subscriberCount": stats.get("subscriberCount", "0"),
        "videoCount": stats.get("videoCount", "0"),
    }
    return playlist_id, channel_meta


def _parse_dt(raw_dt: str, video_id: str, title: str, thumbnail: str) -> dict | None:
    try:
        dt_utc = datetime.fromisoformat(raw_dt.replace("Z", "+00:00"))
    except Exception:
        return None
    dt_ict = dt_utc.astimezone(ICT)
    return {
        "title": title,
        "videoId": video_id,
        "thumbnail": thumbnail,
        "publishedAt": dt_ict.strftime("%d/%m/%Y %H:%M"),
        "hour": dt_ict.hour,
        "dayIndex": dt_ict.weekday(),
        "dayName": DAYS_VN[dt_ict.weekday()],
        "month": dt_ict.month,
        "year": dt_ict.year,
        # Sẽ được điền bởi enrich_videos()
        "description": "",
        "tags": [],
        "viewCount": "0",
        "likeCount": "0",
        "durationSec": 0,
        "durationStr": "",
        "isShort": False,
    }


def _parse_iso_duration(s: str) -> int:
    """PT1H2M3S → số giây."""
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m:
        return 0
    return int(m.group(1) or 0) * 3600 + int(m.group(2) or 0) * 60 + int(m.group(3) or 0)


def _fmt_duration(sec: int) -> str:
    if sec <= 0:
        return ""
    if sec < 3600:
        m, s = divmod(sec, 60)
        return f"{m}:{s:02d}"
    h, r = divmod(sec, 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}"


def enrich_videos(youtube, videos: list) -> list:
    """Gọi videos.list để lấy description, tags, viewCount, duration."""
    if not videos:
        return videos
    enriched_map = {}
    for i in range(0, len(videos), 50):
        batch = videos[i:i + 50]
        ids = ",".join(v["videoId"] for v in batch)
        try:
            resp = youtube.videos().list(
                part="snippet,statistics,contentDetails", id=ids
            ).execute()
            for item in resp.get("items", []):
                snippet = item["snippet"]
                stats = item.get("statistics", {})
                cd = item.get("contentDetails", {})
                sec = _parse_iso_duration(cd.get("duration", ""))
                enriched_map[item["id"]] = {
                    "description": snippet.get("description", "")[:400],
                    "tags": snippet.get("tags", [])[:20],
                    "viewCount": stats.get("viewCount", "0"),
                    "likeCount": stats.get("likeCount", "0"),
                    "durationSec": sec,
                    "durationStr": _fmt_duration(sec),
                    "isShort": 0 < sec <= 60,
                }
        except Exception:
            pass
    return [{**v, **enriched_map.get(v["videoId"], {})} for v in videos]


def _fetch_via_playlist(youtube, playlist_id: str, limit: int) -> list:
    videos = []
    next_page_token = None
    while len(videos) < limit:
        batch = min(50, limit - len(videos))
        resp = youtube.playlistItems().list(
            part="snippet",
            playlistId=playlist_id,
            maxResults=batch,
            pageToken=next_page_token,
        ).execute()
        for item in resp.get("items", []):
            s = item["snippet"]
            if s["title"] in ("Private video", "Deleted video"):
                continue
            raw_dt = s.get("publishedAt", "")
            thumb = s["thumbnails"].get("medium", s["thumbnails"].get("default", {})).get("url", "")
            v = _parse_dt(raw_dt, s["resourceId"]["videoId"], s["title"], thumb)
            if v:
                videos.append(v)
        next_page_token = resp.get("nextPageToken")
        if not next_page_token:
            break
    return videos


def _fetch_via_search(youtube, channel_id: str, limit: int) -> list:
    """Fallback khi playlist bị khoá — dùng search.list (tốn quota hơn)."""
    videos = []
    next_page_token = None
    while len(videos) < limit:
        batch = min(50, limit - len(videos))
        resp = youtube.search().list(
            part="snippet",
            channelId=channel_id,
            type="video",
            order="date",
            maxResults=batch,
            pageToken=next_page_token,
        ).execute()
        for item in resp.get("items", []):
            s = item["snippet"]
            raw_dt = s.get("publishedAt", "")
            thumb = s["thumbnails"].get("medium", s["thumbnails"].get("default", {})).get("url", "")
            v = _parse_dt(raw_dt, item["id"]["videoId"], s["title"], thumb)
            if v:
                videos.append(v)
        next_page_token = resp.get("nextPageToken")
        if not next_page_token:
            break
    return videos


def _fetch_via_rss(channel_id: str) -> list:
    """Fallback cuối: RSS feed công khai của YouTube, không cần API key, tối đa 15 video."""
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            xml_data = resp.read()
    except Exception:
        return []

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError:
        return []

    videos = []
    for entry in root.findall("atom:entry", ns):
        vid_el = entry.find("yt:videoId", ns)
        title_el = entry.find("atom:title", ns)
        pub_el = entry.find("atom:published", ns)
        if vid_el is None or title_el is None or pub_el is None:
            continue
        thumb = ""
        mg = entry.find("media:group", ns)
        if mg is not None:
            t = mg.find("media:thumbnail", ns)
            if t is not None:
                thumb = t.get("url", "")
        v = _parse_dt(pub_el.text or "", vid_el.text or "", title_el.text or "", thumb)
        if v:
            videos.append(v)
    return videos


def fetch_videos(youtube, playlist_id: str, channel_id: str, limit: int) -> tuple[list, str]:
    # Phương án 1: playlistItems (rẻ nhất — 1 unit/request)
    try:
        videos = _fetch_via_playlist(youtube, playlist_id, limit)
        if videos:
            return videos, "playlist"
    except HttpError as e:
        if e.resp.status not in (403, 404):
            raise

    # Phương án 2: search.list (100 units/request, hoạt động với hầu hết kênh)
    search_videos = _fetch_via_search(youtube, channel_id, limit)
    if search_videos:
        return search_videos, "search"

    # Phương án 3: RSS feed (miễn phí, không cần API key, tối đa 15 video gần nhất)
    rss_videos = _fetch_via_rss(channel_id)
    return rss_videos, "rss"


@app.get("/api/analyze")
async def analyze(
    channel: str = Query(..., description="URL, @handle, hoặc Channel ID"),
    limit: int = Query(50, ge=10, le=50),
    x_api_key: str | None = Header(default=None),
):
    youtube = get_youtube(x_api_key)
    try:
        channel_id = resolve_channel_id(youtube, channel)
        playlist_id, channel_meta = get_uploads_playlist(youtube, channel_id)
        videos, fetch_method = fetch_videos(youtube, playlist_id, channel_id, limit)

        if not videos:
            raise HTTPException(status_code=404, detail="Không thể lấy video. Kênh có thể đang ở chế độ riêng tư hoặc chưa có video công khai.")

        # Enrich với description, tags, viewCount (bỏ qua nếu dùng RSS)
        if fetch_method != "rss":
            videos = enrich_videos(youtube, videos)

        hour_counts = Counter(v["hour"] for v in videos)
        day_counts = Counter(v["dayIndex"] for v in videos)

        hour_data = [hour_counts.get(h, 0) for h in range(24)]
        day_data = [day_counts.get(d, 0) for d in range(7)]

        peak_hour = max(hour_counts, key=hour_counts.get)
        peak_day_idx = max(day_counts, key=day_counts.get)

        return {
            "channel": channel_meta,
            "analyzedCount": len(videos),
            "fetchMethod": fetch_method,
            "peakHour": peak_hour,
            "peakDayIndex": peak_day_idx,
            "peakDayName": DAYS_VN[peak_day_idx],
            "hourData": hour_data,
            "dayData": day_data,
            "dayLabels": DAYS_VN,
            "videos": videos,
        }

    except HTTPException:
        raise
    except HttpError as e:
        detail = str(e)
        if "quotaExceeded" in detail:
            raise HTTPException(status_code=429, detail="Đã hết quota YouTube API hôm nay (10,000 units/ngày)")
        if "keyInvalid" in detail:
            raise HTTPException(status_code=401, detail="API Key không hợp lệ")
        raise HTTPException(status_code=400, detail=f"YouTube API lỗi: {detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "api_key_set": bool(API_KEY)}
