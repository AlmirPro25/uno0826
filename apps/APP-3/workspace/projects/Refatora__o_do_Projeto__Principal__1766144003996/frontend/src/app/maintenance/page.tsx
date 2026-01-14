
"use client";

import SidebarNavigation from "@/components/SidebarNavigation";
import { motion } from "framer-motion";
import { Wrench, Settings, Search, Clock, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useFleetStore } from "@/store/fleetStore";
import { AgvOperationalStatus } from "@/types/agv";
import { Input } from "@/components/ui/input";
import { useState } from "react";

/**
 *
