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
      <p>타입이 지정된 스타일 객체를 CSS 클래스로 바꿔 주는 함수입니다. 돌려받은 결과는 어떤 태그 빌더에든 그대로 넘기면 됩니다. 브라우저에서는 규칙이 전부 <code>&lt;style id="nuclo-styles"&gt;</code> 요소 하나에 모이고, 서버에서는 <a href="#api-css-text"><code>getCssText()</code></a>로 꺼내 쓸 수 있습니다.</p>
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
        <li><code>css()</code>는 기본 선언 전체에 클래스 하나를 만들고, 가상 선택자 키·선택자·미디어 블록마다 클래스를 하나씩 더 만듭니다. 위 카드는 클래스를 두 개 받습니다.</li>
        <li>클래스 이름은 내용을 해시한 값입니다. 같은 스타일은 클래스를 공유하고, 서버와 클라이언트가 만드는 이름도 서로 같습니다.</li>
        <li>스타일은 모듈 최상위에서 한 번만 정의하세요. <code>css()</code>는 객체 단위로 캐시하기 때문에, 호출할 때마다 새 객체를 넘기면 매번 처음부터 다시 처리합니다.</li>
        <li><code>css()</code>에 넘긴 뒤에 스타일 객체를 고쳐도 아무 일도 일어나지 않습니다.</li>
        <li>등록된 스타일은 페이지나 서버 프로세스가 살아 있는 동안 계속 남습니다. 데이터에서 가져온 너비처럼 항목마다 달라지는 값은 <a href="#attributes"><code>style</code> 속성</a>으로 처리하세요.</li>
      </ul>
      <h3>명명된 스타일</h3>
      <p>읽기 쉬운 클래스 이름이 필요하면 이름을 맨 앞 인수로 넘기면 됩니다.</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>기본 클래스는 넘긴 이름 그대로이고, 나머지 블록은 <code>name-&lt;hash&gt;</code> 형태가 됩니다.</li>
        <li>이름은 유효한 클래스 이름이어야 합니다. 그렇지 않으면 Nuclo가 경고를 띄우고 이름을 새로 만들어 줍니다.</li>
        <li>이름은 전역으로 관리됩니다. 서로 다른 스타일이 같은 이름을 쓰면 Nuclo가 경고합니다.</li>
      </ul>
      <h3>결과 활용하기</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code>와 <code>card.className</code>은 둘 다 클래스 이름을 돌려줍니다.</p>
    `,
      },
      {
        id: "style-objects",
        title: "스타일 객체",
        content: `
      <p><code>css()</code>에 넘기는 객체에는 camelCase CSS 속성, 줄임 키, 그리고 가상 상태·선택자·미디어 쿼리를 위한 중첩 키를 쓸 수 있고, TypeScript가 모두 자동 완성해 줍니다. <code>borderTopLeftRadius</code>, <code>fill</code>, <code>paddingInline</code>처럼 타입이 준비되지 않은 속성은 <code>raw</code>에 넣으세요(아래에서 설명합니다).</p>
      <h3>값</h3>
      <ul>
        <li>숫자에는 <code>px</code>가 붙습니다. 다만 <code>0</code>과 단위가 없는 속성인 <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code>, <code>gridRow</code>는 그대로 둡니다. <code>raw</code> 안에서는 <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code>, <code>animation-iteration-count</code>도 단위 없이 쓰입니다.</li>
        <li>문자열은 쓴 그대로 사용하고, <code>null</code>, <code>undefined</code>, <code>false</code>는 건너뜁니다.</li>
        <li><code>lineHeight</code>(와 <code>leading</code>)는 단위가 없는 값이라 <code>leading: 24</code>는 글꼴 크기의 24배라는 뜻입니다. 픽셀로 지정하려면 <code>"24px"</code>라고 쓰세요.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>줄임 키</h3>
      <table>
        <thead><tr><th>키</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding과 각 방향</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>좌우 padding / 상하 padding</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>margin도 같은 방식</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>너비, 높이와 각각의 최솟값·최댓값</td></tr>
          <tr><td><code>size</code></td><td>너비와 높이</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>아래 키에는 <code>true</code>를 넘깁니다.</p>
      <table>
        <thead><tr><th>키</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (display는 건드리지 않음)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>가상 상태</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code>(<code>:first-child</code>), <code>last</code>(<code>:last-child</code>), <code>only</code>(<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code>, <code>firstLetter</code>를 쓸 수 있습니다. 중첩도 됩니다. <code>hover: { focus: {…} }</code>는 <code>:hover:focus</code>가 됩니다.</p>
      <h3>선택자와 at-rule</h3>
      <p><code>&amp;</code>로 시작하는 키는 선택자이고, 그 안의 <code>&amp;</code>는 각각 해당 클래스로 바뀝니다. <code>@</code>로 시작하는 키는 at-rule로, <code>@media</code>, <code>@container</code>, <code>@supports</code>를 쓸 수 있습니다.</p>
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
        <li>키는 반드시 <code>&amp;</code>로 시작해야 합니다. <code>".dark &amp;"</code> 같은 키는 무시되니 <code>"&amp;:is(.dark *)"</code>로 쓰세요.</li>
        <li>중첩된 <code>@media</code> 블록 두 개는 <code>and</code>로 합쳐집니다. 미디어 타입(<code>print</code>, <code>only screen</code>)으로 시작하는 쿼리는 맨 앞에 놓입니다. 문법상 타입은 처음에만 올 수 있기 때문입니다. 하나로 합칠 수 없는 조합(미디어 타입이 둘이거나 맨 앞에 <code>not</code>이 있는 경우)은 경고를 띄우고 안쪽 쿼리만 사용합니다. 그 밖의 중첩 at-rule은 바깥 규칙을 대체합니다.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>어떤 CSS 속성이든 <code>raw</code>에 CSS에서 쓰는 이름 그대로 적을 수 있습니다. 여기서도 숫자에는 <code>px</code>가 붙으니, 단위를 직접 정하려면 문자열로 넘기세요.</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>그 밖의 일반 키는 kebab-case로 바뀌어 그대로 출력됩니다. 그래서 <code>colr: 'red'</code> 같은 오타는 브라우저가 버리는 선언이 되어 버립니다. 가상 상태, screen, <code>&amp;</code>·<code>@</code> 키가 아닌 키 아래의 중첩 객체는 무시됩니다. 두 경우 모두 TypeScript가 오류로 알려 줍니다.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>여러 스타일을 하나로 합칩니다. 두 입력이 같은 속성을 지정하면 나중에 온 쪽이 이깁니다.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>falsy 값은 건너뛰고, 배열은 펼치고, 문자열은 나눈 뒤 중복을 제거합니다.</li>
        <li>같은 블록(기본, 같은 가상 상태, 같은 미디어 쿼리)에 해당하는 생성 클래스끼리는 새 클래스 하나로 합쳐집니다. 그 외의 클래스 이름은 그대로 통과합니다.</li>
        <li>인수의 순서를 아는 것은 <code>cx()</code>뿐입니다. <code>div(base, blue)</code>처럼 쓰면 두 클래스가 모두 붙고, 가장 나중에 만들어진 규칙이 적용됩니다. 서로 덮어쓰는 스타일은 하나의 <code>cx()</code> 호출에 함께 넣으세요.</li>
        <li>이름 있는 스타일의 블록이 다른 입력의 블록과 합쳐지면, 결과 클래스는 이름만 있는 형태가 아니라 <code>name-&lt;hash&gt;</code>가 됩니다. 합쳐지지 않는 블록은 클래스를 그대로 유지하므로 <code>cx(pageTitle, 'extra')</code>에도 <code>page-title</code>이 남습니다.</li>
      </ul>
      <h3>동적 클래스</h3>
      <p>항상 <code>cx(...)</code>를 돌려주는 함수를 넘기세요.</p>
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
      <p>함수는 처음 실행될 때 반드시 스타일 결과를 반환해야 합니다. <code>() =&gt; active &amp;&amp; activeButton</code>처럼 쓰면 클래스 대신 "false"라는 텍스트가 렌더링됩니다.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>테마에 묶인 전용 <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code>, <code>globalStyle</code>을 돌려줍니다. 테마는 값에 이름을 붙여 두는 장치입니다. 아래 테마라면 <code>borderColor: 'border'</code>가 <code>#e5e7eb</code>로 출력되고, TypeScript가 이름을 자동 완성해 줍니다. <code>screens</code>의 각 항목은 <code>md: {…}</code>처럼 미디어 쿼리를 나타내는 스타일 키가 됩니다.</p>
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
        <thead><tr><th>테마 키</th><th>적용되는 속성</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code>와 각 방향, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td><code>md: {…}</code> 같은 새 스타일 키</td></tr>
        </tbody>
      </table>
      <ul>
        <li>테마 이름은 값 전체가 이름과 일치할 때만 치환됩니다. <code>border: "1px solid primary"</code>에서 primary는 치환되지 않습니다.</li>
        <li><code>@</code>가 없는 screen 값은 <code>@media &lt;value&gt;</code>가 됩니다. <code>@</code>로 시작하는 값은 쓴 그대로 사용됩니다. 예를 들면 <code>"@container (min-width: 400px)"</code>입니다.</li>
        <li>screen은 <code>createCss()</code>로 만든 인스턴스에만 있습니다. 전역 <code>css()</code>에는 screen이 없지만 <code>@media</code> 키는 받아 줍니다.</li>
        <li>모든 인스턴스와 전역 헬퍼는 스타일시트 하나를 함께 씁니다. screen의 미디어 규칙은 사용한 순서가 아니라 선언한 순서대로 출력되므로 <code>min-width</code> screen은 작은 것부터 큰 것 순으로 나열하세요. 앱 하나에는 <code>createCss()</code> 인스턴스를 하나만 두면 테마에 적은 순서가 곧 출력 순서가 됩니다.</li>
        <li>반환값의 <code>theme</code>은 넘겨 준 테마 객체 그대로입니다.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>버튼의 intent나 size처럼 옵션 조합에 따라 스타일을 돌려주는 함수를 만들어 줍니다.</p>
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
        <li>스타일은 <code>base</code>, 그룹별로 고른 값, 일치하는 compound 순서로 합쳐지고, 속성마다 나중 스타일이 이깁니다.</li>
        <li>옵션을 생략하거나 <code>undefined</code>, <code>null</code>로 넘기면 기본값이 쓰입니다. 기본값이 없는 그룹은 건너뜁니다.</li>
        <li><code>true</code>와 <code>false</code> 키만 가진 그룹은 boolean 값을 받습니다.</li>
        <li>compound는 나열된 그룹이 모두 일치할 때 적용되며, 기본값도 일치 여부에 포함됩니다.</li>
        <li>조합마다 스타일은 한 번만 만들어 캐시해 둡니다.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() 및 globalStyle()",
        content: `
      <p><code>keyframes()</code>는 애니메이션을 등록하고 생성된 이름을 돌려줍니다. 프레임 키로는 <code>from</code>, <code>to</code>, 그리고 <code>"50%"</code>나 <code>"0%, 100%"</code> 같은 백분율을 쓸 수 있습니다. 프레임 안에는 평면 속성만 넣을 수 있고, 같은 프레임은 같은 이름을 돌려줍니다.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code>은 원하는 선택자에 규칙을 추가합니다.</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>선택자는 쓴 그대로 사용됩니다.</li>
        <li>평면 속성만 동작합니다. 가상 상태 키, screen, <code>@</code> 키는 무시되므로 <code>globalStyle()</code>로는 미디어 규칙을 쓸 수 없습니다.</li>
        <li>같은 규칙은 한 번만 추가됩니다. 같은 선택자에 다른 스타일을 지정하면 규칙이 하나 더 생기고, 나중 규칙이 이깁니다.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() 및 resetStyles()",
        content: `
      <p><code>getCssText()</code>는 이 프로세스에서 <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code>, <code>globalStyle()</code>이 만든 규칙을 전부 돌려줍니다. 기본 규칙이 먼저 나오고 <code>@media</code>, <code>@container</code>, <code>@supports</code> 블록이 뒤따릅니다. 서버 렌더링에서 쓰는 함수입니다.</p>
      <ul>
        <li><code>renderToString()</code> 다음에 호출하세요. 렌더링 도중 만들어진 규칙까지 포함됩니다.</li>
        <li>페이지나 요청 하나가 아니라 프로세스 전체의 규칙을 담고, 계속 쌓이기만 합니다. 클래스 이름이 내용 해시라서 그래도 안전합니다.</li>
        <li><code>&lt;style id="nuclo-styles"&gt;</code>에 넣으세요. 클라이언트는 그 요소를 재사용하고 이미 들어 있는 규칙은 건너뜁니다. id가 다르거나 없으면 클라이언트가 모든 규칙을 담은 스타일시트를 하나 더 만들어 버립니다.</li>
        <li>텍스트를 이스케이프하지 않으므로 신뢰할 수 없는 입력을 스타일 값에 넣지 마세요.</li>
      </ul>
      <p><code>resetStyles()</code>는 테스트용 헬퍼입니다. 모든 규칙과 <code>#nuclo-styles</code> 요소를 지웁니다. 앞서 만든 스타일은 클래스 이름은 남지만 CSS는 사라집니다. 앱이나 서버에서는 호출하지 마세요.</p>
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
      <div class="docs-callout"><strong>별도 패키지:</strong> <code>nuclo-router</code>는 Nuclo 코어 패키지에 들어 있지 않습니다. <code>nuclo</code>와 함께 설치해 쓰세요. 아직 프리뷰 릴리스라서 API가 바뀔 수 있습니다.</div>
      <p>Nuclo를 위한 라우팅 패키지입니다. 서버 렌더링, 하이드레이션, 코드 분할 라우트, 유휴 시간 프리로드를 <code>list()</code>와 <code>update()</code> 위에서 지원합니다. gzip 기준 약 ${NUCLO_ROUTER_GZIP_KB} KB이고, Nuclo 외에는 의존성이 없으며 side effect도 없어서 쓰지 않으면 tree-shaking으로 사라집니다.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p><code>pnpm add</code>, <code>yarn add</code>, <code>bun add</code>에 같은 두 패키지 이름을 넘겨도 됩니다. peer dependency로 <code>nuclo</code> 0.3 이상이 필요합니다.</p>
      <p>라우터는 <em>무엇을</em> 불러올지 정하고, 앱은 <code>router.outlet()</code>으로 <em>어디에</em> 보여 줄지 정합니다. 레이어 스택은 <code>list()</code> 하나로 렌더링되고 레이어마다 행이 하나씩 생기니, 평범한 페이지는 행이 하나뿐입니다. 서버와 클라이언트가 같은 트리를 만들기 때문에 <code>hydrate()</code>는 서버 노드를 바꿔치기하지 않고 그대로 이어 받습니다. 이 밖에 쓰는 것은 <code>history</code>, 이벤트 위임용 <code>click</code> 리스너 하나, <code>requestIdleCallback</code>이 전부입니다.</p>
      <h3>한 번 정의해서 어디서든 import하기</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code>는 일치하는 라우트의 모듈을 모두 불러온 뒤에야 끝납니다. 덕분에 서버든 클라이언트든 첫 트리가 완성된 상태로 만들어집니다. 이후에는 라우터가 <code>start()</code>로 만든 Route의 값을 그대로 읽어 주므로, 앱에서는 <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>를 쓰면 됩니다.</p>
      <h3>앱 전체 예시</h3>
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
      <p>연동은 이게 전부입니다. <code>&lt;a href&gt;</code>는 그냥 <code>&lt;a href&gt;</code>일 뿐이라 링크가 알아서 동작합니다. <code>document</code>에 단 위임 리스너 하나가 라우터가 맡은 링크만 가로채고, 나머지 링크는 브라우저가 처리하게 둡니다.</p>
      <p>서버에서 <code>start()</code>는 요청마다 <code>Route</code>를 돌려주고 라우터 자체는 건드리지 않습니다. 그래서 동시에 들어온 요청끼리 서로의 라우트를 볼 일이 없습니다. <code>route.run()</code>은 렌더링하는 동안만 그 Route를 라우터의 활성 라우트로 만들고, 아웃렛도 이 Route를 읽습니다. 브라우저에서는 페이지를 로드할 때마다 Route가 하나 생기고 <code>start()</code>가 그것을 라우터의 활성 Route로 지정하므로 <code>run()</code>이 필요 없습니다.</p>
      <p>페이지는 <a href="#router-api"><code>RouteContext</code></a>와 <a href="#router-api"><code>PageProps</code></a>를 <code>(ctx, { layer, data, outlet, beforeLeave })</code> 형태로 받으며, 필요 없는 인수는 생략해도 됩니다. 반환값은 <code>list()</code>가 받는 것이면 무엇이든 괜찮습니다. 레이아웃의 다른 자리까지 채우고 싶다면 페이지 안에서 <code>div(article(…), into('sidebar', nav(…)))</code>처럼 <code>into()</code>를 함께 반환하세요. 그 내용은 페이지가 사라질 때 같이 사라집니다. 자세한 내용은 <a href="#router-regions">페이지와 영역</a>을 참고하세요.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "패턴과 중첩 라우트",
        content: `
      <table>
        <thead><tr><th>패턴</th><th>일치 대상</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>정확히 그 경로만</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>일치하는 패턴이 없는 모든 경로(404 처리용)</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>우선순위는 정적 패턴, 선언 순서대로의 동적 패턴, 접두사가 긴 catch-all 순입니다. 그래서 <code>'*'</code>는 다른 어떤 패턴도 맞지 않을 때만 쓰이고, 테이블 어디에 두어도 상관없습니다. 끝 슬래시, 중복 슬래시, 퍼센트 인코딩은 정규화하며 param 값은 디코딩해서 전달합니다. 매칭은 패턴마다 세그먼트를 비교하는 방식이라 정규식은 만들지도 실행하지도 않습니다.</p>
      <h3>상대 라우트</h3>
      <p><code>./</code>로 쓴 패턴은 그 패턴을 선언한 부모를 기준으로 하고, <code>./</code>로 쓴 href는 활성 라우트를 기준으로 합니다. 둘을 함께 쓰면 어떤 부모 아래에 놓아도 같은 뜻을 가진 재사용 가능한 섹션을 만들 수 있습니다. 테이블의 값은 로더이거나, 키가 그 위치를 기준으로 하는 또 다른 테이블입니다.</p>
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
      <p>이 두 줄로 경로를 한 번도 중복해서 쓰지 않고 패턴 여섯 개가 모두 만들어집니다. 두 부모가 같은 로더 객체를 받으므로 모듈 캐시도, <code>import()</code>도 하나를 함께 씁니다.</p>
      <ul>
        <li>하위 테이블 안에서는 <code>'./x'</code>, <code>'/x'</code>, <code>'x'</code>가 모두 같은 뜻이고, <code>'/'</code>는 부모 경로 자체를 가리키며, <code>'*rest'</code>를 쓰면 그 섹션만의 catch-all이 생깁니다. 중첩은 원하는 만큼 깊게 할 수 있습니다.</li>
        <li>최상위 키는 쓴 그대로 쓰이므로 <code>'*'</code>는 <code>'*'</code> 그대로입니다.</li>
        <li><code>*catch-all</code> 부모 아래에 자식을 두면 <code>createRouter()</code>가 오류를 던집니다. catch-all은 패턴의 맨 끝에 와야 하기 때문입니다.</li>
      </ul>
      <h3>부모 페이지와 <code>outlet()</code></h3>
      <p>부모와 자식은 실제 계층 구조입니다. 부모가 먼저 렌더링되고, 자식은 부모가 <code>outlet()</code>을 호출한 바로 그 자리 안에 렌더링됩니다.</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>자식 사이를 오가도 부모는 다시 만들어지지 않습니다. DOM 노드가 그대로이므로 포커스, 스크롤 위치, 입력하다 만 텍스트, 클로저에 담긴 상태가 전부 살아남습니다.</p>
      <ul>
        <li>자식 라우트가 없는 페이지의 아웃렛은 아무것도 렌더링하지 않으므로, 레이아웃에서 조건 없이 호출해도 됩니다. 반대로 자식이 있는데 부모가 <code>outlet()</code>을 한 번도 호출하지 않으면 그 자식은 어디에도 나타나지 않습니다.</li>
        <li>index 라우트는 없습니다. <code>'/'</code>는 레이아웃 그 자체라서, 부모 경로로 가면 별도의 index 페이지 대신, 아웃렛이 빈 채로 레이아웃만 렌더링됩니다. 첫 화면에 보여 줄 내용은 레이아웃에 넣거나 실제 자식 경로를 만들어 주세요.</li>
      </ul>
      <p>그러면 같은 호출이 어느 부모 아래에서든 똑같이 동작하고, 자신이 어느 부모 안에 있는지 모르는 페이지에서도 쓸 수 있습니다.</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code>, <code>..</code>는 URL의 "디렉터리"가 아니라 현재 라우트의 경로를 기준으로 풀립니다. <code>/invoices/42</code>에서 <code>./preview</code>는 <code>/invoices/42/preview</code>가 됩니다. 브라우저라면 <code>/invoices/preview</code>라고 해석했을 테지만, 여기서는 URL 끝의 슬래시도 결과에 영향을 주지 않습니다. <code>../</code>는 세그먼트 하나씩 위로 올라가다 루트에서 멈춥니다. 쿼리와 해시는 그대로 이어지고 <code>base</code>는 다시 붙으며, 완성된 절대 경로가 히스토리에 기록됩니다. URL 해석 표준과 다르게 처리하는 이 방식은 React Router가 <code>&lt;Link to="./x"&gt;</code>에서 택한 방식과 같습니다.</p>
      <ul>
        <li>라우트 기준으로 해석되는 것은 <code>./</code>와 <code>../</code>뿐입니다. href에 그냥 <code>preview</code>라고 쓰면 일반적인 브라우저 규칙을 따릅니다.</li>
        <li>상대 링크는 <code>href="./preview"</code>를 손으로 쓰기보다 <code>router.href('./preview')</code>로 만드세요. <code>href()</code>는 렌더링 시점에 경로를 풀어 주기 때문에, 실제로 나가는 마크업은 절대 경로입니다. 그래서 크롤러, 마우스 가운데 버튼 클릭, JavaScript를 끈 환경에서도 올바르게 동작합니다.</li>
      </ul>
      <h3>유지되는 것과 다시 만들어지는 것</h3>
      <table>
        <thead><tr><th>노드</th><th>이동할 때</th></tr></thead>
        <tbody>
          <tr><td>패턴과 경로가 그대로인 부모</td><td><strong>유지</strong>: 같은 노드이고 <code>load()</code>도 다시 실행하지 않습니다.</td></tr>
          <tr><td>일치한 페이지</td><td>패턴과 경로가 그대로이고 <code>load()</code>가 없으면 <strong>유지</strong>되므로, 쿼리나 해시만 바뀌어도 그대로 남습니다. 로더가 있는 라우트는 방문할 때마다 새로 고칩니다.</td></tr>
          <tr><td>경로가 바뀐 부모</td><td>그 아래 모든 것과 함께 다시 만들어집니다.</td></tr>
          <tr><td>push한 레이어</td><td>일치한 페이지만 렌더링합니다. 부모는 이미 바로 아래 행에 마운트되어 있습니다.</td></tr>
        </tbody>
      </table>
      <p>유지된 페이지는 만들어질 때 받은 <code>ctx</code>를 그대로 들고 있습니다. 문서 전체에서 <code>ctx</code>는 늘 이런 뜻입니다. 최신 값은 <code>router.*</code>에서 읽으세요. 필터, 페이지네이션, 탭처럼 쿼리로 관리하는 상태는 동적 값 안에서 <code>router.search</code>를 읽고 <code>router.go('?page=2', { replace: true })</code>로 바꿉니다. 그러면 페이지도, 포커스도, 입력하던 텍스트도 그 자리에 그대로 있습니다.</p>
    `,
      },
      {
        id: "router-regions",
        title: "페이지와 영역",
        content: `
      <p><code>router.outlet()</code>은 페이지를 한곳에 놓아 줍니다. 페이지가 사이드바, 툴바, 제목처럼 레이아웃의 다른 자리도 채워야 한다면 <a href="#api-region"><code>into()</code></a>를 쓰세요. 레이아웃은 <code>region()</code>으로 자리를 표시해 두고, 페이지는 자기 콘텐츠 옆에 <code>into()</code>를 함께 반환합니다. 레이아웃이 페이지 콘텐츠를 props로 받을 일은 없고, 이동해도 레이아웃이 다시 만들어지지 않습니다.</p>
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
      <p>페이지의 콘텐츠는 아웃렛 <code>list()</code>의 한 행이고, <code>into()</code>의 수명은 그것을 담은 행과 같습니다. 그래서 사이드바 내용은 페이지와 함께 도착하고 페이지와 함께 떠납니다. <code>into('sidebar', …)</code>가 없는 페이지로 이동하면 그 영역에는 <code>empty</code> 콘텐츠가 다시 나타납니다. 두 부분이 같은 함수에서 만들어지므로 페이지는 양쪽 모두에서 자신의 <code>ctx</code>와 <code>data</code>를 쓸 수 있습니다.</p>
      <h3>이동할 때 일어나는 일</h3>
      <ul>
        <li><strong>유지된 페이지는 영역도 유지합니다.</strong> <a href="#router-patterns">페이지가 유지되는</a> 쿼리나 해시 변경은 영역 콘텐츠도 건드리지 않습니다. 사이드바가 쿼리에 따라 달라진다면 동적 값 안에서 <code>router.search</code>를 읽으세요.</li>
        <li><strong>다시 만들어진 페이지는 영역을 새로 채웁니다.</strong> 라우트가 바뀌면 이전 행이 지워지고 새 페이지의 <code>into()</code> 뷰가 그 자리를 이어받습니다. 남는 것은 없습니다.</li>
        <li><strong>push한 레이어는 뷰를 하나 더합니다.</strong> 레이어는 아웃렛의 뒤쪽 행이라서, 그 <code>into()</code>는 같은 영역에 대한 더 새로운 뷰가 됩니다. 기본값인 <code>type: 'latest'</code>에서는 레이어가 닫힐 때까지 페이지의 뷰를 가리고, 닫히면 페이지의 뷰가 다시 나타납니다. <code>type: 'stack'</code>이면 둘 다 보입니다.</li>
        <li><strong>부모 페이지도 영역을 채울 수 있습니다.</strong> 부모는 다시 만들어지지 않으므로, 자식이 바뀌는 동안에도 부모의 뷰는 그대로 남습니다.</li>
        <li><strong>서버 렌더링도 그대로 됩니다.</strong> 서버는 <code>route.run()</code> 안에서 페이지를 만들기 때문에 <code>into()</code> 뷰도 HTML에 들어가고, <code>hydrate()</code>가 그 노드를 이어받습니다.</li>
      </ul>
      <h3>한 페이지에서 여러 영역 채우기</h3>
      <p>영역을 한 번에 여러 개 채우려면 객체를 넘기세요. 페이지의 주된 콘텐츠는 여전히 아웃렛을 통해 나가므로 <code>into()</code>와 나란히 반환합니다.</p>
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
      <h3>어떤 상황에 무엇을 쓸까요</h3>
      <ul>
        <li><strong><code>outlet()</code></strong>은 자식 라우트를 위한 것입니다. URL이 정하는 콘텐츠를 부모 페이지 안에 렌더링합니다. <a href="#router-patterns">중첩 라우트</a>를 참고하세요.</li>
        <li><strong><code>into()</code></strong>는 일치한 페이지가 레이아웃 곳곳으로 퍼져 나갈 때 씁니다. 콘텐츠는 페이지에 속하고 페이지의 데이터를 사용합니다.</li>
        <li><strong><code>matches()</code></strong>는 페이지와 상관없이 레이아웃이 URL만 보고 스스로 결정할 때 씁니다. 작은 테이블을 따로 둡니다. <a href="#router-matches"><code>matches()</code></a>를 참고하세요.</li>
      </ul>
      <p>이 모든 것은 일치한 라우트 하나에 속합니다. 라우터는 URL 하나로 서로 독립된 두 영역을 움직이지 않습니다. 그래서 자체 라우트를 가진 사이드바는 두 번째 아웃렛이 아니라 페이지가 채우는 영역이라고 보면 됩니다. 정말로 자체 라우터와 로딩, 폴백이 필요한 사이드바라면 라우터를 시작하지 않은 채로 두고 <code>match()</code>로 해석하세요. <a href="#router-multi">다중 라우터와 결합 로딩</a>을 참고하세요.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "라우트 로더와 코드 분할",
        content: `
      <p>페이지 모듈은 <code>load</code> 함수를 export할 수 있습니다. 이 함수는 해당 라우트로 이동할 때마다 페이지를 만들기 전에 실행되고, 반환한 값은 <code>data</code>로 페이지에 전달됩니다.</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>라우트 테이블은 그대로입니다. 로더는 페이지와 함께 다닙니다. 일치한 <code>RouteContext</code>를 받으므로 <code>params</code>, <code>search</code>, <code>path</code>를 모두 쓸 수 있고, 동기든 비동기든 상관없습니다. 서버에서도 실행되기 때문에 서버 렌더링한 페이지는 하이드레이션 뒤에 데이터를 다시 가져오지 않고 처음부터 HTML에 데이터를 담아 내보냅니다.</p>
      <p><strong>모듈은 캐시하지만 데이터는 캐시하지 않습니다.</strong> 라우트의 청크는 한 번만 가져와 재사용하고, 로더는 이동할 때마다 다시 실행됩니다. 그래서 <code>/blog/a</code>와 <code>/blog/b</code>가 뒤섞일 일이 없고, 실패한 로더도 그냥 다시 시도하면 됩니다.</p>
      <table>
        <thead><tr><th>상황</th><th>동작</th></tr></thead>
        <tbody>
          <tr><td>실행되는 동안</td><td><code>router.pending</code>이 true가 되고, 보고 있던 페이지는 그대로 화면에 남습니다.</td></tr>
          <tr><td>예외를 던지거나 reject될 때</td><td><code>router.error</code>에 담깁니다. <code>go()</code>는 여전히 reject되지 않으며, 이동을 다시 시도할 수 있습니다.</td></tr>
          <tr><td><code>start()</code> 도중</td><td>reject가 <code>start()</code> 밖으로 전파됩니다. 오류를 담을 Route가 아직 없기 때문입니다.</td></tr>
          <tr><td>push한 레이어</td><td>자체 로더를 실행하고, 데이터도 따로 가집니다.</td></tr>
          <tr><td>유휴 시간 프리로더</td><td>모듈만 미리 불러옵니다. 넘겨 줄 컨텍스트가 없고, 사용자가 열지도 않을 라우트의 데이터를 가져오게 될 수 있기 때문입니다.</td></tr>
          <tr><td>같은 URL로 다시 이동</td><td>로더를 다시 실행하고 행도 새로 만듭니다. 로더가 없는 라우트는 행을 그대로 유지합니다.</td></tr>
        </tbody>
      </table>
      <p>데이터를 다시 검증하고 싶다면 히스토리 항목을 추가하지 않고 지금 있는 위치로 다시 이동하세요.</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>청크와 데이터를 한꺼번에 시작하기</h3>
      <p>페이지 모듈이 export한 <code>load</code>는 그 모듈이 도착한 뒤에야 실행할 수 있어서, 처음 이동할 때는 청크를 먼저 받고 그다음에 데이터를 받습니다. 둘을 동시에 시작하려면 테이블에서 <code>withLoad()</code>로 로더를 선언하세요.</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>이 로더는 모듈 자체의 <code>load</code>를 대체하며, 마찬가지로 방문할 때마다 실행됩니다. 청크를 불러오는 중에 reject되면 다른 경우와 똑같이 <code>router.error</code>에 담깁니다.</p>
      <p>서버 데이터를 HTML에 직렬화해 넣어 주지는 않으며, 이는 의도된 설계입니다. 클라이언트의 <code>load</code>는 하이드레이션 때 다시 실행됩니다. 이 점이 신경 쓰인다면 서버가 <code>route.data</code>를 <code>window.__DATA__</code> 같은 곳에 내보내고, 로더가 그것부터 읽게 하세요. <code>route.data</code>에는 일치한 페이지의 데이터만 들어 있고, 부모 <code>load()</code>의 결과는 없습니다.</p>
      <h3>코드 분할과 프리로드</h3>
      <p>라우트의 값은 언제나 페이지 컴포넌트를 돌려주는 함수라서, 컴포넌트는 필요한 시점에 지연 로딩됩니다.</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p><code>load</code> export를 담을 수 있는 것은 모듈 형태로 돌려주는 방식뿐입니다. <code>.then(m =&gt; m.BPage)</code>로 이름 있는 컴포넌트만 골라 반환하면 라우터에는 함수만 전달됩니다.</p>
      <p>각 모듈은 한 번만 import하고 캐시합니다. 같은 라우트로 동시에 이동해도 <code>import()</code>는 하나를 함께 씁니다. 사용자가 <code>idleTimeout</code> 동안(기본값은 1초이며 터치, 키 입력, 휠, 스크롤이 없을 때) 페이지를 가만히 두면, 나머지 라우트를 유휴 시간 조각(<code>requestIdleCallback</code>)마다 하나씩 백그라운드에서 불러옵니다. 입력이 있거나 사용자가 기다리는 이동이 생기면 페이지가 다시 한가해질 때까지 프리로드를 멈춥니다.</p>
      <p>프리로드되었거나 eager로 지정한 라우트는 <code>router.pending</code>을 켜지 않고 다음 페인트 전에 도착합니다. 스피너가 번쩍이는 프레임도, 레이아웃이 밀리는 일도 없습니다. <code>router.pending</code>이 true가 되는 것은 기다려야 하는 모듈이나 로더가 있을 때뿐이고, 그동안 떠나는 페이지는 화면에 그대로 남습니다. 청크 로드에 실패해도 처리되지 않은 rejection 대신 <code>router.error</code>로 드러나며, 그냥 다시 시도하면 됩니다.</p>
    `,
      },
      {
        id: "router-api",
        title: "라우터 API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code>은 패턴을 로더 또는 중첩 테이블에 연결합니다. 옵션은 다음과 같습니다.</p>
      <table>
        <thead><tr><th>옵션</th><th>기본값</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>앱을 서비스하는 URL 접두사로, 예를 들어 <code>'/docs'</code>입니다. 세그먼트 경계에서만 일치합니다. <code>/docs/intro</code>는 <code>'/docs'</code> 안이지만 <code>/docsearch</code>는 아닙니다. 범위 밖 URL은 아무것도 일치시키지 않으므로 <code>start()</code>가 reject되고(서버 쪽 404), 그런 URL로 가는 링크는 브라우저가 처리하게 둡니다.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>페이지가 한가해지면 나머지 라우트의 모듈을 백그라운드에서 불러옵니다. <code>false</code>로 끌 수 있습니다.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>터치, 키 입력, 휠, 스크롤이 없는 상태가 이 시간(밀리초)만큼 이어지면 프리로드를 시작하거나, 사용자가 바빴다가 다시 한가해졌을 때 이어서 시작합니다.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>. 브라우저에서 처음 이동을 포함해 이동이 해석될 때마다, DOM이 따라잡은 뒤에 호출됩니다. <code>kind</code>는 <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code>(뒤로 가기, 앞으로 가기, <code>close()</code>), <code>'layer'</code> 중 하나입니다. <code>document.title</code>, meta 태그, 포커스, 스크롤, 분석 코드를 넣기에 알맞은 훅이며 SSR 중에는 호출되지 않습니다.</td></tr>
        </tbody>
      </table>
      <p>라우터를 반환하며, 라우터는 <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>와 <code>run()</code>을 뺀 모든 <code>Route</code> 멤버를 제공합니다. 이 멤버들은 활성 Route에서 읽어 옵니다. 브라우저에서는 마지막 <code>start()</code>가 반환한 Route가, 서버에서는 지금 <code>run()</code>이 실행 중인 Route가 활성 Route입니다. 둘 다 없는 상태에서 멤버를 읽으면 오류가 납니다. 라우트 테이블, 컴파일된 매처, 모듈 캐시는 라우터가 가지고 있으므로 서버에서는 요청끼리 공유됩니다.</p>
      <h3><code>router.start(url?)</code></h3>
      <p><code>url</code>(브라우저에서는 기본값이 <code>location.href</code>)을 페이지 모듈로 해석하고 <code>Promise&lt;Route&gt;</code>를 반환합니다. 일치하는 패턴이 없고 테이블에 <code>'*'</code> 라우트도 없으면 reject됩니다. 서버라면 그것이 404입니다. 브라우저에서는 이 Route를 라우터의 활성 Route로 만들고, <code>popstate</code>와 위임된 <code>click</code> 리스너를 연결하며, 프리로드를 예약하기까지 합니다. <code>start()</code>를 다시 호출하면 이전 Route는 알아서 정리됩니다. 서버에서는 공유되는 것을 전혀 건드리지 않으므로 <code>route.run()</code> 안에서 렌더링하세요.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>아무것도 불러오지 않고 URL을 테이블과 대조만 합니다. import도, 히스토리 변경도, 리스너 연결도, Route 생성도 없습니다. 결과로 <code>RouteContext</code>를 돌려주고, URL이 <code>base</code> 밖에 있거나 어떤 패턴과도 맞지 않거나 브라우저에서 다른 출처이면 <code>null</code>을 돌려줍니다. <code>./</code>를 해석하려면 활성 라우트가 필요하므로 절대 URL만 받습니다.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>활성 라우트의 페이지를 <code>list()</code>로 돌려줍니다. 페이지가 놓일 자리에 딱 한 번 배치하세요. push한 레이어는 이 목록의 뒤쪽 행이 됩니다. <code>start()</code>가 끝나기 전과 <code>stop()</code> 이후에는 비어 있고, 서버에서는 지금 <code>run()</code>이 실행 중인 Route를 렌더링합니다.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>활성 라우트의 경로가 일치하는 두 번째 테이블의 뷰를 <code>list()</code>로 렌더링합니다. 어디에든 배치할 수 있습니다. <a href="#router-matches"><code>matches()</code></a>를 참고하세요.</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code>을 뺀 모든 멤버는 라우터에도 있으며, 앱은 보통 라우터에서 읽습니다.</p>
      <table>
        <thead><tr><th>멤버</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>현재 일치한 라우트 정보입니다. <code>search</code>는 <code>URLSearchParams</code>이고, <code>search</code>, <code>hash</code>, <code>url</code>은 항상 최신 값을 반영합니다.</td></tr>
          <tr><td><code>pending</code></td><td>모듈이나 로더를 기다리는 이동이 있는지 나타냅니다.</td></tr>
          <tr><td><code>error</code></td><td>마지막으로 실패한 로드이며, 다음 이동이 시작되면 지워집니다.</td></tr>
          <tr><td><code>data</code></td><td>일치한 페이지의 <code>load()</code>가 반환한 값으로, 서버가 직렬화할 때 씁니다. 부모의 결과는 들어 있지 않습니다.</td></tr>
          <tr><td><code>depth</code></td><td>스택에 쌓인 레이어 수입니다(일반 페이지는 1).</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>필요하면 모듈을 불러와 이동합니다. 절대 reject되지 않으며, 모듈이 reject되거나 예외를 던져 실패하면 <code>error</code>에 담깁니다.</td></tr>
          <tr><td><code>push(href)</code></td><td>라우트를 새 레이어로 맨 위에 열고, 그 레이어를 닫을 때 넘긴 값으로 이행됩니다. <code>./</code>를 쓸 수 있습니다. 일치하는 라우트가 없거나 모듈 로드에 실패하면 reject됩니다.</td></tr>
          <tr><td><code>href(path)</code></td><td><code>a({ href })</code>에 쓰도록 경로 앞에 <code>base</code>를 붙입니다. <code>./</code>와 <code>../</code>는 활성 라우트를 기준으로 해석합니다.</td></tr>
          <tr><td><code>stop()</code></td><td>모든 리스너를 떼어 내고, 열린 레이어를 닫고, 아웃렛을 비웁니다. 여러 번 호출해도 안전합니다. 멈춘 Route도 마지막 일치 결과는 계속 알려 주며, <code>go()</code>는 아무 일도 하지 않습니다.</td></tr>
          <tr><td><code>run(fn)</code></td><td>이 Route를 라우터의 활성 Route로 둔 채 <code>fn</code>을 호출하고 그 결과를 반환합니다. 서버에서는 <code>route.run(() =&gt; renderToString(App))</code>처럼 씁니다. 동기 호출만 가능하며, <code>fn</code>이 반환되면 이 Route는 더 이상 활성 상태가 아닙니다.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>페이지의 첫 번째 인수로, <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>이 들어 있습니다. 페이지가 만들어질 때의 컨텍스트이며, 최신 값은 <code>router.*</code>에서 읽으세요. 둘이 달라지는 경우는 페이지를 다시 만들지 않고 쿼리나 해시만 바뀐 때뿐입니다.</p>
      <p><code>params</code>는 기본적으로 <code>{ [name]: string }</code> 형태입니다. 페이지가 자기 패턴에서 타입을 얻고 싶다면 <code>Params</code>를 쓰세요. <code>'/blog/:slug'</code>는 <code>{ slug: string }</code>으로, <code>'/files/*rest'</code>는 <code>{ rest: string }</code>으로 바뀝니다.</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>페이지의 두 번째 인수입니다. 필요한 것만 구조 분해해서 쓰세요.</p>
      <table>
        <thead><tr><th>속성</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>페이지가 스택에서 차지한 위치입니다. 아래 <code>Layer</code>를 참고하세요.</td></tr>
          <tr><td><code>data</code></td><td>라우트의 <code>load()</code>가 반환한 값이며, 로더가 없으면 <code>undefined</code>입니다. 타입은 <code>PageProps&lt;TData&gt;</code>로 지정합니다.</td></tr>
          <tr><td><code>outlet</code></td><td>부모 페이지가 자식 라우트를 렌더링할 자리입니다. <a href="#router-patterns">중첩 라우트</a>를 참고하세요.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>이 페이지가 버려지기 전에 확인할 가드를 등록합니다. <a href="#router-layers">이탈 가드</a>를 참고하세요.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>페이지가 스택의 어디에 있는지, 그리고 빠져나가는 방법을 알려 줍니다.</p>
      <table>
        <thead><tr><th>멤버</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>기본 페이지는 0, push한 레이어는 1 이상입니다.</td></tr>
          <tr><td><code>push(href)</code></td><td>페이지 안에서 다른 레이어를 엽니다. <code>Route.push()</code>와 같습니다.</td></tr>
          <tr><td><code>close(result?)</code></td><td>이 레이어와 그 위의 모든 레이어를 닫고, 이 레이어를 연 <code>push()</code>를 이행합니다. 인수가 없으면 dismissed로 처리됩니다. depth가 0이면 아무 일도 하지 않습니다.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code>와 <code>withLoad()</code></h3>
      <p><code>DataLoader</code>는 페이지 모듈이 선택적으로 export하는 <code>load</code>의 타입으로, <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>입니다. <code>withLoad(loader, load)</code>는 청크를 import한 뒤가 아니라 import와 나란히 <code>load</code>가 시작되는 라우트를 만듭니다. <a href="#router-loaders">라우트 로더</a>를 참고하세요.</p>
      <h3>타입</h3>
      <p>모든 타입은 <code>nuclo-router</code>의 named export라서, 경로를 따로 import하지 않고도 페이지, 로더, 가드에 타입을 붙일 수 있습니다.</p>
      <table>
        <thead><tr><th>타입</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>패턴에 맞는 params 객체입니다. <code>RouteParams</code>는 패턴을 반영하지 않은 기본 형태이고, <code>Match</code>는 매처의 결과입니다.</td></tr>
          <tr><td><code>PageComponent</code></td><td>페이지: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>페이지 모듈입니다. 컴포넌트 자체이거나, <code>import()</code>가 돌려주는 <code>{ default, load? }</code> 형태입니다.</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>입니다. <code>withLoad()</code>가 붙여 준 <code>load</code>를 가질 수도 있습니다.</td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code>가 받는 테이블로, 패턴을 로더 또는 중첩 테이블에 연결합니다.</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>. <code>go()</code>의 두 번째 인수입니다.</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>. <code>onNavigate</code>의 두 번째 인수입니다.</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code>가 제공하는 <code>outlet()</code>의 타입입니다.</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>. <code>beforeLeave()</code>가 받는 함수입니다.</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code>의 뷰입니다. params를 받아 콘텐츠나 페이지의 <code>import()</code>를 돌려줍니다.</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "레이어와 이탈 가드",
        content: `
      <p><code>push()</code>는 현재 페이지를 갈아끼우는 대신 그 위에 라우트를 하나 더 열고, 그 레이어가 닫힐 때 넘겨받은 값으로 이행됩니다. 페이지는 스택 위의 <code>list()</code> 하나이므로 레이어를 여는 일은 행을 덧붙이는 것과 같습니다. 아래에 있는 페이지는 다시 렌더링되지 않아서, 레이어를 닫으면 DOM도, 포커스도, 작성하던 폼도 그대로 남아 있습니다.</p>
      <p>덕분에 "아직 없는 레코드가 필요해요" 같은 흐름에서도 사용자가 채우던 폼을 버리지 않아도 됩니다.</p>
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
      <p>레이어는 중첩할 수 있습니다. 대화 상자 안에서 또 다른 대화 상자가 필요하면 Route를 직접 참조하지 않고 <code>layer.push()</code>를 호출해 결과를 기다리면 됩니다.</p>
      <ul>
        <li><strong>URL은 맨 위 레이어를 가리킵니다.</strong> <code>push()</code>는 히스토리 항목을 추가하기 때문에 레이어에 직접 링크할 수 있고, 뒤로 가기를 누르면 취소를 누른 것처럼 레이어가 닫히며 그 <code>push()</code>가 dismissed로 이행됩니다. 뒤로 가기와 <code>close()</code>는 같은 코드 경로입니다. <code>close()</code>가 결과를 기록하고 히스토리를 한 칸 되돌리며, 깊이는 <code>history.state</code>에 든 값이 기준입니다. 브라우저는 탭당 항목을 50개 정도만 유지하므로 레이어를 여러 단계 깊이 들어가면 바로 아래 항목이 사라졌을 수 있습니다. 그럴 때 <code>close()</code>는 레이어를 그 자리에서 닫고, 현재 항목을 남은 페이지에 맞게 고쳐 씁니다.</li>
        <li><strong>일반 이동은 스택을 비웁니다.</strong> 링크 클릭이나 <code>go()</code>는 레이어가 아닙니다. 모든 것을 교체하고 열려 있던 레이어를 전부 닫으므로, 기다리는 호출자가 남지 않습니다.</li>
        <li><strong>URL로 바로 들어오면 독립된 페이지가 됩니다.</strong> URL은 맨 위 레이어만 가리킬 뿐 그 아래 스택까지 알려 주지는 않습니다. 그래서 레이어의 URL로 곧장 접속하면 깊이 1짜리 스택에서 <code>layer.depth === 0</code>인 페이지로 렌더링되고, <code>close()</code>는 아무 동작도 하지 않습니다. 레이어로 push하는 라우트도 그 자체로 의미가 통해야 합니다. <code>layer.depth</code>로 분기해서 동작하지 않는 취소 버튼 대신 빠져나갈 링크를 보여 주세요.</li>
        <li><strong>새로 고침하면 promise는 살아남지 못합니다.</strong> promise가 클로저 안에 있기 때문입니다. 결과 전달은, 돌아가는 길로도 같은 일을 할 수 있는 흐름의 지름길 정도로만 생각하세요.</li>
        <li><strong>기다리는 채로 남는 호출은 없습니다.</strong> <code>stop()</code>은 열려 있는 레이어를 모두 닫고, 이동으로 버려진 레이어의 promise는 <code>undefined</code>로 이행됩니다.</li>
      </ul>
      <h3>이탈 가드</h3>
      <p>작성 중인 폼처럼 지켜야 할 것이 있는 페이지는 가드를 등록합니다. 페이지를 버리기 전에 가드에 물어보고, <code>false</code>(또는 그것으로 이행되는 promise)를 반환하면 페이지를 그대로 둡니다.</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>페이지가 사라질 때만 묻습니다.</strong> 레이아웃 아래에서 자식끼리 이동하거나, 페이지가 유지되는 쿼리·해시 변경에서는 묻지 않습니다. 가드는 페이지와 수명을 함께하므로 따로 해제할 필요가 없습니다.</li>
        <li><strong>나가는 길은 모두 해당합니다.</strong> 링크, <code>go()</code>, 뒤로·앞으로 가기, 레이어의 <code>close()</code>, 라우터가 맡지 않는 URL로의 <code>go()</code>(앱을 떠나는 경우이며 이때 <code>to</code>는 <code>null</code>)가 모두 해당합니다. 뒤로·앞으로 가기를 거절하면 히스토리를 되돌려서 주소 표시줄이 현재 페이지와 어긋나지 않게 합니다. 탭을 닫거나 새로 고침하는 경우는 <code>beforeunload</code>가 맡습니다.</li>
        <li><strong><code>to</code></strong>는 이동이 향하는 <code>RouteContext</code>입니다. 가드는 가장 안쪽부터 실행되고 처음 거절한 곳에서 멈춥니다. 예외를 던진 가드는 페이지를 유지시킵니다. <code>close(result)</code>도 가드를 거치므로, 결과를 담아 닫기 전에 플래그를 먼저 내려 두세요.</li>
        <li>라우터가 되돌릴 수 있는 것은 자신이 기록한 히스토리 항목뿐입니다. 네이티브 <code>#fragment</code> 링크나 다른 스크립트의 <code>pushState</code>처럼 라우터가 만들지 않은 항목으로 뒤로·앞으로 가는 경우에는 묻지 않습니다.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches()와 서브 라우터",
        content: `
      <p><code>router.outlet()</code>은 페이지를 렌더링합니다. <code>router.matches(table)</code>는 사이드바, 브레드크럼, 툴바처럼 지금 위치에 따라 달라지는 다른 요소를 자체 작은 테이블로 렌더링하며, 라우트를 불러오거나 페이지를 추가하지 않습니다.</p>
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
        <li><strong>라우트 테이블과 같은 방식으로 매칭합니다.</strong> 패턴, 우선순위, 원래 경로 기준 매칭, <code>base</code> 제거는 라우터의 것을 그대로 쓰기 때문에 뷰와 페이지는 항상 URL을 똑같이 해석합니다. <code>router.path</code>처럼 맨 위 레이어의 경로를 읽습니다.</li>
        <li><strong>뷰</strong>는 <code>(params, ctx) =&gt; content</code> 형태입니다. <code>params</code>는 패턴에서 타입이 추론되고, <code>ctx</code>는 그 뷰의 <code>pattern</code>과 <code>params</code>를 담은 <code>RouteContext</code>입니다. 페이지 모듈의 <code>import()</code>를 반환해도 되며, 모듈이 도착하면 <code>ctx</code>를 넘겨 호출합니다.</li>
        <li><strong>일치하는 것이 없으면 아무것도 렌더링하지 않습니다.</strong> 대체할 화면이 필요하면 <code>'*'</code> 뷰를 추가하세요. 아웃렛처럼 <code>start()</code> 전과 <code>stop()</code> 후에는 비어 있습니다.</li>
        <li><strong>라우트가 바뀔 때만 다시 렌더링합니다.</strong> 그래서 페이지가 유지되는 이동에서는 뷰의 DOM도 그대로입니다.</li>
        <li><strong>지연 로딩 뷰는 모듈이 도착할 때까지 아무것도 렌더링하지 않습니다.</strong> 실패한 <code>import()</code>는 <code>console.error</code>로 기록될 뿐 <code>router.error</code>를 설정하지 않으며, 다음 이동에서 다시 시도합니다. 일반 <code>update()</code>는 재시도하지 않습니다.</li>
        <li><strong>서버</strong>에서는 지연 로딩 뷰가 아무것도 내보내지 않습니다. 모듈이 클라이언트에서 도착하기 때문입니다. 첫 HTML에 반드시 들어가야 하는 것은 동기 뷰로 작성하세요.</li>
      </ul>
      <h3>서브 라우터</h3>
      <p>라우트는 중첩이 되므로 서브 라우터는 대개 중첩 테이블이면 충분합니다. 라우터는 하나이고, 섹션의 <code>'/'</code> 페이지가 공통 UI 역할을 하며 자식은 그 페이지의 <code>outlet()</code>에 렌더링됩니다. 그래서 섹션 안에서 이동해도 공통 UI는 그대로 살아 있습니다.</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>아니면 그 기능만의 라우터를 만들되 시작하지 않고 쓸 수도 있습니다. 부모는 catch-all 항목 하나만 가지고, 자식 라우터가 나머지 경로를 자기 패턴, params, 폴백으로 해석합니다.</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>시작하지 않는 것이 핵심입니다. 리스너를 붙이는 쪽이 <code>start()</code>라서 라우터 두 개를 시작하면 서로 충돌합니다. 대신 해석은 자식이 맡게 되므로, 시작된 라우터가 대신 실행해 주던 라우트 로더는 직접 호출해야 합니다. 이 방식은 나머지 경로가 바뀔 때 셸도 다시 만든다는 점도 다릅니다. 바깥 라우터에는 라우트 하나만 보이고 나머지는 셸이 직접 해석하기 때문입니다. 라우터가 마운트된 채로 유지해 주는 부모는 중첩 테이블로만 얻을 수 있으므로, 그 기능에 자체 라우터와 base, 폴백이 정말 필요한 경우가 아니라면 중첩 테이블을 쓰세요.</p>
    `,
      },
      {
        id: "router-multi",
        title: "여러 라우터와 결합 로딩",
        content: `
      <p>앱은 영역 수만큼 라우터를 가질 수 있습니다. 단순하게 유지하는 규칙은 하나입니다. <strong>문서당 정확히 하나만 시작하고</strong>, 나머지는 시작하지 않은 채 <code>match()</code>로 URL을 해석하게 두세요. URL, 히스토리, click 리스너는 시작된 라우터만 가집니다. 나머지는 필요할 때 물어보는 테이블일 뿐이고, 그래서 영역마다 자기만의 타이밍과 스피너로 로드할 수 있습니다.</p>
      <h3>결합 로딩: 로더 체인</h3>
      <p>일치한 체인 위의 페이지는 모두 <code>load()</code>를 export할 수 있습니다. 자식 라우트로 처음 이동하면 레이아웃의 로더와 페이지의 로더가 <strong>병렬로</strong> 실행되고, <code>router.pending</code> 하나가 체인 전체를 대표합니다. 둘이 모두 끝날 때까지 이전 페이지가 화면에 남기 때문에 반쯤 로드된 트리가 그려질 일은 없습니다. 각 컴포넌트는 자기 <code>data</code>를 받습니다.</p>
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
      <p>두 로더는 차례로 실행되지 않고 함께 시작됩니다. <code>router.pending</code>은 둘 중 하나라도 기다리는 동안 true이고 그 밖에는 false이며, 프리로드되었거나 eager인 라우트는 이 값을 바꾸지 않습니다. 섹션 사이를 이동해도 레이아웃은 유지되므로 섹션의 로더만 다시 실행되고, 레이아웃의 데이터와 DOM, 입력하던 텍스트도 모두 남습니다. 같은 URL로 다시 이동하면 페이지 하나일 때와 똑같이 말단 로더가 다시 실행되고 그 행이 새로 만들어집니다.</p>
      <h3>다중 로딩: 자체 스피너를 가진 두 번째 라우터</h3>
      <p>사이드바, 트레이, 라이브 영역 같은 독립 영역은 만들기만 하고 시작하지 않는 자체 라우터와 자체 로딩 플래그를 가집니다. <code>router.pending</code>은 시작된 라우터의 것이라 이 영역에 대해서는 아무것도 알려 주지 않습니다. 그래서 둘은 나란히 로드될 수 있고 어느 쪽이 먼저 끝나도 상관없습니다.</p>
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
      <p>두 번째 라우터는 물어볼 때만 쓰입니다. <code>match()</code>는 URL을 읽고 컨텍스트를 돌려줄 뿐이고, 사이드바에 관한 내용은 메인 라우트 테이블에 전혀 들어가지 않습니다. <code>onNavigate</code>는 처음 이동을 포함해 이동이 해석될 때마다 실행되므로, 독립 영역을 URL과 맞춰 두는 코드를 한곳에 모아 둘 수 있습니다.</p>
      <ul>
        <li><strong><code>pending</code>은 시작된 라우터의 것입니다.</strong> 시작하지 않은 라우터에는 Route도, <code>pending</code>도, <code>error</code>도 없습니다. 영역이 자기 플래그를 직접 관리하고, 두 번째 스피너를 첫 번째 옆에 나란히 둘 수 있습니다. 데모에서는 사이드바가 800ms 동안, 라우트의 로더가 900ms 동안 로드되므로 페이지가 사이드바보다 먼저 끝날 수도 있고 그 반대일 수도 있습니다.</li>
        <li><strong><code>match()</code>는 아무것도 붙이지 않습니다.</strong> 시작하지 않은 라우터는 문서에 몇 개든 함께 둘 수 있습니다. 각자 자기 테이블, base, 모듈 캐시를 가지며 히스토리는 아무도 건드리지 않습니다. 비용은 테이블과 매처뿐입니다.</li>
        <li><strong>이 라우터의 로더는 실행되지 않습니다.</strong> 시작된 라우터는 일치한 페이지의 <code>load()</code>를 실행하지만, 시작하지 않은 라우터는 해석만 합니다. 뷰에 데이터가 필요하면 직접 가져오세요(데모의 <code>refreshSidebar()</code>). 로더가 필요하다면 <a href="#router-matches">중첩 테이블</a>이나 <a href="#router-regions">페이지가 채우는 영역</a>으로 구성해 그 일을 시작된 라우터에 맡기세요.</li>
        <li><strong>오래된 응답은 걸러 내세요.</strong> 느린 사이드바 요청의 응답이 이미 떠나온 섹션에 반영되면 안 됩니다. 새로 고칠 때마다 세대 카운터를 올리고, 더 이상 일치하지 않는 응답은 버리세요. 라우터도 새 이동이 앞선 이동을 추월하면 이전 결과를 같은 방식으로 버립니다.</li>
        <li><strong>지연 로딩되는 <code>matches()</code> 뷰에도 <code>pending</code>은 없습니다.</strong> 모듈이 도착하기 전에는 아무것도 렌더링하지 않습니다. 로딩 시스템이 셋이고 타이밍도 각각 독립적입니다. 라우트의 <code>pending</code>, 직접 만든 플래그, 그리고 아직 도착하지 않은 지연 로딩 뷰입니다.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "링크 처리",
        content: `
      <p>위임 리스너는 <code>&lt;a href&gt;</code>(SVG의 <code>&lt;a&gt;</code> 포함)와 그 안에 중첩된 요소를 왼쪽 클릭했을 때 이동을 처리하고, 그 밖에는 모두 비켜 줍니다. 보조 키를 누른 클릭과 가운데 클릭, <code>_self</code>가 아닌 <code>target</code>, <code>download</code>, <code>rel="external"</code>, 출처가 다른 href, 현재 페이지의 해시 전용 링크, <code>base</code> 밖의 경로, 어떤 라우트와도 일치하지 않는 경로(서버가 렌더링한 404에 접근할 수 있도록), 앱 핸들러가 이미 <code>preventDefault()</code>를 호출한 이벤트가 여기에 해당합니다. 링크 하나를 명시적으로 제외하려면 <code>data-nuclo-router="off"</code>를 지정하세요.</p>
      <h3>스크롤</h3>
      <p>push로 이동하면 현재 스크롤 위치를 유지합니다. 새 URL의 <code>#hash</code>가 페이지의 요소와 일치하면 그 요소가 화면에 보이도록 스크롤합니다. <code>popstate</code>일 때는 스크롤을 브라우저에 맡깁니다. 새 페이지를 맨 위에서 시작하게 하려면 이동 방식을 알려 주는 <code>onNavigate</code>에서 처리하세요.</p>
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
      <h3>참고 사항</h3>
      <ul>
        <li><strong>아무것도 붙들고 있지 않습니다.</strong> Route는 페이지 함수와 컨텍스트만 가지고 있을 뿐 DOM은 보관하지 않습니다. 다른 페이지로 이동하면 이전 페이지는 해제됩니다. <code>stop()</code>은 리스너와 진행 중인 로드를 정리하고 <code>pending</code>도 지우기 때문에, 폐기된 Route가 스피너를 남겨 두는 일은 없습니다. <code>stop()</code> 이후에 도착한 모듈은 조용히 버려집니다.</li>
        <li><strong>서버에서도 동시성에 안전합니다.</strong> <code>start()</code>는 요청마다 따로 상태를 돌려주고 <code>run()</code>은 그 상태를 동기 렌더링 한 번으로 한정하므로, 요청이 뒤섞여도 서로의 라우트를 볼 수 없습니다. 공유되는 것은 모듈 캐시뿐입니다. 범위는 <code>run()</code>에 넘긴 함수가 반환될 때 끝납니다. <code>renderToString()</code>은 동기 함수라서 이것으로 충분합니다. 비동기 렌더링이나 스트리밍 렌더링이라면 <code>await</code>를 지나도 Route를 계속 들고 있어야 하는데, <code>run()</code>은 거기까지 해 주지 않습니다.</li>
        <li><strong><code>popstate</code>의 스크롤 복원</strong>은 라우터가 아니라 브라우저(<code>scrollRestoration</code>)의 몫입니다.</li>
        <li><strong>문서당 라우터는 하나만 시작하세요.</strong> <code>start()</code>를 호출할 때마다 위임 <code>click</code> 리스너가 하나씩 추가되고, 두 번째 라우터의 <code>start()</code>는 첫 번째 라우터를 정리하지 않습니다. 정리되는 것은 같은 라우터에서 <code>start()</code>를 다시 호출했을 때뿐입니다. 다른 테이블로 URL을 해석하고 싶다면 라우터를 하나 더 만들어 <code>match()</code>만 호출하세요. 아무것도 붙지 않습니다. 이렇게 하면 독립된 영역이 라우트의 <code>pending</code>과 별개로 자체 로딩을 돌릴 수 있습니다. <a href="#router-multi">다중 라우터와 결합 로딩</a>을 참고하세요.</li>
        <li><strong>의도적으로 넣지 않은 기능:</strong> 해시 히스토리와 메모리 히스토리가 없습니다. 라우트는 경로(pathname)에 담기고, 서버가 모든 라우트를 서비스해야 하기 때문입니다. URL 하나로 서로 독립된 두 영역을 라우팅하는 기능도 없습니다. 페이지가 <code>into()</code>로 여러 영역을 채울 수는 있지만 모두 일치한 라우트 하나에 속합니다. 독립 영역이 시작하지 않은 자체 라우터와 로딩을 따로 두는 방법은 <a href="#router-multi">다중 라우터와 결합 로딩</a>을 참고하세요. 호버 프리로드도 없지만, <code>mouseenter</code>에서 해당 라우트의 로더를 직접 호출하면 같은 효과를 얻을 수 있습니다.</li>
      </ul>
      <h3>예제</h3>
      <p>저장소에는 실행해 볼 수 있는 예제가 두 개 있습니다. 서로 보완하는 관계라서 모든 설정을 둘 중 한쪽에서는 직접 확인할 수 있습니다.</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: 클라이언트에서 API 전체를 훑어보는 예제입니다. 모든 패턴 형태와 우선순위 규칙, 링크 처리의 제외 옵션, 실시간으로 조작해 보는 모든 Route 멤버, 서브 라우터, 3단계로 쌓은 레이어 스택, 부모 두 곳에 마운트한 상대 섹션, <code>pending</code>과 <code>error</code>를 볼 수 있는 라우트 로더가 들어 있습니다. 이런 상태가 계속 보이도록 <code>preload: false</code>로 설정했습니다.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: 요청마다 실행하는 <code>renderToString()</code>, 서버 노드를 실제로 이어받는 것을 확인할 수 있는 하이드레이션, 진짜 404 상태 코드, 루트가 아닌 <code>base</code>, 네트워크 패널에서 지켜볼 수 있는 유휴 시간 프리로드, 그리고 서버가 클라이언트에 데이터를 넘겨 하이드레이션 때 다시 가져오지 않는 로더를 보여 줍니다.</li>
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
      <p>Nuclo에는 computed 값을 위한 API가 따로 없습니다. 평범한 함수를 만들어 동적 값 안에서 호출하면 그만입니다.</p>
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
        title: "비동기 처리와 로딩",
        content: `
      <p>평범한 <code>async</code>/<code>await</code>를 쓰고, 상태가 바뀔 때마다 <code>update()</code>를 호출하세요. 데이터를 가져오는 경우라면 <code>await</code> 전에 한 번, 후에 한 번입니다.</p>
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
        title: "모범 사례",
        content: `
      <ul>
        <li><strong>변경은 모아서 하세요.</strong> 필요한 상태를 모두 바꾼 다음 <code>update()</code>를 한 번만 호출합니다.</li>
        <li><strong>동적 값은 빠르고 순수하게 유지하세요.</strong> 동적 값은 전부 <code>update()</code>마다 실행됩니다.</li>
        <li>입력이나 타이머처럼 작고 잦은 업데이트에는 <strong><code>scope()</code></strong>를 쓰세요.</li>
        <li><strong>문서 안에 렌더링하세요.</strong> <code>update()</code>가 실행될 때 문서에 없는 노드는 더 이상 업데이트되지 않습니다.</li>
        <li>바뀌는 자식에는 노드를 반환하는 함수 대신 <strong><code>when()</code>과 <code>list()</code></strong>를 쓰세요.</li>
        <li><strong><code>class</code> 말고 <code>className</code>을 쓰세요.</strong> 동적 클래스에는 <code>() =&gt; cx(...)</code> 또는 <code>{ className: () =&gt; … }</code>를 씁니다.</li>
        <li><strong>스타일은 모듈 최상위에서 한 번만 정의하세요.</strong></li>
        <li><strong>서버 렌더링:</strong> 먼저 렌더링한 다음 <code>getCssText()</code>를 <code>&lt;style id="nuclo-styles"&gt;</code>에 넣으세요. 요청 데이터는 인수로 넘기고, 출력에 담긴 HTML 주석은 그대로 두세요.</li>
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
      <p>공개된 함수와 각 함수를 가져오는 곳을 한눈에 정리했습니다.</p>
      <h3><code>nuclo</code>(전역과 named export)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: 모든 동적 값, 또는 지정한 scope 안의 동적 값을 실행합니다.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: 요소에 <code>update(id)</code>용 scope id를 붙입니다.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: 조건부 콘텐츠를 만들며 <code>.when()</code>과 <code>.else()</code>를 이어 쓸 수 있습니다.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: 항목마다 행 하나를 만들고, 참조 동일성으로 행을 연결합니다.</li>
        <li><a href="#api-region"><code>region(options)</code></a>와 <a href="#api-region"><code>into(id, ...content)</code></a>: 트리 안의 이름 붙은 자리, 그리고 어디서든 그 자리를 채우는 콘텐츠입니다.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: 이벤트 리스너를 달거나 <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>를 등록합니다.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: 만들어서 붙입니다.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: 서버가 만든 HTML을 이어받습니다.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: 컴포넌트를 다시 호출하고 DOM을 패치합니다.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: 스타일 객체로 클래스를 생성합니다.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: 스타일을 합치며 나중에 온 쪽이 이깁니다.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: 테마가 적용된 <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code>, <code>globalStyle</code>을 만듭니다.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: 옵션에 따라 스타일을 고릅니다.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a>와 <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code>(named export 전용)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a>와 <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code>, <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">side effect import</a> 하나와 <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code>, <code>Nuclo*</code> 클래스.</li>
      </ul>
      <h3><code>nuclo-router</code>(별도 패키지)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: 라우터를 만듭니다. <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code>, <code>stop()</code>을 제공합니다.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: 데이터 로더가 청크와 나란히 시작되는 라우트를 만듭니다.</li>
        <li><a href="#router-api">타입</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> 등이 있습니다.</li>
      </ul>
      <h3>전역으로만 제공되는 것</h3>
      <ul>
        <li><a href="#tag-builders">태그 빌더 175개</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, 그리고 <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">타입</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> 등이 있습니다. <code>StyleResult</code> 같은 스타일링 타입은 <code>'nuclo'</code>에서 import할 수도 있습니다.</li>
      </ul>
      <h3>특수 키</h3>
      <ul>
        <li><a href="#attributes">속성</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> 핸들러</a>, <a href="#lifecycle"><code>onMount</code>와 <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">스타일 객체</a>: 줄임 키, 가상 상태, <code>&amp;</code> 선택자, <code>@</code> 규칙, <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "자주 묻는 질문",
        content: `
      <h3>상태를 바꾸면 UI도 바뀌나요?</h3>
      <p>아니요. <code>update()</code>를 호출하기 전까지 DOM은 그대로입니다.</p>

      <h3>Nuclo는 시그널, 프록시, 가상 DOM을 쓰나요?</h3>
      <p>아니요. 상태는 평범한 JavaScript 그대로입니다. 트리를 render하면 Nuclo는 실제 요소와 텍스트 노드를 만들고, <code>update()</code>는 등록된 동적 값(또는 지정한 scope 안의 값)을 실행해서 값이 바뀐 바로 그 노드를 패치합니다. 의존성 그래프도, 가상 트리도 없습니다.</p>

      <h3>페이지에 "false"가 보이는 이유가 뭔가요?</h3>
      <p>boolean은 텍스트로 렌더링됩니다. <code>div(ok &amp;&amp; span('Done'))</code>은 "false"를 보여 줍니다. 자식에는 <code>when(() =&gt; ok, span('Done'))</code>을, 텍스트에는 <code>ok ? 'Done' : ''</code>를 쓰세요.</p>

      <h3>항목을 고쳐도 목록의 행이 바뀌지 않는 이유가 뭔가요?</h3>
      <p>아직 목록에 남아 있는 항목의 행은 다시 렌더링하지 않고 그대로 유지합니다. 값이 바뀌는 필드에는 <code>() =&gt; todo.text</code> 같은 동적 값을 쓰세요. <a href="#api-list"><code>list()</code></a>를 참고하세요.</p>

      <h3>UI 일부가 갑자기 업데이트되지 않는 이유가 뭔가요?</h3>
      <p>대개 <code>update()</code>가 실행될 때 그 노드가 문서에 없었기 때문입니다. Nuclo는 그런 노드의 추적을 멈추고, 나중에 문서에 붙여도 다시 추적하지 않습니다. 그러니 문서에 붙어 있는 컨테이너에 렌더링하세요. 다른 원인도 둘 있습니다. 조건에서 예외가 발생한 <code>when()</code>은 업데이트가 멈추고, 첫 실행에서 예외를 던진 텍스트 함수는 계속 빈 채로 남습니다. <a href="#api-update"><code>update()</code></a>를 참고하세요.</p>

      <h3>언제 <code>forceUpdate()</code>를 써야 하나요?</h3>
      <p>언어 전환처럼 정적 값이 드물게 바뀔 때만 쓰세요. 그 밖의 경우에는 모두 <code>update()</code>를 쓰면 됩니다. <a href="#api-force-update"><code>forceUpdate()</code></a>를 참고하세요.</p>

      <h3>페이지를 props로 내려보내지 않고 레이아웃에 넣으려면 어떻게 하나요?</h3>
      <p><code>region({ id: 'main' })</code>으로 자리를 표시하고, 페이지가 <code>into('main', …)</code>를 반환하게 하세요. <a href="#api-region"><code>region()</code>과 <code>into()</code></a>를 참고하세요.</p>

      <h3>앱을 언마운트하려면 어떻게 하나요?</h3>
      <p><code>when()</code>으로 감싸고 조건을 끄면 됩니다. DOM을 직접 지우면 <code>onDestroy</code>가 실행되지 않습니다. <a href="#lifecycle">생명주기</a>를 참고하세요.</p>

      <h3>Nuclo에 라우터가 들어 있나요?</h3>
      <p>코어 패키지에는 없습니다. 라우팅은 별도 패키지인 <code>nuclo-router</code>로 제공되며, 서버 렌더링, 하이드레이션, 코드 분할 라우트, 유휴 시간 프리로드를 지원합니다. <code>npm install nuclo nuclo-router</code>로 설치하세요. <a href="#router-overview">nuclo-router</a>를 참고하세요.</p>

      <h3>Nuclo에도 이펙트가 있나요?</h3>
      <p>아니요. <code>onMount</code>와 <code>onDestroy</code>는 요소를 삽입하고 제거할 때 요소마다 한 번씩만 실행됩니다. 상태가 바뀌었다고 다시 실행되는 일은 없습니다.</p>
    `,
      },
    ],
  },

];
