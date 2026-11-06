export interface PurchaseOrder {
  id: string;
  product: "premium-card" | "event-book";
  targetId: string;
  eventId: string;
  amountMinor: number;
  currency: string;
  status: string;
  entitled: boolean;
  refundedMinor: number;
  testMode: true;
  snapshot?: {
    included_count: number;
    revision: number;
    preview: number;
    cutoff_at: string;
  };
}
export interface BillingConfiguration {
  testMode: true;
  configured: boolean;
  enabled: boolean;
  premiumCards: boolean;
  eventBooks: boolean;
  earlyBookPreview: boolean;
  prices: Record<string, number>;
}
export const emptyBilling: BillingConfiguration = {
  testMode: true,
  configured: false,
  enabled: false,
  premiumCards: false,
  eventBooks: false,
  earlyBookPreview: false,
  prices: {
    "premium-card": 499,
    "book-small": 1500,
    "book-medium": 3000,
    "book-large": 7900,
  },
};
