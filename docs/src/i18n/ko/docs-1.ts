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
      <p>Nuclo는 TypeScript용 작은 DOM 라이브러리입니다. <code>div()</code>, <code>button()</code> 같은 평범한 함수로 페이지를 만들고, 상태는 그냥 변수에 두고, 화면을 바꿀 때가 되면 <code>update()</code>를 호출하면 됩니다.</p>
      <p>가상 DOM도, 컴파일러도, 프록시도, 시그널도 없습니다.</p>
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
      <h3>동작 모델</h3>
      <ol>
        <li>태그 빌더로 UI를 만듭니다.</li>
        <li>상태에 따라 달라지는 값은 함수로 넘깁니다.</li>
        <li>상태는 평범한 JavaScript로 바꿉니다.</li>
        <li><code>update()</code>를 호출하면 Nuclo가 그 함수들을 다시 실행하고 DOM을 패치합니다.</li>
      </ol>
      <p>변수를 바꾼다고 DOM이 달라지지는 않습니다. 페이지는 <code>update()</code>를 호출할 때만 바뀝니다.</p>
    `,
      },
      {
        id: "quick-start",
        title: "빠른 시작",
        content: `
      <p><code>create-nuclo</code>가 Nuclo에 맞게 설정된 Vite + TypeScript 프로젝트를 바로 만들어 줍니다.</p>
    `,
        afterContent: `
      <p>실행하면 프로젝트 이름을 물어봅니다. 프롬프트를 건너뛰고 싶다면 이름과 플래그를 함께 넘기세요. npm에서는 플래그 앞에 <code>--</code>가 필요합니다.</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>이어서 의존성을 설치하고 개발 서버를 띄웁니다.</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>옵션</h3>
      <ul>
        <li><code>[project-name]</code>: 만들 폴더 이름입니다. 기본값은 <code>nuclo-app</code>입니다.</li>
        <li><code>-t, --template &lt;name&gt;</code>: 복사해 올 템플릿입니다. 지금은 <code>basic</code> 하나뿐입니다.</li>
        <li><code>-y, --yes</code>: 프롬프트 없이 기본값으로 진행합니다.</li>
        <li><code>-f, --force</code>: 비어 있지 않은 폴더에도 프로젝트를 만듭니다.</li>
        <li><code>-h, --help</code>: 도움말을 출력합니다.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "설치와 import",
        content: `
      <p>이미 진행 중인 프로젝트에는 이렇게 추가하세요.</p>
      ${sh("npm install nuclo")}
      <p><code>pnpm add nuclo</code>, <code>yarn add nuclo</code>, <code>bun add nuclo</code>도 마찬가지입니다. Nuclo에는 의존성이 없습니다.</p>
      <p>라우팅은 코어 패키지에 들어 있지 않습니다. <a href="#router-overview"><code>nuclo-router</code></a>라는 별도 패키지로 제공되니, 필요할 때 <code>nuclo</code>와 함께 설치하세요.</p>
      <h3>전역으로 등록되는 것들</h3>
      <p><code>import 'nuclo'</code>는 아래 항목을 <code>globalThis</code>에 등록합니다.</p>
      <ul>
        <li><strong>태그 빌더 175개</strong>: HTML용 112개(<code>div</code>, <code>span</code>, <code>button</code>, …)와, <code>Svg</code> 접미사가 붙는 SVG용 63개(<code>svgSvg</code>, <code>pathSvg</code>, …)입니다. <a href="#tag-builders">태그 빌더</a>를 참고하세요.</li>
        <li><strong>헬퍼 16개</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code>, <code>globalStyle</code>입니다.</li>
      </ul>
      <p>이 import는 빌더를 호출하는 어떤 코드보다 먼저 실행되어야 합니다. ES 모듈은 import 순서대로 실행되기 때문에 아래 코드는 실패합니다.</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>진입 파일 맨 위에 <code>import 'nuclo'</code>를 두거나, 전역을 쓰는 파일마다 직접 import하세요.</p>
      <h3>이름으로 import하기</h3>
      <p>헬퍼는 named export로도 가져올 수 있고, 전역에 등록된 것과 똑같은 함수입니다. <code>getCssText()</code>와 <code>resetStyles()</code>는 named export로만 제공됩니다. 태그 빌더는 전역으로만 제공되므로 <code>import { div } from 'nuclo'</code>는 동작하지 않습니다.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>엔트리 포인트</h3>
      <ul>
        <li><code>nuclo</code>: 전역을 등록하고, 헬퍼 16개와 <code>getCssText</code>, <code>resetStyles</code>를 export합니다.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code>, <code>getCssText</code>를 제공합니다. <a href="#api-ssr">서버 렌더링</a>을 참고하세요.</li>
        <li><code>nuclo/polyfill</code>: Node.js와 Bun에서 쓰는 작은 DOM 구현입니다. <a href="#api-polyfill">nuclo/polyfill</a>을 참고하세요.</li>
        <li><code>nuclo/types</code>: 타입만 들어 있습니다. <a href="#typescript-setup">TypeScript</a>를 참고하세요.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo는 타입을 직접 들고 있어서, 설정에서 챙길 건 두 가지뿐입니다.</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code>과 <code>nodenext</code>는 아직 지원하지 않습니다.</li>
        <li><code>DOM</code> lib. <code>lib</code>를 따로 지정하지 않으면 TypeScript가 기본으로 포함해 줍니다.</li>
      </ul>
      <p>프로젝트의 파일 중 하나라도 <code>'nuclo'</code>를 import하면 모든 파일에서 전역 타입이 보이니 따로 할 일은 없습니다. 아무 파일도 import하지 않는 환경, 예를 들어 테스트 전용 tsconfig 같은 곳에서는 타입을 직접 추가해 주세요.</p>
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
      <p>또는 <code>/// &lt;reference types="nuclo/types" /&gt;</code> 줄을 <code>.d.ts</code> 파일에 추가해도 됩니다.</p>
      <h3>자주 쓰는 타입</h3>
      <p>아래 타입은 전역으로 선언되어 있어서 import 없이 바로 쓸 수 있습니다.</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: 태그 빌더가 반환하는 타입입니다. 컴포넌트의 반환 타입으로 쓰세요.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: 태그 빌더가 인수로 받아 주는 모든 것의 타입입니다.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: <code>render()</code>와 <code>hydrate()</code>가 돌려주는 타입입니다.</li>
        <li><code>ElementTagName</code>: HTML 태그 이름이면 무엇이든 해당합니다.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: 태그 빌더가 받는 속성 객체의 타입으로, <code>on*</code> 핸들러와 <code>onMount</code>, <code>onDestroy</code>까지 포함합니다. 속성을 그대로 넘겨 주는 컴포넌트에 쓰세요.</li>
        <li><code>MountCallback</code>, <code>DestroyCallback</code>: <code>onMount</code>와 <code>onDestroy</code> 핸들러의 타입입니다.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: <code>when()</code>과 <code>list()</code>가 돌려주는 타입입니다.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: <code>region()</code>이 받는 옵션의 타입입니다.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> 같은 스타일링 관련 타입들입니다. <code>import type { StyleResult } from 'nuclo'</code>처럼 import해서 쓸 수도 있습니다.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code>는 DOM 멤버를 전부 optional로 표시합니다. 완전한 요소 타입이 필요하면 <code>render(App, root) as HTMLDivElement</code>처럼 캐스팅하세요.</p>
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
      <p>HTML 태그는 하나하나가 이름이 같은 전역 함수입니다. <code>div</code>, <code>span</code>, <code>input</code>, … 예외는 <code>&lt;var&gt;</code> 하나뿐인데, <code>var</code>가 예약어라서 <code>var_</code>라고 씁니다. SVG 태그에는 전부 <code>Svg</code> 접미사가 붙습니다. <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code> 같은 식입니다.</p>
      <p>태그 빌더를 호출한다고 바로 요소가 만들어지지는 않습니다. <code>div('Hi')</code>가 돌려주는 것은 나중에 요소를 만들어 줄 함수, 즉 <strong>빌더</strong>입니다. Nuclo는 <code>render()</code>로 마운트하거나 다른 빌더, <code>when()</code>, <code>list()</code> 안에 놓일 때 이 함수를 호출하며, 쓰일 때마다 새 요소를 만듭니다.</p>
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
      <p>빌더는 인수를 개수 제한 없이 받아 왼쪽부터 차례로 적용합니다.</p>
      <ul>
        <li><strong>string, number, bigint</strong>: 텍스트 노드가 됩니다.</li>
        <li><strong><code>() =&gt; value</code></strong>: <code>update()</code>가 호출될 때마다 바뀌는 텍스트입니다. <a href="#dynamic-functions">동적 값</a>을 참고하세요.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: 건너뜁니다.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: "true", "false"라는 텍스트로 렌더링됩니다. 조건 분기에는 <code>when()</code>을 쓰세요.</li>
        <li><strong>일반 객체</strong>: 속성으로 적용됩니다. <a href="#attributes">속성</a>을 참고하세요.</li>
        <li><strong><code>css()</code>, <code>cx()</code>, <code>variants()</code>의 결과</strong>: 담긴 클래스가 추가됩니다.</li>
        <li><strong><code>on(...)</code></strong>: 이벤트 리스너 또는 생명주기 훅이 됩니다.</li>
        <li><strong>다른 빌더, <code>when()</code>, <code>list()</code></strong>: 자식으로 붙습니다.</li>
        <li><strong>DOM <code>Node</code></strong>: 그대로 붙입니다.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: 커스텀 modifier입니다. 아래에서 설명합니다.</li>
      </ul>
      <h3>조심할 점</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code>은 "false"라는 텍스트를 그대로 그립니다. <code>div(when(() =&gt; isAdmin, span('Admin')))</code>처럼 쓰세요.</li>
        <li>배열은 자식으로 쓸 수 없으니 펼쳐서 넘기세요. <code>ul(...names.map((n) =&gt; li(n)))</code>처럼요. 내용이 바뀌는 목록에는 <code>list()</code>를 쓰면 됩니다.</li>
        <li>태그와 이름이 같은 지역 변수는 빌더를 가려 버립니다. <code>function Row(label: string)</code> 안에서는 <code>label(...)</code>을 호출할 수 없어요. <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code>, <code>i</code> 같은 지역 이름은 다른 걸로 바꾸세요.</li>
        <li>브라우저는 <code>id</code>가 있는 요소를 전부 전역 변수로 노출합니다. Nuclo가 로드되기 전에 페이지에 <code>&lt;main id="main"&gt;</code>가 있으면 Nuclo는 그 전역을 건드리지 않기 때문에 <code>main(...)</code>이 <code>TypeError</code>를 던집니다. 다른 id를 쓰세요.</li>
      </ul>
      <h3>커스텀 modifier</h3>
      <p>매개변수를 하나 이상 선언한 함수는 요소를 만드는 동안 인수 순서대로 딱 한 번 실행됩니다. 첫 번째 인수는 요소이고, 두 번째는 내부용 인덱스이니 기대지 마세요. 문자열이나 숫자를 반환하면 텍스트가 되고, <code>Node</code>를 반환하면 그대로 붙으며, 객체를 반환하면 속성으로 적용됩니다.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>요소 참조 얻기</h3>
      <p><code>render()</code>는 루트 요소를 반환합니다. 트리 안에서는 <code>on("mount", (el) =&gt; …)</code>나 커스텀 modifier로 요소를 받을 수 있고, 빌더 함수를 직접 호출해 DOM에 붙지 않은 요소를 만들 수도 있습니다.</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>다음 <code>update()</code>가 돌기 전에 문서에 붙여 두세요. <code>update()</code>가 실행될 때 문서에 없는 노드는 이후로 영영 갱신되지 않습니다.</p>
      <h3>SVG</h3>
      <p>SVG 빌더도 인수는 똑같습니다. Nuclo는 SVG 속성을 전부 <code>setAttribute</code>로 설정하기 때문에 <code>"stroke-width"</code> 같은 이름도 쓴 그대로 동작합니다.</p>
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
      <p>컴포넌트는 <code>button(...)</code> 같은 빌더를 반환하는 평범한 함수일 뿐, 별도의 컴포넌트 API는 없습니다. render하거나 트리에 놓기 전에는 아무것도 만들어지지 않습니다.</p>
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
      <p>함수 안에서 선언한 상태는 그 인스턴스만의 것이고, 바깥에서 선언한 상태는 모든 인스턴스가 함께 씁니다. <code>forceUpdate()</code>는 컴포넌트를 다시 호출하기 때문에, 안쪽에서 선언한 상태는 초기화됩니다.</p>
      <p>자식도 그냥 인수로 넘기면 됩니다.</p>
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
      <p>속성은 평범한 객체로 넘기면 됩니다. 객체를 여러 개 넘겨도 되고, 키가 겹치면 나중 값이 이기지만 <code>className</code>과 <code>style</code>만은 병합됩니다. 값은 정적인 값이어도 되고, <code>update()</code>마다 다시 실행되는 인수 없는 함수여도 됩니다.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>값이 설정되는 방식</h3>
      <ul>
        <li>HTML 요소에 같은 이름의 프로퍼티(<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …)가 있으면 Nuclo는 그 프로퍼티에 값을 대입합니다. 없으면 <code>"aria-*"</code>나 <code>"data-*"</code>처럼 <code>setAttribute(key, String(value))</code>를 호출합니다.</li>
        <li>SVG 요소에는 언제나 <code>setAttribute</code>를 호출합니다.</li>
        <li><code>null</code>과 <code>undefined</code>는 건너뜁니다. 동적 값이 <code>null</code>이나 <code>undefined</code>를 반환하면 이전 값이 그대로 남습니다. 값을 지우고 싶다면 <code>""</code>를, boolean 프로퍼티라면 <code>false</code>를 반환하세요.</li>
        <li>boolean은 버튼의 <code>disabled</code>, <code>checked</code>, <code>hidden</code>, <code>required</code> 같은 DOM boolean 프로퍼티에서 의미를 가집니다. 그 밖의 곳에서는 <code>true</code>와 <code>false</code>가 "true", "false" 문자열로 기록됩니다.</li>
        <li><code>"data-*"</code> 키를 쓰세요. <code>dataset</code>은 지원하지 않습니다.</li>
        <li><code>innerHTML</code>은 이스케이프되지 않고, 서버 렌더링도 이 값을 출력하지 않습니다. 되도록 피하세요.</li>
      </ul>
      <h3>클래스</h3>
      <p><code>className</code>을 쓰세요. 정적 클래스 문자열, <code>css()</code> 결과, 동적 <code>className</code>은 모두 하나로 병합됩니다. 동적 <code>className</code>은 정적 클래스를 그대로 두고, <code>""</code>를 반환하면 정적 클래스만 남습니다.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>HTML 요소에 <code>class</code> 키는 쓰지 마세요. 날 속성을 그대로 설정하기 때문에, 그보다 앞서 적용된 <code>css()</code> 클래스를 포함한 모든 클래스를 덮어씁니다.</p>
      <h3>인라인 스타일</h3>
      <p><code>style</code>에는 camelCase 키를 가진 객체, 또는 그런 객체를 반환하는 함수를 넘깁니다.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo는 단위를 붙여 주지 않습니다. <code>12</code>가 아니라 <code>"12px"</code>로 쓰세요. <code>opacity</code>, <code>zIndex</code>처럼 단위가 없는 프로퍼티는 숫자도 받습니다.</li>
        <li><code>""</code>, <code>null</code>, <code>undefined</code>는 해당 프로퍼티를 지웁니다.</li>
        <li>동적 스타일은 반환한 키만 설정합니다. 더 이상 반환하지 않는 키는 이전 값이 남으니, 지우려면 <code>""</code>를 반환하세요.</li>
        <li>스타일 문자열(<code>"color: red"</code>)과 커스텀 프로퍼티(<code>"--gap"</code>)는 지원하지 않습니다. 대신 <code>css()</code>를 쓰세요. 커스텀 프로퍼티는 <a href="#style-objects"><code>raw</code></a>로 넘길 수 있습니다.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "이벤트",
        content: `
      <p>이벤트를 듣는 방법은 두 가지입니다. <code>on*</code> 속성과 <code>on()</code> modifier입니다.</p>
      <h3><code>on*</code> 속성</h3>
      <p>속성 객체에서 <code>onClick</code>(<code>on</code> 뒤에 대문자가 오는 형태) 같은 키에 담긴 함수는 동적 값이 아니라 이벤트 핸들러입니다.</p>
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
        <li>TypeScript가 키와 요소로부터 이벤트 타입을 추론합니다. <code>e.currentTarget</code>과 <code>this</code>는 모두 해당 요소입니다.</li>
        <li>Nuclo는 네이티브 프로퍼티를 설정하므로 <code>onClick</code>은 <code>el.onclick</code>이 됩니다. 이벤트당 핸들러는 하나뿐이라서, 나중에 지정한 <code>onClick</code>이 앞의 것을 대체합니다.</li>
        <li><code>onDoubleClick</code>과 <code>onDblClick</code>은 둘 다 <code>dblclick</code>을 뜻합니다. <code>onclick</code>처럼 소문자로 쓴 키는 타입 오류입니다.</li>
        <li>알려진 이벤트가 아닌 이름은 소문자로 바꾼 이벤트를 듣습니다. <code>onMyEvent</code>는 <code>"myevent"</code>를 듣는 식입니다.</li>
        <li>핸들러가 던진 오류는 잡지 않습니다.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code>은 요소에 <code>addEventListener</code>를 호출하는 modifier를 돌려줍니다.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li><code>on()</code>을 쓸 때마다 리스너가 하나씩 추가되고, 모두 등록한 순서대로 실행됩니다.</li>
        <li><code>options</code>는 <code>addEventListener</code>에 그대로 넘어갑니다. <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>을 쓸 수 있습니다.</li>
        <li><code>on()</code>을 빌더에 바로 넘기면 요소 타입이 추론됩니다. <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>처럼요.</li>
        <li>리스너가 오류를 던지면 Nuclo가 <code>console.error</code>로 기록하고, 나머지 리스너는 계속 실행됩니다.</li>
        <li>Nuclo가 요소를 제거하면 리스너도 함께 제거됩니다. 서버에서 <code>on()</code>은 아무 일도 하지 않습니다.</li>
        <li><code>on()</code>으로 만든 값 하나를 여러 요소에서 재사용해도 됩니다.</li>
      </ul>
      <p>커스텀 이벤트는 이벤트 타입을 제네릭 인수로 넘기세요.</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>어느 쪽을 쓸까요</h3>
      <p>대부분은 <code>on*</code> 속성이면 충분합니다. 한 이벤트에 리스너를 여러 개 달거나, 리스너 옵션이나 <code>"my-event"</code> 같은 커스텀 이벤트 이름이 필요할 때 <code>on()</code>을 쓰세요.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "생명주기",
        content: `
      <p><code>onMount</code>는 요소가 삽입된 뒤 한 번, <code>onDestroy</code>는 Nuclo가 요소를 제거할 때 한 번 실행됩니다. 속성으로 쓰든 <code>on()</code>으로 쓰든 동작은 같고, 요소 타입은 태그에서 추론됩니다.</p>
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
      <h3>실행 시점</h3>
      <ul>
        <li><code>onMount</code>는 요소를 삽입한 <code>render()</code>, <code>hydrate()</code>, <code>update()</code>, <code>forceUpdate()</code> 호출이 끝나는 시점에 실행됩니다. 트리를 만드는 도중에는 절대 실행되지 않습니다.</li>
        <li><code>onMount</code>가 함수를 반환하면, 그 함수는 요소가 제거될 때 요소의 <code>onDestroy</code> 콜백들이 끝난 뒤에 실행됩니다.</li>
        <li><code>onDestroy</code>는 Nuclo가 요소를 제거할 때 실행됩니다. <code>list()</code> 행이 사라질 때, <code>when()</code> 분기가 바뀔 때, <code>into()</code>가 영역을 떠날 때, <code>forceUpdate()</code>가 요소를 버릴 때가 여기에 해당합니다. 제거 직전에 실행되므로 그 시점의 요소는 아직 문서 안에 있습니다.</li>
      </ul>
      <h3>DOM API로 직접 제거하기</h3>
      <p><code>node.remove()</code>나 <code>innerHTML = ''</code>로 요소를 직접 제거하면 그 요소의 <code>onDestroy</code>와 cleanup은 실행되지 않고, 타이머도 계속 돕니다. Nuclo에는 <code>unmount()</code>가 없습니다. cleanup까지 실행하며 앱을 내리고 싶다면 <code>when()</code>으로 감싸세요.</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>실행 순서와 오류</h3>
      <ul>
        <li>훅은 어느 형식으로든 원하는 만큼 등록할 수 있고, 등록한 순서대로 실행됩니다.</li>
        <li><code>onDestroy</code>는 언제나 자식이 먼저, 부모가 나중에 실행됩니다.</li>
        <li>요소는 첫 번째 <code>onMount</code> 훅의 순서, 즉 인수 순서대로 마운트되고, 각 요소는 자신의 훅을 한꺼번에 실행합니다. 자식이 부모의 훅에 의존한다면 부모의 훅을 자식보다 앞에 넘기세요.</li>
        <li>훅에서 오류가 나면 <code>console.error</code>로 기록하고, 나머지 훅은 그대로 실행합니다.</li>
        <li>콜백은 아무것도 반환하지 않거나 cleanup 함수를 반환해야 하므로 <code>async</code>로 만들지 마세요. 반환된 Promise는 cleanup으로 쓰이지 않습니다. 비동기 작업은 콜백 안에서 시작하세요. <code>{ onMount: (el) =&gt; { void load(el) } }</code>처럼요.</li>
        <li>훅은 서버에서 절대 실행되지 않습니다. 클라이언트에서는 <code>hydrate()</code>가 끝난 뒤에 실행됩니다.</li>
      </ul>
      <div class="docs-callout"><strong>참고:</strong> 훅은 effect가 아닙니다. 상태가 바뀌어도 다시 실행되지 않고, 요소 하나당 최대 한 번만 실행됩니다.</div>
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
      <p>Nuclo는 알아서 페이지를 갱신하지 않습니다. 상태를 바꾼 다음 <code>update()</code>를 호출하세요.</p>
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
      <p>상태는 원하는 만큼 바꾸고, <code>update()</code>는 마지막에 한 번만 호출하면 됩니다.</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p><code>update()</code>는 이벤트 핸들러, 타이머, fetch 콜백, <code>onMount</code> 안에서 호출하세요. 동적 값 안에서는 호출하면 안 됩니다.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "동적 값",
        content: `
      <p><strong>인수가 없는 함수</strong>는 <strong>동적 값</strong>입니다. Nuclo는 요소를 만들 때 한 번 실행하고, 이후 <code>update()</code>가 호출될 때마다 다시 실행합니다. 텍스트 자식, 속성 값, <code>style</code>, <code>className</code>에 쓸 수 있습니다. 나타났다 사라지거나 반복되는 자식 노드에는 <a href="#api-when"><code>when()</code></a>과 <a href="#api-list"><code>list()</code></a>를 쓰세요.</p>
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
      <p>Nuclo는 매개변수 개수(<code>fn.length</code>)를 확인합니다. 매개변수를 선언한 함수는 <a href="#tag-builders">커스텀 modifier</a>로 취급되어 딱 한 번만 실행됩니다. <code>(x = 0) =&gt; …</code>나 <code>(...args) =&gt; …</code>는 length가 0이라 동적 값으로 분류됩니다.</p>
      <h3>동적 텍스트</h3>
      <ul>
        <li>문자열, 숫자, bigint, boolean은 <code>String(value)</code>로 렌더링됩니다. <code>() =&gt; ok &amp;&amp; 'Saved'</code>는 "false"가 그려지니, <code>() =&gt; (ok ? 'Saved' : '')</code>처럼 쓰세요.</li>
        <li><code>null</code>과 <code>undefined</code>는 빈 텍스트가 됩니다.</li>
        <li>첫 실행에서 <code>css()</code>나 <code>cx()</code>의 결과를 반환하면 그 함수는 텍스트가 아니라 동적 클래스가 됩니다. <a href="#api-cx"><code>cx()</code></a>를 참고하세요.</li>
        <li>노드, 빌더, 배열, 일반 객체를 반환하면 아무것도 렌더링되지 않고, 이후에도 갱신되지 않습니다.</li>
      </ul>
      <h3>동적 속성</h3>
      <ul>
        <li>Nuclo는 자신이 마지막으로 쓴 값과 다를 때만 값을 씁니다. 실제 DOM과는 비교하지 않기 때문에, 사용자가 입력창에 글자를 입력한 뒤 함수가 이전과 같은 값을 반환하면 입력한 글자가 그대로 남습니다.</li>
        <li>결과가 <code>null</code>이나 <code>undefined</code>면 아무것도 쓰지 않으니 이전 값이 남습니다. 예외는 <code>className</code>으로, falsy 값을 반환하면 동적 클래스만 제거하고 정적 클래스는 유지합니다.</li>
        <li><code>style</code> 함수는 업데이트할 때마다 반환된 객체를 적용합니다.</li>
      </ul>
      <h3>오류</h3>
      <p>동적 값에서 오류가 나면 Nuclo가 잡아 두고 나머지 업데이트를 이어 갑니다. 텍스트는 비거나 이전 값을 유지하고, 속성은 이전 값을 유지합니다. 다음 <code>update()</code>에서 함수가 정상적으로 실행되면 둘 다 복구됩니다. 단 하나의 예외는 <strong>첫 번째</strong> 실행에서 오류가 난 텍스트 함수로, 이 경우에는 영영 빈 텍스트로 남습니다.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>페이지의 모든 동적 값을 동기적으로 한 번씩 평가합니다. id를 넘기면 그 id가 붙은 <a href="#api-scope"><code>scope()</code></a> 요소 안쪽만 갱신합니다. 한 번의 실행은 다음 순서로 진행됩니다.</p>
      <ol>
        <li><code>list()</code>: 항목을 다시 읽고 행을 추가, 이동, 제거합니다.</li>
        <li><code>when()</code>: 조건을 다시 평가합니다. 다른 분기가 활성화될 때만 분기를 새로 만듭니다.</li>
        <li><code>style</code>, <code>className</code>을 포함한 동적 속성.</li>
        <li>동적 텍스트.</li>
        <li>1, 2단계에서 삽입된 요소의 <code>onMount</code> 실행.</li>
      </ol>
      <ul>
        <li><strong>전부 실행합니다.</strong> 데이터가 바뀌지 않았더라도 모든 동적 값이 호출될 때마다 실행되고, 건너뛰는 건 DOM 쓰기뿐입니다. 동적 값 함수는 빠르고 부수 효과가 없게 작성하세요.</li>
        <li><strong>문서 안에 있는 노드만.</strong> <code>update()</code>가 실행될 때 문서에 없는 노드는 Nuclo가 추적을 멈추고, 나중에 붙여도 다시 갱신되지 않습니다. <code>list()</code>와 <code>when()</code>도 마찬가지이니, 문서 안에 있는 컨테이너에 렌더링하세요.</li>
        <li><strong>정적 값은 바뀌지 않습니다.</strong> 일반 문자열과 속성 값은 요소를 만들 때 고정됩니다. 다시 만들려면 <a href="#api-force-update"><code>forceUpdate()</code></a>를 쓰세요.</li>
        <li><strong>오류.</strong> 텍스트와 속성 함수의 오류는 잡아 두고 나머지를 계속 진행합니다. <code>when()</code> 조건에서 오류가 나면 기록한 뒤 그 <code>when()</code>의 갱신을 멈춥니다. <code>list()</code>의 <code>items</code>나 <code>renderItem</code> 함수에서 오류가 나면 <code>update()</code> 호출자에게 그대로 전파되고 이후 단계는 실행되지 않습니다.</li>
        <li><strong>서버.</strong> 서버에서 <code>update()</code>는 아무 일도 하지 않습니다.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>넘겨받은 요소에 scope id를 하나 이상 붙입니다. 그러면 <code>update('id')</code>는 그 요소 안쪽만, 요소 자신의 속성까지 포함해서 갱신합니다.</p>
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
        <li>요소 하나에 <code>scope('cart', 'sidebar')</code>처럼 id를 여러 개 붙일 수 있습니다.</li>
        <li><code>update('a', 'b')</code>는 <code>a</code>나 <code>b</code> 안쪽 전체를 갱신합니다. 여러 요소가 같은 id를 쓰면 모두 갱신됩니다.</li>
        <li>scope가 중첩되어 있으면 <code>update('outer')</code>는 안쪽 scope까지 포함하고, <code>update('inner')</code>는 바깥에 손대지 않습니다.</li>
        <li>문서 어디에도 없는 id를 넘기면 <strong>아무것도</strong> 갱신되지 않고 오류도 나지 않으니, 철자를 꼭 확인하세요.</li>
        <li>서버에서 <code>scope()</code>는 아무 일도 하지 않습니다.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>조건에 따라 보여 줄 내용을 정합니다. <code>update()</code>가 호출될 때마다 조건을 다시 확인해서 처음으로 참이 되는 분기를 고르고, 참인 조건이 없으면 <code>.else()</code>의 내용을, 그것도 없으면 아무것도 렌더링하지 않습니다.</p>
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
        <li>상태에 따라 달라지는 조건은 함수로 넘기세요. 일반 boolean은 한 번만 읽기 때문에 <code>when(open, …)</code>은 절대 바뀌지 않습니다.</li>
        <li>TypeScript에서는 함수가 boolean을 반환해야 합니다. <code>() =&gt; items.length &gt; 0</code>이나 <code>() =&gt; user != null</code>처럼 쓰세요.</li>
      </ul>
      <h3>업데이트되는 내용</h3>
      <ul>
        <li>같은 분기가 계속 활성 상태인 동안에는 그 요소들이 그대로 유지되고, 안에 있는 동적 값, 목록, <code>when()</code> 블록도 계속 갱신됩니다.</li>
        <li>다른 분기가 활성화되면 이전 내용이 제거되면서 <code>onDestroy</code> 훅이 실행되고, 새 분기는 처음부터 새로 만들어지며 <code>onMount</code> 훅이 실행됩니다. 입력 텍스트나 포커스처럼 이전 요소가 갖고 있던 상태는 사라집니다.</li>
      </ul>
      <h3>분기 내용</h3>
      <p>분기에는 텍스트, 동적 텍스트, 빌더, <code>list()</code>, 중첩된 <code>when()</code>을 넣을 수 있습니다. DOM 노드가 아니라 <code>p('Hi')</code> 같은 빌더를 넘기세요. DOM 노드는 분기가 한 번 숨겨지고 나면 갱신되지 않습니다.</p>
      <p>분기 안의 속성 객체와 <code>on()</code>은 부모 요소에 적용되고, 분기가 숨겨진 뒤에도 남습니다. 조건부 속성이 필요하면 동적 속성을 쓰세요. <code>{ className: () =&gt; (active ? 'active' : '') }</code>처럼요.</p>
      <h3>체인 연결</h3>
      <p><code>.when()</code>과 <code>.else()</code>는 원본을 바꾸지 않고 새 빌더를 반환합니다. <code>.else()</code>를 두 번 호출하면 마지막 호출이 적용됩니다.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>항목 하나당 행 하나를 렌더링합니다. <code>update()</code>가 호출될 때마다 Nuclo는 <code>items()</code>를 다시 호출해서, 새 항목을 동일성(<code>===</code>) 기준으로 기존 행과 짝지어 줍니다.</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>행 일치 방법</h3>
      <ul>
        <li>계속 남아 있는 항목은 자기 행을 유지합니다. 필요하면 Nuclo가 행을 옮기지만 <code>renderItem</code>을 다시 호출하지는 않습니다.</li>
        <li>새 항목은 새 행을 받고, 사라진 항목은 행을 잃으면서 <code>onDestroy</code> 훅이 실행됩니다.</li>
        <li>중복된 항목도 각자 자기 행을 갖습니다.</li>
        <li>배열을 그 자리에서 바꿔도(<code>push</code>, <code>splice</code>, <code>sort</code>) 되고, 새 배열을 반환해도 됩니다.</li>
      </ul>
      <p>유지된 행은 다시 렌더링되지 않으니, 바뀌는 필드에는 동적 값을 쓰세요.</p>
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
      <p>복사본은 새 항목이므로, 배열을 <code>todos.map((t) =&gt; ({ ...t }))</code>로 통째로 바꾸면 모든 행이 다시 만들어집니다.</p>
    `,
        afterContent: `
      <h3><code>renderItem</code>이 반환하는 것</h3>
      <ul>
        <li>요소 하나를 반환하세요. <code>li(...)</code>, <code>tr(...)</code>, SVG 빌더 등이 해당합니다. 항목을 건너뛰고 싶다면 <code>null</code>이나 <code>undefined</code>를 반환하세요. 문자열, 텍스트 노드, 프래그먼트는 아무것도 렌더링하지 않습니다.</li>
        <li><code>when()</code>이나 <code>list()</code>를 곧바로 반환하지 말고 행 요소 안에 넣으세요. <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>처럼요.</li>
        <li>항목을 숨기고 싶다면 <code>renderItem</code>이 아니라 <code>items()</code>에서 걸러 내세요.</li>
        <li><code>renderItem</code>에는 부수 효과를 두지 마세요. Nuclo는 같은 항목에 대해 두 번 이상 호출할 수 있습니다.</li>
      </ul>
      <h3>인덱스</h3>
      <p><code>index</code>는 행이 만들어진 시점의 항목 위치이고, 행이 이동해도 갱신되지 않습니다. 현재 위치가 필요하면 동적 값을 쓰세요. <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>처럼요.</p>
      <h3>이터러블</h3>
      <p>배열, <code>Set</code>, 제너레이터, <code>map.values()</code> 등 어떤 이터러블이든 쓸 수 있습니다. 매번 같은 배열이나 <code>Set</code>을 반환해도 괜찮습니다. 제너레이터나 <code>map.values()</code> 같은 이터레이터는 한 번 순회하면 소진되니, 호출할 때마다 <code>items()</code> 안에서 새로 만드세요. <code>Map</code>을 그대로 순회하면 매번 새 <code>[key, value]</code> 배열이 만들어져서 모든 행이 다시 만들어지니, 대신 <code>map.values()</code>를 쓰세요.</p>
      <h3>배치</h3>
      <p>행은 형제 노드들 사이에서 <code>list()</code>가 놓인 자리, 즉 두 주석 마커 사이에 들어갑니다. 부모의 다른 자식은 건드리지 않고, <code>list()</code>는 SVG 빌더 안에서도 동작합니다.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() 및 into()",
        content: `
      <p><code>region()</code>은 트리에 이름 붙은 자리를 만들고, <code>into()</code>는 트리의 어느 깊이에서든 그 자리를 채웁니다. 레이아웃이 props로 콘텐츠를 받을 필요도, 콘텐츠를 만드는 컴포넌트가 놓일 위치를 알 필요도 없습니다.</p>
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
        <li><code>into()</code>는 쓴 자리에 주석 하나만 남기고, 내용은 영역의 마커 사이에 렌더링됩니다.</li>
        <li>순서는 상관없습니다. 영역보다 먼저 만들어진 <code>into()</code>는 기다렸다가, 영역이 만들어지는 순간 나타납니다. 뷰는 작성된 순서대로 표시됩니다.</li>
        <li>내용은 뷰와 수명을 같이합니다. <code>into()</code>를 품은 <code>when()</code>이 닫히거나 그 <code>list()</code> 행이 제거되면 내용도 영역을 떠납니다. 다시 열면 두 개가 아니라 하나만 추가됩니다.</li>
        <li>영역이 사라지면(예를 들어 영역을 품은 <code>when()</code>이 닫히면) 그 뷰들은 다시 대기 상태가 되고, 나중에 같은 id로 만들어지는 영역이 이를 보여 줍니다.</li>
        <li>어떤 영역과도 id가 맞지 않는 <code>into()</code>는 아무것도 렌더링하지 않고 오류도 내지 않으니 철자를 확인하세요.</li>
        <li>id는 트리 안에서 유일해야 합니다. 이미 살아 있는 id로 두 번째 영역을 만들면 경고를 기록합니다.</li>
        <li>영역은 <a href="#api-ssr">서버 렌더링</a>과도 함께 동작합니다. <code>hydrate()</code> 때 각 뷰는 서버가 렌더링한 HTML을 새로 만들지 않고 그대로 이어받습니다.</li>
      </ul>
      <h3>옵션</h3>
      <ul>
        <li><code>id</code>: <code>into()</code> 호출이 영역을 찾을 때 쓰는 이름입니다.</li>
        <li><code>type</code>: <code>'latest'</code>(기본값)는 가장 최근 뷰 하나만 보여 주고, <code>'stack'</code>은 도착한 순서대로 모든 뷰를 보여 줍니다.</li>
        <li><code>empty</code>: 영역에 뷰가 하나도 없는 동안 렌더링됩니다.</li>
      </ul>
      <h3>누적 영역</h3>
      <p><code>type: 'stack'</code>을 쓰면 다른 뷰 위에 열린 뷰가 아래 뷰를 다시 만들지 않습니다. DOM, 포커스, 폼 입력값이 그대로 유지됩니다. 페이지 위에 올라가는 대화 상자 같은 레이어에 쓰세요.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>여러 영역을 동시에</h3>
      <p>객체를 넘기면 <code>into()</code> 하나로 여러 영역을 채울 수 있습니다. 값은 자식 하나여도, 자식 배열이어도 됩니다. 두 형태 모두 중첩할 수 있어서, 다른 뷰의 내용 안에 있는 <code>into()</code>도 자기가 지정한 영역을 채웁니다.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>트리 깊은 곳에서 열린 대화 상자</h3>
      <p>오버레이 영역은 루트에 둡니다. 어느 깊이에 있는 컴포넌트든 <code>into()</code>를 <code>when()</code>으로 감싸 대화 상자를 열 수 있고, <code>when()</code>이 닫히면 대화 상자도 영역에서 사라집니다.</p>
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
      <p><code>list()</code>의 각 행은 하나의 뷰입니다. 스택 영역은 이 뷰들을 순서대로 보여 주고, 배열에서 항목을 빼면 해당 토스트도 사라집니다.</p>
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
      <h3>페이지가 직접 정하는 제목</h3>
      <p>기본값인 <code>type: 'latest'</code>에서는 가장 최근 뷰가 이깁니다. 제목 영역은 레이아웃이 갖고, 열려 있는 페이지가 그 제목을 정합니다. <code>into('title', …)</code>가 없는 페이지에서는 <code>empty</code> 텍스트가 남습니다.</p>
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
      <p><code>into()</code>의 내용은 평범한 Nuclo 콘텐츠입니다. 그 안의 함수는 상태에 따라 달라지는 값이므로, 영역이 어디에 있든 <code>update()</code>에서 갱신됩니다.</p>
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
      <h3>동적으로 나타나고 사라지는 영역</h3>
      <p>대시보드의 <code>into()</code>는 한 번만 작성합니다. 사용자가 로그아웃해 있는 동안에는 <code>main</code> 영역이 없으므로 뷰는 기다립니다. 로그인하면 영역이 만들어지면서 뷰가 나타나고, 다시 로그아웃하면 영역이 사라져 뷰는 또 기다립니다.</p>
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
      <h3>자체 영역이 포함된 뷰</h3>
      <p>뷰 안에 <code>region()</code>을 둘 수 있고, 다른 뷰가 그 영역을 대상으로 삼을 수도 있습니다. 아래에서는 에디터 페이지가 <code>tabs</code> 영역을 함께 가져오고, 각 탭이 그 영역을 채웁니다. 에디터가 닫히면 영역도 같이 사라집니다.</p>
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
      <p><code>update()</code>는 동적 값만 실행합니다. <code>h1(labels[lang].title)</code> 같은 정적 값은 트리를 만들 때 고정되죠. <code>forceUpdate()</code>는 컴포넌트를 다시 호출해, 정적 값까지 새 결과에 맞춰 실제 DOM을 갱신합니다. 언어 전환처럼 앱 전체가 드물게 바뀌는 경우에만 쓰고, 나머지는 <code>update()</code>로 충분합니다.</p>
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
      <p>인수 없이 호출하면 <code>forceUpdate()</code>는 <code>render(App)</code>이나 <code>hydrate(App)</code>으로 렌더링한 모든 루트를 다시 만듭니다. <code>render(App())</code>으로 렌더링한 루트는 건너뜁니다. 컴포넌트가 오류를 던지면 오류를 기록하고 그 루트는 기존 DOM을 그대로 둡니다. 새 결과를 적용하다가 중간에 오류가 나도 기록은 하지만, 이미 반영된 부분은 그대로 남습니다.</p>
      <h3>남는 것과 변화하는 것</h3>
      <ul>
        <li>자식은 태그 기준으로 순서대로 짝지어집니다. 짝이 맞는 요소는 재사용되므로 포커스와 입력값이 유지되고 <code>onMount</code> 훅도 다시 실행되지 않습니다. 어느 한 자식의 태그가 달라지면 그 자식과 뒤따르는 형제들은 전부 새로 만듭니다.</li>
        <li>텍스트, 속성, 클래스, 스타일, 리스너, <code>when()</code> 분기, <code>list()</code> 행은 새로 빌드한 결과를 따릅니다.</li>
        <li>새 요소는 만들어지면서 <code>onMount</code> 훅이 실행되고, 새 빌드에서 더는 만들지 않는 요소는 제거되면서 <code>onDestroy</code> 훅이 실행됩니다.</li>
        <li><code>list()</code> 행도 항목이 아니라 위치로 짝지어지기 때문에, 재사용된 행 요소가 다른 항목을 보여 주게 될 수 있습니다.</li>
        <li>새 빌드에서 더는 설정하지 않는 속성이라도 제거되지는 않습니다.</li>
      </ul>
      <div class="docs-callout"><strong>주의:</strong> 컴포넌트 함수 안에서 선언한 상태는 함수가 다시 실행되므로 초기화됩니다. 유지해야 하는 상태는 컴포넌트 바깥에 두세요.</div>
      <p><strong>명시적 호출 형태.</strong> <code>forceUpdate(App(), parent)</code>는 <code>parent</code> 안의 트리 하나를 다시 만들고 그 루트를 반환합니다. 이후 호출을 위해 루트를 등록하지는 않습니다. <code>hydrate()</code>처럼 루트가 <code>parent</code>의 첫 번째 노드일 것으로 가정하며, 첫 노드의 태그가 다르면 교체됩니다.</p>
      <p>서버에서 <code>forceUpdate()</code>는 아무 일도 하지 않습니다.</p>
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
      <p>트리를 만들어 루트 요소를 <code>parent</code>에 붙이고, 그 루트 요소를 반환합니다. <code>parent</code>의 기본값은 <code>document.body</code>입니다.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>컴포넌트(<code>render(App)</code>)와 그 컴포넌트가 반환하는 빌더(<code>render(App())</code>) 중 무엇을 넘겨도 만들어지는 DOM은 같습니다. 나중에 <a href="#api-force-update"><code>forceUpdate()</code></a>가 루트를 다시 만들 수 있는 건 <code>render(App)</code> 쪽뿐이니 이쪽을 권장합니다.</li>
        <li>기존 내용 뒤에 덧붙입니다. <code>parent</code>를 비우지 않으니, 두 번 호출하면 복사본이 두 개 생깁니다.</li>
        <li><code>render()</code>가 반환될 때 트리의 <code>onMount</code>는 전부 실행을 마친 상태입니다.</li>
        <li>문서 안에 있는 요소에 렌더링하세요. <a href="#api-update"><code>update()</code></a>를 참고하세요.</li>
        <li>루트는 <code>div(...)</code> 같은 요소여야 하고, <code>when()</code>이나 <code>list()</code>는 안 됩니다.</li>
        <li><code>index</code>는 내부용이며 요소가 삽입될 위치를 고르는 값이 아닙니다. 생략하세요.</li>
      </ul>
      <p><code>render(App)</code>으로 넘기는 컴포넌트는 매개변수를 받지 않아야 합니다. 필수 매개변수는 타입 오류이고, 선택 매개변수는 타입 검사는 통과하지만 런타임에 <code>render()</code>가 오류를 던집니다. props를 받는 컴포넌트는 감싸서 넘기세요.</p>
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
      <p><a href="#api-ssr"><code>renderToString()</code></a>이 만든 HTML에 클라이언트 동작을 입힙니다. 기존 요소를 재사용하면서 이벤트 리스너, 동적 값, <code>when()</code>, <code>list()</code>를 연결하므로 이후 <code>update()</code>가 정상적으로 동작하고, 마지막에 <code>onMount</code> 훅이 실행됩니다. <code>parent</code>의 기본값은 <code>document.body</code>이며, 루트 요소를 반환합니다.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>서버와 같은 컴포넌트, 같은 데이터를 쓰세요.</li>
        <li>전용 컨테이너에 하이드레이션하세요. 공백은 괜찮지만 앱의 루트가 첫 번째 노드여야 합니다. 다른 노드가 먼저 있으면 Nuclo가 그 노드를 교체하고, 서버가 만든 복사본은 그대로 남습니다.</li>
        <li><code>render()</code>와 마찬가지로 <code>App()</code>이 아니라 <code>App</code>을 넘겨야 나중에 <code>forceUpdate()</code>가 루트를 다시 만들 수 있습니다. <code>App</code>은 매개변수를 받지 않아야 하며, 선택 매개변수가 있어도 <code>hydrate()</code>는 아무것도 연결하지 않고 조용히 끝납니다. props를 받는 컴포넌트는 감싸서 넘기세요. <code>hydrate(() =&gt; Page(props), root)</code>처럼요.</li>
        <li>서버가 렌더링한 HTML이 없다면 <code>render()</code>를 쓰세요.</li>
      </ul>
      <h3>서버와 클라이언트가 다른 경우</h3>
      <p>어긋나면 클라이언트가 이깁니다.</p>
      <ul>
        <li>루트 태그가 다르면 그 노드를 새 DOM으로 교체하고, 컨테이너가 비어 있으면 새 DOM을 덧붙입니다.</li>
        <li>텍스트가 다르면 고쳐 줍니다. <code>list()</code> 항목이나 <code>when()</code> 분기가 다르면 클라이언트 쪽을 따릅니다.</li>
        <li>서버 HTML에만 있는 자식은 제거하고, 빠진 자식은 새로 만듭니다.</li>
        <li>서버가 썼지만 클라이언트가 설정하지 않는 속성은 그대로 둡니다.</li>
      </ul>
      <p><code>renderToString()</code>은 텍스트 노드마다 앞에 <code>&lt;!-- text-0 --&gt;</code> 같은 HTML 주석을 마커로 남깁니다. <code>hydrate()</code>에는 이 주석이 필요하니 서버 HTML에서 주석을 지우지 마세요. 마커가 없으면 하이드레이션이 <code>list()</code> 행을 삭제하고, <code>list()</code>와 <code>when()</code>이 더 이상 갱신되지 않습니다.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "서버 렌더링",
        content: `
      <p>서버에서 컴포넌트를 HTML 문자열로 렌더링합니다. 브라우저에서는 같은 컴포넌트로 <a href="#api-hydrate"><code>hydrate()</code></a>를 호출해 그 HTML에 동작을 입힙니다. 서버 런타임에는 <code>document</code>가 없으니 먼저 <a href="#api-polyfill"><code>nuclo/polyfill</code></a>을 import하세요.</p>
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
      <p>스타일 태그의 <code>id="nuclo-styles"</code>는 그대로 두세요. 클라이언트가 그 요소를 재사용하면서 새 규칙만 추가합니다. <a href="#api-css-text"><code>getCssText()</code></a>를 참고하세요.</p>
      <h3>서버에서 실행되는 것</h3>
      <ul>
        <li><code>renderToString()</code>을 호출할 때마다 트리를 만들고 동적 값을 각각 한 번씩 실행합니다.</li>
        <li>이벤트 핸들러, <code>onMount</code>, <code>onDestroy</code>는 절대 실행되지 않고, <code>update()</code>, <code>scope()</code>, <code>forceUpdate()</code>는 아무 일도 하지 않습니다.</li>
        <li>렌더링은 동기식입니다. 데이터를 먼저 불러온 다음 렌더링하세요.</li>
        <li>렌더링이 끝나면 등록된 상태가 남지 않아서 프로세스 하나로 여러 요청을 처리할 수 있습니다. 요청 데이터는 <code>renderToString(Page(user))</code>처럼 인수로 넘기세요. 모듈 최상위 변수는 모든 요청이 공유합니다.</li>
        <li>서버에서는 <code>render()</code>를 호출하지 마세요. 모두가 공유하는 <code>document.body</code>에 덧붙게 됩니다.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>빌더(<code>App()</code>), 컴포넌트(<code>App</code>), DOM 노드를 받습니다. <code>null</code>과 <code>undefined</code>는 <code>""</code>를 반환하고, 루트는 요소여야 합니다. <code>renderToString(Page)</code>처럼 넘기는 컴포넌트는 매개변수를 받지 않아야 하므로, 데이터가 필요하다면 <code>Page(user)</code>를 넘기세요.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>텍스트와 속성 값은 HTML 이스케이프됩니다. 다만 <code>script()</code>와 <code>style()</code> 안의 텍스트는 닫는 태그만 쪼개고 나머지는 그대로 출력하므로, 거기에는 사용자 입력을 절대 넣지 마세요.</li>
        <li>예외를 던지지 않습니다. 컴포넌트, <code>list()</code> 함수, <code>when()</code> 조건이 오류를 던지거나 polyfill이 없으면 오류를 기록하고 <code>""</code>를 반환합니다. 렌더링 실패 시 요청도 실패시켜야 한다면 결과가 비어 있는지 확인하세요. 텍스트나 속성 함수가 던진 오류는 그 부분만 빈 값으로 렌더링됩니다.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p><code>inputs.map(renderToString)</code>과 같습니다.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>출력을 요소 하나로 감쌉니다. <code>containerTag</code>의 기본값은 <code>"div"</code>, <code>containerAttrs</code>의 기본값은 <code>{}</code>입니다. 속성 값은 이스케이프되지만 속성 이름은 받은 그대로 출력되므로 <code>class</code> 같은 HTML 이름을 쓰세요. 사용자 입력을 태그로 넘기지 마세요.</p>
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
      <p>Node.js와 Bun에서도 Nuclo가 트리를 만들 수 있게 해 주는 작은 DOM 구현입니다. 첫 렌더링 전에 한 번만 import하세요. 대부분의 앱은 side-effect import 한 줄이면 충분합니다.</p>
      <ul>
        <li><code>window</code>가 없을 때 <code>globalThis.document</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code>를 설정하되, 없는 것만 채웁니다. <code>window</code> 자체는 만들지 않습니다.</li>
        <li>브라우저나 jsdom에서는 아무 일도 하지 않습니다.</li>
        <li><code>Event</code>와 <code>CustomEvent</code>는 런타임이 제공하는 생성자를 그대로 씁니다. <code>Node</code>, <code>Element</code>, <code>HTMLElement</code>는 polyfill 클래스의 별칭입니다.</li>
      </ul>
      <p>브라우저가 아니라 트리를 만들기 위한 DOM입니다. <code>innerHTML</code>도 <code>getElementById</code>도 없고, <code>querySelector()</code>는 <code>null</code>을 반환하며, 이벤트 리스너는 무시됩니다. HTML이 필요하면 <code>renderToString()</code>을 쓰세요.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
