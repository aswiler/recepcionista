# Troubleshooting pnpm install

## If `pnpm install` seems to do nothing:

### 1. Check you're in the right directory

```bash
pwd
# Should show: /Users/andrew/Downloads/Recepcionista.com/v2

ls package.json
# Should show: package.json
```

### 2. Run with verbose output

```bash
pnpm install --loglevel=debug
```

This will show you EVERYTHING that's happening.

### 3. Try a simple test first

```bash
# Test pnpm works
pnpm --version

# Test it can see the workspace
pnpm list --depth=0
```

### 4. Check for errors

```bash
# Run and capture output
pnpm install 2>&1 | tee install.log

# Then check the log
cat install.log
```

### 5. Try installing just one package

```bash
# Test if pnpm can install anything
pnpm add -w typescript --dry-run
```

---

## Common Issues

### "Command not found: pnpm"
```bash
npm install -g pnpm
```

### "No packages found"
Make sure `pnpm-workspace.yaml` exists and has:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Silent failure
Run with `--loglevel=debug` to see what's happening.

### Hangs forever
- Check your internet connection
- Try: `pnpm install --no-frozen-lockfile`
- Check if npm registry is accessible: `curl https://registry.npmjs.org`

---

## What Success Looks Like

When `pnpm install` works, you'll see:

```
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded XXX, added XXX
Done in XXs
```

And you'll see `node_modules` folders created:
- `v2/node_modules/`
- `v2/apps/web/node_modules/`
- `v2/apps/voice/node_modules/`

---

## Quick Test Script

I've created `test-install.sh` - run it:

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2
./test-install.sh
```

This will diagnose what's wrong.
