# AlphaSolver Deployment Guide

This document explains how to deploy AlphaSolver to production and configure it in Whop.

## Deployment Platform: Vercel

AlphaSolver is optimized for deployment on Vercel, but can be deployed to any platform that supports Next.js.

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are documented and ready
- [ ] Python simulation files are in `public/py/` directory
- [ ] Plan configuration is set correctly in `app/experiences/[experienceId]/config/planConfig.ts`
- [ ] No hardcoded localhost URLs remain in the codebase
- [ ] Build completes successfully locally (`pnpm build`)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: `.next` (Next.js default)
   - **Install Command**: `pnpm install` (or `npm install`)

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

### 3. Configure Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required Variables

```env
# Whop App Configuration
NEXT_PUBLIC_WHOP_APP_ID=your_production_app_id
WHOP_API_KEY=your_production_api_key
WHOP_WEBHOOK_SECRET=your_production_webhook_secret
NEXT_PUBLIC_APP_URL=https://alphasolver.vercel.app
```

**Critical:** `NEXT_PUBLIC_APP_URL` must be set to your exact Vercel deployment URL (no trailing slash). This is used for OAuth redirect URIs.

#### Optional Variables

```env
# Plan Configuration (defaults to "starter" if not set)
NEXT_PUBLIC_RECOMMENDED_PLAN_ID=starter

# Product Gating (optional)
NEXT_PUBLIC_REQUIRED_PRODUCT=your_product_id
```

**Important Notes:**

- `NEXT_PUBLIC_*` variables are exposed to the client-side code
- `WHOP_API_KEY` and `WHOP_WEBHOOK_SECRET` are server-only (not prefixed with `NEXT_PUBLIC_`)
- Use production values from your Whop Developer Dashboard
- Never commit these values to Git

### 4. Configure Vercel Build Settings

Ensure your Vercel project has:

- **Node.js Version**: 18.x or higher
- **Package Manager**: pnpm (configure in Vercel project settings)
- **Build Command**: `pnpm build`
- **Output Directory**: `.next` (default for Next.js)

## Whop Production Configuration

### 1. Update App Settings in Whop Dashboard

1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
2. Select your AlphaSolver app
3. Navigate to **"Hosting"** section
4. Configure the following:

   **Base URL**: Your deployed Vercel URL (e.g., `https://alphasolver.vercel.app`)

   **App Path**: `/experiences/[experienceId]`
   
   **Dashboard Path**: `/dashboard/[companyId]`
   
   **Discover Path**: `/discover`

### 2. Configure Webhooks (if using)

1. In Whop Dashboard, go to **"Webhooks"** section
2. Set webhook URL to: `https://your-domain.vercel.app/api/webhooks`
3. Ensure `WHOP_WEBHOOK_SECRET` in Vercel matches the secret in Whop dashboard

### 3. Attach App to Products/Experiences

1. Go to your Whop product/experience settings
2. Navigate to **"Tools"** or **"Apps"** section
3. Add AlphaSolver app to the products/experiences where you want it available
4. Only users with access to these products will be able to use the app

### 4. Plan Configuration

The app determines user plans based on:

1. **Environment Variable**: `NEXT_PUBLIC_RECOMMENDED_PLAN_ID` (if set, overrides product detection)
2. **Product Name Mapping**: Checks product name for "starter", "pro", or "elite"
3. **Default**: Falls back to "starter" plan

**To configure plans:**

- **Option 1**: Set `NEXT_PUBLIC_RECOMMENDED_PLAN_ID` in Vercel environment variables
- **Option 2**: Name your Whop products to include plan tier (e.g., "AlphaSolver Pro", "AlphaSolver Elite")
- **Option 3**: Modify `determinePlanId()` function in `app/experiences/[experienceId]/config/planConfig.ts` to map specific product IDs

## Transitioning from Development to Production

### In Whop Dashboard

1. **Update Base URL**: Change from `http://localhost:3000` to your production URL
2. **Verify Paths**: Ensure all paths are correctly configured
3. **Test Access**: Create a test experience and verify the app loads

### In Your Code

- No code changes needed - the app automatically detects environment
- Ensure all environment variables are set in Vercel
- Verify Python files are accessible at `/py/*.py` on production

## Post-Deployment Verification

### 1. Test App Loading

1. Navigate to a Whop experience with AlphaSolver installed
2. Verify the app loads without errors
3. Check browser console for any errors

### 2. Test Plan Gating

1. Test with different plan tiers:
   - Verify plan label appears in header
   - Verify form limits are enforced
   - Verify CSV access is gated correctly
   - Verify upgrade messages appear when limits exceeded

### 3. Test Simulations

1. **Parametric Mode**:
   - Run a small simulation (10-50 paths)
   - Verify results display correctly
   - Check charts render properly

2. **Bootstrapped Mode** (if enabled for plan):
   - Upload a test CSV file
   - Verify parsing works
   - Run simulation and verify results

### 4. Test Access Control

1. Verify users without product access see "Upgrade Required" message
2. Verify users with access can use the app
3. Test plan limits are enforced correctly

## Pre-Launch Checklist

Before making the app public, verify:

- [ ] **No Console Errors**: Check browser console for JavaScript errors
- [ ] **Simulations Run Successfully**: Test both parametric and bootstrapped modes
- [ ] **Plan Gating Works**: Verify limits are enforced and upgrade messages appear
- [ ] **App Loads Correctly**: App displays properly in Whop App View
- [ ] **Environment Variables Set**: All required vars are configured in Vercel
- [ ] **Whop Configuration**: Base URL and paths are set correctly
- [ ] **Webhooks Working**: If using webhooks, verify they're receiving events
- [ ] **Performance Acceptable**: Simulations complete in reasonable time
- [ ] **Mobile Responsive**: App works on mobile devices
- [ ] **Error Handling**: Error messages are user-friendly

## Monitoring and Maintenance

### Monitoring

- **Vercel Analytics**: Monitor app performance and errors
- **Browser Console**: Check for client-side errors
- **Whop Dashboard**: Monitor app usage and access patterns

### Common Issues

**App Not Loading:**
- Check Base URL in Whop dashboard matches deployed URL
- Verify environment variables are set correctly
- Check Vercel deployment logs for build errors

**Simulations Failing:**
- Check browser console for Pyodide errors
- Verify Python files are accessible (check Network tab)
- Ensure plan limits aren't being exceeded

**Plan Detection Not Working:**
- Verify `NEXT_PUBLIC_RECOMMENDED_PLAN_ID` is set correctly
- Check product names include plan tier keywords
- Review `determinePlanId()` logic in planConfig.ts

## Rollback Procedure

If you need to rollback:

1. **Vercel**: Use Vercel dashboard to revert to previous deployment
2. **Whop**: Update Base URL back to previous deployment if needed
3. **Environment Variables**: Ensure previous values are restored

## Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Whop Developer Docs](https://dev.whop.com/introduction)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

