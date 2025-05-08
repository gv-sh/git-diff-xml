const { getChangedFiles, getFileContent, getFileDiff } = require('./git-operations');
const { generateXml } = require('./xml-generator');
const fs = require('fs').promises;
const path = require('path');

/**
 * Creates an XML slice of changes in a git commit
 * 
 * @param {string} repoPath - Path to the git repository
 * @param {string} commitHash - The commit hash to analyze
 * @param {string} outputPath - Path where to save the output XML
 * @returns {Promise<string>} - Path to the created XML file
 */
async function createGitDiffXml(repoPath, commitHash, outputPath) {
  try {
    // Get list of changed files in the commit
    const changedFiles = await getChangedFiles(repoPath, commitHash);
    
    if (changedFiles.length === 0) {
      console.log('No files changed in this commit.');
    }
    
    // For each file, get content and specific changes
    const filesData = await Promise.all(
      changedFiles.map(async (file) => {
        try {
          // Get the full content of the file after the commit
          const content = await getFileContent(repoPath, commitHash, file);
          
          // Get specific changes (additions, deletions, modifications)
          const changes = await getFileDiff(repoPath, commitHash, file);
          
          return {
            path: file,
            content,
            changes
          };
        } catch (err) {
          console.error(`Error processing file ${file}:`, err.message);
          return {
            path: file,
            content: '',
            changes: []
          };
        }
      })
    );
    
    // Generate XML from the collected data
    const xml = generateXml(commitHash, filesData);
    
    // Write to output file
    await fs.writeFile(outputPath, xml, 'utf8');
    
    return outputPath;
  } catch (err) {
    console.error('Error creating git slice:', err);
    throw err;
  }
}

module.exports = { createGitDiffXml };