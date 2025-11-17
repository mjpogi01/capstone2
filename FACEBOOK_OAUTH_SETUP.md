# Facebook OAuth Setup Guide

This guide will help you enable Facebook sign-in for your application.

## 📋 Prerequisites

- A Facebook account
- Access to Supabase Dashboard
- Your app running (localhost for testing)

---

## 🔧 Step 1: Create a Facebook App

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Log in with your Facebook account

2. **Create a New App**
   - Click **"My Apps"** → **"Create App"**
   - Select **"Consumer"** as the app type
   - Click **"Next"**

3. **Fill in App Details**
   - **App Name**: `Yohann's Sportswear House` (or your preferred name)
   - **App Contact Email**: Your email address
   - **Business Account** (optional): Leave blank if you don't have one
   - Click **"Create App"**

4. **Add Facebook Login Product**
   - In your app dashboard, find **"Add a Product"**
   - Click **"Set Up"** on **"Facebook Login"**
   - Select **"Web"** as the platform

5. **Configure Facebook Login Settings**
   - Go to **Facebook Login** → **Settings**
   - **Valid OAuth Redirect URIs**: Add these:
     ```
     https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
     - Replace `[YOUR_PROJECT_REF]` with your Supabase project reference
     - You can find it in Supabase Dashboard → Settings → API → Project URL
   - **Deauthorize Callback URL**: (Optional) Leave blank
   - **Data Deletion Request URL**: (Optional) Leave blank
   - Click **"Save Changes"**

6. **Get Your App Credentials**
   - Go to **Settings** → **Basic**
   - Copy your **App ID**
   - Copy your **App Secret** (click "Show" to reveal it)
   - **Important**: Keep these secure!

---

## 🔐 Step 2: Configure Facebook OAuth in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication → Providers**
   - Go to: **Authentication** → **Providers**
   - Find **Facebook** in the list
   - Click to enable it

3. **Enter Facebook Credentials**
   - **Enabled**: Toggle **ON**
   - **Client ID (App ID)**: Paste your Facebook App ID
   - **Client Secret (App Secret)**: Paste your Facebook App Secret
   - **Authorized Client IDs**: (Optional) Leave blank

4. **Save Changes**
   - Click **"Save"** at the bottom

---

## 🔗 Step 3: Configure Redirect URLs in Supabase

1. **Go to Authentication → URL Configuration**
   - In Supabase Dashboard: **Authentication** → **URL Configuration**

2. **Update Redirect URLs**
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add these:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/**
     https://your-production-domain.com/auth/callback
     https://your-production-domain.com/**
     ```
   - Replace `your-production-domain.com` with your actual production domain

3. **Save Changes**

---

## ✅ Step 4: Verify Your Setup

1. **Check Facebook App Status**
   - In Facebook Developers Console
   - Go to **App Review** → **Permissions and Features**
   - Make sure **"email"** and **"public_profile"** permissions are available
   - For development, these are usually available by default

2. **Test Facebook Sign-In**
   - Open your app in the browser
   - Click **"Sign in with Facebook"**
   - You should be redirected to Facebook login
   - After logging in, you should be redirected back to your app

---

## 🚨 Troubleshooting

### "Invalid OAuth redirect URI" Error

**Problem**: Facebook doesn't recognize the redirect URI.

**Solution**:
1. Check that you added the Supabase callback URL in Facebook:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
2. Make sure there are no typos
3. The URL must match exactly (including `https://`)

### "App Not Setup" Error

**Problem**: Facebook app is not properly configured.

**Solution**:
1. Make sure Facebook Login product is added to your app
2. Verify that you selected "Web" as the platform
3. Check that OAuth Redirect URIs are saved

### "Redirect URI Mismatch" Error

**Problem**: The redirect URI in Supabase doesn't match what's configured.

**Solution**:
1. Check Supabase → Authentication → URL Configuration
2. Make sure `http://localhost:3000/auth/callback` is in the Redirect URLs list
3. Verify Site URL is set correctly

### Facebook Sign-In Works But User Not Created

**Problem**: User signs in but account isn't created in your database.

**Solution**:
1. Check Supabase → Authentication → Users
2. Users should be created automatically
3. If not, check Supabase logs for errors
4. Verify that email permissions are granted in Facebook

---

## 📝 Production Setup

When deploying to production:

1. **Update Facebook App Settings**
   - Go to **Settings** → **Basic**
   - Add your production domain to **App Domains**
   - Add production redirect URI:
     ```
     https://your-production-domain.com/auth/callback
     ```

2. **Update Supabase Settings**
   - Change **Site URL** to your production URL
   - Add production redirect URLs

3. **Submit Facebook App for Review** (if needed)
   - For production use, you may need to submit your app for review
   - This is required if you want to use certain permissions
   - For basic login (email, public_profile), it's usually not needed

---

## 🔒 Security Notes

- **Never commit** your Facebook App Secret to git
- Keep your App Secret secure
- Use environment variables for sensitive data
- Regularly rotate your App Secret if compromised

---

## 📚 Additional Resources

- [Supabase Social Auth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Facebook App Review Guide](https://developers.facebook.com/docs/app-review)

---

## ✅ Checklist

- [ ] Facebook App created
- [ ] Facebook Login product added
- [ ] OAuth Redirect URIs configured in Facebook
- [ ] Facebook App ID and Secret obtained
- [ ] Facebook provider enabled in Supabase
- [ ] Facebook credentials added to Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Tested Facebook sign-in locally
- [ ] Production URLs configured (when deploying)

---

**Need Help?** Check the troubleshooting section above or refer to the official documentation.

