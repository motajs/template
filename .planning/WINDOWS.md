---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-09-08T15:54:23.173Z
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
  }
]
````
