# E-Commerce Admin Dashboard - Setup Guide

## 🎉 Project Overview

This is a **full-stack headless CMS e-commerce webapp** with a powerful admin dashboard. The customer-facing template is fully functional, and now includes:

- ✅ **Admin Authentication** via Supabase Auth (email/password)
- ✅ **Admin Dashboard** with complete shop management
- ✅ **Product Management** (CRUD with Cloudinary image uploads)
- ✅ **Banner Management** (CRUD for homepage carousels)
- ✅ **Shop Info Management** (name, phone, address)
- ✅ **Real-time Data Sync** from Supabase to customer view

## 🔧 Technologies Used

- **Frontend**: Next.js 14 + Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Image Storage**: Cloudinary
- **UI Components**: shadcn/ui + Lucide Icons

## 📋 Prerequisites

### 1. Supabase Setup

Your Supabase database is already configured with:
- **URL**: https://tphlffpzdagdzazkfjwi.supabase.co
- **Anon Key**: Already set in `.env`

**Database Table**: `shop_data`
```sql
create table public.shop_data (
  id uuid not null default gen_random_uuid (),
  admin_id uuid null,
  shop_name text null,
  shop_number text null,
  shop_address text null,
  products jsonb null,
  banners jsonb null,
  updated_at timestamp without time zone null default now(),
  constraint shop_data_pkey primary key (id),
  constraint shop_data_admin_id_fkey foreign key (admin_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

### 2. Cloudinary Setup

Your Cloudinary account is configured with:
- **Cloud Name**: djqc7oka1
- **Upload Preset**: unsigned_upload

## 🚀 How to Use

### Step 1: Create Admin Account

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** → **"Create new user"**
4. Enter:
   - Email: your-admin@example.com
   - Password: your-secure-password
   - ✅ Auto Confirm User
5. Click **"Create user"**

### Step 2: Access Admin Panel

1. Visit: **https://farmsupply-1.preview.emergentagent.com/login**
2. Login with your admin credentials
3. You'll be redirected to the admin dashboard

### Step 3: Set Up Your Shop

1. **Profile Tab**: View your admin email and user ID
2. **Shop Info Tab**: 
   - Enter your shop name
   - Enter WhatsApp number (format: 917385311748 - country code + number)
   - Enter complete shop address
   - Click "Save Shop Information"

3. **Products Tab**:
   - Fill product name, price, category, description
   - Upload product image (via Cloudinary)
   - Click "Add Product"
   - Edit or delete products as needed

4. **Banners Tab**:
   - Create promotional banners for homepage
   - Set title, subtitle, and gradient color
   - Preview before adding
   - Add multiple banners (they will auto-rotate)

### Step 4: View Customer Site

1. Visit: **https://farmsupply-1.preview.emergentagent.com/**
2. Your shop data, products, and banners will be displayed live!
3. Customers can:
   - Browse products by category
   - Search products
   - Add to cart
   - Order via WhatsApp

## 📱 Features

### Customer View (Homepage)
- 🏪 Shop name, phone, and address (from admin panel)
- 🎨 Rotating banners carousel
- 🏷️ Dynamic categories (auto-generated from products)
- 🔍 Advanced search functionality
- 🛒 Shopping cart with quantity control
- 📞 WhatsApp integration for orders
- 📱 Fully responsive design

### Admin Dashboard (`/admin`)
Only accessible after login:

#### Profile Management
- View admin email and user ID
- Account information display

#### Shop Info Management
- Update shop name
- Update WhatsApp phone number
- Update shop address
- Real-time sync to customer view

#### Product Management
- ➕ Add products with:
  - Name, price, category, description
  - Image upload via Cloudinary
- ✏️ Edit existing products
- 🗑️ Delete products
- 📸 Image preview
- View all products in grid layout

#### Banner Management
- ➕ Create promotional banners
- 🎨 8 gradient color options
- ✏️ Edit banner content
- 🗑️ Remove banners
- 👁️ Live preview before saving
- Auto-rotating carousel on homepage

## 🔐 Security Features

- ✅ Protected admin routes (auto-redirect to login)
- ✅ Supabase Row Level Security (RLS) ready
- ✅ Admin-only access to dashboard
- ✅ Secure authentication via Supabase Auth
- ✅ Each admin can only manage their own shop data

## 🎨 Admin Menu Button

The admin menu button (☰) appears **next to the cart icon** when you're logged in as admin:
- Click it to access:
  - **Admin Dashboard** - Go to admin panel
  - **Sign Out** - Logout from admin account

## 📝 Data Structure

### Product Object
```json
{
  "id": "uuid",
  "name": "Product Name",
  "price": 100,
  "description": "Product description",
  "category": "Category Name",
  "image": "https://cloudinary-url.jpg"
}
```

### Banner Object
```json
{
  "id": "uuid",
  "title": "Banner Title",
  "subtitle": "Banner Subtitle",
  "bg": "from-emerald-600 to-emerald-800"
}
```

## 🐛 Troubleshooting

### "No shop data yet" Message
- Make sure you've filled and saved shop information in the admin panel
- Check if you're logged in as the correct admin user

### Images Not Uploading
- Verify Cloudinary credentials in `.env`
- Ensure upload_preset is set to "unsigned_upload"
- Check file size (keep under 10MB)

### Can't Access Admin Panel
- Ensure you've created an admin user in Supabase
- Check login credentials
- Clear browser cache and try again

## 🔄 Workflow

1. **Admin creates account** → Login → Access dashboard
2. **Admin sets up shop info** → Save
3. **Admin adds products** → Upload images → Save
4. **Admin creates banners** → Select colors → Save
5. **Customers visit site** → Browse products → Add to cart → Order via WhatsApp

## 📞 WhatsApp Integration

When customers click "Order via WhatsApp", a pre-filled message is sent to your shop's WhatsApp number with:
- Product names
- Quantities
- Prices
- Total amount

Format: `https://wa.me/[PHONE_NUMBER]?text=[ORDER_DETAILS]`

## 🎯 Next Steps

1. ✅ Create your admin account in Supabase
2. ✅ Login to admin panel
3. ✅ Fill shop information
4. ✅ Add your first product
5. ✅ Create promotional banners
6. ✅ Share your shop URL with customers!

## 📚 Environment Variables

All environment variables are already configured in `/app/.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tphlffpzdagdzazkfjwi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=djqc7oka1
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=unsigned_upload
```

## 🌐 URLs

- **Customer Shop**: https://farmsupply-1.preview.emergentagent.com/
- **Admin Login**: https://farmsupply-1.preview.emergentagent.com/login
- **Admin Dashboard**: https://farmsupply-1.preview.emergentagent.com/admin

---

## 🎊 You're All Set!

Your headless CMS e-commerce platform is ready to use. Start by creating your admin account and setting up your shop! 🚀
