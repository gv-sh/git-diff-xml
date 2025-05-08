# git-diff-xml

A command-line tool that packages Git commit changes or branch comparisons into a single XML file for code analysis by LLMs like Claude.

## Installation

```bash
npm install -g git-diff-xml
```

## Usage

```bash
# Analyze a specific commit
git-diff-xml --commit <commit-hash> --output <output-file.xml>

# Compare changes between branches
git-diff-xml --branch-compare <source>..<target> --output <output-file.xml>
```

### Options

- `-c, --commit <hash>`: Git commit hash to analyze
- `-b, --branch-compare <branches>`: Compare branches (format: source..target)
- `-o, --output <file>`: Output XML file path (default: "git-diff-xml-output.xml")
- `-d, --dir <directory>`: Git repository directory (default: current directory)
- `-h, --help`: Display help information
- `-V, --version`: Display version information

Either `--commit` or `--branch-compare` must be specified.

## XML Output Structure

The tool generates an XML file with the following structure:

```xml
<codebase commit="abc123">
  <file path="src/utils/helper.js">
    <content><![CDATA[
      // Full file source code here
    ]]></content>
    <changes>
      <addition line="10">const newFunction = () => {};</addition>
      <deletion line="15">const oldFunction = () => {};</deletion>
      <modification original-line="20" new-line="20">
        <before>const x = 1;</before>
        <after>const x = 2;</after>
      </modification>
    </changes>
  </file>
  <!-- Additional files -->
</codebase>
```

## Why Use git-diff-xml?

- **LLM Context Window Optimization**: Package only the relevant changes to maximize the use of Claude's context window
- **Structured Analysis**: Present code changes in a structured format that's easy for AI to parse
- **Full Context**: Include both full file content and specific changes for complete understanding
- **Simple Interface**: Straightforward CLI with minimal dependencies
- **Branch Comparison**: Compare changes between any two Git branches or refs

## Testing

Tests are written using Jest and can be run with:

```bash
npm test
```

The test suite includes:

- **Unit tests**: Testing individual functions for parsing diffs and generating XML
- **Integration tests**: Testing the tool against sample Git repositories
- **Edge cases**: Testing with empty commits, binary files, and large repositories

To run specific test groups:

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Make sure to add tests for any new features and ensure all tests pass.

## License

MIT
