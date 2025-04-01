import React, { useState, useEffect } from "react";
import axios from "axios";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";
import { FaTimes, FaSync, FaSpinner, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import { parseTransform, TransformConfig } from "../utils/TransformParser";
import Notification from "./Notification";
import "../styles/global.css";
import "../styles/Transforms.css";

interface Transform {
    id: string;
    name: string;
    type: string;
    description?: string;
    attributes?: object;
}

interface TransformsProps {
    activeTenant: string | null;
}

const Transforms: React.FC<TransformsProps> = ({ activeTenant }) => {
    const [transforms, setTransforms] = useState<Transform[]>([]);
    const [selectedTransform, setSelectedTransform] = useState<Transform | null>(null);
    const [parsedTransform, setParsedTransform] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: "success" | "error" | "info" } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortKey, setSortKey] = useState<"name" | "type">("name");
    const [sortAsc, setSortAsc] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");

    const showNotification = (message: string, type: "success" | "error" | "info") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    useEffect(() => {
        if (activeTenant) {
            fetchTransforms(activeTenant);
        }
    }, [activeTenant]);

    const fetchTransforms = async (tenantId: string) => {
        setLoading(true);

        try {
            const response = await axios.get(`http://localhost:3001/transforms/${tenantId}`);
            if (response.status !== 200) {
                throw new Error("Failed to fetch transforms.");
            }

            const data = response.data;
            showNotification("Transforms loaded successfully!", "success");
            setTransforms(data);
            cacheTransforms(tenantId, data);
        } catch (error: any) {
            console.error("Error fetching transforms:", error.response?.data || error.message);
            showNotification(`Error: ${error.response?.data?.error || error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const cacheTransforms = (tenantId: string, data: Transform[]) => {
        localStorage.setItem(`transforms_${tenantId}`, JSON.stringify(data));
    };

    useEffect(() => {
        if (activeTenant) {
            const cachedData = localStorage.getItem(`transforms_${activeTenant}`);
            if (cachedData) {
                setTransforms(JSON.parse(cachedData));
            }
        }
    }, [activeTenant]);

    useEffect(() => {
        if (selectedTransform) {
            const parsed = parseTransform(selectedTransform as TransformConfig);
            setParsedTransform(parsed.parsed_notation || "No transform notation available");
            setTimeout(() => Prism.highlightAll(), 100);
        }
    }, [selectedTransform]);

    const clearFilters = () => {
        setSearchTerm("");
        setTypeFilter("");
        setSortKey("name");
        setSortAsc(true);
    };

    const handleSort = (key: "name" | "type") => {
        if (sortKey === key) {
            setSortAsc(!sortAsc); // toggle
        } else {
            setSortKey(key);
            setSortAsc(true); // default to ascending
        }
    };

    const filteredSortedTransforms = transforms
        .filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (typeFilter === "" || t.type === typeFilter)
        )
        .sort((a, b) => {
            const result = a[sortKey].localeCompare(b[sortKey]);
            return sortAsc ? result : -result;
        });

    const uniqueTypes = Array.from(new Set(transforms.map((t) => t.type)));

    const renderSortIcon = (key: "name" | "type") => {
        if (sortKey !== key) return null;
        return sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />;
    };

    return (
        <div className="transforms-container">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="transforms-list">
                <div className="transforms-list-header">
                    <h3>Transforms</h3>
                    <div className="transforms-actions">
                        {loading && <FaSpinner className="loading-icon" />}
                        <button className="primary-btn" onClick={() => fetchTransforms(activeTenant as string)}>
                            <FaSync /> Refresh
                        </button>
                    </div>
                </div>

                <div className="transform-filters">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">All Types</option>
                        {uniqueTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                    <button className="clear-btn" onClick={clearFilters} title="Clear Filters">
                        <FaTimes />
                    </button>

                </div>

                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                                    Name {renderSortIcon("name")}
                                </th>
                                <th onClick={() => handleSort("type")} style={{ cursor: "pointer" }}>
                                    Type {renderSortIcon("type")}
                                </th>
                                {/*<th>Actions</th>*/}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSortedTransforms.map((transform) => (
                                <tr
                                    key={transform.id}
                                    className={selectedTransform?.id === transform.id ? "selected" : ""}
                                    onClick={() => setSelectedTransform(transform)}
                                >
                                    <td>{transform.name}</td>
                                    <td>{transform.type}</td>
                                    {/* <td>
                                        <button
                                            className="complementary-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/transform/${activeTenant}/${transform.id}`);
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="transform-details">
                <h3>Transform Details</h3>

                {selectedTransform ? (
                    <>
                        <div className="parsed-transform-panel">
                            <h4>Parsed Notation</h4>
                            <div className="parsed-notation-container">
                                <pre
                                    className="parsed-notation"
                                    dangerouslySetInnerHTML={{
                                        __html: parsedTransform || "No configuration available for this transform.",
                                    }}
                                />
                            </div>
                        </div>

                        <div className="json-transform-panel">
                            <h4>Raw JSON</h4>
                            <div className="json-display-container">
                                <pre className="json-display">
                                    <code className="language-json">
                                        {JSON.stringify(selectedTransform, null, 2)}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="no-selection">Select a transform to view details</p>
                )}
            </div>
        </div>
    );
};

export default Transforms;
