import type { ServiceabilityProvider, ServiceabilityResult } from "../types";

/**
 * BlueDart real-time serviceability provider.
 *
 * Activation: set SERVICEABILITY_PROVIDER=bluedart in environment variables.
 * Required env: BLUEDART_API_KEY, BLUEDART_LICENSE_KEY, BLUEDART_LOGIN_ID
 *
 * BlueDart SMCS API docs:
 * https://www.bluedart.com/api-documentation
 *
 * BlueDart supports SOAP and REST. This implementation uses the REST Pincode
 * serviceability endpoint.
 */
export class BlueDartProvider implements ServiceabilityProvider {
  readonly name = "bluedart";

  private readonly apiKey: string;
  private readonly licenseKey: string;
  private readonly loginId: string;
  private readonly baseUrl = "https://apigateway.bluedart.com/in/transportation/location/v1";

  constructor() {
    const apiKey = process.env.BLUEDART_API_KEY;
    const licenseKey = process.env.BLUEDART_LICENSE_KEY;
    const loginId = process.env.BLUEDART_LOGIN_ID;

    if (!apiKey || !licenseKey || !loginId) {
      throw new Error(
        "[BlueDartProvider] BLUEDART_API_KEY, BLUEDART_LICENSE_KEY, and BLUEDART_LOGIN_ID " +
          "environment variables are required. " +
          "Set SERVICEABILITY_PROVIDER=static to use the built-in PIN list instead."
      );
    }

    this.apiKey = apiKey;
    this.licenseKey = licenseKey;
    this.loginId = loginId;
  }

  async checkCOD(postalCode: string): Promise<ServiceabilityResult> {
    try {
      const pin = postalCode.trim();
      const url = `${this.baseUrl}/pincode/json/getpincodeservicability`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinCode: pin,
          licKey: this.licenseKey,
          loginId: this.loginId,
          type: "A", // All products
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(`[BlueDartProvider] API error ${response.status} for PIN ${pin}`);
        return { serviceable: true, codAvailable: false, provider: this.name };
      }

      const data = await response.json();
      const result = data?.GetPincodeServiceabilityResult;

      if (!result) {
        return { serviceable: false, codAvailable: false, provider: this.name };
      }

      // BlueDart returns IsActive for general serviceability
      // COD availability is per product type — check if any COD product is available
      const serviceable = result.IsActive === true;
      const codAvailable =
        serviceable &&
        Array.isArray(result.AvailableProducts) &&
        result.AvailableProducts.some((p: any) => p?.IsCOD === true);

      return {
        serviceable,
        codAvailable,
        carrier: "BlueDart",
        provider: this.name,
      };
    } catch (error) {
      console.error(`[BlueDartProvider] Unexpected error for PIN ${postalCode}:`, error);
      return { serviceable: true, codAvailable: false, provider: this.name };
    }
  }
}
