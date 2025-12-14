# Troubleshooting Guide for Whop App Errors

## Common Error: "AlphaSolver is unavailable" or Authentication Errors

### Issue: App not loading in Whop iframe

If you're seeing errors when accessing your app through Whop, follow these steps:

### 1. Verify Whop Dashboard Configuration

**Base URL Settings:**
- Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
- Select your AlphaSolver app
- Navigate to **"Hosting"** section
- Ensure **Base URL** is set to: `https://alphasolver.vercel.app` (no trailing slash)
- Ensure **App Path** is set to: `/experiences/[experienceId]`
- Ensure **Dashboard Path** is set to: `/dashboard/[companyId]` (if using dashboard view)
- Ensure **Discover Path** is set to: `/discover` (if using discover view)

**Important:** The Base URL field should auto-save. If it keeps reverting:
- Make sure the URL starts with `https://` (not `http://`)
- Remove any trailing slash
- Click outside the field or press Tab to trigger auto-save
- Wait 2-3 seconds after typing
- Try a different browser or clear cache

### 2. Verify Vercel Environment Variables

In your Vercel project settings, ensure these environment variables are set:

**Required:**
```env
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxx
WHOP_API_KEY=your_api_key_here
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_APP_URL=https://alphasolver.vercel.app
```

**Optional:**
```env
NEXT_PUBLIC_RECOMMENDED_PLAN_ID=starter
NEXT_PUBLIC_BYPASS_ACCESS=false
NEXT_PUBLIC_WHOP_CHECKOUT_URL=https://whop.com/alphasolver
```

**Important Notes:**
- `NEXT_PUBLIC_APP_URL` must match your Vercel deployment URL exactly
- Use production values from your Whop Developer Dashboard
- After adding/changing environment variables, redeploy your Vercel app

### 3. Verify App Path Configuration

The app must be accessed through the correct path:
- ✅ Correct: `https://alphasolver.vercel.app/experiences/exp_xxxxx` (via Whop iframe)
- ❌ Wrong: `https://alphasolver.vercel.app/` (direct access - will show landing page)

### 4. Common Error Messages and Solutions

#### "Authentication Required" or "Authentication Error"
- **Cause:** Missing or invalid `x-whop-user-token` header
- **Solutions:**
  - Ensure you're accessing the app through Whop (not directly)
  - Verify `NEXT_PUBLIC_WHOP_APP_ID` is set correctly in Vercel
  - Check that Base URL in Whop dashboard matches your Vercel URL
  - Ensure the app is installed in your Whop experience/product

#### "AlphaSolver is unavailable"
- **Cause:** General error during app loading
- **Solutions:**
  - Check Vercel deployment logs for errors
  - Verify all environment variables are set
  - Check browser console for detailed error messages
  - Ensure `WHOP_API_KEY` is valid and has correct permissions

#### PostMessage Errors in Console
- **Cause:** App accessed directly instead of through Whop iframe
- **Note:** These errors are expected when accessing the root URL directly. They won't appear when the app is loaded through Whop.

### 5. Testing Your Configuration

1. **Verify Deployment:**
   ```bash
   # Check if your app is deployed
   curl https://alphasolver.vercel.app/
   ```

2. **Check Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify all required variables are present
   - Ensure they're set for "Production" environment

3. **Test in Whop:**
   - Go to your Whop experience/product
   - Navigate to the Tools/Apps section
   - Click on AlphaSolver app
   - The app should load at `/experiences/[experienceId]`

### 6. Debugging Steps

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for server-side errors
   - Check for authentication failures

3. **Verify Whop SDK Connection:**
   - The app uses `whopsdk.verifyUserToken()` to authenticate
   - This requires the `x-whop-user-token` header from Whop's iframe
   - If this header is missing, authentication will fail

### 7. Still Having Issues?

If you've verified all the above and still have issues:

1. **Check Whop Status:**
   - Visit [Whop Status Page](https://status.whop.com/)
   - Check for any platform issues

2. **Contact Support:**
   - Whop Support: support@whop.com
   - Or use the support chat in the developer dashboard

3. **Review Documentation:**
   - [Whop Developer Docs](https://dev.whop.com/introduction)
   - [Whop Apps Guide](https://docs.whop.com/whop-apps/b2b-apps)

## Quick Checklist

- [ ] Base URL set correctly in Whop dashboard (no trailing slash)
- [ ] App Path set to `/experiences/[experienceId]`
- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches your Vercel URL exactly
- [ ] App is installed in your Whop experience/product
- [ ] Accessing app through Whop (not directly)
- [ ] Vercel deployment is successful
- [ ] No errors in Vercel logs

