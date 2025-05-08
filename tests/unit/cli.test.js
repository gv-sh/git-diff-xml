const path = require('path');

// Mock the module functions
jest.mock('../../src/index', () => ({
  createGitDiffXml: jest.fn().mockResolvedValue('/mock/output/path'),
  createBranchDiffXml: jest.fn().mockResolvedValue('/mock/output/path')
}));

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    // Simple parser to process command arguments
    if (cmd.includes('--commit') && !cmd.includes('--branch-compare')) {
      callback(null, 'Success'); // No error, successful output
    } else if (cmd.includes('--branch-compare main..feature-branch')) {
      callback(null, 'Success'); // No error for valid branch comparison
    } else if (cmd.includes('--branch-compare invalid-format')) {
      callback(new Error('Error: Branch comparison format should be "source..target"'), null);
    } else if (cmd.includes('--output')) {
      callback(null, 'Success with custom output');
    } else if (cmd.includes('--dir')) {
      callback(null, 'Success with custom directory');
    } else {
      callback(new Error('Error: Either --commit or --branch-compare option is required'), null);
    }
    
    // Return a mock child process
    return {
      on: jest.fn(),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() }
    };
  })
}));

// Import commander to access the program object
const commander = require('commander');

// Process is already mocked by Jest, but we'll add our exit mock
process.exit = jest.fn();

describe('CLI Interface Tests', () => {
  const binPath = path.resolve(__dirname, '../../bin/git-diff-xml.js');
  const mockSrcIndex = require('../../src/index');
  
  beforeEach(() => {
    // Reset the mocks before each test
    jest.clearAllMocks();
    
    // Spy on console.log and console.error
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restore console mocks
    console.log.mockRestore();
    console.error.mockRestore();
  });
  
  // We're directly testing the command handling logic
  test('executes commit option correctly', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', binPath, '--commit', 'abc1234'];
    
    // Load the CLI script to process the arguments
    jest.isolateModules(() => {
      require('../../bin/git-diff-xml.js');
    });
    
    // Reset process.argv
    process.argv = originalArgv;
    
    // Verify the correct function was called
    expect(mockSrcIndex.createGitDiffXml).toHaveBeenCalledTimes(1);
    expect(mockSrcIndex.createGitDiffXml).toHaveBeenCalledWith(
      expect.any(String), // Repository path
      'abc1234',          // Commit hash
      'git-diff-xml-output.xml' // Default output path
    );
  });
  
  test('executes branch-compare option correctly', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', binPath, '--branch-compare', 'main..feature-branch'];
    
    // Load the CLI script to process the arguments
    jest.isolateModules(() => {
      require('../../bin/git-diff-xml.js');
    });
    
    // Reset process.argv
    process.argv = originalArgv;
    
    // Verify the correct function was called
    expect(mockSrcIndex.createBranchDiffXml).toHaveBeenCalledTimes(1);
    expect(mockSrcIndex.createBranchDiffXml).toHaveBeenCalledWith(
      expect.any(String),    // Repository path
      'main',               // Source branch
      'feature-branch',     // Target branch
      'git-diff-xml-output.xml' // Default output path
    );
  });
  
  test('fails when branch-compare format is invalid', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', binPath, '--branch-compare', 'invalid-format'];
    
    // Load the CLI script to process the arguments
    jest.isolateModules(() => {
      require('../../bin/git-diff-xml.js');
    });
    
    // Reset process.argv
    process.argv = originalArgv;
    
    // Verify process.exit was called with error code
    expect(process.exit).toHaveBeenCalledWith(1);
    // createBranchDiffXml shouldn't be called
    expect(mockSrcIndex.createBranchDiffXml).not.toHaveBeenCalled();
  });
  
  test('uses custom output path when specified', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', binPath, '--commit', 'abc1234', '--output', 'custom-output.xml'];
    
    // Load the CLI script to process the arguments
    jest.isolateModules(() => {
      require('../../bin/git-diff-xml.js');
    });
    
    // Reset process.argv
    process.argv = originalArgv;
    
    // Verify the correct output path was used
    expect(mockSrcIndex.createGitDiffXml).toHaveBeenCalledWith(
      expect.any(String),
      'abc1234',
      'custom-output.xml'
    );
  });
  
  test('uses custom directory when specified', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', binPath, '--commit', 'abc1234', '--dir', __dirname];
    
    // Load the CLI script to process the arguments
    jest.isolateModules(() => {
      require('../../bin/git-diff-xml.js');
    });
    
    // Reset process.argv
    process.argv = originalArgv;
    
    // Verify the correct directory was used
    expect(mockSrcIndex.createGitDiffXml).toHaveBeenCalledWith(
      path.resolve(__dirname),
      'abc1234',
      'git-diff-xml-output.xml'
    );
  });
  
  test('requires either commit or branch-compare option', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', binPath];
    
    // Load the CLI script to process the arguments
    jest.isolateModules(() => {
      require('../../bin/git-diff-xml.js');
    });
    
    // Reset process.argv
    process.argv = originalArgv;
    
    // Verify process.exit was called with error code
    expect(process.exit).toHaveBeenCalledWith(1);
    // Neither function should be called
    expect(mockSrcIndex.createGitDiffXml).not.toHaveBeenCalled();
    expect(mockSrcIndex.createBranchDiffXml).not.toHaveBeenCalled();
  });
});