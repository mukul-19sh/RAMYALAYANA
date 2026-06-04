/**
 * Core interface contract for all serviceability providers.
 * Any provider implementation MUST satisfy this interface.
 * The COD eligibility route depends only on this interface —
 * never on a concrete provider class.
 */
export interface ServiceabilityResult {
  /** Whether the postal code can receive deliveries at all */
  serviceable: boolean;
  /** Whether Cash on Delivery is specifically available at this PIN */
  codAvailable: boolean;
  /** Estimated delivery window in business days (populated by real-time providers only) */
  estimatedDays?: number;
  /** Carrier name that services this PIN (populated by real-time providers only) */
  carrier?: string;
  /** Name of the provider that answered this query — for observability */
  provider: string;
}

export interface ServiceabilityProvider {
  /** Human-readable identifier for this provider (e.g. "static", "delhivery") */
  readonly name: string;
  /**
   * Check whether a given postal code is eligible for Cash on Delivery.
   * All implementations are async to allow seamless API-backed providers.
   *
   * @param postalCode - 6-digit Indian PIN code
   */
  checkCOD(postalCode: string): Promise<ServiceabilityResult>;
}

/** Canonical values for provider names, used by the factory and env config */
export type ProviderName = "static" | "delhivery" | "shiprocket" | "bluedart";
