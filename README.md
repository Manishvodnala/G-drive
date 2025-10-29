# Get It - Ride Hailing Platform

A comprehensive, full-stack ride-hailing platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring real-time location tracking, driver-rider matching, and payment integration.

## Features

### For Riders
- User registration and authentication
- Real-time ride booking
- Fare estimation before booking
- Live driver tracking with WebSocket
- Ride history and receipts
- Multiple vehicle type options (Sedan, SUV, Luxury, Van)
- In-app payment support
- Driver rating system

### For Drivers
- Driver registration with vehicle details
- Real-time ride requests
- Availability toggle (Online/Offline)
- Current ride management
- Earnings tracking (Daily, Weekly, Total)
- Ride history
- Navigation to pickup/dropoff locations
- Rider rating system

### Core Platform Features
- JWT-based authentication and authorization
- Real-time communication via Socket.io
- Geospatial queries for nearby driver matching
- Automatic fare calculation based on distance
- Ride status tracking (Requested, Accepted, Arrived, In-Progress, Completed, Cancelled)
- Payment processing infrastructure
- RESTful API architecture
- Responsive web interface

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **geolib** - Geospatial calculations

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **React Leaflet** - Map integration
- **Context API** - State management

## Project Structure

```
taxi-platform/
├── server/                 # Backend application
│   ├── config/            # Configuration files
│   │   └── db.js          # Database connection
│   ├── controllers/       # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── driverController.js
│   │   ├── rideController.js
│   │   └── paymentController.js
│   ├── middleware/        # Custom middleware
│   │   └── auth.js        # JWT authentication
│   ├── models/           # Database models
│   │   ├── User.js
│   │   ├── Driver.js
│   │   └── Ride.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── drivers.js
│   │   ├── rides.js
│   │   └── payments.js
│   ├── sockets/          # Socket.io handlers
│   │   └── locationSocket.js
│   └── index.js          # Server entry point
│
├── client/               # Frontend application
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React Context
│   │   ├── pages/       # Page components
│   │   ├── App.js       # Main app component
│   │   └── index.js     # React entry point
│   └── package.json
│
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── README.md

```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd G-drive
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taxi-platform
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

5. **Start MongoDB**
```bash
# On Linux/Mac
sudo systemctl start mongod

# On Windows
net start MongoDB
```

6. **Run the application**

Development mode (runs both backend and frontend):
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

Or install all dependencies and run:
```bash
npm run install-all
```

The backend will run on `http://localhost:5000`
The frontend will run on `http://localhost:3000`

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123"
}
```

#### Register Driver
```http
POST /api/auth/register/driver
Content-Type: application/json

{
  "name": "Jane Driver",
  "email": "jane@example.com",
  "phone": "+1234567891",
  "password": "password123",
  "licenseNumber": "DL123456",
  "vehicleInfo": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "color": "Black",
    "licensePlate": "ABC123",
    "type": "sedan"
  }
}
```

#### Login
```http
POST /api/auth/login/user
POST /api/auth/login/driver
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Ride Endpoints

#### Request a Ride
```http
POST /api/rides/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupLocation": {
    "coordinates": [-74.0060, 40.7128],
    "address": "New York, NY"
  },
  "dropoffLocation": {
    "coordinates": [-73.9855, 40.7580],
    "address": "Times Square, NY"
  },
  "vehicleType": "sedan"
}
```

#### Accept Ride (Driver)
```http
POST /api/rides/:rideId/accept
Authorization: Bearer <token>
```

#### Update Ride Status
```http
PUT /api/rides/:rideId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress"
}
```

### Driver Endpoints

#### Toggle Availability
```http
PUT /api/drivers/availability
Authorization: Bearer <token>
```

#### Get Earnings
```http
GET /api/drivers/earnings
Authorization: Bearer <token>
```

## WebSocket Events

### Client Events
- `join` - Join user/driver room
- `updateLocation` - Update driver location
- `updateRiderLocation` - Update rider location
- `getNearbyDrivers` - Request nearby available drivers
- `acceptRide` - Driver accepts a ride
- `sendMessage` - Send chat message

### Server Events
- `newRideRequest` - New ride request notification
- `rideAccepted` - Ride accepted by driver
- `rideStatusUpdate` - Ride status changed
- `driverLocationUpdate` - Driver location update
- `nearbyDrivers` - List of nearby drivers
- `rideCancelled` - Ride cancelled notification

## Database Schema

### User Model
- name, email, phone, password
- role (rider/admin)
- location (GeoJSON Point)
- rating, totalRides
- profileImage

### Driver Model
- name, email, phone, password
- licenseNumber
- vehicleInfo (make, model, year, color, licensePlate, type)
- location (GeoJSON Point)
- isAvailable, isVerified
- currentRide
- earnings (total, weekly, daily)
- rating, totalRides

### Ride Model
- rider, driver (references)
- pickupLocation, dropoffLocation (GeoJSON Points)
- status (requested, accepted, arrived, in-progress, completed, cancelled)
- vehicleType
- fare (baseFare, perKmRate, distance, total)
- payment (method, status, transactionId)
- rating (riderRating, driverRating)
- route (array of locations)
- timestamps

## Usage

### As a Rider
1. Register/Login as a user
2. Enter pickup and dropoff locations
3. Select vehicle type
4. Get fare estimate
5. Request ride
6. Track driver in real-time
7. Complete ride and rate driver

### As a Driver
1. Register/Login as a driver with vehicle details
2. Toggle availability to "Online"
3. Receive ride requests
4. Accept ride
5. Update ride status (Arrived, In-Progress, Completed)
6. View earnings and ride history

## Payment Integration

The platform includes a payment structure ready for integration with:
- Stripe
- PayPal
- Razorpay
- Square

Currently implemented as a simulation. See `server/controllers/paymentController.js` for integration points.

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes with middleware
- Input validation
- CORS configuration
- Environment variable protection

## Future Enhancements

- [ ] Google Maps integration for better mapping
- [ ] Push notifications
- [ ] In-app chat between rider and driver
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Referral system
- [ ] Promotional codes and discounts
- [ ] Driver background verification system
- [ ] Admin panel for platform management
- [ ] Mobile apps (iOS/Android)
- [ ] Ride scheduling
- [ ] Multi-stop rides

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@taxiplatform.com or open an issue in the repository.

## Acknowledgments

- Built with MERN stack
- Real-time features powered by Socket.io
- Maps powered by Leaflet
- Geospatial calculations using geolib