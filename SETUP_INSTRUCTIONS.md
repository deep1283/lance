# LanceIQ - Supabase Authentication Setup Instructions

## 🚀 Quick Start Guide

This guide will help you set up Supabase authentication for LanceIQ with Phone OTP and Google OAuth.

---

## 📋 Prerequisites

1. A Supabase account (create one at [supabase.com](https://supabase.com))
2. Node.js installed
3. npm or yarn package manager

---

## 🔧 Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Project name: `lanceiq` (or your preferred name)
   - Database password: (create a strong password)
   - Region: (choose the closest to your users)
4. Click "Create new project" and wait for it to initialize (~2 minutes)

---

## 🔑 Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon in sidebar)
2. Go to **API** section
3. Copy the following:

   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

4. Create a `.env.local` file in the `lance` directory:

   ```bash
   cd /Users/deepmishra/vscode/LanceIQ/lance
   touch .env.local
   ```

5. Add your credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## 📱 Step 3: Enable Phone Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Phone** and toggle it **ON**
3. Choose your SMS provider:
   - **Twilio** (recommended for production)
   - **MessageBird**
   - Or use Supabase's built-in provider for testing

### For Testing (Supabase Provider):

- No additional setup needed
- Limited to development/testing only

### For Production (Twilio):

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Get your Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number
3. In Supabase Phone settings, enter your Twilio credentials
4. Click "Save"

---

## 🔐 Step 4: Enable Google OAuth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. You'll need to create a Google OAuth app:

### Create Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:

   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Configure consent screen if prompted
   - Application type: **Web application**
   - Name: `LanceIQ Auth`
5. Add Authorized redirect URIs:

   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

   Replace `your-project` with your actual Supabase project reference

6. Click "Create" and copy:

   - Client ID
   - Client Secret

7. Back in Supabase, paste these values:
   - Google Client ID
   - Google Client Secret
   - Click "Save"

---

## 🎨 Step 5: Configure Authentication Settings

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set your site URL:

   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

3. Add redirect URLs (one per line):

   ```
   http://localhost:3000/**
   https://yourdomain.com/**
   ```

4. Go to **Authentication** → **Email Templates** (optional)
   - Customize your email templates if needed

---

## 🏃 Step 6: Run Your Application

1. Install dependencies (if not already done):

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

4. Click "Start Free Trial" or "GET STARTED" button
   - You'll be redirected to `/login`

---

## ✅ Testing Authentication

### Test Phone OTP:

1. Enter a valid phone number (with country code, e.g., +1234567890)
2. Click "Send OTP"
3. Check your phone for the OTP code
4. Enter the code and click "Verify OTP"

### Test Google OAuth:

1. Click "Continue with Google"
2. Sign in with your Google account
3. Authorize the application
4. You'll be redirected back to the homepage

---

## 🐛 Troubleshooting

### Phone OTP not working:

- ✅ Check if Phone provider is enabled in Supabase
- ✅ Verify Twilio credentials are correct (if using Twilio)
- ✅ Ensure phone number includes country code (e.g., +1)
- ✅ Check Supabase logs for detailed error messages

### Google OAuth not working:

- ✅ Verify Google OAuth is enabled in Supabase
- ✅ Check Client ID and Client Secret are correct
- ✅ Ensure redirect URI matches exactly (including https://)
- ✅ Verify Google+ API is enabled in Google Cloud Console
- ✅ Check if consent screen is configured properly

### General Issues:

- ✅ Verify `.env.local` file exists and has correct values
- ✅ Restart dev server after changing `.env.local`
- ✅ Clear browser cache/cookies
- ✅ Check browser console for error messages
- ✅ Verify Supabase project is active (not paused)

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Phone Auth Guide](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase OAuth Guide](https://supabase.com/docs/guides/auth/social-login)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use environment variables for all sensitive data
3. Enable Row Level Security (RLS) in Supabase
4. Implement rate limiting for auth endpoints
5. Use HTTPS in production
6. Regularly rotate API keys and secrets
7. Monitor authentication logs for suspicious activity

---

## 🚀 Next Steps

After authentication is working:

1. Create protected routes/pages
2. Add user profile management
3. Implement logout functionality
4. Add session persistence
5. Create user dashboard
6. Add role-based access control

---

## 💡 Tips

- Use **Supabase's built-in auth helpers** for easier integration
- Test authentication in **incognito mode** to avoid session conflicts
- Use **Supabase Studio** to view and manage users
- Enable **email confirmations** for added security (optional)
- Set up **password recovery** flows (if using email auth)

---

## 📞 Support

If you encounter any issues:

1. Check the Supabase dashboard logs
2. Review browser console errors
3. Verify all environment variables
4. Consult Supabase documentation
5. Join Supabase Discord community

---

**Happy Coding! 🎉**
