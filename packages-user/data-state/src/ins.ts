import { CoreState } from './core';

// TODO: 逐渐弱化 CoreState 的单例概念，每个接口都通过参数传入 ICoreState 对象

/**
 * 数据端核心状态，目前处于过渡阶段，仅服务于渲染，不负责任何逻辑计算，会在后续把核心逻辑逐渐移动至此对象。
 * 此对象是数据端状态，本身不负责任何渲染操作，仅会向渲染端发送数据让渲染端渲染，不要把渲染操作直接放到此对象上，
 * 否则可能导致录像验证失败。
 */
export const state = new CoreState();
