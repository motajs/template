---
schema_version: 1
open_count: 14
waived_count: 0
fixed_count: 3
total_count: 17
last_updated: 2026-09-10T09:18:59.589Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | packages-user/data-state/src/core.ts | 153 | Serialized event registration and map-id binding remains an intentional deferred TODO. | open |  | 2026-09-08T15:06:40.634Z |  |
| 2 | 01 | unrun-verify | .planning/phases/01-event/01-05-SUMMARY.md |  | Downstream implementation verification was not run because the user explicitly prohibited downstream plan execution. | open |  | 2026-09-08T15:37:54.227Z |  |
| 3 | 01 | deviation | packages-user/data-base/src/map/mapLayer.ts |  | Replaced unsupported Map upsert runtime calls so the raw map event path runs under Node Vitest. | open |  | 2026-09-08T15:54:23.173Z |  |
| 4 | 02 | skipped-test | packages-user/data-common/src/common/mover.test.ts |  | 4 个 it.skip 坐标回写回归用例（x/y 正交、斜向、传送），待 02-02 修复 mover.ts:651 后翻绿 | fixed |  | 2026-09-09T07:51:25.555Z | 2026-09-09T09:34:39.843Z |
| 5 | 02 | stub | packages-user/data-system/src/path/system.ts | 254 | interrupt() is an intentional placeholder that only stops the in-flight move; takeover sequencing (stop-then-await per approved option 1) is implemented by 02-03 Task 4 | fixed |  | 2026-09-09T09:34:59.707Z | 2026-09-09T13:24:24.755Z |
| 6 | 02 | stub | packages-user/data-state/src/hero/moverImpl.ts | 284 | Existing cannotEnter() is intentionally empty because no event trigger corresponds to movement blocked by an impassable mask; D-08 direct OnTouch dispatch handles allowed adjacent no-pass targets. | open |  | 2026-09-10T01:38:48.570Z |  |
| 7 | 03 | stub | packages-user/data-common/src/save/memory.ts | 90 | MemorySaveSystem.saveAutosaveToDB is an intentional no-op because Node never persists to IndexedDB. | open |  | 2026-09-10T07:45:16.944Z |  |
| 8 | 03 | stub | packages-user/data-common/src/save/memory.ts | 90 | MemorySaveSystem.saveAutosaveToDB is an intentional no-op because Node never persists to IndexedDB. | open |  | 2026-09-10T07:45:32.524Z |  |
| 9 | 03 | stub | packages-user/data-state/src/legacy/dependencies.ts | 53 | Node legacy dependency boundary intentionally registers no browser loading callbacks. | open |  | 2026-09-10T07:45:33.228Z |  |
| 10 | 03 | deviation | packages-user/data-base/src/map/mapLayer.ts | 216 | Replaced Map.getOrInsertComputed with explicit Map lookup so the replay event path is Node-safe without a global prototype shim. | open |  | 2026-09-10T07:45:33.930Z |  |
| 11 | 03 | unrun-verify | .planning/phases/03-data-completion/deferred-items.md |  | Repository type gate remains non-zero on pre-existing render/legacy and Tile contract diagnostics; owned Node tracer and data tests pass. | fixed |  | 2026-09-10T07:45:45.249Z | 2026-09-10T07:58:56.466Z |
| 12 | 03 | unrun-verify | .planning/phases/03-data-completion/deferred-items.md |  | Repository type gate remains non-zero on pre-existing render/legacy diagnostics; Tile contract diagnostics are resolved. | open |  | 2026-09-10T07:58:50.208Z |  |
| 13 | 03 | deviation | packages-user/data-common/src/store/tileStore.test.ts |  | Applied ESLint/Prettier CRLF formatting required by the project after functional Tile tests passed. | open |  | 2026-09-10T07:59:02.467Z |  |
| 14 | 03 | stub | packages-user/data-state/src/core.ts | 166 | Existing deferred serialized event registration and map-event-id binding TODO; preserved by Plan 03-03. | open |  | 2026-09-10T08:47:49.808Z |  |
| 15 | 03 | deviation | packages-user/data-common/src/replay/array.ts |  | Repaired replay parameter encoding so diagnostic params remain original and deterministic. | open |  | 2026-09-10T09:18:58.279Z |  |
| 16 | 03 | deviation | packages-user/data-state/test/replayVerifier.ts |  | Added a package-local verifier harness shared by Vitest and the Node runner to avoid composite-script import resolution. | open |  | 2026-09-10T09:18:58.946Z |  |
| 17 | 03 | deviation | packages-user/data-state/test/fixtures/closed-loop.ts |  | Applied repository Prettier/CRLF formatting to the fixed replay fixture and runner files. | open |  | 2026-09-10T09:18:59.589Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "packages-user/data-state/src/core.ts",
    "line": 153,
    "description": "Serialized event registration and map-id binding remains an intentional deferred TODO.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T15:06:40.634Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "01",
    "file": ".planning/phases/01-event/01-05-SUMMARY.md",
    "line": null,
    "description": "Downstream implementation verification was not run because the user explicitly prohibited downstream plan execution.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T15:37:54.227Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "01",
    "file": "packages-user/data-base/src/map/mapLayer.ts",
    "line": null,
    "description": "Replaced unsupported Map upsert runtime calls so the raw map event path runs under Node Vitest.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T15:54:23.173Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "skipped-test",
    "phase": "02",
    "file": "packages-user/data-common/src/common/mover.test.ts",
    "line": null,
    "description": "4 个 it.skip 坐标回写回归用例（x/y 正交、斜向、传送），待 02-02 修复 mover.ts:651 后翻绿",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-09T07:51:25.555Z",
    "resolved_at": "2026-09-09T09:34:39.843Z"
  },
  {
    "id": 5,
    "kind": "stub",
    "phase": "02",
    "file": "packages-user/data-system/src/path/system.ts",
    "line": 254,
    "description": "interrupt() is an intentional placeholder that only stops the in-flight move; takeover sequencing (stop-then-await per approved option 1) is implemented by 02-03 Task 4",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-09T09:34:59.707Z",
    "resolved_at": "2026-09-09T13:24:24.755Z"
  },
  {
    "id": 6,
    "kind": "stub",
    "phase": "02",
    "file": "packages-user/data-state/src/hero/moverImpl.ts",
    "line": 284,
    "description": "Existing cannotEnter() is intentionally empty because no event trigger corresponds to movement blocked by an impassable mask; D-08 direct OnTouch dispatch handles allowed adjacent no-pass targets.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T01:38:48.570Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "stub",
    "phase": "03",
    "file": "packages-user/data-common/src/save/memory.ts",
    "line": 90,
    "description": "MemorySaveSystem.saveAutosaveToDB is an intentional no-op because Node never persists to IndexedDB.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T07:45:16.944Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "stub",
    "phase": "03",
    "file": "packages-user/data-common/src/save/memory.ts",
    "line": 90,
    "description": "MemorySaveSystem.saveAutosaveToDB is an intentional no-op because Node never persists to IndexedDB.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T07:45:32.524Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "stub",
    "phase": "03",
    "file": "packages-user/data-state/src/legacy/dependencies.ts",
    "line": 53,
    "description": "Node legacy dependency boundary intentionally registers no browser loading callbacks.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T07:45:33.228Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "03",
    "file": "packages-user/data-base/src/map/mapLayer.ts",
    "line": 216,
    "description": "Replaced Map.getOrInsertComputed with explicit Map lookup so the replay event path is Node-safe without a global prototype shim.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T07:45:33.930Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "03",
    "file": ".planning/phases/03-data-completion/deferred-items.md",
    "line": null,
    "description": "Repository type gate remains non-zero on pre-existing render/legacy and Tile contract diagnostics; owned Node tracer and data tests pass.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-10T07:45:45.249Z",
    "resolved_at": "2026-09-10T07:58:56.466Z"
  },
  {
    "id": 12,
    "kind": "unrun-verify",
    "phase": "03",
    "file": ".planning/phases/03-data-completion/deferred-items.md",
    "line": null,
    "description": "Repository type gate remains non-zero on pre-existing render/legacy diagnostics; Tile contract diagnostics are resolved.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T07:58:50.208Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "deviation",
    "phase": "03",
    "file": "packages-user/data-common/src/store/tileStore.test.ts",
    "line": null,
    "description": "Applied ESLint/Prettier CRLF formatting required by the project after functional Tile tests passed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T07:59:02.467Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "stub",
    "phase": "03",
    "file": "packages-user/data-state/src/core.ts",
    "line": 166,
    "description": "Existing deferred serialized event registration and map-event-id binding TODO; preserved by Plan 03-03.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T08:47:49.808Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "03",
    "file": "packages-user/data-common/src/replay/array.ts",
    "line": null,
    "description": "Repaired replay parameter encoding so diagnostic params remain original and deterministic.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T09:18:58.279Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "03",
    "file": "packages-user/data-state/test/replayVerifier.ts",
    "line": null,
    "description": "Added a package-local verifier harness shared by Vitest and the Node runner to avoid composite-script import resolution.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T09:18:58.946Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "deviation",
    "phase": "03",
    "file": "packages-user/data-state/test/fixtures/closed-loop.ts",
    "line": null,
    "description": "Applied repository Prettier/CRLF formatting to the fixed replay fixture and runner files.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T09:18:59.589Z",
    "resolved_at": null
  }
]
````
