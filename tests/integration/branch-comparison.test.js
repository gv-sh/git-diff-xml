const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { createBranchDiffXml } = require('../../src/index');
const os = require('os');

// Create a temporary git repository with branches for testing
async function setupTempRepoWithBranches() {
  const tempDir = path.join(os.tmpdir(), `git-diff-xml-branch-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  
  // Initialize git repo
  execSync('git init', { cwd: tempDir });
  execSync('git config user.name "Test User"', { cwd: tempDir });
  execSync('git config user.email "test@example.com"', { cwd: tempDir });
  
  // Explicitly create and switch to main branch
  execSync('git checkout -b main', { cwd: tempDir });
  
  // Create initial file on main branch
  const filePath = path.join(tempDir, 'test.js');
  await fs.writeFile(filePath, 'console.log("Initial content on main branch");\n');
  
  // Add and commit the file to main branch
  execSync('git add test.js', { cwd: tempDir });
  execSync('git commit -m "Initial commit on main"', { cwd: tempDir });
  
  // Create a feature branch
  execSync('git checkout -b feature-branch', { cwd: tempDir });
  
  // Modify the file on feature branch
  await fs.writeFile(filePath, 'console.log("Initial content on main branch");\nconsole.log("Added on feature branch");\n');
  
  // Add a new file on feature branch
  const newFilePath = path.join(tempDir, 'feature-file.js');
  await fs.writeFile(newFilePath, 'console.log("New file on feature branch");\n');
  
  // Add and commit changes on feature branch
  execSync('git add .', { cwd: tempDir });
  execSync('git commit -m "Changes on feature branch"', { cwd: tempDir });
  
  // Return to main branch
  execSync('git checkout main', { cwd: tempDir });
  
  return tempDir;
}

// Clean up temporary repository
async function cleanupTempRepo(tempDir) {
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
}

describe('Branch Comparison Integration Tests', () => {
  let tempDir;
  let outputPath;
  
  beforeAll(async () => {
    tempDir = await setupTempRepoWithBranches();
    outputPath = path.join(tempDir, 'branch-diff-output.xml');
  });
  
  afterAll(async () => {
    await cleanupTempRepo(tempDir);
  });
  
  test('creates a valid XML file with branch comparison', async () => {
    // Run branch comparison
    await createBranchDiffXml(tempDir, 'main', 'feature-branch', outputPath);
    
    // Verify the XML file exists
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    // Read the XML content
    const xmlContent = await fs.readFile(outputPath, 'utf8');
    
    // Basic XML structure verification
    expect(xmlContent).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xmlContent).toMatch(/<codebase commit="main..feature-branch">/);
    
    // Check for both files
    expect(xmlContent).toMatch(/<file path="test\.js">/);
    expect(xmlContent).toMatch(/<file path="feature-file\.js">/);
    
    // Look for specific changes
    expect(xmlContent).toContain('Added on feature branch');
    expect(xmlContent).toContain('New file on feature branch');
    
    // Check that the XML appears to be well-formed (basic check)
    expect(xmlContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xmlContent.includes('</codebase>')).toBe(true);
  });
  
  test('creates branch comparison with no changes between identical branches', async () => {
    // Create a new branch identical to main
    execSync('git checkout main', { cwd: tempDir });
    execSync('git checkout -b identical-branch', { cwd: tempDir });
    
    // Run branch comparison between identical branches
    const identicalOutputPath = path.join(tempDir, 'identical-branch-output.xml');
    await createBranchDiffXml(tempDir, 'main', 'identical-branch', identicalOutputPath);
    
    // Verify the XML file exists
    const fileExists = await fs.access(identicalOutputPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    // Read the XML content
    const xmlContent = await fs.readFile(identicalOutputPath, 'utf8');
    
    // Basic XML structure verification
    expect(xmlContent).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xmlContent).toMatch(/<codebase commit="main..identical-branch">/);
    
    // The XML should be minimal without changes
    expect(xmlContent.split('\n').length).toBeLessThan(10);
  });
  
  test('properly handles file deletions in branch comparison', async () => {
    // Create a branch where we delete a file
    execSync('git checkout feature-branch', { cwd: tempDir });
    execSync('git checkout -b deletion-branch', { cwd: tempDir });
    
    // Delete a file
    execSync('git rm feature-file.js', { cwd: tempDir });
    execSync('git commit -m "Delete feature file"', { cwd: tempDir });
    
    // Run branch comparison
    const deletionOutputPath = path.join(tempDir, 'deletion-output.xml');
    await createBranchDiffXml(tempDir, 'feature-branch', 'deletion-branch', deletionOutputPath);
    
    // Verify the XML file exists
    const fileExists = await fs.access(deletionOutputPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    // Read the XML content
    const xmlContent = await fs.readFile(deletionOutputPath, 'utf8');
    
    // Basic XML structure verification
    expect(xmlContent).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xmlContent).toMatch(/<codebase commit="feature-branch..deletion-branch">/);
    
    // Verify the deleted file is included in the diff
    expect(xmlContent).toMatch(/feature-file\.js/);
  });
});