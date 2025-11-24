(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const d of i)if(d.type==="childList")for(const m of d.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&s(m)}).observe(document,{childList:!0,subtree:!0});function n(i){const d={};return i.integrity&&(d.integrity=i.integrity),i.referrerPolicy&&(d.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?d.credentials="include":i.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function s(i){if(i.ep)return;i.ep=!0;const d=n(i);fetch(i.href,d)}})();function X(e){return e===null||typeof e!="object"&&typeof e!="function"}function Q(e){return e instanceof Node}function j(e){return typeof e=="object"&&e!==null}function me(e){return j(e)&&"tagName"in e}function A(e){return typeof e=="function"}function Pe(e){return A(e)&&e.length===0}function J(e,r){try{return e()}catch{return r}}const M=typeof window<"u"&&typeof document<"u";function Te(e){if(!e?.parentNode)return!1;try{return e.parentNode.removeChild(e),!0}catch{return!1}}function pe(e){if(!M)return null;try{return document.createComment(e)}catch{return null}}function ue(e){return pe(e)}function $(e,r="hidden"){try{return document.createComment(`conditional-${e}-${r}`)}catch{return null}}function Oe(e){if(!M)throw Error("Cannot create comment in non-browser environment");const r=pe(`${e}-${Math.random().toString(36).slice(2)}`);if(!r)throw Error("Failed to create comment");return r}function Be(e){const r=pe(e+"-end");if(!r)throw Error("Failed to create end comment");return{start:Oe(e+"-start"),end:r}}function ge(e){return!!e&&(typeof e.isConnected=="boolean"?e.isConnected:!(!M||typeof document>"u")&&document.contains(e))}function he(e,r){if(!e?.parentNode)return!1;try{return e.parentNode.replaceChild(r,e),!0}catch{return!1}}const re=new Map,_=new Map;function Re(e,r){r.attributeResolvers.forEach(({resolver:n,applyValue:s},i)=>{try{s(J(n))}catch{}})}function Z(e,r,n,s){if(!(e instanceof Element&&r&&typeof n=="function"))return;const i=(function(d){let m=_.get(d);return m||(m={attributeResolvers:new Map},_.set(d,m)),m})(e);i.attributeResolvers.set(r,{resolver:n,applyValue:s});try{s(J(n))}catch{}if(!i.updateListener){const d=()=>Re(0,i);e.addEventListener("update",d),i.updateListener=d}}function Ue(e,r,n){try{return n==null||n===""?(e.style[r]="",!0):(e.style[r]=n+"",!0)}catch{return!1}}function fe(e,r){if(e?.style&&r)for(const[n,s]of Object.entries(r))Ue(e,n,s)||void 0}const ye="__nuclo_reactive_className__",W="__nuclo_static_className__";function Ge(e,r,n,s=!1){if(n==null)return;if(r==="style")return d=n,void((i=e)&&(A(d)?Z(i,"style",()=>{try{return d()}catch{return null}},f=>{fe(i,f)}):fe(i,d)));var i,d;const m=(f,b=!1)=>{if(f!=null)if(r==="className"&&e instanceof HTMLElement&&b)(function(y,g){if(!g)return;const u=y.className;if(u&&u!==g){const x=new Set(u.split(" ").filter(w=>w));g.split(" ").filter(w=>w).forEach(w=>x.add(w)),y.className=Array.from(x).join(" ")}else y.className=g})(e,f+"");else if(e instanceof Element&&e.namespaceURI==="http://www.w3.org/2000/svg")e.setAttribute(r+"",f+"");else if(r in e)try{e[r]=f}catch{e instanceof Element&&e.setAttribute(r+"",f+"")}else e instanceof Element&&e.setAttribute(r+"",f+"")};if(A(n)&&n.length===0){const f=n;r==="className"&&e instanceof HTMLElement?((function(b){b[W]||(b[W]=new Set(b.className.split(" ").filter(y=>y))),b[ye]=!0})(e),Z(e,r+"",f,b=>{(function(y,g){const u=(function(x){return x[W]})(y);if(u&&u.size>0&&g){const x=new Set(u);g.split(" ").filter(w=>w).forEach(w=>x.add(w)),y.className=Array.from(x).join(" ")}else y.className=g||(u&&u.size>0?Array.from(u).join(" "):"")})(e,(b||"")+"")})):Z(e,r+"",f,b=>{m(b,!1)})}else{if(r==="className"&&e instanceof HTMLElement&&(function(f){return!!f[ye]})(e)){const f=(n||"")+"";if(f){(function(y,g){g&&(y[W]||(y[W]=new Set),g.split(" ").filter(u=>u).forEach(u=>{y[W].add(u)}))})(e,f);const b=new Set(e.className.split(" ").filter(y=>y));f.split(" ").filter(y=>y).forEach(y=>b.add(y)),e.className=Array.from(b).join(" ")}return}m(n,s)}}function ee(e,r,n=!0){if(r)for(const s of Object.keys(r))Ge(e,s,r[s],n&&s==="className")}const z=new WeakMap;function Qe(e,r,n){if(!A(e)||e.length!==0||!(function(i){const{value:d,error:m}=(function(f){const b=z.get(f);if(b)return b;try{const y={value:f(),error:!1};return z.set(f,y),y}catch{const y={value:void 0,error:!0};return z.set(f,y),y}})(i);return!m&&typeof d=="boolean"})(e))return!1;const s=r.filter((i,d)=>d!==n);return s.length!==0&&s.some(i=>!!(j(i)||Q(i)||A(i)&&i.length>0))}function V(e,r,n){if(r==null)return null;if(A(r)){if(Pe(r))try{let d=z.get(r);if(d||(d={value:r(),error:!1},z.set(r,d)),d.error)return te(n,()=>"");const m=d.value;if(j(m)&&!Q(m)&&"className"in m&&typeof m.className=="string"&&Object.keys(m).length===1){const f=r;return ee(e,{className:()=>f().className}),null}return X(m)&&m!=null?te(n,r,m):null}catch{return z.set(r,{value:void 0,error:!0}),te(n,()=>"")}const i=r(e,n);return i==null?null:X(i)?be(n,i):Q(i)?i:(j(i)&&ee(e,i),null)}const s=r;return s==null?null:X(s)?be(n,s):Q(s)?s:(j(s)&&ee(e,s),null)}function te(e,r,n){const s=document.createDocumentFragment(),i=ue(` text-${e} `);i&&s.appendChild(i);const d=(function(m,f){if(typeof m!="function")return document.createTextNode("");const b=arguments.length>1?f:J(m,""),y=b===void 0?"":b+"",g=document.createTextNode(y);return re.set(g,{resolver:m,lastValue:y}),g})(r,n);return s.appendChild(d),s}function be(e,r){const n=document.createDocumentFragment(),s=ue(` text-${e} `);s&&n.appendChild(s);const i=document.createTextNode(r+"");return n.appendChild(i),n}const oe=new Set;function L(e,r){e._conditionalInfo=r,oe.add(e)}function K(e,r,n=0){if(!r||r.length===0)return{element:e,nextIndex:n,appended:0};let s=n,i=0;const d=e;for(let m=0;r.length>m;m+=1){const f=r[m];if(f==null)continue;const b=V(e,f,s);b&&(b.parentNode!==d&&d.appendChild(b),s+=1,i+=1)}return{element:e,nextIndex:s,appended:i}}function ne(e,r){const n=document.createElement(e);return K(n,r,0),n}function ie(e,r){const n=document.createElementNS("http://www.w3.org/2000/svg",e);return K(n,r,0),n}function Ve(e){return(...r)=>(function(n,...s){return(i,d)=>{const{condition:m,otherModifiers:f}=(function(y){const g=(function(u){for(let x=0;u.length>x;x+=1)if(Qe(u[x],u,x))return x;return-1})(y);return g===-1?{condition:null,otherModifiers:y}:{condition:y[g],otherModifiers:y.filter((u,x)=>x!==g)}})(s);if(m)return(function(y,g,u){const x=g();if(!M)return x?ne(y,u):$(y,"ssr");const w={condition:g,tagName:y,modifiers:u,isSvg:!1};if(x){const P=ne(y,u);return L(P,w),P}const C=$(y);if(!C)throw Error("Failed to create conditional comment for "+y);return L(C,w),C})(n,m,f);const b=document.createElement(n);return K(b,f,d),b}})(e,...r)}function _e(e){return(...r)=>(function(n,...s){return(i,d)=>{const m=s.findIndex(b=>typeof b=="function"&&b.length===0);if(m!==-1){const b=s[m],y=s.filter((g,u)=>u!==m);return(function(g,u,x){const w=u();if(!M)return w?ie(g,x):$(g,"ssr");const C={condition:u,tagName:g,modifiers:x,isSvg:!0};if(w){const B=ie(g,x);return L(B,C),B}const P=$(g);if(!P)throw Error("Failed to create conditional comment for "+g);return L(P,C),P})(n,b,y)}const f=document.createElementNS("http://www.w3.org/2000/svg",n);return K(f,s,d),f}})(e,...r)}const qe=["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","menu","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","script","search","section","select","slot","small","source","span","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u","ul","var","video","wbr"],Ye=["a","animate","animateMotion","animateTransform","circle","clipPath","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","foreignObject","g","image","line","linearGradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialGradient","rect","script","set","stop","style","svg","switch","symbol","text","textPath","title","tspan","use","view"];function Je(e=globalThis){const r="__nuclo_tags_registered";e[r]||(Ye.forEach(n=>(function(s,i){const d=i+"Svg";d in s||(s[d]=_e(i))})(e,n)),qe.forEach(n=>(function(s,i){i in s&&typeof s[i]!="function"||(s[i]=Ve(i))})(e,n)),e[r]=!0)}const ae=new Set;function Ke(e,r,n){return(function(s,i,d){if(A(s)){const m=s(i,d);return m&&me(m)?m:null}return s&&me(s)?s:null})(e.renderItem(r,n),e.host,n)}function Xe(e){Te(e.element)}function Ie(e){const{host:r,startMarker:n,endMarker:s}=e,i=n.parentNode??r,d=e.itemsProvider();if((function(u,x){if(u===x)return!0;if(u.length!==x.length)return!1;for(let w=0;u.length>w;w++)if((w in u?u[w]:void 0)!==(w in x?x[w]:void 0))return!1;return!0})(e.lastSyncedItems,d))return;const m=new Map,f=new Map;e.records.forEach(u=>{const x=f.get(u.item);x?x.push(u):f.set(u.item,[u])}),d.forEach((u,x)=>{if(e.lastSyncedItems.length>x&&e.lastSyncedItems[x]===u){const w=e.records[x];if(w&&w.item===u){m.set(x,w);const C=f.get(u);if(C){const P=C.indexOf(w);0>P||(C.splice(P,1),C.length===0&&f.delete(u))}}}});const b=[],y=new Set(e.records);let g=s;for(let u=d.length-1;u>=0;u--){const x=d[u];let w=m.get(u);if(!w){const P=f.get(x);P&&P.length>0&&(w=P.shift(),P.length===0&&f.delete(x))}if(w)y.delete(w);else{const P=Ke(e,x,u);if(!P)continue;w={item:x,element:P}}b.unshift(w);const C=w.element;C.nextSibling!==g&&i.insertBefore(C,g),g=C}y.forEach(Xe),e.records=b,e.lastSyncedItems=[...d]}function Ze(e,r){return(n,s)=>(function(d,m,f){const{start:b,end:y}=Be("list"),g={itemsProvider:d,renderItem:m,startMarker:b,endMarker:y,records:[],host:f,lastSyncedItems:[]},u=f;return u.appendChild(b),u.appendChild(y),ae.add(g),Ie(g),g})(e,r,n).startMarker}function Ne(e,r){try{return e()}catch(n){if(r)return r(n),!1;throw n}}function et(e,r){return typeof e=="function"?Ne(e,r):!!e}function tt(e,r,n,s){return A(e)?Pe(e)?(z.delete(e),V(r,e,n)):(function(i,d,m){const f=i,b=f.appendChild.bind(f),y=f.insertBefore.bind(f);f.appendChild=function(g){return y(g,d)};try{return m()}finally{f.appendChild=b}})(r,s,()=>{const i=V(r,e,n);return i&&!i.parentNode?i:null}):V(r,e,n)}const se=new Set;function xe(e){const{groups:r,elseContent:n,host:s,index:i,endMarker:d}=e,m=(function(b,y){for(let g=0;b.length>g;g++)if(et(b[g].condition))return g;return y.length>0?-1:null})(r,n);if(m===e.activeIndex||((function(b,y){let g=b.nextSibling;for(;g&&g!==y;){const u=g.nextSibling;Te(g),g=u}})(e.startMarker,e.endMarker),e.activeIndex=m,m===null))return;const f=(function(b,y,g,u){const x=[];for(const w of b){const C=tt(w,y,g,u);C&&x.push(C)}return x})(0>m?n:r[m].content,s,i,d);(function(b,y){const g=y.parentNode;g&&b.forEach(u=>(function(x,w,C){if(!x||!w)return!1;try{return x.insertBefore(w,C),!0}catch{return!1}})(g,u,y))})(f,d)}class rt{groups=[];elseContent=[];constructor(r,...n){this.groups.push({condition:r,content:n})}when(r,...n){return this.groups.push({condition:r,content:n}),this}else(...r){return this.elseContent=r,this}render(r,n){if(!M)return ue("when-ssr")||null;const{start:s,end:i}=Be("when"),d={startMarker:s,endMarker:i,host:r,index:n,groups:[...this.groups],elseContent:[...this.elseContent],activeIndex:null,update:()=>xe(d)};(function(f){se.add(f)})(d);const m=r;return m.appendChild(s),m.appendChild(i),xe(d),s}}function le(e){return Object.assign((r,n)=>e.render(r,n),{when:(r,...n)=>(e.when(r,...n),le(e)),else:(...r)=>(e.else(...r),le(e))})}function ot(e,...r){return le(new rt(e,...r))}const nt=[function(){ae.forEach(e=>{e.startMarker.isConnected&&e.endMarker.isConnected?Ie(e):ae.delete(e)})},function(){se.forEach(e=>{try{e.update()}catch{se.delete(e)}})},function(){if(M)try{oe.forEach(e=>{e.isConnected?(function(r){const n=(function(d){return d._conditionalInfo??null})(r);if(!n)return;const s=Ne(n.condition,d=>{}),i=r.nodeType===Node.ELEMENT_NODE;if(s&&!i){const d=(function(m){try{return m.isSvg?ie(m.tagName,m.modifiers):ne(m.tagName,m.modifiers)}catch{return m.isSvg?document.createElementNS("http://www.w3.org/2000/svg",m.tagName):document.createElement(m.tagName)}})(n);L(d,n),he(r,d)}else if(!s&&i){const d=$(n.tagName);d&&(L(d,n),he(r,d))}})(e):(function(r){oe.delete(r)})(e)})}catch{}},function(){_.forEach((e,r)=>{if(!ge(r))return e.updateListener&&r.removeEventListener("update",e.updateListener),void _.delete(r);Re(0,e)})},function(){re.forEach((e,r)=>{if(ge(r))try{const n=J(e.resolver),s=n===void 0?"":n+"";s!==e.lastValue&&(r.textContent=s,e.lastValue=s)}catch{}else re.delete(r)})},function(){if(typeof document>"u")return;const e=document.body?[document.body,document]:[document];for(const r of e)try{r.dispatchEvent(new Event("update",{bubbles:!0}))}catch{}}];function it(){for(const e of nt)e()}function at(e,r,n){return s=>{if(!s||typeof s.addEventListener!="function")return;const i=s;i.addEventListener(e,d=>{try{r.call(i,d)}catch{}},n)}}function st(e,r,n=0){const s=e(r||document.body,n);return(r||document.body).appendChild(s),s}const Ae=[{name:"display",cssProperty:"display"},{name:"grid",cssProperty:"display",defaultValue:"grid",isShorthand:!0},{name:"bg",cssProperty:"background-color"},{name:"color",cssProperty:"color"},{name:"accentColor",cssProperty:"accent-color"},{name:"fontSize",cssProperty:"font-size"},{name:"fontWeight",cssProperty:"font-weight"},{name:"fontFamily",cssProperty:"font-family"},{name:"lineHeight",cssProperty:"line-height"},{name:"letterSpacing",cssProperty:"letter-spacing"},{name:"textAlign",cssProperty:"text-align"},{name:"textDecoration",cssProperty:"text-decoration"},{name:"fontStyle",cssProperty:"font-style"},{name:"fontVariant",cssProperty:"font-variant"},{name:"fontStretch",cssProperty:"font-stretch"},{name:"textTransform",cssProperty:"text-transform"},{name:"textIndent",cssProperty:"text-indent"},{name:"textOverflow",cssProperty:"text-overflow"},{name:"textShadow",cssProperty:"text-shadow"},{name:"whiteSpace",cssProperty:"white-space"},{name:"wordSpacing",cssProperty:"word-spacing"},{name:"wordWrap",cssProperty:"word-wrap"},{name:"overflowWrap",cssProperty:"overflow-wrap"},{name:"textAlignLast",cssProperty:"text-align-last"},{name:"textJustify",cssProperty:"text-justify"},{name:"textDecorationLine",cssProperty:"text-decoration-line"},{name:"textDecorationColor",cssProperty:"text-decoration-color"},{name:"textDecorationStyle",cssProperty:"text-decoration-style"},{name:"textDecorationThickness",cssProperty:"text-decoration-thickness"},{name:"textUnderlineOffset",cssProperty:"text-underline-offset"},{name:"verticalAlign",cssProperty:"vertical-align"},{name:"position",cssProperty:"position"},{name:"padding",cssProperty:"padding"},{name:"paddingTop",cssProperty:"padding-top"},{name:"paddingRight",cssProperty:"padding-right"},{name:"paddingBottom",cssProperty:"padding-bottom"},{name:"paddingLeft",cssProperty:"padding-left"},{name:"margin",cssProperty:"margin"},{name:"marginTop",cssProperty:"margin-top"},{name:"marginRight",cssProperty:"margin-right"},{name:"marginBottom",cssProperty:"margin-bottom"},{name:"marginLeft",cssProperty:"margin-left"},{name:"width",cssProperty:"width"},{name:"height",cssProperty:"height"},{name:"minWidth",cssProperty:"min-width"},{name:"maxWidth",cssProperty:"max-width"},{name:"minHeight",cssProperty:"min-height"},{name:"maxHeight",cssProperty:"max-height"},{name:"boxSizing",cssProperty:"box-sizing"},{name:"top",cssProperty:"top"},{name:"right",cssProperty:"right"},{name:"bottom",cssProperty:"bottom"},{name:"left",cssProperty:"left"},{name:"zIndex",cssProperty:"z-index"},{name:"flexDirection",cssProperty:"flex-direction"},{name:"alignItems",cssProperty:"align-items"},{name:"justifyContent",cssProperty:"justify-content"},{name:"gap",cssProperty:"gap"},{name:"flexWrap",cssProperty:"flex-wrap"},{name:"flexGrow",cssProperty:"flex-grow"},{name:"flexShrink",cssProperty:"flex-shrink"},{name:"flexBasis",cssProperty:"flex-basis"},{name:"alignSelf",cssProperty:"align-self"},{name:"alignContent",cssProperty:"align-content"},{name:"justifySelf",cssProperty:"justify-self"},{name:"justifyItems",cssProperty:"justify-items"},{name:"gridTemplateColumns",cssProperty:"grid-template-columns"},{name:"gridTemplateRows",cssProperty:"grid-template-rows"},{name:"gridTemplateAreas",cssProperty:"grid-template-areas"},{name:"gridColumn",cssProperty:"grid-column"},{name:"gridRow",cssProperty:"grid-row"},{name:"gridColumnStart",cssProperty:"grid-column-start"},{name:"gridColumnEnd",cssProperty:"grid-column-end"},{name:"gridRowStart",cssProperty:"grid-row-start"},{name:"gridRowEnd",cssProperty:"grid-row-end"},{name:"gridArea",cssProperty:"grid-area"},{name:"gridAutoColumns",cssProperty:"grid-auto-columns"},{name:"gridAutoRows",cssProperty:"grid-auto-rows"},{name:"gridAutoFlow",cssProperty:"grid-auto-flow"},{name:"border",cssProperty:"border"},{name:"borderTop",cssProperty:"border-top"},{name:"borderRight",cssProperty:"border-right"},{name:"borderBottom",cssProperty:"border-bottom"},{name:"borderLeft",cssProperty:"border-left"},{name:"borderWidth",cssProperty:"border-width"},{name:"borderStyle",cssProperty:"border-style"},{name:"borderColor",cssProperty:"border-color"},{name:"borderTopWidth",cssProperty:"border-top-width"},{name:"borderRightWidth",cssProperty:"border-right-width"},{name:"borderBottomWidth",cssProperty:"border-bottom-width"},{name:"borderLeftWidth",cssProperty:"border-left-width"},{name:"borderTopStyle",cssProperty:"border-top-style"},{name:"borderRightStyle",cssProperty:"border-right-style"},{name:"borderBottomStyle",cssProperty:"border-bottom-style"},{name:"borderLeftStyle",cssProperty:"border-left-style"},{name:"borderTopColor",cssProperty:"border-top-color"},{name:"borderRightColor",cssProperty:"border-right-color"},{name:"borderBottomColor",cssProperty:"border-bottom-color"},{name:"borderLeftColor",cssProperty:"border-left-color"},{name:"borderRadius",cssProperty:"border-radius"},{name:"borderTopLeftRadius",cssProperty:"border-top-left-radius"},{name:"borderTopRightRadius",cssProperty:"border-top-right-radius"},{name:"borderBottomLeftRadius",cssProperty:"border-bottom-left-radius"},{name:"borderBottomRightRadius",cssProperty:"border-bottom-right-radius"},{name:"outline",cssProperty:"outline"},{name:"outlineWidth",cssProperty:"outline-width"},{name:"outlineStyle",cssProperty:"outline-style"},{name:"outlineColor",cssProperty:"outline-color"},{name:"outlineOffset",cssProperty:"outline-offset"},{name:"backgroundColor",cssProperty:"background-color"},{name:"backgroundImage",cssProperty:"background-image"},{name:"backgroundRepeat",cssProperty:"background-repeat"},{name:"backgroundPosition",cssProperty:"background-position"},{name:"backgroundSize",cssProperty:"background-size"},{name:"backgroundAttachment",cssProperty:"background-attachment"},{name:"backgroundClip",cssProperty:"background-clip"},{name:"backgroundOrigin",cssProperty:"background-origin"},{name:"boxShadow",cssProperty:"box-shadow"},{name:"opacity",cssProperty:"opacity"},{name:"transition",cssProperty:"transition"},{name:"transitionProperty",cssProperty:"transition-property"},{name:"transitionDuration",cssProperty:"transition-duration"},{name:"transitionTimingFunction",cssProperty:"transition-timing-function"},{name:"transitionDelay",cssProperty:"transition-delay"},{name:"transform",cssProperty:"transform"},{name:"transformOrigin",cssProperty:"transform-origin"},{name:"transformStyle",cssProperty:"transform-style"},{name:"perspective",cssProperty:"perspective"},{name:"perspectiveOrigin",cssProperty:"perspective-origin"},{name:"backfaceVisibility",cssProperty:"backface-visibility"},{name:"animation",cssProperty:"animation"},{name:"animationName",cssProperty:"animation-name"},{name:"animationDuration",cssProperty:"animation-duration"},{name:"animationTimingFunction",cssProperty:"animation-timing-function"},{name:"animationDelay",cssProperty:"animation-delay"},{name:"animationIterationCount",cssProperty:"animation-iteration-count"},{name:"animationDirection",cssProperty:"animation-direction"},{name:"animationFillMode",cssProperty:"animation-fill-mode"},{name:"animationPlayState",cssProperty:"animation-play-state"},{name:"filter",cssProperty:"filter"},{name:"backdropFilter",cssProperty:"backdrop-filter"},{name:"overflow",cssProperty:"overflow"},{name:"overflowX",cssProperty:"overflow-x"},{name:"overflowY",cssProperty:"overflow-y"},{name:"visibility",cssProperty:"visibility"},{name:"objectFit",cssProperty:"object-fit"},{name:"objectPosition",cssProperty:"object-position"},{name:"listStyle",cssProperty:"list-style"},{name:"listStyleType",cssProperty:"list-style-type"},{name:"listStylePosition",cssProperty:"list-style-position"},{name:"listStyleImage",cssProperty:"list-style-image"},{name:"borderCollapse",cssProperty:"border-collapse"},{name:"borderSpacing",cssProperty:"border-spacing"},{name:"captionSide",cssProperty:"caption-side"},{name:"emptyCells",cssProperty:"empty-cells"},{name:"tableLayout",cssProperty:"table-layout"},{name:"content",cssProperty:"content"},{name:"quotes",cssProperty:"quotes"},{name:"counterReset",cssProperty:"counter-reset"},{name:"counterIncrement",cssProperty:"counter-increment"},{name:"appearance",cssProperty:"appearance"},{name:"userSelect",cssProperty:"user-select"},{name:"pointerEvents",cssProperty:"pointer-events"},{name:"resize",cssProperty:"resize"},{name:"scrollBehavior",cssProperty:"scroll-behavior"},{name:"clip",cssProperty:"clip"},{name:"clipPath",cssProperty:"clip-path"},{name:"isolation",cssProperty:"isolation"},{name:"mixBlendMode",cssProperty:"mix-blend-mode"},{name:"willChange",cssProperty:"will-change"},{name:"contain",cssProperty:"contain"},{name:"pageBreakBefore",cssProperty:"page-break-before"},{name:"pageBreakAfter",cssProperty:"page-break-after"},{name:"pageBreakInside",cssProperty:"page-break-inside"},{name:"breakBefore",cssProperty:"break-before"},{name:"breakAfter",cssProperty:"break-after"},{name:"breakInside",cssProperty:"break-inside"},{name:"orphans",cssProperty:"orphans"},{name:"widows",cssProperty:"widows"},{name:"columnCount",cssProperty:"column-count"},{name:"columnFill",cssProperty:"column-fill"},{name:"columnGap",cssProperty:"column-gap"},{name:"columnRule",cssProperty:"column-rule"},{name:"columnRuleColor",cssProperty:"column-rule-color"},{name:"columnRuleStyle",cssProperty:"column-rule-style"},{name:"columnRuleWidth",cssProperty:"column-rule-width"},{name:"columnSpan",cssProperty:"column-span"},{name:"columnWidth",cssProperty:"column-width"},{name:"columns",cssProperty:"columns"},{name:"cursor",cssProperty:"cursor"},{name:"aspectRatio",cssProperty:"aspect-ratio"},{name:"clear",cssProperty:"clear"},{name:"float",cssProperty:"float"},{name:"order",cssProperty:"order"},{name:"placeContent",cssProperty:"place-content"},{name:"placeItems",cssProperty:"place-items"},{name:"placeSelf",cssProperty:"place-self"},{name:"hyphens",cssProperty:"hyphens"},{name:"lineBreak",cssProperty:"line-break"},{name:"wordBreak",cssProperty:"word-break"},{name:"textOrientation",cssProperty:"text-orientation"},{name:"writingMode",cssProperty:"writing-mode"},{name:"direction",cssProperty:"direction"},{name:"unicodeBidi",cssProperty:"unicode-bidi"},{name:"backgroundBlendMode",cssProperty:"background-blend-mode"},{name:"backgroundPositionX",cssProperty:"background-position-x"},{name:"backgroundPositionY",cssProperty:"background-position-y"},{name:"borderImage",cssProperty:"border-image"},{name:"borderImageSource",cssProperty:"border-image-source"},{name:"borderImageSlice",cssProperty:"border-image-slice"},{name:"borderImageWidth",cssProperty:"border-image-width"},{name:"borderImageOutset",cssProperty:"border-image-outset"},{name:"borderImageRepeat",cssProperty:"border-image-repeat"},{name:"inset",cssProperty:"inset"},{name:"insetBlock",cssProperty:"inset-block"},{name:"insetBlockStart",cssProperty:"inset-block-start"},{name:"insetBlockEnd",cssProperty:"inset-block-end"},{name:"insetInline",cssProperty:"inset-inline"},{name:"insetInlineStart",cssProperty:"inset-inline-start"},{name:"insetInlineEnd",cssProperty:"inset-inline-end"},{name:"marginBlock",cssProperty:"margin-block"},{name:"marginBlockStart",cssProperty:"margin-block-start"},{name:"marginBlockEnd",cssProperty:"margin-block-end"},{name:"marginInline",cssProperty:"margin-inline"},{name:"marginInlineStart",cssProperty:"margin-inline-start"},{name:"marginInlineEnd",cssProperty:"margin-inline-end"},{name:"paddingBlock",cssProperty:"padding-block"},{name:"paddingBlockStart",cssProperty:"padding-block-start"},{name:"paddingBlockEnd",cssProperty:"padding-block-end"},{name:"paddingInline",cssProperty:"padding-inline"},{name:"paddingInlineStart",cssProperty:"padding-inline-start"},{name:"paddingInlineEnd",cssProperty:"padding-inline-end"},{name:"inlineSize",cssProperty:"inline-size"},{name:"blockSize",cssProperty:"block-size"},{name:"minInlineSize",cssProperty:"min-inline-size"},{name:"minBlockSize",cssProperty:"min-block-size"},{name:"maxInlineSize",cssProperty:"max-inline-size"},{name:"maxBlockSize",cssProperty:"max-block-size"},{name:"borderBlock",cssProperty:"border-block"},{name:"borderBlockStart",cssProperty:"border-block-start"},{name:"borderBlockEnd",cssProperty:"border-block-end"},{name:"borderInline",cssProperty:"border-inline"},{name:"borderInlineStart",cssProperty:"border-inline-start"},{name:"borderInlineEnd",cssProperty:"border-inline-end"},{name:"borderBlockWidth",cssProperty:"border-block-width"},{name:"borderBlockStartWidth",cssProperty:"border-block-start-width"},{name:"borderBlockEndWidth",cssProperty:"border-block-end-width"},{name:"borderInlineWidth",cssProperty:"border-inline-width"},{name:"borderInlineStartWidth",cssProperty:"border-inline-start-width"},{name:"borderInlineEndWidth",cssProperty:"border-inline-end-width"},{name:"borderBlockStyle",cssProperty:"border-block-style"},{name:"borderBlockStartStyle",cssProperty:"border-block-start-style"},{name:"borderBlockEndStyle",cssProperty:"border-block-end-style"},{name:"borderInlineStyle",cssProperty:"border-inline-style"},{name:"borderInlineStartStyle",cssProperty:"border-inline-start-style"},{name:"borderInlineEndStyle",cssProperty:"border-inline-end-style"},{name:"borderBlockColor",cssProperty:"border-block-color"},{name:"borderBlockStartColor",cssProperty:"border-block-start-color"},{name:"borderBlockEndColor",cssProperty:"border-block-end-color"},{name:"borderInlineColor",cssProperty:"border-inline-color"},{name:"borderInlineStartColor",cssProperty:"border-inline-start-color"},{name:"borderInlineEndColor",cssProperty:"border-inline-end-color"},{name:"borderStartStartRadius",cssProperty:"border-start-start-radius"},{name:"borderStartEndRadius",cssProperty:"border-start-end-radius"},{name:"borderEndStartRadius",cssProperty:"border-end-start-radius"},{name:"borderEndEndRadius",cssProperty:"border-end-end-radius"},{name:"scrollMargin",cssProperty:"scroll-margin"},{name:"scrollMarginTop",cssProperty:"scroll-margin-top"},{name:"scrollMarginRight",cssProperty:"scroll-margin-right"},{name:"scrollMarginBottom",cssProperty:"scroll-margin-bottom"},{name:"scrollMarginLeft",cssProperty:"scroll-margin-left"},{name:"scrollPadding",cssProperty:"scroll-padding"},{name:"scrollPaddingTop",cssProperty:"scroll-padding-top"},{name:"scrollPaddingRight",cssProperty:"scroll-padding-right"},{name:"scrollPaddingBottom",cssProperty:"scroll-padding-bottom"},{name:"scrollPaddingLeft",cssProperty:"scroll-padding-left"},{name:"overscrollBehavior",cssProperty:"overscroll-behavior"},{name:"overscrollBehaviorX",cssProperty:"overscroll-behavior-x"},{name:"overscrollBehaviorY",cssProperty:"overscroll-behavior-y"},{name:"caretColor",cssProperty:"caret-color"},{name:"caretShape",cssProperty:"caret-shape"},{name:"caretAnimation",cssProperty:"caret-animation"},{name:"imageRendering",cssProperty:"image-rendering"},{name:"colorScheme",cssProperty:"color-scheme"},{name:"contentVisibility",cssProperty:"content-visibility"},{name:"touchAction",cssProperty:"touch-action"},{name:"containerType",cssProperty:"container-type"},{name:"containerName",cssProperty:"container-name"},{name:"container",cssProperty:"container"},{name:"fontFeatureSettings",cssProperty:"font-feature-settings"},{name:"fontKerning",cssProperty:"font-kerning"},{name:"fontSynthesis",cssProperty:"font-synthesis"},{name:"fontOpticalSizing",cssProperty:"font-optical-sizing"},{name:"fontDisplay",cssProperty:"font-display"},{name:"fontVariantCaps",cssProperty:"font-variant-caps"},{name:"fontVariantNumeric",cssProperty:"font-variant-numeric"},{name:"fontVariantLigatures",cssProperty:"font-variant-ligatures"},{name:"fontVariantEastAsian",cssProperty:"font-variant-east-asian"},{name:"fontVariantAlternates",cssProperty:"font-variant-alternates"},{name:"fontVariantPosition",cssProperty:"font-variant-position"},{name:"textRendering",cssProperty:"text-rendering"},{name:"textCombineUpright",cssProperty:"text-combine-upright"},{name:"textSizeAdjust",cssProperty:"text-size-adjust"},{name:"mask",cssProperty:"mask"},{name:"maskImage",cssProperty:"mask-image"},{name:"maskMode",cssProperty:"mask-mode"},{name:"maskRepeat",cssProperty:"mask-repeat"},{name:"maskPosition",cssProperty:"mask-position"},{name:"maskSize",cssProperty:"mask-size"},{name:"maskOrigin",cssProperty:"mask-origin"},{name:"maskClip",cssProperty:"mask-clip"},{name:"maskComposite",cssProperty:"mask-composite"},{name:"clipRule",cssProperty:"clip-rule"},{name:"gridColumnGap",cssProperty:"grid-column-gap"},{name:"gridRowGap",cssProperty:"grid-row-gap"},{name:"gridGap",cssProperty:"grid-gap"}],lt=["bold","center","flex"],ve=new Map;function ze(e){let r=0;for(let n=0;e.length>n;n++)r=(r<<5)-r+e.charCodeAt(n),r&=r;return Math.abs(r).toString(16).padStart(8,"0").substring(0,8)}function ce(e){return Object.entries(e).sort(([r],[n])=>r.localeCompare(n)).map(([r,n])=>`${r}:${n}`).join("|")}function H(e,r,n,s="media"){let i=document.querySelector("#nuclo-styles");i||(i=document.createElement("style"),i.id="nuclo-styles",document.head.appendChild(i));const d=Object.entries(r).map(([m,f])=>`${m}: ${f}`).join("; ");if(n){const m=Array.from(i.sheet?.cssRules||[]);let f=null;const b=u=>s==="media"&&u instanceof CSSMediaRule?u.media.mediaText===n:(s==="container"&&u instanceof CSSContainerRule||s==="supports"&&u instanceof CSSSupportsRule)&&u.conditionText===n,y=u=>u instanceof CSSMediaRule||u instanceof CSSContainerRule||u instanceof CSSSupportsRule;for(const u of m)if(b(u)){f=u;break}if(!f){let u=m.length;for(let w=m.length-1;w>=0;w--){if(y(m[w])){u=w+1;break}if(m[w]instanceof CSSStyleRule){u=w+1;break}}const x=s==="media"?"@media":s==="container"?"@container":s==="supports"?"@supports":"@media";i.sheet?.insertRule(`${x} ${n} {}`,u),f=i.sheet?.cssRules[u]}let g=null;for(const u of Array.from(f.cssRules))if(u instanceof CSSStyleRule&&u.selectorText==="."+e){g=u;break}if(g){for(;g.style.length>0;)g.style.removeProperty(g.style[0]);Object.entries(r).forEach(([u,x])=>{g.style.setProperty(u,x)})}else f.insertRule(`.${e} { ${d} }`,f.cssRules.length)}else{let m=null,f=0;const b=g=>g instanceof CSSMediaRule||g instanceof CSSContainerRule||g instanceof CSSSupportsRule,y=Array.from(i.sheet?.cssRules||[]);for(let g=0;y.length>g;g++){const u=y[g];if(u instanceof CSSStyleRule&&u.selectorText==="."+e){m=u,f=g;break}b(u)||(f=g+1)}if(m){for(;m.style.length>0;)m.style.removeProperty(m.style[0]);Object.entries(r).forEach(([g,u])=>{m.style.setProperty(g,u)})}else i.sheet?.insertRule(`.${e} { ${d} }`,f)}}function ct(e,r){H(e,r)}class E{styles={};getStyles(){return{...this.styles}}getClassName(r="",n){return(function(s,i="",d){const m=ce(s),f=i?`${i}:${m}`:m,b=(function(u){return ve.get(u)})(f);if(b){const u=b;return(function(x,w,C="media"){const P=document.querySelector("#nuclo-styles");if(!P||!P.sheet)return!1;if(w){const B=Array.from(P.sheet.cssRules||[]).find(R=>C==="media"&&R instanceof CSSMediaRule?R.media.mediaText===w:(C==="container"&&R instanceof CSSContainerRule||C==="supports"&&R instanceof CSSSupportsRule)&&R.conditionText===w);return!!B&&Array.from(B.cssRules).some(R=>R instanceof CSSStyleRule&&R.selectorText==="."+x)}return Array.from(P.sheet.cssRules||[]).some(B=>B instanceof CSSStyleRule&&B.selectorText==="."+x)})(u,d)||H(u,s,d),u}const y=ze(m),g=i?`n${i}-${y}`:"n"+y;return(function(u,x){ve.set(u,x)})(f,g),H(g,s,d),g})(this.styles,r,n)}getClassNames(){return[this.getClassName()]}getClassDefinitions(){return Object.entries(this.styles).map(([r,n])=>({className:this.getClassName(),property:r,value:n}))}toString(){return this.getClassName()}add(r,n){return this.styles[r]=n,this}bold(){return this.styles["font-weight"]="bold",this}center(){return this.styles["justify-content"]="center",this.styles["align-items"]="center",this}flex(r){return r!==void 0?this.styles.flex=r:this.styles.display="flex",this}}function dt(e){return e.isShorthand?()=>new E().add(e.cssProperty,e.defaultValue||""):r=>new E().add(e.cssProperty,r||"")}(function(){const e=E.prototype;for(const r of Ae)r.name in e||(e[r.name]=r.isShorthand?function(){return this.add(r.cssProperty,r.defaultValue||""),this}:function(n){return this.add(r.cssProperty,n),this})})();const q={};for(const e of Ae)q[e.name]=dt(e);for(const e of lt)e==="bold"||e==="center"?q[e]=()=>new E()[e]():e==="flex"&&(q[e]=r=>new E().flex(r));const{display:pt,flex:ut,grid:mt,bg:gt,color:ht,accentColor:ft,fontSize:yt,fontWeight:bt,fontFamily:xt,lineHeight:vt,letterSpacing:St,textAlign:wt,textDecoration:kt,bold:Ct,fontStyle:Pt,fontVariant:Tt,fontStretch:Bt,textTransform:Rt,textIndent:It,textOverflow:Nt,textShadow:At,whiteSpace:zt,wordSpacing:Et,wordWrap:Mt,overflowWrap:Wt,textAlignLast:Dt,textJustify:Lt,textDecorationLine:Ft,textDecorationColor:jt,textDecorationStyle:$t,textDecorationThickness:Ht,textUnderlineOffset:Ot,verticalAlign:Ut,position:Gt,padding:Qt,paddingTop:Vt,paddingRight:_t,paddingBottom:qt,paddingLeft:Yt,margin:Jt,marginTop:Kt,marginRight:Xt,marginBottom:Zt,marginLeft:er,width:tr,height:rr,minWidth:or,maxWidth:nr,minHeight:ir,maxHeight:ar,boxSizing:sr,top:lr,right:cr,bottom:dr,left:pr,zIndex:ur,flexDirection:mr,alignItems:gr,justifyContent:hr,center:fr,gap:yr,flexWrap:br,flexGrow:xr,flexShrink:vr,flexBasis:Sr,alignSelf:wr,alignContent:kr,justifySelf:Cr,justifyItems:Pr,gridTemplateColumns:Tr,gridTemplateRows:Br,gridTemplateAreas:Rr,gridColumn:Ir,gridRow:Nr,gridColumnStart:Ar,gridColumnEnd:zr,gridRowStart:Er,gridRowEnd:Mr,gridArea:Wr,gridAutoColumns:Dr,gridAutoRows:Lr,gridAutoFlow:Fr,border:jr,borderTop:$r,borderRight:Hr,borderBottom:Or,borderLeft:Ur,borderWidth:Gr,borderStyle:Qr,borderColor:Vr,borderTopWidth:_r,borderRightWidth:qr,borderBottomWidth:Yr,borderLeftWidth:Jr,borderTopStyle:Kr,borderRightStyle:Xr,borderBottomStyle:Zr,borderLeftStyle:eo,borderTopColor:to,borderRightColor:ro,borderBottomColor:oo,borderLeftColor:no,borderRadius:io,borderTopLeftRadius:ao,borderTopRightRadius:so,borderBottomLeftRadius:lo,borderBottomRightRadius:co,outline:po,outlineWidth:uo,outlineStyle:mo,outlineColor:go,outlineOffset:ho,backgroundColor:fo,backgroundImage:yo,backgroundRepeat:bo,backgroundPosition:xo,backgroundSize:vo,backgroundAttachment:So,backgroundClip:wo,backgroundOrigin:ko,boxShadow:Co,opacity:Po,transition:To,transitionProperty:Bo,transitionDuration:Ro,transitionTimingFunction:Io,transitionDelay:No,transform:Ao,transformOrigin:zo,transformStyle:Eo,perspective:Mo,perspectiveOrigin:Wo,backfaceVisibility:Do,animation:Lo,animationName:Fo,animationDuration:jo,animationTimingFunction:$o,animationDelay:Ho,animationIterationCount:Oo,animationDirection:Uo,animationFillMode:Go,animationPlayState:Qo,filter:Vo,backdropFilter:_o,overflow:qo,overflowX:Yo,overflowY:Jo,visibility:Ko,objectFit:Xo,objectPosition:Zo,listStyle:en,listStyleType:tn,listStylePosition:rn,listStyleImage:nn,borderCollapse:an,borderSpacing:sn,captionSide:ln,emptyCells:cn,tableLayout:dn,content:pn,quotes:un,counterReset:mn,counterIncrement:gn,appearance:hn,userSelect:fn,pointerEvents:yn,resize:bn,scrollBehavior:xn,clip:vn,clipPath:Sn,isolation:wn,mixBlendMode:kn,willChange:Cn,contain:Pn,pageBreakBefore:Tn,pageBreakAfter:Bn,pageBreakInside:Rn,breakBefore:In,breakAfter:Nn,breakInside:An,orphans:zn,widows:En,columnCount:Mn,columnFill:Wn,columnGap:Dn,columnRule:Ln,columnRuleColor:Fn,columnRuleStyle:jn,columnRuleWidth:$n,columnSpan:Hn,columnWidth:On,columns:Un,cursor:Gn}=q;function Qn(e){const r=e.trim();return r.startsWith("@media ")?{type:"media",condition:r.slice(7).trim()}:r.startsWith("@container ")?{type:"container",condition:r.slice(11).trim()}:r.startsWith("@supports ")?{type:"supports",condition:r.slice(10).trim()}:r.startsWith("@style ")?{type:"style",condition:r.slice(7).trim()}:{type:"media",condition:r}}function Ee(e){const r=Array.isArray(e)?e:Object.entries(e);return function(n,s){let i,d;if(s!==void 0?(i=n,d=s):n instanceof E?(i=n,d=void 0):(i=void 0,d=n),!(i||d&&Object.keys(d).length!==0))return"";if(d&&Object.keys(d).length>0){const m=[];for(const[g,u]of r){const x=d[g];x&&m.push({queryName:g,atRule:Qn(u),styles:x.getStyles()})}const f=[];if(i){const g=i.getStyles();f.push("default:"+ce(g))}f.push(...m.map(({queryName:g,styles:u})=>`${g}:${ce(u)}`));const b="n"+ze(f.sort().join("||"));let y={};i&&(y={...i.getStyles()},H(b,y));for(const{atRule:g,styles:u}of m)y={...y,...u},H(b,y,g.condition,g.type);return{className:b}}return i?{className:i.getClassName()}:""}}const Vn=Ee;var _n=Object.freeze({__proto__:null,StyleBuilder:E,accentColor:ft,alignContent:kr,alignItems:gr,alignSelf:wr,animation:Lo,animationDelay:Ho,animationDirection:Uo,animationDuration:jo,animationFillMode:Go,animationIterationCount:Oo,animationName:Fo,animationPlayState:Qo,animationTimingFunction:$o,appearance:hn,backdropFilter:_o,backfaceVisibility:Do,backgroundAttachment:So,backgroundClip:wo,backgroundColor:fo,backgroundImage:yo,backgroundOrigin:ko,backgroundPosition:xo,backgroundRepeat:bo,backgroundSize:vo,bg:gt,bold:Ct,border:jr,borderBottom:Or,borderBottomColor:oo,borderBottomLeftRadius:lo,borderBottomRightRadius:co,borderBottomStyle:Zr,borderBottomWidth:Yr,borderCollapse:an,borderColor:Vr,borderLeft:Ur,borderLeftColor:no,borderLeftStyle:eo,borderLeftWidth:Jr,borderRadius:io,borderRight:Hr,borderRightColor:ro,borderRightStyle:Xr,borderRightWidth:qr,borderSpacing:sn,borderStyle:Qr,borderTop:$r,borderTopColor:to,borderTopLeftRadius:ao,borderTopRightRadius:so,borderTopStyle:Kr,borderTopWidth:_r,borderWidth:Gr,bottom:dr,boxShadow:Co,boxSizing:sr,breakAfter:Nn,breakBefore:In,breakInside:An,captionSide:ln,center:fr,clip:vn,clipPath:Sn,color:ht,columnCount:Mn,columnFill:Wn,columnGap:Dn,columnRule:Ln,columnRuleColor:Fn,columnRuleStyle:jn,columnRuleWidth:$n,columnSpan:Hn,columnWidth:On,columns:Un,contain:Pn,content:pn,counterIncrement:gn,counterReset:mn,createBreakpoints:Vn,createCSSClass:ct,createStyleQueries:Ee,cursor:Gn,display:pt,emptyCells:cn,filter:Vo,flex:ut,flexBasis:Sr,flexDirection:mr,flexGrow:xr,flexShrink:vr,flexWrap:br,fontFamily:xt,fontSize:yt,fontStretch:Bt,fontStyle:Pt,fontVariant:Tt,fontWeight:bt,gap:yr,grid:mt,gridArea:Wr,gridAutoColumns:Dr,gridAutoFlow:Fr,gridAutoRows:Lr,gridColumn:Ir,gridColumnEnd:zr,gridColumnStart:Ar,gridRow:Nr,gridRowEnd:Mr,gridRowStart:Er,gridTemplateAreas:Rr,gridTemplateColumns:Tr,gridTemplateRows:Br,height:rr,isolation:wn,justifyContent:hr,justifyItems:Pr,justifySelf:Cr,left:pr,letterSpacing:St,lineHeight:vt,listStyle:en,listStyleImage:nn,listStylePosition:rn,listStyleType:tn,margin:Jt,marginBottom:Zt,marginLeft:er,marginRight:Xt,marginTop:Kt,maxHeight:ar,maxWidth:nr,minHeight:ir,minWidth:or,mixBlendMode:kn,objectFit:Xo,objectPosition:Zo,opacity:Po,orphans:zn,outline:po,outlineColor:go,outlineOffset:ho,outlineStyle:mo,outlineWidth:uo,overflow:qo,overflowWrap:Wt,overflowX:Yo,overflowY:Jo,padding:Qt,paddingBottom:qt,paddingLeft:Yt,paddingRight:_t,paddingTop:Vt,pageBreakAfter:Bn,pageBreakBefore:Tn,pageBreakInside:Rn,perspective:Mo,perspectiveOrigin:Wo,pointerEvents:yn,position:Gt,quotes:un,resize:bn,right:cr,scrollBehavior:xn,tableLayout:dn,textAlign:wt,textAlignLast:Dt,textDecoration:kt,textDecorationColor:jt,textDecorationLine:Ft,textDecorationStyle:$t,textDecorationThickness:Ht,textIndent:It,textJustify:Lt,textOverflow:Nt,textShadow:At,textTransform:Rt,textUnderlineOffset:Ot,top:lr,transform:Ao,transformOrigin:zo,transformStyle:Eo,transition:To,transitionDelay:No,transitionDuration:Ro,transitionProperty:Bo,transitionTimingFunction:Io,userSelect:fn,verticalAlign:Ut,visibility:Ko,whiteSpace:zt,widows:En,width:tr,willChange:Cn,wordSpacing:Et,wordWrap:Mt,zIndex:ur});function qn(){if(Je(),typeof globalThis<"u"){const e=globalThis;e.list=Ze,e.update=it,e.when=ot,e.on=at,e.render=st;for(const[r,n]of Object.entries(_n))try{e[r]=n}catch{}}}typeof globalThis<"u"&&qn();const o={primary:"#84cc16",primaryHover:"#a3e635",primaryGlow:"rgba(132, 204, 22, 0.3)",bg:"#0a0f1a",bgLight:"#111827",bgCard:"#1a2332",bgCode:"#0d1117",text:"#f8fafc",textMuted:"#94a3b8",textDim:"#64748b",border:"#1e293b",borderLight:"#334155",codeKeyword:"#c792ea",codeString:"#c3e88d",codeFunction:"#82aaff",codeComment:"#676e95",codeNumber:"#f78c6c"};function Yn(){const e=document.createElement("style");e.textContent=`
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
      background: ${o.bg};
      color: ${o.text};
      line-height: 1.6;
      min-height: 100vh;
    }

  
  `,document.head.appendChild(e)}const l=createStyleQueries({small:"@media (min-width: 341px)",medium:"@media (min-width: 601px)",large:"@media (min-width: 1025px)"}),t={container:l(padding("0 24px").maxWidth("1200px").margin("0 auto").width("100%")),header:l(display("flex").backgroundColor("#FF0000").alignItems("center").justifyContent("space-between").padding("20px 24px").backgroundColor("transparent").containerType("inline-size").position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${o.border}`),{medium:padding("20px 48px")}),logo:l(display("flex").alignItems("center").gap("12px").fontSize("20px").fontWeight("700").color(o.primary).transition("opacity 0.2s"),{medium:fontSize("24px")}),nav:l(display("flex").alignItems("center").gap("8px").width("100%").height("200px")),navLink:l(color(o.textMuted).fontSize("14px").fontWeight("500").transition("all 0.2s"),{medium:fontSize("15px")}),navLinkActive:l(color(o.text)),hero:l(padding("60px 24px 80px").textAlign("center").maxWidth("1000px").margin("0 auto").position("relative"),{medium:padding("100px 48px 120px")}),heroTitle:l(fontSize("40px").fontWeight("700").lineHeight("1.1").marginBottom("24px").color(o.text).letterSpacing("-0.02em"),{medium:fontSize("56px"),large:fontSize("64px")}),heroTitleAccent:l(color(o.primary)),heroTitleAccentStyle:{fontStyle:"italic"},heroSubtitle:l(fontSize("16px").color(o.textMuted).maxWidth("600px").margin("0 auto 48px").lineHeight("1.7"),{medium:fontSize("18px"),large:fontSize("20px")}),heroButtons:l(display("flex").gap("16px").justifyContent("center").flexWrap("wrap")),btnPrimary:l(padding("14px 32px").backgroundColor(o.primary).color(o.bg).borderRadius("8px").fontWeight("600").fontSize("15px").border("none").transition("all 0.2s")),btnPrimaryStyle:{boxShadow:`0 0 20px ${o.primaryGlow}`},btnSecondary:l(padding("14px 32px").backgroundColor("transparent").color(o.text).borderRadius("8px").fontWeight("600").fontSize("15px").border(`1px solid ${o.borderLight}`).transition("all 0.2s")),features:l(display("grid").gap("24px").padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("80px 48px")}),featuresStyle:{gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))"},featureCard:l(padding("32px").backgroundColor(o.bgCard).borderRadius("16px").border(`1px solid ${o.border}`).transition("all 0.3s").position("relative").overflow("hidden")),featureIcon:l(width("56px").height("56px").borderRadius("12px").display("flex").alignItems("center").justifyContent("center").marginBottom("20px").fontSize("28px")),featureIconStyle:{background:`linear-gradient(135deg, ${o.bgLight} 0%, ${o.bgCard} 100%)`,border:`1px solid ${o.border}`},featureTitle:l(fontSize("20px").fontWeight("600").marginBottom("12px").color(o.text)),featureDesc:l(fontSize("15px").color(o.textMuted).lineHeight("1.7")),codeBlock:l(backgroundColor(o.bgCode).borderRadius("12px").padding("24px").overflow("auto").border(`1px solid ${o.border}`).fontSize("14px").lineHeight("1.7")),codeInline:l(backgroundColor(o.bgLight).padding("3px 8px").borderRadius("6px").fontSize("14px").color(o.primary).border(`1px solid ${o.border}`)),section:l(padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("100px 48px")}),sectionTitle:l(fontSize("28px").fontWeight("700").marginBottom("16px").color(o.text).letterSpacing("-0.02em"),{medium:fontSize("36px"),large:fontSize("40px")}),sectionSubtitle:l(fontSize("18px").color(o.textMuted).marginBottom("56px").maxWidth("600px").lineHeight("1.7")),demoContainer:l(display("grid").gap("24px")),demoContainerStyle:{gridTemplateColumns:"1fr 1fr"},demoPanel:l(backgroundColor(o.bgCard).borderRadius("16px").border(`1px solid ${o.border}`).overflow("hidden")),demoPanelHeader:l(padding("14px 20px").backgroundColor(o.bgLight).borderBottom(`1px solid ${o.border}`).fontSize("13px").fontWeight("600").color(o.textMuted).textTransform("uppercase").letterSpacing("0.05em")),demoPanelContent:l(padding("24px")),footer:l(padding("48px").borderTop(`1px solid ${o.border}`).marginTop("auto").textAlign("center").backgroundColor(o.bgLight)),footerText:l(fontSize("14px").color(o.textDim)),footerLink:l(color(o.textMuted).transition("color 0.2s")),pageContent:l(padding("32px 24px 80px").maxWidth("900px").margin("0 auto"),{medium:padding("48px 48px 80px")}),pageTitle:l(fontSize("32px").fontWeight("700").marginBottom("24px").color(o.text).letterSpacing("-0.02em"),{medium:fontSize("40px"),large:fontSize("48px")}),pageSubtitle:l(fontSize("20px").color(o.textMuted).marginBottom("56px").lineHeight("1.7")),h2:l(fontSize("32px").fontWeight("600").marginTop("64px").marginBottom("20px").color(o.text).letterSpacing("-0.01em")),h3:l(fontSize("22px").fontWeight("600").marginTop("40px").marginBottom("16px").color(o.text)),p:l(fontSize("16px").color(o.textMuted).marginBottom("20px").lineHeight("1.8")),ul:l(paddingLeft("24px").marginBottom("20px")),li:l(fontSize("16px").color(o.textMuted).marginBottom("12px").lineHeight("1.7")),flex:l(display("flex")),flexCenter:l(display("flex").alignItems("center").justifyContent("center")),flexBetween:l(display("flex").alignItems("center").justifyContent("space-between")),flexCol:l(display("flex").flexDirection("column")),gap8:l(gap("8px")),gap16:l(gap("16px")),gap24:l(gap("24px")),gap32:l(gap("32px")),mt16:l(marginTop("16px")),mt24:l(marginTop("24px")),mt32:l(marginTop("32px")),mb16:l(marginBottom("16px")),mb24:l(marginBottom("24px")),table:l(width("100%").borderCollapse("collapse").marginBottom("24px").fontSize("14px")),th:l(padding("14px 16px").textAlign("left").borderBottom(`2px solid ${o.border}`).fontWeight("600").color(o.text).backgroundColor(o.bgLight)),td:l(padding("14px 16px").borderBottom(`1px solid ${o.border}`).color(o.textMuted)),glowBoxStyle:{boxShadow:`0 0 60px ${o.primaryGlow}, inset 0 0 60px rgba(132, 204, 22, 0.05)`}};let Y="home";function T(){return Y}function O(e){Y=e,window.history.pushState({},"",e==="home"?"/":`#${e}`),window.scrollTo(0,0),update()}const Se=["home","getting-started","core-api","tag-builders","styling","pitfalls","examples"];function Jn(){const e=window.location.hash.slice(1);Se.includes(e)&&(Y=e),window.addEventListener("popstate",()=>{const r=window.location.hash.slice(1);Y=Se.includes(r)?r:"home",update()})}function Me(e=32,r=!1){return svgSvg({width:String(e),height:String(e),viewBox:"0 0 32 32",fill:"none"},n=>{if(r){const s=n;s.removeAttribute("width"),s.removeAttribute("height"),s.style.maxWidth="100%",s.style.width="100%",s.style.height="auto"}},circleSvg({cx:"16",cy:"16",r:"14",stroke:o.primary,"stroke-width":"2",fill:"none",opacity:"0.3"}),circleSvg({cx:"16",cy:"16",r:"12",stroke:o.primary,"stroke-width":"2",fill:"none"}),circleSvg({cx:"16",cy:"16",r:"5",fill:o.primary}),circleSvg({cx:"16",cy:"5",r:"2",fill:o.primaryHover}),circleSvg({cx:"24",cy:"20",r:"2",fill:o.primaryHover}),circleSvg({cx:"8",cy:"20",r:"2",fill:o.primaryHover}))}function Kn(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"}),pathSvg({d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"}),pathSvg({d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"}),pathSvg({d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"}))}function Xn(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"}),pathSvg({d:"m3.3 7 8.7 5 8.7-5"}),pathSvg({d:"M12 22V12"}))}function Zn(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M13 2 3 14h9l-1 8 10-12h-9l1-8z"}))}function ei(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),pathSvg({d:"M21 3v5h-5"}),pathSvg({d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),pathSvg({d:"M8 16H3v5"}))}function ti(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m16 18 6-6-6-6"}),pathSvg({d:"m8 6-6 6 6 6"}))}function ri(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"}),pathSvg({d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"}),pathSvg({d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"}))}function oi(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M5 12h14"}),pathSvg({d:"m12 5 7 7-7 7"}))}function ni(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M20 6 9 17l-5-5"}))}function ii(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},rectSvg({x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"}),pathSvg({d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"}))}function ai(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"currentColor"},pathSvg({d:"M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"}))}function si(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"3",y1:"6",x2:"21",y2:"6"}),lineSvg({x1:"3",y1:"12",x2:"21",y2:"12"}),lineSvg({x1:"3",y1:"18",x2:"21",y2:"18"}))}function ci(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"18",y1:"6",x2:"6",y2:"18"}),lineSvg({x1:"6",y1:"6",x2:"18",y2:"18"}))}let U=!1;function di(){U=!U,update()}function We(){U=!1,update()}const De=[{label:"Getting Started",route:"getting-started"},{label:"Core API",route:"core-api"},{label:"Tag Builders",route:"tag-builders"},{label:"Styling",route:"styling"},{label:"Pitfalls",route:"pitfalls"},{label:"Examples",route:"examples"}];function Le(e,r){const n=()=>T()===r||T().startsWith(r+"-");return a({href:`#${r}`},l(display("flex").alignItems("center").padding("8px 14px").borderRadius("8px").fontSize("14px").fontWeight("500").transition("all 0.2s").cursor("pointer")),{style:()=>({color:n()?o.primary:o.textMuted,backgroundColor:n()?"rgba(132, 204, 22, 0.1)":"transparent"})},e,on("click",s=>{s.preventDefault(),O(r),We()}),on("mouseenter",s=>{n()||(s.target.style.color=o.primary,s.target.style.backgroundColor="rgba(132, 204, 22, 0.05)")}),on("mouseleave",s=>{n()||(s.target.style.color=o.textMuted,s.target.style.backgroundColor="transparent")}))}function pi(){return a({href:"/"},l(display("flex").alignItems("center").gap("10px").fontSize("18px").fontWeight("700").color(o.primary).transition("opacity 0.2s").cursor("pointer")),Me(28),span("Nuclo"),on("click",e=>{e.preventDefault(),O("home"),We()}),on("mouseenter",e=>{e.currentTarget.style.opacity="0.8"}),on("mouseleave",e=>{e.currentTarget.style.opacity="1"}))}function Fe(){return a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer",ariaLabel:"GitHub"},l(display("flex").alignItems("center").justifyContent("center").width("36px").height("36px").borderRadius("8px").transition("all 0.2s")),{style:{color:o.textMuted,backgroundColor:"transparent"}},ai(),on("mouseenter",e=>{e.currentTarget.style.color=o.primary,e.currentTarget.style.backgroundColor="rgba(132, 204, 22, 0.1)"}),on("mouseleave",e=>{e.currentTarget.style.color=o.textMuted,e.currentTarget.style.backgroundColor="transparent"}))}function ui(){return button(l(display("flex").alignItems("center").justifyContent("center").width("40px").height("40px").borderRadius("8px").backgroundColor("transparent").border("none").color(o.text).cursor("pointer").transition("all 0.2s"),{medium:display("none")}),when(()=>U,ci()).else(si()),on("click",di))}function mi(){return when(()=>U,div(l(position("fixed").top("64px").left("0").right("0").backgroundColor(o.bg).borderBottom(`1px solid ${o.border}`).padding("16px 24px").zIndex(99).display("flex").flexDirection("column").gap("8px")),{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.95)"}},...De.map(e=>Le(e.label,e.route)),div(l(display("flex").alignItems("center").gap("8px").padding("8px 14px")),Fe(),span(l(color(o.textMuted).fontSize("14px")),"GitHub"))))}function gi(){const e=l(position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${o.border}`)),r=l(display("flex").alignItems("center").justifyContent("space-between").maxWidth("1400px").margin("0 auto").padding("12px 24px"),{medium:padding("16px 48px")}),n=l(display("none").alignItems("center").gap("4px"),{medium:display("flex")}),s=l(display("flex").alignItems("center").gap("8px"));return div(header(e,{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.85)"}},div(r,pi(),nav(n,...De.map(i=>Le(i.label,i.route))),div(s,div(l(display("none"),{medium:display("flex")}),Fe()),ui()))),mi())}function hi(){return footer(t.footer,div(t.footerText,"Created by ",a({href:"https://github.com/dan2dev",target:"_blank",rel:"noopener noreferrer"},t.footerLink,"Danilo Celestino de Castro",on("mouseenter",e=>{e.target.style.color=o.primary}),on("mouseleave",e=>{e.target.style.color=o.textMuted}))," · MIT License · ",a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer"},t.footerLink,"GitHub",on("mouseenter",e=>{e.target.style.color=o.primary}),on("mouseleave",e=>{e.target.style.color=o.textMuted}))))}let je={};function we(e,r){je[e]=r,update()}function ke(e){return je[e]||!1}function fi(e){return e.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,`<span style="color: ${o.codeString}">$&</span>`).replace(/(\/\/.*$)/gm,`<span style="color: ${o.codeComment}">$1</span>`).replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,`<span style="color: ${o.codeKeyword}">$1</span>`).replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,`<span style="color: ${o.codeFunction}">$1</span>(`).replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${o.codeNumber}">$1</span>`).replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g,`: <span style="color: ${o.codeKeyword}">$1</span>`)}function c(e,r="typescript",n=!0){const s=`code-${Math.random().toString(36).slice(2,9)}`,i=fi(e.trim()),d={backgroundColor:o.bgLight,border:`1px solid ${o.border}`};return div(l(position("relative")),pre(t.codeBlock,code({innerHTML:i})),n?button(l(position("absolute").top("12px").right("12px").padding("6px 10px").borderRadius("6px").color(o.textMuted).fontSize("12px").cursor("pointer").display("flex").alignItems("center").gap("4px").transition("all 0.2s")),{style:d},()=>ke(s)?ni():ii(),()=>ke(s)?"Copied!":"Copy",on("click",async()=>{await navigator.clipboard.writeText(e.trim()),we(s,!0),setTimeout(()=>we(s,!1),2e3)}),on("mouseenter",m=>{m.target.style.borderColor=o.borderLight,m.target.style.color=o.text}),on("mouseleave",m=>{m.target.style.borderColor=o.border,m.target.style.color=o.textMuted})):null)}function k(e){return code(t.codeInline,e)}const $e=[{id:"counter",title:"Counter",description:"The classic counter example showing basic state management and event handling.",code:`import 'nuclo';

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

render(app, document.body);`}},yi=`import 'nuclo';

let count = 0;

const counter = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);`;let F=0;function bi(){return div(l(display("flex").flexDirection("column").gap("12px").padding("24px").backgroundColor(o.bgCard).border(`1px solid ${o.border}`).borderRadius("12px")),h3(l(fontSize("16px").fontWeight("600").color(o.text)),"Live Counter Demo"),div(l(display("flex").alignItems("center").gap("12px")),span(l(fontSize("32px").fontWeight("700").color(o.text)),()=>F),span(l(color(o.textDim)),()=>F%2===0?"even":"odd")),div(l(display("flex").gap("8px")),button(t.btnSecondary,"-",on("click",()=>{F--,update()})),button(t.btnSecondary,"Reset",on("click",()=>{F=0,update()})),button(t.btnPrimary,{style:t.btnPrimaryStyle},"+",on("click",()=>{F++,update()}))))}function D(e,r,n){return div(t.featureCard,div(t.featureIcon,{style:t.featureIconStyle},e),h3(t.featureTitle,r),p(t.featureDesc,n),on("mouseenter",s=>{const i=s.currentTarget;i.style.borderColor=o.primary,i.style.transform="translateY(-4px)",i.style.boxShadow=`0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${o.primaryGlow}`}),on("mouseleave",s=>{const i=s.currentTarget;i.style.borderColor=o.border,i.style.transform="translateY(0)",i.style.boxShadow="none"}))}const xi=["counter","todo","search","async","styled-card","subtasks"],vi=$e.filter(e=>xi.includes(e.id));function Si(e){O("examples"),setTimeout(()=>{const r=document.getElementById(e);r&&r.scrollIntoView({behavior:"smooth",block:"start"})},150)}function wi(){return div(section(t.hero,div(Me(600,!0)),h1(t.heroTitle,"Build ",span(t.heroTitleAccent,{style:t.heroTitleAccentStyle},"Faster"),", ",span(t.heroTitleAccent,{style:t.heroTitleAccentStyle},"Reactive")," Interfaces."),p(t.heroSubtitle,"A lightweight, flexible, component-based framework for the modern web. Just functions, plain objects, and explicit updates."),div(t.heroButtons,button(t.btnPrimary,{style:t.btnPrimaryStyle},l(display("flex").alignItems("center").gap("8px")),"Get Started",oi(),on("click",()=>O("getting-started")),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover,e.target.style.transform="translateY(-2px)",e.target.style.boxShadow=`0 0 30px ${o.primaryGlow}`}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary,e.target.style.transform="translateY(0)",e.target.style.boxShadow=`0 0 20px ${o.primaryGlow}`})),button(t.btnSecondary,"View Demo",on("click",()=>O("examples")),on("mouseenter",e=>{e.target.style.borderColor=o.primary,e.target.style.color=o.primary,e.target.style.transform="translateY(-2px)"}),on("mouseleave",e=>{e.target.style.borderColor=o.borderLight,e.target.style.color=o.text,e.target.style.transform="translateY(0)"})))),section(l(padding("0 48px 100px").maxWidth("800px").margin("0 auto")),div(l(borderRadius("16px").border(`1px solid ${o.border}`).overflow("hidden")),{style:t.glowBoxStyle},div(l(padding("12px 20px").backgroundColor(o.bgLight).borderBottom(`1px solid ${o.border}`).display("flex").alignItems("center").gap("8px")),span(l(width("12px").height("12px").borderRadius("50%").backgroundColor("#ff5f57"))),span(l(width("12px").height("12px").borderRadius("50%").backgroundColor("#febc2e"))),span(l(width("12px").height("12px").borderRadius("50%").backgroundColor("#28c840"))),span(l(marginLeft("auto").fontSize("13px").color(o.textDim)),"main.ts")),c(yi,"typescript",!1))),section(t.features,{style:t.featuresStyle},D(Kn(),"Lightweight & Fast","Zero dependencies, tiny bundle size. Built for performance from the ground up with direct DOM manipulation."),D(Xn(),"Component-Based","Build encapsulated components that manage their own state. Compose them to make complex UIs simple."),D(ei(),"Simple Reactivity","Explicit update() calls give you full control. No magic, no proxies, no hidden re-renders."),D(Zn(),"Fine-Grained Updates","Only updates what changed. Elements are reused, branches are preserved, performance is maximized."),D(ti(),"TypeScript-First","Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime."),D(ri(),"Intuitive API","Global tag builders feel natural. Just use div(), span(), button() - no imports needed.")),section(t.section,h2(t.sectionTitle,"Quick Start"),p(t.sectionSubtitle,"Get up and running in seconds."),div(t.flexCol,t.gap32,div(h3(l(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"1. Install"),c("npm install nuclo","bash")),div(h3(l(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"2. Import and use"),c(`import 'nuclo';

// Now use div(), update(), on(), list(), when(), render() globally
const app = div(
  h1('Hello, Nuclo!'),
  p('Building UIs made simple.')
);

render(app, document.body);`,"typescript")),div(h3(l(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"3. Add TypeScript support"),c(`// tsconfig.json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`,"json"))),div(l(marginTop("32px")),h3(l(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"Try it live"),bi())),section(t.section,h2(t.sectionTitle,"Core Concepts"),p(t.sectionSubtitle,"Explicit updates, reactive functions, conditionals, list syncing, and styling."),div(t.demoContainer,{style:t.demoContainerStyle},div(t.demoPanel,div(t.demoPanelHeader,"Batch updates"),div(t.demoPanelContent,c(S.batchUpdates.code,S.batchUpdates.lang,!1))),div(t.demoPanel,div(t.demoPanelHeader,"Reactive functions"),div(t.demoPanelContent,c(S.reactiveText.code,S.reactiveText.lang,!1)))),div(l(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),div(t.featureCard,h3(t.featureTitle,"Conditional rendering"),c(`when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('Dashboard')
).else(
  div('Please log in')
);`,"typescript",!1)),div(t.featureCard,h3(t.featureTitle,"List synchronization"),c("list(() => items, (item, index) =>\n  div(() => `${index}: ${item.name}`)\n);","typescript",!1)),div(t.featureCard,h3(t.featureTitle,"CSS-in-JS styling"),c(h.overviewQuickExample.code,h.overviewQuickExample.lang,!1)))),section(t.section,h2(t.sectionTitle,"Examples"),p(t.sectionSubtitle,"Jump into any example from the original gallery."),div(l(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),...vi.map(e=>div(t.featureCard,h3(t.featureTitle,e.title),p(t.featureDesc,e.description),button(t.btnSecondary,"View Example",on("click",()=>Si(e.id))))))))}function ki(){return div(t.pageContent,h1(t.pageTitle,"Getting Started"),p(t.pageSubtitle,"Everything from the original Nuclo docs: installs, Deno support, first app walkthrough, explicit updates, events, styling, and best practices."),h2(t.h2,"Installation"),p(t.p,"Install with your preferred package manager:"),c(S.installNpm.code,S.installNpm.lang),c(S.installYarn.code,S.installYarn.lang),c(S.installPnpm.code,S.installPnpm.lang),p(t.p,"Deno works too—import directly from npm:"),c(S.denoImport.code,S.denoImport.lang),p(t.p,"Or add it to ",k("deno.json"),":"),c(S.denoJson.code,S.denoJson.lang),p(t.p,"Then import once to register global builders:"),c(S.denoUsage.code,S.denoUsage.lang),h2(t.h2,"TypeScript Setup"),p(t.p,"Nuclo ships full typings for 140+ HTML/SVG builders. Enable them globally with ",k("types"),"."),c(S.tsconfigTypes.code,S.tsconfigTypes.lang),p(t.p,"…or add a reference to your env definition file:"),c(S.typesReference.code,S.typesReference.lang),h2(t.h2,"Your First App"),p(t.p,"Straight from the original landing page: a counter that shows state, events, and explicit ",k("update()"),"."),c(S.firstApp.code,S.firstApp.lang),h3(t.h3,"How it works"),ul(t.ul,li(t.li,strong("Import:")," ",k("import 'nuclo'")," registers global builders"),li(t.li,strong("State:")," plain variables/objects—no hooks or stores"),li(t.li,strong("Reactive content:")," zero-arg functions rerender on ",k("update()")),li(t.li,strong("Events:")," attach listeners with ",k("on()")),li(t.li,strong("Render:")," mount once with ",k("render()"))),h2(t.h2,"Understanding update()"),p(t.p,k("update()")," is explicit: mutate freely, then call it once to refresh reactive functions."),h3(t.h3,"Batching updates"),c(S.batchUpdates.code,S.batchUpdates.lang),h3(t.h3,"Why explicit?"),ul(t.ul,li(t.li,"Performance: batch multiple mutations into one DOM update"),li(t.li,"Control: you decide exactly when the UI refreshes"),li(t.li,"Predictability: no hidden re-renders or proxies"),li(t.li,"Debugging: set a breakpoint on ",k("update()")," to trace changes")),h2(t.h2,"Reactive Functions"),p(t.p,"Any zero-arg function is reactive. Use them for text, attributes, and styles."),h3(t.h3,"Text content"),c(S.reactiveText.code,S.reactiveText.lang),h3(t.h3,"Attributes"),c(S.reactiveAttributes.code,S.reactiveAttributes.lang),h3(t.h3,"Styles"),c(S.reactiveStyles.code,S.reactiveStyles.lang),h3(t.h3,"Complex expressions"),c(S.complexExpressions.code,S.complexExpressions.lang),h2(t.h2,"Event Handling with on()"),p(t.p,"The ",k("on()")," helper returns modifiers for any DOM event."),h3(t.h3,"Basic events"),c(S.eventBasic.code,S.eventBasic.lang),h3(t.h3,"Multiple events"),c(S.eventMultiple.code,S.eventMultiple.lang),h3(t.h3,"Event options"),c(S.eventOptions.code,S.eventOptions.lang),h3(t.h3,"Keyboard helpers"),c(S.keyboardEvents.code,S.keyboardEvents.lang),h2(t.h2,"Styling"),p(t.p,"Nuclo ships a CSS-in-JS system with chainable helpers and ",k("createStyleQueries"),"."),h3(t.h3,"Using createStyleQueries"),c(S.stylingSetup.code,S.stylingSetup.lang),h3(t.h3,"Responsive styles"),c(S.responsiveStyles.code,S.responsiveStyles.lang),h3(t.h3,"Dynamic styles"),c(S.dynamicStyles.code,S.dynamicStyles.lang),h2(t.h2,"Best Practices"),h3(t.h3,"Batch your updates"),c(S.bestPracticeBatch.code,S.bestPracticeBatch.lang),h3(t.h3,"Use computed helpers"),c(S.bestPracticeComputed.code,S.bestPracticeComputed.lang),h3(t.h3,"Component-like functions"),c(S.componentFunctions.code,S.componentFunctions.lang),h3(t.h3,"Use plain objects/arrays"),c(S.mutableState.code,S.mutableState.lang),h3(t.h3,"Handle async flows"),c(S.asyncFlow.code,S.asyncFlow.lang),h2(t.h2,"Next Steps"),ul(t.ul,li(t.li,strong("Core API:")," learn ",k("when()"),", ",k("list()"),", and more"),li(t.li,strong("Tag Builders:")," explore all HTML and SVG elements"),li(t.li,strong("Styling:")," CSS-in-JS helpers and responsive design"),li(t.li,strong("Examples:")," run through the full demo gallery")))}const v={updateUsage:{lang:"typescript",code:`let count = 0;

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
button('Hover me', tooltip('Click to submit'));`}};function Ci(){return div(t.pageContent,h1(t.pageTitle,"Core API"),p(t.pageSubtitle,"The essential functions that power every Nuclo application: update(), render(), on(), list(), and when()."),h2(t.h2,{id:"update"},"update()"),p(t.p,"Trigger a synchronous refresh of every reactive function in your application."),c(v.updateUsage.code,v.updateUsage.lang),h3(t.h3,"Key Points"),ul(t.ul,li(t.li,"Call after batching mutations for best performance"),li(t.li,"Only zero-argument functions re-evaluate"),li(t.li,"Safe to call multiple times; prefer grouping work first")),h2(t.h2,{id:"render"},"render(element, container)"),p(t.p,"Mount an element tree to a DOM container (append, not replace)."),c(v.renderUsage.code,v.renderUsage.lang),h3(t.h3,"Key Points"),ul(t.ul,li(t.li,"Typical pattern: render one root that owns the whole app"),li(t.li,"You can render multiple trees if needed"),li(t.li,"Works with any element created by the tag builders")),h2(t.h2,{id:"on"},"on(event, handler, options?)"),p(t.p,"Attach event listeners with full TypeScript support."),c(v.onClick.code,v.onClick.lang),h3(t.h3,"Multiple Events"),p(t.p,"Attach multiple event handlers to the same element:"),c(v.onMultipleEvents.code,v.onMultipleEvents.lang),h3(t.h3,"Event Options"),p(t.p,"Pass standard event listener options:"),c(v.onPassive.code,v.onPassive.lang),h3(t.h3,"Keyboard Events"),c(v.onKeyboard.code,v.onKeyboard.lang),h3(t.h3,"Form Handling"),c(v.onFormSubmit.code,v.onFormSubmit.lang),h2(t.h2,{id:"list"},"list(provider, renderer)"),p(t.p,"Synchronize arrays to DOM nodes. Items stay mounted while object identity is stable—mutate objects in place instead of replacing them."),c(v.listBasic.code,v.listBasic.lang),h3(t.h3,"Object Identity"),p(t.p,"Nuclo tracks items by reference. Mutate objects to preserve their DOM elements:"),c(v.listIdentity.code,v.listIdentity.lang),h3(t.h3,"Nested Lists"),p(t.p,"Nested lists remain stable too:"),c(v.listNested.code,v.listNested.lang),h2(t.h2,{id:"when"},"when(condition, ...content)"),p(t.p,"Chain conditional branches; the first truthy branch wins and DOM is preserved when the branch stays the same."),h3(t.h3,"Basic Usage"),c(v.whenBasic.code,v.whenBasic.lang),h3(t.h3,"Multiple Conditions"),c(v.whenRoles.code,v.whenRoles.lang),h3(t.h3,"Content in Branches"),c(v.whenElseBranch.code,v.whenElseBranch.lang),h3(t.h3,"DOM Preservation"),p(t.p,"Elements persist across updates if the same branch is active:"),c(v.whenPreserve.code,v.whenPreserve.lang),h3(t.h3,"Nested Conditions"),c(v.whenNestedConditions.code,v.whenNestedConditions.lang))}function Pi(){const e=[{title:"Document Structure",tags:"html, head, body, header, footer, main, section, article, aside, nav"},{title:"Content Sectioning",tags:"h1, h2, h3, h4, h5, h6, div, span, p, blockquote, pre, code"},{title:"Lists",tags:"ul, ol, li, dl, dt, dd"},{title:"Forms",tags:"form, input, textarea, button, select, option, label, fieldset, legend"},{title:"Tables",tags:"table, thead, tbody, tfoot, tr, th, td, caption, col, colgroup"},{title:"Media",tags:"img, video, audio, source, track, canvas, svg"},{title:"Interactive",tags:"a, button, details, summary, dialog"},{title:"Text Formatting",tags:"strong, em, mark, small, del, ins, sub, sup, abbr, cite, q, kbd, samp, var"}];return div(t.pageContent,h1(t.pageTitle,"Tag Builders"),p(t.pageSubtitle,"Every HTML and SVG element is available globally after importing Nuclo. Build your UI with simple function calls."),h2(t.h2,{id:"overview"},"Overview"),p(t.p,"Tag builders accept children, attributes, event modifiers, and arrays. After ",k("import 'nuclo'"),", all builders are available globally."),c(v.tagBuilderBasic.code,v.tagBuilderBasic.lang),h2(t.h2,{id:"html-tags"},"HTML Tags"),p(t.p,"Full HTML5 coverage with 140+ elements:"),...e.map(r=>div(h3(l(fontSize("18px").fontWeight("600").marginTop("24px").marginBottom("12px")),r.title),pre(t.codeBlock,code(r.tags)))),p(t.p,l(marginTop("24px")),"And 100+ more—see ",a({href:"https://github.com/dan2dev/nuclo/blob/main/packages/nuclo/src/core/tagRegistry.ts",target:"_blank",rel:"noopener noreferrer"},k("the full registry")),"."),h2(t.h2,{id:"svg-tags"},"SVG Tags"),p(t.p,"Full SVG support for graphics and icons:"),c(`svg, circle, ellipse, line, path, polygon, polyline, rect,
g, defs, use, symbol, marker, clipPath, mask, pattern,
linearGradient, radialGradient, stop, text, tspan, textPath`,"text"),h3(t.h3,"SVG Example"),c(v.svgExample.code,v.svgExample.lang),h2(t.h2,{id:"attributes"},"Attributes"),p(t.p,"Pass attributes as objects—values can be static or reactive functions."),h3(t.h3,"Static Attributes"),c(v.attributesStatic.code,v.attributesStatic.lang),h3(t.h3,"Reactive Attributes"),p(t.p,"Use functions for dynamic values that update on ",k("update()"),":"),c(v.attributesReactive.code,v.attributesReactive.lang),h3(t.h3,"Style Objects"),p(t.p,"Styles can be objects, strings, or reactive functions:"),c(v.attributesStyle.code,v.attributesStyle.lang),h3(t.h3,"Boolean Attributes"),c(v.attributesBoolean.code,v.attributesBoolean.lang),h3(t.h3,"Special Attributes"),p(t.p,"Some attributes are mapped for convenience:"),c(v.specialAttributes.code,v.specialAttributes.lang),h2(t.h2,{id:"className-merging"},"className Merging"),p(t.p,"Multiple ",k("className")," values are merged rather than overwritten—static strings, reactive functions, and style helper modifiers all compose."),c(v.classNameMerging.code,v.classNameMerging.lang),h3(t.h3,"Conditional Classes"),c(v.classNameConditional.code,v.classNameConditional.lang),h3(t.h3,"With Style Helpers"),c(v.styleHelperMerging.code,v.styleHelperMerging.lang),h3(t.h3,"Status Pattern"),p(t.p,"Common pattern for conditional styling:"),c(v.classNameStatusPattern.code,v.classNameStatusPattern.lang),h2(t.h2,{id:"modifiers"},"Modifiers"),p(t.p,"Objects with ",k("__modifier")," allow behaviors beyond attributes."),h3(t.h3,"Event Modifiers"),c(v.modifiersEvents.code,v.modifiersEvents.lang),h3(t.h3,"Style Modifiers"),c(v.modifiersStyles.code,v.modifiersStyles.lang),h3(t.h3,"Custom Modifiers"),p(t.p,"Create your own modifiers for reusable behaviors:"),c(v.modifiersCustomFocus.code,v.modifiersCustomFocus.lang))}function Ti(){return div(t.pageContent,h1(t.pageTitle,"Styling"),p(t.pageSubtitle,"All of the original styling docs are here: chainable helpers, StyleBuilder utilities, responsive queries, and layout recipes."),h2(t.h2,"Overview"),p(t.p,"Nuclo's styling system is powered by chainable helpers that generate CSS classes for you. Start with any helper (",k("bg()"),", ",k("padding()"),", etc.), chain more, and wrap with ",k("createStyleQueries")," for responsive variants."),p(t.p,"Quick example straight from the legacy site:"),c(h.overviewQuickExample.code,h.overviewQuickExample.lang),h2(t.h2,"StyleBuilder"),p(t.p,"Each helper returns a StyleBuilder instance. You can chain helpers, pull out the generated class name, or read the computed styles."),h3(t.h3,"How it works"),c(h.styleBuilderUsage.code,h.styleBuilderUsage.lang),h3(t.h3,"StyleBuilder methods"),c(h.styleBuilderMethods.code,h.styleBuilderMethods.lang),h3(t.h3,"Generated CSS"),c(h.styleBuilderClass.code,h.styleBuilderClass.lang),h2(t.h2,"Style Helpers"),p(t.p,"95+ helpers mirror CSS properties: layout, spacing, typography, color, flexbox, grid, effects, and more. Chain them to build up reusable class names."),h3(t.h3,"Basic usage"),c(h.styleHelpersBasic.code,h.styleHelpersBasic.lang),h3(t.h3,"Available helpers (from the original reference)"),c(h.styleHelpersList.code,h.styleHelpersList.lang),h3(t.h3,"Shorthand helpers"),c(h.styleHelpersShorthand.code,h.styleHelpersShorthand.lang),h2(t.h2,"Style Queries"),p(t.p,"Use ",k("createStyleQueries")," to add media, container, or feature queries. Defaults can be merged with breakpoint overrides."),c(h.styleQueriesSetup.code,h.styleQueriesSetup.lang),h3(t.h3,"Defaults and overrides"),c(h.styleQueriesDefaults.code,h.styleQueriesDefaults.lang),h3(t.h3,"Generated CSS output"),c(h.styleQueriesGeneratedCss.code,h.styleQueriesGeneratedCss.lang,!1),h3(t.h3,"Query-only styles"),c(h.styleQueriesQueriesOnly.code,h.styleQueriesQueriesOnly.lang),h3(t.h3,"Container queries"),c(h.styleQueriesContainer.code,h.styleQueriesContainer.lang),h3(t.h3,"Feature queries"),c(h.styleQueriesFeature.code,h.styleQueriesFeature.lang),h3(t.h3,"Viewport breakpoints example"),c(h.styleQueriesExamples.code,h.styleQueriesExamples.lang),h2(t.h2,"Layout"),p(t.p,"Display, positioning, sizing, spacing, and overflow helpers pulled from the original docs."),h3(t.h3,"Display & position"),c(h.layoutDisplayPosition.code,h.layoutDisplayPosition.lang),h3(t.h3,"Sizing"),c(h.layoutSizing.code,h.layoutSizing.lang),h3(t.h3,"Spacing"),c(h.layoutSpacing.code,h.layoutSpacing.lang),h3(t.h3,"Overflow"),c(h.layoutOverflow.code,h.layoutOverflow.lang),h2(t.h2,"Typography"),p(t.p,"Font and text styling helpers."),h3(t.h3,"Font properties"),c(h.typographyFont.code,h.typographyFont.lang),h3(t.h3,"Text styling"),c(h.typographyText.code,h.typographyText.lang),h3(t.h3,"Typography system example"),c(h.typographySystem.code,h.typographySystem.lang),h2(t.h2,"Colors & Backgrounds"),h3(t.h3,"Colors"),c(h.colorsBasic.code,h.colorsBasic.lang),h3(t.h3,"Gradients"),c(h.colorsGradients.code,h.colorsGradients.lang),h3(t.h3,"Background properties"),c(h.colorsBackground.code,h.colorsBackground.lang),h2(t.h2,"Flexbox"),p(t.p,"Container and item helpers, plus an example navbar layout."),h3(t.h3,"Container helpers"),c(h.flexContainer.code,h.flexContainer.lang),h3(t.h3,"Item helpers"),c(h.flexItem.code,h.flexItem.lang),h3(t.h3,"Navbar example"),c(h.flexNavbarExample.code,h.flexNavbarExample.lang),h2(t.h2,"CSS Grid"),h3(t.h3,"Container helpers"),c(h.gridContainer.code,h.gridContainer.lang),h3(t.h3,"Item helpers"),c(h.gridItem.code,h.gridItem.lang),h3(t.h3,"Responsive card grid"),c(h.gridResponsiveExample.code,h.gridResponsiveExample.lang),h2(t.h2,"Effects & Transitions"),p(t.p,"Shadows, opacity, transitions, transforms, filters, and hover-friendly reactive styles."),h3(t.h3,"Box shadows"),c(h.effectsShadows.code,h.effectsShadows.lang),h3(t.h3,"Visibility"),c(h.effectsVisibility.code,h.effectsVisibility.lang),h3(t.h3,"Transitions"),c(h.effectsTransitions.code,h.effectsTransitions.lang),h3(t.h3,"Transforms"),c(h.effectsTransforms.code,h.effectsTransforms.lang),h3(t.h3,"Filters & backdrop"),c(h.effectsFilters.code,h.effectsFilters.lang),h3(t.h3,"Hover effects with reactive styles"),c(h.effectsHover.code,h.effectsHover.lang),h2(t.h2,"Organizing Styles"),p(t.p,"Reuse the theme + style modules from the legacy page: keep tokens, shared layout pieces, and component styles in one place."),h3(t.h3,"Theme constants"),c(h.organizingTheme.code,h.organizingTheme.lang),h3(t.h3,"Shared styles"),c(h.organizingStyles.code,h.organizingStyles.lang),h3(t.h3,"Using the styles"),c(h.organizingUsage.code,h.organizingUsage.lang),h2(t.h2,"Next Steps"),ul(t.ul,li(t.li,"Explore ",k("CodeBlock")," + ",k("InlineCode")," components to present snippets cleanly."),li(t.li,"Combine ",k("createStyleQueries")," with the helpers above for responsive variants."),li(t.li,"Jump to the ",a({href:"#examples"},"Examples page")," to see these styles in action.")))}function Bi(){return div(t.pageContent,h1(t.pageTitle,"Common Pitfalls"),p(t.pageSubtitle,"Avoid these common mistakes when building with Nuclo. Learn the patterns that work and why."),h2(t.h2,{id:"conditional-elements"},"Conditional Element Rendering"),div(l(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(l(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Using a reactive function to conditionally return different elements won't work:"),c(`// ❌ Wrong - reactive function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // This won't display anything!
)`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Use ",k("when()")," for conditional element rendering:"),c(`// ✅ Correct - use when() for conditional elements
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(t.p,"Reactive functions ",k("() => value")," work great for text content and attribute values because Nuclo can update them in place. But elements need to be mounted/unmounted from the DOM, which requires ",k("when()")," to manage properly.")),h2(t.h2,{id:"forgetting-update"},"Forgetting to Call update()"),div(l(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(l(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Changing state without calling ",k("update()")," won't refresh the UI:"),c(`// ❌ Wrong - UI won't update
let count = 0;

button('Increment', on('click', () => {
  count++;  // State changed but UI stays the same
}))`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Always call ",k("update()")," after changing state:"),c(`// ✅ Correct - call update() to refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // Now the UI will reflect the new count
}))`,"typescript")),h2(t.h2,{id:"list-identity"},"Replacing Objects in Lists"),div(l(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(l(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Replacing objects instead of mutating them causes unnecessary DOM recreation:"),c(`// ❌ Wrong - creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Mutate the existing object to preserve its DOM element:"),c(`// ✅ Correct - mutate the object, element is preserved
todos[0].done = true;
update();`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(t.p,"Nuclo's ",k("list()")," tracks items by object identity (reference). When you replace an object with a new one, Nuclo sees it as a different item and recreates the DOM element. Mutating preserves identity and enables efficient updates.")),h2(t.h2,{id:"multiple-updates"},"Multiple update() Calls"),div(l(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(l(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Calling ",k("update()")," multiple times is wasteful:"),c(`// ❌ Inefficient - 3 updates instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
}`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Batch all state changes, then call ",k("update()")," once:"),c(`// ✅ Efficient - batch changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  update();  // One update for all changes
}`,"typescript")),h2(t.h2,{id:"static-vs-reactive"},"Static Values Instead of Reactive"),div(l(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(l(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Using a static value when you need it to update:"),c(`// ❌ Wrong - count is captured once, never updates
let count = 0;

div(
  \`Count: \${count}\`  // Always shows "Count: 0"
)`,"typescript"),h3(l(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Wrap in a function to make it reactive:"),c(`// ✅ Correct - function is called on each update()
let count = 0;

div(
  () => \`Count: \${count}\`  // Updates when count changes
)`,"typescript")),h2(t.h2,{id:"summary"},"Quick Reference"),div(l(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`)),ul(t.ul,li(t.li,strong("Conditional elements:")," Use ",k("when()"),", not ",k("() => condition ? A : B")),li(t.li,strong("State changes:")," Always call ",k("update()")," after modifying state"),li(t.li,strong("Lists:")," Mutate objects, don't replace them"),li(t.li,strong("Batching:")," Group state changes before a single ",k("update()")),li(t.li,strong("Dynamic content:")," Wrap in ",k("() =>")," to make reactive"))))}let G=0,I=[{id:1,text:"Learn Nuclo",done:!0},{id:2,text:"Build something awesome",done:!1},{id:3,text:"Share with friends",done:!1}],N="",Ce=4;const He=l(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),de=l(padding("10px 20px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Ri=l(padding("10px 20px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").fontWeight("500").cursor("pointer").transition("all 0.2s")),Ii=l(padding("10px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").width("220px").transition("border-color 0.2s"));function Ni(){return div(He,div(t.flexBetween,div(h3(l(fontSize("48px").fontWeight("700").color(o.text).marginBottom("8px")),()=>G),p(l(fontSize("14px").color(o.textMuted)),"Current count")),div(t.flex,t.gap8,button(de,l(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"−",on("click",()=>{G--,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary,e.target.style.transform="scale(1)"})),button(de,l(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"+",on("click",()=>{G++,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary,e.target.style.transform="scale(1)"})),button(Ri,"Reset",on("click",()=>{G=0,update()}),on("mouseenter",e=>{e.target.style.borderColor=o.primary}),on("mouseleave",e=>{e.target.style.borderColor=o.border})))))}function Ai(){const e=l(width("20px").height("20px").cursor("pointer")),r={accentColor:o.primary},n=l(display("flex").alignItems("center").gap("14px").padding("14px 16px").backgroundColor(o.bgLight).borderRadius("10px").marginBottom("10px").transition("all 0.2s")),s=l(marginLeft("auto").padding("6px 10px").backgroundColor("transparent").color(o.textDim).border("none").borderRadius("6px").cursor("pointer").fontSize("18px").transition("all 0.2s"));return div(He,div(t.flex,t.gap8,t.mb24,input(Ii,{type:"text",placeholder:"Add a new task...",value:()=>N},on("input",i=>{N=i.target.value,update()}),on("keydown",i=>{i.key==="Enter"&&N.trim()&&(I.push({id:Ce++,text:N,done:!1}),N="",update())}),on("focus",i=>{i.target.style.borderColor=o.primary}),on("blur",i=>{i.target.style.borderColor=o.border})),button(de,"Add Task",on("click",()=>{N.trim()&&(I.push({id:Ce++,text:N,done:!1}),N="",update())}),on("mouseenter",i=>{i.target.style.backgroundColor=o.primaryHover}),on("mouseleave",i=>{i.target.style.backgroundColor=o.primary}))),div(()=>`${I.filter(i=>!i.done).length} remaining · ${I.filter(i=>i.done).length} completed`,l(fontSize("13px").color(o.textDim).marginBottom("20px").fontWeight("500"))),when(()=>I.length>0,list(()=>I,i=>div(n,input(e,{style:r},{type:"checkbox",checked:()=>i.done},on("change",()=>{i.done=!i.done,update()})),span(()=>i.done?l(color(o.textDim).textDecoration("line-through").fontSize("15px")):l(color(o.text).fontSize("15px")),()=>i.text),button(s,"×",on("click",()=>{I=I.filter(d=>d.id!==i.id),update()}),on("mouseenter",d=>{d.target.style.backgroundColor="rgba(239, 68, 68, 0.1)",d.target.style.color="#ef4444"}),on("mouseleave",d=>{d.target.style.backgroundColor="transparent",d.target.style.color=o.textDim}))))).else(p(l(color(o.textDim).textAlign("center").padding("32px").fontSize("15px")),"No tasks yet. Add one above!")))}const zi={counter:Ni,todo:Ai};function Ei(e){const r=zi[e.id];return section({id:e.id},h2(t.h2,e.title),p(t.p,e.description),r?r():null,c(e.code,"typescript"))}function Mi(){return div(t.pageContent,h1(t.pageTitle,"Examples"),p(t.pageSubtitle,"All examples from the original gallery are mirrored here. Counter and Todo include live demos; the rest keep the original source code intact."),...$e.map(Ei),section(h2(t.h2,"More Examples"),p(t.p,"Find even more demos in the ",a({href:"https://github.com/dan2dev/nuclo/tree/main/examples",target:"_blank",rel:"noopener noreferrer"},"GitHub examples directory"),".")))}Yn();Jn();const Wi=div(gi(),main({style:{minHeight:"calc(100vh - 160px)",paddingTop:"40px"}},when(()=>T()==="home",wi()).when(()=>T()==="getting-started",ki()).when(()=>T()==="core-api",Ci()).when(()=>T()==="tag-builders",Pi()).when(()=>T()==="styling",Ti()).when(()=>T()==="pitfalls",Bi()).when(()=>T()==="examples",Mi())),hi());render(Wi,document.getElementById("app"));
