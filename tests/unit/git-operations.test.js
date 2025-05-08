const { parseDiff } = require('../../src/git-operations');

// Mock simple-git
jest.mock('simple-git', () => {
  return () => ({
    diffSummary: jest.fn(),
    show: jest.fn(),
    diff: jest.fn()
  });
});

describe('Git Operations', () => {
  describe('parseDiff', () => {
    test('correctly parses additions', () => {
      const diffOutput = `diff --git a/file.js b/file.js
index 1234567..abcdefg 100644
--- a/file.js
+++ b/file.js
@@ -10,6 +10,7 @@
 const existingLine = true;
+const newLine = 'added';
 const anotherExistingLine = false;`;

      const changes = parseDiff(diffOutput);
      
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        type: 'addition',
        line: 11,
        content: "const newLine = 'added';"
      });
    });

    test('correctly parses deletions', () => {
      const diffOutput = `diff --git a/file.js b/file.js
index 1234567..abcdefg 100644
--- a/file.js
+++ b/file.js
@@ -10,7 +10,6 @@
 const existingLine = true;
-const oldLine = 'removed';
 const anotherExistingLine = false;`;

      const changes = parseDiff(diffOutput);
      
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        type: 'deletion',
        line: 11,
        content: "const oldLine = 'removed';"
      });
    });

    test('correctly parses multiple changes', () => {
      const diffOutput = `diff --git a/file.js b/file.js
index 1234567..abcdefg 100644
--- a/file.js
+++ b/file.js
@@ -10,8 +10,9 @@
 const existingLine = true;
-const oldLine = 'removed';
+const newLine = 'added';
 const anotherExistingLine = false;
+const oneMoreAddition = 'here';`;

      const changes = parseDiff(diffOutput);
      
      expect(changes).toHaveLength(3);
      expect(changes[0]).toEqual({
        type: 'deletion',
        line: 11,
        content: "const oldLine = 'removed';"
      });
      expect(changes[1]).toEqual({
        type: 'addition',
        line: 11,
        content: "const newLine = 'added';"
      });
      expect(changes[2]).toEqual({
        type: 'addition',
        line: 13,
        content: "const oneMoreAddition = 'here';"
      });
    });

    test('handles multiple hunks', () => {
      const diffOutput = `diff --git a/file.js b/file.js
index 1234567..abcdefg 100644
--- a/file.js
+++ b/file.js
@@ -10,6 +10,7 @@
 const existingLine = true;
+const newLine = 'added';
 const anotherExistingLine = false;
@@ -50,7 +51,7 @@
 function test() {
   return {
-    value: 1
+    value: 2
   };
 }`;

      const changes = parseDiff(diffOutput);
      
      expect(changes).toHaveLength(3);
      expect(changes[0]).toEqual({
        type: 'addition',
        line: 11,
        content: "const newLine = 'added';"
      });
      expect(changes[1]).toEqual({
        type: 'deletion',
        line: 52,
        content: "    value: 1"
      });
      expect(changes[2]).toEqual({
        type: 'addition',
        line: 53,
        content: "    value: 2"
      });
    });
  });
});