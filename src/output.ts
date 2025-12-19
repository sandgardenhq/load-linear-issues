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
