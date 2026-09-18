# Phase 7: 数据端缺陷修复 - Pattern Map

**Mapped:** 2026-09-15
**Files analyzed:** 13 生产文件（全部已存在，修改）+ 14 测试文件（取消 skip）+ 1 码表复核（`logger.json`，预计不改）
**Analogs found:** 13 / 13 生产文件均有同文件/同层既有正确范式

> 本阶段为**缺陷修复**：不存在新建文件。每条「Analog」指向**同文件内的正确兄弟分支**或**同层已实现正确语义的兄弟方法/类**。所有下列路径均已 `git ls-files` 验证为 **tracked source**（无 gitignored 镜像路径）。
>
> 关键约束（D-10）：测试改动**仅限** `it.skip` → `it`（+ 本研究点名的既有绿用例断言纠偏），不新增用例、不弱化断言。

## File Classification

### 生产源码（修改）

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `packages-user/data-system/src/combat/damage.ts` | system / service | transform（二分搜索） | 同文件 `findNextCritical`（`:206-242`）的相邻分支 + 消费点 `calculateCritical`（`:160-193`） | exact（同方法内） |
| `packages-user/data-system/src/combat/mapDamage.ts` | system / service | event-driven（键控 Map 源→点位反向索引） | 同文件 `addMapDamage`（`:104-112`）+ `refreshEnemy`（`:304-333`）；跨文件 `context.ts` `setEnemyAt`/`deleteEnemyAt`（`:256-299`） | role-match（同层同数据流） |
| `packages-user/data-system/src/combat/combat.ts` | system / service | request-response（async 流程） | 同文件 `combatFlow`（`:164-194`）；契约事实源 `combat/types.ts:767-779` | exact（同方法内） |
| `packages-user/data-system/src/combat/context.ts` | system / service | event-driven（构建流水线） | 同文件 `refreshEnemy`（`:780-784`，`view.reset()`）+ `enemy.ts:15-17` | exact |
| `packages-user/data-base/src/enemy/manager.ts` | model / registry | CRUD（Map 查找 + clone） | 同文件 `internalGetPrefab`（`:131-139`）+ `getPrefab`/`getPrefabById`（`:165-173`） | exact |
| `packages-user/data-common/src/replay/array.ts` | utility（编解码器） | transform / binary I-O | 同文件 `decodeParamList`（`:663-677`）、`rebuildIndexArray`（`:749-767`）、`createReadStream`（`:708-743`）、`add`（`:392-410`） | exact（同文件既有正确范式） |
| `packages-user/data-base/src/hero/attribute.ts` | model | CRUD（属性重算） | 同文件 `catchCalculateProgress`（`:100-117`）与 `recalculateAttribute` 有修饰器分支（`:84-97`） | exact |
| `packages-user/data-base/src/hero/equipment.ts` | model | CRUD（装备槽） | `getCouldEquipSlot`（`:134-150`）自身；深拷贝兄弟 `equipStore.ts:67-74` | exact（同文件）+ role-match |
| `packages-user/data-base/src/hero/equipStore.ts` | model / store | CRUD + save-load | 同文件 `saveDiff`（`:80-102`，基准 `item.equip`）与 `saveNoCompression`（`:67-74`）、构造器 `:34-36` | exact |
| `packages-user/data-base/src/map/mapLayer.ts` | model | request-response（越界守卫） | 同文件 `transferToStatic`（`:460-478`）、`transferToStaticIfSafe`（`:480-496`） | exact |
| `packages-user/data-base/src/map/dynamicTile.ts` | model | CRUD + save-load | 同文件 `set`（`:56-66`）+ `saveState`（`:102-116`） | exact |
| `packages-user/data-common/src/common/mover.ts` | utility | event-driven（步骤状态机） | 同文件 `getCurrentDirection`（`:464-473`）、`prepareStep`（`:479-511`）、`forward`/`backward`（`:579-597`） | exact |
| `packages-user/data-state/src/core.ts` | store / container | batch（Set 差集诊断） | 同文件 `loadState` 的 177 分支（`:522-527`）+ `Set.difference` 既有用法（`:533`） | exact |

> `packages-user/data-system/src/path/system.ts`（#06-07-1）与 `data-state/src/core.ts` 的 finder 注入**由用户负责（D-07）**，AI 不修改；见「用户负责项」。

### 测试源码（取消 `it.skip` 转绿）

| Test File | 关联缺陷 | 目标用例（文件:行） | 备注 |
|-----------|---------|---------------------|------|
| `data-system/src/combat/damage.test.ts` | #06-01-1 | `:579-594` | 无既有断言纠偏 |
| `data-system/src/combat/damage.test.ts` | #06-01-4 | `:677-718` | 无 |
| `data-system/src/combat/mapDamage.test.ts` | #06-01-2 | `:532-545` | 无 |
| `data-system/src/combat/combat.test.ts` | #06-01-3 | `:483-501` | **另有 3 条既有绿用例须纠偏**（见下） |
| `data-system/src/combat/context.test.ts` | #06-15-1 | `:625-663` | 无 |
| `data-base/src/enemy/manager.test.ts` | #06-03-1 | `:272-279`、`:282-343` | 无 |
| `data-common/src/replay/array.test.ts` | #06-04-1 | `:287-291` | 无 |
| `data-common/src/replay/array.test.ts` | #06-04-2 | `:278-284`、`:294-304` | 无 |
| `data-common/src/replay/array.test.ts` | #06-04-3 | `:211-221`、`:511-520` | 无 |
| `data-common/src/replay/array.test.ts` | #06-04-4 | `:498-508`、`:523-539` | 无 |
| `data-base/src/hero/attribute.test.ts` | #06-05-1 | `:115-121` | 无 |
| `data-base/src/hero/equipment.test.ts` | #06-05-2 | `:290-303` | 无 |
| `data-base/src/hero/equipment.test.ts` | #06-05-3 | `:306-315` | **保留 skip，仅加中文注释（D-06）** |
| `data-base/src/hero/saveLoad.test.ts` | #06-09-1 | `:337-341`、`:344-348`、`:351-366`、`:369-381` | 无 |
| `data-base/src/hero/saveLoad.test.ts` | #06-09-2 | `:312-325`、`:589-609` | 无 |
| `data-base/src/map/saveLoad.test.ts` | #06-09-3 | `:164-173` | 无 |
| `data-base/src/map/mapLayer.test.ts` | #06-06-1 | `:419-427` | 无 |
| `data-common/src/common/mover.test.ts` | #06-08-1 | `:307-319` | **须同步 jsdoc（D-11）** |
| `data-state/test/saveablesRoundTrip.test.ts` | #06-09-5 | `:337-349` | **既有 `:322-334` 须纠偏/去重（D-05）** |
| `data-state/test/replayPlayback.test.ts` | #06-07-1 | `:362-375` | 用户接线后取消 skip |

---

## Pattern Assignments

### `packages-user/data-system/src/combat/damage.ts` （#06-01-1，controller→system, transform）

**Analog:** 同文件 `findNextCritical` 的相邻分支 + 消费点 `calculateCritical`。

**根因定位**（`:229-234`）：`targetInfo` 被写在 `damage >= referenceDamage` 的「非临界点」分支，导致 `info` 永远停在 `upperLimit` 处的计算结果。

**消费点契约**（`:182-189`）——修复后必须满足的语义（`info` 与 `nextValue` 同源）：
```ts
yield {
    nextValue: next.value,
    baseValue: currentValue,
    nextDiff: next.value - currentValue,
    baseInfo: currentInfo,
    info: next.info,
    damageDiff: next.info.damage - currentInfo.damage
};
```

**要照抄的修复形态**（把赋值移入 `<` 分支，`else` 只留 `left = middle`）：
```ts
if (middleInfo.damage < referenceDamage) {
    right = middle;
    targetInfo = middleInfo;
} else {
    left = middle;
}
```

**错误处理**：本方法无 `logger` 调用；保持既有 `this.calculator!` 非空断言与 `if (targetInfo.damage >= referenceDamage) return null;`（`:221`）早退不变。

**测试**：`damage.test.ts:579-594` 由 `it.skip` → `it`。

---

### `packages-user/data-system/src/combat/mapDamage.ts` （#06-01-2，system, event-driven）

**Analog（同文件正确范式）：** `addMapDamage`（`:104-112`，`getOrInsertComputed` 建点位）与 `refreshEnemy`（`:304-333`，`point.affectedBy.add(viewItem); point.damages.add(damage)`）。**兄弟类范式：** `context.ts` 的 `setEnemyAt`/`deleteEnemyAt`（`:256-299`）——「写入时登记双向 Map，删除时同步清理」的既有正确写法。

**既有正确写法（context.ts `setEnemyAt`，`:284-289`）——「登记所有映射」的范式：**
```ts
const view = new EnemyView<TEnemy>(enemy, this);
this.enemyMap.set(index, enemy);
this.enemyViewMap.set(index, view);
this.locatorEnemyMap.set(enemy, index);
this.locatorViewMap.set(view, index);
this.computedToView.set(view.getComputingEnemy(), view);
```

**既有正确写法（context.ts `deleteEnemyAt`，`:269-277`）——「反向清理」的范式：**
```ts
this.needTotallyRefresh.delete(view);
this.dirtyEnemy.delete(view);
this.requestedCommonContext.delete(view);

this.computedToView.delete(view.getComputingEnemy());
this.enemyViewMap.delete(index);
this.enemyMap.delete(index);
this.locatorViewMap.delete(view);
this.locatorEnemyMap.delete(view);
```

**同文件 `getOrInsertComputed` 建点位范式（`:319-325`）：**
```ts
const point = this.sourcedDamage.getOrInsertComputed(
    index,
    () => ({
        affectedBy: new Set(),
        damages: new Set()
    })
);
const damage = viewItem.getDamageWithoutCheck(loc);
if (damage) {
    point.affectedBy.add(viewItem);
    point.damages.add(damage);
}
```

**两条候选修法（D-09 必须二选一汇报）：**
- **方案 A（补齐 store 写入，推荐）**：在上述 `if (damage)` 分支内增加登记；`refreshIndex`（`:356-378`）重建 `point.damages` 后同样重登记。私有字段契约见 `IViewStore`（`:22-27`）与 `IDamageStore`（`:29-36`）——`viewStore.damages` 以 `index` 为键、`damageStore.index` 与之 1:1。
  ```ts
  point.affectedBy.add(viewItem);
  point.damages.add(damage);
  // 记录伤害来源，供 deleteEnemy / removeEnemyAffecting 反向清理
  this.damageStore.set(damage, { sourceView: viewItem, sourceEnemy: view, index });
  const viewStore = this.viewStore.getOrInsertComputed(viewItem, () => ({
      damages: new Map(),
      enemy: view
  }));
  viewStore.damages.set(index, damage);
  ```
- **方案 B（只让 `deleteEnemy` 自足，最小）**：改写 `deleteEnemy`（`:150-167`），用 `viewItem.getRange()/getRangeParam()` 枚举点位并就地按剩余 `affectedBy` 重算 `point.damages`。

**既有读取范式（`deleteEnemy`，`:150-167`，方案 A 下**无需改动**）：**
```ts
deleteEnemy(view: IEnemyView<TEnemy>): void {
    const store = this.enemyStore.get(view);
    if (!store) return;
    const collection = new Set<number>();
    for (const viewItem of store) {
        const affecting = this.viewStore.get(viewItem);
        if (!affecting) continue;
        affecting.damages.forEach((dam, index) => {
            this.damageStore.delete(dam);
            collection.add(index);
        });
        this.viewStore.delete(viewItem);
    }
    this.enemyStore.delete(view);
    collection.forEach(v => {
        this.markDirtyIndex(v);
    });
}
```

**错误处理**：沿用 `logger.warn(102/103/104)` 早退，不抛异常。保留 `if (!store) return;`（`:152`）——`mapDamage.test.ts:517-529` 依赖它。

**测试**：`mapDamage.test.ts:532-545` 取消 skip。方案 A 需额外确认无既有用例断言 store 内部结构。

---

### `packages-user/data-system/src/combat/combat.ts` （#06-01-3，system, request-response）

**Analog / 契约事实源：** `combat/types.ts:771-779`（只有返回 `false` 才停止并放弃战斗）。实现与文档相反。

**契约逐字（`:771-779`）：**
```ts
/**
 * 战前执行的内容，返回 `false` 会立刻停止后续战前内容的执行，并放弃此次战斗
 * @param info 战斗伤害信息
 * @param handler 信息对象
 */
before(
    info: IEnemyDamageInfo<TEnemy, THero>,
    handler: ICombatFlowHandler<TEnemy, THero>
): Promise<boolean>;
```

**当前实现（`:178-181`，错误）：**
```ts
for (const script of this.scriptList) {
    const skip = await script.before(damage, handler);
    if (skip) return damage;
}
```

**修复形态（变量名同步自解释，D-11）：**
```ts
for (const script of this.scriptList) {
    const proceed = await script.before(damage, handler);
    if (!proceed) return damage;
}
```

**错误处理**：其余分支保持 `logger.warn(139/141)` + `return null` 不变。

**⚠️ 必须同步纠偏的既有绿用例（本研究新发现 1，D-09 汇报项）：** `FakeScript` 的 `beforeResult` 默认 `false`（`combat.test.ts:114/123`），修后「默认 false = 放弃战斗」会打红三条既有用例，必须显式传 `true`：
- `:289-312`（优先级顺序）`expect(calls).toEqual(['high.before','low.before','high.after','low.after'])`
- `:426-458`（await 顺序）→ `new FakeScript(1, 'script', fixture.calls, true)`
- `:460-480`（truthy 分支）→ 改为互补分支断言并更名 `runs hooks and after scripts when before returns truthy`

**FakeScript 注释同步（`:114`）：** `/** before 的返回值，真值表示短路 */` → 改为「假值表示放弃战斗」。

**测试**：`combat.test.ts:483-501` 取消 skip。

---

### `packages-user/data-system/src/combat/context.ts` （#06-01-4 + #06-15-1，system, event-driven）

**Analog（范式）：** 同文件 `refreshEnemy`（`:780-784`）——局部刷新前先 `view.reset()`。**工具：** `EnemyView.reset()`（`combat/enemy.ts:15-17`）= `computedEnemy.copyFrom(baseEnemy)`，而 `Enemy.copyFrom`（`data-base/src/enemy/enemy.ts:77-84`）会 `cloneAttributes()`（`structuredClone`）并重建特殊属性集。

**既有正确范式（`refreshEnemy`，`:780-787`）：**
```ts
private refreshEnemy(view: EnemyView<TEnemy>): void {
    const locator = this.getEnemyLocatorByView(view);
    if (!locator) return;

    view.reset();
    const enemy = view.getComputingEnemy();
    const base = view.getBaseEnemy();
    const handler = this.createHandler(enemy, locator);
    // ...
}
```

**`EnemyView.reset()`（`combat/enemy.ts:15-17`）：**
```ts
reset(): void {
    this.computedEnemy.copyFrom(this.baseEnemy);
}
```

**`buildup()` 现状（`:684-716`）——清空拓扑但漏 `reset()`：**
```ts
this.needUpdate = false;
this.sortedAura.clear();
this.convertedAura.clear();
this.dirtyEnemy.clear();
this.needTotallyRefresh.clear();
this.requestedCommonContext.clear();
```

**修复形态（在 `:695` 之后、各效果阶段之前插入，**无条件**执行）：**
```ts
for (const view of this.enemyViewMap.values()) {
    view.reset();
}
```

> 不能挂在 `hasAura || hasSpecialQuery` 之下——`buildupQuery`/`buildupFinal` 也会在上一轮数值上叠加。
> `enemyViewMap` 是 `Map<number, EnemyView<TEnemy>>`（`:32`），`values()` 即全部视图。

**错误处理**：`logger.warn(110)` 早退（未绑定勇士）保持不变；循环对全新视图为幂等 no-op。

**测试**：`damage.test.ts:677-718`（#06-01-4）、`context.test.ts:625-663`（#06-15-1）取消 skip。

---

### `packages-user/data-base/src/enemy/manager.ts` （#06-03-1，model/registry, CRUD）

**Analog（同文件正确实现）：** `internalGetPrefab`（`:131-139`）与 `getPrefab`/`getPrefabById`（`:165-173`）。`deletePrefab`（`:176`）、`modifyPrefabAttribute`（`:218`）已在用 `internalGetPrefab`——本修复是消除不一致。

**既有正确范式（`internalGetPrefab`，`:131-139`）：**
```ts
private internalGetPrefab(code: number | string) {
    if (typeof code === 'number') {
        const sourceCode = this.reuseByCode.get(code) ?? code;
        return this.prefabByCode.get(sourceCode) ?? null;
    } else {
        const sourceId = this.reuseById.get(code) ?? code;
        return this.prefabById.get(sourceId) ?? null;
    }
}
```

**当前错误实现（`:119-129`，绕过复用映射）：**
```ts
createEnemy(code: number): IEnemy<TEnemy> | null {
    const prefab = this.prefabByCode.get(code);
    if (!prefab) return null;
    return prefab.clone();
}

createEnemyById(id: string): IEnemy<TEnemy> | null {
    const prefab = this.prefabById.get(id);
    if (!prefab) return null;
    return prefab.clone();
}
```

**修复形态（D-08 明确允许改用 `internalGetPrefab`）：**
```ts
createEnemy(code: number): IEnemy<TEnemy> | null {
    const prefab = this.internalGetPrefab(code);
    if (!prefab) return null;
    return prefab.clone();
}

createEnemyById(id: string): IEnemy<TEnemy> | null {
    const prefab = this.internalGetPrefab(id);
    if (!prefab) return null;
    return prefab.clone();
}
```

**类型说明：** `internalGetPrefab` 返回 `IEnemy | null`（可直接 `.clone()`）；`getPrefab` 返回 `IReadonlyEnemy` 不可用。类成员提升使 `:131` 的声明在 `:119` 之后仍可用。**无需 `as`**（`dev.md` 禁连续 `as`）。

**不变式（可加一行有价值注释）：** 「所有按 code/id 取模板的公开入口都必须经 `internalGetPrefab`」。

**测试**：`manager.test.ts:272-279`、`:282-343` 取消 skip。

---

### `packages-user/data-common/src/replay/array.ts` （#06-04-1..4，utility, transform/binary）

**共同根因：** `indexArray[i]` 存的是**第 i 条命令的参数起始字节**（见 `add` `:405`：`this.indexArray[this.length] = this.paramUsed;`），多处却当作**命令索引**使用；且末条缺少终点哨兵（`indexArray[length]` 未写入）。

**同文件正确范式 1——顺序累加参数偏移（`rebuildIndexArray`，`:749-767`）：**
```ts
rebuildIndexArray(): void {
    const commandSize = this.getCommandSize();
    let currCommand = 0;
    let currParam = 0;

    // 需要对每个参数进行解码，然后 cumsum
    for (let i = 0; i < this.length; i++) {
        const { paramCount } = this.decodeCommand(currCommand);
        const params = this.decodeParamList(currParam, paramCount);
        this.indexArray[i] = currParam;
        currCommand += commandSize;
        currParam += params.reduce(
            (prev, curr) => prev + curr.byteLength,
            0
        );
    }

    this.paramUsed = currParam;
}
```

**同文件正确范式 2——读流按已解码字节数顺序推进（`createReadStream`，`:722-730`）：**
```ts
if (stream.index >= this.length) return null;
const { command, paramCount } = this.decodeCommand(currCommand);
const params = this.decodeParamList(currParam, paramCount);
stream.index++;
currCommand += commandSize;
currParam += params.reduce(
    (prev, curr) => prev + curr.byteLength,
    0
);
```

**建议引入的私有助手（以 `paramUsed` 为末步哨兵，统一 `[start, end)`）：**
```ts
/** 获取指定命令在参数缓冲区中的字节区间 [start, end) */
private getParamRange(index: number): { start: number; end: number } {
    const start = this.indexArray[index];
    const end = index + 1 < this.length ? this.indexArray[index + 1] : this.paramUsed;
    return { start, end };
}
```

**#06-04-1（`:621`，解码乘数）：**
```ts
// 修复前
value = low + high * 2147483647;
// 修复后（与编码侧 :369-370 的 2147483648 一致）
value = low + high * 2147483648;
```

**#06-04-2（编码 `:264-270` / 解码 `:628`、`:631`，多字节 bigint）：** 保持 `byteLength: arr.length + 2`（`:274`）与 `arr.length` 计算（`:261-263`）不变。
```ts
// 编码：替换 :264-270 的 total/base/remain 循环体
arr[i] = Number((param >> (8n * BigInt(i))) & 0xffn);
// 解码：无符号读取长度前缀与字节
const length = this.paramView.getUint8(startIndex + 1);      // 原 getInt8
const num = this.paramView.getUint8(startIndex + 2 + i);     // 原 getInt8
```

**#06-04-3（`delete`，`:447` 端点 + `:469` 回退起点）：**
```ts
const nextParam =
    index + 1 < this.length ? this.indexArray[index + 1] : this.paramUsed;
// ...
for (let i = index; i < this.length; i++) {
    this.indexArray[i] -= paramLength;
}
```
> `delete(0)` 路径修后等价（`i = index = 0` == 修前 `i = paramStart = 0`），既有绿用例 `:198-208`、`:484-495` 保持绿。

**#06-04-4（`insert`，`:424` + `:425` **两处**位移方向取反）：**
```ts
this.paramArray.copyWithin(paramStart + length, paramStart);
this.indexArray.copyWithin(index + 1, index);
```
> `:435-437` 尾段补偿循环（`this.length++` 之后执行）在修正方向上恰好覆盖 `[index+1, newLength-1]`，**无需再改**。
>
> ⚠️ 覆盖真相（须在汇报中说明）：两个 insert skip 用例只用 `createReadStream` **顺序读**（`:498-508`、`:523-539`），读流 `currParam` 顺序累加、**不依赖 `indexArray` 绝对值** → 只修 `:424` 就能转绿，但 `array.get(i)`（`:697-706`）依赖 `indexArray[i]`，只修一处时 `get` 语义仍错。两处同修才是完整修复（Assumption A6）。

**错误处理**：沿用 `logger.warn(148/149/150/151/152/153/154/155)`，不抛异常；越界/容量判定不新增。

**测试**：`array.test.ts:278-284`、`:287-291`、`:294-304`、`:211-221`、`:511-520`、`:498-508`、`:523-539` 取消 skip（建议按缺陷分两个原子提交：常量/bigint 编解码 与 索引编辑）。

---

### `packages-user/data-base/src/hero/attribute.ts` （#06-05-1，model, CRUD）

**Analog（同文件）：** `recalculateAttribute` 的有修饰器分支（`:84-97`）与 `catchCalculateProgress`（`:100-117`）——两者都是「无修饰器则早退」，但 `recalculateAttribute` 是**写 final 的唯一入口**（`set/add/mul/div` 经 `markDirty` 落到此处）。

**当前错误早退（`:80-82`）：**
```ts
private recalculateAttribute<K extends keyof THero>(name: K): void {
    const modifierList = this.modifier.get(name);
    if (!modifierList) return;
```

**修复形态（无修饰器时 final = base，保持同引用语义）：**
```ts
const modifierList = this.modifier.get(name);
if (!modifierList) {
    this.finalAttribute[name] = this.attribute[name];
    return;
}
```
> 引用语义与既有约定一致：有修饰器分支 `let value = baseValue`（`:85`）本身即同引用起点，且 `isSameReference` 告警分支（`:89-93`）证明「对象属性同引用」是既有约定。
>
> **不要**顺带改 `catchCalculateProgress`（`:100-102`）的同类早退——它是生成器、不写 final，保留原样。

**错误处理**：`logger.warn(109)` 分支不变。

**测试**：`attribute.test.ts:115-121` 取消 skip。

---

### `packages-user/data-base/src/hero/equipment.ts` （#06-05-2 + #06-09-2，model, CRUD/save-load）

#### #06-05-2 — 空槽判断写反

**Analog（同文件）：** `canEquipTo` 的字符串分支（`:50-72`）自行计算 `hasEmpty`，逻辑本身正确——**只作语义参照，不要顺带重构**。

**当前错误实现（`getCouldEquipSlot`，`:134-150`）：**
```ts
let empty = -1;
this.slots.forEach((name, index) => {
    if (name !== slot) return;
    if (first === -1) first = index;
    if (empty !== -1 && !this.equips.has(index)) {   // ← 恒假
        empty = index;
    }
});
if (empty === -1) {
    return first;
} else {
    return empty;
}
```

**修复形态（`:141` 条件取反，恢复「优先占空槽、无空槽才替换」）：**
```ts
if (empty === -1 && !this.equips.has(index)) {
```

#### #06-09-2 — `saveState` 未深拷贝

**契约事实源（L0）：** `packages-user/data-common/src/save/types.ts:12-17`——`saveState` 返回对象**应经过深拷贝（`structuredClone`）**。

**Analog（同层兄弟，`equipStore.ts` `saveNoCompression`，`:67-74`）——Map 深拷贝既有写法：**
```ts
private saveNoCompression(): IEquipmentStateSave<THero> {
    return {
        uid: this.uid,
        num: this.item.num,
        value: new Map(this.value),
        percentage: new Map(this.percentage)
    };
}
```

**当前错误实现（`:329-334`）：**
```ts
saveState(): IHeroEquipmentSave {
    return {
        equipped: this.equips,
        slots: this.slots
    };
}
```

**修复形态（与兄弟 Map/数组深拷贝一致）：**
```ts
saveState(): IHeroEquipmentSave {
    return {
        equipped: new Map(this.equips),
        slots: [...this.slots]
    };
}
```
> 类型兼容：`IHeroEquipmentSave.equipped` 为 `ReadonlyMap<number, number>`、`slots` 为 `readonly string[]`，`Map`/数组均满足，**无需 `as`**。

**错误处理**：`equip`/`unequip` 的 `logger.warn(146/147)` 与 `replay.disable()/revert()` 模式不变。按 D-06，#06-05-3 的 147 分支**一行不动**。

**测试**：`equipment.test.ts:290-303`（#06-05-2）取消 skip；`saveLoad.test.ts:312-325`、`:589-609`（#06-09-2）取消 skip。`equipment.test.ts:306-315`（147）**保留 skip + 中文注释**。

---

### `packages-user/data-base/src/hero/equipStore.ts` （#06-09-1，model/store, save-load）

**Analog（同文件正确范式）：** `saveDiff`（`:80-102`）已确立**基准 = `item.equip` 原始定义**；`saveNoCompression`（`:67-74`）确立 value/percentage 分表；构造器（`:34-36`）确立 `new Map(equip.value)` / `new Map(equip.percentage)` 的基准装载。

**基准范式（`saveDiff`，`:80-88`）：**
```ts
private saveDiff(): IEquipmentStateSave<THero> {
    const { value, percentage } = this.item.equip;
    const valueDiff = new Map<SelectKey<THero, number>, number>();
    for (const [name, equipValue] of this.value) {
        const base = value.get(name);
        if (base !== equipValue) {
            valueDiff.set(name, equipValue);
        }
    }
    // ...
}
```

**当前错误实现（`loadNoCompression` `:116-126`、`loadDiff` `:132-151`）——两处均误遍历 `state.percentage` 且压缩档缺回退基准。**

**修复形态（`loadNoCompression`）:**
```ts
private loadNoCompression(state: IEquipmentStateSave<THero>): void {
    this.value.clear();
    this.percentage.clear();
    for (const [name, value] of state.value) {
        this.value.set(name, value);
    }
    for (const [name, value] of state.percentage) {
        this.percentage.set(name, value);
    }
    this.rebuildModifiers();
}
```

**修复形态（`loadDiff`：先回退 `item.equip` 原始定义，再叠加存档差异）:**
```ts
private loadDiff(state: IEquipmentStateSave<THero>): void {
    this.value.clear();
    this.percentage.clear();
    // 基准为装备原始定义，再叠加存档中的差异条目
    for (const [name, value] of this.item.equip.value) {
        this.value.set(name, value);
    }
    for (const [name, percentage] of this.item.equip.percentage) {
        this.percentage.set(name, percentage);
    }
    for (const [name, value] of state.value) {
        this.value.set(name, value);
    }
    for (const [name, value] of state.percentage) {
        this.percentage.set(name, value);
    }
    this.rebuildModifiers();
}
```

> 关键：`modifier.setValue()` **不会**回写 `this.value/percentage` 映射——这是理解这几条用例的前提。
> 恢复后再调 `rebuildModifiers()`（`:46-55`），与既有 `rebuildModifiers` 生成 `ValueModifier`/`PercentageModifier` 的模式一致。

**错误处理**：`HeroEquipsStore.loadState` 的 `logger.error(58/59)` 与 `maxBy` 模式不变。

**测试**：`hero/saveLoad.test.ts:337-341`、`:344-348`、`:351-366`、`:369-381` 取消 skip；既有绿 `:330-334` 保持绿。

---

### `packages-user/data-base/src/map/mapLayer.ts` （#06-06-1，model, request-response）

**Analog（同文件兄弟分支，逐字一致）：** `transferToStatic`（`:460-478`）与 `transferToStaticIfSafe`（`:480-496`）的越界分支都发码 **128**。

**既有正确范式（`transferToStatic`，`:466-469`）：**
```ts
if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
    logger.warn(128, x.toString(), y.toString());
    return null;
}
```

**当前错误实现（`transferToDynamic`，`:440-443`）：**
```ts
if (!this.inMap(x, y)) {
    logger.warn(131, x.toString(), y.toString());
    return null;
}
```

**修复形态（D-04）：**
```ts
if (!this.inMap(x, y)) {
    logger.warn(128, x.toString(), y.toString());
    return null;
}
```
> 可保留 `this.inMap(x, y)` 守卫（语义等价），仅改码与参数形态与兄弟分支一致。
> 码表（L0 权威）：`128` = `Cannot transfer $1 to $2, since target position $3,$4 out of bounds.`；`131` = setEventLayer 越权专用。

**不变式：** 改动码前先 grep 全仓——码 131 的**唯一**测试断言在 `gameMap.test.ts:185`（`setEventLayer` 路径，不经 `transferToDynamic`）；码 131 的生产写入点仅 `mapLayer.ts:441` 与 `gameMap.ts:149`。

**错误处理**：`logger.warn(127/129/130)` 其余分支不变，不抛异常。

**测试**：`mapLayer.test.ts:419-427` 取消 skip。

---

### `packages-user/data-base/src/map/dynamicTile.ts` （#06-09-3，model, save-load）

**Analog（同文件）：** `set`（`:56-66`）——已内含 `tileNum` 写入、`tileRaw` 重取与 `restoreDefaultEvents()`；`saveState`（`:102-116`）证明 `save.num` 是必填字段（`map/types.ts:32-35`）。

**既有正确范式（`set`，`:56-66`）：**
```ts
set(num: number): void {
    this.tileNum = num;
    const data = this.state.tileStore.getData(num);
    if (!data) {
        logger.warn(143, num.toString());
        this.tileRaw = null;
    } else {
        this.tileRaw = data;
    }
    this.restoreDefaultEvents();
}
```

**当前错误实现（`loadState`，`:118-127`，漏 `save.num`）：**
```ts
loadState(save: Readonly<IDynamicBlockSave>): void {
    this.restoreDefaultEvents();
    if (save.events) {
        const eventView = this.tileEvent();
        eventView.clear();
        for (const [priority, id] of save.events) {
            eventView.set(priority, id);
        }
    }
}
```

**修复形态（先 `set(save.num)`，`set` 内含 `restoreDefaultEvents()`）：**
```ts
loadState(save: Readonly<IDynamicBlockSave>): void {
    this.set(save.num);
    if (save.events) {
        const eventView = this.tileEvent();
        eventView.clear();
        for (const [priority, id] of save.events) {
            eventView.set(priority, id);
        }
    }
}
```

> 签名：保持 1 参（`MapTileBase` 抽象声明 `tile.ts:76` 同样一参；`dev.md`「未使用的后置参数直接不填」）。**不要**补 `compression`。

**错误处理**：`logger.warn(143)` 由 `set` 内部统一上报。

**测试**：`map/saveLoad.test.ts:164-173` 取消 skip；`mapLifecycle.test.ts:126-148` 复核仍绿（`dirty` 语义由 `restoreDefaultEvents` 末尾 `markPure` 决定）。

---

### `packages-user/data-common/src/common/mover.ts` （#06-08-1，utility, state machine）

**Analog（同文件）：** `getCurrentDirection`（`:464-473`）与 `prepareStep` 的 `Forward` 分支（`:498-501`）——前进语义保持不变；后退基准改为 `faceDirection`。

**当前错误实现（`:492-503`）：** 每步把 `moveDirection` 写成 `opposite(dir)`，下一步 `getCurrentDirection()` 又优先取该反方向 → 再取反 → 方向摆动、净位移 0、朝向翻转。

**相关既有范式（`:464-473`）：**
```ts
/**
 * 获取当前应当作为相对移动基准的方向
 */
private getCurrentDirection(): FaceDirection {
    if (this.moveDirection !== FaceDirection.Unknown) {
        return this.moveDirection;
    } else {
        return this.faceDirection;
    }
}
```

**修复形态（后退基准取 `faceDirection`，前进保持既有语义）：**
```ts
case ObjectMoveType.Special: {
    if (step.direction === ObjectSpecialStep.Backward) {
        const dir = this.faceDirection;
        this.moveDirection = this.faceHandler.opposite(dir);
        this.faceDirection = dir;
    } else {
        const dir = this.getCurrentDirection();
        this.moveDirection = dir;
        this.faceDirection = dir;
    }
    break;
}
```

**D-11 必办——同步 jsdoc（`:309-313`）:**
```ts
/**
 * 追加若干个后退步，沿当前移动方向的反方向移动
 * @param count 追加次数，默认 1
 */
backward(count?: number): this;
```
→ 改为「沿当前朝向的反方向后退」并说明多步后退保持同轴；`getCurrentDirection`（`:464-466`）与 `prepareStep`（`:475-478`）注释同步措辞。**备选**（D-09 汇报二选一）：保留「当前移动方向」字面契约，另设私有「相对基准方向」字段。

**错误处理**：本文件按步骤状态机运行，无 `logger` 诊断码；不改 `forward`（`:579-587`）/`backward`（`:589-597`）的入队逻辑。

**测试**：`mover.test.ts:307-319` 取消 skip；`:292-304`（单步）修后等价保持绿。

---

### `packages-user/data-state/src/core.ts` （#06-09-5，store/container, batch）

**Analog（同文件）：** 178 分支自身（`:531-537`）与相邻 177 分支（`:522-527`）——177 的语义是「saveables 中存在但**存档缺失**」，正是当前 178 误用的差集方向。

**码表（L0 权威文案）：**
- `177`: `Save data for saveable content $1 is needed, but there's no data in save data. ...`
- `178`: `Save data with keys of '$1' are saved but not be loaded, is there some issue for it?`（= 存档中出现但未加载）

**既有 177 范式（`:522-527`）：**
```ts
for (const [key, value] of this.saveables) {
    // 使用 has 判断是否在映射中，而非值的非空判断，因为空值也有可能是存档的一部分
    if (!state.has(key)) {
        logger.warn(177, key);
        continue;
    }
    const data = state.get(key);
    value.loadState(data, compression);
}
```

**当前错误实现（`:531-537`，方向与文案相反）：**
```ts
const loaded = new Set<string>(state.keys());
const total = new Set(this.saveables.keys());
const remain = total.difference(loaded);
if (remain.size > 0) {
    const ids = [...remain].join(' | ');
    logger.warn(178, ids);
}
```

**修复形态（D-05，差集方向取反）：**
```ts
const loaded = new Set<string>(state.keys());
const total = new Set(this.saveables.keys());
const remain = loaded.difference(total);
if (remain.size > 0) {
    const ids = [...remain].join(' | ');
    logger.warn(178, ids);
}
```

**错误处理**：`logger.warn(112/113/177/178)` 均为「告警不中断」，`Set.prototype.difference` 已在用（Node 22 + 仓库 polyfill 环境可用）。

**⚠️ 必须同步纠偏的既有绿用例（D-05 已授权）：** `saveablesRoundTrip.test.ts:322-334` 的 `warns code 178 when the save data misses a saveable key` 修后必红。推荐处置（Assumption A4，需在 D-09 点名去重）：把 `:322-334` 改为「多 key」版本并**让 `:337-349` 的 skip 成为被取消 skip 的那一条**，避免两条完全重复。
```ts
// 验证存档含未注册 key 时经 logger.catch 观测到警告码 178
it('warns code 178 when the save data has keys that are not loaded', () => {
    const state = createCoreState();
    const snapshot = new Map(state.saveState(SaveCompression.NoCompression));
    snapshot.set('@system/extra', null);

    const result = logger.catch(() =>
        state.loadState(snapshot, SaveCompression.NoCompression)
    );

    expect(result.info.map(info => info.code)).toContain(178);
});
```

**测试**：`saveablesRoundTrip.test.ts:337-349` 取消 skip；`:307-319`（177）必须保持绿。

---

## Shared Patterns

### 1. 错误诊断：`logger.warn(code, ...)` + 早退，绝不抛异常
**Source:** `packages/common/src/logger.ts`、码表 `packages/common/src/logger.json`
**Apply to:** 全部生产文件（尤其 #06-06-1 改 128、#06-09-5 改 178）
```ts
if (!this.converter) {
    logger.warn(106);
    return null;
}
```
- 码是**数据**：文案在 `logger.json`，`$1..$4` 由参数替换；码唯一、不复用、0 禁用。
- **改动任一码的触发条件前先 grep 全仓**：(1) 所有 `*.test.ts` 中的该码断言；(2) 所有生产 `logger.warn(<code>` 写入点。这是本阶段最高危 Pitfall（已实证 #06-01-3 影响 3 条、#06-09-5 影响 1 条既有绿用例）。

### 2. 「重置再重算」范式（#06-01-4 / #06-15-1）
**Source:** `data-system/src/combat/context.ts:780-784` + `data-system/src/combat/enemy.ts:15-17`
```ts
view.reset();   // EnemyView.reset -> computedEnemy.copyFrom(baseEnemy)
```
**Apply to:** `context.ts` `buildup()` 全量构建前置。**不新造重置逻辑**，复用既有 API。

### 3. 「统一入口不变式」（#06-03-1）
**Source:** `data-base/src/enemy/manager.ts:131-139`（`internalGetPrefab`）
**Apply to:** `createEnemy`/`createEnemyById`——所有按 code/id 取模板的公开入口必须经该私有方法（`getPrefab`/`deletePrefab`/`modifyPrefabAttribute` 已是此模式）。

### 4. 深拷贝契约（#06-09-2）
**Source:** `packages-user/data-common/src/save/types.ts:12-17`（`saveState` 必须深拷贝）
**Apply to:** 所有 `saveState` 返回既有对象引用的实现。
```ts
// Map 深拷贝（equipStore.ts:71 既有写法）
value: new Map(this.value)
// 数组深拷贝
slots: [...this.slots]
// 普通对象/嵌套结构（enemy.ts:91 既有写法）
attrs: structuredClone(this.attributes)
```

### 5. 「读档字段 ↔ save 字段」逐字段核对清单（#06-09-1/2/3）
**Source:** `equipStore.ts:67-102`（save 侧）+ `dynamicTile.ts:102-116`（save 侧）
**Apply to:** 每个 `loadState`：逐个 save 字段确认是否被消费。已知三处漏项：`equipped`/`slots`（深拷贝）、`num`（dynamicTile）、`value/percentage`（压缩档回退基准）。

### 6. 键控 Map 双向登记（#06-01-2 方案 A）
**Source:** `data-system/src/combat/context.ts:256-299`（`setEnemyAt`/`deleteEnemyAt`）
**Apply to:** `mapDamage.ts` 的 `viewStore`/`damageStore`——写入时登记所有索引，删除时同步反向清理，禁止只写单向。
```ts
this.locatorEnemyMap.set(enemy, index);
this.locatorViewMap.set(view, index);
this.computedToView.set(view.getComputingEnemy(), view);
```

### 7. 测试取消 skip 的唯一改动形态（D-10）
**Source:** `replay/array.test.ts:287-291`（skip 写法）、`saveablesRoundTrip.test.ts:307-319`（`logger.catch` 断言范式）
```ts
// 修复前
it.skip('round-trips int64 values above the int32 range', () => {
// 修复后（仅删去 .skip，断言一字不改）
it('round-trips int64 values above the int32 range', () => {
```
`logger.catch` 断言范式（沿用既有，不新建 helper）：
```ts
const result = logger.catch(() =>
    state.loadState(snapshot, SaveCompression.NoCompression)
);
expect(result.info.map(info => info.code)).toContain(178);
```
测试文件每个 `it` 前保留单行中文注释（`dev.md` 强制）；skip 用例的「疑似 bug + 修复后取消 skip」注释在转绿后应删除或改为中性描述。

### 8. 代码规范（全文件适用）
**Source:** `dev.md`、`.planning/codebase/CONVENTIONS.md`
- CRLF、4 空格、单引号、无尾逗号、`arrowParens: avoid`、printWidth 80。
- **禁 `import type`**（唯一例外 `entry-data/src/mota.ts`）；**禁连续 `as`**（`as unknown as` 绝对禁止）。
- 不使用对象解构单属性（`const v = obj.v`）；私有方法写在调用它的方法**之前**且置于合理 `#region`。
- 中文 jsDoc **写在源头**（多为 `interface`/`types.ts`）；私有成员与方法必须注释；继承的 API 不重复注释。
- 私有成员不以 `_` 开头；未使用参数直接不填（不写 `_x`）。

---

## 既有绿用例纠偏清单（**必须与生产修复同 commit**）

| 文件:行 | 用例 | 纠偏内容 | 依据 |
|---------|------|---------|------|
| `data-system/src/combat/combat.test.ts:289-312` | 优先级/重复脚本顺序 | `beforeResult` 显式传 `true`（否则修后第一个 before 即放弃） | Assumption A3 |
| `data-system/src/combat/combat.test.ts:426-458` | await 顺序 | `new FakeScript(1, 'script', fixture.calls, true)` | Assumption A3 |
| `data-system/src/combat/combat.test.ts:460-480` | truthy 分支 | 改为互补分支断言 + 更名 `runs hooks and after scripts when before returns truthy` | Assumption A3 |
| `data-system/src/combat/combat.test.ts:114` | `FakeScript.beforeResult` 注释 | 「真值表示短路」→「假值表示放弃战斗」 | D-11 |
| `data-state/test/saveablesRoundTrip.test.ts:322-334` | 178 缺 key | 改为多 key 语义并与 `:337-349` 去重（保留其一） | D-05 / Assumption A4 |

**保留 skip（不转绿）：**
| 文件:行 | 处置 | 依据 |
|---------|------|------|
| `data-base/src/hero/equipment.test.ts:306-315`（147） | 保留 `it.skip` + 中文注释「147 为保留错误码，当前不可达，设计如此」；生产代码一行不动 | D-06 |

---

## 用户负责项（AI 不实现，D-07）

| 项 | 事实/参考 | AI 职责 |
|----|----------|---------|
| `data-state/src/core.ts` 向 `pathfinding.finder` 注入 `useMapState`/`useMapLayer`/`usePassPredicate` | 测试内等价注入逐字：`replayPlayback.test.ts:108-114`；`DefaultPassPredicateImpl` 在 `data-state/src/hero/predicate.ts`；注入点 `core.ts:248-256`（`loading.once('loaded')` → `initMapState`） | 用户接线后取消 `replayPlayback.test.ts:362-375` 的 skip 并验证转绿；**不通过则按 D-09 退出汇报，不自行改 `core.ts`** |

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | 无。13 个生产文件全部为既有文件修改，且同文件/同层均存在可照抄的正确范式。本阶段**不新建任何文件**。 |

---

## Metadata

**Analog search scope:** `packages-user/data-system/src/combat`、`packages-user/data-base/src/{enemy,hero,map}`、`packages-user/data-common/src/{replay,common,save}`、`packages-user/data-state/src`、`packages/common/src`（码表）
**Files scanned:** 13 生产文件 + 8 测试文件 + 3 契约/码表文件（共 24 个 `Read`/`Grep` 目标）
**Tracked-source gate:** `git ls-files` 已验证 13 个生产文件全部 tracked；未命名任何 gitignored 镜像路径
**Pattern extraction date:** 2026-09-15
**Source of truth:** `07-CONTEXT.md` D-01..D-14、`07-RESEARCH.md` §Per-Finding Analysis（file:line + 逐字源码引用）、`06-TEST-FINDINGS.md`
