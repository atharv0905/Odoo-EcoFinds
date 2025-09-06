# EcoFinds API

A comprehensive Node.js + Express + MongoDB backend API for EcoFinds - A sustainable marketplace application.

## 🚀 Features

- User management with role-based access
- Product listing and management
- Shopping cart functionality
- Purchase history tracking
- Advanced search and filtering
- Gamification system with points and badges
- Payment configuration support (Razorpay integration ready)
- Proper MongoDB indexing for optimal performance

## 📁 Project Structure

```
api/
├── models/
│   ├── User.js          # User model with payment config and gamification
│   ├── Product.js       # Product model with indexing
│   ├── Cart.js          # Shopping cart model
│   └── Purchase.js      # Purchase history model
├── routes/
│   ├── userRoutes.js    # User management endpoints
│   ├── productRoutes.js # Product CRUD and search endpoints
│   ├── cartRoutes.js    # Cart management endpoints
│   └── purchaseRoutes.js # Purchase tracking endpoints
├── server.js            # Main Express server setup
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory with:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### 3. Install Development Dependencies (Optional)
```bash
npm install nodemon --save-dev
```

### 4. Start the Server
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The server will run on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Health Check
```
GET /health
```

---

## 👥 User Management

### Create User
**Endpoint:** `POST /api/users/`
**Description:** Create a new user (only name and email are required)

**Request Body:**
```json
{
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully. Complete your profile using the update endpoint.",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "paymentConfig": {
      "mode": "manual_payout"
    },
    "gamification": {
      "points": 0,
      "badges": [],
      "level": 1
    },
    "createdAt": "2023-10-15T10:30:00.000Z"
  }
}
```

### Get User by ID
**Endpoint:** `GET /api/users/:id`

**Response:**
```json
{
  "message": "User retrieved successfully",
  "user": { ... }
}
```

### Update User Profile
**Endpoint:** `PUT /api/users/:id`
**Description:** Update user profile (all fields optional)

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1987654321",
  "paymentConfig": {
    "mode": "razorpay_direct",
    "razorpayKeyId": "rzp_test_key",
    "razorpaySecret": "rzp_test_secret"
  },
  "gamification": {
    "points": 150,
    "badges": ["eco-warrior", "first-sale"],
    "level": 2
  }
}
```

### Update Profile (Dedicated Endpoint)
**Endpoint:** `PUT /api/users/:id/profile`
**Description:** Update basic profile information

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1987654321"
}
```

### Update Payment Configuration
**Endpoint:** `PUT /api/users/:id/payment-config`
**Description:** Update payment settings

**Request Body:**
```json
{
  "paymentConfig": {
    "mode": "razorpay_direct",
    "razorpayKeyId": "rzp_test_key",
    "razorpaySecret": "rzp_test_secret"
  }
}
```

### Update Gamification Data
**Endpoint:** `PUT /api/users/:id/gamification`
**Description:** Update user's gamification points and badges

**Request Body:**
```json
{
  "gamification": {
    "points": 250,
    "badges": ["eco-warrior", "frequent-buyer", "green-seller"],
    "level": 3
  }
}
```

### Get All Users
**Endpoint:** `GET /api/users/`

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "users": [...],
  "count": 10
}
```

---

## 🛍️ Product Management

### Create Product
**Endpoint:** `POST /api/products/`

**Request Body:**
```json
{
  "title": "Eco-Friendly Water Bottle",
  "description": "Reusable stainless steel water bottle",
  "category": "Kitchen",
  "price": 25.99,
  "image": "https://example.com/image.jpg",
  "createdBy": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

**Response:**
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "title": "Eco-Friendly Water Bottle",
    "description": "Reusable stainless steel water bottle",
    "category": "Kitchen",
    "price": 25.99,
    "image": "https://example.com/image.jpg",
    "createdBy": "64f8a1b2c3d4e5f6a7b8c9d0",
    "createdAt": "2023-10-15T10:30:00.000Z"
  }
}
```

### Get All Products
**Endpoint:** `GET /api/products/`

### Get Product by ID
**Endpoint:** `GET /api/products/:id`

### Update Product
**Endpoint:** `PUT /api/products/:id`

### Delete Product
**Endpoint:** `DELETE /api/products/:id`

### Get User's Products
**Endpoint:** `GET /api/products/user/:userId`

### Smart Product Search (Recommended)
**Endpoint:** `GET /api/products/smart-search`
**Description:** Advanced search with pagination and fallback logic

**Query Parameters:**
- `q` (required): Search keyword
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Example:** `GET /api/products/smart-search?q=iphone&page=1&limit=5`

**Response:**
```json
{
  "message": "Smart search results retrieved successfully",
  "results": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "title": "iPhone 13 Pro",
      "description": "Latest iPhone with amazing features",
      "category": "Electronics",
      "price": 999.99,
      "image": "https://example.com/iphone.jpg",
      "createdBy": "64f8a1b2c3d4e5f6a7b8c9d0",
      "score": 1.2
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalResults": 15,
    "limit": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "query": "iphone"
}
```

**Features:**
- Uses MongoDB text search for relevance scoring
- Falls back to regex search if no text matches found
- Supports pagination for large result sets
- Returns comprehensive pagination metadata

### Search Products (Legacy)
**Endpoint:** `GET /api/products/search/:keyword`

**Example:** `GET /api/products/search/bottle`

**Response:**
```json
{
  "message": "Search results retrieved successfully",
  "products": [...],
  "count": 5,
  "keyword": "bottle"
}
```

### Filter by Category
**Endpoint:** `GET /api/products/filter/:category`

**Example:** `GET /api/products/filter/Kitchen`

---

## 🛒 Cart Management

### Add to Cart
**Endpoint:** `POST /api/cart/add`

**Request Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "quantity": 2
}
```

**Response:**
```json
{
  "message": "Item added to cart successfully",
  "cart": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "items": [
      {
        "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "quantity": 2
      }
    ]
  }
}
```

### Get Cart Items
**Endpoint:** `GET /api/cart/:userId`

**Response:**
```json
{
  "message": "Cart retrieved successfully",
  "cart": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "items": [...]
  },
  "totalItems": 3
}
```

### Remove Item from Cart
**Endpoint:** `DELETE /api/cart/:userId/:productId`

---

## 📦 Purchase Management

### Add Purchase
**Endpoint:** `POST /api/purchases/`

**Request Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "products": [
    "64f8a1b2c3d4e5f6a7b8c9d1",
    "64f8a1b2c3d4e5f6a7b8c9d2"
  ]
}
```

**Response:**
```json
{
  "message": "Purchase recorded successfully",
  "purchase": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "products": [
      "64f8a1b2c3d4e5f6a7b8c9d1",
      "64f8a1b2c3d4e5f6a7b8c9d2"
    ],
    "createdAt": "2023-10-15T10:30:00.000Z"
  }
}
```

### Get Purchase History
**Endpoint:** `GET /api/purchases/:userId`

**Response:**
```json
{
  "message": "Purchase history retrieved successfully",
  "purchases": [...],
  "count": 5,
  "totalProducts": 12
}
```

---

## 🧪 Example API Calls

### Using cURL

#### Create a User (Minimal Required Fields)
```bash
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "name": "Alice Green"
  }'
```

#### Update User Profile
```bash
curl -X PUT http://localhost:5000/api/users/USER_ID_HERE/profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Green Updated",
    "phone": "+1987654321"
  }'
```

#### Create a Product
```bash
curl -X POST http://localhost:5000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bamboo Toothbrush",
    "description": "Biodegradable bamboo toothbrush",
    "category": "Personal Care",
    "price": 8.99,
    "image": "https://example.com/bamboo-toothbrush.jpg",
    "createdBy": "USER_ID_HERE"
  }'
```

#### Smart Search Products
```bash
curl "http://localhost:5000/api/products/smart-search?q=bamboo&page=1&limit=10"
```

#### Legacy Search Products
```bash
curl http://localhost:5000/api/products/search/bamboo
```

#### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "productId": "PRODUCT_ID_HERE",
    "quantity": 1
  }'
```

### Using JavaScript Fetch

#### Update User Payment Config
```javascript
fetch('http://localhost:5000/api/users/USER_ID_HERE/payment-config', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    paymentConfig: {
      mode: 'razorpay_direct',
      razorpayKeyId: 'rzp_test_key',
      razorpaySecret: 'rzp_test_secret'
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

#### Smart Product Search with Pagination
```javascript
fetch('http://localhost:5000/api/products/smart-search?q=sustainable&page=2&limit=8')
.then(response => response.json())
.then(data => {
  console.log('Search Results:', data.results);
  console.log('Pagination:', data.pagination);
});
```

#### Update Gamification Points
```javascript
fetch('http://localhost:5000/api/users/USER_ID_HERE', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    gamification: {
      points: 250,
      badges: ['eco-warrior', 'frequent-buyer', 'green-seller'],
      level: 3
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## 🏗️ Database Schema & Indexing

### User Model Indexes
- `email` (unique)
- `role`

### Product Model Indexes
- Text index on `title` and `description` (for search)
- `category`
- `createdBy`
- Compound index: `{ category: 1, title: 1 }`

### Cart Model Indexes
- `userId`

### Purchase Model Indexes
- `userId`

---

## 🚦 Error Handling

All endpoints return proper JSON error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 Development Notes

- **User Creation**: Only name and email are required. Other profile fields can be updated later
- **Profile Updates**: Dedicated endpoints for different profile sections (basic info, payment, gamification)
- **Product Updates**: Users can update their own products with ownership verification
- **Smart Search**: Advanced search with text indexing, pagination, and regex fallback
- **No Authentication**: No authentication required (for now)
- **Role-based System**: Admin vs user roles for future privilege differentiation
- **Clean Architecture**: Modular code structure with proper separation of concerns
- **Error Handling**: Comprehensive error handling with meaningful JSON responses
- **Performance**: Proper MongoDB indexing for optimal search and query performance
- **Scalability**: Pagination support for large datasets
- **Integration Ready**: Payment configuration and gamification system ready for frontend

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
