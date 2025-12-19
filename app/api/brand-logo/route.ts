import { NextRequest, NextResponse } from 'next/server';

// Cache brand logos to avoid hitting API limits
const logoCache = new Map<string, { icon: string | null; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  }

  // Check cache first
  const cached = logoCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ icon: cached.icon });
  }

  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BRANDFETCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      // Cache the failure too to avoid repeated requests
      logoCache.set(domain, { icon: null, timestamp: Date.now() });
      return NextResponse.json({ error: 'Brand not found', icon: null }, { status: 404 });
    }

    const data = await response.json();
    
    // Try to get icon first (square), then logo, then symbol
    const logos = data.logos || [];
    
    // Find the best logo option
    let iconUrl: string | null = null;
    
    // Priority: icon > symbol > logo (icon/symbol are usually square and work better small)
    const icon = logos.find((l: { type: string }) => l.type === 'icon');
    const symbol = logos.find((l: { type: string }) => l.type === 'symbol');
    const logo = logos.find((l: { type: string }) => l.type === 'logo');
    
    const selectedLogo = icon || symbol || logo;
    
    if (selectedLogo?.formats) {
      // Prefer PNG or SVG format
      const pngFormat = selectedLogo.formats.find((f: { format: string }) => f.format === 'png');
      const svgFormat = selectedLogo.formats.find((f: { format: string }) => f.format === 'svg');
      const anyFormat = selectedLogo.formats[0];
      
      iconUrl = (pngFormat || svgFormat || anyFormat)?.src || null;
    }

    // Cache the result
    logoCache.set(domain, { icon: iconUrl, timestamp: Date.now() });
    
    return NextResponse.json({ 
      icon: iconUrl,
      name: data.name 
    });
  } catch (error) {
    console.error('Brandfetch API error:', error);
    logoCache.set(domain, { icon: null, timestamp: Date.now() });
    return NextResponse.json({ error: 'Failed to fetch', icon: null }, { status: 500 });
  }
}

