import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './Dashboard.css';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join', { userId: user._id, userType: 'driver' });

    // Listen for ride requests
    newSocket.on('newRideRequest', (data) => {
      console.log('New ride request:', data);
      setRideRequests(prev => [...prev, data]);
      alert('New ride request received!');
    });

    newSocket.on('rideStatusUpdate', (data) => {
      console.log('Ride status update:', data);
      fetchCurrentRide();
    });

    newSocket.on('rideCancelled', (data) => {
      console.log('Ride cancelled:', data);
      setCurrentRide(null);
      alert('Ride was cancelled');
    });

    fetchDriverProfile();
    fetchCurrentRide();
    fetchRideHistory();
    fetchEarnings();

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  const fetchDriverProfile = async () => {
    try {
      const response = await axios.get('/api/drivers/profile');
      setIsAvailable(response.data.data.isAvailable);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCurrentRide = async () => {
    try {
      const response = await axios.get('/api/drivers/current-ride');
      setCurrentRide(response.data.data);
    } catch (error) {
      console.error('Error fetching current ride:', error);
    }
  };

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get('/api/drivers/rides');
      setRideHistory(response.data.data);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await axios.get('/api/drivers/earnings');
      setEarnings(response.data.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      await axios.put('/api/drivers/availability');
      setIsAvailable(!isAvailable);
    } catch (error) {
      alert('Error toggling availability: ' + (error.response?.data?.message || error.message));
    }
  };

  const acceptRide = async (rideId) => {
    try {
      const response = await axios.post(`/api/rides/${rideId}/accept`);
      setCurrentRide(response.data.data);
      setRideRequests(prev => prev.filter(r => r.rideId !== rideId));
      alert('Ride accepted successfully!');
    } catch (error) {
      alert('Error accepting ride: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateRideStatus = async (status) => {
    if (!currentRide) return;

    try {
      await axios.put(`/api/rides/${currentRide._id}/status`, { status });
      fetchCurrentRide();
      if (status === 'completed') {
        fetchRideHistory();
        fetchEarnings();
        alert('Ride completed successfully!');
      }
    } catch (error) {
      alert('Error updating ride status: ' + (error.response?.data?.message || error.message));
    }
  };

  const cancelRide = async () => {
    if (!currentRide) return;

    try {
      await axios.post(`/api/rides/${currentRide._id}/cancel`, {
        reason: 'Driver cancelled'
      });
      setCurrentRide(null);
      fetchRideHistory();
      alert('Ride cancelled');
    } catch (error) {
      alert('Error cancelling ride: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Driver Dashboard</h2>
        <div>
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card">
          <h3>Status</h3>
          <div className="status-toggle">
            <p>You are currently: <strong>{isAvailable ? 'AVAILABLE' : 'OFFLINE'}</strong></p>
            <button
              onClick={toggleAvailability}
              className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        {earnings && (
          <div className="card">
            <h3>Earnings</h3>
            <div className="earnings-grid">
              <div>
                <p>Today</p>
                <h4>${earnings.daily?.toFixed(2) || 0}</h4>
              </div>
              <div>
                <p>This Week</p>
                <h4>${earnings.weekly?.toFixed(2) || 0}</h4>
              </div>
              <div>
                <p>Total</p>
                <h4>${earnings.total?.toFixed(2) || 0}</h4>
              </div>
            </div>
          </div>
        )}

        {currentRide && (
          <div className="card">
            <h3>Current Ride</h3>
            <p><strong>Status:</strong> {currentRide.status}</p>
            <p><strong>Rider:</strong> {currentRide.rider?.name}</p>
            <p><strong>Pickup:</strong> {currentRide.pickupLocation.address}</p>
            <p><strong>Dropoff:</strong> {currentRide.dropoffLocation.address}</p>
            <p><strong>Fare:</strong> ${currentRide.fare.total}</p>

            <div className="ride-actions">
              {currentRide.status === 'accepted' && (
                <button onClick={() => updateRideStatus('arrived')} className="btn btn-primary">
                  Mark as Arrived
                </button>
              )}
              {currentRide.status === 'arrived' && (
                <button onClick={() => updateRideStatus('in-progress')} className="btn btn-primary">
                  Start Trip
                </button>
              )}
              {currentRide.status === 'in-progress' && (
                <button onClick={() => updateRideStatus('completed')} className="btn btn-success">
                  Complete Trip
                </button>
              )}
              <button onClick={cancelRide} className="btn btn-danger">Cancel Ride</button>
            </div>
          </div>
        )}

        {rideRequests.length > 0 && (
          <div className="card">
            <h3>Ride Requests</h3>
            {rideRequests.map((request, index) => (
              <div key={index} className="ride-request">
                <p><strong>Pickup:</strong> {request.pickup?.address}</p>
                <p><strong>Dropoff:</strong> {request.dropoff?.address}</p>
                <p><strong>Distance:</strong> {request.distance?.toFixed(2)} km</p>
                <p><strong>Fare:</strong> ${request.fare}</p>
                <button
                  onClick={() => acceptRide(request.rideId)}
                  className="btn btn-success"
                >
                  Accept Ride
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h3>Ride History</h3>
          {rideHistory.length === 0 ? (
            <p>No rides yet</p>
          ) : (
            <div className="ride-list">
              {rideHistory.slice(0, 5).map(ride => (
                <div key={ride._id} className="ride-item">
                  <p><strong>{ride.pickupLocation.address}</strong> to <strong>{ride.dropoffLocation.address}</strong></p>
                  <p>Status: {ride.status} | Fare: ${ride.fare.total}</p>
                  <p>{new Date(ride.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
