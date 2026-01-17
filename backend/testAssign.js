const axios = require('axios');

async function testAssignment() {
    const baseUrl = 'http://localhost:5000/api';
    // Admin login
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: "admin@dizy.com",
            motDePasse: "admin123"
        });
        const token = loginRes.data.token;
        console.log("Admin logged in. Token acquired.");

        // Fetch Clients
        console.log("Fetching clients...");
        const clientsRes = await axios.get(`${baseUrl}/users?role=client`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const client = clientsRes.data[0]; // Get first client
        if (!client) {
            console.log("No clients found to test.");
            return;
        }
        console.log(`Target Client: ${client.email} (ID: ${client._id})`);
        console.log(`Current Matricule: '${client.matriculeFiscale}'`);
        console.log(`Current Entreprise: '${client.entreprise}'`);

        // Fetch Agents
        console.log("Fetching agents...");
        const agentsRes = await axios.get(`${baseUrl}/users?role=agent`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const agent = agentsRes.data[0];
        if (!agent) {
            console.log("No agents found to test.");
            return;
        }
        console.log(`Target Agent: ${agent.email} (ID: ${agent._id})`);

        // Assign Agent
        console.log("Assigning Agent to Client...");
        await axios.put(`${baseUrl}/users/${client._id}`, {
            agentPrincipal: agent._id,
            matriculeFiscale: client.matriculeFiscale // sending existing value back
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Assignment Successful (Status 200)");

        // Unassign Agent (Simulate selecting "None" -> "")
        console.log("Unassigning Agent (sending empty string)...");
        await axios.put(`${baseUrl}/users/${client._id}`, {
            agentPrincipal: ""
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Unassignment Successful (Status 200)");

    } catch (error) {
        console.error("TEST FAILED:", error.response ? error.response.data : error.message);
    }
}

testAssignment();
