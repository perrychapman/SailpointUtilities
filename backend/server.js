const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

console.log("Backend starting...");

// In-memory storage for tenant authentication tokens
const tenantTokens = {};

// Function to get or refresh an access token
async function getAccessToken(tenantId, clientId, clientSecret) {
    const tokenUrl = `https://${tenantId}.api.identitynow.com/oauth/token`;

    try {
        const response = await axios.post(
            tokenUrl,
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: clientId,
                client_secret: clientSecret,
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        tenantTokens[tenantId] = {
            accessToken: response.data.access_token,
            expiresAt: Date.now() + response.data.expires_in * 1000,
            clientId,
            clientSecret
        };

        console.log(`New token acquired for tenant: ${tenantId}`);
        return response.data.access_token;
    } catch (error) {
        console.error(`Failed to authenticate tenant ${tenantId}:`, error.response?.data || error.message);
        return null;
    }
}

// Function to authenticate all stored tenants on app start
async function authenticateAllTenantsOnStart() {
    console.log("Authenticating all stored tenants...");

    const storedTenants = getStoredTenants();

    if (!storedTenants || storedTenants.length === 0) {
        console.log("No stored tenants found to authenticate.");
        return;
    }

    for (const tenant of storedTenants) {
        if (tenant.authenticated) {
            console.log(`Authenticating tenant: ${tenant.tenantId}`);
            await getAccessToken(tenant.tenantId, tenant.clientId, tenant.clientSecret);
        }
    }
}

// Function to retrieve stored tenants
function getStoredTenants() {
    try {
        const fs = require("fs");
        const path = require("path");
        const tenantsPath = path.join(__dirname, 'tenants.json');

        if (fs.existsSync(tenantsPath)) {
            const data = fs.readFileSync(tenantsPath, "utf8");
            return JSON.parse(data);
        }

        return [];
    } catch (error) {
        console.error("Error reading stored tenants:", error.message);
        return [];
    }
}

// Middleware to ensure authentication
async function ensureAuthenticated(req, res, next) {
    const { tenantId } = req.params;
    const tokenData = tenantTokens[tenantId];

    if (!tokenData || Date.now() >= tokenData.expiresAt) {
        return res.status(401).json({ error: "Unauthorized - Token expired, re-authentication required." });
    }

    req.accessToken = tokenData.accessToken;
    next();
}

// Route: Manually authenticate a tenant
app.post("/authenticate", async (req, res) => {
    const { tenantId, clientId, clientSecret } = req.body;

    if (!tenantId || !clientId || !clientSecret) {
        return res.status(400).json({ success: false, error: "Missing required parameters" });
    }

    try {
        const accessToken = await getAccessToken(tenantId, clientId, clientSecret);

        if (accessToken) {
            res.json({ success: true, accessToken });
        } else {
            res.status(401).json({ success: false, error: "Authentication failed" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Route: Fetch transforms for a given tenant
app.get("/transforms/:tenantId", ensureAuthenticated, async (req, res) => {
    const { tenantId } = req.params;

    console.log(`Fetching transforms for tenant: ${tenantId}`);

    try {
        const apiUrl = `https://${tenantId}.api.identitynow.com/beta/transforms`;
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${req.accessToken}`,
                Accept: "application/json"
            }
        });

        console.log(`Successfully fetched transforms for tenant: ${tenantId}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching transforms for ${tenantId}:`, error.message);

        if (error.response) {
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response Headers:", error.response.headers);
            console.error("Status Code:", error.response.status);
        }

        res.status(500).json({
            error: "Failed to fetch transforms",
            details: error.response?.data || error.message
        });
    }
});

// Route: Fetch a specific transform by ID
app.get("/transform/:tenantId/:transformId", ensureAuthenticated, async (req, res) => {
    const { tenantId, transformId } = req.params;

    console.log(`Fetching transform ${transformId} for tenant: ${tenantId}`);

    try {
        const apiUrl = `https://${tenantId}.api.identitynow.com/beta/transforms/${transformId}`;
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${req.accessToken}`,
                Accept: "application/json"
            }
        });

        console.log(`Successfully fetched transform ${transformId}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching transform ${transformId}:`, error.message);

        if (error.response) {
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response Headers:", error.response.headers);
            console.error("Status Code:", error.response.status);
        }

        res.status(500).json({
            error: "Failed to fetch transform",
            details: error.response?.data || error.message
        });
    }
});


// Start the Express server and authenticate all tenants
try {
    app.listen(PORT, async () => {
        console.log(`Backend running on http://localhost:${PORT}`);
        await authenticateAllTenantsOnStart();
    });
} catch (err) {
    console.error("Failed to start backend:", err);
}

