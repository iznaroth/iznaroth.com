import '../../index.css';
import L from 'leaflet';
import 'leaflet.pattern';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { MapContainer, GeoJSON, FeatureGroup, Marker, Tooltip, Pane, useMap, useMapEvents } from 'react-leaflet';
import { graphcms, QUERY_ENTITY_1, QUERY_ENTITY_2 } from '../../graphql/Queries';
import { territoryIcons, settlementCoordinates, dharshavPost } from './DornnMapConstants';
import unified from './svg_cutouts_unified.json';
import superentityShapes from './superentity_shapes.json';
import entityShapes from './entity_shapes.json';
import subentityData from './subentity_shapes.json'; // from the tool's "SAVE ALL SUBENTITIES" -> { mapSubentities: [...] }

// ---------------------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------------------

const INITIAL_VIEW = { center: [1024, 2048], zoom: -1.5 };
const HOME_VIEW = { center: [1200, 2050], zoom: -1.5 };
const MAX_BOUNDS = [[-2000, -3000], [4045, 7271]];
const DW_FONT = 'IM Fell DW Pica';
const GOTHIC = 'Grenze Gotisch';

// Panes keep draw order stable no matter when layers mount/unmount.
const LANDMASS_PANE = 'landmass';   // under everything (default overlayPane is 400)
const SUBENTITY_PANE = 'subentity-outlines'; // over entity fills, under markers (600)

// ----- Subentity visibility -----
// A subentity always shows (outline + label) while its parent entity is focused.
// When nothing is focused it shows once the map zoom reaches its minimum zoom:
//   sub.minZoom (field in subentity_shapes.json)  ->  SUBENTITY_MIN_ZOOM override below  ->  default.
// Infinity = "only when the parent is focused". Use 0 or more: the entity layer only exists at zoom >= 0.
const SUBENTITY_MIN_ZOOM_DEFAULT = Infinity;
const SUBENTITY_MIN_ZOOM = new Map([
  // ['Some Subentity', 1.5],
]);

const LANDMASS_STYLE = { color: '#000000', weight: 2, opacity: 1, fillColor: '#ffffff', fillOpacity: 1.0 };
// Subentity outlines and labels are black at partial alpha so the parent's fill shows through.
// Each has its own alpha (0 = invisible, 1 = solid black).
const SUBENTITY_LABEL_ALPHA = 0.7;
const SUBENTITY_OUTLINE_ALPHA = 0.075;
const SUBENTITY_LABEL_COLOR = `rgba(0, 0, 0, ${SUBENTITY_LABEL_ALPHA})`;
const SUBENTITY_OUTLINE = { color: '#000000', weight: 2, opacity: SUBENTITY_OUTLINE_ALPHA, fill: false };
const STRIPES = { angle: 45, width: 32, height: 32, weight: 16, spaceWeight: 16 };

const ICON_OPTIONS = {
  iconSize: [25, 25], shadowSize: [25, 25],
  iconAnchor: [12, 12], shadowAnchor: [12, 12], popupAnchor: [12, 12],
};

// Leaflet's default marker is a blank image; label markers are invisible apart from their tooltip.
L.Icon.Default.imagePath = '';
L.Icon.Default.mergeOptions({
  iconUrl: '../../blank_marker.png',
  shadowUrl: '../../blank_marker.png',
  iconRetinaUrl: '../../blank_marker.png',
  ...ICON_OPTIONS,
});

// Same table you'll want in the editor's getParentFontClass stub.
const PARENT_FONT_CLASS = {
  'MIDLAND COUNCIL (XII)': 'midland',
  'INDEPENDENTS': 'independents',
  'THE UNMORTAL LEAGUE': 'unmortal',
  'SALÍRAN DYNASTIES': 'salir',
  'DRAIDIC PACT': 'draid',
  'FAR-NORTHERN ENCLAVE': 'enclave',
  'THE THIRD MANDATE OF POWER': 'mandate',
  'THE FRONTIER': 'frontier',
  'ESOTERICS': 'esoterics',
};

// Label size -> CSS variables, as [maxZoom, value] steps (first step whose maxZoom >= zoom wins).
const FONT_STEPS = {
  small:  [[1, '0px'], [2, '16px'], [Infinity, '24px']],
  medium: [[-2, '0px'], [-1, '6px'], [0, '12px'], [1, '16px'], [2, '24px'], [Infinity, '32px']],
  large:  [[-2, '0px'], [-1, '16px'], [1, '24px'], [Infinity, '48px']],
};
const WIDTH_STEPS = {
  small:  [[1, '0px'], [2, '75px'], [Infinity, '150px']],
  medium: [[-2, '0px'], [1, '100px'], [Infinity, '150px']],
  large:  [[-2, '0px'], [-1, '80px'], [0, '100px'], [Infinity, '150px']],
};

const PIN_CLASSES = ['animatedPinCapital', 'animatedPinFortress', 'animatedPinUnknown'];
const FOCUS_SECTIONS = [
  ['demographicsCulture', 'Demographics & Culture'],
  ['geography', 'Geography & Climate'],
  ['entityHistory', 'History'],
  ['economy', 'Economy'],
  ['governmentPolitics', 'Government & Politics'],
  ['foreignRelations', 'Foreign Relations'],
];

// ---------------------------------------------------------------------------------------------
// Data prep (module level: computed once)
// ---------------------------------------------------------------------------------------------

const subentities = subentityData.mapSubentities;
const entityByName = new Map(entityShapes.map(e => [e.name, e]));
const entitiesBySuper = new Map(superentityShapes.map(se => [
  se.name,
  entityShapes.filter(e => e.superentityName === se.name).sort((a, b) => a.name.localeCompare(b.name)),
]));

// Bounds come straight from the exported geometry, so focusing never depends on a layer having been rendered first.
const boundsCache = new Map();
function getEntityBounds(name) {
  if (!boundsCache.has(name)) {
    const shape = entityByName.get(name)?.aggregatedShape;
    boundsCache.set(name, shape ? L.geoJSON(shape).getBounds() : null);
  }
  return boundsCache.get(name);
}

// Used when the CMS hasn't loaded (or has no entry): enough fields for the focus UI to work.
const fallbackFocus = name => {
  const e = entityByName.get(name);
  return {
    name,
    mapSuperentity: { name: e?.superentityName },
    nameColor: { hex: e?.color },
    labelColor: { hex: e?.labelColor ?? e?.color },
  };
};

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

const cls = (...parts) => parts.filter(Boolean).join(' ');
const parentFontClass = name => PARENT_FONT_CLASS[name] ?? '';
const sizeClass = (prefix, size) => (['small', 'medium', 'large'].includes(size) ? `${prefix}-${size}` : '');
const step = (table, zoom) => table.find(([max]) => zoom <= max)[1];

const subMinZoom = sub => sub.minZoom ?? SUBENTITY_MIN_ZOOM.get(sub.name) ?? SUBENTITY_MIN_ZOOM_DEFAULT;
const subVisible = (sub, zoom, focusedName) =>
  focusedName ? sub.parentEntity === focusedName : zoom >= subMinZoom(sub);

// The editor's default anchor is [0, 0]; treat that as "never positioned".
const isPlaced = anchor => {
  if (!anchor) return false;
  const [lat, lng] = Array.isArray(anchor) ? anchor : [anchor.lat, anchor.lng];
  return lat !== 0 || lng !== 0;
};

const iconCache = new Map();
function territoryIcon(name) {
  if (!iconCache.has(name)) {
    const url = '../..' + territoryIcons.get(name);
    iconCache.set(name, L.icon({ iconUrl: url, shadowUrl: url, ...ICON_OPTIONS }));
  }
  return iconCache.get(name);
}

function applyStripes(map, feature, layer, dim = false) {
  const color = feature.properties.color;
  const stripes = new L.StripePattern({
    ...STRIPES, color, spaceColor: color,
    opacity: dim ? 0.2 : 0.9, spaceOpacity: dim ? 0.1 : 0.4,
  });
  stripes.addTo(map);
  layer.setStyle({ fillPattern: stripes });
}

// Sets the label CSS variables for this zoom and re-lays-out every tooltip.
function updateLabelSizes(map, zoom) {
  const root = document.documentElement.style;
  ['small', 'medium', 'large'].forEach(size => {
    root.setProperty(`--label-font-size-${size}`, step(FONT_STEPS[size], zoom));
    root.setProperty(`--label-width-${size}`, step(WIDTH_STEPS[size], zoom));
  });
  map.eachLayer(layer => layer.getTooltip?.()?.update());
}

// Everything that changes when the map enters/leaves "focused on one entity". Idempotent.
function setFocusMode(map, on) {
  map.options.zoomSnap = on ? 0 : 0.5;
  map.getContainer().classList.toggle('leaflet-container-focused', on);
  const method = on ? 'disable' : 'enable';
  map.dragging[method]();
  map.scrollWheelZoom[method]();
  if (on) map.zoomControl.remove(); else map.zoomControl.addTo(map);
}

// ---------------------------------------------------------------------------------------------
// Map components (module level + memo: they only re-render when their props change)
// ---------------------------------------------------------------------------------------------

function ZoomWatcher({ onZoom }) {
  const map = useMapEvents({
    zoomend: () => {
      updateLabelSizes(map, map.getZoom());
      onZoom(map.getZoom());
    },
  });
  useEffect(() => { updateLabelSizes(map, map.getZoom()); }, [map]);
  return null;
}

const LandmassLayer = memo(function LandmassLayer() {
  return <GeoJSON data={unified} pane={LANDMASS_PANE} interactive={false} style={() => LANDMASS_STYLE} />;
});

// Entity fills + borders. While one entity is focused the others dim; clicking selects.
const EntityLayer = memo(function EntityLayer({ focusedName, onSelect }) {
  const map = useMap();
  return (
    <FeatureGroup>
      {entityShapes.map(entity => {
        if (!entity.aggregatedShape) return null;
        const dim = !!focusedName && focusedName !== entity.name;
        const striped = entity.superentityName === 'ESOTERICS';
        const style = {
          color: entity.color, fillColor: entity.color,
          weight: dim ? 1 : 3, opacity: dim ? 0.2 : 1, fillOpacity: dim ? 0.05 : 0.6,
        };
        return (
          <GeoJSON
            // striped layers get a dim-specific pattern at creation, so they remount when dim changes
            key={striped ? `${entity.name}:${dim}` : entity.name}
            data={entity.aggregatedShape}
            className="mapclass"
            style={() => style}
            onEachFeature={striped ? (feature, layer) => applyStripes(map, feature, layer, dim) : undefined}
            eventHandlers={{ click: () => { if (!focusedName) onSelect(entity.name); } }}
          />
        );
      })}
    </FeatureGroup>
  );
});

const SuperEntityLayer = memo(function SuperEntityLayer() {
  const map = useMap();
  return (
    <FeatureGroup>
      {superentityShapes.map(se => se.aggregatedShape && (
        <GeoJSON
          key={se.name}
          data={se.aggregatedShape}
          className="mapclass"
          style={() => ({ color: se.color.hex, fillColor: se.color.hex, weight: 3, opacity: 1, fillOpacity: 0.6 })}
          onEachFeature={se.name === 'ESOTERICS' ? (feature, layer) => applyStripes(map, feature, layer) : undefined}
        />
      ))}
    </FeatureGroup>
  );
});

// Inner outlines. Not interactive, so clicks fall through to the entity underneath.
const SubentityOutlines = memo(function SubentityOutlines({ subs }) {
  return (
    <>
      {subs.map(sub => sub.aggregatedShape && (
        <GeoJSON
          key={sub.name}
          data={sub.aggregatedShape}
          pane={SUBENTITY_PANE}
          interactive={false}
          style={() => SUBENTITY_OUTLINE}
        />
      ))}
    </>
  );
});

// An invisible marker carrying a permanent tooltip (or a custom icon, with no tooltip).
function LabelMarker({ anchor, text, color, className, icon }) {
  return (
    <Marker position={anchor ?? [0, 0]} interactive={false} {...(icon && { icon })}>
      {!icon && (
        <Tooltip permanent direction="center" className={className} opacity={1} offset={[-15, 28]}>
          <div style={{ whiteSpace: 'normal', textAlign: 'center' }}>
            <span style={{ color, fontWeight: 'bold' }}>{text}</span>
          </div>
        </Tooltip>
      )}
    </Marker>
  );
}

const EntityLabels = memo(function EntityLabels() {
  return (
    <>
      {entityShapes.flatMap(entity => {
        const icon = entity.superentityName === 'THE FRONTIER' ? territoryIcon(entity.name) : null;
        const className = cls(
          'map-label',
          sizeClass('label-width', entity.labelSize),
          sizeClass('map-label', entity.labelSize),
          parentFontClass(entity.superentityName),
        );
        return (entity.labelAnchors ?? [[0, 0]]).map((anchor, i) => (
          <LabelMarker key={`${entity.name}:${i}`} anchor={anchor} icon={icon} text={entity.name} color={entity.labelColor} className={className} />
        ));
      })}
    </>
  );
});

const SubentityLabels = memo(function SubentityLabels({ subs }) {
  return (
    <>
      {subs.filter(sub => isPlaced(sub.labelAnchor)).map(sub => (
        <LabelMarker
          key={sub.name}
          anchor={sub.labelAnchor}
          text={sub.name.toUpperCase()}
          color={SUBENTITY_LABEL_COLOR}
          className={cls('map-label', 'subentity', sizeClass('map-label', sub.labelSize))}
        />
      ))}
    </>
  );
});

// The old markup used an <h> tag, which isn't real HTML; a span with a heading role renders the same.
const Heading = ({ className, style, children }) => (
  <span role="heading" aria-level={2} className={className} style={style}>{children}</span>
);

// ---------------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------------

const Dornn = () => {
  const mapContainerRef = useRef(null);
  const cmsEntries = useRef(new Map()); // entity name -> CMS entry (flag, bio, settlements, ...)

  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(INITIAL_VIEW.zoom);
  const [focused, setFocused] = useState(null);       // CMS entry (or fallback) of the focused entity
  const [settlement, setSettlement] = useState(null); // { post, centered, pinClass }
  const [showBorders, setShowBorders] = useState(false);
  const [showConfigurationPane, setShowConfigurationPane] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [showIndevPopup, setShowIndevPopup] = useState(true);
  const [navExpanded, setNavExpanded] = useState(false);

  const focusedName = focused?.name ?? null;

  // Layer visibility is derived, not toggled: entities at zoom >= 0 (or any zoom while focused), supers below.
  const entitiesOn = !!focused || zoom >= 0;
  const supersOn = !focused && zoom < 0;
  const visibleSubs = useMemo(
    () => subentities.filter(sub => subVisible(sub, zoom, focusedName)),
    [zoom, focusedName],
  );

  // ----- CMS -----
  useEffect(() => {
    let cancelled = false;
    Promise.all([graphcms.request(QUERY_ENTITY_1), graphcms.request(QUERY_ENTITY_2)])
      .then(results => {
        if (cancelled) return;
        results.forEach(res => res.mapEntities.forEach(e => cmsEntries.current.set(e.name, e)));
        // if an entity was focused before the CMS arrived, upgrade it to the real entry
        setFocused(cur => (cur ? cmsEntries.current.get(cur.name) ?? cur : cur));
      })
      .catch(err => console.error('Failed to load entity CMS data', err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!map) return;
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  // ----- focus / navigation -----

  const focusEntity = useCallback(name => {
    const bounds = getEntityBounds(name);
    if (!map || !bounds) {
      console.warn('Cannot focus entity without a map or shape:', name);
      return;
    }
    setShowBorders(true); // borders are needed for this view
    setChangelogOpen(false);
    setShowIndevPopup(false);
    setSettlement(null);
    setFocused(cmsEntries.current.get(name) ?? fallbackFocus(name));

    mapContainerRef.current?.scrollIntoView();
    setFocusMode(map, true); // must precede flyToBounds: it unlocks fractional zoom
    map.flyToBounds(bounds, {
      paddingTopLeft: [25, 25], // these seem to misbehave on mobile; derive from viewport size if needed
      paddingBottomRight: [600, 225],
      duration: 1.5,
    });
  }, [map]);

  const exitFocus = useCallback(flyHome => {
    setFocused(null);
    setChangelogOpen(false);
    setFocusMode(map, false);
    if (flyHome) {
      setZoom(HOME_VIEW.zoom); // switch to the supers right away instead of waiting for zoomend
      map.flyTo(HOME_VIEW.center, HOME_VIEW.zoom);
    } else {
      map.zoomOut();
    }
  }, [map]);

  const openSettlement = useCallback((post, centered, pinClass) => {
    const base = settlementCoordinates.get(post.name);
    if (!map || !base) return;
    mapContainerRef.current?.scrollIntoView();
    setFocused(null);
    setChangelogOpen(false);
    setFocusMode(map, false);
    setSettlement({ post, centered, pinClass });
    map.flyTo([base[0] - 1, base[1] + 35], 2); // shifted so the pin sits left of the panel
    map.dragging.disable();
  }, [map]);

  const closeSettlement = useCallback(() => {
    setSettlement(null);
    map.flyTo(HOME_VIEW.center, HOME_VIEW.zoom);
    map.dragging.enable();
  }, [map]);

  return (
    <div className="worldwell min-h-screen" style={{ backgroundImage: 'url(../../terrain_bg_tile.png)' }}>
      <section id="logo" className="wwlogo">
        <a className="m-auto lg:w-2/5 md:w-3/5 sm:w-4/5" href="/dtww">
          <img alt="Down the Worldwell" src="../../dtww.png" />
        </a>
      </section>

      <section id="navbar">
        <div className="navbar wwnavbar">
          <a href="/"><img alt="return home" src="../../back_button.png" /></a>
          <a href="/dtww/system"><img src="../../system.png" alt="" /></a>
          <a href="/dtww/dornn"><img className="opacity-50" src="../../world.png" alt="" /></a>
          <a href="/dtww/character-creation"><img src="../../char.png" alt="" /></a>
          <a href="/dtww/assembly"><img src="../../assembly.png" alt="" /></a>
        </div>
      </section>

      <div className="map-spec">
        <div className="mid-border-map">
          <div className="inner-border">
            {['left-top', 'right-top', 'right-bottom', 'left-bottom'].map(corner => (
              <img key={corner} className={`corner-decoration corner-${corner} z-50`} src="../../corner-decoration.png" alt="" />
            ))}

            <div id="content-main">
              <img className="m-auto w-full sm:w-1/2 pt-5" src="../../world_banner.png" alt="The World - Also Known as The Measured Extent of the Dornnian Midlands" />

              <div className="mapcontent relative" style={{ zIndex: 0 }}>
                {focused && !settlement && (
                  <div className="map-selection-header text-center overflow-y-auto">
                    <Heading
                      className={`inline-block text-7xl pt-5 pb-5 map-info-header ${parentFontClass(focused.mapSuperentity?.name)}`}
                      style={{ color: focused.labelColor.hex }}
                    >
                      {focused.name}
                    </Heading>
                    <p className="text-xl">{focused.subtitle}</p>
                  </div>
                )}

                <div className="map" ref={mapContainerRef} style={{ zIndex: 0 }}>
                  <MapContainer
                    ref={setMap}
                    center={INITIAL_VIEW.center}
                    zoom={INITIAL_VIEW.zoom}
                    minZoom={-2}
                    zoomSnap={0.5}
                    zoomDelta={0.5}
                    wheelPxPerZoomLevel={120}
                    dragging
                    keyboardPanDelta={200}
                    zoomControl
                    crs={L.CRS.Simple}
                    maxBounds={MAX_BOUNDS}
                    maxBoundsViscosity={0.9}
                    tap={false}
                    doubleClickZoom={false}
                    preferCanvas={false}
                  >
                    <ZoomWatcher onZoom={setZoom} />

                    <Pane name={LANDMASS_PANE} style={{ zIndex: 399 }}>
                      {!focused && <LandmassLayer />}
                    </Pane>

                    {showBorders && entitiesOn && <EntityLayer focusedName={focusedName} onSelect={focusEntity} />}
                    {showBorders && supersOn && <SuperEntityLayer />}

                    <Pane name={SUBENTITY_PANE} style={{ zIndex: 450 }}>
                      {showBorders && <SubentityOutlines subs={visibleSubs} />}
                    </Pane>

                    {showBorders && entitiesOn && !focused && <EntityLabels />}
                    {showBorders && <SubentityLabels subs={visibleSubs} />}
                  </MapContainer>
                </div>

                {showIndevPopup && (
                  <div style={{ position: 'absolute', display: 'flex', left: '5%' }}>
                    <div style={{ width: '50%', position: 'relative' }}>
                      <img src="../../map_indev_panel.png" alt="" />
                    </div>
                    <button onClick={() => setChangelogOpen(true)} style={{ maxWidth: '60px', right: '5%', top: '25%' }}>
                      <img src="../../changes_button.png" alt="Changes" />
                    </button>
                    <button onClick={() => setShowIndevPopup(false)} style={{ width: '5%' }}>
                      <img src="../../close_popup.png" style={{ maxWidth: '100%' }} alt="Close" />
                    </button>
                  </div>
                )}

                {!focused && (showConfigurationPane ? (
                  <div style={{ position: 'absolute', right: '1%', top: '3%', backgroundColor: 'black', border: '3px solid white', padding: '6px' }}>
                    <div style={{ width: 'fit-content', margin: 'auto', fontFamily: GOTHIC, color: 'white', fontSize: '36px', padding: '6px 32px 0' }}>
                      Configuration
                    </div>
                    <div style={{ height: '12px', borderTop: '2px dashed white', margin: '6px 24px 0' }} />
                    <div style={{ display: 'flex', margin: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <label className="switch" style={{ marginTop: '0px' }}>
                        <input type="checkbox" checked={showBorders} onChange={() => setShowBorders(v => !v)} />
                        <span className="slider" />
                      </label>
                      <p style={{ height: '20px', lineHeight: '20px', textAlign: 'center', color: '#bbbbbb', fontFamily: DW_FONT, fontSize: '20px', paddingLeft: '12px' }}>
                        Territory Borders
                      </p>
                    </div>
                    <button style={{ width: 'fit-content', margin: 'auto', display: 'block' }} className="py-2 map-return" onClick={() => setShowConfigurationPane(false)}>
                      CLOSE
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', display: 'flex', right: '1%', top: '3%', flexDirection: 'row-reverse' }}>
                    <button onClick={() => setShowConfigurationPane(true)} style={{ width: '50%' }}>
                      <img src="../../settings_toggle.png" style={{ maxWidth: '100%' }} alt="Settings" />
                    </button>
                  </div>
                ))}

                {/* CHANGELOG */}
                {changelogOpen && (
                  <div className="settlement-centered bg-black border-4 border-white absolute map-info text-center overflow-y-auto" style={{ color: 'white', fontFamily: GOTHIC }}>
                    <Heading className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{ color: 'white', fontFamily: GOTHIC }}>Maplog!</Heading>
                    <p className="pb-2 px-5 text-slate-500">ver. 1.3</p>
                    <p className="inline-block pt-5 pb-0 px-5 map-info-content" style={{ textAlign: 'left' }}>
                      Entity interaction works, mostly. No mobile support yet. A lot of content is also missing - bios will slowly filter in over the next year or so, barring any intense bursts of inspiration.
                      You can use the tray under the map to quickly navigate to specific political entities. The 'capital' button which appears below each entity's flag in the focus view works, but most capitals have no content,
                      so you won't find many working ones quite yet. A lot of fluff to say "hey, I did all my backend homework, sorry the content is a little threadbare!" Also, this view is very unpolished. A lot of the colors, spacing, label behavior
                      and other styling choices are very...err...bad.
                    </p>
                    <Heading className="inline-block text-4xl pt-5 pb-5 map-info-header" style={{ color: 'white', fontFamily: DW_FONT }}>What's Next?</Heading>
                    <div className="inline-block pt-5 pb-0 px-5 map-info-content" style={{ textAlign: 'left' }}>
                      A few things, in the following order:
                      <ul>
                        <li>LOTS MORE CONTENT! Political entity bios, additional context (political structure, major figures, culture, geography, the works.) Capitals and other settlements, too.</li>
                        <li>Subentities, or "states and territories" - still working out the view on this (if it'll work at hi-zoom or only when selected) but many map entities have subsegments of relevance.</li>
                        <li>City pins will display on the map when an entity is selected.</li>
                        <li>The "Codex" at the bottom of the screen, which will surface definitions for a variety of currently-contextless terms you'll stumble across on the map, as well as critical information for the Down the Worldwell TTRPG eventually.</li>
                        <li>A region toggle, which swaps out the political entity view for a geographic/cultural region one. This is where landmarks will go, though entities can list landmarks and allow for viewhopping.</li>
                        <li>Hooks for the eventual character creator.</li>
                      </ul>
                    </div>
                    <button className="py-5 map-return" onClick={() => setChangelogOpen(false)}>GO BACK</button>
                  </div>
                )}

                {/* FOCUSED ENTITY PANEL */}
                {settlement?.centered && !focused && <div className="mapBlocker bg-black absolute" />}
                {focused && !settlement && (
                  <div className="map-info text-center overflow-y-auto">
                    {focused.flagEmblem?.url ? (
                      <img style={{ height: '20%', display: 'block', margin: '32px auto 0' }} alt="Down the Worldwell" src="../../demo_flag.png" />
                    ) : (
                      <div
                        className={parentFontClass(focused.mapSuperentity?.name)}
                        style={{
                          aspectRatio: '16 / 9', backgroundColor: focused.nameColor.hex,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', height: '20%', margin: '32px auto 0',
                        }}
                      >
                        <p style={{ maxWidth: '200px', textAlign: 'center', fontSize: '64px' }}>?</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '12px 0' }}>
                      {focused.summaryProperties?.bubbles && (
                        <div style={{ marginRight: '12px' }}>
                          {focused.summaryProperties.bubbles.map(bubble => (
                            <div key={bubble.text} className="circle tooltip" style={{ backgroundColor: bubble.color, margin: '6px 12px 0' }}>
                              <span className="tooltiptext tooltiptop !text-sm">{bubble.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button style={{ color: 'white', border: focused.summaryProperties ? '2px solid #3d3d3d' : 'none', borderRadius: '6px' }}>
                        <div style={{ display: 'flex' }}>
                          <img
                            style={{ maxHeight: '35px', padding: '0 8px' }}
                            src={focused.summaryProperties ? '../../crown_icon.png' : '../../danger_icon.png'}
                            alt=""
                          />
                          {focused.summaryProperties && (
                            <p style={{ lineHeight: '35px', color: 'white', fontSize: '14px', textAlign: 'center', paddingRight: '12px' }}>
                              {focused.summaryProperties.capital}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>

                    <p className="px-10" style={{ color: 'grey', fontSize: '14px' }}>{focused.eyecatchFacts}</p>
                    <p className="inline-block pt-5 pb-0 px-10 map-info-content">{focused.content}</p>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ borderTop: '2px solid #242424', width: '70%', margin: '25px 0' }} />
                    </div>

                    {focused.settlementsLandmarks && (
                      <>
                        <h1 className="focus-panel-header">- Settlements and Landmarks -</h1>
                        <br />
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', margin: '0 10%' }}>
                          {focused.settlementsLandmarks.settlements.map(ele => (
                            <div key={ele.name} style={{ flexBasis: '50%' }}>
                              <button style={{ color: 'white', border: '2px solid #3d3d3d', borderRadius: '6px', width: '200px' }}>
                                <div style={{ display: 'flex' }}>
                                  <img style={{ maxHeight: '35px', padding: '0 8px' }} src="../../fort_icon.png" alt="" />
                                  <p style={{ lineHeight: '35px', color: 'white', fontSize: '14px', textAlign: 'center', paddingRight: '12px' }}>{ele.name}</p>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="grid-box">
                      {FOCUS_SECTIONS.filter(([field]) => focused[field]).map(([field, label]) => (
                        <button key={field} className="grid-item-bordered">{label}</button>
                      ))}
                    </div>

                    <button className="py-5 map-return w-99" onClick={() => exitFocus(false)}>GO BACK</button>
                    <button className="map-return w-99" onClick={() => exitFocus(true)}>RETURN TO ORIGIN</button>
                  </div>
                )}

                {/* SETTLEMENT PANEL with lefthand pin */}
                {settlement && !focused && (
                  <div>
                    {PIN_CLASSES[settlement.pinClass] && <div className={`animatedPin ${PIN_CLASSES[settlement.pinClass]}`} />}
                    <div
                      style={{ overflowY: 'auto' }}
                      className={`${settlement.centered ? 'settlement-centered' : 'settlement'} bg-black border-4 border-white absolute map-info text-center overflow-y-auto`}
                    >
                      <Heading className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{ color: settlement.post.nameColor.hex, fontFamily: DW_FONT }}>
                        {settlement.post.name}
                      </Heading>
                      <p><i>{settlement.post.subtitle}</i></p>
                      <div className="inline-block pt-5 pb-0 px-5 map-info-content" dangerouslySetInnerHTML={{ __html: settlement.post.content }} />
                      <button className="py-5 map-return" onClick={closeSettlement}>GO BACK</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'block', margin: 'auto', padding: '18px 0 32px', width: 'fit-content', color: '#a8a8a8', fontFamily: GOTHIC, fontSize: '18px', textAlign: 'center' }}>
                This map was compiled and charted by the gracious agents of the neutral printing-fort{' '}
                <b style={{ color: '#c58e30', borderBottom: '2px dotted #bd882d' }} onClick={() => openSettlement(dharshavPost, false, 1)}>"Dharshav"</b>
                <br />
                For any assistance in commanding or reorienting the host-body of your map, please see{' '}
                <a href="#codex" style={{ color: '#c7c7c7', borderBottom: '2px dotted #f1f1f1' }}>here.</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="map-nav-drawer">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '30%' }}><img style={{ width: '100%' }} src="../../nav_divider_l.png" alt="" /></div>
          <h1 style={{ color: 'white', textAlign: 'center', fontFamily: GOTHIC }}> - Navigation  - </h1>
          <div style={{ width: '30%' }}><img style={{ width: '100%' }} src="../../nav_divider_r.png" alt="" /></div>
        </div>
        <div className={`expand-container${navExpanded ? ' expanded' : ''}`}>
          <div className="content" style={{ marginTop: '12px' }}>
            {superentityShapes.map(se => (
              <details key={se.name} style={{ width: '100%', marginBottom: '18px' }}>
                <summary className={parentFontClass(se.name)} style={{ color: se.nameColor.hex, fontSize: '36px', textAlign: 'center' }}>{se.name}</summary>
                <div id="poli-grid-box">
                  {entitiesBySuper.get(se.name).map(entity => (
                    <button key={entity.name} className={parentFontClass(se.name)} id="poligrid-link" onClick={() => focusEntity(entity.name)}>
                      {entity.name}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ width: '5%' }} onClick={() => setNavExpanded(v => !v)}>
              <img src="../../down_arrow.png" style={{ maxWidth: '100%' }} alt="Toggle navigation" />
            </button>
          </div>
        </div>
      </div>

      <div className="blog-footer" />

      <div className="dark-background">
        <div className="mid-border" style={{ minHeight: '0px' }}>
          <div className="inner-border">
            {['left-top', 'right-top', 'right-bottom', 'left-bottom'].map(corner => (
              <img key={corner} className={`corner-decoration corner-${corner}`} src="../../corner-decoration.png" alt="" />
            ))}
            <img className="vertical-decoration top" src="../../horizontally-centered-vertical-decoration.png" alt="" />
            <img className="vertical-decoration bottom" src="../../horizontally-centered-vertical-decoration.png" alt="" />

            <div className="bio-container" id="codex">
              <img id="what-header" src="../../what_is_this.png" alt="What is this?" />
              <h2 className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{ color: 'white', fontFamily: GOTHIC, textAlign: 'center', width: '100%' }}>COMING SOON</h2>
              <h4 className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{ color: 'gray', fontFamily: GOTHIC, textAlign: 'center', width: '100%', paddingBottom: '8vh' }}>
                The Codex will contain a living glossary of setting terms by generic category and allow for cross-site linking.
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-footer" />
      <div className="blog-footer copynotice">©2022 - 2026 iznaroth | All Rights Reserved</div>
      <div className="blog-footer" />
    </div>
  );
};

export default Dornn;
