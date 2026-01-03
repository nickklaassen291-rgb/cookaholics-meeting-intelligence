# Create New Feature Branch

Create a new feature branch from staging.

## Steps:

```bash
# 1. Make sure you're on staging and it's up to date
git checkout staging
git pull origin staging

# 2. Create new feature branch
# Format: feature/task-X-description
git checkout -b feature/task-X-description

# Examples:
# git checkout -b feature/task-2-meeting-management
# git checkout -b feature/task-3-audio-upload
# git checkout -b fix/transcription-error
```

## Branch naming conventions:
- `feature/task-X-description` - New features from task list
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `style/description` - Styling changes
- `docs/description` - Documentation updates

## After creating branch:
1. Start implementing the feature
2. Test on localhost
3. Run `/security` check
4. Run `/ship` to commit and push
5. Create PR to staging
