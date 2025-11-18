# Facebook App Settings for Render Deployment

## 🌐 Render URL Format

Your Render URL is:
```
https://yohanns-sportswear.onrender.com
```

**Find Your Render URL:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **Web Service**
3. Your URL is displayed at the top of the page
4. Your URL: `https://yohanns-sportswear.onrender.com`

---

## 📋 Facebook App Developer Settings for Render

### Step 1: Basic Settings → App Domains

**Go to:** Facebook Developers → Your App → Settings → Basic

**Add to "App Domains" field:**
```
yohanns-sportswear.onrender.com
localhost
```

**Important:**
- ✅ Add ONLY the domain name (no `https://`, no `/`)
- ✅ Replace `your-service-name` with your actual Render service name
- ✅ Keep `localhost` for local development

---

### Step 2: Basic Settings → Privacy Policy URL

**Go to:** Settings → Basic → Privacy Policy URL

**Enter:**
```
https://yohanns-sportswear.onrender.com/privacy
```

---

### Step 3: Basic Settings → Data Deletion Instructions URL

**Go to:** Settings → Basic → User Data Deletion → Data Deletion Instructions URL

**Enter:**
```
https://yohanns-sportswear.onrender.com/data-deletion
```

---

### Step 4: Facebook Login → Valid OAuth Redirect URIs

**Go to:** Facebook Login → Settings → Valid OAuth Redirect URIs

**Add these URLs (one per line):**
```
https://xnuzdzjfqhbpcnsetjif.supabase.co/auth/v1/callback
https://yohanns-sportswear.onrender.com/auth/callback
http://localhost:3000/auth/callback
```

**Important:**
- ✅ Include the **full URL** with `https://` and path
- ✅ Replace `your-service-name` with your actual Render service name
- ✅ Keep localhost for development

---

## 🔧 Render Environment Variables

Make sure these are set in Render Dashboard → Environment:

```env
CLIENT_URL=https://yohanns-sportswear.onrender.com
REACT_APP_CLIENT_URL=https://yohanns-sportswear.onrender.com
NODE_ENV=production
```

**To Update:**
1. Go to Render Dashboard → Your Service
2. Click **Environment** tab
3. Add/Update the variables above
4. Click **Save Changes** (auto-redeploys)

---

## ✅ Quick Checklist

- [ ] App Domain added: `yohanns-sportswear.onrender.com`
- [ ] Privacy Policy URL: `https://yohanns-sportswear.onrender.com/privacy`
- [ ] Data Deletion URL: `https://yohanns-sportswear.onrender.com/data-deletion`
- [ ] OAuth Redirect URI: `https://yohanns-sportswear.onrender.com/auth/callback`
- [ ] `CLIENT_URL` set in Render environment variables
- [ ] Basic settings saved successfully
- [ ] OAuth settings saved successfully
- [ ] App deployed to Render
- [ ] Tested Facebook login on production URL

---

## 🧪 Testing

1. **Visit your Render URL:**
   ```
   https://yohanns-sportswear.onrender.com
   ```

2. **Test Privacy Policy:**
   ```
   https://yohanns-sportswear.onrender.com/privacy
   ```
   Should load successfully ✅

3. **Test Data Deletion:**
   ```
   https://yohanns-sportswear.onrender.com/data-deletion
   ```
   Should load successfully ✅

4. **Test Facebook Login:**
   - Click "Sign in with Facebook"
   - Should redirect to Facebook
   - After approving, should redirect back to your app ✅

---

## ❓ Common Questions

**Q: How do I find my Render service name?**
A: Go to Render Dashboard → Click your Web Service → The name in the URL is your service name

**Q: Can I use a custom domain instead?**
A: Yes! If you configure a custom domain in Render:
- Use your custom domain instead of `onrender.com`
- Example: `https://yohanns.com` instead of `https://yohanns-app.onrender.com`

**Q: Do I need to add both Render URL and localhost?**
A: Yes! Keep both for development (localhost) and production (Render URL)

**Q: What if my Render URL changes?**
A: Render URLs don't change unless you delete and recreate the service. If it does change, update Facebook settings with the new URL.

---

## 🚨 Troubleshooting

**"Invalid Redirect URI" error:**
- Make sure the exact URL is in Facebook's "Valid OAuth Redirect URIs" list
- Include `https://` and full path: `/auth/callback`
- Wait 5-10 minutes for Facebook changes to propagate

**"Data deletion URL returns bad response":**
- Visit the URL in your browser first
- Make sure it returns HTTP 200 (not 404)
- Check that your app is deployed and running on Render

**Facebook login works locally but not on Render:**
- Check that Render URL is added to Facebook settings
- Verify `CLIENT_URL` environment variable in Render
- Clear browser cache and cookies
- Wait a few minutes for changes to propagate

---

**Need help?** Check the main guide: `FACEBOOK_LOGIN_TEAM_FIX.md`

