# Cloud Cafe - Project Context

## Overview
Cloud Cafe is a full-stack React + Supabase web application for a coffee shop, featuring customer ordering, a loyalty rewards system with QR code-based stamp collection, and admin order management with real-time notifications.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS 4
- **UI:** Radix UI primitives + shadcn/ui components + Lucide icons + MUI
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **QR Code:** html5-qrcode (scanning) + qrcode.react (generation)
- **State:** React Context API (AuthContext, CartContext, OrderNotificationContext)
- **Forms:** react-hook-form
- **Notifications:** Sonner toasts + Browser Notifications
- **Deployment:** Vercel

## Project Structure
```
src/
├── main.tsx                    # Entry point
├── app/
│   ├── App.tsx                 # Main app with routing
│   ├── components/             # React components
│   │   ├── Home.tsx            # Landing page
│   │   ├── MenuPage.tsx        # Menu display
│   │   ├── CartPage.tsx        # Shopping cart
│   │   ├── RewardsPage.tsx     # Loyalty rewards with QR
│   │   ├── StaffScanPage.tsx   # Staff QR scanning
│   │   ├── AdminScanPage.tsx   # Admin camera scanner
│   │   ├── AdminOrdersPage.tsx # Order dashboard
│   │   ├── SignInPage.tsx      # Login
│   │   ├── RegisterPage.tsx    # Registration
│   │   └── ui/                 # shadcn/ui components
│   ├── context/
│   │   ├── AuthContext.tsx     # Auth state & methods
│   │   ├── CartContext.tsx     # Cart & rewards logic
│   │   └── OrderNotificationContext.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── rewards.ts          # Reward functions
│   │   └── admin.ts            # Admin utilities
│   └── types/
│       └── database.ts         # TypeScript types
└── styles/
    ├── index.css               # Main CSS
    ├── tailwind.css            # Tailwind directives
    └── theme.css               # Design tokens
```

## Key Features
1. **Customer Portal:** Browse menu, add to cart, checkout with notes
2. **Loyalty System:** 10 stamps = 1 free drink, QR code for scanning
3. **Staff Interface:** Scan customer QR to add stamps/redeem rewards
4. **Admin Dashboard:** Real-time order notifications, status management
5. **Authentication:** Supabase Auth with email verification required
6. **VIP Support:** VIP users get in-store payment option

## Database Tables (Supabase)
- `auth.users` - User authentication (metadata: role, first_name, last_name, shop_name)
- `user_rewards` - stamps (0-10), pending_reward flag
- `orders` - status, total, notes, payment_method
- `order_items` - product_name, quantity, price
- `vip_shops` - VIP shop whitelist

## Routes
| Path | Component | Access |
|------|-----------|--------|
| `/` | Home | Public |
| `/menu` | MenuPage | Public |
| `/cart` | CartPage | Public |
| `/rewards` | RewardsPage | Auth |
| `/signin` | SignInPage | Public |
| `/register` | RegisterPage | Public |
| `/orders` | OrderHistoryPage | Auth |
| `/account` | AccountSettingsPage | Auth |
| `/staff` | StaffScanPage | Staff |
| `/admin/orders` | AdminOrdersPage | Admin |
| `/admin/scan` | AdminScanPage | Admin |

## Build Commands
```bash
npm install       # Install dependencies
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build
```

## Design System
- **Primary color:** #B88A68 (coffee brown)
- **Dark:** #030213
- **Border radius:** 0.625rem
- **Components:** Radix UI + shadcn/ui for accessibility

## Authentication
- Supabase Auth with email/password
- Email verification required before login
- Role stored in `user_metadata.role` ('user' | 'admin')
- Admin emails whitelisted in RLS policies

## Important Patterns
- All state via React Context (no Redux)
- Supabase Row-Level Security (RLS) for data protection
- Real-time notifications via Supabase channels
- Rewards auto-applied at checkout when available
- QR code contains user ID for staff scanning
