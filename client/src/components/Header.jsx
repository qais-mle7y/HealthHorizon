import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { MdOutlineClose, MdMenu } from "react-icons/md";

const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUserDetails = async (token) => {
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
        const errorText = await response.text();
        console.error('Failed to fetch user details:', response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log('Fetched user data:', data); // Debugging line
      setUser(data); // Assuming 'data' contains 'username' and 'userId'
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  useEffect(() => {
    const token = Cookies.get('authToken');
    fetchUserDetails(token);
  }, [Cookies.get('authToken')]); // This line might cause issues as `Cookies.get('authToken')` can change frequently

  const handleLogout = () => {
    Cookies.remove('authToken');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav>
      <div className="container nav__container">
        <Link to="/" className="nav__logo"><h1>HealthHorizon</h1></Link>
        <ul className={`nav__menu ${isMenuOpen ? 'open' : ''}`}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/map">Analytics</Link></li>
          <li><Link to="/chatbot">Chat</Link></li>
          <li><Link to="/diagnosis">Report Diagnosis</Link></li>
          {user ? (
            <li className="nav__item profile__dropdown">
              <Link to="#" className="nav__link username">{user.userName || 'User'}</Link>
              <ul className="dropdown-menu">
                <li><Link to={`/profile/${user.userId}`}>Account Management</Link></li>
                <li className="no-hover"><button className="btn danger" onClick={handleLogout}>Log out</button></li>
              </ul>
            </li>
          ) : (
            <li><Link to="/login" className="btn"><i className="fas fa-user"></i> Log in</Link></li>
          )}
        </ul>
        <button className="nav__toggle-btn" onClick={toggleMenu}>
          {isMenuOpen ? <MdOutlineClose /> : <MdMenu />}
        </button>
      </div>
    </nav>
  );
};

export default Header;
