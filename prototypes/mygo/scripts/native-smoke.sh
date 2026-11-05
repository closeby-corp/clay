#!/usr/bin/env bash
set -euo pipefail

prototype_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
native_cache="${CLAY_MYGO_NATIVE_CACHE:-$HOME/.cache/clay-mygo/native-runtime}"
native_root="$native_cache/root"
utility_dir="$native_root/usr/bin"
native_display="${MYGO_TEST_DISPLAY:-:99}"
api_base="${MYGO_TEST_API:-http://127.0.0.1:4174}"
binary="$prototype_dir/bin/mygo"

for utility in xdotool xwd xwdtopnm pnmtopng; do
	if [[ ! -x "$utility_dir/$utility" ]]; then
		printf 'Missing user-local %s under %s\n' "$utility" "$utility_dir" >&2
		exit 1
	fi
done
if [[ ! -x "$binary" ]]; then
	printf 'Build the native app first: %s/scripts/build.sh\n' "$prototype_dir" >&2
	exit 1
fi
if ! DISPLAY="$native_display" xdpyinfo -display "$native_display" >/dev/null 2>&1; then
	printf 'No X display at %s. Start the user-local Xvfb before running this script.\n' "$native_display" >&2
	exit 1
fi

export DISPLAY="$native_display"
export GDK_BACKEND=x11 LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe
export LD_LIBRARY_PATH="$native_root/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
native_xdg="$native_cache/xdg"
export XDG_CONFIG_HOME="$native_xdg/config" XDG_CACHE_HOME="$native_xdg/cache"
export XDG_DATA_HOME="$native_xdg/data" XDG_STATE_HOME="$native_xdg/state"
export XDG_RUNTIME_DIR="$native_cache/runtime"
mkdir -p "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$XDG_DATA_HOME" "$XDG_STATE_HOME" "$XDG_RUNTIME_DIR" "$native_cache/logs" "$native_cache/screenshots" "$native_cache/run"
chmod 700 "$XDG_RUNTIME_DIR"

if "$utility_dir/xdotool" search --onlyvisible --name '^MyGo Operations Desk$' >/dev/null 2>&1; then
	printf 'A MyGo window is already open on %s. Reuse it or close it before starting another.\n' "$DISPLAY" >&2
	exit 1
fi

app_log="$native_cache/logs/mygo.log"
rss_log="$native_cache/logs/rss-samples.tsv"
process_log="$native_cache/logs/process-tree.txt"
screenshot_xwd="$native_cache/screenshots/mygo-smoke.xwd"
screenshot_png="$native_cache/screenshots/mygo-smoke.png"
: > "$app_log"
"/usr/bin/dbus-run-session" -- "$binary" -api "$api_base" >> "$app_log" 2>&1 &
launcher_pid=$!
native_pid=

cleanup() {
	native_cmd="$(ps -p "$native_pid" -o args= 2>/dev/null || true)"
	if [[ -n "$native_pid" && "$native_cmd" == "$binary -api $api_base" ]] && kill -0 "$native_pid" 2>/dev/null; then
		kill -TERM "$native_pid" 2>/dev/null || true
	fi
	launcher_cmd="$(ps -p "$launcher_pid" -o args= 2>/dev/null || true)"
	if [[ "$launcher_cmd" == "/usr/bin/dbus-run-session -- $binary -api $api_base" ]] && kill -0 "$launcher_pid" 2>/dev/null; then
		for _ in {1..30}; do
			kill -0 "$launcher_pid" 2>/dev/null || break
			sleep 0.1
		done
		if kill -0 "$launcher_pid" 2>/dev/null; then
			kill -TERM "$launcher_pid" 2>/dev/null || true
		fi
		wait "$launcher_pid" 2>/dev/null || true
	fi
	if [[ -f "$native_cache/run/mygo.pid" && "$(cat "$native_cache/run/mygo.pid")" == "$native_pid" ]]; then
		: > "$native_cache/run/mygo.pid"
	fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

window_id=
for _ in {1..300}; do
	if ! kill -0 "$launcher_pid" 2>/dev/null; then
		break
	fi
	window_id="$("$utility_dir/xdotool" search --onlyvisible --name '^MyGo Operations Desk$' 2>/dev/null | head -1 || true)"
	if [[ -n "$window_id" ]]; then
		break
	fi
	sleep 0.1
done
if [[ -z "$window_id" ]]; then
	printf 'Native window did not map on %s; startup log follows:\n' "$DISPLAY" >&2
	tail -80 "$app_log" >&2
	exit 1
fi

native_pid="$("$utility_dir/xdotool" getwindowpid "$window_id" 2>/dev/null || true)"
printf '%s\n' "$window_id" > "$native_cache/run/window.id"
printf '%s\n' "$native_pid" > "$native_cache/run/mygo.pid"
xprop -id "$window_id" WM_NAME _NET_WM_NAME _NET_WM_PID > "$native_cache/logs/window-properties.txt" 2>&1

printf 'sample\ttimestamp\tapp_rss_kib\n' > "$rss_log"
for sample in {1..5}; do
	rss="$(ps -p "$native_pid" -o rss= | tr -d ' ' || true)"
	printf '%s\t%s\t%s\n' "$sample" "$(date -Is)" "${rss:-unavailable}" >> "$rss_log"
	sleep 1
done
"$utility_dir/xwd" -silent -id "$window_id" -out "$screenshot_xwd"
"$utility_dir/xwdtopnm" "$screenshot_xwd" | "$utility_dir/pnmtopng" > "$screenshot_png"
{
	ps -o pid,ppid,rss,vsz,stat,etime,args -p "$launcher_pid" -p "$native_pid"
	children="$(pgrep -P "$launcher_pid" || true)"
	if [[ -n "$children" ]]; then
		ps -o pid,ppid,rss,vsz,stat,etime,args -p "$(tr '\n' ',' <<< "$children" | sed 's/,$//')"
	fi
} > "$process_log"

printf 'Native window ready: display=%s window=%s app_pid=%s\n' "$DISPLAY" "$window_id" "${native_pid:-unknown}"
printf 'API: %s\nScreenshot: %s\nLog: %s\nRSS samples: %s\n' "$api_base" "$screenshot_png" "$app_log" "$rss_log"
printf 'Process tree sample: %s\nClose the window or interrupt this command to stop MyGo; Xvfb stays running.\n' "$process_log"
wait "$launcher_pid"
