import { LinearClient } from '@linear/sdk';
export declare function createLinearClient(apiKey: string): LinearClient;
export declare function fetchTeamKeys(client: LinearClient, filterKeys?: string[]): Promise<string[]>;
export declare function buildIssueUrl(workspaceSlug: string, issueKey: string): string;
//# sourceMappingURL=linear.d.ts.map