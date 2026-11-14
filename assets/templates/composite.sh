#!/usr/bin/env bash
#
# vibe-video — ffmpeg composite script
#
# Usage:
#   bash composite.sh <frames_dir> [output.mp4] [fps] [bgm_file] [overlay_plate]
#
# Hybrid mode (5th arg): Canvas frames are chroma-keyed over an AI-generated
# atmosphere plate. Set KEY=e8e4dc to the Canvas layer background color.
#
# Examples:
#   bash composite.sh ./frames demo.mp4
#   bash composite.sh ./frames demo.mp4 30 bgm.mp3
#
# Windows notes:
#   - Run from Git Bash / WSL / MSYS2.
#   - If ffmpeg is not on PATH: FFMPEG=/d/tools/ffmpeg.exe bash composite.sh ...
#   - All paths are quoted, spaces are safe.

set -euo pipefail

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

OVERLAY="${5:-}"

COMMON=(-framerate "$FPS" -i "$PATTERN" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart)

if [ -n "$OVERLAY" ]; then
  # Hybrid mode: AI-generated atmosphere plate + keyed Canvas frames.
  # KEY is the paper color of the Canvas layer (hex, no #).
  KEY="${KEY:-e8e4dc}"
  if [ ! -f "$OVERLAY" ]; then
    echo "Error: overlay plate not found: $OVERLAY"
    exit 1
  fi
  echo "Compositing Canvas frames over plate ($OVERLAY), key=#$KEY -> $OUTPUT"
  "$FFMPEG" -y -stream_loop -1 -i "$OVERLAY" "${COMMON[@]}" \
    -filter_complex "[1:v]colorkey=0x${KEY}:0.10:0.04[fg];[0:v][fg]overlay=shortest=1" \
    "$OUTPUT"
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
