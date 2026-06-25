#!/usr/bin/env node
// Sun Prototype Kit — Iron Laws Guard Hook
// Reminds about TDD when production code is modified without tests.

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const tool = data.tool_name || '';
    const toolInput = data.tool_input || {};

    // Only check Edit and Write tools
    if (!['Edit', 'Write'].includes(tool)) {
      process.stdout.write('{}');
      return;
    }

    const filePath = toolInput.file_path || '';

    // Skip non-source files
    const sourceExtensions = /\.(ts|tsx|js|jsx|py|go|rs|java)$/;
    if (!sourceExtensions.test(filePath)) {
      process.stdout.write('{}');
      return;
    }

    // Skip test files, config files, and .sun/ artifacts
    const isTestFile = /\.(test|spec|e2e)\.(ts|tsx|js|jsx|py)$/.test(filePath);
    const isConfig = /(config|setup|fixture|mock|stub|seed|migration)/.test(filePath);
    const isSunFile = /\.sun\//.test(filePath);
    const isSkillFile = /skills\//.test(filePath);

    if (isTestFile || isConfig || isSunFile || isSkillFile) {
      process.stdout.write('{}');
      return;
    }

    // Production code was modified — remind about TDD
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        additionalContext: "🔴 Iron Law #1 Reminder: Production code modified. Ensure a failing test exists BEFORE this code change. If writing test after code — delete the code, write test first, watch it fail, then write code."
      }
    }));
  } catch (e) {
    // Fail open
    process.stdout.write('{}');
  }
});
