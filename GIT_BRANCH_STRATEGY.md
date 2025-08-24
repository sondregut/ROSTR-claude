# Git Branch Strategy for RostrDating

## Current Branch Structure

### Main Branch (`main`)
- **Purpose**: Active development of new features
- **Status**: Default branch for all new work
- **Version**: Working towards v1.1.0

### Release Branch (`release/1.0.0`)
- **Purpose**: Frozen state submitted to App Store
- **Status**: DO NOT modify unless fixing App Review issues
- **Version**: v1.0.0 (Build 46)
- **Tag**: `v1.0.0-submitted`

## Commit Guidelines

### When to commit to `main`:
- New features
- Bug fixes for unreleased code
- Performance improvements
- UI/UX enhancements
- General development work

### When to commit to `release/1.0.0`:
- ONLY if App Review requests specific changes
- Critical bug fixes that affect the submitted version
- Must cherry-pick these fixes back to `main`

## Quick Commands

### Check current branch:
```bash
git branch --show-current
```

### Switch to main for development:
```bash
git checkout main
```

### Switch to release branch (only for App Review fixes):
```bash
git checkout release/1.0.0
```

### Create a new release branch (for future versions):
```bash
git checkout -b release/1.1.0
git tag -a v1.1.0-submitted -m "Version 1.1.0 submitted to App Store"
git push -u origin release/1.1.0
git push origin v1.1.0-submitted
```

## Important Notes
- Always verify you're on the correct branch before committing
- The `release/1.0.0` branch should remain unchanged unless App Review requires fixes
- All new development happens on `main`
- When in doubt, check this document or ask which branch to use