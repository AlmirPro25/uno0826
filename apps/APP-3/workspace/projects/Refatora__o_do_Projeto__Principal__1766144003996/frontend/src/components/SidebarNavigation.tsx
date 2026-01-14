
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Settings, Wrench, FileText } from "lucide-react";

/**
 * Navigation component for the dashboard sidebar.
 * @param {string} activePath - The currently active path to highlight.
 */
interface SidebarNavigationProps {
  activePath: string;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Mission Control" },
  { href: "/maintenance", icon: Wrench, label: "Maintenance Scheduler" },
  { href: "/reports", icon: FileText, label: "Performance Reports" },
  { href: "/settings", icon: Settings, label: "System Settings" },
];

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ activePath }) => {
  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = activePath === item.href;
        return (
          <motion.div
            key={item.href}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={item.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
};

export default SidebarNavigation;
