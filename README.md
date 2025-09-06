![EcoFinds Marketplace](https://res.cloudinary.com/dhcknswjc/image/upload/v1757165856/Screenshot_2025-09-06_190704_dkwoag.png)

# Odoo-EcoFinds

[![GitHub last commit](https://img.shields.io/github/last-commit/atharv0905/Odoo-EcoFinds)](https://github.com/atharv0905/Odoo-EcoFinds/commits)


A full-stack, cross-platform marketplace for eco-friendly products. Built with Electron, React, Next.js, React Native, and Node.js/Express.


---

## Table of Contents
- [Project Overview](#project-overview)
- [Quick Start Demo](#quick-start-demo)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Contribute](#contribute)
- [License](#license)

---

# Project Overview

Odoo-EcoFinds is a full-stack marketplace ecosystem with:
- **Desktop App** ([desktop-app/](./desktop-app)) — Electron + React
- **Mobile App** ([mobile-app/](./mobile-app)) — React Native/Expo
- **Web App** ([web/](./web)) — Next.js
- **API** ([api/](./api)) — Node.js/Express

Each subproject is modular, modern, and designed for seamless integration.

---

## 🚀 API Routes Overview

Here’s a quick look at all backend endpoints and features:

### 🛒 Cart
- `GET /api/cart/:userId` — Get user's cart
- `POST /api/cart/add` — Add item to cart
- `DELETE /api/cart/remove` — Remove item from cart

### 📦 Orders
- `GET /api/orders/:userId` — List user orders
- `POST /api/orders` — Create new order
- `PUT /api/orders/:orderId` — Update order status

### 💸 Payments
- `POST /api/payments/create` — Create payment
- `POST /api/payments/verify` — Verify payment
- `GET /api/payments/:userId` — Get payment history

### 🛍️ Product Orders
- `GET /api/product-orders/:orderId` — Get products in an order
- `POST /api/product-orders` — Add product to order
- `DELETE /api/product-orders/:id` — Remove product from order

### 🏷️ Products
- `GET /api/products` — List all products
- `GET /api/products/:id` — Get product details
- `POST /api/products` — Add new product
- `PUT /api/products/:id` — Update product
- `DELETE /api/products/:id` — Delete product

### 🛒 Purchases
- `GET /api/purchases/:userId` — List user purchases
- `POST /api/purchases` — Record a purchase

### 👤 Users
- `GET /api/users/:id` — Get user profile
- `POST /api/users` — Register new user
- `PUT /api/users/:id` — Update user info
- `DELETE /api/users/:id` — Delete user

---

## Installation
[(Back to top)](#table-of-contents)

Clone the repo and install dependencies for any subproject:

```shell
# Clone the repo
gh repo clone atharv0905/Odoo-EcoFinds

# Desktop App
cd desktop-app
npm install

# Mobile App
cd ../mobile-app
npm install

# Web App
cd ../web
npm install

# API
cd ../api
npm install
```

---

## Usage
[(Back to top)](#table-of-contents)

- **Desktop App:**
  ```shell
  cd desktop-app
  npm run dev
  ```
- **Mobile App:**
  ```shell
  cd mobile-app
  npm start
  ```
- **Web App:**
  ```shell
  cd web
  npm run dev
  ```
- **API:**
  ```shell
  cd api
  npm run dev
  ```

---

## Development
[(Back to top)](#table-of-contents)

To contribute, fork the repo and set up your environment:

```shell
# Clone your fork
# Install dependencies
# Build and run in development mode
```

---


---
**Made with 💚 by the EcoFinds Team**
