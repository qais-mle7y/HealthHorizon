import React, { useState } from 'react';
import { AutoComplete, Input, DatePicker, Space, Select, TimePicker } from 'antd';
import {useChatbot} from './useChatbot';
import Chatbot from './ChatBot';

const BookingForm = () => {
  const [fullname, setFullname] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [clinics, setClinics] = useState([]);
  const [message, setMessage] = useState('');
  const chatbot = useChatbot();

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];
  
  const handleChange = (value) => {
    setGender(value);
  };

  const handleFindClinics = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // Debugging line console.log('Latitude:', latitude, 'Longitude:', longitude);

        // make an API request to a mapping service
        const response = await fetch(`https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/booking`);
        const data = await response.json();
        setClinics(data);
      }, (error) => {
        console.error('Error getting location:', error);
      });
    } else {
      console.error('Geolocation not supported by this browser.');
    }
  };

  const renderTitle = (title) => (
    <span>
      {title}
    </span>
  );


  const locations = [];


  const [size, setSize] = useState('middle');
  const handleSizeChange = (e) => {
    setSize(e.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Process form submission
    // Debugging line console.log({
    //   fullname,
    //   date,
    //   time,
    //   gender,
    //   location,
    // });
    setMessage('Booked successfully');
  };

  return (
    <section className="book">
      <div className="container">
        <h2>Book a Consultation</h2>
        <form className="form booking__form" onSubmit={handleSubmit}>
        {message && (
            <p
              className="form__error-message"
              style={{
                backgroundColor: 'green',
                color: 'var(--color-white)',
              }}
            >
              {message}
            </p>
          )}
          <Input type="text" placeholder="Full Name" value={fullname} style={{ width: 395 }} onChange={(e) => setFullname(e.target.value)} required />
          <Space direction="vertical">
            <DatePicker style={{ width: 395 }} />
          </Space>
          <Space>
            <TimePicker style={{ width: 395 }} />
          </Space>

          <Select
            size={size}
            onChange={handleChange}
            style={{
              width: 300,
            }}
            options={genderOptions}
            value={gender} 
            placeholder="Select Gender" 
            required
          />
          <AutoComplete
            popupClassName="certain-category-search-dropdown"
            popupMatchSelectWidth={500}
            style={{
              width: 300,
            }}
            options={locations}
            size="large"
          >
            <Input.Search size="medium" placeholder="Find nearby hospitals or clinics" />
          </AutoComplete>
          <button type="submit" className="btn primary">Submit Booking</button>
        </form>
        {clinics.length > 0 && (
          <div className="clinics-list">
            <h3>Nearby Clinics:</h3>
            <ul>
              {clinics.map((clinic, index) => (
                <li key={index}>{clinic}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="chatbot-home">
        <Chatbot {...chatbot} />
      </div>
      
    </section>
  );
};

export default BookingForm;
