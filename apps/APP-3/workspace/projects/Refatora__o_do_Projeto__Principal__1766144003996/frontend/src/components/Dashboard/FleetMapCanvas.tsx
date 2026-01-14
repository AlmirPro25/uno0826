
import React, { useRef, useEffect, useCallback } from "react";
import { useFleetStore } from "@/store/fleetStore";
import { AgvStatus, AgvOperationalStatus } from "@/types/agv";
import { motion } from "framer-motion";

/**
 *
