import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    userType: 'rider',
    // Driver specific fields
    licenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    vehicleType: 'sedan'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let submitData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    };

    if (formData.userType === 'driver') {
      submitData.licenseNumber = formData.licenseNumber;
      submitData.vehicleInfo = {
        make: formData.vehicleMake,
        model: formData.vehicleModel,
        year: parseInt(formData.vehicleYear),
        color: formData.vehicleColor,
        licensePlate: formData.licensePlate,
        type: formData.vehicleType
      };
    }

    const result = await register(submitData, formData.userType);

    if (result.success) {
      navigate(formData.userType === 'driver' ? '/driver' : '/rider');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>User Type</label>
            <select name="userType" value={formData.userType} onChange={handleChange}>
              <option value="rider">Rider</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          {formData.userType === 'driver' && (
            <>
              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Make</label>
                <input
                  type="text"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Year</label>
                <input
                  type="number"
                  name="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  required
                  min="2000"
                  max="2025"
                />
              </div>

              <div className="form-group">
                <label>Vehicle Color</label>
                <input
                  type="text"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                  <option value="van">Van</option>
                </select>
              </div>
            </>
          )}

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
