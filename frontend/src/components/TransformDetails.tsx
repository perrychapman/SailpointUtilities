import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";
import { parseTransform, TransformConfig } from "../utils/TransformParser";
import "../styles/global.css";
import "../styles/TransformDetails.css";

interface Transform {
    id: string;
    name: string;
    type: string;
    description?: string;
    attributes?: Record<string, any>;
}

const TransformDetails: React.FC = () => {
    const { tenantId, transformId } = useParams<{ tenantId: string; transformId: string }>();
    const navigate = useNavigate();
    const [transform, setTransform] = useState<Transform | null>(null);
    const [parsedTransform, setParsedTransform] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransform = async () => {
            console.log(`Fetching transform ${transformId} for tenant ${tenantId}`);

            try {
                const response = await axios.get(`http://localhost:3001/transform/${tenantId}/${transformId}`);
                console.log("API Response:", response.data);

                if (response.status !== 200 || !response.data) throw new Error("Transform not found.");

                setTransform(response.data);
                const parsed = parseTransform(response.data as TransformConfig);
                setParsedTransform(parsed.parsed_notation ?? null);

            } catch (error: any) {
                console.error("Error fetching transform:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTransform();
    }, [tenantId, transformId]);

    useEffect(() => {
        Prism.highlightAll();
    }, [transform]);

    if (loading) return <p>Loading transform details...</p>;
    if (!transform) return <p>Transform not found.</p>;

    return (
        <div className="content">
            <div className="transform-details-container">
                <div className="transform-header">
                    <h2>{transform.name} ({transform.type})</h2>
                    <button onClick={() => navigate(-1)} className="transform-back-btn">← Back</button>
                </div>

                <div className="transform-details-grid">
                    
                    {/* Primary Section */}
                    <div className="primary-section">
                        <h4>Transform Overview</h4>
                        <p>{transform.description || "No description available."}</p>
                    </div>

                    {/* Secondary Sections */}
                    <div className="secondary-section inputs-panel">
                        <h4>Inputs</h4>
                        <ul>
                            {(transform.attributes?.inputs as any[])?.map((input: any, index: number) => (
                                <li key={index}>{input.type === "SOURCE" ? `Field: ${input.name}` : `Transform Reference: ${input.name}`}</li>
                            )) || <p>No inputs defined.</p>}
                        </ul>
                    </div>

                    <div className="secondary-section output-panel">
                        <h4>Output Preview</h4>
                        <p className="output-preview">(Coming Soon)</p>
                    </div>

                    {/* Tertiary Sections */}
                    <div className="tertiary-section parsed-notation-panel">
                        <h4>Parsed Transform</h4>
                        <pre className="parsed-notation">{parsedTransform || "No parsed representation available."}</pre>
                    </div>

                    <div className="tertiary-section json-panel">
                        <h4>Raw JSON</h4>
                        <pre className="json-display"><code className="language-json">{JSON.stringify(transform, null, 2)}</code></pre>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TransformDetails;
