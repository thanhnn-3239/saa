# awards-information Screen Specification

## Overview
- **URL Path:** /awards-information
- **Live URL:** <!-- optional, full URL for live page capture (falls back to baseURL + URL Path) -->
- **Figma URL:** <!-- optional, Figma frame URL for design-driven capture (requires Figma MCP) -->
- **Auth Required:** no
- **Platform:** web

## Sections

### Section: [Section Name]
- **Type:** form | table | list | card | tabs | modal | search | navigation
- **Description:** [Brief description of this section]

#### Fields
<!-- Remove this table if section has no input fields -->
| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| [Field Name] | input (text) | yes | max 255 | — |

#### Actions
| Action | Element | Behavior |
|--------|---------|----------|
| [Action Name] | button | [What happens on click] |

#### Validation Rules
<!-- Exact error messages help AI generate accurate assertions -->
| Condition | Error Message |
|-----------|---------------|
| Empty required field | "[Exact error message from UI]" |

#### States
| State | Condition | Visual |
|-------|-----------|--------|
| Default | Page load | [Default appearance] |
| Loading | After submit | [Loading indicator] |
| Error | Validation fail | [Error appearance] |
| Success | Action complete | [Success behavior] |

## Business Rules
<!-- Rules that affect test logic: limits, permissions, conditions -->
- [Rule 1]

## Accessibility
<!-- Tab order, aria-labels, screen reader behavior -->
- Tab order: [field1] → [field2] → [submit]

## Notes
<!-- Edge cases, known issues, environment-specific behavior -->
- [Note 1]
