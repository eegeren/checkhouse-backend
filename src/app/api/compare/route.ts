import { NextResponse } from "next/server";
import { CheckHouseReport } from "@/lib/types";

export async function POST(request: Request) {
  const { reports } = (await request.json()) as { reports?: CheckHouseReport[] };
  const selected = (reports ?? []).slice(0, 3);
  if (selected.length < 2) {
    return NextResponse.json({ error: "Provide 2 or 3 reports." }, { status: 400 });
  }
  const bestOverall = maxBy(selected, (report) => report.scores.overall);
  const bestFamily = maxBy(selected, (report) => report.scores.familySuitability);
  const bestInvestment = maxBy(selected, (report) => report.scores.investment);
  return NextResponse.json({
    bestOverall: bestOverall.location.address,
    bestForFamilies: bestFamily.location.address,
    bestInvestment: bestInvestment.location.address,
    recommendation: `Best overall: ${bestOverall.location.address}. Best for families: ${bestFamily.location.address}. Best investment: ${bestInvestment.location.address}.`
  });
}

function maxBy<T>(items: T[], selector: (item: T) => number): T {
  return items.reduce((best, item) => (selector(item) > selector(best) ? item : best), items[0]);
}
