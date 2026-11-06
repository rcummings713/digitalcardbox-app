# ADR 0012: isolated DEV product checkout with Stripe sandbox

Date: 6 November 2026. Status: accepted for DEV; live release deferred.

The owner requested optional premium card and book payments with exact provider setup instructions. This advances DCB-E10-S01–S05 into an isolated test implementation; S06 margins remains future work. Existing basic participation remains free and guest-to-host external gift routes remain unverified handoffs. ADR 0003 and integrated gift processing boundaries are unchanged.

Use Stripe-hosted full-page Checkout for a $4.99 signature finish and $15/$30/$79 digital book tiers. No second payment processor or frontend secret is needed. Accept sandbox API keys and signed sandbox events only, use fixed server Price IDs/currency, retrieve provider session state and validate the whole order/session/attempt/line-item tuple before entitlement. Checkout return parameters are never proof. No PAN/CVV or financial account number enters the app.

The existing isolated SQLite adapter adds Billing-owned orders/items/attempts/events/refunds/entitlements and Book-owned frozen membership snapshots. Use existing Cards/Events/Application public authorization and book-selection contracts. Membership uses same-event foreign keys, original notes are not copied, current consent/moderation is rechecked at disclosure, and additive migration preserves storage identity/key. Production still follows ADR 0001/0005 rather than treating DEV SQLite as an accepted production finance stack.

Allow clearly labeled provisional book purchases before closure only when a DEV flag is set. Final book purchase follows contribution closure; no physical printing/shipping is offered. Every existing template and basic export remains free. Signature finish is a visible gold frame/seal, with no unbounded AI entitlement. Both digital album styles include full notes and retained media with bounded export size.

Signed events are deduplicated durably. Successful partial refunds retain access; full refunds and disputes revoke only the paid entitlement, preserving content and order history. Refund issuance and unresolved disputes are handled in Stripe Dashboard. Late payment events cannot regrant fully refunded/disputed orders. Operator pause affects new checkouts, not settlement or existing paid access.

Provider calls occur outside database transactions; attempt IDs become provider idempotency keys. Ambiguous create failures keep the attempt for retry and stop before 24-hour key expiry. Event receipts contain identifiers/type/digest/time rather than full webhook bodies. Private invitation tokens remain local to the browser's return context and never travel to Stripe.

No live transactions, TEST/PROD deployment, verified gift receipt, physical fulfillment or fully reconciled profit reporting is authorized by this extension. Operator totals are explicitly sandbox gross/refund values. Account-specific secrets and Price IDs must be configured by the owner using [PRODUCT_CHECKOUT.md](../specs/PRODUCT_CHECKOUT.md); missing setup fails closed.
