// Which map layers show, given the view switches, zoom and focus. Pure, so the rules can be tested.
//
// The two switches give four views:
//   neither                    -> just the landmass
//   political only             -> as before (entity fills + borders, supers when zoomed out)
//   regions only               -> region fills with a stronger tint
//   both ("combined")          -> region tint underneath; political drops to outlines (see `outlineOnly`/`tint`)
// While an entity is focused the political layers always show and regions are hidden: a third layer would fight
// the subentity outlines and markers.

export const ENTITY_LAYER_MIN_ZOOM = 0; // entities from here up; superentities below

export function layerFlags({ showBorders, showRegions, focused, zoom, regionLabelsAlways = false }) {
  const regionsOn = showRegions && !focused;
  return {
    entitiesOn: focused || zoom >= ENTITY_LAYER_MIN_ZOOM,
    supersOn: !focused && zoom < ENTITY_LAYER_MIN_ZOOM,
    regionsOn,
    // With political borders on too, region labels give way once entity labels take over (zoom banding).
    regionLabelsOn: regionsOn && (regionLabelsAlways || !showBorders || zoom < ENTITY_LAYER_MIN_ZOOM),
  };
}
