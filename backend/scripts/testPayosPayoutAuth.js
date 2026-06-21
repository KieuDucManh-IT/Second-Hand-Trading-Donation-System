require("dotenv").config({ override: true });

async function main() {
  const baseUrl =
    process.env.PAYOS_PAYOUT_BASE_URL || "https://api-merchant.payos.vn";

  const clientId = process.env.PAYOS_PAYOUT_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_PAYOUT_API_KEY?.trim();

  console.log(
    "PAYOS_PAYOUT_CLIENT_ID:",
    clientId ? clientId.slice(0, 6) + "..." + clientId.slice(-4) : "MISSING"
  );

  console.log(
    "PAYOS_PAYOUT_API_KEY:",
    apiKey ? apiKey.slice(0, 6) + "..." + apiKey.slice(-4) : "MISSING"
  );

  if (!clientId || !apiKey) {
    console.log("Thiếu PAYOS_PAYOUT_CLIENT_ID hoặc PAYOS_PAYOUT_API_KEY trong .env");
    return;
  }

  const res = await fetch(`${baseUrl}/v1/payouts-account/balance`, {
    method: "GET",
    headers: {
      "x-client-id": clientId,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();

  console.log("HTTP status:", res.status);
  console.log("payOS response:", text);
}

main().catch((error) => {
  console.error("Test payout auth error:", error);
});