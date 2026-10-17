import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "소개",
    sections: [
      {
        id: "overview",
        title: "개요",
        content: `
      <p>Nuclo는 TypeScript용 작은 DOM 라이브러리입니다. <code>div()</code> 및 <code>button()</code>와 같은 일반 함수를 사용하여 페이지를 빌드하고 일반 변수에 상태를 유지하며 페이지가 변경되어야 할 때 <code>update()</code>를 호출합니다.</p>
      <p>Nuclo에는 가상 DOM, 컴파일러, 프록시 및 신호가 없습니다.</p>
      ${code("main.ts", `
import 'nuclo'

let count = 0

const App = () =>
  div(
    h1(() => \`Count: \${count}\`),
    button('Add one', { onClick: () => { count++; update() } }),
  )

render(App, document.getElementById('app')!)
`)}
      <h3>정신 모델</h3>
      <ol>
        <li>태그 빌더를 사용하여 UI를 구축하세요.</li>
        <li>상태에 따라 달라지는 모든 값에 대해 함수를 전달합니다.</li>
        <li>일반 JavaScript로 상태를 변경합니다.</li>
        <li><code>update()</code>에 전화하세요. Nuclo는 기능을 다시 실행하고 DOM를 패치합니다.</li>
      </ol>
      <p>변수를 변경해도 DOM에는 영향을 미치지 않습니다. 페이지는 <code>update()</code>를 호출할 때만 변경됩니다.</p>
    `,
      },
      {
        id: "quick-start",
        title: "빠른 시작",
        content: `
      <p><code>create-nuclo</code>는 Nuclo를 위해 준비된 Vite 및 TypeScript 프로젝트를 스캐폴드합니다.</p>
    `,
        afterContent: `
      <p>프로젝트 이름을 묻습니다. 프롬프트를 건너뛰려면 이름과 플래그를 전달하세요. npm를 사용하면 플래그 앞에 <code>--</code>를 넣습니다.</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>그런 다음 개발 서버를 설치하고 시작합니다.</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>옵션</h3>
      <ul>
        <li><code>[project-name]</code>: 대상 폴더. 기본값은 <code>nuclo-app</code>입니다.</li>
        <li><code>-t, --template &lt;name&gt;</code>: 복사할 템플릿입니다. 현재는 <code>basic</code>만 존재합니다.</li>
        <li><code>-y, --yes</code>: 메시지를 표시하지 않고 기본값을 사용합니다.</li>
        <li><code>-f, --force</code>: 비어 있지 않은 폴더에 씁니다.</li>
        <li><code>-h, --help</code>: 도움말을 인쇄합니다.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "설치 및 가져오기",
        content: `
      <p>기존 프로젝트에 Nuclo를 추가하려면:</p>
      ${sh("npm install nuclo")}
      <p>또는 <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> 또는 <code>bun add nuclo</code>를 사용하세요. Nuclo에는 종속성이 없습니다.</p>
      <p>라우팅은 핵심 패키지의 일부가 아닙니다. <a href="#router-overview"><code>nuclo-router</code></a>로 별도로 배송되며 필요할 때 <code>nuclo</code> 옆에 설치할 수 있습니다.</p>
      <h3>글로벌스</h3>
      <p><code>import 'nuclo'</code>는 다음을 <code>globalThis</code>에 넣습니다.</p>
      <ul>
        <li><strong>175 태그 빌더</strong>: HTML(<code>div</code>, <code>span</code>, <code>button</code>, …)의 경우 112개, SVG의 경우 63개, <code>Svg</code> 포함 접미사(<code>svgSvg</code>, <code>pathSvg</code>, …). <a href="#tag-builders">태그 빌더</a>를 참조하세요.</li>
        <li><strong>16 도우미</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> 및 <code>globalStyle</code>.</li>
      </ul>
      <p>가져오기는 빌더를 호출하는 코드보다 먼저 실행되어야 합니다. ES 모듈은 가져오기 순서대로 실행되므로 실패합니다.</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>항목 파일에 <code>import 'nuclo'</code>를 먼저 넣거나 전역을 사용하는 모든 파일에서 가져옵니다.</p>
      <h3>명명된 수입품</h3>
      <p>도우미는 내보내기라고도 합니다. 전역변수와 동일한 기능입니다. <code>getCssText()</code> 및 <code>resetStyles()</code>는 명명된 내보내기 전용입니다. 태그 빌더는 전역 전용이므로 <code>import { div } from 'nuclo'</code>는 작동하지 않습니다.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>진입점</h3>
      <ul>
        <li><code>nuclo</code>: 전역을 등록하고 16개의 도우미와 <code>getCssText</code> 및 <code>resetStyles</code>를 내보냅니다.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> 및 <code>getCssText</code>. <a href="#api-ssr">서버 렌더링</a>를 참조하세요.</li>
        <li><code>nuclo/polyfill</code>: 노드 및 Bun용 소형 DOM. <a href="#api-polyfill">nuclo/polyfill</a>를 참조하세요.</li>
        <li><code>nuclo/types</code>: 유형만 해당. <a href="#typescript-setup">TypeScript</a>를 참조하세요.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo는 자체 유형을 제공합니다. 두 가지가 필요합니다.</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> 및 <code>nodenext</code>는 아직 지원되지 않습니다.</li>
        <li><code>DOM</code> 라이브러리입니다. TypeScript는 <code>lib</code>를 설정하지 않은 경우 기본적으로 포함됩니다.</li>
      </ul>
      <p>프로젝트의 파일 중 하나라도 <code>'nuclo'</code>를 가져오면 모든 파일에 전역 유형이 표시됩니다. 다른 것은 필요하지 않습니다. 예를 들어 테스트용 별도의 tsconfig에서 가져오는 파일이 없으면 직접 유형을 추가하세요.</p>
      ${code("tsconfig.json", `
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["nuclo/types"]
  }
}
`)}
      <p>또는 <code>/// &lt;reference types="nuclo/types" /&gt;</code>를 <code>.d.ts</code> 파일에 추가하세요.</p>
      <h3>유용한 유형</h3>
      <p>이러한 유형은 전역이므로 가져오기 없이 사용합니다.</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: 태그 빌더가 반환하는 것. 컴포넌트의 반환 유형으로 사용합니다.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: 태그 빌더가 인수로 허용하는 모든 것.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: <code>render()</code> 및 <code>hydrate()</code>가 반환하는 내용입니다.</li>
        <li><code>ElementTagName</code>: 모든 HTML 태그 이름.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: <code>on*</code> 핸들러, <code>onMount</code> 및 <code>onDestroy</code>를 포함하여 태그 빌더가 허용하는 속성 개체입니다. 속성을 전달하는 컴포넌트에 사용하세요.</li>
        <li><code>MountCallback</code> 및 <code>DestroyCallback</code>: <code>onMount</code> 및 <code>onDestroy</code> 핸들러.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: <code>when()</code> 및 <code>list()</code>가 반환하는 내용입니다.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: <code>region()</code> 옵션이 사용됩니다.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> 및 기타 스타일링 유형. <code>import type { StyleResult } from 'nuclo'</code>를 가져올 수도 있습니다.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code>는 모든 DOM 멤버를 선택 사항으로 표시합니다. 전체 요소 유형(<code>render(App, root) as HTMLDivElement</code>)이 필요할 때 캐스팅하세요.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "UI 구성",
    sections: [
      {
        id: "tag-builders",
        title: "태그 빌더",
        content: `
      <p>모든 HTML 태그는 동일한 이름을 가진 전역 함수입니다: <code>div</code>, <code>span</code>, <code>input</code>, … 한 가지 예외는 <code>&lt;var&gt;</code>입니다. <code>var</code>는 예약어이므로 <code>var_</code>입니다. 모든 SVG 태그에는 <code>Svg</code> 접미사(<code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …)가 있습니다.</p>
      <p>태그 빌더를 호출해도 아직 요소가 생성되지 않습니다. <code>div('Hi')</code>는 나중에 요소를 생성하는 함수인 <strong>builder</strong>를 반환합니다. Nuclo는 <code>render()</code>로 마운트하거나 다른 빌더인 <code>when()</code> 또는 <code>list()</code> 내에 배치할 때 이를 호출합니다. 사용할 때마다 새로운 요소가 생성됩니다.</p>
      ${code("card.ts", `
let name = 'Ada'

const Card = () =>
  div(
    { id: 'card', className: 'card' },
    h2('Profile'),
    p(() => \`Hello, \${name}\`),
    button('Rename', { onClick: () => { name = 'Grace'; update() } }),
  )

render(Card, document.body)
`)}
    `,
        afterContent: `
      <h3>인수</h3>
      <p>빌더는 원하는 수의 인수를 가져와 왼쪽에서 오른쪽으로 적용합니다.</p>
      <ul>
        <li><strong>string, number, bigint</strong>: 텍스트 노드.</li>
        <li><strong><code>() =&gt; value</code></strong>: <code>update()</code>에서 변경되는 텍스트입니다. <a href="#dynamic-functions">동적 값</a>를 참조하십시오.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: 건너뛰었습니다.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: "true" 또는 "false" 텍스트로 렌더링됩니다. 조건은 <code>when()</code>를 사용하세요.</li>
        <li><strong>A 일반 객체</strong>: 속성. <a href="#attributes">속성</a>를 참조하세요.</li>
        <li><strong>A <code>css()</code>, <code>cx()</code> 또는 <code>variants()</code> result</strong>: 클래스를 추가합니다.</li>
        <li><strong><code>on(...)</code></strong>: 이벤트 리스너 또는 생명주기 후크입니다.</li>
        <li><strong>다른 빌더, <code>when()</code> 또는 <code>list()</code></strong>: 하위.</li>
        <li><strong>A DOM <code>Node</code></strong>: 그대로 첨부합니다.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: 사용자 정의 수정자. 아래를 참조하세요.</li>
      </ul>
      <h3>알았어</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code>는 "false" 텍스트를 렌더링합니다. <code>div(when(() =&gt; isAdmin, span('Admin')))</code>를 작성하세요.</li>
        <li>배열은 하위 배열이 아닙니다. 전파하세요: <code>ul(...names.map((n) =&gt; li(n)))</code>. 변경되는 목록의 경우 <code>list()</code>를 사용하세요.</li>
        <li>태그 이름이 있는 로컬 변수는 빌더를 숨깁니다. <code>function Row(label: string)</code> 내부에서는 <code>label(...)</code>를 호출할 수 없습니다. <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> 및 <code>i</code>와 같은 로컬 이름을 바꿉니다.</li>
        <li>브라우저는 <code>id</code>가 있는 모든 요소를 ​​전역 변수로 노출합니다. Nuclo가 로드되기 전에 페이지에 <code>&lt;main id="main"&gt;</code>가 포함되어 있으면 Nuclo는 해당 전역을 그대로 유지하므로 <code>main(...)</code>는 <code>TypeError</code>를 발생시킵니다. 다른 ID를 사용하세요.</li>
      </ul>
      <h3>사용자 정의 수정자</h3>
      <p>하나 이상의 매개변수를 선언하는 함수는 요소가 빌드되는 동안 인수 순서대로 한 번 실행됩니다. 첫 번째 인수는 요소입니다. 두 번째는 내부 인덱스이므로 의존하지 마세요. 문자열이나 숫자를 반환하면 텍스트가 됩니다. <code>Node</code>가 추가됩니다. 객체는 속성으로 적용됩니다.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>요소 가져오기</h3>
      <p><code>render()</code>는 루트 요소를 반환합니다. 트리 내부에서는 <code>on("mount", (el) =&gt; …)</code> 또는 사용자 정의 수정자를 사용합니다. 분리된 요소를 생성하기 위해 빌더 함수를 직접 호출할 수도 있습니다.</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>다음 <code>update()</code> 전에 부착하세요. <code>update()</code>가 실행될 때 문서에 없는 노드는 업데이트를 영구적으로 중지합니다.</p>
      <h3>SVG</h3>
      <p>SVG 빌더는 동일한 인수를 사용합니다. Nuclo는 모든 SVG 속성을 <code>setAttribute</code>로 설정하므로 <code>"stroke-width"</code>와 같은 이름은 작성된 대로 작동합니다.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>모든 빌더</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "컴포넌트",
        content: `
      <p>컴포넌트는 <code>button(...)</code>와 같은 빌더를 반환하는 일반 함수입니다. 컴포넌트 API가 없습니다. 렌더링하거나 트리에 배치할 때까지는 아무 것도 생성되지 않습니다.</p>
      ${code("counter.ts", `
function Counter(label: string) {
  let count = 0 // one per call
  return button(() => \`\${label}: \${count}\`, {
    onClick: () => { count++; update() },
  })
}

render(() => div(Counter('A'), Counter('B')))
`)}
    `,
        afterContent: `
      <p>함수 내부에 선언된 상태는 해당 인스턴스에 속합니다. 외부에 선언된 상태는 모든 인스턴스에서 공유됩니다. <code>forceUpdate()</code>는 컴포넌트를 다시 호출하여 내부에 선언된 상태를 재설정합니다.</p>
      <p>아이들은 단지 논쟁일 뿐입니다:</p>
      ${code("card.ts", `
function Card(heading: string, ...children: NodeModLike<'div'>[]) {
  return div({ className: 'card' }, h2(heading), ...children)
}

render(() => Card('Hi', p('one'), p('two')))
`)}
    `,
      },
      {
        id: "attributes",
        title: "속성",
        content: `
      <p>속성을 설정하려면 일반 객체를 전달하세요. 여러 객체를 전달할 수 있습니다. 동일한 키의 경우 병합되는 <code>className</code> 및 <code>style</code>를 제외하고 나중 값이 우선합니다. 값은 정적이거나 모든 <code>update()</code>에서 다시 실행되는 매개변수가 없는 함수일 수 있습니다.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>값 설정 방법</h3>
      <ul>
        <li>HTML 요소에 해당 이름(<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …)의 속성이 있는 경우 Nuclo가 속성을 설정합니다. 그렇지 않으면 <code>"aria-*"</code> 및 <code>"data-*"</code>와 같이 <code>setAttribute(key, String(value))</code>를 호출합니다.</li>
        <li>SVG 요소에서 Nuclo는 항상 <code>setAttribute</code>를 호출합니다.</li>
        <li><code>null</code> 및 <code>undefined</code>는 건너뜁니다. <code>null</code> 또는 <code>undefined</code>를 반환하는 동적 값은 이전 값을 유지합니다. 값을 지우려면 부울 속성에 대해 <code>""</code> 또는 <code>false</code>를 반환합니다.</li>
        <li>부울은 버튼의 <code>disabled</code>, <code>checked</code>, <code>hidden</code> 및 <code>required</code>와 같은 DOM 부울 속성에 대해 작동합니다. 다른 곳에서는 <code>true</code> 및 <code>false</code>가 "true" 및 "false" 문자열로 작성됩니다.</li>
        <li><code>"data-*"</code> 키를 사용하세요. <code>dataset</code>는 지원되지 않습니다.</li>
        <li><code>innerHTML</code>는 이스케이프되지 않으며 서버 렌더링에서는 이를 출력하지 않습니다. 그것을 피하십시오.</li>
      </ul>
      <h3>클래스</h3>
      <p><code>className</code>를 사용하세요. 정적 클래스 문자열, <code>css()</code> 결과 및 동적 <code>className</code>가 모두 병합됩니다. 동적 <code>className</code>는 정적 클래스를 유지하고 <code>""</code>를 반환하면 정적 클래스만 남습니다.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>HTML 요소에는 <code>class</code> 키를 사용하지 마십시오. 원시 속성을 설정하고 <code>css()</code> 클래스를 포함하여 이전에 적용된 모든 클래스를 대체합니다.</p>
      <h3>인라인 스타일</h3>
      <p><code>style</code>는 camelCase 키가 있는 객체 또는 이를 반환하는 함수를 사용합니다.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo는 장치를 추가하지 않습니다. <code>12</code>가 아닌 <code>"12px"</code>를 작성하세요. <code>opacity</code> 및 <code>zIndex</code>와 같은 단위 없는 속성은 숫자를 허용합니다.</li>
        <li><code>""</code>, <code>null</code> 및 <code>undefined</code> 속성을 지웁니다.</li>
        <li>동적 스타일은 반환하는 키만 설정합니다. 반환을 중지한 키는 이전 값을 유지하므로 <code>""</code>를 반환하여 삭제하세요.</li>
        <li>스타일 문자열(<code>"color: red"</code>) 및 사용자 정의 속성(<code>"--gap"</code>)은 지원되지 않습니다. 대신 <code>css()</code>를 사용하세요. <a href="#style-objects"><code>raw</code></a>를 통해 사용자 정의 속성을 사용합니다.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "이벤트",
        content: `
      <p>이벤트를 수신하는 방법에는 <code>on*</code> 속성과 <code>on()</code> 수정자의 두 가지 방법이 있습니다.</p>
      <h3><code>on*</code> 속성</h3>
      <p>속성 객체에서 <code>onClick</code>(<code>on</code> 다음에 대문자가 옴)와 같은 키 아래의 함수는 동적 값이 아닌 이벤트 핸들러입니다.</p>
      ${code("search.ts", `
let query = ''

const search = input({
  placeholder: 'Search',
  value: () => query,
  onInput: (e) => { query = e.currentTarget.value; update() },
  onKeyDown: (e) => { if (e.key === 'Escape') { query = ''; update() } },
})
`)}
      <ul>
        <li>TypeScript는 키와 요소에서 이벤트 유형을 추론합니다. <code>e.currentTarget</code> 및 <code>this</code>가 요소입니다.</li>
        <li>Nuclo는 기본 속성을 설정하므로 <code>onClick</code>는 <code>el.onclick</code>가 됩니다. 이벤트당 하나의 핸들러가 있습니다. 최신 <code>onClick</code>가 이전 핸들러를 대체합니다.</li>
        <li><code>onDoubleClick</code> 및 <code>onDblClick</code>는 모두 <code>dblclick</code>를 의미합니다. <code>onclick</code>와 같은 소문자 키는 유형 오류입니다.</li>
        <li>알려진 이벤트가 아닌 이름은 소문자 형식을 수신합니다. <code>onMyEvent</code>는 <code>"myevent"</code>를 수신합니다.</li>
        <li>핸들러에서 발생하는 오류는 포착되지 않습니다.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code>는 요소에서 <code>addEventListener</code>를 호출하는 수정자를 반환합니다.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>모든 <code>on()</code>는 수신기를 추가합니다. 모두 순서대로 실행됩니다.</li>
        <li><code>options</code>는 <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>로 바로 이동합니다.</li>
        <li><code>on()</code>를 빌더에 직접 전달하면 요소 유형이 <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>로 유추됩니다.</li>
        <li>리스너가 오류를 발생시키면 Nuclo는 <code>console.error</code>로 오류를 기록하고 다른 리스너는 계속 실행됩니다.</li>
        <li>Nuclo는 요소를 제거할 때 수신기를 제거합니다. 서버에서 <code>on()</code>는 아무 작업도 수행하지 않습니다.</li>
        <li>하나의 <code>on()</code> 값을 여러 요소에서 재사용할 수 있습니다.</li>
      </ul>
      <p>사용자 정의 이벤트의 경우 이벤트 유형을 일반으로 전달합니다.</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>어느 것을 사용할 것인가</h3>
      <p>일반적인 경우에는 <code>on*</code> 속성을 사용합니다. 이벤트, 리스너 옵션 또는 <code>"my-event"</code>와 같은 사용자 정의 이벤트 이름에 대해 둘 이상의 리스너가 필요한 경우 <code>on()</code>를 사용하십시오.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "생명주기",
        content: `
      <p><code>onMount</code>는 요소가 삽입된 후 한 번 실행됩니다. <code>onDestroy</code>는 Nuclo가 요소를 제거할 때 한 번 실행됩니다. 속성으로 작성하거나 <code>on()</code>를 사용하여 작성하십시오. 두 형식 모두 동일하게 동작하며 요소는 해당 태그에서 입력됩니다.</p>
      ${code("timer.ts", `
let seconds = 0

const Timer = () =>
  span(
    {
      onMount: () => {
        const id = setInterval(() => { seconds++; update() }, 1000)
        return () => clearInterval(id) // runs when the span is removed
      },
    },
    () => \`\${seconds}s\`,
  )

const search = input(on('mount', (el) => el.focus()))
`)}
    `,
        afterContent: `
      <h3>실행될 때</h3>
      <ul>
        <li><code>onMount</code>는 요소를 삽입한 <code>render()</code>, <code>hydrate()</code>, <code>update()</code> 또는 <code>forceUpdate()</code> 호출이 끝날 때 실행됩니다. 트리가 만들어지는 동안에는 절대로 실행되지 않습니다.</li>
        <li><code>onMount</code>가 함수를 반환하는 경우 해당 함수는 요소의 <code>onDestroy</code> 콜백 이후 소멸 시 실행됩니다.</li>
        <li><code>onDestroy</code>는 Nuclo가 요소를 제거할 때 실행됩니다. 즉, <code>list()</code> 행이 제거되고, <code>when()</code> 분기가 전환되고, <code>into()</code>가 해당 영역을 떠나거나, <code>forceUpdate()</code>가 요소를 삭제합니다. 제거 직전에 실행되므로 해당 요소는 여전히 문서에 있습니다.</li>
      </ul>
      <h3>원시 DOM 제거</h3>
      <p><code>node.remove()</code> 또는 <code>innerHTML = ''</code>를 사용하여 요소를 직접 제거하면 해당 <code>onDestroy</code> 및 정리가 실행되지 않으며 타이머는 계속 실행됩니다. Nuclo에는 <code>unmount()</code>가 없습니다. 정리를 통해 앱을 해체하려면 <code>when()</code>로 래핑하세요.</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>주문 및 오류</h3>
      <ul>
        <li>어느 형식으로든 원하는 만큼 후크를 등록할 수 있습니다. 등록순으로 진행됩니다.</li>
        <li><code>onDestroy</code>는 항상 하위 항목을 먼저 실행한 다음 상위 항목을 실행합니다.</li>
        <li>요소는 인수 순서를 따르는 첫 번째 <code>onMount</code> 후크 순서로 마운트되며 각 요소는 모든 후크를 함께 실행합니다. 부모의 후크를 자식이 의존하는 경우 자식보다 먼저 전달합니다.</li>
        <li>던지는 후크는 <code>console.error</code>로 기록됩니다. 다른 후크는 여전히 실행됩니다.</li>
        <li>콜백은 아무것도 반환하지 않거나 정리 함수를 반환해야 하므로 <code>async</code>로 만들지 마세요. 반환된 Promise는 정리 용도로 사용되지 않습니다. 내부에서 비동기 작업을 시작하세요: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>후크는 서버에서 실행되지 않습니다. 클라이언트에서는 <code>hydrate()</code> 이후에 실행됩니다.</li>
      </ul>
      <div class="docs-callout"><strong>참고:</strong> 후크는 효과가 아닙니다. 상태가 변경되면 다시 실행되지 않습니다. 각각은 요소당 최대 한 번 실행됩니다.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "업데이트",
    sections: [
      {
        id: "explicit-updates",
        title: "명시적 업데이트",
        content: `
      <p>Nuclo는 자체적으로 페이지를 업데이트하지 않습니다. 상태를 변경한 다음 <code>update()</code>에 전화하세요.</p>
      ${code("counter.ts", `
let count = 0

const Counter = () =>
  button(() => \`Clicked \${count} times\`, {
    onClick: () => { count++; update() },
  })

render(Counter)
`)}
    `,
        afterContent: `
      <p>원하는 만큼 상태를 변경한 다음 <code>update()</code>를 한 번 호출합니다.</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>이벤트 핸들러, 타이머, 페치 콜백 또는 <code>onMount</code>에서 <code>update()</code>를 호출합니다. 동적 값 내부에서 호출하지 마세요.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "동적 값",
        content: `
      <p><strong> 매개변수가 없는 함수</strong>는 <strong>동적 값</strong>입니다. Nuclo는 요소를 빌드할 때 한 번 실행하고 모든 <code>update()</code>에서 다시 실행합니다. 텍스트 하위 항목, 속성 값, <code>style</code> 및 <code>className</code>에 대해 동적 값을 사용합니다. 나타나거나 사라지거나 반복되는 자식 노드의 경우 <a href="#api-when"><code>when()</code></a> 및 <a href="#api-list"><code>list()</code></a>를 사용하세요.</p>
      ${code("example.ts", `
let name = 'Alice'
let busy = false

const Profile = () =>
  div(
    h1('Welcome'),              // static
    p(() => \`Hello, \${name}\`),  // dynamic text
    button({ disabled: () => busy }, 'Save'),
  )
`)}
    `,
        afterContent: `
      <p>Nuclo는 매개변수 개수(<code>fn.length</code>)를 확인합니다. 매개변수를 선언하는 함수는 <a href="#tag-builders">custom 수정자</a>이며 한 번만 실행됩니다. <code>(x = 0) =&gt; …</code> 및 <code>(...args) =&gt; …</code>의 길이는 0이므로 동적입니다.</p>
      <h3>동적 텍스트</h3>
      <ul>
        <li>문자열, 숫자, bigint 또는 부울은 <code>String(value)</code>로 렌더링됩니다. <code>() =&gt; ok &amp;&amp; 'Saved'</code>에는 "false"가 표시되므로 <code>() =&gt; (ok ? 'Saved' : '')</code>를 작성합니다.</li>
        <li><code>null</code> 및 <code>undefined</code>는 빈 텍스트로 렌더링됩니다.</li>
        <li>첫 번째 실행의 <code>css()</code> 또는 <code>cx()</code> 결과는 함수를 텍스트가 아닌 동적 클래스로 만듭니다. <a href="#api-cx"><code>cx()</code></a>를 참조하세요.</li>
        <li>노드, 빌더, 배열 또는 일반 객체는 아무것도 렌더링하지 않으며 업데이트하지 않습니다.</li>
      </ul>
      <h3>동적 속성</h3>
      <ul>
        <li>Nuclo는 Nuclo가 쓴 마지막 값과 다른 경우에만 값을 씁니다. 라이브 DOM와 비교하지 않으므로 사용자가 입력을 입력하고 함수가 이전과 동일한 값을 반환하면 입력한 텍스트가 유지됩니다.</li>
        <li><code>null</code> 또는 <code>undefined</code>의 결과는 아무것도 쓰지 않으므로 이전 값이 유지됩니다. <code>className</code>는 예외입니다. 잘못된 결과는 동적 클래스를 제거하고 정적 클래스를 유지합니다.</li>
        <li><code>style</code> 함수는 모든 업데이트에서 반환된 개체를 적용합니다.</li>
      </ul>
      <h3>오류</h3>
      <p>동적 값이 발생하면 Nuclo가 오류를 포착하고 나머지 업데이트는 계속 실행됩니다. 텍스트는 비어 있거나 이전 값을 유지하며 속성은 이전 값을 유지합니다. 둘 다 성공한 다음 <code>update()</code>에서 복구됩니다. 예외: <strong>first</strong> 실행을 던지는 텍스트 함수는 영원히 비어 있습니다.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>페이지의 모든 동적 값에 대해 하나의 동기 전달을 실행합니다. ID를 사용하면 해당 <a href="#api-scope"><code>scope()</code></a> ID로 표시된 요소 내부의 내용만 업데이트됩니다. 각 패스는 다음 단계를 순서대로 실행합니다.</p>
      <ol>
        <li><code>list()</code>: 항목을 다시 읽고 행을 추가, 이동 또는 제거합니다.</li>
        <li><code>when()</code>: 조건을 다시 확인합니다. 다른 분기가 활성화될 때만 분기가 다시 작성됩니다.</li>
        <li><code>style</code> 및 <code>className</code>를 포함한 동적 속성.</li>
        <li>동적 텍스트.</li>
        <li><code>onMount</code>입니다.</li>
      </ol>
      <ul>
        <li><strong>그것은 모든 것을 실행합니다.</strong> 모든 동적 값은 데이터가 변경되지 않은 경우에도 모든 호출에서 실행됩니다. DOM 쓰기만 건너뜁니다. 동적 값을 신속하고 부작용 없이 유지하세요.</li>
        <li><strong>문서의 노드만.</strong> <code>update()</code>가 실행될 때 문서에 노드가 없으면 Nuclo는 노드 추적을 중지합니다. 연결한 후에도 다시 업데이트되지 않습니다. 이는 <code>list()</code> 및 <code>when()</code>에도 적용됩니다. 문서에 있는 컨테이너로 렌더링합니다.</li>
        <li><strong>정적 값은 절대 변경되지 않습니다. </strong> 일반 문자열 및 속성 값은 요소가 빌드될 때 고정됩니다. 다시 빌드하려면 <a href="#api-force-update"><code>forceUpdate()</code></a>를 사용하세요.</li>
        <li><strong>Errors.</strong> 텍스트 및 속성 오류가 발견되고 패스가 계속됩니다. <code>when()</code> 조건이 발생하면 오류가 기록되고 <code>when()</code> 업데이트가 중지됩니다. <code>list()</code> <code>items</code> 또는 <code>renderItem</code> 함수가 발생하면 오류가 <code>update()</code>를 이스케이프하고 나머지 단계가 실행되지 않습니다.</li>
        <li><strong>Server.</strong> <code>update()</code>는 서버에서 아무 작업도 수행하지 않습니다.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>하나 이상의 범위 ID에 전달되는 요소를 제공합니다. 그런 다음 <code>update('id')</code>는 요소 자체 속성을 포함하여 해당 요소 내부에 있는 내용만 업데이트합니다.</p>
      ${code("example.ts", `
let cartItems: string[] = []
let user = 'Ada'

const App = () =>
  div(
    header(() => \`Hi, \${user}\`),
    aside(scope('cart'), span(() => \`Items: \${cartItems.length}\`)),
  )

render(App)

cartItems.push('apple')
user = 'Grace'
update('cart') // "Items: 1", the header still says "Hi, Ada"
update()       // everything, the header now says "Hi, Grace"
`)}
    `,
        afterContent: `
      <ul>
        <li>요소에는 <code>scope('cart', 'sidebar')</code>라는 여러 ID가 있을 수 있습니다.</li>
        <li><code>update('a', 'b')</code>는 <code>a</code> 또는 <code>b</code> 내부의 모든 것을 업데이트합니다. 여러 요소가 동일한 ID를 사용하면 모두 업데이트됩니다.</li>
        <li>중첩된 범위를 사용하는 <code>update('outer')</code>에는 내부 범위가 포함됩니다. <code>update('inner')</code>는 외부에 닿지 않습니다.</li>
        <li>문서에 요소가 없는 ID는 <strong>nothing</strong>를 업데이트하고 오류가 발생하지 않으므로 철자를 확인하세요.</li>
        <li><code>scope()</code>는 서버에서 아무 작업도 수행하지 않습니다.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>조건에 따라 콘텐츠를 렌더링합니다. Nuclo는 모든 <code>update()</code>에서 조건을 다시 확인합니다. 첫 번째 참 조건이 승리합니다. true가 아닌 경우 <code>.else()</code> 콘텐츠가 렌더링됩니다. <code>.else()</code>가 없으면 아무것도 렌더링되지 않습니다.</p>
      ${code("status.ts", `
let status: 'loading' | 'error' | 'ready' = 'loading'

const Status = () =>
  div(
    when(() => status === 'loading', p('Loading…'))
      .when(() => status === 'error', p('Something went wrong'))
      .else(p('Ready')),
  )
`)}
    `,
        afterContent: `
      <h3>조건</h3>
      <ul>
        <li>상태의 경우 함수를 전달합니다. 일반 부울은 한 번 읽혀집니다. <code>when(open, …)</code>는 절대 변경되지 않습니다.</li>
        <li>TypeScript에서 함수는 부울을 반환해야 합니다. <code>() =&gt; items.length &gt; 0</code> 또는 <code>() =&gt; user != null</code>를 작성하세요.</li>
      </ul>
      <h3>어떤 업데이트</h3>
      <ul>
        <li>동일한 분기가 활성 상태로 유지되는 동안 해당 요소는 유지됩니다. 내부의 동적 값, 목록 및 <code>when()</code> 블록은 계속 업데이트됩니다.</li>
        <li>다른 분기가 활성화되면 이전 콘텐츠가 제거되고 해당 <code>onDestroy</code> 후크가 실행됩니다. 새 브랜치는 처음부터 작성되었으며 <code>onMount</code> 후크가 실행됩니다. 입력 텍스트나 포커스와 같은 이전 요소의 상태는 손실됩니다.</li>
      </ul>
      <h3>분기 내용</h3>
      <p>하위 항목을 텍스트, 동적 텍스트, 빌더, <code>list()</code> 및 중첩된 <code>when()</code> 분기에 배치합니다. DOM 노드가 아닌 <code>p('Hi')</code>와 같은 패스 빌더: DOM 노드는 분기가 한 번 숨겨진 후 업데이트를 중지합니다.</p>
      <p>브랜치의 속성 개체 및 <code>on()</code>는 상위 요소에 적용되며 브랜치가 숨겨진 후에도 유지됩니다. 조건부 속성의 경우 동적 속성(<code>{ className: () =&gt; (active ? 'active' : '') }</code>)을 사용합니다.</p>
      <h3>체인 연결</h3>
      <p><code>.when()</code> 및 <code>.else()</code>는 새 빌더를 반환하고 원본을 변경하지 않습니다. <code>.else()</code>를 두 번 호출하면 마지막 호출이 승리합니다.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>항목당 하나의 행을 렌더링합니다. 모든 <code>update()</code>에서 Nuclo는 <code>items()</code>를 다시 호출하고 ID(<code>===</code>)를 기준으로 새 항목을 기존 행과 일치시킵니다.</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>행 일치 방법</h3>
      <ul>
        <li>여전히 존재하는 항목이 해당 행을 유지합니다. Nuclo는 필요한 경우 행을 이동하고 <code>renderItem</code>를 다시 호출하지 않습니다.</li>
        <li>새 항목은 새 행을 가져옵니다. 제거된 항목은 해당 행을 잃고 해당 <code>onDestroy</code> 후크가 실행됩니다.</li>
        <li>중복 항목은 각각 고유한 행을 갖습니다.</li>
        <li>현재 배열(<code>push</code>, <code>splice</code>, <code>sort</code>)을 변경하거나 새 배열을 반환할 수 있습니다.</li>
      </ul>
      <p>유지된 행은 다시 렌더링되지 않으므로 변경되는 필드에 동적 값을 사용하십시오.</p>
      ${code("todos.ts", `
const todos = [{ text: 'Write docs', done: false }]

const Todos = () =>
  ul(
    list(() => todos, (todo) =>
      li({ className: () => (todo.done ? 'done' : '') }, () => todo.text),
    ),
  )

render(Todos)

todos[0].done = true
update() // same <li>, its class is now "done"
`)}
      <p>복사본은 새 항목이므로 어레이를 <code>todos.map((t) =&gt; ({ ...t }))</code>로 교체하면 모든 행이 다시 빌드됩니다.</p>
    `,
        afterContent: `
      <h3><code>renderItem</code>가 반환하는 것</h3>
      <ul>
        <li><code>li(...)</code>, <code>tr(...)</code> 또는 SVG 빌더와 같은 하나의 요소를 반환합니다. 항목을 건너뛰려면 <code>null</code> 또는 <code>undefined</code>를 반환하세요. 문자열, 텍스트 노드 및 조각은 아무것도 렌더링하지 않습니다.</li>
        <li><code>when()</code> 또는 <code>list()</code>를 직접 반환하지 마세요. 행 요소 <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code> 안에 넣으세요.</li>
        <li>항목을 숨기려면 <code>renderItem</code>가 아닌 <code>items()</code>로 필터링하세요.</li>
        <li><code>renderItem</code>를 부작용 없이 유지하세요. Nuclo는 동일한 항목에 대해 두 번 이상 호출할 수 있습니다.</li>
      </ul>
      <h3>인덱스</h3>
      <p><code>index</code>는 해당 행이 생성될 때 항목의 위치입니다. 행이 이동할 때 업데이트되지 않습니다. 현재 위치에는 동적 값인 <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>를 사용합니다.</p>
      <h3>반복 가능</h3>
      <p>모든 반복 가능한 작업: 배열, <code>Set</code>, 생성기 및 <code>map.values()</code>. 매번 동일한 배열 또는 <code>Set</code>를 반환하는 것은 괜찮습니다. 생성기 또는 <code>map.values()</code>와 같은 반복자는 한 번의 패스 후에 모두 사용되므로 호출할 때마다 <code>items()</code> 내부에 생성하십시오. <code>Map</code>를 반복하면 매번 새로운 <code>[key, value]</code> 어레이가 직접 생성되므로 모든 행이 다시 작성됩니다. 대신 <code>map.values()</code>를 사용하세요.</p>
      <h3>배치</h3>
      <p><code>list()</code>가 두 주석 표시 사이에서 형제 사이에 있는 행이 나타납니다. 부모의 다른 자식은 건드리지 않습니다. <code>list()</code>는 SVG 빌더 내부에서도 작동합니다.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() 및 into()",
        content: `
      <p><code>region()</code>는 트리에서 명명된 위치를 표시합니다. <code>into()</code>는 어느 곳에서나 어떤 깊이에서도 채울 수 있습니다. 레이아웃은 콘텐츠를 소품으로 받지 않으며 콘텐츠를 구성하는 컴포넌트는 콘텐츠가 어디에 배치되는지 알지 못합니다.</p>
      ${code("app.ts", `
const Layout = () =>
  div(
    aside(nav(a({ href: '/' }, 'Home'))),
    main(region({ id: 'main', empty: p('Nothing open.') })),
  )

// Anywhere in the tree, before or after the region
const Article = () => into('main', article(h1('Hello')))

render(() => div(Layout(), Article()))
`)}
      <h3>작동 방식</h3>
      <ul>
        <li><code>into()</code>는 작성한 곳에 코멘트만 남깁니다. 해당 콘텐츠는 지역의 마커 사이에서 렌더링됩니다.</li>
        <li>순서는 중요하지 않습니다. 지역이 건설되기 전에 구축된 <code>into()</code>는 지역이 건설되는 순간을 기다리며 보여줍니다. 보기는 작성된 순서대로 표시됩니다.</li>
        <li>콘텐츠는 보기만큼 오래 지속됩니다. <code>into()</code>를 보유하는 <code>when()</code>가 닫히거나 해당 <code>list()</code> 행이 제거되면 컨텐츠가 영역을 떠납니다. 다시 열면 두 개가 아닌 한 개의 사본이 추가됩니다.</li>
        <li><code>when()</code>가 닫히는 등 지역이 사라지면 해당 뷰는 다시 기다립니다. 나중에 동일한 ID로 구축된 지역이 이를 보여줍니다.</li>
        <li>ID가 지역과 일치하지 않는 <code>into()</code>는 아무것도 렌더링하지 않으며 오류도 발생하지 않으므로 철자를 확인하세요.</li>
        <li>ID는 트리에서 고유합니다. 라이브 ID로 구축된 두 번째 지역은 경고를 기록합니다.</li>
        <li>지역은 <a href="#api-ssr">서버 렌더링</a>와 함께 작동합니다. <code>hydrate()</code>에서 각 뷰는 서버를 다시 빌드하는 대신 서버가 렌더링한 HTML를 주장합니다.</li>
      </ul>
      <h3>옵션</h3>
      <ul>
        <li><code>id</code>: <code>into()</code> 호출이 지역을 찾는 데 사용하는 이름입니다.</li>
        <li><code>type</code>: <code>'latest'</code>(기본값)는 최신 보기만 표시합니다. <code>'stack'</code>는 도착 순서대로 모든 뷰를 표시합니다.</li>
        <li><code>empty</code>: 영역에 뷰가 없는 동안 렌더링됩니다.</li>
      </ul>
      <h3>누적 영역</h3>
      <p><code>type: 'stack'</code>를 사용하면 다른 뷰 위에 열리는 뷰가 아래 뷰를 다시 작성하지 않습니다. DOM, 초점 및 형태 유지. 페이지 위의 대화 상자와 같은 레이어에 사용하세요.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>여러 지역을 동시에</h3>
      <p>단일 <code>into()</code>에서 두 개 이상의 영역을 채우려면 객체를 전달하십시오. 값은 하나의 하위 항목일 수도 있고 하위 항목의 배열일 수도 있습니다. 어느 쪽이든 중첩됩니다. 다른 보기의 콘텐츠 내부에 있는 <code>into()</code>는 자체 지역을 대상으로 합니다.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>트리 깊은 곳에서 열린 대화 상자</h3>
      <p>오버레이 영역은 루트에 위치합니다. 모든 깊이의 모든 컴포넌트는 <code>into()</code>를 <code>when()</code>로 래핑하여 대화 상자를 엽니다. <code>when()</code>를 닫으면 해당 영역에서 대화 상자가 제거됩니다.</p>
      ${code("dialog.ts", `
let confirming = false

const App = () =>
  div(
    Page(),
    div({ className: 'overlay' }, region({ id: 'overlay' })),
  )

// Deep inside Page()
const DeleteButton = () =>
  div(
    button('Delete', { onClick: () => { confirming = true; update() } }),
    when(() => confirming,
      into('overlay',
        dialog({ open: true },
          p('Delete this item?'),
          button('Cancel', { onClick: () => { confirming = false; update() } }),
        ),
      ),
    ),
  )
`)}
      <h3>목록 행의 토스트</h3>
      <p><code>list()</code>의 각 행은 뷰입니다. 누적된 영역에는 해당 항목이 순서대로 표시되며 배열에서 항목을 제거하면 알림이 제거됩니다.</p>
      ${code("toasts.ts", `
const toasts: { text: string }[] = []

const notify = (text: string) => {
  toasts.push({ text })
  update()
}

const dismiss = (toast: { text: string }) => {
  toasts.splice(toasts.indexOf(toast), 1)
  update()
}

const App = () =>
  div(
    button('Save', { onClick: () => notify('Saved.') }),
    div({ className: 'toasts' }, region({ id: 'toasts', type: 'stack' })),
    list(() => toasts, (toast) =>
      into('toasts', div(toast.text, button('×', { onClick: () => dismiss(toast) }))),
    ),
  )
`)}
      <h3>페이지에서 설정한 페이지 제목</h3>
      <p>기본 <code>type: 'latest'</code>를 사용하면 최신 보기가 우선합니다. 레이아웃은 제목을 소유하고 열려 있는 페이지가 제목의 이름을 지정합니다. <code>into('title', …)</code>가 없는 페이지는 <code>empty</code> 텍스트를 남깁니다.</p>
      ${code("title.ts", `
let page: 'home' | 'settings' = 'home'

const Layout = () =>
  div(
    h1(region({ id: 'title', empty: 'My app' })),
    when(() => page === 'home', Home()).else(Settings()),
  )

const Home = () => p('Welcome.')

const Settings = () =>
  div(
    into('title', 'Settings'),
    form(/* … */),
  )
`)}
      <h3>뷰 내부의 동적 값</h3>
      <p><code>into()</code>의 내용은 일반 Nuclo 내용입니다. 그 안의 기능은 상태에 따른 값이며 지역이 어디에 있든 <code>update()</code>에서 새로 고쳐집니다.</p>
      ${code("status.ts", `
const selected = new Set<string>()

const Layout = () =>
  div(
    header(region({ id: 'status' })),
    Table(),
  )

const Table = () =>
  div(
    into('status', () => \`\${selected.size} selected\`),
    list(() => rows, (row) =>
      label(
        input({ type: 'checkbox', onChange: (e) => {
          e.currentTarget.checked ? selected.add(row.id) : selected.delete(row.id)
          update()
        } }),
        row.name,
      ),
    ),
  )
`)}
      <h3>왔다가 가는 지역</h3>
      <p>대시보드의 <code>into()</code>가 한 번 작성됩니다. 사용자가 로그아웃한 동안에는 <code>main</code> 영역이 없으므로 보기가 기다립니다. 로그인하면 지역이 구축되고 보기가 표시됩니다. 로그아웃하면 지역이 제거되고 보기가 다시 기다립니다.</p>
      ${code("auth.ts", `
let user: { name: string } | null = null

const App = () =>
  div(
    when(() => user !== null,
      main(region({ id: 'main' })),
    ).else(
      LoginForm(),
    ),
    into('main', Dashboard()),
  )
`)}
      <h3>자체 지역이 포함된 뷰</h3>
      <p>뷰는 <code>region()</code>를 포함할 수 있으며 다른 뷰는 이를 대상으로 할 수 있습니다. 여기서 편집기 페이지는 <code>tabs</code> 영역을 가져오고 각 탭이 이를 채웁니다. 편집기가 닫히면 해당 영역도 함께 이동됩니다.</p>
      ${code("editor.ts", `
let tab: 'code' | 'preview' = 'code'

const Editor = () =>
  into('main',
    div(
      nav(
        button('Code', { onClick: () => { tab = 'code'; update() } }),
        button('Preview', { onClick: () => { tab = 'preview'; update() } }),
      ),
      section(region({ id: 'tabs' })),
    ),
    when(() => tab === 'code', into('tabs', textarea()))
      .else(into('tabs', iframe({ src: '/preview' }))),
  )
`)}
      <h3>라이브 예시</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code>는 동적 값만 실행합니다. <code>h1(labels[lang].title)</code>의 텍스트와 같은 정적 값은 트리가 작성될 때 고정됩니다. <code>forceUpdate()</code>는 컴포넌트를 다시 호출하고 정적 값이 포함된 일치하도록 라이브 DOM를 패치합니다. 언어 전환과 같이 앱 전반에 걸쳐 드물게 변경하는 경우에 사용하세요. 다른 모든 것에는 <code>update()</code>를 사용하십시오.</p>
      ${code("i18n.ts", `
const labels = { en: { title: 'Hello' }, pt: { title: 'Olá' } }
let lang: keyof typeof labels = 'en'

const App = () => div(h1(labels[lang].title))
render(App, root)

lang = 'pt'
forceUpdate() // same <h1> element, now "Olá"
`)}
    `,
        afterContent: `
      <p>인수가 없으면 <code>forceUpdate()</code>는 <code>render(App)</code> 또는 <code>hydrate(App)</code>로 렌더링된 모든 루트를 다시 작성합니다. <code>render(App())</code>로 렌더링된 루트는 건너뜁니다. 컴포넌트가 발생하면 오류가 기록되고 해당 루트는 이전 DOM를 유지합니다. 새 빌드가 적용되는 동안 나중에 발생하는 오류도 기록되지만 이미 패치된 부분은 패치된 상태로 유지됩니다.</p>
      <h3>남는 것과 변화하는 것</h3>
      <ul>
        <li>자식은 태그별로 순서대로 일치됩니다. 일치하는 요소가 재사용되므로 포커스와 입력된 입력 값이 유지되고 해당 <code>onMount</code> 후크가 다시 실행되지 않습니다. 한 자녀의 태그가 다르면 해당 자녀와 이후의 모든 형제 자매는 새로 만들어집니다.</li>
        <li>텍스트, 속성, 클래스, 스타일, 리스너, <code>when()</code> 분기 및 <code>list()</code> 행은 새 빌드를 따릅니다.</li>
        <li>새 요소가 생성되고 해당 <code>onMount</code> 후크가 실행됩니다. 새 빌드에서 더 이상 만들지 않는 요소는 제거되고 해당 <code>onDestroy</code> 후크가 실행됩니다.</li>
        <li><code>list()</code> 행은 항목이 아닌 위치로도 일치하므로 재사용된 행 요소가 결국 다른 항목을 표시할 수 있습니다.</li>
        <li>새 빌드에서 더 이상 설정되지 않는 속성은 제거되지 않습니다.</li>
      </ul>
      <div class="docs-callout"><strong>주의 사항: 컴포넌트 함수 내부에 선언된 </strong> 상태는 함수가 다시 실행되기 때문에 재설정됩니다. 컴포넌트 외부에서 유지되어야 하는 상태를 유지합니다.</div>
      <p><strong>EExplicit form.</strong> <code>forceUpdate(App(), parent)</code>는 <code>parent</code>에서 하나의 트리를 다시 작성하고 해당 루트를 반환합니다. 이후 호출을 위해 루트를 등록하지 않습니다. <code>hydrate()</code>와 마찬가지로 루트가 <code>parent</code>의 첫 번째 노드가 될 것으로 예상합니다. 첫 번째 노드에 다른 태그가 있으면 교체됩니다.</p>
      <p>서버에서 <code>forceUpdate()</code>는 아무 작업도 수행하지 않습니다.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "렌더링",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>트리를 구축하고 해당 루트 요소를 <code>parent</code>에 추가합니다. <code>parent</code>의 기본값은 <code>document.body</code>입니다. 루트 요소를 반환합니다.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>컴포넌트(<code>render(App)</code>) 또는 컴포넌트가 반환하는 빌더(<code>render(App())</code>)를 전달할 수 있습니다. DOM도 동일합니다. <code>render(App)</code>만 <a href="#api-force-update"><code>forceUpdate()</code></a>가 나중에 루트를 다시 빌드할 수 있으므로 선호합니다.</li>
        <li>첨부합니다. <code>parent</code>를 지우지 않으므로 두 번 호출하면 두 개의 복사본이 추가됩니다.</li>
        <li><code>render()</code>가 반환되면 트리의 모든 <code>onMount</code>가 실행되었습니다.</li>
        <li>문서에 있는 요소로 렌더링합니다. <a href="#api-update"><code>update()</code></a>를 참조하세요.</li>
        <li>루트는 <code>when()</code> 또는 <code>list()</code>가 아닌 <code>div(...)</code>와 같은 요소여야 합니다.</li>
        <li><code>index</code>는 내부입니다. 요소가 삽입되는 위치는 선택하지 않습니다. 그것을 그대로 두십시오.</li>
      </ul>
      <p><code>render(App)</code>로 전달된 컴포넌트는 매개 변수를 사용하지 않아야 합니다. 필수 매개변수는 유형 오류입니다. 선택적인 유형 검사 중 하나는 런타임에 <code>render()</code>가 발생합니다. 소품을 사용하는 컴포넌트를 래핑합니다.</p>
      ${code("main.ts", `
const Page = (props: { name: string }) => div(h1('Hi ', props.name))

render(() => Page({ name: 'Ana' }), root)
`)}
    `,
      },
      {
        id: "api-hydrate",
        title: "hydrate()",
        content: `
      <p>는 <a href="#api-ssr"><code>renderToString()</code></a>가 만든 HTML를 인수합니다. 기존 요소를 재사용하고, 이벤트 리스너를 연결하고, 동적 값 <code>when()</code> 및 <code>list()</code>를 연결하므로 나중에 <code>update()</code>가 작동합니다. 그런 다음 <code>onMount</code> 후크를 실행합니다. <code>parent</code>의 기본값은 <code>document.body</code>입니다. 루트 요소를 반환합니다.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>서버와 동일한 컴포넌트, 동일한 데이터를 사용하십시오.</li>
        <li>전용 용기에 수화시킵니다. 공백은 괜찮지만 앱의 루트는 첫 번째 노드여야 합니다. 다른 노드가 먼저 오면 Nuclo는 해당 노드를 교체하고 서버 복사본을 남겨 둡니다.</li>
        <li><code>render()</code>와 마찬가지로 <code>App()</code>가 아닌 <code>App</code>를 전달하므로 <code>forceUpdate()</code>는 나중에 루트를 다시 빌드할 수 있습니다. <code>App</code>는 매개변수를 사용하지 않아야 합니다. 옵션인 <code>hydrate()</code>는 아무것도 자동으로 부착하지 않습니다. 소품을 사용하는 컴포넌트를 래핑합니다: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>HTML 서버가 없으면 <code>render()</code>를 사용하세요.</li>
      </ul>
      <h3>서버와 클라이언트가 다른 경우</h3>
      <p>클라이언트가 승리합니다.</p>
      <ul>
        <li>다른 루트 태그: 해당 노드는 새로운 DOM로 대체됩니다. 빈 컨테이너: 새로운 DOM가 추가됩니다.</li>
        <li>다른 텍스트가 패치되었습니다. 다양한 <code>list()</code> 항목과 <code>when()</code> 분기가 클라이언트를 따릅니다.</li>
        <li>추가 서버 하위 항목이 제거되고 누락된 항목이 생성됩니다.</li>
        <li>서버에서 작성했지만 클라이언트에서 설정하지 않은 속성은 그대로 유지됩니다.</li>
      </ul>
      <p><code>renderToString()</code>는 HTML 주석을 각 텍스트 노드 앞에 <code>&lt;!-- text-0 --&gt;</code>와 같은 마커로 씁니다. <code>hydrate()</code>에는 주석이 필요하므로 서버 HTML에서 주석을 제거하지 마십시오. 마커가 없으면 하이드레이션은 <code>list()</code> 행을 삭제하고 <code>list()</code> 및 <code>when()</code> 업데이트를 중지합니다.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "서버 렌더링",
        content: `
      <p>서버의 HTML 문자열로 컴포넌트를 렌더링합니다. 브라우저에서 동일한 컴포넌트로 <a href="#api-hydrate"><code>hydrate()</code></a>를 호출하여 HTML를 대화형으로 만듭니다. 서버 런타임에는 <code>document</code>가 없으므로 먼저 <a href="#api-polyfill"><code>nuclo/polyfill</code></a>를 가져옵니다.</p>
      ${code("app.ts", `
let count = 0
const heading = css({ color: 'red' })

export const App = () =>
  main(
    h1(heading, () => \`Count: \${count}\`),
    button({ onClick: () => { count++; update() } }, '+1'),
  )
`)}
      ${code("server.ts", `
import 'nuclo/polyfill'
import 'nuclo'
import { renderToString, getCssText } from 'nuclo/ssr'
import { App } from './app.ts'

const html = renderToString(App)
const page = \`<!doctype html>
<html>
  <head><style id="nuclo-styles">\${getCssText()}</style></head>
  <body>
    <div id="root">\${html}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>\`
`)}
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <p>스타일 태그에 <code>id="nuclo-styles"</code>를 유지합니다. 클라이언트는 해당 요소를 재사용하고 새 규칙만 추가합니다. <a href="#api-css-text"><code>getCssText()</code></a>를 참조하세요.</p>
      <h3>서버에서 실행되는 것</h3>
      <ul>
        <li>각 <code>renderToString()</code> 호출은 트리를 구축하고 각 동적 값을 한 번 실행합니다.</li>
        <li>이벤트 핸들러 <code>onMount</code> 및 <code>onDestroy</code>는 실행되지 않습니다. <code>update()</code>, <code>scope()</code> 및 <code>forceUpdate()</code>는 아무것도 수행하지 않습니다.</li>
        <li>렌더링은 동기식입니다. 먼저 데이터를 로드한 다음 렌더링하세요.</li>
        <li>렌더링 후에는 등록된 상태가 유지되지 않으므로 하나의 프로세스가 여러 요청을 처리할 수 있습니다. 요청 데이터를 <code>renderToString(Page(user))</code>와 같은 인수로 전달합니다. 모듈 수준 변수는 모든 요청에서 공유됩니다.</li>
        <li>서버에서 <code>render()</code>를 호출하지 마십시오. 공유 <code>document.body</code>에 추가됩니다.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>빌더(<code>App()</code>), 컴포넌트(<code>App</code>) 또는 DOM 노드를 사용합니다. <code>null</code> 및 <code>undefined</code>는 <code>""</code>를 반환합니다. 루트는 요소여야 합니다. <code>renderToString(Page)</code>로 전달된 컴포넌트는 매개 변수를 사용하지 않아야 하므로 데이터를 사용하는 컴포넌트에는 <code>Page(user)</code>를 전달합니다.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>텍스트 및 속성 값은 HTML로 이스케이프됩니다. <code>script()</code> 및 <code>style()</code> 내부의 텍스트는 닫는 태그만 분리된 상태로 있는 그대로 작성되므로 사용자 입력을 거기에 넣지 마십시오.</li>
        <li>던지지 않습니다. 컴포넌트, <code>list()</code> 함수 또는 <code>when()</code> 조건이 발생하거나 폴리필이 누락된 경우 오류를 기록하고 <code>""</code>를 반환합니다. 요청이 실패하면 빈 결과를 확인하세요. 빈 렌더링만 발생시키는 텍스트 또는 속성 함수입니다.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p><code>inputs.map(renderToString)</code>와 동일합니다.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>출력을 하나의 요소로 래핑합니다. <code>containerTag</code>의 기본값은 <code>"div"</code>이고, <code>containerAttrs</code>는 <code>{}</code>입니다. 속성 값이 이스케이프됩니다. 속성 이름은 주어진 대로 작성하므로 <code>class</code>와 같은 HTML 이름을 사용합니다. 사용자 입력을 태그로 전달하지 마십시오.</p>
      ${code("example.ts", `
renderToStringWithContainer(p('Hi'), 'section', { id: 'main', class: 'page' })
// '<section id="main" class="page"><p><!-- text-0 -->Hi</p></section>'
`)}
    `,
      },
      {
        id: "api-polyfill",
        title: "nuclo/polyfill",
        content: `
      <p>작은 DOM이므로 Nuclo는 노드 및 Bun에서 트리를 구축할 수 있습니다. 첫 번째 렌더링 전에 한 번 가져옵니다. 대부분의 앱에는 일반 가져오기만 필요합니다.</p>
      <ul>
        <li><code>window</code>가 없을 경우 <code>globalThis.document</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code>를 설정하되, 누락된 것만 설정합니다. <code>window</code>를 생성하지 않습니다.</li>
        <li>브라우저나 jsdom에서는 아무 작업도 수행하지 않습니다.</li>
        <li><code>Event</code> 및 <code>CustomEvent</code>는 런타임 자체 생성자입니다. <code>Node</code>, <code>Element</code> 및 <code>HTMLElement</code>는 폴리필 클래스의 별칭입니다.</li>
      </ul>
      <p>브라우저가 아닌 트리 구축용 DOM입니다. <code>innerHTML</code> 및 <code>getElementById</code>가 없으며 <code>querySelector()</code>는 <code>null</code>를 반환하고 이벤트 리스너는 무시됩니다. <code>renderToString()</code>를 사용하여 HTML를 얻으세요.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
