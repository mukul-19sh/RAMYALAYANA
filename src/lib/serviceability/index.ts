/**
 * Serviceability Provider Factory
 *
 * The COD eligibility route imports only this file — never a concrete provider.
 * Switch providers by setting the SERVICEABILITY_PROVIDER environment variable:
 *
 *   SERVICEABILITY_PROVIDER=static      # Default. Uses src/data/serviceablePins.json
 *   SERVICEABILITY_PROVIDER=delhivery   # Requires DELHIVERY_API_KEY
 *   SERVICEABILITY_PROVIDER=shiprocket  # Requires SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD
 *   SERVICEABILITY_PROVIDER=bluedart    # Requires BLUEDART_API_KEY + BLUEDART_LICENSE_KEY + BLUEDART_LOGIN_ID
 *
 * No checkout logic changes are needed when switching providers.
 */

export type { ServiceabilityProvider, ServiceabilityResult, ProviderName } from "./types";

import type { ServiceabilityProvider, ProviderName } from "./types";
import { StaticPinProvider } from "./providers/StaticPinProvider";

// Singleton — constructed once per process lifetime
let _provider: ServiceabilityProvider | null = null;

/**
 * Returns the active serviceability provider singleton.
 * Provider is determined by the SERVICEABILITY_PROVIDER environment variable.
 * Defaults to "static" if not set.
 */
export function getServiceabilityProvider(): ServiceabilityProvider {
  if (_provider) return _provider;

  const name = (process.env.SERVICEABILITY_PROVIDER ?? "static") as ProviderName;

  switch (name) {
    case "delhivery": {
      // Dynamic import to avoid loading unused API credentials at startup
      const { DelhiveryProvider } = require("./providers/DelhiveryProvider");
      _provider = new DelhiveryProvider();
      break;
    }
    case "shiprocket": {
      const { ShiprocketProvider } = require("./providers/ShiprocketProvider");
      _provider = new ShiprocketProvider();
      break;
    }
    case "bluedart": {
      const { BlueDartProvider } = require("./providers/BlueDartProvider");
      _provider = new BlueDartProvider();
      break;
    }
    case "static":
    default: {
      _provider = new StaticPinProvider();
      break;
    }
  }

  console.info(`[Serviceability] Active provider: ${_provider!.name}`);
  return _provider!;
}

/**
 * Reset the provider singleton — useful in tests to inject mock providers.
 * @example
 * resetServiceabilityProvider();
 * process.env.SERVICEABILITY_PROVIDER = "static";
 */
export function resetServiceabilityProvider(): void {
  _provider = null;
}
