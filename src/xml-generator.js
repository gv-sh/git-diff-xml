function escapeXml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generateXml(commitHash, filesData) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<codebase commit="${escapeXml(commitHash)}">\n`;

    for (const file of filesData) {
        xml += `  <file path="${escapeXml(file.path)}">\n`;

        // Add full file content in CDATA to avoid escaping issues
        xml += `    <content><![CDATA[${file.content}]]></content>\n`;

        // Add specific changes
        xml += `    <changes>\n`;

        // Group modifications (additions and deletions on the same line)
        const modifications = groupModifications(file.changes);

        for (const change of modifications) {
            if (change.type === 'addition') {
                xml += `      <addition line="${change.line}">${escapeXml(change.content)}</addition>\n`;
            } else if (change.type === 'deletion') {
                xml += `      <deletion line="${change.line}">${escapeXml(change.content)}</deletion>\n`;
            } else if (change.type === 'modification') {
                xml += `      <modification original-line="${change.originalLine}" new-line="${change.newLine}">\n`;
                xml += `        <before>${escapeXml(change.before)}</before>\n`;
                xml += `        <after>${escapeXml(change.after)}</after>\n`;
                xml += `      </modification>\n`;
            }
        }

        xml += `    </changes>\n`;
        xml += `  </file>\n`;
    }

    xml += `</codebase>`;
    return xml;
}

function groupModifications(changes) {
    // Group related additions and deletions as modifications
    const result = [];

    for (let i = 0; i < changes.length; i++) {
        const current = changes[i];
        const next = changes[i + 1];

        if (current.type === 'deletion' && next && next.type === 'addition') {
            // Potential modification
            result.push({
                type: 'modification',
                originalLine: current.line,
                newLine: next.line,
                before: current.content,
                after: next.content
            });
            i++; // Skip the next change since we've processed it
        } else {
            result.push(current);
        }
    }

    return result;
}

module.exports = {
    generateXml
};