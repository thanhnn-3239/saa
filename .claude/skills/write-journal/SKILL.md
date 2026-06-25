---
name: tkm:write-journal
description: "Record what happened in the session — decisions made, lessons learned, and work completed. Activate at the end of any significant work session or implementation cycle."
argument-hint: "[topic or reflection]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# Write Journal

A craftsman's work does not end when the piece leaves the workshop.
Every session deserves a record: what was shaped, what was learned, what would be done differently.

Use the `journal-writer` subagent to explore recent code changes and session context,
then write concise journal entries that capture key decisions, impacts, and craft notes.

Keep journal entries in the `./docs/journals/` directory.
Entries should be focused — the most important events only, not a transcript.

**IMPORTANT:** Invoke "/tkm:organize-files" skill to organize the outputs.
