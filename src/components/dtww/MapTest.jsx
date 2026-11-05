import '../../index.css';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.pattern';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
import geojsonRbush from 'geojson-rbush';
import { useState, useEffect, useRef, useReducer } from 'react';
import { MapContainer, ImageOverlay, LayerGroup, LayersControl, GeoJSON, FeatureGroup, Marker, useMap, useMapEvents } from 'react-leaflet';
import { downloadJSON } from './downloadJSON';
import { MARKER_TYPES, DEFAULT_MARKER_TYPE, isMajor, markerIconUrl } from './markerTypes';
import { releaseCell as releaseOwned, paintCell } from './paintRules';
import unified from './svg_cutouts_unified.json';
import paintlayer from './paint_layer_full_edited.json'; // all cells + indivisible landmasses
import mapEntities from './map_entities.json';
import superentityEntries from './map_superentities.json';
import subentityCollection from './map_subentities.json';
import preloadedPaintState from './paint_state_sub_3.json';
import { entityLabelCounts, entityLabelSizes, territoryIcons } from './MapTestroomConstants.jsx';

// ---------------------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------------------

const screenBounds = [[0, 0], [2045, 4271]];
const screenBoundsWiggle = [[-500, -500], [2545, 4771]];

const PIXI_SCALE = 64; // geometry is drawn in this multiple of map units
const STRIPES = { opacity: 0.9, spaceOpacity: 0.4, angle: 45, width: 32, height: 32, weight: 16, spaceWeight: 16 };
const LANDMASS_STYLE = { color: '#000000', weight: 2, opacity: 1, fillColor: '#ffffff', fillOpacity: 1.0 };

const ICON_OPTIONS = {
  iconSize: [25, 25], shadowSize: [25, 25],
  iconAnchor: [12, 12], shadowAnchor: [12, 12], popupAnchor: [12, 12],
};

// Runs once at import. (It used to run in a parent effect, i.e. after the markers it was meant to affect.)
L.Icon.Default.imagePath = '';
L.Icon.Default.mergeOptions({ iconUrl: '../../blank_marker.png', shadowUrl: '../../blank_marker.png', ...ICON_OPTIONS });

// <<< PASTE YOUR ORIGINAL SWITCH HERE (the names were removed from the version you shared) >>>
function getParentFontClass(parent) {
  switch (parent) {
    default: return '';
  }
}

// ---------------------------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------------------------

const cls = (...parts) => parts.filter(Boolean).join(' ');
const sizeClass = (prefix, size) => (['small', 'medium', 'large'].includes(size) ? `${prefix}-${size}` : '');
const hexToInt = hex => (hex ? parseInt(hex.replace('#', ''), 16) : 0xff0000);

function quickHash(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = ((hash << 5) - hash) + string.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return hash;
}
// Identity of a painted cell. Kept identical to before so saved paint states keep matching.
// (32-bit hashes can collide across ~70k cells; if you ever see a cell "stick" to the wrong owner, swap this one function.)
const cellKey = shape => quickHash(JSON.stringify(shape));

// Same output as the old L.latLng/crs.project dance under CRS.Simple: x = c[0], y = -c[1], scaled.
function drawShape(graphics, { type, coordinates }) {
  const polygons = type === 'Polygon' ? [coordinates] : type === 'MultiPolygon' ? coordinates : [];
  polygons.forEach(rings => rings.forEach(ring =>
    graphics.drawPolygon(ring.flatMap(([x, y]) => [x * PIXI_SCALE, -y * PIXI_SCALE]))
  ));
}

function drawEntries(graphics, entries) {
  graphics.clear();
  entries.forEach(entry => {
    const color = hexToInt(entry.color);
    graphics.lineStyle(8, color);
    graphics.beginFill(color, 0.5);
    entry.territories.forEach(shape => drawShape(graphics, shape.geometry));
    graphics.endFill();
  });
}

// Union of shapes with `properties` stamped on. Never mutates the input cells
// (the old single-cell branch stamped properties onto the painted cell itself, which changed its hash).
function aggregateShape(shapes, properties) {
  if (!shapes.length) return null;
  const merged = shapes.length === 1 ? { ...shapes[0] } : turf.union(turf.featureCollection(shapes));
  if (!merged) return null;
  merged.properties = { ...merged.properties, ...properties };
  return merged;
}

const territoryIcon = name => L.icon({
  iconUrl: '../..' + territoryIcons.get(name),
  shadowUrl: '../..' + territoryIcons.get(name),
  ...ICON_OPTIONS,
});

const labelHtml = (color, text) =>
  `<div style="white-space: normal; text-align: center;"><span style="color: ${color}; font-weight: bold;">${text}</span></div>`;

// ---------------------------------------------------------------------------------------------
// Data store (built once, before first render)
// ---------------------------------------------------------------------------------------------

// Turns saved entries (territories as an array) into live entries (territories as a Map keyed by cellKey)
// and records who owns each cell. Does not mutate the imported JSON.
function indexTerritories(entries, owners) {
  return new Map(entries.map(entry => {
    const territories = new Map();
    (entry.territories ?? []).forEach(shape => {
      const key = cellKey(shape);
      territories.set(key, shape);
      owners.set(key, entry.name);
    });
    return [entry.name, { ...entry, territories }];
  }));
}

// Brings subentities defined in map_subentities.json into the store without touching painted ones,
// links them to their parent, and applies the painting color.
function syncSubentities(store) {
  (subentityCollection?.mapSubentities ?? []).forEach(def => {
    if (!store.subentityEntries.has(def.name)) {
      store.subentityEntries.set(def.name, { ...def, territories: new Map() });
    }
  });
  store.subentityEntries.forEach(sub => {
    sub.color = sub.paintingColor ?? sub.color;
    const parent = store.entityEntries.get(sub.parentEntity);
    if (parent && !parent.subentities.includes(sub.name)) parent.subentities.push(sub.name);
  });
}

const editorMarkerIcons = new Map();
function editorMarkerIcon(marker) {
  const url = markerIconUrl(marker);
  if (!editorMarkerIcons.has(url)) {
    editorMarkerIcons.set(url, L.icon({ iconUrl: url, iconSize: [28, 28], iconAnchor: [14, 14] }));
  }
  return editorMarkerIcons.get(url);
}

// Regions are defined in this tool (there is no CMS list to seed them from), so every field gets a default.
const REGION_DEFAULTS = { color: '#6b8e5a', labelColor: '#1a1a1a', labelSize: 'medium' };
function normalizeRegion(region) {
  Object.entries(REGION_DEFAULTS).forEach(([key, value]) => { region[key] ??= value; });
  region.labelAnchors = region.labelAnchors?.length ? region.labelAnchors : [[0, 0]];
  return region;
}

function createStore() {
  const store = {
    tree: geojsonRbush(), // spatial index of every paintable cell
    entityEntries: new Map(),
    subentityEntries: new Map(),
    entityCollisionMap: new Map(),    // cellKey -> owning entity name
    subentityCollisionMap: new Map(), // cellKey -> owning subentity name
    regionEntries: new Map(),         // geographic regions: painted separately from political ownership
    regionCollisionMap: new Map(),    // cellKey -> owning region name
    markers: (preloadedPaintState?.markers ?? []).map(m => ({ ...m })), // cities & landmarks
  };
  store.tree.load(paintlayer);

  if (preloadedPaintState) {
    store.entityEntries = indexTerritories(preloadedPaintState.entities, store.entityCollisionMap);
    store.subentityEntries = indexTerritories(preloadedPaintState.subentities ?? [], store.subentityCollisionMap);
    store.regionEntries = indexTerritories(preloadedPaintState.regions ?? [], store.regionCollisionMap);
  } else {
    mapEntities.data.settlementInfos.forEach(entity => {
      store.entityEntries.set(entity.name, {
        name: entity.name,
        color: entity.nameColor.hex,
        labelColor: entity.labelColor.hex,
        subentities: [],
        territories: new Map(),
        superentityName: entity.mapSuperentity.name,
        aggregatedShape: null,
      });
    });
  }

  store.entityEntries.forEach(entry => {
    entry.subentities = [...(entry.subentities ?? [])];
    // Fill in label anchors/sizes that are missing (never overwrites ones you've set).
    const anchors = entry.labelAnchors ?? [];
    while (anchors.length < (entityLabelCounts.get(entry.name) ?? 1)) anchors.push([0, 0]);
    entry.labelAnchors = anchors;
    entry.labelSize ??= entityLabelSizes.get(entry.name);
  });

  store.regionEntries.forEach(normalizeRegion);
  syncSubentities(store);
  return store;
}

// ---------------------------------------------------------------------------------------------
// Map components (module level so they keep their identity between renders)
// ---------------------------------------------------------------------------------------------

// Draws the paintable entries on a Pixi canvas. Geometry is rebuilt only when `pixi.current.dirty` is set,
// not on every zoom/pan callback.
function PixiPaintLayer({ layersRef, pixi, getEntries }) {
  const map = useMap();

  useEffect(() => {
    const graphics = new PIXI.Graphics();
    pixi.current.dirty = true;

    const overlay = L.pixiOverlay(utils => {
      const container = utils.getContainer();
      if (pixi.current.dirty) {
        drawEntries(graphics, getEntries());
        pixi.current.dirty = false;
      }
      container.addChild(graphics);
      utils.getRenderer().render(container);
    }, new PIXI.Container());

    pixi.current.overlay = overlay;
    overlay.addTo(map);
    layersRef.current?.addOverlay(overlay, 'entity');

    return () => {
      map.removeLayer(overlay);
      layersRef.current?.removeLayer(overlay);
      graphics.destroy({ children: true, texture: true, baseTexture: true });
    };
  }, [map]);

  return null;
}

function PaintEvents({ onDown, onMove }) {
  useMapEvents({ mousedown: onDown, mousemove: onMove });
  return null;
}

// Renders each item's aggregated shape as a GeoJSON layer. react-leaflet ignores `data` changes,
// so `version` is part of the key to rebuild layers after aggregates are recomputed.
function ShapeLayer({ items, version, striped }) {
  const map = useMap();

  const onEachFeature = (feature, layer) => {
    if (!striped?.(feature)) return;
    const color = feature.properties.color;
    const stripes = new L.StripePattern({ ...STRIPES, color, spaceColor: color });
    stripes.addTo(map);
    layer.setStyle({ fillPattern: stripes });
  };

  return (
    <FeatureGroup>
      {items.map(({ key, shape, style }) => shape && (
        <GeoJSON key={`${key}:${version}`} data={shape} className="mapclass" style={() => style} onEachFeature={onEachFeature} />
      ))}
    </FeatureGroup>
  );
}

// Keeps one draggable label marker per item returned by build(). Markers whose item disappeared are removed, and
// markers whose text/color/class changed are rebuilt (at the item's current anchor), so renaming, recoloring,
// adding or deleting labels all show up. item: { key, anchor, text, color, className, icon?, onMove(latlng) }
function LabelMarkers({ groupRef, build, version }) {
  const placed = useRef(new Map()); // key -> { marker, signature }

  useEffect(() => {
    const labels = build();
    const keys = new Set(labels.map(label => label.key));

    placed.current.forEach(({ marker }, key) => {
      if (!keys.has(key)) { marker.remove(); placed.current.delete(key); }
    });

    labels.forEach(label => {
      const signature = [label.text, label.color, label.className].join('|');
      const existing = placed.current.get(label.key);
      if (existing?.signature === signature) return;
      existing?.marker.remove();

      const marker = L.marker(label.anchor ?? [0, 0], { draggable: true, ...(label.icon && { icon: label.icon }) });
      marker.addTo(groupRef.current);
      if (!label.icon) {
        marker.bindTooltip(labelHtml(label.color, label.text), {
          permanent: true, direction: 'center', className: label.className, opacity: 1, offset: [-15, 28],
        });
      }
      marker.on('dragend', e => label.onMove(e.target.getLatLng()));
      placed.current.set(label.key, { marker, signature });
    });
  }, [version]);

  return null;
}

// ---------------------------------------------------------------------------------------------
// The tool
// ---------------------------------------------------------------------------------------------

const ROW = { margin: '2px 0', padding: '6px', border: '1px solid #585858', backgroundColor: 'black' };
const SUBROW = { margin: '2px 0', padding: '6px', border: '1px solid #2c2c2c', borderRadius: '8px', backgroundColor: 'black' };

const MARKER_FIELD = { display: 'block', width: '100%', background: '#111', color: '#eee', border: '1px solid #555', padding: '4px 8px', margin: '2px 0 10px' };

const MapTest = () => {
  const [store] = useState(createStore);
  const { tree, markers, entityEntries, subentityEntries, entityCollisionMap, subentityCollisionMap, regionEntries, regionCollisionMap } = store;
  const superentities = superentityEntries.data.mapSuperentities;

  const layersRef = useRef(null);
  const entityGroup = useRef(null);
  const subentityGroup = useRef(null);
  const superentityGroup = useRef(null);
  const regionGroup = useRef(null);

  const pixi = useRef({ overlay: null, dirty: true });
  const paintSettings = useRef({ mode: 'entity', selectedPaintableEntity: null }); // mode: 'entity' | 'subentity' | 'region'
  const drawing = useRef(false);
  const lastCell = useRef(null);
  const erasing = useRef(false);
  const labeling = useRef(false);
  const markerMode = useRef(false);
  const dirtyEntities = useRef(new Set());
  const dirtySubentities = useRef(new Set());
  const dirtyRegions = useRef(new Set());

  const [shapeVersion, setShapeVersion] = useState(0); // bumps when aggregate shapes are rebuilt
  const [, refresh] = useReducer(n => n + 1, 0);       // plain re-render (selection changes)
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [regionsVersion, setRegionsVersion] = useState(0);     // bumps when regions or their labels are edited
  const [newRegion, setNewRegion] = useState({ name: '', color: '#6b8e5a' });

  const selected = paintSettings.current.selectedPaintableEntity;
  const selectedMarker = markers.find(m => m.id === selectedMarkerId);
  const subsOf = name => [...subentityEntries.values()].filter(sub => sub.parentEntity === name);

  // ----- painting -----

  function redrawPaint() {
    pixi.current.dirty = true;
    pixi.current.overlay?.redraw();
  }

  // Entity mode shows every entity; subentity mode shows only the selected parent and its subentities;
  // region mode shows only the regions (a separate flow, so no political cells are drawn).
  function getEntries() {
    const { mode, selectedPaintableEntity: sel } = paintSettings.current;
    if (mode === 'region') return [...regionEntries.values()];
    if (mode === 'subentity' && sel) {
      const parent = entityEntries.get(sel.parentEntity);
      return [parent, ...subsOf(sel.parentEntity)].filter(Boolean);
    }
    return [...entityEntries.values()];
  }

  function select(mode, entry) {
    paintSettings.current = { mode, selectedPaintableEntity: entry };
    redrawPaint();
    refresh();
  }

  // Ownership per level (see paintRules.js for the rules, which are unit-tested).
  const levels = {
    entity:    { owners: entityCollisionMap,    entries: entityEntries,    dirty: dirtyEntities.current },
    subentity: { owners: subentityCollisionMap, entries: subentityEntries, dirty: dirtySubentities.current },
    region:    { owners: regionCollisionMap,    entries: regionEntries,    dirty: dirtyRegions.current },
  };
  const releaseCell = (level, hash) => releaseOwned(levels, level, hash);

  function tryPaint(cell) {
    const { mode, selectedPaintableEntity: target } = paintSettings.current;
    if (target) paintCell(levels, mode, target, cellKey(cell), cell, erasing.current);
  }

  function cellAt(latlng) {
    const pt = turf.point([latlng.lng, latlng.lat]);
    const hits = tree.search(pt).features.filter(f => turf.booleanPointInPolygon(pt, f));
    return hits[hits.length - 1];
  }

  function paintAt(latlng) {
    const cell = cellAt(latlng);
    if (cell && cell !== lastCell.current) {
      lastCell.current = cell;
      tryPaint(cell);
    }
  }

  // ----- markers (cities & landmarks) -----
  // A marker belongs to whichever entity owns the cell it sits on ('' = none). The site only shows a marker
  // while its parent entity is focused.
  const ownerAt = latlng => {
    const cell = cellAt(latlng);
    return cell ? entityCollisionMap.get(cellKey(cell)) ?? '' : '';
  };

  function addMarkerAt(latlng) {
    const marker = {
      id: `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: 'New marker',
      type: DEFAULT_MARKER_TYPE,
      position: [latlng.lat, latlng.lng],
      parentEntity: ownerAt(latlng),
      blurb: '',   // short text for the popover (minor types)
      content: '', // long passage for the info panel (major types)
    };
    markers.push(marker);
    setSelectedMarkerId(marker.id);
    refresh();
  }

  function moveMarker(marker, latlng) {
    marker.position = [latlng.lat, latlng.lng];
    marker.parentEntity = ownerAt(latlng);
    refresh();
  }

  const updateMarker = (marker, patch) => { Object.assign(marker, patch); refresh(); };

  function deleteMarker(marker) {
    markers.splice(markers.indexOf(marker), 1);
    setSelectedMarkerId(null);
    refresh();
  }

  // ----- regions (geographic; painted independently of political ownership) -----
  const bumpRegions = () => setRegionsVersion(v => v + 1);

  function addRegion() {
    const name = newRegion.name.trim();
    if (!name || regionEntries.has(name)) return;
    const region = normalizeRegion({ name, color: newRegion.color, territories: new Map() });
    regionEntries.set(name, region);
    setNewRegion(r => ({ ...r, name: '' }));
    select('region', region);
    bumpRegions();
  }

  // color / labelColor / labelSize. The merged shape carries the color, so it needs a rebuild.
  function updateRegion(region, patch) {
    Object.assign(region, patch);
    dirtyRegions.current.add(region.name);
    redrawPaint();
    bumpRegions();
  }

  // Cells are owned by name, so a rename also re-points every cell it owns. Returns false if the name is unusable.
  function renameRegion(region, input) {
    const name = input.trim();
    if (!name || name === region.name || regionEntries.has(name)) return false;
    regionCollisionMap.forEach((owner, hash) => { if (owner === region.name) regionCollisionMap.set(hash, name); });
    regionEntries.delete(region.name);
    region.name = name;
    regionEntries.set(name, region);
    dirtyRegions.current.add(name);
    bumpRegions();
    return true;
  }

  function deleteRegion(region) {
    [...region.territories.keys()].forEach(hash => releaseCell('region', hash));
    regionEntries.delete(region.name);
    if (selected === region) select('entity', null);
    redrawPaint();
    bumpRegions();
  }

  const addRegionLabel = region => { region.labelAnchors.push([0, 0]); bumpRegions(); };
  const removeRegionLabel = region => { if (region.labelAnchors.length > 1) { region.labelAnchors.pop(); bumpRegions(); } };

  const onDown = e => {
    if (markerMode.current) {
      if (!(e.originalEvent?.detail > 1)) addMarkerAt(e.latlng); // ignore the second click of a double-click
      return;
    }
    drawing.current = true;
    lastCell.current = null;
    if (!labeling.current) paintAt(e.latlng);
  };
  const onMove = e => {
    if (drawing.current && !labeling.current) paintAt(e.latlng);
  };

  useEffect(() => {
    const onUp = () => {
      if (!drawing.current) return;
      drawing.current = false;
      redrawPaint();
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  // ----- aggregates -----

  // Rebuilds merged shapes for anything painted since the last rebuild (or everything with all = true).
  // Superentities are rebuilt when any of their entities were.
  function rebuildAggregates(all = false) {
    const rebuiltEntities = new Set();

    entityEntries.forEach(entity => {
      if (!all && !dirtyEntities.current.has(entity.name) && entity.aggregatedShape !== undefined) return;
      entity.aggregatedShape = aggregateShape([...entity.territories.values()], {
        color: entity.color, name: entity.name, superentityName: entity.superentityName,
      });
      rebuiltEntities.add(entity.name);
    });

    subentityEntries.forEach(sub => {
      if (!all && !dirtySubentities.current.has(sub.name) && sub.aggregatedShape !== undefined) return;
      sub.aggregatedShape = aggregateShape([...sub.territories.values()], {
        color: entityEntries.get(sub.parentEntity)?.color, name: sub.name, parentName: sub.parentEntity,
      });
    });

    superentities.forEach(superentity => {
      const members = superentity.mapEntity ?? [];
      if (!all && superentity.aggregatedShape !== undefined && !members.some(m => rebuiltEntities.has(m.name))) return;
      const shapes = members.map(m => entityEntries.get(m.name)?.aggregatedShape).filter(Boolean);
      superentity.aggregatedShape = aggregateShape(shapes, { name: superentity.name, color: superentity.color.hex });
    });

    regionEntries.forEach(region => {
      if (!all && !dirtyRegions.current.has(region.name) && region.aggregatedShape !== undefined) return;
      region.aggregatedShape = aggregateShape([...region.territories.values()], { color: region.color, name: region.name });
    });

    dirtyEntities.current.clear();
    dirtySubentities.current.clear();
    dirtyRegions.current.clear();
    setShapeVersion(v => v + 1);
  }

  // ----- export -----

  const flatten = entries => [...entries.values()].map(entry => ({ ...entry, territories: [...entry.territories.values()] }));

  const saveEntities = () => { rebuildAggregates(); downloadJSON([...entityEntries.values()], 'entity_shapes.json'); };

  // { mapSubentities: [...] } sorted by parent then name, same wrapper as map_subentities.json.
  // Pass a parent entity name to export just that entity's subentities.
  function saveSubentities(parentName) {
    rebuildAggregates();
    const mapSubentities = [...subentityEntries.values()]
      .filter(sub => !parentName || sub.parentEntity === parentName)
      .sort((a, b) => a.parentEntity.localeCompare(b.parentEntity) || a.name.localeCompare(b.name))
      .map(({ territories, ...sub }) => sub); // painted cells live in paint_state.json
    downloadJSON({ mapSubentities }, parentName ? `subentities_${parentName}.json` : 'subentity_shapes.json');
  }

  const selectedParent = selected && (paintSettings.current.mode === 'subentity' ? selected.parentEntity : selected.name);

  // One entry per region: color, label settings and merged shape. Painted cells live in paint_state.json.
  const saveRegions = () => {
    rebuildAggregates();
    downloadJSON([...regionEntries.values()].map(({ territories, ...region }) => region), 'region_shapes.json');
  };

  const saveMarkers = () => downloadJSON({
    markers: [...markers].sort((a, b) => a.parentEntity.localeCompare(b.parentEntity) || a.name.localeCompare(b.name)),
  }, 'marker_data.json');

  const exportButtons = [
    ['REBUILD SHAPES (shift = all)', e => rebuildAggregates(e.shiftKey)],
    ['SAVE ENTITIES FOR MAIN PAGE', saveEntities],
    ['SAVE ALL SUBENTITIES FOR MAIN PAGE', () => saveSubentities()],
    selectedParent && [`SAVE SUBENTITIES OF ${selectedParent.toUpperCase()}`, () => saveSubentities(selectedParent)],
    ['SAVE SUPERS FOR MAIN PAGE', () => { rebuildAggregates(); downloadJSON(superentities, 'superentity_shapes.json'); }],
    ['SAVE MERGED SUPER', () => { rebuildAggregates(); downloadJSON(superentityEntries, 'map_superentities.json'); }],
    ['SAVE REGIONS FOR MAIN PAGE', saveRegions],
    ['SAVE MARKERS FOR MAIN PAGE', saveMarkers],
    ['SAVE PAINT STATE', () => downloadJSON({ entities: flatten(entityEntries), subentities: flatten(subentityEntries), regions: flatten(regionEntries), markers }, 'paint_state.json')],
  ].filter(Boolean);

  // ----- layer inputs -----

  const entityItems = [...entityEntries.values()].map(e => ({
    key: e.name, shape: e.aggregatedShape,
    style: { color: e.color, weight: 3, opacity: 1, fillColor: e.color, fillOpacity: 0.6 },
  }));
  const subentityItems = [...subentityEntries.values()].map(s => {
    const color = s.aggregatedShape?.properties.color;
    return { key: s.name, shape: s.aggregatedShape, style: { color, weight: 3, opacity: 0.7, fillColor: color, fillOpacity: 0.0 } };
  });
  const superentityItems = superentities.map(s => ({
    key: s.name, shape: s.aggregatedShape,
    style: { color: s.color.hex, weight: 3, opacity: 1, fillColor: s.color.hex, fillOpacity: 0.6 },
  }));

  const entityLabels = () => [...entityEntries.values()].flatMap(entity => {
    const icon = entity.superentityName === 'THE FRONTIER' ? territoryIcon(entity.name) : null;
    return entity.labelAnchors.map((anchor, idx) => ({
      key: `${entity.name}:${idx}`, anchor, icon,
      text: entity.name, color: entity.labelColor,
      className: cls('map-label', sizeClass('label-width', entity.labelSize), sizeClass('map-label', entity.labelSize), getParentFontClass(entity.superentityName)),
      onMove: pos => { entity.labelAnchors[idx] = pos; },
    }));
  });

  const subentityLabels = () => [...subentityEntries.values()].map(sub => {
    sub.labelAnchor ??= [0, 0];
    return {
      key: sub.name, anchor: sub.labelAnchor,
      text: sub.name.toUpperCase(), color: entityEntries.get(sub.parentEntity)?.color,
      className: 'map-label subentity',
      onMove: pos => { sub.labelAnchor = pos; },
    };
  });

  const superentityLabels = () => superentities.map(superentity => {
    superentity.labelAnchor ??= [0, 0];
    return {
      key: superentity.name, anchor: superentity.labelAnchor,
      text: superentity.name, color: superentity.nameColor.hex,
      className: cls('map-label', 'superentity-label', sizeClass('map-label', superentity.labelSize), getParentFontClass(superentity.name)),
      onMove: pos => { superentity.labelAnchor = pos; },
    };
  });

  // Regions preview as a soft tint; how the site styles them is a separate decision.
  const regionItems = [...regionEntries.values()].map(r => ({
    key: r.name, shape: r.aggregatedShape,
    style: { color: r.color, weight: 2, opacity: 0.8, fillColor: r.color, fillOpacity: 0.35 },
  }));

  const regionLabels = () => [...regionEntries.values()].flatMap(region =>
    region.labelAnchors.map((anchor, idx) => ({
      key: `${region.name}:${idx}`, anchor,
      text: region.name, color: region.labelColor,
      className: cls('map-label', 'region-label', sizeClass('label-width', region.labelSize), sizeClass('map-label', region.labelSize)),
      onMove: pos => { region.labelAnchors[idx] = pos; },
    })));

  return (
    <div id="content-main">
      <img className="m-auto w-full sm:w-1/2 pt-5" src="../../world_banner.png" alt="" />

      <div className="mapcontent relative">
        <div id="map">
          <MapContainer
            center={[1024, 2048]} zoom={-2} minZoom={-2}
            dragging={false} keyboardPanDelta={200} zoomControl
            crs={L.CRS.Simple} maxBounds={screenBoundsWiggle} maxBoundsViscosity={0.9}
            tap={false} doubleClickZoom={false}
          >
            <GeoJSON data={unified} style={() => LANDMASS_STYLE} />
            <PixiPaintLayer layersRef={layersRef} pixi={pixi} getEntries={getEntries} />
            <PaintEvents onDown={onDown} onMove={onMove} />

            <LayersControl ref={layersRef} position="topright">
              <LayersControl.Overlay name="subentities layer">
                <LayerGroup ref={subentityGroup}>
                  <ShapeLayer items={subentityItems} version={shapeVersion} />
                  <LabelMarkers groupRef={subentityGroup} build={subentityLabels} version={shapeVersion} />
                </LayerGroup>
              </LayersControl.Overlay>
              <LayersControl.Overlay name="entities layer">
                <LayerGroup ref={entityGroup}>
                  <ShapeLayer items={entityItems} version={shapeVersion} striped={f => f.properties.superentityName === 'ESOTERICS'} />
                  <LabelMarkers groupRef={entityGroup} build={entityLabels} version={shapeVersion} />
                </LayerGroup>
              </LayersControl.Overlay>
              <LayersControl.Overlay name="superentities layer">
                <LayerGroup ref={superentityGroup}>
                  <ShapeLayer items={superentityItems} version={shapeVersion} striped={f => f.properties.name === 'ESOTERICS'} />
                  <LabelMarkers groupRef={superentityGroup} build={superentityLabels} version={shapeVersion} />
                </LayerGroup>
              </LayersControl.Overlay>
              <LayersControl.Overlay name="regions layer">
                <LayerGroup ref={regionGroup}>
                  <ShapeLayer items={regionItems} version={shapeVersion} />
                  <LabelMarkers groupRef={regionGroup} build={regionLabels} version={shapeVersion + regionsVersion} />
                </LayerGroup>
              </LayersControl.Overlay>
              <LayersControl.Overlay name="maptest">
                <ImageOverlay url="../../test_standard.png" bounds={screenBounds} opacity={0.4} />
              </LayersControl.Overlay>
            </LayersControl>

            {markers.map(marker => (
              <Marker
                key={marker.id}
                position={marker.position}
                draggable
                icon={editorMarkerIcon(marker)}
                title={marker.name}
                opacity={marker.id === selectedMarkerId ? 1 : 0.65}
                eventHandlers={{
                  click: () => setSelectedMarkerId(marker.id),
                  dragend: e => moveMarker(marker, e.target.getLatLng()),
                }}
              />
            ))}
          </MapContainer>
        </div>
      </div>

      <div style={{ padding: '0 0 24px' }}>
        <div style={{ width: 'fit-content', margin: 'auto', paddingBottom: '24px' }}>
          <p style={{ color: 'white', fontSize: '32px', paddingBottom: '12px' }}>SELECT ENTITY TO PAINT</p>
          <div>
            MODE: {paintSettings.current.mode} | SELECTED: {selected?.name}
            <input style={{ marginLeft: '16px' }} type="checkbox" id="erase" onChange={e => { erasing.current = e.target.checked; }} />
            <label htmlFor="erase">ERASE MODE</label>
            <input style={{ marginLeft: '16px' }} type="checkbox" id="labelMode" onChange={e => { labeling.current = e.target.checked; }} />
            <label htmlFor="labelMode">LABEL POSITION MODE</label>
            <input style={{ marginLeft: '16px' }} type="checkbox" id="markerMode" onChange={e => { markerMode.current = e.target.checked; }} />
            <label htmlFor="markerMode">MARKER MODE (click the map to add one)</label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px', maxWidth: '900px' }}>
            {exportButtons.map(([label, onClick]) => (
              <button key={label} onClick={onClick} style={{ border: '2px solid white', padding: '6px 10px' }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ width: '85%', margin: '0 auto 32px' }}>
          <p style={{ color: 'white', fontSize: '24px', marginBottom: '4px' }}>REGIONS ({regionEntries.size})</p>
          <p style={{ color: '#999', marginBottom: '8px', maxWidth: '760px' }}>
            Geographic regions are a separate painting flow. They can cross entity borders, a cell belongs to at most one region,
            and painting them never changes political ownership. Select a region to paint it; ERASE MODE removes cells.
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <input
              style={{ ...MARKER_FIELD, width: '260px', margin: 0 }} placeholder="New region name"
              value={newRegion.name} onChange={e => setNewRegion(r => ({ ...r, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') addRegion(); }}
            />
            <input type="color" value={newRegion.color} onChange={e => setNewRegion(r => ({ ...r, color: e.target.value }))} />
            <button style={{ border: '2px solid white', padding: '4px 10px' }} onClick={addRegion}>ADD REGION</button>
          </div>

          <ul style={{ listStyleType: 'none', maxHeight: '220px', overflowY: 'auto' }}>
            {[...regionEntries.values()].map(r => (
              <li
                key={r.name}
                onClick={() => select('region', r)}
                style={{ ...SUBROW, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', borderColor: selected === r ? 'white' : '#2c2c2c' }}
              >
                <div className="circle" style={{ backgroundColor: r.color }} />
                {r.name} <span style={{ color: '#999' }}>({r.territories.size} cells)</span>
              </li>
            ))}
          </ul>

          {paintSettings.current.mode === 'region' && selected && (
            <div style={{ border: '1px solid #585858', padding: '12px', marginTop: '8px', maxWidth: '640px' }}>
              <label>Name (press Enter or click away to apply)
                <input
                  key={selected.name} style={MARKER_FIELD} defaultValue={selected.name}
                  onBlur={e => { if (!renameRegion(selected, e.target.value)) e.target.value = selected.name; }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                />
              </label>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '10px', alignItems: 'center' }}>
                <label>Fill color <input type="color" value={selected.color} onChange={e => updateRegion(selected, { color: e.target.value })} /></label>
                <label>Label color <input type="color" value={selected.labelColor} onChange={e => updateRegion(selected, { labelColor: e.target.value })} /></label>
                <label>Label size{' '}
                  <select style={{ ...MARKER_FIELD, display: 'inline-block', width: 'auto', margin: 0 }} value={selected.labelSize} onChange={e => updateRegion(selected, { labelSize: e.target.value })}>
                    {['small', 'medium', 'large'].map(size => <option key={size}>{size}</option>)}
                  </select>
                </label>
              </div>
              <p style={{ marginBottom: '8px' }}>
                Labels: {selected.labelAnchors.length}{' '}
                <button style={{ border: '1px solid white', padding: '2px 8px', margin: '0 4px' }} onClick={() => addRegionLabel(selected)}>ADD LABEL</button>
                <button style={{ border: '1px solid white', padding: '2px 8px' }} onClick={() => removeRegionLabel(selected)}>REMOVE LAST</button>
                <span style={{ color: '#999' }}> New labels start at the map origin: turn on the regions layer and drag them into place (LABEL POSITION MODE stops painting while you do).</span>
              </p>
              <p style={{ color: '#999', marginBottom: '8px' }}>{selected.territories.size} cells painted</p>
              <button style={{ border: '2px solid #e66', padding: '4px 10px' }} onClick={() => deleteRegion(selected)}>DELETE REGION</button>
            </div>
          )}
        </div>

        <div style={{ width: '85%', margin: '0 auto 32px' }}>
          <p style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>MARKERS ({markers.length})</p>
          <ul style={{ listStyleType: 'none', maxHeight: '180px', overflowY: 'auto' }}>
            {markers.map(m => (
              <li
                key={m.id}
                onClick={() => setSelectedMarkerId(m.id)}
                style={{ ...SUBROW, cursor: 'pointer', borderColor: m.id === selectedMarkerId ? 'white' : '#2c2c2c' }}
              >
                {m.name}{' '}
                <span style={{ color: m.parentEntity ? '#999' : '#e66' }}>
                  ({MARKER_TYPES[m.type]?.label ?? m.type}, {m.parentEntity ? `in ${m.parentEntity}` : 'NOT INSIDE ANY ENTITY: the site will never show it'})
                </span>
              </li>
            ))}
          </ul>

          {selectedMarker && (
            <div style={{ border: '1px solid #585858', padding: '12px', marginTop: '8px', maxWidth: '640px' }}>
              <p style={{ color: '#999', marginBottom: '10px' }}>
                The site takes a marker's text from the CMS entry with exactly this name. The blurb and passage below (HTML or plain text) are only the fallback when there is none.
              </p>
              <label>Name
                <input style={MARKER_FIELD} value={selectedMarker.name} onChange={e => updateMarker(selectedMarker, { name: e.target.value })} />
              </label>
              <label>Type {isMajor(selectedMarker) ? '(major: clicking focuses it and shows the long passage)' : '(minor: clicking opens a popover with the short blurb)'}
                <select style={MARKER_FIELD} value={selectedMarker.type} onChange={e => updateMarker(selectedMarker, { type: e.target.value })}>
                  {Object.entries(MARKER_TYPES).map(([key, t]) => <option key={key} value={key}>{t.label}{t.major ? ' (major)' : ''}</option>)}
                </select>
              </label>
              <label>Icon override (blank = the type's icon, e.g. /fort_icon.png)
                <input style={MARKER_FIELD} value={selectedMarker.icon ?? ''} onChange={e => updateMarker(selectedMarker, { icon: e.target.value || undefined })} />
              </label>
              <label>Short blurb (popover, minor types)
                <textarea style={{ ...MARKER_FIELD, height: '70px' }} value={selectedMarker.blurb} onChange={e => updateMarker(selectedMarker, { blurb: e.target.value })} />
              </label>
              <label>Long passage (info panel / popout, major types)
                <textarea style={{ ...MARKER_FIELD, height: '160px' }} value={selectedMarker.content} onChange={e => updateMarker(selectedMarker, { content: e.target.value })} />
              </label>
              <p style={{ color: '#999', marginBottom: '8px' }}>
                Position [{selectedMarker.position.map(n => Math.round(n)).join(', ')}] · Parent: {selectedMarker.parentEntity || 'none (drag it onto an entity)'}
              </p>
              <button style={{ border: '2px solid #e66', padding: '4px 10px' }} onClick={() => deleteMarker(selectedMarker)}>DELETE MARKER</button>
            </div>
          )}
        </div>

        <div style={{ width: '85%', margin: 'auto auto 48px', maxHeight: '900px', overflowY: 'auto' }}>
          <ul style={{ listStyleType: 'none' }}>
            {[...entityEntries.values()].map(entity => (
              <li
                key={entity.name} className="list-hoverable"
                onClick={() => select('entity', entity)}
                style={{ ...ROW, borderColor: selected === entity ? 'white' : '#585858' }}
              >
                <div style={{ display: 'flex' }}>
                  <div className="circle" style={{ backgroundColor: entity.color, marginTop: '6px' }} />
                  <p style={{ fontSize: '24px', paddingBottom: '12px' }}>{entity.name}</p>
                </div>
                <p>-| SUBENTITIES</p>
                <ul>
                  {subsOf(entity.name).map(sub => (
                    <li
                      key={sub.name} className="sublist-hoverable"
                      onClick={e => { e.stopPropagation(); select('subentity', sub); }}
                      style={{ ...SUBROW, borderColor: selected === sub ? 'white' : '#2c2c2c' }}
                    >
                      {sub.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MapTest;
