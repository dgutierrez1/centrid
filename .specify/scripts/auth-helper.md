# Auth Helper for UI Verification

**Usage**: Include in any UI verification workflow (verify-ui, verify-design, design-iterate)

**Location**: `.specify/test-users.json`

---

## Auto-Auth Pattern

```javascript
// 1. Load test users
const testUsers = JSON.parse(
  await Read({ file_path: "/Users/daniel/Projects/misc/centrid/.specify/test-users.json" })
);
const primaryUser = testUsers.users[0];
const authConfig = testUsers.auth;

// 2. Check if authenticated
const snapshot = await mcp__playwright-contexts__browser_snapshot({ contextId });

if (!snapshot.includes(authConfig.successIndicator)) {
  // 3. Not authenticated - try login
  await mcp__playwright-contexts__browser_navigate({
    contextId,
    url: `http://localhost:3000${authConfig.loginUrl}`
  });

  await mcp__playwright-contexts__browser_type({
    contextId,
    selector: "[data-testid='email-input']",
    text: primaryUser.email
  });

  await mcp__playwright-contexts__browser_type({
    contextId,
    selector: "[data-testid='password-input']",
    text: primaryUser.password
  });

  await mcp__playwright-contexts__browser_click({
    contextId,
    selector: "[data-testid='login-button']"
  });

  await mcp__playwright-contexts__browser_wait_for({
    contextId,
    selector: authConfig.successIndicator,
    state: "visible",
    timeout: authConfig.loginTimeout
  });

  // 4. If login failed, try signup
  const postLoginSnapshot = await mcp__playwright-contexts__browser_snapshot({ contextId });

  if (!postLoginSnapshot.includes(authConfig.successIndicator)) {
    // Login failed - create account
    await mcp__playwright-contexts__browser_navigate({
      contextId,
      url: `http://localhost:3000${authConfig.signupUrl}`
    });

    await mcp__playwright-contexts__browser_type({
      contextId,
      selector: "[data-testid='name-input']",
      text: primaryUser.name
    });

    await mcp__playwright-contexts__browser_type({
      contextId,
      selector: "[data-testid='email-input']",
      text: primaryUser.email
    });

    await mcp__playwright-contexts__browser_type({
      contextId,
      selector: "[data-testid='password-input']",
      text: primaryUser.password
    });

    await mcp__playwright-contexts__browser_click({
      contextId,
      selector: "[data-testid='signup-button']"
    });

    await mcp__playwright-contexts__browser_wait_for({
      contextId,
      selector: authConfig.successIndicator,
      state: "visible",
      timeout: authConfig.loginTimeout
    });
  }
}

// 5. Verified authenticated - proceed with test
```

---

## Compact Version (for commands)

```markdown
### Auth Setup (Auto-Retry)

**Load test users**: `.specify/test-users.json`

**Auto-auth logic**:
1. Check for auth indicator (`[data-testid='user-menu']`)
2. If missing → Navigate to `/auth/login`
3. Fill credentials (email, password from test-users.json)
4. Click login → Wait for success indicator
5. If login fails → Navigate to `/auth/signup`
6. Fill signup form → Create account
7. If both fail → ERROR and STOP

**Result**: Authenticated session ready for testing
```

---

## When to Use

**Use in these commands**:
- `/speckit.verify-ui` - Before executing flows (Step 3)
- `/speckit.verify-design` - Before taking screenshots (Step 3)
- `/speckit.design-iterate` - Before re-screenshotting (Step 2)

**Pattern**: Always check auth BEFORE navigating to feature routes

---

## Troubleshooting

**Auth indicator not found after login**:
- Check selector in test-users.json matches actual UI
- Verify login/signup routes are correct
- Check for email confirmation requirements

**Both login and signup fail**:
- STOP test execution
- Report auth failure to user
- Provide manual auth instructions
