const { generateXml } = require('../../src/xml-generator');

describe('XML Generator', () => {
  test('generates correct XML structure', () => {
    const commitHash = 'abc123';
    const filesData = [
      {
        path: 'src/utils/helper.js',
        content: 'function helper() { return true; }',
        changes: [
          {
            type: 'addition',
            line: 10,
            content: 'const newFunction = () => {};'
          }
        ]
      }
    ];

    const xml = generateXml(commitHash, filesData);
    
    // Verify XML structure
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<codebase commit="abc123">');
    expect(xml).toContain('<file path="src/utils/helper.js">');
    expect(xml).toContain('<content><![CDATA[function helper() { return true; }]]></content>');
    expect(xml).toContain('<addition line="10">const newFunction = () =&gt; {};</addition>');
  });

  test('handles special XML characters in content', () => {
    const commitHash = 'abc123';
    const filesData = [
      {
        path: 'src/component.jsx',
        content: 'function Component() { return <div>&copy; 2023</div>; }',
        changes: [
          {
            type: 'addition',
            line: 5,
            content: 'const x = a < b && b > c;'
          }
        ]
      }
    ];

    const xml = generateXml(commitHash, filesData);
    
    // Verify special characters are handled
    expect(xml).toContain('<content><![CDATA[function Component() { return <div>&copy; 2023</div>; }]]></content>');
    expect(xml).toContain('<addition line="5">const x = a &lt; b &amp;&amp; b &gt; c;</addition>');
  });

  test('correctly groups modifications', () => {
    const commitHash = 'abc123';
    const filesData = [
      {
        path: 'src/index.js',
        content: 'console.log("Hello World");',
        changes: [
          {
            type: 'deletion',
            line: 20,
            content: 'const x = 1;'
          },
          {
            type: 'addition',
            line: 20,
            content: 'const x = 2;'
          }
        ]
      }
    ];

    const xml = generateXml(commitHash, filesData);
    
    // Verify modifications are grouped
    expect(xml).toContain('<modification original-line="20" new-line="20">');
    expect(xml).toContain('<before>const x = 1;</before>');
    expect(xml).toContain('<after>const x = 2;</after>');
  });
});