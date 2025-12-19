export interface LinearConfig {
    apiKey: string;
    teamKeys?: string[];
}
export type ChangesetType = 'releases-count' | 'time-range' | 'commits-count' | 'commits-since-sha' | 'commits-shas' | 'commits-range' | 'tags-range';
export interface Changeset {
    type: ChangesetType;
    releasesCount?: number;
    timeRangeStart?: string;
    timeRangeEnd?: string;
    commitsCount?: number;
    commitsSinceSha?: string;
    commitsShas?: string[];
    commitsStartSha?: string;
    commitsEndSha?: string;
    includeStartCommit?: boolean;
    tagsStart?: string;
    tagsEnd?: string;
}
export interface Commit {
    sha: string;
    message: string;
}
export interface IssueReference {
    key: string;
    url: string;
    commits: string[];
}
export interface OutputMetadata {
    generatedAt: string;
    linearBaseUrl: string;
    repository: string;
    changeset: Changeset;
    totalIssues: number;
    totalCommits: number;
}
export interface OutputArtifact {
    metadata: OutputMetadata;
    issues: IssueReference[];
}
export interface ActionInputs {
    linearApiKey: string;
    teamKeys?: string[];
    outputFile: string;
    changeset: Changeset;
}
//# sourceMappingURL=types.d.ts.map