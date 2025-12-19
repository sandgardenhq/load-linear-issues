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
