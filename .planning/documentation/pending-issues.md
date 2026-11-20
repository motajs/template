# 文档待处理问题

## 2026-11-19 22:10

状态：仅记录，未执行（按 22:00 停止规则）。

### 动画激励页面的执行器内容

- 目标文档：`docs/render-guide/internals/animation-excitation.md`
- 问题：动画激励页面讲了 `useAnimater` 与 `useTransition`，这两个接口与动画激励本身关系不大。
- 处理：已删除 `useAnimater` / `useTransition` 相关章节及引用，激励页只保留激励内容。
- 状态：已处理（2026-11-20）。

### `onExcited` 与 `onExcitedFunc` 的章节合并

- 目标文档：`docs/render-guide/internals/animation-excitation.md`
- 问题：`onExcited` 与 `onExcitedFunc` 被合并在同一个章节；一个章节应只讲一个内容，除非两者概念几乎重叠且内容极少。
- 处理：已拆为 `登记受激励对象 onExcited` 与 `包装函数 onExcitedFunc` 两个独立小节。
- 状态：已处理（2026-11-20）。
