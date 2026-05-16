const backDirMap: Record<Dir2, Dir2> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
    leftup: 'rightdown',
    rightup: 'leftdown',
    leftdown: 'rightup',
    rightdown: 'leftup'
};

export function backDir(dir: Dir): Dir;
export function backDir(dir: Dir2): Dir2;
export function backDir(dir: Dir2): Dir2 {
    return backDirMap[dir];
}

export function has<T>(v: T): v is NonNullable<T> {
    return v !== null && v !== void 0;
}

export function ensureArray<T>(arr: T): T extends any[] ? T : T[] {
    // @ts-expect-error 需要弃用
    return arr instanceof Array ? arr : [arr];
}

export function ofDir(x: number, y: number, dir: Dir2): LocArr {
    const { x: dx, y: dy } = core.utils.scan2[dir];
    return [x + dx, y + dy];
}

/**
 * 计算曼哈顿距离
 */
export function manhattan(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function formatDamage(damage: number): DamageString {
    let dam = '';
    let color = '';
    if (!Number.isFinite(damage)) {
        dam = '???';
        color = '#f22';
    } else {
        dam = core.formatBigNumber(damage, true);
        if (damage <= 0) color = '#1f1';
        else if (damage < core.status.hero.hp / 3) color = '#fff';
        else if (damage < (core.status.hero.hp * 2) / 3) color = '#ff0';
        else if (damage < core.status.hero.hp) color = '#f93';
        else color = '#f22';
    }

    return { damage: dam, color: color as Color };
}

/**
 * 获取两个坐标的相对方向
 * @param from 初始坐标
 * @param to 指向坐标
 */
export function findDir(from: Loc, to: Loc): Dir | 'none' {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    return (
        (Object.entries(core.utils.scan).find(v => {
            return v[1].x === dx && v[1].y === dy;
        })?.[0] as Dir) ?? 'none'
    );
}
