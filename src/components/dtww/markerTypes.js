// Marker types, shared by the editor (type dropdown) and the site (icon + behavior).
//   major: true  -> clicking focuses the marker and shows its long passage ("content"), like a capital or large city.
//   major: false -> clicking opens a small popover with its short "blurb".
//   pin: which animated pin the popout shows when a major marker is opened out of entity focus, exactly as for
//        Dharshav (0 = capital, 1 = fortress, 2 = unknown, 3 = none). A marker can override with its own pinClass / centered.
// Add types freely. Icon paths follow the same convention as the rest of the site ('/name.png', served from the site root).
export const MARKER_TYPES = {
  capital:  { label: 'Capital',    icon: '/crown_icon.png',  major: true,  pin: 0 },
  city:     { label: 'Large city', icon: '/fort_icon.png',   major: true,  pin: 0 },
  fortress: { label: 'Fortress',   icon: '/fort_icon.png',   major: false, pin: 1 },
  town:     { label: 'Town',       icon: '/fort_icon.png',   major: false, pin: 2 },
  landmark: { label: 'Landmark',   icon: '/fort_icon.png',   major: false, pin: 2 },
  danger:   { label: 'Danger',     icon: '/danger_icon.png', major: false, pin: 2 },
};
export const DEFAULT_MARKER_TYPE = 'town';

const typeOf = marker => MARKER_TYPES[marker.type] ?? MARKER_TYPES[DEFAULT_MARKER_TYPE];

export const isMajor = marker => typeOf(marker).major;
export const markerLabel = marker => typeOf(marker).label;
export const markerPinClass = marker => marker.pinClass ?? typeOf(marker).pin;
export const markerCentered = marker => marker.centered ?? false; // the wider, screen-centered popout variant
// marker.icon (an optional per-marker override) wins over the type's icon.
export const markerIconUrl = marker => '../..' + (marker.icon ?? typeOf(marker).icon);
