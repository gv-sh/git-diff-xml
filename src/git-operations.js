const simpleGit = require('simple-git');

async function getChangedFiles(repoPath, commitHash) {
  const git = simpleGit(repoPath);
  
  // Get the list of files changed in the commit
  const diffSummary = await git.diffSummary([`${commitHash}^..${commitHash}`]);
  
  return diffSummary.files.map(file => file.file);
}

async function getFileContent(repoPath, commitHash, filePath) {
  const git = simpleGit(repoPath);
  
  try {
    // Get the content of the file at the specified commit
    const content = await git.show([`${commitHash}:${filePath}`]);
    return content;
  } catch (error) {
    // Handle case where file might be deleted in this commit
    return '';
  }
}

async function getFileDiff(repoPath, commitHash, filePath) {
  const git = simpleGit(repoPath);
  
  // Get the diff for the specific file in the commit
  const diff = await git.diff([`${commitHash}^`, commitHash, '--', filePath]);
  
  // Parse the diff to extract line-by-line changes
  return parseDiff(diff);
}

function parseDiff(diffOutput) {
  const changes = [];
  const lines = diffOutput.split('\n');
  
  let lineNumber = 0;
  let originalLine = 0;
  let newLine = 0;
  let inHunk = false;
  
  for (const line of lines) {
    // Skip diff headers
    if (line.startsWith('diff ') || line.startsWith('index ') || 
        line.startsWith('---') || line.startsWith('+++')) {
      continue;
    }
    
    // Handle hunk headers (@@ -1,7 +1,7 @@)
    if (line.startsWith('@@')) {
      inHunk = true;
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        originalLine = parseInt(match[1]);
        newLine = parseInt(match[2]);
      }
      continue;
    }
    
    if (!inHunk) continue;
    
    if (line.startsWith('+')) {
      changes.push({
        type: 'addition',
        line: newLine,
        content: line.substring(1)
      });
      newLine++;
    } else if (line.startsWith('-')) {
      changes.push({
        type: 'deletion',
        line: originalLine,
        content: line.substring(1)
      });
      originalLine++;
    } else if (line.startsWith(' ')) {
      // Context line (unchanged)
      originalLine++;
      newLine++;
    }
  }
  
  return changes;
}

async function getBranchDiff(repoPath, sourceBranch, targetBranch) {
  const git = simpleGit(repoPath);
  
  try {
    // Use git merge-base to find the common ancestor
    const commonAncestor = await git.raw(['merge-base', sourceBranch, targetBranch]);
    
    // Try to merge-tree to detect conflicts (without actually merging)
    const mergeCheck = await git.raw(['merge-tree', commonAncestor.trim(), sourceBranch, targetBranch]);
    
    // If output contains merge conflict markers, there are conflicts
    if (mergeCheck.includes('<<<<<<< ')) {
      throw new Error('Merge conflicts detected between branches');
    }
  } catch (error) {
    if (error.message.includes('Merge conflicts detected')) {
      throw error; // Re-throw our custom error
    }
    // Other errors might be from command execution - continue to use diffSummary
  }
  
  // Get all changed files between branches using diff summary
  const diffSummary = await git.diffSummary([`${sourceBranch}..${targetBranch}`]);
  return diffSummary.files.map(file => file.file);
}

module.exports = {
  getChangedFiles,
  getFileContent,
  getFileDiff,
  getBranchDiff,
  parseDiff 
};