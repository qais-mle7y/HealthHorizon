import React from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import {useChatbot} from './useChatbot';
import Chatbot from './ChatBot';

const Home = () => {
  // Check if the user is logged in based on a cookie
  const isLoggedIn = Cookies.get('authToken');
  const chatbot = useChatbot();

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-heading textbig">Welcome to HealthHorizon,</h1>
          <h1 className="hero-text">Your one-stop for all your health needs!</h1>
          <p className="hero-text">Consult with doctors, stay informed about potential outbreaks, and report diagnoses to help update our heat map.</p>
          <div className="btns">
            {/* Conditionally render the "Get Started" button */}
            {!isLoggedIn && <Link to="/signup" className="btn">Get Started</Link>}
            <Link to="/booking" className="btn">Book a Consultation</Link>
          </div>
          <div className="chatbot-home">
            <Chatbot {...chatbot} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
