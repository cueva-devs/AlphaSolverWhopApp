import { NextRequest, NextResponse } from "next/server";
import { 
  buildAiMappingPrompt, 
  validateAiMapping,
  type AiColumnMapping 
} from "@/app/experiences/[experienceId]/lib/aiMappingSchema";
import { checkRateLimit, rateLimitedResponse, addRateLimitHeaders } from "@/lib/rate-limit";

// Rate limit configuration - stricter since this calls external AI APIs
const RATE_LIMIT_CONFIG = {
  limit: 10, // 10 requests
  windowSeconds: 60, // per minute
  keyPrefix: "ai-mapping",
};

/**
 * AI Column Mapping API
 * 
 * Receives CSV headers + sample rows, sends to ML model,
 * returns structured column mapping for mechanical parsing.
 */

export async function POST(request: NextRequest) {
  // Rate limiting to prevent API abuse
  const rateLimitResult = checkRateLimit(request, RATE_LIMIT_CONFIG);
  if (!rateLimitResult.success) {
    return rateLimitedResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { headers, sampleRows } = body as {
      headers: string[];
      sampleRows: string[][];
    };

    // Validate input
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid headers array" },
        { status: 400 }
      );
    }

    if (!sampleRows || !Array.isArray(sampleRows) || sampleRows.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid sampleRows array" },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service not configured. Please set OPENROUTER_API_KEY." },
        { status: 503 }
      );
    }

    // Note: Removed API key length logging for security

    // Build the prompt
    const prompt = buildAiMappingPrompt(headers, sampleRows);
    console.log("Prompt built, calling OpenRouter API...");

    // Call OpenRouter API
    let fetchResponse: Response;
    try {
      fetchResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            {
              role: "system",
              content: "You are a data analyst that maps CSV columns to a trading analysis schema. Always respond with valid JSON only, no markdown or explanation.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0,
        }),
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 502 }
      );
    }

    console.log("OpenRouter response status:", fetchResponse.status);

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error("OpenRouter API error:", fetchResponse.status, errorText);
      return NextResponse.json(
        { error: `AI service error (${fetchResponse.status}): ${errorText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    const aiResponse = await fetchResponse.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI service" },
        { status: 502 }
      );
    }

    // Parse the JSON response
    let mapping: AiColumnMapping;
    try {
      mapping = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Invalid JSON response from AI service" },
        { status: 502 }
      );
    }

    // Validate the mapping structure
    if (!validateAiMapping(mapping)) {
      console.error("Invalid mapping structure:", mapping);
      return NextResponse.json(
        { error: "AI returned invalid mapping structure", mapping },
        { status: 422 }
      );
    }

    // Verify columns exist in headers
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    const errors: string[] = [];

    if (!headerSet.has(mapping.pnl.column.toLowerCase())) {
      errors.push(`PNL column "${mapping.pnl.column}" not found in headers`);
    }
    if (!headerSet.has(mapping.date.column.toLowerCase())) {
      errors.push(`Date column "${mapping.date.column}" not found in headers`);
    }
    if (mapping.mfe?.column && !headerSet.has(mapping.mfe.column.toLowerCase())) {
      errors.push(`MFE column "${mapping.mfe.column}" not found in headers`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Column mapping validation failed", details: errors, mapping },
        { status: 422 }
      );
    }

    const response = NextResponse.json({ 
      success: true, 
      mapping,
      headers, // Echo back for reference
    });
    return addRateLimitHeaders(response, rateLimitResult);

  } catch (error) {
    console.error("AI mapping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
