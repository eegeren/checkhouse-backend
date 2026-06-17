import * as cheerio from "cheerio";

export type ListingParseResult = {
  title?: string;
  price?: string;
  address?: string;
  description?: string;
  images: string[];
  needsManualAddress: boolean;
};

export async function parseListingUrl(listingUrl: string): Promise<ListingParseResult> {
  try {
    const response = await fetch(listingUrl, {
      headers: {
        "user-agent": "CheckHouseBot/0.1 property analysis preview"
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Listing fetch failed: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("meta[property='og:title']").attr("content") ?? $("title").first().text().trim();
    const description = $("meta[property='og:description']").attr("content") ?? $("meta[name='description']").attr("content");
    const image = $("meta[property='og:image']").attr("content");
    const bodyText = $("body").text().replace(/\s+/g, " ");
    const price = bodyText.match(/(?:[$€£₺]\s?\d[\d., ]+|\d[\d., ]+\s?(?:USD|EUR|GBP|TRY|TL))/i)?.[0];
    const address = extractAddressLikeText(bodyText);

    return {
      title: title || undefined,
      price: price || undefined,
      address,
      description: description || undefined,
      images: image ? [image] : [],
      needsManualAddress: !address
    };
  } catch {
    const host = new URL(listingUrl).host.replace("www.", "");
    return {
      title: `Listing from ${host}`,
      description: "Listing parsing failed or the site blocked automated preview. Ask the user for the address manually.",
      images: [],
      needsManualAddress: true
    };
  }
}

function extractAddressLikeText(text: string): string | undefined {
  const match = text.match(/(?:address|location|konum|adres)\s*:?\s*([A-Za-z0-9ğüşöçıİĞÜŞÖÇ ,./#-]{12,120})/i);
  return match?.[1]?.trim();
}
