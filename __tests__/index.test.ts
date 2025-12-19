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
