# Load Linear Issues - GitHub Action Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a GitHub Action that extracts Linear issue references from Git commits and outputs them for downstream actions, mirroring the functionality of load-jira-issues.

**Architecture:** TypeScript GitHub Action with modular separation of concerns. Uses @linear/sdk for API interactions, @actions/exec for git operations, and @actions/core for GitHub Actions integration. Follows TDD with Jest.

**Tech Stack:** TypeScript 5.3+, @linear/sdk, @actions/core, @actions/exec, @actions/github, Jest, @vercel/ncc

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Initialize package.json**

```bash
npm init -y
```

**Step 2: Install production dependencies**

```bash
npm install @actions/core@^1.10.1 @actions/exec@^2.0.0 @actions/github@^6.0.0 @linear/sdk@^65.0.0
```

**Step 3: Install dev dependencies**

```bash
npm install -D typescript@^5.3.3 @types/node@^20 jest@^29.7.0 ts-jest@^29.1.1 @types/jest@^29.5.11 @vercel/ncc@^0.38.1
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
*.log
.secrets
.env
coverage/
```

**Step 6: Update package.json scripts**

Add to package.json:
```json
{
  "scripts": {
    "build": "tsc",
    "package": "ncc build dist/index.js -o dist",
    "test": "jest",
    "test:watch": "jest --watch",
    "all": "npm run build && npm run package && npm test"
  }
}
```

**Step 7: Create jest.config.js**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transformIgnorePatterns: ['/node_modules/(?!@linear/sdk)']
};
```

**Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: initialize project with TypeScript and dependencies"
```

---

## Task 2: Define TypeScript Types

**Files:**
- Create: `src/types.ts`
- Create: `__tests__/types.test.ts`

**Step 1: Write the type definition tests**

```typescript
// __tests__/types.test.ts
import {
  LinearConfig,
  Changeset,
  Commit,
  IssueReference,
  OutputMetadata,
  OutputArtifact
} from '../src/types';

describe('types', () => {
  it('should allow valid LinearConfig', () => {
    const config: LinearConfig = {
      apiKey: 'lin_api_xxx',
      teamKeys: ['ENG', 'PROD']
    };
    expect(config.apiKey).toBe('lin_api_xxx');
  });

  it('should allow LinearConfig without teamKeys', () => {
    const config: LinearConfig = {
      apiKey: 'lin_api_xxx'
    };
    expect(config.teamKeys).toBeUndefined();
  });

  it('should allow valid Changeset with releases-count', () => {
    const changeset: Changeset = {
      type: 'releases-count',
      releasesCount: 5
    };
    expect(changeset.type).toBe('releases-count');
  });

  it('should allow valid Changeset with time-range', () => {
    const changeset: Changeset = {
      type: 'time-range',
      timeRangeStart: '2024-01-01T00:00:00Z',
      timeRangeEnd: '2024-12-31T23:59:59Z'
    };
    expect(changeset.type).toBe('time-range');
  });

  it('should allow valid Changeset with commits-count', () => {
    const changeset: Changeset = {
      type: 'commits-count',
      commitsCount: 10
    };
    expect(changeset.type).toBe('commits-count');
  });

  it('should allow valid Commit', () => {
    const commit: Commit = {
      sha: 'abc123',
      message: 'feat: add feature ENG-123'
    };
    expect(commit.sha).toBe('abc123');
  });

  it('should allow valid IssueReference', () => {
    const issue: IssueReference = {
      key: 'ENG-123',
      url: 'https://linear.app/company/issue/ENG-123',
      commits: ['abc123', 'def456']
    };
    expect(issue.commits).toHaveLength(2);
  });

  it('should allow valid OutputArtifact', () => {
    const artifact: OutputArtifact = {
      metadata: {
        generatedAt: '2024-01-01T00:00:00Z',
        linearBaseUrl: 'https://linear.app/company',
        repository: 'owner/repo',
        changeset: { type: 'commits-count', commitsCount: 10 },
        totalIssues: 5,
        totalCommits: 10
      },
      issues: []
    };
    expect(artifact.metadata.totalIssues).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/types.test.ts
```

Expected: FAIL with "Cannot find module '../src/types'"

**Step 3: Write the types implementation**

```typescript
// src/types.ts

export interface LinearConfig {
  apiKey: string;
  teamKeys?: string[];
}

export type ChangesetType =
  | 'releases-count'
  | 'time-range'
  | 'commits-count'
  | 'commits-since-sha'
  | 'commits-shas'
  | 'commits-range'
  | 'tags-range';

export interface Changeset {
  type: ChangesetType;
  releasesCount?: number;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  commitsCount?: number;
  commitsSinceSha?: string;
  commitsShas?: string[];
  commitsStartSha?: string;
  commitsEndSha?: string;
  includeStartCommit?: boolean;
  tagsStart?: string;
  tagsEnd?: string;
}

export interface Commit {
  sha: string;
  message: string;
}

export interface IssueReference {
  key: string;
  url: string;
  commits: string[];
}

export interface OutputMetadata {
  generatedAt: string;
  linearBaseUrl: string;
  repository: string;
  changeset: Changeset;
  totalIssues: number;
  totalCommits: number;
}

export interface OutputArtifact {
  metadata: OutputMetadata;
  issues: IssueReference[];
}

export interface ActionInputs {
  linearApiKey: string;
  teamKeys?: string[];
  outputFile: string;
  changeset: Changeset;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/types.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/types.ts __tests__/types.test.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: Implement Input Parsing

**Files:**
- Create: `src/inputs.ts`
- Create: `__tests__/inputs.test.ts`

**Step 1: Write the input parsing tests**

```typescript
// __tests__/inputs.test.ts
import * as core from '@actions/core';
import { parseInputs, validateChangeset } from '../src/inputs';

jest.mock('@actions/core');

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

describe('inputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseInputs', () => {
    it('should parse required inputs', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': 'linear-issues.json',
          'commits-count': '10'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.linearApiKey).toBe('lin_api_xxx');
      expect(result.outputFile).toBe('linear-issues.json');
      expect(result.changeset.type).toBe('commits-count');
      expect(result.changeset.commitsCount).toBe(10);
    });

    it('should parse team-keys as array', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'team-keys': 'ENG, PROD, DESIGN',
          'output-file': 'linear-issues.json',
          'commits-count': '5'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.teamKeys).toEqual(['ENG', 'PROD', 'DESIGN']);
    });

    it('should use default output file', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': '',
          'commits-count': '10'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.outputFile).toBe('linear-issues.json');
    });

    it('should parse time-range changeset', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': 'linear-issues.json',
          'time-range-start': '2024-01-01T00:00:00Z',
          'time-range-end': '2024-12-31T23:59:59Z'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.changeset.type).toBe('time-range');
      expect(result.changeset.timeRangeStart).toBe('2024-01-01T00:00:00Z');
      expect(result.changeset.timeRangeEnd).toBe('2024-12-31T23:59:59Z');
    });

    it('should parse commits-shas as array', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': 'linear-issues.json',
          'commits-shas': 'abc123, def456, ghi789'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.changeset.type).toBe('commits-shas');
      expect(result.changeset.commitsShas).toEqual(['abc123', 'def456', 'ghi789']);
    });
  });

  describe('validateChangeset', () => {
    it('should throw if no changeset type specified', () => {
      expect(() => validateChangeset({})).toThrow('No changeset specification provided');
    });

    it('should throw if multiple changeset types specified', () => {
      expect(() => validateChangeset({
        'commits-count': '10',
        'releases-count': '5'
      })).toThrow('Multiple changeset types specified');
    });

    it('should return valid changeset for commits-count', () => {
      const result = validateChangeset({ 'commits-count': '10' });
      expect(result.type).toBe('commits-count');
      expect(result.commitsCount).toBe(10);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/inputs.test.ts
```

Expected: FAIL with "Cannot find module '../src/inputs'"

**Step 3: Write the inputs implementation**

```typescript
// src/inputs.ts
import * as core from '@actions/core';
import { ActionInputs, Changeset } from './types';

interface RawChangesetInputs {
  'releases-count'?: string;
  'time-range-start'?: string;
  'time-range-end'?: string;
  'commits-count'?: string;
  'commits-since-sha'?: string;
  'commits-shas'?: string;
  'commits-start-sha'?: string;
  'commits-end-sha'?: string;
  'include-start-commit'?: string;
  'tags-start'?: string;
  'tags-end'?: string;
}

export function validateChangeset(raw: RawChangesetInputs): Changeset {
  const changesetTypes: Array<{ key: keyof RawChangesetInputs; type: Changeset['type'] }> = [
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
      timeRangeStart: raw['time-range-start']!,
      timeRangeEnd: raw['time-range-end']!
    };
  }

  const specified = specifiedTypes[0];

  switch (specified.type) {
    case 'releases-count':
      return {
        type: 'releases-count',
        releasesCount: parseInt(raw['releases-count']!, 10)
      };
    case 'commits-count':
      return {
        type: 'commits-count',
        commitsCount: parseInt(raw['commits-count']!, 10)
      };
    case 'commits-since-sha':
      return {
        type: 'commits-since-sha',
        commitsSinceSha: raw['commits-since-sha']!
      };
    case 'commits-shas':
      return {
        type: 'commits-shas',
        commitsShas: raw['commits-shas']!.split(',').map(s => s.trim())
      };
    case 'commits-range':
      return {
        type: 'commits-range',
        commitsStartSha: raw['commits-start-sha']!,
        commitsEndSha: raw['commits-end-sha'] || 'HEAD',
        includeStartCommit: raw['include-start-commit'] === 'true'
      };
    case 'tags-range':
      return {
        type: 'tags-range',
        tagsStart: raw['tags-start']!,
        tagsEnd: raw['tags-end'] || 'HEAD'
      };
    default:
      throw new Error('Unknown changeset type');
  }
}

export function parseInputs(): ActionInputs {
  const linearApiKey = core.getInput('linear-api-key', { required: true });
  const teamKeysInput = core.getInput('team-keys');
  const outputFile = core.getInput('output-file') || 'linear-issues.json';

  const rawChangeset: RawChangesetInputs = {
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
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/inputs.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/inputs.ts __tests__/inputs.test.ts
git commit -m "feat: add input parsing with changeset validation"
```

---

## Task 4: Implement Linear API Integration

**Files:**
- Create: `src/linear.ts`
- Create: `__tests__/linear.test.ts`

**Step 1: Write the Linear integration tests**

```typescript
// __tests__/linear.test.ts
import { LinearClient } from '@linear/sdk';
import { createLinearClient, fetchTeamKeys } from '../src/linear';

jest.mock('@linear/sdk');

const MockLinearClient = LinearClient as jest.MockedClass<typeof LinearClient>;

describe('linear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLinearClient', () => {
    it('should create a LinearClient with API key', () => {
      const client = createLinearClient('lin_api_xxx');

      expect(MockLinearClient).toHaveBeenCalledWith({ apiKey: 'lin_api_xxx' });
      expect(client).toBeInstanceOf(LinearClient);
    });
  });

  describe('fetchTeamKeys', () => {
    it('should fetch all team keys when none specified', async () => {
      const mockTeams = {
        nodes: [
          { key: 'ENG' },
          { key: 'PROD' },
          { key: 'DESIGN' }
        ]
      };

      MockLinearClient.prototype.teams = jest.fn().mockResolvedValue(mockTeams);

      const client = new LinearClient({ apiKey: 'test' });
      const result = await fetchTeamKeys(client);

      expect(result).toEqual(['ENG', 'PROD', 'DESIGN']);
    });

    it('should filter to specified team keys', async () => {
      const mockTeams = {
        nodes: [
          { key: 'ENG' },
          { key: 'PROD' },
          { key: 'DESIGN' }
        ]
      };

      MockLinearClient.prototype.teams = jest.fn().mockResolvedValue(mockTeams);

      const client = new LinearClient({ apiKey: 'test' });
      const result = await fetchTeamKeys(client, ['ENG', 'PROD']);

      expect(result).toEqual(['ENG', 'PROD']);
    });

    it('should handle case-insensitive team key filtering', async () => {
      const mockTeams = {
        nodes: [
          { key: 'ENG' },
          { key: 'PROD' }
        ]
      };

      MockLinearClient.prototype.teams = jest.fn().mockResolvedValue(mockTeams);

      const client = new LinearClient({ apiKey: 'test' });
      const result = await fetchTeamKeys(client, ['eng', 'prod']);

      expect(result).toEqual(['ENG', 'PROD']);
    });

    it('should throw on API error', async () => {
      MockLinearClient.prototype.teams = jest.fn().mockRejectedValue(new Error('API Error'));

      const client = new LinearClient({ apiKey: 'test' });

      await expect(fetchTeamKeys(client)).rejects.toThrow('Linear API error: API Error');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/linear.test.ts
```

Expected: FAIL with "Cannot find module '../src/linear'"

**Step 3: Write the Linear implementation**

```typescript
// src/linear.ts
import { LinearClient } from '@linear/sdk';

export function createLinearClient(apiKey: string): LinearClient {
  return new LinearClient({ apiKey });
}

export async function fetchTeamKeys(
  client: LinearClient,
  filterKeys?: string[]
): Promise<string[]> {
  try {
    const teams = await client.teams();
    const allKeys = teams.nodes.map(team => team.key);

    if (!filterKeys || filterKeys.length === 0) {
      return allKeys;
    }

    const filterKeysUpper = filterKeys.map(k => k.toUpperCase());
    return allKeys.filter(key => filterKeysUpper.includes(key.toUpperCase()));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Linear API error: ${error.message}`);
    }
    throw new Error('Linear API error: Unknown error');
  }
}

export function buildIssueUrl(workspaceSlug: string, issueKey: string): string {
  return `https://linear.app/${workspaceSlug}/issue/${issueKey}`;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/linear.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/linear.ts __tests__/linear.test.ts
git commit -m "feat: add Linear API client integration"
```

---

## Task 5: Implement Git Operations

**Files:**
- Create: `src/git.ts`
- Create: `__tests__/git.test.ts`

**Step 1: Write the git operation tests**

```typescript
// __tests__/git.test.ts
import * as exec from '@actions/exec';
import { fetchCommits } from '../src/git';
import { Changeset } from '../src/types';

jest.mock('@actions/exec');

const mockExec = exec.exec as jest.MockedFunction<typeof exec.exec>;

describe('git', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCommits', () => {
    it('should fetch commits by count', async () => {
      const changeset: Changeset = {
        type: 'commits-count',
        commitsCount: 3
      };

      mockExec.mockImplementation(async (cmd, args, options) => {
        const stdout = options?.listeners?.stdout;
        if (stdout) {
          const output = 'abc123\x00feat: add feature ENG-123\x00def456\x00fix: bug PROD-456\x00ghi789\x00chore: update deps\x00';
          stdout(Buffer.from(output));
        }
        return 0;
      });

      const commits = await fetchCommits(changeset);

      expect(commits).toHaveLength(3);
      expect(commits[0]).toEqual({ sha: 'abc123', message: 'feat: add feature ENG-123' });
      expect(commits[1]).toEqual({ sha: 'def456', message: 'fix: bug PROD-456' });
      expect(commits[2]).toEqual({ sha: 'ghi789', message: 'chore: update deps' });
    });

    it('should fetch commits since SHA', async () => {
      const changeset: Changeset = {
        type: 'commits-since-sha',
        commitsSinceSha: 'abc123'
      };

      mockExec.mockImplementation(async (cmd, args, options) => {
        const stdout = options?.listeners?.stdout;
        if (stdout) {
          stdout(Buffer.from('def456\x00feat: new feature\x00'));
        }
        return 0;
      });

      const commits = await fetchCommits(changeset);

      expect(commits).toHaveLength(1);
      expect(mockExec).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['log', 'abc123..HEAD']),
        expect.anything()
      );
    });

    it('should fetch commits by time range', async () => {
      const changeset: Changeset = {
        type: 'time-range',
        timeRangeStart: '2024-01-01T00:00:00Z',
        timeRangeEnd: '2024-12-31T23:59:59Z'
      };

      mockExec.mockImplementation(async (cmd, args, options) => {
        const stdout = options?.listeners?.stdout;
        if (stdout) {
          stdout(Buffer.from('abc123\x00feat: feature\x00'));
        }
        return 0;
      });

      const commits = await fetchCommits(changeset);

      expect(mockExec).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['--since=2024-01-01T00:00:00Z', '--until=2024-12-31T23:59:59Z']),
        expect.anything()
      );
    });

    it('should handle empty result', async () => {
      const changeset: Changeset = {
        type: 'commits-count',
        commitsCount: 10
      };

      mockExec.mockImplementation(async () => 0);

      const commits = await fetchCommits(changeset);

      expect(commits).toHaveLength(0);
    });

    it('should throw on git error', async () => {
      const changeset: Changeset = {
        type: 'commits-count',
        commitsCount: 10
      };

      mockExec.mockImplementation(async (cmd, args, options) => {
        const stderr = options?.listeners?.stderr;
        if (stderr) {
          stderr(Buffer.from('fatal: not a git repository'));
        }
        return 1;
      });

      await expect(fetchCommits(changeset)).rejects.toThrow('Git error');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/git.test.ts
```

Expected: FAIL with "Cannot find module '../src/git'"

**Step 3: Write the git implementation**

```typescript
// src/git.ts
import * as exec from '@actions/exec';
import { Changeset, Commit } from './types';

const GIT_FORMAT = '%H%x00%s%x00';

function parseGitOutput(output: string): Commit[] {
  if (!output.trim()) {
    return [];
  }

  const parts = output.split('\x00').filter(p => p.trim());
  const commits: Commit[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    const sha = parts[i]?.trim();
    const message = parts[i + 1]?.trim();
    if (sha && message) {
      commits.push({ sha, message });
    }
  }

  return commits;
}

async function runGitLog(args: string[]): Promise<Commit[]> {
  let stdout = '';
  let stderr = '';

  const exitCode = await exec.exec('git', ['log', `--format=${GIT_FORMAT}`, ...args], {
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
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

export async function fetchCommits(changeset: Changeset): Promise<Commit[]> {
  switch (changeset.type) {
    case 'commits-count':
      return runGitLog(['-n', String(changeset.commitsCount)]);

    case 'commits-since-sha':
      return runGitLog([`${changeset.commitsSinceSha}..HEAD`]);

    case 'commits-shas':
      // For specific SHAs, we need to get each commit individually
      const commits: Commit[] = [];
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
      throw new Error(`Unknown changeset type: ${(changeset as Changeset).type}`);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/git.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/git.ts __tests__/git.test.ts
git commit -m "feat: add git commit fetching operations"
```

---

## Task 6: Implement Issue Scanner

**Files:**
- Create: `src/scanner.ts`
- Create: `__tests__/scanner.test.ts`

**Step 1: Write the scanner tests**

```typescript
// __tests__/scanner.test.ts
import { buildIssuePattern, scanCommitsForIssues } from '../src/scanner';
import { Commit } from '../src/types';

describe('scanner', () => {
  describe('buildIssuePattern', () => {
    it('should build pattern from team keys', () => {
      const pattern = buildIssuePattern(['ENG', 'PROD']);
      expect(pattern.test('ENG-123')).toBe(true);
      expect(pattern.test('PROD-456')).toBe(true);
      expect(pattern.test('OTHER-789')).toBe(false);
    });

    it('should be case-insensitive', () => {
      const pattern = buildIssuePattern(['ENG']);
      expect(pattern.test('eng-123')).toBe(true);
      expect(pattern.test('Eng-123')).toBe(true);
      expect(pattern.test('ENG-123')).toBe(true);
    });

    it('should return non-matching pattern for empty keys', () => {
      const pattern = buildIssuePattern([]);
      expect(pattern.test('ENG-123')).toBe(false);
    });
  });

  describe('scanCommitsForIssues', () => {
    it('should extract issue keys from commits', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: add feature ENG-123' },
        { sha: 'def456', message: 'fix: bug PROD-456' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG', 'PROD']);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.key === 'ENG-123')).toBeDefined();
      expect(result.find(i => i.key === 'PROD-456')).toBeDefined();
    });

    it('should extract multiple issues from single commit', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: implement ENG-123 and ENG-456' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.key === 'ENG-123')?.commits).toContain('abc123');
      expect(result.find(i => i.key === 'ENG-456')?.commits).toContain('abc123');
    });

    it('should deduplicate issues across commits', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: start ENG-123' },
        { sha: 'def456', message: 'feat: continue ENG-123' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('ENG-123');
      expect(result[0].commits).toEqual(['abc123', 'def456']);
    });

    it('should normalize keys to uppercase', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: add eng-123' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result[0].key).toBe('ENG-123');
    });

    it('should return empty array when no matches', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: no issues here' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result).toHaveLength(0);
    });

    it('should handle empty commits array', () => {
      const result = scanCommitsForIssues([], ['ENG']);
      expect(result).toHaveLength(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/scanner.test.ts
```

Expected: FAIL with "Cannot find module '../src/scanner'"

**Step 3: Write the scanner implementation**

```typescript
// src/scanner.ts
import { Commit, IssueReference } from './types';

export function buildIssuePattern(teamKeys: string[]): RegExp {
  if (teamKeys.length === 0) {
    return /(?!)/; // Never matches
  }
  const keysPattern = teamKeys.join('|');
  return new RegExp(`(${keysPattern})-\\d+`, 'gi');
}

export function scanCommitsForIssues(
  commits: Commit[],
  teamKeys: string[]
): Omit<IssueReference, 'url'>[] {
  const pattern = buildIssuePattern(teamKeys);
  const issueMap = new Map<string, string[]>();

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
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/scanner.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/scanner.ts __tests__/scanner.test.ts
git commit -m "feat: add issue scanner for Linear issue patterns"
```

---

## Task 7: Implement Output Generation

**Files:**
- Create: `src/output.ts`
- Create: `__tests__/output.test.ts`

**Step 1: Write the output tests**

```typescript
// __tests__/output.test.ts
import * as fs from 'fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { buildOutputArtifact, writeOutputFile, setActionOutputs } from '../src/output';
import { Changeset, IssueReference } from '../src/types';

jest.mock('fs');
jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo'
    }
  }
}));

const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;
const mockSetOutput = core.setOutput as jest.MockedFunction<typeof core.setOutput>;

describe('output', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildOutputArtifact', () => {
    it('should build complete output artifact', () => {
      const issues: IssueReference[] = [
        { key: 'ENG-123', url: 'https://linear.app/company/issue/ENG-123', commits: ['abc'] },
        { key: 'ENG-456', url: 'https://linear.app/company/issue/ENG-456', commits: ['def'] }
      ];
      const changeset: Changeset = { type: 'commits-count', commitsCount: 10 };

      const result = buildOutputArtifact(issues, changeset, 'https://linear.app/company', 5);

      expect(result.metadata.linearBaseUrl).toBe('https://linear.app/company');
      expect(result.metadata.repository).toBe('test-owner/test-repo');
      expect(result.metadata.totalIssues).toBe(2);
      expect(result.metadata.totalCommits).toBe(5);
      expect(result.metadata.changeset).toEqual(changeset);
      expect(result.issues).toHaveLength(2);
      expect(result.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('writeOutputFile', () => {
    it('should write JSON artifact to file', () => {
      const artifact = {
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          linearBaseUrl: 'https://linear.app/company',
          repository: 'owner/repo',
          changeset: { type: 'commits-count' as const, commitsCount: 10 },
          totalIssues: 1,
          totalCommits: 5
        },
        issues: [
          { key: 'ENG-123', url: 'https://linear.app/company/issue/ENG-123', commits: ['abc'] }
        ]
      };

      writeOutputFile('output.json', artifact);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        'output.json',
        JSON.stringify(artifact, null, 2)
      );
    });
  });

  describe('setActionOutputs', () => {
    it('should set all action outputs', () => {
      const issues: IssueReference[] = [
        { key: 'ENG-123', url: 'https://linear.app/company/issue/ENG-123', commits: ['abc'] },
        { key: 'ENG-456', url: 'https://linear.app/company/issue/ENG-456', commits: ['def'] }
      ];

      setActionOutputs(issues);

      expect(mockSetOutput).toHaveBeenCalledWith('issue-keys', 'ENG-123,ENG-456');
      expect(mockSetOutput).toHaveBeenCalledWith(
        'issue-links',
        'https://linear.app/company/issue/ENG-123,https://linear.app/company/issue/ENG-456'
      );
      expect(mockSetOutput).toHaveBeenCalledWith('issue-count', '2');
    });

    it('should handle empty issues array', () => {
      setActionOutputs([]);

      expect(mockSetOutput).toHaveBeenCalledWith('issue-keys', '');
      expect(mockSetOutput).toHaveBeenCalledWith('issue-links', '');
      expect(mockSetOutput).toHaveBeenCalledWith('issue-count', '0');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/output.test.ts
```

Expected: FAIL with "Cannot find module '../src/output'"

**Step 3: Write the output implementation**

```typescript
// src/output.ts
import * as fs from 'fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { Changeset, IssueReference, OutputArtifact } from './types';

export function buildOutputArtifact(
  issues: IssueReference[],
  changeset: Changeset,
  linearBaseUrl: string,
  totalCommits: number
): OutputArtifact {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      linearBaseUrl,
      repository: `${github.context.repo.owner}/${github.context.repo.repo}`,
      changeset,
      totalIssues: issues.length,
      totalCommits
    },
    issues
  };
}

export function writeOutputFile(filePath: string, artifact: OutputArtifact): void {
  fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2));
}

export function setActionOutputs(issues: IssueReference[]): void {
  const keys = issues.map(i => i.key).join(',');
  const links = issues.map(i => i.url).join(',');

  core.setOutput('issue-keys', keys);
  core.setOutput('issue-links', links);
  core.setOutput('issue-count', String(issues.length));
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/output.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/output.ts __tests__/output.test.ts
git commit -m "feat: add output artifact generation and GitHub Action outputs"
```

---

## Task 8: Implement Main Entry Point

**Files:**
- Create: `src/index.ts`
- Create: `__tests__/index.test.ts`

**Step 1: Write the main entry point tests**

```typescript
// __tests__/index.test.ts
import * as core from '@actions/core';
import { run } from '../src/index';

jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' }
  }
}));
jest.mock('../src/inputs');
jest.mock('../src/linear');
jest.mock('../src/git');
jest.mock('../src/scanner');
jest.mock('../src/output');

import { parseInputs } from '../src/inputs';
import { createLinearClient, fetchTeamKeys } from '../src/linear';
import { fetchCommits } from '../src/git';
import { scanCommitsForIssues } from '../src/scanner';
import { buildOutputArtifact, writeOutputFile, setActionOutputs } from '../src/output';

const mockParseInputs = parseInputs as jest.MockedFunction<typeof parseInputs>;
const mockCreateLinearClient = createLinearClient as jest.MockedFunction<typeof createLinearClient>;
const mockFetchTeamKeys = fetchTeamKeys as jest.MockedFunction<typeof fetchTeamKeys>;
const mockFetchCommits = fetchCommits as jest.MockedFunction<typeof fetchCommits>;
const mockScanCommitsForIssues = scanCommitsForIssues as jest.MockedFunction<typeof scanCommitsForIssues>;
const mockBuildOutputArtifact = buildOutputArtifact as jest.MockedFunction<typeof buildOutputArtifact>;
const mockWriteOutputFile = writeOutputFile as jest.MockedFunction<typeof writeOutputFile>;
const mockSetActionOutputs = setActionOutputs as jest.MockedFunction<typeof setActionOutputs>;
const mockInfo = core.info as jest.MockedFunction<typeof core.info>;
const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;

describe('index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run the complete workflow', async () => {
    mockParseInputs.mockReturnValue({
      linearApiKey: 'lin_api_xxx',
      teamKeys: ['ENG'],
      outputFile: 'linear-issues.json',
      changeset: { type: 'commits-count', commitsCount: 10 }
    });
    mockCreateLinearClient.mockReturnValue({} as any);
    mockFetchTeamKeys.mockResolvedValue(['ENG']);
    mockFetchCommits.mockResolvedValue([
      { sha: 'abc123', message: 'feat: add ENG-123' }
    ]);
    mockScanCommitsForIssues.mockReturnValue([
      { key: 'ENG-123', commits: ['abc123'] }
    ]);
    mockBuildOutputArtifact.mockReturnValue({
      metadata: {} as any,
      issues: [{ key: 'ENG-123', url: 'https://linear.app/company/issue/ENG-123', commits: ['abc123'] }]
    });

    await run();

    expect(mockParseInputs).toHaveBeenCalled();
    expect(mockCreateLinearClient).toHaveBeenCalledWith('lin_api_xxx');
    expect(mockFetchTeamKeys).toHaveBeenCalled();
    expect(mockFetchCommits).toHaveBeenCalled();
    expect(mockScanCommitsForIssues).toHaveBeenCalled();
    expect(mockWriteOutputFile).toHaveBeenCalled();
    expect(mockSetActionOutputs).toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Action completed successfully'));
  });

  it('should handle errors gracefully', async () => {
    mockParseInputs.mockImplementation(() => {
      throw new Error('Invalid input');
    });

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('Invalid input');
  });

  it('should handle unknown errors', async () => {
    mockParseInputs.mockImplementation(() => {
      throw 'unknown error';
    });

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('An unknown error occurred');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/index.test.ts
```

Expected: FAIL with "Cannot find module '../src/index'"

**Step 3: Write the main entry point implementation**

```typescript
// src/index.ts
import * as core from '@actions/core';
import { parseInputs } from './inputs';
import { createLinearClient, fetchTeamKeys, buildIssueUrl } from './linear';
import { fetchCommits } from './git';
import { scanCommitsForIssues } from './scanner';
import { buildOutputArtifact, writeOutputFile, setActionOutputs } from './output';
import { IssueReference } from './types';

export async function run(): Promise<void> {
  try {
    core.info('Parsing inputs...');
    const inputs = parseInputs();

    core.info('Creating Linear client...');
    const client = createLinearClient(inputs.linearApiKey);

    core.info('Fetching team keys from Linear...');
    const teamKeys = await fetchTeamKeys(client, inputs.teamKeys);
    core.info(`Found ${teamKeys.length} team(s): ${teamKeys.join(', ')}`);

    // Get workspace slug from first issue query or use a default
    // For now, we'll construct URLs without workspace slug (Linear redirects)
    const linearBaseUrl = 'https://linear.app';

    core.info('Fetching commits...');
    const commits = await fetchCommits(inputs.changeset);
    core.info(`Found ${commits.length} commit(s)`);

    core.info('Scanning commits for Linear issues...');
    const issueRefs = scanCommitsForIssues(commits, teamKeys);

    // Add URLs to issue references
    const issues: IssueReference[] = issueRefs.map(ref => ({
      ...ref,
      url: buildIssueUrl('', ref.key)
    }));

    core.info(`Found ${issues.length} unique Linear issue(s)`);

    core.info('Building output artifact...');
    const artifact = buildOutputArtifact(issues, inputs.changeset, linearBaseUrl, commits.length);

    core.info(`Writing output to ${inputs.outputFile}...`);
    writeOutputFile(inputs.outputFile, artifact);

    core.info('Setting action outputs...');
    setActionOutputs(issues);

    core.info(`Action completed successfully! Found ${issues.length} issue(s) in ${commits.length} commit(s).`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

// Only run if not in test environment
if (process.env.NODE_ENV !== 'test') {
  run();
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/index.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/index.ts __tests__/index.test.ts
git commit -m "feat: add main entry point orchestrating all modules"
```

---

## Task 9: Create GitHub Action Configuration

**Files:**
- Create: `action.yml`

**Step 1: Write action.yml**

```yaml
name: 'Load Linear Issues'
description: 'Extract Linear issue references from Git commits for use in downstream actions'
author: 'Sandgarden'

branding:
  icon: 'link'
  color: 'purple'

inputs:
  linear-api-key:
    description: 'Linear API key for authentication'
    required: true
  team-keys:
    description: 'Comma-separated list of Linear team keys to filter (e.g., "ENG,PROD"). If not specified, all accessible teams are used.'
    required: false
  output-file:
    description: 'Path to write the JSON output artifact'
    required: false
    default: 'linear-issues.json'

  # Changeset specification (exactly one required)
  releases-count:
    description: 'Number of recent release tags to include commits from'
    required: false
  time-range-start:
    description: 'ISO 8601 timestamp for start of time range (requires time-range-end)'
    required: false
  time-range-end:
    description: 'ISO 8601 timestamp for end of time range (requires time-range-start)'
    required: false
  commits-count:
    description: 'Number of most recent commits to scan'
    required: false
  commits-since-sha:
    description: 'Scan all commits after this SHA (exclusive)'
    required: false
  commits-shas:
    description: 'Comma-separated list of specific commit SHAs to scan'
    required: false
  commits-start-sha:
    description: 'Start SHA for commit range (requires commits-end-sha or defaults to HEAD)'
    required: false
  commits-end-sha:
    description: 'End SHA for commit range (defaults to HEAD)'
    required: false
  include-start-commit:
    description: 'Include the start commit in range (default: false)'
    required: false
    default: 'false'
  tags-start:
    description: 'Start tag for tag range'
    required: false
  tags-end:
    description: 'End tag for tag range (defaults to HEAD)'
    required: false

outputs:
  issue-keys:
    description: 'Comma-separated list of Linear issue keys found'
  issue-links:
    description: 'Comma-separated list of Linear issue URLs'
  issue-count:
    description: 'Number of unique Linear issues found'

runs:
  using: 'node20'
  main: 'dist/index.js'
```

**Step 2: Commit**

```bash
git add action.yml
git commit -m "feat: add GitHub Action configuration"
```

---

## Task 10: Add Local Testing Workflow

**Files:**
- Create: `.github/workflows/test-local.yml`
- Create: `.secrets.example`

**Step 1: Create test-local workflow**

```yaml
# .github/workflows/test-local.yml
name: Test Local

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Load Linear Issues
        uses: ./
        id: linear
        with:
          linear-api-key: ${{ secrets.LINEAR_API_KEY }}
          commits-count: '10'

      - name: Display Results
        run: |
          echo "Issue Count: ${{ steps.linear.outputs.issue-count }}"
          echo "Issue Keys: ${{ steps.linear.outputs.issue-keys }}"
          echo "Issue Links: ${{ steps.linear.outputs.issue-links }}"
          echo ""
          echo "Full JSON Output:"
          cat linear-issues.json
```

**Step 2: Create secrets example file**

```bash
# .secrets.example
LINEAR_API_KEY=lin_api_your_key_here
```

**Step 3: Commit**

```bash
git add .github/workflows/test-local.yml .secrets.example
git commit -m "feat: add local testing workflow and secrets example"
```

---

## Task 11: Add README Documentation

**Files:**
- Create: `README.md`

**Step 1: Write README**

```markdown
# Load Linear Issues

A GitHub Action that extracts Linear issue references from Git commits for use in downstream actions.

## Usage

```yaml
- uses: your-org/load-linear-issues@v1
  id: linear
  with:
    linear-api-key: ${{ secrets.LINEAR_API_KEY }}
    commits-count: '10'

- name: Use Linear Issues
  run: |
    echo "Found ${{ steps.linear.outputs.issue-count }} issues"
    echo "Keys: ${{ steps.linear.outputs.issue-keys }}"
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `linear-api-key` | Yes | Linear API key for authentication |
| `team-keys` | No | Comma-separated team keys to filter (e.g., "ENG,PROD") |
| `output-file` | No | Path for JSON output (default: `linear-issues.json`) |

### Changeset Specification (exactly one required)

| Input | Description |
|-------|-------------|
| `commits-count` | Number of recent commits to scan |
| `commits-since-sha` | Commits after this SHA |
| `commits-shas` | Specific commit SHAs (comma-separated) |
| `commits-start-sha` + `commits-end-sha` | Commit range |
| `tags-start` + `tags-end` | Tag range |
| `time-range-start` + `time-range-end` | ISO 8601 time range |
| `releases-count` | Recent N release tags |

## Outputs

| Output | Description |
|--------|-------------|
| `issue-keys` | Comma-separated Linear issue keys |
| `issue-links` | Comma-separated Linear issue URLs |
| `issue-count` | Number of unique issues found |

## JSON Output Format

```json
{
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "linearBaseUrl": "https://linear.app",
    "repository": "owner/repo",
    "changeset": { "type": "commits-count", "commitsCount": 10 },
    "totalIssues": 3,
    "totalCommits": 10
  },
  "issues": [
    {
      "key": "ENG-123",
      "url": "https://linear.app/issue/ENG-123",
      "commits": ["abc123", "def456"]
    }
  ]
}
```

## Local Testing

1. Copy `.secrets.example` to `.secrets` and fill in your Linear API key
2. Run: `npm run build && npm run package`
3. Execute with [act](https://github.com/nektos/act): `act workflow_dispatch --secret-file .secrets`

## Development

```bash
npm install
npm run build
npm test
npm run package
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage instructions"
```

---

## Task 12: Run All Tests and Build

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests PASS

**Step 2: Build TypeScript**

```bash
npm run build
```

Expected: Compiles without errors

**Step 3: Package for distribution**

```bash
npm run package
```

Expected: Creates bundled `dist/index.js`

**Step 4: Final commit**

```bash
git add dist/
git commit -m "chore: build and package for distribution"
```

---

## Summary

This plan creates a complete GitHub Action that:

1. **Types** (`src/types.ts`): Defines all TypeScript interfaces
2. **Inputs** (`src/inputs.ts`): Parses and validates GitHub Action inputs with changeset mutual exclusivity
3. **Linear** (`src/linear.ts`): Creates Linear SDK client and fetches team keys
4. **Git** (`src/git.ts`): Fetches commits based on various changeset specifications
5. **Scanner** (`src/scanner.ts`): Extracts Linear issue patterns (TEAM-123) from commits
6. **Output** (`src/output.ts`): Builds JSON artifact and sets GitHub Action outputs
7. **Index** (`src/index.ts`): Orchestrates all modules with logging and error handling

All modules follow TDD with comprehensive test coverage and match the architectural patterns from load-jira-issues.
