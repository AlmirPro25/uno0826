
"use client";

import { useFleetStore } from "@/store/fleetStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wrench, Battery, Thermometer, Gauge, Clock, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import AgvCommandPanel from "./AgvCommandPanel";
import AgvHistoryChart from "./AgvHistoryChart";
import { AgvOperationalStatus } from "@/types/agv";
import { useAgvDetails } from "@/hooks/useAgvDetails"; // Import new metadata hook
import { useCallback } from "react";

interface AgvDetailsPanelProps {
  agvId: string | null;
}

/**
 *
