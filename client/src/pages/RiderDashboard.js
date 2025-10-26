import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './Dashboard.css';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    pickupAddress: '',
    pickupLat: '',
    pickupLng: '',
    dropoffAddress: '',
    dropoffLat: '',
    dropoffLng: '',
    vehicleType: 'sedan'
  });
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join', { userId: user._id, userType: 'user' });

    // Listen for ride events
    newSocket.on('rideAccepted', (data) => {
      console.log('Ride accepted:', data);
      fetchCurrentRide();
    });

    newSocket.on('rideStatusUpdate', (data) => {
      console.log('Ride status update:', data);
      fetchCurrentRide();
    });

    newSocket.on('driverLocationUpdate', (data) => {
      console.log('Driver location update:', data);
    });

    fetchRideHistory();
    checkCurrentRide();

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  const checkCurrentRide = async () => {
    try {
      const response = await axios.get('/api/users/rides');
      const activeRide = response.data.data.find(
        ride => ['requested', 'accepted', 'arrived', 'in-progress'].includes(ride.status)
      );
      if (activeRide) {
        setCurrentRide(activeRide);
      }
    } catch (error) {
      console.error('Error checking current ride:', error);
    }
  };

  const fetchCurrentRide = async () => {
    await checkCurrentRide();
  };

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get('/api/users/rides');
      setRideHistory(response.data.data);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    }
  };

  const handleInputChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    });
  };

  const estimateFare = async () => {
    try {
      const response = await axios.post('/api/rides/estimate-fare', {
        pickupLocation: {
          coordinates: [parseFloat(bookingForm.pickupLng), parseFloat(bookingForm.pickupLat)],
          address: bookingForm.pickupAddress
        },
        dropoffLocation: {
          coordinates: [parseFloat(bookingForm.dropoffLng), parseFloat(bookingForm.dropoffLat)],
          address: bookingForm.dropoffAddress
        },
        vehicleType: bookingForm.vehicleType
      });
      setEstimatedFare(response.data.data);
    } catch (error) {
      console.error('Error estimating fare:', error);
    }
  };

  const requestRide = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/rides/request', {
        pickupLocation: {
          coordinates: [parseFloat(bookingForm.pickupLng), parseFloat(bookingForm.pickupLat)],
          address: bookingForm.pickupAddress
        },
        dropoffLocation: {
          coordinates: [parseFloat(bookingForm.dropoffLng), parseFloat(bookingForm.dropoffLat)],
          address: bookingForm.dropoffAddress
        },
        vehicleType: bookingForm.vehicleType
      });
      setCurrentRide(response.data.data);
      alert('Ride requested successfully! Waiting for driver...');
    } catch (error) {
      alert('Error requesting ride: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const cancelRide = async () => {
    if (!currentRide) return;

    try {
      await axios.post(`/api/rides/${currentRide._id}/cancel`, {
        reason: 'User cancelled'
      });
      setCurrentRide(null);
      fetchRideHistory();
      alert('Ride cancelled successfully');
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
        <h2>Rider Dashboard</h2>
        <div>
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {currentRide ? (
          <div className="card">
            <h3>Current Ride</h3>
            <p><strong>Status:</strong> {currentRide.status}</p>
            <p><strong>Pickup:</strong> {currentRide.pickupLocation.address}</p>
            <p><strong>Dropoff:</strong> {currentRide.dropoffLocation.address}</p>
            <p><strong>Fare:</strong> ${currentRide.fare.total}</p>
            {currentRide.driver && (
              <div>
                <p><strong>Driver:</strong> {currentRide.driver.name}</p>
                <p><strong>Vehicle:</strong> {currentRide.driver.vehicleInfo?.make} {currentRide.driver.vehicleInfo?.model}</p>
                <p><strong>License Plate:</strong> {currentRide.driver.vehicleInfo?.licensePlate}</p>
              </div>
            )}
            <button onClick={cancelRide} className="btn btn-danger">Cancel Ride</button>
          </div>
        ) : (
          <div className="card">
            <h3>Book a Ride</h3>
            <div className="form-group">
              <label>Pickup Address</label>
              <input
                type="text"
                name="pickupAddress"
                value={bookingForm.pickupAddress}
                onChange={handleInputChange}
                placeholder="Enter pickup address"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Pickup Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="pickupLat"
                  value={bookingForm.pickupLat}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div className="form-group">
                <label>Pickup Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="pickupLng"
                  value={bookingForm.pickupLng}
                  onChange={handleInputChange}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dropoff Address</label>
              <input
                type="text"
                name="dropoffAddress"
                value={bookingForm.dropoffAddress}
                onChange={handleInputChange}
                placeholder="Enter dropoff address"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Dropoff Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="dropoffLat"
                  value={bookingForm.dropoffLat}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7580"
                />
              </div>
              <div className="form-group">
                <label>Dropoff Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="dropoffLng"
                  value={bookingForm.dropoffLng}
                  onChange={handleInputChange}
                  placeholder="e.g., -73.9855"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Vehicle Type</label>
              <select name="vehicleType" value={bookingForm.vehicleType} onChange={handleInputChange}>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="luxury">Luxury</option>
                <option value="van">Van</option>
              </select>
            </div>

            <button onClick={estimateFare} className="btn btn-primary">Estimate Fare</button>

            {estimatedFare && (
              <div className="fare-estimate">
                <h4>Estimated Fare</h4>
                <p>Distance: {estimatedFare.distance.toFixed(2)} km</p>
                <p>Base Fare: ${estimatedFare.baseFare}</p>
                <p>Per KM Rate: ${estimatedFare.perKmRate}</p>
                <p><strong>Total: ${estimatedFare.total}</strong></p>
              </div>
            )}

            <button onClick={requestRide} className="btn btn-success" disabled={loading}>
              {loading ? 'Requesting...' : 'Request Ride'}
            </button>
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

export default RiderDashboard;
