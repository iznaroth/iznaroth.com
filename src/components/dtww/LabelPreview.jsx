// Dev-only page for tuning subentity labels. Mount it on any route you like (it is not linked from the site).
// It uses the same components, data, CSS classes and fonts as the real map, so what you see here is what ships.
// When you like a result, press "Copy style" and paste it over DEFAULT_SUBENTITY_STYLE in subentities.jsx.
import '../../index.css';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, GeoJSON, Pane, useMapEvents } from 'react-leaflet';
import unified from './svg_cutouts_unified.json';
import entityShapes from './entity_shapes.json';
import subentityData from './subentity_shapes.json';
import { cls, PARENT_FONT_CLASS } from './mapUtils';
import {
  DEFAULT_SUBENTITY_STYLE, SUBENTITY_PANE, SubentityOutlines, SubentityLabels,
  labelStatus, labelTextStyle, interpolate, useFontsVersion,
} from './subentities';

const PREVIEW_LANDMASS_PANE = 'preview-landmass';
const SPECIMEN_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28];

const allSubs = subentityData.mapSubentities;
const parentsWithSubs = [...new Set(allSubs.map(s => s.parentEntity))].sort();
const entityByName = new Map(entityShapes.map(e => [e.name, e]));

// A fill drawn at 0.6 alpha over the white landmass, as the site does.
const onWhite = (hex, alpha = 0.6) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(c => Math.round(alpha * c + (1 - alpha) * 255));
  return `rgb(${r}, ${g}, ${b})`;
};

function MapBridge({ onMap, onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => { onMap(map); onZoom(map.getZoom()); }, [map]);
  return null;
}

const Slider = ({ label, value, min, max, step, onChange, suffix = '' }) => (
  <label style={{ display: 'block', margin: '8px 0' }}>
    {label}: <b>{value}{suffix}</b>
    <input type="range" min={min} max={max} step={step} value={value} style={{ width: '100%' }}
      onChange={e => onChange(Number(e.target.value))} />
  </label>
);

const panelInput = { background: '#222', color: '#eee', border: '1px solid #555', padding: '2px 6px' };

const LabelPreview = () => {
  const [style, setStyle] = useState(DEFAULT_SUBENTITY_STYLE);
  const [parent, setParent] = useState(''); // '' = every entity that has subentities
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(0);
  const [sample, setSample] = useState('');
  useFontsVersion();

  const set = patch => setStyle(s => ({ ...s, ...patch }));
  const setStop = (i, j, value) => setStyle(s => ({
    ...s,
    fontStops: s.fontStops.map((stop, k) => (k === i ? stop.map((n, m) => (m === j ? value : n)) : stop)),
  }));

  const subs = useMemo(() => (parent ? allSubs.filter(s => s.parentEntity === parent) : allSubs), [parent]);
  const parents = useMemo(
    () => entityShapes.filter(e => e.aggregatedShape && (parent ? e.name === parent : parentsWithSubs.includes(e.name))),
    [parent],
  );

  useEffect(() => {
    if (!map || !parents.length) return;
    map.fitBounds(L.featureGroup(parents.map(e => L.geoJSON(e.aggregatedShape))).getBounds().pad(0.1));
  }, [map, parents]);

  const rows = subs.map(sub => ({ sub, st: labelStatus(sub, zoom, style) }));
  const shown = rows.filter(r => r.st.show).length;
  const px = interpolate(style.fontStops, zoom);
  const ratio = (a, b) => (a && b ? (a / b).toFixed(2) : '-');

  const copyStyle = () => navigator.clipboard.writeText(`export const DEFAULT_SUBENTITY_STYLE = ${JSON.stringify(style, null, 2)};`);

  return (
    <div style={{ background: '#151515', color: '#ddd', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '12px' }}>Subentity label preview</h1>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* ---- controls ---- */}
        <div style={{ width: '340px', flexShrink: 0 }}>
          <label>Show subentities of{' '}
            <select style={panelInput} value={parent} onChange={e => setParent(e.target.value)}>
              <option value="">(all parents)</option>
              {parentsWithSubs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <Slider label="Zoom" value={zoom} min={-2} max={5} step={0.25} onChange={z => map?.setZoom(z)} />
          <div style={{ margin: '4px 0 8px' }}>Font size at this zoom: <b>{px.toFixed(1)}px</b></div>

          <div style={{ margin: '10px 0 4px' }}>Font size curve, [zoom, px]:</div>
          {style.fontStops.map(([z, p], i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <input style={{ ...panelInput, width: '70px' }} type="number" step="0.25" value={z} onChange={e => setStop(i, 0, Number(e.target.value))} />
              <input style={{ ...panelInput, width: '70px' }} type="number" step="1" value={p} onChange={e => setStop(i, 1, Number(e.target.value))} />
            </div>
          ))}

          <Slider label="Fill (max share of the shape a label may use)" value={style.fill} min={0.1} max={1} step={0.05} onChange={fill => set({ fill })} />
          <Slider label="Wrap width" value={style.wrapEm} min={3} max={16} step={0.5} suffix="em" onChange={wrapEm => set({ wrapEm })} />
          <Slider label="Line height" value={style.lineHeight} min={0.9} max={1.6} step={0.05} onChange={lineHeight => set({ lineHeight })} />
          <Slider label="Label alpha" value={style.labelAlpha} min={0.1} max={1} step={0.05} onChange={labelAlpha => set({ labelAlpha })} />
          <Slider label="Outline alpha" value={style.outlineAlpha} min={0} max={0.6} step={0.025} onChange={outlineAlpha => set({ outlineAlpha })} />
          <Slider label="Outline weight" value={style.outlineWeight} min={1} max={5} step={0.5} suffix="px" onChange={outlineWeight => set({ outlineWeight })} />

          <label style={{ display: 'block', margin: '8px 0' }}>Weight{' '}
            <select style={panelInput} value={style.weight} onChange={e => set({ weight: e.target.value })}>
              {['normal', '500', '600', 'bold'].map(w => <option key={w}>{w}</option>)}
            </select>
          </label>
          <label style={{ display: 'block', margin: '8px 0' }}>
            <input type="checkbox" checked={style.uppercase} onChange={e => set({ uppercase: e.target.checked })} /> ALL CAPS
          </label>

          <button style={{ ...panelInput, padding: '6px 12px', marginRight: '8px' }} onClick={copyStyle}>Copy style</button>
          <button style={{ ...panelInput, padding: '6px 12px' }} onClick={() => setStyle(DEFAULT_SUBENTITY_STYLE)}>Reset</button>
        </div>

        {/* ---- map + readout ---- */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <MapContainer
            center={[1024, 2048]} zoom={0} minZoom={-2}
            zoomSnap={0.25} zoomDelta={0.25} wheelPxPerZoomLevel={120}
            crs={L.CRS.Simple} doubleClickZoom={false} style={{ height: '68vh', background: '#fff' }}
          >
            <MapBridge onMap={setMap} onZoom={setZoom} />
            <Pane name={PREVIEW_LANDMASS_PANE} style={{ zIndex: 399 }}>
              <GeoJSON data={unified} pane={PREVIEW_LANDMASS_PANE} interactive={false}
                style={() => ({ color: '#000000', weight: 2, opacity: 1, fillColor: '#ffffff', fillOpacity: 1 })} />
            </Pane>
            {parents.map(e => (
              <GeoJSON key={e.name} data={e.aggregatedShape} interactive={false}
                style={() => ({ color: e.color, fillColor: e.color, weight: 3, opacity: 1, fillOpacity: 0.6 })} />
            ))}
            <Pane name={SUBENTITY_PANE} style={{ zIndex: 450 }}>
              <SubentityOutlines subs={subs} style={style} />
            </Pane>
            <SubentityLabels subs={subs} zoom={zoom} style={style} />
          </MapContainer>

          <div style={{ margin: '10px 0' }}>
            <b>{shown} of {rows.length}</b> labels shown at zoom {zoom}. Subentity visibility rules (focus / minZoom) are not applied here.
          </div>
          <details>
            <summary style={{ cursor: 'pointer' }}>Hidden labels and why</summary>
            <table style={{ marginTop: '6px', fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                {rows.filter(r => !r.st.show).map(({ sub, st }) => (
                  <tr key={sub.name}>
                    <td style={{ padding: '2px 12px 2px 0' }}>{sub.name}</td>
                    <td style={{ padding: '2px 12px 2px 0' }}>{st.reason}</td>
                    <td style={{ padding: '2px 0', color: '#999' }}>
                      {st.box ? `needs ${ratio(st.box.w, st.avail.w)}x width, ${ratio(st.box.h, st.avail.h)}x height of what's allowed` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>

      {/* ---- specimen ---- */}
      <h2 style={{ fontSize: '18px', margin: '28px 0 8px' }}>Specimen: every superentity font at many sizes</h2>
      <input
        style={{ ...panelInput, width: '420px', marginBottom: '10px' }}
        placeholder="Sample text (blank = a real subentity name for each superentity)"
        value={sample} onChange={e => setSample(e.target.value)}
      />
      {Object.entries(PARENT_FONT_CLASS).map(([superName, fontClass]) => {
        const color = entityShapes.find(e => e.superentityName === superName)?.color;
        const real = allSubs.find(s => entityByName.get(s.parentEntity)?.superentityName === superName)?.name;
        const text = sample || real || 'Sample Name';
        return (
          <div key={superName} style={{ background: color ? onWhite(color) : '#ddd', padding: '10px 14px', marginBottom: '8px' }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#333', marginBottom: '6px' }}>{superName} ({fontClass})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', alignItems: 'flex-end' }}>
              {SPECIMEN_SIZES.map(size => (
                <div key={size} className={cls('map-label', 'subentity', fontClass)} style={{ position: 'static', background: 'none', border: 'none', boxShadow: 'none' }}>
                  <div style={labelTextStyle(style, size)}>{style.uppercase ? text.toUpperCase() : text}</div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '10px', color: '#555' }}>{size}px</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LabelPreview;
