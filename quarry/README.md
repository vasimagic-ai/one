# Cariera Fântâna — redrawn plan + 3D demo

Source: three photos of *Harta geologică, Cariera Fântâna* (SC ROMET SA, Baia Sprie, 08.10.1997, 1:1000, Stereo '70).

| Output | What |
|---|---|
| `index.html` | Interactive 3D viewer — open the file directly in a browser (works offline, no server). |
| `quarry_plan.png` / `data/quarry_plan.svg` | The sheet redrawn as a clean vector plan (5 m contours, stream, reserve-block outlines, labels, buildings, spot heights, scale, north arrow). |

## How it was made
1. The three photos were registered with SIFT feature matching into one continuous sheet.
2. Spot heights, labelled contour points and the stream's water profile were read off the stitched sheet by hand → `tools/control_points.py`.
3. `tools/build_dem.py` fits a surface (thin-plate RBF on a plane trend, stream bed carved to the surveyed profile, valley model far from mapped ground) → `data/dem.json`.
4. `tools/redraw.py` contours that surface into the SVG plan; `tools/pack_assets.py` packs data for the viewer; `src/main.js` is the three.js viewer (bundled to `vendor/app.js` by `build.sh`).

## Caveats — read before relying on any number
* This is a **reconstruction**, not a survey. Heights come from ~200 hand-read points; expect several metres of error, more on the steep faces.
* Areas the sheet does not map (corners, south slope, far valley) are extrapolated and drawn dimmed / dashed.
* Reserve-block outlines are approximate polylines read off the photos; block categories (B / C₁ / C₂) follow the sheet's labels.
* Sheet orientation is kept: north points to the right (as on the original).
* The viewer's "Planșa originală" mode drapes the stitched scan on the terrain for checking registration.
