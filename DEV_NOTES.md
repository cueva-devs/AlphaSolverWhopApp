# AlphaSolver Development Notes

This document explains how to set up and run AlphaSolver locally for development.

## Prerequisites

- Node.js 18+ (or use the version specified in `.nvmrc` if present)
- pnpm (package manager) - install via `npm install -g pnpm`
- A Whop developer account and app created in the [Whop Developer Dashboard](https://whop.com/dashboard/developer/)

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Environment File

Create a `.env.development.local` file in the root directory with the following variables:

```env
# Whop App Configuration (get these from your Whop Developer Dashboard)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
WHOP_API_KEY=your_api_key_here
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Plan Configuration
# Set this to override plan detection (values: starter, pro, elite)
NEXT_PUBLIC_RECOMMENDED_PLAN_ID=starter

# Optional: Product Gating
# If you want to require a specific product for access
NEXT_PUBLIC_REQUIRED_PRODUCT=your_product_id_here
```

**Where to find these values:**

- **NEXT_PUBLIC_WHOP_APP_ID**: Found in your Whop Developer Dashboard under your app's settings
- **WHOP_API_KEY**: Generated in your Whop Developer Dashboard under API Keys
- **WHOP_WEBHOOK_SECRET**: Set in your Whop Developer Dashboard under Webhooks
- **NEXT_PUBLIC_RECOMMENDED_PLAN_ID**: Optional - defaults to "starter" if not set. Used to override plan detection for testing.

### 3. Configure Whop App in Dashboard

1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
2. Create a new app or select your existing AlphaSolver app
3. Navigate to the "Hosting" section
4. Configure the following paths:
   - **Base URL**: Set to `http://localhost:3000` for local development (or your deployed URL for production)
   - **App path**: `/experiences/[experienceId]`
   - **Dashboard path**: `/dashboard/[companyId]`
   - **Discover path**: `/discover`

## Running the Development Server

### Start the Dev Server

```bash
pnpm dev
```

This command:
- Starts the Next.js development server with Turbopack
- Runs the Whop dev proxy (required for local Whop app testing)
- Opens the app at `http://localhost:3000`

### Accessing the App in Whop (Local Mode)

1. After starting the dev server, navigate to a Whop experience that has your app installed
2. In the top right corner of the Whop interface, look for a translucent settings icon
3. Click the settings icon and select **"localhost"**
4. Enter port `3000` (or your configured port)
5. The app should now load from your local development server

**Note**: The Whop dev proxy (`whop-proxy`) handles the integration between your local server and Whop's platform, allowing you to test the full Whop SDK integration locally.

## Development Workflow

### Testing Simulations

1. **Parametric Mode**: Test with conservative defaults (e.g., 100 paths, 7 days) to avoid long wait times
2. **Bootstrapped Mode**: Upload a small CSV file (10-50 trades) for faster testing
3. **Plan Limits**: Test plan gating by changing `NEXT_PUBLIC_RECOMMENDED_PLAN_ID` in your `.env.development.local`

### Important Notes

#### Pyodide Runs in the Browser

- All simulation logic runs client-side using Pyodide (Python in the browser)
- No server-side Python execution required
- First simulation load may be slow as Pyodide downloads (~10MB) and initializes
- Subsequent simulations are faster as Pyodide is cached

#### Performance Considerations

- **Large simulations can be slow**: Default `numPaths` values are conservative (100-1000) for good reason
- **Test with small values first**: Start with 10-50 paths when developing/debugging
- **Browser performance matters**: Complex simulations (10,000+ paths) may take several minutes on slower machines
- **Memory usage**: Each simulation path stores equity curves in memory - very large simulations may cause browser slowdowns

#### Plan Configuration Testing

To test different plan tiers locally:

1. Edit `.env.development.local`:
   ```env
   NEXT_PUBLIC_RECOMMENDED_PLAN_ID=pro  # or "elite" or "starter"
   ```

2. Restart the dev server

3. Verify:
   - Plan label appears correctly in header
   - Form limits are enforced (maxPaths, maxDays)
   - CSV tab is enabled/disabled based on plan
   - Upgrade messages appear when limits are exceeded

## Project Structure

```
alphasolver/
├── app/
│   ├── experiences/[experienceId]/    # Main app entry point
│   │   ├── components/                 # React components
│   │   ├── config/                     # Plan configuration
│   │   ├── hooks/                      # React hooks (useSimulationEngine)
│   │   ├── lib/                        # Utilities (CSV parsing, Pyodide client)
│   │   └── types.ts                    # TypeScript types
│   └── api/webhooks/                   # Whop webhook handlers
├── public/
│   └── py/                             # Python simulation files
│       ├── account_models.py
│       ├── trader.py
│       ├── trading_strategies.py
│       └── simulation.py
└── lib/
    └── whop-sdk.ts                     # Whop SDK initialization
```

## Common Development Tasks

### Adding a New Plan Tier

1. Edit `app/experiences/[experienceId]/config/planConfig.ts`
2. Add new plan to `PLAN_CONFIGS` object
3. Update `PlanId` type if needed
4. Test plan detection logic

### Modifying Simulation Logic

1. Edit Python files in `public/py/`
2. Changes take effect immediately (no rebuild needed for Python files)
3. Test with small `numPaths` values first

### Debugging Pyodide Issues

- Check browser console for Pyodide loading errors
- Verify Python files are accessible at `/py/*.py`
- Check network tab for failed file loads
- Ensure Pyodide CDN is accessible (may be blocked by ad blockers)

## Troubleshooting

### App Not Loading in Whop

- **Check Base URL**: Ensure it's set to `http://localhost:3000` in Whop dashboard
- **Check App Path**: Must be exactly `/experiences/[experienceId]`
- **Check Dev Proxy**: Ensure `whop-proxy` is running (part of `pnpm dev`)
- **Check Port**: Default is 3000, change if needed

### Simulations Not Running

- **Check Browser Console**: Look for Pyodide errors
- **Check Network Tab**: Verify Python files are loading from `/py/`
- **Check Plan Limits**: Ensure `numPaths` and `numDays` are within plan limits
- **Check CSV Format**: For bootstrapped mode, ensure CSV has required columns

### Environment Variables Not Working

- **File Name**: Must be `.env.development.local` (not `.env.local` for dev)
- **Restart Server**: Environment variables require server restart
- **Check Prefix**: `NEXT_PUBLIC_*` vars are exposed to client, others are server-only

## Additional Resources

- [Whop Developer Docs](https://dev.whop.com/introduction)
- [Next.js Documentation](https://nextjs.org/docs)
- [Pyodide Documentation](https://pyodide.org/en/stable/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

