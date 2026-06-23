# RealEstateOS

A modern, full-stack Real Estate Operations Platform designed for Filipino real estate agents, brokers, and property developers.

**Tagline:** "List it. Nurture it. Close it."

## 🎯 Features

- **Dashboard** - KPIs, recent activity, and pipeline summary
- **Property Management** - List, edit, and manage all your properties
- **Lead Management** - Kanban-style pipeline for tracking leads through stages
- **Deal Tracking** - Monitor deals from negotiation to closing
- **Client Management** - Track converted leads and their history
- **Messaging Hub** - GHL-powered SMS and email communications
- **Reports** - Commission summaries, performance analytics
- **Settings** - User profile and system configuration

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router v6** for navigation
- **Lucide React** for icons

### Backend / Services
- **Firebase Authentication** (Email/Password + Google OAuth)
- **Firebase Firestore** for data storage
- **Firebase Storage** for images and documents
- **GoHighLevel API** for CRM and communications

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Firebase project setup
- GoHighLevel API key and location ID

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd realestateos_v1
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_GHL_API_KEY=your_ghl_api_key
VITE_GHL_LOCATION_ID=your_ghl_location_id
```

See `.env.example` for reference.

### 3. Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── assets/              # Images, fonts, static files
├── components/
│   ├── ui/             # shadcn/ui-style components (Button, Card, Modal, etc)
│   ├── layout/         # Sidebar, Navbar, AppShell
│   ├── properties/     # Property-specific components
│   ├── leads/          # Lead-specific components
│   ├── clients/        # Client-specific components
│   └── shared/         # Reusable components
├── pages/              # Route page components
├── hooks/              # Custom React hooks
├── lib/
│   ├── firebase.ts     # Firebase config and initialization
│   ├── ghl.ts          # GoHighLevel API client
│   └── utils.ts        # Utility functions
├── store/              # Zustand stores (auth, properties, leads, ui)
├── types/              # TypeScript interfaces and types
├── services/           # API service functions
├── App.tsx             # Root component with routing
└── main.tsx            # Entry point
```

## 🗄️ Firestore Data Models

### Users
```ts
users/{uid}
├── uid: string
├── email: string
├── displayName: string
├── role: 'agent' | 'broker' | 'admin'
├── ghlContactId?: string
└── createdAt: Timestamp
```

### Properties
```ts
properties/{propertyId}
├── id: string
├── title: string
├── type: PropertyType
├── status: PropertyStatus
├── price: number
├── location: Location
├── details: PropertyDetails
├── images: string[]
├── agentId: string
├── tags: string[]
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### Leads
```ts
leads/{leadId}
├── id: string
├── name: string
├── email?: string
├── phone?: string
├── source: LeadSource
├── status: LeadStatus
├── interestedIn: string[]
├── budget?: number
├── agentId: string
├── ghlContactId?: string
├── notes: string
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### Deals
```ts
deals/{dealId}
├── id: string
├── propertyId: string
├── leadId: string
├── agentId: string
├── status: DealStatus
├── salePrice: number
├── commissionRate: number
├── commissionAmount: number
├── reservationDate?: Timestamp
├── closingDate?: Timestamp
├── notes: string
├── documents: string[]
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

## 🎨 Design System

### Colors
- **Primary:** #0F2D52 (Deep Navy)
- **Accent:** #C9963A (Gold)
- **Background:** #F8F7F4 (Off-white)
- **Surface:** #FFFFFF (White)
- **Text:** #1E293B (Slate)
- **Success:** #16A34A
- **Warning:** #D97706
- **Error:** #DC2626

### Typography
- **Display:** Plus Jakarta Sans (bold, confident)
- **Body:** Inter (readable, professional)
- **Monospace:** JetBrains Mono (data, code)

## 🔗 GHL Integration

The app includes a GHL API client (`src/lib/ghl.ts`) with methods for:

- Creating and updating contacts
- Managing pipeline stages
- Sending SMS and email
- Triggering workflows

### Implementation
When a lead is created or updated, the app syncs with GHL:
1. Contact is created/updated in GHL
2. Contact is added to the appropriate pipeline stage
3. Workflows can be triggered based on lead status

## 🔒 Authentication Flow

1. User logs in with email/password or Google OAuth via Firebase
2. On first login, a user profile is created in Firestore
3. User role (`agent`, `broker`, or `admin`) determines access level
4. All routes are protected with auth guards
5. Logout clears the session

## 📱 Conventions

- **Dates:** Stored as Firestore Timestamp, displayed in Philippine format (MMM DD, YYYY)
- **Currency:** Philippine Peso (₱)
- **File naming:** kebab-case for files, PascalCase for components
- **Variables:** camelCase
- **Firestore updates:** Always include `updatedAt: serverTimestamp()`
- **Loading states:** Use skeleton loaders, not spinners

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Initialize Firebase:
   ```bash
   firebase init hosting
   ```

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GoHighLevel API](https://developers.gohighlevel.com)
- [React Router v6](https://reactrouter.com)
- [Zustand](https://zustand-demo.vercel.app)

## 🤝 Contributing

This is a professional-grade application. Please follow the established code structure and conventions when contributing.

## 📄 License

© 2026 RealEstateOS. All rights reserved.

---

**Happy listing, nurturing, and closing! 🏠**
