import { useManagerDashboard } from "../components/manager-dashboard/useManagerDashboard";
import { ManagerDashboardView } from "../components/manager-dashboard/ManagerDashboardView";

export function ManagerDashboard() {
  const dashboard = useManagerDashboard();

  return <ManagerDashboardView {...dashboard} />;
}
