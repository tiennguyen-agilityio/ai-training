---
paths:
  - 'src/**/*.test.{ts,tsx}'
  - 'jest.config.ts'
  - 'jest.setup.ts'
---

# Testing rules

- **Runner.** Jest + React Testing Library under jsdom (`jest.fn`, `jest.mocked`), not Vitest. `@repo/*` map to the package `src` through `moduleNameMapper` in `jest.config.ts`.
- **Files.**
  - Names are `*.test.ts` / `*.test.tsx`, never `.spec`.
  - Existing tests stay where they are.
  - A new test goes where that folder's tests already live: a `__tests__/` folder where the folder has one (`src/components/ui/__tests__/`, `src/hooks/__tests__/`, `src/services/__tests__/`, `src/components/Table/__tests__/`, …; `src/theme/__test__/` is singular), otherwise a co-located `<Name>.test.tsx`.
- **Queries.** New tests query by role and name with `userEvent.setup()` and assert against `ROUTES.*` and `ERROR_MESSAGES.*`, not literals; older tests also use `getByText`, `getByTestId`, `fireEvent` and literal paths.
- **Mocks.**
  - Modules: `next/navigation`, `next/image` (a plain `<img>`), `sonner`, `@clerk/*`.
  - App hooks: `jest.mocked(useHook).mockReturnValue(…)` (a few tests forward to a `jest.fn()` from the `jest.mock` factory).
  - Service tests: a `globalThis.fetch` mock, restored in `afterEach`; component and hook tests may `jest.mock('@/services/…')`.
  - Mock reset style (`jest.clearAllMocks()` and the like) is not prescribed: few test files call it, and `jest.config.ts` sets no `clearMocks`. Follow the neighbouring tests.
- **React Query.** A local `QueryClient` with `retry: false` (`src/app/dashboard/categories/add/page.test.tsx`).
- **What to test.**
  - A service change: the URL and `credentials: 'include'` (`src/services/__tests__/category.test.ts`), and the `Authorization` header (`src/services/__tests__/public-reads.test.ts`).
  - A hook change: the query keys and the error message.
  - A page or form change: render → validate → submit → `router.push`.
- **Coverage.** Only files a test imports are measured, so every new `src/` file gets a test.
- **Integrity.** No `.only`, `.skip` or `.todo`, and no change to `testPathIgnorePatterns`. `--passWithNoTests` must not hide a narrowed path.
