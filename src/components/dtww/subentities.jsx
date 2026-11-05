// Everything subentity-specific that the site (Dornn) and the previewer (LabelPreview) share:
// outlines, labels, the size curve and the fit test. Tune DEFAULT_SUBENTITY_STYLE in LabelPreview, then paste it here.
import { memo, useEffect, useState } from 'react';
import { GeoJSON, Marker, Tooltip } from 'react-leaflet';
import entityShapes from './entity_shapes.json';
import { cls, parentFontClass } from './mapUtils';
import { interpolate, isPlaced, computeRoom } from './labelGeometry';

export { interpolate };

export const SUBENTITY_PANE = 'subentity-outlines'; // over entity fills (overlayPane is 400), under markers (600)

export const DEFAULT_SUBENTITY_STYLE = {
  // ONE font size per zoom for every subentity label: [zoom, px] stops, interpolated, clamped at both ends.
  fontStops: [[0, 12], [1, 14], [2, 16], [3, 18]],
  // A label only shows if its text box uses at most this fraction of its shape's free width AND height
  // (measured through the anchor). Lower = smaller labels relative to their shapes, and they appear at higher zoom.
  fill: 0.5,
  wrapEm: 8,        // lines wrap at this many em, so wrapping is identical at every zoom
  lineHeight: 1.1,
  weight: 'bold',
  uppercase: true,  // false = names as authored; case can also be set per font in CSS
  labelAlpha: 0.3,  // black text at this alpha, so the parent's fill shows through
  outlineAlpha: 0.075,
  outlineWeight: 2,
};

const entityByName = new Map(entityShapes.map(e => [e.name, e]));

const fontClassOf = sub =>
  sub.fontOverride ?? parentFontClass(entityByName.get(sub.parentEntity)?.superentityName ?? 'MIDLAND COUNCIL (XII)');
export const labelClass = sub => cls('map-label', 'subentity', fontClassOf(sub));
export const labelText = (sub, style) => (style.uppercase ? sub.name.toUpperCase() : sub.name);

// Inline style for the label text; also used to measure it, so what we test is what renders.
export const labelTextStyle = (style, px) => ({
  width: 'min-content',
  maxWidth: `min-content`,
  whiteSpace: 'normal',
  textAlign: 'center',
  fontSize: `${px}px`,
  lineHeight: style.lineHeight,
  fontWeight: style.weight,
  color: `rgba(0, 0, 0, ${style.labelAlpha})`,
});

// ----- measuring -----
// A hidden copy of the label at 100px gives the true wrapped size in the real font; it scales linearly with font size.
const measureCache = new Map();
function measure(text, className, style) {
  const key = [className, text, style.wrapEm, style.lineHeight, style.weight].join('|');
  let m = measureCache.get(key);
  if (!m) {
    const outer = document.createElement('div');
    outer.className = className;
    Object.assign(outer.style, { position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden' });
    const inner = document.createElement('div');
    Object.assign(inner.style, labelTextStyle(style, 100));
    inner.textContent = text;
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const rect = inner.getBoundingClientRect();
    document.body.removeChild(outer);
    m = { w: rect.width / 100, h: rect.height / 100 }; // in em
    measureCache.set(key, m);
  }
  return m;
}

// Measurements taken before a web font loads are wrong, so re-measure when fonts finish loading.
export function useFontsVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!document.fonts) return undefined;
    const refresh = () => { measureCache.clear(); setVersion(v => v + 1); };
    document.fonts.ready.then(refresh);
    document.fonts.addEventListener('loadingdone', refresh);
    return () => document.fonts.removeEventListener('loadingdone', refresh);
  }, []);
  return version;
}

// ----- the fit test -----
const roomCache = new WeakMap();
const getRoom = sub => {
  if (!roomCache.has(sub)) {
    roomCache.set(sub, sub.aggregatedShape && isPlaced(sub.labelAnchor) ? computeRoom(sub.aggregatedShape, sub.labelAnchor) : [0, 0]);
  }
  return roomCache.get(sub);
};

// Should this subentity's label show at this zoom? Also returns the numbers behind the answer (for the previewer).
export function labelStatus(sub, zoom, style = DEFAULT_SUBENTITY_STYLE) {
  const px = interpolate(style.fontStops, zoom);
  if (!isPlaced(sub.labelAnchor)) return { show: false, reason: 'no label anchor', px };
  if (!sub.aggregatedShape) return { show: false, reason: 'no shape', px };

  const [roomW, roomH] = getRoom(sub);
  if (!roomW || !roomH) return { show: false, reason: 'anchor outside its shape', px };

  const m = measure(labelText(sub, style), labelClass(sub), style);
  const scale = 2 ** zoom; // CRS.Simple: one map unit is 2^zoom screen pixels
  const box = { w: m.w * px, h: m.h * px };
  const avail = { w: roomW * scale * style.fill, h: roomH * scale * style.fill };
  const show = box.w <= avail.w && box.h <= avail.h;
  return { show, reason: show ? 'fits' : box.w > avail.w ? 'too wide' : 'too tall', px, box, avail };
}

// ----- map layers -----

// Inner outlines. Not interactive, so clicks fall through to the entity underneath.
export const SubentityOutlines = memo(function SubentityOutlines({ subs, style = DEFAULT_SUBENTITY_STYLE }) {
  const pathStyle = { color: '#000000', weight: style.outlineWeight, opacity: style.outlineAlpha, fill: false };
  return (
    <>
      {subs.map(sub => sub.aggregatedShape && (
        <GeoJSON key={sub.name} data={sub.aggregatedShape} pane={SUBENTITY_PANE} interactive={false} style={() => pathStyle} />
      ))}
    </>
  );
});

function SubLabel({ sub, px, style }) {
  return (
    <Marker position={sub.labelAnchor} interactive={false}>
      <Tooltip permanent direction="center" className={labelClass(sub)} opacity={1} offset={[-15, 28]}>
        <div style={labelTextStyle(style, px)}>{labelText(sub, style)}</div>
      </Tooltip>
    </Marker>
  );
}

// Labels for the given subentities at `zoom`; those that don't fit their shape (proportionally) are left out.
export const SubentityLabels = memo(function SubentityLabels({ subs, zoom, style = DEFAULT_SUBENTITY_STYLE }) {
  useFontsVersion();
  return (
    <>
      {subs.map(sub => {
        const status = labelStatus(sub, zoom, style);
        return status.show ? <SubLabel key={sub.name} sub={sub} px={status.px} style={style} /> : null;
      })}
    </>
  );
});
