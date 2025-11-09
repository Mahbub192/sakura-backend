# Render Build Command Alternatives

If you're experiencing build issues with NestJS on Render, try these build commands in order:

## Option 1: Direct Path (Recommended)
```
npm install && ./node_modules/.bin/nest build
```

## Option 2: TypeScript Compiler (If Option 1 fails)
```
npm install && tsc -p tsconfig.build.json
```

## Option 3: Using node to run nest CLI
```
npm install && node node_modules/@nestjs/cli/bin/nest.js build
```

## Option 4: Move CLI to dependencies (Last Resort)

If none of the above work, you can temporarily move `@nestjs/cli` from `devDependencies` to `dependencies` in `package.json`, then use:
```
npm install && nest build
```

**Note**: After successful deployment, you can move it back to `devDependencies`.

## How to Change Build Command in Render

1. Go to your Web Service in Render Dashboard
2. Click on "Settings" tab
3. Scroll to "Build & Deploy" section
4. Find "Build Command" field
5. Replace with one of the options above
6. Click "Save Changes"
7. Render will automatically redeploy

