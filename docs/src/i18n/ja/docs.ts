import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "ドキュメント",
  title: "Nuclo ドキュメント",
  lead: "インストールから、update() による明示的な UI 更新、型付き CSS でのスタイリング、サーバーサイドでの HTML 出力まで。手を動かしながら引ける、Nuclo の実践リファレンスです。",
  quickStart: "クイックスタート",
  quickStartLink: "クイックスタート",
  nucloMark: "Nuclo のマーク",
  facts: { release: "現在のリリース", builders: "タグビルダー", gzipped: "コアの gzip 圧縮後サイズ", model: "ランタイムモデル", modelValue: "明示的" },
  filterSections: "セクションを絞り込む",
  filter: "絞り込み",
  closeNavigator: "ナビゲーターを閉じる",
  docsSections: "ドキュメントのセクション",
  docsNavigation: "ドキュメントのナビゲーション",
  onThisPage: "このページの内容",
  publicApi: "公開 API",
  linkTo: (title: string) => `${title} へのリンク`,
  openExample: (title: string) => `${title} のサンプルを開く`,
  example: (title: string) => `サンプル: ${title}`,
};
