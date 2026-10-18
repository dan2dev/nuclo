// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "ホーム",
  docs: "ドキュメント",
  examples: "サンプル",
  getStarted: "はじめる",
  menu: "メニュー",
  main: "メイン",
  openMenu: "メニューを開く",
  closeMenu: "メニューを閉じる",
  nucloHome: "Nuclo ホーム",
  nucloOnGitHub: "GitHub の Nuclo",
  opensInNewTab: "（新しいタブで開きます）",
  switchTheme: "カラーテーマを切り替える",
  language: "言語",
};

export const footer = {
  tagline: "更新のタイミングを自分で握る UI ランタイム。ふつうの関数とミュータブルな state で組み立てて、データから DOM へは update() ひとつで橋渡しします。",
  builtWith: "このサイトは Nuclo で構築されています。",
  explore: "探す",
  documentation: "ドキュメント",
  examples: "サンプル",
  readme: "README",
  project: "プロジェクト",
  github: "GitHub",
  license: "MIT ライセンス",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "ページの読み込みに失敗しました",
  loadingLanguage: "言語を読み込んでいます…",
  notFound: "ページが見つかりません",
  notFoundHint: "このアドレスには、まだ何もありません。",
  goHome: "ホームページへ移動",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "プレビュー",
  code: "コード",
  copy: "コピー",
  copied: "✓ コピーしました",
  copyToClipboard: "クリップボードにコピー",
  live: "ライブ",
  openFullScreen: "このサンプルを全画面で開く",
  open: "開く ↗",
  readTheDocs: "ドキュメントを読む →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - 更新を自分で決める軽量 DOM フレームワーク",
      description: "Nuclo は依存ゼロで軽量な TypeScript 製 DOM ライブラリです。関数で UI を組み立て、ふつうの state を書き換えて、update() を呼ぶだけ。仮想 DOM もプロキシもシグナルも使いません。",
      keywords: "nuclo, dom フレームワーク, 状態依存の値, 明示的な更新, ミュータブルな状態, javascript, typescript, ui フレームワーク, 軽量",
    },
    "apps/:id": {
      title: "スタンドアロンアプリ - Nuclo サンプル",
      description: "ブラウザ全体をワークスペースにして動かす、インタラクティブな Nuclo アプリのサンプルです。",
    },
    desktop: {
      title: "Nuclo OS - デスクトップ",
      description: "ファイル、ノート、ターミナル、電卓、タイマー、カンバンボード、チャートとスプレッドシート付きのファイナンス、カレンダーが動く、スタンドアロンのデスクトップです。ファイルシステムはシミュレートされ、ブラウザに保存されます。",
    },
    docs: {
      title: "Nuclo ドキュメント - ガイドと API リファレンス",
      description: "Nuclo のドキュメント。インストール、タグビルダー、明示的な update()、when() と list()、イベント、ライフサイクル、SSR とハイドレーション、型付き CSS-in-TS、そして API リファレンスの全体をまとめています。",
      keywords: "nuclo ドキュメント, api リファレンス, はじめに, update, list, when, on",
    },
    examples: {
      title: "Nuclo サンプル - カウンター、Todo リスト、検索、スタイリング",
      description: "ソースコード付きの Nuclo ライブサンプル。カウンター、Todo リスト、リアルタイム検索フィルター、型付き CSS-in-TS スタイリングを動かして試せます。",
      keywords: "nuclo サンプル, カウンター, todo, 検索フィルター, css-in-ts, ライブデモ",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo サンプル`,
  exampleDescription: (desc: string) => `${desc} ソースコード付きの Nuclo ライブサンプルです。`,
  exampleKeywords: (title: string) => `nuclo サンプル, ${title.toLowerCase()}, ライブデモ, ソースコード`,
};
