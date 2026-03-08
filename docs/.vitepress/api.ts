import { basename, join, resolve } from 'node:path';
import { DefaultTheme } from 'vitepress';
import { readdir, stat, writeFile } from 'node:fs/promises';

const apiDir = resolve('./docs/api');
const sidebarConfigPath = resolve('./docs/.vitepress/apiSidebar.ts');

const weight: Record<string, number> = {
    主页: 10,
    函数: 5
};

export async function generateSidebar(): Promise<void> {
    const sidebar: DefaultTheme.SidebarItem[] = [
        { text: '目录', link: '/api/' }
    ];

    // 遍历 api 目录，查找 package 目录
    const dir = await readdir(apiDir);
    const packages = [];
    for (const pkg of dir) {
        const stats = await stat(join(apiDir, pkg));
        if (stats.isDirectory()) {
            packages.push(pkg);
        }
    }

    await Promise.all(
        packages.map(async pkg => {
            const pkgPath = join(apiDir, pkg);
            const dir = await readdir(pkgPath);
            const files = dir.filter(file => file.endsWith('.md'));

            const items: DefaultTheme.SidebarItem[] = files.map(file => {
                const filePath = `api/${pkg}/${file}`;
                const fileName = basename(file, '.md');

                return {
                    text:
                        fileName === 'index'
                            ? '主页'
                            : fileName === 'functions'
                              ? '函数'
                              : fileName,
                    link: `/${filePath.replace(/\\/g, '/')}` // 兼容 Windows 路径
                };
            });

            items.sort((a, b) => {
                const titleA = a.text ?? '';
                const titleB = b.text ?? '';
                return (weight[titleB] ?? 0) - (weight[titleA] ?? 0);
            });

            sidebar.push({
                text: pkg,
                collapsed: true,
                items
            });
        })
    );

    // 生成 sidebar.ts
    const sidebarContent = `import { DefaultTheme } from 'vitepress';

export default ${JSON.stringify(
        sidebar,
        null,
        4
    )} as DefaultTheme.SidebarItem[];`;
    await writeFile(sidebarConfigPath, sidebarContent);
    console.log('✅ Sidebar 配置已更新');
}
