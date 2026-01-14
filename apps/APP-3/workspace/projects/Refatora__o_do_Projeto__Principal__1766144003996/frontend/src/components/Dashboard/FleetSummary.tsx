
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryCharging, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { AgvOperationalStatus } from "@/types/agv";

interface FleetSummaryProps {
  summary: {
    total: number;
    operational: number;
    warning: number;
    maintenance: number;
    offline: number;
  };
}

/**
 * Displays a summary of the AGV fleet status.
 * Uses Shadcn/UI cards and colors to reflect status (Priority 4: high contrast/WCAG).
 * @param {object} summary - The fleet status summary data.
 */
const FleetSummary: React.FC<FleetSummaryProps> = ({ summary }) => {
  const { total, operational, warning, maintenance, offline } = summary;

  // Calculate percentages for visualization
  const operationalPercent = total > 0 ? (operational / total) * 100 : 0;
  const maintenancePercent = total > 0 ? (maintenance / total) * 100 : 0;
  const warningPercent = total > 0 ? (warning / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total AGVs</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-l-4 border-status-operational">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-status-operational">Operational</CardTitle>
            <CheckCircle className="h-4 w-4 text-status-operational" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{operational}</div>
            <p className="text-xs text-muted-foreground">{operationalPercent.toFixed(1)}% of fleet</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-status-maintenance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-status-maintenance">Maintenance</CardTitle>
            <BatteryCharging className="h-4 w-4 text-status-maintenance" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{maintenance}</div>
            <p className="text-xs text-muted-foreground">{maintenancePercent.toFixed(1)}% of fleet</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-status-warning">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-status-warning">Warning (Heuristic Alert)</CardTitle>
          <AlertTriangle className="h-4 w-4 text-status-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{warning}</div>
          <p className="text-xs text-muted-foreground">{warningPercent.toFixed(1)}% of fleet</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-status-offline">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-status-offline">Offline</CardTitle>
          <Clock className="h-4 w-4 text-status-offline" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{offline}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetSummary;
