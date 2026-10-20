---
paths:
  - "src/**/*.spec.ts"
  - "test/**"
---

# Testing rules

- The runner is **Vitest** (`vi.fn()`, `vi.spyOn()`), not Jest.
- Unit tests sit **next to the source** as `*.spec.ts` and cover controllers, services, and `common/`.
  - Excluded from coverage: configs, migrations, and `common/repositories/`.
- E2E specs live in `test/e2e/*.e2e-spec.ts` and bootstrap the app through `test/utils/init-test-app.util.ts`, which mirrors `main.ts`'s prefix / versioning / route-conflict policy.
- E2E specs build URLs from `API_BASE_PATH` in `test/utils/api-path.util.ts` — **do not hardcode `/api/v1`**.
- Clerk calls during e2e are **expected to fail** against placeholder keys; the code logs and swallows that.
- E2E runs with `fileParallelism: false`.
- Before running e2e, check the database it will truncate — see "E2E specifics" in `CLAUDE.md` and the `verify` skill.
