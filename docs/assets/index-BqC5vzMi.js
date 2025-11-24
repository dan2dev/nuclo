(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))s(l);new MutationObserver(l=>{for(const c of l)if(c.type==="childList")for(const m of c.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&s(m)}).observe(document,{childList:!0,subtree:!0});function i(l){const c={};return l.integrity&&(c.integrity=l.integrity),l.referrerPolicy&&(c.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?c.credentials="include":l.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function s(l){if(l.ep)return;l.ep=!0;const c=i(l);fetch(l.href,c)}})();function me(e){return e===null||typeof e!="object"&&typeof e!="function"}function re(e){return e instanceof Node}function K(e){return typeof e=="object"&&e!==null}function Fe(e){return K(e)&&"tagName"in e}function F(e){return typeof e=="function"}function Ze(e){return F(e)&&e.length===0}function ce(e,r){try{return e()}catch{return r}}const U=typeof window<"u"&&typeof document<"u";function et(e){if(!e?.parentNode)return!1;try{return e.parentNode.removeChild(e),!0}catch{return!1}}function Ne(e){if(!U)return null;try{return document.createComment(e)}catch{return null}}function Me(e){return Ne(e)}function X(e,r="hidden"){try{return document.createComment(`conditional-${e}-${r}`)}catch{return null}}function ft(e){if(!U)throw Error("Cannot create comment in non-browser environment");const r=Ne(`${e}-${Math.random().toString(36).slice(2)}`);if(!r)throw Error("Failed to create comment");return r}function tt(e){const r=Ne(e+"-end");if(!r)throw Error("Failed to create end comment");return{start:ft(e+"-start"),end:r}}function He(e){return!!e&&(typeof e.isConnected=="boolean"?e.isConnected:!(!U||typeof document>"u")&&document.contains(e))}function je(e,r){if(!e?.parentNode)return!1;try{return e.parentNode.replaceChild(r,e),!0}catch{return!1}}const Ce=new Map,ae=new Map;function ot(e,r){r.attributeResolvers.forEach(({resolver:i,applyValue:s},l)=>{try{s(ce(i))}catch{}})}function ge(e,r,i,s){if(!(e instanceof Element&&r&&typeof i=="function"))return;const l=(function(c){let m=ae.get(c);return m||(m={attributeResolvers:new Map},ae.set(c,m)),m})(e);l.attributeResolvers.set(r,{resolver:i,applyValue:s});try{s(ce(i))}catch{}if(!l.updateListener){const c=()=>ot(0,l);e.addEventListener("update",c),l.updateListener=c}}function yt(e,r,i){try{return i==null||i===""?(e.style[r]="",!0):(e.style[r]=i+"",!0)}catch{return!1}}function Oe(e,r){if(e?.style&&r)for(const[i,s]of Object.entries(r))yt(e,i,s)||void 0}const Ue="__nuclo_reactive_className__",G="__nuclo_static_className__";function bt(e,r,i,s=!1){if(i==null)return;if(r==="style")return c=i,void((l=e)&&(F(c)?ge(l,"style",()=>{try{return c()}catch{return null}},f=>{Oe(l,f)}):Oe(l,c)));var l,c;const m=(f,S=!1)=>{if(f!=null)if(r==="className"&&e instanceof HTMLElement&&S)(function(b,v){if(!v)return;const u=b.className;if(u&&u!==v){const x=new Set(u.split(" ").filter(h=>h));v.split(" ").filter(h=>h).forEach(h=>x.add(h)),b.className=Array.from(x).join(" ")}else b.className=v})(e,f+"");else if(e instanceof Element&&e.namespaceURI==="http://www.w3.org/2000/svg")e.setAttribute(r+"",f+"");else if(r in e)try{e[r]=f}catch{e instanceof Element&&e.setAttribute(r+"",f+"")}else e instanceof Element&&e.setAttribute(r+"",f+"")};if(F(i)&&i.length===0){const f=i;r==="className"&&e instanceof HTMLElement?((function(S){S[G]||(S[G]=new Set(S.className.split(" ").filter(b=>b))),S[Ue]=!0})(e),ge(e,r+"",f,S=>{(function(b,v){const u=(function(x){return x[G]})(b);if(u&&u.size>0&&v){const x=new Set(u);v.split(" ").filter(h=>h).forEach(h=>x.add(h)),b.className=Array.from(x).join(" ")}else b.className=v||(u&&u.size>0?Array.from(u).join(" "):"")})(e,(S||"")+"")})):ge(e,r+"",f,S=>{m(S,!1)})}else{if(r==="className"&&e instanceof HTMLElement&&(function(f){return!!f[Ue]})(e)){const f=(i||"")+"";if(f){(function(b,v){v&&(b[G]||(b[G]=new Set),v.split(" ").filter(u=>u).forEach(u=>{b[G].add(u)}))})(e,f);const S=new Set(e.className.split(" ").filter(b=>b));f.split(" ").filter(b=>b).forEach(b=>S.add(b)),e.className=Array.from(S).join(" ")}return}m(i,s)}}function he(e,r,i=!0){if(r)for(const s of Object.keys(r))bt(e,s,r[s],i&&s==="className")}const j=new WeakMap;function xt(e,r,i){if(!F(e)||e.length!==0||!(function(l){const{value:c,error:m}=(function(f){const S=j.get(f);if(S)return S;try{const b={value:f(),error:!1};return j.set(f,b),b}catch{const b={value:void 0,error:!0};return j.set(f,b),b}})(l);return!m&&typeof c=="boolean"})(e))return!1;const s=r.filter((l,c)=>c!==i);return s.length!==0&&s.some(l=>!!(K(l)||re(l)||F(l)&&l.length>0))}function ne(e,r,i){if(r==null)return null;if(F(r)){if(Ze(r))try{let c=j.get(r);if(c||(c={value:r(),error:!1},j.set(r,c)),c.error)return fe(i,()=>"");const m=c.value;if(K(m)&&!re(m)&&"className"in m&&typeof m.className=="string"&&Object.keys(m).length===1){const f=r;return he(e,{className:()=>f().className}),null}return me(m)&&m!=null?fe(i,r,m):null}catch{return j.set(r,{value:void 0,error:!0}),fe(i,()=>"")}const l=r(e,i);return l==null?null:me(l)?Ge(i,l):re(l)?l:(K(l)&&he(e,l),null)}const s=r;return s==null?null:me(s)?Ge(i,s):re(s)?s:(K(s)&&he(e,s),null)}function fe(e,r,i){const s=document.createDocumentFragment(),l=Me(` text-${e} `);l&&s.appendChild(l);const c=(function(m,f){if(typeof m!="function")return document.createTextNode("");const S=arguments.length>1?f:ce(m,""),b=S===void 0?"":S+"",v=document.createTextNode(b);return Ce.set(v,{resolver:m,lastValue:b}),v})(r,i);return s.appendChild(c),s}function Ge(e,r){const i=document.createDocumentFragment(),s=Me(` text-${e} `);s&&i.appendChild(s);const l=document.createTextNode(r+"");return i.appendChild(l),i}const Pe=new Set;function q(e,r){e._conditionalInfo=r,Pe.add(e)}function pe(e,r,i=0){if(!r||r.length===0)return{element:e,nextIndex:i,appended:0};let s=i,l=0;const c=e;for(let m=0;r.length>m;m+=1){const f=r[m];if(f==null)continue;const S=ne(e,f,s);S&&(S.parentNode!==c&&c.appendChild(S),s+=1,l+=1)}return{element:e,nextIndex:s,appended:l}}function Te(e,r){const i=document.createElement(e);return pe(i,r,0),i}function Be(e,r){const i=document.createElementNS("http://www.w3.org/2000/svg",e);return pe(i,r,0),i}function vt(e){return(...r)=>(function(i,...s){return(l,c)=>{const{condition:m,otherModifiers:f}=(function(b){const v=(function(u){for(let x=0;u.length>x;x+=1)if(xt(u[x],u,x))return x;return-1})(b);return v===-1?{condition:null,otherModifiers:b}:{condition:b[v],otherModifiers:b.filter((u,x)=>x!==v)}})(s);if(m)return(function(b,v,u){const x=v();if(!U)return x?Te(b,u):X(b,"ssr");const h={condition:v,tagName:b,modifiers:u,isSvg:!1};if(x){const k=Te(b,u);return q(k,h),k}const g=X(b);if(!g)throw Error("Failed to create conditional comment for "+b);return q(g,h),g})(i,m,f);const S=document.createElement(i);return pe(S,f,c),S}})(e,...r)}function St(e){return(...r)=>(function(i,...s){return(l,c)=>{const m=s.findIndex(S=>typeof S=="function"&&S.length===0);if(m!==-1){const S=s[m],b=s.filter((v,u)=>u!==m);return(function(v,u,x){const h=u();if(!U)return h?Be(v,x):X(v,"ssr");const g={condition:u,tagName:v,modifiers:x,isSvg:!0};if(h){const T=Be(v,x);return q(T,g),T}const k=X(v);if(!k)throw Error("Failed to create conditional comment for "+v);return q(k,g),k})(i,S,b)}const f=document.createElementNS("http://www.w3.org/2000/svg",i);return pe(f,s,c),f}})(e,...r)}const kt=["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","menu","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","script","search","section","select","slot","small","source","span","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u","ul","var","video","wbr"],wt=["a","animate","animateMotion","animateTransform","circle","clipPath","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","foreignObject","g","image","line","linearGradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialGradient","rect","script","set","stop","style","svg","switch","symbol","text","textPath","title","tspan","use","view"];function Ct(e=globalThis){const r="__nuclo_tags_registered";e[r]||(wt.forEach(i=>(function(s,l){const c=l+"Svg";c in s||(s[c]=St(l))})(e,i)),kt.forEach(i=>(function(s,l){l in s&&typeof s[l]!="function"||(s[l]=vt(l))})(e,i)),e[r]=!0)}const Re=new Set;function Pt(e,r,i){return(function(s,l,c){if(F(s)){const m=s(l,c);return m&&Fe(m)?m:null}return s&&Fe(s)?s:null})(e.renderItem(r,i),e.host,i)}function Tt(e){et(e.element)}function rt(e){const{host:r,startMarker:i,endMarker:s}=e,l=i.parentNode??r,c=e.itemsProvider();if((function(u,x){if(u===x)return!0;if(u.length!==x.length)return!1;for(let h=0;u.length>h;h++)if((h in u?u[h]:void 0)!==(h in x?x[h]:void 0))return!1;return!0})(e.lastSyncedItems,c))return;const m=new Map,f=new Map;e.records.forEach(u=>{const x=f.get(u.item);x?x.push(u):f.set(u.item,[u])}),c.forEach((u,x)=>{if(e.lastSyncedItems.length>x&&e.lastSyncedItems[x]===u){const h=e.records[x];if(h&&h.item===u){m.set(x,h);const g=f.get(u);if(g){const k=g.indexOf(h);0>k||(g.splice(k,1),g.length===0&&f.delete(u))}}}});const S=[],b=new Set(e.records);let v=s;for(let u=c.length-1;u>=0;u--){const x=c[u];let h=m.get(u);if(!h){const k=f.get(x);k&&k.length>0&&(h=k.shift(),k.length===0&&f.delete(x))}if(h)b.delete(h);else{const k=Pt(e,x,u);if(!k)continue;h={item:x,element:k}}S.unshift(h);const g=h.element;g.nextSibling!==v&&l.insertBefore(g,v),v=g}b.forEach(Tt),e.records=S,e.lastSyncedItems=[...c]}function Bt(e,r){return(i,s)=>(function(c,m,f){const{start:S,end:b}=tt("list"),v={itemsProvider:c,renderItem:m,startMarker:S,endMarker:b,records:[],host:f,lastSyncedItems:[]},u=f;return u.appendChild(S),u.appendChild(b),Re.add(v),rt(v),v})(e,r,i).startMarker}function nt(e,r){try{return e()}catch(i){if(r)return r(i),!1;throw i}}function Rt(e,r){return typeof e=="function"?nt(e,r):!!e}function zt(e,r,i,s){return F(e)?Ze(e)?(j.delete(e),ne(r,e,i)):(function(l,c,m){const f=l,S=f.appendChild.bind(f),b=f.insertBefore.bind(f);f.appendChild=function(v){return b(v,c)};try{return m()}finally{f.appendChild=S}})(r,s,()=>{const l=ne(r,e,i);return l&&!l.parentNode?l:null}):ne(r,e,i)}const ze=new Set;function Qe(e){const{groups:r,elseContent:i,host:s,index:l,endMarker:c}=e,m=(function(S,b){for(let v=0;S.length>v;v++)if(Rt(S[v].condition))return v;return b.length>0?-1:null})(r,i);if(m===e.activeIndex||((function(S,b){let v=S.nextSibling;for(;v&&v!==b;){const u=v.nextSibling;et(v),v=u}})(e.startMarker,e.endMarker),e.activeIndex=m,m===null))return;const f=(function(S,b,v,u){const x=[];for(const h of S){const g=zt(h,b,v,u);g&&x.push(g)}return x})(0>m?i:r[m].content,s,l,c);(function(S,b){const v=b.parentNode;v&&S.forEach(u=>(function(x,h,g){if(!x||!h)return!1;try{return x.insertBefore(h,g),!0}catch{return!1}})(v,u,b))})(f,c)}class It{groups=[];elseContent=[];constructor(r,...i){this.groups.push({condition:r,content:i})}when(r,...i){return this.groups.push({condition:r,content:i}),this}else(...r){return this.elseContent=r,this}render(r,i){if(!U)return Me("when-ssr")||null;const{start:s,end:l}=tt("when"),c={startMarker:s,endMarker:l,host:r,index:i,groups:[...this.groups],elseContent:[...this.elseContent],activeIndex:null,update:()=>Qe(c)};(function(f){ze.add(f)})(c);const m=r;return m.appendChild(s),m.appendChild(l),Qe(c),s}}function Ie(e){return Object.assign((r,i)=>e.render(r,i),{when:(r,...i)=>(e.when(r,...i),Ie(e)),else:(...r)=>(e.else(...r),Ie(e))})}function At(e,...r){return Ie(new It(e,...r))}const Et=[function(){Re.forEach(e=>{e.startMarker.isConnected&&e.endMarker.isConnected?rt(e):Re.delete(e)})},function(){ze.forEach(e=>{try{e.update()}catch{ze.delete(e)}})},function(){if(U)try{Pe.forEach(e=>{e.isConnected?(function(r){const i=(function(c){return c._conditionalInfo??null})(r);if(!i)return;const s=nt(i.condition,c=>{}),l=r.nodeType===Node.ELEMENT_NODE;if(s&&!l){const c=(function(m){try{return m.isSvg?Be(m.tagName,m.modifiers):Te(m.tagName,m.modifiers)}catch{return m.isSvg?document.createElementNS("http://www.w3.org/2000/svg",m.tagName):document.createElement(m.tagName)}})(i);q(c,i),je(r,c)}else if(!s&&l){const c=X(i.tagName);c&&(q(c,i),je(r,c))}})(e):(function(r){Pe.delete(r)})(e)})}catch{}},function(){ae.forEach((e,r)=>{if(!He(r))return e.updateListener&&r.removeEventListener("update",e.updateListener),void ae.delete(r);ot(0,e)})},function(){Ce.forEach((e,r)=>{if(He(r))try{const i=ce(e.resolver),s=i===void 0?"":i+"";s!==e.lastValue&&(r.textContent=s,e.lastValue=s)}catch{}else Ce.delete(r)})},function(){if(typeof document>"u")return;const e=document.body?[document.body,document]:[document];for(const r of e)try{r.dispatchEvent(new Event("update",{bubbles:!0}))}catch{}}];function Nt(){for(const e of Et)e()}function Mt(e,r,i){return s=>{if(!s||typeof s.addEventListener!="function")return;const l=s;l.addEventListener(e,c=>{try{r.call(l,c)}catch{}},i)}}function $t(e,r,i=0){const s=e(r||document.body,i);return(r||document.body).appendChild(s),s}const it=[{name:"display",cssProperty:"display"},{name:"grid",cssProperty:"display",defaultValue:"grid",isShorthand:!0},{name:"bg",cssProperty:"background-color"},{name:"color",cssProperty:"color"},{name:"accentColor",cssProperty:"accent-color"},{name:"fontSize",cssProperty:"font-size"},{name:"fontWeight",cssProperty:"font-weight"},{name:"fontFamily",cssProperty:"font-family"},{name:"lineHeight",cssProperty:"line-height"},{name:"letterSpacing",cssProperty:"letter-spacing"},{name:"textAlign",cssProperty:"text-align"},{name:"textDecoration",cssProperty:"text-decoration"},{name:"fontStyle",cssProperty:"font-style"},{name:"fontVariant",cssProperty:"font-variant"},{name:"fontStretch",cssProperty:"font-stretch"},{name:"textTransform",cssProperty:"text-transform"},{name:"textIndent",cssProperty:"text-indent"},{name:"textOverflow",cssProperty:"text-overflow"},{name:"textShadow",cssProperty:"text-shadow"},{name:"whiteSpace",cssProperty:"white-space"},{name:"wordSpacing",cssProperty:"word-spacing"},{name:"wordWrap",cssProperty:"word-wrap"},{name:"overflowWrap",cssProperty:"overflow-wrap"},{name:"textAlignLast",cssProperty:"text-align-last"},{name:"textJustify",cssProperty:"text-justify"},{name:"textDecorationLine",cssProperty:"text-decoration-line"},{name:"textDecorationColor",cssProperty:"text-decoration-color"},{name:"textDecorationStyle",cssProperty:"text-decoration-style"},{name:"textDecorationThickness",cssProperty:"text-decoration-thickness"},{name:"textUnderlineOffset",cssProperty:"text-underline-offset"},{name:"verticalAlign",cssProperty:"vertical-align"},{name:"position",cssProperty:"position"},{name:"padding",cssProperty:"padding"},{name:"paddingTop",cssProperty:"padding-top"},{name:"paddingRight",cssProperty:"padding-right"},{name:"paddingBottom",cssProperty:"padding-bottom"},{name:"paddingLeft",cssProperty:"padding-left"},{name:"margin",cssProperty:"margin"},{name:"marginTop",cssProperty:"margin-top"},{name:"marginRight",cssProperty:"margin-right"},{name:"marginBottom",cssProperty:"margin-bottom"},{name:"marginLeft",cssProperty:"margin-left"},{name:"width",cssProperty:"width"},{name:"height",cssProperty:"height"},{name:"minWidth",cssProperty:"min-width"},{name:"maxWidth",cssProperty:"max-width"},{name:"minHeight",cssProperty:"min-height"},{name:"maxHeight",cssProperty:"max-height"},{name:"boxSizing",cssProperty:"box-sizing"},{name:"top",cssProperty:"top"},{name:"right",cssProperty:"right"},{name:"bottom",cssProperty:"bottom"},{name:"left",cssProperty:"left"},{name:"zIndex",cssProperty:"z-index"},{name:"flexDirection",cssProperty:"flex-direction"},{name:"alignItems",cssProperty:"align-items"},{name:"justifyContent",cssProperty:"justify-content"},{name:"gap",cssProperty:"gap"},{name:"flexWrap",cssProperty:"flex-wrap"},{name:"flexGrow",cssProperty:"flex-grow"},{name:"flexShrink",cssProperty:"flex-shrink"},{name:"flexBasis",cssProperty:"flex-basis"},{name:"alignSelf",cssProperty:"align-self"},{name:"alignContent",cssProperty:"align-content"},{name:"justifySelf",cssProperty:"justify-self"},{name:"justifyItems",cssProperty:"justify-items"},{name:"gridTemplateColumns",cssProperty:"grid-template-columns"},{name:"gridTemplateRows",cssProperty:"grid-template-rows"},{name:"gridTemplateAreas",cssProperty:"grid-template-areas"},{name:"gridColumn",cssProperty:"grid-column"},{name:"gridRow",cssProperty:"grid-row"},{name:"gridColumnStart",cssProperty:"grid-column-start"},{name:"gridColumnEnd",cssProperty:"grid-column-end"},{name:"gridRowStart",cssProperty:"grid-row-start"},{name:"gridRowEnd",cssProperty:"grid-row-end"},{name:"gridArea",cssProperty:"grid-area"},{name:"gridAutoColumns",cssProperty:"grid-auto-columns"},{name:"gridAutoRows",cssProperty:"grid-auto-rows"},{name:"gridAutoFlow",cssProperty:"grid-auto-flow"},{name:"border",cssProperty:"border"},{name:"borderTop",cssProperty:"border-top"},{name:"borderRight",cssProperty:"border-right"},{name:"borderBottom",cssProperty:"border-bottom"},{name:"borderLeft",cssProperty:"border-left"},{name:"borderWidth",cssProperty:"border-width"},{name:"borderStyle",cssProperty:"border-style"},{name:"borderColor",cssProperty:"border-color"},{name:"borderTopWidth",cssProperty:"border-top-width"},{name:"borderRightWidth",cssProperty:"border-right-width"},{name:"borderBottomWidth",cssProperty:"border-bottom-width"},{name:"borderLeftWidth",cssProperty:"border-left-width"},{name:"borderTopStyle",cssProperty:"border-top-style"},{name:"borderRightStyle",cssProperty:"border-right-style"},{name:"borderBottomStyle",cssProperty:"border-bottom-style"},{name:"borderLeftStyle",cssProperty:"border-left-style"},{name:"borderTopColor",cssProperty:"border-top-color"},{name:"borderRightColor",cssProperty:"border-right-color"},{name:"borderBottomColor",cssProperty:"border-bottom-color"},{name:"borderLeftColor",cssProperty:"border-left-color"},{name:"borderRadius",cssProperty:"border-radius"},{name:"borderTopLeftRadius",cssProperty:"border-top-left-radius"},{name:"borderTopRightRadius",cssProperty:"border-top-right-radius"},{name:"borderBottomLeftRadius",cssProperty:"border-bottom-left-radius"},{name:"borderBottomRightRadius",cssProperty:"border-bottom-right-radius"},{name:"outline",cssProperty:"outline"},{name:"outlineWidth",cssProperty:"outline-width"},{name:"outlineStyle",cssProperty:"outline-style"},{name:"outlineColor",cssProperty:"outline-color"},{name:"outlineOffset",cssProperty:"outline-offset"},{name:"backgroundColor",cssProperty:"background-color"},{name:"backgroundImage",cssProperty:"background-image"},{name:"backgroundRepeat",cssProperty:"background-repeat"},{name:"backgroundPosition",cssProperty:"background-position"},{name:"backgroundSize",cssProperty:"background-size"},{name:"backgroundAttachment",cssProperty:"background-attachment"},{name:"backgroundClip",cssProperty:"background-clip"},{name:"backgroundOrigin",cssProperty:"background-origin"},{name:"boxShadow",cssProperty:"box-shadow"},{name:"opacity",cssProperty:"opacity"},{name:"transition",cssProperty:"transition"},{name:"transitionProperty",cssProperty:"transition-property"},{name:"transitionDuration",cssProperty:"transition-duration"},{name:"transitionTimingFunction",cssProperty:"transition-timing-function"},{name:"transitionDelay",cssProperty:"transition-delay"},{name:"transform",cssProperty:"transform"},{name:"transformOrigin",cssProperty:"transform-origin"},{name:"transformStyle",cssProperty:"transform-style"},{name:"perspective",cssProperty:"perspective"},{name:"perspectiveOrigin",cssProperty:"perspective-origin"},{name:"backfaceVisibility",cssProperty:"backface-visibility"},{name:"animation",cssProperty:"animation"},{name:"animationName",cssProperty:"animation-name"},{name:"animationDuration",cssProperty:"animation-duration"},{name:"animationTimingFunction",cssProperty:"animation-timing-function"},{name:"animationDelay",cssProperty:"animation-delay"},{name:"animationIterationCount",cssProperty:"animation-iteration-count"},{name:"animationDirection",cssProperty:"animation-direction"},{name:"animationFillMode",cssProperty:"animation-fill-mode"},{name:"animationPlayState",cssProperty:"animation-play-state"},{name:"filter",cssProperty:"filter"},{name:"backdropFilter",cssProperty:"backdrop-filter"},{name:"overflow",cssProperty:"overflow"},{name:"overflowX",cssProperty:"overflow-x"},{name:"overflowY",cssProperty:"overflow-y"},{name:"visibility",cssProperty:"visibility"},{name:"objectFit",cssProperty:"object-fit"},{name:"objectPosition",cssProperty:"object-position"},{name:"listStyle",cssProperty:"list-style"},{name:"listStyleType",cssProperty:"list-style-type"},{name:"listStylePosition",cssProperty:"list-style-position"},{name:"listStyleImage",cssProperty:"list-style-image"},{name:"borderCollapse",cssProperty:"border-collapse"},{name:"borderSpacing",cssProperty:"border-spacing"},{name:"captionSide",cssProperty:"caption-side"},{name:"emptyCells",cssProperty:"empty-cells"},{name:"tableLayout",cssProperty:"table-layout"},{name:"content",cssProperty:"content"},{name:"quotes",cssProperty:"quotes"},{name:"counterReset",cssProperty:"counter-reset"},{name:"counterIncrement",cssProperty:"counter-increment"},{name:"appearance",cssProperty:"appearance"},{name:"userSelect",cssProperty:"user-select"},{name:"pointerEvents",cssProperty:"pointer-events"},{name:"resize",cssProperty:"resize"},{name:"scrollBehavior",cssProperty:"scroll-behavior"},{name:"clip",cssProperty:"clip"},{name:"clipPath",cssProperty:"clip-path"},{name:"isolation",cssProperty:"isolation"},{name:"mixBlendMode",cssProperty:"mix-blend-mode"},{name:"willChange",cssProperty:"will-change"},{name:"contain",cssProperty:"contain"},{name:"pageBreakBefore",cssProperty:"page-break-before"},{name:"pageBreakAfter",cssProperty:"page-break-after"},{name:"pageBreakInside",cssProperty:"page-break-inside"},{name:"breakBefore",cssProperty:"break-before"},{name:"breakAfter",cssProperty:"break-after"},{name:"breakInside",cssProperty:"break-inside"},{name:"orphans",cssProperty:"orphans"},{name:"widows",cssProperty:"widows"},{name:"columnCount",cssProperty:"column-count"},{name:"columnFill",cssProperty:"column-fill"},{name:"columnGap",cssProperty:"column-gap"},{name:"columnRule",cssProperty:"column-rule"},{name:"columnRuleColor",cssProperty:"column-rule-color"},{name:"columnRuleStyle",cssProperty:"column-rule-style"},{name:"columnRuleWidth",cssProperty:"column-rule-width"},{name:"columnSpan",cssProperty:"column-span"},{name:"columnWidth",cssProperty:"column-width"},{name:"columns",cssProperty:"columns"},{name:"cursor",cssProperty:"cursor"},{name:"aspectRatio",cssProperty:"aspect-ratio"},{name:"clear",cssProperty:"clear"},{name:"float",cssProperty:"float"},{name:"order",cssProperty:"order"},{name:"placeContent",cssProperty:"place-content"},{name:"placeItems",cssProperty:"place-items"},{name:"placeSelf",cssProperty:"place-self"},{name:"hyphens",cssProperty:"hyphens"},{name:"lineBreak",cssProperty:"line-break"},{name:"wordBreak",cssProperty:"word-break"},{name:"textOrientation",cssProperty:"text-orientation"},{name:"writingMode",cssProperty:"writing-mode"},{name:"direction",cssProperty:"direction"},{name:"unicodeBidi",cssProperty:"unicode-bidi"},{name:"backgroundBlendMode",cssProperty:"background-blend-mode"},{name:"backgroundPositionX",cssProperty:"background-position-x"},{name:"backgroundPositionY",cssProperty:"background-position-y"},{name:"borderImage",cssProperty:"border-image"},{name:"borderImageSource",cssProperty:"border-image-source"},{name:"borderImageSlice",cssProperty:"border-image-slice"},{name:"borderImageWidth",cssProperty:"border-image-width"},{name:"borderImageOutset",cssProperty:"border-image-outset"},{name:"borderImageRepeat",cssProperty:"border-image-repeat"},{name:"inset",cssProperty:"inset"},{name:"insetBlock",cssProperty:"inset-block"},{name:"insetBlockStart",cssProperty:"inset-block-start"},{name:"insetBlockEnd",cssProperty:"inset-block-end"},{name:"insetInline",cssProperty:"inset-inline"},{name:"insetInlineStart",cssProperty:"inset-inline-start"},{name:"insetInlineEnd",cssProperty:"inset-inline-end"},{name:"marginBlock",cssProperty:"margin-block"},{name:"marginBlockStart",cssProperty:"margin-block-start"},{name:"marginBlockEnd",cssProperty:"margin-block-end"},{name:"marginInline",cssProperty:"margin-inline"},{name:"marginInlineStart",cssProperty:"margin-inline-start"},{name:"marginInlineEnd",cssProperty:"margin-inline-end"},{name:"paddingBlock",cssProperty:"padding-block"},{name:"paddingBlockStart",cssProperty:"padding-block-start"},{name:"paddingBlockEnd",cssProperty:"padding-block-end"},{name:"paddingInline",cssProperty:"padding-inline"},{name:"paddingInlineStart",cssProperty:"padding-inline-start"},{name:"paddingInlineEnd",cssProperty:"padding-inline-end"},{name:"inlineSize",cssProperty:"inline-size"},{name:"blockSize",cssProperty:"block-size"},{name:"minInlineSize",cssProperty:"min-inline-size"},{name:"minBlockSize",cssProperty:"min-block-size"},{name:"maxInlineSize",cssProperty:"max-inline-size"},{name:"maxBlockSize",cssProperty:"max-block-size"},{name:"borderBlock",cssProperty:"border-block"},{name:"borderBlockStart",cssProperty:"border-block-start"},{name:"borderBlockEnd",cssProperty:"border-block-end"},{name:"borderInline",cssProperty:"border-inline"},{name:"borderInlineStart",cssProperty:"border-inline-start"},{name:"borderInlineEnd",cssProperty:"border-inline-end"},{name:"borderBlockWidth",cssProperty:"border-block-width"},{name:"borderBlockStartWidth",cssProperty:"border-block-start-width"},{name:"borderBlockEndWidth",cssProperty:"border-block-end-width"},{name:"borderInlineWidth",cssProperty:"border-inline-width"},{name:"borderInlineStartWidth",cssProperty:"border-inline-start-width"},{name:"borderInlineEndWidth",cssProperty:"border-inline-end-width"},{name:"borderBlockStyle",cssProperty:"border-block-style"},{name:"borderBlockStartStyle",cssProperty:"border-block-start-style"},{name:"borderBlockEndStyle",cssProperty:"border-block-end-style"},{name:"borderInlineStyle",cssProperty:"border-inline-style"},{name:"borderInlineStartStyle",cssProperty:"border-inline-start-style"},{name:"borderInlineEndStyle",cssProperty:"border-inline-end-style"},{name:"borderBlockColor",cssProperty:"border-block-color"},{name:"borderBlockStartColor",cssProperty:"border-block-start-color"},{name:"borderBlockEndColor",cssProperty:"border-block-end-color"},{name:"borderInlineColor",cssProperty:"border-inline-color"},{name:"borderInlineStartColor",cssProperty:"border-inline-start-color"},{name:"borderInlineEndColor",cssProperty:"border-inline-end-color"},{name:"borderStartStartRadius",cssProperty:"border-start-start-radius"},{name:"borderStartEndRadius",cssProperty:"border-start-end-radius"},{name:"borderEndStartRadius",cssProperty:"border-end-start-radius"},{name:"borderEndEndRadius",cssProperty:"border-end-end-radius"},{name:"scrollMargin",cssProperty:"scroll-margin"},{name:"scrollMarginTop",cssProperty:"scroll-margin-top"},{name:"scrollMarginRight",cssProperty:"scroll-margin-right"},{name:"scrollMarginBottom",cssProperty:"scroll-margin-bottom"},{name:"scrollMarginLeft",cssProperty:"scroll-margin-left"},{name:"scrollPadding",cssProperty:"scroll-padding"},{name:"scrollPaddingTop",cssProperty:"scroll-padding-top"},{name:"scrollPaddingRight",cssProperty:"scroll-padding-right"},{name:"scrollPaddingBottom",cssProperty:"scroll-padding-bottom"},{name:"scrollPaddingLeft",cssProperty:"scroll-padding-left"},{name:"overscrollBehavior",cssProperty:"overscroll-behavior"},{name:"overscrollBehaviorX",cssProperty:"overscroll-behavior-x"},{name:"overscrollBehaviorY",cssProperty:"overscroll-behavior-y"},{name:"caretColor",cssProperty:"caret-color"},{name:"caretShape",cssProperty:"caret-shape"},{name:"caretAnimation",cssProperty:"caret-animation"},{name:"imageRendering",cssProperty:"image-rendering"},{name:"colorScheme",cssProperty:"color-scheme"},{name:"contentVisibility",cssProperty:"content-visibility"},{name:"touchAction",cssProperty:"touch-action"},{name:"containerType",cssProperty:"container-type"},{name:"containerName",cssProperty:"container-name"},{name:"container",cssProperty:"container"},{name:"fontFeatureSettings",cssProperty:"font-feature-settings"},{name:"fontKerning",cssProperty:"font-kerning"},{name:"fontSynthesis",cssProperty:"font-synthesis"},{name:"fontOpticalSizing",cssProperty:"font-optical-sizing"},{name:"fontDisplay",cssProperty:"font-display"},{name:"fontVariantCaps",cssProperty:"font-variant-caps"},{name:"fontVariantNumeric",cssProperty:"font-variant-numeric"},{name:"fontVariantLigatures",cssProperty:"font-variant-ligatures"},{name:"fontVariantEastAsian",cssProperty:"font-variant-east-asian"},{name:"fontVariantAlternates",cssProperty:"font-variant-alternates"},{name:"fontVariantPosition",cssProperty:"font-variant-position"},{name:"textRendering",cssProperty:"text-rendering"},{name:"textCombineUpright",cssProperty:"text-combine-upright"},{name:"textSizeAdjust",cssProperty:"text-size-adjust"},{name:"mask",cssProperty:"mask"},{name:"maskImage",cssProperty:"mask-image"},{name:"maskMode",cssProperty:"mask-mode"},{name:"maskRepeat",cssProperty:"mask-repeat"},{name:"maskPosition",cssProperty:"mask-position"},{name:"maskSize",cssProperty:"mask-size"},{name:"maskOrigin",cssProperty:"mask-origin"},{name:"maskClip",cssProperty:"mask-clip"},{name:"maskComposite",cssProperty:"mask-composite"},{name:"clipRule",cssProperty:"clip-rule"},{name:"gridColumnGap",cssProperty:"grid-column-gap"},{name:"gridRowGap",cssProperty:"grid-row-gap"},{name:"gridGap",cssProperty:"grid-gap"}],Wt=["bold","center","flex"],Ve=new Map;function at(e){let r=0;for(let i=0;e.length>i;i++)r=(r<<5)-r+e.charCodeAt(i),r&=r;return Math.abs(r).toString(16).padStart(8,"0").substring(0,8)}function Ae(e){return Object.entries(e).sort(([r],[i])=>r.localeCompare(i)).map(([r,i])=>`${r}:${i}`).join("|")}function V(e,r,i,s="media",l){let c=document.querySelector("#nuclo-styles");c||(c=document.createElement("style"),c.id="nuclo-styles",document.head.appendChild(c));const m=Object.entries(r).map(([f,S])=>`${f}: ${S}`).join("; ");if(l){const f=`.${e}${l}`,S=c.sheet;if(!S)return;const b=S.cssRules,v=b.length;let u=null,x=v;for(let h=0;v>h;h++){const g=b[h];if(g instanceof CSSStyleRule){if(g.selectorText===f){u=g,x=h;break}g.selectorText.includes(":")||(x=h+1)}}if(u){const h=u.style;h.cssText="";for(const[g,k]of Object.entries(r))h.setProperty(g,k)}else S.insertRule(`${f} { ${m} }`,x);return}if(i){const f=c.sheet;if(!f)return;const S=f.cssRules,b=S.length;let v=null;const u=g=>s==="media"&&g instanceof CSSMediaRule?g.media.mediaText===i:(s==="container"&&g instanceof CSSContainerRule||s==="supports"&&g instanceof CSSSupportsRule)&&g.conditionText===i,x=g=>g instanceof CSSMediaRule||g instanceof CSSContainerRule||g instanceof CSSSupportsRule;for(let g=0;b>g;g++){const k=S[g];if(u(k)){v=k;break}}if(!v){let g=b;for(let k=b-1;k>=0;k--){const T=S[k];if(x(T)){g=k+1;break}if(T instanceof CSSStyleRule){g=k+1;break}}f.insertRule(`${s==="media"?"@media":s==="container"?"@container":s==="supports"?"@supports":"@media"} ${i} {}`,g),v=f.cssRules[g]}let h=null;for(const g of Array.from(v.cssRules))if(g instanceof CSSStyleRule&&g.selectorText==="."+e){h=g;break}if(h){const g=h.style;g.cssText="";for(const[k,T]of Object.entries(r))g.setProperty(k,T)}else v.insertRule(`.${e} { ${m} }`,v.cssRules.length)}else{const f=c.sheet;if(!f)return;let S=null,b=0;const v=h=>h instanceof CSSMediaRule||h instanceof CSSContainerRule||h instanceof CSSSupportsRule,u=f.cssRules,x=u.length;for(let h=0;x>h;h++){const g=u[h];if(g instanceof CSSStyleRule&&g.selectorText==="."+e){S=g,b=h;break}v(g)||(b=h+1)}if(S){const h=S.style;h.cssText="";for(const[g,k]of Object.entries(r))h.setProperty(g,k)}else f.insertRule(`.${e} { ${m} }`,b)}}function Dt(e,r){V(e,r)}class H{styles={};getStyles(){return{...this.styles}}getClassName(r="",i){return(function(s,l="",c){const m=Ae(s),f=l?`${l}:${m}`:m,S=(function(u){return Ve.get(u)})(f);if(S){const u=S;return(function(x,h,g="media"){const k=document.querySelector("#nuclo-styles");if(!k||!k.sheet)return!1;if(h){const T=Array.from(k.sheet.cssRules||[]).find(E=>g==="media"&&E instanceof CSSMediaRule?E.media.mediaText===h:(g==="container"&&E instanceof CSSContainerRule||g==="supports"&&E instanceof CSSSupportsRule)&&E.conditionText===h);return!!T&&Array.from(T.cssRules).some(E=>E instanceof CSSStyleRule&&E.selectorText==="."+x)}return Array.from(k.sheet.cssRules||[]).some(T=>T instanceof CSSStyleRule&&T.selectorText==="."+x)})(u,c)||V(u,s,c),u}const b=at(m),v=l?`n${l}-${b}`:"n"+b;return(function(u,x){Ve.set(u,x)})(f,v),V(v,s,c),v})(this.styles,r,i)}getClassNames(){return[this.getClassName()]}getClassDefinitions(){return Object.entries(this.styles).map(([r,i])=>({className:this.getClassName(),property:r,value:i}))}toString(){return this.getClassName()}add(r,i){return this.styles[r]=i,this}bold(){return this.styles["font-weight"]="bold",this}center(){return this.styles["justify-content"]="center",this.styles["align-items"]="center",this}flex(r){return r!==void 0?this.styles.flex=r:this.styles.display="flex",this}}function Lt(e){return e.isShorthand?()=>new H().add(e.cssProperty,e.defaultValue||""):r=>new H().add(e.cssProperty,r||"")}(function(){const e=H.prototype;for(const r of it)r.name in e||(e[r.name]=r.isShorthand?function(){return this.add(r.cssProperty,r.defaultValue||""),this}:function(i){return this.add(r.cssProperty,i),this})})();const se={};for(const e of it)se[e.name]=Lt(e);for(const e of Wt)e==="bold"||e==="center"?se[e]=()=>new H()[e]():e==="flex"&&(se[e]=r=>new H().flex(r));const{display:Ft,flex:Ht,grid:jt,bg:Ot,color:Ut,accentColor:Gt,fontSize:Qt,fontWeight:Vt,fontFamily:qt,lineHeight:_t,letterSpacing:Yt,textAlign:Jt,textDecoration:Kt,bold:Xt,fontStyle:Zt,fontVariant:eo,fontStretch:to,textTransform:oo,textIndent:ro,textOverflow:no,textShadow:io,whiteSpace:ao,wordSpacing:so,wordWrap:lo,overflowWrap:co,textAlignLast:po,textJustify:uo,textDecorationLine:mo,textDecorationColor:go,textDecorationStyle:ho,textDecorationThickness:fo,textUnderlineOffset:yo,verticalAlign:bo,position:xo,padding:vo,paddingTop:So,paddingRight:ko,paddingBottom:wo,paddingLeft:Co,margin:Po,marginTop:To,marginRight:Bo,marginBottom:Ro,marginLeft:zo,width:Io,height:Ao,minWidth:Eo,maxWidth:No,minHeight:Mo,maxHeight:$o,boxSizing:Wo,top:Do,right:Lo,bottom:Fo,left:Ho,zIndex:jo,flexDirection:Oo,alignItems:Uo,justifyContent:Go,center:Qo,gap:Vo,flexWrap:qo,flexGrow:_o,flexShrink:Yo,flexBasis:Jo,alignSelf:Ko,alignContent:Xo,justifySelf:Zo,justifyItems:er,gridTemplateColumns:tr,gridTemplateRows:or,gridTemplateAreas:rr,gridColumn:nr,gridRow:ir,gridColumnStart:ar,gridColumnEnd:sr,gridRowStart:lr,gridRowEnd:dr,gridArea:cr,gridAutoColumns:pr,gridAutoRows:ur,gridAutoFlow:mr,border:gr,borderTop:hr,borderRight:fr,borderBottom:yr,borderLeft:br,borderWidth:xr,borderStyle:vr,borderColor:Sr,borderTopWidth:kr,borderRightWidth:wr,borderBottomWidth:Cr,borderLeftWidth:Pr,borderTopStyle:Tr,borderRightStyle:Br,borderBottomStyle:Rr,borderLeftStyle:zr,borderTopColor:Ir,borderRightColor:Ar,borderBottomColor:Er,borderLeftColor:Nr,borderRadius:Mr,borderTopLeftRadius:$r,borderTopRightRadius:Wr,borderBottomLeftRadius:Dr,borderBottomRightRadius:Lr,outline:Fr,outlineWidth:Hr,outlineStyle:jr,outlineColor:Or,outlineOffset:Ur,backgroundColor:Gr,backgroundImage:Qr,backgroundRepeat:Vr,backgroundPosition:qr,backgroundSize:_r,backgroundAttachment:Yr,backgroundClip:Jr,backgroundOrigin:Kr,boxShadow:Xr,opacity:Zr,transition:en,transitionProperty:tn,transitionDuration:rn,transitionTimingFunction:nn,transitionDelay:an,transform:sn,transformOrigin:ln,transformStyle:dn,perspective:cn,perspectiveOrigin:pn,backfaceVisibility:un,animation:mn,animationName:gn,animationDuration:hn,animationTimingFunction:fn,animationDelay:yn,animationIterationCount:bn,animationDirection:xn,animationFillMode:vn,animationPlayState:Sn,filter:kn,backdropFilter:wn,overflow:Cn,overflowX:Pn,overflowY:Tn,visibility:Bn,objectFit:Rn,objectPosition:zn,listStyle:In,listStyleType:An,listStylePosition:En,listStyleImage:Nn,borderCollapse:Mn,borderSpacing:$n,captionSide:Wn,emptyCells:Dn,tableLayout:Ln,content:Fn,quotes:Hn,counterReset:jn,counterIncrement:On,appearance:Un,userSelect:Gn,pointerEvents:Qn,resize:Vn,scrollBehavior:qn,clip:_n,clipPath:Yn,isolation:Jn,mixBlendMode:Kn,willChange:Xn,contain:Zn,pageBreakBefore:ei,pageBreakAfter:ti,pageBreakInside:oi,breakBefore:ri,breakAfter:ni,breakInside:ii,orphans:ai,widows:si,columnCount:di,columnFill:ci,columnGap:pi,columnRule:ui,columnRuleColor:mi,columnRuleStyle:gi,columnRuleWidth:hi,columnSpan:fi,columnWidth:yi,columns:bi,cursor:xi}=se,st={hover:":hover",active:":active",focus:":focus","focus-visible":":focus-visible","focus-within":":focus-within",visited:":visited",link:":link",target:":target",root:":root",empty:":empty",enabled:":enabled",disabled:":disabled",checked:":checked",indeterminate:":indeterminate",default:":default",required:":required",optional:":optional",valid:":valid",invalid:":invalid","in-range":":in-range","out-of-range":":out-of-range","placeholder-shown":":placeholder-shown",autofill:":autofill","read-only":":read-only","read-write":":read-write","first-child":":first-child","last-child":":last-child","only-child":":only-child","first-of-type":":first-of-type","last-of-type":":last-of-type","only-of-type":":only-of-type","nth-child":":nth-child","nth-last-child":":nth-last-child","nth-of-type":":nth-of-type","nth-last-of-type":":nth-last-of-type",lang:":lang",dir:":dir",not:":not",is:":is",where:":where",has:":has","any-link":":any-link","local-link":":local-link",scope:":scope",current:":current",past:":past",future:":future",playing:":playing",paused:":paused",seeking:":seeking",muted:":muted","volume-locked":":volume-locked",buffering:":buffering",stalled:":stalled","picture-in-picture":":picture-in-picture",fullscreen:":fullscreen",modal:":modal","popover-open":":popover-open","user-invalid":":user-invalid","user-valid":":user-valid"};function vi(e){const r=e.trim();return r.startsWith("&:")||r.startsWith(":")?{type:"pseudo",pseudoClass:(r.startsWith("&:")?r.slice(1):r).trim()}:r.startsWith("@media ")?{type:"media",condition:r.slice(7).trim()}:r.startsWith("@container ")?{type:"container",condition:r.slice(11).trim()}:r.startsWith("@supports ")?{type:"supports",condition:r.slice(10).trim()}:r.startsWith("@style ")?{type:"style",condition:r.slice(7).trim()}:{type:"media",condition:r}}function Si(e){return e in st}function ki(e){return st[e]}const qe=new Map;function lt(e){const r=Array.isArray(e)?e:Object.entries(e),i=new Map;for(const[s,l]of r){let c=qe.get(l);c||(c=vi(l),qe.set(l,c)),i.set(s,c)}return function(s,l){let c,m;if(l!==void 0?(c=s,m=l):s instanceof H?(c=s,m=void 0):(c=void 0,m=s),!(c||m&&Object.keys(m).length!==0))return"";if(m&&Object.keys(m).length>0){const f=[],S=new Set;for(const[k]of r){const T=m[k];T&&(S.add(k),f.push({queryName:k,query:i.get(k),styles:T.getStyles()}))}for(const[k,T]of Object.entries(m))!S.has(k)&&Si(k)&&T instanceof H&&f.push({queryName:k,query:{type:"pseudo",pseudoClass:ki(k)},styles:T.getStyles()});const b=[];b.length=f.length+(c?1:0);let v=0;if(c){const k=c.getStyles();b[v++]="default:"+Ae(k)}for(const{queryName:k,styles:T}of f){const E=Ae(T);b[v++]=`${k}:${E}`}const u="n"+at(b.sort().join("||"));let x={};c&&(x={...c.getStyles()},V(u,x));const h=[],g=[];for(const k of f)k.query.type==="pseudo"?g.push(k):h.push(k);for(const{query:k,styles:T}of h)x={...x,...T},V(u,x,k.condition,k.type);for(const{query:k,styles:T}of g)k.type==="pseudo"&&V(u,T,void 0,"pseudo",k.pseudoClass);return{className:u}}return c?{className:c.getClassName()}:""}}const wi=lt;var Ci=Object.freeze({__proto__:null,StyleBuilder:H,accentColor:Gt,alignContent:Xo,alignItems:Uo,alignSelf:Ko,animation:mn,animationDelay:yn,animationDirection:xn,animationDuration:hn,animationFillMode:vn,animationIterationCount:bn,animationName:gn,animationPlayState:Sn,animationTimingFunction:fn,appearance:Un,backdropFilter:wn,backfaceVisibility:un,backgroundAttachment:Yr,backgroundClip:Jr,backgroundColor:Gr,backgroundImage:Qr,backgroundOrigin:Kr,backgroundPosition:qr,backgroundRepeat:Vr,backgroundSize:_r,bg:Ot,bold:Xt,border:gr,borderBottom:yr,borderBottomColor:Er,borderBottomLeftRadius:Dr,borderBottomRightRadius:Lr,borderBottomStyle:Rr,borderBottomWidth:Cr,borderCollapse:Mn,borderColor:Sr,borderLeft:br,borderLeftColor:Nr,borderLeftStyle:zr,borderLeftWidth:Pr,borderRadius:Mr,borderRight:fr,borderRightColor:Ar,borderRightStyle:Br,borderRightWidth:wr,borderSpacing:$n,borderStyle:vr,borderTop:hr,borderTopColor:Ir,borderTopLeftRadius:$r,borderTopRightRadius:Wr,borderTopStyle:Tr,borderTopWidth:kr,borderWidth:xr,bottom:Fo,boxShadow:Xr,boxSizing:Wo,breakAfter:ni,breakBefore:ri,breakInside:ii,captionSide:Wn,center:Qo,clip:_n,clipPath:Yn,color:Ut,columnCount:di,columnFill:ci,columnGap:pi,columnRule:ui,columnRuleColor:mi,columnRuleStyle:gi,columnRuleWidth:hi,columnSpan:fi,columnWidth:yi,columns:bi,contain:Zn,content:Fn,counterIncrement:On,counterReset:jn,createBreakpoints:wi,createCSSClass:Dt,createStyleQueries:lt,cursor:xi,display:Ft,emptyCells:Dn,filter:kn,flex:Ht,flexBasis:Jo,flexDirection:Oo,flexGrow:_o,flexShrink:Yo,flexWrap:qo,fontFamily:qt,fontSize:Qt,fontStretch:to,fontStyle:Zt,fontVariant:eo,fontWeight:Vt,gap:Vo,grid:jt,gridArea:cr,gridAutoColumns:pr,gridAutoFlow:mr,gridAutoRows:ur,gridColumn:nr,gridColumnEnd:sr,gridColumnStart:ar,gridRow:ir,gridRowEnd:dr,gridRowStart:lr,gridTemplateAreas:rr,gridTemplateColumns:tr,gridTemplateRows:or,height:Ao,isolation:Jn,justifyContent:Go,justifyItems:er,justifySelf:Zo,left:Ho,letterSpacing:Yt,lineHeight:_t,listStyle:In,listStyleImage:Nn,listStylePosition:En,listStyleType:An,margin:Po,marginBottom:Ro,marginLeft:zo,marginRight:Bo,marginTop:To,maxHeight:$o,maxWidth:No,minHeight:Mo,minWidth:Eo,mixBlendMode:Kn,objectFit:Rn,objectPosition:zn,opacity:Zr,orphans:ai,outline:Fr,outlineColor:Or,outlineOffset:Ur,outlineStyle:jr,outlineWidth:Hr,overflow:Cn,overflowWrap:co,overflowX:Pn,overflowY:Tn,padding:vo,paddingBottom:wo,paddingLeft:Co,paddingRight:ko,paddingTop:So,pageBreakAfter:ti,pageBreakBefore:ei,pageBreakInside:oi,perspective:cn,perspectiveOrigin:pn,pointerEvents:Qn,position:xo,quotes:Hn,resize:Vn,right:Lo,scrollBehavior:qn,tableLayout:Ln,textAlign:Jt,textAlignLast:po,textDecoration:Kt,textDecorationColor:go,textDecorationLine:mo,textDecorationStyle:ho,textDecorationThickness:fo,textIndent:ro,textJustify:uo,textOverflow:no,textShadow:io,textTransform:oo,textUnderlineOffset:yo,top:Do,transform:sn,transformOrigin:ln,transformStyle:dn,transition:en,transitionDelay:an,transitionDuration:rn,transitionProperty:tn,transitionTimingFunction:nn,userSelect:Gn,verticalAlign:bo,visibility:Bn,whiteSpace:ao,widows:si,width:Io,willChange:Xn,wordSpacing:so,wordWrap:lo,zIndex:jo});function Pi(){if(Ct(),typeof globalThis<"u"){const e=globalThis;e.list=Bt,e.update=Nt,e.when=At,e.on=Mt,e.render=$t;for(const[r,i]of Object.entries(Ci))try{e[r]=i}catch{}}}typeof globalThis<"u"&&Pi();const o={primary:"#84cc16",primaryHover:"#a3e635",primaryDark:"#65a30d",primaryGlow:"rgba(132, 204, 22, 0.3)",bg:"#0a0f1a",bgLight:"#111827",bgCard:"#1a2332",bgCode:"#0d1117",text:"#f8fafc",textMuted:"#94a3b8",textDim:"#64748b",accent:"#84cc16",border:"#1e293b",borderLight:"#334155",codeKeyword:"#c792ea",codeString:"#c3e88d",codeFunction:"#82aaff",codeComment:"#676e95",codeNumber:"#f78c6c"};function Ti(){const e=document.createElement("style");e.textContent=`
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

  
  `,document.head.appendChild(e)}const n=createStyleQueries({small:"@media (min-width: 341px)",medium:"@media (min-width: 601px)",large:"@media (min-width: 1025px)"}),t={container:n(padding("0 24px").maxWidth("1200px").margin("0 auto").width("100%")),header:n(display("flex").backgroundColor("#FF0000").alignItems("center").justifyContent("space-between").padding("20px 24px").backgroundColor("transparent").containerType("inline-size").position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${o.border}`),{medium:padding("20px 48px")}),logo:n(display("flex").alignItems("center").gap("12px").fontSize("20px").fontWeight("700").color(o.primary).transition("opacity 0.2s"),{medium:fontSize("24px")}),nav:n(display("flex").alignItems("center").gap("8px").width("100%").height("200px")),navLink:n(color(o.textMuted).fontSize("14px").fontWeight("500").transition("all 0.2s"),{medium:fontSize("15px"),hover:color("red")}),navLinkActive:n(color(o.text)),hero:n(padding("60px 24px 80px").textAlign("center").maxWidth("1000px").margin("0 auto").position("relative"),{medium:padding("100px 48px 120px")}),heroTitle:n(fontSize("40px").fontWeight("700").lineHeight("1.1").marginBottom("24px").color(o.text).letterSpacing("-0.02em"),{medium:fontSize("56px"),large:fontSize("64px")}),heroTitleAccent:n(color(o.primary)),heroTitleAccentStyle:{fontStyle:"italic"},heroSubtitle:n(fontSize("16px").color(o.textMuted).maxWidth("600px").margin("0 auto 48px").lineHeight("1.7"),{medium:fontSize("18px"),large:fontSize("20px")}),heroButtons:n(display("flex").gap("16px").justifyContent("center").flexWrap("wrap")),btnPrimary:n(padding("14px 32px").backgroundColor(o.primary).color(o.bg).borderRadius("8px").fontWeight("600").fontSize("15px").border("none").transition("all 0.2s")),btnPrimaryStyle:{boxShadow:`0 0 20px ${o.primaryGlow}`},btnSecondary:n(padding("14px 32px").backgroundColor("transparent").color(o.text).borderRadius("8px").fontWeight("600").fontSize("15px").border(`1px solid ${o.borderLight}`).transition("all 0.2s")),features:n(display("grid").gap("24px").padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("80px 48px")}),featuresStyle:{gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))"},featureCard:n(padding("32px").backgroundColor(o.bgCard).borderRadius("16px").border(`1px solid ${o.border}`).transition("all 0.3s").position("relative").overflow("hidden")),featureIcon:n(width("56px").height("56px").borderRadius("12px").display("flex").alignItems("center").justifyContent("center").marginBottom("20px").fontSize("28px")),featureIconStyle:{background:`linear-gradient(135deg, ${o.bgLight} 0%, ${o.bgCard} 100%)`,border:`1px solid ${o.border}`},featureTitle:n(fontSize("20px").fontWeight("600").marginBottom("12px").color(o.text)),featureDesc:n(fontSize("15px").color(o.textMuted).lineHeight("1.7")),codeBlock:n(backgroundColor(o.bgCode).borderRadius("12px").padding("24px").overflow("auto").border(`1px solid ${o.border}`).fontSize("14px").lineHeight("1.7")),codeInline:n(backgroundColor(o.bgLight).padding("3px 8px").borderRadius("6px").fontSize("14px").color(o.primary).border(`1px solid ${o.border}`)),section:n(padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("100px 48px")}),sectionTitle:n(fontSize("28px").fontWeight("700").marginBottom("16px").color(o.text).letterSpacing("-0.02em"),{medium:fontSize("36px"),large:fontSize("40px")}),sectionSubtitle:n(fontSize("18px").color(o.textMuted).marginBottom("56px").maxWidth("600px").lineHeight("1.7")),demoContainer:n(display("grid").gap("24px")),demoContainerStyle:{gridTemplateColumns:"1fr 1fr"},demoPanel:n(backgroundColor(o.bgCard).borderRadius("16px").border(`1px solid ${o.border}`).overflow("hidden")),demoPanelHeader:n(padding("14px 20px").backgroundColor(o.bgLight).borderBottom(`1px solid ${o.border}`).fontSize("13px").fontWeight("600").color(o.textMuted).textTransform("uppercase").letterSpacing("0.05em")),demoPanelContent:n(padding("24px")),footer:n(padding("48px").borderTop(`1px solid ${o.border}`).marginTop("auto").textAlign("center").backgroundColor(o.bgLight)),footerText:n(fontSize("14px").color(o.textDim)),footerLink:n(color(o.textMuted).transition("color 0.2s")),pageContent:n(padding("32px 24px 80px").maxWidth("900px").margin("0 auto"),{medium:padding("48px 48px 80px")}),pageTitle:n(fontSize("32px").fontWeight("700").marginBottom("24px").color(o.text).letterSpacing("-0.02em"),{medium:fontSize("40px"),large:fontSize("48px")}),pageSubtitle:n(fontSize("20px").color(o.textMuted).marginBottom("56px").lineHeight("1.7")),h2:n(fontSize("32px").fontWeight("600").marginTop("64px").marginBottom("20px").color(o.text).letterSpacing("-0.01em")),h3:n(fontSize("22px").fontWeight("600").marginTop("40px").marginBottom("16px").color(o.text)),p:n(fontSize("16px").color(o.textMuted).marginBottom("20px").lineHeight("1.8")),ul:n(paddingLeft("24px").marginBottom("20px")),li:n(fontSize("16px").color(o.textMuted).marginBottom("12px").lineHeight("1.7")),flex:n(display("flex")),flexCenter:n(display("flex").alignItems("center").justifyContent("center")),flexBetween:n(display("flex").alignItems("center").justifyContent("space-between")),flexCol:n(display("flex").flexDirection("column")),gap8:n(gap("8px")),gap16:n(gap("16px")),gap24:n(gap("24px")),gap32:n(gap("32px")),mt16:n(marginTop("16px")),mt24:n(marginTop("24px")),mt32:n(marginTop("32px")),mb16:n(marginBottom("16px")),mb24:n(marginBottom("24px")),table:n(width("100%").borderCollapse("collapse").marginBottom("24px").fontSize("14px")),th:n(padding("14px 16px").textAlign("left").borderBottom(`2px solid ${o.border}`).fontWeight("600").color(o.text).backgroundColor(o.bgLight)),td:n(padding("14px 16px").borderBottom(`1px solid ${o.border}`).color(o.textMuted)),glowBoxStyle:{boxShadow:`0 0 60px ${o.primaryGlow}, inset 0 0 60px rgba(132, 204, 22, 0.05)`}};let le="home";function R(){return le}function z(e){le=e;const r="/nuclo/";if(e==="home")window.history.pushState({},"",r);else{const i=r.endsWith("/")?`${r}#${e}`:`${r}/#${e}`;window.history.pushState({},"",i)}window.scrollTo(0,0),update()}const _e=["home","getting-started","core-api","tag-builders","styling","pitfalls","examples","example-counter","example-todo","example-subtasks","example-search","example-async","example-forms","example-nested","example-animations","example-routing","example-styled-card"];function Bi(){const e=window.location.hash.slice(1);_e.includes(e)&&(le=e),window.addEventListener("popstate",()=>{const r=window.location.hash.slice(1);le=_e.includes(r)?r:"home",update()})}function Ri(e=32,r=!1){return svgSvg({width:String(e),height:String(e),viewBox:"0 0 32 32",fill:"none"},i=>{if(r){const s=i;s.removeAttribute("width"),s.removeAttribute("height"),s.style.maxWidth="100%",s.style.width="100%",s.style.height="auto"}},circleSvg({cx:"16",cy:"16",r:"14",stroke:o.primary,"stroke-width":"2",fill:"none",opacity:"0.3"}),circleSvg({cx:"16",cy:"16",r:"12",stroke:o.primary,"stroke-width":"2",fill:"none"}),circleSvg({cx:"16",cy:"16",r:"5",fill:o.primary}),circleSvg({cx:"16",cy:"5",r:"2",fill:o.primaryHover}),circleSvg({cx:"24",cy:"20",r:"2",fill:o.primaryHover}),circleSvg({cx:"8",cy:"20",r:"2",fill:o.primaryHover}))}function zi(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"}),pathSvg({d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"}),pathSvg({d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"}),pathSvg({d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"}))}function Ii(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"}),pathSvg({d:"m3.3 7 8.7 5 8.7-5"}),pathSvg({d:"M12 22V12"}))}function Ai(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M13 2 3 14h9l-1 8 10-12h-9l1-8z"}))}function Ei(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),pathSvg({d:"M21 3v5h-5"}),pathSvg({d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),pathSvg({d:"M8 16H3v5"}))}function Ni(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m16 18 6-6-6-6"}),pathSvg({d:"m8 6-6 6 6 6"}))}function Mi(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:o.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"}),pathSvg({d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"}),pathSvg({d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"}))}function $i(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M5 12h14"}),pathSvg({d:"m12 5 7 7-7 7"}))}function Wi(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M20 6 9 17l-5-5"}))}function Di(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},rectSvg({x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"}),pathSvg({d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"}))}function Li(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"currentColor"},pathSvg({d:"M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"}))}function Fi(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"3",y1:"6",x2:"21",y2:"6"}),lineSvg({x1:"3",y1:"12",x2:"21",y2:"12"}),lineSvg({x1:"3",y1:"18",x2:"21",y2:"18"}))}function Hi(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"18",y1:"6",x2:"6",y2:"18"}),lineSvg({x1:"6",y1:"6",x2:"18",y2:"18"}))}let Z=!1;function ji(){Z=!Z,update()}function dt(){Z=!1,update()}const ct=[{label:"Getting Started",route:"getting-started"},{label:"Core API",route:"core-api"},{label:"Tag Builders",route:"tag-builders"},{label:"Styling",route:"styling"},{label:"Pitfalls",route:"pitfalls"},{label:"Examples",route:"examples"}];function pt(e,r){const i=()=>R()===r||R().startsWith(r+"-");return a({href:`#${r}`},n(display("flex").alignItems("center").padding("8px 14px").borderRadius("8px").fontSize("14px").fontWeight("500").transition("all 0.2s").color(o.textMuted).cursor("pointer"),{hover:backgroundColor(o.accent).color(o.bg)}),{style:()=>({color:i()?o.primary:void 0})},e,on("click",s=>{s.preventDefault(),z(r),dt()}))}function Oi(){return a({href:"/nuclo/"},n(display("flex").alignItems("center").gap("10px").fontSize("18px").fontWeight("700").color(o.primary).transition("opacity 0.2s").cursor("pointer"),{hover:opacity("0.8")}),Ri(28),span("Nuclo"),on("click",e=>{e.preventDefault(),z("home"),dt()}))}function ut(){return a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer",ariaLabel:"GitHub"},n(display("flex").alignItems("center").justifyContent("center").width("36px").height("36px").borderRadius("8px").transition("all 0.2s").color(o.textMuted).backgroundColor("transparent"),{hover:color(o.primary).backgroundColor("rgba(132, 204, 22, 0.1)")}),Li())}function Ui(){return button(n(display("flex").alignItems("center").justifyContent("center").width("40px").height("40px").borderRadius("8px").backgroundColor("transparent").border("none").color(o.text).cursor("pointer").transition("all 0.2s"),{medium:display("none")}),when(()=>Z,Hi()).else(Fi()),on("click",ji))}function Gi(){return when(()=>Z,div(n(position("fixed").top("64px").left("0").right("0").backgroundColor(o.bg).borderBottom(`1px solid ${o.border}`).padding("16px 24px").zIndex(99).display("flex").flexDirection("column").gap("8px")),{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.95)"}},...ct.map(e=>pt(e.label,e.route)),div(n(display("flex").alignItems("center").gap("8px").padding("8px 14px")),ut(),span(n(color(o.textMuted).fontSize("14px")),"GitHub"))))}function Qi(){const e=n(position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${o.border}`)),r=n(display("flex").alignItems("center").justifyContent("space-between").maxWidth("1400px").margin("0 auto").padding("12px 24px"),{medium:padding("16px 48px")}),i=n(display("none").alignItems("center").gap("4px"),{medium:display("flex")}),s=n(display("flex").alignItems("center").gap("8px"));return div(header(e,{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.85)"}},div(r,Oi(),nav(i,...ct.map(l=>pt(l.label,l.route))),div(s,div(n(display("none"),{medium:display("flex")}),ut()),Ui()))),Gi())}function Vi(){return footer(t.footer,div(t.footerText,"Created by ",a({href:"https://github.com/dan2dev",target:"_blank",rel:"noopener noreferrer"},n(color(o.textMuted).transition("color 0.2s"),{hover:color(o.primary)}),"Danilo Celestino de Castro")," · MIT License · ",a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer"},n(color(o.textMuted).transition("color 0.2s"),{hover:color(o.primary)}),"GitHub")))}let mt={};function Ye(e,r){mt[e]=r,update()}function Je(e){return mt[e]||!1}function qi(e){return e.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,`<span style="color: ${o.codeString}">$&</span>`).replace(/(\/\/.*$)/gm,`<span style="color: ${o.codeComment}">$1</span>`).replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,`<span style="color: ${o.codeKeyword}">$1</span>`).replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,`<span style="color: ${o.codeFunction}">$1</span>(`).replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${o.codeNumber}">$1</span>`).replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g,`: <span style="color: ${o.codeKeyword}">$1</span>`)}function d(e,r="typescript",i=!0){const s=`code-${Math.random().toString(36).slice(2,9)}`,l=qi(e.trim());return div(n(position("relative")),pre(t.codeBlock,code({innerHTML:l})),i?button(n(position("absolute").top("12px").right("12px").padding("6px 10px").borderRadius("6px").color(o.textMuted).fontSize("12px").cursor("pointer").display("flex").alignItems("center").gap("4px").transition("all 0.2s").backgroundColor(o.bgLight).border(`1px solid ${o.border}`),{hover:border(`1px solid ${o.borderLight}`).color(o.text)}),()=>Je(s)?Wi():Di(),()=>Je(s)?"Copied!":"Copy",on("click",async()=>{await navigator.clipboard.writeText(e.trim()),Ye(s,!0),setTimeout(()=>Ye(s,!1),2e3)})):null)}function P(e){return code(t.codeInline,e)}const A=[{id:"counter",title:"Counter",description:"The classic counter example showing basic state management and event handling.",code:`import 'nuclo';

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

// Toggle a CSS keyframes animation
let isAnimating = false;

// Ensure keyframes exist
const style = document.createElement('style');
style.textContent = '@keyframes pulse { from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.08); opacity: 1; } }';
document.head.appendChild(style);

const app = div(
  button(
    () => isAnimating ? 'Stop Animation' : 'Start Animation',
    on('click', () => { isAnimating = !isAnimating; update(); })
  ),

  div(
    {
      className: 'animated-box',
      style: {
        width: '200px',
        height: '200px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        animation: () => isAnimating ? 'pulse 600ms ease-in-out infinite alternate' : 'none',
        willChange: () => isAnimating ? 'transform, opacity' : 'auto'
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

render(app, document.body);`}],C={installNpm:{lang:"bash",code:"npm install nuclo"},installYarn:{lang:"bash",code:"yarn add nuclo"},installPnpm:{lang:"bash",code:"pnpm add nuclo"},denoImport:{lang:"typescript",code:"import 'npm:nuclo';"},denoJson:{lang:"json",code:`{
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
}`}},y={overviewQuickExample:{lang:"typescript",code:`import 'nuclo';

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
);`},styleQueriesPseudoClasses:{lang:"typescript",code:`// Pseudo-classes are automatically available - no need to define them!
const cn = createStyleQueries({
  small: '@media (min-width: 341px)',
  medium: '@media (min-width: 601px)',
  large: '@media (min-width: 1025px)',
});

// Use hover, focus, active, etc. directly
const buttonStyle = cn(
  padding('12px 24px')
    .borderRadius('8px')
    .backgroundColor('blue')
    .color('white')
    .transition('all 0.2s'),
  {
    hover: backgroundColor('darkblue'),
    focus: outline('2px solid lightblue'),
    active: transform('scale(0.98)')
  }
);

button(buttonStyle, 'Click me');

// Works with responsive queries too
const navLink = cn(
  color('gray').fontSize('14px').transition('all 0.2s'),
  {
    medium: fontSize('15px'),
    hover: color('blue')
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
backdropFilter('blur(10px)')`},effectsHover:{lang:"typescript",code:`// For hover effects, use pseudo-classes (recommended)
const cardBase = cn(
  bg('white')
    .borderRadius('12px')
    .padding('1.5rem')
    .transition('all 0.3s ease')
    .boxShadow('0 2px 8px rgba(0,0,0,0.1)'),
  {
    hover: boxShadow('0 10px 40px rgba(0,0,0,0.15)').transform('translateY(-4px)')
  }
);

div(cardBase, 'Hover me');

// Alternative: reactive style function (for complex logic)
let isHovered = false;
div(
  cardBase,
  {
    style: () => ({
      boxShadow: isHovered
        ? '0 10px 40px rgba(0,0,0,0.15)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
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

render(app, document.body);`}},_i=`import 'nuclo';

let count = 0;

const counter = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);`;let _=0;function Yi(){return div(n(display("flex").flexDirection("column").gap("12px").padding("24px").backgroundColor(o.bgCard).border(`1px solid ${o.border}`).borderRadius("12px")),h3(n(fontSize("16px").fontWeight("600").color(o.text)),"Live Counter Demo"),div(n(display("flex").alignItems("center").gap("12px")),span(n(fontSize("32px").fontWeight("700").color(o.text)),()=>_),span(n(color(o.textDim)),()=>_%2===0?"even":"odd")),div(n(display("flex").gap("8px")),button(t.btnSecondary,"-",on("click",()=>{_--,update()})),button(t.btnSecondary,"Reset",on("click",()=>{_=0,update()})),button(t.btnPrimary,{style:t.btnPrimaryStyle},"+",on("click",()=>{_++,update()}))))}function Q(e,r,i){const s=n(padding("32px").backgroundColor(o.bgCard).borderRadius("16px").border(`1px solid ${o.border}`).transition("all 0.3s").position("relative").overflow("hidden"),{hover:border(`1px solid ${o.primary}`).transform("translateY(-4px)").boxShadow(`0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${o.primaryGlow}`)});return div(s,div(t.featureIcon,{style:t.featureIconStyle},e),h3(t.featureTitle,r),p(t.featureDesc,i))}const Ji=["counter","todo","search","async","styled-card","subtasks"],Ki=A.filter(e=>Ji.includes(e.id));function Xi(e){z("examples"),setTimeout(()=>{const r=document.getElementById(e);r&&r.scrollIntoView({behavior:"smooth",block:"start"})},150)}function Zi(){return div(section(t.hero,h1(t.heroTitle,"Build ",span(t.heroTitleAccent,{style:t.heroTitleAccentStyle},"Faster"),", ",span(t.heroTitleAccent,{style:t.heroTitleAccentStyle},"Reactive")," Interfaces."),p(t.heroSubtitle,"A lightweight, flexible, component-based framework for the modern web. Just functions, plain objects, and explicit updates."),div(t.heroButtons,button(n(padding("14px 32px").backgroundColor(o.primary).color(o.bg).borderRadius("8px").fontWeight("600").fontSize("15px").border("none").transition("all 0.2s").display("flex").alignItems("center").gap("8px"),{hover:backgroundColor(o.primaryHover).transform("translateY(-2px)").boxShadow(`0 0 30px ${o.primaryGlow}`)}),{style:t.btnPrimaryStyle},"Get Started",$i(),on("click",()=>z("getting-started"))),button(n(padding("14px 32px").backgroundColor("transparent").color(o.text).borderRadius("8px").fontWeight("600").fontSize("15px").border(`1px solid ${o.borderLight}`).transition("all 0.2s"),{hover:border(`1px solid ${o.primary}`).color(o.primary).transform("translateY(-2px)")}),"View Demo",on("click",()=>z("examples"))))),section(n(padding("0 48px 100px").maxWidth("800px").margin("0 auto")),div(n(borderRadius("16px").border(`1px solid ${o.border}`).overflow("hidden")),{style:t.glowBoxStyle},div(n(padding("12px 20px").backgroundColor(o.bgLight).borderBottom(`1px solid ${o.border}`).display("flex").alignItems("center").gap("8px")),span(n(width("12px").height("12px").borderRadius("50%").backgroundColor("#ff5f57"))),span(n(width("12px").height("12px").borderRadius("50%").backgroundColor("#febc2e"))),span(n(width("12px").height("12px").borderRadius("50%").backgroundColor("#28c840"))),span(n(marginLeft("auto").fontSize("13px").color(o.textDim)),"main.ts")),d(_i,"typescript",!1))),section(t.features,{style:t.featuresStyle},Q(zi(),"Lightweight & Fast","Zero dependencies, tiny bundle size. Built for performance from the ground up with direct DOM manipulation."),Q(Ii(),"Component-Based","Build encapsulated components that manage their own state. Compose them to make complex UIs simple."),Q(Ei(),"Simple Reactivity","Explicit update() calls give you full control. No magic, no proxies, no hidden re-renders."),Q(Ai(),"Fine-Grained Updates","Only updates what changed. Elements are reused, branches are preserved, performance is maximized."),Q(Ni(),"TypeScript-First","Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime."),Q(Mi(),"Intuitive API","Global tag builders feel natural. Just use div(), span(), button() - no imports needed.")),section(t.section,h2(t.sectionTitle,"Quick Start"),p(t.sectionSubtitle,"Get up and running in seconds."),div(t.flexCol,t.gap32,div(h3(n(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"1. Install"),d("npm install nuclo","bash")),div(h3(n(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"2. Import and use"),d(`import 'nuclo';

// Now use div(), update(), on(), list(), when(), render() globally
const app = div(
  h1('Hello, Nuclo!'),
  p('Building UIs made simple.')
);

render(app, document.body);`,"typescript")),div(h3(n(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"3. Add TypeScript support"),d(`// tsconfig.json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`,"json"))),div(n(marginTop("32px")),h3(n(fontSize("18px").fontWeight("600").color(o.primary).marginBottom("16px")),"Try it live"),Yi())),section(t.section,h2(t.sectionTitle,"Core Concepts"),p(t.sectionSubtitle,"Explicit updates, reactive functions, conditionals, list syncing, and styling."),div(t.demoContainer,div(t.demoPanel,div(t.demoPanelHeader,"Batch updates"),div(t.demoPanelContent,d(C.batchUpdates.code,C.batchUpdates.lang,!1))),div(t.demoPanel,div(t.demoPanelHeader,"Reactive functions"),div(t.demoPanelContent,d(C.reactiveText.code,C.reactiveText.lang,!1)))),div(n(display("grid").gap("20px")),div(t.featureCard,h3(t.featureTitle,"Conditional rendering"),d(`when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('Dashboard')
).else(
  div('Please log in')
);`,"typescript",!1)),div(t.featureCard,h3(t.featureTitle,"List synchronization"),d("list(() => items, (item, index) =>\n  div(() => `${index}: ${item.name}`)\n);","typescript",!1)),div(t.featureCard,h3(t.featureTitle,"CSS-in-JS styling"),d(y.overviewQuickExample.code,y.overviewQuickExample.lang,!1)))),section(t.section,h2(t.sectionTitle,"Examples"),p(t.sectionSubtitle,"Jump into any example from the original gallery."),div(n(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),...Ki.map(e=>div(t.featureCard,h3(t.featureTitle,e.title),p(t.featureDesc,e.description),button(t.btnSecondary,"View Example",on("click",()=>Xi(e.id))))))))}function ea(){return div(t.pageContent,h1(t.pageTitle,"Getting Started"),p(t.pageSubtitle,"Everything from the original Nuclo docs: installs, Deno support, first app walkthrough, explicit updates, events, styling, and best practices."),h2(t.h2,"Installation"),p(t.p,"Install with your preferred package manager:"),d(C.installNpm.code,C.installNpm.lang),d(C.installYarn.code,C.installYarn.lang),d(C.installPnpm.code,C.installPnpm.lang),p(t.p,"Deno works too—import directly from npm:"),d(C.denoImport.code,C.denoImport.lang),p(t.p,"Or add it to ",P("deno.json"),":"),d(C.denoJson.code,C.denoJson.lang),p(t.p,"Then import once to register global builders:"),d(C.denoUsage.code,C.denoUsage.lang),h2(t.h2,"TypeScript Setup"),p(t.p,"Nuclo ships full typings for 140+ HTML/SVG builders. Enable them globally with ",P("types"),"."),d(C.tsconfigTypes.code,C.tsconfigTypes.lang),p(t.p,"…or add a reference to your env definition file:"),d(C.typesReference.code,C.typesReference.lang),h2(t.h2,"Your First App"),p(t.p,"Straight from the original landing page: a counter that shows state, events, and explicit ",P("update()"),"."),d(C.firstApp.code,C.firstApp.lang),h3(t.h3,"How it works"),ul(t.ul,li(t.li,strong("Import:")," ",P("import 'nuclo'")," registers global builders"),li(t.li,strong("State:")," plain variables/objects—no hooks or stores"),li(t.li,strong("Reactive content:")," zero-arg functions rerender on ",P("update()")),li(t.li,strong("Events:")," attach listeners with ",P("on()")),li(t.li,strong("Render:")," mount once with ",P("render()"))),h2(t.h2,"Understanding update()"),p(t.p,P("update()")," is explicit: mutate freely, then call it once to refresh reactive functions."),h3(t.h3,"Batching updates"),d(C.batchUpdates.code,C.batchUpdates.lang),h3(t.h3,"Why explicit?"),ul(t.ul,li(t.li,"Performance: batch multiple mutations into one DOM update"),li(t.li,"Control: you decide exactly when the UI refreshes"),li(t.li,"Predictability: no hidden re-renders or proxies"),li(t.li,"Debugging: set a breakpoint on ",P("update()")," to trace changes")),h2(t.h2,"Reactive Functions"),p(t.p,"Any zero-arg function is reactive. Use them for text, attributes, and styles."),h3(t.h3,"Text content"),d(C.reactiveText.code,C.reactiveText.lang),h3(t.h3,"Attributes"),d(C.reactiveAttributes.code,C.reactiveAttributes.lang),h3(t.h3,"Styles"),d(C.reactiveStyles.code,C.reactiveStyles.lang),h3(t.h3,"Complex expressions"),d(C.complexExpressions.code,C.complexExpressions.lang),h2(t.h2,"Event Handling with on()"),p(t.p,"The ",P("on()")," helper returns modifiers for any DOM event."),h3(t.h3,"Basic events"),d(C.eventBasic.code,C.eventBasic.lang),h3(t.h3,"Multiple events"),d(C.eventMultiple.code,C.eventMultiple.lang),h3(t.h3,"Event options"),d(C.eventOptions.code,C.eventOptions.lang),h3(t.h3,"Keyboard helpers"),d(C.keyboardEvents.code,C.keyboardEvents.lang),h2(t.h2,"Styling"),p(t.p,"Nuclo ships a CSS-in-JS system with chainable helpers and ",P("createStyleQueries"),"."),h3(t.h3,"Using createStyleQueries"),d(C.stylingSetup.code,C.stylingSetup.lang),h3(t.h3,"Responsive styles"),d(C.responsiveStyles.code,C.responsiveStyles.lang),h3(t.h3,"Dynamic styles"),d(C.dynamicStyles.code,C.dynamicStyles.lang),h2(t.h2,"Best Practices"),h3(t.h3,"Batch your updates"),d(C.bestPracticeBatch.code,C.bestPracticeBatch.lang),h3(t.h3,"Use computed helpers"),d(C.bestPracticeComputed.code,C.bestPracticeComputed.lang),h3(t.h3,"Component-like functions"),d(C.componentFunctions.code,C.componentFunctions.lang),h3(t.h3,"Use plain objects/arrays"),d(C.mutableState.code,C.mutableState.lang),h3(t.h3,"Handle async flows"),d(C.asyncFlow.code,C.asyncFlow.lang),h2(t.h2,"Next Steps"),ul(t.ul,li(t.li,strong("Core API:")," learn ",P("when()"),", ",P("list()"),", and more"),li(t.li,strong("Tag Builders:")," explore all HTML and SVG elements"),li(t.li,strong("Styling:")," CSS-in-JS helpers and responsive design"),li(t.li,strong("Examples:")," run through the full demo gallery")))}const w={updateUsage:{lang:"typescript",code:`let count = 0;

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
button('Hover me', tooltip('Click to submit'));`}};function ta(){return div(t.pageContent,h1(t.pageTitle,"Core API"),p(t.pageSubtitle,"The essential functions that power every Nuclo application: update(), render(), on(), list(), and when()."),h2(t.h2,{id:"update"},"update()"),p(t.p,"Trigger a synchronous refresh of every reactive function in your application."),d(w.updateUsage.code,w.updateUsage.lang),h3(t.h3,"Key Points"),ul(t.ul,li(t.li,"Call after batching mutations for best performance"),li(t.li,"Only zero-argument functions re-evaluate"),li(t.li,"Safe to call multiple times; prefer grouping work first")),h2(t.h2,{id:"render"},"render(element, container)"),p(t.p,"Mount an element tree to a DOM container (append, not replace)."),d(w.renderUsage.code,w.renderUsage.lang),h3(t.h3,"Key Points"),ul(t.ul,li(t.li,"Typical pattern: render one root that owns the whole app"),li(t.li,"You can render multiple trees if needed"),li(t.li,"Works with any element created by the tag builders")),h2(t.h2,{id:"on"},"on(event, handler, options?)"),p(t.p,"Attach event listeners with full TypeScript support."),d(w.onClick.code,w.onClick.lang),h3(t.h3,"Multiple Events"),p(t.p,"Attach multiple event handlers to the same element:"),d(w.onMultipleEvents.code,w.onMultipleEvents.lang),h3(t.h3,"Event Options"),p(t.p,"Pass standard event listener options:"),d(w.onPassive.code,w.onPassive.lang),h3(t.h3,"Keyboard Events"),d(w.onKeyboard.code,w.onKeyboard.lang),h3(t.h3,"Form Handling"),d(w.onFormSubmit.code,w.onFormSubmit.lang),h2(t.h2,{id:"list"},"list(provider, renderer)"),p(t.p,"Synchronize arrays to DOM nodes. Items stay mounted while object identity is stable—mutate objects in place instead of replacing them."),d(w.listBasic.code,w.listBasic.lang),h3(t.h3,"Object Identity"),p(t.p,"Nuclo tracks items by reference. Mutate objects to preserve their DOM elements:"),d(w.listIdentity.code,w.listIdentity.lang),h3(t.h3,"Nested Lists"),p(t.p,"Nested lists remain stable too:"),d(w.listNested.code,w.listNested.lang),h2(t.h2,{id:"when"},"when(condition, ...content)"),p(t.p,"Chain conditional branches; the first truthy branch wins and DOM is preserved when the branch stays the same."),h3(t.h3,"Basic Usage"),d(w.whenBasic.code,w.whenBasic.lang),h3(t.h3,"Multiple Conditions"),d(w.whenRoles.code,w.whenRoles.lang),h3(t.h3,"Content in Branches"),d(w.whenElseBranch.code,w.whenElseBranch.lang),h3(t.h3,"DOM Preservation"),p(t.p,"Elements persist across updates if the same branch is active:"),d(w.whenPreserve.code,w.whenPreserve.lang),h3(t.h3,"Nested Conditions"),d(w.whenNestedConditions.code,w.whenNestedConditions.lang))}function oa(){const e=[{title:"Document Structure",tags:"html, head, body, header, footer, main, section, article, aside, nav"},{title:"Content Sectioning",tags:"h1, h2, h3, h4, h5, h6, div, span, p, blockquote, pre, code"},{title:"Lists",tags:"ul, ol, li, dl, dt, dd"},{title:"Forms",tags:"form, input, textarea, button, select, option, label, fieldset, legend"},{title:"Tables",tags:"table, thead, tbody, tfoot, tr, th, td, caption, col, colgroup"},{title:"Media",tags:"img, video, audio, source, track, canvas, svg"},{title:"Interactive",tags:"a, button, details, summary, dialog"},{title:"Text Formatting",tags:"strong, em, mark, small, del, ins, sub, sup, abbr, cite, q, kbd, samp, var"}];return div(t.pageContent,h1(t.pageTitle,"Tag Builders"),p(t.pageSubtitle,"Every HTML and SVG element is available globally after importing Nuclo. Build your UI with simple function calls."),h2(t.h2,{id:"overview"},"Overview"),p(t.p,"Tag builders accept children, attributes, event modifiers, and arrays. After ",P("import 'nuclo'"),", all builders are available globally."),d(w.tagBuilderBasic.code,w.tagBuilderBasic.lang),h2(t.h2,{id:"html-tags"},"HTML Tags"),p(t.p,"Full HTML5 coverage with 140+ elements:"),...e.map(r=>div(h3(n(fontSize("18px").fontWeight("600").marginTop("24px").marginBottom("12px")),r.title),pre(t.codeBlock,code(r.tags)))),p(t.p,n(marginTop("24px")),"And 100+ more—see ",a({href:"https://github.com/dan2dev/nuclo/blob/main/packages/nuclo/src/core/tagRegistry.ts",target:"_blank",rel:"noopener noreferrer"},P("the full registry")),"."),h2(t.h2,{id:"svg-tags"},"SVG Tags"),p(t.p,"Full SVG support for graphics and icons:"),d(`svg, circle, ellipse, line, path, polygon, polyline, rect,
g, defs, use, symbol, marker, clipPath, mask, pattern,
linearGradient, radialGradient, stop, text, tspan, textPath`,"text"),h3(t.h3,"SVG Example"),d(w.svgExample.code,w.svgExample.lang),h2(t.h2,{id:"attributes"},"Attributes"),p(t.p,"Pass attributes as objects—values can be static or reactive functions."),h3(t.h3,"Static Attributes"),d(w.attributesStatic.code,w.attributesStatic.lang),h3(t.h3,"Reactive Attributes"),p(t.p,"Use functions for dynamic values that update on ",P("update()"),":"),d(w.attributesReactive.code,w.attributesReactive.lang),h3(t.h3,"Style Objects"),p(t.p,"Styles can be objects, strings, or reactive functions:"),d(w.attributesStyle.code,w.attributesStyle.lang),h3(t.h3,"Boolean Attributes"),d(w.attributesBoolean.code,w.attributesBoolean.lang),h3(t.h3,"Special Attributes"),p(t.p,"Some attributes are mapped for convenience:"),d(w.specialAttributes.code,w.specialAttributes.lang),h2(t.h2,{id:"className-merging"},"className Merging"),p(t.p,"Multiple ",P("className")," values are merged rather than overwritten—static strings, reactive functions, and style helper modifiers all compose."),d(w.classNameMerging.code,w.classNameMerging.lang),h3(t.h3,"Conditional Classes"),d(w.classNameConditional.code,w.classNameConditional.lang),h3(t.h3,"With Style Helpers"),d(w.styleHelperMerging.code,w.styleHelperMerging.lang),h3(t.h3,"Status Pattern"),p(t.p,"Common pattern for conditional styling:"),d(w.classNameStatusPattern.code,w.classNameStatusPattern.lang),h2(t.h2,{id:"modifiers"},"Modifiers"),p(t.p,"Objects with ",P("__modifier")," allow behaviors beyond attributes."),h3(t.h3,"Event Modifiers"),d(w.modifiersEvents.code,w.modifiersEvents.lang),h3(t.h3,"Style Modifiers"),d(w.modifiersStyles.code,w.modifiersStyles.lang),h3(t.h3,"Custom Modifiers"),p(t.p,"Create your own modifiers for reusable behaviors:"),d(w.modifiersCustomFocus.code,w.modifiersCustomFocus.lang))}function ra(){function e(){const u=n(backgroundColor(o.primary).color(o.bg).padding("12px 20px").border("none").borderRadius("10px").fontWeight("700").cursor("pointer").transition("all 0.2s"),{hover:backgroundColor(o.primaryHover).transform("translateY(-2px)").boxShadow(`0 0 24px ${o.primaryGlow}`)});return div(t.demoPanel,div(t.demoPanelHeader,"Live: Overview button"),div(t.demoPanelContent,button(u,{style:t.btnPrimaryStyle},"Click me")))}function r(){let u=!0;const x=backgroundColor(o.bgCard).color(o.text).padding("20px").transition("all 0.2s");function h(){const g=x.borderRadius(u?"14px":"0px").boxShadow(u?"0 10px 30px rgba(0,0,0,0.25)":"none").border(`1px solid ${o.border}`);return n(g)}return div(t.demoPanel,div(t.demoPanelHeader,"Live: StyleBuilder chaining"),div(t.demoPanelContent,div(()=>h(),h3(n(fontSize("16px").fontWeight("700")),"Chained styles"),p(n(color(o.textMuted)),"Toggle props built via chained helpers."),div(n(display("flex").gap("8px").marginTop("8px")),button(t.btnSecondary,u?"Make Square":"Make Rounded",on("click",()=>{u=!u,update()}))))))}function i(){let u="mobile";const x=n(backgroundColor(o.bgCard).border(`1px solid ${o.border}`).borderRadius("12px").transition("all 0.2s"),{medium:padding("24px"),large:padding("32px")});function h(k){return k==="mobile"?"260px":k==="medium"?"420px":"640px"}function g(k){return k==="mobile"?"<480px":k==="medium"?"≥768px":"≥1024px"}return div(t.demoPanel,div(t.demoPanelHeader,"Live: Style queries"),div(t.demoPanelContent,div(n(display("flex").gap("8px").marginBottom("12px")),button(t.btnSecondary,"Mobile",on("click",()=>{u="mobile",update()})),button(t.btnSecondary,"Medium",on("click",()=>{u="medium",update()})),button(t.btnSecondary,"Large",on("click",()=>{u="large",update()}))),div(n(marginTop("4px")),div(()=>x,{style:()=>({width:h(u),padding:u==="mobile"?"16px":void 0})},h3(n(fontSize("16px").fontWeight("700")),()=>`Breakpoint: ${g(u)}`),p(n(color(o.textMuted)),"Padding increases on medium and large breakpoints.")))))}function s(){let u=!1;const x=n(backgroundColor(o.bgLight).border(`1px solid ${o.border}`).borderRadius("10px").padding("12px"));function h(){return u?n(display("grid").gap("12px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}):n(display("flex").gap("12px").flexWrap("wrap"))}return div(t.demoPanel,div(t.demoPanelHeader,"Live: Layout helpers"),div(t.demoPanelContent,button(t.btnSecondary,()=>u?"Use Flex":"Use Grid",on("click",()=>{u=!u,update()})),div(n(marginTop("12px")),div(()=>h(),...[1,2,3,4,5,6].map(g=>div(x,`Item ${g}`))))))}function l(){const u=n(backgroundColor(o.bgCard).padding("24px").borderRadius("12px").boxShadow("0 4px 12px rgba(0,0,0,0.15)").border(`1px solid ${o.border}`));return div(t.demoPanel,div(t.demoPanelHeader,"Live: Basic usage"),div(t.demoPanelContent,div(u,"Card content")))}function c(){const u=n(fontSize("28px").fontWeight("800").letterSpacing("-0.02em")),x=n(color(o.textMuted).fontSize("16px"));return div(t.demoPanel,div(t.demoPanelHeader,"Live: Typography"),div(t.demoPanelContent,h1(u,"Elegant Heading"),p(x,"Subtle body copy with readable line-height and contrast.")))}function m(){const u=(x,h)=>div(n(display("flex").alignItems("center").gap("12px")),div(n(width("36px").height("24px").borderRadius("6px").border(`1px solid ${o.border}`)),{style:{background:x}}),span(n(color(o.textMuted)),h));return div(t.demoPanel,div(t.demoPanelHeader,"Live: Colors"),div(t.demoPanelContent,u(o.primary,"Primary"),u("linear-gradient(135deg, #667eea 0%, #764ba2 100%)","Gradient"),u(o.bgLight,"Background")))}function f(){const u=n(display("flex").justifyContent("space-between").alignItems("center").padding("12px 16px").backgroundColor(o.bgLight).border(`1px solid ${o.border}`).borderRadius("10px")),x=n(display("flex").gap("12px").alignItems("center")),h=n(color(o.textMuted).transition("color 0.2s"));return div(t.demoPanel,div(t.demoPanelHeader,"Live: Flexbox"),div(t.demoPanelContent,nav(u,div(n(fontWeight("700")),"Logo"),div(x,a(h,"Home",on("mouseenter",g=>g.currentTarget.style.color=o.text),on("mouseleave",g=>g.currentTarget.style.color=o.textMuted)),a(h,"Docs",on("mouseenter",g=>g.currentTarget.style.color=o.text),on("mouseleave",g=>g.currentTarget.style.color=o.textMuted)),a(h,"Contact",on("mouseenter",g=>g.currentTarget.style.color=o.text),on("mouseleave",g=>g.currentTarget.style.color=o.textMuted))))))}function S(){const u=n(display("grid").gap("12px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),x=n(backgroundColor(o.bgLight).border(`1px solid ${o.border}`).borderRadius("10px").padding("12px"));return div(t.demoPanel,div(t.demoPanelHeader,"Live: Grid"),div(t.demoPanelContent,div(u,...Array.from({length:6},(h,g)=>div(x,`Card ${g+1}`)))))}function b(){const u=n(backgroundColor(o.bgLight).border(`1px solid ${o.border}`).borderRadius("12px").padding("24px").transition("all 0.25s"),{hover:boxShadow("0 20px 50px rgba(0,0,0,0.35)").transform("translateY(-4px) scale(1.02)")});return div(t.demoPanel,div(t.demoPanelHeader,"Live: Effects"),div(t.demoPanelContent,div(u,"Hover me")))}function v(){const u=n(backgroundColor(o.bgCard).border(`1px solid ${o.border}`).borderRadius("14px").padding("20px"));return div(t.demoPanel,div(t.demoPanelHeader,"Live: Organized styles"),div(t.demoPanelContent,div(u,h3(n(fontSize("16px").fontWeight("700")),"Theme buttons"),div(n(display("flex").gap("10px").marginTop("8px")),button(t.btnPrimary,{style:t.btnPrimaryStyle},"Primary"),button(t.btnSecondary,"Secondary")))))}return div(t.pageContent,h1(t.pageTitle,"Styling"),p(t.pageSubtitle,"All of the original styling docs are here: chainable helpers, StyleBuilder utilities, responsive queries, and layout recipes."),h2(t.h2,"Overview"),p(t.p,"Nuclo's styling system is powered by chainable helpers that generate CSS classes for you. Start with any helper (",P("bg()"),", ",P("padding()"),", etc.), chain more, and wrap with ",P("createStyleQueries")," for responsive variants."),p(t.p,"Quick example straight from the legacy site:"),div(t.demoContainer,{style:t.demoContainerStyle},div(e()),div(d(y.overviewQuickExample.code,y.overviewQuickExample.lang,!0))),h2(t.h2,"StyleBuilder"),p(t.p,"Each helper returns a StyleBuilder instance. You can chain helpers, pull out the generated class name, or read the computed styles."),h3(t.h3,"How it works"),div(t.demoContainer,{style:t.demoContainerStyle},div(r()),div(d(y.styleBuilderUsage.code,y.styleBuilderUsage.lang,!0))),h3(t.h3,"StyleBuilder methods"),d(y.styleBuilderMethods.code,y.styleBuilderMethods.lang),h3(t.h3,"Generated CSS"),d(y.styleBuilderClass.code,y.styleBuilderClass.lang),h2(t.h2,"Style Helpers"),p(t.p,"95+ helpers mirror CSS properties: layout, spacing, typography, color, flexbox, grid, effects, and more. Chain them to build up reusable class names."),h3(t.h3,"Basic usage"),div(t.demoContainer,{style:t.demoContainerStyle},div(l()),div(d(y.styleHelpersBasic.code,y.styleHelpersBasic.lang,!0))),h3(t.h3,"Available helpers (from the original reference)"),d(y.styleHelpersList.code,y.styleHelpersList.lang),h3(t.h3,"Shorthand helpers"),d(y.styleHelpersShorthand.code,y.styleHelpersShorthand.lang),h2(t.h2,"Style Queries"),p(t.p,"Use ",P("createStyleQueries")," to add media, container, or feature queries. Defaults can be merged with breakpoint overrides."),d(y.styleQueriesSetup.code,y.styleQueriesSetup.lang),h3(t.h3,"Defaults and overrides"),div(t.demoContainer,{style:t.demoContainerStyle},div(i()),div(d(y.styleQueriesDefaults.code,y.styleQueriesDefaults.lang,!0))),h3(t.h3,"Generated CSS output"),d(y.styleQueriesGeneratedCss.code,y.styleQueriesGeneratedCss.lang,!1),h3(t.h3,"Query-only styles"),d(y.styleQueriesQueriesOnly.code,y.styleQueriesQueriesOnly.lang),h3(t.h3,"Container queries"),d(y.styleQueriesContainer.code,y.styleQueriesContainer.lang),h3(t.h3,"Feature queries"),d(y.styleQueriesFeature.code,y.styleQueriesFeature.lang),h3(t.h3,"Viewport breakpoints example"),d(y.styleQueriesExamples.code,y.styleQueriesExamples.lang),h2(t.h2,"Layout"),p(t.p,"Display, positioning, sizing, spacing, and overflow helpers pulled from the original docs."),h3(t.h3,"Display & position"),d(y.layoutDisplayPosition.code,y.layoutDisplayPosition.lang),h3(t.h3,"Sizing"),d(y.layoutSizing.code,y.layoutSizing.lang),h3(t.h3,"Spacing"),d(y.layoutSpacing.code,y.layoutSpacing.lang),h3(t.h3,"Overflow"),d(y.layoutOverflow.code,y.layoutOverflow.lang),div(t.demoContainer,{style:t.demoContainerStyle},div(s())),h2(t.h2,"Typography"),p(t.p,"Font and text styling helpers."),h3(t.h3,"Font properties"),d(y.typographyFont.code,y.typographyFont.lang),h3(t.h3,"Text styling"),d(y.typographyText.code,y.typographyText.lang),h3(t.h3,"Typography system example"),div(t.demoContainer,{style:t.demoContainerStyle},div(c()),div(d(y.typographySystem.code,y.typographySystem.lang,!0))),h2(t.h2,"Colors & Backgrounds"),h3(t.h3,"Colors"),d(y.colorsBasic.code,y.colorsBasic.lang),h3(t.h3,"Gradients"),div(t.demoContainer,{style:t.demoContainerStyle},div(m()),div(d(y.colorsGradients.code,y.colorsGradients.lang,!0))),h3(t.h3,"Background properties"),d(y.colorsBackground.code,y.colorsBackground.lang),h2(t.h2,"Flexbox"),p(t.p,"Container and item helpers, plus an example navbar layout."),h3(t.h3,"Container helpers"),d(y.flexContainer.code,y.flexContainer.lang),h3(t.h3,"Item helpers"),d(y.flexItem.code,y.flexItem.lang),h3(t.h3,"Navbar example"),div(t.demoContainer,{style:t.demoContainerStyle},div(f()),div(d(y.flexNavbarExample.code,y.flexNavbarExample.lang,!0))),h2(t.h2,"CSS Grid"),h3(t.h3,"Container helpers"),d(y.gridContainer.code,y.gridContainer.lang),h3(t.h3,"Item helpers"),d(y.gridItem.code,y.gridItem.lang),h3(t.h3,"Responsive card grid"),div(t.demoContainer,{style:t.demoContainerStyle},div(S()),div(d(y.gridResponsiveExample.code,y.gridResponsiveExample.lang,!0))),h2(t.h2,"Effects & Transitions"),p(t.p,"Shadows, opacity, transitions, transforms, filters, and hover-friendly reactive styles."),h3(t.h3,"Box shadows"),d(y.effectsShadows.code,y.effectsShadows.lang),h3(t.h3,"Visibility"),d(y.effectsVisibility.code,y.effectsVisibility.lang),h3(t.h3,"Transitions"),d(y.effectsTransitions.code,y.effectsTransitions.lang),h3(t.h3,"Transforms"),d(y.effectsTransforms.code,y.effectsTransforms.lang),h3(t.h3,"Filters & backdrop"),d(y.effectsFilters.code,y.effectsFilters.lang),h3(t.h3,"Hover effects with pseudo-classes"),p(t.p,"Use the built-in pseudo-class support for hover, focus, active, and more:"),d(y.styleQueriesPseudoClasses.code,y.styleQueriesPseudoClasses.lang),h3(t.h3,"Hover effects with reactive styles (alternative)"),div(t.demoContainer,{style:t.demoContainerStyle},div(b()),div(d(y.effectsHover.code,y.effectsHover.lang,!0))),h2(t.h2,"Organizing Styles"),p(t.p,"Reuse the theme + style modules from the legacy page: keep tokens, shared layout pieces, and component styles in one place."),h3(t.h3,"Theme constants"),d(y.organizingTheme.code,y.organizingTheme.lang),h3(t.h3,"Shared styles"),d(y.organizingStyles.code,y.organizingStyles.lang),h3(t.h3,"Using the styles"),div(t.demoContainer,{style:t.demoContainerStyle},div(v()),div(d(y.organizingUsage.code,y.organizingUsage.lang,!0))),h2(t.h2,"Next Steps"),ul(t.ul,li(t.li,"Explore ",P("CodeBlock")," + ",P("InlineCode")," components to present snippets cleanly."),li(t.li,"Combine ",P("createStyleQueries")," with the helpers above for responsive variants."),li(t.li,"Jump to the ",a({href:"#examples"},"Examples page")," to see these styles in action.")))}function na(){return div(t.pageContent,h1(t.pageTitle,"Common Pitfalls"),p(t.pageSubtitle,"Avoid these common mistakes when building with Nuclo. Learn the patterns that work and why."),h2(t.h2,{id:"conditional-elements"},"Conditional Element Rendering"),div(n(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Using a reactive function to conditionally return different elements won't work:"),d(`// ❌ Wrong - reactive function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // This won't display anything!
)`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Use ",P("when()")," for conditional element rendering:"),d(`// ✅ Correct - use when() for conditional elements
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(t.p,"Reactive functions ",P("() => value")," work great for text content and attribute values because Nuclo can update them in place. But elements need to be mounted/unmounted from the DOM, which requires ",P("when()")," to manage properly.")),h2(t.h2,{id:"forgetting-update"},"Forgetting to Call update()"),div(n(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Changing state without calling ",P("update()")," won't refresh the UI:"),d(`// ❌ Wrong - UI won't update
let count = 0;

button('Increment', on('click', () => {
  count++;  // State changed but UI stays the same
}))`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Always call ",P("update()")," after changing state:"),d(`// ✅ Correct - call update() to refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // Now the UI will reflect the new count
}))`,"typescript")),h2(t.h2,{id:"list-identity"},"Replacing Objects in Lists"),div(n(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Replacing objects instead of mutating them causes unnecessary DOM recreation:"),d(`// ❌ Wrong - creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Mutate the existing object to preserve its DOM element:"),d(`// ✅ Correct - mutate the object, element is preserved
todos[0].done = true;
update();`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(t.p,"Nuclo's ",P("list()")," tracks items by object identity (reference). When you replace an object with a new one, Nuclo sees it as a different item and recreates the DOM element. Mutating preserves identity and enables efficient updates.")),h2(t.h2,{id:"multiple-updates"},"Multiple update() Calls"),div(n(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Calling ",P("update()")," multiple times is wasteful:"),d(`// ❌ Inefficient - 3 updates instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
}`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Batch all state changes, then call ",P("update()")," once:"),d(`// ✅ Efficient - batch changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  update();  // One update for all changes
}`,"typescript")),h2(t.h2,{id:"static-vs-reactive"},"Static Values Instead of Reactive"),div(n(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(t.p,"Using a static value when you need it to update:"),d(`// ❌ Wrong - count is captured once, never updates
let count = 0;

div(
  \`Count: \${count}\`  // Always shows "Count: 0"
)`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(o.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(t.p,"Wrap in a function to make it reactive:"),d(`// ✅ Correct - function is called on each update()
let count = 0;

div(
  () => \`Count: \${count}\`  // Updates when count changes
)`,"typescript")),h2(t.h2,{id:"summary"},"Quick Reference"),div(n(padding("20px").backgroundColor(o.bgCard).borderRadius("12px").border(`1px solid ${o.border}`)),ul(t.ul,li(t.li,strong("Conditional elements:")," Use ",P("when()"),", not ",P("() => condition ? A : B")),li(t.li,strong("State changes:")," Always call ",P("update()")," after modifying state"),li(t.li,strong("Lists:")," Mutate objects, don't replace them"),li(t.li,strong("Batching:")," Group state changes before a single ",P("update()")),li(t.li,strong("Dynamic content:")," Wrap in ",P("() =>")," to make reactive"))))}const ia={counter:"example-counter",todo:"example-todo",subtasks:"example-subtasks",search:"example-search",async:"example-async",forms:"example-forms",nested:"example-nested",animations:"example-animations",routing:"example-routing","styled-card":"example-styled-card"},aa=n(backgroundColor(o.bgCard).padding("24px").borderRadius("12px").border(`1px solid ${o.border}`).cursor("pointer").transition("all 0.2s"),{hover:border(`1px solid ${o.primary}`).transform("translateY(-2px)").boxShadow("0 4px 12px rgba(0, 0, 0, 0.15)")}),sa=n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("8px")),la=n(fontSize("14px").color(o.textMuted).lineHeight("1.5")),ye=n(display("grid").gridTemplateColumns("repeat(auto-fill, minmax(300px, 1fr))").gap("20px").marginBottom("48px")),be=n(fontSize("20px").fontWeight("600").color(o.text).marginBottom("20px").marginTop("32px")),da=n(display("inline-block").padding("4px 8px").backgroundColor("rgba(132, 204, 22, 0.15)").color(o.primary).fontSize("11px").fontWeight("600").borderRadius("4px").marginLeft("8px").textTransform("uppercase"));function xe(e,r){const i=ia[e.id];return div(aa,on("click",()=>z(i)),div(sa,e.title,r?span(da,"Live Demo"):null),p(la,e.description))}const ca=["counter","todo","subtasks"],pa=["search","async","forms"],ua=["nested","animations","routing","styled-card"];function ve(e){return A.filter(r=>e.includes(r.id))}function ma(){const e=new Set(["counter","todo","subtasks","search","async","forms","nested","animations","routing","styled-card"]);return div(t.pageContent,h1(t.pageTitle,"Examples"),p(t.pageSubtitle,"Explore practical examples demonstrating Nuclo's features. Examples with live demos are marked with a badge."),h2(be,"Getting Started"),p(n(color(o.textMuted).marginBottom("16px")),"Simple examples to help you understand the basics."),div(ye,...ve(ca).map(r=>xe(r,e.has(r.id)))),h2(be,"Data & Forms"),p(n(color(o.textMuted).marginBottom("16px")),"Working with data, APIs, and form handling."),div(ye,...ve(pa).map(r=>xe(r,e.has(r.id)))),h2(be,"Advanced Patterns"),p(n(color(o.textMuted).marginBottom("16px")),"More complex patterns and techniques."),div(ye,...ve(ua).map(r=>xe(r,e.has(r.id)))),section(n(marginTop("48px").paddingTop("32px").borderTop(`1px solid ${o.border}`)),h2(t.h2,"More Examples"),p(t.p,"Find even more demos in the ",a({href:"https://github.com/dan2dev/nuclo/tree/main/examples",target:"_blank",rel:"noopener noreferrer"},n(color(o.primary)),"GitHub examples directory"),".")))}let te=0;const ga=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Ke=n(padding("10px 20px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),ha=n(padding("10px 20px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").fontWeight("500").cursor("pointer").transition("all 0.2s"));function fa(){return div(ga,div(t.flexBetween,div(h3(n(fontSize("48px").fontWeight("700").color(o.text).marginBottom("8px")),()=>te),p(n(fontSize("14px").color(o.textMuted)),"Current count")),div(t.flex,t.gap8,button(Ke,n(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"−",on("click",()=>{te--,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary,e.target.style.transform="scale(1)"})),button(Ke,n(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"+",on("click",()=>{te++,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary,e.target.style.transform="scale(1)"})),button(ha,"Reset",on("click",()=>{te=0,update()}),on("mouseenter",e=>{e.target.style.borderColor=o.primary}),on("mouseleave",e=>{e.target.style.borderColor=o.border})))))}function ya(){const e=A.find(r=>r.id==="counter");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),fa(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let M=[{id:1,text:"Learn Nuclo",done:!0},{id:2,text:"Build something awesome",done:!1},{id:3,text:"Share with friends",done:!1}],$="",Xe=4;const ba=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),xa=n(padding("10px 20px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),va=n(padding("10px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").width("220px").transition("border-color 0.2s"));function Sa(){const e=n(width("20px").height("20px").cursor("pointer")),r={accentColor:o.primary},i=n(display("flex").alignItems("center").gap("14px").padding("14px 16px").backgroundColor(o.bgLight).borderRadius("10px").marginBottom("10px").transition("all 0.2s")),s=n(marginLeft("auto").padding("6px 10px").backgroundColor("transparent").color(o.textDim).border("none").borderRadius("6px").cursor("pointer").fontSize("18px").transition("all 0.2s"));return div(ba,div(t.flex,t.gap8,t.mb24,input(va,{type:"text",placeholder:"Add a new task...",value:()=>$},on("input",l=>{$=l.target.value,update()}),on("keydown",l=>{l.key==="Enter"&&$.trim()&&(M.push({id:Xe++,text:$,done:!1}),$="",update())}),on("focus",l=>{l.target.style.borderColor=o.primary}),on("blur",l=>{l.target.style.borderColor=o.border})),button(xa,"Add Task",on("click",()=>{$.trim()&&(M.push({id:Xe++,text:$,done:!1}),$="",update())}),on("mouseenter",l=>{l.target.style.backgroundColor=o.primaryHover}),on("mouseleave",l=>{l.target.style.backgroundColor=o.primary}))),div(()=>`${M.filter(l=>!l.done).length} remaining · ${M.filter(l=>l.done).length} completed`,n(fontSize("13px").color(o.textDim).marginBottom("20px").fontWeight("500"))),when(()=>M.length>0,list(()=>M,l=>div(i,input(e,{style:r},{type:"checkbox",checked:()=>l.done},on("change",()=>{l.done=!l.done,update()})),span(()=>l.done?n(color(o.textDim).textDecoration("line-through").fontSize("15px")):n(color(o.text).fontSize("15px")),()=>l.text),button(s,"×",on("click",()=>{M=M.filter(c=>c.id!==l.id),update()}),on("mouseenter",c=>{c.target.style.backgroundColor="rgba(239, 68, 68, 0.1)",c.target.style.color="#ef4444"}),on("mouseleave",c=>{c.target.style.backgroundColor="transparent",c.target.style.color=o.textDim}))))).else(p(n(color(o.textDim).textAlign("center").padding("32px").fontSize("15px")),"No tasks yet. Add one above!")))}function ka(){const e=A.find(r=>r.id==="todo");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),Sa(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let ee=[{id:1,text:"Learn Nuclo basics",done:!0,expanded:!0,subtasks:[{id:2,text:"Read documentation",done:!0,expanded:!0,subtasks:[]},{id:3,text:"Try examples",done:!1,expanded:!0,subtasks:[]}]},{id:4,text:"Build a project",done:!1,expanded:!0,subtasks:[{id:5,text:"Setup environment",done:!0,expanded:!0,subtasks:[]},{id:6,text:"Write components",done:!1,expanded:!0,subtasks:[]}]}],wa=7,W="";const Ca=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Pa=n(padding("10px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").flex("1").transition("border-color 0.2s")),Ta=n(padding("10px 20px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Ba=n(marginBottom("8px")),Ra=n(display("flex").alignItems("center").gap("10px").padding("10px 14px").backgroundColor(o.bgLight).borderRadius("8px").transition("all 0.2s")),za=n(width("24px").height("24px").backgroundColor("transparent").border("none").color(o.textMuted).cursor("pointer").fontSize("12px").display("flex").alignItems("center").justifyContent("center").borderRadius("4px").transition("all 0.2s")),Ia=n(width("18px").height("18px").cursor("pointer")),Aa=n(marginLeft("auto").padding("4px 8px").backgroundColor("transparent").color(o.textDim).border("none").borderRadius("4px").cursor("pointer").fontSize("16px").transition("all 0.2s")),Ea=n(fontSize("12px").color(o.textDim).marginLeft("8px")),Na=n(marginLeft("34px").marginTop("8px")),Ma=n(marginLeft("34px").marginTop("8px")),$a=n(padding("6px 10px").backgroundColor(o.bg).color(o.text).border(`1px solid ${o.border}`).borderRadius("6px").fontSize("13px").outline("none").width("200px").transition("border-color 0.2s"));function Wa(e){return{id:wa++,text:e,done:!1,subtasks:[],expanded:!0}}function Ee(e,r){const i=Wa(e);r?r.subtasks.push(i):ee.push(i),update()}function Da(e){e.done=!e.done;function r(i,s){i.done=s,i.subtasks.forEach(l=>r(l,s))}r(e,e.done),update()}function La(e){e.expanded=!e.expanded,update()}function Fa(e,r){r?r.subtasks=r.subtasks.filter(i=>i.id!==e.id):ee=ee.filter(i=>i.id!==e.id),update()}function gt(e,r){let i="";return div(Ba,div(Ra,when(()=>e.subtasks.length>0,button(za,()=>e.expanded?"▼":"▶",on("click",()=>La(e)),on("mouseenter",s=>{s.target.style.backgroundColor=o.bgCard}),on("mouseleave",s=>{s.target.style.backgroundColor="transparent"}))).else(span(n(width("24px").display("inline-block")))),input(Ia,{style:{accentColor:o.primary}},{type:"checkbox",checked:()=>e.done},on("change",()=>Da(e))),span(n(fontSize("14px").transition("all 0.2s")),{style:()=>({color:e.done?o.textDim:o.text,textDecoration:e.done?"line-through":"none"})},()=>e.text),when(()=>e.subtasks.length>0,span(Ea,()=>`(${e.subtasks.filter(s=>s.done).length}/${e.subtasks.length})`)),button(Aa,"×",on("click",()=>Fa(e,r)),on("mouseenter",s=>{s.target.style.backgroundColor="rgba(239, 68, 68, 0.1)",s.target.style.color="#ef4444"}),on("mouseleave",s=>{s.target.style.backgroundColor="transparent",s.target.style.color=o.textDim}))),when(()=>e.expanded&&e.subtasks.length>0,div(Na,list(()=>e.subtasks,s=>gt(s,e)))),when(()=>e.expanded,div(Ma,input($a,{type:"text",placeholder:"Add subtask...",value:()=>i},on("input",s=>{i=s.target.value,update()}),on("keydown",s=>{s.key==="Enter"&&i.trim()&&(Ee(i.trim(),e),i="",update())}),on("focus",s=>{s.target.style.borderColor=o.primary}),on("blur",s=>{s.target.style.borderColor=o.border})))))}function Ha(){return div(Ca,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"Tasks with Subtasks"),div(t.flex,t.gap8,t.mb24,input(Pa,{type:"text",placeholder:"Add a new task...",value:()=>W},on("input",e=>{W=e.target.value,update()}),on("keydown",e=>{e.key==="Enter"&&W.trim()&&(Ee(W.trim()),W="",update())}),on("focus",e=>{e.target.style.borderColor=o.primary}),on("blur",e=>{e.target.style.borderColor=o.border})),button(Ta,"Add Task",on("click",()=>{W.trim()&&(Ee(W.trim()),W="",update())}),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary}))),when(()=>ee.length>0,div(list(()=>ee,e=>gt(e)))).else(p(n(color(o.textDim).textAlign("center").padding("32px")),"No tasks yet. Add one above!")))}function ja(){const e=A.find(r=>r.id==="subtasks");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),Ha(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}const Oa=[{id:1,name:"Alice Johnson",email:"alice@example.com",role:"Admin"},{id:2,name:"Bob Smith",email:"bob@example.com",role:"User"},{id:3,name:"Charlie Brown",email:"charlie@example.com",role:"User"},{id:4,name:"Diana Prince",email:"diana@example.com",role:"Admin"},{id:5,name:"Eve Anderson",email:"eve@example.com",role:"User"}];let J="",de="all";const Ua=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Ga=n(padding("10px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").flex("1").minWidth("200px").transition("border-color 0.2s")),Qa=n(padding("10px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").cursor("pointer").transition("border-color 0.2s")),Va=n(padding("16px").backgroundColor(o.bgLight).borderRadius("10px").marginBottom("12px").transition("all 0.2s")),qa=n(display("inline-block").padding("4px 10px").borderRadius("20px").fontSize("12px").fontWeight("600"));function Se(){const e=J.toLowerCase();return Oa.filter(r=>{const i=r.name.toLowerCase().includes(e)||r.email.toLowerCase().includes(e),s=de==="all"||r.role===de;return i&&s})}function _a(){return div(Ua,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"User Directory"),div(t.flex,t.gap16,t.mb24,n(flexWrap("wrap")),input(Ga,{type:"search",placeholder:"Search by name or email...",value:()=>J},on("input",e=>{J=e.target.value,update()}),on("focus",e=>{e.target.style.borderColor=o.primary}),on("blur",e=>{e.target.style.borderColor=o.border})),select(Qa,{value:()=>de},on("change",e=>{de=e.target.value,update()}),on("focus",e=>{e.target.style.borderColor=o.primary}),on("blur",e=>{e.target.style.borderColor=o.border}),option({value:"all"},"All Roles"),option({value:"Admin"},"Admins"),option({value:"User"},"Users"))),p(n(fontSize("13px").color(o.textDim).marginBottom("16px")),()=>{const e=Se().length;return`Showing ${e} user${e!==1?"s":""}`}),when(()=>Se().length>0,div(list(()=>Se(),e=>div(Va,on("mouseenter",r=>{r.currentTarget.style.backgroundColor=o.bgCard}),on("mouseleave",r=>{r.currentTarget.style.backgroundColor=o.bgLight}),div(t.flexBetween,div(h4(n(fontSize("15px").fontWeight("600").color(o.text).marginBottom("4px")),e.name),p(n(fontSize("13px").color(o.textMuted).margin("0")),e.email)),span(qa,{style:{backgroundColor:e.role==="Admin"?"rgba(132, 204, 22, 0.15)":"rgba(100, 116, 139, 0.15)",color:e.role==="Admin"?o.primary:o.textMuted}},e.role)))))).else(div(n(textAlign("center").padding("32px").color(o.textDim)),()=>J?`No users found matching "${J}"`:"No users found")))}function Ya(){const e=A.find(r=>r.id==="search");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),_a(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let B={status:"idle",products:[]},N="phone";const Ja=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Ka=n(padding("10px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").flex("1").transition("border-color 0.2s")),Xa=n(padding("10px 20px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Za={backgroundColor:o.bgLight,color:o.textDim,cursor:"not-allowed"},es=n(display("grid").gap("12px").marginTop("20px")),ts=n(padding("16px").backgroundColor(o.bgLight).borderRadius("10px").transition("all 0.2s")),os=n(textAlign("center").padding("32px").color(o.textMuted)),rs=n(padding("16px").backgroundColor("rgba(239, 68, 68, 0.1)").borderRadius("8px").color("#ef4444").marginTop("16px"));async function ke(){if(N.trim()){B.status="loading",B.error=void 0,update();try{const e=await fetch(`https://dummyjson.com/products/search?q=${N}`);if(!e.ok)throw new Error("Failed to fetch products");const r=await e.json();B.products=r.products.slice(0,6),B.status="success"}catch(e){B.status="error",B.error=e.message}update()}}function ns(){return div(Ja,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"Product Search"),div(t.flex,t.gap8,input(Ka,{type:"search",placeholder:"Search products...",value:()=>N,disabled:()=>B.status==="loading"},on("input",e=>{N=e.target.value,update()}),on("keydown",e=>{e.key==="Enter"&&ke()}),on("focus",e=>{e.target.style.borderColor=o.primary}),on("blur",e=>{e.target.style.borderColor=o.border})),button(Xa,{disabled:()=>B.status==="loading"||!N.trim(),style:()=>B.status==="loading"||!N.trim()?Za:{}},()=>B.status==="loading"?"Searching...":"Search",on("click",ke),on("mouseenter",e=>{B.status!=="loading"&&N.trim()&&(e.target.style.backgroundColor=o.primaryHover)}),on("mouseleave",e=>{B.status!=="loading"&&N.trim()&&(e.target.style.backgroundColor=o.primary)}))),when(()=>B.status==="loading",div(os,"Loading products...")).when(()=>B.status==="error",div(rs,t.flexBetween,span(()=>`Error: ${B.error}`),button(n(padding("6px 12px").backgroundColor("transparent").color("#ef4444").border("1px solid #ef4444").borderRadius("6px").fontSize("13px").cursor("pointer")),"Retry",on("click",ke)))).when(()=>B.status==="success"&&B.products.length>0,div(p(n(fontSize("13px").color(o.textDim).marginTop("16px")),()=>`Found ${B.products.length} products`),div(es,{style:{gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))"}},list(()=>B.products,e=>div(ts,on("mouseenter",r=>{r.currentTarget.style.backgroundColor=o.bgCard}),on("mouseleave",r=>{r.currentTarget.style.backgroundColor=o.bgLight}),h4(n(fontSize("14px").fontWeight("600").color(o.text).marginBottom("6px")),e.title),p(n(fontSize("12px").color(o.textDim).margin("0 0 8px 0")),e.category),p(n(fontSize("16px").fontWeight("700").color(o.primary).margin("0")),`$${e.price.toFixed(2)}`)))))).when(()=>B.status==="success"&&B.products.length===0,div(n(textAlign("center").padding("32px").color(o.textDim)),()=>`No products found for "${N}"`)).else(div(n(textAlign("center").padding("32px").color(o.textDim)),"Enter a search term and click Search")))}function is(){const e=A.find(r=>r.id==="async");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),ns(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let D={username:"",email:"",password:"",confirmPassword:""},I={},L=!1,ie="idle";const as=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),ss=n(marginBottom("20px")),ls=n(display("block").fontSize("14px").fontWeight("500").color(o.text).marginBottom("8px")),ds=n(width("100%").padding("12px 14px").backgroundColor(o.bgLight).color(o.text).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").outline("none").transition("border-color 0.2s")),cs={borderColor:"#ef4444"},ps=n(fontSize("12px").color("#ef4444").marginTop("6px")),us=n(width("100%").padding("14px 20px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s").marginTop("8px")),ms={backgroundColor:o.bgLight,color:o.textDim,cursor:"not-allowed"},gs=n(padding("16px").backgroundColor("rgba(132, 204, 22, 0.1)").borderRadius("8px").color(o.primary).marginBottom("20px").textAlign("center"));function hs(){return I={},D.username.length<3&&(I.username="Username must be at least 3 characters"),D.email.includes("@")||(I.email="Please enter a valid email"),D.password.length<6&&(I.password="Password must be at least 6 characters"),D.password!==D.confirmPassword&&(I.confirmPassword="Passwords do not match"),Object.keys(I).length===0}async function fs(e){if(e.preventDefault(),!hs()){update();return}L=!0,ie="idle",update();try{await new Promise(r=>setTimeout(r,1e3)),ie="success",D={username:"",email:"",password:"",confirmPassword:""}}catch{ie="error"}L=!1,update()}function oe(e,r,i,s){return div(ss,label(ls,r),input(ds,{type:i,placeholder:s,value:()=>D[e],disabled:()=>L,style:()=>I[e]?cs:{}},on("input",l=>{D[e]=l.target.value,delete I[e],update()}),on("focus",l=>{I[e]||(l.target.style.borderColor=o.primary)}),on("blur",l=>{I[e]||(l.target.style.borderColor=o.border)})),when(()=>!!I[e],span(ps,()=>I[e])))}function ys(){return div(as,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"Sign Up"),when(()=>ie==="success",div(gs,"Account created successfully!")),form(on("submit",fs),oe("username","Username","text","Enter username"),oe("email","Email","email","Enter email"),oe("password","Password","password","Enter password"),oe("confirmPassword","Confirm Password","password","Confirm password"),button(us,{type:"submit",disabled:()=>L,style:()=>L?ms:{}},()=>L?"Creating account...":"Sign Up",on("mouseenter",e=>{L||(e.target.style.backgroundColor=o.primaryHover)}),on("mouseleave",e=>{L||(e.target.style.backgroundColor=o.primary)}))))}function bs(){const e=A.find(r=>r.id==="forms");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),ys(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let ht=[{id:1,name:"Alice",avatar:"A",bio:"Software developer",followers:142},{id:2,name:"Bob",avatar:"B",bio:"Designer",followers:89},{id:3,name:"Charlie",avatar:"C",bio:"Product manager",followers:234}];const xs=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),vs=n(display("grid").gap("16px")),Ss=n(padding("20px").backgroundColor(o.bgLight).borderRadius("12px").transition("all 0.2s")),ks=n(width("48px").height("48px").borderRadius("50%").backgroundColor(o.primary).color(o.bg).display("flex").alignItems("center").justifyContent("center").fontSize("20px").fontWeight("600").marginBottom("12px")),ws=n(fontSize("16px").fontWeight("600").color(o.text).marginBottom("4px")),Cs=n(fontSize("14px").color(o.textMuted).marginBottom("12px")),Ps=n(fontSize("13px").color(o.textDim).marginBottom("12px")),Ts=n(padding("8px 16px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("6px").fontSize("13px").fontWeight("600").cursor("pointer").transition("all 0.2s"));function Bs(e){const r=ht.find(i=>i.id===e);r&&(r.followers++,update())}function Rs(e){return div(Ss,on("mouseenter",r=>{r.currentTarget.style.backgroundColor=o.bgCard,r.currentTarget.style.transform="translateY(-2px)"}),on("mouseleave",r=>{r.currentTarget.style.backgroundColor=o.bgLight,r.currentTarget.style.transform="translateY(0)"}),div(ks,e.avatar),h4(ws,e.name),p(Cs,e.bio),p(Ps,()=>`${e.followers} followers`),button(Ts,"Follow",on("click",()=>Bs(e.id)),on("mouseenter",r=>{r.target.style.backgroundColor=o.primaryHover}),on("mouseleave",r=>{r.target.style.backgroundColor=o.primary})))}function zs(e){return div(vs,{style:{gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))"}},list(()=>e,r=>Rs(r)))}function Is(){return div(xs,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"User Directory"),p(n(fontSize("14px").color(o.textMuted).marginBottom("20px")),"This example shows reusable component functions."),zs(ht))}function As(){const e=A.find(r=>r.id==="nested");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),Is(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let Y=!1;const Es=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Ns=n(padding("12px 24px").backgroundColor(o.primary).color(o.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s").marginBottom("24px")),Ms=n(width("200px").height("200px").borderRadius("16px").display("flex").alignItems("center").justifyContent("center").fontSize("16px").fontWeight("600").color(o.bg).margin("0 auto"));function $s(){const e="nuclo-demo-pulse-keyframes";if(document.getElementById(e))return;const r=document.createElement("style");r.id=e,r.textContent="@keyframes pulse { from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.08); opacity: 1; } }",document.head.appendChild(r)}function Ws(){return $s(),div(Es,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"Animation Demo"),div(n(textAlign("center")),button(Ns,()=>Y?"Stop Animation":"Start Animation",on("click",()=>{Y=!Y,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=o.primaryHover}),on("mouseleave",e=>{e.target.style.backgroundColor=o.primary})),div(Ms,{style:()=>({animation:Y?"pulse 600ms ease-in-out infinite alternate":"none",willChange:Y?"transform, opacity":"auto",background:`linear-gradient(135deg, ${o.primary} 0%, ${o.primaryDark} 100%)`})},"Animated Box")))}function Ds(){const e=A.find(r=>r.id==="animations");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),Ws(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let O="home";const Ls=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Fs=n(display("flex").gap("8px").marginBottom("24px").paddingBottom("16px").borderBottom(`1px solid ${o.border}`)),Hs=n(padding("10px 20px").backgroundColor("transparent").color(o.textMuted).border(`1px solid ${o.border}`).borderRadius("8px").fontSize("14px").fontWeight("500").cursor("pointer").transition("all 0.2s")),js={backgroundColor:o.primary,color:o.bg,borderColor:o.primary},$e=n(padding("24px").backgroundColor(o.bgLight).borderRadius("12px").minHeight("150px")),We=n(fontSize("20px").fontWeight("600").color(o.text).marginBottom("12px")),De=n(fontSize("14px").color(o.textMuted).lineHeight("1.6")),Le=n(padding("8px 16px").backgroundColor(o.bgCard).color(o.primary).border(`1px solid ${o.border}`).borderRadius("6px").fontSize("13px").cursor("pointer").transition("all 0.2s").marginTop("16px"));function ue(e){O=e,update()}function Os(){return div($e,h3(We,"Home Page"),p(De,"Welcome to our website! This is a simple client-side routing example."),button(Le,"Go to About →",on("click",()=>ue("about")),on("mouseenter",e=>{e.target.style.borderColor=o.primary}),on("mouseleave",e=>{e.target.style.borderColor=o.border})))}function Us(){return div($e,h3(We,"About Page"),p(De,"Learn more about us. We're passionate about building great software."),button(Le,"Go to Contact →",on("click",()=>ue("contact")),on("mouseenter",e=>{e.target.style.borderColor=o.primary}),on("mouseleave",e=>{e.target.style.borderColor=o.border})))}function Gs(){return div($e,h3(We,"Contact Page"),p(De,"Get in touch! We'd love to hear from you."),button(Le,"Go Home →",on("click",()=>ue("home")),on("mouseenter",e=>{e.target.style.borderColor=o.primary}),on("mouseleave",e=>{e.target.style.borderColor=o.border})))}function we(e,r){return button(Hs,{style:()=>O===r?js:{}},e,on("click",()=>ue(r)),on("mouseenter",i=>{O!==r&&(i.target.style.borderColor=o.primary,i.target.style.color=o.primary)}),on("mouseleave",i=>{O!==r&&(i.target.style.borderColor=o.border,i.target.style.color=o.textMuted)}))}function Qs(){return div(Ls,h3(n(fontSize("18px").fontWeight("600").color(o.text).marginBottom("20px")),"Mini Router Demo"),nav(Fs,we("Home","home"),we("About","about"),we("Contact","contact")),when(()=>O==="home",Os()).when(()=>O==="about",Us()).when(()=>O==="contact",Gs()))}function Vs(){const e=A.find(r=>r.id==="routing");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),Qs(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}let qs=[{id:1,name:"Wireless Headphones",description:"Premium noise-canceling headphones with 30-hour battery.",price:299.99,image:"🎧",inStock:!0},{id:2,name:"Smart Watch",description:"Track your fitness, receive notifications, and more.",price:399.99,image:"⌚",inStock:!0},{id:3,name:"Portable Speaker",description:"Waterproof speaker with incredible bass and clarity.",price:149.99,image:"🔊",inStock:!1}];const _s=n(backgroundColor(o.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${o.border}`).marginBottom("32px")),Ys=n(textAlign("center").marginBottom("24px")),Js=n(fontSize("24px").fontWeight("700").color(o.text).marginBottom("8px")),Ks=n(fontSize("14px").color(o.textMuted)),Xs=n(display("grid").gap("20px")),Zs=n(backgroundColor(o.bgLight).borderRadius("12px").overflow("hidden").transition("all 0.3s").cursor("pointer"),{hover:boxShadow("0 10px 40px rgba(0,0,0,0.2)").transform("translateY(-4px)")}),el=n(position("relative").height("140px").display("flex").alignItems("center").justifyContent("center").fontSize("48px")),tl=n(position("absolute").top("0").left("0").right("0").bottom("0").backgroundColor("rgba(0,0,0,0.6)").display("flex").alignItems("center").justifyContent("center")),ol=n(color("white").fontSize("14px").fontWeight("600")),rl=n(padding("16px")),nl=n(fontSize("16px").fontWeight("600").color(o.text).marginBottom("8px")),il=n(fontSize("13px").color(o.textMuted).lineHeight("1.5").marginBottom("16px")),al=n(display("flex").justifyContent("space-between").alignItems("center")),sl=n(fontSize("18px").fontWeight("700").color(o.primary)),ll=n(padding("8px 16px").borderRadius("6px").border("none").fontSize("13px").fontWeight("600").cursor("pointer").transition("all 0.2s"),{hover:backgroundColor(o.primaryHover)});function dl(e){return div(Zs,div(el,{style:{background:`linear-gradient(135deg, ${o.bgCard} 0%, ${o.bgLight} 100%)`}},span(n(transition("transform 0.3s"),{hover:transform("scale(1.1)")}),e.image),when(()=>!e.inStock,div(tl,span(ol,"Out of Stock")))),div(rl,h4(nl,e.name),p(il,e.description),div(al,span(sl,`$${e.price.toFixed(2)}`),button(ll,{style:()=>({backgroundColor:e.inStock?o.primary:o.bgCard,color:e.inStock?o.bg:o.textDim,cursor:e.inStock?"pointer":"not-allowed"})},on("click",()=>{e.inStock&&alert(`Added ${e.name} to cart!`)}),e.inStock?"Add to Cart":"Unavailable"))))}function cl(){return div(_s,div(Ys,h3(Js,"Featured Products"),p(Ks,"Discover our latest collection")),div(Xs,{style:{gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))"}},list(()=>qs,e=>dl(e))))}function pl(){const e=A.find(r=>r.id==="styled-card");return div(t.pageContent,a(n(color(o.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),z("examples")})),h1(t.pageTitle,e.title),p(t.pageSubtitle,e.description),cl(),h2(t.h2,"Source Code"),d(e.code,"typescript"))}Ti();Bi();const ml=div(Qi(),main({style:{minHeight:"calc(100vh - 160px)",paddingTop:"40px"}},when(()=>R()==="home",Zi()).when(()=>R()==="getting-started",ea()).when(()=>R()==="core-api",ta()).when(()=>R()==="tag-builders",oa()).when(()=>R()==="styling",ra()).when(()=>R()==="pitfalls",na()).when(()=>R()==="examples",ma()).when(()=>R()==="example-counter",ya()).when(()=>R()==="example-todo",ka()).when(()=>R()==="example-subtasks",ja()).when(()=>R()==="example-search",Ya()).when(()=>R()==="example-async",is()).when(()=>R()==="example-forms",bs()).when(()=>R()==="example-nested",As()).when(()=>R()==="example-animations",Ds()).when(()=>R()==="example-routing",Vs()).when(()=>R()==="example-styled-card",pl())),Vi());render(ml,document.getElementById("app"));
