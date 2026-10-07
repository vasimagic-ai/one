#!/bin/sh
# Rebuild everything.  Needs: python3 (numpy scipy scikit-image pillow), node + `npm i three@0.160.0 esbuild`
# 1) stitch the 3 photos into pano.png (see README) 2) python tools -> data/ 3) bundle viewer
set -e
cd "$(dirname "$0")"
python3 tools/build_dem.py
python3 tools/redraw.py
PANO="${PANO:-pano.png}" python3 tools/pack_assets.py
npx esbuild src/main.js --bundle --minify --format=iife --outfile=vendor/app.js
