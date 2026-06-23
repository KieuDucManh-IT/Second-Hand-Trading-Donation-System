require("dotenv").config({ override: true });
const crypto = require("crypto");

const PAYOS_PAYOUT_BASE_URL =
  process.env.PAYOS_PAYOUT_BASE_URL || "https://api-merchant.payos.vn";

function getPayoutConfig() {
  const clientId = process.env.PAYOS_PAYOUT_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_PAYOUT_API_KEY?.trim();
  const checksumKey = process.env.PAYOS_PAYOUT_CHECKSUM_KEY?.trim();

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error(
      "Thiếu PAYOS_PAYOUT_CLIENT_ID / PAYOS_PAYOUT_API_KEY / PAYOS_PAYOUT_CHECKSUM_KEY trong .env"
    );
  }

  return {
    clientId,
    apiKey,
    checksumKey,
  };
}

function createPayoutSignature(data, checksumKey) {
  const rawData = Object.keys(data)
    .sort()
    .map((key) => {
      let value = data[key];

      if (
        value === null ||
        value === undefined ||
        value === "null" ||
        value === "undefined"
      ) {
        value = "";
      }

      if (Array.isArray(value) || typeof value === "object") {
        value = JSON.stringify(value);
      }

      return `${key}=${encodeURI(String(value))}`;
    })
    .join("&");

  console.log("PAYOUT RAW SIGNATURE DATA:", rawData);

  return crypto
    .createHmac("sha256", checksumKey)
    .update(rawData)
    .digest("hex");
}

async function createSinglePayout({
  referenceId,
  amount,
  description,
  toBin,
  toAccountNumber,
}) {
  const { clientId, apiKey, checksumKey } = getPayoutConfig();

  const body = {
    referenceId: String(referenceId),
    amount: Number(amount),
    description: "Rut tien SL",
    toBin: String(toBin),
    toAccountNumber: String(toAccountNumber),
  };

  const signature = createPayoutSignature(body, checksumKey);

  console.log("CREATE PAYOUT USING:");
  console.log(
    "PAYOS_PAYOUT_CLIENT_ID:",
    clientId.slice(0, 6) + "..." + clientId.slice(-4)
  );
  console.log(
    "PAYOS_PAYOUT_API_KEY:",
    apiKey.slice(0, 6) + "..." + apiKey.slice(-4)
  );
  console.log("PAYOUT BODY:", body);
  console.log("PAYOUT SIGNATURE:", signature);

  const res = await fetch(`${PAYOS_PAYOUT_BASE_URL}/v1/payouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
      "x-idempotency-key": body.referenceId,
      "x-signature": signature,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log("PAYOS CREATE PAYOUT RESPONSE:", data);

  if (!res.ok || data.code !== "00") {
    const error = new Error(data.desc || "Không thể tạo lệnh chi payOS");
    error.response = data;
    throw error;
  }

  return data.data;
}

async function getPayoutDetail(payoutId) {
  const { clientId, apiKey } = getPayoutConfig();

  const res = await fetch(`${PAYOS_PAYOUT_BASE_URL}/v1/payouts/${payoutId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });

  const data = await res.json();

  if (!res.ok || data.code !== "00") {
    const error = new Error(
      data.desc || "Không thể lấy trạng thái lệnh chi payOS"
    );
    error.response = data;
    throw error;
  }

  return data.data;
}

async function getPayoutBalance() {
  const { clientId, apiKey } = getPayoutConfig();

  const res = await fetch(`${PAYOS_PAYOUT_BASE_URL}/v1/payouts-account/balance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });

  const data = await res.json();

  if (!res.ok || data.code !== "00") {
    const error = new Error(
      data.desc || "Không thể lấy số dư tài khoản chi payOS"
    );
    error.response = data;
    throw error;
  }

  return data.data;
}

module.exports = {
  createSinglePayout,
  getPayoutDetail,
  getPayoutBalance,
};