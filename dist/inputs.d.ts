import { ActionInputs, Changeset } from './types';
interface RawChangesetInputs {
    'releases-count'?: string;
    'time-range-start'?: string;
    'time-range-end'?: string;
    'commits-count'?: string;
    'commits-since-sha'?: string;
    'commits-shas'?: string;
    'commits-start-sha'?: string;
    'commits-end-sha'?: string;
    'include-start-commit'?: string;
    'tags-start'?: string;
    'tags-end'?: string;
}
export declare function validateChangeset(raw: RawChangesetInputs): Changeset;
export declare function parseInputs(): ActionInputs;
export {};
//# sourceMappingURL=inputs.d.ts.map