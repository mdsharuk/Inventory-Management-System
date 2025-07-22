# 📦 Inventory Management System for Small Businesses

A comprehensive **Inventory Management System** built with **NestJS**, **Prisma**, and **PostgreSQL**. This system is designed specifically for small businesses to efficiently manage their inventory, process sales orders, and fulfill customer orders with detailed analytics and reporting.

## 🎯 Project Overview

**Problem Statement:** Develop a system for small businesses to manage their inventory, sales, and order fulfillment.

- **Type:** Backend API System (can be integrated with desktop/web frontends)
- **Industry Area:** Retail & Small Business Management
- **Duration:** 2-3 months development cycle
- **Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Swagger

## ✨ Key Features

### 🏪 **Inventory Management**

- **Product Management:** Create, update, and manage products with detailed information
- **Category Organization:** Organize products into categories for better management
- **Supplier Management:** Track suppliers and their contact information
- **Stock Tracking:** Real-time stock levels with automatic low-stock alerts
- **Stock Adjustments:** Manual stock adjustments with reason tracking
- **Stock Movement History:** Complete audit trail of all stock movements

### 💼 **Sales Processing**

- **Customer Management:** Store and manage customer information
- **Order Processing:** Create and manage sales orders with multiple items
- **Order Status Tracking:** Track orders from pending to delivery
- **Payment Management:** Record and track payments with multiple methods
- **Order Fulfillment:** Automatic stock reduction upon order processing

### 📊 **Analytics & Reporting**

- **Dashboard Metrics:** Key performance indicators and statistics
- **Sales Reports:** Comprehensive sales analysis with date ranges
- **Inventory Reports:** Stock levels, valuations, and movement reports
- **Financial Reports:** Revenue, expenses, and profit analysis
- **Top Products:** Best-selling products and customer analytics

### 🔐 **User Management & Security**

- **Role-Based Access Control:** Admin, Manager, Sales Rep, Inventory Clerk roles
- **JWT Authentication:** Secure API access with refresh tokens
- **User Activity Tracking:** Track user actions and changes

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NestJS API    │    │   PostgreSQL    │
│   (Desktop/Web) │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Prisma ORM    │
                       └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd inventory-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database connection and JWT secrets:

   ```env
   PORT=3000
   DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db?schema=public"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=1d
   JWT_REFRESH_SECRET=your-refresh-secret-key
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy

   # (Optional) Seed initial data
   npx prisma db seed
   ```

5. **Start the application**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

## 📋 API Documentation

Once the application is running, you can access:

- **API Documentation (Swagger):** `http://localhost:3000/api`
- **Application:** `http://localhost:3000`

### Main API Endpoints

#### 🔐 Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile

#### 📦 Inventory Management

- `GET /inventory/dashboard` - Inventory dashboard stats
- `GET /inventory/products` - List all products (with pagination)
- `POST /inventory/products` - Create new product
- `GET /inventory/products/low-stock` - Get low stock products
- `POST /inventory/products/:id/adjust-stock` - Adjust product stock
- `GET /inventory/categories` - List all categories
- `GET /inventory/suppliers` - List all suppliers

#### 💰 Sales Management

- `GET /sales/customers` - List all customers
- `POST /sales/customers` - Create new customer
- `GET /sales/orders` - List all orders
- `POST /sales/orders` - Create new order
- `POST /sales/orders/:id/payments` - Add payment to order
- `POST /sales/orders/:id/cancel` - Cancel order

#### 📊 Reports & Analytics

- `GET /reports/inventory` - Comprehensive inventory report
- `GET /reports/sales` - Sales report with date ranges
- `GET /reports/financial` - Financial report (P&L)
- `GET /reports/activity` - System activity report

## 🗄️ Database Schema

### Core Entities

- **Users:** System users with role-based permissions
- **Products:** Product catalog with pricing and stock information
- **Categories:** Product categorization
- **Suppliers:** Supplier information and relationships
- **Customers:** Customer database
- **Orders:** Sales orders with line items
- **Payments:** Payment tracking and history
- **Stock Movements:** Complete audit trail of inventory changes

### Key Relationships

- Products belong to Categories and Suppliers
- Orders contain multiple Order Items (Products)
- Orders can have multiple Payments
- Stock Movements track all inventory changes
- Users create Orders and Stock Adjustments

## 🎯 Business Use Cases

### 📈 **Stock Tracking**

- Automatic stock level updates when orders are processed
- Low stock alerts to prevent stockouts
- Stock movement history for audit purposes
- Manual stock adjustments with reason tracking

### 🛒 **Order Processing**

- Create orders for walk-in or phone customers
- Add multiple products to a single order
- Calculate taxes and discounts automatically
- Process payments and track payment status

### 📊 **Sales Reporting**

- Daily, weekly, monthly sales reports
- Top-selling products and customer analysis
- Profit margins and cost analysis
- Payment method preferences

## 🔧 Development

### Run tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Management

```bash
# Reset database
npx prisma migrate reset

# View database in browser
npx prisma studio
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

## 🏢 Business Benefits

### For Small Businesses:

- **Efficient Inventory Management:** Never run out of stock or overstock
- **Streamlined Order Processing:** Quick order creation and fulfillment
- **Customer Relationship Management:** Track customer purchase history
- **Financial Insights:** Understand profitability and cash flow
- **Audit Trail:** Complete transaction history for compliance

### For Developers:

- **Modern Tech Stack:** Learn NestJS, Prisma, and PostgreSQL
- **API-First Architecture:** Build scalable backend systems
- **Authentication & Authorization:** Implement secure access control
- **Database Design:** Design normalized database schemas
- **Business Logic:** Implement complex business workflows

## 🚀 Deployment Options

### Local Development

- **PostgreSQL:** Local database instance
- **Node.js:** Direct execution

### Production Deployment

- **Cloud Databases:** AWS RDS, Google Cloud SQL, or DigitalOcean
- **Container Deployment:** Docker with Docker Compose
- **Cloud Platforms:** Heroku, Vercel, or AWS EC2

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for small businesses to thrive in their inventory management journey!**
