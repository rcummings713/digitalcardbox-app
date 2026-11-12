import { useEffect, useRef, useState } from "react";
import type { Entry } from "./model";
import { request } from "./api";
import { useStore } from "./state";
import { Heading, Link } from "./shared";
import { savePaidBook } from "./paid-book";

import { emptyBilling } from "../modules/billing/public";
import type {
  PurchaseOrder,
  BillingConfiguration,
} from "../modules/billing/public";
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount / 100,
  );
interface CheckoutContext {
  prefix: string;
  back: string;
}
function context(order: string): CheckoutContext {
  try {
    const value = JSON.parse(
      sessionStorage.getItem("dcb-purchase-" + order) || "null",
    );
    if (
      value &&
      /^(?:\/api\/billing|\/api\/invitations\/[A-Za-z0-9_-]{20,100}\/billing)$/.test(
        value.prefix,
      ) &&
      /^\/(?:g\/[A-Za-z0-9_-]{20,100}\/(?:thanks|review)|workspace\/events\/[a-zA-Z0-9-]+\/book)$/.test(
        value.back,
      )
    )
      return value;
  } catch {}
  return { prefix: "/api/billing", back: "/workspace" };
}
async function csrfFor(prefix: string) {
  const token = prefix.match(
    /^\/api\/invitations\/([A-Za-z0-9_-]+)\/billing$/,
  )?.[1];
  return (
    await request<{ csrfToken: string }>(
      token ? "/api/invitations/" + token : "/api/session",
    )
  ).csrfToken;
}
async function openCheckout(
  order: PurchaseOrder,
  value: CheckoutContext,
  csrf?: string,
) {
  try {
    sessionStorage.setItem("dcb-purchase-" + order.id, JSON.stringify(value));
  } catch {
    throw new Error(
      "Allow temporary browser storage before opening checkout so you can return to your purchase.",
    );
  }
  const result = await request<{ url: string; order: PurchaseOrder }>(
    value.prefix + "/orders/" + order.id + "/checkout",
    { method: "POST", body: "{}" },
    csrf || (await csrfFor(value.prefix)),
  );
  const url = new URL(result.url);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.stripe.com" ||
    url.username ||
    url.password ||
    url.port ||
    !url.pathname.startsWith("/c/pay/cs_test_")
  )
    throw new Error("The test checkout link could not be verified.");
  location.assign(url.href);
}
function OrderDetails({ order }: { order: PurchaseOrder }) {
  return (
    <dl className="purchase-details">
      <div>
        <dt>Product</dt>
        <dd>
          {order.product === "premium-card"
            ? "Signature card finish"
            : "Digital keepsake book"}
        </dd>
      </div>
      <div>
        <dt>Price</dt>
        <dd>{money(order.amountMinor)} USD</dd>
      </div>
      {order.snapshot && (
        <div>
          <dt>Included cards</dt>
          <dd>
            {order.snapshot.included_count}
            {order.snapshot.preview
              ? " · provisional test edition"
              : " · finalized edition"}
          </dd>
        </div>
      )}
      <div>
        <dt>Payment status</dt>
        <dd>{order.status.replaceAll("_", " ")}</dd>
      </div>
    </dl>
  );
}
export function PurchasePanel({
  product,
  targetId,
  prefix,
  back,
  onAccess,
  beforeSend = false,
}: {
  product: PurchaseOrder["product"];
  targetId: string;
  prefix: string;
  back: string;
  onAccess?: (value: boolean) => void;
  beforeSend?: boolean;
}) {
  const { mode, configuration } = useStore();
  const billing = configuration.billing || emptyBilling;
  const [order, setOrder] = useState<PurchaseOrder>();
  const [access, setAccess] = useState<{ active: boolean; orderId?: string }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const key = useRef(crypto.randomUUID());
  const callback = useRef(onAccess);
  callback.current = onAccess;
  const card = product === "premium-card";
  const enabled =
    mode === "server" && (card ? billing.premiumCards : billing.eventBooks);
  useEffect(() => {
    let active = true;
    if (mode === "server")
      request<{ active: boolean; orderId?: string; card?: Entry }>(
        prefix + "/access/" + targetId,
      )
        .then((value) => {
          if (active) {
            setAccess(value);
            callback.current?.(value.active);
          }
        })
        .catch(() => {
          /* An unavailable purchase never blocks a free card. */
        });
    return () => {
      active = false;
    };
  }, [prefix, targetId, mode]);
  async function quote() {
    setBusy(true);
    setError("");
    try {
      const value = await request<{ order: PurchaseOrder }>(
        prefix + "/quotes",
        {
          method: "POST",
          body: JSON.stringify({
            product,
            requestKey: key.current,
            ...(card ? { cardId: targetId } : { eventId: targetId, preview }),
          }),
        },
        await csrfFor(prefix),
      );
      setOrder(value.order);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="panel purchase-panel"
      aria-label={card ? "Optional premium card" : "Digital keepsake purchase"}
    >
      <p className="eyebrow">
        {card ? "A little finishing touch" : "The digital keepsake edition"}
      </p>
      <h2>
        {card
          ? "Your Signature card, made for them."
          : "Keep a beautifully composed edition."}
      </h2>
      <p>
        {card
          ? beforeSend
            ? "Your selected edition is $4.99. Complete checkout, then return here and choose Send. Your card stays private until you send it. Free cards are always available."
            : "Your Signature purchase is $4.99. Your original words remain available with your card."
          : "Download a self-contained digital album with complete notes, retained artwork and animations, in editorial or collage style. Your basic CardVault and exports stay free. Physical printing and shipping are separate."}
      </p>
      <p className="purchase-test-label">
        Stripe test mode · No real money is charged.
      </p>
      {access?.active ? (
        <>
          <p role="status">
            {card
              ? beforeSend
                ? "Your premium card is paid and ready for you to send."
                : "Your Signature edition is active."
              : "Your digital edition is available."}
          </p>
          {!card && access.orderId && (
            <Link
              className="primary"
              to={"/checkout/return?order=" + access.orderId}
            >
              Open purchased edition
            </Link>
          )}
        </>
      ) : (
        <>
          {!enabled && (
            <p className="small">
              Purchases are unavailable right now. Your free cards and CardVault
              are still available.
            </p>
          )}
          {!card && enabled && billing.earlyBookPreview && !order && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={preview}
                onChange={(event) => {
                  setPreview(event.target.checked);
                  key.current = crypto.randomUUID();
                }}
              />
              Use current entries for a provisional test checkout before cards
              close
            </label>
          )}
          {order ? (
            <>
              <OrderDetails order={order} />
              <button
                className="primary"
                disabled={busy || !enabled || order.entitled}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await openCheckout(order, { prefix, back });
                  } catch (error) {
                    setError((error as Error).message);
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Opening Stripe…" : "Continue to Stripe test checkout"}
              </button>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => {
                  setOrder(undefined);
                  key.current = crypto.randomUUID();
                }}
              >
                Back to product choices
              </button>
            </>
          ) : (
            <button
              className="primary"
              disabled={busy || !enabled}
              onClick={quote}
            >
              {busy
                ? "Preparing your quote…"
                : card
                  ? "Review $4.99 premium card"
                  : "Review book purchase"}
            </button>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function CheckoutReturn() {
  const id = new URLSearchParams(location.search).get("order") || "";
  const [order, setOrder] = useState<PurchaseOrder>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [style, setStyle] = useState<"editorial" | "collage">("editorial");
  const value = context(id);
  async function refresh() {
    if (!/^[a-f0-9-]{36}$/.test(id)) {
      setError("This purchase reference is not valid.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setOrder(
        (
          await request<{ order: PurchaseOrder }>(
            value.prefix + "/orders/" + id,
          )
        ).order,
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function poll() {
      if (!/^[a-f0-9-]{36}$/.test(id)) {
        setError("This purchase reference is not valid.");
        return;
      }
      try {
        const result = await request<{ order: PurchaseOrder }>(
          value.prefix + "/orders/" + id,
        );
        if (!active) return;
        setOrder(result.order);
        setError("");
        if (
          ["pending", "created"].includes(result.order.status) &&
          ++attempts < 8
        )
          timer = setTimeout(poll, 2500);
      } catch (error) {
        if (active) setError((error as Error).message);
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, value.prefix]);
  return (
    <>
      <Heading
        eyebrow="Your product purchase"
        title={
          order?.entitled
            ? "Your keepsake is ready."
            : "Let’s check your purchase."
        }
      />
      <section className="panel purchase-panel">
        <p className="purchase-test-label">
          Stripe test mode · No real money is charged.
        </p>
        <p>
          Only a payment verified with Stripe unlocks a product. Returning here
          or closing checkout does not confirm a payment.
        </p>
        {error && (
          <p role="alert">
            {error} Use the original browser and invitation or signed-in
            workspace to access this purchase.
          </p>
        )}
        {order ? (
          <>
            <OrderDetails order={order} />
            <p role="status">
              {order.entitled
                ? order.product === "premium-card"
                  ? "Your Signature purchase is confirmed. Return to your card review to send it if you haven’t already."
                  : "Your digital keepsake is unlocked."
                : order.status === "refunded"
                  ? "This purchase was fully refunded. Paid access has been removed; original notes remain safe."
                  : order.status === "disputed"
                    ? "Paid access is paused while this payment is reviewed."
                    : "Paid access is not confirmed. Your original free content remains available."}
            </p>
            {order.entitled &&
              order.product === "premium-card" &&
              value.back.endsWith("/review") && (
                <Link className="primary" to={value.back}>
                  Review and send my card ↗
                </Link>
              )}
            {order.entitled && order.product === "event-book" && (
              <div className="buttons">
                <label>
                  Edition style
                  <select
                    value={style}
                    onChange={(event) =>
                      setStyle(event.target.value as typeof style)
                    }
                  >
                    <option value="editorial">The Editorial</option>
                    <option value="collage">The Collage</option>
                  </select>
                </label>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await savePaidBook(
                        value.prefix + "/orders/" + id + "/book",
                        style,
                      );
                    } catch (error) {
                      setError((error as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy
                    ? "Preparing your edition…"
                    : "Download digital keepsake (.html)"}
                </button>
              </div>
            )}
            {!order.entitled &&
              ["created", "pending", "failed", "expired"].includes(
                order.status,
              ) && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await openCheckout(order, value);
                    } catch (error) {
                      setError((error as Error).message);
                      setBusy(false);
                    }
                  }}
                >
                  Return to Stripe test checkout
                </button>
              )}
          </>
        ) : (
          !error && <p role="status">Checking your saved purchase…</p>
        )}
        <div className="buttons">
          <button className="secondary" disabled={busy} onClick={refresh}>
            Refresh payment status
          </button>
          <Link className="text-link" to={value.back}>
            Return to your card or card box
          </Link>
        </div>
      </section>
    </>
  );
}
export function BillingAdmin() {
  const [value, setValue] = useState<{
    configuration: BillingConfiguration;
    orders: Array<{
      id: string;
      product: string;
      amount_minor: number;
      status: string;
    }>;
    totals: { paidMinor: number; refundedMinor: number };
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    request<typeof value>("/api/admin/billing")
      .then(setValue)
      .catch((error) => setError(error.message));
  }, []);
  return (
    <section className="panel">
      <h2>Product test checkout</h2>
      <p>
        Sandbox orders are separate from guest gifts. The totals below are test
        amounts, not real revenue or profit.
      </p>
      {error && <p role="alert">{error}</p>}
      {value && (
        <>
          <p>
            Stripe configuration:{" "}
            {value.configuration.configured
              ? "Test connection configured"
              : "Awaiting private Stripe test setup"}
          </p>
          <button
            className="secondary"
            role="switch"
            aria-label="Product test checkout"
            aria-checked={value.configuration.enabled}
            disabled={busy || !value.configuration.configured}
            onClick={async () => {
              setBusy(true);
              try {
                setValue(
                  await request(
                    "/api/admin/billing",
                    {
                      method: "PATCH",
                      body: JSON.stringify({
                        enabled: !value.configuration.enabled,
                      }),
                    },
                    await csrfFor("/api/billing"),
                  ),
                );
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {value.configuration.enabled ? "Pause checkout" : "Enable checkout"}
          </button>
          <p>
            Test paid total: {money(value.totals.paidMinor)} · successful test
            refunds: {money(value.totals.refundedMinor)}
          </p>
          <ul className="purchase-orders">
            {value.orders.map((order) => (
              <li key={order.id}>
                <strong>
                  {order.product === "premium-card"
                    ? "Signature card"
                    : "Digital book"}
                </strong>{" "}
                · {money(order.amount_minor)} ·{" "}
                {order.status.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
