import React from "react";
import "../styles/global.css";
import "../styles/Sidebar.css";
interface SidebarProps {
    activeTenant: string | null;
    setActiveTenant: (tenantId: string | null) => void;
    activeSection: "tenants" | "transforms";
    setActiveSection: React.Dispatch<React.SetStateAction<"tenants" | "transforms">>;
}
declare const Sidebar: React.FC<SidebarProps>;
export default Sidebar;
