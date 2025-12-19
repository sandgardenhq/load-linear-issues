"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIssuePattern = buildIssuePattern;
exports.scanCommitsForIssues = scanCommitsForIssues;
function buildIssuePattern(teamKeys) {
    if (teamKeys.length === 0) {
        return /(?!)/; // Never matches
    }
    const keysPattern = teamKeys.join('|');
    return new RegExp(`(${keysPattern})-\\d+`, 'i');
}
function scanCommitsForIssues(commits, teamKeys) {
    if (teamKeys.length === 0) {
        return [];
    }
    const keysPattern = teamKeys.join('|');
    const pattern = new RegExp(`(${keysPattern})-\\d+`, 'gi');
    const issueMap = new Map();
    for (const commit of commits) {
        // Reset lastIndex for global regex
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(commit.message)) !== null) {
            const key = match[0].toUpperCase();
            const existingCommits = issueMap.get(key) || [];
            if (!existingCommits.includes(commit.sha)) {
                issueMap.set(key, [...existingCommits, commit.sha]);
            }
        }
    }
    return Array.from(issueMap.entries())
        .map(([key, commitShas]) => ({
        key,
        commits: commitShas
    }))
        .sort((a, b) => a.key.localeCompare(b.key));
}
//# sourceMappingURL=scanner.js.map