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
