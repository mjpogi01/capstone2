import React from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import './Branches.css';

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
  }
];

const Branches = () => {
  const [activeId, setActiveId] = React.useState(null);
  const mapId = process.env.REACT_APP_GMAPS_MAP_ID || undefined;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: []
  });

  const mapRef = React.useRef(null);
  const [isRouting, setIsRouting] = React.useState(false);

  const onLoad = React.useCallback((map) => {
    mapRef.current = map;
    const bounds = new window.google.maps.LatLngBounds();
    branches.forEach(b => bounds.extend(b.position));
    map.fitBounds(bounds, 40);
  }, []);

  const focusBranch = (branch) => {
    setActiveId(branch.id);
    if (mapRef.current) {
      mapRef.current.panTo(branch.position);
      mapRef.current.setZoom(16);
    }
  };

  const getDirectionsTo = (branch) => {
    setIsRouting(true);
    
    // Get user's current location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const destLat = branch.position.lat;
          const destLng = branch.position.lng;
          
          // Create Google Maps directions URL
          const directionsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${destLat},${destLng}`;
          
          // Open in new tab
          window.open(directionsUrl, '_blank');
          setIsRouting(false);
        },
        () => {
          // If location access fails, open with just the destination
          const destLat = branch.position.lat;
          const destLng = branch.position.lng;
          const directionsUrl = `https://www.google.com/maps/dir//${destLat},${destLng}`;
          
          window.open(directionsUrl, '_blank');
          setIsRouting(false);
        }
      );
    } else {
      // If geolocation is not supported, open with just the destination
      const destLat = branch.position.lat;
      const destLng = branch.position.lng;
      const directionsUrl = `https://www.google.com/maps/dir//${destLat},${destLng}`;
      
      window.open(directionsUrl, '_blank');
      setIsRouting(false);
    }
  };

  if (loadError) {
    return (
      <section id="branches" className="branches-section">
        <div className="branches-container">
          <h1 className="neon-text branches-heading">Our Branches</h1>
          <p className="error-text">Google Maps failed to load.</p>
        </div>
      </section>
    );
  }

  if (!isLoaded) {
    return (
      <section id="branches" className="branches-section">
        <div className="branches-container">
          <h1 className="neon-text branches-heading">Our Branches</h1>
          <p className="loading-text">Loading map…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="branches" className="branches-section">
      <div className="branches-container">
        <h1 className="neon-text branches-heading">Our Branches</h1>
        <p className="branches-description">Find the nearest Yohann's Sportswear House branch on the map.</p>
        <div className="branches-layout">
          <div className="branch-list">
            {branches.map((branch) => (
              <div 
                key={branch.id} 
                className={`branch-item ${activeId === branch.id ? 'active' : ''}`}
                onClick={() => focusBranch(branch)}
              >
                <div className="branch-name">{branch.name}</div>
                <div className="branch-address">{branch.address}</div>
              </div>
            ))}
          </div>

          <GoogleMap
            onLoad={onLoad}
            mapContainerClassName="map-container"
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: true,
              streetViewControl: true,
              fullscreenControl: true,
              clickableIcons: true,
              gestureHandling: 'greedy',
              mapId
            }}
          >
            {branches.map(branch => (
              <Marker
                key={branch.id}
                position={branch.position}
                onClick={() => setActiveId(branch.id)}
              />
            ))}

            {branches.map(branch => (
              activeId === branch.id ? (
                <InfoWindow
                  key={`info-${branch.id}`}
                  position={branch.position}
                  onCloseClick={() => setActiveId(null)}
                >
                  <div className="info-window">
                    <div className="info-window-title">{branch.name}</div>
                    <div className="info-window-address">{branch.address}</div>
                    <div className="info-window-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00bfff" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="info-window-badge-text">Yohann's Sportswear House</span>
                    </div>
                    <button
                      onClick={() => getDirectionsTo(branch)}
                      disabled={isRouting}
                      className="directions-button"
                    >
                      {isRouting ? 'Getting Directions...' : 'Get Directions'}
                    </button>
                  </div>
                </InfoWindow>
              ) : null
            ))}
          </GoogleMap>
        </div>
      </div>
    </section>
  );
};

export default Branches; 