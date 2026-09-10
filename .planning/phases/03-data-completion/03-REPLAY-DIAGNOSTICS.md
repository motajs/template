# Phase 3 Plan 04: Replay Diagnostics

## Approval

`approve-locked-contract` was received for the first-divergence verifier
diagnostic. This record is implementation-local to the Node verifier and does
not define a new public replay error mechanism.

## Locked failure behavior

The verifier stops immediately at the first replay divergence and throws an
implementation-local error. The stop conditions are:

- an unknown command code;
- a command returning `false`;
- a command throwing; or
- a final hero or map snapshot mismatch after the sandbox has ended normally.

The existing replay command contract remains `execute(step): Promise<boolean>`.
The replay command interface is not changed to carry diagnostics. The verifier
does not add a user-facing error class, a public diagnostic-return object,
logging-only failure handling, or continued execution after a divergence.

## Required diagnostic fields

Every thrown verifier-local diagnostic reports exactly the locked diagnostic
information needed for triage:

| Field | Meaning |
| --- | --- |
| `index` | The first divergent command index. For an end-only snapshot mismatch, this is the route index at which final verification reports the mismatch. |
| `code` | The top-level stable replay enum code from Plan 03. An unknown code is reported unchanged rather than being inferred or renumbered. |
| `params` | The original route parameters for the reported command, before diagnostic formatting. |
| `reason` | A readable explanation of the first divergence. |

The verifier may display `params` using a deterministic safe representation for
diagnostic output. This representation must preserve parameter order and
primitive meaning, handle `bigint` without lossy JSON conversion, and avoid
executing or invoking user-provided behavior. It is display formatting only; it
does not alter the replay route or the public `Promise<boolean>` contract.

## Scope boundary

This record approves the local thrown diagnostic and its four fields only. It
does not establish a public error class, a public diagnostic interface, a
diagnostic-return API, new replay command codes, or additional output fields.
