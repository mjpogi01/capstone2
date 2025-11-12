import React from 'react';
import './Branches.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faWalking, 
  faBicycle, 
  faMotorcycle, 
  faCar, 
  faShip,
  faStore,
  faRoute
} from '@fortawesome/free-solid-svg-icons';

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
  },
  {
    id: 9,
    name: 'ROSARIO BRANCH',
    address: 'Brgy. D, Rosario, Batangas, Rosario, Philippines',
    position: { lat: 13.8478, lng: 121.2039 },
    gmaps: createGMapsLink('Brgy. D, Rosario, Batangas, Rosario, Philippines')
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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll('.branches-container .reveal:not(.is-visible)');

    if (!elements.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activeId, travelInfo]);

  // Get user's current location on component mount with improved accuracy
  React.useEffect(() => {
    if (navigator.geolocation) {
      // Use watchPosition for continuous updates and better accuracy
      let watchId = null;
      
      const getAccurateLocation = () => {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const accuracy = position.coords.accuracy; // Accuracy in meters
            
            // Only use location if accuracy is reasonable (less than 500 meters)
            if (accuracy && accuracy < 500) {
              const userPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setUserLocation(userPos);
              
              // Stop watching once we have accurate location
              if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
              }
            }
          },
          (error) => {
            console.log('Geolocation error:', error);
            
            // Fallback: Try getCurrentPosition with longer timeout
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userPos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setUserLocation(userPos);
              },
              (fallbackError) => {
                console.log('Unable to get user location:', fallbackError);
                // Fallback to Batangas City center if location access fails
                // Batangas City center coordinates (more accurate)
                const batangasCityCenter = {
                  lat: 13.7563,
                  lng: 121.0583
                };
                console.log('Using fallback location: Batangas City center', batangasCityCenter);
                setUserLocation(batangasCityCenter);
              },
              { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 60000 
              }
            );
          },
          { 
            enableHighAccuracy: true, 
            timeout: 20000, 
            maximumAge: 0 
          }
        );
      };
      
      // Also try getCurrentPosition as initial attempt
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          if (accuracy && accuracy < 500) {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(userPos);
          } else {
            // If initial position not accurate enough, start watching
            getAccurateLocation();
          }
        },
        (error) => {
          console.log('Initial geolocation failed, trying watchPosition:', error);
          getAccurateLocation();
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 
        }
      );
      
      // Cleanup watch on unmount
      return () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    } else {
      // Fallback to Batangas City center if geolocation not supported
      // Batangas City center coordinates (City Hall area)
      const batangasCityCenter = {
        lat: 13.7563,
        lng: 121.0583
      };
      console.log('Geolocation not supported, using Batangas City center', batangasCityCenter);
      setUserLocation(batangasCityCenter);
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

  // Center map on user location when it's detected
  const CenterOnUserLocation = () => {
    const map = useMap();
    React.useEffect(() => {
      if (userLocation && map && map._loaded && !activeId) {
        // Center map on user location with appropriate zoom
        map.setView([userLocation.lat, userLocation.lng], 14, {
          animate: true,
          duration: 1.5
        });
      }
    }, [userLocation, map]);
    return null;
  };

  return (
    <section id="branches" className="branches-container">
      <div className="branches-wrapper">
        <div className="branches-hero reveal">
          <h1 className="branches-title page-title reveal">Our Branches</h1>
          <p className="branches-subtitle reveal reveal-delay-1">Find the nearest Yohann's Sportswear House branch on the map.</p>
        </div>
        
        <div className="branches-content">
          <div className="branches-layout">
          
          {/* Left Column: Map + Travel Info */}
          <div className="branches-map-column reveal">
          <div className="branches-map-wrapper reveal reveal-delay-1">
          <MapContainer
            className="branches-map"
            center={userLocation || branches.find(b => b.name === 'BATANGAS CITY BRANCH')?.position || branches[0].position}
            zoom={userLocation ? 14 : 12}
            scrollWheelZoom={true}
          >
            <MapRefSetter />
            <CenterOnUserLocation />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Only fit bounds to branches if user location is not available */}
            {!userLocation && <FitBounds points={branches.map(b => b.position)} />}

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
                  <div className="branches-popup-content">
                    <div className="branches-popup-title">Your Location</div>
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
                    <div className="branches-popup-content">
                      <div className="branches-popup-title">{branch.name}</div>
                      <div className="branches-popup-address">{branch.address}</div>
                      <div className="branches-popup-badge">
                        <FontAwesomeIcon icon={faStore} style={{ color: '#00bfff', fontSize: '14px' }} />
                        <span className="branches-popup-badge-text">Yohann's Sportswear House</span>
                      </div>
                      <button
                        onClick={() => getDirectionsTo(branch)}
                        disabled={isRouting}
                        className="branches-directions-button"
                      >
                        {isRouting ? 'Getting Directions...' : 'Get Directions'}
                      </button>
                    </div>
                  </Popup>
                ) : null}
              </Marker>
            ))}
          </MapContainer>
          </div>
          {/* End Map Wrapper */}

          {/* Travel Information Panel */}
          {travelInfo && userLocation && (
            <div className="branches-travel-info reveal reveal-delay-2">
              <div className="branches-travel-header">
                <FontAwesomeIcon icon={faRoute} style={{ color: '#00bfff', fontSize: '20px' }} />
                <span className="branches-travel-distance">{travelInfo.distance} km</span>
              </div>
              <div className="branches-travel-modes">
                <div className="branches-travel-mode">
                  <FontAwesomeIcon icon={faWalking} style={{ color: '#ffffff', fontSize: '18px' }} />
                  <div className="branches-travel-mode-details">
                    <span className="branches-travel-mode-label">Walking</span>
                    <span className="branches-travel-mode-time">{travelInfo.walking}</span>
                  </div>
                </div>
                <div className="branches-travel-mode">
                  <FontAwesomeIcon icon={faBicycle} style={{ color: '#ffffff', fontSize: '18px' }} />
                  <div className="branches-travel-mode-details">
                    <span className="branches-travel-mode-label">Bicycle</span>
                    <span className="branches-travel-mode-time">{travelInfo.bicycle}</span>
                  </div>
                </div>
                <div className="branches-travel-mode">
                  <FontAwesomeIcon icon={faMotorcycle} style={{ color: '#ffffff', fontSize: '18px' }} />
                  <div className="branches-travel-mode-details">
                    <span className="branches-travel-mode-label">Motorcycle</span>
                    <span className="branches-travel-mode-time">{travelInfo.motorcycle}</span>
                  </div>
                </div>
                <div className="branches-travel-mode">
                  <FontAwesomeIcon icon={faCar} style={{ color: '#ffffff', fontSize: '18px' }} />
                  <div className="branches-travel-mode-details">
                    <span className="branches-travel-mode-label">Car</span>
                    <span className="branches-travel-mode-time">{travelInfo.car}</span>
                  </div>
                </div>
                {travelInfo.crossesWater && (
                  <div className="branches-travel-mode branches-travel-mode-ferry">
                    <FontAwesomeIcon icon={faShip} style={{ color: '#00bfff', fontSize: '18px' }} />
                    <div className="branches-travel-mode-details">
                      <span className="branches-travel-mode-label">Ferry + Land</span>
                      <span className="branches-travel-mode-time">{travelInfo.ferry}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
          {/* End Map Column */}

          {/* Right Column: Branch List */}
          <div className="branches-list-wrapper reveal reveal-delay-2">
            {branches.map((branch, index) => (
              <div 
                key={branch.id} 
                className={`branches-item ${activeId === branch.id ? 'branches-item-active' : ''}`}
                onClick={() => focusBranch(branch)}
              >
                <div className="branches-item-content">
                  <div className="branches-item-name">{branch.name}</div>
                  <div className="branches-item-address">{branch.address}</div>
                  {activeId === branch.id ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); getDirectionsTo(branch); }}
                      disabled={isRouting}
                      className="branches-directions-button"
                    >
                      {isRouting ? 'Getting Directions...' : 'Get Directions'}
                    </button>
                  ) : null}
                </div>
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
