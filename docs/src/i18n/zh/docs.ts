import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "文档",
  title: "Nuclo 文档",
  lead: "一份实用参考：安装 Nuclo、以显式更新构建界面、用类型安全的 CSS 编写样式，以及在服务端渲染 HTML。",
  quickStart: "快速开始",
  quickStartLink: "快速开始",
  nucloMark: "Nuclo 标志",
  facts: { release: "当前版本", builders: "标签构建函数", gzipped: "核心，gzip 压缩后", model: "运行时模型", modelValue: "显式更新" },
  filterSections: "筛选章节",
  filter: "筛选",
  closeNavigator: "关闭导航",
  docsSections: "文档章节",
  docsNavigation: "文档导航",
  onThisPage: "本页内容",
  publicApi: "公共 API",
  linkTo: (title: string) => `链接到 ${title}`,
  openExample: (title: string) => `打开示例 ${title}`,
  example: (title: string) => `示例：${title}`,
};
