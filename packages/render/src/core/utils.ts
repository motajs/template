import { MotaOffscreenCanvas2D } from './canvas2d';
import { Transform } from './transform';

const { gl, gl2 } = checkSupport();

function checkSupport() {
    const canvas = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas2.getContext('webgl2');
    return { gl: !!gl, gl2: !!gl2 };
}

export function isWebGLSupported() {
    return gl;
}

export function isWebGL2Supported() {
    return gl2;
}

export function transformCanvas(
    canvas: MotaOffscreenCanvas2D,
    transform: Transform
) {
    const { ctx } = canvas;
    const mat = transform.mat;
    const [a, b, , c, d, , e, f] = mat;
    ctx.transform(a, b, c, d, e, f);
}
