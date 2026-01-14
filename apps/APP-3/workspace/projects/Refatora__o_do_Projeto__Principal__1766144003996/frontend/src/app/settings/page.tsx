
"use client";

import SidebarNavigation from "@/components/SidebarNavigation";
import { motion } from "framer-motion";
import { Settings, User, Server, AlertTriangle, Cpu, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AgvOperationalStatus } from "@/types/agv";

/**
 *
