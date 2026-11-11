import { AvailabilityStoreProvider } from "@/features/availability/useAvailability";

/**
 * Shared by the results (/stays) and every property page (/stays/[property]). It holds one
 * thing: the last availability answer, so moving between the two for the same stay never
 * asks the provider twice. It renders nothing of its own.
 */
export default function StaysLayout({ children }: { children: React.ReactNode }) {
  return <AvailabilityStoreProvider>{children}</AvailabilityStoreProvider>;
}
