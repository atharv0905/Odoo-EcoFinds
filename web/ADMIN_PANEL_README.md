# EcoFinds Admin Panel

This admin panel provides comprehensive management capabilities for the EcoFinds platform, including payment management, user oversight, and system analytics.

## 🚀 Features Implemented

### 1. **Firebase Authentication**
- ✅ Restricted access to only `admin@ecofinds.devally.in`
- ✅ Secure authentication with Firebase Auth
- ✅ Session management and automatic redirects
- ✅ Protected routes with authentication guards

### 2. **Admin Dashboard**
- ✅ Overview statistics (Total Users, Orders, Revenue)
- ✅ Recent orders display with buyer information
- ✅ Payment method breakdown (Manual vs Razorpay)
- ✅ Real-time data from backend API

### 3. **Payments Management**
- ✅ View all payments with filtering options:
  - Filter by payment method (Manual/Razorpay/All)
  - Filter by payment status (Paid/Unpaid/Failed/Refunded)
- ✅ Comprehensive payment details including:
  - Buyer information and contact details
  - Seller information for each order
  - Product details and quantities
  - Payment amounts and dates
- ✅ Real-time statistics and summaries

### 4. **Manual Payments Management** 
- ✅ Dedicated page for pending manual payments
- ✅ Detailed view of each manual payment order:
  - Complete buyer information (name, email, phone)
  - Full shipping address
  - Seller details
  - Itemized product list with images
  - Order notes and special instructions
- ✅ One-click payment processing:
  - Mark manual payments as "sent"
  - Automatic status updates in database
  - Order confirmation for sellers

### 5. **Users Management**
- ✅ Complete user directory with pagination
- ✅ User details including:
  - Contact information
  - Account role (Admin/User) 
  - Payment preferences (Manual/Razorpay)
  - Gamification stats (points, level, badges)
  - Join date and activity

### 6. **Backend Integration**
- ✅ New API routes in `/api/admin/*`:
  - `/admin/payments` - Payment data with filtering
  - `/admin/dashboard/stats` - Dashboard statistics
  - `/admin/users` - User management
- ✅ Enhanced Order model with admin tracking:
  - `adminProcessed` - tracks if admin manually processed payment
  - `adminProcessedAt` - timestamp of admin processing
  - `adminNotes` - admin notes for the payment
- ✅ Database indexes for performance optimization

## 🔧 Technical Implementation

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Authentication**: Firebase Auth with custom context
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React hooks with proper error handling
- **Routing**: Protected routes with authentication guards

### Backend (Express.js)
- **New Routes**: Added `/api/admin/*` endpoints
- **Database**: Enhanced MongoDB models with admin tracking
- **Payment Integration**: Supports both Razorpay and manual payments
- **Data Aggregation**: Optimized queries with MongoDB aggregation

### Security Features
- **Email Restriction**: Only `admin@ecofinds.devally.in` can access
- **Authentication Guards**: All admin pages are protected
- **Session Management**: Automatic logout and session handling
- **Input Validation**: Proper validation on all forms and API calls

## 📁 File Structure

```
web/
├── app/
│   ├── admin/                     # Admin panel pages
│   │   ├── page.js               # Dashboard
│   │   ├── payments/page.js      # All payments view
│   │   ├── manual-payments/page.js # Manual payments management
│   │   └── users/page.js         # Users management
│   ├── api/admin/                # Admin API routes
│   │   ├── dashboard/route.js
│   │   ├── payments/route.js
│   │   └── users/route.js
│   ├── login/page.js             # Admin login page
│   └── layout.js                 # Root layout with auth provider
├── components/
│   ├── AdminAuthGuard.js         # Authentication guard component
│   └── AdminLayout.js            # Admin panel layout with navigation
├── contexts/
│   └── AdminAuthContext.js       # Firebase auth context
├── lib/
│   └── firebase.js               # Firebase configuration
└── FIREBASE_SETUP.md            # Setup instructions
```

```
api/
├── models/
│   └── Order.js                  # Enhanced with admin tracking fields
├── routes/
│   └── adminRoutes.js           # New admin API endpoints
└── server.js                   # Updated to include admin routes
```

## 🎯 Key User Flows

### Admin Login Flow
1. Visit `/` → redirects to `/login` if not authenticated
2. Enter `admin@ecofinds.devally.in` and password
3. Firebase validates credentials and email restriction
4. Redirect to `/admin` dashboard upon successful login

### Manual Payment Processing Flow
1. Admin views pending manual payments in `/admin/manual-payments`
2. Reviews complete order details, buyer info, and shipping address
3. Processes payment externally (bank transfer, etc.)
4. Clicks "Mark as Paid" button
5. System updates order status and notifies relevant parties
6. Payment removed from pending list automatically

### Payment Monitoring Flow
1. Admin accesses `/admin/payments` for overview
2. Applies filters (method/status) to focus on specific payments
3. Reviews detailed payment information and customer details
4. Takes appropriate action based on payment status

## 🚦 Getting Started

1. **Setup Firebase**:
   - Follow instructions in `FIREBASE_SETUP.md`
   - Create admin user with `admin@ecofinds.devally.in`

2. **Install Dependencies**:
   ```bash
   cd web && npm install
   cd api && npm install
   ```

3. **Start Services**:
   ```bash
   # Terminal 1: Start API
   cd api && npm start
   
   # Terminal 2: Start Web App  
   cd web && npm run dev
   ```

4. **Access Admin Panel**:
   - Visit `http://localhost:3000`
   - Login with admin credentials
   - Access full admin functionality

## 💡 Key Benefits

1. **Centralized Management**: Single interface for all administrative tasks
2. **Payment Flexibility**: Support for both automated (Razorpay) and manual payments
3. **User Oversight**: Complete visibility into user base and preferences  
4. **Real-time Data**: Live statistics and payment status updates
5. **Secure Access**: Restricted to authorized admin users only
6. **Mobile Responsive**: Works perfectly on all device sizes
7. **Scalable Architecture**: Built to handle growing user base and transaction volume

The admin panel provides everything needed to effectively manage the EcoFinds platform, from payment processing to user management, with a clean and intuitive interface.
