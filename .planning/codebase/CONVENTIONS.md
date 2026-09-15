# Coding Conventions

**Analysis Date:** 2026-09-07

> Note: this is a Chinese-language game-engine monorepo (魔塔 / Mota). All in-code comments and docs are written in Chinese, and convention rules are codified in `dev.md` and `.agents/code.md`. Those two files are the source of truth; this document distills them into prescriptive rules for the executor.

## Naming Patterns

The canonical naming table is in `dev.md` under "命名规则".

**Files:**
- Source files (`.ts`, `.tsx`, `.vue`): **camelCase** — e.g. `dirtyTracker.ts`, `faceManager.ts`, `mapStore.ts`
- Markdown doc files: **kebab-case** — e.g. `face-manager.md`, `hero-equipment.md`
- Barrel/entry files are always `index.ts` and `types.ts` (a package's public types live in `types.ts`)

**Functions / Methods / Variables / Members / general constants:** **camelCase**
- `getDamageInfo()`, `setPos()`, `markAllDirty()`, `moveQueue`, `dirtyFlag`

**Classes / Interfaces / Type aliases / Namespaces / Generics / Enums / Components:** **PascalCase**
- `DamageSystem`, `IObjectMover`, `ObjectMoveType`, `LogLevel`, `IDataCommon`

**Immutable constants:** **UPPER_SNAKE_CASE** — e.g. `MAX_COUNT`

**Acronyms (HTTP, URI, etc.):** all-caps

**Interfaces intended to be `implements`-ed:** prefixed with capital `I` — e.g. `IObjectMover`, `IDamageSystem`, `IHookable`, `IDataCommon`

**HTML/CSS `id` / `class`:** kebab-case — e.g. `box-main`, `ui-list`, `border-vertical`

**Never** use underscore prefix for private members/methods. Unused variables/methods use a leading `_` (e.g. `_param`) so they pass the `no-unused-vars` rule.

## Code Style

**Formatting (Prettier 3.8.1) — config in `.prettierrc`:**
```json
{
    "printWidth": 80,
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "singleQuote": true,
    "quoteProps": "as-needed",
    "bracketSpacing": true,
    "vueIndentScriptAndStyle": false,
    "arrowParens": "avoid",
    "trailingComma": "none",
    "endOfLine": "crlf"
}
```
- 4-space indent, single quotes, no trailing commas, `arrowParens: avoid` (e.g. `v => v.x`), **CRLF line endings**
- `.prettierignore` excludes generated/build files (`dist/`, `public/project/*.js`, `script/**/*.js`, `docs/.vitepress/dist`, etc.)

**Linting (ESLint 9 flat config) — `eslint.config.js`:**
- Uses `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-vue` `flat/recommended`, and `eslint-plugin-prettier/recommended` (prettier as the last rule set, so prettier wins)
- `eslint-plugin-react` is loaded for `**/*.{ts,tsx,vue}` files (for JSX/TSX)
- Key rules applied across `**/*.{js,mjs,cjs,vue}`:
  - `no-console`: `warn`
  - `eqeqeq`: `['error', 'always']` (always `===`)
- Key rules for `**/*.{ts,tsx,vue}`:
  - `@typescript-eslint/no-empty-object-type`: `off`
  - `@typescript-eslint/no-explicit-any`: `off`
  - `@typescript-eslint/no-namespace`: `off`
  - `@typescript-eslint/no-this-alias`: `off`
  - `@typescript-eslint/no-unused-vars`: `error` with `argsIgnorePattern: '^_'`, `caughtErrorsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`, `ignoreRestSiblings: true`
  - `vue/multi-word-component-names`: `off`
  - `vue/no-mutating-props`: `error` with `shallowOnly: true`
  - `react/jsx-boolean-value`: `['error', 'never']`
- Ignores: `node_modules`, `dist`, `public`

**Lint scripts** (`package.json`): `pnpm lint:packages` (`eslint packages/`), `pnpm lint:user` (`eslint packages-user/`), `pnpm lint:custom` (bare `eslint`)

## Import Organization

**Order (not enforced by a plugin, but observed in practice):** third-party libraries first, then aliased `@motajs/*` / `@user/*` imports, then relative `./` imports. Example from `packages-user/data-system/src/combat/damage.ts`:
```ts
import { clamp } from 'lodash-es';
import { ITileLocator, logger } from '@motajs/common';
import { ... } from './types';
import { ... } from '@user/data-base';
```

**Path Aliases** (defined in `tsconfig.json` and `vite.config.ts`):
- `@motajs/*` → `packages/*/src` (core engine)
- `@user/*` → `packages-user/*/src` (user code)

**No `import type`:** per `dev.md` "无类型导入", all imports are normal value imports. The only sanctioned exception is the module-interface registration file `packages-user/entry-data/src/mota.ts`, which uses `import type * as X` deliberately (it only needs types to build the `ModuleInterface` map). Do not introduce `import type` in new code.

**Barrel exports:** each package exposes `index.ts` with `export * from './...'` for its subfolders. Do not re-export content from outside the current package (`dev.md` "不转发导出").

## Error Handling

**Core principle:** errors/warnings are reported through the `logger` singleton — never silently swallowed via `return null` / `return false`.

**Logger** (`packages/common/src/logger.ts`):
- `logger.error(code, ...params)` — fatal-adjacent errors, each with a unique numeric `code`
- `logger.warn(code, ...params)` — warnings, unique numeric `code`
- `logger.log(text)` — informational
- `logger.catch(fn)` — runs `fn` while capturing any errors/warnings it emits, returns `{ ret, info }` without throwing (see `packages/common/src/logger.ts:189`)
- `logger.disable()` / `logger.enable()`

**Error codes are data, not code:** all messages live in `packages/common/src/logger.json`, keyed by `error` / `warn` maps of `code -> message`. Messages use `$1`, `$2` positional placeholders substituted by the params passed to `error`/`warn`. Codes are unique and never reused; do not use code `0`. Internal meta-error for a missing message is code `16` (`logger.error(16, ...)`).

Example usage:
```ts
if (!this.calculator) {
    logger.warn(106);
    return null;
}
```
```ts
if (!obj) {
    logger.warn(85);
    return;
}
```

**The logger never throws and never interrupts execution.** It is designed so a warning/error does not break the game loop or replay verification.

## Logging

**Framework:** the custom `logger` (above), plus `console` directly for debug/tooling in `script/` files. `no-console` is `warn`-level so plain `console.log` in scripts is tolerated but discouraged in library code.

**Patterns:**
- Library/engine code: use `logger.error/warn/log` with a registered code. Do not `throw`.
- A genuine programming fault that must halt (e.g. unknown module in `Mota.require`) may `throw new Error(...)` — see `packages-user/entry-data/src/mota.ts:96`.

## Comments

All comments are written in **Chinese**. Guidelines from `dev.md` "注释规范" and `.agents/code.md` "注释":

- **Public methods/interfaces/members** get jsDoc comments **at the source** (usually the `interface`). Inherited / `implements`-ed members do **not** repeat the comment unless the semantics change.
- **Private methods and private members must be commented** (jsDoc), and private method params must be commented. Exception: constructor parameter-property declarations.
- **Method jsDoc uses multi-line style**; **member jsDoc uses single-line style** when short.
- **No comment on constructors.** No comment on the `interface`/`type alias`/`enum`/`class` itself (only its members).
- **TODO format:** `// TODO:` or `// todo:`.
- Single-line comments: `//` followed by one space. No non-jsDoc multi-line comments — use multiple single-line comments instead.
- **`#region` / `#endregion`** partition long files by function — see `packages/common/src/types.ts`, `packages-user/data-common/src/common/mover.ts`, `packages/common/src/utils/types.ts`.
- Wrap comments reasonably (Chinese chars are wide): ~40–60 chars per line, break at punctuation, keep lines roughly even, no mid-sentence breaks.
- Comments must add value (explain *why* the next line exists), not restate the code (e.g. `// 清空 Xxx` is disallowed).

Example jsDoc (member, single-line):
```ts
/** 怪物生命值 */
hp: number;
```
Example jsDoc (method, multi-line):
```ts
/**
 * 创建只读信息对象
 * @param enemy 怪物对象
 * @param locator 怪物位置
 * @param hero 勇士属性对象
 */
```

## Function Design

**Size:** no hard limit, but single-responsibility is expected. Long classes are partitioned with `#region`.

**Parameters:**
- More than 2 optional params → switch to an object param.
- Unused trailing params are omitted, not named `_` (in method implementations).
- `{@link}` references used in jsDoc to cross-reference related members.

**Return Values:**
- Builder-style chaining methods return `this` (e.g. `step()`, `speed()`, `face()` in `packages-user/data-common/src/common/mover.ts`).
- "May not be available" results return `T | null` and call `logger.warn` rather than throwing.

**Design rules (from `.agents/code.md`):**
- Complete `if - else` when both branches must do work — no early `return` to fake an `else` for same-level conditions.
- Minimal abstraction: local repetition is allowed; do not add indirection just to reduce line count.
- Do not define local functions inside a function unless a function argument is required.
- Avoid `getter`/`setter` (only for operator-method scenarios).
- Avoid `?.` except (1) side-effect calls like `this.obj?.func()`, (2) object "Required"-ification like `{ value: obj?.value ?? 0 }`.
- Do not line-break ternary expressions or `private readonly` members.
- Single-property destructuring is disallowed — write `const value = obj.value` instead of `const { value } = obj`.

## Module Design

**Exports:** barrel `index.ts` with `export * from './subdir'` and `export * from './types'`. Each package's public types are in `types.ts`.

**Module principles (`dev.md` "模块原则"):**
- **No side effects** in modules: only function/class/constant declarations; no exported `let`/`var`, no top-level execution.
- **No circular imports** (checked by `pnpm check:circular` via `madge`; config `.madgerc`).
- **No re-export** of content outside the current package.
- **One class per file.** Multiple small implementations of the same interface may share a file only with explicit approval.

**Type rules (`dev.md` "类型规范"):**
- No unnecessary `any` (though `no-explicit-any` is `off`, it's still discouraged).
- All class members have explicit type annotations.
- Unavoidable type errors → `// @ts-expect-error` + explanation (see `packages-user/entry-data/src/mota.ts:137`).
- Avoid `as`; never chain `as unknown as`.
- Function types → separate `type` alias (unless <20 chars).
- Object types → separate `interface`, never an inline object type.
- Object members use interface types, not class types (`map: IGameMap` not `map: GameMap`).
- Enums use `const enum` for zero-runtime-cost (e.g. `LogLevel`, `ObjectMoveType`, `ObjectSpecialStep`).

**Architecture constraint:** rendering side never pushes updates to the data side; it only observes via hooks. Data-side code calling render-side code must wrap it in `Mota.r(() => {})` / `Mota.rf(fn)` (see `packages-user/entry-data/src/mota.ts`).

---

*Convention analysis: 2026-09-07*
