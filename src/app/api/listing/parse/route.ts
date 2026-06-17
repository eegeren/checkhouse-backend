import { NextResponse } from "next/server";
import { z } from "zod";
import { parseListingUrl } from "@/services/listingParser";

const schema = z.object({ listingUrl: z.string().url() });

export async function POST(request: Request) {
  try {
    const { listingUrl } = schema.parse(await request.json());
    return NextResponse.json(await parseListingUrl(listingUrl));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Listing parse failed" }, { status: 400 });
  }
}
