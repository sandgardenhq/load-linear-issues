// __tests__/output.test.ts
import * as fs from 'fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { buildOutputArtifact, writeOutputFile, setActionOutputs } from '../src/output';
import { Changeset, IssueReference } from '../src/types';

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    writeFileSync: jest.fn(),
    promises: {
      access: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      mkdir: jest.fn(),
      rm: jest.fn(),
      appendFile: jest.fn()
    }
  };
});
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
