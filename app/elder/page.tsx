import type { Metadata } from "next";
import { ElderScreen } from "./elder-screen";

export const metadata: Metadata = { title: "Elder screen" };

/**
 * Elder-friendly screen: no login — a short access code (from the family
 * dashboard) unlocks a large-button view with the next visit and SOS.
 */
export default function ElderPage() {
  return <ElderScreen />;
}
