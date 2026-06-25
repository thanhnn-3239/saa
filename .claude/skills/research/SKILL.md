---
name: tkm:research
description: "Multi-source technical research with ranked recommendations and quantified trade-offs — evaluates options before a decision is made. Use for technology evaluation, best practices, architecture analysis, scalability/security/maintainability investigation."
license: MIT
argument-hint: "[topic]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# Studying the Material

A craftsman who cannot read the material cannot shape it.
Before any decision is made, the material must be understood —
its properties, its limits, its grain, and what others have learned working with it.

**Principles:** YAGNI, KISS, DRY | Honest findings over comfortable ones | Concise, actionable reports

## Study Methodology

### Stage 1: Define the Scope

First, clearly define what will be studied:
- Identify the key terms and concepts to investigate
- Determine recency requirements (how current must the information be)
- Establish evaluation criteria for sources
- Set boundaries for the depth of study

### Stage 2: Gather from Multiple Sources

Employ a multi-source study strategy:

1. **Search Strategy**:
   - **Gemini Toggle**: Check `.claude/.sk.json` (or `~/.claude/.sk.json`) for `skills.research.useGemini` (default: `false`). If `false` or absent, skip Gemini and use WebSearch directly.
   - **Gemini Model**: Read from `.claude/.sk.json`: `gemini.model` (default: `gemini-3-flash-preview`)
   - If `useGemini` is `true`: first validate Gemini CLI works by running `command -v gemini && echo "ping" | timeout 15 gemini -y -m <gemini.model>`. If validation fails or times out, fall back to WebSearch and warn: "Gemini CLI unavailable, falling back to WebSearch. Set `skills.research.useGemini: false` in `.claude/.sk.json` to suppress this check."
   - If validation passes, execute `echo "...your search prompt..." | timeout 180 gemini -y -m <gemini.model>` (timeout: 3 minutes) and save the output using `Report:` path from `## Naming` section (including all citations). If execution times out, fall back to WebSearch for that query.
   - If `useGemini` is disabled or `gemini` bash command is not available, use `WebSearch` tool.
   - Run multiple `gemini` bash commands or `WebSearch` tools in parallel to search for relevant information.
   - Craft precise search queries with relevant keywords
   - Include terms like "best practices", "2024", "latest", "security", "performance"
   - Search for official documentation, GitHub repositories, and authoritative sources
   - Prioritize results from recognized authorities (official docs, major organizations, respected practitioners)
   - **IMPORTANT:** Perform at most **5 researches (max 5 tool calls)**. Respect any lower limit the user sets. Think carefully before each query.

2. **Deep Content Analysis**:
   - When a potential GitHub repository URL is found, use `tkm:search-docs` skill to read it
   - Focus on official documentation, API references, and technical specifications
   - Analyze README files from well-maintained repositories
   - Review changelog and release notes for version-specific information

3. **Video Content Study**:
   - Prioritize content from official channels, recognized practitioners, and major conferences
   - Focus on practical demonstrations and real-world implementations

4. **Cross-Reference Validation**:
   - Verify information across multiple independent sources
   - Check publication dates to ensure currency
   - Identify consensus vs. contested approaches
   - Note any conflicting information or open debates

### Stage 3: Analyze and Synthesize

Analyze gathered material by:
- Identifying common patterns and established practices
- Evaluating the trade-offs of different approaches
- Assessing maturity and stability of technologies
- Recognizing security implications and performance constraints
- Determining compatibility and integration requirements

### Stage 4: Produce the Study Report

**Notes:**
- Reports are saved using `Report:` path from `## Naming` section.
- If `## Naming` section is not available, ask the main agent to provide the output path.

Produce a comprehensive markdown report with this structure:

```markdown
# Study Report: [Topic]

## Summary
[2-3 paragraph overview of key findings and recommendations]

## Study Methodology
- Sources consulted: [number]
- Date range of materials: [earliest to most recent]
- Key search terms used: [list]

## Key Findings

### 1. Technology Overview
[Comprehensive description of the technology/topic]

### 2. Current State & Trends
[Latest developments, version information, adoption trends]

### 3. Established Practices
[Detailed list of recommended practices with explanations]

### 4. Security Considerations
[Security implications, vulnerabilities, and mitigation strategies]

### 5. Performance Characteristics
[Performance properties, optimization techniques, benchmarks]

## Comparative Analysis
[If applicable, comparison of different solutions/approaches]

## Recommendations

### Getting Started
[Step-by-step getting started instructions]

### Code Examples
[Relevant code snippets with explanations]

### Common Mistakes
[Errors to avoid and their remedies]

## Sources & References

### Official Documentation
- [Linked list of official docs]

### Recommended Reading
- [Curated list with descriptions]

### Community Resources
- [Forums, Discord servers, Stack Overflow tags]

### Further Study
- [Advanced topics and deep dives]

## Appendices

### A. Glossary
[Technical terms and definitions]

### B. Version Compatibility
[If applicable]

### C. Raw Study Notes
[Optional: detailed notes from the study process]
```

## Standards of Study

All material gathered must meet these criteria:
- **Accuracy**: Verified across multiple independent sources
- **Currency**: Prioritize information from the last 12 months unless historical context is needed
- **Completeness**: Cover all aspects requested
- **Actionability**: Provide practical, implementable recommendations
- **Clarity**: Clear language, defined terms, concrete examples
- **Attribution**: Always cite sources and provide links for verification

## Domain-Specific Considerations

- For security topics: always check for recent CVEs and security advisories
- For performance: seek benchmarks and real-world case studies
- For new technologies: assess community adoption and long-term support levels
- For APIs: verify endpoint availability and authentication requirements
- Always note deprecation warnings and migration paths for aging technologies

## Output Requirements

**IMPORTANT:** Invoke "/tkm:organize-files" skill to organize the outputs.

The study report must:
1. Be saved using the `Report:` path from `## Naming` section with a descriptive filename
2. Include a timestamp of when the study was conducted
3. Provide clear section navigation for longer reports
4. Use code blocks with appropriate syntax highlighting
5. Include diagrams or architecture descriptions where helpful (Mermaid or ASCII)
6. Conclude with specific, actionable next steps

**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

The craftsman's report is not a data dump — it is strategic intelligence that shapes decisions.
Anticipate the follow-up questions. Cover the material completely. Stay focused and practical.
