import type { PaymentMethod } from "@prisma/client";

/**
 * Payment-provider interface.
 *
 * Every provider (eSewa, Khalti, card gateway, …) implements this contract, so a
 * real integration can replace the demo provider without touching booking code.
 * The MVP ships only `demoProvider`, which always succeeds and returns a fake
 * reference. Payments made through it are clearly labelled as demo payments.
 */
export interface PaymentProvider {
  key: string;
  /** Charge (or simulate charging) the given amount. */
  charge(input: {
    bookingCode: string;
    amountNpr: number;
    method: PaymentMethod;
  }): Promise<{ ok: boolean; reference: string; message: string }>;
}

export const demoProvider: PaymentProvider = {
  key: "demo",
  async charge({ bookingCode, amountNpr, method }) {
    // Simulated network latency-free success. Real providers would redirect or
    // call an external API here.
    const reference = `DEMO-${method.slice(0, 4)}-${bookingCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      ok: true,
      reference,
      message: `Demo payment of NPR ${amountNpr.toLocaleString()} recorded. No real money moved.`,
    };
  },
};

export function getPaymentProvider(key = "demo"): PaymentProvider {
  // Future: switch on key to return real providers.
  if (key !== "demo") throw new Error(`Unknown payment provider: ${key}`);
  return demoProvider;
}

/** Cash payments are collected in person; they never go through a provider. */
export const CASH_METHODS: PaymentMethod[] = ["CASH"];
