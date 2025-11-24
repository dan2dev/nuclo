(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const d of s)if(d.type==="childList")for(const m of d.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&l(m)}).observe(document,{childList:!0,subtree:!0});function n(s){const d={};return s.integrity&&(d.integrity=s.integrity),s.referrerPolicy&&(d.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?d.credentials="include":s.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function l(s){if(s.ep)return;s.ep=!0;const d=n(s);fetch(s.href,d)}})();function Z(e){return e===null||typeof e!="object"&&typeof e!="function"}function V(e){return e instanceof Node}function H(e){return typeof e=="object"&&e!==null}function ye(e){return H(e)&&"tagName"in e}function A(e){return typeof e=="function"}function Ne(e){return A(e)&&e.length===0}function K(e,o){try{return e()}catch{return o}}const W=typeof window<"u"&&typeof document<"u";function Ee(e){if(!e?.parentNode)return!1;try{return e.parentNode.removeChild(e),!0}catch{return!1}}function he(e){if(!W)return null;try{return document.createComment(e)}catch{return null}}function fe(e){return he(e)}function O(e,o="hidden"){try{return document.createComment(`conditional-${e}-${o}`)}catch{return null}}function Ge(e){if(!W)throw Error("Cannot create comment in non-browser environment");const o=he(`${e}-${Math.random().toString(36).slice(2)}`);if(!o)throw Error("Failed to create comment");return o}function ze(e){const o=he(e+"-end");if(!o)throw Error("Failed to create end comment");return{start:Ge(e+"-start"),end:o}}function be(e){return!!e&&(typeof e.isConnected=="boolean"?e.isConnected:!(!W||typeof document>"u")&&document.contains(e))}function xe(e,o){if(!e?.parentNode)return!1;try{return e.parentNode.replaceChild(o,e),!0}catch{return!1}}const se=new Map,q=new Map;function Ae(e,o){o.attributeResolvers.forEach(({resolver:n,applyValue:l},s)=>{try{l(K(n))}catch{}})}function ee(e,o,n,l){if(!(e instanceof Element&&o&&typeof n=="function"))return;const s=(function(d){let m=q.get(d);return m||(m={attributeResolvers:new Map},q.set(d,m)),m})(e);s.attributeResolvers.set(o,{resolver:n,applyValue:l});try{l(K(n))}catch{}if(!s.updateListener){const d=()=>Ae(0,s);e.addEventListener("update",d),s.updateListener=d}}function Qe(e,o,n){try{return n==null||n===""?(e.style[o]="",!0):(e.style[o]=n+"",!0)}catch{return!1}}function ve(e,o){if(e?.style&&o)for(const[n,l]of Object.entries(o))Qe(e,n,l)||void 0}const Se="__nuclo_reactive_className__",L="__nuclo_static_className__";function Ve(e,o,n,l=!1){if(n==null)return;if(o==="style")return d=n,void((s=e)&&(A(d)?ee(s,"style",()=>{try{return d()}catch{return null}},f=>{ve(s,f)}):ve(s,d)));var s,d;const m=(f,b=!1)=>{if(f!=null)if(o==="className"&&e instanceof HTMLElement&&b)(function(y,g){if(!g)return;const u=y.className;if(u&&u!==g){const x=new Set(u.split(" ").filter(w=>w));g.split(" ").filter(w=>w).forEach(w=>x.add(w)),y.className=Array.from(x).join(" ")}else y.className=g})(e,f+"");else if(e instanceof Element&&e.namespaceURI==="http://www.w3.org/2000/svg")e.setAttribute(o+"",f+"");else if(o in e)try{e[o]=f}catch{e instanceof Element&&e.setAttribute(o+"",f+"")}else e instanceof Element&&e.setAttribute(o+"",f+"")};if(A(n)&&n.length===0){const f=n;o==="className"&&e instanceof HTMLElement?((function(b){b[L]||(b[L]=new Set(b.className.split(" ").filter(y=>y))),b[Se]=!0})(e),ee(e,o+"",f,b=>{(function(y,g){const u=(function(x){return x[L]})(y);if(u&&u.size>0&&g){const x=new Set(u);g.split(" ").filter(w=>w).forEach(w=>x.add(w)),y.className=Array.from(x).join(" ")}else y.className=g||(u&&u.size>0?Array.from(u).join(" "):"")})(e,(b||"")+"")})):ee(e,o+"",f,b=>{m(b,!1)})}else{if(o==="className"&&e instanceof HTMLElement&&(function(f){return!!f[Se]})(e)){const f=(n||"")+"";if(f){(function(y,g){g&&(y[L]||(y[L]=new Set),g.split(" ").filter(u=>u).forEach(u=>{y[L].add(u)}))})(e,f);const b=new Set(e.className.split(" ").filter(y=>y));f.split(" ").filter(y=>y).forEach(y=>b.add(y)),e.className=Array.from(b).join(" ")}return}m(n,l)}}function te(e,o,n=!0){if(o)for(const l of Object.keys(o))Ve(e,l,o[l],n&&l==="className")}const M=new WeakMap;function _e(e,o,n){if(!A(e)||e.length!==0||!(function(s){const{value:d,error:m}=(function(f){const b=M.get(f);if(b)return b;try{const y={value:f(),error:!1};return M.set(f,y),y}catch{const y={value:void 0,error:!0};return M.set(f,y),y}})(s);return!m&&typeof d=="boolean"})(e))return!1;const l=o.filter((s,d)=>d!==n);return l.length!==0&&l.some(s=>!!(H(s)||V(s)||A(s)&&s.length>0))}function _(e,o,n){if(o==null)return null;if(A(o)){if(Ne(o))try{let d=M.get(o);if(d||(d={value:o(),error:!1},M.set(o,d)),d.error)return oe(n,()=>"");const m=d.value;if(H(m)&&!V(m)&&"className"in m&&typeof m.className=="string"&&Object.keys(m).length===1){const f=o;return te(e,{className:()=>f().className}),null}return Z(m)&&m!=null?oe(n,o,m):null}catch{return M.set(o,{value:void 0,error:!0}),oe(n,()=>"")}const s=o(e,n);return s==null?null:Z(s)?we(n,s):V(s)?s:(H(s)&&te(e,s),null)}const l=o;return l==null?null:Z(l)?we(n,l):V(l)?l:(H(l)&&te(e,l),null)}function oe(e,o,n){const l=document.createDocumentFragment(),s=fe(` text-${e} `);s&&l.appendChild(s);const d=(function(m,f){if(typeof m!="function")return document.createTextNode("");const b=arguments.length>1?f:K(m,""),y=b===void 0?"":b+"",g=document.createTextNode(y);return se.set(g,{resolver:m,lastValue:y}),g})(o,n);return l.appendChild(d),l}function we(e,o){const n=document.createDocumentFragment(),l=fe(` text-${e} `);l&&n.appendChild(l);const s=document.createTextNode(o+"");return n.appendChild(s),n}const le=new Set;function j(e,o){e._conditionalInfo=o,le.add(e)}function X(e,o,n=0){if(!o||o.length===0)return{element:e,nextIndex:n,appended:0};let l=n,s=0;const d=e;for(let m=0;o.length>m;m+=1){const f=o[m];if(f==null)continue;const b=_(e,f,l);b&&(b.parentNode!==d&&d.appendChild(b),l+=1,s+=1)}return{element:e,nextIndex:l,appended:s}}function ce(e,o){const n=document.createElement(e);return X(n,o,0),n}function de(e,o){const n=document.createElementNS("http://www.w3.org/2000/svg",e);return X(n,o,0),n}function qe(e){return(...o)=>(function(n,...l){return(s,d)=>{const{condition:m,otherModifiers:f}=(function(y){const g=(function(u){for(let x=0;u.length>x;x+=1)if(_e(u[x],u,x))return x;return-1})(y);return g===-1?{condition:null,otherModifiers:y}:{condition:y[g],otherModifiers:y.filter((u,x)=>x!==g)}})(l);if(m)return(function(y,g,u){const x=g();if(!W)return x?ce(y,u):O(y,"ssr");const w={condition:g,tagName:y,modifiers:u,isSvg:!1};if(x){const P=ce(y,u);return j(P,w),P}const C=O(y);if(!C)throw Error("Failed to create conditional comment for "+y);return j(C,w),C})(n,m,f);const b=document.createElement(n);return X(b,f,d),b}})(e,...o)}function Ye(e){return(...o)=>(function(n,...l){return(s,d)=>{const m=l.findIndex(b=>typeof b=="function"&&b.length===0);if(m!==-1){const b=l[m],y=l.filter((g,u)=>u!==m);return(function(g,u,x){const w=u();if(!W)return w?de(g,x):O(g,"ssr");const C={condition:u,tagName:g,modifiers:x,isSvg:!0};if(w){const I=de(g,x);return j(I,C),I}const P=O(g);if(!P)throw Error("Failed to create conditional comment for "+g);return j(P,C),P})(n,b,y)}const f=document.createElementNS("http://www.w3.org/2000/svg",n);return X(f,l,d),f}})(e,...o)}const Je=["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","menu","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","script","search","section","select","slot","small","source","span","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u","ul","var","video","wbr"],Ke=["a","animate","animateMotion","animateTransform","circle","clipPath","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","foreignObject","g","image","line","linearGradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialGradient","rect","script","set","stop","style","svg","switch","symbol","text","textPath","title","tspan","use","view"];function Xe(e=globalThis){const o="__nuclo_tags_registered";e[o]||(Ke.forEach(n=>(function(l,s){const d=s+"Svg";d in l||(l[d]=Ye(s))})(e,n)),Je.forEach(n=>(function(l,s){s in l&&typeof l[s]!="function"||(l[s]=qe(s))})(e,n)),e[o]=!0)}const pe=new Set;function Ze(e,o,n){return(function(l,s,d){if(A(l)){const m=l(s,d);return m&&ye(m)?m:null}return l&&ye(l)?l:null})(e.renderItem(o,n),e.host,n)}function et(e){Ee(e.element)}function Me(e){const{host:o,startMarker:n,endMarker:l}=e,s=n.parentNode??o,d=e.itemsProvider();if((function(u,x){if(u===x)return!0;if(u.length!==x.length)return!1;for(let w=0;u.length>w;w++)if((w in u?u[w]:void 0)!==(w in x?x[w]:void 0))return!1;return!0})(e.lastSyncedItems,d))return;const m=new Map,f=new Map;e.records.forEach(u=>{const x=f.get(u.item);x?x.push(u):f.set(u.item,[u])}),d.forEach((u,x)=>{if(e.lastSyncedItems.length>x&&e.lastSyncedItems[x]===u){const w=e.records[x];if(w&&w.item===u){m.set(x,w);const C=f.get(u);if(C){const P=C.indexOf(w);0>P||(C.splice(P,1),C.length===0&&f.delete(u))}}}});const b=[],y=new Set(e.records);let g=l;for(let u=d.length-1;u>=0;u--){const x=d[u];let w=m.get(u);if(!w){const P=f.get(x);P&&P.length>0&&(w=P.shift(),P.length===0&&f.delete(x))}if(w)y.delete(w);else{const P=Ze(e,x,u);if(!P)continue;w={item:x,element:P}}b.unshift(w);const C=w.element;C.nextSibling!==g&&s.insertBefore(C,g),g=C}y.forEach(et),e.records=b,e.lastSyncedItems=[...d]}function tt(e,o){return(n,l)=>(function(d,m,f){const{start:b,end:y}=ze("list"),g={itemsProvider:d,renderItem:m,startMarker:b,endMarker:y,records:[],host:f,lastSyncedItems:[]},u=f;return u.appendChild(b),u.appendChild(y),pe.add(g),Me(g),g})(e,o,n).startMarker}function De(e,o){try{return e()}catch(n){if(o)return o(n),!1;throw n}}function ot(e,o){return typeof e=="function"?De(e,o):!!e}function rt(e,o,n,l){return A(e)?Ne(e)?(M.delete(e),_(o,e,n)):(function(s,d,m){const f=s,b=f.appendChild.bind(f),y=f.insertBefore.bind(f);f.appendChild=function(g){return y(g,d)};try{return m()}finally{f.appendChild=b}})(o,l,()=>{const s=_(o,e,n);return s&&!s.parentNode?s:null}):_(o,e,n)}const ue=new Set;function ke(e){const{groups:o,elseContent:n,host:l,index:s,endMarker:d}=e,m=(function(b,y){for(let g=0;b.length>g;g++)if(ot(b[g].condition))return g;return y.length>0?-1:null})(o,n);if(m===e.activeIndex||((function(b,y){let g=b.nextSibling;for(;g&&g!==y;){const u=g.nextSibling;Ee(g),g=u}})(e.startMarker,e.endMarker),e.activeIndex=m,m===null))return;const f=(function(b,y,g,u){const x=[];for(const w of b){const C=rt(w,y,g,u);C&&x.push(C)}return x})(0>m?n:o[m].content,l,s,d);(function(b,y){const g=y.parentNode;g&&b.forEach(u=>(function(x,w,C){if(!x||!w)return!1;try{return x.insertBefore(w,C),!0}catch{return!1}})(g,u,y))})(f,d)}class nt{groups=[];elseContent=[];constructor(o,...n){this.groups.push({condition:o,content:n})}when(o,...n){return this.groups.push({condition:o,content:n}),this}else(...o){return this.elseContent=o,this}render(o,n){if(!W)return fe("when-ssr")||null;const{start:l,end:s}=ze("when"),d={startMarker:l,endMarker:s,host:o,index:n,groups:[...this.groups],elseContent:[...this.elseContent],activeIndex:null,update:()=>ke(d)};(function(f){ue.add(f)})(d);const m=o;return m.appendChild(l),m.appendChild(s),ke(d),l}}function me(e){return Object.assign((o,n)=>e.render(o,n),{when:(o,...n)=>(e.when(o,...n),me(e)),else:(...o)=>(e.else(...o),me(e))})}function it(e,...o){return me(new nt(e,...o))}const at=[function(){pe.forEach(e=>{e.startMarker.isConnected&&e.endMarker.isConnected?Me(e):pe.delete(e)})},function(){ue.forEach(e=>{try{e.update()}catch{ue.delete(e)}})},function(){if(W)try{le.forEach(e=>{e.isConnected?(function(o){const n=(function(d){return d._conditionalInfo??null})(o);if(!n)return;const l=De(n.condition,d=>{}),s=o.nodeType===Node.ELEMENT_NODE;if(l&&!s){const d=(function(m){try{return m.isSvg?de(m.tagName,m.modifiers):ce(m.tagName,m.modifiers)}catch{return m.isSvg?document.createElementNS("http://www.w3.org/2000/svg",m.tagName):document.createElement(m.tagName)}})(n);j(d,n),xe(o,d)}else if(!l&&s){const d=O(n.tagName);d&&(j(d,n),xe(o,d))}})(e):(function(o){le.delete(o)})(e)})}catch{}},function(){q.forEach((e,o)=>{if(!be(o))return e.updateListener&&o.removeEventListener("update",e.updateListener),void q.delete(o);Ae(0,e)})},function(){se.forEach((e,o)=>{if(be(o))try{const n=K(e.resolver),l=n===void 0?"":n+"";l!==e.lastValue&&(o.textContent=l,e.lastValue=l)}catch{}else se.delete(o)})},function(){if(typeof document>"u")return;const e=document.body?[document.body,document]:[document];for(const o of e)try{o.dispatchEvent(new Event("update",{bubbles:!0}))}catch{}}];function st(){for(const e of at)e()}function lt(e,o,n){return l=>{if(!l||typeof l.addEventListener!="function")return;const s=l;s.addEventListener(e,d=>{try{o.call(s,d)}catch{}},n)}}function ct(e,o,n=0){const l=e(o||document.body,n);return(o||document.body).appendChild(l),l}const We=[{name:"display",cssProperty:"display"},{name:"grid",cssProperty:"display",defaultValue:"grid",isShorthand:!0},{name:"bg",cssProperty:"background-color"},{name:"color",cssProperty:"color"},{name:"accentColor",cssProperty:"accent-color"},{name:"fontSize",cssProperty:"font-size"},{name:"fontWeight",cssProperty:"font-weight"},{name:"fontFamily",cssProperty:"font-family"},{name:"lineHeight",cssProperty:"line-height"},{name:"letterSpacing",cssProperty:"letter-spacing"},{name:"textAlign",cssProperty:"text-align"},{name:"textDecoration",cssProperty:"text-decoration"},{name:"fontStyle",cssProperty:"font-style"},{name:"fontVariant",cssProperty:"font-variant"},{name:"fontStretch",cssProperty:"font-stretch"},{name:"textTransform",cssProperty:"text-transform"},{name:"textIndent",cssProperty:"text-indent"},{name:"textOverflow",cssProperty:"text-overflow"},{name:"textShadow",cssProperty:"text-shadow"},{name:"whiteSpace",cssProperty:"white-space"},{name:"wordSpacing",cssProperty:"word-spacing"},{name:"wordWrap",cssProperty:"word-wrap"},{name:"overflowWrap",cssProperty:"overflow-wrap"},{name:"textAlignLast",cssProperty:"text-align-last"},{name:"textJustify",cssProperty:"text-justify"},{name:"textDecorationLine",cssProperty:"text-decoration-line"},{name:"textDecorationColor",cssProperty:"text-decoration-color"},{name:"textDecorationStyle",cssProperty:"text-decoration-style"},{name:"textDecorationThickness",cssProperty:"text-decoration-thickness"},{name:"textUnderlineOffset",cssProperty:"text-underline-offset"},{name:"verticalAlign",cssProperty:"vertical-align"},{name:"position",cssProperty:"position"},{name:"padding",cssProperty:"padding"},{name:"paddingTop",cssProperty:"padding-top"},{name:"paddingRight",cssProperty:"padding-right"},{name:"paddingBottom",cssProperty:"padding-bottom"},{name:"paddingLeft",cssProperty:"padding-left"},{name:"margin",cssProperty:"margin"},{name:"marginTop",cssProperty:"margin-top"},{name:"marginRight",cssProperty:"margin-right"},{name:"marginBottom",cssProperty:"margin-bottom"},{name:"marginLeft",cssProperty:"margin-left"},{name:"width",cssProperty:"width"},{name:"height",cssProperty:"height"},{name:"minWidth",cssProperty:"min-width"},{name:"maxWidth",cssProperty:"max-width"},{name:"minHeight",cssProperty:"min-height"},{name:"maxHeight",cssProperty:"max-height"},{name:"boxSizing",cssProperty:"box-sizing"},{name:"top",cssProperty:"top"},{name:"right",cssProperty:"right"},{name:"bottom",cssProperty:"bottom"},{name:"left",cssProperty:"left"},{name:"zIndex",cssProperty:"z-index"},{name:"flexDirection",cssProperty:"flex-direction"},{name:"alignItems",cssProperty:"align-items"},{name:"justifyContent",cssProperty:"justify-content"},{name:"gap",cssProperty:"gap"},{name:"flexWrap",cssProperty:"flex-wrap"},{name:"flexGrow",cssProperty:"flex-grow"},{name:"flexShrink",cssProperty:"flex-shrink"},{name:"flexBasis",cssProperty:"flex-basis"},{name:"alignSelf",cssProperty:"align-self"},{name:"alignContent",cssProperty:"align-content"},{name:"justifySelf",cssProperty:"justify-self"},{name:"justifyItems",cssProperty:"justify-items"},{name:"gridTemplateColumns",cssProperty:"grid-template-columns"},{name:"gridTemplateRows",cssProperty:"grid-template-rows"},{name:"gridTemplateAreas",cssProperty:"grid-template-areas"},{name:"gridColumn",cssProperty:"grid-column"},{name:"gridRow",cssProperty:"grid-row"},{name:"gridColumnStart",cssProperty:"grid-column-start"},{name:"gridColumnEnd",cssProperty:"grid-column-end"},{name:"gridRowStart",cssProperty:"grid-row-start"},{name:"gridRowEnd",cssProperty:"grid-row-end"},{name:"gridArea",cssProperty:"grid-area"},{name:"gridAutoColumns",cssProperty:"grid-auto-columns"},{name:"gridAutoRows",cssProperty:"grid-auto-rows"},{name:"gridAutoFlow",cssProperty:"grid-auto-flow"},{name:"border",cssProperty:"border"},{name:"borderTop",cssProperty:"border-top"},{name:"borderRight",cssProperty:"border-right"},{name:"borderBottom",cssProperty:"border-bottom"},{name:"borderLeft",cssProperty:"border-left"},{name:"borderWidth",cssProperty:"border-width"},{name:"borderStyle",cssProperty:"border-style"},{name:"borderColor",cssProperty:"border-color"},{name:"borderTopWidth",cssProperty:"border-top-width"},{name:"borderRightWidth",cssProperty:"border-right-width"},{name:"borderBottomWidth",cssProperty:"border-bottom-width"},{name:"borderLeftWidth",cssProperty:"border-left-width"},{name:"borderTopStyle",cssProperty:"border-top-style"},{name:"borderRightStyle",cssProperty:"border-right-style"},{name:"borderBottomStyle",cssProperty:"border-bottom-style"},{name:"borderLeftStyle",cssProperty:"border-left-style"},{name:"borderTopColor",cssProperty:"border-top-color"},{name:"borderRightColor",cssProperty:"border-right-color"},{name:"borderBottomColor",cssProperty:"border-bottom-color"},{name:"borderLeftColor",cssProperty:"border-left-color"},{name:"borderRadius",cssProperty:"border-radius"},{name:"borderTopLeftRadius",cssProperty:"border-top-left-radius"},{name:"borderTopRightRadius",cssProperty:"border-top-right-radius"},{name:"borderBottomLeftRadius",cssProperty:"border-bottom-left-radius"},{name:"borderBottomRightRadius",cssProperty:"border-bottom-right-radius"},{name:"outline",cssProperty:"outline"},{name:"outlineWidth",cssProperty:"outline-width"},{name:"outlineStyle",cssProperty:"outline-style"},{name:"outlineColor",cssProperty:"outline-color"},{name:"outlineOffset",cssProperty:"outline-offset"},{name:"backgroundColor",cssProperty:"background-color"},{name:"backgroundImage",cssProperty:"background-image"},{name:"backgroundRepeat",cssProperty:"background-repeat"},{name:"backgroundPosition",cssProperty:"background-position"},{name:"backgroundSize",cssProperty:"background-size"},{name:"backgroundAttachment",cssProperty:"background-attachment"},{name:"backgroundClip",cssProperty:"background-clip"},{name:"backgroundOrigin",cssProperty:"background-origin"},{name:"boxShadow",cssProperty:"box-shadow"},{name:"opacity",cssProperty:"opacity"},{name:"transition",cssProperty:"transition"},{name:"transitionProperty",cssProperty:"transition-property"},{name:"transitionDuration",cssProperty:"transition-duration"},{name:"transitionTimingFunction",cssProperty:"transition-timing-function"},{name:"transitionDelay",cssProperty:"transition-delay"},{name:"transform",cssProperty:"transform"},{name:"transformOrigin",cssProperty:"transform-origin"},{name:"transformStyle",cssProperty:"transform-style"},{name:"perspective",cssProperty:"perspective"},{name:"perspectiveOrigin",cssProperty:"perspective-origin"},{name:"backfaceVisibility",cssProperty:"backface-visibility"},{name:"animation",cssProperty:"animation"},{name:"animationName",cssProperty:"animation-name"},{name:"animationDuration",cssProperty:"animation-duration"},{name:"animationTimingFunction",cssProperty:"animation-timing-function"},{name:"animationDelay",cssProperty:"animation-delay"},{name:"animationIterationCount",cssProperty:"animation-iteration-count"},{name:"animationDirection",cssProperty:"animation-direction"},{name:"animationFillMode",cssProperty:"animation-fill-mode"},{name:"animationPlayState",cssProperty:"animation-play-state"},{name:"filter",cssProperty:"filter"},{name:"backdropFilter",cssProperty:"backdrop-filter"},{name:"overflow",cssProperty:"overflow"},{name:"overflowX",cssProperty:"overflow-x"},{name:"overflowY",cssProperty:"overflow-y"},{name:"visibility",cssProperty:"visibility"},{name:"objectFit",cssProperty:"object-fit"},{name:"objectPosition",cssProperty:"object-position"},{name:"listStyle",cssProperty:"list-style"},{name:"listStyleType",cssProperty:"list-style-type"},{name:"listStylePosition",cssProperty:"list-style-position"},{name:"listStyleImage",cssProperty:"list-style-image"},{name:"borderCollapse",cssProperty:"border-collapse"},{name:"borderSpacing",cssProperty:"border-spacing"},{name:"captionSide",cssProperty:"caption-side"},{name:"emptyCells",cssProperty:"empty-cells"},{name:"tableLayout",cssProperty:"table-layout"},{name:"content",cssProperty:"content"},{name:"quotes",cssProperty:"quotes"},{name:"counterReset",cssProperty:"counter-reset"},{name:"counterIncrement",cssProperty:"counter-increment"},{name:"appearance",cssProperty:"appearance"},{name:"userSelect",cssProperty:"user-select"},{name:"pointerEvents",cssProperty:"pointer-events"},{name:"resize",cssProperty:"resize"},{name:"scrollBehavior",cssProperty:"scroll-behavior"},{name:"clip",cssProperty:"clip"},{name:"clipPath",cssProperty:"clip-path"},{name:"isolation",cssProperty:"isolation"},{name:"mixBlendMode",cssProperty:"mix-blend-mode"},{name:"willChange",cssProperty:"will-change"},{name:"contain",cssProperty:"contain"},{name:"pageBreakBefore",cssProperty:"page-break-before"},{name:"pageBreakAfter",cssProperty:"page-break-after"},{name:"pageBreakInside",cssProperty:"page-break-inside"},{name:"breakBefore",cssProperty:"break-before"},{name:"breakAfter",cssProperty:"break-after"},{name:"breakInside",cssProperty:"break-inside"},{name:"orphans",cssProperty:"orphans"},{name:"widows",cssProperty:"widows"},{name:"columnCount",cssProperty:"column-count"},{name:"columnFill",cssProperty:"column-fill"},{name:"columnGap",cssProperty:"column-gap"},{name:"columnRule",cssProperty:"column-rule"},{name:"columnRuleColor",cssProperty:"column-rule-color"},{name:"columnRuleStyle",cssProperty:"column-rule-style"},{name:"columnRuleWidth",cssProperty:"column-rule-width"},{name:"columnSpan",cssProperty:"column-span"},{name:"columnWidth",cssProperty:"column-width"},{name:"columns",cssProperty:"columns"},{name:"cursor",cssProperty:"cursor"},{name:"aspectRatio",cssProperty:"aspect-ratio"},{name:"clear",cssProperty:"clear"},{name:"float",cssProperty:"float"},{name:"order",cssProperty:"order"},{name:"placeContent",cssProperty:"place-content"},{name:"placeItems",cssProperty:"place-items"},{name:"placeSelf",cssProperty:"place-self"},{name:"hyphens",cssProperty:"hyphens"},{name:"lineBreak",cssProperty:"line-break"},{name:"wordBreak",cssProperty:"word-break"},{name:"textOrientation",cssProperty:"text-orientation"},{name:"writingMode",cssProperty:"writing-mode"},{name:"direction",cssProperty:"direction"},{name:"unicodeBidi",cssProperty:"unicode-bidi"},{name:"backgroundBlendMode",cssProperty:"background-blend-mode"},{name:"backgroundPositionX",cssProperty:"background-position-x"},{name:"backgroundPositionY",cssProperty:"background-position-y"},{name:"borderImage",cssProperty:"border-image"},{name:"borderImageSource",cssProperty:"border-image-source"},{name:"borderImageSlice",cssProperty:"border-image-slice"},{name:"borderImageWidth",cssProperty:"border-image-width"},{name:"borderImageOutset",cssProperty:"border-image-outset"},{name:"borderImageRepeat",cssProperty:"border-image-repeat"},{name:"inset",cssProperty:"inset"},{name:"insetBlock",cssProperty:"inset-block"},{name:"insetBlockStart",cssProperty:"inset-block-start"},{name:"insetBlockEnd",cssProperty:"inset-block-end"},{name:"insetInline",cssProperty:"inset-inline"},{name:"insetInlineStart",cssProperty:"inset-inline-start"},{name:"insetInlineEnd",cssProperty:"inset-inline-end"},{name:"marginBlock",cssProperty:"margin-block"},{name:"marginBlockStart",cssProperty:"margin-block-start"},{name:"marginBlockEnd",cssProperty:"margin-block-end"},{name:"marginInline",cssProperty:"margin-inline"},{name:"marginInlineStart",cssProperty:"margin-inline-start"},{name:"marginInlineEnd",cssProperty:"margin-inline-end"},{name:"paddingBlock",cssProperty:"padding-block"},{name:"paddingBlockStart",cssProperty:"padding-block-start"},{name:"paddingBlockEnd",cssProperty:"padding-block-end"},{name:"paddingInline",cssProperty:"padding-inline"},{name:"paddingInlineStart",cssProperty:"padding-inline-start"},{name:"paddingInlineEnd",cssProperty:"padding-inline-end"},{name:"inlineSize",cssProperty:"inline-size"},{name:"blockSize",cssProperty:"block-size"},{name:"minInlineSize",cssProperty:"min-inline-size"},{name:"minBlockSize",cssProperty:"min-block-size"},{name:"maxInlineSize",cssProperty:"max-inline-size"},{name:"maxBlockSize",cssProperty:"max-block-size"},{name:"borderBlock",cssProperty:"border-block"},{name:"borderBlockStart",cssProperty:"border-block-start"},{name:"borderBlockEnd",cssProperty:"border-block-end"},{name:"borderInline",cssProperty:"border-inline"},{name:"borderInlineStart",cssProperty:"border-inline-start"},{name:"borderInlineEnd",cssProperty:"border-inline-end"},{name:"borderBlockWidth",cssProperty:"border-block-width"},{name:"borderBlockStartWidth",cssProperty:"border-block-start-width"},{name:"borderBlockEndWidth",cssProperty:"border-block-end-width"},{name:"borderInlineWidth",cssProperty:"border-inline-width"},{name:"borderInlineStartWidth",cssProperty:"border-inline-start-width"},{name:"borderInlineEndWidth",cssProperty:"border-inline-end-width"},{name:"borderBlockStyle",cssProperty:"border-block-style"},{name:"borderBlockStartStyle",cssProperty:"border-block-start-style"},{name:"borderBlockEndStyle",cssProperty:"border-block-end-style"},{name:"borderInlineStyle",cssProperty:"border-inline-style"},{name:"borderInlineStartStyle",cssProperty:"border-inline-start-style"},{name:"borderInlineEndStyle",cssProperty:"border-inline-end-style"},{name:"borderBlockColor",cssProperty:"border-block-color"},{name:"borderBlockStartColor",cssProperty:"border-block-start-color"},{name:"borderBlockEndColor",cssProperty:"border-block-end-color"},{name:"borderInlineColor",cssProperty:"border-inline-color"},{name:"borderInlineStartColor",cssProperty:"border-inline-start-color"},{name:"borderInlineEndColor",cssProperty:"border-inline-end-color"},{name:"borderStartStartRadius",cssProperty:"border-start-start-radius"},{name:"borderStartEndRadius",cssProperty:"border-start-end-radius"},{name:"borderEndStartRadius",cssProperty:"border-end-start-radius"},{name:"borderEndEndRadius",cssProperty:"border-end-end-radius"},{name:"scrollMargin",cssProperty:"scroll-margin"},{name:"scrollMarginTop",cssProperty:"scroll-margin-top"},{name:"scrollMarginRight",cssProperty:"scroll-margin-right"},{name:"scrollMarginBottom",cssProperty:"scroll-margin-bottom"},{name:"scrollMarginLeft",cssProperty:"scroll-margin-left"},{name:"scrollPadding",cssProperty:"scroll-padding"},{name:"scrollPaddingTop",cssProperty:"scroll-padding-top"},{name:"scrollPaddingRight",cssProperty:"scroll-padding-right"},{name:"scrollPaddingBottom",cssProperty:"scroll-padding-bottom"},{name:"scrollPaddingLeft",cssProperty:"scroll-padding-left"},{name:"overscrollBehavior",cssProperty:"overscroll-behavior"},{name:"overscrollBehaviorX",cssProperty:"overscroll-behavior-x"},{name:"overscrollBehaviorY",cssProperty:"overscroll-behavior-y"},{name:"caretColor",cssProperty:"caret-color"},{name:"caretShape",cssProperty:"caret-shape"},{name:"caretAnimation",cssProperty:"caret-animation"},{name:"imageRendering",cssProperty:"image-rendering"},{name:"colorScheme",cssProperty:"color-scheme"},{name:"contentVisibility",cssProperty:"content-visibility"},{name:"touchAction",cssProperty:"touch-action"},{name:"containerType",cssProperty:"container-type"},{name:"containerName",cssProperty:"container-name"},{name:"container",cssProperty:"container"},{name:"fontFeatureSettings",cssProperty:"font-feature-settings"},{name:"fontKerning",cssProperty:"font-kerning"},{name:"fontSynthesis",cssProperty:"font-synthesis"},{name:"fontOpticalSizing",cssProperty:"font-optical-sizing"},{name:"fontDisplay",cssProperty:"font-display"},{name:"fontVariantCaps",cssProperty:"font-variant-caps"},{name:"fontVariantNumeric",cssProperty:"font-variant-numeric"},{name:"fontVariantLigatures",cssProperty:"font-variant-ligatures"},{name:"fontVariantEastAsian",cssProperty:"font-variant-east-asian"},{name:"fontVariantAlternates",cssProperty:"font-variant-alternates"},{name:"fontVariantPosition",cssProperty:"font-variant-position"},{name:"textRendering",cssProperty:"text-rendering"},{name:"textCombineUpright",cssProperty:"text-combine-upright"},{name:"textSizeAdjust",cssProperty:"text-size-adjust"},{name:"mask",cssProperty:"mask"},{name:"maskImage",cssProperty:"mask-image"},{name:"maskMode",cssProperty:"mask-mode"},{name:"maskRepeat",cssProperty:"mask-repeat"},{name:"maskPosition",cssProperty:"mask-position"},{name:"maskSize",cssProperty:"mask-size"},{name:"maskOrigin",cssProperty:"mask-origin"},{name:"maskClip",cssProperty:"mask-clip"},{name:"maskComposite",cssProperty:"mask-composite"},{name:"clipRule",cssProperty:"clip-rule"},{name:"gridColumnGap",cssProperty:"grid-column-gap"},{name:"gridRowGap",cssProperty:"grid-row-gap"},{name:"gridGap",cssProperty:"grid-gap"}],dt=["bold","center","flex"],Ce=new Map;function Le(e){let o=0;for(let n=0;e.length>n;n++)o=(o<<5)-o+e.charCodeAt(n),o&=o;return Math.abs(o).toString(16).padStart(8,"0").substring(0,8)}function ge(e){return Object.entries(e).sort(([o],[n])=>o.localeCompare(n)).map(([o,n])=>`${o}:${n}`).join("|")}function U(e,o,n,l="media"){let s=document.querySelector("#nuclo-styles");s||(s=document.createElement("style"),s.id="nuclo-styles",document.head.appendChild(s));const d=Object.entries(o).map(([m,f])=>`${m}: ${f}`).join("; ");if(n){const m=Array.from(s.sheet?.cssRules||[]);let f=null;const b=u=>l==="media"&&u instanceof CSSMediaRule?u.media.mediaText===n:(l==="container"&&u instanceof CSSContainerRule||l==="supports"&&u instanceof CSSSupportsRule)&&u.conditionText===n,y=u=>u instanceof CSSMediaRule||u instanceof CSSContainerRule||u instanceof CSSSupportsRule;for(const u of m)if(b(u)){f=u;break}if(!f){let u=m.length;for(let w=m.length-1;w>=0;w--){if(y(m[w])){u=w+1;break}if(m[w]instanceof CSSStyleRule){u=w+1;break}}const x=l==="media"?"@media":l==="container"?"@container":l==="supports"?"@supports":"@media";s.sheet?.insertRule(`${x} ${n} {}`,u),f=s.sheet?.cssRules[u]}let g=null;for(const u of Array.from(f.cssRules))if(u instanceof CSSStyleRule&&u.selectorText==="."+e){g=u;break}if(g){for(;g.style.length>0;)g.style.removeProperty(g.style[0]);Object.entries(o).forEach(([u,x])=>{g.style.setProperty(u,x)})}else f.insertRule(`.${e} { ${d} }`,f.cssRules.length)}else{let m=null,f=0;const b=g=>g instanceof CSSMediaRule||g instanceof CSSContainerRule||g instanceof CSSSupportsRule,y=Array.from(s.sheet?.cssRules||[]);for(let g=0;y.length>g;g++){const u=y[g];if(u instanceof CSSStyleRule&&u.selectorText==="."+e){m=u,f=g;break}b(u)||(f=g+1)}if(m){for(;m.style.length>0;)m.style.removeProperty(m.style[0]);Object.entries(o).forEach(([g,u])=>{m.style.setProperty(g,u)})}else s.sheet?.insertRule(`.${e} { ${d} }`,f)}}function pt(e,o){U(e,o)}class D{styles={};getStyles(){return{...this.styles}}getClassName(o="",n){return(function(l,s="",d){const m=ge(l),f=s?`${s}:${m}`:m,b=(function(u){return Ce.get(u)})(f);if(b){const u=b;return(function(x,w,C="media"){const P=document.querySelector("#nuclo-styles");if(!P||!P.sheet)return!1;if(w){const I=Array.from(P.sheet.cssRules||[]).find(N=>C==="media"&&N instanceof CSSMediaRule?N.media.mediaText===w:(C==="container"&&N instanceof CSSContainerRule||C==="supports"&&N instanceof CSSSupportsRule)&&N.conditionText===w);return!!I&&Array.from(I.cssRules).some(N=>N instanceof CSSStyleRule&&N.selectorText==="."+x)}return Array.from(P.sheet.cssRules||[]).some(I=>I instanceof CSSStyleRule&&I.selectorText==="."+x)})(u,d)||U(u,l,d),u}const y=Le(m),g=s?`n${s}-${y}`:"n"+y;return(function(u,x){Ce.set(u,x)})(f,g),U(g,l,d),g})(this.styles,o,n)}getClassNames(){return[this.getClassName()]}getClassDefinitions(){return Object.entries(this.styles).map(([o,n])=>({className:this.getClassName(),property:o,value:n}))}toString(){return this.getClassName()}add(o,n){return this.styles[o]=n,this}bold(){return this.styles["font-weight"]="bold",this}center(){return this.styles["justify-content"]="center",this.styles["align-items"]="center",this}flex(o){return o!==void 0?this.styles.flex=o:this.styles.display="flex",this}}function ut(e){return e.isShorthand?()=>new D().add(e.cssProperty,e.defaultValue||""):o=>new D().add(e.cssProperty,o||"")}(function(){const e=D.prototype;for(const o of We)o.name in e||(e[o.name]=o.isShorthand?function(){return this.add(o.cssProperty,o.defaultValue||""),this}:function(n){return this.add(o.cssProperty,n),this})})();const Y={};for(const e of We)Y[e.name]=ut(e);for(const e of dt)e==="bold"||e==="center"?Y[e]=()=>new D()[e]():e==="flex"&&(Y[e]=o=>new D().flex(o));const{display:mt,flex:gt,grid:ht,bg:ft,color:yt,accentColor:bt,fontSize:xt,fontWeight:vt,fontFamily:St,lineHeight:wt,letterSpacing:kt,textAlign:Ct,textDecoration:Pt,bold:Tt,fontStyle:Bt,fontVariant:Rt,fontStretch:It,textTransform:Nt,textIndent:Et,textOverflow:zt,textShadow:At,whiteSpace:Mt,wordSpacing:Dt,wordWrap:Wt,overflowWrap:Lt,textAlignLast:Ft,textJustify:jt,textDecorationLine:$t,textDecorationColor:Ht,textDecorationStyle:Ot,textDecorationThickness:Ut,textUnderlineOffset:Gt,verticalAlign:Qt,position:Vt,padding:_t,paddingTop:qt,paddingRight:Yt,paddingBottom:Jt,paddingLeft:Kt,margin:Xt,marginTop:Zt,marginRight:eo,marginBottom:to,marginLeft:oo,width:ro,height:no,minWidth:io,maxWidth:ao,minHeight:so,maxHeight:lo,boxSizing:co,top:po,right:uo,bottom:mo,left:go,zIndex:ho,flexDirection:fo,alignItems:yo,justifyContent:bo,center:xo,gap:vo,flexWrap:So,flexGrow:wo,flexShrink:ko,flexBasis:Co,alignSelf:Po,alignContent:To,justifySelf:Bo,justifyItems:Ro,gridTemplateColumns:Io,gridTemplateRows:No,gridTemplateAreas:Eo,gridColumn:zo,gridRow:Ao,gridColumnStart:Mo,gridColumnEnd:Do,gridRowStart:Wo,gridRowEnd:Lo,gridArea:Fo,gridAutoColumns:jo,gridAutoRows:$o,gridAutoFlow:Ho,border:Oo,borderTop:Uo,borderRight:Go,borderBottom:Qo,borderLeft:Vo,borderWidth:_o,borderStyle:qo,borderColor:Yo,borderTopWidth:Jo,borderRightWidth:Ko,borderBottomWidth:Xo,borderLeftWidth:Zo,borderTopStyle:er,borderRightStyle:tr,borderBottomStyle:or,borderLeftStyle:rr,borderTopColor:nr,borderRightColor:ir,borderBottomColor:ar,borderLeftColor:sr,borderRadius:lr,borderTopLeftRadius:cr,borderTopRightRadius:dr,borderBottomLeftRadius:pr,borderBottomRightRadius:ur,outline:mr,outlineWidth:gr,outlineStyle:hr,outlineColor:fr,outlineOffset:yr,backgroundColor:br,backgroundImage:xr,backgroundRepeat:vr,backgroundPosition:Sr,backgroundSize:wr,backgroundAttachment:kr,backgroundClip:Cr,backgroundOrigin:Pr,boxShadow:Tr,opacity:Br,transition:Rr,transitionProperty:Ir,transitionDuration:Nr,transitionTimingFunction:Er,transitionDelay:zr,transform:Ar,transformOrigin:Mr,transformStyle:Dr,perspective:Wr,perspectiveOrigin:Lr,backfaceVisibility:Fr,animation:jr,animationName:$r,animationDuration:Hr,animationTimingFunction:Or,animationDelay:Ur,animationIterationCount:Gr,animationDirection:Qr,animationFillMode:Vr,animationPlayState:_r,filter:qr,backdropFilter:Yr,overflow:Jr,overflowX:Kr,overflowY:Xr,visibility:Zr,objectFit:en,objectPosition:tn,listStyle:rn,listStyleType:nn,listStylePosition:an,listStyleImage:sn,borderCollapse:ln,borderSpacing:cn,captionSide:dn,emptyCells:pn,tableLayout:un,content:mn,quotes:gn,counterReset:hn,counterIncrement:fn,appearance:yn,userSelect:bn,pointerEvents:xn,resize:vn,scrollBehavior:Sn,clip:wn,clipPath:kn,isolation:Cn,mixBlendMode:Pn,willChange:Tn,contain:Bn,pageBreakBefore:Rn,pageBreakAfter:In,pageBreakInside:Nn,breakBefore:En,breakAfter:zn,breakInside:An,orphans:Mn,widows:Dn,columnCount:Wn,columnFill:Ln,columnGap:Fn,columnRule:jn,columnRuleColor:$n,columnRuleStyle:Hn,columnRuleWidth:On,columnSpan:Un,columnWidth:Gn,columns:Qn,cursor:Vn}=Y;function _n(e){const o=e.trim();return o.startsWith("@media ")?{type:"media",condition:o.slice(7).trim()}:o.startsWith("@container ")?{type:"container",condition:o.slice(11).trim()}:o.startsWith("@supports ")?{type:"supports",condition:o.slice(10).trim()}:o.startsWith("@style ")?{type:"style",condition:o.slice(7).trim()}:{type:"media",condition:o}}function Fe(e){const o=Array.isArray(e)?e:Object.entries(e);return function(n,l){let s,d;if(l!==void 0?(s=n,d=l):n instanceof D?(s=n,d=void 0):(s=void 0,d=n),!(s||d&&Object.keys(d).length!==0))return"";if(d&&Object.keys(d).length>0){const m=[];for(const[g,u]of o){const x=d[g];x&&m.push({queryName:g,atRule:_n(u),styles:x.getStyles()})}const f=[];if(s){const g=s.getStyles();f.push("default:"+ge(g))}f.push(...m.map(({queryName:g,styles:u})=>`${g}:${ge(u)}`));const b="n"+Le(f.sort().join("||"));let y={};s&&(y={...s.getStyles()},U(b,y));for(const{atRule:g,styles:u}of m)y={...y,...u},U(b,y,g.condition,g.type);return{className:b}}return s?{className:s.getClassName()}:""}}const qn=Fe;var Yn=Object.freeze({__proto__:null,StyleBuilder:D,accentColor:bt,alignContent:To,alignItems:yo,alignSelf:Po,animation:jr,animationDelay:Ur,animationDirection:Qr,animationDuration:Hr,animationFillMode:Vr,animationIterationCount:Gr,animationName:$r,animationPlayState:_r,animationTimingFunction:Or,appearance:yn,backdropFilter:Yr,backfaceVisibility:Fr,backgroundAttachment:kr,backgroundClip:Cr,backgroundColor:br,backgroundImage:xr,backgroundOrigin:Pr,backgroundPosition:Sr,backgroundRepeat:vr,backgroundSize:wr,bg:ft,bold:Tt,border:Oo,borderBottom:Qo,borderBottomColor:ar,borderBottomLeftRadius:pr,borderBottomRightRadius:ur,borderBottomStyle:or,borderBottomWidth:Xo,borderCollapse:ln,borderColor:Yo,borderLeft:Vo,borderLeftColor:sr,borderLeftStyle:rr,borderLeftWidth:Zo,borderRadius:lr,borderRight:Go,borderRightColor:ir,borderRightStyle:tr,borderRightWidth:Ko,borderSpacing:cn,borderStyle:qo,borderTop:Uo,borderTopColor:nr,borderTopLeftRadius:cr,borderTopRightRadius:dr,borderTopStyle:er,borderTopWidth:Jo,borderWidth:_o,bottom:mo,boxShadow:Tr,boxSizing:co,breakAfter:zn,breakBefore:En,breakInside:An,captionSide:dn,center:xo,clip:wn,clipPath:kn,color:yt,columnCount:Wn,columnFill:Ln,columnGap:Fn,columnRule:jn,columnRuleColor:$n,columnRuleStyle:Hn,columnRuleWidth:On,columnSpan:Un,columnWidth:Gn,columns:Qn,contain:Bn,content:mn,counterIncrement:fn,counterReset:hn,createBreakpoints:qn,createCSSClass:pt,createStyleQueries:Fe,cursor:Vn,display:mt,emptyCells:pn,filter:qr,flex:gt,flexBasis:Co,flexDirection:fo,flexGrow:wo,flexShrink:ko,flexWrap:So,fontFamily:St,fontSize:xt,fontStretch:It,fontStyle:Bt,fontVariant:Rt,fontWeight:vt,gap:vo,grid:ht,gridArea:Fo,gridAutoColumns:jo,gridAutoFlow:Ho,gridAutoRows:$o,gridColumn:zo,gridColumnEnd:Do,gridColumnStart:Mo,gridRow:Ao,gridRowEnd:Lo,gridRowStart:Wo,gridTemplateAreas:Eo,gridTemplateColumns:Io,gridTemplateRows:No,height:no,isolation:Cn,justifyContent:bo,justifyItems:Ro,justifySelf:Bo,left:go,letterSpacing:kt,lineHeight:wt,listStyle:rn,listStyleImage:sn,listStylePosition:an,listStyleType:nn,margin:Xt,marginBottom:to,marginLeft:oo,marginRight:eo,marginTop:Zt,maxHeight:lo,maxWidth:ao,minHeight:so,minWidth:io,mixBlendMode:Pn,objectFit:en,objectPosition:tn,opacity:Br,orphans:Mn,outline:mr,outlineColor:fr,outlineOffset:yr,outlineStyle:hr,outlineWidth:gr,overflow:Jr,overflowWrap:Lt,overflowX:Kr,overflowY:Xr,padding:_t,paddingBottom:Jt,paddingLeft:Kt,paddingRight:Yt,paddingTop:qt,pageBreakAfter:In,pageBreakBefore:Rn,pageBreakInside:Nn,perspective:Wr,perspectiveOrigin:Lr,pointerEvents:xn,position:Vt,quotes:gn,resize:vn,right:uo,scrollBehavior:Sn,tableLayout:un,textAlign:Ct,textAlignLast:Ft,textDecoration:Pt,textDecorationColor:Ht,textDecorationLine:$t,textDecorationStyle:Ot,textDecorationThickness:Ut,textIndent:Et,textJustify:jt,textOverflow:zt,textShadow:At,textTransform:Nt,textUnderlineOffset:Gt,top:po,transform:Ar,transformOrigin:Mr,transformStyle:Dr,transition:Rr,transitionDelay:zr,transitionDuration:Nr,transitionProperty:Ir,transitionTimingFunction:Er,userSelect:bn,verticalAlign:Qt,visibility:Zr,whiteSpace:Mt,widows:Dn,width:ro,willChange:Tn,wordSpacing:Dt,wordWrap:Wt,zIndex:ho});function Jn(){if(Xe(),typeof globalThis<"u"){const e=globalThis;e.list=tt,e.update=st,e.when=it,e.on=lt,e.render=ct;for(const[o,n]of Object.entries(Yn))try{e[o]=n}catch{}}}typeof globalThis<"u"&&Jn();const r={primary:"#84cc16",primaryHover:"#a3e635",primaryGlow:"rgba(132, 204, 22, 0.3)",bg:"#0a0f1a",bgLight:"#111827",bgCard:"#1a2332",bgCode:"#0d1117",text:"#f8fafc",textMuted:"#94a3b8",textDim:"#64748b",border:"#1e293b",borderLight:"#334155",codeKeyword:"#c792ea",codeString:"#c3e88d",codeFunction:"#82aaff",codeComment:"#676e95",codeNumber:"#f78c6c"};function Kn(){const e=document.createElement("style");e.textContent=`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${r.bg};
      color: ${r.text};
      line-height: 1.6;
      min-height: 100vh;
    }

  
  `,document.head.appendChild(e)}const i=createStyleQueries({small:"@media (min-width: 341px)",medium:"@media (min-width: 601px)",large:"@media (min-width: 1025px)"}),t={container:i(padding("0 24px").maxWidth("1200px").margin("0 auto").width("100%")),header:i(display("flex").backgroundColor("#FF0000").alignItems("center").justifyContent("space-between").padding("20px 24px").backgroundColor("transparent").containerType("inline-size").position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${r.border}`),{medium:padding("20px 48px")}),logo:i(display("flex").alignItems("center").gap("12px").fontSize("20px").fontWeight("700").color(r.primary).transition("opacity 0.2s"),{medium:fontSize("24px")}),nav:i(display("flex").alignItems("center").gap("8px").width("100%").height("200px")),navLink:i(color(r.textMuted).fontSize("14px").fontWeight("500").transition("all 0.2s"),{medium:fontSize("15px")}),navLinkActive:i(color(r.text)),hero:i(padding("60px 24px 80px").textAlign("center").maxWidth("1000px").margin("0 auto").position("relative"),{medium:padding("100px 48px 120px")}),heroTitle:i(fontSize("40px").fontWeight("700").lineHeight("1.1").marginBottom("24px").color(r.text).letterSpacing("-0.02em"),{medium:fontSize("56px"),large:fontSize("64px")}),heroTitleAccent:i(color(r.primary)),heroTitleAccentStyle:{fontStyle:"italic"},heroSubtitle:i(fontSize("16px").color(r.textMuted).maxWidth("600px").margin("0 auto 48px").lineHeight("1.7"),{medium:fontSize("18px"),large:fontSize("20px")}),heroButtons:i(display("flex").gap("16px").justifyContent("center").flexWrap("wrap")),btnPrimary:i(padding("14px 32px").backgroundColor(r.primary).color(r.bg).borderRadius("8px").fontWeight("600").fontSize("15px").border("none").transition("all 0.2s")),btnPrimaryStyle:{boxShadow:`0 0 20px ${r.primaryGlow}`},btnSecondary:i(padding("14px 32px").backgroundColor("transparent").color(r.text).borderRadius("8px").fontWeight("600").fontSize("15px").border(`1px solid ${r.borderLight}`).transition("all 0.2s")),features:i(display("grid").gap("24px").padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("80px 48px")}),featuresStyle:{gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))"},featureCard:i(padding("32px").backgroundColor(r.bgCard).borderRadius("16px").border(`1px solid ${r.border}`).transition("all 0.3s").position("relative").overflow("hidden")),featureIcon:i(width("56px").height("56px").borderRadius("12px").display("flex").alignItems("center").justifyContent("center").marginBottom("20px").fontSize("28px")),featureIconStyle:{background:`linear-gradient(135deg, ${r.bgLight} 0%, ${r.bgCard} 100%)`,border:`1px solid ${r.border}`},featureTitle:i(fontSize("20px").fontWeight("600").marginBottom("12px").color(r.text)),featureDesc:i(fontSize("15px").color(r.textMuted).lineHeight("1.7")),codeBlock:i(backgroundColor(r.bgCode).borderRadius("12px").padding("24px").overflow("auto").border(`1px solid ${r.border}`).fontSize("14px").lineHeight("1.7")),codeInline:i(backgroundColor(r.bgLight).padding("3px 8px").borderRadius("6px").fontSize("14px").color(r.primary).border(`1px solid ${r.border}`)),section:i(padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("100px 48px")}),sectionTitle:i(fontSize("28px").fontWeight("700").marginBottom("16px").color(r.text).letterSpacing("-0.02em"),{medium:fontSize("36px"),large:fontSize("40px")}),sectionSubtitle:i(fontSize("18px").color(r.textMuted).marginBottom("56px").maxWidth("600px").lineHeight("1.7")),demoContainer:i(display("grid").gap("24px")),demoContainerStyle:{gridTemplateColumns:"1fr 1fr"},demoPanel:i(backgroundColor(r.bgCard).borderRadius("16px").border(`1px solid ${r.border}`).overflow("hidden")),demoPanelHeader:i(padding("14px 20px").backgroundColor(r.bgLight).borderBottom(`1px solid ${r.border}`).fontSize("13px").fontWeight("600").color(r.textMuted).textTransform("uppercase").letterSpacing("0.05em")),demoPanelContent:i(padding("24px")),footer:i(padding("48px").borderTop(`1px solid ${r.border}`).marginTop("auto").textAlign("center").backgroundColor(r.bgLight)),footerText:i(fontSize("14px").color(r.textDim)),footerLink:i(color(r.textMuted).transition("color 0.2s")),pageContent:i(padding("32px 24px 80px").maxWidth("900px").margin("0 auto"),{medium:padding("48px 48px 80px")}),pageTitle:i(fontSize("32px").fontWeight("700").marginBottom("24px").color(r.text).letterSpacing("-0.02em"),{medium:fontSize("40px"),large:fontSize("48px")}),pageSubtitle:i(fontSize("20px").color(r.textMuted).marginBottom("56px").lineHeight("1.7")),h2:i(fontSize("32px").fontWeight("600").marginTop("64px").marginBottom("20px").color(r.text).letterSpacing("-0.01em")),h3:i(fontSize("22px").fontWeight("600").marginTop("40px").marginBottom("16px").color(r.text)),p:i(fontSize("16px").color(r.textMuted).marginBottom("20px").lineHeight("1.8")),ul:i(paddingLeft("24px").marginBottom("20px")),li:i(fontSize("16px").color(r.textMuted).marginBottom("12px").lineHeight("1.7")),flex:i(display("flex")),flexCenter:i(display("flex").alignItems("center").justifyContent("center")),flexBetween:i(display("flex").alignItems("center").justifyContent("space-between")),flexCol:i(display("flex").flexDirection("column")),gap8:i(gap("8px")),gap16:i(gap("16px")),gap24:i(gap("24px")),gap32:i(gap("32px")),mt16:i(marginTop("16px")),mt24:i(marginTop("24px")),mt32:i(marginTop("32px")),mb16:i(marginBottom("16px")),mb24:i(marginBottom("24px")),table:i(width("100%").borderCollapse("collapse").marginBottom("24px").fontSize("14px")),th:i(padding("14px 16px").textAlign("left").borderBottom(`2px solid ${r.border}`).fontWeight("600").color(r.text).backgroundColor(r.bgLight)),td:i(padding("14px 16px").borderBottom(`1px solid ${r.border}`).color(r.textMuted)),glowBoxStyle:{boxShadow:`0 0 60px ${r.primaryGlow}, inset 0 0 60px rgba(132, 204, 22, 0.05)`}};let J="home";function T(){return J}function B(e){J=e,window.history.pushState({},"",e==="home"?"/":`#${e}`),window.scrollTo(0,0),update()}const Pe=["home","getting-started","core-api","tag-builders","styling","pitfalls","examples","example-counter","example-todo","example-subtasks","example-search","example-async","example-forms","example-nested","example-animations","example-routing","example-styled-card"];function Xn(){const e=window.location.hash.slice(1);Pe.includes(e)&&(J=e),window.addEventListener("popstate",()=>{const o=window.location.hash.slice(1);J=Pe.includes(o)?o:"home",update()})}function Zn(e=32,o=!1){return svgSvg({width:String(e),height:String(e),viewBox:"0 0 32 32",fill:"none"},n=>{if(o){const l=n;l.removeAttribute("width"),l.removeAttribute("height"),l.style.maxWidth="100%",l.style.width="100%",l.style.height="auto"}},circleSvg({cx:"16",cy:"16",r:"14",stroke:r.primary,"stroke-width":"2",fill:"none",opacity:"0.3"}),circleSvg({cx:"16",cy:"16",r:"12",stroke:r.primary,"stroke-width":"2",fill:"none"}),circleSvg({cx:"16",cy:"16",r:"5",fill:r.primary}),circleSvg({cx:"16",cy:"5",r:"2",fill:r.primaryHover}),circleSvg({cx:"24",cy:"20",r:"2",fill:r.primaryHover}),circleSvg({cx:"8",cy:"20",r:"2",fill:r.primaryHover}))}function ei(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:r.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"}),pathSvg({d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"}),pathSvg({d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"}),pathSvg({d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"}))}function ti(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:r.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"}),pathSvg({d:"m3.3 7 8.7 5 8.7-5"}),pathSvg({d:"M12 22V12"}))}function oi(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:r.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M13 2 3 14h9l-1 8 10-12h-9l1-8z"}))}function ri(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:r.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),pathSvg({d:"M21 3v5h-5"}),pathSvg({d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),pathSvg({d:"M8 16H3v5"}))}function ni(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:r.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m16 18 6-6-6-6"}),pathSvg({d:"m8 6-6 6 6 6"}))}function ii(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:r.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"}),pathSvg({d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"}),pathSvg({d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"}))}function ai(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M5 12h14"}),pathSvg({d:"m12 5 7 7-7 7"}))}function si(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M20 6 9 17l-5-5"}))}function ci(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},rectSvg({x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"}),pathSvg({d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"}))}function di(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"currentColor"},pathSvg({d:"M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"}))}function pi(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"3",y1:"6",x2:"21",y2:"6"}),lineSvg({x1:"3",y1:"12",x2:"21",y2:"12"}),lineSvg({x1:"3",y1:"18",x2:"21",y2:"18"}))}function ui(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"18",y1:"6",x2:"6",y2:"18"}),lineSvg({x1:"6",y1:"6",x2:"18",y2:"18"}))}let G=!1;function mi(){G=!G,update()}function je(){G=!1,update()}const $e=[{label:"Getting Started",route:"getting-started"},{label:"Core API",route:"core-api"},{label:"Tag Builders",route:"tag-builders"},{label:"Styling",route:"styling"},{label:"Pitfalls",route:"pitfalls"},{label:"Examples",route:"examples"}];function He(e,o){const n=()=>T()===o||T().startsWith(o+"-");return a({href:`#${o}`},i(display("flex").alignItems("center").padding("8px 14px").borderRadius("8px").fontSize("14px").fontWeight("500").transition("all 0.2s").cursor("pointer")),{style:()=>({color:n()?r.primary:r.textMuted,backgroundColor:n()?"rgba(132, 204, 22, 0.1)":"transparent"})},e,on("click",l=>{l.preventDefault(),B(o),je()}),on("mouseenter",l=>{n()||(l.target.style.color=r.primary,l.target.style.backgroundColor="rgba(132, 204, 22, 0.05)")}),on("mouseleave",l=>{n()||(l.target.style.color=r.textMuted,l.target.style.backgroundColor="transparent")}))}function gi(){return a({href:"/nuclo/"},i(display("flex").alignItems("center").gap("10px").fontSize("18px").fontWeight("700").color(r.primary).transition("opacity 0.2s").cursor("pointer")),Zn(28),span("Nuclo"),on("click",e=>{e.preventDefault(),B("home"),je()}),on("mouseenter",e=>{e.currentTarget.style.opacity="0.8"}),on("mouseleave",e=>{e.currentTarget.style.opacity="1"}))}function Oe(){return a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer",ariaLabel:"GitHub"},i(display("flex").alignItems("center").justifyContent("center").width("36px").height("36px").borderRadius("8px").transition("all 0.2s")),{style:{color:r.textMuted,backgroundColor:"transparent"}},di(),on("mouseenter",e=>{e.currentTarget.style.color=r.primary,e.currentTarget.style.backgroundColor="rgba(132, 204, 22, 0.1)"}),on("mouseleave",e=>{e.currentTarget.style.color=r.textMuted,e.currentTarget.style.backgroundColor="transparent"}))}function hi(){return button(i(display("flex").alignItems("center").justifyContent("center").width("40px").height("40px").borderRadius("8px").backgroundColor("transparent").border("none").color(r.text).cursor("pointer").transition("all 0.2s"),{medium:display("none")}),when(()=>G,ui()).else(pi()),on("click",mi))}function fi(){return when(()=>G,div(i(position("fixed").top("64px").left("0").right("0").backgroundColor(r.bg).borderBottom(`1px solid ${r.border}`).padding("16px 24px").zIndex(99).display("flex").flexDirection("column").gap("8px")),{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.95)"}},...$e.map(e=>He(e.label,e.route)),div(i(display("flex").alignItems("center").gap("8px").padding("8px 14px")),Oe(),span(i(color(r.textMuted).fontSize("14px")),"GitHub"))))}function yi(){const e=i(position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${r.border}`)),o=i(display("flex").alignItems("center").justifyContent("space-between").maxWidth("1400px").margin("0 auto").padding("12px 24px"),{medium:padding("16px 48px")}),n=i(display("none").alignItems("center").gap("4px"),{medium:display("flex")}),l=i(display("flex").alignItems("center").gap("8px"));return div(header(e,{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.85)"}},div(o,gi(),nav(n,...$e.map(s=>He(s.label,s.route))),div(l,div(i(display("none"),{medium:display("flex")}),Oe()),hi()))),fi())}function bi(){return footer(t.footer,div(t.footerText,"Created by ",a({href:"https://github.com/dan2dev",target:"_blank",rel:"noopener noreferrer"},t.footerLink,"Danilo Celestino de Castro",on("mouseenter",e=>{e.target.style.color=r.primary}),on("mouseleave",e=>{e.target.style.color=r.textMuted}))," · MIT License · ",a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer"},t.footerLink,"GitHub",on("mouseenter",e=>{e.target.style.color=r.primary}),on("mouseleave",e=>{e.target.style.color=r.textMuted}))))}let Ue={};function Te(e,o){Ue[e]=o,update()}function Be(e){return Ue[e]||!1}function xi(e){return e.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,`<span style="color: ${r.codeString}">$&</span>`).replace(/(\/\/.*$)/gm,`<span style="color: ${r.codeComment}">$1</span>`).replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,`<span style="color: ${r.codeKeyword}">$1</span>`).replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,`<span style="color: ${r.codeFunction}">$1</span>(`).replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${r.codeNumber}">$1</span>`).replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g,`: <span style="color: ${r.codeKeyword}">$1</span>`)}function c(e,o="typescript",n=!0){const l=`code-${Math.random().toString(36).slice(2,9)}`,s=xi(e.trim()),d={backgroundColor:r.bgLight,border:`1px solid ${r.border}`};return div(i(position("relative")),pre(t.codeBlock,code({innerHTML:s})),n?button(i(position("absolute").top("12px").right("12px").padding("6px 10px").borderRadius("6px").color(r.textMuted).fontSize("12px").cursor("pointer").display("flex").alignItems("center").gap("4px").transition("all 0.2s")),{style:d},()=>Be(l)?si():ci(),()=>Be(l)?"Copied!":"Copy",on("click",async()=>{await navigator.clipboard.writeText(e.trim()),Te(l,!0),setTimeout(()=>Te(l,!1),2e3)}),on("mouseenter",m=>{m.target.style.borderColor=r.borderLight,m.target.style.color=r.text}),on("mouseleave",m=>{m.target.style.borderColor=r.border,m.target.style.color=r.textMuted})):null)}function k(e){return code(t.codeInline,e)}const R=[{id:"counter",title:"Counter",description:"The classic counter example showing basic state management and event handling.",code:`import 'nuclo';

let counter = 0;

function increment() {
  counter++;
  update();
}

function decrement() {
  counter--;
  update();
}

function reset() {
  counter = 0;
  update();
}

const app = div(
  { className: 'counter-app' },

  h1('Counter: ', span(() => counter)),

  div(
    { className: 'button-group' },
    button('-', on('click', decrement)),
    button('Reset', on('click', reset)),
    button('+', on('click', increment))
  ),

  // Show even/odd
  p(() => \`The counter is \${counter % 2 === 0 ? 'even' : 'odd'}\`)
);

render(app, document.body);`},{id:"todo",title:"Todo List",description:"A complete todo application with add, toggle, delete, and filter functionality.",code:`import 'nuclo';

type Todo = { id: number; text: string; done: boolean };
type Filter = 'all' | 'active' | 'completed';

let todos: Todo[] = [];
let nextId = 1;
let inputValue = '';
let filter: Filter = 'all';

function addTodo() {
  if (!inputValue.trim()) return;
  todos.push({ id: nextId++, text: inputValue, done: false });
  inputValue = '';
  update();
}

function toggleTodo(todo: Todo) {
  todo.done = !todo.done;
  update();
}

function deleteTodo(id: number) {
  todos = todos.filter(t => t.id !== id);
  update();
}

function clearCompleted() {
  todos = todos.filter(t => !t.done);
  update();
}

function filteredTodos() {
  switch (filter) {
    case 'active': return todos.filter(t => !t.done);
    case 'completed': return todos.filter(t => t.done);
    default: return todos;
  }
}

function activeCount() {
  return todos.filter(t => !t.done).length;
}

const app = div(
  { className: 'todo-app' },

  h1('todos'),

  // Input section
  div(
    { className: 'input-section' },
    input(
      {
        type: 'text',
        placeholder: 'What needs to be done?',
        value: () => inputValue
      },
      on('input', e => {
        inputValue = e.target.value;
        update();
      }),
      on('keydown', e => {
        if (e.key === 'Enter') addTodo();
      })
    ),
    button('Add', on('click', addTodo))
  ),

  // Todo list
  when(() => todos.length > 0,
    div(
      // List
      list(() => filteredTodos(), (todo) =>
        div(
          { className: () => \`todo-item \${todo.done ? 'done' : ''}\` },

          input(
            {
              type: 'checkbox',
              checked: () => todo.done
            },
            on('change', () => toggleTodo(todo))
          ),

          span(
            { className: 'todo-text' },
            () => todo.text
          ),

          button(
            { className: 'delete-btn' },
            '×',
            on('click', () => deleteTodo(todo.id))
          )
        )
      ),

      // Footer
      div(
        { className: 'todo-footer' },

        span(() => \`\${activeCount()} item\${activeCount() !== 1 ? 's' : ''} left\`),

        div(
          { className: 'filters' },
          button(
            { className: () => filter === 'all' ? 'active' : '' },
            'All',
            on('click', () => { filter = 'all'; update(); })
          ),
          button(
            { className: () => filter === 'active' ? 'active' : '' },
            'Active',
            on('click', () => { filter = 'active'; update(); })
          ),
          button(
            { className: () => filter === 'completed' ? 'active' : '' },
            'Completed',
            on('click', () => { filter = 'completed'; update(); })
          )
        ),

        when(() => todos.some(t => t.done),
          button('Clear completed', on('click', clearCompleted))
        )
      )
    )
  ).else(
    p({ className: 'empty-state' }, 'No todos yet! Add one above.')
  )
);

render(app, document.body);`},{id:"subtasks",title:"Nested Subtasks",description:"A todo list with recursive subtasks, demonstrating nested list() and when() composition.",code:`import 'nuclo';

type Task = {
  id: number;
  text: string;
  done: boolean;
  subtasks: Task[];
  expanded: boolean;
};

let tasks: Task[] = [];
let nextId = 1;

function createTask(text: string): Task {
  return {
    id: nextId++,
    text,
    done: false,
    subtasks: [],
    expanded: true
  };
}

function addTask(text: string, parent?: Task) {
  const task = createTask(text);
  if (parent) {
    parent.subtasks.push(task);
  } else {
    tasks.push(task);
  }
  update();
}

function toggleTask(task: Task) {
  task.done = !task.done;
  // Optionally cascade to subtasks
  function setDone(t: Task, done: boolean) {
    t.done = done;
    t.subtasks.forEach(st => setDone(st, done));
  }
  setDone(task, task.done);
  update();
}

function toggleExpand(task: Task) {
  task.expanded = !task.expanded;
  update();
}

function deleteTask(task: Task, parent?: Task) {
  if (parent) {
    parent.subtasks = parent.subtasks.filter(t => t.id !== task.id);
  } else {
    tasks = tasks.filter(t => t.id !== task.id);
  }
  update();
}

// Recursive task renderer
function TaskItem(task: Task, parent?: Task, depth = 0): Element {
  let newSubtaskText = '';

  return div(
    { className: 'task-item' },
    { style: { marginLeft: \`\${depth * 20}px\` } },

    // Task header
    div(
      { className: 'task-header' },

      // Expand/collapse button (if has subtasks)
      when(() => task.subtasks.length > 0,
        button(
          { className: 'expand-btn' },
          () => task.expanded ? '▼' : '▶',
          on('click', () => toggleExpand(task))
        )
      ).else(
        span({ style: { width: '24px', display: 'inline-block' } })
      ),

      // Checkbox
      input(
        {
          type: 'checkbox',
          checked: () => task.done
        },
        on('change', () => toggleTask(task))
      ),

      // Task text
      span(
        {
          className: () => task.done ? 'done' : '',
          style: {
            textDecoration: () => task.done ? 'line-through' : 'none',
            opacity: () => task.done ? '0.6' : '1'
          }
        },
        () => task.text
      ),

      // Subtask count badge
      when(() => task.subtasks.length > 0,
        span(
          { className: 'subtask-count' },
          () => \`(\${task.subtasks.filter(t => t.done).length}/\${task.subtasks.length})\`
        )
      ),

      // Delete button
      button(
        { className: 'delete-btn' },
        '×',
        on('click', () => deleteTask(task, parent))
      )
    ),

    // Subtasks (when expanded)
    when(() => task.expanded && task.subtasks.length > 0,
      div(
        { className: 'subtasks' },
        list(() => task.subtasks, subtask =>
          TaskItem(subtask, task, depth + 1)
        )
      )
    ),

    // Add subtask form (when expanded)
    when(() => task.expanded,
      div(
        { className: 'add-subtask' },
        { style: { marginLeft: \`\${(depth + 1) * 20}px\` } },
        input(
          {
            type: 'text',
            placeholder: 'Add subtask...',
            value: () => newSubtaskText
          },
          on('input', e => {
            newSubtaskText = e.target.value;
            update();
          }),
          on('keydown', e => {
            if (e.key === 'Enter' && newSubtaskText.trim()) {
              addTask(newSubtaskText.trim(), task);
              newSubtaskText = '';
              update();
            }
          })
        )
      )
    )
  );
}

// Main app
let mainInputText = '';

const app = div(
  { className: 'task-app' },

  h1('Tasks with Subtasks'),

  // Add main task
  div(
    { className: 'add-task' },
    input(
      {
        type: 'text',
        placeholder: 'Add a task...',
        value: () => mainInputText
      },
      on('input', e => {
        mainInputText = e.target.value;
        update();
      }),
      on('keydown', e => {
        if (e.key === 'Enter' && mainInputText.trim()) {
          addTask(mainInputText.trim());
          mainInputText = '';
          update();
        }
      })
    ),
    button('Add', on('click', () => {
      if (mainInputText.trim()) {
        addTask(mainInputText.trim());
        mainInputText = '';
        update();
      }
    }))
  ),

  // Task list
  when(() => tasks.length > 0,
    div(
      { className: 'task-list' },
      list(() => tasks, task => TaskItem(task))
    )
  ).else(
    p({ className: 'empty' }, 'No tasks yet. Add one above!')
  )
);

render(app, document.body);`},{id:"search",title:"Search Filter",description:"Real-time search filtering with debouncing.",code:`import 'nuclo';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Admin' },
  { id: 5, name: 'Eve Anderson', email: 'eve@example.com', role: 'User' }
];

let searchQuery = '';
let selectedRole = 'all';

function filteredUsers() {
  const query = searchQuery.toLowerCase();
  return users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesRole =
      selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
}

const app = div(
  { className: 'user-directory' },

  h1('User Directory'),

  // Search and filters
  div(
    { className: 'search-section' },

    input(
      {
        type: 'search',
        placeholder: 'Search by name or email...',
        value: () => searchQuery
      },
      on('input', e => {
        searchQuery = e.target.value;
        update();
      })
    ),

    select(
      { value: () => selectedRole },
      on('change', e => {
        selectedRole = e.target.value;
        update();
      }),
      option({ value: 'all' }, 'All Roles'),
      option({ value: 'Admin' }, 'Admins'),
      option({ value: 'User' }, 'Users')
    )
  ),

  // Results count
  p(() => {
    const count = filteredUsers().length;
    return \`Showing \${count} user\${count !== 1 ? 's' : ''}\`;
  }),

  // User list
  when(() => filteredUsers().length > 0,
    div(
      { className: 'user-list' },
      list(() => filteredUsers(), user =>
        div(
          { className: 'user-card' },
          h3(user.name),
          p(user.email),
          span(
            { className: \`role-badge \${user.role.toLowerCase()}\` },
            user.role
          )
        )
      )
    )
  ).else(
    div(
      { className: 'empty-state' },
      p(() => searchQuery
        ? \`No users found matching "\${searchQuery}"\`
        : 'No users found'
      )
    )
  )
);

render(app, document.body);`},{id:"async",title:"Async Loading",description:"Handling asynchronous operations with loading states and error handling.",code:`import 'nuclo';

type Product = { id: number; title: string; category: string; price: number };
type State = {
  status: 'idle' | 'loading' | 'success' | 'error';
  products: Product[];
  error?: string;
};

let state: State = { status: 'idle', products: [] };
let searchQuery = 'phone';

async function fetchProducts() {
  if (!searchQuery.trim()) return;

  state.status = 'loading';
  state.error = undefined;
  update();

  try {
    const response = await fetch(
      \`https://dummyjson.com/products/search?q=\${searchQuery}\`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    state.products = data.products;
    state.status = 'success';
  } catch (err) {
    state.status = 'error';
    state.error = err.message;
  }

  update();
}

const app = div(
  { className: 'product-search' },

  h1('Product Search'),

  // Search input
  div(
    { className: 'search-bar' },
    input(
      {
        type: 'search',
        placeholder: 'Search products...',
        value: () => searchQuery,
        disabled: () => state.status === 'loading'
      },
      on('input', e => {
        searchQuery = e.target.value;
        update();
      }),
      on('keydown', e => {
        if (e.key === 'Enter') fetchProducts();
      })
    ),
    button(
      {
        disabled: () => state.status === 'loading' || !searchQuery.trim()
      },
      () => state.status === 'loading' ? 'Searching...' : 'Search',
      on('click', fetchProducts)
    )
  ),

  // Status display
  when(() => state.status === 'loading',
    div({ className: 'loading' }, 'Loading products...')
  ).when(() => state.status === 'error',
    div(
      { className: 'error' },
      'Error: ',
      () => state.error,
      button('Retry', on('click', fetchProducts))
    )
  ).when(() => state.status === 'success' && state.products.length > 0,
    div(
      p(() => \`Found \${state.products.length} products\`),
      div(
        { className: 'product-grid' },
        list(() => state.products, product =>
          div(
            { className: 'product-card' },
            h3(product.title),
            p({ className: 'category' }, product.category),
            p({ className: 'price' }, () => \`$\${product.price.toFixed(2)}\`)
          )
        )
      )
    )
  ).when(() => state.status === 'success' && state.products.length === 0,
    div({ className: 'empty' }, () => \`No products found for "\${searchQuery}"\`)
  ).else(
    div({ className: 'empty' }, 'Enter a search term and click Search')
  )
);

render(app, document.body);`},{id:"forms",title:"Form Handling",description:"Complete form with validation and submission.",code:`import 'nuclo';

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

let formData: FormData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
};

let errors: Errors = {};
let isSubmitting = false;
let submitStatus: 'idle' | 'success' | 'error' = 'idle';

function validateForm(): boolean {
  errors = {};

  if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (!formData.email.includes('@')) {
    errors.email = 'Please enter a valid email';
  }

  if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return Object.keys(errors).length === 0;
}

async function handleSubmit(e: Event) {
  e.preventDefault();

  if (!validateForm()) {
    update();
    return;
  }

  isSubmitting = true;
  submitStatus = 'idle';
  update();

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Success
    submitStatus = 'success';
    formData = { username: '', email: '', password: '', confirmPassword: '' };
  } catch (err) {
    submitStatus = 'error';
  }

  isSubmitting = false;
  update();
}

const app = div(
  { className: 'form-container' },

  h1('Sign Up'),

  when(() => submitStatus === 'success',
    div({ className: 'success-message' }, 'Account created successfully!')
  ),

  form(
    on('submit', handleSubmit),

    // Username field
    div(
      { className: 'form-field' },
      label('Username'),
      input(
        {
          type: 'text',
          value: () => formData.username,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.username = e.target.value;
          delete errors.username;
          update();
        })
      ),
      when(() => !!errors.username,
        span({ className: 'error' }, () => errors.username)
      )
    ),

    // Email field
    div(
      { className: 'form-field' },
      label('Email'),
      input(
        {
          type: 'email',
          value: () => formData.email,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.email = e.target.value;
          delete errors.email;
          update();
        })
      ),
      when(() => !!errors.email,
        span({ className: 'error' }, () => errors.email)
      )
    ),

    // Password field
    div(
      { className: 'form-field' },
      label('Password'),
      input(
        {
          type: 'password',
          value: () => formData.password,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.password = e.target.value;
          delete errors.password;
          update();
        })
      ),
      when(() => !!errors.password,
        span({ className: 'error' }, () => errors.password)
      )
    ),

    // Confirm password field
    div(
      { className: 'form-field' },
      label('Confirm Password'),
      input(
        {
          type: 'password',
          value: () => formData.confirmPassword,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.confirmPassword = e.target.value;
          delete errors.confirmPassword;
          update();
        })
      ),
      when(() => !!errors.confirmPassword,
        span({ className: 'error' }, () => errors.confirmPassword)
      )
    ),

    // Submit button
    button(
      {
        type: 'submit',
        disabled: () => isSubmitting
      },
      () => isSubmitting ? 'Creating account...' : 'Sign Up'
    )
  )
);

render(app, document.body);`},{id:"nested",title:"Nested Components",description:"Creating reusable component-like functions.",code:`import 'nuclo';

type User = {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
};

// Component functions
function UserCard(user: User, onFollow: (id: number) => void) {
  return div(
    { className: 'user-card' },
    img({ src: user.avatar, alt: user.name, className: 'avatar' }),
    h3(user.name),
    p({ className: 'bio' }, user.bio),
    p({ className: 'followers' }, () => \`\${user.followers} followers\`),
    button('Follow', on('click', () => onFollow(user.id)))
  );
}

function UserGrid(users: User[], onFollow: (id: number) => void) {
  return div(
    { className: 'user-grid' },
    list(() => users, user => UserCard(user, onFollow))
  );
}

// App state
let users: User[] = [
  {
    id: 1,
    name: 'Alice',
    avatar: '/avatars/alice.jpg',
    bio: 'Software developer',
    followers: 142
  },
  {
    id: 2,
    name: 'Bob',
    avatar: '/avatars/bob.jpg',
    bio: 'Designer',
    followers: 89
  }
];

function handleFollow(id: number) {
  const user = users.find(u => u.id === id);
  if (user) {
    user.followers++;
    update();
  }
}

const app = div(
  { className: 'app' },
  h1('User Directory'),
  UserGrid(users, handleFollow)
);

render(app, document.body);`},{id:"animations",title:"Animations",description:"Smooth transitions with CSS and reactive styles.",code:`import 'nuclo';

let isVisible = true;
let opacity = 1;
let scale = 1;

function toggle() {
  isVisible = !isVisible;
  update();
}

function animate() {
  let start = Date.now();

  function tick() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / 1000, 1); // 1 second animation

    opacity = isVisible ? progress : 1 - progress;
    scale = isVisible ? 0.5 + progress * 0.5 : 1 - progress * 0.5;

    update();

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  tick();
}

const app = div(
  button('Toggle', on('click', () => {
    toggle();
    animate();
  })),

  div(
    {
      className: 'animated-box',
      style: {
        opacity: () => opacity,
        transform: () => \`scale(\${scale})\`,
        transition: 'opacity 0.3s, transform 0.3s'
      }
    },
    'Animated Content'
  )
);

render(app, document.body);`},{id:"routing",title:"Simple Routing",description:"Client-side routing without a framework.",code:`import 'nuclo';

type Route = 'home' | 'about' | 'contact' | 'notfound';

let currentRoute: Route = 'home';
let params: Record<string, string> = {};

function navigate(route: Route) {
  currentRoute = route;
  window.history.pushState({}, '', \`/\${route}\`);
  update();
}

// Simple router
window.addEventListener('popstate', () => {
  const path = window.location.pathname.slice(1) || 'home';
  currentRoute = path as Route;
  update();
});

// Page components
function HomePage() {
  return div(
    h1('Home Page'),
    p('Welcome to our website!'),
    button('Go to About', on('click', () => navigate('about')))
  );
}

function AboutPage() {
  return div(
    h1('About Page'),
    p('Learn more about us.'),
    button('Go to Contact', on('click', () => navigate('contact')))
  );
}

function ContactPage() {
  return div(
    h1('Contact Page'),
    p('Get in touch!'),
    button('Go Home', on('click', () => navigate('home')))
  );
}

function NotFoundPage() {
  return div(
    h1('404 - Not Found'),
    p('Page not found'),
    button('Go Home', on('click', () => navigate('home')))
  );
}

const app = div(
  { className: 'app' },

  nav(
    button('Home', on('click', () => navigate('home'))),
    button('About', on('click', () => navigate('about'))),
    button('Contact', on('click', () => navigate('contact')))
  ),

  main(
    when(() => currentRoute === 'home', HomePage())
    .when(() => currentRoute === 'about', AboutPage())
    .when(() => currentRoute === 'contact', ContactPage())
    .else(NotFoundPage())
  )
);

render(app, document.body);`},{id:"styled-card",title:"Styled Card",description:"Using nuclo's CSS-in-JS styling system to create a polished product card component with hover effects.",code:`import 'nuclo';

// Setup style queries
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Define reusable styles
const styles = {
  page: cn(
    bg('#f5f5f5')
      .minHeight('100vh')
      .padding('1rem'),
    { medium: padding('2rem') }
  ),

  header: cn(
    textAlign('center')
      .marginBottom('2rem')
  ),

  title: cn(
    margin('0 0 0.5rem 0')
      .fontSize('2rem')
      .color('#1a1a2e'),
    { large: fontSize('2.5rem') }
  ),

  subtitle: cn(
    margin('0')
      .color('#666')
  ),

  grid: cn(
    grid()
      .gridTemplateColumns('1fr')
      .gap('1.5rem')
      .maxWidth('1200px')
      .margin('0 auto'),
    {
      medium: gridTemplateColumns('repeat(2, 1fr)'),
      large: gridTemplateColumns('repeat(3, 1fr)').gap('2rem')
    }
  ),

  card: cn(
    bg('white')
      .borderRadius('12px')
      .overflow('hidden')
      .transition('all 0.3s ease')
      .cursor('pointer')
  ),

  cardImage: cn(
    position('relative')
      .overflow('hidden')
      .height('200px')
  ),

  image: cn(
    width('100%')
      .height('100%')
      .objectFit('cover')
      .transition('transform 0.3s ease')
  ),

  overlay: cn(
    position('absolute')
      .top('0')
      .left('0')
      .right('0')
      .bottom('0')
      .bg('rgba(0,0,0,0.5)')
      .flex()
      .alignItems('center')
      .justifyContent('center')
  ),

  overlayText: cn(
    color('white')
      .fontSize('1.25rem')
      .fontWeight('bold')
  ),

  content: cn(
    padding('1.5rem')
  ),

  cardTitle: cn(
    margin('0 0 0.5rem 0')
      .fontSize('1.25rem')
      .fontWeight('600')
      .color('#1a1a2e')
  ),

  cardDesc: cn(
    margin('0 0 1rem 0')
      .fontSize('0.9rem')
      .color('#666')
      .lineHeight('1.5')
  ),

  footer: cn(
    flex()
      .justifyContent('space-between')
      .alignItems('center')
  ),

  price: cn(
    fontSize('1.5rem')
      .fontWeight('bold')
      .color('#3b82f6')
  ),

  button: cn(
    color('white')
      .padding('0.75rem 1.5rem')
      .borderRadius('8px')
      .border('none')
      .fontSize('0.9rem')
      .fontWeight('600')
      .transition('background-color 0.2s')
  )
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

let products: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling headphones with 30-hour battery.',
    price: 299.99,
    image: '/images/headphones.jpg',
    inStock: true
  },
  {
    id: 2,
    name: 'Smart Watch',
    description: 'Track your fitness, receive notifications, and more.',
    price: 399.99,
    image: '/images/watch.jpg',
    inStock: true
  },
  {
    id: 3,
    name: 'Portable Speaker',
    description: 'Waterproof speaker with incredible bass and clarity.',
    price: 149.99,
    image: '/images/speaker.jpg',
    inStock: false
  }
];

function ProductCard(product: Product) {
  let isHovered = false;

  return div(
    styles.card,
    {
      // Reactive style: a function that returns the style object
      style: () => ({
        boxShadow: isHovered
          ? '0 10px 40px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      })
    },
    on('mouseenter', () => { isHovered = true; update(); }),
    on('mouseleave', () => { isHovered = false; update(); }),

    // Image container
    div(styles.cardImage,
      img({
        src: product.image,
        alt: product.name,
        style: () => ({
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        })
      }, styles.image),

      // Out of stock overlay
      when(() => !product.inStock,
        div(styles.overlay,
          span(styles.overlayText, 'Out of Stock')
        )
      )
    ),

    // Content
    div(styles.content,
      h3(styles.cardTitle, product.name),
      p(styles.cardDesc, product.description),

      div(styles.footer,
        span(styles.price, () => \`$\${product.price.toFixed(2)}\`),

        button(
          styles.button,
          {
            style: () => ({
              backgroundColor: product.inStock ? '#3b82f6' : '#ccc',
              cursor: product.inStock ? 'pointer' : 'not-allowed'
            })
          },
          on('click', () => {
            if (product.inStock) {
              console.log(\`Added \${product.name} to cart\`);
            }
          }),
          product.inStock ? 'Add to Cart' : 'Unavailable'
        )
      )
    )
  );
}

const app = div(
  styles.page,

  div(styles.header,
    h1(styles.title, 'Featured Products'),
    p(styles.subtitle, 'Discover our latest collection')
  ),

  div(styles.grid,
    list(() => products, product => ProductCard(product))
  )
);

render(app, document.body);`}],S={installNpm:{lang:"bash",code:"npm install nuclo"},installYarn:{lang:"bash",code:"yarn add nuclo"},installPnpm:{lang:"bash",code:"pnpm add nuclo"},denoImport:{lang:"typescript",code:"import 'npm:nuclo';"},denoJson:{lang:"json",code:`{
  "imports": {
    "nuclo": "npm:nuclo"
  }
}`},denoUsage:{lang:"typescript",code:"import 'nuclo';"},tsconfigTypes:{lang:"json",code:`{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`},typesReference:{lang:"typescript",code:'/// <reference types="nuclo/types" />'},firstApp:{lang:"typescript",code:`import 'nuclo';

// State - just plain JavaScript variables
let count = 0;

// Create the UI
const app = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  })),
  button('Decrement', on('click', () => {
    count--;
    update();
  })),
  button('Reset', on('click', () => {
    count = 0;
    update();
  }))
);

// Render to the DOM
render(app, document.body);`},batchUpdates:{lang:"typescript",code:`// Good: Multiple changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  todos.push({ id: 1, text: 'New todo', done: false });
  update(); // One update for all changes
}

// Works but inefficient: Update after each change
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
  // 3 updates instead of 1!
}`},reactiveText:{lang:"typescript",code:`let name = 'World';

div(
  'Hello, ',
  () => name,  // Reactive
  '!'
);

// After name changes and update() is called,
// the div will show "Hello, Alice!"`},reactiveAttributes:{lang:"typescript",code:`let isActive = false;

div({
  className: () => isActive ? 'active' : 'inactive',
  'aria-pressed': () => isActive,
  disabled: () => !isActive
});`},reactiveStyles:{lang:"typescript",code:`let opacity = 1;

div({
  style: {
    opacity: () => opacity,
    display: () => opacity > 0 ? 'block' : 'none'
  }
});`},complexExpressions:{lang:"typescript",code:"let items = [1, 2, 3];\n\ndiv(\n  () => `You have ${items.length} item${items.length !== 1 ? 's' : ''}`\n);"},eventBasic:{lang:"typescript",code:`button('Click me',
  on('click', () => {
    console.log('Clicked!');
  })
);`},eventMultiple:{lang:"typescript",code:`input(
  on('input', (e) => {
    inputValue = e.target.value;
    update();
  }),
  on('focus', () => {
    isFocused = true;
    update();
  }),
  on('blur', () => {
    isFocused = false;
    update();
  })
);`},eventOptions:{lang:"typescript",code:`div(
  on('scroll', handleScroll, { passive: true }),
  on('click', handleClick, { capture: true, once: true })
);`},keyboardEvents:{lang:"typescript",code:`input(
  on('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  })
);`},stylingSetup:{lang:"typescript",code:`// Create once (typically in styles.ts)
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Chain style helpers and wrap with cn()
const buttonStyle = cn(
  bg('#3b82f6')
    .color('white')
    .padding('0.75rem 1.5rem')
    .borderRadius('8px')
    .border('none')
    .cursor('pointer')
);

// Use in your component
button(buttonStyle, 'Click me');`},responsiveStyles:{lang:"typescript",code:`const responsiveCard = cn(
  padding('1rem').bg('white'),
  {
    medium: padding('1.5rem'),
    large: padding('2rem').maxWidth('800px')
  }
);`},dynamicStyles:{lang:"typescript",code:`// For dynamic styles, use a function that returns the style object
let isActive = false;

const baseStyle = cn(bg('white').transition('all 0.3s'));

div(
  baseStyle,
  {
    // Reactive style: function returns the style object
    style: () => ({
      backgroundColor: isActive ? 'green' : 'gray',
      transform: isActive ? 'scale(1.05)' : 'scale(1)'
    })
  },
  on('click', () => { isActive = !isActive; update(); }),
  'Toggle me'
);`},bestPracticeBatch:{lang:"typescript",code:`// Good
function handleMultipleChanges() {
  state.field1 = value1;
  state.field2 = value2;
  state.field3 = value3;
  update();
}

// Avoid
function handleMultipleChanges() {
  state.field1 = value1;
  update();
  state.field2 = value2;
  update();
  state.field3 = value3;
  update();
}`},bestPracticeComputed:{lang:"typescript",code:`// Extract complex logic into functions
function activeCount() {
  return todos.filter(t => !t.done).length;
}

div(
  () => \`\${activeCount()} tasks remaining\`
);`},componentFunctions:{lang:"typescript",code:`function UserCard(user) {
  return div(
    { className: 'user-card' },
    img({ src: user.avatar, alt: user.name }),
    h3(user.name),
    p(user.bio)
  );
}

// Use it
div(
  UserCard(currentUser)
);`},mutableState:{lang:"typescript",code:`// Just use plain objects and arrays
let user = {
  name: 'Alice',
  email: 'alice@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
};

let todos = [
  { id: 1, text: 'Learn nuclo', done: true },
  { id: 2, text: 'Build awesome app', done: false }
];`},asyncFlow:{lang:"typescript",code:`let status = 'idle'; // 'idle' | 'loading' | 'success' | 'error'
let data = null;
let error = null;

async function fetchData() {
  status = 'loading';
  update();

  try {
    const response = await fetch('/api/data');
    data = await response.json();
    status = 'success';
  } catch (err) {
    error = err.message;
    status = 'error';
  }

  update();
}`}},h={overviewQuickExample:{lang:"typescript",code:`import 'nuclo';

// Create style queries helper (usually done once)
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Define styles by chaining methods
const buttonStyle = cn(
  bg('#3b82f6')
    .color('white')
    .padding('0.75rem 1.5rem')
    .borderRadius('8px')
    .border('none')
    .cursor('pointer')
    .fontWeight('600')
    .transition('all 0.2s ease')
);

// Use in your component
button(buttonStyle, 'Click me');`},styleBuilderUsage:{lang:"typescript",code:`// Each helper returns a StyleBuilder
const builder = bg('#FF0000');

// Chain more properties
const styles = bg('#FF0000')
  .padding('1rem')
  .fontSize('16px')
  .borderRadius('4px');

// Get the class name directly
const className = styles.getClassName();  // Returns: "n3a7f2b1"

// Or use with cn() for responsive support
const responsive = cn(styles);`},styleBuilderMethods:{lang:"typescript",code:`// Get accumulated styles as object
builder.getStyles()  // { 'background-color': '#FF0000', ... }

// Generate CSS class name
builder.getClassName()  // "n3a7f2b1"
builder.getClassName('btn')  // "btn-3a7f2b1" (with prefix)

// Add custom CSS property
builder.add('custom-property', 'value')

// Convert to string (same as getClassName)
builder.toString()  // "n3a7f2b1"`},styleBuilderClass:{lang:"typescript",code:`// This creates a <style> tag in <head> with:
// .n3a7f2b1 { background-color: #3b82f6; padding: 1rem; }

const style = cn(bg('#3b82f6').padding('1rem'));
div(style, 'Content');`},styleHelpersBasic:{lang:"typescript",code:`// Start with any helper, chain the rest
const cardStyle = cn(
  bg('white')
    .padding('1.5rem')
    .borderRadius('12px')
    .boxShadow('0 4px 6px rgba(0,0,0,0.1)')
);

div(cardStyle, 'Card content');`},styleHelpersList:{lang:"typescript",code:`// Layout
display('flex')
position('relative')
width('100%')
height('auto')
minWidth('300px')
maxWidth('800px')

// Spacing
padding('1rem')
paddingTop('10px')
margin('0 auto')
marginBottom('20px')

// Typography
fontSize('16px')
fontWeight('bold')
fontFamily('Arial, sans-serif')
lineHeight('1.5')
textAlign('center')

// Colors
bg('#f0f0f0')
color('#333')

// Borders
border('1px solid #ccc')
borderRadius('8px')

// Flexbox
flex()  // shorthand for display: flex
flexDirection('column')
alignItems('center')
justifyContent('space-between')
gap('1rem')

// Effects
boxShadow('0 2px 4px rgba(0,0,0,0.1)')
opacity('0.8')
transition('all 0.3s ease')
transform('translateY(-2px)')`},styleHelpersShorthand:{lang:"typescript",code:`// bold() - shorthand for fontWeight('bold')
bold()

// center() - centers content on both axes
center()  // alignItems('center') + justifyContent('center')

// flex() - can be shorthand or take a value
flex()  // display: flex
flex('1')  // flex: 1

// grid() - shorthand for display: grid
grid()`},styleQueriesSetup:{lang:"typescript",code:`// Create once, typically in a styles.ts file
// New syntax with explicit @media prefix (recommended)
export const cn = createStyleQueries({
  small: '@media (min-width: 480px)',
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)'
});

// Backward compatible: without prefix (treated as @media)
export const cn = createStyleQueries({
  small: '(min-width: 480px)',
  medium: '(min-width: 768px)',
  large: '(min-width: 1024px)',
});`},styleQueriesDefaults:{lang:"typescript",code:`// Default styles only
const style = cn(
  padding('1rem').bg('white')
);

// With responsive overrides
const responsiveStyle = cn(
  // Default (mobile-first)
  padding('1rem')
    .fontSize('14px')
    .width('100%'),
  // Breakpoint overrides
  {
    medium: padding('1.5rem').fontSize('16px'),
    large: padding('2rem').fontSize('18px').maxWidth('800px')
  }
);`},styleQueriesGeneratedCss:{lang:"typescript",code:`// This generates CSS like:
// .n3a7f2b1 { padding: 1rem; font-size: 14px; width: 100%; }
// @media (min-width: 768px) {
//   .n3a7f2b1 { padding: 1.5rem; font-size: 16px; }
// }
// @media (min-width: 1024px) {
//   .n3a7f2b1 { padding: 2rem; font-size: 18px; max-width: 800px; }
// }

const style = cn(
  padding('1rem').fontSize('14px').width('100%'),
  {
    medium: padding('1.5rem').fontSize('16px'),
    large: padding('2rem').fontSize('18px').maxWidth('800px')
  }
);`},styleQueriesQueriesOnly:{lang:"typescript",code:`// You can also use just queries without default styles
const hideOnMobile = cn({
  small: display('block'),
  // Implicitly hidden on smaller screens
});`},styleQueriesContainer:{lang:"typescript",code:`const cn = createStyleQueries({
  containerSmall: '@container (min-width: 300px)',
  containerMedium: '@container (min-width: 500px)',
  containerLarge: '@container (min-width: 800px)',
});

const cardStyle = cn(
  padding('1rem').fontSize('14px'),
  {
    containerSmall: fontSize('16px'),
    containerMedium: padding('1.5rem').fontSize('18px'),
    containerLarge: padding('2rem').fontSize('20px'),
  }
);`},styleQueriesFeature:{lang:"typescript",code:`const cn = createStyleQueries({
  hasGrid: '@supports (display: grid)',
  hasSubgrid: '@supports (grid-template-columns: subgrid)',
  hasContainerQuery: '@supports (container-type: inline-size)',
});

const layoutStyle = cn(
  display('flex').flexWrap('wrap'),  // Fallback
  {
    hasGrid: display('grid').gridTemplateColumns('repeat(3, 1fr)'),
  }
);`},styleQueriesExamples:{lang:"typescript",code:`const cn = createStyleQueries({
  // Media queries for viewport-based responsive design
  small: '@media (min-width: 480px)',
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)',

  // Container queries for component-based responsive design
  containerWide: '@container (min-width: 600px)',

  // Feature queries for progressive enhancement
  hasGrid: '@supports (display: grid)',
});

const componentStyle = cn(
  width('100%').padding('1rem'),
  {
    medium: maxWidth('800px').margin('0 auto'),
    containerWide: padding('2rem'),
    hasGrid: display('grid').gap('1rem'),
  }
);`},layoutDisplayPosition:{lang:"typescript",code:`display('flex')
display('grid')
display('block')
display('inline-block')
display('none')

position('relative')
position('absolute')
position('fixed')
position('sticky')

top('0')
right('10px')
bottom('auto')
left('50%')
zIndex('100')`},layoutSizing:{lang:"typescript",code:`width('100%')
height('200px')
minWidth('300px')
maxWidth('800px')
minHeight('100vh')
maxHeight('500px')
boxSizing('border-box')`},layoutSpacing:{lang:"typescript",code:`// Padding
padding('1rem')
padding('1rem 2rem')  // vertical | horizontal
paddingTop('10px')
paddingRight('15px')
paddingBottom('10px')
paddingLeft('15px')

// Margin
margin('auto')
margin('0 auto')
marginTop('20px')
marginBottom('20px')`},layoutOverflow:{lang:"typescript",code:`overflow('hidden')
overflow('auto')
overflow('scroll')
overflowX('auto')
overflowY('hidden')`},typographyFont:{lang:"typescript",code:`fontSize('16px')
fontSize('1.25rem')
fontWeight('bold')
fontWeight('600')
fontFamily("'Inter', system-ui, sans-serif")
fontStyle('italic')
lineHeight('1.5')
letterSpacing('0.05em')`},typographyText:{lang:"typescript",code:`color('#333')
textAlign('center')
textAlign('left')
textDecoration('underline')
textDecoration('none')
textTransform('uppercase')
whiteSpace('nowrap')
wordBreak('break-word')`},typographySystem:{lang:"typescript",code:`const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

const heading = cn(
  fontSize('1.5rem')
    .fontWeight('700')
    .lineHeight('1.2')
    .color('#1a1a2e')
    .margin('0 0 1rem 0'),
  {
    medium: fontSize('2rem'),
    large: fontSize('2.5rem')
  }
);

const bodyText = cn(
  fontSize('1rem')
    .lineHeight('1.6')
    .color('#4a4a4a')
);

h1(heading, 'Page Title');
p(bodyText, 'Body content here...');`},colorsBasic:{lang:"typescript",code:`color('red')
color('#ff0000')
color('rgb(255, 0, 0)')
color('rgba(255, 0, 0, 0.5)')

bg('blue')
bg('#3b82f6')
bg('transparent')
backgroundColor('white')`},colorsGradients:{lang:"typescript",code:`// Linear gradient
bg('linear-gradient(to right, #667eea, #764ba2)')
bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')

// Radial gradient
bg('radial-gradient(circle, #ff0000, #0000ff)')`},colorsBackground:{lang:"typescript",code:`backgroundImage('url(/images/bg.jpg)')
backgroundRepeat('no-repeat')
backgroundPosition('center')
backgroundSize('cover')`},flexContainer:{lang:"typescript",code:`// Enable flexbox
flex()  // display: flex

// Direction
flexDirection('row')
flexDirection('column')
flexDirection('row-reverse')

// Wrapping
flexWrap('wrap')
flexWrap('nowrap')

// Alignment
justifyContent('flex-start')
justifyContent('center')
justifyContent('space-between')
justifyContent('space-around')

alignItems('stretch')
alignItems('center')
alignItems('flex-start')
alignItems('flex-end')

// Shorthand for centering
center()  // alignItems + justifyContent center

// Gap
gap('1rem')
gap('10px 20px')  // row | column`},flexItem:{lang:"typescript",code:`flexGrow('1')
flexShrink('0')
flexBasis('200px')
alignSelf('center')`},flexNavbarExample:{lang:"typescript",code:`const navbar = cn(
  flex()
    .justifyContent('space-between')
    .alignItems('center')
    .padding('1rem 2rem')
    .bg('#1a1a2e')
);

const navLinks = cn(
  flex()
    .gap('1rem')
    .alignItems('center')
);

nav(navbar,
  div('Logo'),
  div(navLinks,
    a('Home'),
    a('About'),
    a('Contact')
  )
);`},gridContainer:{lang:"typescript",code:`// Enable grid
grid()  // display: grid

// Template
gridTemplateColumns('1fr 1fr 1fr')
gridTemplateColumns('repeat(3, 1fr)')
gridTemplateColumns('repeat(auto-fill, minmax(250px, 1fr))')
gridTemplateRows('auto 1fr auto')

// Gap
gap('1rem')
gap('1rem 2rem')  // row | column`},gridItem:{lang:"typescript",code:`gridColumn('1 / 3')
gridColumn('span 2')
gridRow('1 / 2')
gridArea('header')`},gridResponsiveExample:{lang:"typescript",code:`const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

const cardGrid = cn(
  grid()
    .gridTemplateColumns('1fr')
    .gap('1.5rem')
    .padding('2rem'),
  {
    medium: gridTemplateColumns('repeat(2, 1fr)'),
    large: gridTemplateColumns('repeat(3, 1fr)')
  }
);

const card = cn(
  bg('white')
    .borderRadius('12px')
    .padding('1.5rem')
    .boxShadow('0 2px 8px rgba(0,0,0,0.1)')
);

div(cardGrid,
  list(() => products, product =>
    div(card, product.name)
  )
);`},effectsShadows:{lang:"typescript",code:`boxShadow('0 2px 4px rgba(0,0,0,0.1)')
boxShadow('0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)')
boxShadow('inset 0 2px 4px rgba(0,0,0,0.1)')
boxShadow('none')`},effectsVisibility:{lang:"typescript",code:`opacity('1')
opacity('0.5')
opacity('0')
visibility('hidden')
visibility('visible')`},effectsTransitions:{lang:"typescript",code:`transition('all 0.3s ease')
transition('opacity 0.3s, transform 0.3s')
transition('background-color 0.2s ease-in-out')`},effectsTransforms:{lang:"typescript",code:`transform('translateX(10px)')
transform('translateY(-50%)')
transform('rotate(45deg)')
transform('scale(1.1)')
transform('translate(-50%, -50%) rotate(45deg)')
transformOrigin('center')`},effectsFilters:{lang:"typescript",code:`filter('blur(4px)')
filter('brightness(1.2)')
filter('grayscale(100%)')
backdropFilter('blur(10px)')`},effectsHover:{lang:"typescript",code:`// For hover effects, use a reactive style function
let isHovered = false;

const cardBase = cn(
  bg('white')
    .borderRadius('12px')
    .padding('1.5rem')
    .transition('all 0.3s ease')
);

div(
  cardBase,
  {
    // Reactive style: a function that returns the style object
    style: () => ({
      boxShadow: isHovered
        ? '0 10px 40px rgba(0,0,0,0.15)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transform: isHovered
        ? 'translateY(-4px)'
        : 'translateY(0)'
    })
  },
  on('mouseenter', () => { isHovered = true; update(); }),
  on('mouseleave', () => { isHovered = false; update(); }),
  'Hover me'
);`},organizingTheme:{lang:"typescript",code:`// styles.ts
import 'nuclo';

// Theme constants
export const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    text: '#1f2937',
    textLight: '#6b7280',
    bg: '#ffffff',
    bgAlt: '#f9fafb',
    border: '#e5e7eb',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  }
};

// Create style queries
export const cn = createStyleQueries({
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
});`},organizingStyles:{lang:"typescript",code:`// styles.ts (continued)
export const styles = {
  // Layout
  container: cn(
    width('100%')
      .maxWidth('1200px')
      .margin('0 auto')
      .padding(theme.spacing.md),
    {
      md: padding(theme.spacing.lg),
      lg: padding(theme.spacing.xl),
    }
  ),

  // Card
  card: cn(
    bg(theme.colors.bg)
      .borderRadius(theme.borderRadius.lg)
      .padding(theme.spacing.lg)
      .boxShadow(theme.shadows.md)
  ),

  // Button variants
  btnPrimary: cn(
    bg(theme.colors.primary)
      .color('white')
      .padding(\`\${theme.spacing.sm} \${theme.spacing.lg}\`)
      .borderRadius(theme.borderRadius.md)
      .border('none')
      .fontWeight('600')
      .cursor('pointer')
      .transition('all 0.2s ease')
  ),

  btnSecondary: cn(
    bg('transparent')
      .color(theme.colors.primary)
      .padding(\`\${theme.spacing.sm} \${theme.spacing.lg}\`)
      .borderRadius(theme.borderRadius.md)
      .border(\`2px solid \${theme.colors.primary}\`)
      .fontWeight('600')
      .cursor('pointer')
      .transition('all 0.2s ease')
  ),

  // Form elements
  input: cn(
    width('100%')
      .padding(theme.spacing.md)
      .border(\`1px solid \${theme.colors.border}\`)
      .borderRadius(theme.borderRadius.md)
      .fontSize('1rem')
      .transition('border-color 0.2s')
  ),

  // Typography
  h1: cn(
    fontSize('1.875rem')
      .fontWeight('700')
      .color(theme.colors.text)
      .lineHeight('1.2')
      .margin('0'),
    {
      md: fontSize('2.25rem'),
      lg: fontSize('3rem'),
    }
  ),

  text: cn(
    fontSize('1rem')
      .color(theme.colors.textLight)
      .lineHeight('1.6')
  ),
};`},organizingUsage:{lang:"typescript",code:`// app.ts
import { cn, theme, styles as s } from './styles';

const app = div(
  s.container,

  div(s.card,
    h1(s.h1, 'Welcome'),
    p(s.text, 'This is styled with nuclo CSS-in-JS'),

    div(
      flex().gap(theme.spacing.md),
      button(s.btnPrimary, 'Primary'),
      button(s.btnSecondary, 'Secondary')
    )
  )
);

render(app, document.body);`}},vi=`import 'nuclo';

let count = 0;

const counter = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);`;let $=0;function Si(){return div(i(display("flex").flexDirection("column").gap("12px").padding("24px").backgroundColor(r.bgCard).border(`1px solid ${r.border}`).borderRadius("12px")),h3(i(fontSize("16px").fontWeight("600").color(r.text)),"Live Counter Demo"),div(i(display("flex").alignItems("center").gap("12px")),span(i(fontSize("32px").fontWeight("700").color(r.text)),()=>$),span(i(color(r.textDim)),()=>$%2===0?"even":"odd")),div(i(display("flex").gap("8px")),button(t.btnSecondary,"-",on("click",()=>{$--,update()})),button(t.btnSecondary,"Reset",on("click",()=>{$=0,update()})),button(t.btnPrimary,{style:t.btnPrimaryStyle},"+",on("click",()=>{$++,update()}))))}function F(e,o,n){return div(t.featureCard,div(t.featureIcon,{style:t.featureIconStyle},e),h3(t.featureTitle,o),p(t.featureDesc,n),on("mouseenter",l=>{const s=l.currentTarget;s.style.borderColor=r.primary,s.style.transform="translateY(-4px)",s.style.boxShadow=`0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${r.primaryGlow}`}),on("mouseleave",l=>{const s=l.currentTarget;s.style.borderColor=r.border,s.style.transform="translateY(0)",s.style.boxShadow="none"}))}const wi=["counter","todo","search","async","styled-card","subtasks"],ki=R.filter(e=>wi.includes(e.id));function Ci(e){B("examples"),setTimeout(()=>{const o=document.getElementById(e);o&&o.scrollIntoView({behavior:"smooth",block:"start"})},150)}function Pi(){return div(section(t.hero,h1(t.heroTitle,"Build ",span(t.heroTitleAccent,{style:t.heroTitleAccentStyle},"Faster"),", ",span(t.heroTitleAccent,{style:t.heroTitleAccentStyle},"Reactive")," Interfaces."),p(t.heroSubtitle,"A lightweight, flexible, component-based framework for the modern web. Just functions, plain objects, and explicit updates."),div(t.heroButtons,button(t.btnPrimary,{style:t.btnPrimaryStyle},i(display("flex").alignItems("center").gap("8px")),"Get Started",ai(),on("click",()=>B("getting-started")),on("mouseenter",e=>{e.target.style.backgroundColor=r.primaryHover,e.target.style.transform="translateY(-2px)",e.target.style.boxShadow=`0 0 30px ${r.primaryGlow}`}),on("mouseleave",e=>{e.target.style.backgroundColor=r.primary,e.target.style.transform="translateY(0)",e.target.style.boxShadow=`0 0 20px ${r.primaryGlow}`})),button(t.btnSecondary,"View Demo",on("click",()=>B("examples")),on("mouseenter",e=>{e.target.style.borderColor=r.primary,e.target.style.color=r.primary,e.target.style.transform="translateY(-2px)"}),on("mouseleave",e=>{e.target.style.borderColor=r.borderLight,e.target.style.color=r.text,e.target.style.transform="translateY(0)"})))),section(i(padding("0 48px 100px").maxWidth("800px").margin("0 auto")),div(i(borderRadius("16px").border(`1px solid ${r.border}`).overflow("hidden")),{style:t.glowBoxStyle},div(i(padding("12px 20px").backgroundColor(r.bgLight).borderBottom(`1px solid ${r.border}`).display("flex").alignItems("center").gap("8px")),span(i(width("12px").height("12px").borderRadius("50%").backgroundColor("#ff5f57"))),span(i(width("12px").height("12px").borderRadius("50%").backgroundColor("#febc2e"))),span(i(width("12px").height("12px").borderRadius("50%").backgroundColor("#28c840"))),span(i(marginLeft("auto").fontSize("13px").color(r.textDim)),"main.ts")),c(vi,"typescript",!1))),section(t.features,{style:t.featuresStyle},F(ei(),"Lightweight & Fast","Zero dependencies, tiny bundle size. Built for performance from the ground up with direct DOM manipulation."),F(ti(),"Component-Based","Build encapsulated components that manage their own state. Compose them to make complex UIs simple."),F(ri(),"Simple Reactivity","Explicit update() calls give you full control. No magic, no proxies, no hidden re-renders."),F(oi(),"Fine-Grained Updates","Only updates what changed. Elements are reused, branches are preserved, performance is maximized."),F(ni(),"TypeScript-First","Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime."),F(ii(),"Intuitive API","Global tag builders feel natural. Just use div(), span(), button() - no imports needed.")),section(t.section,h2(t.sectionTitle,"Quick Start"),p(t.sectionSubtitle,"Get up and running in seconds."),div(t.flexCol,t.gap32,div(h3(i(fontSize("18px").fontWeight("600").color(r.primary).marginBottom("16px")),"1. Install"),c("npm install nuclo","bash")),div(h3(i(fontSize("18px").fontWeight("600").color(r.primary).marginBottom("16px")),"2. Import and use"),c(`import 'nuclo';

// Now use div(), update(), on(), list(), when(), render() globally
const app = div(
  h1('Hello, Nuclo!'),
  p('Building UIs made simple.')
);

render(app, document.body);`,"typescript")),div(h3(i(fontSize("18px").fontWeight("600").color(r.primary).marginBottom("16px")),"3. Add TypeScript support"),c(`// tsconfig.json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`,"json"))),div(i(marginTop("32px")),h3(i(fontSize("18px").fontWeight("600").color(r.primary).marginBottom("16px")),"Try it live"),Si())),section(t.section,h2(t.sectionTitle,"Core Concepts"),p(t.sectionSubtitle,"Explicit updates, reactive functions, conditionals, list syncing, and styling."),div(t.demoContainer,{style:t.demoContainerStyle},div(t.demoPanel,div(t.demoPanelHeader,"Batch updates"),div(t.demoPanelContent,c(S.batchUpdates.code,S.batchUpdates.lang,!1))),div(t.demoPanel,div(t.demoPanelHeader,"Reactive functions"),div(t.demoPanelContent,c(S.reactiveText.code,S.reactiveText.lang,!1)))),div(i(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),div(t.featureCard,h3(t.featureTitle,"Conditional rendering"),c(`when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('Dashboard')
).else(
  div('Please log in')
);`,"typescript",!1)),div(t.featureCard,h3(t.featureTitle,"List synchronization"),c("list(() => items, (item, index) =>\n  div(() => `${index}: ${item.name}`)\n);","typescript",!1)),div(t.featureCard,h3(t.featureTitle,"CSS-in-JS styling"),c(h.overviewQuickExample.code,h.overviewQuickExample.lang,!1)))),section(t.section,h2(t.sectionTitle,"Examples"),p(t.sectionSubtitle,"Jump into any example from the original gallery."),div(i(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),...ki.map(e=>div(t.featureCard,h3(t.featureTitle,e.title),p(t.featureDesc,e.description),button(t.btnSecondary,"View Example",on("click",()=>Ci(e.id))))))))}function Ti(){return div(t.pageContent,h1(t.pageTitle,"Getting Started"),p(t.pageSubtitle,"Everything from the original Nuclo docs: installs, Deno support, first app walkthrough, explicit updates, events, styling, and best practices."),h2(t.h2,"Installation"),p(t.p,"Install with your preferred package manager:"),c(S.installNpm.code,S.installNpm.lang),c(S.installYarn.code,S.installYarn.lang),c(S.installPnpm.code,S.installPnpm.lang),p(t.p,"Deno works too—import directly from npm:"),c(S.denoImport.code,S.denoImport.lang),p(t.p,"Or add it to ",k("deno.json"),":"),c(S.denoJson.code,S.denoJson.lang),p(t.p,"Then import once to register global builders:"),c(S.denoUsage.code,S.denoUsage.lang),h2(t.h2,"TypeScript Setup"),p(t.p,"Nuclo ships full typings for 140+ HTML/SVG builders. Enable them globally with ",k("types"),"."),c(S.tsconfigTypes.code,S.tsconfigTypes.lang),p(t.p,"…or add a reference to your env definition file:"),c(S.typesReference.code,S.typesReference.lang),h2(t.h2,"Your First App"),p(t.p,"Straight from the original landing page: a counter that shows state, events, and explicit ",k("update()"),"."),c(S.firstApp.code,S.firstApp.lang),h3(t.h3,"How it works"),ul(t.ul,li(t.li,strong("Import:")," ",k("import 'nuclo'")," registers global builders"),li(t.li,strong("State:")," plain variables/objects—no hooks or stores"),li(t.li,strong("Reactive content:")," zero-arg functions rerender on ",k("update()")),li(t.li,strong("Events:")," attach listeners with ",k("on()")),li(t.li,strong("Render:")," mount once with ",k("render()"))),h2(t.h2,"Understanding update()"),p(t.p,k("update()")," is explicit: mutate freely, then call it once to refresh reactive functions."),h3(t.h3,"Batching updates"),c(S.batchUpdates.code,S.batchUpdates.lang),h3(t.h3,"Why explicit?"),ul(t.ul,li(t.li,"Performance: batch multiple mutations into one DOM update"),li(t.li,"Control: you decide exactly when the UI refreshes"),li(t.li,"Predictability: no hidden re-renders or proxies"),li(t.li,"Debugging: set a breakpoint on ",k("update()")," to trace changes")),h2(t.h2,"Reactive Functions"),p(t.p,"Any zero-arg function is reactive. Use them for text, attributes, and styles."),h3(t.h3,"Text content"),c(S.reactiveText.code,S.reactiveText.lang),h3(t.h3,"Attributes"),c(S.reactiveAttributes.code,S.reactiveAttributes.lang),h3(t.h3,"Styles"),c(S.reactiveStyles.code,S.reactiveStyles.lang),h3(t.h3,"Complex expressions"),c(S.complexExpressions.code,S.complexExpressions.lang),h2(t.h2,"Event Handling with on()"),p(t.p,"The ",k("on()")," helper returns modifiers for any DOM event."),h3(t.h3,"Basic events"),c(S.eventBasic.code,S.eventBasic.lang),h3(t.h3,"Multiple events"),c(S.eventMultiple.code,S.eventMultiple.lang),h3(t.h3,"Event options"),c(S.eventOptions.code,S.eventOptions.lang),h3(t.h3,"Keyboard helpers"),c(S.keyboardEvents.code,S.keyboardEvents.lang),h2(t.h2,"Styling"),p(t.p,"Nuclo ships a CSS-in-JS system with chainable helpers and ",k("createStyleQueries"),"."),h3(t.h3,"Using createStyleQueries"),c(S.stylingSetup.code,S.stylingSetup.lang),h3(t.h3,"Responsive styles"),c(S.responsiveStyles.code,S.responsiveStyles.lang),h3(t.h3,"Dynamic styles"),c(S.dynamicStyles.code,S.dynamicStyles.lang),h2(t.h2,"Best Practices"),h3(t.h3,"Batch your updates"),c(S.bestPracticeBatch.code,S.bestPracticeBatch.lang),h3(t.h3,"Use computed helpers"),c(S.bestPracticeComputed.code,S.bestPracticeComputed.lang),h3(t.h3,"Component-like functions"),c(S.componentFunctions.code,S.componentFunctions.lang),h3(t.h3,"Use plain objects/arrays"),c(S.mutableState.code,S.mutableState.lang),h3(t.h3,"Handle async flows"),c(S.asyncFlow.code,S.asyncFlow.lang),h2(t.h2,"Next Steps"),ul(t.ul,li(t.li,strong("Core API:")," learn ",k("when()"),", ",k("list()"),", and more"),li(t.li,strong("Tag Builders:")," explore all HTML and SVG elements"),li(t.li,strong("Styling:")," CSS-in-JS helpers and responsive design"),li(t.li,strong("Examples:")," run through the full demo gallery")))}const v={updateUsage:{lang:"typescript",code:`let count = 0;

button('Increment', on('click', () => {
  count++;
  update(); // Trigger UI update
}));`},renderUsage:{lang:"typescript",code:`const app = div(
  h1('My App'),
  p('Hello, world!')
);

render(app, document.body);`},listBasic:{lang:"typescript",code:`let todos = [
  { id: 1, text: 'Learn nuclo', done: false },
  { id: 2, text: 'Build app', done: false }
];

list(() => todos, (todo, index) =>
  div(
    { className: () => todo.done ? 'done' : '' },
    span(() => \`\${index + 1}. \${todo.text}\`),
    button('Toggle', on('click', () => {
      todo.done = !todo.done;
      update();
    }))
  )
);`},listIdentity:{lang:"typescript",code:`// ✓ Good: Mutate the object
todos[0].done = true;
update();

// ✗ Bad: Creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();

// ✓ Good: Mutate the array
todos.push(newTodo);
todos.sort((a, b) => a.id - b.id);
update();

// ✓ Also good: Reassign with filtered array
todos = todos.filter(t => !t.done);
update();`},listNested:{lang:"typescript",code:`// Nested lists
list(() => categories, category =>
  div(
    h3(category.name),
    list(() => category.items, item =>
      div(item.name)
    )
  )
);

// Filtered lists
list(() => todos.filter(t => !t.done), todo =>
  div(todo.text)
);`},whenBasic:{lang:"typescript",code:`let isLoggedIn = false;

when(() => isLoggedIn,
  div('Welcome back!')
).else(
  div('Please log in')
);`},whenRoles:{lang:"typescript",code:`let role = 'user'; // 'admin' | 'user' | 'guest'

when(() => role === 'admin',
  div('Admin Panel')
).when(() => role === 'user',
  div('User Dashboard')
).else(
  div('Guest View')
);`},whenElseBranch:{lang:"typescript",code:`when(() => showDetails,
  h2('Details'),
  p('Here are the details...'),
  button('Close', on('click', () => {
    showDetails = false;
    update();
  }))
);`},whenPreserve:{lang:"typescript",code:`// Elements persist across updates if the same branch is active
let count = 0;

when(() => count > 0,
  div('Count is positive')  // This div stays alive while count > 0
).else(
  div('Count is zero or negative')
);

// Multiple updates with count > 0 won't recreate the div
count = 5; update();
count = 10; update();
count = 15; update();  // Same div element throughout`},whenNestedConditions:{lang:"typescript",code:`when(() => user.isAuthenticated,
  when(() => user.hasPermission,
    div('Protected Content')
  ).else(
    div('Access Denied')
  )
).else(
  div('Please log in')
);`},onClick:{lang:"typescript",code:`button('Click me',
  on('click', (e) => {
    console.log('Button clicked!', e);
  })
);`},onMultipleEvents:{lang:"typescript",code:`input(
  on('input', (e) => {
    value = e.target.value;
    update();
  }),
  on('focus', () => {
    isFocused = true;
    update();
  }),
  on('blur', () => {
    isFocused = false;
    update();
  })
);`},onPassive:{lang:"typescript",code:`// Passive event for better scroll performance
div(
  on('scroll', handleScroll, { passive: true })
);

// Capture phase
div(
  on('click', handleClick, { capture: true })
);

// One-time event
button('Click once',
  on('click', handleClick, { once: true })
);`},onKeyboard:{lang:"typescript",code:`input(
  on('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  })
);`},onFormSubmit:{lang:"typescript",code:`form(
  on('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  }),

  input({ type: 'text', name: 'username' },
    on('input', (e) => {
      username = e.target.value;
      update();
    })
  ),

  button({ type: 'submit' }, 'Submit')
);`},tagBuilderBasic:{lang:"typescript",code:`// Just children
div('Hello, world!');

// Attributes + children
div(
  { className: 'container', id: 'main' },
  'Hello, world!'
);

// Nested elements
div(
  h1('Title'),
  p('Paragraph'),
  ul(
    li('Item 1'),
    li('Item 2')
  )
);`},svgExample:{lang:"typescript",code:`const icon = svg(
  { viewBox: '0 0 24 24', width: '24', height: '24' },
  circle({ cx: '12', cy: '12', r: '10', fill: 'blue' }),
  path({ d: 'M12 2 L12 22', stroke: 'white', 'stroke-width': '2' })
);`},attributesStatic:{lang:"typescript",code:`div({
  id: 'main',
  className: 'container',
  'data-test': 'value',
  'aria-label': 'Main content'
});`},attributesReactive:{lang:"typescript",code:`div({
  className: () => isActive ? 'active' : 'inactive',
  'aria-pressed': () => isActive,
  disabled: () => !isValid,
  hidden: () => !isVisible
});`},attributesStyle:{lang:"typescript",code:`// Object style
div({
  style: {
    color: 'red',
    fontSize: '16px',
    backgroundColor: () => isActive ? 'blue' : 'gray'
  }
});

// String style
div({
  style: 'color: red; font-size: 16px;'
});

// Reactive string style
div({
  style: () => \`color: \${color}; font-size: \${size}px;\`
});`},attributesBoolean:{lang:"typescript",code:`input({
  type: 'checkbox',
  checked: () => isChecked,
  disabled: () => isDisabled,
  required: true,
  readonly: false
});`},specialAttributes:{lang:"typescript",code:`// className (maps to 'class')
div({ className: 'my-class' });

// htmlFor (maps to 'for')
label({ htmlFor: 'input-id' }, 'Label');

// Data attributes
div({ 'data-id': '123', 'data-type': 'user' });`},classNameMerging:{lang:"typescript",code:`// Multiple className sources are merged
div(
  { className: 'base-class' },
  { className: 'additional-class' },
  { className: () => isActive ? 'active' : 'inactive' }
);
// Result: "base-class additional-class active" (or "inactive")`},classNameConditional:{lang:"typescript",code:`let isOpen = false;
let isError = false;

div({
  className: 'dropdown'  // Static class
}, {
  className: () => isOpen ? 'open' : ''  // Reactive class
}, {
  className: () => isError ? 'error' : ''  // Another reactive class
});

// With isOpen=true, isError=false: "dropdown open"
// With isOpen=true, isError=true: "dropdown open error"`},styleHelperMerging:{lang:"typescript",code:`// Style helpers that generate classes are also merged
const cardStyle = new StyleBuilder()
  .bg('white')
  .padding('1rem')
  .build();

div(
  { className: 'my-card' },
  cardStyle,  // Generated class is merged
  'Content'
);
// Result: "my-card n-abc123" (merged classes)`},classNameStatusPattern:{lang:"typescript",code:`// Common pattern for conditional styling
let status = 'active'; // 'active' | 'pending' | 'error'

div({
  className: () => {
    const classes = ['status-badge'];
    if (status === 'active') classes.push('badge-green');
    if (status === 'pending') classes.push('badge-yellow');
    if (status === 'error') classes.push('badge-red');
    return classes.join(' ');
  }
}, () => status);`},modifiersEvents:{lang:"typescript",code:`button('Click',
  on('click', handleClick),
  on('mouseenter', handleHover)
);`},modifiersStyles:{lang:"typescript",code:`div(
  bg('blue'),     // Style modifier
  padding('1rem') // Style modifier
);`},modifiersCustomFocus:{lang:"typescript",code:`// Example: Focus modifier
function focus() {
  return {
    __modifier: true,
    apply(element) {
      requestAnimationFrame(() => element.focus());
    }
  };
}

// Usage
input(focus());

// Example: Tooltip modifier
function tooltip(text: string) {
  return {
    __modifier: true,
    apply(element) {
      element.setAttribute('title', text);
      element.setAttribute('data-tooltip', text);
    }
  };
}

// Usage
button('Hover me', tooltip('Click to submit'));`}};function Bi(){return div(t.pageContent,h1(t.pageTitle,"Core API"),p(t.pageSubtitle,"The essential functions that power every Nuclo application: update(), render(), on(), list(), and when()."),h2(t.h2,{id:"update"},"update()"),p(t.p,"Trigger a synchronous refresh of every reactive function in your application."),c(v.updateUsage.code,v.updateUsage.lang),h3(t.h3,"Key Points"),ul(t.ul,li(t.li,"Call after batching mutations for best performance"),li(t.li,"Only zero-argument functions re-evaluate"),li(t.li,"Safe to call multiple times; prefer grouping work first")),h2(t.h2,{id:"render"},"render(element, container)"),p(t.p,"Mount an element tree to a DOM container (append, not replace)."),c(v.renderUsage.code,v.renderUsage.lang),h3(t.h3,"Key Points"),ul(t.ul,li(t.li,"Typical pattern: render one root that owns the whole app"),li(t.li,"You can render multiple trees if needed"),li(t.li,"Works with any element created by the tag builders")),h2(t.h2,{id:"on"},"on(event, handler, options?)"),p(t.p,"Attach event listeners with full TypeScript support."),c(v.onClick.code,v.onClick.lang),h3(t.h3,"Multiple Events"),p(t.p,"Attach multiple event handlers to the same element:"),c(v.onMultipleEvents.code,v.onMultipleEvents.lang),h3(t.h3,"Event Options"),p(t.p,"Pass standard event listener options:"),c(v.onPassive.code,v.onPassive.lang),h3(t.h3,"Keyboard Events"),c(v.onKeyboard.code,v.onKeyboard.lang),h3(t.h3,"Form Handling"),c(v.onFormSubmit.code,v.onFormSubmit.lang),h2(t.h2,{id:"list"},"list(provider, renderer)"),p(t.p,"Synchronize arrays to DOM nodes. Items stay mounted while object identity is stable—mutate objects in place instead of replacing them."),c(v.listBasic.code,v.listBasic.lang),h3(t.h3,"Object Identity"),p(t.p,"Nuclo tracks items by reference. Mutate objects to preserve their DOM elements:"),c(v.listIdentity.code,v.listIdentity.lang),h3(t.h3,"Nested Lists"),p(t.p,"Nested lists remain stable too:"),c(v.listNested.code,v.listNested.lang),h2(t.h2,{id:"when"},"when(condition, ...content)"),p(t.p,"Chain conditional branches; the first truthy branch wins and DOM is preserved when the branch stays the same."),h3(t.h3,"Basic Usage"),c(v.whenBasic.code,v.whenBasic.lang),h3(t.h3,"Multiple Conditions"),c(v.whenRoles.code,v.whenRoles.lang),h3(t.h3,"Content in Branches"),c(v.whenElseBranch.code,v.whenElseBranch.lang),h3(t.h3,"DOM Preservation"),p(t.p,"Elements persist across updates if the same branch is active:"),c(v.whenPreserve.code,v.whenPreserve.lang),h3(t.h3,"Nested Conditions"),c(v.whenNestedConditions.code,v.whenNestedConditions.lang))}function Ri(){const e=[{title:"Document Structure",tags:"html, head, body, header, footer, main, section, article, aside, nav"},{title:"Content Sectioning",tags:"h1, h2, h3, h4, h5, h6, div, span, p, blockquote, pre, code"},{title:"Lists",tags:"ul, ol, li, dl, dt, dd"},{title:"Forms",tags:"form, input, textarea, button, select, option, label, fieldset, legend"},{title:"Tables",tags:"table, thead, tbody, tfoot, tr, th, td, caption, col, colgroup"},{title:"Media",tags:"img, video, audio, source, track, canvas, svg"},{title:"Interactive",tags:"a, button, details, summary, dialog"},{title:"Text Formatting",tags:"strong, em, mark, small, del, ins, sub, sup, abbr, cite, q, kbd, samp, var"}];return div(t.pageContent,h1(t.pageTitle,"Tag Builders"),p(t.pageSubtitle,"Every HTML and SVG element is available globally after importing Nuclo. Build your UI with simple function calls."),h2(t.h2,{id:"overview"},"Overview"),p(t.p,"Tag builders accept children, attributes, event modifiers, and arrays. After ",k("import 'nuclo'"),", all builders are available globally."),c(v.tagBuilderBasic.code,v.tagBuilderBasic.lang),h2(t.h2,{id:"html-tags"},"HTML Tags"),p(t.p,"Full HTML5 coverage with 140+ elements:"),...e.map(o=>div(h3(i(fontSize("18px").fontWeight("600").marginTop("24px").marginBottom("12px")),o.title),pre(t.codeBlock,code(o.tags)))),p(t.p,i(marginTop("24px")),"And 100+ more—see ",a({href:"https://github.com/dan2dev/nuclo/blob/main/packages/nuclo/src/core/tagRegistry.ts",target:"_blank",rel:"noopener noreferrer"},k("the full registry")),"."),h2(t.h2,{id:"svg-tags"},"SVG Tags"),p(t.p,"Full SVG support for graphics and icons:"),c(`svg, circle, ellipse, line, path, polygon, polyline, rect,
g, defs, use, symbol, marker, clipPath, mask, pattern,
linearGradient, radialGradient, stop, text, tspan, textPath`,"text"),h3(t.h3,"SVG Example"),c(v.svgExample.code,v.svgExample.lang),h2(t.h2,{id:"attributes"},"Attributes"),p(t.p,"Pass attributes as objects—values can be static or reactive functions."),h3(t.h3,"Static Attributes"),c(v.attributesStatic.code,v.attributesStatic.lang),h3(t.h3,"Reactive Attributes"),p(t.p,"Use functions for dynamic values that update on ",k("update()"),":"),c(v.attributesReactive.code,v.attributesReactive.lang),h3(t.h3,"Style Objects"),p(t.p,"Styles can be objects, strings, or reactive functions:"),c(v.attributesStyle.code,v.attributesStyle.lang),h3(t.h3,"Boolean Attributes"),c(v.attributesBoolean.code,v.attributesBoolean.lang),h3(t.h3,"Special Attributes"),p(t.p,"Some attributes are mapped for convenience:"),c(v.specialAttributes.code,v.specialAttributes.lang),h2(t.h2,{id:"className-merging"},"className Merging"),p(t.p,"Multiple ",k("className")," values are merged rather than overwritten—static strings, reactive functions, and style helper modifiers all compose."),c(v.classNameMerging.code,v.classNameMerging.lang),h3(t.h3,"Conditional Classes"),c(v.classNameConditional.code,v.classNameConditional.lang),h3(t.h3,"With Style Helpers"),c(v.styleHelperMerging.code,v.styleHelperMerging.lang),h3(t.h3,"Status Pattern"),p(t.p,"Common pattern for conditional styling:"),c(v.classNameStatusPattern.code,v.classNameStatusPattern.lang),h2(t.h2,{id:"modifiers"},"Modifiers"),p(t.p,"Objects with ",k("__modifier")," allow behaviors beyond attributes."),h3(t.h3,"Event Modifiers"),c(v.modifiersEvents.code,v.modifiersEvents.lang),h3(t.h3,"Style Modifiers"),c(v.modifiersStyles.code,v.modifiersStyles.lang),h3(t.h3,"Custom Modifiers"),p(t.p,"Create your own modifiers for reusable behaviors:"),c(v.modifiersCustomFocus.code,v.modifiersCustomFocus.lang))}function Ii(){return div(t.pageContent,h1(t.pageTitle,"Styling"),p(t.pageSubtitle,"All of the original styling docs are here: chainable helpers, StyleBuilder utilities, responsive queries, and layout recipes."),h2(t.h2,"Overview"),p(t.p,"Nuclo's styling system is powered by chainable helpers that generate CSS classes for you. Start with any helper (",k("bg()"),", ",k("padding()"),", etc.), chain more, and wrap with ",k("createStyleQueries")," for responsive variants."),p(t.p,"Quick example straight from the legacy site:"),c(h.overviewQuickExample.code,h.overviewQuickExample.lang),h2(t.h2,"StyleBuilder"),p(t.p,"Each helper returns a StyleBuilder instance. You can chain helpers, pull out the generated class name, or read the computed styles."),h3(t.h3,"How it works"),c(h.styleBuilderUsage.code,h.styleBuilderUsage.lang),h3(t.h3,"StyleBuilder methods"),c(h.styleBuilderMethods.code,h.styleBuilderMethods.lang),h3(t.h3,"Generated CSS"),c(h.styleBuilderClass.code,h.styleBuilderClass.lang),h2(t.h2,"Style Helpers"),p(t.p,"95+ helpers mirror CSS properties: layout, spacing, typography, color, flexbox, grid, effects, and more. Chain them to build up reusable class names."),h3(t.h3,"Basic usage"),c(h.styleHelpersBasic.code,h.styleHelpersBasic.lang),h3(t.h3,"Available helpers (from the original reference)"),c(h.styleHelpersList.code,h.styleHelpersList.lang),h3(t.h3,"Shorthand helpers"),c(h.styleHelpersShorthand.code,h.styleHelpersShorthand.lang),h2(t.h2,"Style Queries"),p(t.p,"Use ",k("createStyleQueries")," to add media, container, or feature queries. Defaults can be merged with breakpoint overrides."),c(h.styleQueriesSetup.code,h.styleQueriesSetup.lang),h3(t.h3,"Defaults and overrides"),c(h.styleQueriesDefaults.code,h.styleQueriesDefaults.lang),h3(t.h3,"Generated CSS output"),c(h.styleQueriesGeneratedCss.code,h.styleQueriesGeneratedCss.lang,!1),h3(t.h3,"Query-only styles"),c(h.styleQueriesQueriesOnly.code,h.styleQueriesQueriesOnly.lang),h3(t.h3,"Container queries"),c(h.styleQueriesContainer.code,h.styleQueriesContainer.lang),h3(t.h3,"Feature queries"),c(h.styleQueriesFeature.code,h.styleQueriesFeature.lang),h3(t.h3,"Viewport breakpoints example"),c(h.styleQueriesExamples.code,h.styleQueriesExamples.lang),h2(t.h2,"Layout"),p(t.p,"Display, positioning, sizing, spacing, and overflow helpers pulled from the original docs."),h3(t.h3,"Display & position"),c(h.layoutDisplayPosition.code,h.layoutDisplayPosition.lang),h3(t.h3,"Sizing"),c(h.layoutSizing.code,h.layoutSizing.lang),h3(t.h3,"Spacing"),c(h.layoutSpacing.code,h.layoutSpacing.lang),h3(t.h3,"Overflow"),c(h.layoutOverflow.code,h.layoutOverflow.lang),h2(t.h2,"Typography"),p(t.p,"Font and text styling helpers."),h3(t.h3,"Font properties"),c(h.typographyFont.code,h.typographyFont.lang),h3(t.h3,"Text styling"),c(h.typographyText.code,h.typographyText.lang),h3(t.h3,"Typography system example"),c(h.typographySystem.code,h.typographySystem.lang),h2(t.h2,"Colors & Backgrounds"),h3(t.h3,"Colors"),c(h.colorsBasic.code,h.colorsBasic.lang),h3(t.h3,"Gradients"),c(h.colorsGradients.code,h.colorsGradients.lang),h3(t.h3,"Background properties"),c(h.colorsBackground.code,h.colorsBackground.lang),h2(t.h2,"Flexbox"),p(t.p,"Container and item helpers, plus an example navbar layout."),h3(t.h3,"Container helpers"),c(h.flexContainer.code,h.flexContainer.lang),h3(t.h3,"Item helpers"),c(h.flexItem.code,h.flexItem.lang),h3(t.h3,"Navbar example"),c(h.flexNavbarExample.code,h.flexNavbarExample.lang),h2(t.h2,"CSS Grid"),h3(t.h3,"Container helpers"),c(h.gridContainer.code,h.gridContainer.lang),h3(t.h3,"Item helpers"),c(h.gridItem.code,h.gridItem.lang),h3(t.h3,"Responsive card grid"),c(h.gridResponsiveExample.code,h.gridResponsiveExample.lang),h2(t.h2,"Effects & Transitions"),p(t.p,"Shadows, opacity, transitions, transforms, filters, and hover-friendly reactive styles."),h3(t.h3,"Box shadows"),c(h.effectsShadows.code,h.effectsShadows.lang),h3(t.h3,"Visibility"),c(h.effectsVisibility.code,h.effectsVisibility.lang),h3(t.h3,"Transitions"),c(h.effectsTransitions.code,h.effectsTransitions.lang),h3(t.h3,"Transforms"),c(h.effectsTransforms.code,h.effectsTransforms.lang),h3(t.h3,"Filters & backdrop"),c(h.effectsFilters.code,h.effectsFilters.lang),h3(t.h3,"Hover effects with reactive styles"),c(h.effectsHover.code,h.effectsHover.lang),h2(t.h2,"Organizing Styles"),p(t.p,"Reuse the theme + style modules from the legacy page: keep tokens, shared layout pieces, and component styles in one place."),h3(t.h3,"Theme constants"),c(h.organizingTheme.code,h.organizingTheme.lang),h3(t.h3,"Shared styles"),c(h.organizingStyles.code,h.organizingStyles.lang),h3(t.h3,"Using the styles"),c(h.organizingUsage.code,h.organizingUsage.lang),h2(t.h2,"Next Steps"),ul(t.ul,li(t.li,"Explore ",k("CodeBlock")," + ",k("InlineCode")," components to present snippets cleanly."),li(t.li,"Combine ",k("createStyleQueries")," with the helpers above for responsive variants."),li(t.li,"Jump to the ",a({href:"#examples"},"Examples page")," to see these styles in action.")))}function Ni(){return div(t.pageContent,h1(t.pageTitle,"Common Pitfalls"),p(t.pageSubtitle,"Avoid these common mistakes when building with Nuclo. Learn the patterns that work and why."),h2(t.h2,{id:"conditional-elements"},"Conditional Element Rendering"),div(i(padding("20px").backgroundColor(r.bgCard).borderRadius("12px").border(`1px solid ${r.border}`).marginBottom("24px")),h3(i(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Using a reactive function to conditionally return different elements won't work:"),c(`// ❌ Wrong - reactive function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // This won't display anything!
)`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Use ",k("when()")," for conditional element rendering:"),c(`// ✅ Correct - use when() for conditional elements
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(t.p,"Reactive functions ",k("() => value")," work great for text content and attribute values because Nuclo can update them in place. But elements need to be mounted/unmounted from the DOM, which requires ",k("when()")," to manage properly.")),h2(t.h2,{id:"forgetting-update"},"Forgetting to Call update()"),div(i(padding("20px").backgroundColor(r.bgCard).borderRadius("12px").border(`1px solid ${r.border}`).marginBottom("24px")),h3(i(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Changing state without calling ",k("update()")," won't refresh the UI:"),c(`// ❌ Wrong - UI won't update
let count = 0;

button('Increment', on('click', () => {
  count++;  // State changed but UI stays the same
}))`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Always call ",k("update()")," after changing state:"),c(`// ✅ Correct - call update() to refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // Now the UI will reflect the new count
}))`,"typescript")),h2(t.h2,{id:"list-identity"},"Replacing Objects in Lists"),div(i(padding("20px").backgroundColor(r.bgCard).borderRadius("12px").border(`1px solid ${r.border}`).marginBottom("24px")),h3(i(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Replacing objects instead of mutating them causes unnecessary DOM recreation:"),c(`// ❌ Wrong - creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Mutate the existing object to preserve its DOM element:"),c(`// ✅ Correct - mutate the object, element is preserved
todos[0].done = true;
update();`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(t.p,"Nuclo's ",k("list()")," tracks items by object identity (reference). When you replace an object with a new one, Nuclo sees it as a different item and recreates the DOM element. Mutating preserves identity and enables efficient updates.")),h2(t.h2,{id:"multiple-updates"},"Multiple update() Calls"),div(i(padding("20px").backgroundColor(r.bgCard).borderRadius("12px").border(`1px solid ${r.border}`).marginBottom("24px")),h3(i(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Calling ",k("update()")," multiple times is wasteful:"),c(`// ❌ Inefficient - 3 updates instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
}`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Batch all state changes, then call ",k("update()")," once:"),c(`// ✅ Efficient - batch changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  update();  // One update for all changes
}`,"typescript")),h2(t.h2,{id:"static-vs-reactive"},"Static Values Instead of Reactive"),div(i(padding("20px").backgroundColor(r.bgCard).borderRadius("12px").border(`1px solid ${r.border}`).marginBottom("24px")),h3(i(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Using a static value when you need it to update:"),c(`// ❌ Wrong - count is captured once, never updates
let count = 0;

div(
  \`Count: \${count}\`  // Always shows "Count: 0"
)`,"typescript"),h3(i(fontSize("16px").fontWeight("600").color(r.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Wrap in a function to make it reactive:"),c(`// ✅ Correct - function is called on each update()
let count = 0;

div(
  () => \`Count: \${count}\`  // Updates when count changes
)`,"typescript")),h2(t.h2,{id:"summary"},"Quick Reference"),div(i(padding("20px").backgroundColor(r.bgCard).borderRadius("12px").border(`1px solid ${r.border}`)),ul(t.ul,li(t.li,strong("Conditional elements:")," Use ",k("when()"),", not ",k("() => condition ? A : B")),li(t.li,strong("State changes:")," Always call ",k("update()")," after modifying state"),li(t.li,strong("Lists:")," Mutate objects, don't replace them"),li(t.li,strong("Batching:")," Group state changes before a single ",k("update()")),li(t.li,strong("Dynamic content:")," Wrap in ",k("() =>")," to make reactive"))))}const Ei={counter:"example-counter",todo:"example-todo",subtasks:"example-subtasks",search:"example-search",async:"example-async",forms:"example-forms",nested:"example-nested",animations:"example-animations",routing:"example-routing","styled-card":"example-styled-card"},zi=i(backgroundColor(r.bgCard).padding("24px").borderRadius("12px").border(`1px solid ${r.border}`).cursor("pointer").transition("all 0.2s")),Ai=i(fontSize("18px").fontWeight("600").color(r.text).marginBottom("8px")),Mi=i(fontSize("14px").color(r.textMuted).lineHeight("1.5")),re=i(display("grid").gridTemplateColumns("repeat(auto-fill, minmax(300px, 1fr))").gap("20px").marginBottom("48px")),ne=i(fontSize("20px").fontWeight("600").color(r.text).marginBottom("20px").marginTop("32px")),Di=i(display("inline-block").padding("4px 8px").backgroundColor("rgba(132, 204, 22, 0.15)").color(r.primary).fontSize("11px").fontWeight("600").borderRadius("4px").marginLeft("8px").textTransform("uppercase"));function ie(e,o){const n=Ei[e.id];return div(zi,on("click",()=>B(n)),on("mouseenter",l=>{l.currentTarget.style.borderColor=r.primary,l.currentTarget.style.transform="translateY(-2px)",l.currentTarget.style.boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"}),on("mouseleave",l=>{l.currentTarget.style.borderColor=r.border,l.currentTarget.style.transform="translateY(0)",l.currentTarget.style.boxShadow="none"}),div(Ai,e.title,o?span(Di,"Live Demo"):null),p(Mi,e.description))}const Wi=["counter","todo","subtasks"],Li=["search","async","forms"],Fi=["nested","animations","routing","styled-card"];function ae(e){return R.filter(o=>e.includes(o.id))}function ji(){const e=new Set(["counter","todo"]);return div(t.pageContent,h1(t.pageTitle,"Examples"),p(t.pageSubtitle,"Explore practical examples demonstrating Nuclo's features. Examples with live demos are marked with a badge."),h2(ne,"Getting Started"),p(i(color(r.textMuted).marginBottom("16px")),"Simple examples to help you understand the basics."),div(re,...ae(Wi).map(o=>ie(o,e.has(o.id)))),h2(ne,"Data & Forms"),p(i(color(r.textMuted).marginBottom("16px")),"Working with data, APIs, and form handling."),div(re,...ae(Li).map(o=>ie(o,e.has(o.id)))),h2(ne,"Advanced Patterns"),p(i(color(r.textMuted).marginBottom("16px")),"More complex patterns and techniques."),div(re,...ae(Fi).map(o=>ie(o,e.has(o.id)))),section(i(marginTop("48px").paddingTop("32px").borderTop(`1px solid ${r.border}`)),h2(t.h2,"More Examples"),p(t.p,"Find even more demos in the ",a({href:"https://github.com/dan2dev/nuclo/tree/main/examples",target:"_blank",rel:"noopener noreferrer"},i(color(r.primary)),"GitHub examples directory"),".")))}let Q=0;const $i=i(backgroundColor(r.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${r.border}`).marginBottom("32px")),Re=i(padding("10px 20px").backgroundColor(r.primary).color(r.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Hi=i(padding("10px 20px").backgroundColor(r.bgLight).color(r.text).border(`1px solid ${r.border}`).borderRadius("8px").fontSize("14px").fontWeight("500").cursor("pointer").transition("all 0.2s"));function Oi(){return div($i,div(t.flexBetween,div(h3(i(fontSize("48px").fontWeight("700").color(r.text).marginBottom("8px")),()=>Q),p(i(fontSize("14px").color(r.textMuted)),"Current count")),div(t.flex,t.gap8,button(Re,i(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"−",on("click",()=>{Q--,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=r.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=r.primary,e.target.style.transform="scale(1)"})),button(Re,i(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"+",on("click",()=>{Q++,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=r.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=r.primary,e.target.style.transform="scale(1)"})),button(Hi,"Reset",on("click",()=>{Q=0,update()}),on("mouseenter",e=>{e.target.style.borderColor=r.primary}),on("mouseleave",e=>{e.target.style.borderColor=r.border})))))}function Ui(){const e=R.find(o=>o.id==="counter");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),Oi(),h2(t.h2,"Source Code"),c(e.code,"typescript"))}let E=[{id:1,text:"Learn Nuclo",done:!0},{id:2,text:"Build something awesome",done:!1},{id:3,text:"Share with friends",done:!1}],z="",Ie=4;const Gi=i(backgroundColor(r.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${r.border}`).marginBottom("32px")),Qi=i(padding("10px 20px").backgroundColor(r.primary).color(r.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Vi=i(padding("10px 14px").backgroundColor(r.bgLight).color(r.text).border(`1px solid ${r.border}`).borderRadius("8px").fontSize("14px").outline("none").width("220px").transition("border-color 0.2s"));function _i(){const e=i(width("20px").height("20px").cursor("pointer")),o={accentColor:r.primary},n=i(display("flex").alignItems("center").gap("14px").padding("14px 16px").backgroundColor(r.bgLight).borderRadius("10px").marginBottom("10px").transition("all 0.2s")),l=i(marginLeft("auto").padding("6px 10px").backgroundColor("transparent").color(r.textDim).border("none").borderRadius("6px").cursor("pointer").fontSize("18px").transition("all 0.2s"));return div(Gi,div(t.flex,t.gap8,t.mb24,input(Vi,{type:"text",placeholder:"Add a new task...",value:()=>z},on("input",s=>{z=s.target.value,update()}),on("keydown",s=>{s.key==="Enter"&&z.trim()&&(E.push({id:Ie++,text:z,done:!1}),z="",update())}),on("focus",s=>{s.target.style.borderColor=r.primary}),on("blur",s=>{s.target.style.borderColor=r.border})),button(Qi,"Add Task",on("click",()=>{z.trim()&&(E.push({id:Ie++,text:z,done:!1}),z="",update())}),on("mouseenter",s=>{s.target.style.backgroundColor=r.primaryHover}),on("mouseleave",s=>{s.target.style.backgroundColor=r.primary}))),div(()=>`${E.filter(s=>!s.done).length} remaining · ${E.filter(s=>s.done).length} completed`,i(fontSize("13px").color(r.textDim).marginBottom("20px").fontWeight("500"))),when(()=>E.length>0,list(()=>E,s=>div(n,input(e,{style:o},{type:"checkbox",checked:()=>s.done},on("change",()=>{s.done=!s.done,update()})),span(()=>s.done?i(color(r.textDim).textDecoration("line-through").fontSize("15px")):i(color(r.text).fontSize("15px")),()=>s.text),button(l,"×",on("click",()=>{E=E.filter(d=>d.id!==s.id),update()}),on("mouseenter",d=>{d.target.style.backgroundColor="rgba(239, 68, 68, 0.1)",d.target.style.color="#ef4444"}),on("mouseleave",d=>{d.target.style.backgroundColor="transparent",d.target.style.color=r.textDim}))))).else(p(i(color(r.textDim).textAlign("center").padding("32px").fontSize("15px")),"No tasks yet. Add one above!")))}function qi(){const e=R.find(o=>o.id==="todo");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),_i(),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function Yi(){const e=R.find(o=>o.id==="subtasks");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function Ji(){const e=R.find(o=>o.id==="search");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function Ki(){const e=R.find(o=>o.id==="async");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function Xi(){const e=R.find(o=>o.id==="forms");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function Zi(){const e=R.find(o=>o.id==="nested");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function ea(){const e=R.find(o=>o.id==="animations");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function ta(){const e=R.find(o=>o.id==="routing");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}function oa(){const e=R.find(o=>o.id==="styled-card");return div(t.pageContent,a(i(color(r.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",o=>{o.preventDefault(),B("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),h2(t.h2,"Source Code"),c(e.code,"typescript"))}Kn();Xn();const ra=div(yi(),main({style:{minHeight:"calc(100vh - 160px)",paddingTop:"40px"}},when(()=>T()==="home",Pi()).when(()=>T()==="getting-started",Ti()).when(()=>T()==="core-api",Bi()).when(()=>T()==="tag-builders",Ri()).when(()=>T()==="styling",Ii()).when(()=>T()==="pitfalls",Ni()).when(()=>T()==="examples",ji()).when(()=>T()==="example-counter",Ui()).when(()=>T()==="example-todo",qi()).when(()=>T()==="example-subtasks",Yi()).when(()=>T()==="example-search",Ji()).when(()=>T()==="example-async",Ki()).when(()=>T()==="example-forms",Xi()).when(()=>T()==="example-nested",Zi()).when(()=>T()==="example-animations",ea()).when(()=>T()==="example-routing",ta()).when(()=>T()==="example-styled-card",oa())),bi());render(ra,document.getElementById("app"));
