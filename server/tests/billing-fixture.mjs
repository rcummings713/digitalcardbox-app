import { createHmac } from "node:crypto";
export const webhookSecret = "whsec_checkout_fixture_secret";
export const priceIds = {
  "premium-card": "price_card_test",
  "book-small": "price_small_test",
  "book-medium": "price_medium_test",
  "book-large": "price_large_test",
};
export function stripeFixture() {
  const sessions = new Map(),
    refunds = new Map(),
    disputes = new Map(),
    calls = [];
  const amounts = {
    price_card_test: 499,
    price_small_test: 1500,
    price_medium_test: 3000,
    price_large_test: 7900,
  };
  let serial = 0;
  const fetcher = async (url, init = {}) => {
    calls.push({ url, method: init.method || "GET", body: init.body });
    const path = new URL(url).pathname.replace("/v1/", "");
    let result;
    if (path.startsWith("prices/")) {
      const id = path.slice(7);
      result = {
        id,
        active: true,
        livemode: false,
        currency: "usd",
        unit_amount: amounts[id],
        recurring: null,
      };
    } else if (path === "checkout/sessions" && init.method === "POST") {
      const params = new URLSearchParams(init.body),
        key = init.headers["Idempotency-Key"];
      result = [...sessions.values()].find((row) => row.retryKey === key);
      if (!result) {
        const id = "cs_test_review" + (++serial).toString().padStart(5, "0"),
          price = params.get("line_items[0][price]");
        result = {
          id,
          livemode: false,
          mode: "payment",
          status: "open",
          payment_status: "unpaid",
          payment_intent: null,
          amount_total: amounts[price],
          currency: "usd",
          url: "https://checkout.stripe.com/c/pay/" + id,
          client_reference_id: params.get("client_reference_id"),
          retryKey: key,
          metadata: {
            dcb_order_id: params.get("metadata[dcb_order_id]"),
            dcb_attempt_id: params.get("metadata[dcb_attempt_id]"),
          },
          line_items: {
            has_more: false,
            data: [
              {
                quantity: 1,
                amount_total: amounts[price],
                price: { id: price },
              },
            ],
          },
        };
        sessions.set(id, result);
      }
    } else if (path.startsWith("checkout/sessions/"))
      result = sessions.get(path.slice(18));
    else if (path.startsWith("refunds/")) result = refunds.get(path.slice(8));
    else if (path.startsWith("disputes/")) result = disputes.get(path.slice(9));
    else if (path.startsWith("payment_intents/")) {
      const row = [...sessions.values()].find(
        (s) => s.payment_intent === path.slice(16),
      );
      if (row) result = { id: row.payment_intent, metadata: row.metadata };
    }
    return Response.json(result || { error: "fixture not found" }, {
      status: result ? 200 : 404,
    });
  };
  function pay(id = [...sessions.keys()][0]) {
    const row = sessions.get(id);
    row.payment_status = "paid";
    row.status = "complete";
    row.payment_intent = "pi_" + id;
    return row;
  }
  async function webhook(
    base,
    type,
    object,
    {
      id = "evt_" + (++serial).toString().padStart(6, "0"),
      stamp = Math.floor(Date.now() / 1000),
      secret = webhookSecret,
      live = false,
    } = {},
  ) {
    const raw = JSON.stringify({ id, type, livemode: live, data: { object } });
    const signature = createHmac("sha256", secret)
      .update(stamp + "." + raw)
      .digest("hex");
    const response = await fetch(base + "/api/billing/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=" + stamp + ",v1=" + signature,
      },
      body: raw,
    });
    return { status: response.status, data: await response.json() };
  }
  return {
    fetcher,
    sessions,
    refunds,
    disputes,
    calls,
    pay,
    webhook,
    options: {
      enabled: true,
      secretKey: "sk_test_checkout_fixture",
      webhookSecret,
      returnOrigin: "http://localhost:4175",
      priceIds,
    },
  };
}
