# PR Describe

Generate a comprehensive pull request description by analyzing git diff and project context.

## Instructions

### 1. Gather Context

**Get the current branch name:**
```bash
git branch --show-current
```

**Get the diff against origin/main:**
```bash
git diff origin/main --stat
git diff origin/main
```

**Get commit history for this branch:**
```bash
git log origin/main..HEAD --oneline
```

### 2. Explore Documentation

Read the following docs to understand project context:
- `docs/roadmap.md` - Current goals and planned features
- `docs/tech_spec.md` - Architecture decisions
- `docs/changelog.md` - Recent changes and context

### 3. Analyze Changed Files

For each significantly changed file:
- Understand what the file does in the codebase
- Identify the purpose of the changes
- Note any breaking changes or migrations needed

### 4. Categorize Changes

Group changes into categories:
- **Features**: New functionality added
- **Fixes**: Bug fixes or corrections
- **Refactors**: Code improvements without behavior changes
- **Docs**: Documentation updates
- **Tests**: Test additions or modifications
- **Chores**: Build, config, dependency updates

## Output Format

Generate a PR description in this format:

```markdown
## Summary

[1-2 sentence high-level description of what this PR accomplishes]

## Changes

### [Category 1]
- [Specific change with context]
- [Another change]

### [Category 2]
- [Change description]

## Technical Details

[Any important implementation details, architectural decisions, or trade-offs worth noting]

## Testing

- [ ] [How to test change 1]
- [ ] [How to test change 2]

## Screenshots (if applicable)

[Note any UI changes that would benefit from screenshots]

## Related

- Closes #[issue] (if applicable)
- Related to [other PR/issue] (if applicable)
```

## Guidelines

- Be concise but complete
- Focus on the "why" not just the "what"
- Highlight breaking changes prominently
- Mention any required migrations or setup steps
- Include context for reviewers who may not have full background
- Use the project's terminology from the docs
