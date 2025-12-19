"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommits = fetchCommits;
// src/git.ts
const exec = __importStar(require("@actions/exec"));
const GIT_FORMAT = '%H%x00%s%x00';
function parseGitOutput(output) {
    if (!output.trim()) {
        return [];
    }
    const parts = output.split('\x00').filter(p => p.trim());
    const commits = [];
    for (let i = 0; i < parts.length; i += 2) {
        const sha = parts[i]?.trim();
        const message = parts[i + 1]?.trim();
        if (sha && message) {
            commits.push({ sha, message });
        }
    }
    return commits;
}
async function runGitLog(args) {
    let stdout = '';
    let stderr = '';
    const exitCode = await exec.exec('git', ['log', `--format=${GIT_FORMAT}`, ...args], {
        listeners: {
            stdout: (data) => {
                stdout += data.toString();
            },
            stderr: (data) => {
                stderr += data.toString();
            }
        },
        silent: true
    });
    if (exitCode !== 0) {
        throw new Error(`Git error: ${stderr}`);
    }
    return parseGitOutput(stdout);
}
async function fetchCommits(changeset) {
    switch (changeset.type) {
        case 'commits-count':
            return runGitLog(['-n', String(changeset.commitsCount)]);
        case 'commits-since-sha':
            return runGitLog([`${changeset.commitsSinceSha}..HEAD`]);
        case 'commits-shas':
            // For specific SHAs, we need to get each commit individually
            const commits = [];
            for (const sha of changeset.commitsShas || []) {
                const result = await runGitLog(['-n', '1', sha]);
                if (result.length > 0) {
                    commits.push(result[0]);
                }
            }
            return commits;
        case 'commits-range':
            const startRef = changeset.includeStartCommit
                ? `${changeset.commitsStartSha}^`
                : changeset.commitsStartSha;
            return runGitLog([`${startRef}..${changeset.commitsEndSha || 'HEAD'}`]);
        case 'time-range':
            return runGitLog([
                `--since=${changeset.timeRangeStart}`,
                `--until=${changeset.timeRangeEnd}`
            ]);
        case 'releases-count':
            // Get the last N release tags and commits between them
            const tagsOutput = await exec.getExecOutput('git', [
                'tag',
                '--sort=-creatordate',
                '-l',
                'v*',
                '-n',
                String(changeset.releasesCount || 1)
            ]);
            const tags = tagsOutput.stdout.trim().split('\n').filter(t => t);
            if (tags.length === 0) {
                return [];
            }
            const oldestTag = tags[tags.length - 1];
            return runGitLog([`${oldestTag}..HEAD`]);
        case 'tags-range':
            return runGitLog([`${changeset.tagsStart}..${changeset.tagsEnd || 'HEAD'}`]);
        default:
            throw new Error(`Unknown changeset type: ${changeset.type}`);
    }
}
//# sourceMappingURL=git.js.map