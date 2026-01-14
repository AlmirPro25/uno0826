
import { AgvStatus, AgvOperationalStatus } from "@/types/agv";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Wrench, CircleHelp } from "lucide-react";
import { useFleetStore } from "@/store/fleetStore";

interface StatusPanelProps {
  agvs: AgvStatus[];
}

/**
 * Displays a list of AGVs in alert status.
 * Allows clicking on an AGV to view details in the right sidebar.
 * @param {object[]} agvs - List of AGV status objects filtered by alert state.
 */
const StatusPanel: React.FC<StatusPanelProps> = ({ agvs }) => {
  const setSelectedAgvId = useFleetStore((state) => state.setSelectedAgvId);

  // ARIA live region (Priority 4) to announce critical changes to screen readers
  return (
    <div className="rounded-lg bg-card shadow-lg p-4 h-full overflow-y-auto" role="status" aria-live="polite">
      {agvs.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">All AGVs operational. No alerts.</p>
      ) : (
        agvs.map((agv) => (
          <div
            key={agv.robotId}
            onClick={() => setSelectedAgvId(agv.robotId)}
            className="p-3 mb-2 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-muted"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{agv.metadata.serialNumber}</span>
              <Badge
                className={`text-xs ${
                  agv.status === AgvOperationalStatus.PREDICTIVE_MAINTENANCE ? "bg-red-500 hover:bg-red-600" : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                {agv.status === AgvOperationalStatus.PREDICTIVE_MAINTENANCE ? (
                  <>
                    <Wrench className="h-3 w-3 mr-1" /> Predictive Maintenance
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" /> Warning
                  </>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vibration: {agv.telemetry.motorVibrationMS2.toFixed(2)} m/s²</p>
            <Separator className="mt-2" />
          </div>
        ))
      )}
    </div>
  );
};

export default StatusPanel;
