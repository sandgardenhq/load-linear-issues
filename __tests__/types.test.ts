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
