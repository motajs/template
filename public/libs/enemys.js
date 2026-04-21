///<reference path="../../src/types/declaration/core.d.ts" />

'use strict';

function enemys() {}

////// 初始化 //////
enemys.prototype._init = function () {
    // Deprecated. Remaining for editor compatibility.
    this.enemys = enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80;
    for (var enemyId in this.enemys) {
        this.enemys[enemyId].id = enemyId;
    }
};

enemys.prototype.getEnemys = function () {
    // Deprecated. Remaining for editor compatibility.
    var enemys = core.clone(this.enemys);
    return enemys;
};

////// 判断是否含有某特殊属性 //////
enemys.prototype.hasSpecial = function (special, test) {
    // Deprecated. See packages-user/data-base/src/enemy/enemy.ts Enemy.hasSpecial
};

enemys.prototype.getSpecials = function () {
    // Deprecated. See packages-user/data-state/src/enemy/special.ts
};

////// 获得所有特殊属性的名称 //////
enemys.prototype.getSpecialText = function (enemy) {
    // Deprecated. See packages-user/data-state/src/enemy/special.ts
};

////// 获得所有特殊属性的颜色 //////
enemys.prototype.getSpecialColor = function (enemy) {
    // Deprecated. See packages-user/data-state/src/enemy/special.ts
};

////// 获得所有特殊属性的额外标记 //////
enemys.prototype.getSpecialFlag = function (enemy) {
    // Deprecated.
};

////// 获得每个特殊属性的说明 //////
enemys.prototype.getSpecialHint = function (enemy, special) {
    // Deprecated. See packages-user/data-state/src/enemy/special.ts
};

enemys.prototype._calSpecialContent = function (enemy, content) {
    // Deprecated.
};

////// 获得某个点上某个怪物的某项属性 //////
enemys.prototype.getEnemyValue = function (enemy, name, x, y, floorId) {
    // Deprecated.
};

////// 能否获胜 //////
enemys.prototype.canBattle = function (enemy, x, y, floorId) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype.getDamageString = function (enemy, x, y, floorId, hero) {
    // Deprecated.
};

////// 接下来N个临界值和临界减伤计算 //////
enemys.prototype.nextCriticals = function (enemy, number, x, y, floorId, hero) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.calculateCritical
};

/// 未破防临界采用二分计算
enemys.prototype._nextCriticals_overAtk = function (enemy) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.calculateCritical
};

enemys.prototype._nextCriticals_special = function (enemy) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.calculateCritical
};

enemys.prototype._nextCriticals_useBinarySearch = function (enemy) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.calculateCritical
};

////// N防减伤计算 //////
enemys.prototype.getDefDamage = function (enemy, k, x, y, floorId, hero) {
    // Deprecated. See src/game/enemy/damage.ts DamageEnemy.calDefDamage.
};

enemys.prototype.getEnemyInfo = function (enemy, hero, x, y, floorId) {
    // Deprecated. See packages-user/data-base/src/enemy/context.ts
};

////// 获得战斗伤害信息（实际伤害计算函数） //////
enemys.prototype.getDamageInfo = function (enemy, hero, x, y, floorId) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.getDamageInfo
};

////// 获得在某个勇士属性下怪物伤害 //////
enemys.prototype.getDamage = function (enemy, x, y, floorId, hero) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.getDamageInfo
};

enemys.prototype._getDamage = function (enemy, hero, x, y, floorId) {
    // Deprecated. See packages-user/data-base/src/enemy/damage.ts DamageSystem.getDamageInfo
};

////// 获得当前楼层的怪物列表 //////
enemys.prototype.getCurrentEnemys = function (floorId) {
    // Deprecated. See packages-user/data-base/src/enemy/context.ts EnemyContext.iterateEnemy
};

enemys.prototype._getCurrentEnemys_getEnemy = function (enemyId) {
    // Deprecated.
};

enemys.prototype._getCurrentEnemys_addEnemy = function (enemyId) {
    // Deprecated.
};

enemys.prototype._getCurrentEnemys_addEnemy_defDamage = function (enemy) {
    // Deprecated.
};

enemys.prototype._getCurrentEnemys_sort = function (enemys) {
    // Deprecated.
};

enemys.prototype.hasEnemyLeft = function (enemyId, floorId) {
    // Deprecated.
};
