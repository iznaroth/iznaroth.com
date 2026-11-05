export const MARKER_TYPES = {
  capital:  { label: 'Capital',    icon: '/crown_icon.png',  major: true },
  city:     { label: 'Large city', icon: '/major_settlement.png',   major: false },
  town: { label: 'Small city',   icon: '/small_settlement.png',   major: false },
  fortress:     { label: 'Fortress',       icon: '/fort_icon.png',   major: false },
};
export const DEFAULT_MARKER_TYPE = 'town';

const typeOf = marker => MARKER_TYPES[marker.type] ?? MARKER_TYPES[DEFAULT_MARKER_TYPE];

export const isMajor = marker => typeOf(marker).major;
export const markerLabel = marker => typeOf(marker).label;
// marker.icon (an optional per-marker override) wins over the type's icon.
export const markerIconUrl = marker => '../..' + (marker.icon ?? typeOf(marker).icon);
