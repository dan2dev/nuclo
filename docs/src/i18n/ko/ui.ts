// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "홈",
  docs: "문서",
  examples: "예제",
  getStarted: "시작하기",
  menu: "메뉴",
  main: "메인 내비게이션",
  openMenu: "메뉴 열기",
  closeMenu: "메뉴 닫기",
  nucloHome: "Nuclo 홈",
  nucloOnGitHub: "GitHub의 Nuclo",
  opensInNewTab: " (새 탭에서 열립니다)",
  switchTheme: "색상 테마 전환",
  language: "언어",
};

export const footer = {
  tagline: "명시적인 UI 런타임. 평범한 함수와 변경 가능한 상태, 그리고 데이터와 DOM 사이를 잇는 호출 단 하나.",
  builtWith: "이 사이트는 Nuclo로 만들었습니다.",
  explore: "둘러보기",
  documentation: "문서",
  examples: "예제",
  readme: "README",
  project: "프로젝트",
  github: "GitHub",
  license: "MIT 라이선스",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "페이지를 불러오지 못했습니다",
  loadingLanguage: "언어를 불러오는 중…",
  notFound: "페이지를 찾을 수 없습니다",
  notFoundHint: "이 주소에는 페이지가 없습니다.",
  goHome: "홈으로 이동",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "미리보기",
  code: "코드",
  copy: "복사",
  copied: "✓ 복사됨",
  copyToClipboard: "클립보드에 복사",
  live: "라이브",
  openFullScreen: "이 예제를 전체 화면으로 열기",
  open: "열기 ↗",
  readTheDocs: "문서 읽기 →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - 명시적 업데이트를 사용하는 경량 DOM 프레임워크",
      description: "Nuclo는 외부 의존성이 없는 경량 TypeScript DOM 라이브러리입니다. 함수로 UI를 만들고, 평범한 상태를 바꾼 다음 update()를 호출합니다. 가상 DOM, 프록시, 시그널을 사용하지 않습니다.",
      keywords: "nuclo, DOM 프레임워크, 상태에 의존하는 값, 명시적 업데이트, 변경 가능한 상태, javascript, typescript, UI 프레임워크, 경량",
    },
    "apps/:id": {
      title: "독립 실행형 앱 - Nuclo 예제",
      description: "브라우저 전체 작업 공간에서 실행되는 대화형 Nuclo 앱 예제입니다.",
    },
    desktop: {
      title: "Nuclo OS - 데스크톱",
      description: "파일, 메모, 터미널, 계산기, 타이머, 칸반 보드, 차트와 스프레드시트가 있는 재무 앱, 캘린더를 갖춘 독립 실행형 데스크톱입니다. 가상 파일 시스템은 브라우저에 저장됩니다.",
    },
    docs: {
      title: "Nuclo 문서 - 가이드 및 API 참조",
      description: "Nuclo 문서: 설치, 태그 빌더, 명시적 update(), when()과 list(), 이벤트, 생명주기, SSR과 하이드레이션, 타입이 지정된 CSS-in-TS, 전체 API 참조를 다룹니다.",
      keywords: "nuclo 문서, API 참조, 시작하기, update, list, when, on",
    },
    examples: {
      title: "Nuclo 예제 - 카운터, 할 일 목록, 검색 및 스타일링",
      description: "소스 코드가 포함된 Nuclo 라이브 예제입니다. 카운터, 할 일 목록, 실시간 검색 필터, 타입이 지정된 CSS-in-TS 스타일링을 살펴볼 수 있습니다.",
      keywords: "nuclo 예제, 카운터, 할 일, 검색 필터, css-in-ts, 라이브 데모",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo 예제`,
  exampleDescription: (desc: string) => `${desc} 소스 코드가 포함된 Nuclo 라이브 예제입니다.`,
  exampleKeywords: (title: string) => `nuclo 예제, ${title.toLowerCase()}, 라이브 데모, 소스 코드`,
};
