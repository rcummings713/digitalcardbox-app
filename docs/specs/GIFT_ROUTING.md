# Reviewed external gift handoff

20 October 2026. The owner approved opening services for host-configured recipients
while fictional recipients stay inside the website. No payment execution, payment
SDK, bank credentials, transaction feed or automatic receipt verification exists.

1. A host enters their exact Cash App `$Cashtag`, Venmo `@username`, or Zelle email /
   U.S. mobile number twice, verifies the recipient in that service, and explicitly
   clears **Preview only** for a real recipient. Known seeded handles and reserved
   test email domains cannot be made real handoffs. Settings remain per service.
2. Guests choose only enabled, host-confirmed services. Switching service/version
   clears acknowledgment. Their known name, optional payment-app nickname, intended
   amount and matching reference help the host associate a gift with a card.
3. Saving produces an **unconfirmed** intent and a recipient/version snapshot.
   The handoff displays the exact identifier, reference, optional amount, route
   and service instructions. Amount and memo must be entered in the provider app.
4. Before opening, connected mode rechecks the invitation session, CSRF, link
   revocation, feature/window, enabled/confirmed destination and current version,
   even on retries. Browser review checks its current local state. Identical
   retries reuse the record; changed payloads cannot overwrite an issued snapshot.
5. Fictional recipients show an internal handoff preview. For real recipients,
   Cash App opens `https://cash.app/$Cashtag`; Venmo opens
   `https://venmo.com/u/username`. Mobile app handoff depends on OS/app settings.
   Copyable identifiers provide the fallback. No `pay` command, amount, memo,
   guest/card data or invitation token is put into an outbound link.
6. Zelle is used through the guest’s own banking app. The UI provides copyable
   recipient/memo and instructions, plus `https://www.zellepay.com/get-started`.
   It does not invent a universal recipient deep link or store bank logins.
7. Returning or finishing never marks money sent/received. Only an explicit host
   account check can mark **Host confirmed**, with an undo; it remains a host
   assertion rather than a provider receipt. No money should be sent in testing.

All provider navigation uses fixed HTTPS origins and strict identifier validation;
no arbitrary host URL, redirect URL, remote QR payload or custom URI is accepted.
The document uses a no-referrer policy. GIF search remains a same-origin curated
catalog; no external GIF keys or requests are introduced by gift routing.

The default Cloudflare DEV preview runs the browser review adapter, so records and
configured test routes stay in that browser. The local connected API persists the
same matching flow in SQLite with ownership/scoped guest sessions and migrations.
It is not hosted by the assets-only Worker. Production PostgreSQL locking/schema
contracts, deployed identity and approved provider transaction-data access remain
open under existing stories; this is not a completed production payment system.

Official references checked for the implementation:

- [Cash App sending and receiving](https://cash.app/learn/getting-started/how-to-send-and-receive-money): identify the recipient and verify details in Cash App.
- [Venmo sending and receiving](https://venmo.com/financial-education/how-to-send-receive-money): recipient search/review and final payment take place in Venmo.
- [Zelle app changes](https://www.zellepay.com/faq/ive-heard-theres-change-zeller-app-what-happening): standalone transfers ended; use a participating bank/credit union.
- [Zelle bank finder](https://www.zellepay.com/get-started): official path for finding a participating bank.
- [Venmo API status](https://venmo.com/docs/authentication): legacy Developer/Payouts APIs are retired for new businesses; profile navigation does not imply transaction-data access.
