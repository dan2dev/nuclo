// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "首页",
  docs: "文档",
  examples: "示例",
  getStarted: "开始使用",
  menu: "菜单",
  main: "主导航",
  openMenu: "打开菜单",
  closeMenu: "关闭菜单",
  nucloHome: "Nuclo 首页",
  nucloOnGitHub: "Nuclo 的 GitHub",
  opensInNewTab: "（在新标签页中打开）",
  switchTheme: "切换配色主题",
  language: "语言",
};

export const footer = {
  tagline: "显式更新的 UI 运行时。普通函数，可变状态，一次 update() 调用就能把数据同步到 DOM。",
  builtWith: "本站使用 Nuclo 构建。",
  explore: "探索",
  documentation: "文档",
  examples: "示例",
  readme: "README",
  project: "项目",
  github: "GitHub",
  license: "MIT 许可证",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "页面加载失败了",
  loadingLanguage: "正在加载语言…",
  notFound: "页面未找到",
  notFoundHint: "这个地址下什么都没有。",
  goHome: "返回首页",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "预览",
  code: "代码",
  copy: "复制",
  copied: "✓ 已复制",
  copyToClipboard: "复制到剪贴板",
  live: "实时",
  openFullScreen: "全屏打开此示例",
  open: "打开 ↗",
  readTheDocs: "阅读文档 →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - 显式更新的轻量 DOM 框架",
      description: "Nuclo 是轻量、零依赖的 TypeScript DOM 库。用函数写 UI，直接修改普通状态，再调用 update() 即可。没有虚拟 DOM，没有 Proxy，也没有 signal。",
      keywords: "nuclo, dom 框架, 显式更新, 可变状态, javascript, typescript, ui 框架, 轻量, 无虚拟 dom",
    },
    "apps/:id": {
      title: "独立应用 - Nuclo 示例",
      description: "在占满浏览器窗口的工作区中运行的交互式 Nuclo 应用示例。",
    },
    desktop: {
      title: "Nuclo OS - 桌面",
      description: "一个自成一体的桌面，里面的应用都能用：文件、便笺、终端、计算器、计时器、看板、带图表和电子表格的财务应用，还有日历，文件系统则是保存在浏览器里的模拟实现。",
    },
    docs: {
      title: "Nuclo 文档 - 指南与 API 参考",
      description: "Nuclo 文档：安装、标签构建函数、显式 update()、when() 与 list()、事件、生命周期、SSR 与 hydration、类型安全的 CSS-in-TS，以及完整的 API 参考。",
      keywords: "nuclo 文档, api 参考, 入门, update, list, when, on",
    },
    examples: {
      title: "Nuclo 示例 - 计数器、待办列表、搜索与样式",
      description: "附带源码、可直接运行的 Nuclo 示例：计数器、待办列表、实时搜索过滤，以及类型安全的 CSS-in-TS 样式。",
      keywords: "nuclo 示例, 计数器, 待办, 搜索过滤, css-in-ts, 实时演示",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo 示例`,
  exampleDescription: (desc: string) => `${desc} 附源码的 Nuclo 在线示例。`,
  exampleKeywords: (title: string) => `nuclo 示例, ${title.toLowerCase()}, 实时演示, 源码`,
};
