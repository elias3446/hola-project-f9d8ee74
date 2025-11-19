import { useRealTimeTracking } from "@/hooks/useRealTimeTracking";

export const RealTimeTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  // This hook will automatically manage tracking in the background
  useRealTimeTracking();

  return <>{children}</>;
};
