import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1,...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "문서",
  title: "Nuclo 문서",
  lead: "Nuclo 설치, 명시적 업데이트를 통한 UI 구성, 타입이 지정된 CSS 스타일링, 서버 측 HTML 렌더링을 위한 실용적인 참조 문서입니다.",
  quickStart: "빠른 시작",
  quickStartLink: "빠른 시작",
  nucloMark: "Nuclo 로고",
  facts: { release: "현재 버전", builders: "태그 빌더", gzipped: "코어, gzip 압축", model: "런타임 모델", modelValue: "명시적" },
  filterSections: "섹션 필터링",
  filter: "필터",
  closeNavigator: "탐색기 닫기",
  docsSections: "문서 섹션",
  docsNavigation: "문서 탐색",
  onThisPage: "이 페이지의 내용",
  publicApi: "공개 API",
  linkTo: (title: string) => `${title} 링크`,
  openExample: (title: string) => `${title} 예제 열기`,
  example: (title: string) => `예제: ${title}`,
};
