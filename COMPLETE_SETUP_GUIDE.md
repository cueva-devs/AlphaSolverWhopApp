# Complete Setup Guide for Testing AlphaSolver

This guide will help you set up AlphaSolver properly so you can test the full user flow before publishing.

## Issues You Encountered

1. ✅ **Fixed**: No upgrade button when credits run out
2. ✅ **Fixed**: Checkout URL pointing to wrong place
3. ⚠️ **Need to configure**: App not accessible from Whop experience

## Step-by-Step Setup

### 1. Create Products in Your Whop

You need at least TWO products:

#### Product 1: Free Plan
- **Name**: "AlphaSolver Free" (or similar)
- **Price**: Free (one-time or free subscription)
- **Description**: "10 simulation runs per day"

#### Product 2: Unlimited Plan  
- **Name**: "AlphaSolver Unlimited" (must include "Unlimited", "Pro", or "Premium" in the name)
- **Price**: $9/month (or your preferred price)
- **Description**: "Unlimited simulation runs"

### 2. Create an Experience

1. Go to your Whop Dashboard
2. Create a new Experience (or use existing)
3. **Attach both products** to this experience:
   - Free product
   - Unlimited product
4. **Note the Experience ID** (starts with `exp_`)

### 3. Install AlphaSolver App on the Experience

1. Go to your Experience settings
2. Navigate to **"Tools"** or **"Apps"** section
3. Click **"Add App"**
4. Search for and select **AlphaSolver**
5. Make sure it's **enabled/active**

### 4. Configure Environment Variables in Vercel

Add these to your Vercel project:

```env
# Required
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxx
WHOP_API_KEY=your_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://alphasolver.vercel.app

# For landing page checkout (use your experience URL)
NEXT_PUBLIC_WHOP_EXPERIENCE_URL=https://whop.com/experiences/exp_xxxxxxxxxxxxx

# Optional: For testing
NEXT_PUBLIC_BYPASS_ACCESS=false  # Set to true only for testing
```

**Important**: Use your actual Experience URL for `NEXT_PUBLIC_WHOP_EXPERIENCE_URL`

### 5. Update Landing Page Checkout URL

The landing page will now use `NEXT_PUBLIC_WHOP_EXPERIENCE_URL` if set, which points users directly to your experience (where the app is installed).

### 6. Test the Full Flow

#### As a New User:

1. **Visit landing page**: `https://alphasolver.vercel.app/`
2. **Click "Get Started Free"** → Should take you to your experience
3. **Join/Subscribe** → Should redirect you to the experience
4. **Access the app** → Should see AlphaSolver in the Tools/Apps section
5. **Use 10 free credits** → Run simulations
6. **Run out of credits** → Should see "Upgrade to Unlimited" button
7. **Click upgrade** → Should take you to the Unlimited product checkout
8. **Upgrade** → Should have unlimited access

#### As an Existing User:

1. **Go directly to your Whop**: `https://whop.com/YOUR_COMPANY`
2. **Navigate to the Experience** where AlphaSolver is installed
3. **Click on AlphaSolver** in the Tools/Apps section
4. **Should load the app** at `/experiences/[experienceId]`

## Troubleshooting

### App Not Showing in Experience

**Problem**: After joining, you don't see the app in the experience.

**Solution**:
1. Verify the app is installed on the **Experience** (not just the product)
2. Check that you have access to the experience
3. Try refreshing the page
4. Check that the Base URL in Whop app settings is correct

### Upgrade Button Not Showing

**Problem**: When credits run out, no upgrade button appears.

**Solution**:
1. Ensure you have an "Unlimited" product (name must include "Unlimited", "Pro", or "Premium")
2. Verify the product is attached to the experience
3. Check Vercel logs to see if upgrade URL is being constructed correctly

### Wrong Checkout URL

**Problem**: "Get Started Free" takes you to wrong place.

**Solution**:
1. Set `NEXT_PUBLIC_WHOP_EXPERIENCE_URL` in Vercel to your experience URL
2. Format: `https://whop.com/experiences/exp_xxxxxxxxxxxxx`
3. Redeploy after setting the variable

### Credits Not Resetting

**Problem**: Credits don't reset daily.

**Solution**:
- Credits reset at midnight in the user's local timezone
- They're stored in browser localStorage
- Clearing browser data will reset them
- In production, this should be replaced with server-side tracking

## Quick Checklist

- [ ] Created Free product
- [ ] Created Unlimited product (name includes "Unlimited", "Pro", or "Premium")
- [ ] Created Experience
- [ ] Attached both products to Experience
- [ ] Installed AlphaSolver app on Experience
- [ ] Set `NEXT_PUBLIC_WHOP_EXPERIENCE_URL` in Vercel
- [ ] Set all required environment variables
- [ ] Redeployed Vercel app
- [ ] Tested as new user flow
- [ ] Tested upgrade flow
- [ ] Verified app appears in experience

## Testing Tips

1. **Use Incognito Mode**: Test as a new user without existing cookies
2. **Clear localStorage**: To reset credits during testing
3. **Check Browser Console**: For any errors or debug messages
4. **Check Vercel Logs**: For server-side errors
5. **Test Both Plans**: Make sure free and unlimited plans work correctly

## Next Steps After Testing

Once everything works:

1. Remove `NEXT_PUBLIC_BYPASS_ACCESS` if you set it to `true`
2. Remove any debug logging (or keep it for production debugging)
3. Test with real users before publishing
4. Set up proper analytics/tracking
5. Consider adding server-side credit tracking (replace localStorage)

