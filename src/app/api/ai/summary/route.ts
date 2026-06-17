import { NextResponse } from "next/server";
import { generateAISummary } from "@/services/aiSummary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await generateAISummary(body));
  } catch {
    return NextResponse.json({ error: "AI summary failed" }, { status: 400 });
  }
}
