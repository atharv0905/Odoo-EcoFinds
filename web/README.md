# EcoFinds Web Payment Gateway

This is the web payment gateway for EcoFinds, built with Next.js. It handles payment processing for orders created in the desktop application.

## Features

- **Payment Gateway Integration**: Supports Razorpay for online payments
- **Manual Payment Support**: Allows manual payment confirmation
- **Order Management**: Fetches and displays order details
- **Payment Verification**: Secure payment verification with signature validation
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Updates order status after payment

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment example file and configure it:

```bash
cp .env.example .env.local
```

Configure the following environment variables in `.env.local`:

```env
# API Configuration
API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here

# App Configuration
NEXT_PUBLIC_APP_NAME=EcoFinds
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start the Development Server

```bash
npm run dev
```

The web app will be available at `http://localhost:3000`.

## Payment Flow

1. **Desktop App Integration**: User completes checkout in desktop app
2. **Redirect to Web**: Desktop app redirects to `/payment/[orderId]`
3. **Order Details**: Web app fetches order details from API
4. **Payment Processing**: User chooses payment method and completes payment
5. **Payment Verification**: Razorpay payment is verified server-side
6. **Order Update**: Order status is updated to paid
7. **Success Page**: User is redirected to success page

## API Routes

### Order Management
- `GET /api/orders/[orderId]` - Fetch order details
- `POST /api/payments/mark-paid` - Mark order as paid

### Payment Processing
- `POST /api/payments/create-razorpay-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify Razorpay payment

## Pages

### Payment Page (`/payment/[orderId]`)
- Displays order summary
- Shows payment options (Razorpay/Manual)
- Handles payment processing
- Supports multiple vendors per order

### Success Page (`/payment/success`)
- Confirms payment completion
- Shows order details and delivery information
- Provides next steps and tracking info

## Configuration

### Razorpay Setup
1. Create account at [Razorpay](https://razorpay.com)
2. Get API keys from dashboard
3. Configure webhook for payment confirmation
4. Add keys to environment variables

### Manual Payments
- Enabled by default for testing
- Can be disabled in production
- Vendor bank details configured via API

## Security Features

- **Payment Signature Verification**: All Razorpay payments are verified
- **CORS Protection**: API calls restricted to allowed origins
- **Environment Isolation**: Sensitive keys not exposed to frontend
- **CSP Headers**: Content Security Policy for XSS protection

## Testing

### Test Razorpay Integration
1. Use Razorpay test keys
2. Use test card numbers from Razorpay docs
3. Verify webhook handling in test mode

### Test Order Flow
1. Create order in desktop app
2. Navigate to payment URL
3. Complete test payment
4. Verify order status update

## Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
NEXT_PUBLIC_ENV=production
API_BASE_URL=https://your-api-domain.com/api
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_production_razorpay_key
```

### Build and Deploy
```bash
npm run build
npm start
```

## Integration with Desktop App

The desktop app should redirect to the web payment gateway with this URL pattern:
```
http://localhost:3000/payment/[orderId]?buyerId=[buyerId]
```

Example:
```
http://localhost:3000/payment/64f1234567890abcdef12345?buyerId=user123
```

## Troubleshooting

### Common Issues

1. **Order not found**: Verify order ID is correct and exists in database
2. **Payment failure**: Check Razorpay keys and network connectivity
3. **CORS errors**: Verify API_BASE_URL in environment variables
4. **Webhook issues**: Check webhook URL and signature verification

### Debug Mode
Set `NODE_ENV=development` and check browser console for detailed error messages.

## Support

For technical support and integration help, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- Project API documentation