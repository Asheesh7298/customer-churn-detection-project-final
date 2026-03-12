import { NextResponse } from "next/server";

export async function GET() {
  // In production, retrieve from secure environment variable
  // This ensures the API key is never exposed in client-side code
  const apiKey = process.env.BACKEND_API_KEY || "";

  if (!apiKey) {
    console.error("[v0] API key not configured");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  // Return the key (this is called server-side only)
  return NextResponse.json({ key: apiKey });
}
