# Agent Instructions

## Style

Follow the [ScottyStack Style Guides](https://github.com/ScottyLabs/ScottyStack/wiki/Style-Guides)
for code style, formatting, and project conventions.

## Commits

When the agent creates a commit, it must include itself as a co-author in the
commit message footer:

```text
Co-authored-by: Cursor <cursoragent@cursor.com>
```

Use a HEREDOC (or equivalent) so the trailer is appended after the commit body,
separated by a blank line.

Example:

```bash
git commit -m "$(cat <<'EOF'
feat: add example feature

Brief explanation of why this change was made.

Co-authored-by: Cursor <cursoragent@cursor.com>
EOF
)"
```

## Testing

Behavior is covered at four seams. Put a new test at the seam that observes that behavior.

- **access-control** (`packages/access-control/test/`) — public `can*` helpers. Actors are guest, owner, stranger, and admin. Skip `drizzleWhere`.
- **server HTTP** (`apps/server/test/`) — supertest against the real Express app, PGlite, Bearer JWT with mocked JWKS. Assert status codes. Seed `user` + `account` (`accountId` = JWT `sub`) and truncate between tests.
- **web** (`apps/web/tests/`) — Vitest + Testing Library. MSW at `VITE_SERVER_URL`, including `GET /api/auth/get-session`. Use `renderApp` (QueryClient + router).
- **userflow** (`e2e/`) — Playwright through the browser against a local stack (PGlite socket, real server, `vite preview`). Signed-in flows inject a Better Auth session cookie; they do not talk to Keycloak.

`bun run test` is Turbo Vitest only. Userflow is `bun run test:e2e`, which GitHub Actions runs as the End-to-end Test job.
