export { ReviewStore } from "../index.mjs";
import { StripeProvider } from "../../server/stripe-provider.mjs";
const setup = {
  secretKey: "sk_test_runtime_fixture_only",
  webhookSecret: "whsec_runtime_fixture_only",
  returnOrigin: "https://example.com",
};
export default {
  async fetch() {
    let calls = 0;
    const provider = new StripeProvider({
      ...setup,
      fetcher: async (input, init) => {
        // This is the real workerd Request constructor, with no vendor request.
        const request = new Request(input, init);
        calls++;
        if (request.redirect !== "manual")
          throw new Error("Provider redirects must not be followed");
        return Response.json({ id: "price_fixture" });
      },
    });
    const price = await provider.api("prices/price_fixture");
    const redirect = new StripeProvider({
      ...setup,
      fetcher: async (input, init) => {
        new Request(input, init);
        calls++;
        return new Response(null, {
          status: 302,
          headers: { location: "https://untrusted.invalid" },
        });
      },
    });
    let rejected = false;
    try {
      await redirect.api("prices/price_fixture");
    } catch (error) {
      rejected = error.code === "stripe_redirect_rejected";
    }
    return Response.json({
      nativeRequestAccepted: price.id === "price_fixture",
      redirectRejected: rejected,
      calls,
    });
  },
};
