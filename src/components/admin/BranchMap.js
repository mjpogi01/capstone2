import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { FaMap, FaUsers } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './BranchMap.css';
import { API_URL } from '../../config/api';
import { authFetch } from '../../services/apiClient';

// Fix for default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to fit map bounds
function FitBounds({ points }) {
  const map = useMap();
  
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = points.map(point => [point[0], point[1]]);
      const boundsGroup = L.latLngBounds(bounds);
      map.fitBounds(boundsGroup, { padding: [50, 50] });
    }
  }, [map, points]);
  
  return null;
}

const BranchMap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [cityStats, setCityStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerLocations();
  }, []);

  const fetchCustomerLocations = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_URL}/api/analytics/customer-locations`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setHeatmapData(data.data);
          setCityStats(data.cityStats || []);
          console.log(`✅ Loaded ${data.data.length} customer location points`);
        }
      } else {
        console.log('⚠️ API returned error, using demo data');
        loadDemoData();
      }
    } catch (error) {
      console.error('Error fetching customer locations:', error);
      console.log('⚠️ Using demo data due to error');
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    // Demo customer distribution
    const cityCoordinates = {
      'Batangas City': [13.7563, 121.0583],
      'Lipa': [13.9411, 121.1631],
      'Tanauan': [14.0886, 121.1494],
      'Bauan': [13.7918, 121.0073],
      'San Pascual': [13.8037, 121.0132],
      'Calaca': [13.9289, 120.8113],
      'Lemery': [13.8832, 120.9139],
      'Calapan': [13.4124, 121.1766],
      'Rosario': [13.8460, 121.2070],
      'San Luis': [13.8559, 120.9405],
      'Pinamalayan': [13.0350, 121.4847],
      'Santo Tomas': [14.1069, 121.1392],
      'Taal': [13.8797, 120.9231],
      'Balayan': [13.9367, 120.7325],
      'Nasugbu': [14.0678, 120.6319],
      'Taysan': [13.8422, 121.0561],
      'Alitagtag': [13.8789, 121.0033]
    };

    const demoCities = {
      'Batangas City': 45,
      'Lipa': 32,
      'Tanauan': 28,
      'Bauan': 18,
      'San Pascual': 15,
      'Calaca': 12,
      'Lemery': 10,
      'Calapan': 25,
      'Rosario': 8,
      'San Luis': 6,
      'Pinamalayan': 14,
      'Santo Tomas': 9,
      'Taal': 7,
      'Balayan': 5,
      'Nasugbu': 11,
      'Taysan': 4,
      'Alitagtag': 3
    };

    const heatmapData = [];
    const cityStats = [];

    Object.keys(demoCities).forEach(cityName => {
      const count = demoCities[cityName];
      const coords = cityCoordinates[cityName];
      
      if (coords) {
        cityStats.push({
          city: cityName,
          province: cityName === 'Calapan' || cityName === 'Pinamalayan' ? 'Oriental Mindoro' : 'Batangas',
          count
        });

        for (let i = 0; i < count; i++) {
          const latOffset = (Math.random() - 0.5) * 0.02;
          const lngOffset = (Math.random() - 0.5) * 0.02;
          heatmapData.push([coords[0] + latOffset, coords[1] + lngOffset, 1]);
        }
      }
    });

    setHeatmapData(heatmapData);
    setCityStats(cityStats.sort((a, b) => b.count - a.count));
    console.log(`✅ Loaded ${heatmapData.length} demo customer location points`);
  };

  if (loading) {
    return (
      <div className="branch-map-loading">
        <div className="loading-spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  // Calculate map center (centered on Batangas region)
  const mapCenter = [13.7563, 121.0583]; // Batangas City coordinates
  const mapZoom = 9;

  return (
    <div className="branch-map-container">
      <div className="branch-map-header">
        <h3>
          <FaUsers className="header-icon" />
          Customer Locations
        </h3>
        <p>Each red dot represents a customer location</p>
      </div>
      
      <div className="branch-map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '600px', width: '100%', borderRadius: '12px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds points={heatmapData} />
          
          {/* Render red dots for each customer location */}
          {heatmapData.map((point, index) => (
            <CircleMarker
              key={index}
              center={[point[0], point[1]]}
              radius={4}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#dc2626',
                fillOpacity: 0.8,
                weight: 1
              }}
            />
          ))}
          
        </MapContainer>
      </div>
      
      {/* Customer Statistics */}
      <div className="branch-map-legend">
        <h4>Top Customer Cities</h4>
        <div className="legend-items">
          {cityStats.slice(0, 10).map((stat, index) => (
            <div key={index} className="legend-item">
              <div className="legend-marker" style={{
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
              }}></div>
              <span className="legend-city">{stat.city}</span>
              <span className="legend-count">({stat.count} customers)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchMap;
