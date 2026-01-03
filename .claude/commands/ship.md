# Ship Code

Lint, build, test, commit, and push changes.

## Pre-flight checks:

```bash
# 1. Run linter
npm run lint

# 2. Run build
npm run build

# 3. Run tests (when available)
# npm run test
```

## If all checks pass:

```bash
# 4. Stage all changes
git add -A

# 5. Check what will be committed
git status

# 6. Commit with descriptive message
# Format: type: description
# Types: feat, fix, refactor, style, docs, test
git commit -m "feat: your feature description"

# 7. Push to remote
git push -u origin $(git branch --show-current)
```

## Commit message examples:
- `feat: add meeting calendar view`
- `fix: resolve audio upload timeout`
- `refactor: extract transcription logic to hook`
- `style: update dashboard card styles`
- `docs: add API documentation`

## After pushing:
1. Create PR to staging branch
2. Review changes on staging URL
3. Merge to staging
4. Test on staging
5. Create PR from staging to main
6. Merge to main (production)
