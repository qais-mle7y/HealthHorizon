import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Diagnosis from './pages/Diagnosis';
import MapPage from './pages/MapPage';
import BookingForm from './pages/BookingForm';
import UserProfile from './pages/UserProfile';
import ChatBot from './pages/ChatBot';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="diagnosis" element={<Diagnosis />} />
        <Route path="map" element={<MapPage />} />
        <Route path="booking" element={<BookingForm />} />
        <Route path="profile/:id" element={<UserProfile />} />
        <Route path="/ChatBot" element={<ChatBot/>} />
      </Route>
    </Routes>
  </Router>
);
