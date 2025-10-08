# ⚡ Quick Start - Approval System

## 🚀 3-Step Setup

### Step 1: Set Up Database (2 minutes)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Copy contents from `supabase-setup.sql`
4. Click **Run**
5. Done! ✅

### Step 2: Test the Flow (2 minutes)

```bash
npm run dev
```

1. Go to http://localhost:3000
2. Click "Start Free Trial"
3. Sign up with phone or Google
4. You'll land on `/approval` page
5. You should see "Awaiting Approval" ⏳

### Step 3: Approve a User (1 minute)

1. Go to Supabase → **Table Editor**
2. Open `users` table
3. Find your test user
4. Change `is_approved` to `true`
5. Refresh the approval page
6. You'll be redirected to `/onboarding` 🎉

---

## 📱 What Users See

### Not Approved (Default):

```
┌─────────────────────────────────────┐
│                                     │
│         🕐  (Clock Icon)            │
│                                     │
│      Awaiting Approval              │
│                                     │
│  Hey 👋 Thanks for signing up      │
│  to LanceIQ.                        │
│                                     │
│  Your account is under review...    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 💡 Takes 24-48 hours...      │  │
│  └──────────────────────────────┘  │
│                                     │
│  [        Logout        ]           │
│                                     │
│  Need help? Contact Support         │
│                                     │
└─────────────────────────────────────┘
```

### Approved:

```
Automatically redirects to /onboarding
```

---

## 🎯 User Journey

```
┌─────────┐
│  Login  │
│  Page   │
└────┬────┘
     │
     ▼
┌─────────┐      is_approved = false     ┌──────────┐
│Approval │ ──────────────────────────> │  Stay    │
│  Check  │                              │  Here    │
└────┬────┘                              └──────────┘
     │
     │ is_approved = true
     ▼
┌──────────┐
│Onboarding│
│   Page   │
└──────────┘
```

---

## 🔧 How to Approve Users

### Quick SQL (Paste in Supabase SQL Editor):

```sql
-- Approve by email
UPDATE users SET is_approved = true
WHERE email = 'user@example.com';
```

### Via Table Editor:

1. Table Editor → `users` table
2. Click on user row
3. Toggle `is_approved` to `true`
4. User can now access the app

---

## 📊 Useful Queries

### See all pending users:

```sql
SELECT email, created_at
FROM users
WHERE is_approved = false;
```

### Count pending:

```sql
SELECT COUNT(*) FROM users WHERE is_approved = false;
```

### Approve all from specific domain:

```sql
UPDATE users SET is_approved = true
WHERE email LIKE '%@yourcompany.com';
```

---

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check for errors
npm run build
```

---

## 🎨 Design Features

✅ **Same background** as landing page  
✅ **Glassmorphism** card design  
✅ **LanceIQ colors** (#6c63ff)  
✅ **Roboto font**  
✅ **Framer Motion** animations  
✅ **Fully responsive**  
✅ **Logout button**  
✅ **Support link**

---

## 🐛 Troubleshooting

### User stuck on approval page?

→ Check Supabase: Set `is_approved = true`

### "users table doesn't exist"?

→ Run `supabase-setup.sql`

### Not redirecting after approval?

→ Clear cookies, refresh page

### New user not in users table?

→ Check trigger is active in Supabase

---

## 📞 Need Help?

1. Check `APPROVAL_SYSTEM_GUIDE.md` for detailed docs
2. Review `supabase-setup.sql` for database setup
3. Check Supabase logs for errors

---

**That's it! Your approval system is ready.** 🎉

Users will see a beautiful waiting page until you approve them.
