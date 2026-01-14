
import React, { useState } from "react";
import { AgvHistoryItemResponse } from "@/shared/types/api"; // Updated import path
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAgvHistory } from "@/hooks/useAgvHistory"; // Import new data fetching hook

interface AgvHistoryChartProps {
  agvId: string;
}

/**
 *
