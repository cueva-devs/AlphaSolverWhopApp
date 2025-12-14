# How to Check Where "Upgrade to Unlimited" Takes You

## Current Behavior

The "Upgrade to Unlimited" button will take you to one of these URLs (in priority order):

### Priority 1: Environment Variable
If `NEXT_PUBLIC_WHOP_UPGRADE_URL` is set in Vercel:
- Goes to: The URL you specified in the environment variable
- Example: `https://whop.com/checkout/YOUR_CHECKOUT_LINK`

### Priority 2: Product Purchase URL
If the product has a `purchase_url` from the Whop API:
- Goes to: The product's checkout/purchase page
- Example: `https://whop.com/checkout/...`

### Priority 3: Company/Product Slug Format
If product has a slug and company has a slug:
- Goes to: `https://whop.com/[company-slug]/[product-slug]`
- Example: `https://whop.com/aftrprty/alphasolver-unlimited`

### Priority 4: Product ID Format
If product has an ID:
- Goes to: `https://whop.com/products/[product-id]`
- Example: `https://whop.com/products/pass_xxxxxxxxxxxxx`

### Priority 5: Experience URL (Fallback)
If none of the above work:
- Goes to: `https://whop.com/experiences/[experience-id]`
- Example: `https://whop.com/experiences/exp_xxxxxxxxxxxxx`

## How to See What URL Is Being Used

### Option 1: Check Browser Console (Development)
1. Open your app in Whop
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for: `"Upgrade URL construction:"`
5. Check `finalUpgradeUrl` value

### Option 2: Check Vercel Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to Logs
4. Look for the debug output showing the upgrade URL

### Option 3: Inspect the Button
1. Right-click on "Upgrade to Unlimited" button
2. Select "Inspect Element"
3. Look at the `<a>` tag's `href` attribute
4. That's the URL it will navigate to

### Option 4: Add Temporary Logging
Add this to see the URL in the UI temporarily:

```typescript
// In AlphaSolverApp.tsx, temporarily add:
{upgradeUrl && (
  <Text size="1" color="gray" className="mt-2">
    Debug: {upgradeUrl}
  </Text>
)}
```

## Recommended: Use Checkout Link

The most reliable way is to use a Whop checkout link:

1. **Create Checkout Link:**
   - Go to Whop Dashboard → Checkout links
   - Create a link for your Unlimited product
   - Copy the checkout URL

2. **Set Environment Variable:**
   ```
   NEXT_PUBLIC_WHOP_UPGRADE_URL=https://whop.com/checkout/YOUR_LINK_ID
   ```

3. **Redeploy:**
   - This will ensure the button always goes to the correct checkout page

## Troubleshooting "Product Not Found"

If you're getting "Product not found":

1. **Check the URL format:**
   - Verify the URL works when accessed directly
   - Try opening it in a new tab manually

2. **Verify Product is Public:**
   - Go to Product settings
   - Ensure it's publicly visible
   - Check it's not hidden or restricted

3. **Use Checkout Link Instead:**
   - Checkout links always work
   - They're more reliable than product URLs
   - Set `NEXT_PUBLIC_WHOP_UPGRADE_URL` to use one

4. **Check Debug Logs:**
   - See which URL format is being used
   - Verify product data is correct

## Quick Test

To quickly test where it goes:

1. Click "Upgrade to Unlimited" button
2. Note the URL in the address bar
3. If it says "not found", check:
   - Is the product published?
   - Is the URL format correct?
   - Does the product exist?

