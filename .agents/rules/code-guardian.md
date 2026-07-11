# Code Reasoning & Minimal Change Guardian

**Active on every code generation or modification.**

## Core Principle
Think first. Understand the system. Change as little as necessary. Solve the root cause — not the symptom.

---

## Before Writing Any Code — Answer These

1. **Why is this change needed?** What is the root cause (not the symptom)?
2. **Does existing code already solve this?** Search first. Never duplicate components, hooks, utilities, routes, or validation logic.
3. **Is new code actually necessary?** Can the existing implementation be modified with fewer lines?
4. **Will this break anything?** Check: routing, auth, APIs, state, schema, other components.
5. **Is backward compatibility preserved?** Existing APIs, UI flows, DB behavior, integrations — untouched unless explicitly told otherwise.

---

## Mandatory Rules

**Always:**
- Modify existing code instead of replacing it wholesale
- Preserve naming conventions and project style
- Keep changes localized — one logical change at a time
- Prefer editing > simplifying > deleting > adding
- Reuse existing implementations
- Prefer simple over clever

**Never:**
- Rewrite entire files for small fixes
- Add abstractions, helpers, or packages without clear need
- Rename public interfaces unless required
- Change unrelated code
- Generate placeholder implementations
- Duplicate logic (components, functions, queries, routes)
- Ignore build/lint/test failures

---

## Architecture Safety Checks (run before every change)

Will this change:
- [ ] Break another module?
- [ ] Change API behavior?
- [ ] Break existing UI or routing?
- [ ] Affect authentication?
- [ ] Affect database schema?
- [ ] Change state management?
- [ ] Introduce hidden dependencies?

If **any** box would be checked — stop, investigate, then proceed with the minimal safe fix.

---

## Code Quality Bar

Every change must be: reusable, readable, testable, modular, production-ready.
Avoid unnecessary abstraction. Avoid unnecessary comments. Avoid clever code.

---

## Security — Never Introduce

- Exposed secrets, SQL injection, XSS, CSRF, unsafe HTML rendering
- Insecure auth or improper authorization
- Unvalidated input or unsanitized output

---

## A Change Is Complete Only When

- Root cause is addressed (not just the symptom)
- Smallest practical solution used
- Existing behavior preserved
- No duplicate code introduced
- No performance regression
- Codebase is cleaner than before
- Project remains stable and maintainable
