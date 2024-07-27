import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { Select } from 'antd';
import Cookies from 'js-cookie';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';


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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4444', '#FF8888'];  
const CustomLegend = ({ payload }) => (
  <ul style={{ display: 'flex', flexWrap: 'wrap', listStyleType: 'none', margin:10 }}>
    {payload.map((entry, index) => (
      <li key={`item-${index}`} style={{ color: entry.color, marginBottom: 4 }}>
        <span style={{ fontWeight: 'bold' }}>{entry.value}</span>: {entry.payload.percent}%
      </li>
    ))}
  </ul>
);


const MyPieChart = ({ pieData }) => {
  const total = pieData.reduce((acc, entry) => acc + entry.value, 0);
  const pieDataWithPercent = pieData.map((entry) => ({
    ...entry,
    percent: ((entry.value / total) * 100).toFixed(0),
  }));

  return (
    <PieChart width={400} height={400}>
     <Legend verticalAlign='top' content={<CustomLegend />} />
      <Pie
        data={pieDataWithPercent}
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={120}
        fill="#8884d8"
        dataKey="value"
      >
        {pieDataWithPercent.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />

    </PieChart>
  );
};

const MapPage = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState('HIV-AIDS');
  const [cityData, setCityData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersRef = useRef([]);

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
      mapInstanceRef.current = L.map(mapRef.current).setView([-28.4793, 24.6727], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      const thumbtackIcon = L.icon({
        iconUrl: 'src/assets/map-marker.svg', // Path to your thumbtack image
        iconSize: [32, 32], // Size of the icon
        iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
      });

      L.marker([-28.4793, 24.6727]).addTo(mapInstanceRef.current)
      .bindPopup('Center of South Africa')
      .openPopup();
    }

    if (heatmapData.length === 0) {
      return;
    }

    // Clear existing layers
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

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

    clusteredData.forEach(point => {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 2,
        fillColor: "#FF0000",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapInstanceRef.current);


      markersRef.current.push(marker);
    });



    const aggregatedCityData = aggregateDataByCity(clusteredData);
    setCityData(aggregatedCityData);

    const sortedData = aggregatedCityData.sort((a, b) => b.count - a.count);
    const top5Data = sortedData.slice(0, 5);
    const otherData = sortedData.slice(5).reduce((acc, cur) => acc + cur.count, 0);
    const pieChartData = [
      ...top5Data.map(city => ({
        name: city.city,
        value: city.count
      })),
      { name: 'Other', value: otherData }
    ];
    setPieData(pieChartData);

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
          <p className="text">The red dot represents a reported diagnosis which can lead to an outbreak</p>
        </div>
        <div className="city-data">
          <h3>Top 5 cities by {selectedDisease} Cases</h3>
          <div className="pie-chart-wrapper">
            <MyPieChart pieData={pieData} />
          </div>

          <h3>{selectedDisease} cases per city or town</h3>

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
