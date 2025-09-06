const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your email password or app password
  }
});

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to EcoFinds! 🌱',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🌱 Welcome to EcoFinds!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your sustainable marketplace journey begins here</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2E7D32; margin-top: 0;">Hello ${userName}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Welcome to EcoFinds, the sustainable marketplace where eco-conscious buyers and sellers come together! 
            We're thrilled to have you join our community of environmental advocates.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="color: #2E7D32; margin-top: 0;">What you can do:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>🛍️ <strong>Buy sustainable products</strong> from verified eco-friendly sellers</li>
              <li>🏪 <strong>Sell your eco-friendly items</strong> and earn money while helping the planet</li>
              <li>🎯 <strong>Earn points and badges</strong> for your sustainable actions</li>
              <li>🌍 <strong>Make a positive impact</strong> on the environment</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Start Exploring EcoFinds
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for choosing sustainability! 🌱<br>
            The EcoFinds Team
          </p>
        </div>
      </div>
    `
  }),

  orderReceived: (sellerName, productTitle, buyerName, quantity, totalPrice) => ({
    subject: '🎉 New Order Received - EcoFinds',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 New Order Received!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Someone loves your sustainable product</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2E7D32; margin-top: 0;">Congratulations ${sellerName}! 🎊</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Great news! You've received a new order for your sustainable product. 
            Here are the details:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="color: #2E7D32; margin-top: 0;">Order Details:</h3>
            <p style="margin: 10px 0;"><strong>Product:</strong> ${productTitle}</p>
            <p style="margin: 10px 0;"><strong>Buyer:</strong> ${buyerName}</p>
            <p style="margin: 10px 0;"><strong>Quantity:</strong> ${quantity}</p>
            <p style="margin: 10px 0;"><strong>Total Price:</strong> ₹${totalPrice}</p>
          </div>
          
          <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2E7D32; font-weight: bold;">
              💡 Next Steps: Please confirm the order and prepare for shipping. 
              Your buyer is excited to receive their sustainable product!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/orders" 
               style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Order Details
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Keep up the great work! 🌱<br>
            The EcoFinds Team
          </p>
        </div>
      </div>
    `
  }),

  orderPlaced: (buyerName, productTitle, sellerName, quantity, totalPrice) => ({
    subject: '✅ Order Confirmed - EcoFinds',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your sustainable purchase is on its way</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2E7D32; margin-top: 0;">Thank you ${buyerName}! 🙏</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Your order has been successfully placed. You're making a positive impact on the environment 
            by choosing sustainable products!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="color: #2E7D32; margin-top: 0;">Order Summary:</h3>
            <p style="margin: 10px 0;"><strong>Product:</strong> ${productTitle}</p>
            <p style="margin: 10px 0;"><strong>Seller:</strong> ${sellerName}</p>
            <p style="margin: 10px 0;"><strong>Quantity:</strong> ${quantity}</p>
            <p style="margin: 10px 0;"><strong>Total Price:</strong> ₹${totalPrice}</p>
          </div>
          
          <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2E7D32; font-weight: bold;">
              🌱 You've earned eco-points for this sustainable purchase! 
              Check your profile to see your updated points and badges.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-orders" 
               style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Track Your Order
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for choosing sustainability! 🌱<br>
            The EcoFinds Team
          </p>
        </div>
      </div>
    `
  }),

  paymentCompleted: (userName, orderId, amount) => ({
    subject: '💳 Payment Successful - EcoFinds',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">💳 Payment Successful!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your payment has been processed</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2E7D32; margin-top: 0;">Payment Confirmed ${userName}! ✅</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Your payment has been successfully processed. Your order is now confirmed 
            and the seller has been notified.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="color: #2E7D32; margin-top: 0;">Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 10px 0;"><strong>Amount Paid:</strong> ₹${amount}</p>
            <p style="margin: 10px 0;"><strong>Payment Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Completed</span></p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2E7D32; font-weight: bold;">
              🎉 Your sustainable purchase is confirmed! The seller will now prepare your order for shipping.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-orders" 
               style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Order Status
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for your sustainable purchase! 🌱<br>
            The EcoFinds Team
          </p>
        </div>
      </div>
    `
  })
};

// Email sending functions
const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](...data);
    
    const mailOptions = {
      from: `"EcoFinds" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendWelcomeEmail = async (userEmail, userName) => {
  return await sendEmail(userEmail, 'welcome', [userName]);
};

const sendOrderReceivedEmail = async (sellerEmail, sellerName, productTitle, buyerName, quantity, totalPrice) => {
  return await sendEmail(sellerEmail, 'orderReceived', [sellerName, productTitle, buyerName, quantity, totalPrice]);
};

const sendOrderPlacedEmail = async (buyerEmail, buyerName, productTitle, sellerName, quantity, totalPrice) => {
  return await sendEmail(buyerEmail, 'orderPlaced', [buyerName, productTitle, sellerName, quantity, totalPrice]);
};

const sendPaymentCompletedEmail = async (userEmail, userName, orderId, amount) => {
  return await sendEmail(userEmail, 'paymentCompleted', [userName, orderId, amount]);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderReceivedEmail,
  sendOrderPlacedEmail,
  sendPaymentCompletedEmail
};
