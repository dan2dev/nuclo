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
  tagline: "明示的に更新する UI ランタイム。通常の関数と変更可能な状態を使い、1 回の呼び出しでデータを DOM に反映します。",
  builtWith: "このサイトは Nuclo で構築されています。",
  explore: "コンテンツ",
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
  notFoundHint: "このアドレスには何もありません。",
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
      title: "Nuclo - 明示的な更新を行う軽量 DOM フレームワーク",
      description: "Nuclo は依存関係ゼロの軽量な TypeScript DOM ライブラリです。関数で UI を構築し、プレーンな状態を変更し、update() を呼び出します。仮想 DOM、プロキシ、シグナルは使いません。",
      keywords: "nuclo, dom フレームワーク, 状態依存の値, 明示的な更新, ミュータブルな状態, javascript, typescript, ui フレームワーク, 軽量",
    },
    "apps/:id": {
      title: "スタンドアロンアプリ - Nuclo サンプル",
      description: "ブラウザ全体を使うワークスペースで動くインタラクティブな Nuclo アプリのサンプルです。",
    },
    desktop: {
      title: "Nuclo OS - デスクトップ",
      description: "動作するアプリ（ファイル、ノート、ターミナル、電卓、タイマー、カンバンボード、チャートとスプレッドシート付きのファイナンス、カレンダー）と、ブラウザに保存されるシミュレートされたファイルシステムを備えたスタンドアロンのデスクトップです。",
    },
    docs: {
      title: "Nuclo ドキュメント - ガイドと API リファレンス",
      description: "Nuclo のドキュメント: インストール、タグビルダー、明示的な update()、when() と list()、イベント、ライフサイクル、SSR とハイドレーション、型付き CSS-in-TS、そして完全な API リファレンス。",
      keywords: "nuclo ドキュメント, api リファレンス, はじめに, update, list, when, on",
    },
    examples: {
      title: "Nuclo サンプル - カウンター、Todo リスト、検索、スタイリング",
      description: "ソースコード付きの Nuclo ライブサンプル: カウンター、Todo リスト、リアルタイム検索フィルター、型付き CSS-in-TS スタイリング。",
      keywords: "nuclo サンプル, カウンター, todo, 検索フィルター, css-in-ts, ライブデモ",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo サンプル`,
  exampleDescription: (desc: string) => `${desc} ソースコード付きの Nuclo ライブサンプルです。`,
  exampleKeywords: (title: string) => `nuclo サンプル, ${title.toLowerCase()}, ライブデモ, ソースコード`,
};
