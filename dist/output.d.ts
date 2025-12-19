import { Changeset, IssueReference, OutputArtifact } from './types';
export declare function buildOutputArtifact(issues: IssueReference[], changeset: Changeset, linearBaseUrl: string, totalCommits: number): OutputArtifact;
export declare function writeOutputFile(filePath: string, artifact: OutputArtifact): void;
export declare function setActionOutputs(issues: IssueReference[]): void;
//# sourceMappingURL=output.d.ts.map