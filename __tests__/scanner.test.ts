// __tests__/scanner.test.ts
import { buildIssuePattern, scanCommitsForIssues } from '../src/scanner';
import { Commit } from '../src/types';

describe('scanner', () => {
  describe('buildIssuePattern', () => {
    it('should build pattern from team keys', () => {
      const pattern = buildIssuePattern(['ENG', 'PROD']);
      expect(pattern.test('ENG-123')).toBe(true);
      expect(pattern.test('PROD-456')).toBe(true);
      expect(pattern.test('OTHER-789')).toBe(false);
    });

    it('should be case-insensitive', () => {
      const pattern = buildIssuePattern(['ENG']);
      expect(pattern.test('eng-123')).toBe(true);
      expect(pattern.test('Eng-123')).toBe(true);
      expect(pattern.test('ENG-123')).toBe(true);
    });

    it('should return non-matching pattern for empty keys', () => {
      const pattern = buildIssuePattern([]);
      expect(pattern.test('ENG-123')).toBe(false);
    });
  });

  describe('scanCommitsForIssues', () => {
    it('should extract issue keys from commits', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: add feature ENG-123' },
        { sha: 'def456', message: 'fix: bug PROD-456' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG', 'PROD']);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.key === 'ENG-123')).toBeDefined();
      expect(result.find(i => i.key === 'PROD-456')).toBeDefined();
    });

    it('should extract multiple issues from single commit', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: implement ENG-123 and ENG-456' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.key === 'ENG-123')?.commits).toContain('abc123');
      expect(result.find(i => i.key === 'ENG-456')?.commits).toContain('abc123');
    });

    it('should deduplicate issues across commits', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: start ENG-123' },
        { sha: 'def456', message: 'feat: continue ENG-123' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('ENG-123');
      expect(result[0].commits).toEqual(['abc123', 'def456']);
    });

    it('should normalize keys to uppercase', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: add eng-123' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result[0].key).toBe('ENG-123');
    });

    it('should return empty array when no matches', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: no issues here' }
      ];

      const result = scanCommitsForIssues(commits, ['ENG']);

      expect(result).toHaveLength(0);
    });

    it('should handle empty commits array', () => {
      const result = scanCommitsForIssues([], ['ENG']);
      expect(result).toHaveLength(0);
    });
  });
});
