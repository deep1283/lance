# ⚡ Quick Start Guide - LanceIQ Authentication

## 🎯 What We've Built

You now have a complete authentication system with:

- ✅ Phone OTP login
- ✅ Google OAuth login
- ✅ Beautiful login page matching your landing page design
- ✅ Loading states and error handling
- ✅ Mobile-responsive design
- ✅ Session management with Supabase

## 🚀 Next Steps to Get Running

### Step 1: Create Your Environment File

Create a file called `.env.local` in the `lance` folder with these values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to get these values?**

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (takes ~2 minutes)
3. Go to Settings → API
4. Copy the URL and anon key

### Step 2: Enable Authentication Methods

In your Supabase dashboard:

**For Phone Auth:**

1. Go to Authentication → Providers
2. Toggle **Phone** to ON
3. For testing, you can use the Supabase provider (no extra setup)
4. For production, set up Twilio

**For Google OAuth:**

1. Go to Authentication → Providers
2. Toggle **Google** to ON
3. Follow the Google setup wizard
4. Add your redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### Step 3: Test the Application

```bash
npm run dev
```

Then:

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Start Free Trial" or "GET STARTED"
3. You'll be redirected to the login page
4. Try both login methods!

## 📱 What Each Button Does

### Landing Page Buttons

- **"Start Free Trial"** (Hero section) → Redirects to `/login`
- **"GET STARTED"** (Navbar) → Redirects to `/login`

### Login Page Options

- **Phone OTP:** Enter phone → Receive SMS → Enter code → Logged in
- **Google OAuth:** Click button → Google sign-in → Logged in
- **Back to Home:** Returns to landing page

## 🎨 Design Features

The login page includes:

- Same background image as landing page
- Glass-morphism effect (frosted glass look)
- Smooth animations with Framer Motion
- Loading states during authentication
- Error messages in red
- Success messages in green
- Mobile-responsive layout

## 🔍 File Structure Created

```
lance/
├── src/
│   ├── app/
│   │   └── login/
│   │       └── page.tsx          ← Login page
│   ├── components/
│   │   ├── Hero.tsx              ← Updated with redirect
│   │   └── navbar.tsx            ← Updated with redirect
│   ├── contexts/
│   │   └── AuthContext.tsx       ← Auth state management
│   └── lib/
│       └── supabase.ts           ← Supabase client
└── .env.local                    ← CREATE THIS FILE
```

## ✨ Features Implemented

### ✅ Phone OTP Authentication

- Country code validation
- OTP sending with loading state
- OTP verification
- Error handling
- Change number option

### ✅ Google OAuth

- One-click sign-in
- Automatic redirect after auth
- Error handling
- Loading states

### ✅ UI/UX Enhancements

- Glassmorphism design
- Gradient buttons
- Hover animations
- Focus states
- Mobile-friendly inputs
- Clear error/success messages
- Back to home link

## 🐛 Common Issues & Solutions

### Issue: "Module not found: @supabase/supabase-js"

**Solution:** Run `npm install` again

### Issue: Login page shows but buttons don't work

**Solution:** Check `.env.local` file exists and has correct values

### Issue: Phone OTP not sending

**Solution:**

1. Check Supabase dashboard → Authentication → Providers → Phone is enabled
2. For testing, use Supabase's built-in provider
3. For production, set up Twilio credentials

### Issue: Google login redirects but doesn't work

**Solution:**

1. Ensure Google OAuth is enabled in Supabase
2. Check redirect URI matches exactly
3. Verify Google Cloud Console OAuth setup

## 📖 Testing Checklist

- [ ] Landing page loads correctly
- [ ] "Start Free Trial" button redirects to `/login`
- [ ] "GET STARTED" button redirects to `/login`
- [ ] Login page shows with background image
- [ ] Phone number input accepts text
- [ ] "Send OTP" button shows loading state
- [ ] OTP input appears after sending
- [ ] "Continue with Google" button works
- [ ] Error messages display correctly
- [ ] "Back to Home" link works

## 🎯 What's Next?

After authentication is working, you can:

1. **Create Protected Routes**

   - Dashboard page
   - User profile
   - Settings page

2. **Add Logout Functionality**

   - Use the `signOut` function from `AuthContext`
   - Add a logout button in navbar

3. **Redirect After Login**

   - Currently redirects to homepage
   - Change to dashboard or user-specific page

4. **User Profile Management**

   - Update user information
   - Profile pictures
   - Preferences

5. **Build Core Features**
   - Competitor tracking
   - SEO intelligence
   - Trend analysis

## 🆘 Need Help?

1. Check `SETUP_INSTRUCTIONS.md` for detailed Supabase setup
2. Review browser console for error messages
3. Check Supabase dashboard logs
4. Verify all environment variables are set correctly

## 💡 Pro Tips

- Test in incognito mode to avoid session conflicts
- Use Supabase Studio to view authenticated users
- Check the Auth Context to access user data anywhere
- Phone numbers must include country code (+1, +44, etc.)
- Google OAuth requires HTTPS in production

---

**You're all set! 🎉**

Run `npm run dev` and test your authentication flow!
