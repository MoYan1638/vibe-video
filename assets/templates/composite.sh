#!/usr/bin/env bash
#
# vibe-video — ffmpeg composite script
#
# Usage:
#   bash composite.sh <frames_dir> [output.mp4] [fps] [bgm_file] [overlay_plate]
#   bash composite.sh --overlay <plate.mp4> <frames_dir> [output.mp4] [fps]
#
# Hybrid mode (5th arg, or the --overlay flag form): Canvas frames are placed
# over an AI-generated atmosphere plate. If the frames were rendered with
# `--alpha true` they already carry transparency and no key is applied.
# Plain RGB frames get chroma-keyed instead; set KEY=e8e4dc to the paper color.
#
# Examples:
#   bash composite.sh ./frames demo.mp4
#   bash composite.sh ./frames demo.mp4 30 bgm.mp3
#   bash composite.sh --overlay plate.mp4 ./frames demo.mp4 30
#   KEY=e8e4dc bash composite.sh ./frames demo.mp4 30 "" plate.mp4
#
# Windows notes:
#   - Run from Git Bash / WSL / MSYS2.
#   - If ffmpeg is not on PATH: FFMPEG=/d/tools/ffmpeg.exe bash composite.sh ...
#   - All paths are quoted, spaces are safe.

set -euo pipefail

# --overlay <plate> <frames_dir> [out] [fps]  ->  rewrite to positional form
OVERLAY=""
if [ "${1:-}" = "--overlay" ]; then
  OVERLAY="$2"
  set -- "$3" "${4:-output.mp4}" "${5:-30}"
fi

FRAMES_DIR="${1:-./frames}"
OUTPUT="${2:-output.mp4}"
FPS="${3:-30}"
BGM="${4:-}"
FFMPEG="${FFMPEG:-ffmpeg}"

if [ ! -d "$FRAMES_DIR" ]; then
  echo "Error: frames directory not found: $FRAMES_DIR"
  exit 1
fi

PATTERN="${FRAMES_DIR}/frame_%04d.png"
if [ ! -f "$(printf "$PATTERN" 0)" ]; then
  echo "Error: no frame_0000.png in $FRAMES_DIR (naming must be frame_%04d.png)"
  exit 1
fi

if ! command -v "$FFMPEG" >/dev/null 2>&1; then
  echo "Error: ffmpeg not found ('$FFMPEG'). Set FFMPEG=/path/to/ffmpeg."
  exit 1
fi

OVERLAY="${5:-${OVERLAY:-}}"

COMMON=(-framerate "$FPS" -i "$PATTERN" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart)

if [ -n "$OVERLAY" ]; then
  # Hybrid mode: AI-generated atmosphere plate + Canvas frames on top.
  if [ ! -f "$OVERLAY" ]; then
    echo "Error: overlay plate not found: $OVERLAY"
    exit 1
  fi
  # Detect alpha: PNG color type 6 (RGBA) in the first frame's IHDR.
  HAS_ALPHA=0
  if command -v od >/dev/null 2>&1; then
    COLOR_TYPE=$(od -An -tu1 -j 25 -N 1 "$(printf "$PATTERN" 0)" 2>/dev/null | tr -d ' \n')
    [ "$COLOR_TYPE" = "6" ] && HAS_ALPHA=1
  fi
  if [ "$HAS_ALPHA" = "1" ]; then
    echo "Compositing transparent Canvas frames over plate ($OVERLAY) -> $OUTPUT"
    "$FFMPEG" -y -stream_loop -1 -i "$OVERLAY" "${COMMON[@]}" \
      -filter_complex "[0:v][1:v]overlay=shortest=1:format=auto" \
      "$OUTPUT"
  else
    KEY="${KEY:-e8e4dc}"
    echo "Compositing keyed Canvas frames over plate ($OVERLAY), key=#$KEY -> $OUTPUT"
    echo "  (tip: render with --alpha true to skip keying entirely)"
    "$FFMPEG" -y -stream_loop -1 -i "$OVERLAY" "${COMMON[@]}" \
      -filter_complex "[1:v]colorkey=0x${KEY}:0.10:0.04[fg];[0:v][fg]overlay=shortest=1" \
      "$OUTPUT"
  fi
  SIZE=$(du -h "$OUTPUT" | cut -f1)
  echo "Done: $OUTPUT ($SIZE)"
  exit 0
fi

if [ -z "$BGM" ]; then
  echo "Compositing video only -> $OUTPUT"
  "$FFMPEG" -y "${COMMON[@]}" "$OUTPUT"
else
  if [ ! -f "$BGM" ]; then
    echo "Error: BGM not found: $BGM"
    exit 1
  fi
  echo "Compositing video + BGM ($BGM) -> $OUTPUT"
  "$FFMPEG" -y "${COMMON[@]}" -i "$BGM" -c:a aac -b:a 192k -shortest "$OUTPUT"
fi

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "Done: $OUTPUT ($SIZE)"
