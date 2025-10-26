# PulseConnect - AI-Powered Blood & Plasma Donation Platform

A comprehensive web application that connects blood donors, recipients, and hospitals through an intelligent digital ecosystem. Built with modern web technologies and integrated with blockchain verification for transparency and trust.

## 🎯 Project Overview

PulseConnect (formerly BloodConnect) is an AI-powered blood and plasma donation management platform designed to:

- **Connect donors with recipients** in real-time
- **Provide emergency blood and plasma request services**
- **Offer hospital integration** for better coordination
- **Maintain donor profiles** with AI-powered eligibility prediction
- **Track blood and plasma availability** statistics
- **Implement blockchain verification** for transparency
- **Support both blood and plasma donation** workflows

## 🚀 Key Features

### Core Functionality
- **Donor Registration & Search**: Comprehensive donor profiles with health information
- **Blood & Plasma Requests**: Emergency and scheduled donation requests
- **Hospital Integration**: Complete hospital management system
- **Real-time Messaging**: Instant communication between donors and hospitals
- **Interactive Maps**: Location-based donor and hospital discovery
- **Emergency Services**: Rapid response to urgent blood needs
- **Blockchain Verification**: Immutable donation records on Polygon blockchain

### AI-Powered Features
- **Eligibility Prediction**: AI-based donor eligibility assessment
- **Smart Matching**: Intelligent donor-recipient compatibility analysis
- **Health Form Analysis**: Automated health condition evaluation
- **Recommendation Engine**: AI-powered donor suggestions

## 🛠️ Technology Stack

### Frontend Framework
- **React 18.3.1** - Modern UI library with hooks and functional components
- **TypeScript 5.5.3** - Type-safe JavaScript development
- **Vite 5.4.1** - Fast build tool and development server
- **React Router DOM 6.26.2** - Client-side routing

### UI & Styling
- **Shadcn UI** - Modern component library based on Radix UI
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful icon library
- **Recharts 2.12.7** - Data visualization and analytics

### State Management & Forms
- **React Context API** - Global state management
- **React Hook Form 7.53.0** - Performant form handling
- **Zod 3.23.8** - Schema validation
- **@hookform/resolvers 3.9.0** - Form validation integration

### Backend & Database
- **Supabase 2.50.0** - PostgreSQL database with real-time capabilities
- **Firebase 10.13.1** - Real-time messaging and file storage
- **PostgreSQL** - Primary database (via Supabase)
- **Row Level Security (RLS)** - Database-level security

### Authentication & Security
- **Supabase Auth** - Secure authentication with 2FA/OTP
- **Multi-factor Authentication** - Email-based OTP verification
- **Role-based Access Control** - Different permissions for donors, hospitals, guests
- **Session Management** - Secure session handling

### Blockchain Integration
- **Polygon (Matic)** - Ethereum-compatible blockchain for verification
- **Ethers.js 6.13.2** - Blockchain interaction library
- **Immutable Records** - Tamper-proof donation records
- **Transaction Verification** - Public verification of donations

### Real-time Features
- **Firebase Firestore** - Real-time database for messaging
- **Firebase Storage** - File upload and media management
- **WebSocket Connections** - Efficient real-time communication
- **Push Notifications** - Instant user alerts

### Development Tools
- **ESLint 9.9.0** - Code linting and quality assurance
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS 8.4.47** - CSS processing
- **Autoprefixer 10.4.20** - CSS vendor prefixing
- **Lovable Tagger** - Component tagging for development

### Additional Libraries
- **Date-fns 3.6.0** - Date manipulation utilities
- **Emoji Picker React 4.9.4** - Emoji selection component
- **Input OTP 1.2.4** - OTP input component
- **React Day Picker 8.10.1** - Date picker component
- **React Resizable Panels 2.1.3** - Resizable panel layouts
- **Sonner 1.5.0** - Toast notifications
- **Vaul 0.9.3** - Drawer component

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   ├── layout/         # Layout components (Navbar, Sidebar)
│   ├── ChatBot.tsx     # AI chatbot component
│   ├── HealthForm.tsx  # Health information form
│   └── ...
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   ├── blockchain/     # Blockchain integration
│   ├── firebase/       # Firebase configuration
│   └── supabase/       # Supabase configuration
├── lib/                # Utility functions and helpers
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── hospital/       # Hospital-specific pages
│   └── ...
└── data/               # Mock data and sample data
```

## 🗄️ Database Schema

### Core Tables
- **profiles** - User/donor information and health data
- **hospitals** - Hospital and medical facility data
- **requests** - Blood and plasma donation requests
- **appointments** - Donor-hospital appointment scheduling
- **plasma_inventory** - Plasma stock management
- **plasma_donations** - Plasma donation records
- **blockchain_ledger** - Blockchain transaction records

### Key Features
- **Row Level Security (RLS)** - Database-level access control
- **Foreign Key Constraints** - Data integrity enforcement
- **Indexes** - Optimized query performance
- **Check Constraints** - Data validation at database level

## 🤖 AI & Machine Learning

### Current Implementation
- **Eligibility Prediction**: Basic rule-based eligibility checking
- **Health Form Analysis**: Automated health condition evaluation
- **Smart Matching**: Compatibility analysis for donor-recipient matching

### Planned AI Features
- **Random Forest Model**: Advanced plasma donation eligibility prediction
- **Pattern Recognition**: Learning from successful matches
- **Recommendation Engine**: AI-powered donor suggestions
- **Predictive Analytics**: Advanced insights and forecasting

## 🔗 API Integrations

### Supabase
- **Authentication**: User management and security
- **Database**: PostgreSQL with real-time subscriptions
- **Storage**: File upload and management
- **Edge Functions**: Serverless functions

### Firebase
- **Firestore**: Real-time messaging database
- **Storage**: File and media storage
- **Authentication**: Additional auth services

### Blockchain
- **Polygon Network**: Low-cost, fast transactions
- **Ethers.js**: Blockchain interaction library
- **Smart Contracts**: Automated donation verification

## 🚀 Getting Started

### Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- Supabase account
- Firebase account (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd blood-connect
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

4. **Start development server**
```bash
npm run dev
```

5. **Open the application**
Visit `http://localhost:8080` (or the URL shown by Vite)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Vercel** - Recommended for React applications
- **Netlify** - Static site hosting
- **GitHub Pages** - Free hosting for public repositories
- **Azure Static Web Apps** - Microsoft's hosting solution

## 🔒 Security Features

- **Multi-factor Authentication** - Email-based OTP verification
- **Role-based Access Control** - Granular permission system
- **Data Encryption** - All sensitive data encrypted in transit and at rest
- **Blockchain Verification** - Immutable donation records
- **GDPR Compliance** - Data protection and user rights

## 📱 Mobile Responsiveness

- **Mobile-first Design** - Optimized for mobile devices
- **Responsive Layout** - Adapts to all screen sizes
- **Touch-friendly Interface** - Optimized for touch interactions
- **Progressive Web App** - App-like experience in browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This is a comprehensive blood donation management platform with advanced features including AI-powered matching, blockchain verification, and real-time communication. The system is designed to handle both blood and plasma donations with full hospital integration.

## Contributing

- Fork the repo
- Create a feature branch
- Open a pull request with a clear description
- Keep commits small and focused

## Notes

- This README focuses on the frontend. If your project includes backend services, machine learning models, or Azure deployments, add a dedicated README or sections for those components with instructions and required environment variables.
- Replace placeholder URLs and API keys with your actual services.

## License & contact

Specify your license (e.g., MIT) in LICENSE file.

For questions or updates, open an issue or contact the repository owner.
