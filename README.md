# RentEasy - House Renting Platform

A full-stack web application for house renting with subscription-based access, role-based authentication, and location sharing features.

## Features

### Authentication System
- User registration and login
- Role-based access control (Student, Government Worker/Family, Landlord)
- JWT-based authentication

### Subscription System
- Different pricing for first-time users based on role:
  - Student: $1.00
  - Government Worker/Family: $2.00
  - Landlord: $3.00
- Monthly renewal: $1.00 for all roles
- Stripe payment integration
- Automatic subscription validation

### Property Management
- **For Landlords:**
  - Add new properties with photos/videos
  - Manage property listings
  - View interested users and their ID documents
  - Location sharing with coordinates

- **For Users:**
  - Browse available properties
  - Filter by location, price, property type, etc.
  - View property details with photos/videos
  - Express interest in properties
  - Upload ID proof documents

### Technology Stack

**Frontend:**
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- React Hook Form for form handling
- Axios for API calls
- Stripe React components for payments
- Leaflet for maps
- React Hot Toast for notifications

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- Stripe for payment processing
- CORS enabled

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Stripe account (for payment processing)
- Google Maps API key (optional, for enhanced location features)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/houserenting

# JWT Secret (use a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server Port
PORT=5000
```

5. Start the backend server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Frontend Setup

1. Install dependencies:
```bash
pnpm install
```

2. Update the `.env` file with your configuration:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

3. Start the development server:
```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

## API Configuration

### Required API Keys

1. **Stripe API Keys:**
   - Create a Stripe account at https://stripe.com
   - Get your test keys from the Stripe dashboard
   - Replace the placeholder keys in both frontend and backend `.env` files

2. **MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas (cloud)
   - Update the `MONGODB_URI` in the backend `.env` file

3. **Google Maps API (Optional):**
   - Create a Google Cloud Platform account
   - Enable the Maps JavaScript API
   - Get your API key and add it to the `.env` files

## User Roles and Permissions

### Student
- First-time subscription: $1.00
- Can browse properties
- Can express interest in properties
- Must upload ID proof

### Government Worker / Family
- First-time subscription: $2.00
- Can browse properties
- Can express interest in properties
- Must upload ID proof

### Landlord
- First-time subscription: $3.00
- Can add and manage properties
- Can upload property photos/videos
- Can view interested users and their documents
- Can share property location

## Database Schema

### Users Collection
- Personal information (name, email, phone)
- Role and subscription status
- ID proof document path
- Profile image

### Properties Collection
- Property details (title, description, price)
- Address and location coordinates
- Photos and videos
- Amenities and features
- Owner reference
- Interested users list

### Payments Collection
- Payment records
- Subscription periods
- Stripe payment intent IDs

## File Upload System

The application supports file uploads for:
- Property photos and videos (landlords)
- ID proof documents (users)
- Profile images (all users)

Files are stored locally in the `uploads/` directory with organized subfolders.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- File upload restrictions
- CORS configuration
- Input validation and sanitization

## Deployment

### Development
```bash
# Backend
cd server && npm run dev

# Frontend
pnpm run dev
```

### Production Build
```bash
# Build frontend
pnpm run build

# Start backend in production
cd server && npm start
```

### Environment Variables for Production
Make sure to update all environment variables with production values:
- Use production Stripe keys
- Use production MongoDB URL
- Set secure JWT secret
- Configure proper CORS origins

## Troubleshooting

### Common Issues

1. **Payment not working:**
   - Check Stripe API keys
   - Ensure keys match between frontend and backend
   - Check Stripe webhook configuration

2. **File uploads failing:**
   - Check file permissions on upload directories
   - Verify file size limits
   - Ensure proper CORS configuration

3. **Database connection issues:**
   - Verify MongoDB is running
   - Check database URL in environment variables
   - Ensure network connectivity

### Support
For issues and questions, please check the console logs and network requests in the browser developer tools.

## License
This project is for educational and demonstration purposes.