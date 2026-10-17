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
      <p>입력된 스타일 개체를 생성된 CSS 클래스로 변환합니다. 결과를 태그 빌더에 전달합니다. 브라우저에서 규칙은 하나의 <code>&lt;style id="nuclo-styles"&gt;</code> 요소로 들어갑니다. 서버에서는 <a href="#api-css-text"><code>getCssText()</code></a>가 이를 반환합니다.</p>
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
        <li><code>css()</code>는 기본 선언에 대해 하나의 클래스를 만들고 각 의사 키, 선택기 및 미디어 블록에 대해 하나의 클래스를 만듭니다. 위의 카드는 두 가지 클래스를 얻습니다.</li>
        <li>클래스 이름은 콘텐츠의 해시입니다. 동일한 스타일은 클래스를 공유하며 서버와 클라이언트는 동일한 이름을 생성합니다.</li>
        <li>모듈 수준에서 스타일을 한 번 정의합니다. <code>css()</code>는 개체별로 캐시하므로 호출할 때마다 새 개체가 매번 다시 처리됩니다.</li>
        <li>스타일 개체를 <code>css()</code>에 전달한 후 변경하면 아무 작업도 수행되지 않습니다.</li>
        <li>모든 스타일은 페이지 또는 서버 프로세스의 수명 동안 등록된 상태로 유지됩니다. 데이터의 너비와 같이 항목별로 변경되는 값의 경우 <a href="#attributes"><code>style</code> 속성</a>를 사용하세요.</li>
      </ul>
      <h3>명명된 스타일</h3>
      <p>읽을 수 있는 클래스 이름을 얻으려면 먼저 이름을 전달하십시오.</p>
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
      <p><code>css()</code>에 전달하는 개체는 camelCase의 일반적인 CSS 속성, 약식 집합 및 의사 상태, 선택기 및 미디어 쿼리에 대한 중첩 키를 사용합니다. TypeScript는 모든 항목을 자동 완성합니다. <code>borderTopLeftRadius</code>, <code>fill</code> 또는 <code>paddingInline</code>와 같이 입력된 집합 ​​외부의 속성은 <code>raw</code>에 들어갑니다(아래 참조).</p>
      <h3>값</h3>
      <ul>
        <li>숫자는 <code>px</code>가 됩니다(<code>0</code> 및 단위 없는 속성 제외: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> 및 <code>gridRow</code>. <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> 및 <code>animation-iteration-count</code>에서도 단위가 없습니다.</li>
        <li>문자열은 작성된 대로 사용됩니다. <code>null</code>, <code>undefined</code> 및 <code>false</code>는 건너뜁니다.</li>
        <li><code>lineHeight</code>(및 <code>leading</code>)는 단위가 없으므로 <code>leading: 24</code>는 글꼴 크기의 24배를 의미합니다. 픽셀에는 <code>"24px"</code>를 작성하세요.</li>
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
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (표시를 설정하지 않음)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>의사 상태</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code>(<code>:first-child</code>), <code>last</code>(<code>:last-child</code>), <code>only</code>(<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> 및 <code>firstLetter</code>. 그들은 중첩됩니다: <code>hover: { focus: {…} }</code>는 <code>:hover:focus</code>를 제공합니다.</p>
      <h3>선택기 및 at-규칙</h3>
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
        <li>두 개의 중첩된 <code>@media</code> 블록이 <code>and</code>와 결합됩니다. 문법이 처음에만 유형을 허용하기 때문에 미디어 유형(<code>print</code>, <code>only screen</code>)이 이끄는 쿼리가 먼저 배치됩니다. 평면화할 수 없는 쌍(두 개의 미디어 유형 또는 선행 <code>not</code>)은 경고하고 내부 쿼리만 사용합니다. 다른 중첩된 at-규칙은 외부 규칙을 대체합니다.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>모든 속성에 대해 <code>raw</code>를 사용하고 이름은 CSS와 동일하게 작성됩니다. 숫자는 여전히 <code>px</code>를 가져오므로 문자열을 전달합니다.</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>다른 일반 키는 케밥 케이스로 변환되어 그대로 작성되므로 <code>colr: 'red'</code>와 같은 오타는 브라우저가 삭제하는 선언이 됩니다. 의사 상태가 아닌 키, 화면, <code>&amp;</code> 또는 <code>@</code> 키 아래에 중첩된 객체는 무시됩니다. TypeScript는 둘 다 보고합니다.</p>
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
        <li>거짓 입력을 건너뛰고, 배열을 평면화하고, 문자열을 분할하고 중복을 제거합니다.</li>
        <li>동일한 블록(기본, 동일한 의사, 동일한 미디어 쿼리)에 대해 생성된 클래스가 하나의 새로운 클래스로 병합됩니다. 다른 클래스 이름은 변경되지 않고 전달됩니다.</li>
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
          <tr><td><code>screens</code></td><td><code>md: {…}</code></td></tr>와 같은 새로운 스타일 키
        </tbody>
      </table>
      <ul>
        <li>테마 이름은 전체 값일 때만 해결됩니다. <code>border: "1px solid primary"</code>가 해결되지 않았습니다.</li>
        <li><code>@</code>가 없는 화면 값은 <code>@media &lt;value&gt;</code>가 됩니다. <code>@</code>로 시작하는 값은 작성된 대로 사용됩니다(예: <code>"@container (min-width: 400px)"</code>).</li>
        <li>화면은 <code>createCss()</code>로 만든 인스턴스에만 존재합니다. 전역 <code>css()</code>에는 키가 없지만 <code>@media</code> 키를 허용합니다.</li>
        <li>모든 인스턴스와 전역 도우미는 하나의 스타일시트를 공유합니다. 스크린 미디어 규칙은 스크린을 사용하는 순서가 아닌 선언된 순서대로 출력되므로 <code>min-width</code> 스크린을 작은 것부터 큰 것 순으로 나열합니다. 앱당 하나의 <code>createCss()</code> 인스턴스를 사용하여 해당 순서가 테마의 순서가 되도록 합니다.</li>
        <li><code>theme</code> 결과에 합격하신 테마입니다.</li>
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
        <li>스타일은 <code>base</code>, 각 그룹에서 선택한 값, 일치하는 각 화합물 순서로 병합됩니다. 최신 스타일은 속성별로 승리합니다.</li>
        <li>누락된 <code>undefined</code> 또는 <code>null</code> 옵션은 기본값을 사용합니다. 기본값이 없는 그룹은 건너뜁니다.</li>
        <li><code>true</code> 및 <code>false</code> 키만 있는 그룹은 부울을 사용합니다.</li>
        <li>나열된 모든 그룹이 일치할 때 화합물이 적용됩니다(기본값 포함).</li>
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
      <p><code>globalStyle()</code>는 모든 선택기에 대한 규칙을 추가합니다.</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>선택기는 작성된 대로 정확하게 사용됩니다.</li>
        <li>평면 속성만 작동합니다. 의사 키, 화면 및 <code>@</code> 키는 무시되므로 <code>globalStyle()</code>는 미디어 규칙을 작성할 수 없습니다.</li>
        <li>동일한 규칙이 한 번 추가됩니다. 동일한 선택기에 대한 다른 스타일은 두 번째 규칙을 추가하고 나중에 규칙이 적용됩니다.</li>
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
        <li>하나의 페이지나 요청이 아닌 전체 프로세스를 다루며 성장만 합니다. 클래스 이름은 콘텐츠 해시이므로 안전합니다.</li>
        <li><code>&lt;style id="nuclo-styles"&gt;</code>에 넣으세요. 클라이언트는 해당 요소를 재사용하고 이미 포함된 규칙을 건너뜁니다. 다른 ID를 사용하거나 없음을 사용하면 클라이언트는 모든 규칙에 두 번째 스타일시트를 다시 추가합니다.</li>
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
      <p>Nuclo용 라우팅: <code>list()</code> 및 <code>update()</code>를 기반으로 구축된 서버 렌더링, 하이드레이션, 코드 분할 경로 및 유휴 사전 로드. ${NUCLO_ROUTER_GZIP_KB} 정보 KB gzipped는 Nuclo 자체 이외의 종속성과 부작용이 없으므로 사용하지 않을 때 트리 쉐이크됩니다.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>또는 동일한 두 이름으로 <code>pnpm add</code>, <code>yarn add</code> 또는 <code>bun add</code>를 사용합니다. 피어 종속성으로 <code>nuclo</code> 0.3 이상이 필요합니다.</p>
      <p>라우터는 로드할 <em>what</em>를 결정합니다. 앱에는 <em>where</em> with <code>router.outlet()</code>가 표시됩니다. 레이어 스택 위에 하나의 <code>list()</code>가 있고 레이어당 한 행이 있으므로 일반 페이지는 단일 행입니다. 서버와 클라이언트는 동일한 트리를 구축하므로 <code>hydrate()</code>는 서버 노드를 교체하는 대신 서버 노드를 요청합니다. 그 밖의 모든 것은 <code>history</code>, 하나의 위임된 <code>click</code> 수신기 및 <code>requestIdleCallback</code>입니다.</p>
      <h3>원 임포트</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code>는 반환되기 전에 일치하는 경로의 모듈을 확인하므로 첫 번째 트리는 서버와 클라이언트 모두에서 완성됩니다. 그 후 라우터는 시작된 경로인 <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>를 읽습니다.</p>
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
      <p>서버에서 <code>start()</code>는 요청당 <code>Route</code>를 반환하고 라우터를 그대로 두므로 동시 요청이 서로의 경로를 볼 수 없습니다. <code>route.run()</code>는 라우팅을 라우터로 만들고 콘센트에서 렌더링 길이를 읽습니다. 브라우저에는 페이지 로드당 하나의 경로가 있으며 <code>start()</code>는 이를 라우터 자체로 만듭니다. <code>run()</code>는 필요하지 않습니다.</p>
      <p>페이지는 <a href="#router-api"><code>RouteContext</code></a> 및 <a href="#router-api"><code>PageProps</code></a>를 <code>(ctx, { layer, data, outlet, beforeLeave })</code>로 수신하며 더 적은 인수를 사용할 수 있습니다. <code>list()</code>가 허용하는 모든 것을 반환합니다. 레이아웃의 다른 부분도 채우려면 페이지 내부에서 <code>div(article(…), into('sidebar', nav(…)))</code>와 같은 <code>into()</code>를 반환하세요. 해당 콘텐츠는 페이지와 함께 사라집니다. <a href="#router-regions">페이지 &amp; 지역</a>를 참조하세요.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "패턴 및 중첩 라우트",
        content: `
      <table>
        <thead><tr><th>패턴</th><th>일치 대상</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>정확히는 경로</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>무엇이든 비교할 수 없는 것, 당신의 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>우선 순위는 정적이며 선언 순서에 따라 동적이며 가장 긴 접두사가 먼저 캐치됩니다. 따라서 <code>'*'</code>는 다른 어떤 것도 하지 않는 것과만 일치하며 테이블의 어느 곳에나 앉을 수 있습니다. 후행 슬래시, 중복 슬래시 및 백분율 인코딩이 정규화되고 param 값이 디코딩되어 도착합니다. 매칭은 패턴별 세그먼트 비교입니다. 정규식은 빌드되거나 실행되지 않습니다.</p>
      <h3>상대 경로</h3>
      <p><code>./</code>로 작성된 패턴은 이를 선언하는 상위 패턴을 기준으로 하며, <code>./</code>로 작성된 href는 활성 경로를 기준으로 합니다. 그들은 함께 모든 부모 아래에서 동일한 것을 의미하는 재사용 가능한 섹션을 만듭니다. 테이블의 값은 로더이거나 키가 이에 상대적인 다른 테이블입니다.</p>
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
      <p>이 두 줄은 경로를 두 번 쓰지 않고 6개 패턴을 모두 생성합니다. 두 상위 요소 모두 동일한 로더 개체를 가져오므로 하나의 모듈 캐시와 하나의 <code>import()</code>를 공유합니다.</p>
      <ul>
        <li>하위 테이블 내부에서 <code>'./x'</code>, <code>'/x'</code> 및 <code>'x'</code>는 모두 같은 의미이고, <code>'/'</code>는 상위 경로 자체를 의미하며, <code>'*rest'</code>는 섹션에 자체 catch-all을 제공합니다. 중첩은 원하는 만큼 깊어집니다.</li>
        <li>최상위 키는 작성된 대로 사용되므로 <code>'*'</code>는 <code>'*'</code>를 유지합니다.</li>
        <li><code>*catch-all</code> 부모 아래의 자식은 <code>createRouter()</code> 오류입니다. 왜냐하면 포괄적인 것은 패턴을 종료해야 하기 때문입니다.</li>
      </ul>
      <h3>상위 페이지 및 <code>outlet()</code></h3>
      <p>부모와 그 자식은 실제 계층 구조입니다. <code>outlet()</code>를 호출할 때마다 상위가 렌더링되고 하위가 그 내부에서 렌더링됩니다.</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>하위 항목 간을 탐색해도 상위 항목이 다시 작성되지 않습니다. DOM 노드는 동일한 노드이므로 포커스, 스크롤 위치, 절반 유형의 입력 및 클로저의 모든 상태가 모두 유지됩니다.</p>
      <ul>
        <li>하위 경로가 없는 페이지는 콘센트에서 아무것도 렌더링하지 않으므로 레이아웃에서 무조건 호출할 수 있습니다. 아이가 있는데 <code>outlet()</code>라고 부르지 않는 부모는 아이를 삼켜버립니다.</li>
        <li>인덱스 경로가 없습니다. <code>'/'</code>는 레이아웃 자체이므로 상위 경로는 내부에 별도의 인덱스 페이지가 아닌 빈 콘센트가 있는 레이아웃을 렌더링합니다. 랜딩 콘텐츠를 레이아웃에 넣거나 실제 하위 경로를 제공하세요.</li>
      </ul>
      <p>그런 다음 동일한 호출이 상위 페이지와 어느 페이지에 있는지 모르는 페이지에서 작동합니다.</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> 및 <code>..</code>는 URL의 "디렉토리"가 아닌 현재 경로의 경로를 확인합니다. <code>/invoices/42</code>에서 <code>./preview</code>는 <code>/invoices/42/preview</code>입니다. 여기서 브라우저는 <code>/invoices/preview</code>라고 말하며 URL의 후행 슬래시는 아무것도 변경하지 않습니다. <code>../</code>는 세그먼트를 탐색하고 루트에서 중지합니다. 쿼리와 해시가 수행되고 <code>base</code>가 다시 추가되며 해결된 절대 경로가 기록에 기록됩니다. 이는 React Router가 <code>&lt;Link to="./x"&gt;</code>에 대해 만드는 URL 확인과 동일한 편차입니다.</p>
      <ul>
        <li><code>./</code> 및 <code>../</code>만 경로 기준입니다. href의 기본 <code>preview</code>는 일반 브라우저 규칙에 따릅니다.</li>
        <li><code>href="./preview"</code>를 직접 작성하는 대신 <code>router.href('./preview')</code>로 상대 링크를 구축하세요. <code>href()</code>는 렌더링 시 확인되므로 제공되는 마크업은 절대적이며 크롤러, 중간 클릭 및 JavaScript가 비활성화된 경우에도 여전히 정확합니다.</li>
      </ul>
      <h3>유지되는 것과 재구축되는 것</h3>
      <table>
        <thead><tr><th>노드</th><th>탐색 중</th></tr></thead>
        <tbody>
          <tr><td>a 패턴과 경로가 변경되지 않은 상위</td><td><strong>kept</strong>: 동일한 노드이고 해당 <code>load()</code>는 그렇지 않습니다. 다시 실행</td></tr>
          <tr><td>일치된 페이지</td><td><strong>kept</strong> 패턴과 경로가 변경되지 않고 <code>load()</code>가 없으므로 쿼리 또는 해시 변경으로 유지됩니다. 로더가 있는 경로는 방문할 때마다 새로 고쳐집니다.</td></tr>
          <tr><td>a 경로가 변경된 상위</td><td>재빌드됨 및 그 아래의 모든 항목</td></tr>
          <tr><td>a 푸시 레이어</td><td>는 일치하는 페이지만 렌더링합니다. 상위 항목은 이미 그 아래 행에 마운트되어 있습니다.</td></tr>
        </tbody>
      </table>
      <p>유지된 페이지는 빌드된 <code>ctx</code>를 유지합니다. 이것이 어디에서나 <code>ctx</code>의 의미입니다. 실시간 값을 보려면 <code>router.*</code>를 읽어보세요. 필터, 페이지 매김, 탭과 같은 쿼리 기반 상태는 동적 값 내에서 <code>router.search</code>를 읽고 <code>router.go('?page=2', { replace: true })</code>로 씁니다. 페이지, 해당 포커스 및 절반만 입력된 입력은 그대로 유지됩니다.</p>
    `,
      },
      {
        id: "router-regions",
        title: "페이지 및 리전",
        content: `
      <p><code>router.outlet()</code>는 페이지를 한 곳에 모아줍니다. 사이드바, 도구 모음 또는 레이아웃의 다른 위치에 제목도 필요한 페이지는 <a href="#api-region"><code>into()</code></a>로 채워집니다. 레이아웃은 <code>region()</code>로 장소를 표시하고 페이지는 자체 콘텐츠 옆에 <code>into()</code>를 반환합니다. 레이아웃은 페이지 콘텐츠를 소품으로 받지 않으며 탐색이 다시 작성되지 않습니다.</p>
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
      <p>페이지의 콘텐츠는 콘센트의 <code>list()</code> 행이며 <code>into()</code>는 이를 보유하는 행만큼 오래 유지됩니다. 따라서 사이드바 콘텐츠는 페이지와 함께 도착하고 페이지와 함께 떠납니다. <code>into('sidebar', …)</code> 없이 페이지로 이동하면 해당 지역의 <code>empty</code> 콘텐츠가 다시 표시됩니다. 두 부분 모두 동일한 기능으로 구축되었으므로 페이지에서는 두 부분 모두에 대해 <code>ctx</code> 및 <code>data</code>를 사용할 수 있습니다.</p>
      <h3>내비게이션에서 발생하는 현상</h3>
      <ul>
        <li><strong>A 보관된 페이지는 해당 영역을 유지합니다. </strong> <a href="#router-patterns">가 페이지를 유지하는 쿼리 또는 해시 변경</a>은 영역 콘텐츠에도 영향을 주지 않습니다. 사이드바가 이에 의존하는 경우 동적 값 내부에서 <code>router.search</code>를 읽습니다.</li>
        <li><strong>A 재구성된 페이지는 이를 다시 채웁니다. </strong> 경로가 변경되면 이전 행이 제거되고 새 페이지의 <code>into()</code> 보기가 이어받습니다. 아무것도 남지 않았습니다.</li>
        <li><strong>A 푸시 레이어는 뷰를 추가합니다. </strong> 레이어는 콘센트의 나중 행이므로 <code>into()</code>는 동일한 지역의 새로운 뷰입니다. 기본 <code>type: 'latest'</code>를 사용하면 레이어가 닫힐 때까지 페이지 보기를 덮고 페이지 보기가 다시 표시됩니다. <code>type: 'stack'</code>를 사용하면 둘 다 표시됩니다.</li>
        <li><strong>A 상위 페이지도 영역을 채울 수 있습니다. </strong> 상위 페이지가 다시 작성되지 않기 때문에 해당 하위 페이지가 변경되는 동안 해당 뷰는 그대로 유지됩니다.</li>
        <li><strong>Server 렌더링은 있는 그대로 작동합니다.</strong> 서버는 <code>route.run()</code> 내부에 페이지를 구축하므로 해당 <code>into()</code> 뷰는 HTML에 있고 <code>hydrate()</code>는 이를 주장합니다.</li>
      </ul>
      <h3>한 페이지의 여러 지역</h3>
      <p>한 번에 두 개 이상의 영역을 채우려면 객체를 전달하세요. 페이지의 주요 콘텐츠는 여전히 콘센트를 통과하므로 <code>into()</code> 옆에 반환합니다.</p>
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
      <p>이들 모두는 일치하는 하나의 경로에 속합니다. 라우터는 하나의 URL에서 두 개의 독립적인 영역을 구동하지 않으므로 자체 경로가 있는 사이드바는 두 번째 콘센트가 아니라 페이지가 채우는 영역입니다. 자체 라우터, 로딩 및 폴백을 원하는 사이드바는 하나를 시작하지 않은 상태로 유지하고 <code>match()</code>로 해결합니다. <a href="#router-multi">다중 라우터 &amp; 결합 로딩</a>를 참조하세요.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "라우트 로더 및 코드 분할",
        content: `
      <p>페이지 모듈은 <code>load</code> 기능을 내보낼 수 있습니다. 페이지가 구축되기 전에 해당 경로를 탐색할 때마다 실행되며 반환되는 모든 내용은 <code>data</code>로 페이지에 전달됩니다.</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>경로 테이블은 변경되지 않았습니다. 로더는 페이지와 함께 이동합니다. 일치하는 <code>RouteContext</code>를 가져오므로 <code>params</code>, <code>search</code> 및 <code>path</code>를 모두 사용할 수 있습니다. 동기식 또는 비동기식일 수 있으며 서버에서도 실행되므로 서버 렌더링 페이지는 하이드레이션 후 가져오는 대신 이미 HTML에 있는 데이터와 함께 제공됩니다.</p>
      <p><strong>모듈이 캐시되었습니다. 데이터는 그렇지 않습니다. </strong> 경로의 청크는 한 번 가져와 재사용되며 해당 로더는 탐색할 때마다 다시 실행됩니다. 이것이 바로 <code>/blog/a</code>와 <code>/blog/b</code>를 혼동할 수 없는 이유이며, 실패한 로더를 간단히 재시도할 수 있는 이유입니다.</p>
      <table>
        <thead><tr><th>상황</th><th>행동</th></tr></thead>
        <tbody>
          <tr><td>실행되는 동안</td><td><code>router.pending</code>는 true이고 현재 있던 페이지는 그대로 유지됩니다.</td></tr>
          <tr><td>던지거나 거절하는 거죠</td><td>착륙하다 <code>router.error</code>. <code>go()</code> 여전히 거부되지 않으며 탐색을 다시 시도할 수 있습니다.</td></tr>
          <tr><td> <code>start()</code></td><td> 중에 <code>start()</code>에서 거부가 발생합니다. 아직 올려드릴 루트가 없습니다.</td></tr>
          <tr><td>a 푸시 레이어</td><td>자체 데이터로 자체 로더를 실행합니다</td></tr>
          <tr><td>유휴 프리로더</td><td>는 모듈만 따뜻하게 합니다. 전달할 컨텍스트가 없으며 결코 열 수 없는 경로에 대한 데이터를 가져옵니다.</td></tr>
          <tr><td>동일한 URL로 다시 탐색</td><td>로더가 다시 실행되고 행이 다시 작성됩니다. 로더가 없는 경로는 해당 행을 유지합니다.</td></tr>
        </tbody>
      </table>
      <p>재검증하려면 기록 항목을 추가하지 않고 이미 있는 위치로 이동하세요.</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>청크로 데이터 시작하기</h3>
      <p>페이지 모듈에서 내보낸 <code>load</code>는 해당 모듈이 도착한 후에만 실행될 수 있으므로 콜드 탐색은 청크를 가져온 다음 데이터를 가져옵니다. 두 가지를 동시에 시작하려면 <code>withLoad()</code>를 사용하여 테이블에서 로더를 선언하세요.</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>모듈의 자체 <code>load</code>를 대체하고 방문할 때마다 실행됩니다. 청크가 여전히 로드되는 동안 거부는 다른 것과 마찬가지로 <code>router.error</code>에 도달합니다.</p>
      <p>설계상 HTML에 서버 데이터가 직렬화되지 않습니다. 클라이언트의 <code>load</code>가 수화로 다시 실행됩니다. 이것이 중요한 경우 서버가 <code>route.data</code>(예: <code>window.__DATA__</code>)를 내보내고 로더가 이를 먼저 가져오도록 합니다. <code>route.data</code>는 일치하는 페이지의 데이터만입니다. 부모의 <code>load()</code> 결과가 여기에 없습니다.</p>
      <h3>코드 분할 및 사전 로드</h3>
      <p>경로의 값은 항상 페이지 컴포넌트를 반환하는 함수이므로 컴포넌트에 느리게 도달합니다.</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>모듈 모양 양식만 <code>load</code> 내보내기를 수행할 수 있습니다. <code>.then(m =&gt; m.BPage)</code>를 사용하여 명명된 컴포넌트를 선택하면 라우터에 기능만 전달됩니다.</p>
      <p>각 모듈은 한 번 가져오고 캐시됩니다. 동일한 경로에 대한 동시 탐색은 하나의 <code>import()</code>를 공유합니다. 사용자가 <code>idleTimeout</code>에 대한 페이지를 그대로 두면(기본적으로 1초, 탭, 키, 휠 또는 스크롤 없음) 남은 경로가 유휴 슬라이스(<code>requestIdleCallback</code>)당 하나씩 백그라운드에 로드됩니다. 사용자가 기다리고 있는 입력이나 탐색은 페이지가 다시 유휴 상태가 될 때까지 일시 중지됩니다.</p>
      <p>사전 로드되거나 열성적인 경로는 <code>router.pending</code>를 뒤집지 않으며 다음 페인트 전에 착륙하지 않습니다. 스피너 프레임도 없고 레이아웃 전환도 없습니다. <code>router.pending</code>는 기다려야 하는 모듈이나 로더에 대해서만 적용되며, 나가는 페이지는 있는 동안 화면에 유지됩니다. 처리되지 않은 거부가 아닌 <code>router.error</code>로 표면을 로드하지 못한 청크는 간단히 재시도할 수 있습니다.</p>
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
          <tr><td><code>preload</code></td><td><code>true</code></td><td>페이지가 유휴 상태가 되면 백그라운드에서 나머지 경로의 모듈을 로드합니다. <code>false</code>가 전원을 끕니다.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td> 미리 로드가 시작되기 전 탭, 키, 휠 또는 스크롤이 없는 밀리초 또는 사용자가 종료된 후 다시 시작 바쁘다.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>는 ​​DOM가 따라잡으면 초기 탐색을 포함하여 브라우저에서 탐색이 해결될 때마다 호출됩니다. <code>kind</code>는 <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code>(뒤로, 앞으로, <code>close()</code>) 또는 <code>'layer'</code>입니다. <code>document.title</code>, 메타 태그, 포커스, 스크롤 및 분석을 위한 후크입니다. SSR.</td></tr> 동안 전화한 적이 없습니다.
        </tbody>
      </table>
      <p>라우터 <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> 및 <code>run()</code>를 제외한 모든 <code>Route</code> 멤버를 활성 경로로 읽어 반환합니다. 이는 브라우저에 마지막으로 반환된 <code>start()</code> 또는 서버에서 실행 중인 <code>run()</code>의 것입니다. 던지지 않은 멤버를 읽습니다. 경로 테이블, 컴파일된 일치자 및 모듈 캐시는 라우터에 있으므로 서버의 요청 간에 공유됩니다.</p>
      <h3><code>router.start(url?)</code></h3>
      <p><code>url</code>(브라우저의 기본값: <code>location.href</code>)를 페이지 모듈로 확인하고 <code>Promise&lt;Route&gt;</code>를 반환합니다. 일치하는 항목이 없고 테이블에 <code>'*'</code> 경로가 없으면 거부됩니다. 서버에서는 404입니다. 브라우저에서는 라우팅을 라우터의 활성 경로로 만들고 <code>popstate</code> 및 위임된 <code>click</code> 리스너를 연결하고 사전 로드를 예약합니다. 두 번째 <code>start()</code>는 이전 경로를 폐기합니다. 서버에서는 공유되는 항목이 없으므로 <code>route.run()</code> 내부에서 렌더링합니다.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>아무것도 로드하지 않고 테이블에 대해 URL을 확인합니다. 가져오기 없음, 기록 없음, 리스너 없음, 경로 없음. URL이 <code>base</code> 외부에 있거나, 패턴과 일치하지 않거나, 브라우저에서 다른 출처에 있는 경우 <code>RouteContext</code> 또는 <code>null</code>를 반환합니다. <code>./</code> 확인에는 활성 경로가 필요하므로 절대 URL만 해당됩니다.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>활성 경로의 페이지는 <code>list()</code>입니다. 페이지가 어디로 이동하든 한 번만 배치하세요. 푸시된 레이어는 그 레이어의 나중 행입니다. <code>start()</code>가 해결되기 전과 <code>stop()</code>가 해결된 후에는 비어 있습니다. 서버에서는 <code>run()</code>가 실행 중인 경로를 렌더링합니다.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>활성 경로의 경로와 일치하는 두 번째 테이블의 뷰를 어디에나 배치할 수 있는 <code>list()</code>로 렌더링합니다. <a href="#router-matches"><code>matches()</code></a>를 참조하세요.</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code>를 제외한 모든 구성원은 라우터에도 있으며, 여기에서 앱이 이를 읽습니다.</p>
      <table>
        <thead><tr><th>멤버</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>활성 일치합니다. <code>search</code>는 <code>URLSearchParams</code>입니다. <code>search</code>, <code>hash</code> 및 <code>url</code>가 라이브 중입니다.</td></tr>
          <tr><td><code>pending</code></td><td>a 탐색이 모듈 또는 로더를 기다리고 있습니다.</td></tr>
          <tr><td><code>error</code></td><td>마지막으로 실패한 로드, 다음 탐색으로 지워짐</td></tr>
          <tr><td><code>data</code></td><td>서버가 직렬화하기 위해 일치하는 페이지의 <code>load()</code>가 반환한 내용입니다. 부모님의 정보가 없습니다.</td></tr>
          <tr><td><code>depth</code></td><td>스택에 레이어 수(일반 페이지의 경우 1개)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>탐색하고 필요한 경우 모듈을 로드합니다. 절대로 거부하지 않음: 거부하거나 던져서 실패한 모듈은 <code>error</code>.</td></tr>에 도달합니다.
          <tr><td><code>push(href)</code></td><td> 경로를 맨 위에 새 레이어로 열고 닫히는 항목으로 해결합니다. <code>./</code>를 허용합니다. 일치하지 않거나 실패한 모듈을 거부합니다.</td></tr>
          <tr><td><code>href(path)</code></td><td><code>a({ href })</code>의 경우 경로 앞에 <code>base</code>를 붙입니다. 활성 경로에 대해 <code>./</code> 및 <code>../</code>를 확인합니다.</td></tr>
          <tr><td><code>stop()</code></td><td>모든 리스너를 분리하고, 열린 레이어를 닫고, 콘센트를 비웁니다. 멱등성. 중지된 경로는 여전히 마지막 일치 항목으로 응답하고 <code>go()</code>는 아무 작업도 수행하지 않습니다.</td></tr>
          <tr><td><code>run(fn)</code></td><td>이 경로를 라우터의 활성 경로로 사용하여 <code>fn</code>를 호출하고 서버에서 결과: <code>route.run(() =&gt; renderToString(App))</code>를 반환합니다. 동기식만 가능합니다. <code>fn</code>가 반환되면 경로가 활성화되지 않습니다.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>페이지의 첫 번째 인수: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. 페이지가 작성된 컨텍스트입니다. 실시간 값을 보려면 <code>router.*</code>를 읽어보세요. 다시 작성하지 않고 쿼리나 해시가 변경된 경우에만 다릅니다.</p>
      <p><code>params</code>는 기본적으로 <code>{ [name]: string }</code>입니다. 페이지는 <code>Params</code>를 사용하여 자체 패턴에서 이를 입력할 수 있으며, 이는 <code>'/blog/:slug'</code>를 <code>{ slug: string }</code>로, <code>'/files/*rest'</code>를 <code>{ rest: string }</code>로 바꿉니다.</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>페이지의 두 번째 인수입니다. 페이지에 필요한 것을 구조화합니다.</p>
      <table>
        <thead><tr><th>속성</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>페이지가 스택에 있는 위치입니다. 아래 <code>Layer</code>를 참조하세요.</td></tr>
          <tr><td><code>data</code></td><td>경로의 <code>load()</code>가 반환된 내용 또는 <code>undefined</code>가 반환되지 않은 내용입니다. <code>PageProps&lt;TData&gt;</code>.</td></tr>로 입력됨
          <tr><td><code>outlet</code></td><td>여기서 상위 페이지는 하위 경로를 렌더링합니다. <a href="#router-patterns">중첩 경로</a>.</td></tr>를 참조하세요.
          <tr><td><code>beforeLeave</code></td><td> 이 페이지가 삭제되기 전에 요청된 가드를 등록합니다. <a href="#router-layers">가드를 떠나십시오</a>.</td></tr>를 참조하십시오
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>페이지가 스택에 있는 위치와 나가는 길입니다.</p>
      <table>
        <thead><tr><th>멤버</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0, 푸시된 레이어의 경우 1 이상</td></tr>
          <tr><td><code>push(href)</code></td><td>페이지 내부에서 다른 레이어를 엽니다. <code>Route.push()</code></td></tr>와 동일합니다.
          <tr><td><code>close(result?)</code></td><td>이 레이어와 그 위의 모든 항목을 닫고 이를 연 <code>push()</code>를 해결합니다. 논쟁이 없다는 것은 기각을 의미합니다. 깊이 0.</td></tr>에서 무작동
        </tbody>
      </table>
      <h3><code>DataLoader</code> 및 <code>withLoad()</code></h3>
      <p><code>DataLoader</code>는 페이지 모듈의 선택적 <code>load</code> 내보내기인 <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>입니다. <code>withLoad(loader, load)</code>는 <code>load</code>가 청크 가져오기 뒤가 아닌 옆에서 시작하는 경로를 만듭니다. <a href="#router-loaders">경로 로더</a>를 참조하세요.</p>
      <h3>유형</h3>
      <p>모든 유형은 <code>nuclo-router</code>의 명명된 내보내기이므로 경로에서 가져오지 않고도 페이지, 로더 또는 가드를 입력할 수 있습니다.</p>
      <table>
        <thead><tr><th>타입</th><th>그것은 무엇입니까</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> 패턴에 대한 params 개체입니다. <code>RouteParams</code>는 유형이 지정되지 않은 모양이고 <code>Match</code>는 일치자의 결과입니다.</td></tr>
          <tr><td><code>PageComponent</code></td><td>a 페이지: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>a 페이지 모듈: 컴포넌트 자체 또는 <code>{ default, load? }</code> <code>import()</code>가 </td></tr>를 생성하므로
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, 선택적으로 운반 <code>load</code> ~에서 <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>테이블 <code>createRouter()</code>는 다음을 취합니다: 로더 또는 중첩 테이블에 대한 패턴</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, <code>go()</code></td></tr>의 두 번째 인수
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, <code>onNavigate</code></td></tr>의 두 번째 인수
          <tr><td><code>Outlet</code></td><td>유형 <code>outlet()</code> ~에서 <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, <code>beforeLeave()</code>가 취하는 것</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> 뷰는 무엇입니까: 매개변수 입력, 콘텐츠 또는 페이지 출력의 <code>import()</code></td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "레이어 및 이탈 가드",
        content: `
      <p><code>push()</code>는 경로를 바꾸는 대신 현재 경로 위에 경로를 열고 해당 레이어가 닫히는 모든 것을 해결합니다. 페이지는 스택 위에 있는 단일 <code>list()</code>이므로 레이어를 여는 것은 추가입니다. 아래 페이지는 다시 렌더링되지 않으므로 레이어가 닫힐 때 DOM, 포커스 및 절반만 채워진 양식이 모두 그대로 유지됩니다.</p>
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
      <p>레이어 중첩. 자체 대화 상자가 필요한 대화 상자는 <code>layer.push()</code>를 호출하고 경로에 대한 참조 없이 이를 기다립니다.</p>
      <ul>
        <li><strong>URL은 최상위 레이어입니다.</strong> <code>push()</code>는 기록 항목을 추가하므로 레이어를 연결할 수 있고 뒤로 가기가 레이어를 닫아 취소와 마찬가지로 해당 <code>push()</code>가 해제된 것으로 확인됩니다. Back과 <code>close()</code>는 하나의 코드 경로입니다. <code>close()</code>는 결과를 기록하고 기록을 되돌려보며 <code>history.state</code>의 깊이가 권한입니다. 브라우저는 탭당 약 50개의 항목을 유지하므로 레이어를 오랫동안 탐색한 후에 아래 항목이 사라질 수 있습니다. 그런 다음 <code>close()</code>는 ​​해당 레이어를 닫고 왼쪽에 표시된 페이지에 현재 항목을 다시 씁니다.</li>
        <li><strong>일반 탐색은 스택을 지웁니다.</strong> 링크 클릭 또는 <code>go()</code>는 레이어가 아닙니다. 모든 것을 대체하고 열려 있는 모든 레이어를 닫으므로 대기 중인 호출자가 없습니다.</li>
        <li><strong>A 콜드 로드는 독립형 페이지입니다. </strong> URL은 최상위 레이어의 이름을 지정하지만 그 아래의 스택은 지정하지 않으므로 레이어의 URL을 열면 <code>layer.depth === 0</code> 및 비활성 <code>close()</code>를 사용하여 깊이 1에서 직접 렌더링합니다. 푸시된 경로는 그 자체로 의미가 있어야 합니다. 죽은 취소 버튼 대신 링크 출력을 제공하기 위해 <code>layer.depth</code>에서 분기합니다.</li>
        <li><strong>Promise는 클로저에 있기 때문에 다시 로드</strong> 후에도 유지되지 않습니다. 결과를 장기적으로 작동하는 흐름을 통한 지름길로 처리하십시오.</li>
        <li><strong>기다리는 것이 없습니다. </strong> <code>stop()</code>는 열려 있는 모든 레이어를 닫고 탐색에 의해 버려진 레이어는 <code>undefined</code>로 해결됩니다.</li>
      </ul>
      <h3>가드를 남겨주세요</h3>
      <p>절반만 채워진 양식과 같이 보관할 가치가 있는 내용이 포함된 페이지는 가드를 등록합니다. 페이지가 삭제되기 전에 요청되며 <code>false</code>(또는 이에 대한 약속)를 반환하면 페이지가 유지됩니다.</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>페이지가 이동하는 경우에만.</strong> 레이아웃 아래의 하위 탐색이나 페이지를 유지하는 쿼리 또는 해시 변경은 묻지 않습니다. 경비원은 페이지와 함께 살고 죽기 때문에 등록을 취소할 것이 없습니다.</li>
        <li><strong>Every way out.</strong> A 링크, <code>go()</code>, 뒤로 및 앞으로, 레이어의 <code>close()</code> 및 <code>go()</code>를 라우터가 소유하지 않은 URL로 연결합니다(앱에서 <code>to</code>가 <code>null</code>인 경우). 거부된 뒤로 또는 앞으로는 뒤로 이동하므로 주소 표시줄이 페이지에 유지됩니다. 탭을 닫거나 다시 로드하는 것은 <code>beforeunload</code>의 작업입니다.</li>
        <li><strong><code>to</code></strong>는 내비게이션이 향하고 있는 <code>RouteContext</code>입니다. 경비원은 가장 안쪽으로 먼저 달려가고 첫 번째 거부에 멈춥니다. 던지는 사람이 페이지를 유지합니다. <code>close(result)</code>도 가드를 통과하므로 결과로 종료되기 전에 플래그를 지우십시오.</li>
        <li>라우터는 자신이 작성한 기록 항목만 되돌릴 수 있습니다. 기본 <code>#fragment</code> 링크나 다른 스크립트의 <code>pushState</code>와 같이 이전에 실행되지 않은 항목으로의 뒤로 또는 앞으로는 요청되지 않습니다.</li>
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
        <li><strong>라우팅 테이블과 일치합니다. </strong> 패턴, 우선 순위, 원시 경로 일치 및 <code>base</code> 스트리핑은 라우터 자체이므로 뷰와 페이지는 항상 URL에 동의합니다. <code>router.path</code>와 같은 최상위 레이어의 경로를 읽습니다.</li>
        <li><strong>A view</strong>는 <code>(params, ctx) =&gt; content</code>입니다. 여기서 <code>params</code>는 해당 패턴에서 입력되고 <code>ctx</code>는 뷰의 <code>pattern</code> 및 <code>params</code>가 있는 <code>RouteContext</code>입니다. 대신 페이지 모듈의 <code>import()</code>를 반환할 수 있으며, 이는 일단 도착하면 <code>ctx</code>로 호출됩니다.</li>
        <li><strong> 일치하는 항목이 없으며 아무것도 렌더링되지 않습니다.</strong> 대체를 위해 <code>'*'</code> 보기를 추가합니다. 콘센트처럼 <code>start()</code> 이전과 <code>stop()</code> 이후는 비어 있습니다.</li>
        <li><strong>경로가 변경될 때만 다시 렌더링됩니다</strong>. 따라서 뷰는 페이지를 유지하는 모든 항목에서 DOM를 유지합니다.</li>
        <li><strong>A 지연 보기는 해당 모듈이 도착할 때까지 아무것도 렌더링하지 않습니다. </strong> 실패한 <code>import()</code>는 <code>console.error</code>로 기록되고 <code>router.error</code>를 설정하지 않으며 다음 탐색에서 다시 시도됩니다. 일반 <code>update()</code>는 재시도하지 않습니다.</li>
        <li><strong>서버</strong>에서 게으른 보기는 해당 모듈이 클라이언트에 있으므로 아무것도 전달하지 않습니다. 첫 번째 HTML에 포함되어야 하는 모든 항목에 대해 동기식 보기를 사용합니다.</li>
      </ul>
      <h3>서브 라우터</h3>
      <p>경로가 중첩되므로 하위 라우터는 일반적으로 중첩된 테이블입니다. 하나의 라우터: 섹션 자체의 <code>'/'</code> 페이지는 크롬이고 해당 하위 페이지는 해당 페이지의 <code>outlet()</code>에서 렌더링되므로 크롬은 섹션 내 탐색에서 유지됩니다.</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>또는 생성되었지만 시작되지 않은 자체 라우터 기능을 제공합니다. 부모는 단일 포괄 항목을 소유하고 자식은 자체 패턴, 매개변수 및 폴백에 대해 꼬리를 해결합니다.</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>절대 시작하지 않는 것이 포인트입니다. <code>start()</code>는 리스너를 연결하는 것이며 시작된 두 개의 라우터가 충돌합니다. 거래는 하위가 해상도를 소유하므로 시작된 라우터가 실행되는 경로 로더를 호출할 수 있다는 것입니다. 이 모양은 또한 꼬리가 변경될 때 셸을 다시 빌드합니다. 왜냐하면 라우터가 하나의 경로를 확인하고 셸이 나머지 경로를 자체적으로 해결하기 때문입니다. 중첩 테이블은 라우터가 계속 마운트된 상위 테이블을 제공하므로 해당 기능에 실제로 자체 라우터, 베이스 및 폴백이 필요한 경우가 아니면 이를 선호합니다.</p>
    `,
      },
      {
        id: "router-multi",
        title: "여러 라우터 및 통합 로딩",
        content: `
      <p>앱은 영역 수만큼 라우터를 가질 수 있습니다. 이를 단순하게 유지하는 규칙은 다음과 같습니다. <strong>문서당 정확히 하나만 시작하고</strong> 다른 모든 라우터는 시작되지 않은 상태로 유지하여 <code>match()</code>로 URL을 확인합니다. 시작된 라우터만이 URL, 기록 및 클릭 리스너를 소유합니다. 나머지는 사용자가 질문하는 테이블입니다. 각 영역은 자체 스피너를 사용하여 자체 시계에 로드할 수 있습니다.</p>
      <h3>결합 로딩: 로더 체인</h3>
      <p>일치하는 체인의 모든 페이지는 <code>load()</code>를 내보낼 수 있습니다. 하위 경로에 대한 콜드 탐색에서 레이아웃의 로더와 페이지의 로더는 <strong>를 병렬로 </strong>로 실행하고 하나의 <code>router.pending</code>가 전체 체인을 덮습니다. 이전 페이지는 쌍이 해결될 때까지 화면에 유지되므로 절반만 로드된 트리는 페인트되지 않습니다. 각 컴포넌트는 자체 <code>data</code>를 받습니다.</p>
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
      <p>두 로더가 차례로 시작되지 않고 함께 시작됩니다. <code>router.pending</code>는 둘 중 하나가 대기하는 동안 true이고 나머지 시간에는 false입니다. 사전 로드되거나 열성적인 경로는 절대 반전하지 않습니다. 섹션 사이를 이동하면 레이아웃이 유지되므로 섹션의 로더만 다시 실행됩니다. 레이아웃의 데이터, DOM 및 절반 유형의 입력은 모두 유지됩니다. 동일한 URL로 다시 탐색하면 단일 페이지와 마찬가지로 리프의 로더가 다시 실행되고 해당 행이 다시 작성됩니다.</p>
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
      <p>두 번째 라우터는 요청을 받지만 알려주지 않습니다. <code>match()</code>는 URL을 읽고 컨텍스트를 반환하며 사이드바에 대한 어떤 것도 기본 경로 테이블에 입력되지 않습니다. <code>onNavigate</code>는 초기 탐색을 포함하여 해결된 모든 탐색 후에 실행되므로 URL과 보조를 맞춰 독립된 영역을 유지하는 단일 장소입니다.</p>
      <ul>
        <li><strong><code>pending</code>는 시작된 라우터에 속합니다. </strong> 시작되지 않은 라우터에는 경로, <code>pending</code> 및 <code>error</code>가 없습니다. 해당 영역은 자체 플래그를 추적하고 두 번째 스피너는 첫 번째 플래그 옆에 배치될 수 있습니다. 데모에서 사이드바는 800ms 동안 로드되는 반면 경로의 로더는 900ms 동안 실행되므로 페이지는 사이드바보다 먼저 완료되거나 그 반대 방향으로 완료될 수 있습니다.</li>
        <li><strong><code>match()</code>는 아무것도 첨부하지 않습니다. </strong> 시작되지 않은 라우터 수에 관계없이 문서를 공유할 수 있습니다. 각각에는 자체 테이블, 기본 및 모듈 캐시가 있으며 그 중 어느 것도 기록을 건드리지 않습니다. 테이블과 매치 비용이 듭니다.</li>
        <li><strong>Its 로더는 실행되지 않습니다. </strong> 시작된 라우터는 일치하는 페이지의 <code>load()</code>를 실행합니다. 시작되지 않은 라우터는 확인만 하므로 보기에 데이터가 필요한 경우 직접 가져오십시오(데모의 <code>refreshSidebar()</code>). 로더를 원하는 경우 <a href="#router-matches">중첩 테이블</a> 또는 페이지가 채워지는 <a href="#router-regions">영역</a>는 ​​시작된 라우터에서 해당 작업을 유지합니다.</li>
        <li><strong>Guard 오래된 응답.</strong> 느린 사이드바 가져오기는 탐색한 섹션에 도달해서는 안 됩니다. 새로 고침당 생성 카운터를 높이고 더 이상 일치하지 않는 응답을 삭제합니다. 라우터 자체가 추월된 탐색을 폐기하는 방식입니다.</li>
        <li><strong>A 게으른 <code>matches()</code> 뷰에는 <code>pending</code>도 없습니다. </strong> 모듈이 착륙할 때까지 아무것도 렌더링하지 않습니다. 3개의 로딩 시스템, 3개의 독립 시계: 경로의 <code>pending</code>, 자신의 플래그, 아직 존재하지 않는 게으른 보기.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "링크 처리",
        content: `
      <p>위임된 리스너는 SVG <code>&lt;a&gt;</code>를 포함하여 <code>&lt;a href&gt;</code>를 마우스 왼쪽 버튼으로 클릭하고 그 안에 중첩된 항목을 클릭하고 다른 모든 항목(수정자 클릭 및 중간 클릭, <code>_self</code> 이외의 <code>target</code>)을 위해 한 단계 물러납니다. <code>download</code>, <code>rel="external"</code>, 교차 출처 href, 현재 페이지의 해시 전용 링크, <code>base</code> 외부 경로, 경로가 일치하지 않는 경로(그래서 서버 렌더링된 404에 여전히 도달 가능) 및 앱 핸들러가 이미 <code>preventDefault()</code>를 호출한 모든 이벤트. <code>data-nuclo-router="off"</code>를 사용하여 링크를 명시적으로 선택 해제하세요.</p>
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
        <li><strong>아무것도 유지되지 않습니다. </strong> 경로는 DOM가 아닌 페이지 기능과 해당 컨텍스트를 유지합니다. 다른 페이지로 이동하면 이전 페이지가 해제됩니다. <code>stop()</code>는 청취자와 모든 비행 중 로드를 해제하고 <code>pending</code>를 지우므로 폐기된 경로는 스피너를 좌초시키지 않습니다. <code>stop()</code>가 자동으로 삭제된 후 해결되는 모듈입니다.</li>
        <li><strong> 서버에서 동시성 안전. </strong> <code>start()</code>는 요청별 상태를 반환하고 <code>run()</code>는 이를 하나의 동기 렌더링으로 범위 지정하므로 인터리브된 요청은 서로의 경로를 볼 수 없습니다. 모듈 캐시만 공유됩니다. <code>run()</code>의 함수가 반환되면 범위가 종료됩니다. <code>renderToString()</code>는 동기식이므로 충분합니다. 비동기 또는 스트리밍 렌더링에는 <code>run()</code>가 수행하지 않는 <code>await</code>를 통해 전달되는 경로가 필요합니다.</li>
        <li><strong>스크롤 복원 사용 <code>popstate</code></strong> 브라우저의 (<code>scrollRestoration</code>), 라우터가 아닙니다.</li>
        <li><strong>문서당 하나의 라우터를 시작합니다.</strong> 각 <code>start()</code>는 자체 위임 <code>click</code> 수신기를 추가하고 두 번째 라우터의 <code>start()</code>는 첫 번째 수신기를 폐기하지 않습니다. 동일한 라우터에 있는 두 번째 <code>start()</code>만 작동합니다. 다른 테이블에 대해 URL을 확인하려면 라우터를 만들고 <code>match()</code>만 호출하세요. 아무것도 첨부하지 않습니다. 독립된 영역은 경로의 <code>pending</code> 옆에서 자체 로딩을 실행할 수 있습니다. <a href="#router-multi">다중 라우터 &amp; 결합 로딩</a>를 참조하세요.</li>
        <li><strong> 경로가 경로 이름에 있고 서버가 모든 경로를 제공해야 하기 때문에 의도적으로 포함되지 않습니다: </strong> 해시 및 메모리 기록. 페이지가 <code>into()</code>로 여러 영역을 채울 수 있지만 모두 하나의 일치하는 경로에 속하기 때문에 하나의 URL로 구동되는 두 개의 독립적으로 라우팅된 영역 — <a href="#router-multi">Multiple Routers &amp; Combined Loading</a>에서와 같이 독립적인 영역은 여전히 ​​시작되지 않은 자체 라우터와 로딩을 유지할 수 있습니다. <code>mouseenter</code>에서 경로 자체 로더를 호출하여 얻을 수 있는 호버 사전 로드.</li>
      </ul>
      <h3>예</h3>
      <p>저장소에서 실행 가능한 두 가지 예제는 서로를 보완하므로 모든 설정을 어딘가에서 관찰할 수 있습니다.</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: 전체 API에 대한 클라이언트 측 둘러보기입니다. 모든 패턴 형식 및 우선 순위 규칙, 링크 처리 옵트아웃, 라이브 제어가 포함된 모든 경로 멤버, 하위 라우터, 3단계 깊이의 레이어 스택, 두 상위 항목에 마운트된 상대 섹션, <code>pending</code> 및 <code>error</code>가 있는 경로 로더. 해당 상태가 계속 표시되도록 <code>preload: false</code>를 설정합니다.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: 요청당 <code>renderToString()</code>, 서버 노드를 주장하는 것으로 입증된 하이드레이션, 실제 404 상태 코드, 루트가 아닌 <code>base</code>, 네트워크 패널에서 볼 수 있는 유휴 사전 로드, 서버에서 서버로 데이터가 전달되는 로더 클라이언트가 수분 공급을 다시 가져오지 않도록 합니다.</li>
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
      <p>Nuclo에는 계산된 API가 없습니다. 일반 함수를 사용하고 동적 값에서 호출하세요.</p>
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
      <p>일반 <code>async</code>/<code>await</code>를 사용하고 상태가 변경될 때마다 <code>update()</code>를 호출하세요. 가져오기의 경우 이는 <code>await</code> 이전에 한 번, 이후에 한 번을 의미합니다.</p>
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
        <li><strong>Render를 문서로 보냅니다.</strong> <code>update()</code>가 실행될 때 문서에 없는 노드는 업데이트를 중지합니다.</li>
        <li><strong>노드를 반환하는 함수가 아니라 변경되는 하위 항목에 대해 <code>when()</code> 및 <code>list()</code></strong>를 사용합니다.</li>
        <li><strong>사용 <code>className</code>, 아니다 <code>class</code></strong>, 그리고 사용 <code>() =&gt; cx(...)</code> 또는 <code>{ className: () =&gt; … }</code> 동적 수업의 경우.</li>
        <li><strong>모듈 수준에서 스타일을 한 번 정의합니다.</strong>.</li>
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
      <p>모든 공개 기능과 그 출처.</p>
      <h3><code>nuclo</code>(전역 및 명명된 내보내기)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: 모든 동적 값 또는 지정된 범위에 있는 값을 실행합니다.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code>에 대한 요소 범위 ID를 제공합니다.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: <code>.when()</code> 및 <code>.else()</code>가 포함된 조건부 콘텐츠.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: 항목당 하나의 행, ID와 일치.</li>
        <li><a href="#api-region"><code>region(options)</code></a> 및 <a href="#api-region"><code>into(id, ...content)</code></a>: 트리의 명명된 위치 및 어디에서나 이를 채우는 콘텐츠입니다.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: 이벤트 리스너 또는 <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: 빌드 및 추가.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: 서버 HTML를 인수합니다.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: 컴포넌트를 다시 호출하고 DOM를 패치합니다.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: 스타일 개체에서 생성된 클래스.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: 스타일을 결합하면 나중에 승리합니다.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: 테마 <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> 및 <code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: 옵션의 스타일.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> 및 <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code>(명명 내보내기 전용)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> 및 <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> 및 <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">A 부작용 import</a>, <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> 및 <code>Nuclo*</code> 클래스.</li>
      </ul>
      <h3><code>nuclo-router</code>(별도 패키지)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: 라우터, <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> 및 <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: 데이터 로더가 해당 청크 옆에서 시작하는 경로입니다.</li>
        <li><a href="#router-api">Types</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> 등.</li>
      </ul>
      <h3>글로벌 전용</h3>
      <ul>
        <li><a href="#tag-builders">175 태그 빌더</a>: <code>div</code>, <code>span</code>, …, <code>var_</code> 및 <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Types</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> 등. <code>StyleResult</code>와 같은 스타일 유형을 <code>'nuclo'</code>에서 가져올 수도 있습니다.</li>
      </ul>
      <h3>특수 키</h3>
      <ul>
        <li><a href="#attributes">속성</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> 처리기</a>, <a href="#lifecycle"><code>onMount</code> 및 <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Style 개체</a>: 축약형, 의사 상태, <code>&amp;</code> 선택기, <code>@</code> 규칙 및 <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "자주 묻는 질문",
        content: `
      <h3>상태 변경이 UI를 업데이트합니까?</h3>
      <p>아니요. DOM는 <code>update()</code>를 호출할 때까지 그대로 유지됩니다.</p>

      <h3>Nuclo는 신호, 프록시 또는 가상 DOM를 사용합니까?</h3>
      <p>번호. 상태는 일반 JavaScript로 유지됩니다. 트리가 렌더링되면 Nuclo는 실제 요소와 텍스트 노드를 생성합니다. <code>update()</code>는 등록된 모든 동적 값 또는 지정된 범위 내의 값을 실행하고 값이 변경된 동일한 노드를 패치합니다. 종속성 그래프와 가상 트리가 없습니다.</p>

      <h3>내 페이지에 "false"가 표시되는 이유는 무엇입니까?</h3>
      <p>부울은 텍스트로 렌더링됩니다. <code>div(ok &amp;&amp; span('Done'))</code>에는 "false"가 표시됩니다. 자식 노드용으로는 <code>when(() =&gt; ok, span('Done'))</code>를, 텍스트용으로는 <code>ok ? 'Done' : ''</code>를 사용하세요.</p>

      <h3>항목을 편집할 때 목록 행이 변경되지 않는 이유는 무엇입니까?</h3>
      <p>목록에 아직 남아 있는 항목의 행은 유지되며 다시 렌더링되지 않습니다. 변경되는 필드에는 <code>() =&gt; todo.text</code>와 같은 동적 값을 사용하십시오. <a href="#api-list"><code>list()</code></a>를 참조하세요.</p>

      <h3>UI의 일부가 업데이트를 중지하는 이유는 무엇입니까?</h3>
      <p>일반적으로 <code>update()</code>가 실행될 때 해당 노드가 문서에 없었습니다. Nuclo는 해당 노드를 연결한 후에도 추적을 중지하므로 문서에 있는 컨테이너로 렌더링합니다. 다른 두 가지 원인: 조건이 발생하는 <code>when()</code>는 업데이트를 중지하고 첫 번째 실행에서 발생하는 텍스트 함수는 비어 있습니다. <a href="#api-update"><code>update()</code></a>를 참조하세요.</p>

      <h3>언제 <code>forceUpdate()</code>를 사용해야 합니까?</h3>
      <p>언어 전환과 같이 정적 값이 거의 변경되지 않는 경우에만 해당됩니다. 그 밖의 모든 것에는 <code>update()</code>를 사용하십시오. <a href="#api-force-update"><code>forceUpdate()</code></a>를 참조하세요.</p>

      <h3>소품으로 전달하지 않고 페이지를 레이아웃에 어떻게 넣나요?</h3>
      <p><code>region({ id: 'main' })</code>로 장소를 표시하고 페이지가 <code>into('main', …)</code>를 반환하도록 합니다. <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>를 참조하세요.</p>

      <h3>앱을 어떻게 마운트 해제하나요?</h3>
      <p><code>when()</code>로 감싸고 조건을 끕니다. DOM를 직접 제거하면 <code>onDestroy</code>가 실행되지 않습니다. <a href="#lifecycle">Lifecycle</a>를 참조하세요.</p>

      <h3>Nuclo에는 라우터가 포함되어 있습니까?</h3>
      <p>코어 패키지에는 없습니다. 라우팅은 서버 렌더링, 하이드레이션, 코드 분할 경로 및 유휴 사전 로드 기능을 갖춘 <code>nuclo-router</code>로 별도로 배송됩니다. <code>npm install nuclo nuclo-router</code>로 설치하세요. <a href="#router-overview">nuclo-router</a>를 참조하세요.</p>

      <h3>Nuclo에 효과가 있나요?</h3>
      <p>번호 <code>onMount</code> 및 <code>onDestroy</code>는 요소당 한 번 실행되며 삽입 및 제거와 연결됩니다. 일부 상태가 변경되었기 때문에 아무 것도 다시 실행되지 않습니다.</p>
    `,
      },
    ],
  },

];
