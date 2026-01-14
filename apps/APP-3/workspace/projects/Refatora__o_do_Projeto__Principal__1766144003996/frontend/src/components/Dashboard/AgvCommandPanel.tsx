
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AgvCommandRequestPayload, AgvCommandRequestSchema } from "@/shared/types/api"; // Updated import path and type
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { SendHorizonal, AlertTriangle, Play, Loader2, Wrench } from "lucide-react";
import { useState } from "react";
import { sendAgvCommand } from "@/services/api/agvService"; // Import new API client function

//
