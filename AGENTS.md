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
