"""
YouTube Spy — Launcher với System Tray.
Chạy uvicorn ngầm, không hiện CMD, hiện icon tray góc phải màn hình.
"""
import sys
import os
import threading
import webbrowser
import time
import socket
import traceback
import urllib.request
import json

# ── Log file (debug khi EXE crash ẩn) ────────────────────────────────────────
_LOG = os.path.join(os.path.dirname(sys.executable) if getattr(sys, 'frozen', False)
                    else os.path.dirname(os.path.abspath(__file__)), 'ytspy.log')

def _log(msg: str):
    try:
        with open(_LOG, 'a', encoding='utf-8') as f:
            f.write(f'[{time.strftime("%H:%M:%S")}] {msg}\n')
    except Exception:
        pass

_log('=== YouTube Spy starting ===')
_log(f'frozen={getattr(sys.flags, "frozen", False)} | sys.frozen={getattr(sys, "frozen", False)}')
_log(f'executable={sys.executable}')

# Fix cho --noconsole: PyInstaller set stdout/stderr = None khi không có cửa sổ CMD
# Uvicorn logging cần gọi sys.stdout.isatty() — crash nếu stdout là None
import io as _io
if sys.stdout is None:
    sys.stdout = _io.StringIO()
if sys.stderr is None:
    sys.stderr = _io.StringIO()

# ── Đảm bảo backend dir trong sys.path ───────────────────────────────────────
if not getattr(sys, 'frozen', False):
    _HERE = os.path.dirname(os.path.abspath(__file__))
    if _HERE not in sys.path:
        sys.path.insert(0, _HERE)

# ── 1. Đường dẫn frontend/dist ────────────────────────────────────────────────
def _bundle_dir():
    """Trả về thư mục gốc của bundle (PyInstaller hoặc Nuitka onefile)."""
    if hasattr(sys, '_MEIPASS'):          # PyInstaller
        return sys._MEIPASS
    try:                                   # Nuitka compiled
        _ = __compiled__                   # noqa: F821 — chỉ tồn tại khi Nuitka
        return os.path.dirname(os.path.abspath(__file__))
    except NameError:
        pass
    return None                            # Development mode

def _dist_path():
    bd = _bundle_dir()
    if bd:
        return os.path.join(bd, 'dist')
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')

_dp = _dist_path()
os.environ['YTSPY_DIST'] = _dp
_log(f'YTSPY_DIST={_dp} | exists={os.path.isdir(_dp)}')

# ── 2. Load .env cạnh EXE (nếu có) ───────────────────────────────────────────
if getattr(sys, 'frozen', False):
    _env = os.path.join(os.path.dirname(sys.executable), '.env')
    if os.path.exists(_env):
        from dotenv import load_dotenv
        load_dotenv(_env)
        _log(f'.env loaded from {_env}')

# ── 3. Import app & deps ──────────────────────────────────────────────────────
try:
    _log('importing main...')
    from main import app          # noqa: E402
    _log('main OK')
except Exception as e:
    _log(f'FATAL: main import failed: {e}\n{traceback.format_exc()}')
    raise

try:
    import uvicorn                # noqa: E402
    import pystray                # noqa: E402
    from PIL import Image, ImageDraw  # noqa: E402
    _log('uvicorn/pystray/PIL OK')
except Exception as e:
    _log(f'FATAL: deps import failed: {e}\n{traceback.format_exc()}')
    raise


# ── 4. Tạo icon tray ─────────────────────────────────────────────────────────
def _make_icon() -> Image.Image:
    """Load Logo.ico (bundled hoặc cạnh EXE/script), fallback về icon vẽ tay."""
    # Tìm Logo.ico: trong _MEIPASS (EXE) → cạnh EXE → cạnh script
    candidates = []
    bd = _bundle_dir()
    if bd:
        candidates.append(os.path.join(bd, 'Logo.ico'))
    candidates.append(os.path.join(os.path.dirname(sys.executable), 'Logo.ico'))
    if not bd:
        candidates.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Logo.ico'))

    for path in candidates:
        if os.path.exists(path):
            try:
                img = Image.open(path)
                img = img.convert('RGBA')
                img = img.resize((64, 64), Image.LANCZOS)
                _log(f'icon loaded from {path}')
                return img
            except Exception as e:
                _log(f'icon load failed ({path}): {e}')

    # Fallback: vẽ tay
    _log('using fallback icon')
    SIZE = 64
    img  = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d    = ImageDraw.Draw(img)
    d.ellipse([2, 2, SIZE - 2, SIZE - 2], fill=(124, 58, 237, 255))
    cx, cy = SIZE // 2, SIZE // 2
    tri = [(cx - 10, cy - 13), (cx - 10, cy + 13), (cx + 14, cy)]
    d.polygon(tri, fill=(255, 255, 255, 240))
    return img


# ── 5. Tìm port trống ─────────────────────────────────────────────────────────
def _free_port(preferred: int = 8000) -> int:
    for p in range(preferred, preferred + 10):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    return preferred


# ── 6. Main ───────────────────────────────────────────────────────────────────
def main():
    PORT = _free_port(8000)
    URL  = f'http://localhost:{PORT}'
    _log(f'Using port {PORT}')

    # ── Uvicorn trên NON-DAEMON thread ────────────────────────────────────────
    def _run_server():
        try:
            _log(f'uvicorn starting on {PORT}...')
            uvicorn.run(app, host='127.0.0.1', port=PORT, log_level='error')
            _log('uvicorn exited normally')
        except Exception as e:
            _log(f'uvicorn CRASHED: {e}\n{traceback.format_exc()}')

    server_thread = threading.Thread(target=_run_server, daemon=False)
    server_thread.start()

    # Mở browser khi server sẵn sàng (tối đa 15 giây)
    def _open_browser():
        for _ in range(30):
            time.sleep(0.5)
            try:
                with socket.create_connection(('127.0.0.1', PORT), timeout=1):
                    _log('server ready, opening browser')
                    break
            except OSError:
                pass
        webbrowser.open(URL)

    threading.Thread(target=_open_browser, daemon=True).start()

    # ── System tray ───────────────────────────────────────────────────────────
    def on_open(icon, item):
        webbrowser.open(URL)

    def on_exit(icon, item):
        _log('user clicked exit')
        icon.stop()
        os._exit(0)

    def on_check_update(icon, item):
        try:
            req = urllib.request.Request(
                f'{URL}/api/update-check',
                headers={'User-Agent': 'YouTubeSpy-Tray'}
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode())
            if data.get('has_update'):
                webbrowser.open(data.get('release_url', 'https://github.com'))
            else:
                webbrowser.open(URL)
        except Exception as e:
            _log(f'update check failed: {e}')

    menu = pystray.Menu(
        pystray.MenuItem('YouTube Spy', None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem(f'🌐  Mở trình duyệt  ({URL})', on_open, default=True),
        pystray.MenuItem('🔄  Kiểm tra cập nhật', on_check_update),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('❌  Tắt app', on_exit),
    )

    try:
        _log('starting pystray...')
        icon = pystray.Icon(
            name  = 'YouTube Spy',
            icon  = _make_icon(),
            title = f'YouTube Spy — {URL}',
            menu  = menu,
        )
        icon.run()
        _log('pystray exited')
    except Exception as e:
        _log(f'pystray failed: {e}\n{traceback.format_exc()}')
        # Fallback: giữ process sống nhờ non-daemon server_thread
        while server_thread.is_alive():
            time.sleep(1)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        _log(f'main() CRASHED: {e}\n{traceback.format_exc()}')
        raise
