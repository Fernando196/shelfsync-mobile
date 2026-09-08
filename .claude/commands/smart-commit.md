Analyze all pending git changes and create smart, grouped commits with conventional commit prefixes.

## Steps

1. Run `git status` to get the full list of modified and untracked files.

2. Run `git diff` on every modified file to understand what actually changed.

3. For untracked directories/files, list their contents to understand what they are.

4. **Group the files** by relation — files that belong to the same concern go in the same commit. Use this logic:
   - Same feature or domain (e.g. all order-related components)
   - Same layer (e.g. multiple type files, multiple pages)
   - Same tooling concern (e.g. config files, linting, deps)
   - If a file has no clear relation to any other changed file → its own commit

5. **Pick the right prefix** for each group:
   - `feat:` — new feature or new file that adds capability
   - `fix:` — bug fix
   - `refactor:` — restructuring without behavior change
   - `chore:` — tooling, config, deps, build changes
   - `style:` — Tailwind/CSS-only changes, no logic
   - `types:` — TypeScript type definitions only
   - `docs:` — documentation only

6. **Before committing**, show the user the proposed grouping and commit messages as a plan:

```
Proposed commits:
  1. feat: ...    →  file-a.vue, file-b.vue
  2. chore: ...   →  package.json, nuxt.config.ts
  3. types: ...   →  app/types/order.type.ts
```

Ask: "Proceed with these commits? (yes / adjust)"

7. If confirmed, stage and commit each group in order using:
```bash
git add <files> && git commit -m "<message>"
```

Commit messages must be in **English**, concise (under 72 chars). Do **not** add any `Co-Authored-By` line.

8. Run `git log --oneline -8` at the end to confirm all commits landed correctly.
