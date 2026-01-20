# Install with npm (Alternative to pnpm)

Since `pnpm install` isn't working, let's use `npm` instead. It works the same way, just a bit slower.

## Quick Install

Run these commands in your terminal:

```bash
# 1. Navigate to v2 folder
cd /Users/andrew/Downloads/Recepcionista.com/v2

# 2. Install root dependencies
npm install

# 3. Install web app dependencies
cd apps/web
npm install
cd ../..

# 4. Install voice service dependencies
cd apps/voice
npm install
cd ../..
```

## Or use npm workspaces (better)

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2
npm install
```

This should install everything because npm automatically detects the workspace structure.

---

## What you'll see

With npm, you'll see clear output:

```
added 1234 packages, and audited 1235 packages in 45s
```

Much clearer than pnpm!

---

## After installation

Once `npm install` completes, you should see:
- `node_modules/` folder in root
- `apps/web/node_modules/` folder
- `apps/voice/node_modules/` folder

Then you can continue with:
```bash
# Generate NextAuth secret
openssl rand -base64 32

# Set up database
# (we'll do this next)
```

---

**Try `npm install` - it will definitely show you what's happening!**
