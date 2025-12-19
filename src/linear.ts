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
