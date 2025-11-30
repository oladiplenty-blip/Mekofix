# Mekofix - Technical Planning Document

## Project Overview

**App Name:** Mekofix  
**Type:** Mechanic Hailing App (similar to Uber/Bolt for auto repair)  
**Stack:** React Native (Frontend) + Custom Backend (Node.js/Express) + Supabase (Database + Auth)

---

## User Types

1. **Customers** - Car owners who need mechanic services
2. **Mechanics** - Service providers who fix cars
3. **Vendors** - Marketplace sellers (spare parts, batteries, oils, cars)
4. **Admin** - Internal team for verification and management

---

## Database Schema (Supabase)

### Core Tables

```sql
-- USERS (base table for all user types)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  user_type VARCHAR(20) CHECK (user_type IN ('customer', 'mechanic', 'vendor', 'admin')),
  full_name VARCHAR(255),
  gender VARCHAR(10),
  profile_picture_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  push_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CUSTOMER PROFILES
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  location_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CUSTOMER VEHICLES
CREATE TABLE customer_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  car_name VARCHAR(100),
  car_model VARCHAR(100),
  car_year INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MECHANIC PROFILES
CREATE TABLE mechanic_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  home_address TEXT,
  work_address TEXT,
  utility_bill_url TEXT,
  id_type VARCHAR(50), -- 'passport', 'national_id', 'drivers_license'
  id_document_url TEXT,
  profile_photo_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  background_check_status VARCHAR(20) DEFAULT 'pending',
  rating DECIMAL(2, 1) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MECHANIC SPECIALIZATIONS
CREATE TABLE mechanic_specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id UUID REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  specialization VARCHAR(100), -- 'engine', 'electrical', 'body_work', 'ac_repair', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- MECHANIC GUARANTORS
CREATE TABLE mechanic_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id UUID REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  guarantor_name VARCHAR(255),
  guarantor_phone VARCHAR(20),
  guarantor_address TEXT,
  guarantor_relationship VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SERVICE CATEGORIES (for filtering mechanics)
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  description TEXT,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SERVICE REQUESTS (job orders)
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id),
  mechanic_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES customer_vehicles(id),
  category_id UUID REFERENCES service_categories(id),
  problem_description TEXT,
  customer_location_lat DECIMAL(10, 8),
  customer_location_lng DECIMAL(11, 8),
  customer_location_address TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
  material_cost DECIMAL(10, 2),
  labor_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  customer_rating INTEGER,
  customer_review TEXT,
  mechanic_confirmed BOOLEAN DEFAULT FALSE,
  customer_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- VENDOR PROFILES
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  business_address TEXT,
  utility_bill_url TEXT,
  id_type VARCHAR(50),
  id_document_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  subscription_type VARCHAR(20) DEFAULT 'free', -- 'free', 'basic', 'premium'
  subscription_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- VENDOR GUARANTORS
CREATE TABLE vendor_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  guarantor_name VARCHAR(255),
  guarantor_phone VARCHAR(20),
  guarantor_address TEXT,
  guarantor_relationship VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- MARKETPLACE PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(100), -- 'spare_parts', 'batteries', 'engine_oil', 'cars', 'accessories'
  price DECIMAL(10, 2),
  images TEXT[], -- array of image URLs
  is_available BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE, -- based on subscription
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PRODUCT ORDERS
CREATE TABLE product_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendor_profiles(id),
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2),
  buyer_location_lat DECIMAL(10, 8),
  buyer_location_lng DECIMAL(11, 8),
  buyer_location_address TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WALLET TRANSACTIONS
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_type VARCHAR(20),
  amount DECIMAL(10, 2),
  transaction_type VARCHAR(20), -- 'credit', 'debit', 'commission'
  reference_type VARCHAR(30), -- 'service_request', 'product_order', 'topup', 'withdrawal'
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  body TEXT,
  type VARCHAR(50), -- 'service_request', 'order', 'wallet', 'system'
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- VERIFICATION CODES (for OTP)
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  code VARCHAR(6),
  type VARCHAR(20), -- 'email', 'phone'
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints (Custom Backend)

### Authentication
```
POST   /api/auth/register/customer     - Customer signup
POST   /api/auth/register/mechanic     - Mechanic signup (submit docs)
POST   /api/auth/register/vendor       - Vendor signup (submit docs)
POST   /api/auth/login                 - Login (email/phone + password)
POST   /api/auth/verify-otp            - Verify OTP code
POST   /api/auth/resend-otp            - Resend OTP
POST   /api/auth/forgot-password       - Request password reset
POST   /api/auth/reset-password        - Reset password with token
POST   /api/auth/refresh-token         - Refresh JWT token
```

### Customer Endpoints
```
GET    /api/customer/profile           - Get customer profile
PUT    /api/customer/profile           - Update profile
POST   /api/customer/vehicles          - Add vehicle
GET    /api/customer/vehicles          - List vehicles
PUT    /api/customer/vehicles/:id      - Update vehicle
DELETE /api/customer/vehicles/:id      - Delete vehicle
PUT    /api/customer/location          - Update current location
PUT    /api/customer/settings          - Update notification/location settings
```

### Mechanic Discovery & Service Requests
```
GET    /api/mechanics/nearby           - Get nearby mechanics (with filters)
GET    /api/mechanics/:id              - Get mechanic profile/details
GET    /api/categories                 - Get service categories
POST   /api/service-requests           - Create service request
GET    /api/service-requests           - List my service requests
GET    /api/service-requests/:id       - Get service request details
PUT    /api/service-requests/:id/complete - Customer confirms completion
PUT    /api/service-requests/:id/cancel   - Cancel request
POST   /api/service-requests/:id/rate     - Rate mechanic
```

### Mechanic Endpoints
```
GET    /api/mechanic/profile           - Get mechanic profile
PUT    /api/mechanic/profile           - Update profile
PUT    /api/mechanic/availability      - Toggle availability
PUT    /api/mechanic/location          - Update current location
GET    /api/mechanic/requests          - Get incoming service requests
PUT    /api/mechanic/requests/:id/accept  - Accept request
PUT    /api/mechanic/requests/:id/decline - Decline request
PUT    /api/mechanic/requests/:id/complete - Mark job as done
GET    /api/mechanic/wallet            - Get wallet balance & history
POST   /api/mechanic/wallet/withdraw   - Request withdrawal
GET    /api/mechanic/stats             - Get job stats
```

### Marketplace Endpoints
```
GET    /api/marketplace/products       - Browse products (with filters)
GET    /api/marketplace/products/:id   - Get product details
GET    /api/marketplace/categories     - Get product categories
POST   /api/marketplace/orders         - Place order (sends notification to vendor)
GET    /api/marketplace/orders         - My orders (buyer)
```

### Vendor Endpoints
```
GET    /api/vendor/profile             - Get vendor profile
PUT    /api/vendor/profile             - Update profile
POST   /api/vendor/products            - Add product
GET    /api/vendor/products            - List my products
PUT    /api/vendor/products/:id        - Update product
DELETE /api/vendor/products/:id        - Delete product
GET    /api/vendor/orders              - Get incoming orders
PUT    /api/vendor/orders/:id/accept   - Accept order
PUT    /api/vendor/orders/:id/complete - Complete order
GET    /api/vendor/wallet              - Get wallet balance & history
POST   /api/vendor/subscription        - Subscribe to plan
```

### Admin Endpoints
```
GET    /api/admin/mechanics/pending    - Get pending mechanic applications
PUT    /api/admin/mechanics/:id/verify - Approve/reject mechanic
GET    /api/admin/vendors/pending      - Get pending vendor applications
PUT    /api/admin/vendors/:id/verify   - Approve/reject vendor
GET    /api/admin/transactions         - View all transactions
GET    /api/admin/stats                - Dashboard stats
```

### Common Endpoints
```
GET    /api/history                    - Work/order history
GET    /api/payments                   - Payment history
POST   /api/support                    - Submit support ticket
GET    /api/notifications              - Get notifications
PUT    /api/notifications/:id/read     - Mark as read
```

---

## Folder Structure

```
mekofix/
├── apps/
│   ├── mobile/                    # React Native app
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   │   ├── common/        # Button, Input, Card, etc.
│   │   │   │   ├── maps/          # Map components
│   │   │   │   └── forms/         # Form components
│   │   │   ├── screens/
│   │   │   │   ├── auth/          # Login, Signup, OTP, ForgotPassword
│   │   │   │   ├── customer/      # Customer screens
│   │   │   │   ├── mechanic/      # Mechanic screens
│   │   │   │   ├── vendor/        # Vendor screens
│   │   │   │   └── marketplace/   # Marketplace screens
│   │   │   ├── navigation/        # React Navigation setup
│   │   │   ├── services/          # API calls
│   │   │   ├── store/             # State management (Zustand/Redux)
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── utils/             # Helper functions
│   │   │   ├── constants/         # App constants
│   │   │   └── types/             # TypeScript types
│   │   ├── App.tsx
│   │   └── package.json
│   │
│   └── backend/                   # Node.js/Express API
│       ├── src/
│       │   ├── controllers/       # Route handlers
│       │   ├── routes/            # API routes
│       │   ├── middleware/        # Auth, validation, error handling
│       │   ├── services/          # Business logic
│       │   ├── models/            # Database queries (Supabase)
│       │   ├── utils/             # Helpers (OTP, notifications, etc.)
│       │   ├── config/            # Environment config
│       │   └── types/             # TypeScript types
│       ├── app.ts
│       └── package.json
│
├── packages/
│   └── shared/                    # Shared types and constants
│
└── docs/
    └── PLANNING.md                # This file
```

---

## Build Milestones (Feature-by-Feature)

### Phase 1: Foundation
1. **Project Setup**
   - Initialize React Native project (Expo or bare)
   - Initialize Node.js/Express backend
   - Setup Supabase project and create tables
   - Configure environment variables

2. **Authentication System**
   - Customer signup flow (with OTP)
   - Login flow (email/phone + password)
   - Forgot/reset password
   - JWT token management
   - Protected routes

### Phase 2: Customer Features
3. **Customer Profile & Vehicles**
   - Profile management
   - Add/edit/delete vehicles
   - Location permissions handling

4. **Map & Mechanic Discovery**
   - Main map screen (like Uber/Bolt)
   - Display nearby mechanics on map
   - Filter mechanics by specialization
   - Search for problem type

5. **Service Request Flow**
   - Select mechanic
   - Describe problem
   - Send request
   - Track mechanic location
   - Complete transaction form (material + labor costs)
   - Rate mechanic

### Phase 3: Mechanic Features
6. **Mechanic Registration**
   - Multi-step signup form
   - Document uploads (ID, utility bill, photo)
   - Guarantor information
   - Specialization selection
   - Pending approval state

7. **Mechanic Dashboard**
   - Main map screen
   - Toggle availability
   - Incoming request notifications
   - Accept/decline requests
   - Navigate to customer
   - Mark job as done

8. **Mechanic Wallet**
   - View balance
   - Transaction history
   - Commission deductions
   - Withdrawal requests

### Phase 4: Marketplace
9. **Vendor Registration**
   - Similar to mechanic registration
   - Business information

10. **Product Management (Vendor)**
    - Add/edit/delete products
    - Upload product images
    - Set prices
    - View incoming orders

11. **Product Browsing (Buyers)**
    - Browse products by category
    - Product details
    - Place order (notify vendor)
    - Order history

12. **Vendor Subscriptions**
    - Subscription plans
    - Payment integration
    - Product visibility based on subscription

### Phase 5: Admin & Polish
13. **Admin Panel**
    - Verify mechanics/vendors
    - View all transactions
    - Dashboard analytics

14. **Notifications**
    - Push notifications (Firebase)
    - In-app notifications
    - Email notifications

15. **Support System**
    - Help/support section
    - Submit tickets
    - FAQ

---

## Key Technical Considerations

### Real-time Features (Supabase Realtime)
- Mechanic location updates
- Service request status changes
- New order notifications

### Location Services
- React Native Maps (Google Maps)
- Geolocation for current position
- Distance calculation for nearby mechanics
- Address geocoding

### File Uploads (Supabase Storage)
- ID documents
- Profile pictures
- Product images
- Utility bills

### Push Notifications
- Firebase Cloud Messaging (FCM)
- Notification handlers for different events

### Payment Integration (Future)
- Paystack or Flutterwave for Nigerian market
- Wallet top-up
- Commission deductions

---

## Cursor Prompting Strategy

When building in Cursor, reference this document and use prompts like:

```
Context: I'm building Mekofix, a mechanic hailing app. 
Stack: React Native + Node.js/Express + Supabase
Reference: MEKOFIX_TECHNICAL_PLAN.md

Task: Build [SPECIFIC FEATURE FROM MILESTONE]

Requirements:
- [SPECIFIC REQUIREMENTS FROM THIS DOC]
```

Always build one feature at a time, test it, then move to the next.
