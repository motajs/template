# Phase 6 覆盖缺口记录（评审中）

> 逐计划人工评审测试用例时发现的覆盖缺口。**待全部计划评审完成后统一处理**（补测/新增计划/supersede 重跑）。
> 本文件为工作记录，非最终产物。

---

## 06-01 战斗系统（`data-system/src/combat`）

### G-06-01-A：四类效果同时生效后的最终属性未断言（严重度 中）
- **现状**：`context.test.ts` 的 `runs the four buildup stages in order with forward visibility`（L1046）只断言阶段顺序 `['special','base','query','final']` 与阶段间**中间读数**；其 `special` 阶段仅由光环的 `onApplySpecial`（no-op modifier）触发，**没有使用真正的 `registerSpecialQueryEffect`**；也**未断言 buildup 完成后最终计算后怪物的属性**。
- **期望**：一个怪物同时受 光环基础效果 + 常规查询效果 + 特殊查询效果 + final effect 作用，断言四阶段顺序**且断言最终属性**。

### G-06-01-B：多怪跨施加的嵌套光环未覆盖（严重度 高）
- **现状**：`propagates a two-layer nested aura`（L895）只是**单怪**两层链（自身 special→光环→special→光环）。缺：
  1. 光环由**怪物1**产生、施加到**怪物2**（跨怪方向）；
  2. 怪物2 被施加后生成**第二个光环**，再反施加回**怪物1 与怪物2**；
  3. **第三只怪在第一个光环范围外** → 不生成/不受第一个光环影响（范围边界断言）；
  4. 第三只怪**受第二个光环（以怪物2为中心）影响**后的属性；
  5. m1/m2/m3 **各自的最终属性**断言。
- **期望**：构造 m1 产生 A1 → 施加 m2 → m2 生成 A2 → A2 施加 m1 与 m2；m3 在 A1 范围外但若在 A2 范围内则受 A2 影响；断言三只怪最终属性。

### G-06-01-C：地图伤害叠加场景未覆盖（严重度 中）
- **现状**：`mapDamage.test.ts` 只覆盖「无来源 only」与「有来源 1 条 + 无来源 1 条（→ reduced 10）」；**没有**：
  1. **有来源 + 有来源**（同点两条 sourced，如两只怪叠加）；
  2. **无来源 + 无来源**（同点两条 sourceless）；
  3. 多来源（>2 条）叠加后的 **damage 求和 / type 取最大 / extra 并集**（真实 `MainMapDamageReducer` 在 06-02 单测过，但未与系统层多条真实来源组合）。
- **期望**：同点构造多来源组合，断言 `getReducedDamage` 的 damage/type/extra 与 `getSeparatedDamage` 条数符合预期。

---

## 06-03 enemy 数据模型（`data-base/src/enemy`）

### G-06-03-A：多 code/id（4 朝向）共用同一 prefab 的实例化路径未验证（严重度 中）- **现状**：`getPrefab(100) === getPrefab(1)` 的**读**路径有断言（`resolves reused codes and ids to the source prefab on reads`）；但 `createEnemy(100)` 走复用映射**实际返回 null**（bug `#06-03-1`），对应用例 `it.skip`。也**没有**「4 个朝向 code → 1 个 prefab → 分别 `createEnemy` 得到 4 个互相独立的怪」的专门用例。
- **期望**：修复 `#06-03-1` 后，覆盖「多 code/id 复用同一 prefab 并各自生成独立怪物」的完整链路。

### G-06-03-B：`Enemy` 实例级脏标记 —— 按设计，非缺口
- **用户确认（2026-09-14）**：`IEnemy` 本身不需要脏标记，**只有 Prefab 需要**，因为 `EnemyManager` 是由 prefab 创建 `IEnemy` 的。
- **结论**：prefab 的脏跟踪已在 Manager 层验证（`addPrefab`/`changePrefab`/`modifyPrefabAttribute` → `updateDirty`；`compareWith` 建参考；warn 117/118）。**不是缺口**。

---

## 06-04 录像（`data-common/src/replay`）

### G-06-04-A：多字节 bigint / int64 参数类型未真正验证（严重度 中）
- **现状**：`round-trips a multi-byte bigint`（#06-04-2）与 `round-trips int64 values above the int32 range`（#06-04-1）均为 `it.skip`（编码缺按字节右移 / 解码乘数误用 2147483647）。其余类型（boolean/各位宽整数/float/单字节 bigint/short/long/empty string/单步混合）已覆盖。
- **期望**：修复 #06-04-1/#06-04-2 后取消 skip，真正验证多字节 bigint 与超 int32 的 int64 编解码。
- 备注：warn/error 码 148–163 + 175 **已全覆盖**，非缺口。

### G-06-04-B：异质多命令序列的读回未专门验证（严重度 中）- **现状**：现有多步用例参数基本同质（3 步 `[数字]`、15 步 `[i]`）；仅 `rebuildIndexArray`（2 步）、`widening`（2 步）略有差异。**没有**「多条命令、参数长度与类型各不相同、整体读回」的专门组合用例；涉及增删的异质序列（`delete 中间步` #06-04-3、`insert 后读新次序` #06-04-4）均为 `it.skip`。
- **期望**：构造 5+ 条异质命令（不同参数个数、混合 boolean/整数/string/bigint/数组），断言读流逐条读回完全一致；并覆盖 insert/delete 后的异质序列（修复对应 bug 后）。
- **状态（2026-09-14）**：已由 **06-12 阶段 1** 覆盖（6 条异质命令经 `createReadStream` 与 `get` 读回一致、uint16 加宽与 delete-first 读回）。**但下方 G-06-04-C 指出流验证仍不够专项/严格。**

### G-06-04-C：录像读取流验证不够专项与严格（严重度 中）
- **现状**：异质序列用例虽读取了流，但（1）流与 `get` 混用，非**仅经流**验证；（2）用 `toMatchObject` 只保证参数值相等与数组长度，**未逐参数显式断言 type（编码类型）**；（3）流 `index` 只断言首条，未验证逐次递进；（4）未验证**序列变更后流 `expired`**、复杂序列下**中间起始索引**读取；（5）`insert/delete` 后的流读次序被 `it.skip`（`#06-04-3/#06-04-4`）。
- **用户要求（2026-09-14）**：录像系统应**重点验证读取流**。
- **期望（C = A + B）**：
  - **A**：新增**仅经读取流**（不搭配 `get`）的复杂序列验证——逐条 `stream.read()` + 每条**每参数精确 type/value** + `index` 逐次递进 + 末尾 `null`；并覆盖复杂序列下的中间起始索引。
  - **B**：**强化现有流断言**——补每参数 type、`index` 递进、序列变更后 `expired===true`。
  - 附带：`insert/delete` 后的流读次序在修复 `#06-04-3/#06-04-4` 后取消 skip（本批次仍为正确预期 `it.skip`）。

---

## 06-05 勇士（`data-base/src/hero`）

### G-06-05-A：多槽位同时装备的最终属性未验证（严重度 低-中）
- **现状**：`equipment.test.ts` 的装备用例每次只装一件或替换同槽（单槽最终属性已精确断言：15/22/10）。**没有**「两个不同槽位（如 weapon+armor）同时装备后合计最终属性」的用例。
- **期望**：同时装备多件不同槽位装备，断言合并后的最终属性值。

### G-06-05-B：道具效果触发 —— 非缺口
- **用户确认（2026-09-14）**：「简单道具效果」指能否证明此道具的**使用效果被触发**（一个简单的变量增加即可）。
- **结论**：`items.test.ts` 的 `useItem` 用 spy 断言 `useEffect` 被调用次数（及计数/路由/canUse），**已证明效果被触发**。**不是缺口**。

---

## 06-06 地图（`data-base/src/map`）

### G-06-06-A：静态→动态→移动→静态 全链路与移动后 keepEvent 未串联验证（严重度 中）
- **现状**：各环节单独有测（toDynamic 清静态块、setPos/step 移动、toStatic 写回、transferToDynamic/transferToStatic 的 keepEvent）。**没有**一条测试把「静态 → 转动态 → **移动一段距离** → 再转静态」串起来，`keepEvent` 也未在「**移动之后**的往返」中验证。
- **期望**：串联用例：静态图块转动态 → 移动若干格 → 转回静态，断言最终静态块/位置/事件（keepEvent 为 true/false 两种）符合预期。

### G-06-06-B：createMap 创建的地图上生成内容未验证（严重度 低-中）
- **现状**：`createMap('F1',2,2)` 只验证了注册与取回；对返回地图**写入/读取内容**（块/事件/图层）无用例；内容生成只由 `fromRaw` 覆盖。
- **补注（2026-09-14 评审 06-09 时）**：`data-state/test/saveablesRoundTrip.test.ts` 中 `state.maps.createMap('F1',2,2)` → `addLayer` → `setBlock(5,0,0)`，并在读档后断言 `getBlock(0,0)===5`，**间接覆盖了「在 createMap 的地图上生成内容」**。但该覆盖在 06-09 顶层、非 mapState 单测；若需 mapState 层直接覆盖仍可补。
- **期望**：在 mapState 单测中验证 createMap 后写入/读取块与图层。


### G-06-06-C：多个不同 zIndex 图层并存未验证（严重度 中）
- **现状**：只有单个图层 `setZIndex` 的用例；没有「同一地图内多个不同 zIndex 图层并存、各自读写正确」的用例。
- **期望**：同图建多个不同 zIndex 的图层，验证并存与各自数据独立。

---

## 06-07 顶层集成（`data-state/test`）

### G-06-07-A：缺少「尽可能多流水线组合」的单怪最终伤害断言（严重度 中）
- **现状**：顶层多 special 组合已精确断言伤害（`{25,2}` / `{61,3}`，各 4 个 special）；系统流水线（光环 base / 常规查询 / 特殊查询 / final / guard 递归）另测，但系统侧多为**属性与顺序**断言（atk 13/10、def 19 等），**未把「顶层多 special + 光环 + 常规查询 + 特殊查询 + final + 支援」全部叠加到一只怪并断言单一最终 `{damage,turn}`**。
- **期望**：构造「最大组合」怪（尽可能多的流水线同时生效），断言唯一精确的最终伤害与回合数。
- 关联：06-01 的 **G-06-01-A**（四类效果同时生效的最终属性/伤害未断言）为同源问题，可一并处理。

---

## 06-09 存档（`saveLoad.test.ts` / `saveablesRoundTrip.test.ts`）

### G-06-09-A：CoreState 顶层关键状态不完整、录像步数过少（严重度 中-高）
- **现状**：`saveablesRoundTrip.test.ts` 每个 saveable **只断言 1 个关键字段**（hero 基础 hp、flag score、地图 1 个块、enemy 1 个 prefab hp、replay 1 步 `record(2,7)`）。
- **用户要求（2026-09-14）**：状态验证要**包含所有关键状态**（勇士属性、flags、地图内容、录像内容），必须**严格一致**；且**录像内容至少 10 步、命令不能全相同、要多种组合**（如 Up/Right/Teleport/UseItem/Equip/Unequip 混合）。
- **期望**：顶层往返对每类 saveable 的全部关键状态逐一严格断言；录像构造 ≥10 步的多样化命令序列。

### G-06-09-B：多数 saveLoad 类未验证三档压缩均能正确读取（严重度 中）
- **现状**：仅 `enemy`（4 处）、`hero`（部分 4 处）、`map`（3 处）、`saveablesRoundTrip` 遍历三档；**hero 的 HeroLocation/HeroRendering/HeroEquipment/EquipmentState/HeroItems/HeroFollower/HeroState、map 的 StaticTile/DynamicTile、replay、flag 均为单档（多为 NoCompression）**。
- **用户要求**：其它存档内容也要验证**三档压缩下都能正确读取**，哪怕该存档不区分压缩度。
- **期望**：所有含 `saveState`/`loadState` 的类在 `NoCompression/LowCompression/HighCompression` 三档下各验证一次往返（对不接受 compression 参数的 flag/replay，至少经容器三档确认读取正确）。









