# Fixing "Upgrade Required" Error

If you're seeing "Upgrade Required" when opening the app, it means the access check is failing. Here's how to fix it:

## Common Causes

1. **App not installed on the product/experience**
2. **No products attached to the experience**
3. **User doesn't have access to the product**

## Solution Steps

### 1. Ensure App is Installed on Your Product/Experience

1. Go to your Whop Dashboard
2. Navigate to your Product or Experience
3. Go to the **"Tools"** or **"Apps"** section
4. Make sure **AlphaSolver** is installed/enabled
5. If not, click **"Add App"** and select AlphaSolver

### 2. Ensure Product is Attached to Experience

1. Go to your Experience settings
2. Check the **"Products"** section
3. Make sure at least one product is attached to the experience
4. If no products are attached:
   - Create a product (or use an existing one)
   - Attach it to the experience
   - Ensure the product has AlphaSolver app installed

### 3. Grant Yourself Access

If you're testing as the owner/admin:

1. Go to your Product settings
2. Ensure you have access to the product
3. If needed, create a free plan or grant yourself access

### 4. For Testing: Enable Bypass Access (Development Only)

If you want to bypass access checks for testing:

1. Go to Vercel Dashboard → Your Project → Environment Variables
2. Add: `NEXT_PUBLIC_BYPASS_ACCESS=true`
3. Redeploy your app

**⚠️ Warning:** Only use this in development. Remove it before going to production!

### 5. Check Access Level

The app checks for:
- `access_level: "customer"` - User has a valid membership
- `access_level: "admin"` - User is a team member/admin

If you're the owner/admin, you should have `access_level: "admin"`.

## Quick Checklist

- [ ] AlphaSolver app is installed on your product/experience
- [ ] At least one product is attached to the experience
- [ ] You have access to the product (as owner/admin or via membership)
- [ ] Product has the app enabled in Tools/Apps section

## Debugging

If you're still seeing the error:

1. **Check Vercel Logs:**
   - Look for the debug output showing `access_level` and `products` count
   - This will help identify the issue

2. **Verify in Whop Dashboard:**
   - Go to Experience → Products
   - Ensure products are listed
   - Check that AlphaSolver appears in the Tools/Apps section

3. **Test Access:**
   - Try accessing the product directly: `https://whop.com/products/YOUR_PRODUCT_ID`
   - Ensure you can access it
   - Then try the app again

## Still Not Working?

If you've verified all the above:

1. Check that the experience ID in the URL matches your actual experience
2. Verify the app is properly installed (not just added to the dashboard)
3. Try removing and re-adding the app to the product/experience
4. Contact Whop support if the issue persists

