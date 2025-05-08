#!/usr/bin/env node

const { program } = require('commander');
const { createGitDiffXml } = require('../src/index');
const path = require('path');
const fs = require('fs');
const { version } = require('../package.json');

program
  .version(version)
  .description('Package git commit changes into a single XML file for code analysis')
  .requiredOption('-c, --commit <hash>', 'Git commit hash to analyze')
  .option('-o, --output <file>', 'Output XML file path', 'git-diff-xml-output.xml')
  .option('-d, --dir <directory>', 'Git repository directory', process.cwd())
  .parse(process.argv);

const options = program.opts();

const repoPath = path.resolve(options.dir);

try {
  createGitDiffXml(repoPath, options.commit, options.output)
    .then(() => {
      console.log(`Successfully created XML slice at ${options.output}`);
    })
    .catch(err => {
      console.error('Error creating git slice:', err.message);
      process.exit(1);
    });
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}