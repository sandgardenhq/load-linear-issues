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
