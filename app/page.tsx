"use client";

import { useEffect, useMemo, useState } from "react";

export default function QQQQuantDashboard() {

  // =========================
  // USER INPUT
  // =========================

  const [monthlyInvestment, setMonthlyInvestment] =
    useState(1000);

  // =========================
  // REAL MARKET DATA
  // =========================

  const [qqqPrice, setQqqPrice] =
    useState(0);

  const [history, setHistory] =
    useState<number[]>([]);

  // =========================
  // FETCH REAL QQQ DATA
  // =========================

  useEffect(() => {

    async function fetchQQQ() {

      try {

        const response =
          await fetch(
            "https://query1.finance.yahoo.com/v8/finance/chart/QQQ?range=20y&interval=1mo"
          );

        const data = await response.json();

        const prices =
          data.chart.result[0].indicators.quote[0].close;

        setHistory(prices);

        setQqqPrice(
          prices[prices.length - 1]
        );

      } catch (error) {

        console.error(error);

      }

    }

    fetchQQQ();

  }, []);

  // =========================
  // BACKTEST
  // =========================

  const portfolioValue = useMemo(() => {

    if (history.length === 0) return 0;

    let shares = 0;

    history.forEach((price) => {

      if (!price) return;

      shares +=
        monthlyInvestment / price;

    });

    const latestPrice =
      history[history.length - 1];

    return shares * latestPrice;

  }, [history, monthlyInvestment]);

  // =========================
  // TOTAL INVESTED
  // =========================

  const totalInvested =
    monthlyInvestment * history.length;

  // =========================
  // ROI
  // =========================

  const roi = useMemo(() => {

    if (totalInvested === 0) return 0;

    return (
      (
        (portfolioValue - totalInvested)
        / totalInvested
      ) * 100
    );

  }, [portfolioValue, totalInvested]);

  // =========================
  // DRAWDOWN
  // =========================

  const maxPrice =
    Math.max(...history);

  const drawdown =
    (
      (
        qqqPrice - maxPrice
      ) / maxPrice
    ) * 100;

  // =========================
  // AI SCORE
  // =========================

  let score = 50;

  if (drawdown < -10) score += 10;
  if (drawdown < -20) score += 20;
  if (drawdown < -30) score += 30;

  if (roi > 200) score += 10;

  if (score > 100) score = 100;

  // =========================
  // SIGNAL
  // =========================

  let signal = "NORMAL DCA";

  if (score >= 80)
    signal = "EXTREME BUY";

  else if (score >= 65)
    signal = "ACCUMULATE";

  // =========================
  // UI
  // =========================

  return (

    <div className="
      min-h-screen
      bg-black
      text-white
      p-6
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* HEADER */}

        <div className="mb-10">

          <h1 className="
            text-5xl
            font-bold
            mb-3
          ">
            QQQ Quant AI
          </h1>

          <p className="
            text-zinc-400
            text-lg
          ">
            Real-time Nasdaq-100
            Quantitative Investing System
          </p>

        </div>

        {/* INPUT */}

        <div className="
          bg-zinc-950
          border
          border-zinc-800
          rounded-3xl
          p-6
          mb-8
        ">

          <div className="
            text-zinc-400
            text-sm
            mb-3
          ">
            Monthly Investment (€)
          </div>

          <input
            type="number"
            value={monthlyInvestment}
            onChange={(e) =>
              setMonthlyInvestment(
                Number(e.target.value)
              )
            }
            className="
              w-full
              bg-black
              border
              border-zinc-700
              rounded-2xl
              p-4
              text-4xl
              font-bold
              text-green-500
              outline-none
            "
          />

        </div>

        {/* METRICS */}

        <div className="
          grid
          grid-cols-1
          md:grid-cols-4
          gap-4
          mb-8
        ">

          <div className="
            bg-zinc-950
            border
            border-zinc-800
            rounded-3xl
            p-6
          ">

            <div className="
              text-zinc-400
              text-sm
              mb-2
            ">
              Real QQQ Price
            </div>

            <div className="
              text-3xl
              font-bold
              text-green-500
            ">
              ${qqqPrice.toFixed(2)}
            </div>

          </div>

          <div className="
            bg-zinc-950
            border
            border-zinc-800
            rounded-3xl
            p-6
          ">

            <div className="
              text-zinc-400
              text-sm
              mb-2
            ">
              Portfolio Value
            </div>

            <div className="
              text-3xl
              font-bold
              text-green-500
            ">
              €{portfolioValue.toFixed(0)}
            </div>

          </div>

          <div className="
            bg-zinc-950
            border
            border-zinc-800
            rounded-3xl
            p-6
          ">

            <div className="
              text-zinc-400
              text-sm
              mb-2
            ">
              ROI
            </div>

            <div className="
              text-3xl
              font-bold
              text-green-500
            ">
              {roi.toFixed(0)}%
            </div>

          </div>

          <div className="
            bg-zinc-950
            border
            border-zinc-800
            rounded-3xl
            p-6
          ">

            <div className="
              text-zinc-400
              text-sm
              mb-2
            ">
              AI Signal
            </div>

            <div className="
              text-2xl
              font-bold
              text-green-500
            ">
              {signal}
            </div>

          </div>

        </div>

      </div>

    </div>

  );

}