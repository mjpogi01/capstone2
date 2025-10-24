import React from 'react';
import './Branches.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const createGMapsLink = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const branches = [
  {
    id: 1,
    name: 'SAN PASCUAL (MAIN BRANCH)',
    address: 'Villa Maria Subdivision Sambat, San Pascual, 4204 Batangas',
    position: { lat: 13.8037077, lng: 121.0132160 },
    gmaps: createGMapsLink('Villa Maria Subdivision Sambat, San Pascual, 4204 Batangas')
  },
  {
    id: 2,
    name: 'CALAPAN BRANCH',
    address: 'Unit 2, Ground Floor Basa Bldg., Infantado Street, Brgy. San Vicente West Calapan City, 5200 Oriental Mindoro',
    position: { lat: 13.4123794, lng: 121.1765920 },
    gmaps: createGMapsLink('Infantado Street, Brgy. San Vicente West Calapan City, 5200 Oriental Mindoro')
  },
  {
    id: 3,
    name: 'MUZON BRANCH',
    address: 'Barangay Muzon, San Luis, 4226 Batangas',
    position: { lat: 13.8558908, lng: 120.9405255 },
    gmaps: createGMapsLink('Barangay Muzon, San Luis, 4226 Batangas')
  },
  {
    id: 4,
    name: 'LEMERY BRANCH',
    address: 'Miranda Bldg, Illustre Ave., Brgy. District III 4209 Lemery Batangas',
    position: { lat: 13.8832266, lng: 120.9139464 },
    gmaps: createGMapsLink('Miranda Bldg, Illustre Ave., Brgy. District III 4209 Lemery Batangas')
  },
  {
    id: 5,
    name: 'BATANGAS CITY BRANCH',
    address: 'Unit 1 Casa Buena Building, P.Burgos ST. EXT Calicanto, 4200 Batangas',
    position: { lat: 13.7648295, lng: 121.0557838 },
    gmaps: createGMapsLink('Unit 1 Casa Buena Building, P.Burgos ST. EXT Calicanto, 4200 Batangas')
  },
  {
    id: 6,
    name: 'BAUAN BRANCH',
    address: 'J.P Rizal St. Poblacion, Bauan Batangas',
    position: { lat: 13.7917841, lng: 121.0072838 },
    gmaps: createGMapsLink('J.P Rizal St. Poblacion, Bauan Batangas')
  },
  {
    id: 7,
    name: 'CALACA BRANCH',
    address: 'Block D-8 Calaca Public Market, Poblacion 4, Calaca City, Philippines',
    position: { lat: 13.9288950, lng: 120.8113147 },
    gmaps: createGMapsLink('Block D-8 Calaca Public Market, Poblacion 4, Calaca City, Philippines')
  },
  {
    id: 8,
    name: 'PINAMALAYAN BRANCH',
    address: 'Mabini St. Brgy. Marfrancisco, Pinamalayan, Oriental Mindoro, Philippines',
    position: { lat: 13.0350, lng: 121.4847 },
    gmaps: createGMapsLink('Mabini St. Brgy. Marfrancisco, Pinamalayan, Oriental Mindoro, Philippines')
  }
];

// Configure default Leaflet marker icons so they render correctly in CRA
const defaultIcon = L.icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Red icon for active branch (SVG data URI)
const activeRedIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset result="offOut" in="SourceAlpha" dx="0" dy="1"/>
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1"/>
            <feColorMatrix result="blurOut" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"/>
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.5 12.5 28.5S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" fill="#e53935"/>
          <circle cx="12.5" cy="12" r="4.5" fill="#fff"/>
        </g>
      </svg>`
    ),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  shadowSize: [41, 41]
});

const Branches = () => {
  const [activeId, setActiveId] = React.useState(null);
  const mapRef = React.useRef(null);
  const [isRouting, setIsRouting] = React.useState(false);

  const focusBranch = (branch) => {
    setActiveId(branch.id);
    if (mapRef.current) {
      mapRef.current.setView(branch.position, 16, { animate: true });
    }
  };

  const getDirectionsTo = (branch) => {
    setIsRouting(true);

    const dest = `${branch.position.lat},${branch.position.lng}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;

    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isMobile = isAndroid || isIOS;

    // Mobile deep links: try app first, fallback to web
    if (isMobile) {
      let appUrl = webUrl;
      let fallbackUrl = webUrl;

      if (isAndroid) {
        // Launch Google Maps navigation directly
        appUrl = `google.navigation:q=${encodeURIComponent(dest)}&mode=d`;
        fallbackUrl = webUrl;
      } else if (isIOS) {
        // Prefer Google Maps app; fallback to Apple Maps
        const gmapsUrl = `comgooglemaps://?daddr=${encodeURIComponent(dest)}&directionsmode=driving`;
        const appleMapsUrl = `maps://?daddr=${encodeURIComponent(dest)}&dirflg=d`;
        appUrl = gmapsUrl;
        fallbackUrl = appleMapsUrl;
      }

      // Navigate app URL; if it fails (app missing), after a short delay, open fallback
      const openFallbackTimer = setTimeout(() => {
        // For iOS, attempt Apple Maps first; if that still fails, browser handles webUrl
        window.location.href = fallbackUrl;
        setIsRouting(false);
      }, 1200);

      try {
        window.location.href = appUrl;
      } catch (_) {
        // If immediate error, fallback instantly
        clearTimeout(openFallbackTimer);
        window.location.href = fallbackUrl;
        setIsRouting(false);
      }

      return;
    }

    // Desktop: use web URL and include precise origin if permitted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
          window.open(url, '_blank');
          setIsRouting(false);
        },
        () => {
          window.open(webUrl, '_blank');
          setIsRouting(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      window.open(webUrl, '_blank');
      setIsRouting(false);
    }
  };

  const FitBounds = ({ points }) => {
    const map = useMap();
    React.useEffect(() => {
      if (!map) return;
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }, [map, points]);
    return null;
  };

  return (
    <section id="branches" className="yohanns-branches-section">
      <div className="yohanns-branches-container">
        <div className="yohanns-branches-hero">
          <h1 className="neon-text yohanns-branches-heading">Our Branches</h1>
          <p className="yohanns-branches-description">Find the nearest Yohann's Sportswear House branch on the map.</p>
        </div>
        
        <div className="yohanns-branches-content">
          <div className="yohanns-branches-layout">
          
          <MapContainer
            whenCreated={(map) => { mapRef.current = map; }}
            className="yohanns-map-container"
            center={branches[0].position}
            zoom={12}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds points={branches.map(b => b.position)} />

            {branches.map(branch => (
              <Marker
                key={branch.id}
                position={branch.position}
                icon={activeId === branch.id ? activeRedIcon : defaultIcon}
                eventHandlers={{
                  click: () => {
                    setActiveId(branch.id);
                    if (mapRef.current) {
                      mapRef.current.setView(branch.position, 16, { animate: true });
                    }
                  }
                }}
              >
                {activeId === branch.id ? (
                  <Popup
                    position={branch.position}
                    onClose={() => setActiveId(null)}
                  >
                    <div className="yohanns-info-window">
                      <div className="yohanns-info-window-title">{branch.name}</div>
                      <div className="yohanns-info-window-address">{branch.address}</div>
                      <div className="yohanns-info-window-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00bfff" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="yohanns-info-window-badge-text">Yohann's Sportswear House</span>
                      </div>
                      <button
                        onClick={() => getDirectionsTo(branch)}
                        disabled={isRouting}
                        className="yohanns-directions-button"
                      >
                        {isRouting ? 'Getting Directions...' : 'Get Directions'}
                      </button>
                    </div>
                  </Popup>
                ) : null}
              </Marker>
            ))}
          </MapContainer>

          <div className="yohanns-branch-list">
            {branches.map((branch) => (
              <div 
                key={branch.id} 
                className={`yohanns-branch-item ${activeId === branch.id ? 'yohanns-branch-item-active' : ''}`}
                onClick={() => focusBranch(branch)}
              >
                <div className="yohanns-branch-name">{branch.name}</div>
                <div className="yohanns-branch-address">{branch.address}</div>
                {activeId === branch.id ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); getDirectionsTo(branch); }}
                    disabled={isRouting}
                    className="yohanns-directions-button"
                    style={{ marginTop: '8px' }}
                  >
                    {isRouting ? 'Getting Directions...' : 'Get Directions'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          
          </div>
        </div>
      </div>
    </section>
  );
};

export default Branches;

