export const paymentServices = [
  "Venmo",
  "Cash App",
  "Zelle",
  "PayPal",
] as const;
export type PaymentService = (typeof paymentServices)[number];

export interface DisplayedDestination {
  service: PaymentService;
  recipient: string;
  identifier: string;
  version: number;
}
