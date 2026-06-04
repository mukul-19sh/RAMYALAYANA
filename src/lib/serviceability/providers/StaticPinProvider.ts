import type { ServiceabilityProvider, ServiceabilityResult } from "../types";
import pinData from "@/data/serviceablePins.json";

/**
 * Phase 1 provider — reads PIN codes from `src/data/serviceablePins.json`.
 *
 * Characteristics:
 * - Zero network calls. O(1) lookup via Set.
 * - Sub-millisecond latency.
 * - No API key required.
 * - PIN list maintained by editing serviceablePins.json (no TypeScript changes needed).
 *
 * Replace by setting SERVICEABILITY_PROVIDER=delhivery (or shiprocket / bluedart)
 * in environment variables — no checkout logic changes required.
 */
export class StaticPinProvider implements ServiceabilityProvider {
  readonly name = "static";

  private readonly serviceablePins: ReadonlySet<string>;

  constructor() {
    // Build Set once at module load time — O(1) lookups thereafter
    this.serviceablePins = new Set<string>(pinData.pins);
  }

  async checkCOD(postalCode: string): Promise<ServiceabilityResult> {
    const pin = postalCode.trim();
    const serviceable = this.serviceablePins.has(pin);
    return {
      serviceable,
      codAvailable: serviceable,
      provider: this.name,
    };
  }
}
