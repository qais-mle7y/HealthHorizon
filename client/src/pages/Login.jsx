import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Checkbox } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import {useChatbot} from './useChatbot';
import Chatbot from './ChatBot';

const Login = () => {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // State for "Remember Me"
  const navigate = useNavigate();
  const chatbot = useChatbot();

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/Users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', 
      });

      let result = {};
      if (response.ok) {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};

        const token = result.token;
        if (token) {
          // Set the token as a cookie
          const cookieOptions = rememberMe ? { expires: 7 } : undefined; // Set expiration if "Remember Me" is checked
          Cookies.set('authToken', token, cookieOptions);
        } else {
          console.error('Token is undefined:', result);
        }

        setMessage('Login successful');
        setIsError(false);
        setTimeout(() => navigate('/'), 1000);
      } else {
        result = await response.json().catch(() => ({}));
        setMessage(`Login failed: ${result.message || 'Unknown error'}`);
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setIsError(true);
      console.error('Error:', error);
    }
  };

  return (
    <section className="login">
      <div className="container">
        <h2>Login</h2>
        <form className="form login__form" onSubmit={handleSubmit}>
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
          <Input
            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="text"
            placeholder="Username"
            name="username"
            required
          />
          <Input.Password
            placeholder="Password"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            name="password"
            required
          />
          <Checkbox onChange={handleRememberMeChange}>Remember me</Checkbox>
          <button type="submit" className="btn primary">Login</button>
        </form>
        <small>Don't have an account? <Link to="/signup">Sign Up</Link></small>
      </div>
      <div className="chatbot-home">
        <Chatbot {...chatbot} />
      </div>
    </section>
  );
};

export default Login;
