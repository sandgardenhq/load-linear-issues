// __tests__/inputs.test.ts
import * as core from '@actions/core';
import { parseInputs, validateChangeset } from '../src/inputs';

jest.mock('@actions/core');

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

describe('inputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseInputs', () => {
    it('should parse required inputs', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': 'linear-issues.json',
          'commits-count': '10'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.linearApiKey).toBe('lin_api_xxx');
      expect(result.outputFile).toBe('linear-issues.json');
      expect(result.changeset.type).toBe('commits-count');
      expect(result.changeset.commitsCount).toBe(10);
    });

    it('should parse team-keys as array', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'team-keys': 'ENG, PROD, DESIGN',
          'output-file': 'linear-issues.json',
          'commits-count': '5'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.teamKeys).toEqual(['ENG', 'PROD', 'DESIGN']);
    });

    it('should use default output file', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': '',
          'commits-count': '10'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.outputFile).toBe('linear-issues.json');
    });

    it('should parse time-range changeset', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': 'linear-issues.json',
          'time-range-start': '2024-01-01T00:00:00Z',
          'time-range-end': '2024-12-31T23:59:59Z'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.changeset.type).toBe('time-range');
      expect(result.changeset.timeRangeStart).toBe('2024-01-01T00:00:00Z');
      expect(result.changeset.timeRangeEnd).toBe('2024-12-31T23:59:59Z');
    });

    it('should parse commits-shas as array', () => {
      mockGetInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'linear-api-key': 'lin_api_xxx',
          'output-file': 'linear-issues.json',
          'commits-shas': 'abc123, def456, ghi789'
        };
        return inputs[name] || '';
      });

      const result = parseInputs();

      expect(result.changeset.type).toBe('commits-shas');
      expect(result.changeset.commitsShas).toEqual(['abc123', 'def456', 'ghi789']);
    });
  });

  describe('validateChangeset', () => {
    it('should throw if no changeset type specified', () => {
      expect(() => validateChangeset({})).toThrow('No changeset specification provided');
    });

    it('should throw if multiple changeset types specified', () => {
      expect(() => validateChangeset({
        'commits-count': '10',
        'releases-count': '5'
      })).toThrow('Multiple changeset types specified');
    });

    it('should return valid changeset for commits-count', () => {
      const result = validateChangeset({ 'commits-count': '10' });
      expect(result.type).toBe('commits-count');
      expect(result.commitsCount).toBe(10);
    });
  });
});
