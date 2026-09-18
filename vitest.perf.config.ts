// 性能测量专用 vitest 配置：仅收集 *.perf.ts，与默认 test:ci 通道完全隔离
import { defineConfig } from 'vitest/config';
import path from 'path';
import * as glob from 'glob';

// 镜像 vite.config.ts 的核心包别名计算，node_modules 下没有 @motajs/* 与 @user/*
const aliases = glob.sync('packages/*/src').map(srcPath => {
    const packageName = path.basename(path.dirname(srcPath));
    return {
        find: `@motajs/${packageName}`,
        replacement: path.resolve(__dirname, srcPath)
    };
});

// 镜像 vite.config.ts 的用户包别名计算，保证 perf 文件及其传递依赖可解析
const aliasesUser = glob.sync('packages-user/*/src').map(srcPath => {
    const packageName = path.basename(path.dirname(srcPath));
    return {
        find: `@user/${packageName}`,
        replacement: path.resolve(__dirname, srcPath)
    };
});

export default defineConfig({
    resolve: {
        alias: [...aliases, ...aliasesUser]
    },
    test: {
        include: ['**/*.perf.ts'],
        testTimeout: 30000,
        hookTimeout: 30000
    }
});
