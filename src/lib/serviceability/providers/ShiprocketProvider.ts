import type { ServiceabilityProvider, ServiceabilityResult } from "../types";

/**
 * Shiprocket real-time serviceability provider.
 *
 * Activation: set SERVICEABILITY_PROVIDER=shiprocket in environment variables.
 * Required env: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD
 *
 * Shiprocket Serviceability API docs:
 * https://apidocs.shiprocket.in/#serviceability-api
 *
 * Note: Shiprocket uses a Bearer token that must be refreshed. This implementation
 * caches the token in module scope to avoid re-authenticating on every request.
 * Token TTL is 24 hours (Shiprocket default).
 */
export class ShiprocketProvider implements ServiceabilityProvider {
  readonly name = "shiprocket";

  private readonly email: string;
  private readonly password: string;
  private readonly baseUrl = "https://apiv2.shiprocket.in/v1/external";

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "[ShiprocketProvider] SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables are required. " +
          "Set SERVICEABILITY_PROVIDER=static to use the built-in PIN list instead."
      );
    }
    this.email = email;
    this.password = password;
  }

  private async getToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) {
      return this.cachedToken;
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`[ShiprocketProvider] Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    this.cachedToken = data.token;
    // Token valid for 24 hours from now
    this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    return this.cachedToken!;
  }

  async checkCOD(postalCode: string): Promise<ServiceabilityResult> {
    try {
      const token = await this.getToken();
      const pin = postalCode.trim();

      // Shiprocket serviceability check requires pickup + delivery PIN + weight
      // Using a fixed reference pickup PIN (warehouse) and minimal weight for COD check
      const pickupPin = process.env.SHIPROCKET_WAREHOUSE_PIN ?? "110001";
      const url = `${this.baseUrl}/courier/serviceability/?pickup_postcode=${pickupPin}&delivery_postcode=${pin}&cod=1&weight=0.5`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(`[ShiprocketProvider] API error ${response.status} for PIN ${pin}`);
        return { serviceable: true, codAvailable: false, provider: this.name };
      }

      const data = await response.json();
      const couriers = data?.data?.available_courier_companies ?? [];
      const codCouriers = couriers.filter((c: any) => c.cod === 1);

      return {
        serviceable: couriers.length > 0,
        codAvailable: codCouriers.length > 0,
        estimatedDays: codCouriers[0]?.estimated_delivery_days,
        carrier: codCouriers[0]?.courier_name,
        provider: this.name,
      };
    } catch (error) {
      console.error(`[ShiprocketProvider] Unexpected error for PIN ${postalCode}:`, error);
      return { serviceable: true, codAvailable: false, provider: this.name };
    }
  }
}
