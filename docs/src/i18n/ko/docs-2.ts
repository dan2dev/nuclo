import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "스타일링",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>타입이 지정된 스타일 객체를 생성된 CSS 클래스로 변환합니다. 결과를 태그 빌더에 전달합니다. 브라우저에서 규칙은 하나의 <code>&lt;style id="nuclo-styles"&gt;</code> 요소로 들어갑니다. 서버에서는 <a href="#api-css-text"><code>getCssText()</code></a>가 이를 반환합니다.</p>
      ${code("card.ts", `
const card = css({
  p: 16,
  rounded: 8,
  bg: '#fff7ed',
  hover: { bg: '#ffedd5' },
})

const Card = () => div(card, 'Simple card')
`)}
      <ul>
        <li><code>css()</code>는 기본 선언에 대해 하나의 클래스를 만들고 각 가상 선택자 키, 선택자 및 미디어 블록에 대해 하나의 클래스를 만듭니다. 위의 카드는 두 가지 클래스를 얻습니다.</li>
        <li>클래스 이름은 콘텐츠의 해시입니다. 동일한 스타일은 클래스를 공유하며 서버와 클라이언트는 동일한 이름을 생성합니다.</li>
        <li>모듈 최상위에서 스타일을 한 번 정의합니다. <code>css()</code>는 객체별로 캐시하므로 호출할 때마다 새 객체가 매번 다시 처리됩니다.</li>
        <li>스타일 객체를 <code>css()</code>에 전달한 후 변경하면 아무 작업도 수행되지 않습니다.</li>
        <li>모든 스타일은 페이지 또는 서버 프로세스의 수명 동안 등록된 상태로 유지됩니다. 데이터의 너비와 같이 항목별로 변경되는 값의 경우 <a href="#attributes"><code>style</code> 속성</a>을 사용하세요.</li>
      </ul>
      <h3>명명된 스타일</h3>
      <p>읽을 수 있는 클래스 이름을 얻으려면 먼저 이름을 전달하세요.</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>기본 클래스는 바로 이름입니다. 다른 블록은 <code>name-&lt;hash&gt;</code>를 얻습니다.</li>
        <li>이름은 유효한 클래스 이름이어야 합니다. 그렇지 않으면 Nuclo가 경고하고 생성합니다.</li>
        <li>이름은 전역적입니다. 두 가지 다른 스타일이 동일한 이름을 사용하는 경우 Nuclo가 경고합니다.</li>
      </ul>
      <h3>결과 사용</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> 및 <code>card.className</code>는 모두 클래스 이름을 반환합니다.</p>
    `,
      },
      {
        id: "style-objects",
        title: "스타일 객체",
        content: `
      <p><code>css()</code>에 전달하는 객체는 camelCase의 일반적인 CSS 속성, 약식 집합 및 가상 상태, 선택자 및 미디어 쿼리에 대한 중첩 키를 사용합니다. TypeScript는 모든 항목을 자동 완성합니다. <code>borderTopLeftRadius</code>, <code>fill</code> 또는 <code>paddingInline</code>와 같이 타입 정의에 없는 속성은 <code>raw</code>에 들어갑니다(아래 참조).</p>
      <h3>값</h3>
      <ul>
        <li>숫자에는 <code>px</code>가 붙습니다. <code>0</code>과 단위 없는 속성(<code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code>, <code>gridRow</code>)은 예외입니다. <code>raw</code> 안의 <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code>, <code>animation-iteration-count</code>에도 단위가 붙지 않습니다.</li>
        <li>문자열은 작성된 대로 사용됩니다. <code>null</code>, <code>undefined</code> 및 <code>false</code>는 건너뜁니다.</li>
        <li><code>lineHeight</code>(및 <code>leading</code>)는 단위가 없으므로 <code>leading: 24</code>는 글꼴 크기의 24배를 의미합니다. 픽셀 단위라면 <code>"24px"</code>를 작성하세요.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>축약형</h3>
      <table>
        <thead><tr><th>키</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>패딩 및 각 사이드</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>좌우 패딩 / 상하 패딩</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>여백도 동일</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>폭, 높이 및 최소 및 최대</td></tr>
          <tr><td><code>size</code></td><td>폭 및 높이</td></tr>
          <tr><td><code>bg</code></td><td>배경</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>이 키에는 <code>true</code>가 사용됩니다.</p>
      <table>
        <thead><tr><th>키</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (display는 설정하지 않음)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>가상 상태</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code>(<code>:first-child</code>), <code>last</code>(<code>:last-child</code>), <code>only</code>(<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> 및 <code>firstLetter</code>. 중첩할 수도 있습니다: <code>hover: { focus: {…} }</code>는 <code>:hover:focus</code>를 제공합니다.</p>
      <h3>선택자 및 at-규칙</h3>
      <p><code>&amp;</code>로 시작하는 키는 선택자이며 각 <code>&amp;</code>는 클래스가 됩니다. <code>@</code>로 시작하는 키는 at-rule(<code>@media</code>, <code>@container</code> 또는 <code>@supports</code>)입니다.</p>
      ${code("menu.ts", `
const menu = css({
  p: 8,
  '& > li': { py: 4 },
  '& > li:hover': { color: 'red' },
  '&:is(.dark *)': { color: 'white' },
  '@media (min-width: 768px)': { p: 16 },
})
`)}
      <ul>
        <li>키는 <code>&amp;</code>로 시작해야 합니다. <code>".dark &amp;"</code>와 같은 키는 무시되므로 <code>"&amp;:is(.dark *)"</code>를 작성하세요.</li>
        <li>두 개의 중첩된 <code>@media</code> 블록이 <code>and</code>와 결합됩니다. 문법이 처음에만 타입을 허용하기 때문에 미디어 타입(<code>print</code>, <code>only screen</code>)이 이끄는 쿼리가 먼저 배치됩니다. 평면화할 수 없는 쌍(두 개의 미디어 타입 또는 선행 <code>not</code>)은 경고하고 내부 쿼리만 사용합니다. 다른 중첩된 at-규칙은 외부 규칙을 대체합니다.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>임의의 CSS 속성은 <code>raw</code>에 CSS 이름 그대로 작성할 수 있습니다. 숫자에는 여기서도 <code>px</code>가 붙으므로 단위를 직접 지정하려면 문자열을 전달하세요.</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>다른 일반 키는 케밥 케이스로 변환되어 그대로 작성되므로 <code>colr: 'red'</code>와 같은 오타는 브라우저가 삭제하는 선언이 됩니다. 가상 상태, screen 설정, <code>&amp;</code> 또는 <code>@</code> 키에 해당하지 않는 키 아래의 중첩 객체는 무시됩니다. TypeScript는 둘 다 보고합니다.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>스타일을 결합합니다. 두 입력이 동일한 속성을 설정하면 나중에 입력이 우선합니다.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>falsy 값을 건너뛰고, 배열을 평면화하고, 문자열을 분할하고 중복을 제거합니다.</li>
        <li>동일한 블록(기본, 동일한 가상 선택자, 동일한 미디어 쿼리)에 대해 생성된 클래스가 하나의 새로운 클래스로 병합됩니다. 다른 클래스 이름은 변경되지 않고 전달됩니다.</li>
        <li><code>cx()</code>만이 인수 순서를 알고 있습니다. <code>div(base, blue)</code>를 사용하면 두 클래스가 모두 추가되고 마지막에 생성된 규칙이 적용됩니다. 하나의 <code>cx()</code> 호출에 서로 재정의되는 스타일을 넣습니다.</li>
        <li>명명된 스타일의 블록이 다른 입력의 블록과 병합될 때 병합된 클래스는 기본 이름이 아닌 <code>name-&lt;hash&gt;</code>입니다. 병합되지 않는 블록은 클래스를 유지하므로 <code>cx(pageTitle, 'extra')</code>에는 여전히 <code>page-title</code>가 있습니다.</li>
      </ul>
      <h3>동적 클래스</h3>
      <p>항상 <code>cx(...)</code>를 반환하는 함수를 전달합니다.</p>
      ${code("toggle.ts", `
const baseButton = css({ px: 12, py: 8, border: '1px solid #ccc' })
const activeButton = css({ bg: '#ff3f00', color: 'white' })

let active = false

const Toggle = () =>
  button(
    () => cx(baseButton, active && activeButton),
    () => (active ? 'Active' : 'Inactive'),
    { onClick: () => { active = !active; update() } },
  )
`)}
      <p>함수는 처음 실행 시 스타일 결과를 반환해야 합니다. <code>() =&gt; active &amp;&amp; activeButton</code>는 클래스 대신 "false" 텍스트를 렌더링합니다.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>테마에 바인딩된 자체 <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> 및 <code>globalStyle</code>를 반환합니다. 테마는 값에 이름을 부여합니다. 아래 테마를 사용하면 <code>borderColor: 'border'</code>가 <code>#e5e7eb</code>를 쓰고 TypeScript가 이름을 자동 완성합니다. <code>screens</code>의 각 항목은 <code>md: {…}</code>와 같은 미디어 쿼리의 스타일 키가 됩니다.</p>
      ${code("theme.ts", `
export const { css, cx, variants } = createCss({
  colors: { primary: '#ff3f00', border: '#e5e7eb' },
  radii: { card: '12px' },
  screens: { md: '(min-width: 768px)' },
})

const panel = css({
  p: 12,
  rounded: 'card',
  border: '1px solid',
  borderColor: 'border',
  md: { p: 24 },
})
`)}
      <table>
        <thead><tr><th>테마 키</th><th>사용 대상</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> 및 각 측면, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td><code>md: {…}</code>와 같은 새로운 스타일 키</td></tr>
        </tbody>
      </table>
      <ul>
        <li>테마 이름은 값 전체가 토큰 이름일 때만 치환됩니다. <code>border: "1px solid primary"</code>는 치환되지 않습니다.</li>
        <li><code>@</code>가 없는 screen 설정값은 <code>@media &lt;value&gt;</code>가 됩니다. <code>@</code>로 시작하는 값은 작성된 대로 사용됩니다(예: <code>"@container (min-width: 400px)"</code>).</li>
        <li>screen 설정은 <code>createCss()</code>로 만든 인스턴스에만 존재합니다. 전역 <code>css()</code>에는 screen 설정이 없지만 <code>@media</code> 키를 허용합니다.</li>
        <li>모든 인스턴스와 전역 도우미는 하나의 스타일시트를 공유합니다. 스크린 미디어 규칙은 스크린을 사용하는 순서가 아닌 선언된 순서대로 출력되므로 <code>min-width</code> 스크린을 작은 것부터 큰 것 순으로 나열합니다. 앱당 하나의 <code>createCss()</code> 인스턴스를 사용하여 해당 순서가 테마의 순서가 되도록 합니다.</li>
        <li>반환값의 <code>theme</code>는 전달한 테마 객체입니다.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>버튼의 의도 및 크기와 같은 옵션 세트에 대한 스타일을 반환하는 함수를 빌드합니다.</p>
      ${code("button.ts", `
const buttonClass = variants({
  base: { px: 12, py: 8, rounded: 6 },
  variants: {
    intent: { primary: { bg: '#2563eb' }, danger: { bg: '#dc2626' } },
    size: { sm: { text: 12 }, lg: { text: 18 } },
    block: { true: { w: '100%' } },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
  compoundVariants: [{ intent: 'danger', size: 'lg', css: { weight: 700 } }],
})

button(buttonClass(), 'Save')                                                // primary, sm
button(buttonClass({ intent: 'danger', size: 'lg', block: true }), 'Delete') // bold, full width
`)}
      <ul>
        <li>스타일은 <code>base</code>, 각 그룹에서 선택한 값, 일치하는 각 복합 조건 순서로 병합됩니다. 속성마다 나중에 전달한 스타일이 우선합니다.</li>
        <li>생략하거나 <code>undefined</code> 또는 <code>null</code>로 전달한 옵션은 기본값을 사용합니다. 기본값이 없는 그룹은 건너뜁니다.</li>
        <li><code>true</code> 및 <code>false</code> 키만 있는 그룹은 불리언을 사용합니다.</li>
        <li>나열된 모든 그룹이 일치할 때 복합 조건의 스타일이 적용됩니다(기본값 포함).</li>
        <li>각 선택 항목은 한 번만 작성되고 캐시됩니다.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() 및 globalStyle()",
        content: `
      <p><code>keyframes()</code>는 애니메이션을 등록하고 생성된 이름을 반환합니다. 프레임 키는 <code>from</code>, <code>to</code> 및 백분율(예: <code>"50%"</code> 또는 <code>"0%, 100%"</code>)입니다. 프레임은 평면 속성만 사용합니다. 동일한 프레임은 동일한 이름을 반환합니다.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code>는 모든 선택자에 대한 규칙을 추가합니다.</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>선택자는 작성된 대로 정확하게 사용됩니다.</li>
        <li>평면 속성만 작동합니다. 가상 선택자 키, screen 설정 및 <code>@</code> 키는 무시되므로 <code>globalStyle()</code>는 미디어 규칙을 작성할 수 없습니다.</li>
        <li>동일한 규칙은 한 번만 추가됩니다. 같은 선택자에 다른 스타일을 지정하면 규칙이 하나 더 추가되고 나중 규칙이 우선합니다.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() 및 resetStyles()",
        content: `
      <p><code>getCssText()</code>는 이 프로세스에서 <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> 및 <code>globalStyle()</code>가 생성한 모든 규칙을 반환합니다. 기본 규칙을 먼저 반환한 다음 <code>@media</code>, <code>@container</code> 및 <code>@supports</code> 블록. 서버 렌더링에 사용합니다.</p>
      <ul>
        <li><code>renderToString()</code> 이후에 호출하세요. 렌더링 중에 생성된 규칙이 포함됩니다.</li>
        <li>하나의 페이지나 요청이 아닌 전체 프로세스의 규칙을 포함하며, 규칙은 계속 누적됩니다. 클래스 이름은 콘텐츠 해시이므로 안전합니다.</li>
        <li><code>&lt;style id="nuclo-styles"&gt;</code>에 넣으세요. 클라이언트는 해당 요소를 재사용하고 이미 포함된 규칙을 건너뜁니다. 다른 ID를 사용하거나 ID를 생략하면 클라이언트는 모든 규칙을 담은 스타일시트를 하나 더 추가합니다.</li>
        <li>텍스트는 이스케이프되지 않으므로 신뢰할 수 없는 입력을 스타일 값에 넣지 마십시오.</li>
      </ul>
      <p><code>resetStyles()</code>는 테스트 도우미입니다. 모든 규칙과 <code>#nuclo-styles</code> 요소를 제거합니다. 이전에 생성한 스타일은 클래스 이름을 유지하지만 CSS를 잃습니다. 앱이나 서버에서 호출하지 마세요.</p>
      ${code("setup.test.ts", `
import { resetStyles } from 'nuclo'

beforeEach(() => resetStyles())
`)}
    `,
      },
    ],
  },

  // ── Routing ──────────────────────────────────────────────────────────────
  {
    title: "라우팅",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>별도 패키지:</strong> <code>nuclo-router</code>는 Nuclo 코어 패키지의 일부가 아닙니다. <code>nuclo</code> 옆에 설치하세요. 미리보기 릴리스이므로 API가 여전히 변경될 수 있습니다.</div>
      <p>Nuclo용 라우팅 라이브러리로, <code>list()</code>와 <code>update()</code>를 기반으로 서버 렌더링, 하이드레이션, 코드 분할 라우트, 유휴 시간 사전 로드를 제공합니다. gzip 압축 시 약 ${NUCLO_ROUTER_GZIP_KB} KB이며 Nuclo 외에는 의존성이 없습니다. 부수 효과가 없어 사용하지 않으면 트리 셰이킹으로 제거됩니다.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>또는 동일한 두 이름으로 <code>pnpm add</code>, <code>yarn add</code> 또는 <code>bun add</code>를 사용합니다. 피어 의존성으로 <code>nuclo</code> 0.3 이상이 필요합니다.</p>
      <p>라우터는 <em>무엇을</em> 로드할지 결정하고, 앱은 <code>router.outlet()</code>으로 <em>어디에</em> 표시할지 지정합니다. 레이어 스택을 하나의 <code>list()</code>로 렌더링하며 레이어마다 행이 하나씩 있으므로 일반 페이지는 행 하나입니다. 서버와 클라이언트가 동일한 트리를 만들기 때문에 <code>hydrate()</code>는 서버 노드를 교체하지 않고 재사용합니다. 나머지는 <code>history</code>, 위임된 <code>click</code> 리스너 하나, <code>requestIdleCallback</code>으로 구성됩니다.</p>
      <h3>한 번 정의하고 어디서든 가져오기</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code>는 일치하는 라우트의 모듈을 모두 확인한 뒤 완료되므로 서버와 클라이언트 모두 첫 번째 트리를 완성된 상태로 만듭니다. 이후에는 라우터가 시작한 Route로 접근을 전달하므로 <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>로 해당 Route를 사용합니다.</p>
      <h3>전체 앱</h3>
      ${code("routes.ts", `
// isomorphic: imported by the browser and the server
import { createRouter } from 'nuclo-router'

export const router = createRouter({
  '/':           () => import('./pages/Home.ts'),
  '/docs':       () => import('./pages/Docs.ts'),
  '/blog/:slug': () => import('./pages/Post.ts'),
  '*':           () => import('./pages/NotFound.ts'),
})

export const App = () =>
  div(
    header(a({ href: router.href('/') }, 'Home'), a({ href: router.href('/docs') }, 'Docs')),
    main(
      when(() => router.pending, Spinner()),
      when(() => router.error !== null, ErrorView()),
      router.outlet(),   // where the pages land
    ),
    footer('© nuclo'),
  )
`)}
      ${code("pages/Post.ts", `
import type { RouteContext } from 'nuclo-router'
import { router } from '../routes.ts'

// A page is plain content
export default function Post(ctx: RouteContext) {
  // A query-only change keeps the page, so the query is read live.
  return article(h1(ctx.params.slug), p(() => (router.search.has('preview') ? 'draft' : '')))
}
`)}
      ${code("main.ts", `
import 'nuclo'
import { router, App } from './routes.ts'

await router.start()
hydrate(App, document.getElementById('app')!)   // or render() without SSR
`)}
      ${code("server.ts", `
import 'nuclo/polyfill'
import 'nuclo'
import { renderToString } from 'nuclo/ssr'
import { router, App } from './routes.ts'

// one Route per request
const route = await router.start(request.url)
const html = route.run(() => renderToString(App))
`)}
      <p>이것이 전체 통합입니다. <code>&lt;a href&gt;</code>는 단지 <code>&lt;a href&gt;</code>이기 때문에 링크가 작동합니다. <code>document</code>의 위임된 리스너 중 하나는 라우터가 소유한 링크를 가로채고 다른 모든 링크를 브라우저에 남겨둡니다.</p>
      <p>서버에서 <code>start()</code>는 요청마다 <code>Route</code>를 반환하고 라우터 자체는 변경하지 않으므로 동시 요청이 서로의 라우트를 참조하지 않습니다. <code>route.run()</code>은 렌더링하는 동안 해당 Route를 라우터의 활성 라우트로 설정하며, 아웃렛도 이 Route를 읽습니다. 브라우저에서는 페이지 로드당 Route가 하나이고 <code>start()</code>가 이를 라우터의 활성 Route로 설정하므로 <code>run()</code>이 필요하지 않습니다.</p>
      <p>페이지는 <a href="#router-api"><code>RouteContext</code></a> 및 <a href="#router-api"><code>PageProps</code></a>를 <code>(ctx, { layer, data, outlet, beforeLeave })</code>로 수신하며 더 적은 인수를 사용할 수 있습니다. <code>list()</code>가 허용하는 모든 것을 반환합니다. 레이아웃의 다른 부분도 채우려면 페이지 내부에서 <code>div(article(…), into('sidebar', nav(…)))</code>와 같은 <code>into()</code>를 반환하세요. 해당 콘텐츠는 페이지와 함께 사라집니다. <a href="#router-regions">페이지 &amp; 영역</a>를 참조하세요.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "패턴 및 중첩 라우트",
        content: `
      <table>
        <thead><tr><th>패턴</th><th>일치 대상</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>해당 경로와 정확히 일치</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>다른 패턴과 일치하지 않는 모든 경로(404 처리)</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>정적 패턴이 우선하고, 다음은 선언 순서에 따른 동적 패턴, 마지막은 접두사가 긴 순서의 catch-all 패턴입니다. 따라서 <code>'*'</code>는 다른 패턴과 일치하지 않는 경로만 처리하며 테이블 어디에 선언해도 됩니다. 후행 슬래시, 중복 슬래시, 퍼센트 인코딩은 정규화되고 매개변수 값은 디코딩되어 전달됩니다. 패턴별로 세그먼트를 비교하며 정규식을 생성하거나 실행하지 않습니다.</p>
      <h3>상대 경로</h3>
      <p><code>./</code>로 시작하는 패턴은 선언된 상위 패턴을 기준으로, <code>./</code>로 시작하는 href는 활성 라우트를 기준으로 해석됩니다. 이를 함께 사용하면 어떤 상위 경로에 배치해도 동일하게 동작하는 섹션을 만들 수 있습니다. 테이블의 값은 로더 또는 상대 경로를 키로 사용하는 중첩 테이블입니다.</p>
      ${code("records/routes.ts", `
import type { RouteTable } from 'nuclo-router'

// a section, with no idea where it lives
export const recordSection: RouteTable = {
  '/':             () => import('./Record.ts'),   // the parent path itself
  './preview':     () => import('./Preview.ts'),
  './preview/raw': () => import('./Raw.ts'),
}
`)}
      ${code("routes.ts", `
// declare it wherever it belongs
createRouter({
  '/': () => import('./pages/Home.ts'),
  '/invoices/:id':  recordSection,
  '/customers/:id': recordSection,
  '*': () => import('./pages/NotFound.ts'),
})
`)}
      <p>이 두 줄은 경로를 두 번 쓰지 않고 6개 패턴을 모두 생성합니다. 두 상위 경로 모두 동일한 로더 객체를 참조하므로 하나의 모듈 캐시와 하나의 <code>import()</code>를 공유합니다.</p>
      <ul>
        <li>하위 테이블 내부에서 <code>'./x'</code>, <code>'/x'</code> 및 <code>'x'</code>는 모두 같은 의미이고, <code>'/'</code>는 상위 경로 자체를 의미하며, <code>'*rest'</code>는 섹션에 자체 catch-all을 제공합니다. 중첩은 원하는 만큼 깊어집니다.</li>
        <li>최상위 키는 작성된 대로 사용되므로 <code>'*'</code>는 <code>'*'</code>를 유지합니다.</li>
        <li><code>*catch-all</code> 부모 아래의 자식은 <code>createRouter()</code> 오류입니다. catch-all은 패턴의 마지막에 와야 하기 때문입니다.</li>
      </ul>
      <h3>상위 페이지 및 <code>outlet()</code></h3>
      <p>부모와 자식 페이지는 실제 계층 구조를 이룹니다. 부모 페이지가 렌더링되고, 자식 페이지는 부모가 <code>outlet()</code>을 호출한 위치에 렌더링됩니다.</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>하위 페이지 사이를 이동해도 상위 페이지는 다시 생성되지 않습니다. 같은 DOM 노드를 유지하므로 포커스, 스크롤 위치, 입력 중인 텍스트, 클로저의 모든 상태가 그대로 유지됩니다.</p>
      <ul>
        <li>하위 라우트가 없는 페이지의 아웃렛은 비어 있으므로 레이아웃에서 조건 없이 호출할 수 있습니다. 하위 라우트가 있는데 상위 페이지가 <code>outlet()</code>을 호출하지 않으면 하위 페이지는 표시되지 않습니다.</li>
        <li>인덱스 경로가 없습니다. <code>'/'</code>는 레이아웃 자체이므로 상위 경로는 내부에 별도의 인덱스 페이지가 아닌 빈 아웃렛이 있는 레이아웃을 렌더링합니다. 랜딩 콘텐츠를 레이아웃에 넣거나 실제 하위 경로를 제공하세요.</li>
      </ul>
      <p>따라서 같은 호출이 어느 부모 아래에서든 동작하며, 페이지가 자신의 부모를 몰라도 사용할 수 있습니다.</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code>, <code>..</code>는 URL의 디렉터리가 아니라 현재 라우트의 경로를 기준으로 해석됩니다. <code>/invoices/42</code>에서 <code>./preview</code>는 <code>/invoices/42/preview</code>입니다. 브라우저의 기본 규칙으로는 <code>/invoices/preview</code>가 되며, URL 끝의 슬래시는 라우터의 결과에 영향을 주지 않습니다. <code>../</code>는 세그먼트 단위로 상위 경로로 이동하되 루트에서 멈춥니다. 쿼리와 해시는 유지되고 <code>base</code>가 다시 붙으며, 해석된 절대 경로가 히스토리에 기록됩니다. React Router의 <code>&lt;Link to="./x"&gt;</code>도 같은 방식으로 URL 표준과 다른 경로 해석을 적용합니다.</p>
      <ul>
        <li><code>./</code> 및 <code>../</code>만 경로 기준입니다. href의 기본 <code>preview</code>는 일반 브라우저 규칙에 따릅니다.</li>
        <li><code>href="./preview"</code>를 직접 작성하는 대신 <code>router.href('./preview')</code>로 상대 링크를 구축하세요. <code>href()</code>는 렌더링 시 확인되므로 제공되는 마크업은 절대적이며 크롤러, 중간 클릭 및 JavaScript가 비활성화된 경우에도 여전히 정확합니다.</li>
      </ul>
      <h3>유지되는 것과 재구축되는 것</h3>
      <table>
        <thead><tr><th>노드</th><th>탐색 중</th></tr></thead>
        <tbody>
          <tr><td>패턴과 경로가 바뀌지 않은 상위 페이지</td><td><strong>유지</strong>: 동일한 노드를 재사용하며 <code>load()</code>도 다시 실행하지 않습니다.</td></tr>
          <tr><td>일치한 페이지</td><td>패턴과 경로가 같고 <code>load()</code>가 없으면 <strong>유지</strong>됩니다. 쿼리나 해시만 바뀌어도 유지됩니다. 로더가 있는 라우트는 방문할 때마다 새로 생성됩니다.</td></tr>
          <tr><td>경로가 바뀐 상위 페이지</td><td>해당 페이지와 그 아래 모든 페이지를 다시 생성합니다.</td></tr>
          <tr><td>추가한 레이어</td><td>일치한 페이지만 렌더링합니다. 상위 페이지는 이미 아래쪽 행에 마운트되어 있습니다.</td></tr>
        </tbody>
      </table>
      <p>유지된 페이지의 <code>ctx</code>는 생성 당시의 컨텍스트입니다. 문서 전체에서 <code>ctx</code>는 이 의미로 사용합니다. 현재 값은 <code>router.*</code>에서 읽으세요. 필터, 페이지 번호, 탭처럼 쿼리로 관리하는 상태는 동적 값 안에서 <code>router.search</code>를 읽고 <code>router.go('?page=2', { replace: true })</code>로 변경합니다. 페이지와 포커스, 입력 중인 텍스트는 유지됩니다.</p>
    `,
      },
      {
        id: "router-regions",
        title: "페이지 및 영역",
        content: `
      <p><code>router.outlet()</code>은 페이지를 한 위치에 표시합니다. 페이지가 레이아웃의 다른 위치에도 사이드바, 도구 모음 또는 제목을 표시해야 한다면 <a href="#api-region"><code>into()</code></a>로 해당 영역을 채웁니다. 레이아웃은 <code>region()</code>로 장소를 표시하고 페이지는 자체 콘텐츠 옆에 <code>into()</code>를 반환합니다. 레이아웃은 페이지 콘텐츠를 props로 받지 않으며 탐색 시에도 다시 생성되지 않습니다.</p>
      ${code("app.ts", `
export const App = () =>
  div(
    aside(
      input({ placeholder: 'Filter' }),   // keeps its text across navigations
      region({ id: 'sidebar', empty: p('Nothing to show.') }),
    ),
    main(router.outlet()),
  )
`)}
      ${code("pages/Post.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return div(
    article(h1(post.title), p(post.body)),
    into('sidebar', nav(h2('In this post'), ul(list(() => post.headings, (h) => li(h))))),
  )
}
`)}
      <p>페이지의 콘텐츠는 아웃렛의 <code>list()</code> 행이며 <code>into()</code>는 이를 보유하는 행만큼 오래 유지됩니다. 따라서 사이드바 콘텐츠는 페이지와 함께 도착하고 페이지와 함께 떠납니다. <code>into('sidebar', …)</code> 없이 페이지로 이동하면 해당 영역의 <code>empty</code> 콘텐츠가 다시 표시됩니다. 두 부분을 같은 함수에서 생성하므로 페이지에서는 두 부분 모두에 대해 <code>ctx</code> 및 <code>data</code>를 사용할 수 있습니다.</p>
      <h3>내비게이션에서 발생하는 현상</h3>
      <ul>
        <li><strong>페이지가 유지되면 영역도 유지됩니다.</strong> <a href="#router-patterns">페이지를 유지하는 쿼리·해시 변경</a>은 영역 콘텐츠도 변경하지 않습니다. 사이드바가 쿼리에 의존한다면 동적 값 안에서 <code>router.search</code>를 읽으세요.</li>
        <li><strong>재구성된 페이지는 이를 다시 채웁니다. </strong> 경로가 변경되면 이전 행이 제거되고 새 페이지의 <code>into()</code> 보기가 이어받습니다. 아무것도 남지 않았습니다.</li>
        <li><strong>푸시 레이어는 뷰를 추가합니다. </strong> 레이어는 아웃렛의 나중 행이므로 <code>into()</code>는 동일한 영역의 새로운 뷰입니다. 기본 <code>type: 'latest'</code>를 사용하면 레이어가 닫힐 때까지 페이지 보기를 덮고 페이지 보기가 다시 표시됩니다. <code>type: 'stack'</code>를 사용하면 둘 다 표시됩니다.</li>
        <li><strong>상위 페이지도 영역을 채울 수 있습니다. </strong> 상위 페이지가 다시 생성되지 않기 때문에 해당 하위 페이지가 변경되는 동안 해당 뷰는 그대로 유지됩니다.</li>
        <li><strong>서버 렌더링에서도 그대로 사용할 수 있습니다.</strong> 서버는 <code>route.run()</code> 안에서 페이지를 생성하므로 <code>into()</code>의 뷰도 HTML에 포함됩니다. <code>hydrate()</code>는 이 노드를 재사용합니다.</li>
      </ul>
      <h3>한 페이지의 여러 영역</h3>
      <p>한 번에 두 개 이상의 영역을 채우려면 객체를 전달하세요. 페이지의 주요 콘텐츠는 여전히 아웃렛을 통과하므로 <code>into()</code> 옆에 반환합니다.</p>
      ${code("pages/Report.ts", `
export default function Report(ctx: RouteContext) {
  return div(
    table(…),
    into({
      toolbar: [button('Export'), button('Print')],
      sidebar: nav(a({ href: router.href('./summary') }, 'Summary')),
    }),
  )
}
`)}
      <h3>어떤 작업에 어떤 도구가 필요합니까?</h3>
      <ul>
        <li><strong><code>outlet()</code></strong>는 하위 경로용입니다. URL이 결정하는 콘텐츠는 상위 페이지 내부에 렌더링됩니다. <a href="#router-patterns">중첩 경로</a>를 참조하세요.</li>
        <li><strong><code>into()</code></strong>는 레이아웃 전체에 퍼지는 일치하는 페이지용입니다. 콘텐츠는 페이지에 속하며 해당 데이터를 사용합니다.</li>
        <li><strong><code>matches()</code></strong>는 페이지가 포함되지 않고 자체 작은 테이블을 사용하여 URL만으로 레이아웃을 결정하는 데 사용됩니다. <a href="#router-matches"><code>matches()</code></a>를 참조하세요.</li>
      </ul>
      <p>이들 모두는 일치하는 하나의 경로에 속합니다. 라우터는 하나의 URL에서 두 개의 독립적인 영역을 구동하지 않으므로 자체 경로가 있는 사이드바는 두 번째 아웃렛이 아니라 페이지가 채우는 영역입니다. 자체 라우터, 로딩 및 폴백을 원하는 사이드바는 하나를 시작하지 않은 상태로 유지하고 <code>match()</code>로 해결합니다. <a href="#router-multi">다중 라우터 &amp; 결합 로딩</a>를 참조하세요.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "라우트 로더 및 코드 분할",
        content: `
      <p>페이지 모듈은 <code>load</code> 함수를 내보낼 수 있습니다. 해당 라우트로 이동할 때마다 페이지를 만들기 전에 실행되며 반환값은 <code>data</code>로 페이지에 전달됩니다.</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>경로 테이블은 변경되지 않았습니다. 로더는 페이지와 함께 이동합니다. 일치하는 <code>RouteContext</code>를 가져오므로 <code>params</code>, <code>search</code> 및 <code>path</code>를 모두 사용할 수 있습니다. 동기식 또는 비동기식일 수 있으며 서버에서도 실행되므로 서버 렌더링 페이지는 하이드레이션 후 가져오는 대신 이미 HTML에 있는 데이터와 함께 제공됩니다.</p>
      <p><strong>모듈은 캐시되지만 데이터는 캐시되지 않습니다. </strong> 경로의 청크는 한 번 가져와 재사용되며 해당 로더는 탐색할 때마다 다시 실행됩니다. 이것이 바로 <code>/blog/a</code>와 <code>/blog/b</code>를 혼동할 수 없는 이유이며, 실패한 로더를 간단히 재시도할 수 있는 이유입니다.</p>
      <table>
        <thead><tr><th>상황</th><th>행동</th></tr></thead>
        <tbody>
          <tr><td>실행되는 동안</td><td><code>router.pending</code>는 true이고 현재 있던 페이지는 그대로 유지됩니다.</td></tr>
          <tr><td>예외가 발생하거나 Promise가 거부될 때</td><td><code>router.error</code>에 오류가 설정됩니다. <code>go()</code>는 거부되지 않으며 탐색을 다시 시도할 수 있습니다.</td></tr>
          <tr><td><code>start()</code> 실행 중</td><td><code>start()</code>가 반환한 Promise가 거부됩니다. 아직 오류를 저장할 Route가 없습니다.</td></tr>
          <tr><td>추가한 레이어</td><td>자체 데이터로 자체 로더를 실행합니다</td></tr>
          <tr><td>유휴 시간 사전 로드</td><td>모듈만 미리 로드합니다. 전달할 컨텍스트가 없으며 사용자가 열지 않을 수도 있는 라우트의 데이터를 미리 가져오지 않습니다.</td></tr>
          <tr><td>동일한 URL로 다시 탐색</td><td>로더가 다시 실행되고 행이 다시 생성됩니다. 로더가 없는 경로는 해당 행을 유지합니다.</td></tr>
        </tbody>
      </table>
      <p>재검증하려면 기록 항목을 추가하지 않고 이미 있는 위치로 이동하세요.</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>청크와 데이터를 동시에 로드하기</h3>
      <p>페이지 모듈에서 내보낸 <code>load</code>는 해당 모듈이 도착한 후에만 실행될 수 있으므로 콜드 탐색은 청크를 가져온 다음 데이터를 가져옵니다. 두 가지를 동시에 시작하려면 <code>withLoad()</code>를 사용하여 테이블에서 로더를 선언하세요.</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>모듈의 자체 <code>load</code>를 대체하고 방문할 때마다 실행됩니다. 청크가 여전히 로드되는 동안 거부는 다른 것과 마찬가지로 <code>router.error</code>에 도달합니다.</p>
      <p>설계상 HTML에 서버 데이터가 직렬화되지 않습니다. 클라이언트의 <code>load</code>가 하이드레이션 시 다시 실행됩니다. 이것이 중요한 경우 서버가 <code>route.data</code>(예: <code>window.__DATA__</code>)를 내보내고 로더가 이를 먼저 가져오도록 합니다. <code>route.data</code>는 일치하는 페이지의 데이터만입니다. 부모의 <code>load()</code> 결과가 여기에 없습니다.</p>
      <h3>코드 분할 및 사전 로드</h3>
      <p>라우트의 값은 항상 페이지 컴포넌트를 반환하는 함수이므로 컴포넌트는 필요할 때 불러옵니다.</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>모듈 객체 형식으로 반환할 때만 <code>load</code> 내보내기를 함께 전달할 수 있습니다. <code>.then(m =&gt; m.BPage)</code>로 이름을 지정한 컴포넌트를 선택하면 라우터에는 그 함수만 전달됩니다.</p>
      <p>각 모듈은 한 번 가져온 뒤 캐시됩니다. 같은 라우트로 동시에 이동하면 하나의 <code>import()</code>를 공유합니다. <code>idleTimeout</code> 동안 사용자 조작이 없으면(기본 1초: 터치, 키 입력, 휠, 스크롤 없음) 유휴 시간 구간(<code>requestIdleCallback</code>)마다 하나씩 나머지 라우트를 백그라운드에서 로드합니다. 입력이 발생하거나 사용자가 기다리는 탐색이 있으면 페이지가 다시 유휴 상태가 될 때까지 사전 로드를 멈춥니다.</p>
      <p>사전 로드되었거나 즉시 사용 가능한 라우트는 <code>router.pending</code>를 변경하지 않고 다음 화면 갱신 전에 표시됩니다. 스피너가 잠깐 나타나거나 레이아웃이 밀리지 않습니다. <code>router.pending</code>는 모듈이나 로더를 기다려야 할 때만 true이며, 그동안 기존 페이지는 화면에 유지됩니다. 청크 로드에 실패하면 처리되지 않은 Promise 거부 대신 <code>router.error</code>에 오류가 설정되며 다시 시도할 수 있습니다.</p>
    `,
      },
      {
        id: "router-api",
        title: "라우터 API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code>는 패턴을 로더 또는 중첩 테이블에 매핑합니다. 옵션:</p>
      <table>
        <thead><tr><th>옵션</th><th>기본값</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL 접두사(예: <code>'/docs'</code>)에서 앱이 제공됩니다. 세그먼트 경계에서만 일치합니다. <code>/docs/intro</code>는 <code>'/docs'</code> 내부에 있고 <code>/docsearch</code>는 그렇지 않습니다. 외부의 URL은 일치하지 않으므로 <code>start()</code>는 거부하고(서버 측 404) 이에 대한 링크는 브라우저에 남아 있습니다.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>페이지가 유휴 상태가 되면 백그라운드에서 나머지 경로의 모듈을 로드합니다. <code>false</code>로 비활성화합니다.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>터치, 키 입력, 휠, 스크롤 없이 지나야 하는 시간(밀리초)입니다. 이 시간이 지나면 사전 로드를 시작하거나 사용자 조작으로 중단된 사전 로드를 재개합니다.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>. 브라우저에서 최초 탐색을 포함해 각 탐색이 완료되고 DOM에 반영된 뒤 호출됩니다. <code>kind</code>는 <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code>(뒤로, 앞으로, <code>close()</code>) 또는 <code>'layer'</code>입니다. <code>document.title</code>, 메타 태그, 포커스, 스크롤, 분석 처리를 위한 훅이며 SSR 중에는 호출되지 않습니다.</td></tr>
        </tbody>
      </table>
      <p>반환된 라우터는 <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>와 <code>run()</code>을 제외한 모든 <code>Route</code> 멤버를 제공합니다. Route 멤버는 활성 Route에서 읽습니다. 브라우저에서는 마지막 <code>start()</code>가 반환한 Route이고, 서버에서는 현재 <code>run()</code>을 실행 중인 Route입니다. 어느 쪽도 없을 때 멤버를 읽으면 오류가 발생합니다. 라우트 테이블, 컴파일된 매처, 모듈 캐시는 라우터에 저장되므로 서버의 여러 요청이 공유합니다.</p>
      <h3><code>router.start(url?)</code></h3>
      <p><code>url</code>(브라우저 기본값: <code>location.href</code>)에 해당하는 페이지 모듈을 확인하고 <code>Promise&lt;Route&gt;</code>를 반환합니다. 일치하는 패턴도 테이블의 <code>'*'</code> 라우트도 없으면 Promise가 거부됩니다. 서버에서는 이를 404로 처리합니다. 브라우저에서는 해당 Route를 라우터의 활성 Route로 설정하고 <code>popstate</code>와 위임된 <code>click</code> 리스너를 연결하며 사전 로드를 예약합니다. <code>start()</code>를 다시 호출하면 이전 Route를 정리합니다. 서버에서는 공유 상태를 변경하지 않으므로 <code>route.run()</code> 안에서 렌더링하세요.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>아무것도 로드하지 않고 URL을 테이블과 비교합니다. import, 히스토리 변경, 리스너 연결, Route 생성이 모두 없습니다. 일치하면 <code>RouteContext</code>를 반환합니다. URL이 <code>base</code> 밖에 있거나, 일치하는 패턴이 없거나, 브라우저에서 출처가 다르면 <code>null</code>을 반환합니다. <code>./</code>를 해석하려면 활성 라우트가 필요하므로 절대 URL만 허용합니다.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>활성 라우트의 페이지들을 <code>list()</code>로 반환합니다. 페이지를 표시할 위치에 한 번 배치하세요. 추가한 레이어는 목록의 뒤쪽 행이 됩니다. <code>start()</code>가 완료되기 전과 <code>stop()</code> 이후에는 비어 있습니다. 서버에서는 현재 <code>run()</code>을 실행 중인 Route를 렌더링합니다.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>활성 라우트의 경로와 일치하는 뷰를 두 번째 테이블에서 찾아 <code>list()</code>로 렌더링합니다. 원하는 곳에 배치할 수 있습니다. <a href="#router-matches"><code>matches()</code></a>를 참조하세요.</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code>를 제외한 모든 구성원은 라우터에도 있으며, 여기에서 앱이 이를 읽습니다.</p>
      <table>
        <thead><tr><th>멤버</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>현재 일치한 라우트의 정보입니다. <code>search</code>는 <code>URLSearchParams</code>입니다. <code>search</code>, <code>hash</code>, <code>url</code>은 현재 상태를 반영합니다.</td></tr>
          <tr><td><code>pending</code></td><td>모듈이나 로더를 기다리는 탐색이 있는지 나타냅니다.</td></tr>
          <tr><td><code>error</code></td><td>마지막으로 실패한 로드, 다음 탐색으로 지워짐</td></tr>
          <tr><td><code>data</code></td><td>일치한 페이지의 <code>load()</code> 반환값으로, 서버에서 직렬화할 때 사용합니다. 상위 페이지의 로더 결과는 포함되지 않습니다.</td></tr>
          <tr><td><code>depth</code></td><td>스택에 레이어 수(일반 페이지의 경우 1개)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>필요한 모듈을 로드하고 이동합니다. Promise는 거부되지 않습니다. 모듈에서 예외가 발생하거나 Promise가 거부되면 <code>error</code>에 기록됩니다.</td></tr>
          <tr><td><code>push(href)</code></td><td>새 라우트를 최상위 레이어로 열고, 닫을 때 전달된 값으로 Promise를 이행합니다. <code>./</code>를 허용하며 일치하는 라우트가 없거나 모듈 로드에 실패하면 Promise가 거부됩니다.</td></tr>
          <tr><td><code>href(path)</code></td><td><code>a({ href })</code>의 경우 경로 앞에 <code>base</code>를 붙입니다. 활성 경로에 대해 <code>./</code> 및 <code>../</code>를 확인합니다.</td></tr>
          <tr><td><code>stop()</code></td><td>모든 리스너를 분리하고, 열린 레이어를 닫고, 아웃렛을 비웁니다. 멱등성. 중지된 Route에서도 마지막 일치 결과를 읽을 수 있으며 <code>go()</code>는 아무 작업도 수행하지 않습니다.</td></tr>
          <tr><td><code>run(fn)</code></td><td>이 Route를 라우터의 활성 Route로 설정하고 <code>fn</code>을 호출한 뒤 그 결과를 반환합니다. 서버에서는 <code>route.run(() =&gt; renderToString(App))</code>처럼 사용합니다. 동기 호출만 지원하며 <code>fn</code>이 반환되면 이 Route는 더 이상 활성 Route가 아닙니다.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>페이지의 첫 번째 인수: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. 페이지가 작성된 컨텍스트입니다. 실시간 값을 보려면 <code>router.*</code>를 읽어보세요. 다시 생성하지 않고 쿼리나 해시가 변경된 경우에만 다릅니다.</p>
      <p><code>params</code>는 기본적으로 <code>{ [name]: string }</code>입니다. 페이지는 <code>Params</code>를 사용하여 자체 패턴에서 매개변수 타입을 추론할 수 있으며, 이는 <code>'/blog/:slug'</code>를 <code>{ slug: string }</code>로, <code>'/files/*rest'</code>를 <code>{ rest: string }</code>로 바꿉니다.</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>페이지의 두 번째 인수입니다. 필요한 속성을 구조 분해해서 사용하세요.</p>
      <table>
        <thead><tr><th>속성</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>페이지가 스택에 있는 위치입니다. 아래 <code>Layer</code>를 참조하세요.</td></tr>
          <tr><td><code>data</code></td><td>라우트의 <code>load()</code> 반환값이며 로더가 없으면 <code>undefined</code>입니다. <code>PageProps&lt;TData&gt;</code>로 타입을 지정합니다.</td></tr>
          <tr><td><code>outlet</code></td><td>상위 페이지 안에 하위 라우트를 렌더링하는 위치입니다. <a href="#router-patterns">중첩 라우트</a>를 참조하세요.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>페이지를 제거하기 전에 호출할 가드를 등록합니다. <a href="#router-layers">페이지 이탈 가드</a>를 참조하세요.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>페이지의 스택 내 위치와 레이어를 닫는 방법을 제공합니다.</p>
      <table>
        <thead><tr><th>멤버</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>기본 페이지는 0, 추가한 레이어는 1 이상입니다.</td></tr>
          <tr><td><code>push(href)</code></td><td>페이지 안에서 다른 레이어를 엽니다. <code>Route.push()</code>와 같습니다.</td></tr>
          <tr><td><code>close(result?)</code></td><td>이 레이어와 그 위의 모든 레이어를 닫고, 이 레이어를 연 <code>push()</code>의 Promise를 이행합니다. 인수가 없으면 취소한 것으로 처리합니다. 깊이 0에서는 아무 작업도 하지 않습니다.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> 및 <code>withLoad()</code></h3>
      <p><code>DataLoader</code>는 페이지 모듈의 선택적 <code>load</code> 내보내기인 <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>입니다. <code>withLoad(loader, load)</code>는 <code>load</code>와 청크 가져오기가 동시에 시작되는 라우트를 만듭니다. <a href="#router-loaders">경로 로더</a>를 참조하세요.</p>
      <h3>타입</h3>
      <p>모든 타입은 <code>nuclo-router</code>에서 이름으로 내보내므로 라우트 정의 파일을 가져오지 않고도 페이지, 로더, 가드에 타입을 지정할 수 있습니다.</p>
      <table>
        <thead><tr><th>타입</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> 패턴에 대한 params 객체입니다. <code>RouteParams</code>는 구체적인 패턴을 반영하지 않은 기본 타입이고 <code>Match</code>는 매처의 반환값입니다.</td></tr>
          <tr><td><code>PageComponent</code></td><td>페이지 함수: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>페이지 모듈입니다. 컴포넌트 자체이거나 <code>import()</code>가 반환하는 <code>{ default, load? }</code> 형식입니다.</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>. 선택적으로 <code>withLoad()</code>의 <code>load</code>를 포함합니다.</td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code>에 전달하는 테이블로, 패턴을 로더 또는 중첩 테이블에 매핑합니다.</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>. <code>go()</code>의 두 번째 인수입니다.</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>. <code>onNavigate</code>의 두 번째 인수입니다.</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code>의 <code>outlet()</code> 타입입니다.</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, <code>beforeLeave()</code>가 취하는 것</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code>의 뷰입니다. 매개변수를 받아 콘텐츠 또는 페이지 모듈의 <code>import()</code>를 반환합니다.</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "레이어 및 이탈 가드",
        content: `
      <p><code>push()</code>는 현재 페이지를 교체하는 대신 그 위에 새 라우트를 열며, 레이어가 닫힐 때 전달한 값으로 Promise를 이행합니다. 페이지 스택은 하나의 <code>list()</code>이므로 레이어를 열면 행 하나가 추가됩니다. 아래 페이지는 다시 렌더링되지 않아 레이어를 닫은 뒤에도 DOM, 포커스, 입력 중이던 폼이 그대로 유지됩니다.</p>
      <p>이렇게 하면 사용자가 작성하고 있던 양식을 버리지 않고도 "아직 존재하지 않는 레코드가 필요합니다" 흐름이 작동합니다.</p>
      ${code("pages/Edit.ts", `
// the page underneath
const created = await layer.push<Option>('/options/new')
if (created) { options.push(created); selected = created.id; update() }
`)}
      ${code("pages/NewOption.ts", `
// the pushed page: (ctx, { layer })
layer.close(created)   // resolves the push() above with the new option
layer.close()          // dismissed: resolves with undefined
`)}
      <p>레이어 중첩. 자체 대화 상자가 필요한 대화 상자는 <code>layer.push()</code>를 호출하고 Route를 직접 참조하지 않고 결과를 기다립니다.</p>
      <ul>
        <li><strong>URL은 최상위 레이어를 나타냅니다.</strong> <code>push()</code>는 히스토리 항목을 추가하므로 레이어에 직접 링크할 수 있습니다. 뒤로 가면 레이어가 닫히고 취소와 마찬가지로 해당 <code>push()</code>가 이행됩니다. 뒤로 가기와 <code>close()</code>는 같은 코드 경로를 사용합니다. <code>close()</code>는 결과를 저장하고 히스토리를 뒤로 이동하며, 깊이는 <code>history.state</code>의 값을 기준으로 판단합니다. 브라우저는 탭당 약 50개 항목만 유지하므로 레이어를 오래 탐색하면 아래 항목이 사라질 수 있습니다. 이때 <code>close()</code>는 레이어를 닫고 남아 있는 페이지에 맞춰 현재 히스토리 항목을 교체합니다.</li>
        <li><strong>일반 탐색은 스택을 지웁니다.</strong> 링크 클릭 또는 <code>go()</code>는 레이어가 아닙니다. 모든 것을 대체하고 열려 있는 모든 레이어를 닫으므로 대기 중인 호출자가 없습니다.</li>
        <li><strong>URL에 직접 접속하면 독립 페이지로 표시됩니다.</strong> URL은 최상위 레이어만 나타내고 아래 스택은 나타내지 않습니다. 따라서 레이어 URL에 직접 접속하면 깊이가 1인 스택에 <code>layer.depth === 0</code>인 기본 페이지로 렌더링되며 <code>close()</code>는 동작하지 않습니다. 레이어로 여는 라우트도 단독으로 사용할 수 있어야 합니다. <code>layer.depth</code>에 따라 분기하여 동작하지 않는 취소 버튼 대신 나가기 링크를 제공하세요.</li>
        <li><strong>다시 로드하면 Promise는 유지되지 않습니다.</strong> Promise가 클로저에 저장되기 때문입니다. 결과 전달은 편의 수단으로 사용하되, 페이지에 직접 접속하는 방식으로도 같은 작업을 완료할 수 있게 하세요.</li>
        <li><strong>대기 중인 호출이 남지 않습니다.</strong> <code>stop()</code>는 열린 레이어를 모두 닫으며 탐색으로 제거된 레이어의 Promise는 <code>undefined</code>로 이행됩니다.</li>
      </ul>
      <h3>페이지 이탈 가드</h3>
      <p>입력 중인 폼처럼 보존할 내용이 있는 페이지는 가드를 등록합니다. 페이지를 제거하기 전에 가드를 호출하며, <code>false</code> 또는 false로 이행되는 Promise를 반환하면 페이지를 유지합니다.</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>페이지를 떠날 때만 호출합니다.</strong> 레이아웃 내부의 하위 탐색이나 현재 페이지를 유지하는 쿼리·해시 변경에서는 호출하지 않습니다. 가드는 페이지의 생명주기에 묶여 있으므로 직접 등록을 해제할 필요가 없습니다.</li>
        <li><strong>모든 이탈 경로에 적용됩니다.</strong> 링크, <code>go()</code>, 뒤로·앞으로 가기, 레이어의 <code>close()</code>, 라우터가 처리하지 않는 URL로의 <code>go()</code>에도 적용됩니다(앱 밖으로 나갈 때 <code>to</code>는 <code>null</code>). 뒤로·앞으로 가기를 거부하면 히스토리 이동을 되돌려 주소 표시줄과 현재 페이지를 일치시킵니다. 탭 닫기와 새로 고침은 <code>beforeunload</code>로 처리해야 합니다.</li>
        <li><strong><code>to</code></strong>는 이동할 대상의 <code>RouteContext</code>입니다. 가드는 가장 안쪽부터 실행되며 처음 거부한 지점에서 멈춥니다. 가드에서 오류가 발생해도 현재 페이지를 유지합니다. <code>close(result)</code>도 가드를 거치므로 결과를 반환하며 닫기 전에 변경 여부 플래그를 해제하세요.</li>
        <li>라우터는 자신이 만든 히스토리 항목 사이의 이동만 되돌릴 수 있습니다. 기본 <code>#fragment</code> 링크나 다른 스크립트의 <code>pushState</code>처럼 라우터가 만들지 않은 항목으로 뒤로·앞으로 이동할 때는 가드를 호출하지 않습니다.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() 및 하위 라우터",
        content: `
      <p><code>router.outlet()</code>가 페이지를 렌더링합니다. <code>router.matches(table)</code>는 경로를 로드하거나 페이지를 추가하지 않고도 자체 작은 테이블에서 사이드바, 이동 경로 또는 도구 모음과 같이 사용자의 위치에 따라 달라지는 다른 항목을 렌더링합니다.</p>
      ${code("app.ts", `
div(
  aside(
    router.matches({
      '/':           () => nav('Home links'),
      '/blog/new':   () => nav('Drafting tips'),
      '/blog/:slug': ({ slug }) => nav(\`More like \${slug}\`),
      '*':           () => import('./Sidebar.ts'),   // code-split, rendered once loaded
    }),
  ),
  main(router.outlet()),
)
`)}
      <ul>
        <li><strong>라우트 테이블과 같은 규칙을 사용합니다.</strong> 패턴, 우선순위, 원래 경로와의 매칭, <code>base</code> 제거는 라우터와 동일하게 처리하므로 뷰와 페이지가 같은 URL을 기준으로 동작합니다. <code>router.path</code>와 마찬가지로 최상위 레이어의 경로를 읽습니다.</li>
        <li><strong>뷰</strong>는 <code>(params, ctx) =&gt; content</code> 형식입니다. <code>params</code> 타입은 패턴에서 추론되며 <code>ctx</code>는 뷰의 <code>pattern</code>과 <code>params</code>가 담긴 <code>RouteContext</code>입니다. 페이지 모듈의 <code>import()</code>를 반환할 수도 있습니다. 모듈이 로드되면 <code>ctx</code>를 전달해 호출합니다.</li>
        <li><strong> 일치하는 항목이 없으면 아무것도 렌더링되지 않습니다.</strong> 대체를 위해 <code>'*'</code> 보기를 추가합니다. 아웃렛처럼 <code>start()</code> 이전과 <code>stop()</code> 이후는 비어 있습니다.</li>
        <li><strong>경로가 바뀔 때만 다시 렌더링됩니다.</strong> 따라서 페이지가 유지되는 탐색에서는 뷰의 DOM도 유지됩니다.</li>
        <li><strong>지연 보기는 해당 모듈이 도착할 때까지 아무것도 렌더링하지 않습니다. </strong> 실패한 <code>import()</code>는 <code>console.error</code>로 기록되고 <code>router.error</code>를 설정하지 않으며 다음 탐색에서 다시 시도됩니다. 일반 <code>update()</code>는 재시도하지 않습니다.</li>
        <li><strong>서버</strong>에서는 지연 로드 뷰를 렌더링하지 않습니다. 모듈을 클라이언트에서 불러오기 때문입니다. 최초 HTML에 포함되어야 하는 뷰는 동기 함수로 작성하세요.</li>
      </ul>
      <h3>서브 라우터</h3>
      <p>라우트가 중첩을 지원하므로 하위 라우터는 보통 하나의 라우터 안에 중첩 테이블로 구성하면 됩니다. 섹션의 <code>'/'</code> 페이지가 공통 UI를 제공하고 그 안의 <code>outlet()</code>에 하위 페이지를 렌더링하므로 섹션 내부를 이동해도 공통 UI가 유지됩니다.</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>또는 해당 기능에 라우터를 따로 만들되 시작하지 않고 사용할 수 있습니다. 상위 라우터는 catch-all 하나로 섹션을 처리하고 하위 라우터는 남은 경로를 자체 패턴, 매개변수, 폴백으로 해석합니다.</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>이 라우터는 <code>start()</code>를 호출하지 않는 것이 핵심입니다. <code>start()</code>는 리스너를 연결하므로 라우터 두 개를 시작하면 충돌합니다. 하위 라우터가 경로 해석을 담당하는 대신, 시작된 라우터가 자동 실행해 주는 데이터 로더는 직접 호출해야 합니다. 또한 바깥 라우터는 하나의 라우트만 보고 나머지는 셸이 해석하므로 하위 경로가 바뀔 때 셸도 다시 생성됩니다. 중첩 테이블을 사용하면 상위 페이지가 계속 마운트된 상태로 유지됩니다. 해당 기능에 독립된 라우터, base, 폴백이 꼭 필요한 경우가 아니라면 중첩 테이블을 사용하세요.</p>
    `,
      },
      {
        id: "router-multi",
        title: "여러 라우터 및 통합 로딩",
        content: `
      <p>앱에는 영역마다 라우터를 둘 수 있습니다. 규칙은 간단합니다. <strong>문서당 하나만 시작하고</strong> 나머지는 시작하지 않은 채 <code>match()</code>로 URL을 해석합니다. 시작된 라우터만 URL, 히스토리, 클릭 리스너를 관리하며 나머지는 직접 조회하는 테이블입니다. 각 영역은 자체 스피너와 독립적인 로딩 상태를 가질 수 있습니다.</p>
      <h3>결합 로딩: 로더 체인</h3>
      <p>일치하는 라우트 체인의 각 페이지는 <code>load()</code>를 내보낼 수 있습니다. 하위 라우트에 처음 진입하면 레이아웃과 페이지의 로더가 <strong>병렬로</strong> 실행되며 하나의 <code>router.pending</code>가 전체 체인의 로딩 상태를 나타냅니다. 두 로더가 모두 완료될 때까지 기존 페이지가 유지되므로 일부만 로드된 트리는 표시되지 않습니다. 각 컴포넌트는 자신의 <code>data</code>를 받습니다.</p>
      ${code("routes.ts", `
'/shop': {
  '/':          () => import('./pages/Shop.ts'),    // layout, has a load()
  './:section': () => import('./pages/Section.ts'), // page, has a load()
},
`)}
      ${code("pages/Shop.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<ShopData> = async () => {
  await wait(500)                              // a slow API
  return { sections: ['toys', 'books', 'music'] }
}

// the layout gets its own data, and its outlet for the child page
export default function Shop(_ctx: RouteContext, { data, outlet }: PageProps<ShopData>) {
  return div(
    h1('Shop'),
    nav(...data.sections.map((s) => a({ href: router.href(\`/shop/\${s}\`) }, s))),
    main(outlet()),
  )
}
`)}
      ${code("pages/Section.ts", `
export const load: DataLoader<SectionData> = async (ctx) => {
  await wait(900)                              // slower than the layout's
  return { section: ctx.params.section, items: catalog[ctx.params.section] }
}

// the page gets its own data: the two loaders ran beside each other
export default function Section(_ctx: RouteContext, { data }: PageProps<SectionData>) {
  return article(h2(data.section), ul(...data.items.map((i) => li(i))))
}
`)}
      <p>두 로더가 차례로 시작되지 않고 함께 시작됩니다. <code>router.pending</code>는 둘 중 하나가 대기하는 동안 true이고 나머지 시간에는 false입니다. 사전 로드되거나 즉시 사용 가능한 라우트는 이 값을 true로 바꾸지 않습니다. 섹션 사이를 이동하면 레이아웃이 유지되므로 섹션의 로더만 다시 실행됩니다. 레이아웃의 데이터, DOM 및 입력 중인 텍스트는 모두 유지됩니다. 동일한 URL로 다시 탐색하면 단일 페이지와 마찬가지로 리프의 로더가 다시 실행되고 해당 행이 다시 생성됩니다.</p>
      <h3>다중 로딩: 자체 스피너가 있는 두 번째 라우터</h3>
      <p>독립 영역(사이드바, 트레이, 라이브 영역)은 생성되었지만 시작되지 않은 자체 라우터와 자체 로딩 플래그를 갖습니다. <code>router.pending</code>는 시작된 라우터에 속하며 이 영역에 대해 아무 말도 하지 않으므로 두 라우터가 나란히 로드될 수 있으며 둘 중 하나가 먼저 완료될 수 있습니다.</p>
      ${code("sidebar.ts", `
import { createRouter } from 'nuclo-router'

// Created but never started: start() is what attaches the history and click
// listeners, and only the main router is started. match() attaches nothing.
const standIn = () => ({ default: () => div() })   // never rendered

const sidebarRouter = createRouter({
  '/shop':          standIn,
  '/shop/:section': standIn,
  '*':              standIn,
}, { base: '/docs' })              // the same base as the main router

export const sidebar = { loading: false, info: null as SidebarInfo | null }

export async function refreshSidebar(at: string) {
  const hit = sidebarRouter.match(at)          // the second router resolves
  if (!hit || (hit.pattern !== '/shop' && hit.pattern !== '/shop/:section')) {
    sidebar.info = null; update(); return
  }
  sidebar.loading = true                       // its own flag, its own spinner
  sidebar.info = null; update()
  const data = await fetchSidebar(hit.params.section)
  sidebar.loading = false; sidebar.info = data
  update()
}
`)}
      ${code("routes.ts", `
createRouter(routes, {
  onNavigate: (ctx, kind) => {
    announce(kind)
    refreshSidebar(ctx.url)   // every navigation re-resolves the sidebar
  },
})
`)}
      <p>두 번째 라우터는 직접 조회할 때만 사용됩니다. <code>match()</code>는 URL을 읽고 컨텍스트를 반환하며, 기본 라우트 테이블에는 사이드바 관련 항목이 들어가지 않습니다. <code>onNavigate</code>는 최초 탐색을 포함한 모든 탐색이 완료된 뒤 실행되므로 독립 영역을 URL과 동기화하는 코드를 한곳에 둘 수 있습니다.</p>
      <ul>
        <li><strong><code>pending</code>는 시작된 라우터에 속합니다. </strong> 시작되지 않은 라우터에는 Route, <code>pending</code> 및 <code>error</code>가 없습니다. 해당 영역은 자체 플래그를 추적하고 두 번째 스피너는 첫 번째 스피너 옆에 배치될 수 있습니다. 데모에서 사이드바는 800ms 동안 로드되는 반면 경로의 로더는 900ms 동안 실행되므로 페이지는 사이드바보다 먼저 완료되거나 그 반대 방향으로 완료될 수 있습니다.</li>
        <li><strong><code>match()</code>는 아무것도 첨부하지 않습니다. </strong> 시작되지 않은 라우터 수에 관계없이 문서를 공유할 수 있습니다. 각 라우터에는 자체 테이블, base 및 모듈 캐시가 있으며 어느 라우터도 히스토리를 변경하지 않습니다. 필요한 자원은 테이블과 매처뿐입니다.</li>
        <li><strong>해당 라우터의 로더는 실행되지 않습니다.</strong> 시작된 라우터는 일치하는 페이지의 <code>load()</code>를 실행하지만 시작되지 않은 라우터는 경로만 해석합니다. 뷰에 데이터가 필요하면 직접 가져오세요(데모의 <code>refreshSidebar()</code>). 자동 로더 실행이 필요하면 시작된 라우터 안에서 <a href="#router-matches">중첩 테이블</a>이나 페이지가 채우는 <a href="#router-regions">영역</a>으로 구성하세요.</li>
        <li><strong>오래된 응답을 무시하세요.</strong> 느린 사이드바 요청의 응답이 이미 다른 섹션으로 이동한 화면에 적용되어서는 안 됩니다. 요청마다 세대 카운터를 증가시키고 현재 값과 일치하지 않는 응답은 버리세요. 라우터도 새 탐색이 앞선 탐색을 추월하면 같은 방식으로 이전 결과를 버립니다.</li>
        <li><strong>지연 로드 <code>matches()</code> 뷰에도 <code>pending</code>가 없습니다.</strong> 모듈이 로드되기 전에는 아무것도 렌더링하지 않습니다. 라우트의 <code>pending</code>, 독립 영역의 자체 플래그, 아직 표시되지 않은 지연 로드 뷰는 각각 독립적으로 로딩됩니다.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "링크 처리",
        content: `
      <p>위임된 리스너는 SVG <code>&lt;a&gt;</code>를 포함해 <code>&lt;a href&gt;</code> 또는 그 안의 요소를 왼쪽 클릭할 때 처리합니다. 보조 키를 누른 클릭, 가운데 클릭, <code>_self</code> 이외의 <code>target</code>, <code>download</code>, <code>rel="external"</code>, 출처가 다른 href, 현재 페이지의 해시 전용 링크, <code>base</code> 밖의 경로, 일치하는 라우트가 없는 경로(서버 렌더링된 404에 접근할 수 있도록), 앱 핸들러에서 이미 <code>preventDefault()</code>를 호출한 이벤트는 브라우저에 맡깁니다. <code>data-nuclo-router="off"</code>를 지정하면 해당 링크를 라우터 처리에서 제외할 수 있습니다.</p>
      <h3>스크롤링</h3>
      <p>푸시된 탐색은 현재 스크롤 위치를 유지합니다. 새 URL에 페이지의 요소와 일치하는 <code>#hash</code>가 있으면 해당 요소가 스크롤되어 표시됩니다. <code>popstate</code>는 브라우저에 스크롤을 남깁니다. 상단에 새 페이지를 표시하려면 <code>onNavigate</code>에서 수행하세요. 탐색이 어떻게 진행되었는지 알려줍니다.</p>
      ${code("routes.ts", `
let shown = ''
createRouter(routes, {
  onNavigate: (ctx, kind) => {
    // Not on Back/Forward (the browser restores those), nor for a query change on the same page.
    if (kind === 'push' && ctx.path !== shown && !ctx.hash) window.scrollTo(0, 0)
    shown = ctx.path
  },
})
`)}
      <h3>주의 사항</h3>
      <ul>
        <li><strong>페이지 DOM을 캐시하지 않습니다.</strong> Route는 페이지 함수와 컨텍스트만 보관합니다. 다른 페이지로 이동하면 이전 페이지는 해제됩니다. <code>stop()</code>는 리스너를 제거하고 진행 중인 로드를 무효화하며 <code>pending</code>를 지우므로 폐기된 Route 때문에 스피너가 남지 않습니다. <code>stop()</code> 이후에 완료된 모듈은 무시됩니다.</li>
        <li><strong> 서버에서 동시성 안전. </strong> <code>start()</code>는 요청별 상태를 반환하고 <code>run()</code>는 이를 하나의 동기 렌더링으로 범위 지정하므로 인터리브된 요청은 서로의 경로를 볼 수 없습니다. 모듈 캐시만 공유됩니다. <code>run()</code>의 함수가 반환되면 범위가 종료됩니다. <code>renderToString()</code>는 동기식이므로 충분합니다. 비동기 또는 스트리밍 렌더링에서는 <code>await</code> 전후로 Route를 유지해야 하지만 <code>run()</code>은 이를 지원하지 않습니다.</li>
        <li><strong>스크롤 복원은 브라우저가 담당합니다.</strong> <code>popstate</code> 시 브라우저의 <code>scrollRestoration</code> 설정에 따르며 라우터는 복원하지 않습니다.</li>
        <li><strong>문서당 하나의 라우터를 시작합니다.</strong> 각 <code>start()</code>는 자체 위임 <code>click</code> 리스너를 추가하고 두 번째 라우터의 <code>start()</code>는 첫 번째 리스너를 폐기하지 않습니다. 동일한 라우터에 있는 두 번째 <code>start()</code>만 작동합니다. 다른 테이블에 대해 URL을 확인하려면 라우터를 만들고 <code>match()</code>만 호출하세요. 아무것도 첨부하지 않습니다. 독립된 영역은 경로의 <code>pending</code> 옆에서 자체 로딩을 실행할 수 있습니다. <a href="#router-multi">다중 라우터 &amp; 결합 로딩</a>를 참조하세요.</li>
        <li><strong>의도적으로 제공하지 않는 기능:</strong> 해시·메모리 히스토리는 지원하지 않습니다. 라우트는 URL 경로에 표시되며 서버가 모든 경로를 제공해야 합니다. 하나의 URL로 독립된 두 영역을 라우팅하는 기능도 없습니다. 페이지가 <code>into()</code>로 여러 영역을 채울 수는 있지만 모두 같은 라우트에 속합니다. 독립 영역에 별도의 시작되지 않은 라우터와 로딩 상태를 두는 방법은 <a href="#router-multi">여러 라우터 및 통합 로딩</a>을 참조하세요. 호버 시 사전 로드도 내장되어 있지 않으며 <code>mouseenter</code>에서 해당 라우트의 모듈 로더를 호출해 구현할 수 있습니다.</li>
      </ul>
      <h3>예</h3>
      <p>저장소에서 실행 가능한 두 가지 예제는 서로를 보완하므로 모든 설정을 어딘가에서 관찰할 수 있습니다.</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: 전체 API에 대한 클라이언트 측 둘러보기입니다. 모든 패턴 형식 및 우선 순위 규칙, 링크 처리 옵트아웃, 라이브 제어가 포함된 모든 경로 멤버, 하위 라우터, 3단계 깊이의 레이어 스택, 두 상위 항목에 마운트된 상대 섹션, <code>pending</code> 및 <code>error</code>가 있는 경로 로더. 해당 상태가 계속 표시되도록 <code>preload: false</code>를 설정합니다.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: 요청별 <code>renderToString()</code>, 서버 노드 재사용을 확인할 수 있는 하이드레이션, 실제 404 상태 코드, 루트 이외의 <code>base</code>, 네트워크 패널에서 확인할 수 있는 유휴 시간 사전 로드, 서버 데이터를 클라이언트에 전달해 하이드레이션 시 다시 가져오지 않는 로더를 보여줍니다.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "패턴",
    sections: [
      {
        id: "computed",
        title: "계산된 값",
        content: `
      <p>Nuclo에는 계산된 값을 위한 별도 API가 없습니다. 일반 함수를 사용하고 동적 값에서 호출하세요.</p>
      ${code("example.ts", `
let items = ['apple', 'banana', 'cherry']
let filter = ''

const visible = () => items.filter((item) => item.includes(filter))

const Fruits = () =>
  div(
    p(() => \`Showing \${visible().length} of \${items.length}\`),
    ul(list(visible, (item) => li(item))),
  )

filter = 'an'
update()
`)}
    `,
      },
      {
        id: "async",
        title: "비동기 처리 및 로딩",
        content: `
      <p>일반 <code>async</code>/<code>await</code>를 사용하고 상태가 변경될 때마다 <code>update()</code>를 호출하세요. 데이터를 가져올 때는 <code>await</code> 이전에 한 번, 이후에 한 번을 의미합니다.</p>
      ${code("example.ts", `
let status: 'idle' | 'loading' | 'done' | 'error' = 'idle'
let result: unknown = null

async function loadData() {
  status = 'loading'
  update()
  try {
    result = await fetch('/api/data').then((r) => r.json())
    status = 'done'
  } catch {
    status = 'error'
  }
  update()
}
`)}
    `,
      },
      {
        id: "best-practices",
        title: "권장 사항",
        content: `
      <ul>
        <li><strong>일괄 변경.</strong> 필요한 모든 상태를 변경한 다음 <code>update()</code>를 한 번 호출합니다.</li>
        <li><strong>동적 값을 빠르고 순수하게 유지하세요.</strong> 이들 모두는 모든 <code>update()</code>에서 실행됩니다.</li>
        <li><strong>입력이나 타이머 등 작고 빈번한 업데이트에는 <code>scope()</code></strong>를 사용하세요.</li>
        <li><strong>문서에 연결된 요소에 렌더링하세요.</strong> <code>update()</code>가 실행될 때 문서에 없는 노드는 업데이트를 중지합니다.</li>
        <li><strong>노드를 반환하는 함수가 아니라 변경되는 자식 요소에 대해 <code>when()</code> 및 <code>list()</code></strong>를 사용합니다.</li>
        <li><strong><code>class</code> 대신 <code>className</code>을 사용하세요</strong>, 동적 클래스에는 <code>() =&gt; cx(...)</code> 또는 <code>{ className: () =&gt; … }</code>를 사용하세요.</li>
        <li><strong>모듈 최상위에서 스타일을 한 번 정의합니다.</strong></li>
        <li><strong>서버 렌더링:</strong> 먼저 렌더링한 다음 <code>getCssText()</code>를 <code>&lt;style id="nuclo-styles"&gt;</code>에 넣습니다. 요청 데이터를 인수로 전달하고 출력에 HTML 주석을 유지합니다.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "참조",
    sections: [
      {
        id: "api-index",
        title: "API 색인",
        content: `
      <p>모든 공개 함수와 제공 모듈입니다.</p>
      <h3><code>nuclo</code>(전역 및 명명된 내보내기)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: 모든 동적 값 또는 지정된 범위에 있는 값을 실행합니다.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code>에 대한 요소 범위 ID를 제공합니다.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: <code>.when()</code> 및 <code>.else()</code>가 포함된 조건부 콘텐츠.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: 항목당 하나의 행, 동일성을 기준으로 행을 연결합니다.</li>
        <li><a href="#api-region"><code>region(options)</code></a> 및 <a href="#api-region"><code>into(id, ...content)</code></a>: 트리의 명명된 위치 및 어디에서나 이를 채우는 콘텐츠입니다.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: 이벤트 리스너 또는 <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: 빌드 및 추가.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: 서버 HTML에 클라이언트 동작을 연결합니다.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: 컴포넌트를 다시 호출하고 DOM을 패치합니다.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: 스타일 객체에서 생성된 클래스.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: 스타일을 합성하며 나중에 전달한 스타일이 우선합니다.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: 테마 <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> 및 <code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: 옵션의 스타일.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> 및 <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code>(이름을 지정한 내보내기 전용)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> 및 <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> 및 <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">부수 효과 import</a>, <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> 및 <code>Nuclo*</code> 클래스.</li>
      </ul>
      <h3><code>nuclo-router</code>(별도 패키지)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: 라우터, <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> 및 <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: 데이터 로더와 청크 로드가 동시에 시작되는 라우트입니다.</li>
        <li><a href="#router-api">타입</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> 등.</li>
      </ul>
      <h3>전역 전용</h3>
      <ul>
        <li><a href="#tag-builders">태그 빌더 175개</a>: <code>div</code>, <code>span</code>, …, <code>var_</code> 및 <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">타입</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> 등. <code>StyleResult</code>와 같은 스타일 타입을 <code>'nuclo'</code>에서 가져올 수도 있습니다.</li>
      </ul>
      <h3>특수 키</h3>
      <ul>
        <li><a href="#attributes">속성</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> 핸들러</a>, <a href="#lifecycle"><code>onMount</code> 및 <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">스타일 객체</a>: 축약형, 가상 상태, <code>&amp;</code> 선택자, <code>@</code> 규칙 및 <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "자주 묻는 질문",
        content: `
      <h3>상태 변경이 UI를 업데이트합니까?</h3>
      <p>아니요. DOM은 <code>update()</code>를 호출할 때까지 그대로 유지됩니다.</p>

      <h3>Nuclo는 시그널, 프록시 또는 가상 DOM을 사용합니까?</h3>
      <p>아니요. 상태는 일반 JavaScript로 유지됩니다. 트리가 렌더링되면 Nuclo는 실제 요소와 텍스트 노드를 생성합니다. <code>update()</code>는 등록된 모든 동적 값 또는 지정된 범위 내의 값을 실행하고 값이 변경된 동일한 노드를 패치합니다. 의존성 그래프와 가상 트리가 없습니다.</p>

      <h3>내 페이지에 "false"가 표시되는 이유는 무엇입니까?</h3>
      <p>불리언은 텍스트로 렌더링됩니다. <code>div(ok &amp;&amp; span('Done'))</code>에는 "false"가 표시됩니다. 자식 노드용으로는 <code>when(() =&gt; ok, span('Done'))</code>를, 텍스트용으로는 <code>ok ? 'Done' : ''</code>를 사용하세요.</p>

      <h3>항목을 편집할 때 목록 행이 변경되지 않는 이유는 무엇입니까?</h3>
      <p>목록에 아직 남아 있는 항목의 행은 유지되며 다시 렌더링되지 않습니다. 변경되는 필드에는 <code>() =&gt; todo.text</code>와 같은 동적 값을 사용하세요. <a href="#api-list"><code>list()</code></a>를 참조하세요.</p>

      <h3>UI의 일부가 업데이트를 중지하는 이유는 무엇입니까?</h3>
      <p>대개 <code>update()</code>가 실행될 때 해당 노드가 문서에 없었기 때문입니다. 한 번 추적이 중지된 노드는 나중에 연결해도 다시 업데이트되지 않으므로 문서에 연결된 컨테이너에 렌더링하세요. 그 밖에 <code>when()</code> 조건에서 오류가 발생하면 해당 블록의 업데이트가 중지되고, 텍스트 함수가 첫 실행에서 오류를 던지면 계속 빈 텍스트로 남습니다. <a href="#api-update"><code>update()</code></a>를 참조하세요.</p>

      <h3>언제 <code>forceUpdate()</code>를 사용해야 합니까?</h3>
      <p>언어 전환과 같이 정적 값이 거의 변경되지 않는 경우에만 해당됩니다. 그 밖의 모든 것에는 <code>update()</code>를 사용하세요. <a href="#api-force-update"><code>forceUpdate()</code></a>를 참조하세요.</p>

      <h3>props으로 전달하지 않고 페이지를 레이아웃에 어떻게 넣나요?</h3>
      <p><code>region({ id: 'main' })</code>로 장소를 표시하고 페이지가 <code>into('main', …)</code>를 반환하도록 합니다. <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>를 참조하세요.</p>

      <h3>앱을 어떻게 마운트 해제하나요?</h3>
      <p><code>when()</code>로 감싸고 조건을 끕니다. DOM을 직접 제거하면 <code>onDestroy</code>가 실행되지 않습니다. <a href="#lifecycle">생명주기</a>를 참조하세요.</p>

      <h3>Nuclo에는 라우터가 포함되어 있습니까?</h3>
      <p>코어 패키지에는 없습니다. 라우팅은 서버 렌더링, 하이드레이션, 코드 분할 경로 및 유휴 사전 로드 기능을 갖춘 <code>nuclo-router</code>로 별도로 배포됩니다. <code>npm install nuclo nuclo-router</code>로 설치하세요. <a href="#router-overview">nuclo-router</a>를 참조하세요.</p>

      <h3>Nuclo에 이펙트가 있나요?</h3>
      <p>아니요. <code>onMount</code> 및 <code>onDestroy</code>는 요소당 한 번 실행되며 삽입 및 제거와 연결됩니다. 일부 상태가 변경되었기 때문에 아무 것도 다시 실행되지 않습니다.</p>
    `,
      },
    ],
  },

];
