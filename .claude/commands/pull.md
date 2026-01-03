# Sync Local with Remote

Pull latest changes from remote repository.

## Steps:

```bash
# 1. Fetch all remote changes
git fetch --all

# 2. Check current branch
git branch --show-current

# 3. Pull latest changes for current branch
git pull origin $(git branch --show-current)

# 4. If you want to update main and staging too:
git checkout main
git pull origin main

git checkout staging
git pull origin staging

# 5. Go back to your feature branch
git checkout feature/your-branch-name
```

## If there are merge conflicts:

```bash
# 1. See which files have conflicts
git status

# 2. Open conflicting files and resolve conflicts
# Look for <<<<<<< HEAD, =======, >>>>>>> markers

# 3. After resolving, stage the files
git add <resolved-file>

# 4. Complete the merge
git commit -m "merge: resolve conflicts with main/staging"
```

## After pulling:
1. Run `npm install` if package.json changed
2. Run `npx convex dev` if schema changed
3. Test that everything still works
