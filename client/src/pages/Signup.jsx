import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Checkbox } from 'antd';

const Signup = () => {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('https://healthhorizon-ecd7c8hvdqgxckhn.eastus-01.azurewebsites.net/api/Users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Registration successful');
        setIsError(false);
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setMessage(`Registration failed: ${result.message || 'Unknown error'}`);
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setIsError(true);
      console.error('Error:', error);
    }
  };

  const onChange = (e) => {
    console.log(`checked = ${e.target.checked}`);
  };

  return (
    <section className="register">
      <div className="container">
        <h2>Sign Up</h2>
        <form className="form register__form" onSubmit={handleSubmit}>
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
          <Input type="text" placeholder="Username" name="username" required />
          <Input type="email" placeholder="Email" name="email" required />
          <Input.Password
            placeholder="Password"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            name="password"
            required
          />
          <Input.Password
            placeholder="Confirm Password"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            name="confirmPassword"
            required
          />
          <Checkbox onChange={onChange}>I agree to the terms and conditions.</Checkbox>
          <button type="submit" className="btn primary">Register</button>
        </form>
        <small>Already have an account? <Link to="/login">Login</Link></small>
      </div>
    </section>
  );
};

export default Signup;
