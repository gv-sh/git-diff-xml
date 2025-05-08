const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { createGitDiffXml } = require('../../src/index');
const os = require('os');

// Create a temporary git repository for testing
async function setupTempRepo() {
  const tempDir = path.join(os.tmpdir(), `git-diff-xml-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  
  // Initialize git repo
  execSync('git init', { cwd: tempDir });
  execSync('git config user.name "Test User"', { cwd: tempDir });
  execSync('git config user.email "test@example.com"', { cwd: tempDir });
  
  // Create initial file
  const filePath = path.join(tempDir, 'test.js');
  await fs.writeFile(filePath, 'console.log("Initial content");\n');
  
  // Add and commit the file
  execSync('git add test.js', { cwd: tempDir });
  execSync('git commit -m "Initial commit"', { cwd: tempDir });
  
  // Modify the file
  await fs.writeFile(filePath, 'console.log("Initial content");\nconsole.log("Added line");\n');
  
  // Add and commit the change
  execSync('git add test.js', { cwd: tempDir });
  execSync('git commit -m "Add a line"', { cwd: tempDir });
  
  // Get the commit hash
  const commitHash = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();
  
  return { tempDir, commitHash };
}

// Clean up temporary repository
async function cleanupTempRepo(tempDir) {
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
}

describe('Integration Tests', () => {
  let tempDir;
  let commitHash;
  let outputPath;
  
  beforeAll(async () => {
    const setup = await setupTempRepo();
    tempDir = setup.tempDir;
    commitHash = setup.commitHash;
    outputPath = path.join(tempDir, 'output.xml');
  });
  
  afterAll(async () => {
    await cleanupTempRepo(tempDir);
  });
  
  test('creates a valid XML file with the correct structure', async () => {
    // Run git-diff-xml
    await createGitDiffXml(tempDir, commitHash, outputPath);
    
    // Verify the XML file exists
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    // Read the XML content
    const xmlContent = await fs.readFile(outputPath, 'utf8');
    
    // Verify XML structure
    expect(xmlContent).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xmlContent).toMatch(new RegExp(`<codebase commit="${commitHash}">`));
    expect(xmlContent).toMatch(/<file path="test\.js">/);
    expect(xmlContent).toContain('<content><![CDATA[console.log("Initial content");\nconsole.log("Added line");\n]]></content>');
    // Using a more flexible approach with regex
    const linePattern = /<addition line="2">.*Added line.*<\/addition>/;
    expect(xmlContent).toMatch(linePattern);
  });
  
  test('handles edge case: no changes', async () => {
    // Create empty commit
    const emptyCommitFile = path.join(tempDir, 'empty-commit.md');
    await fs.writeFile(emptyCommitFile, '# Empty commit test\n');
    execSync('git add empty-commit.md', { cwd: tempDir });
    execSync('git commit -m "Add empty file"', { cwd: tempDir });
    
    // Get the commit hash
    const emptyCommitHash = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();
    
    // Run git-diff-xml
    const emptyOutputPath = path.join(tempDir, 'empty-output.xml');
    await createGitDiffXml(tempDir, emptyCommitHash, emptyOutputPath);
    
    // Read the XML content
    const xmlContent = await fs.readFile(emptyOutputPath, 'utf8');
    
    // Verify the structure still works for an "empty" change
    expect(xmlContent).toMatch(new RegExp(`<codebase commit="${emptyCommitHash}">`));
    expect(xmlContent).toMatch(/<file path="empty-commit\.md">/);
    expect(xmlContent).toContain('<content><![CDATA[# Empty commit test\n]]></content>');
  });
});