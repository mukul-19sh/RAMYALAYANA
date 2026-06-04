import type { ServiceabilityProvider, ServiceabilityResult } from "../types";

/**
 * Delhivery real-time serviceability provider.
 *
 * Activation: set SERVICEABILITY_PROVIDER=delhivery in environment variables.
 * Required env: DELHIVERY_API_KEY
 *
 * Delhivery Serviceability API docs:
 * https://developers.delhivery.com/docs/serviceability
 *
 * This provider queries the Delhivery Serviceability API for real-time COD
 * eligibility based on the destination PIN, including non-serviceable reasons
 * which are intentionally NOT forwarded to the client.
 */
export class DelhiveryProvider implements ServiceabilityProvider {
  readonly name = "delhivery";

  private readonly apiKey: string;
  private readonly baseUrl = "https://track.delhivery.com/c/api/pin-codes/json/";

  constructor() {
    const apiKey = process.env.DELHIVERY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[DelhiveryProvider] DELHIVERY_API_KEY environment variable is required. " +
          "Set SERVICEABILITY_PROVIDER=static to use the built-in PIN list instead."
      );
    }
    this.apiKey = apiKey;
  }

  async checkCOD(postalCode: string): Promise<ServiceabilityResult> {
    try {
      const url = `${this.baseUrl}?filter_codes=${postalCode.trim()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        // Server-side fetch — Next.js revalidation not needed here
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(`[DelhiveryProvider] API error ${response.status} for PIN ${postalCode}`);
        // Fail open: allow serviceability if the API is down to avoid blocking checkouts
        return { serviceable: true, codAvailable: false, provider: this.name };
      }

      const data = await response.json();
      const pinInfo = data?.delivery_codes?.[0]?.postal_code;

      if (!pinInfo) {
        return { serviceable: false, codAvailable: false, provider: this.name };
      }

      const serviceable = pinInfo.pre_paid === "Y" || pinInfo.cod === "Y";
      const codAvailable = pinInfo.cod === "Y";

      return {
        serviceable,
        codAvailable,
        estimatedDays: undefined, // Delhivery basic API does not return ETA
        carrier: "Delhivery",
        provider: this.name,
      };
    } catch (error) {
      console.error(`[DelhiveryProvider] Unexpected error for PIN ${postalCode}:`, error);
      // Fail open on network errors
      return { serviceable: true, codAvailable: false, provider: this.name };
    }
  }
}
