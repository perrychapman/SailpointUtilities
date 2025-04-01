import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";
import Notification from "./Notification";
import { FaTrash, FaEdit, FaSync } from "react-icons/fa";
import "../styles/global.css";
import "../styles/TenantManager.css";

interface Tenant {
    name: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    authenticated: boolean;
    lastAuth?: string;
    lastModified: number; // Timestamp for sorting
}

interface TenantManagerProps {
    setActiveTenant: (tenantId: string | null) => void;
    activeTenant: string | null;
}

const TenantManager: React.FC<TenantManagerProps> = ({ setActiveTenant, activeTenant }) => {
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const showNotification = (message: string, type: "success" | "error") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000); // Auto-close after 5s
    };
    
    const [tenants, setTenants] = useState<Tenant[]>(() => {
        const savedTenants = localStorage.getItem("tenants");
        return savedTenants ? JSON.parse(savedTenants) : [];
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"add" | "edit" | "delete" | "auth" | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [tenantData, setTenantData] = useState<Tenant>({
        name: "",
        tenantId: "",
        clientId: "",
        clientSecret: "",
        authenticated: false,
        lastAuth: "Never",
        lastModified: Date.now()
    });

    useEffect(() => {
        // Function to re-authenticate all previously authenticated tenants
        const reAuthenticateAllTenants = async () => {
            const storedTenants = JSON.parse(localStorage.getItem("tenants") || "[]");
    
            if (!storedTenants.length) {
                return;
            }
    
            console.log("Authenticating all previously authenticated tenants...");
            const updatedTenants = await Promise.all(
                storedTenants.map(async (tenant: Tenant) => {
                    if (tenant.authenticated) {
                        try {
                            const response = await axios.post("http://localhost:3001/authenticate", {
                                tenantId: tenant.tenantId,
                                clientId: tenant.clientId,
                                clientSecret: tenant.clientSecret
                            });
    
                            if (response.data.success) {
                                console.log(`Re-authenticated: ${tenant.tenantId}`);
                                return {
                                    ...tenant,
                                    authenticated: true,
                                    lastAuth: new Date().toLocaleString(),
                                    lastModified: Date.now()
                                };
                            } else {
                                console.warn(`Failed to re-authenticate: ${tenant.tenantId}`);
                                return { ...tenant, authenticated: false };
                            }
                        } catch (error) {
                            console.error(`Error authenticating ${tenant.tenantId}:`, error);
                            return { ...tenant, authenticated: false };
                        }
                    }
                    return tenant;
                })
            );
    
            setTenants(updatedTenants);
            localStorage.setItem("tenants", JSON.stringify(updatedTenants));
        };
    
        // Run authentication only on the initial load
        reAuthenticateAllTenants();
    }, []); // Empty dependency array ensures it runs only on mount  
    
    useEffect(() => {
        localStorage.setItem("tenants", JSON.stringify(tenants));
    }, [tenants]);    

    const openModal = (type: "add" | "edit" | "delete" | "auth", tenant?: Tenant) => {
        setModalType(type);
        setSelectedTenant(tenant || null);
        setTenantData(tenant || {
            name: "",
            tenantId: "",
            clientId: "",
            clientSecret: "",
            authenticated: false,
            lastAuth: "Never",
            lastModified: Date.now()
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
    };

    const addTenant = () => {
        if (!tenantData.name || !tenantData.tenantId || !tenantData.clientId || !tenantData.clientSecret) return;
        setTenants([...tenants, { ...tenantData, authenticated: false, lastAuth: "Never", lastModified: Date.now() }]);
        closeModal();
    };

    const updateTenant = () => {
        if (!selectedTenant) return;
        const updatedTenants = tenants.map(t =>
            t.tenantId === selectedTenant.tenantId ? { ...tenantData, lastModified: Date.now() } : t
        );
        setTenants(updatedTenants);
        closeModal();
    };

    const deleteTenant = () => {
        if (!selectedTenant) return;
        setTenants(tenants.filter(t => t.tenantId !== selectedTenant.tenantId));

        if (selectedTenant.tenantId === activeTenant) {
            setActiveTenant(null);
            localStorage.removeItem("activeTenant");
        }

        closeModal();
    };

    const reAuthenticateTenant = async () => {
        if (!selectedTenant) return;
        try {
            const response = await axios.post("http://localhost:3001/authenticate", {
                tenantId: selectedTenant.tenantId,
                clientId: selectedTenant.clientId,
                clientSecret: selectedTenant.clientSecret
            });

            if (response.data.success) {
                const updatedTenants = tenants.map(t =>
                    t.tenantId === selectedTenant.tenantId
                        ? { ...t, authenticated: true, lastAuth: new Date().toLocaleString(), lastModified: Date.now() }
                        : t
                );
                setTenants(updatedTenants);
                showNotification("Tenant re-authenticated successfully!", "success");
            } else {
                showNotification("Re-authentication failed. Please try again.", "error");
            }
        } catch (error) {
            console.error("Authentication failed", error);
            showNotification("Error: Authentication failed.", "error");
        }
        closeModal();
    };

    const activateTenant = (tenantId: string) => {
        setActiveTenant(tenantId);
        localStorage.setItem("activeTenant", tenantId);
    };

    // Sort tenants by last modified (latest first)
    const sortedTenants = [...tenants].sort((a, b) => b.lastModified - a.lastModified);

    return (
        <div className="tenant-manager-container">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            
            <div className="tenant-manager-header">
                <h2>Tenant Manager</h2>
                <button className="primary-btn" onClick={() => openModal("add")}>Add Tenant</button>
            </div>

            {/* Active Tenant Display */}
            {activeTenant && (
                <div className="active-tenant-section">
                    <h3>Active Tenant</h3>
                    {sortedTenants.map((tenant) => tenant.tenantId === activeTenant && (
                        <div key={tenant.tenantId} className="tenant-item active">
                            <div className="tenant-info">
                                <strong>{tenant.name}</strong> ({tenant.tenantId})
                                <div className={`tenant-status ${tenant.authenticated ? "authenticated" : "error"}`}>
                                    {tenant.authenticated ? "Authenticated" : "Not Authenticated"}
                                </div>
                                <div className="tenant-last-auth">Last Auth: {tenant.lastAuth}</div>
                            </div>
                        </div>
                    ))}
                    <hr />
                </div>
            )}

            {/* Scrollable List of Tenants */}
            <ul className="tenant-list">
                {sortedTenants.map((tenant) => (
                    tenant.tenantId !== activeTenant && (
                        <li key={tenant.tenantId} className="tenant-item">
                            <button className="delete-btn" onClick={() => openModal("delete", tenant)}>
                                <FaTrash />
                            </button>
                            <div className="tenant-info">
                                <strong>{tenant.name}</strong> ({tenant.tenantId})
                                <div className={`tenant-status ${tenant.authenticated ? "authenticated" : "error"}`}>
                                    {tenant.authenticated ? "Authenticated" : "Not Authenticated"}
                                </div>
                                <div className="tenant-last-auth">Last Auth: {tenant.lastAuth}</div>
                            </div>
                            <div className="button-container">
                                <button className="secondary-btn" onClick={() => openModal("edit", tenant)}>
                                    <FaEdit /> Edit
                                </button>
                                <button className="complementary-btn" onClick={() => openModal("auth", tenant)}>
                                    <FaSync /> {tenant.authenticated ? "Re-Auth" : "Auth"}
                                </button>
                                {tenant.authenticated && (
                                    <button className="activate-btn" onClick={() => activateTenant(tenant.tenantId)}>
                                        Activate
                                    </button>
                                )}
                            </div>
                        </li>
                    )
                ))}
            </ul>

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={
                    modalType === "add" ? "Add New Tenant" :
                    modalType === "edit" ? "Edit Tenant" :
                    modalType === "delete" ? "Confirm Deletion" :
                    "Re-Authenticate Tenant"
                }
                actionLabel={
                    modalType === "add" ? "Add Tenant" :
                    modalType === "edit" ? "Save Changes" :
                    modalType === "delete" ? "Confirm" :
                    "Confirm Re-Authentication"
                }
                onAction={
                    modalType === "add" ? addTenant :
                    modalType === "edit" ? updateTenant :
                    modalType === "delete" ? deleteTenant :
                    reAuthenticateTenant
                }
            >
                {(modalType === "add" || modalType === "edit") && (
                    <form>
                        <div className="form-group">
                            <label>Tenant Name</label>
                            <input 
                                type="text" 
                                value={tenantData.name} 
                                onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Tenant ID</label>
                            <input 
                                type="text" 
                                value={tenantData.tenantId} 
                                onChange={(e) => setTenantData({ ...tenantData, tenantId: e.target.value })} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Client ID</label>
                            <input 
                                type="text" 
                                value={tenantData.clientId} 
                                onChange={(e) => setTenantData({ ...tenantData, clientId: e.target.value })} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Client Secret</label>
                            <input 
                                type="password" 
                                value={tenantData.clientSecret} 
                                onChange={(e) => setTenantData({ ...tenantData, clientSecret: e.target.value })} 
                            />
                        </div>
                    </form>
                )}
                {modalType === "delete" && <p>Are you sure you want to delete this tenant?</p>}
                {modalType === "auth" && <p>Do you want to re-authenticate this tenant?</p>}
            </Modal>
        </div>
    );
};

export default TenantManager;
