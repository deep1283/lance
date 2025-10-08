# 🔐 LanceIQ Approval System Guide

## 📋 Overview

The approval system ensures that only approved users can access your application. After signup, users land on a waiting page until you manually approve them in Supabase.

---

## 🎯 User Flow

```
Login/Signup → /approval → (Manual Approval) → /onboarding → Full App Access
```

### Detailed Flow:

1. **User Signs Up/Logs In** → Redirected to `/approval`
2. **Approval Page Checks** `is_approved` field in database
3. **If `is_approved = false`** → User sees waiting message
4. **If `is_approved = true`** → Auto-redirect to `/onboarding`
5. **If not logged in** → Redirect to `/login`

---

## 🗄️ Database Setup

### Step 1: Run the SQL Setup

1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run**

This will create:

- ✅ `users` table with `is_approved` field
- ✅ Row Level Security (RLS) policies
- ✅ Automatic user creation trigger
- ✅ Helper function to approve users

### Step 2: Verify Table Creation

Check that the `users` table exists with these columns:

```sql
- id (UUID) - Primary Key
- email (TEXT)
- phone (TEXT)
- is_approved (BOOLEAN) - defaults to FALSE
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 👨‍💼 How to Approve Users (Manual Process)

### Method 1: Using Supabase Dashboard (Easiest)

1. Go to **Table Editor** in Supabase
2. Select the `users` table
3. Find the user you want to approve
4. Click on the row
5. Change `is_approved` from `false` to `true`
6. Save

### Method 2: Using SQL Editor

```sql
-- Approve by email
UPDATE public.users
SET is_approved = TRUE
WHERE email = 'user@example.com';

-- Approve by user ID
UPDATE public.users
SET is_approved = TRUE
WHERE id = 'user-uuid-here';

-- Approve multiple users
UPDATE public.users
SET is_approved = TRUE
WHERE email IN ('user1@example.com', 'user2@example.com');
```

### Method 3: Using the Helper Function

```sql
SELECT approve_user('user-uuid-here');
```

---

## 📁 Files Created

### New Pages:

```
src/app/
├── approval/
│   └── page.tsx          ✨ Approval waiting page
└── onboarding/
    └── page.tsx          ✨ Placeholder onboarding page
```

### Database Setup:

```
lance/
└── supabase-setup.sql    ✨ Database migration script
```

### Modified Files:

```
src/app/login/page.tsx    🔄 Updated redirects to /approval
```

---

## 🎨 Approval Page Design

### Features:

- ✅ **Same background** as landing page
- ✅ **Glassmorphism card** (frosted glass effect)
- ✅ **LanceIQ brand colors** (#6c63ff)
- ✅ **Roboto font** for consistency
- ✅ **Framer Motion animations**
- ✅ **Logout button** with hover effects
- ✅ **Responsive design** (mobile-first)

### Visual Elements:

- 🕐 Clock icon in gradient circle
- 👋 Friendly greeting
- 💡 Info box with timing expectations
- 📧 Support contact link
- 🚪 Logout button

---

## 🔄 Redirect Logic

### Approval Page (`/approval`):

```typescript
if (!user) {
  // Not logged in → Login page
  redirect to "/login"
}

if (is_approved === true) {
  // Approved → Onboarding
  redirect to "/onboarding"
}

if (is_approved === false) {
  // Not approved → Stay on approval page
  show waiting message
}
```

### Login Page (`/login`):

```typescript
// After successful authentication
redirect to "/approval"
```

---

## 🧪 Testing the Flow

### Test Scenario 1: New User Signup

1. Go to `/login`
2. Sign up with phone OTP or Google
3. Should redirect to `/approval`
4. Should see "Awaiting Approval" message
5. Click "Logout" → Returns to home

### Test Scenario 2: Approve User

1. Log in as new user (stuck on `/approval`)
2. Go to Supabase Dashboard
3. Set `is_approved = true` for that user
4. Refresh the `/approval` page
5. Should auto-redirect to `/onboarding`

### Test Scenario 3: Approved User Login

1. User is already approved in database
2. Log in via `/login`
3. Lands on `/approval`
4. Immediately redirects to `/onboarding`

### Test Scenario 4: Direct URL Access

1. **Not logged in** + visit `/approval` → Redirect to `/login`
2. **Logged in + not approved** + visit `/approval` → Stay on page
3. **Logged in + approved** + visit `/approval` → Redirect to `/onboarding`

---

## 🛠️ Customization Options

### Change Approval Timing Message:

Edit `/src/app/approval/page.tsx`:

```tsx
<p className="text-sm text-gray-300 text-center">
  💡 This usually takes 24-48 hours. We'll notify you via email once your
  account is approved.
</p>
```

### Change Support Email:

```tsx
<a href="mailto:support@lanceiq.com">Contact Support</a>
```

### Auto-Approve for Testing:

In `supabase-setup.sql`, change default:

```sql
is_approved BOOLEAN DEFAULT TRUE  -- Auto-approve everyone (testing only!)
```

⚠️ **Important**: Set back to `FALSE` for production!

---

## 🚨 Common Issues

### Issue 1: User sees "Awaiting Approval" forever

**Solution:**

- Check Supabase Table Editor
- Verify `is_approved` is set to `true`
- Check user ID matches between `auth.users` and `public.users`

### Issue 2: Redirect loop

**Solution:**

- Clear browser cookies
- Check that trigger is creating user records
- Verify RLS policies are correct

### Issue 3: "users table doesn't exist" error

**Solution:**

- Run `supabase-setup.sql` in SQL Editor
- Check table permissions
- Verify Supabase project is active

### Issue 4: User not created in users table

**Solution:**

- Check that trigger `on_auth_user_created` exists
- Verify trigger function `handle_new_user()` exists
- Look at Supabase logs for errors

---

## 🔒 Security Notes

### Row Level Security (RLS):

- ✅ Users can only view their own data
- ✅ Users can update their own data (except `is_approved`)
- ✅ Admin must manually approve via Supabase

### Best Practices:

1. Never expose `is_approved` update to client-side
2. Always approve users manually or via secure admin panel
3. Keep RLS policies enabled
4. Monitor new signups regularly
5. Set up email notifications for new users

---

## 📊 Database Queries for Admins

### View all pending approvals:

```sql
SELECT id, email, phone, created_at
FROM public.users
WHERE is_approved = FALSE
ORDER BY created_at DESC;
```

### Count pending approvals:

```sql
SELECT COUNT(*) as pending_count
FROM public.users
WHERE is_approved = FALSE;
```

### Recently approved users:

```sql
SELECT id, email, updated_at
FROM public.users
WHERE is_approved = TRUE
ORDER BY updated_at DESC
LIMIT 10;
```

### Bulk approve users older than X days:

```sql
UPDATE public.users
SET is_approved = TRUE
WHERE is_approved = FALSE
  AND created_at < NOW() - INTERVAL '7 days';
```

---

## 🎯 Next Steps

### Immediate:

1. ✅ Run `supabase-setup.sql` in Supabase
2. ✅ Test the approval flow
3. ✅ Customize messages if needed

### Future Enhancements:

1. **Admin Dashboard** - Create UI to approve/reject users
2. **Email Notifications** - Send email when user is approved
3. **Approval Reasons** - Add notes/reasons for approval/rejection
4. **Automatic Approval** - Based on email domain or other criteria
5. **Approval Queue** - Show pending users in admin panel
6. **User Roles** - Extend to role-based access control

---

## 📞 Support & Resources

### Documentation:

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Framer Motion](https://www.framer.com/motion/)

### Quick Commands:

```bash
# Start dev server
npm run dev

# Build and check for errors
npm run build

# Check TypeScript
npx tsc --noEmit
```

---

## ✅ Checklist

Before going live:

- [ ] Run `supabase-setup.sql` in production Supabase
- [ ] Test signup → approval → onboarding flow
- [ ] Test logout functionality
- [ ] Customize approval timing message
- [ ] Update support email
- [ ] Set up monitoring for new signups
- [ ] Document internal approval process
- [ ] Train team on how to approve users
- [ ] Test on mobile devices
- [ ] Verify RLS policies are active

---

**Your approval system is ready! 🎉**

Users will now see a beautiful waiting page until you approve them manually in Supabase.
