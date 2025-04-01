import React from "react";
import "../styles/global.css";
import "../styles/TenantManager.css";
interface TenantManagerProps {
    setActiveTenant: (tenantId: string | null) => void;
    activeTenant: string | null;
}
declare const TenantManager: React.FC<TenantManagerProps>;
export default TenantManager;
