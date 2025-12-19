import { Commit, IssueReference } from './types';
export declare function buildIssuePattern(teamKeys: string[]): RegExp;
export declare function scanCommitsForIssues(commits: Commit[], teamKeys: string[]): Omit<IssueReference, 'url'>[];
//# sourceMappingURL=scanner.d.ts.map