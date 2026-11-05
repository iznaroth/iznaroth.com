// Piecewise-linear interpolation through [x, y] stops, clamped at both ends.
export function interpolate(stops, x) {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [x1, y1] = stops[i];
    if (x <= x1) {
      const [x0, y0] = stops[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return stops[stops.length - 1][1];
}

// The editor's default anchor is [0, 0]; treat that as "never positioned".
export function isPlaced(anchor) {
  if (!anchor) return false;
  const [lat, lng] = Array.isArray(anchor) ? anchor : [anchor.lat, anchor.lng];
  return lat !== 0 || lng !== 0;
}

// How much free space a label centered on `anchor` has inside `shape`, in map units: [width, height].
// Each axis is twice the distance from the anchor to the nearest edge along that axis, so a label centered on the
// anchor can't cross the shape's edge along it. Returns [0, 0] if the anchor isn't inside the shape.
// Anchors are [lat, lng] (or {lat, lng}); GeoJSON coordinates are [x = lng, y = lat].
export function computeRoom(shape, anchor) {
  const [y, x] = Array.isArray(anchor) ? anchor : [anchor.lat, anchor.lng];
  const { type, coordinates } = shape.geometry;
  const polygons = type === 'Polygon' ? [coordinates] : type === 'MultiPolygon' ? coordinates : [];

  let left = Infinity, right = Infinity, up = Infinity, down = Infinity;
  let crossingsRight = 0;

  for (const rings of polygons) {          // holes are just more rings, so even-odd handles them
    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[i + 1];

        if ((ay <= y) !== (by <= y)) {     // edge crosses the horizontal line through the anchor
          const cx = ax + ((y - ay) * (bx - ax)) / (by - ay);
          if (cx < x) left = Math.min(left, x - cx);
          else { right = Math.min(right, cx - x); crossingsRight++; }
        }
        if ((ax <= x) !== (bx <= x)) {     // edge crosses the vertical line through the anchor
          const cy = ay + ((x - ax) * (by - ay)) / (bx - ax);
          if (cy < y) down = Math.min(down, y - cy);
          else up = Math.min(up, cy - y);
        }
      }
    }
  }

  if (crossingsRight % 2 === 0) return [0, 0]; // outside the shape
  const room = [2 * Math.min(left, right), 2 * Math.min(up, down)];
  return room.every(Number.isFinite) ? room : [0, 0];
}
