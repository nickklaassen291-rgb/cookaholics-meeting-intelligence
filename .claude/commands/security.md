# Security Check

Run security checks on the codebase before committing.

## Checklist:

### 1. Environment Variables
- [ ] No API keys in frontend code (check for hardcoded keys)
- [ ] All secrets are in .env.local (not committed)
- [ ] .env.example has placeholders only

### 2. Authentication
- [ ] All pages except landing require auth (check middleware.ts)
- [ ] Admin pages require admin role
- [ ] Department pages check department membership

### 3. Data Access
- [ ] Users see only their department's meetings (unless MT)
- [ ] MT can see all departments
- [ ] Action items visible to: owner, department head, MT
- [ ] Reports: department reports to department, MT reports to MT

### 4. API Routes
- [ ] All API routes validate session
- [ ] Convex mutations check user permissions
- [ ] No sensitive data exposed in client queries

### 5. File Uploads
- [ ] File uploads validated (type, size)
- [ ] Only allowed file types: mp3, m4a, wav
- [ ] Max file size enforced (100MB)

### 6. Run automated checks:
```bash
# Check for secrets in code
grep -r "sk_" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".env"
grep -r "pk_" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".env"

# Check for exposed API keys
grep -r "OPENAI_API_KEY" --include="*.ts" --include="*.tsx" pages/ components/
grep -r "ANTHROPIC_API_KEY" --include="*.ts" --include="*.tsx" pages/ components/

# Lint check
npm run lint
```

## If issues found:
1. Fix the security issue immediately
2. Document what was fixed
3. Re-run security check
