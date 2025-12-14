# Fixing "Product Not Found" Error on Upgrade Button

## The Problem

When clicking the "Upgrade to Unlimited" button, you see "Product not found". This happens because:

1. The product URL format might be incorrect
2. The product might not be publicly accessible
3. The product ID might not match the actual product

## Solutions

### Option 1: Use Checkout Links (Recommended)

Instead of linking directly to products, use Whop's checkout links:

1. **Create a Checkout Link in Whop Dashboard:**
   - Go to Dashboard → Checkout links
   - Click "+ Create checkout link"
   - Select your Unlimited product
   - Configure pricing
   - Copy the generated checkout URL

2. **Set Environment Variable:**
   Add to Vercel:
   ```
   NEXT_PUBLIC_WHOP_UPGRADE_URL=https://whop.com/checkout/YOUR_CHECKOUT_LINK_ID
   ```

3. **Update Code to Use Environment Variable:**
   The code will prioritize the environment variable if set.

### Option 2: Fix Product URL Format

The code now tries multiple URL formats:
- `product.purchase_url` (if available from API)
- `https://whop.com/[company-slug]/[product-slug]` (if slugs available)
- `https://whop.com/products/[product-id]` (fallback)
- `https://whop.com/experiences/[experience-id]` (final fallback)

### Option 3: Make Product Public

1. Go to your Product settings in Whop
2. Ensure the product is **publicly visible**
3. Check that it's not hidden or restricted
4. Verify the product slug/URL works when accessed directly

## Debugging

### Check What Product Data We're Getting

In development mode, check your Vercel logs or browser console. You should see:
```
Upgrade URL construction: {
  upgradeProduct: { id, title, slug, purchase_url },
  companySlug: "...",
  finalUpgradeUrl: "..."
}
```

### Verify Product Access

1. Try accessing the product directly:
   - `https://whop.com/aftrprty/YOUR_PRODUCT_SLUG`
   - Or `https://whop.com/products/YOUR_PRODUCT_ID`

2. If it says "not found", the product might be:
   - Not published
   - Hidden from public
   - Using a different URL format

## Quick Fix: Use Experience URL

As a temporary workaround, the code falls back to the experience URL. Users can:
1. Click upgrade button
2. Land on the experience page
3. See all products
4. Click on the Unlimited product manually

## Best Practice: Use Checkout Links

Checkout links are the most reliable way to direct users to purchase:
- They always work
- They're shareable
- They can be customized
- They work even if product URLs change

## Testing

After implementing a fix:

1. **Test as Free User:**
   - Use up all 10 credits
   - Click "Upgrade to Unlimited"
   - Should go to checkout/product page

2. **Verify URL:**
   - Check browser console for debug logs
   - Verify the URL format matches your Whop setup
   - Test the URL directly in a new tab

3. **Test Purchase Flow:**
   - Complete a test purchase
   - Verify access upgrades to Unlimited
   - Check that credits become unlimited

## Common Issues

### "Product not found"
- Product might not be published
- Product URL format incorrect
- Product might be restricted

### "Experience not found"
- Experience ID incorrect
- Experience not public
- App not installed on experience

### Upgrade Button Not Showing
- No Unlimited product found
- Product name doesn't include "Unlimited", "Pro", or "Premium"
- Credits not actually exhausted

