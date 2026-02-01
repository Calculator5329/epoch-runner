# Update Documentation

Update all project documentation to reflect the current state of the codebase.

## Instructions

Perform a comprehensive documentation update across all `docs/` files:

### 1. Analyze Current State

Before updating, gather context:

1. **Check git status** - See what files have changed since last commit
2. **Review recent changes** - Understand what was added, modified, or removed
3. **Scan key directories** - `src/`, `scripts/`, `.cursor/` for new files
4. **Check level registry** - Verify all levels are documented

### 2. Update `docs/changelog.md`

Add a new session entry with today's date if changes were made:

```markdown
### Session: YYYY-MM-DD

#### Added
- List new features, files, commands, rules

#### Changed
- List modifications to existing functionality

#### Fixed
- List bug fixes with context

#### Removed
- List removed features or deprecated code
```

**Guidelines:**
- Group related changes together
- Include file paths for significant additions
- Explain the "why" for non-obvious changes
- Reference issue numbers if applicable

### 3. Update `docs/roadmap.md`

- Mark completed tasks with `[x]`
- Add new tasks discovered during development
- Update phase priorities if needed
- Move completed phases to "Completed" section if fully done

### 4. Update `docs/tech_spec.md`

Only update if:
- New stores were added → Update Store Responsibilities table
- New services were added → Update architecture diagrams
- New tile types were added → Update collision/grid documentation
- Physics constants changed → Update Physics Constants table
- File structure changed significantly → Update File Structure section

### 5. Verify Consistency

Cross-check that:
- All levels in `src/levels/` are listed in changelog
- All slash commands in `.cursor/commands/` are documented
- All rules in `.cursor/rules/` are mentioned
- NPM scripts in `package.json` match documentation

## Output

After updating, provide a summary:

```
## Documentation Updated

### changelog.md
- Added X new entries
- [Brief summary of changes logged]

### roadmap.md
- Marked X tasks complete
- Added X new tasks
- [Any phase status changes]

### tech_spec.md
- [List of sections updated, or "No changes needed"]

### Verification
- [Any inconsistencies found and fixed]
```

## Notes

- Don't remove historical entries from changelog
- Preserve existing formatting and style
- Use present tense for changelog entries ("Add" not "Added" in commit-style)
- Keep roadmap task descriptions concise but specific
