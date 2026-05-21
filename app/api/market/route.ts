import { NextResponse } from "next/server";

export async function GET() {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/QQQ?range=20y&interval=1d";

  const fxUrl =
    "https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?range=5d&interval=1d";

  try {
    const [qqqRes, fxRes] = await Promise.all([
      fetch(url, { next: { revalidate: 3600 } }),
      fetch(fxUrl, { next: { revalidate: 3600 } }),
    ]);

    const qqqJson = await qqqRes.json();
    const fxJson = await fxRes.json();

    const result = qqqJson.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;

    const fxResult = fxJson.chart.result[0];
    const eurusd = fxResult.indicators.quote[0].close.filter(Boolean).at(-1);

    const prices = timestamps
      .map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        close: closes[i],
      }))
      .filter((x: any) => x.close);

    return NextResponse.json({
      prices,
      eurusd,
      latestPrice: prices.at(-1)?.close,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}