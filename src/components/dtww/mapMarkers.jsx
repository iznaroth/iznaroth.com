import L from 'leaflet';
import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { cls } from './mapUtils';
import { toHtml } from './markerContent';
import { isMajor, markerIconUrl } from './markerTypes';

const ICON_SIZE = 28;
const iconCache = new Map();

function markerIcon(marker, active) {
  const url = markerIconUrl(marker);
  const major = isMajor(marker);
  const key = `${url}|${major}|${active}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, L.icon({
      iconUrl: url,
      iconSize: [ICON_SIZE, ICON_SIZE],
      iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
      popupAnchor: [0, -(ICON_SIZE / 2) - 2], // popover opens just above the icon
      className: cls('map-marker', major && 'map-marker--major', active && 'map-marker--active'),
    }));
  }
  return iconCache.get(key);
}

// Cities and landmarks for the focused entity.
//   major types: click -> onSelect(marker): the page focuses it (info panel, or the popout when nothing is focused)
//   minor types: click -> a popover above the marker showing name + short blurb (Leaflet handles open/close/positioning)
// popupPadding keeps auto-pan from sliding the popover under the right-hand info panel.
export const MarkerLayer = memo(function MarkerLayer({ markers, activeId, onSelect, popupPadding }) {
  return (
    <>
      {markers.map(marker => {
        const major = isMajor(marker);
        return (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={markerIcon(marker, marker.id === activeId)}
            title={marker.name}
            eventHandlers={major ? { click: () => onSelect(marker) } : undefined}
          >
            {!major && (
              <Popup
                className="map-popover"
                closeButton={false}
                autoPanPaddingTopLeft={popupPadding.topLeft}
                autoPanPaddingBottomRight={popupPadding.bottomRight}
              >
                <div className="map-popover__box">
                  <div className="map-popover__title">{marker.name}</div>
                  {marker.blurb && <div className="map-popover__text" dangerouslySetInnerHTML={{ __html: toHtml(marker.blurb) }} />}
                </div>
                <div className="map-popover__tail" />
              </Popup>
            )}
          </Marker>
        );
      })}
    </>
  );
});
