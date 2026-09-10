---
schema_version: 1
open_count: 4
waived_count: 0
fixed_count: 2
total_count: 6
last_updated: 2026-09-10T01:38:48.570Z
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
  }
]
````
