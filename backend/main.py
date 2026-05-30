from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timezone, timedelta
from collections import Counter
from pydantic import BaseModel
import os
import re
import sys
import json
import csv
import io
import subprocess
import platform
import urllib.request
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from fastapi.requests import Request
import traceback
import logging

load_dotenv()
logging.basicConfig(level=logging.ERROR)

GITHUB_REPO = "phuongnbm-lab/youtube-spy"

app = FastAPI(title="YouTube Spy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logging.error(f"Unhandled error on {request.url}: {exc}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"}
    )


# ── Config file (lưu API key bền vững, cạnh EXE hoặc cạnh main.py) ─────────────
def _config_path() -> str:
    if getattr(sys, 'frozen', False):
        return os.path.join(os.path.dirname(sys.executable), 'config.json')
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')

def _load_saved_key() -> str:
    try:
        with open(_config_path(), 'r', encoding='utf-8') as f:
            return json.load(f).get('api_key', '')
    except Exception:
        return ''

def _save_key_to_file(key: str):
    try:
        path = _config_path()
        data = {}
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        data['api_key'] = key
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


API_KEY = _load_saved_key() or os.getenv("YOUTUBE_API_KEY")
ICT = timezone(timedelta(hours=7))
DAYS_VN = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
APP_VERSION = "2026.05.42"


# ── License ──────────────────────────────────────────────────────────────────

def get_machine_id() -> str:
    """Lấy MachineGuid từ Windows Registry (giống VOICE_VOX)."""
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Cryptography",
            0, winreg.KEY_READ | winreg.KEY_WOW64_64KEY
        )
        value, _ = winreg.QueryValueEx(key, "MachineGuid")
        winreg.CloseKey(key)
        return str(value).strip()
    except Exception:
        pass
    # Fallback: wmic
    try:
        result = subprocess.run(
            ['wmic', 'csproduct', 'get', 'uuid'],
            capture_output=True, text=True, timeout=5
        )
        lines = [l.strip() for l in result.stdout.strip().split('\n') if l.strip()]
        if len(lines) >= 2:
            uid = lines[1].strip()
            if uid and uid.upper() not in ('UUID', 'TO BE FILLED BY O.E.M.', ''):
                return uid
    except Exception:
        pass
    import socket
    return socket.gethostname()


_LICENSE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQepTH-Juu0EPa_qYJyC-z-oAIblJ3B00nO3OFUAMphfrPeoQ0RmNF4enL0zwrmbBU4IH6YBrbXFqz-/pub?gid=1267456416&single=true&output=csv"




def check_license(sheet_url: str, machine_id: str) -> dict:
    """
    Fetch CSV từ Google Sheet và kiểm tra machine_id.
    Trả về: { valid: bool, status: str, user: str, expired: str, reason: str }
    """
    if not sheet_url:
        return {'valid': False, 'reason': 'Chưa cấu hình URL sheet license'}

    try:
        req = urllib.request.Request(sheet_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read().decode('utf-8-sig')
    except Exception as e:
        return {'valid': False, 'reason': f'Không kết nối được sheet license: {e}'}

    try:
        reader = csv.DictReader(io.StringIO(raw))
        rows = list(reader)
    except Exception:
        return {'valid': False, 'reason': 'Không đọc được dữ liệu sheet'}

    # Tìm cột Machine ID (không phân biệt hoa thường, bỏ khoảng trắng)
    def norm(s): return s.strip().lower().replace(' ', '').replace('-', '')

    for row in rows:
        # Tìm cột chứa machine ID
        mid_val = ''
        for k, v in row.items():
            if 'machine' in k.lower() or 'uuid' in k.lower() or 'id' in k.lower():
                mid_val = (v or '').strip()
                break
        if not mid_val:
            continue

        if norm(mid_val) != norm(machine_id):
            continue

        # Tìm các cột User, Status, Expired
        user = next((v for k, v in row.items() if 'user' in k.lower()), '')
        status = next((v for k, v in row.items() if 'status' in k.lower()), 'ON')
        expired_str = next((v for k, v in row.items() if 'expir' in k.lower()), '')

        if status.strip().upper() != 'ON':
            return {'valid': False, 'user': user, 'reason': 'License đã bị vô hiệu hoá (Status=OFF)'}

        if expired_str.strip():
            for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y'):
                try:
                    exp_dt = datetime.strptime(expired_str.strip(), fmt)
                    if exp_dt < datetime.now():
                        return {'valid': False, 'user': user, 'expired': expired_str,
                                'reason': f'License đã hết hạn từ {expired_str}'}
                    break
                except ValueError:
                    continue

        # Đọc API key từ cột YT-Spy (hoặc tên cột chứa "spy"/"key"/"yt")
        api_key = next(
            (v.strip() for k, v in row.items()
             if any(x in k.lower() for x in ('spy', 'yt-spy', 'ytspy', 'apikey', 'api_key', 'api key')) and v and v.strip()),
            ''
        )

        return {'valid': True, 'user': user.strip(), 'expired': expired_str.strip(), 'api_key': api_key, 'reason': 'OK'}

    return {'valid': False, 'reason': 'Máy này chưa được cấp phép. Liên hệ tác giả để đăng ký.'}


def get_youtube(request_key: str | None = None):
    key = request_key or API_KEY
    if not key:
        raise HTTPException(status_code=500, detail="Chưa có API Key. Nhập key trong phần cài đặt (⚙️) trên giao diện.")
    return build("youtube", "v3", developerKey=key, static_discovery=False)


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


@app.get("/api/search-channels")
async def search_channels(
    q: str = Query(..., description="Từ khoá tìm kiếm"),
    max_results: int = Query(10, ge=1, le=50),
    x_api_key: str | None = Header(default=None),
):
    youtube = get_youtube(x_api_key)
    try:
        # Bước 1: tìm channel theo keyword
        search_resp = youtube.search().list(
            part="snippet",
            q=q,
            type="channel",
            maxResults=max_results,
        ).execute()

        channel_ids = [item["snippet"]["channelId"] for item in search_resp.get("items", [])]
        if not channel_ids:
            return {"channels": []}

        # Bước 2: lấy stats chi tiết
        ch_resp = youtube.channels().list(
            part="snippet,statistics",
            id=",".join(channel_ids),
            maxResults=50,
        ).execute()

        now = datetime.now(timezone.utc)
        results = []
        for item in ch_resp.get("items", []):
            sn = item["snippet"]
            st = item.get("statistics", {})
            created_raw = sn.get("publishedAt", "")
            try:
                created_dt = datetime.fromisoformat(created_raw.replace("Z", "+00:00"))
                age_days = max((now - created_dt).days, 1)
                created_str = created_dt.strftime("%Y-%m-%d")
            except Exception:
                age_days = 1
                created_str = ""

            total_views = int(st.get("viewCount", 0) or 0)
            views_per_day = round(total_views / age_days, 3)

            results.append({
                "channelId": item["id"],
                "name": sn.get("title", ""),
                "thumbnail": sn["thumbnails"].get("medium", sn["thumbnails"].get("default", {})).get("url", ""),
                "subscriberCount": int(st.get("subscriberCount", 0) or 0),
                "viewCount": total_views,
                "videoCount": int(st.get("videoCount", 0) or 0),
                "country": sn.get("country", ""),
                "createdAt": created_str,
                "ageDays": age_days,
                "viewsPerDay": views_per_day,
                "url": f"https://youtube.com/channel/{item['id']}",
            })

        return {"channels": results}

    except HTTPException:
        raise
    except HttpError as e:
        detail = str(e)
        if "quotaExceeded" in detail:
            raise HTTPException(status_code=429, detail="Đã hết quota YouTube API hôm nay")
        if "keyInvalid" in detail:
            raise HTTPException(status_code=401, detail="API Key không hợp lệ")
        raise HTTPException(status_code=400, detail=f"YouTube API lỗi: {detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search-videos")
async def search_videos(
    q: str = Query(..., description="Từ khoá tìm kiếm video"),
    max_results: int = Query(10, ge=1, le=50),
    order: str = Query("relevance", description="relevance|viewCount|date|rating"),
    x_api_key: str | None = Header(default=None),
):
    youtube = get_youtube(x_api_key)
    try:
        search_resp = youtube.search().list(
            part="snippet",
            q=q,
            type="video",
            maxResults=max_results,
            order=order,
        ).execute()

        video_ids = [item["id"]["videoId"] for item in search_resp.get("items", [])]
        if not video_ids:
            return {"videos": []}

        # Lấy stats chi tiết
        vid_resp = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=",".join(video_ids),
        ).execute()

        results = []
        for item in vid_resp.get("items", []):
            sn = item["snippet"]
            st = item.get("statistics", {})
            cd = item.get("contentDetails", {})
            sec = _parse_iso_duration(cd.get("duration", ""))
            pub_raw = sn.get("publishedAt", "")
            try:
                pub_dt = datetime.fromisoformat(pub_raw.replace("Z", "+00:00")).astimezone(ICT)
                pub_str = pub_dt.strftime("%Y-%m-%d")
            except Exception:
                pub_str = ""

            results.append({
                "videoId": item["id"],
                "title": sn.get("title", ""),
                "thumbnail": sn["thumbnails"].get("medium", sn["thumbnails"].get("default", {})).get("url", ""),
                "channelId": sn.get("channelId", ""),
                "channelTitle": sn.get("channelTitle", ""),
                "publishedAt": pub_str,
                "viewCount": int(st.get("viewCount", 0) or 0),
                "likeCount": int(st.get("likeCount", 0) or 0),
                "commentCount": int(st.get("commentCount", 0) or 0),
                "durationSec": sec,
                "durationStr": _fmt_duration(sec),
                "isShort": 0 < sec <= 60,
                "url": f"https://youtube.com/watch?v={item['id']}",
            })

        return {"videos": results}

    except HTTPException:
        raise
    except HttpError as e:
        detail = str(e)
        if "quotaExceeded" in detail:
            raise HTTPException(status_code=429, detail="Đã hết quota YouTube API hôm nay")
        if "keyInvalid" in detail:
            raise HTTPException(status_code=401, detail="API Key không hợp lệ")
        raise HTTPException(status_code=400, detail=f"YouTube API lỗi: {detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/thumbnail")
async def proxy_thumbnail(video_id: str = Query(...), quality: str = Query("max")):
    """Proxy thumbnail image để frontend có thể download không bị CORS."""
    quality_map = {
        "max":  f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        "hq":   f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        "mq":   f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
    }
    urls = [quality_map.get(quality, quality_map["max"]), quality_map["hq"], quality_map["mq"]]
    from fastapi.responses import Response as FastResponse
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
                if len(data) > 5000:
                    return FastResponse(content=data, media_type="image/jpeg",
                        headers={"Content-Disposition": f'attachment; filename="{video_id}.jpg"'})
        except Exception:
            continue
    raise HTTPException(status_code=404, detail="Không tải được thumbnail")


def _load_license_cache() -> dict:
    try:
        with open(_config_path(), 'r', encoding='utf-8') as f:
            data = json.load(f)
        cache = data.get('_license_cache', {})
        if not cache:
            return {}
        cached_at = cache.get('cached_at', 0)
        # Cache có hiệu lực 1 giờ
        if (datetime.now().timestamp() - cached_at) < 3600:
            return cache
    except Exception:
        pass
    return {}


def _save_license_cache(result: dict):
    try:
        path = _config_path()
        data = {}
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        data['_license_cache'] = {**result, 'cached_at': datetime.now().timestamp()}
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


@app.get("/api/license")
async def api_license(force: bool = Query(False)):
    """Kiểm tra license — dùng cache nếu còn hiệu lực (1h)."""
    global API_KEY
    machine_id = get_machine_id()

    # Dùng cache nếu không bị force refresh
    if not force:
        cache = _load_license_cache()
        if cache and cache.get('machine_id') == machine_id:
            if cache.get('valid') and cache.get('api_key'):
                API_KEY = cache['api_key']
            return cache

    # Fetch sheet
    result = check_license(_LICENSE_SHEET_URL, machine_id)
    result['machine_id'] = machine_id

    if result.get('valid') and result.get('api_key'):
        key = result['api_key']
        _save_key_to_file(key)
        API_KEY = key

    # Chỉ cache kết quả hợp lệ (không cache lỗi mạng)
    if result.get('valid') or 'hết hạn' in result.get('reason', '') or 'vô hiệu' in result.get('reason', '') or 'chưa được cấp' in result.get('reason', ''):
        _save_license_cache(result)

    return result


@app.get("/api/machine-id")
async def api_machine_id():
    """Trả về Machine ID của máy này (để thêm vào sheet)."""
    return {'machine_id': get_machine_id()}




class KeyBody(BaseModel):
    key: str

@app.get("/api/key")
async def api_get_key():
    """Trả về API key đã lưu trong config.json."""
    key = _load_saved_key() or os.getenv("YOUTUBE_API_KEY") or ''
    return {"key": key, "has_key": bool(key)}

@app.post("/api/key")
async def api_save_key(body: KeyBody):
    """Lưu API key vào config.json cạnh EXE."""
    global API_KEY
    trimmed = body.key.strip()
    _save_key_to_file(trimmed)
    API_KEY = trimmed or None
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok", "api_key_set": bool(API_KEY)}


@app.get("/api/version")
async def get_version():
    return {"version": APP_VERSION}


@app.post("/api/dev/release")
async def dev_release():
    """Chỉ hoạt động khi chạy từ source (không phải EXE)."""
    if getattr(sys, 'frozen', False):
        raise HTTPException(status_code=403, detail="Chỉ hoạt động ở chế độ dev")

    src_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.join(src_dir, "..")
    main_py  = os.path.join(src_dir, "main.py")

    new_version = datetime.now(ICT).strftime("%Y.%m.%d")
    tag = f"v{new_version}"

    # Cập nhật APP_VERSION trong main.py
    with open(main_py, "r", encoding="utf-8") as f:
        content = f.read()
    import re as _re
    content = _re.sub(r'APP_VERSION = "[^"]+"', f'APP_VERSION = "{new_version}"', content)
    with open(main_py, "w", encoding="utf-8") as f:
        f.write(content)

    logs = []
    def run(cmd):
        r = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True)
        logs.append(r.stdout.strip() or r.stderr.strip())
        return r.returncode

    run(["git", "add", "-A"])
    run(["git", "commit", "-m", f"chore: release {tag}"])
    if run(["git", "push", "origin", "master"]) != 0:
        raise HTTPException(status_code=500, detail="Push thất bại — kiểm tra kết nối mạng")
    if run(["git", "tag", tag]) != 0:
        raise HTTPException(status_code=400, detail=f"Tag {tag} đã tồn tại — hôm nay đã release rồi")
    if run(["git", "push", "origin", tag]) != 0:
        raise HTTPException(status_code=500, detail="Push tag thất bại")

    return {"ok": True, "version": new_version, "tag": tag, "logs": logs}


@app.get("/api/update-check")
async def update_check():
    """So sánh version hiện tại với GitHub Releases mới nhất."""
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
        req = urllib.request.Request(url, headers={"User-Agent": "YouTubeSpy"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        latest_tag = data.get("tag_name", "").lstrip("v")
        download_url = ""
        for asset in data.get("assets", []):
            if asset.get("name", "").endswith(".exe"):
                download_url = asset.get("browser_download_url", "")
                break
        has_update = latest_tag != APP_VERSION and latest_tag != ""
        return {
            "current": APP_VERSION,
            "latest": latest_tag,
            "has_update": has_update,
            "release_url": data.get("html_url", ""),
            "download_url": download_url,
        }
    except Exception as e:
        return {"current": APP_VERSION, "latest": APP_VERSION, "has_update": False, "error": str(e)}


@app.post("/api/do-update")
async def do_update(body: dict):
    """
    Tải file EXE mới về, viết script thay thế, khởi động lại app.
    Chỉ hoạt động khi chạy dưới dạng EXE (frozen).
    """
    if not getattr(sys, 'frozen', False):
        raise HTTPException(status_code=400, detail="Chỉ hoạt động khi chạy dưới dạng EXE")

    download_url = body.get("download_url", "")
    if not download_url:
        raise HTTPException(status_code=400, detail="Thiếu download_url")

    exe_dir = os.path.dirname(sys.executable)
    setup_file = os.path.join(exe_dir, "_update_setup.exe")
    updater_bat = os.path.join(exe_dir, "_updater.bat")

    try:
        req = urllib.request.Request(download_url, headers={"User-Agent": "YouTubeSpy-Updater"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            with open(setup_file, "wb") as f:
                f.write(resp.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tải file thất bại: {e}")

    # Chạy NSIS silent install rồi mở app mới, xóa setup
    install_dir = os.path.dirname(sys.executable)
    app_exe = os.path.join(install_dir, "YouTube Spy.exe")
    bat_content = f"""@echo off
ping 127.0.0.1 -n 3 >nul
"{setup_file}" /S /D={install_dir}
start "" "{app_exe}"
del "{setup_file}"
del "%~f0"
"""
    with open(updater_bat, "w", encoding="utf-8") as f:
        f.write(bat_content)

    subprocess.Popen(["cmd", "/c", updater_bat], creationflags=subprocess.CREATE_NO_WINDOW)

    def _exit():
        import time
        time.sleep(1)
        os._exit(0)

    import threading
    threading.Thread(target=_exit, daemon=True).start()
    return {"ok": True}


# ── Serve React frontend (production build) ───────────────────────────────────
# YTSPY_DIST được set bởi launcher.py (EXE) hoặc dùng đường dẫn tương đối (dev)
_DIST = os.environ.get(
    "YTSPY_DIST",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"),
)

if os.path.isdir(_DIST):
    # Mount toàn bộ dist/ dưới route / để phục vụ tất cả static files
    # (logo.png, buy-me-a-coffee.png, assets/*, favicon.ico, ...)
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Phục vụ static files nếu tồn tại, ngược lại trả index.html (cho React Router)."""
        file_path = os.path.join(_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_DIST, "index.html"))
