# 🚀 Quick Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL (or use Docker)
- npm or yarn

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Setup environment:**

   ```bash
   cp .env.example .env
   ```

   Update DATABASE_URL in `.env` with your PostgreSQL connection string.

3. **Option A: Use Docker (Recommended)**

   ```bash
   # Start PostgreSQL with Docker
   npm run docker:up

   # Update .env with Docker database URL:
   # DATABASE_URL="postgresql://inventory_user:inventory_password@localhost:5432/inventory_management_db?schema=public"
   ```

4. **Setup database:**

   ```bash
   npm run setup:dev
   ```

5. **Start the application:**

   ```bash
   npm run start:dev
   ```

6. **Access the application:**
   - API: http://localhost:3000
   - Documentation: http://localhost:3000/api
   - Database Admin (if using Docker): http://localhost:8080

## Features Available

### ✅ Core Modules

- ✅ Authentication & Authorization
- ✅ User Management with Roles
- ✅ Database Schema (Products, Categories, Suppliers, Orders, etc.)

### 🚧 In Development

- ⏳ Inventory Management APIs (partially complete)
- ⏳ Sales Management APIs (partially complete)
- ⏳ Reports & Analytics APIs (partially complete)

## Default Admin User

- Email: admin@inventory.com
- Password: admin123

## Database Management

```bash
# View database in browser
npm run db:studio

# Reset database
npm run db:reset

# Create new migration
npx prisma migrate dev --name "your_migration_name"
```

## API Testing

Use the Swagger UI at http://localhost:3000/api to test the APIs.

## Architecture

```
Frontend ← → NestJS API ← → PostgreSQL Database
              ↓
          Prisma ORM
```

This is a comprehensive inventory management system designed for small businesses with features for:

- 📦 Inventory tracking
- 🛒 Order processing
- 👥 Customer management
- 📊 Sales reporting
- 💰 Financial tracking
