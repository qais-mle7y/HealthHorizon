import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Select } from 'antd';
import Cookies from 'js-cookie';

const Diagnosis = () => {
  const [userId, setUserId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [size, setSize] = useState('middle');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = Cookies.get('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      try {
        const response = await fetch('https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/Users/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const text = await response.text(); // Read the response body as text
          console.error('Failed to fetch user details:', response.status, text);
          setMessage('Failed to fetch user details. Please try again.');
          setIsError(true);
          return;
        }

        const data = await response.json(); // Try parsing the response as JSON
        setUserId(data.userId); // Set the userId in the state
        console.log('User details:', data);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setMessage('Error fetching user details. Please try again.');
        setIsError(true);
      }
    };

    fetchUserDetails();
  }, []);


  const diagnosisOptions = [
    { value: "HIV-AIDS", label: 'HIV-AIDS' },
    { value: "Tuberculosis", label: 'Tuberculosis' },
    { value: "Malaria", label: 'Malaria' },
    { value: "COVID-19", label: 'COVID-19' },
    { value: "Cholera", label: 'Cholera' },
    { value: "Ebola", label: 'Ebola' },
    { value: "Zika", label: 'Zika' },
    { value: "Measles", label: 'Measles' },
    { value: "Mumps", label: 'Mumps' },
    { value: "Rubella", label: 'Rubella' },
    { value: "Hepatitis A", label: 'Hepatitis A' },
    { value: "Hepatitis B", label: 'Hepatitis B' },
    { value: "Hepatitis C", label: 'Hepatitis C' },
    { value: "Dengue", label: 'Dengue' },
    { value: "Yellow Fever", label: 'Yellow Fever' },
    { value: "Polio", label: 'Polio' },
    { value: "Other", label: 'Other' }
  ];
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        document.getElementById('latitude').value = position.coords.latitude;
        document.getElementById('longitude').value = position.coords.longitude;
      }, (error) => {
        console.error('Error getting location:', error);
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);


  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
  
    // Ensure data contains the correct keys and values
    if (userId) {
      data.userId = userId; // Use userId from state
    } else {
      console.error('UserId is not set');
      setMessage('UserId is not set. Please try again.');
      setIsError(true);
      return;
    }
    data.diagnosisName = diagnosis; // Use the diagnosis state
    data.latitude = document.getElementById('latitude').value;
    data.longitude = document.getElementById('longitude').value;
  
    console.log('Data to be sent:', data);
  
    try {
      const response = await fetch('https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/Diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
      if (response.ok) {
        setMessage('Successfully reported diagnosis');
        setIsError(false);
      } else {
        setMessage(`Report diagnosis failed: ${result.message || 'Unknown error'}`);
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setIsError(true);
      console.error('Error:', error);
    }
  };
  
  const handleChange = (value) => {
    setDiagnosis(value);
  };

  return (
    <section className="diagnosis">
      <div className="container">
        <h2>Report Diagnosis</h2>
        <form className="form diagnosis__form" id="diagnosisForm" onSubmit={handleSubmit}>
          {message && (
            <p
              className="form__error-message"
              style={{
                backgroundColor: isError ? 'var(--color-red)' : 'green', // Background color based on error state
                color: 'var(--color-white)', // Text color
              }}
            >
              {message}
            </p>
          )}
          <label htmlFor="DiagnosisName">Diagnosis Name</label>
          <Select
            size={size}
            onChange={handleChange}
            options={diagnosisOptions}
            value={diagnosis}
            name= 'diagnosisname'
            required
          />
          <label htmlFor="DiagnosisDate">Diagnosis Date</label>
          <DatePicker name='dateofDiagnosis'/>
          <input type="text" name="latitude" id="latitude" required readOnly hidden />
          <input type="text" name="longitude" id="longitude" required readOnly hidden />
          <button type="submit" className="btn primary">Submit</button>
        </form>
        <div id="message"></div>
      </div>
    </section>
  );
};

  export default Diagnosis;

