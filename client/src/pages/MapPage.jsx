import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { Select } from 'antd';
import Cookies from 'js-cookie';
import axios from 'axios';

const { Option } = Select;

const clusterDataPoints = (data, proximityThreshold = 0.01) => {
  const clusters = [];
  data.forEach(point => {
    let addedToCluster = false;
    for (let cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow(point.latitude - cluster.latitude, 2) + Math.pow(point.longitude - cluster.longitude, 2)
      );
      if (distance <= proximityThreshold) {
        cluster.latitude = (cluster.latitude * cluster.count + point.latitude) / (cluster.count + 1);
        cluster.longitude = (cluster.longitude * cluster.count + point.longitude) / (cluster.count + 1);
        cluster.count += point.count;
        addedToCluster = true;
        break;
      }
    }
    if (!addedToCluster) {
      clusters.push({ ...point });
    }
  });
  return clusters;
};

const aggregateDataByCity = (data) => {
  const cityDataMap = new Map();

  data.forEach(point => {
    const cityKey = point.city;

    if (cityDataMap.has(cityKey)) {
      const existingData = cityDataMap.get(cityKey);
      existingData.count += point.count;
    } else {
      cityDataMap.set(cityKey, { city: point.city, latitude: point.latitude, longitude: point.longitude, count: point.count });
    }
  });

  return Array.from(cityDataMap.values());
};

const MapPage = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState('HIV-AIDS');
  const [cityData, setCityData] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);

  const diagnosisOptions = [
    "HIV-AIDS", "Tuberculosis", "Malaria", "COVID-19", "Cholera",
    "Ebola", "Zika", "Measles", "Mumps", "Rubella",
    "Hepatitis A", "Hepatitis B", "Hepatitis C", "Dengue", "Yellow Fever", "Polio", "Other"
  ];

  useEffect(() => {
    const fetchHeatmapData = async (disease) => {
      const token = Cookies.get('authToken');
      try {
        console.log(`Fetching heatmap data for disease: ${disease}`);
        const response = await axios.get(`https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/Diagnosis/heatmap`, {
          params: { disease },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.status === 200) {
          console.log('Heatmap data:', response.data);
          const dataWithCities = await Promise.all(response.data.map(async point => {
            const city = await getCityName(point.latitude, point.longitude);
            return { ...point, city };
          }));
          setHeatmapData(dataWithCities);
        } else {
          console.error('Failed to fetch heatmap data:', response.status);
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error.response ? error.response.data : error.message);
      }
    };

    fetchHeatmapData(selectedDisease);
  }, [selectedDisease]);

  useEffect(() => {
    if (mapInstanceRef.current === null) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-30.5595, 22.9375], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    if (heatmapData.length === 0) {
      return;
    }

    // Clear existing layers
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }

    const clusteredData = clusterDataPoints(heatmapData);
    const maxCount = Math.max(...clusteredData.map(item => item.count));
    const scalingFactor = 5;
    const minIntensity = 0.1;

    const transformedHeatmapData = clusteredData
      .filter(item => item.latitude !== undefined && item.longitude !== undefined && !isNaN(item.latitude) && !isNaN(item.longitude))
      .map(item => {
        let intensity = (item.count / maxCount);
        intensity = intensity * scalingFactor;
        intensity = Math.max(intensity, minIntensity);
        intensity = Math.min(intensity, 1);
        return [item.latitude, item.longitude, intensity];
      });

    heatLayerRef.current = L.heatLayer(transformedHeatmapData, {
      radius: 50,
      blur: 35,
      maxZoom: 10,
      gradient: {
        0.1: 'blue',
        0.3: 'lime',
        0.5: 'yellow',
        0.7: 'orange',
        1.0: 'red'
      }
    }).addTo(mapInstanceRef.current);

    const aggregatedCityData = aggregateDataByCity(clusteredData);
    setCityData(aggregatedCityData);

  }, [heatmapData]);

  const getCityName = async (latitude, longitude) => {
    try {
      const apiKey = ''; // Store your Google Maps API Key in environment variables
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${latitude},${longitude}`,
          key: apiKey
        }
      });
      const addressComponents = response.data.results[0].address_components;
      const cityComponent = addressComponents.find(component => component.types.includes('locality'));
      return cityComponent ? cityComponent.long_name : 'Unknown';
    } catch (error) {
      console.error('Error fetching city name:', error.response ? error.response.data : error.message);
      return "Unknown";
    }
  };

  const handleDiseaseChange = (value) => {
    setSelectedDisease(value);
  };

  return (
    <div className="map-page">
      <h2 className="page-title">Analytics</h2>
      <div className="select-container">
        <label htmlFor="DiagnosisName">Please select what diagnosis data are you looking for: </label>
        <Select defaultValue={selectedDisease} style={{ width: 200 }} onChange={handleDiseaseChange}>
          {diagnosisOptions.map(disease => (
            <Option key={disease} value={disease}>{disease}</Option>
          ))}
        </Select>
      </div>
      <div className="content">
        <div className="map-container">
          <div id="map" ref={mapRef} className="map"></div>
        </div>
        <div className="city-data">
          <h3>City Data</h3>
          {cityData.length === 0 ? (
            <div className="loading">Loading city data...</div>
          ) : (
            <ul>
              {cityData.map((city, index) => (
                <li key={index}>
                  {city.city}: {city.count} {city.count === 1 ? 'case' : 'cases'}
                </li>

              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

};

export default MapPage;
