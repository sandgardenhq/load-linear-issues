// __tests__/linear.test.ts
import { LinearClient } from '@linear/sdk';
import { createLinearClient, fetchTeamKeys } from '../src/linear';

jest.mock('@linear/sdk');

const MockLinearClient = LinearClient as jest.MockedClass<typeof LinearClient>;

describe('linear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLinearClient', () => {
    it('should create a LinearClient with API key', () => {
      const client = createLinearClient('lin_api_xxx');

      expect(MockLinearClient).toHaveBeenCalledWith({ apiKey: 'lin_api_xxx' });
      expect(client).toBeInstanceOf(LinearClient);
    });
  });

  describe('fetchTeamKeys', () => {
    it('should fetch all team keys when none specified', async () => {
      const mockTeams = {
        nodes: [
          { key: 'ENG' },
          { key: 'PROD' },
          { key: 'DESIGN' }
        ]
      };

      MockLinearClient.prototype.teams = jest.fn().mockResolvedValue(mockTeams);

      const client = new LinearClient({ apiKey: 'test' });
      const result = await fetchTeamKeys(client);

      expect(result).toEqual(['ENG', 'PROD', 'DESIGN']);
    });

    it('should filter to specified team keys', async () => {
      const mockTeams = {
        nodes: [
          { key: 'ENG' },
          { key: 'PROD' },
          { key: 'DESIGN' }
        ]
      };

      MockLinearClient.prototype.teams = jest.fn().mockResolvedValue(mockTeams);

      const client = new LinearClient({ apiKey: 'test' });
      const result = await fetchTeamKeys(client, ['ENG', 'PROD']);

      expect(result).toEqual(['ENG', 'PROD']);
    });

    it('should handle case-insensitive team key filtering', async () => {
      const mockTeams = {
        nodes: [
          { key: 'ENG' },
          { key: 'PROD' }
        ]
      };

      MockLinearClient.prototype.teams = jest.fn().mockResolvedValue(mockTeams);

      const client = new LinearClient({ apiKey: 'test' });
      const result = await fetchTeamKeys(client, ['eng', 'prod']);

      expect(result).toEqual(['ENG', 'PROD']);
    });

    it('should throw on API error', async () => {
      MockLinearClient.prototype.teams = jest.fn().mockRejectedValue(new Error('API Error'));

      const client = new LinearClient({ apiKey: 'test' });

      await expect(fetchTeamKeys(client)).rejects.toThrow('Linear API error: API Error');
    });
  });
});
