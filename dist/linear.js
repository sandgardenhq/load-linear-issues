"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinearClient = createLinearClient;
exports.fetchTeamKeys = fetchTeamKeys;
exports.buildIssueUrl = buildIssueUrl;
// src/linear.ts
const sdk_1 = require("@linear/sdk");
function createLinearClient(apiKey) {
    return new sdk_1.LinearClient({ apiKey });
}
async function fetchTeamKeys(client, filterKeys) {
    try {
        const teams = await client.teams();
        const allKeys = teams.nodes.map(team => team.key);
        if (!filterKeys || filterKeys.length === 0) {
            return allKeys;
        }
        const filterKeysUpper = filterKeys.map(k => k.toUpperCase());
        return allKeys.filter(key => filterKeysUpper.includes(key.toUpperCase()));
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Linear API error: ${error.message}`);
        }
        throw new Error('Linear API error: Unknown error');
    }
}
function buildIssueUrl(workspaceSlug, issueKey) {
    if (workspaceSlug) {
        return `https://linear.app/${workspaceSlug}/issue/${issueKey}`;
    }
    return `https://linear.app/issue/${issueKey}`;
}
//# sourceMappingURL=linear.js.map