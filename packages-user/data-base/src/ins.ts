import { LoadProgressTotal } from '@motajs/loader';
import { MotaDataLoader } from './load';

//#region 加载实例

/** 加载进度 */
export const loadProgress = new LoadProgressTotal();
/** 数据端加载对象 */
export const dataLoader = new MotaDataLoader(loadProgress);

//#endregion
