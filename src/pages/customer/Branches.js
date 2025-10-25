import React from 'react';
import './Branches.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

// Blue icon for user location
const userLocationIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0.75  0 0 0 0 1  0 0 0 1 0"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="15" cy="15" r="12" fill="#3b82f6" stroke="#fff" stroke-width="3" filter="url(#glow)"/>
        <circle cx="15" cy="15" r="5" fill="#fff"/>
      </svg>`
    ),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const Branches = () => {
  const [activeId, setActiveId] = React.useState(null);
  const mapRef = React.useRef(null);
  const [isRouting, setIsRouting] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState(null);
  const [routeCoordinates, setRouteCoordinates] = React.useState([]);
  const [travelInfo, setTravelInfo] = React.useState(null);

  // Get user's current location on component mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
        },
        (error) => {
          console.log('Unable to get user location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance; // Distance in km
  };

  // Calculate travel time based on mode of transport (Google Maps-like estimation)
  const calculateTravelInfo = (userLoc, branchPos) => {
    const distance = calculateDistance(
      userLoc.lat,
      userLoc.lng,
      branchPos.lat,
      branchPos.lng
    );

    // More realistic average speeds (km/h) accounting for real-world conditions
    // These match Google Maps estimates more closely
    const speeds = {
      walking: 4.5,      // 4.5 km/h (includes stops, crossings)
      bicycle: 12,       // 12 km/h (realistic city cycling with traffic)
      motorcycle: 35,    // 35 km/h (city roads with traffic)
      car: 40            // 40 km/h (includes traffic, stops, turns in Philippines)
    };

    const formatTime = (hours) => {
      if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
      } else {
        const hrs = Math.floor(hours);
        const mins = Math.round((hours - hrs) * 60);
        return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
      }
    };

    // Add overhead time for short trips (stops, intersections, etc.)
    const addOverhead = (baseTime, distance) => {
      if (distance < 5) {
        // Short trips: add 15% overhead for traffic lights, turns
        return baseTime * 1.15;
      } else if (distance < 15) {
        // Medium trips: add 10% overhead
        return baseTime * 1.10;
      } else {
        // Long trips: add 8% overhead (highway portions)
        return baseTime * 1.08;
      }
    };

    // Detect water crossing between Batangas and Mindoro
    // Batangas branches: lat > 13.7
    // Mindoro branches: lat < 13.5
    const isBatangas = (lat) => lat > 13.7;
    const isMindoro = (lat) => lat < 13.5;
    
    const crossesWater = (isBatangas(userLoc.lat) && isMindoro(branchPos.lat)) ||
                         (isMindoro(userLoc.lat) && isBatangas(branchPos.lat));

    // Calculate base travel times and add realistic overhead
    const baseWalkingTime = distance / speeds.walking;
    const baseBicycleTime = distance / speeds.bicycle;
    const baseMotorcycleTime = distance / speeds.motorcycle;
    const baseCarTime = distance / speeds.car;

    const travelInfo = {
      distance: distance.toFixed(1),
      walking: formatTime(addOverhead(baseWalkingTime, distance)),
      bicycle: formatTime(addOverhead(baseBicycleTime, distance)),
      motorcycle: formatTime(addOverhead(baseMotorcycleTime, distance)),
      car: formatTime(addOverhead(baseCarTime, distance)),
      crossesWater: crossesWater
    };

    // Add ferry travel time if crossing water
    if (crossesWater) {
      // Ferry from Batangas to Calapan: ~2 hours actual crossing
      // Plus port waiting time (30 min) and land travel to/from ports
      const ferryTime = 2.0; // 2 hours for ferry crossing
      const portWaitTime = 0.5; // 30 minutes buffer for boarding/waiting
      // Estimate 30% of total distance is land travel (to/from ports)
      const estimatedLandDistance = distance * 0.3;
      const landTravelTime = addOverhead(estimatedLandDistance / speeds.car, estimatedLandDistance);
      travelInfo.ferry = formatTime(ferryTime + portWaitTime + landTravelTime);
    }

    return travelInfo;
  };

  const focusBranch = async (branch) => {
    setActiveId(branch.id);
    
    // Clear previous route first for smooth transition
    setRouteCoordinates([]);
    setTravelInfo(null);
    
    // Draw route line from user location to branch
    if (userLocation) {
      // Fetch route data and zoom in one smooth motion
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${branch.position.lng},${branch.position.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          // Get the route geometry and convert to Leaflet format
          const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Set route and zoom in one smooth motion
          setRouteCoordinates(routeCoords);
          
          if (mapRef.current && mapRef.current._loaded) {
            try {
              const bounds = L.latLngBounds([
                [userLocation.lat, userLocation.lng],
                [branch.position.lat, branch.position.lng]
              ]);
              mapRef.current.fitBounds(bounds, { 
                padding: [80, 80],
                maxZoom: 16,
                animate: true,
                duration: 2.0,
                easeLinearity: 0.05
              });
            } catch (error) {
              console.error('Error fitting bounds:', error);
            }
          }
          
          // Calculate travel information using actual distance from OSRM API
          const actualDistance = data.routes[0].distance / 1000; // Convert meters to km
          
          // Recalculate with actual road distance (more accurate than straight line)
          const speeds = {
            walking: 4.5,
            bicycle: 12,
            motorcycle: 35,
            car: 40
          };
          
          const addOverhead = (baseTime, distance) => {
            if (distance < 5) return baseTime * 1.15;
            else if (distance < 15) return baseTime * 1.10;
            else return baseTime * 1.08;
          };
          
          const formatTime = (hours) => {
            if (hours < 1) {
              return `${Math.round(hours * 60)} min`;
            } else {
              const hrs = Math.floor(hours);
              const mins = Math.round((hours - hrs) * 60);
              return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
            }
          };
          
          const info = {
            distance: actualDistance.toFixed(1),
            walking: formatTime(addOverhead(actualDistance / speeds.walking, actualDistance)),
            bicycle: formatTime(addOverhead(actualDistance / speeds.bicycle, actualDistance)),
            motorcycle: formatTime(addOverhead(actualDistance / speeds.motorcycle, actualDistance)),
            car: formatTime(addOverhead(actualDistance / speeds.car, actualDistance)),
            crossesWater: false // OSRM doesn't provide water routes
          };
          
          setTravelInfo(info);
        } else {
          // Fallback to straight line if routing fails
          const route = [
            [userLocation.lat, userLocation.lng],
            [branch.position.lat, branch.position.lng]
          ];
          setRouteCoordinates(route);
          
          // Calculate travel information using Haversine
          const info = calculateTravelInfo(userLocation, branch.position);
          setTravelInfo(info);
          
          // Fit map to show route
          if (mapRef.current && mapRef.current._loaded) {
            try {
              const bounds = L.latLngBounds([
                [userLocation.lat, userLocation.lng],
                [branch.position.lat, branch.position.lng]
              ]);
              mapRef.current.fitBounds(bounds, { 
                padding: [80, 80],
                maxZoom: 16,
                animate: true,
                duration: 2.0,
                easeLinearity: 0.05
              });
            } catch (error) {
              console.error('Error fitting bounds:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight line
        const route = [
          [userLocation.lat, userLocation.lng],
          [branch.position.lat, branch.position.lng]
        ];
        setRouteCoordinates(route);
        
        const info = calculateTravelInfo(userLocation, branch.position);
        setTravelInfo(info);
        
        // Fit map to show route
        if (mapRef.current && mapRef.current._loaded) {
          try {
            const bounds = L.latLngBounds([
              [userLocation.lat, userLocation.lng],
              [branch.position.lat, branch.position.lng]
            ]);
            mapRef.current.fitBounds(bounds, { 
              padding: [80, 80],
              animate: true,
              duration: 2.0,
              easeLinearity: 0.05
            });
          } catch (error) {
            console.error('Error fitting bounds fallback:', error);
          }
        }
      }
    } else {
      // If no user location, just zoom to branch with one smooth animation
      setTravelInfo(null);
      if (mapRef.current && mapRef.current._loaded) {
        try {
          mapRef.current.setView(branch.position, 15, { 
            animate: true, 
            duration: 2.0,
            easeLinearity: 0.05
          });
        } catch (error) {
          console.error('Error setting view:', error);
        }
      }
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

  const MapRefSetter = () => {
    const map = useMap();
    React.useEffect(() => {
      mapRef.current = map;
    }, [map]);
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
          
          {/* Left Column: Map + Travel Info */}
          <div className="yohanns-map-column">
          <MapContainer
            className="yohanns-map-container"
            center={branches[0].position}
            zoom={12}
            scrollWheelZoom={true}
          >
            <MapRefSetter />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds points={branches.map(b => b.position)} />

            {/* Route line from user to selected branch - Following actual roads */}
            {routeCoordinates.length > 0 && (
              <Polyline
                positions={routeCoordinates}
                color="#3b82f6"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* User location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="yohanns-info-window">
                    <div className="yohanns-info-window-title">Your Location</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {branches.map(branch => (
              <Marker
                key={branch.id}
                position={branch.position}
                icon={activeId === branch.id ? activeRedIcon : defaultIcon}
                eventHandlers={{
                  click: () => {
                    focusBranch(branch);
                  }
                }}
              >
                {activeId === branch.id ? (
                  <Popup
                    position={branch.position}
                    onClose={() => {
                      setActiveId(null);
                      setRouteCoordinates([]);
                      setTravelInfo(null);
                    }}
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

          {/* Travel Information Panel */}
          {travelInfo && userLocation && (
            <div className="yohanns-travel-info">
              <div className="travel-info-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00bfff" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="distance-value">{travelInfo.distance} km</span>
              </div>
              <div className="travel-info-modes">
                <div className="travel-mode">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <div className="mode-details">
                    <span className="mode-label">Walking</span>
                    <span className="mode-time">{travelInfo.walking}</span>
                  </div>
                </div>
                <div className="travel-mode">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <circle cx="5.5" cy="17.5" r="2.5"/>
                    <circle cx="18.5" cy="17.5" r="2.5"/>
                    <path d="M5 17h-.5a2.5 2.5 0 0 1 0-5H8m12 0l-4-7H8"/>
                  </svg>
                  <div className="mode-details">
                    <span className="mode-label">Bicycle</span>
                    <span className="mode-time">{travelInfo.bicycle}</span>
                  </div>
                </div>
                <div className="travel-mode">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12v6m14-6v6"/>
                    <circle cx="7" cy="19" r="2"/>
                    <circle cx="17" cy="19" r="2"/>
                  </svg>
                  <div className="mode-details">
                    <span className="mode-label">Motorcycle</span>
                    <span className="mode-time">{travelInfo.motorcycle}</span>
                  </div>
                </div>
                <div className="travel-mode">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                    <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                    <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/>
                  </svg>
                  <div className="mode-details">
                    <span className="mode-label">Car</span>
                    <span className="mode-time">{travelInfo.car}</span>
                  </div>
                </div>
                {travelInfo.crossesWater && (
                  <div className="travel-mode ferry-mode">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00bfff" strokeWidth="2">
                      <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"/>
                      <path d="M4 18l-1 -5h18l-1 5"/>
                      <path d="M5 13v-6h8l4 6"/>
                      <path d="M7 7v-4h2"/>
                    </svg>
                    <div className="mode-details">
                      <span className="mode-label">Ferry + Land</span>
                      <span className="mode-time">{travelInfo.ferry}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
          {/* End Map Column */}

          {/* Right Column: Branch List */}
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
