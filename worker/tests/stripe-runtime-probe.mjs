import { MediaService } from "../../server/media-service.mjs";
import { AuthProvider } from "../../server/auth-provider.mjs";
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
    let artworkRequestAccepted = false,
      authRequestAccepted = false;
    const nativeFetch = async (input, init) => {
      const request = new Request(input, init);
      if (request.redirect !== "manual")
        throw new Error("Credentials must not follow redirects");
      return Response.json({ ok: true });
    };
    const media = new MediaService(null, {
      apiKey: "sk-runtime-fixture",
      fetcher: nativeFetch,
    });
    artworkRequestAccepted =
      (
        await media.call("moderations", {
          input: "Safe stationery",
          model: "omni-moderation-latest",
        })
      ).ok === true;
    const auth = new AuthProvider({
      url: "https://auth.fixture.invalid",
      publishableKey: "sb_publishable_native_fixture",
      fetcher: nativeFetch,
    });
    authRequestAccepted = (await auth.call("settings")).ok === true;
    return Response.json({
      artworkRequestAccepted,
      authRequestAccepted,
      nativeRequestAccepted: price.id === "price_fixture",
      redirectRejected: rejected,
      calls,
    });
  },
};
