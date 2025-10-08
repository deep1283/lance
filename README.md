# 🚀 LanceIQ - AI-Powered Business Intelligence

LanceIQ is an AI-powered intelligence system designed to help businesses track competitors, analyze trends, and accelerate growth.

## ✨ Features

- 🎨 **Modern Landing Page** with beautiful animations
- 🔐 **Supabase Authentication**
  - Phone OTP Login
  - Google OAuth
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Built with Next.js 14** - App Router, TypeScript, Tailwind CSS
- 🎭 **Framer Motion** - Smooth animations and transitions

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Supabase
- **Animations:** Framer Motion
- **UI Components:** Custom components with modern design

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account ([Create one here](https://supabase.com))

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

**📖 For detailed Supabase setup instructions, see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)**

Quick setup:

1. Create a project at [app.supabase.com](https://app.supabase.com)
2. Get your project URL and anon key from Settings → API
3. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Enable authentication providers in Supabase:
   - Phone (with Twilio or Supabase provider)
   - Google OAuth

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
lance/
├── src/
│   ├── app/
│   │   ├── approval/       # Approval waiting page
│   │   ├── login/          # Login page
│   │   ├── onboarding/     # Onboarding page (placeholder)
│   │   ├── layout.tsx      # Root layout with AuthProvider
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── Hero.tsx        # Hero section
│   │   ├── Features.tsx    # Features section
│   │   ├── Footer.tsx      # Footer component
│   │   └── navbar.tsx      # Navigation bar
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   └── lib/
│       └── supabase.ts     # Supabase client
├── public/
│   └── assets/             # Images and videos
├── supabase-setup.sql      # Database setup script
└── .env.local              # Environment variables (create this)
```

## 🔑 Authentication Features

### Phone OTP Login

1. User enters phone number
2. OTP sent via SMS
3. User verifies OTP
4. Session created

### Google OAuth

1. User clicks "Continue with Google"
2. Redirected to Google sign-in
3. Authorized and redirected back
4. Session created

## 🎨 Key Components

- **Hero Section:** Eye-catching landing with CTA button
- **Features Section:** Showcases product capabilities
- **Login Page:** Modern glass-morphism design with dual auth methods
- **Auth Context:** Global authentication state management

## 🔒 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS) ready
- Secure session management
- HTTPS enforced in production

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly buttons and inputs
- Optimized images with Next.js Image

## 🚧 Roadmap

- [x] Landing page
- [x] Authentication (Phone OTP + Google)
- [x] Approval system (manual user approval)
- [ ] Onboarding flow
- [ ] User dashboard
- [ ] Competitor tracking
- [ ] SEO intelligence
- [ ] Trend analysis
- [ ] User profile management
- [ ] Protected routes
- [ ] Analytics integration

## 📚 Documentation

- [Supabase Setup Guide](./SETUP_INSTRUCTIONS.md) - Detailed auth setup
- [Approval System Guide](./APPROVAL_SYSTEM_GUIDE.md) - Complete approval system docs
- [Approval Quick Start](./APPROVAL_QUICK_START.md) - Quick setup (3 steps)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues or questions:

1. Check [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
2. Review Supabase dashboard logs
3. Check browser console for errors

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for authentication infrastructure
- Framer Motion for smooth animations
- Tailwind CSS for utility-first styling

---

**Built with ❤️ for business growth**
