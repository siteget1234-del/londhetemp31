# Mobile Number Authentication Setup

## Overview
The login system has been modified to use **mobile numbers** instead of email addresses. Users enter their 10-digit mobile number, which is automatically converted to an email format (`MOBILE@gmail.com`) for Supabase authentication.

## How It Works

### Login Flow
1. User enters mobile number: `9067551748`
2. System converts to email: `9067551748@gmail.com`
3. Supabase authenticates using the converted email
4. User is logged in successfully

### Example
- **User sees**: "Mobile Number" input field
- **User enters**: `9067551748`
- **System uses**: `9067551748@gmail.com` for authentication

## Creating Admin Accounts

Since Supabase only accepts email-based authentication, you need to create accounts in the email format:

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Enter details:
   - **Email**: `9067551748@gmail.com` (mobile number + @gmail.com)
   - **Password**: Choose a secure password
   - ✅ Check "Auto Confirm User"
6. Click **"Create user"**

### Method 2: Via SQL (Bulk Creation)

```sql
-- Example: Create account for mobile 9067551748
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  '9067551748@gmail.com',
  crypt('your_password_here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

## User Experience

### Login Page Changes
- **Label**: "Mobile Number" (instead of "Email")
- **Icon**: 📱 Smartphone icon (instead of ✉️ Mail icon)
- **Input Type**: `tel` with pattern validation
- **Placeholder**: "Enter mobile number (e.g., 9067551748)"
- **Validation**: 
  - 10-digit number only
  - Auto-removes non-numeric characters
  - Required field

### Admin Profile Page
Shows both:
1. **Mobile Number**: `9067551748` (displayed prominently)
2. **Email (for authentication)**: `9067551748@gmail.com` (shown in smaller text with note)

## Testing

### Test Credentials Creation
Create a test account:
- Mobile: `9876543210`
- Email in Supabase: `9876543210@gmail.com`
- Password: `TestPass123!`

### Login Test
1. Go to: `/login`
2. Enter mobile: `9876543210`
3. Enter password: `TestPass123!`
4. Click "Sign In"
5. Should redirect to `/admin`

## Validation Rules

### Mobile Number
- **Length**: Exactly 10 digits
- **Format**: Numeric only (0-9)
- **Pattern**: `[0-9]{10}`
- **Auto-cleanup**: Non-numeric characters are automatically removed

### Password
- **Min Length**: 6 characters (Supabase default)
- **Recommendation**: Use strong passwords with mix of letters, numbers, symbols

## Important Notes

1. **Email Format**: All mobile numbers are converted to `MOBILE@gmail.com`
2. **Uniqueness**: Each mobile number must be unique (enforced by Supabase email uniqueness)
3. **No OTP**: This is password-based authentication (no SMS OTP)
4. **Display**: Users only see mobile numbers in the UI
5. **Backend**: Supabase stores and authenticates using email format

## Migration Guide

If you have existing email-based users:

### Option 1: Keep Both Systems
- Old users: Continue using email@example.com
- New users: Use mobile@gmail.com format
- Update login page to accept both formats

### Option 2: Migrate Existing Users
```sql
-- Only if you want to convert existing users
-- WARNING: This changes their login credentials!
UPDATE auth.users 
SET email = CONCAT(SUBSTRING(email FROM 1 FOR 10), '@gmail.com')
WHERE email NOT LIKE '%@gmail.com';
```

## Security Considerations

1. **Password Strength**: Enforce strong password policies
2. **Rate Limiting**: Implement login attempt limits
3. **2FA**: Consider adding two-factor authentication
4. **Session Management**: Configure appropriate session timeouts
5. **HTTPS Only**: Always use HTTPS in production

## Troubleshooting

### Issue: "Invalid login credentials"
- **Check**: Mobile number is exactly 10 digits
- **Check**: User exists in Supabase with email `MOBILE@gmail.com`
- **Check**: Password is correct

### Issue: "User already exists"
- **Cause**: Mobile number already registered
- **Solution**: Use password recovery or different mobile number

### Issue: "Email format error"
- **Check**: Conversion logic is working (`${mobile}@gmail.com`)
- **Check**: No spaces or special characters in mobile input

## Code Reference

### Login Conversion Logic
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  
  // Convert mobile to email format
  const email = `${formData.mobile}@gmail.com`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: formData.password
  });
  
  // ... rest of login logic
};
```

### Display Mobile in Profile
```javascript
// Extract mobile from email
const mobile = user?.email ? user.email.replace('@gmail.com', '') : '';
```

## API Integration

If you need to expose mobile numbers via API:

```javascript
// Backend API endpoint
app.get('/api/user/profile', async (req, res) => {
  const user = await getCurrentUser(req);
  
  return res.json({
    mobile: user.email.replace('@gmail.com', ''),
    userId: user.id,
    createdAt: user.created_at
  });
});
```

## Future Enhancements

1. **SMS OTP Login**: Add passwordless login with OTP
2. **Mobile Verification**: Send verification SMS on signup
3. **International Support**: Add country code support (+91, +1, etc.)
4. **Multiple Mobiles**: Allow users to link multiple mobile numbers
5. **WhatsApp Integration**: Direct integration with WhatsApp business

## Support

For issues or questions:
- Check Supabase auth logs
- Review browser console for errors
- Verify mobile-to-email conversion is working
- Test with a known working mobile number

---

## Quick Start Checklist

- [x] Login page updated to use mobile number
- [x] Conversion logic implemented (`MOBILE@gmail.com`)
- [x] Admin profile shows mobile number
- [x] Input validation for 10-digit mobile
- [ ] Create test user in Supabase
- [ ] Test login flow
- [ ] Document for end users
- [ ] Set up password recovery (if needed)

---

**Note**: This approach allows you to use mobile numbers for login while maintaining compatibility with Supabase's email-based authentication system. The conversion is transparent to users who only see mobile numbers in the UI.
