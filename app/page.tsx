import { TelemetryProvider } from "@/components/TelemetryProvider";
import { DashboardShell } from "@/components/DashboardShell";

export default function Home() {
  return (
    <TelemetryProvider>
      <DashboardShell />
    </TelemetryProvider>
  );
}
