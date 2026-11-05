import './mapRegions.css';
import { memo } from 'react';
import { GeoJSON, Marker, Tooltip } from 'react-leaflet';
import regionShapes from './region_shapes.json'; // from the editor's "SAVE REGIONS FOR MAIN PAGE" -> [ ... ]
import { interpolate, isPlaced } from './labelGeometry';

// Region fills live in their own pane: above the landmass (390), below the political layers (overlayPane, 400),
// so toggling or re-creating either layer can never change the stacking.
export const REGION_PANE = 'region-fills';

// The page only offers the regions switch once some regions have been painted and exported.
export const hasRegions = regionShapes.some(region => region.aggregatedShape);

export const REGION_STYLE = {
  // "solo" = regions on their own; "combined" = political borders are on too, so the tint stays soft and thin
  // and reads as an underlay beneath the borders and labels.
  fillAlpha: { solo: 0.5, combined: 0.28 },
  outline: { solo: { weight: 2, opacity: 0.7 }, combined: { weight: 1, opacity: 0.45 } },
  labelAlpha: 0.85,
  // One size per tier at each zoom, [zoom, px] stops, interpolated and clamped. Tier = the region's labelSize.
  labelSizes: {
    small:  [[-2, 12], [1, 16]],
    medium: [[-2, 16], [1, 22]],
    large:  [[-2, 22], [1, 30]],
  },
  wrapEm: 12,
  lineHeight: 1.1,
};

// Fills and outlines. Not interactive: clicks fall through to the political layer.
export const RegionLayer = memo(function RegionLayer({ tint }) {
  const mode = tint ? 'combined' : 'solo';
  return (
    <>
      {regionShapes.map(region => region.aggregatedShape && (
        <GeoJSON
          key={region.name}
          data={region.aggregatedShape}
          pane={REGION_PANE}
          interactive={false}
          style={() => ({
            color: region.color,
            fillColor: region.color,
            fillOpacity: REGION_STYLE.fillAlpha[mode],
            ...REGION_STYLE.outline[mode],
          })}
        />
      ))}
    </>
  );
});

// Region labels. Typography beyond size/color/wrapping comes from the .region-label class (mapRegions.css).
export const RegionLabels = memo(function RegionLabels({ zoom }) {
  return (
    <>
      {regionShapes.flatMap(region => (region.labelAnchors ?? []).map((anchor, i) => {
        if (!isPlaced(anchor)) return null; // the editor's [0, 0] means "never positioned"
        const stops = REGION_STYLE.labelSizes[region.labelSize] ?? REGION_STYLE.labelSizes.medium;
        return (
          <Marker key={`${region.name}:${i}`} position={anchor} interactive={false}>
            <Tooltip permanent direction="center" className="map-label region-label" opacity={1} offset={[-15, 28]}>
              <div
                style={{
                  width: 'max-content',
                  maxWidth: `${REGION_STYLE.wrapEm}em`,
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  fontSize: `${interpolate(stops, zoom)}px`,
                  lineHeight: REGION_STYLE.lineHeight,
                  color: region.labelColor,
                  opacity: REGION_STYLE.labelAlpha,
                }}
              >
                {region.name}
              </div>
            </Tooltip>
          </Marker>
        );
      }))}
    </>
  );
});
