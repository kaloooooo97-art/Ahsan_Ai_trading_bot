const https = require("https");

function getBTCPrices() {
  return new Promise((resolve, reject) => {
    const url =
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100";

    https.get(url, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const candles = JSON.parse(data);

          if (!Array.isArray(candles)) {
            return reject(new Error("Market data unavailable"));
          }

          const closes = candles.map((candle) =>
            Number(candle[4])
          );

          resolve(closes);
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

module.exports = {
  getBTCPrices
};
