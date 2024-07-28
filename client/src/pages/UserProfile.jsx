import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from 'antd';
import Cookies from 'js-cookie';
import Chatbot from './ChatBot';
import { useChatbot } from './useChatbot';

const UserProfile = () => {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const chatbot = useChatbot;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Construct the payload only with necessary fields
    const payload = {
      name: data.name,
      email: data.email,
      password: data.newPassword ? data.newPassword : undefined, // Include only if a new password is provided
    };

    // Remove the password field if it is not provided
    if (!payload.password) {
      delete payload.password;
    }

    console.log('Payload:', payload);

    try {
      const token = Cookies.get('authToken');
      if (!token) {
        setMessage('No authentication token found. Please log in again.');
        setIsError(true);
        return;
      }

      console.log('Authorization token:', token); // Log the token for debugging

      const response = await fetch('https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/Users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('Content-Type');

      let result;
      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          result = await response.json(); // PARSE JSON RESPONSE
        } else {
          result = await response.text(); // PARSE TEXT RESPONSE
        }
        setMessage('Profile updated successfully');
        setIsError(false);
      } else {
        let errorText;
        if (contentType && contentType.includes('application/json')) {
          errorText = await response.json(); // PARSE JSON ERROR RESPONSE
          setMessage(`Profile update failed: ${errorText.message || 'Unknown error'}`);
        } else {
          errorText = await response.text(); // PARSE TEXT ERROR RESPONSE
          setMessage(`Profile update failed: ${errorText}`);
        }
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setIsError(true);
      console.error('Error:', error);
    }
  };

  return (
    <section className="profile">
      <div className="container">
        <h2>Account Management</h2>
        <form className="form profile__form" onSubmit={handleSubmit}>
          {message && (
            <p
              className="form__error-message"
              style={{
                backgroundColor: isError ? 'var(--color-red)' : 'green',
                color: 'var(--color-white)',
              }}
            >
              {message}
            </p>
          )}
          <Input type="text" placeholder="Full Name" name="name" required />
          <Input type="email" placeholder="Email" name="email" required />
          <Input.Password
            placeholder="Current Password"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            name="currentPassword"
            required
          />
          <Input.Password
            placeholder="New Password"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            name="newPassword"
          />
          <Input.Password
            placeholder="Confirm New Password"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            name="confirmNewPassword"
          />
          <button type="submit" className="btn primary">Update details</button>
        </form>
      </div>
      <div className="chatbot-home">
        <Chatbot {...chatbot} />
      </div>
    </section>
  );
}

export default UserProfile;
