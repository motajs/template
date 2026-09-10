# Common/Data-Common Cycle Closure Contract

## Approved decision

The approved minimal closure is to move `IFacedTileLocator` into the existing
`@user/data-common` package. It is added to
`packages-user/data-common/src/common/types.ts`, remains exported through
`packages-user/data-common/src/common/index.ts` and the package root, and keeps
its existing shape: `x`, `y`, and the numeric-compatible `FaceDirection`
`direction` field.

The implementation removes `IFacedTileLocator` from
`packages/common/src/utils/types.ts` and removes the corresponding
`@motajs/common` imports from data-layer consumers. No `@user/common` package
or new public package is created. The existing data-common public behavior and
export path are preserved; only the owner of this interface moves to the
already-existing data-common public boundary.

## Exact affected paths

- `packages/common/src/utils/types.ts`: remove the `@user/data-common`
  `FaceDirection` import and the `IFacedTileLocator` declaration
- `packages-user/data-common/src/common/types.ts`: define
  `IFacedTileLocator extends ITileLocator` with `direction: FaceDirection`
- `packages-user/data-common/src/store/types.ts`: consume the local public
  data-common type
- `packages-user/data-base/src/hero/types.ts`: import the locator from
  `@user/data-common`
- `packages-user/data-base/src/hero/state.ts`: import the locator from
  `@user/data-common`
- `packages-user/data-base/src/hero/location.ts`: import the locator from
  `@user/data-common`
- `packages-user/data-base/src/hero/follower.ts`: import the locator from
  `@user/data-common`

## Circular gate policy

The current 13 cycles that pass through
`packages/common/src/utils/types.ts:1` between `@motajs/common` and
`@user/data-common` are all **失败** items. They must not be retained or
silently allowed as a common base dependency.

Per D-20, the circular gate covers all four data packages
(`data-common`, `data-base`, `data-system`, and `data-state`) internally and at
their mutual boundaries, plus the transitive `@motajs/common` boundary they
consume. Any `common/data-common` cycle and any cycle within that transitive
common graph is a gate failure. `@motajs/common` itself must first be proven
acyclic; a common-only cycle is not an allowed exception.

Only render-only or explicitly legacy-only cycles outside the four-package and
transitive-common graph remain outside this phase's D-20 scope. This exclusion
does not permit the current common/data-common cycles to remain.

## Approval record

- **Decision:** approved `numeric-compatible-field` by moving
  `IFacedTileLocator` into the existing `@user/data-common` package
- **User clarification:** do not create `@user/common`; remove the dependency
  from `@motajs/common`
- **Status:** approved; no unresolved contract placeholder remains
