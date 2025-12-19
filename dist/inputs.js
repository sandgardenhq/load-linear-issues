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
exports.validateChangeset = validateChangeset;
exports.parseInputs = parseInputs;
// src/inputs.ts
const core = __importStar(require("@actions/core"));
function validateChangeset(raw) {
    const changesetTypes = [
        { key: 'releases-count', type: 'releases-count' },
        { key: 'commits-count', type: 'commits-count' },
        { key: 'commits-since-sha', type: 'commits-since-sha' },
        { key: 'commits-shas', type: 'commits-shas' },
        { key: 'commits-start-sha', type: 'commits-range' },
        { key: 'tags-start', type: 'tags-range' }
    ];
    // Check for time-range (needs both start and end)
    const hasTimeRange = raw['time-range-start'] && raw['time-range-end'];
    const specifiedTypes = changesetTypes.filter(({ key }) => raw[key]);
    const totalSpecified = specifiedTypes.length + (hasTimeRange ? 1 : 0);
    if (totalSpecified === 0) {
        throw new Error('No changeset specification provided. Please specify one of: releases-count, time-range-start/end, commits-count, commits-since-sha, commits-shas, commits-start-sha/end-sha, or tags-start/end');
    }
    if (totalSpecified > 1) {
        throw new Error('Multiple changeset types specified. Please specify only one changeset type.');
    }
    if (hasTimeRange) {
        return {
            type: 'time-range',
            timeRangeStart: raw['time-range-start'],
            timeRangeEnd: raw['time-range-end']
        };
    }
    const specified = specifiedTypes[0];
    switch (specified.type) {
        case 'releases-count':
            return {
                type: 'releases-count',
                releasesCount: parseInt(raw['releases-count'], 10)
            };
        case 'commits-count':
            return {
                type: 'commits-count',
                commitsCount: parseInt(raw['commits-count'], 10)
            };
        case 'commits-since-sha':
            return {
                type: 'commits-since-sha',
                commitsSinceSha: raw['commits-since-sha']
            };
        case 'commits-shas':
            return {
                type: 'commits-shas',
                commitsShas: raw['commits-shas'].split(',').map(s => s.trim())
            };
        case 'commits-range':
            return {
                type: 'commits-range',
                commitsStartSha: raw['commits-start-sha'],
                commitsEndSha: raw['commits-end-sha'] || 'HEAD',
                includeStartCommit: raw['include-start-commit'] === 'true'
            };
        case 'tags-range':
            return {
                type: 'tags-range',
                tagsStart: raw['tags-start'],
                tagsEnd: raw['tags-end'] || 'HEAD'
            };
        default:
            throw new Error('Unknown changeset type');
    }
}
function parseInputs() {
    const linearApiKey = core.getInput('linear-api-key', { required: true });
    const teamKeysInput = core.getInput('team-keys');
    const outputFile = core.getInput('output-file') || 'linear-issues.json';
    const rawChangeset = {
        'releases-count': core.getInput('releases-count'),
        'time-range-start': core.getInput('time-range-start'),
        'time-range-end': core.getInput('time-range-end'),
        'commits-count': core.getInput('commits-count'),
        'commits-since-sha': core.getInput('commits-since-sha'),
        'commits-shas': core.getInput('commits-shas'),
        'commits-start-sha': core.getInput('commits-start-sha'),
        'commits-end-sha': core.getInput('commits-end-sha'),
        'include-start-commit': core.getInput('include-start-commit'),
        'tags-start': core.getInput('tags-start'),
        'tags-end': core.getInput('tags-end')
    };
    const changeset = validateChangeset(rawChangeset);
    const teamKeys = teamKeysInput
        ? teamKeysInput.split(',').map(k => k.trim().toUpperCase())
        : undefined;
    return {
        linearApiKey,
        teamKeys,
        outputFile,
        changeset
    };
}
//# sourceMappingURL=inputs.js.map