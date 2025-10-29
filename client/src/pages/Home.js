import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Get It</h1>
        <p>Your modern ride-hailing solution - Get rides instantly!</p>
        <div className="hero-buttons">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-success">Register</Link>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>For Riders</h3>
          <p>Book rides instantly with real-time tracking</p>
          <ul>
            <li>Quick and easy booking</li>
            <li>Real-time driver tracking</li>
            <li>Multiple payment options</li>
            <li>Safe and secure rides</li>
          </ul>
        </div>

        <div className="feature-card">
          <h3>For Drivers</h3>
          <p>Earn money on your own schedule</p>
          <ul>
            <li>Flexible working hours</li>
            <li>Fair earnings</li>
            <li>Easy-to-use driver app</li>
            <li>24/7 support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
