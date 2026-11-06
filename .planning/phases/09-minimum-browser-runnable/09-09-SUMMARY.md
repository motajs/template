---
phase: 09-minimum-browser-runnable
plan: 9
subsystem: ui
tags: [vue, tsx, shop, shop-state, shop-system, render-vue]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 用户补齐的 IShopState（含 getPrice / setPrice 与 prices 存档字段）、IShopSystem（buyItem / sellItem / openShop）、IShopHeroAttr.money 支付资源，以及既有 Scroll / icon / GameUI 渲染骨架
provides:
  - "shop 商店 UI：Shop / ShopUI / ShopProps / IShopItemEntry（packages-user/client-modules/src/ui/shop.tsx）"
affects: [09-minimum-browser-runnable]

# Actuals (#2632)
actuals:
  tokens: 4433
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "以 shop.iterateItems() 枚举商店道具、getPrice 取买价 / 卖价、getCount 取库存，交易一律经 IShopSystem.buyItem / sellItem"
    - "数量按物品分购买 / 售出分别记忆（两个 Map<num, count>），切换物品 / 模式时保存并恢复"
    - "左列表 <Scroll>（显滚动条）、描述 <Scroll noscroll>，占满游戏画面（FULL_LOC）"

key-files:
  created:
    - packages-user/client-modules/src/ui/shop.tsx
  modified: []

key-decisions:
  - "Task 0 汇报关卡已由用户在父会话满足（明确回复「可以执行」并采纳全部默认处置）"
  - "OI-S1（列表范围）：售出严格复用商店列表（iterateItems 原样，商店不卖的无法售出）"
  - "OI-S2（列表过滤）：单商店界面，列表不做 enabled / 无库存过滤"
  - "OI-S3（数量记忆）：按物品分别记忆，购买量与售出量各记一份（两个 Map）"
  - "OI-S4（数字格式化）：价格 / 数量经 core.formatBigNumber 显示"
  - "OI-S5（命名）：shop.tsx / Shop / 'shop' / ShopProps / IShopItemEntry / ShopUI 全部照准"
  - "OI-S6（当前商店）：UI 于 setup 调用 props.shopSystem.openShop(props.shop)，交易对象 = 当前界面商店"
  - "交易一律经 IShopSystem，UI 不自行组装金钱 / 物品转移"

patterns-established:
  - "商店数量上下限：购入取 shop.getCount(num)（不存在为 -1 视作 0），售出取 heroState.items.itemCount(num)；调整后 clamp 至 [0, 上限]"
  - "交易后数量归零并回写当前物品记忆，避免残留超限值"

requirements-completed: []

coverage:
  - id: D1
    description: "shop 布局与商店列表：顶部购买 / 售出切换，左侧 id（num）升序商品列表（库存最右右对齐、滚动带滚动条），右侧 名称 / 描述（纵滚无滚动条）/ 价格信息（买价 / 卖价 / 存货 / 拥有 / 总价）"
    verification:
      - kind: other
        ref: "node (SHOP LAYOUT GATE) 静态源码断言 + CRLF 断言"
        status: pass
    human_judgment: true
    rationale: "布局与视觉形态无自动化 UI 测试，需人工目视确认切换 / 列表 / 信息区与占满画面（D-38 / D-39 / D-33）"
  - id: D2
    description: "数量选择与交易：四按钮 << < n > >>（±10 / ±1、clamp 至 库存 / 拥有、按物品分别记忆）、信息行在按钮上方、购买 / 售出经 IShopSystem、setup 经 openShop 绑定当前商店、右下退出"
    verification:
      - kind: other
        ref: "node (SHOP ACTION GATE) 静态源码断言 + CRLF 断言 + git status 范围守卫"
        status: pass
    human_judgment: true
    rationale: "数量调整 / 交易 / 退出为运行时交互，需人工在浏览器确认行为与上限（D-40 / D-41 / D-37）"

# Metrics
duration: 4min
completed: 2026-10-11
status: complete
---

# Phase 9 Plan 9: shop 商店界面 Summary

**将 legacy 商店移植为新接口 UI：顶部购买 / 售出切换，左侧按图块数字升序、库存右对齐、可滚动的商店列表，右侧 名称 / 描述 / 价格信息（买价 / 卖价 / 存货 / 拥有 / 总价）/ 四按钮数量选择 / 购买按钮，交易经 `IShopSystem.buyItem` / `sellItem`，右下退出。**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-11T06:52:47Z
- **Completed:** 2026-10-11T06:56:52Z
- **Tasks:** 3（Task 0 汇报关卡已满足；Task 1、Task 2 为代码任务）
- **Files modified:** 1（新增）

## Accomplishments
- 新增 `packages-user/client-modules/src/ui/shop.tsx`：`Shop` / `ShopUI` / `ShopProps` / `IShopItemEntry`，props 数组 `['controller','instance','state','shop','heroState','shopSystem']`，根容器 `FULL_LOC` 占满游戏画面。
- 顶部「购买选项 | 售出选项」以 `ref<'buy' | 'sell'>` 切换；售出复用同一商店列表（D-39）。
- 左侧商店列表来自 `props.shop.iterateItems()`，经 `tileStore.id` / `itemStore.getData` / `getPrice` / `getCount` / `itemCount` 组装 `IShopItemEntry`，按 `num` 升序排序；行内 `<icon>` + 名称 + 库存（最右右对齐）；纵向 `<Scroll>`（不加 `noscroll`，显示滚动条）；选中行高亮。
- 右侧自上而下：名称 → 描述（`<Scroll noscroll>`，不显示滚动条）→ 价格信息（买价 / 卖价 / 存货 / 拥有 / 总价）→ 数量选择（四按钮 `<< < n > >>`，±10 / ±1）→ 购买按钮。
- 数量上限：购入 = `shop.getCount(num)`（不存在为 `-1` 视作 `0`）、售出 = `heroState.items.itemCount(num)`；调整后 clamp 至 `[0, 上限]`；数量按物品分购买 / 售出分别记忆，切换时保存并恢复。
- 交易：购入 `props.shopSystem.buyItem(num, count)`、售出 `props.shopSystem.sellItem(num, count)`；数量为 0 不执行；setup 时 `props.shopSystem.openShop(props.shop)` 绑定当前商店；右下「退出」调用 `props.controller.close(props.instance)`。

## Task Commits

Each task was committed atomically:

1. **Task 0: 预执行汇报关卡（blocking-human）** - 无提交（只读汇报关卡，已获用户「可以执行」并采纳全部默认处置）
2. **Task 1: 布局 + 列表** - `2531940` (feat)
3. **Task 2: 数量 + 购买 + 退出 + 门禁** - `c8849f1` (feat)

**Plan metadata:** 见下方（SUMMARY 提交）

_Note: Task 1 与 Task 2 共用同一文件，按计划拆分为两次原子提交：Task 1 = 布局 / 模式切换 / 商店列表 / 名称 / 描述 / 价格信息；Task 2 = 数量四按钮 / 确认交易 / openShop / 退出。_

## Files Created/Modified
- `packages-user/client-modules/src/ui/shop.tsx` - shop 商店界面：`Shop` / `ShopUI` / `ShopProps` / `IShopItemEntry`。

## Decisions Made
- Task 0 汇报关卡已由用户在父会话满足：明确回复「可以执行」并采纳全部默认处置（OI-S1 售出复用商店列表；OI-S2 单商店不做 enabled 过滤；OI-S3 购买 / 售出分别记忆；OI-S4 用 `core.formatBigNumber`；OI-S5 命名照准；OI-S6 于 setup 调用 `openShop(props.shop)`）。
- 价格经 `props.shop.getPrice(num)` 的 `[buy, sell]` 取得（GAP-S1）；交易经 `props.shopSystem`（GAP-S2）；支付资源为数据端 `money`（GAP-S3），UI 不感知。
- 未新增数据端 API / barrel 导出、未 invent 接口；`@user/data-base` 的 `IShopState`（GAP-S0）与 `@user/data-system` 的 `IShopSystem`（GAP-S4）均为用户已补齐的既有导出。

## Deviations from Plan

None - plan executed exactly as written.

（说明：为满足 dev.md 的 eslint / prettier 强制要求，两次任务提交前均对本文件执行 `eslint --fix`（纯格式调整，无逻辑变化），属项目既有规范强制项，非计划偏离。）

## Issues Encountered
- 计划中的 `node -e "..."` 门禁含 `['\"]` 转义，本执行终端的 shell（PowerShell 5.1）会把 `\"` 破坏为 `"` 导致 `Unterminated regexp`。为保持门禁逻辑与计划完全一致，将门禁源码按 shell 解析后的等价形式落盘为临时 `.js` 再以 `node` 执行；语义与计划门禁逐字一致，结果均为通过。此为终端适配，非计划偏离。
- `pnpm exec eslint` 因本机 PowerShell 执行策略禁止 `pnpm.ps1` 无法运行；改用 `node_modules/.bin/eslint.cmd` 直接调用，等价且通过。

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None — 未引入计划 `<threat_model>` 之外的新信任边界（纯新增 UI，数据经既有 `IShopState` / `IShopSystem` / `IHeroState` 接口，交易不绕过数据端）。

## Self-Check: PASSED

- `packages-user/client-modules/src/ui/shop.tsx` 存在
- 提交 `2531940`、`c8849f1` 存在

## Next Phase Readiness
- shop 商店界面已就绪，可被 UI 控制器以 `'shop'` 名打开（打开方式不在本计划范围，D-41）。
- 未修改 STATE.md / ROADMAP.md（由编排器负责）。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-11*
