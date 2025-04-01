import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import "../styles/Sidebar.css";
import logo from "../assets/sailpoint-logo.png";

interface SidebarProps {
    activeTenant: string | null;
    setActiveTenant: (tenantId: string | null) => void;
    activeSection: "tenants" | "transforms" | "transformbuilder";
    setActiveSection: React.Dispatch<React.SetStateAction<"tenants" | "transforms" | "transformbuilder">>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTenant, activeSection, setActiveSection }) => {
    const navigate = useNavigate();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>SailPoint Utilities</h2>
                <img src={logo} alt="SailPoint Logo" className="sailpoint-logo" />
            </div>

            {/* Active Tenant Display */}
            {activeTenant && (
                <div className="active-tenant-card">
                    <p>{activeTenant}</p>
                </div>
            )}

            {/* Navigation Links */}
            <nav className="sidebar-nav">
                <button
                    className={`sidebar-btn ${activeSection === "tenants" ? "active" : ""}`}
                    onClick={() => {
                        setActiveSection("tenants");
                        navigate("/"); // Navigate to Tenants page
                    }}
                >
                    Tenants
                </button>
                <button
                    className={`sidebar-btn ${activeSection === "transforms" ? "active" : ""}`}
                    onClick={() => {
                        setActiveSection("transforms");
                        navigate("/transforms"); // Navigate to Transforms page
                    }}
                >
                    Transforms
                </button>
                <button
                    className={`sidebar-btn ${activeSection === "transformbuilder" ? "active" : ""}`}
                    onClick={() => {
                        setActiveSection("transformbuilder");
                        navigate("/transformbuilder");
                    }}
                >
                    Transform Builder
                </button>

            </nav>
        </div>
    );
};

export default Sidebar;
