"use client";

import { useEffect, useMemo, useState } from "react";

type PricePoint = {
  date: string;
  close: number;
};

export default function QQQQuantDashboard() {
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [eurusd, setEurusd] = useState(1.08);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketData() {
      const res = await fetch("/api/market");
      const data = await res.json();

      setPrices(data.prices || []);
      setEurusd(data.eurusd || 1.08);
      setLoading(false);
    }

    loadMarketData();
  }, []);

  const result = useMemo(() => {
    if (prices.length < 250) {
      return null;
    }

    const closes = prices.map((p) => p.close);
    const latestPrice = closes.at(-1)!;
    const ath = Math.max(...closes);
    const drawdown = ((latestPrice - ath) / ath) * 100;

    const ma = (days: number) => {
      const slice = closes.slice(-days);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    };

    const ma20 = ma(20);
    const ma60 = ma(60);
    const ma200 = ma(200);

    const returns = closes
      .slice(1)
      .map((p, i) => (p - closes[i]) / closes[i]);

    const recentReturns = returns.slice(-30);
    const avg =
      recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;

    const variance =
      recentReturns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
      recentReturns.length;

    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

    const gains = recentReturns.filter((r) => r > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(
      recentReturns.filter((r) => r < 0).reduce((a, b) => a + b, 0)
    );

    const rsi = 100 - 100 / (1 + gains / Math.max(losses, 0.0001));

    let trendScore = 0;
    if (latestPrice > ma200) trendScore += 40;
    if (ma20 > ma60) trendScore += 30;
    if (ma60 > ma200) trendScore += 30;

    let drawdownScore = 10;
    if (drawdown < -30) drawdownScore = 100;
    else if (drawdown < -20) drawdownScore = 75;
    else if (drawdown < -10) drawdownScore = 55;
    else if (drawdown < -5) drawdownScore = 35;

    let volatilityScore = 20;
    if (volatility > 35) volatilityScore = 100;
    else if (volatility > 25) volatilityScore = 75;
    else if (volatility > 15) volatilityScore = 50;

    let rsiScore = 50;
    if (rsi < 30) rsiScore = 90;
    else if (rsi < 40) rsiScore = 70;
    else if (rsi > 70) rsiScore = 20;

    const quantScore =
      trendScore * 0.25 +
      drawdownScore * 0.35 +
      volatilityScore * 0.2 +
      rsiScore * 0.2;

    let multiplier = 1;
    if (quantScore >= 85) multiplier = 2;
    else if (quantScore >= 70) multiplier = 1.5;
    else if (quantScore >= 55) multiplier = 1.2;
    else if (quantScore < 35) multiplier = 0.6;

    const monthlyBuyEUR = monthlyInvestment * multiplier;
    const monthlyBuyUSD = monthlyBuyEUR * eurusd;

    let shares = 0;
    let investedEUR = 0;
    const monthlyDates = prices.filter((_, i) => i % 21 === 0);

    monthlyDates.forEach((p) => {
      const localATH = Math.max(
        ...prices
          .filter((x) => x.date <= p.date)
          .map((x) => x.close)
      );

      const localDrawdown = ((p.close - localATH) / localATH) * 100;

      let localMultiplier = 1;
      if (localDrawdown < -30) localMultiplier = 2;
      else if (localDrawdown < -20) localMultiplier = 1.5;
      else if (localDrawdown < -10) localMultiplier = 1.2;

      const investEUR = monthlyInvestment * localMultiplier;
      const investUSD = investEUR * eurusd;

      shares += investUSD / p.close;
      investedEUR += investEUR;
    });

    const portfolioUSD = shares * latestPrice;
    const portfolioEUR = portfolioUSD / eurusd;
    const profitEUR = portfolioEUR - investedEUR;
    const roi = (profitEUR / investedEUR) * 100;

    let signal = "NORMAL DCA";
    if (quantScore >= 85) signal = "STRONG BUY";
    else if (quantScore >= 70) signal = "ACCUMULATE";
    else if (quantScore < 35) signal = "REDUCE BUYING";

    return {
      latestPrice,
      ma20,
      ma60,
      ma200,
      drawdown,
      volatility,
      rsi,
      quantScore,
      multiplier,
      monthlyBuyEUR,
      portfolioEUR,
      investedEUR,
      profitEUR,
      roi,
      signal,
    };
  }, [prices, monthlyInvestment, eurusd]);

  if (loading || !result) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-green-500 text-3xl font-bold">
          Loading real QQQ data...
        </div>
      </main>
    );
  }

  const bars = prices.filter((_, i) => i % 260 === 0).slice(-20);
  const maxPrice = Math.max(...bars.map((p) => p.close));

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <section className="mb-10">
          <h1 className="text-5xl font-bold mb-3">QQQ Quant AI</h1>
          <p className="text-zinc-400">
            Real QQQ data · 20Y backtest · EUR-based DCA model
          </p>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-8">
          <p className="text-zinc-400 mb-3">Monthly Base Investment (€)</p>
          <input
            type="number"
            value={monthlyInvestment}
            onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 text-4xl font-bold text-green-500 outline-none"
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card title="Real QQQ Price" value={`$${result.latestPrice.toFixed(2)}`} />
          <Card title="Quant Score" value={`${result.quantScore.toFixed(0)}/100`} />
          <Card title="Suggested Buy" value={`€${result.monthlyBuyEUR.toFixed(0)}`} />
          <Card title="Signal" value={result.signal} />
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="flex justify-between mb-8">
            <div>
              <p className="text-zinc-400 mb-1">Portfolio Value</p>
              <h2 className="text-5xl font-bold text-green-500">
                €{result.portfolioEUR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>
            </div>

            <div className="text-right">
              <p className="text-zinc-400 mb-1">Total Invested</p>
              <h2 className="text-2xl font-bold">
                €{result.investedEUR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>
            </div>
          </div>

          <div className="h-96 flex items-end gap-1">
            {bars.map((p) => (
              <div
                key={p.date}
                className="flex-1 bg-green-500 rounded-t-xl"
                style={{
                  height: `${(p.close / maxPrice) * 100}%`,
                  boxShadow: "0 0 25px rgba(0,200,5,0.45)",
                }}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card title="ROI" value={`${result.roi.toFixed(0)}%`} />
          <Card title="Profit" value={`€${result.profitEUR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Card title="Drawdown" value={`${result.drawdown.toFixed(1)}%`} />
          <Card title="Volatility" value={`${result.volatility.toFixed(1)}%`} />
          <Card title="RSI" value={result.rsi.toFixed(0)} />
          <Card title="MA20" value={`$${result.ma20.toFixed(2)}`} />
          <Card title="MA60" value={`$${result.ma60.toFixed(2)}`} />
          <Card title="MA200" value={`$${result.ma200.toFixed(2)}`} />
        </section>

        <section className="bg-gradient-to-r from-green-500/20 to-zinc-900 border border-green-500/30 rounded-3xl p-8">
          <p className="text-zinc-400 mb-2">Model Recommendation</p>
          <h2 className="text-5xl font-bold text-green-500 mb-4">
            {result.signal}
          </h2>
          <p className="text-zinc-300 text-xl">
            Based on trend, drawdown, volatility and RSI, the model suggests investing{" "}
            <span className="text-green-500 font-bold">
              €{result.monthlyBuyEUR.toFixed(0)}
            </span>{" "}
            this month.
          </p>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
      <p className="text-zinc-400 text-sm mb-2">{title}</p>
      <div className="text-3xl font-bold text-green-500">{value}</div>
    </div>
  );
}