import type { DisplayedDestination, PaymentService } from "./public";

export interface RoutingDestination extends DisplayedDestination {
  enabled: boolean;
  confirmed: boolean;
  previewOnly?: boolean;
}
export interface GiftHandoff {
  giftId: string;
  service: PaymentService;
  recipient: string;
  identifier: string;
  version: number;
  previewOnly: boolean;
  reference: string;
  amount: string;
}
export function validIdentifier(
  service: PaymentService,
  value: string,
): boolean {
  if (service === "Cash App")
    return /^\$[A-Za-z0-9]{1,20}$/.test(value) && /[A-Za-z]/.test(value);
  if (service === "Venmo") return /^@[A-Za-z0-9_-]{5,30}$/.test(value);
  if (service === "Zelle")
    return (
      /^[^\s@<>]{1,64}@[^\s@<>]+\.[A-Za-z]{2,}$/.test(value) ||
      /^(?:\+1)?[2-9][0-9]{9}$/.test(value)
    );
  return false;
}
export function fictionalIdentifier(identifier: string) {
  return (
    [
      "@alex-maya-design",
      "$AlexMayaDesign",
      "@digitalcardbox-preview",
      "$CardBoxPreview",
    ].includes(identifier) ||
    /@(?:.*\.)?(?:invalid|test|example)$/i.test(identifier)
  );
}
export function providerRoute(
  destination: Pick<DisplayedDestination, "service" | "identifier">,
) {
  const { service, identifier } = destination;
  if (!validIdentifier(service, identifier))
    throw new Error("Check the host’s exact " + service + " identifier.");
  // Only fixed HTTPS origins and validated profile paths. No payment instructions,
  // private card text, invitation tokens, amounts or guest data leave this site.
  if (service === "Cash App") return "https://cash.app/" + identifier;
  if (service === "Venmo") return "https://venmo.com/u/" + identifier.slice(1);
  return "https://www.zellepay.com/get-started";
}
export function reviewDestination(
  destinations: RoutingDestination[],
  service: PaymentService,
  version: number,
) {
  const destination = destinations.find((x) => x.service === service);
  if (
    !destination ||
    !destination.enabled ||
    !destination.confirmed ||
    destination.version !== version
  )
    throw new Error(
      "The host’s gift details changed or were paused. Reopen the invitation and review them again.",
    );
  if (
    destination.previewOnly === false &&
    fictionalIdentifier(destination.identifier)
  )
    throw new Error("Keep fictional recipients in preview mode.");
  providerRoute(destination);
  return destination;
}
