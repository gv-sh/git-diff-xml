const { getBranchDiff } = require('../../src/git-operations');

// Mock simple-git
jest.mock('simple-git', () => {
  const mockGit = {
    raw: jest.fn(),
    diffSummary: jest.fn()
  };
  return () => mockGit;
});

describe('Branch Diff Operations', () => {
  let mockGit;
  const repoPath = '/path/to/repo';

  beforeEach(() => {
    // Get the mocked git instance
    mockGit = require('simple-git')(repoPath);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getBranchDiff', () => {
    test('correctly handles clean branch diff', async () => {
      // Mock successful merge-base and merge-tree responses
      mockGit.raw
        .mockResolvedValueOnce('abc1234') // merge-base response
        .mockResolvedValueOnce('Clean merge possible'); // merge-tree response

      // Mock diffSummary response
      mockGit.diffSummary.mockResolvedValueOnce({
        files: [
          { file: 'file1.js' },
          { file: 'file2.js' }
        ]
      });

      // Call the function
      const result = await getBranchDiff(repoPath, 'source', 'target');

      // Verify the results
      expect(result).toEqual(['file1.js', 'file2.js']);
      expect(mockGit.raw).toHaveBeenCalledTimes(2);
      expect(mockGit.raw).toHaveBeenCalledWith(['merge-base', 'source', 'target']);
      expect(mockGit.raw).toHaveBeenCalledWith(['merge-tree', 'abc1234', 'source', 'target']);
    });

    test('throws error when merge conflicts are detected', async () => {
      // Mock responses that indicate merge conflicts
      mockGit.raw
        .mockResolvedValueOnce('abc1234') // merge-base response
        .mockResolvedValueOnce('<<<<<<< HEAD\nConflicting changes\n=======\nOther changes\n>>>>>>> branch'); // merge-tree response with conflicts

      // Call the function and expect it to throw
      await expect(getBranchDiff(repoPath, 'source', 'target'))
        .rejects
        .toThrow('Merge conflicts detected between branches');
    });

    test('handles error in git commands gracefully', async () => {
      // Mock merge-base command failing
      mockGit.raw.mockRejectedValueOnce(new Error('Command failed'));

      // Mock diffSummary response as fallback
      mockGit.diffSummary.mockResolvedValueOnce({
        files: [
          { file: 'file1.js' }
        ]
      });

      // Call the function
      const result = await getBranchDiff(repoPath, 'source', 'target');

      // Verify it falls back to diffSummary
      expect(result).toEqual(['file1.js']);
      expect(mockGit.diffSummary).toHaveBeenCalledWith(['source..target']);
    });

    test('handles empty diff between branches', async () => {
      // Mock successful merge-base and merge-tree responses
      mockGit.raw
        .mockResolvedValueOnce('abc1234')
        .mockResolvedValueOnce('Clean merge possible');

      // Mock empty diffSummary response
      mockGit.diffSummary.mockResolvedValueOnce({
        files: []
      });

      // Call the function
      const result = await getBranchDiff(repoPath, 'source', 'target');

      // Verify the results
      expect(result).toEqual([]);
      expect(mockGit.diffSummary).toHaveBeenCalledWith(['source..target']);
    });
  });
});