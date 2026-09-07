# Testing Patterns

**Analysis Date:** 2026-09-07

## Test Framework

**Runner:**
- [Vitest](https://vitest.dev) `^4.0.18` — declared in `package.json` `devDependencies`

**Config:** None present. There is **no** `vitest.config.ts`, `vitest.config.js`, `vitest.setup.*`, or any test-related config file anywhere in the repo. Vitest would run with its default configuration (files matching `**/*.{test,spec}.?(c|m)[jt]s?(x)`).

**Assertion Library:**
- Vitest's bundled assertions (`expect`), plus Jest-compatible `describe`/`it`/`test` globals. No `@testing-library/*`, `jsdom`, or `happy-dom` is installed.

**Run Commands (`package.json`):**
```bash
pnpm test              # Run all tests (runs `vitest`)
```

There is **no** dedicated watch mode or coverage script. To run watch/coverage manually:
```bash
pnpm vitest --watch    # Watch mode
pnpm vitest --coverage # Coverage (requires @vitest/coverage-* provider, not installed)
```

## Test File Organization

**Location:** No test files currently exist in the repository. A repo-wide search for `*.test.ts`, `*.spec.ts`, `*.test.tsx`, `*.spec.tsx` returns zero matches.

**Planned location (per `.agents/review.md`):** test-case design documents live in `docs/test/` (with subfolders where appropriate), following the example template `docs/test/template.md`. **Note:** the `docs/test/` directory and `docs/test/template.md` do not exist yet — the workflow is defined but no tests have been authored.

**Naming:** No established on-disk convention yet. Follow the Vitest default: co-located `*.test.ts` (or `*.spec.ts`) next to the module under test, or a `__tests__/` directory.

## Test Structure

No test source exists to extract a concrete pattern from. The authoritative testing *workflow* is defined in `.agents/review.md` and is a **manual, human-in-the-loop** process:

1. The user requests tests for a feature.
2. The agent analyzes the feature and proposes test cases in a markdown document (placed in `docs/test/`, following `docs/test/template.md`).
3. The user reviews the proposal over several rounds until the plan is finalized.
4. The agent writes the test cases from the document. The agent **must not** run the test command; the user runs it.
5. The user reports results; simple issues are fixed by the user, complex ones may be handed back to the agent.

**Test-case design principle (from `.agents/review.md`):** test cases must cover **valid inputs AND invalid inputs / exception paths**. For invalid paths, the expectation is usually that the system either throws correctly or produces a sensible `logger` output (rather than silently returning a wrong value).

**Document structure for a test-case proposal:**
```md
# 测试目的

测试 XXX 系统的基本功能及异常处理。

# 测试用例

## 测试用例 1

- 设计目的：为什么需要这一测试用例（其来源/推导），而非它做什么。
- 针对接口：最重要的若干接口，最好五个以内。

### 测试内容

描述测试内容，并写出预期结果。
```

## Mocking

**Framework:** None configured. Vitest provides `vi.mock()`, `vi.fn()`, `vi.spyOn()` which are available without extra deps, but no project-specific mocking pattern exists yet.

**Relevant for future tests — the `logger.catch` mechanism** (`packages/common/src/logger.ts:189`): the engine routes all errors/warnings through the `logger` singleton rather than throwing. Tests can therefore assert error behavior via `logger.catch(fn)` which returns `{ ret, info }` (captured messages) instead of expecting exceptions. The logger also exposes `disable()`/`enable()` to silence output during tests.

**What to Mock (prospective):** browser globals (`document`, `window`, `main`, `Mota`) since much engine code references them at module load (e.g. `packages/common/src/logger.ts:24-40` references `main.replayChecking` and `document`). Data-layer packages (`@user/data-base`, `@user/data-system`, `@user/data-common`) are designed to run in Node for replay verification, so they are the most unit-testable without a DOM.

**What NOT to Mock (prospective):** the data-layer interfaces themselves (`IDataCommon`, `IDataBase`, `IDataSystem`) — they are designed to be instantiated in Node and driven through their interfaces.

## Fixtures and Factories

**Test Data:** No fixtures or factory helpers exist yet. Note the engine's `createXxx` factory convention (`dev.md` "模块初始化"): if a module needs initialization, expose a `createXxx` function wired up through `index.ts`. Test setup would follow this pattern rather than relying on module side effects (which are forbidden by `dev.md` "无副作用").

**Location:** `docs/test/` (for design docs); no fixture directory established.

## Coverage

**Requirements:** None enforced. No coverage script, no coverage provider installed, no CI coverage gate.

**View Coverage:** not available without installing a `@vitest/coverage-*` provider and running `pnpm vitest --coverage`.

## Test Types

**Unit Tests:**
- Not yet written. The layered data-side packages (`@user/data-common`, `@user/data-base`, `@user/data-system`) are explicitly designed to run in Node ("数据端可在 node 环境中单独运行" — `dev.md` "双端分离"), making them the natural first targets for unit tests.

**Integration Tests:**
- Not present. The `IDataCommon` / `IDataBase` / `IDataSystem` layer interfaces (`packages-user/data-common/src/types.ts`, `packages-user/data-system/src/types.ts`) form a seam where integration tests could assemble a full data-side stack in Node.

**E2E Tests:**
- Not used. No Playwright/Cypress. The closest is the replay-verification system (`packages-user/data-common/src/replay/`) which validates that gameplay is deterministic, but it is a runtime feature, not a test harness.

## CI

- `.github/workflows/page.yml` only builds and deploys static content to GitHub Pages; it runs `pnpm build`, **not** tests.
- `.github/workflows/codeql.yml` runs CodeQL static analysis; **not** unit tests.
- There is currently **no CI step that runs the test suite** (and no committed test suite to run).

## Common Patterns

**Async Testing (prospective):** the engine is heavily `async`/`await`-based (see `ObjectMover.moveProgress` in `packages-user/data-common/src/common/mover.ts:626`). Use `await` inside `it` blocks and `Promise.withResolvers()`/`expect(...).resolves` patterns as appropriate.

**Error Testing (prospective):** prefer `logger.catch(() => { ... })` and assert on `info` (the captured `{ level, message, code }[]`) rather than expecting thrown exceptions — the engine is designed to never throw in normal operation.

**Determinism (the engine's own "testing" philosophy):** the replay system in `packages-user/data-common/src/replay/` exists to guarantee that a gameplay run is reproducible. When writing tests for game logic, favor deterministic data-driven inputs so results can be asserted exactly.

---

*Testing analysis: 2026-09-07*
