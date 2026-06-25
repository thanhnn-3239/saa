#!/usr/bin/env node
// Sun Prototype Kit — Safety Guard Hook
// Blocks access to sensitive files via PreToolUse.

const fs = require('fs');
const path = require('path');

const BLOCKED_PATTERNS = [
  /\.env$/,
  /\.env\.\w+$/,
  /credentials\.json$/,
  /\.pem$/,
  /\.key$/,
  /secrets?\.(json|yaml|yml|toml)$/,
  /service[-_]?account.*\.json$/,
];

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const tool = data.tool_name || '';
    const toolInput = data.tool_input || {};

    // Only check file-accessing tools
    if (!['Read', 'Edit', 'Write', 'Bash'].includes(tool)) {
      process.stdout.write('{}');
      return;
    }

    // Get file path from tool input
    let filePath = toolInput.file_path || toolInput.path || '';

    // For Bash, check if command references blocked files
    if (tool === 'Bash') {
      const cmd = toolInput.command || '';
      const blocked = BLOCKED_PATTERNS.some(p => p.test(cmd));
      if (blocked) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: {
            decision: "block",
            reason: "⚠️ Safety Guard: Command references sensitive file patterns (.env, credentials, keys). Use AskUserQuestion to request explicit permission."
          }
        }));
        return;
      }
      process.stdout.write('{}');
      return;
    }

    // Check file path against blocked patterns
    const basename = path.basename(filePath);
    const blocked = BLOCKED_PATTERNS.some(p => p.test(basename));

    if (blocked) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          decision: "block",
          reason: `⚠️ Safety Guard: Access to '${basename}' is blocked (sensitive file). Use AskUserQuestion to request explicit permission from user.`
        }
      }));
      return;
    }

    process.stdout.write('{}');
  } catch (e) {
    // Fail open
    process.stdout.write('{}');
  }
});
