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
  tagline: "采用显式更新的 UI 运行时。使用普通函数和可变状态，只需一次调用即可将数据同步到 DOM。",
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
  failedToLoad: "页面加载失败",
  loadingLanguage: "正在加载语言…",
  notFound: "页面未找到",
  notFoundHint: "此地址下没有任何内容。",
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
      description: "Nuclo 是一个轻量、零依赖的 TypeScript DOM 库。用函数构建 UI，直接修改普通状态，再调用 update()。没有虚拟 DOM、代理或信号。",
      keywords: "nuclo, dom 框架, 状态依赖值, 显式更新, 可变状态, javascript, typescript, ui 框架, 轻量",
    },
    "apps/:id": {
      title: "独立应用 - Nuclo 示例",
      description: "在占满浏览器窗口的工作区中运行的交互式 Nuclo 应用示例。",
    },
    desktop: {
      title: "Nuclo OS - 桌面",
      description: "一个带有可用应用的独立桌面：文件、便笺、终端、计算器、计时器、看板、带图表与电子表格的财务应用，以及日历，还有一个保存在浏览器中的模拟文件系统。",
    },
    docs: {
      title: "Nuclo 文档 - 指南与 API 参考",
      description: "Nuclo 文档：安装、标签构建函数、显式 update()、when() 与 list()、事件、生命周期、SSR 与水合、类型安全的 CSS-in-TS，以及完整的 API 参考。",
      keywords: "nuclo 文档, api 参考, 入门, update, list, when, on",
    },
    examples: {
      title: "Nuclo 示例 - 计数器、待办列表、搜索与样式",
      description: "带源码的 Nuclo 实时示例：计数器、待办列表、实时搜索过滤器，以及类型安全的 CSS-in-TS 样式。",
      keywords: "nuclo 示例, 计数器, 待办, 搜索过滤, css-in-ts, 实时演示",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo 示例`,
  exampleDescription: (desc: string) => `${desc} 一个带源码的 Nuclo 实时示例。`,
  exampleKeywords: (title: string) => `nuclo 示例, ${title.toLowerCase()}, 实时演示, 源码`,
};
