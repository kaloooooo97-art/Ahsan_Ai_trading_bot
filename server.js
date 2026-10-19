const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

function ema(values, period) {
  if (values.length < period) return null;

  const multiplier = 2 / (period + 1);
  let result =
    values.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < values.length; i++) {
    result =
      (values[i] - result) * multiplier + result;
  }

  return result;
}

function rsi(values, period = 14) {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const change = values[i] - values[i - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  if (losses === 0) return 100;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function analyzeMarket(closes) {
  const currentPrice = closes[closes.length - 1];

  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const RSI = rsi(closes, 14);

  if (ema9 === null || ema21 === null || RSI === null) {
    return {
      signal: "NO TRADE",
      confidence: 0,
      reason: "Not enough candle data"
    };
  }

  let score = 0;
  const reasons = [];

  // Trend
  if (ema9 > ema21) {
    score += 1;
    reasons.push("Bullish EMA trend");
  } else {
    score -= 1;
    reasons.push("Bearish EMA trend");
  }

  // Price position
  if (currentPrice > ema9) {
    score += 1;
    reasons.push("Price above EMA 9");
  } else {
    score -= 1;
    reasons.push("Price below EMA 9");
  }

  // RSI
  if (RSI >= 50 && RSI < 70) {
    score += 1;
    reasons.push("Bullish RSI momentum");
  } else if (RSI <= 50 && RSI > 30) {
    score -= 1;
    reasons.push("Bearish RSI momentum");
  }

  let signal = "NO TRADE";
  let confidence = 50;

  if (score >= 2) {
    signal = "CALL";
    confidence = 70 + score * 5;
  }

  if (score <= -2) {
    signal = "PUT";
    confidence = 70 + Math.abs(score) * 5;
  }

  return {
    signal,
    confidence: Math.min(confidence, 95),
    price: currentPrice,
    ema9: Number(ema9.toFixed(5)),
    ema21: Number(ema21.toFixed(5)),
    rsi: Number(RSI.toFixed(2)),
    reasons,
    timestamp: new Date().toISOString()
  };
}

app.get("/", (req, res) => {
  res.json({
    bot: "AhsanAI Trading Signal Bot",
    status: "online"
  });
});

app.post("/api/analyze", (req, res) => {
  const { closes } = req.body;

  if (!Array.isArray(closes) || closes.length < 25) {
    return res.status(400).json({
      error: "At least 25 candle closing prices are required."
    });
  }

  res.json(analyzeMarket(closes));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AhsanAI server running on port ${PORT}`);
});
