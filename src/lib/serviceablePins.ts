/**
 * @deprecated
 * This file is no longer the canonical source for PIN serviceability.
 *
 * PIN data has moved to: src/data/serviceablePins.json
 * Provider logic lives in: src/lib/serviceability/
 *
 * Use the factory instead:
 *   import { getServiceabilityProvider } from "@/lib/serviceability";
 *   const provider = getServiceabilityProvider();
 *   const result = await provider.checkCOD(postalCode);
 *
 * This file is kept only to prevent import errors during migration.
 * It will be removed in the next cleanup pass.
 */

export { getServiceabilityProvider } from "./serviceability";
