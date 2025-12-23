import { NextRequest, NextResponse } from "next/server";
import { 
  buildAiMappingPrompt, 
  validateAiMapping,
  type AiColumnMapping 
} from "@/app/experiences/[experienceId]/lib/aiMappingSchema";

/**
 * AI Column Mapping API
 * 
 * Receives CSV headers + sample rows, sends to ML model,
 * returns structured column mapping for mechanical parsing.
 */

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "AI service not configured. Please set OPENROUTER_API_KEY." },
        { status: 503 }
      );
    }

    // Build the prompt
    const prompt = buildAiMappingPrompt(headers, sampleRows);

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini:free",
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const aiResponse = await response.json();
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

    return NextResponse.json({ 
      success: true, 
      mapping,
      headers, // Echo back for reference
    });

  } catch (error) {
    console.error("AI mapping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
