#!/usr/bin/env node

const { program } = require('commander');
const { createGitDiffXml, createBranchDiffXml } = require('../src/index');
const path = require('path');
const fs = require('fs');
const { version } = require('../package.json');

program
  .version(version)
  .description('Package git commit or branch changes into a single XML file for code analysis')
  .option('-c, --commit <hash>', 'Git commit hash to analyze')
  .option('-b, --branch-compare <branches>', 'Compare branches (format: source..target)')
  .option('-o, --output <file>', 'Output XML file path', 'git-diff-xml-output.xml')
  .option('-d, --dir <directory>', 'Git repository directory', process.cwd())
  .parse(process.argv);

const options = program.opts();

const repoPath = path.resolve(options.dir);

try {
  if (options.commit) {
    // Existing commit analysis logic
    createGitDiffXml(repoPath, options.commit, options.output)
      .then(() => {
        console.log(`Successfully created XML slice at ${options.output}`);
      })
      .catch(err => {
        console.error('Error creating git slice:', err.message);
        process.exit(1);
      });
  } else if (options.branchCompare) {
    // Validate branch comparison format
    const isValidFormat = options.branchCompare.includes('..');
    const [sourceBranch, targetBranch] = isValidFormat ? options.branchCompare.split('..') : [null, null];
    const isValidBranches = sourceBranch && targetBranch;

    if (!isValidFormat || !isValidBranches) {
      console.error('Error: Branch comparison format should be "source..target"');
      process.exit(1);
    } else {
      // Valid format, proceed with branch comparison
      createBranchDiffXml(repoPath, sourceBranch, targetBranch, options.output)
        .then(() => {
          console.log(`Successfully created branch comparison XML at ${options.output}`);
        })
        .catch(err => {
          console.error('Error creating branch comparison XML:', err.message);
          process.exit(1);
        });
    }
  } else {
    console.error('Error: Either --commit or --branch-compare option is required');
    process.exit(1);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}