(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))s(l);new MutationObserver(l=>{for(const c of l)if(c.type==="childList")for(const m of c.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&s(m)}).observe(document,{childList:!0,subtree:!0});function i(l){const c={};return l.integrity&&(c.integrity=l.integrity),l.referrerPolicy&&(c.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?c.credentials="include":l.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function s(l){if(l.ep)return;l.ep=!0;const c=i(l);fetch(l.href,c)}})();function ge(e){return e===null||typeof e!="object"&&typeof e!="function"}function re(e){return e instanceof Node}function J(e){return typeof e=="object"&&e!==null}function Ue(e){return J(e)&&"tagName"in e}function F(e){return typeof e=="function"}function tt(e){return F(e)&&e.length===0}function pe(e,r){try{return e()}catch{return r}}const O=typeof window<"u"&&typeof document<"u";function ot(e){if(!e?.parentNode)return!1;try{return e.parentNode.removeChild(e),!0}catch{return!1}}function We(e){if(!O)return null;try{return document.createComment(e)}catch{return null}}function $e(e){return We(e)}function K(e,r="hidden"){try{return document.createComment(`conditional-${e}-${r}`)}catch{return null}}function yt(e){if(!O)throw Error("Cannot create comment in non-browser environment");const r=We(`${e}-${Math.random().toString(36).slice(2)}`);if(!r)throw Error("Failed to create comment");return r}function rt(e){const r=We(e+"-end");if(!r)throw Error("Failed to create end comment");return{start:yt(e+"-start"),end:r}}function Oe(e){return!!e&&(typeof e.isConnected=="boolean"?e.isConnected:!(!O||typeof document>"u")&&document.contains(e))}function Ge(e,r){if(!e?.parentNode)return!1;try{return e.parentNode.replaceChild(r,e),!0}catch{return!1}}const Pe=new Map,ae=new Map;function nt(e,r){r.attributeResolvers.forEach(({resolver:i,applyValue:s},l)=>{try{s(pe(i))}catch{}})}function he(e,r,i,s){if(!(e instanceof Element&&r&&typeof i=="function"))return;const l=(function(c){let m=ae.get(c);return m||(m={attributeResolvers:new Map},ae.set(c,m)),m})(e);l.attributeResolvers.set(r,{resolver:i,applyValue:s});try{s(pe(i))}catch{}if(!l.updateListener){const c=()=>nt(0,l);e.addEventListener("update",c),l.updateListener=c}}function bt(e,r,i){try{return i==null||i===""?(e.style[r]="",!0):(e.style[r]=i+"",!0)}catch{return!1}}function Qe(e,r){if(e?.style&&r)for(const[i,s]of Object.entries(r))bt(e,i,s)||void 0}const Ve="__nuclo_reactive_className__",G="__nuclo_static_className__";function xt(e,r,i,s=!1){if(i==null)return;if(r==="style")return c=i,void((l=e)&&(F(c)?he(l,"style",()=>{try{return c()}catch{return null}},f=>{Qe(l,f)}):Qe(l,c)));var l,c;const m=(f,b=!1)=>{if(f!=null)if(r==="className"&&e instanceof HTMLElement&&b)(function(y,g){if(!g)return;const u=y.className;if(u&&u!==g){const x=new Set(u.split(" ").filter(k=>k));g.split(" ").filter(k=>k).forEach(k=>x.add(k)),y.className=Array.from(x).join(" ")}else y.className=g})(e,f+"");else if(e instanceof Element&&e.namespaceURI==="http://www.w3.org/2000/svg")e.setAttribute(r+"",f+"");else if(r in e)try{e[r]=f}catch{e instanceof Element&&e.setAttribute(r+"",f+"")}else e instanceof Element&&e.setAttribute(r+"",f+"")};if(F(i)&&i.length===0){const f=i;r==="className"&&e instanceof HTMLElement?((function(b){b[G]||(b[G]=new Set(b.className.split(" ").filter(y=>y))),b[Ve]=!0})(e),he(e,r+"",f,b=>{(function(y,g){const u=(function(x){return x[G]})(y);if(u&&u.size>0&&g){const x=new Set(u);g.split(" ").filter(k=>k).forEach(k=>x.add(k)),y.className=Array.from(x).join(" ")}else y.className=g||(u&&u.size>0?Array.from(u).join(" "):"")})(e,(b||"")+"")})):he(e,r+"",f,b=>{m(b,!1)})}else{if(r==="className"&&e instanceof HTMLElement&&(function(f){return!!f[Ve]})(e)){const f=(i||"")+"";if(f){(function(y,g){g&&(y[G]||(y[G]=new Set),g.split(" ").filter(u=>u).forEach(u=>{y[G].add(u)}))})(e,f);const b=new Set(e.className.split(" ").filter(y=>y));f.split(" ").filter(y=>y).forEach(y=>b.add(y)),e.className=Array.from(b).join(" ")}return}m(i,s)}}function fe(e,r,i=!0){if(r)for(const s of Object.keys(r))xt(e,s,r[s],i&&s==="className")}const j=new WeakMap;function vt(e,r,i){if(!F(e)||e.length!==0||!(function(l){const{value:c,error:m}=(function(f){const b=j.get(f);if(b)return b;try{const y={value:f(),error:!1};return j.set(f,y),y}catch{const y={value:void 0,error:!0};return j.set(f,y),y}})(l);return!m&&typeof c=="boolean"})(e))return!1;const s=r.filter((l,c)=>c!==i);return s.length!==0&&s.some(l=>!!(J(l)||re(l)||F(l)&&l.length>0))}function ne(e,r,i){if(r==null)return null;if(F(r)){if(tt(r))try{let c=j.get(r);if(c||(c={value:r(),error:!1},j.set(r,c)),c.error)return ye(i,()=>"");const m=c.value;if(J(m)&&!re(m)&&"className"in m&&typeof m.className=="string"&&Object.keys(m).length===1){const f=r;return fe(e,{className:()=>f().className}),null}return ge(m)&&m!=null?ye(i,r,m):null}catch{return j.set(r,{value:void 0,error:!0}),ye(i,()=>"")}const l=r(e,i);return l==null?null:ge(l)?_e(i,l):re(l)?l:(J(l)&&fe(e,l),null)}const s=r;return s==null?null:ge(s)?_e(i,s):re(s)?s:(J(s)&&fe(e,s),null)}function ye(e,r,i){const s=document.createDocumentFragment(),l=$e(` text-${e} `);l&&s.appendChild(l);const c=(function(m,f){if(typeof m!="function")return document.createTextNode("");const b=arguments.length>1?f:pe(m,""),y=b===void 0?"":b+"",g=document.createTextNode(y);return Pe.set(g,{resolver:m,lastValue:y}),g})(r,i);return s.appendChild(c),s}function _e(e,r){const i=document.createDocumentFragment(),s=$e(` text-${e} `);s&&i.appendChild(s);const l=document.createTextNode(r+"");return i.appendChild(l),i}const Te=new Set;function _(e,r){e._conditionalInfo=r,Te.add(e)}function ue(e,r,i=0){if(!r||r.length===0)return{element:e,nextIndex:i,appended:0};let s=i,l=0;const c=e;for(let m=0;r.length>m;m+=1){const f=r[m];if(f==null)continue;const b=ne(e,f,s);b&&(b.parentNode!==c&&c.appendChild(b),s+=1,l+=1)}return{element:e,nextIndex:s,appended:l}}function Be(e,r){const i=document.createElement(e);return ue(i,r,0),i}function Re(e,r){const i=document.createElementNS("http://www.w3.org/2000/svg",e);return ue(i,r,0),i}function St(e){return(...r)=>(function(i,...s){return(l,c)=>{const{condition:m,otherModifiers:f}=(function(y){const g=(function(u){for(let x=0;u.length>x;x+=1)if(vt(u[x],u,x))return x;return-1})(y);return g===-1?{condition:null,otherModifiers:y}:{condition:y[g],otherModifiers:y.filter((u,x)=>x!==g)}})(s);if(m)return(function(y,g,u){const x=g();if(!O)return x?Be(y,u):K(y,"ssr");const k={condition:g,tagName:y,modifiers:u,isSvg:!1};if(x){const P=Be(y,u);return _(P,k),P}const C=K(y);if(!C)throw Error("Failed to create conditional comment for "+y);return _(C,k),C})(i,m,f);const b=document.createElement(i);return ue(b,f,c),b}})(e,...r)}function kt(e){return(...r)=>(function(i,...s){return(l,c)=>{const m=s.findIndex(b=>typeof b=="function"&&b.length===0);if(m!==-1){const b=s[m],y=s.filter((g,u)=>u!==m);return(function(g,u,x){const k=u();if(!O)return k?Re(g,x):K(g,"ssr");const C={condition:u,tagName:g,modifiers:x,isSvg:!0};if(k){const E=Re(g,x);return _(E,C),E}const P=K(g);if(!P)throw Error("Failed to create conditional comment for "+g);return _(P,C),P})(i,b,y)}const f=document.createElementNS("http://www.w3.org/2000/svg",i);return ue(f,s,c),f}})(e,...r)}const wt=["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","menu","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","script","search","section","select","slot","small","source","span","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u","ul","var","video","wbr"],Ct=["a","animate","animateMotion","animateTransform","circle","clipPath","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","foreignObject","g","image","line","linearGradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialGradient","rect","script","set","stop","style","svg","switch","symbol","text","textPath","title","tspan","use","view"];function Pt(e=globalThis){const r="__nuclo_tags_registered";e[r]||(Ct.forEach(i=>(function(s,l){const c=l+"Svg";c in s||(s[c]=kt(l))})(e,i)),wt.forEach(i=>(function(s,l){l in s&&typeof s[l]!="function"||(s[l]=St(l))})(e,i)),e[r]=!0)}const ze=new Set;function Tt(e,r,i){return(function(s,l,c){if(F(s)){const m=s(l,c);return m&&Ue(m)?m:null}return s&&Ue(s)?s:null})(e.renderItem(r,i),e.host,i)}function Bt(e){ot(e.element)}function it(e){const{host:r,startMarker:i,endMarker:s}=e,l=i.parentNode??r,c=e.itemsProvider();if((function(u,x){if(u===x)return!0;if(u.length!==x.length)return!1;for(let k=0;u.length>k;k++)if((k in u?u[k]:void 0)!==(k in x?x[k]:void 0))return!1;return!0})(e.lastSyncedItems,c))return;const m=new Map,f=new Map;e.records.forEach(u=>{const x=f.get(u.item);x?x.push(u):f.set(u.item,[u])}),c.forEach((u,x)=>{if(e.lastSyncedItems.length>x&&e.lastSyncedItems[x]===u){const k=e.records[x];if(k&&k.item===u){m.set(x,k);const C=f.get(u);if(C){const P=C.indexOf(k);0>P||(C.splice(P,1),C.length===0&&f.delete(u))}}}});const b=[],y=new Set(e.records);let g=s;for(let u=c.length-1;u>=0;u--){const x=c[u];let k=m.get(u);if(!k){const P=f.get(x);P&&P.length>0&&(k=P.shift(),P.length===0&&f.delete(x))}if(k)y.delete(k);else{const P=Tt(e,x,u);if(!P)continue;k={item:x,element:P}}b.unshift(k);const C=k.element;C.nextSibling!==g&&l.insertBefore(C,g),g=C}y.forEach(Bt),e.records=b,e.lastSyncedItems=[...c]}function Rt(e,r){return(i,s)=>(function(c,m,f){const{start:b,end:y}=rt("list"),g={itemsProvider:c,renderItem:m,startMarker:b,endMarker:y,records:[],host:f,lastSyncedItems:[]},u=f;return u.appendChild(b),u.appendChild(y),ze.add(g),it(g),g})(e,r,i).startMarker}function at(e,r){try{return e()}catch(i){if(r)return r(i),!1;throw i}}function zt(e,r){return typeof e=="function"?at(e,r):!!e}function It(e,r,i,s){return F(e)?tt(e)?(j.delete(e),ne(r,e,i)):(function(l,c,m){const f=l,b=f.appendChild.bind(f),y=f.insertBefore.bind(f);f.appendChild=function(g){return y(g,c)};try{return m()}finally{f.appendChild=b}})(r,s,()=>{const l=ne(r,e,i);return l&&!l.parentNode?l:null}):ne(r,e,i)}const Ie=new Set;function qe(e){const{groups:r,elseContent:i,host:s,index:l,endMarker:c}=e,m=(function(b,y){for(let g=0;b.length>g;g++)if(zt(b[g].condition))return g;return y.length>0?-1:null})(r,i);if(m===e.activeIndex||((function(b,y){let g=b.nextSibling;for(;g&&g!==y;){const u=g.nextSibling;ot(g),g=u}})(e.startMarker,e.endMarker),e.activeIndex=m,m===null))return;const f=(function(b,y,g,u){const x=[];for(const k of b){const C=It(k,y,g,u);C&&x.push(C)}return x})(0>m?i:r[m].content,s,l,c);(function(b,y){const g=y.parentNode;g&&b.forEach(u=>(function(x,k,C){if(!x||!k)return!1;try{return x.insertBefore(k,C),!0}catch{return!1}})(g,u,y))})(f,c)}class At{groups=[];elseContent=[];constructor(r,...i){this.groups.push({condition:r,content:i})}when(r,...i){return this.groups.push({condition:r,content:i}),this}else(...r){return this.elseContent=r,this}render(r,i){if(!O)return $e("when-ssr")||null;const{start:s,end:l}=rt("when"),c={startMarker:s,endMarker:l,host:r,index:i,groups:[...this.groups],elseContent:[...this.elseContent],activeIndex:null,update:()=>qe(c)};(function(f){Ie.add(f)})(c);const m=r;return m.appendChild(s),m.appendChild(l),qe(c),s}}function Ae(e){return Object.assign((r,i)=>e.render(r,i),{when:(r,...i)=>(e.when(r,...i),Ae(e)),else:(...r)=>(e.else(...r),Ae(e))})}function Et(e,...r){return Ae(new At(e,...r))}const Nt=[function(){ze.forEach(e=>{e.startMarker.isConnected&&e.endMarker.isConnected?it(e):ze.delete(e)})},function(){Ie.forEach(e=>{try{e.update()}catch{Ie.delete(e)}})},function(){if(O)try{Te.forEach(e=>{e.isConnected?(function(r){const i=(function(c){return c._conditionalInfo??null})(r);if(!i)return;const s=at(i.condition,c=>{}),l=r.nodeType===Node.ELEMENT_NODE;if(s&&!l){const c=(function(m){try{return m.isSvg?Re(m.tagName,m.modifiers):Be(m.tagName,m.modifiers)}catch{return m.isSvg?document.createElementNS("http://www.w3.org/2000/svg",m.tagName):document.createElement(m.tagName)}})(i);_(c,i),Ge(r,c)}else if(!s&&l){const c=K(i.tagName);c&&(_(c,i),Ge(r,c))}})(e):(function(r){Te.delete(r)})(e)})}catch{}},function(){ae.forEach((e,r)=>{if(!Oe(r))return e.updateListener&&r.removeEventListener("update",e.updateListener),void ae.delete(r);nt(0,e)})},function(){Pe.forEach((e,r)=>{if(Oe(r))try{const i=pe(e.resolver),s=i===void 0?"":i+"";s!==e.lastValue&&(r.textContent=s,e.lastValue=s)}catch{}else Pe.delete(r)})},function(){if(typeof document>"u")return;const e=document.body?[document.body,document]:[document];for(const r of e)try{r.dispatchEvent(new Event("update",{bubbles:!0}))}catch{}}];function Mt(){for(const e of Nt)e()}function Dt(e,r,i){return s=>{if(!s||typeof s.addEventListener!="function")return;const l=s;l.addEventListener(e,c=>{try{r.call(l,c)}catch{}},i)}}function Wt(e,r,i=0){const s=e(r||document.body,i);return(r||document.body).appendChild(s),s}const st=[{name:"display",cssProperty:"display"},{name:"grid",cssProperty:"display",defaultValue:"grid",isShorthand:!0},{name:"bg",cssProperty:"background-color"},{name:"color",cssProperty:"color"},{name:"accentColor",cssProperty:"accent-color"},{name:"fontSize",cssProperty:"font-size"},{name:"fontWeight",cssProperty:"font-weight"},{name:"fontFamily",cssProperty:"font-family"},{name:"lineHeight",cssProperty:"line-height"},{name:"letterSpacing",cssProperty:"letter-spacing"},{name:"textAlign",cssProperty:"text-align"},{name:"textDecoration",cssProperty:"text-decoration"},{name:"fontStyle",cssProperty:"font-style"},{name:"fontVariant",cssProperty:"font-variant"},{name:"fontStretch",cssProperty:"font-stretch"},{name:"textTransform",cssProperty:"text-transform"},{name:"textIndent",cssProperty:"text-indent"},{name:"textOverflow",cssProperty:"text-overflow"},{name:"textShadow",cssProperty:"text-shadow"},{name:"whiteSpace",cssProperty:"white-space"},{name:"wordSpacing",cssProperty:"word-spacing"},{name:"wordWrap",cssProperty:"word-wrap"},{name:"overflowWrap",cssProperty:"overflow-wrap"},{name:"textAlignLast",cssProperty:"text-align-last"},{name:"textJustify",cssProperty:"text-justify"},{name:"textDecorationLine",cssProperty:"text-decoration-line"},{name:"textDecorationColor",cssProperty:"text-decoration-color"},{name:"textDecorationStyle",cssProperty:"text-decoration-style"},{name:"textDecorationThickness",cssProperty:"text-decoration-thickness"},{name:"textUnderlineOffset",cssProperty:"text-underline-offset"},{name:"verticalAlign",cssProperty:"vertical-align"},{name:"position",cssProperty:"position"},{name:"padding",cssProperty:"padding"},{name:"paddingTop",cssProperty:"padding-top"},{name:"paddingRight",cssProperty:"padding-right"},{name:"paddingBottom",cssProperty:"padding-bottom"},{name:"paddingLeft",cssProperty:"padding-left"},{name:"margin",cssProperty:"margin"},{name:"marginTop",cssProperty:"margin-top"},{name:"marginRight",cssProperty:"margin-right"},{name:"marginBottom",cssProperty:"margin-bottom"},{name:"marginLeft",cssProperty:"margin-left"},{name:"width",cssProperty:"width"},{name:"height",cssProperty:"height"},{name:"minWidth",cssProperty:"min-width"},{name:"maxWidth",cssProperty:"max-width"},{name:"minHeight",cssProperty:"min-height"},{name:"maxHeight",cssProperty:"max-height"},{name:"boxSizing",cssProperty:"box-sizing"},{name:"top",cssProperty:"top"},{name:"right",cssProperty:"right"},{name:"bottom",cssProperty:"bottom"},{name:"left",cssProperty:"left"},{name:"zIndex",cssProperty:"z-index"},{name:"flexDirection",cssProperty:"flex-direction"},{name:"alignItems",cssProperty:"align-items"},{name:"justifyContent",cssProperty:"justify-content"},{name:"gap",cssProperty:"gap"},{name:"flexWrap",cssProperty:"flex-wrap"},{name:"flexGrow",cssProperty:"flex-grow"},{name:"flexShrink",cssProperty:"flex-shrink"},{name:"flexBasis",cssProperty:"flex-basis"},{name:"alignSelf",cssProperty:"align-self"},{name:"alignContent",cssProperty:"align-content"},{name:"justifySelf",cssProperty:"justify-self"},{name:"justifyItems",cssProperty:"justify-items"},{name:"gridTemplateColumns",cssProperty:"grid-template-columns"},{name:"gridTemplateRows",cssProperty:"grid-template-rows"},{name:"gridTemplateAreas",cssProperty:"grid-template-areas"},{name:"gridColumn",cssProperty:"grid-column"},{name:"gridRow",cssProperty:"grid-row"},{name:"gridColumnStart",cssProperty:"grid-column-start"},{name:"gridColumnEnd",cssProperty:"grid-column-end"},{name:"gridRowStart",cssProperty:"grid-row-start"},{name:"gridRowEnd",cssProperty:"grid-row-end"},{name:"gridArea",cssProperty:"grid-area"},{name:"gridAutoColumns",cssProperty:"grid-auto-columns"},{name:"gridAutoRows",cssProperty:"grid-auto-rows"},{name:"gridAutoFlow",cssProperty:"grid-auto-flow"},{name:"border",cssProperty:"border"},{name:"borderTop",cssProperty:"border-top"},{name:"borderRight",cssProperty:"border-right"},{name:"borderBottom",cssProperty:"border-bottom"},{name:"borderLeft",cssProperty:"border-left"},{name:"borderWidth",cssProperty:"border-width"},{name:"borderStyle",cssProperty:"border-style"},{name:"borderColor",cssProperty:"border-color"},{name:"borderTopWidth",cssProperty:"border-top-width"},{name:"borderRightWidth",cssProperty:"border-right-width"},{name:"borderBottomWidth",cssProperty:"border-bottom-width"},{name:"borderLeftWidth",cssProperty:"border-left-width"},{name:"borderTopStyle",cssProperty:"border-top-style"},{name:"borderRightStyle",cssProperty:"border-right-style"},{name:"borderBottomStyle",cssProperty:"border-bottom-style"},{name:"borderLeftStyle",cssProperty:"border-left-style"},{name:"borderTopColor",cssProperty:"border-top-color"},{name:"borderRightColor",cssProperty:"border-right-color"},{name:"borderBottomColor",cssProperty:"border-bottom-color"},{name:"borderLeftColor",cssProperty:"border-left-color"},{name:"borderRadius",cssProperty:"border-radius"},{name:"borderTopLeftRadius",cssProperty:"border-top-left-radius"},{name:"borderTopRightRadius",cssProperty:"border-top-right-radius"},{name:"borderBottomLeftRadius",cssProperty:"border-bottom-left-radius"},{name:"borderBottomRightRadius",cssProperty:"border-bottom-right-radius"},{name:"outline",cssProperty:"outline"},{name:"outlineWidth",cssProperty:"outline-width"},{name:"outlineStyle",cssProperty:"outline-style"},{name:"outlineColor",cssProperty:"outline-color"},{name:"outlineOffset",cssProperty:"outline-offset"},{name:"backgroundColor",cssProperty:"background-color"},{name:"backgroundImage",cssProperty:"background-image"},{name:"backgroundRepeat",cssProperty:"background-repeat"},{name:"backgroundPosition",cssProperty:"background-position"},{name:"backgroundSize",cssProperty:"background-size"},{name:"backgroundAttachment",cssProperty:"background-attachment"},{name:"backgroundClip",cssProperty:"background-clip"},{name:"backgroundOrigin",cssProperty:"background-origin"},{name:"boxShadow",cssProperty:"box-shadow"},{name:"opacity",cssProperty:"opacity"},{name:"transition",cssProperty:"transition"},{name:"transitionProperty",cssProperty:"transition-property"},{name:"transitionDuration",cssProperty:"transition-duration"},{name:"transitionTimingFunction",cssProperty:"transition-timing-function"},{name:"transitionDelay",cssProperty:"transition-delay"},{name:"transform",cssProperty:"transform"},{name:"transformOrigin",cssProperty:"transform-origin"},{name:"transformStyle",cssProperty:"transform-style"},{name:"perspective",cssProperty:"perspective"},{name:"perspectiveOrigin",cssProperty:"perspective-origin"},{name:"backfaceVisibility",cssProperty:"backface-visibility"},{name:"animation",cssProperty:"animation"},{name:"animationName",cssProperty:"animation-name"},{name:"animationDuration",cssProperty:"animation-duration"},{name:"animationTimingFunction",cssProperty:"animation-timing-function"},{name:"animationDelay",cssProperty:"animation-delay"},{name:"animationIterationCount",cssProperty:"animation-iteration-count"},{name:"animationDirection",cssProperty:"animation-direction"},{name:"animationFillMode",cssProperty:"animation-fill-mode"},{name:"animationPlayState",cssProperty:"animation-play-state"},{name:"filter",cssProperty:"filter"},{name:"backdropFilter",cssProperty:"backdrop-filter"},{name:"overflow",cssProperty:"overflow"},{name:"overflowX",cssProperty:"overflow-x"},{name:"overflowY",cssProperty:"overflow-y"},{name:"visibility",cssProperty:"visibility"},{name:"objectFit",cssProperty:"object-fit"},{name:"objectPosition",cssProperty:"object-position"},{name:"listStyle",cssProperty:"list-style"},{name:"listStyleType",cssProperty:"list-style-type"},{name:"listStylePosition",cssProperty:"list-style-position"},{name:"listStyleImage",cssProperty:"list-style-image"},{name:"borderCollapse",cssProperty:"border-collapse"},{name:"borderSpacing",cssProperty:"border-spacing"},{name:"captionSide",cssProperty:"caption-side"},{name:"emptyCells",cssProperty:"empty-cells"},{name:"tableLayout",cssProperty:"table-layout"},{name:"content",cssProperty:"content"},{name:"quotes",cssProperty:"quotes"},{name:"counterReset",cssProperty:"counter-reset"},{name:"counterIncrement",cssProperty:"counter-increment"},{name:"appearance",cssProperty:"appearance"},{name:"userSelect",cssProperty:"user-select"},{name:"pointerEvents",cssProperty:"pointer-events"},{name:"resize",cssProperty:"resize"},{name:"scrollBehavior",cssProperty:"scroll-behavior"},{name:"clip",cssProperty:"clip"},{name:"clipPath",cssProperty:"clip-path"},{name:"isolation",cssProperty:"isolation"},{name:"mixBlendMode",cssProperty:"mix-blend-mode"},{name:"willChange",cssProperty:"will-change"},{name:"contain",cssProperty:"contain"},{name:"pageBreakBefore",cssProperty:"page-break-before"},{name:"pageBreakAfter",cssProperty:"page-break-after"},{name:"pageBreakInside",cssProperty:"page-break-inside"},{name:"breakBefore",cssProperty:"break-before"},{name:"breakAfter",cssProperty:"break-after"},{name:"breakInside",cssProperty:"break-inside"},{name:"orphans",cssProperty:"orphans"},{name:"widows",cssProperty:"widows"},{name:"columnCount",cssProperty:"column-count"},{name:"columnFill",cssProperty:"column-fill"},{name:"columnGap",cssProperty:"column-gap"},{name:"columnRule",cssProperty:"column-rule"},{name:"columnRuleColor",cssProperty:"column-rule-color"},{name:"columnRuleStyle",cssProperty:"column-rule-style"},{name:"columnRuleWidth",cssProperty:"column-rule-width"},{name:"columnSpan",cssProperty:"column-span"},{name:"columnWidth",cssProperty:"column-width"},{name:"columns",cssProperty:"columns"},{name:"cursor",cssProperty:"cursor"},{name:"aspectRatio",cssProperty:"aspect-ratio"},{name:"clear",cssProperty:"clear"},{name:"float",cssProperty:"float"},{name:"order",cssProperty:"order"},{name:"placeContent",cssProperty:"place-content"},{name:"placeItems",cssProperty:"place-items"},{name:"placeSelf",cssProperty:"place-self"},{name:"hyphens",cssProperty:"hyphens"},{name:"lineBreak",cssProperty:"line-break"},{name:"wordBreak",cssProperty:"word-break"},{name:"textOrientation",cssProperty:"text-orientation"},{name:"writingMode",cssProperty:"writing-mode"},{name:"direction",cssProperty:"direction"},{name:"unicodeBidi",cssProperty:"unicode-bidi"},{name:"backgroundBlendMode",cssProperty:"background-blend-mode"},{name:"backgroundPositionX",cssProperty:"background-position-x"},{name:"backgroundPositionY",cssProperty:"background-position-y"},{name:"borderImage",cssProperty:"border-image"},{name:"borderImageSource",cssProperty:"border-image-source"},{name:"borderImageSlice",cssProperty:"border-image-slice"},{name:"borderImageWidth",cssProperty:"border-image-width"},{name:"borderImageOutset",cssProperty:"border-image-outset"},{name:"borderImageRepeat",cssProperty:"border-image-repeat"},{name:"inset",cssProperty:"inset"},{name:"insetBlock",cssProperty:"inset-block"},{name:"insetBlockStart",cssProperty:"inset-block-start"},{name:"insetBlockEnd",cssProperty:"inset-block-end"},{name:"insetInline",cssProperty:"inset-inline"},{name:"insetInlineStart",cssProperty:"inset-inline-start"},{name:"insetInlineEnd",cssProperty:"inset-inline-end"},{name:"marginBlock",cssProperty:"margin-block"},{name:"marginBlockStart",cssProperty:"margin-block-start"},{name:"marginBlockEnd",cssProperty:"margin-block-end"},{name:"marginInline",cssProperty:"margin-inline"},{name:"marginInlineStart",cssProperty:"margin-inline-start"},{name:"marginInlineEnd",cssProperty:"margin-inline-end"},{name:"paddingBlock",cssProperty:"padding-block"},{name:"paddingBlockStart",cssProperty:"padding-block-start"},{name:"paddingBlockEnd",cssProperty:"padding-block-end"},{name:"paddingInline",cssProperty:"padding-inline"},{name:"paddingInlineStart",cssProperty:"padding-inline-start"},{name:"paddingInlineEnd",cssProperty:"padding-inline-end"},{name:"inlineSize",cssProperty:"inline-size"},{name:"blockSize",cssProperty:"block-size"},{name:"minInlineSize",cssProperty:"min-inline-size"},{name:"minBlockSize",cssProperty:"min-block-size"},{name:"maxInlineSize",cssProperty:"max-inline-size"},{name:"maxBlockSize",cssProperty:"max-block-size"},{name:"borderBlock",cssProperty:"border-block"},{name:"borderBlockStart",cssProperty:"border-block-start"},{name:"borderBlockEnd",cssProperty:"border-block-end"},{name:"borderInline",cssProperty:"border-inline"},{name:"borderInlineStart",cssProperty:"border-inline-start"},{name:"borderInlineEnd",cssProperty:"border-inline-end"},{name:"borderBlockWidth",cssProperty:"border-block-width"},{name:"borderBlockStartWidth",cssProperty:"border-block-start-width"},{name:"borderBlockEndWidth",cssProperty:"border-block-end-width"},{name:"borderInlineWidth",cssProperty:"border-inline-width"},{name:"borderInlineStartWidth",cssProperty:"border-inline-start-width"},{name:"borderInlineEndWidth",cssProperty:"border-inline-end-width"},{name:"borderBlockStyle",cssProperty:"border-block-style"},{name:"borderBlockStartStyle",cssProperty:"border-block-start-style"},{name:"borderBlockEndStyle",cssProperty:"border-block-end-style"},{name:"borderInlineStyle",cssProperty:"border-inline-style"},{name:"borderInlineStartStyle",cssProperty:"border-inline-start-style"},{name:"borderInlineEndStyle",cssProperty:"border-inline-end-style"},{name:"borderBlockColor",cssProperty:"border-block-color"},{name:"borderBlockStartColor",cssProperty:"border-block-start-color"},{name:"borderBlockEndColor",cssProperty:"border-block-end-color"},{name:"borderInlineColor",cssProperty:"border-inline-color"},{name:"borderInlineStartColor",cssProperty:"border-inline-start-color"},{name:"borderInlineEndColor",cssProperty:"border-inline-end-color"},{name:"borderStartStartRadius",cssProperty:"border-start-start-radius"},{name:"borderStartEndRadius",cssProperty:"border-start-end-radius"},{name:"borderEndStartRadius",cssProperty:"border-end-start-radius"},{name:"borderEndEndRadius",cssProperty:"border-end-end-radius"},{name:"scrollMargin",cssProperty:"scroll-margin"},{name:"scrollMarginTop",cssProperty:"scroll-margin-top"},{name:"scrollMarginRight",cssProperty:"scroll-margin-right"},{name:"scrollMarginBottom",cssProperty:"scroll-margin-bottom"},{name:"scrollMarginLeft",cssProperty:"scroll-margin-left"},{name:"scrollPadding",cssProperty:"scroll-padding"},{name:"scrollPaddingTop",cssProperty:"scroll-padding-top"},{name:"scrollPaddingRight",cssProperty:"scroll-padding-right"},{name:"scrollPaddingBottom",cssProperty:"scroll-padding-bottom"},{name:"scrollPaddingLeft",cssProperty:"scroll-padding-left"},{name:"overscrollBehavior",cssProperty:"overscroll-behavior"},{name:"overscrollBehaviorX",cssProperty:"overscroll-behavior-x"},{name:"overscrollBehaviorY",cssProperty:"overscroll-behavior-y"},{name:"caretColor",cssProperty:"caret-color"},{name:"caretShape",cssProperty:"caret-shape"},{name:"caretAnimation",cssProperty:"caret-animation"},{name:"imageRendering",cssProperty:"image-rendering"},{name:"colorScheme",cssProperty:"color-scheme"},{name:"contentVisibility",cssProperty:"content-visibility"},{name:"touchAction",cssProperty:"touch-action"},{name:"containerType",cssProperty:"container-type"},{name:"containerName",cssProperty:"container-name"},{name:"container",cssProperty:"container"},{name:"fontFeatureSettings",cssProperty:"font-feature-settings"},{name:"fontKerning",cssProperty:"font-kerning"},{name:"fontSynthesis",cssProperty:"font-synthesis"},{name:"fontOpticalSizing",cssProperty:"font-optical-sizing"},{name:"fontDisplay",cssProperty:"font-display"},{name:"fontVariantCaps",cssProperty:"font-variant-caps"},{name:"fontVariantNumeric",cssProperty:"font-variant-numeric"},{name:"fontVariantLigatures",cssProperty:"font-variant-ligatures"},{name:"fontVariantEastAsian",cssProperty:"font-variant-east-asian"},{name:"fontVariantAlternates",cssProperty:"font-variant-alternates"},{name:"fontVariantPosition",cssProperty:"font-variant-position"},{name:"textRendering",cssProperty:"text-rendering"},{name:"textCombineUpright",cssProperty:"text-combine-upright"},{name:"textSizeAdjust",cssProperty:"text-size-adjust"},{name:"mask",cssProperty:"mask"},{name:"maskImage",cssProperty:"mask-image"},{name:"maskMode",cssProperty:"mask-mode"},{name:"maskRepeat",cssProperty:"mask-repeat"},{name:"maskPosition",cssProperty:"mask-position"},{name:"maskSize",cssProperty:"mask-size"},{name:"maskOrigin",cssProperty:"mask-origin"},{name:"maskClip",cssProperty:"mask-clip"},{name:"maskComposite",cssProperty:"mask-composite"},{name:"clipRule",cssProperty:"clip-rule"},{name:"gridColumnGap",cssProperty:"grid-column-gap"},{name:"gridRowGap",cssProperty:"grid-row-gap"},{name:"gridGap",cssProperty:"grid-gap"}],$t=["bold","center","flex"],Ye=new Map;function lt(e){let r=0;for(let i=0;e.length>i;i++)r=(r<<5)-r+e.charCodeAt(i),r&=r;return Math.abs(r).toString(16).padStart(8,"0").substring(0,8)}function Ee(e){return Object.entries(e).sort(([r],[i])=>r.localeCompare(i)).map(([r,i])=>`${r}:${i}`).join("|")}function X(e,r,i,s="media"){let l=document.querySelector("#nuclo-styles");l||(l=document.createElement("style"),l.id="nuclo-styles",document.head.appendChild(l));const c=Object.entries(r).map(([m,f])=>`${m}: ${f}`).join("; ");if(i){const m=Array.from(l.sheet?.cssRules||[]);let f=null;const b=u=>s==="media"&&u instanceof CSSMediaRule?u.media.mediaText===i:(s==="container"&&u instanceof CSSContainerRule||s==="supports"&&u instanceof CSSSupportsRule)&&u.conditionText===i,y=u=>u instanceof CSSMediaRule||u instanceof CSSContainerRule||u instanceof CSSSupportsRule;for(const u of m)if(b(u)){f=u;break}if(!f){let u=m.length;for(let k=m.length-1;k>=0;k--){if(y(m[k])){u=k+1;break}if(m[k]instanceof CSSStyleRule){u=k+1;break}}const x=s==="media"?"@media":s==="container"?"@container":s==="supports"?"@supports":"@media";l.sheet?.insertRule(`${x} ${i} {}`,u),f=l.sheet?.cssRules[u]}let g=null;for(const u of Array.from(f.cssRules))if(u instanceof CSSStyleRule&&u.selectorText==="."+e){g=u;break}if(g){for(;g.style.length>0;)g.style.removeProperty(g.style[0]);Object.entries(r).forEach(([u,x])=>{g.style.setProperty(u,x)})}else f.insertRule(`.${e} { ${c} }`,f.cssRules.length)}else{let m=null,f=0;const b=g=>g instanceof CSSMediaRule||g instanceof CSSContainerRule||g instanceof CSSSupportsRule,y=Array.from(l.sheet?.cssRules||[]);for(let g=0;y.length>g;g++){const u=y[g];if(u instanceof CSSStyleRule&&u.selectorText==="."+e){m=u,f=g;break}b(u)||(f=g+1)}if(m){for(;m.style.length>0;)m.style.removeProperty(m.style[0]);Object.entries(r).forEach(([g,u])=>{m.style.setProperty(g,u)})}else l.sheet?.insertRule(`.${e} { ${c} }`,f)}}function Lt(e,r){X(e,r)}class U{styles={};getStyles(){return{...this.styles}}getClassName(r="",i){return(function(s,l="",c){const m=Ee(s),f=l?`${l}:${m}`:m,b=(function(u){return Ye.get(u)})(f);if(b){const u=b;return(function(x,k,C="media"){const P=document.querySelector("#nuclo-styles");if(!P||!P.sheet)return!1;if(k){const E=Array.from(P.sheet.cssRules||[]).find(N=>C==="media"&&N instanceof CSSMediaRule?N.media.mediaText===k:(C==="container"&&N instanceof CSSContainerRule||C==="supports"&&N instanceof CSSSupportsRule)&&N.conditionText===k);return!!E&&Array.from(E.cssRules).some(N=>N instanceof CSSStyleRule&&N.selectorText==="."+x)}return Array.from(P.sheet.cssRules||[]).some(E=>E instanceof CSSStyleRule&&E.selectorText==="."+x)})(u,c)||X(u,s,c),u}const y=lt(m),g=l?`n${l}-${y}`:"n"+y;return(function(u,x){Ye.set(u,x)})(f,g),X(g,s,c),g})(this.styles,r,i)}getClassNames(){return[this.getClassName()]}getClassDefinitions(){return Object.entries(this.styles).map(([r,i])=>({className:this.getClassName(),property:r,value:i}))}toString(){return this.getClassName()}add(r,i){return this.styles[r]=i,this}bold(){return this.styles["font-weight"]="bold",this}center(){return this.styles["justify-content"]="center",this.styles["align-items"]="center",this}flex(r){return r!==void 0?this.styles.flex=r:this.styles.display="flex",this}}function Ft(e){return e.isShorthand?()=>new U().add(e.cssProperty,e.defaultValue||""):r=>new U().add(e.cssProperty,r||"")}(function(){const e=U.prototype;for(const r of st)r.name in e||(e[r.name]=r.isShorthand?function(){return this.add(r.cssProperty,r.defaultValue||""),this}:function(i){return this.add(r.cssProperty,i),this})})();const se={};for(const e of st)se[e.name]=Ft(e);for(const e of $t)e==="bold"||e==="center"?se[e]=()=>new U()[e]():e==="flex"&&(se[e]=r=>new U().flex(r));const{display:jt,flex:Ht,grid:Ut,bg:Ot,color:Gt,accentColor:Qt,fontSize:Vt,fontWeight:_t,fontFamily:qt,lineHeight:Yt,letterSpacing:Jt,textAlign:Kt,textDecoration:Xt,bold:Zt,fontStyle:eo,fontVariant:to,fontStretch:oo,textTransform:ro,textIndent:no,textOverflow:io,textShadow:ao,whiteSpace:so,wordSpacing:lo,wordWrap:co,overflowWrap:po,textAlignLast:uo,textJustify:mo,textDecorationLine:go,textDecorationColor:ho,textDecorationStyle:fo,textDecorationThickness:yo,textUnderlineOffset:bo,verticalAlign:xo,position:vo,padding:So,paddingTop:ko,paddingRight:wo,paddingBottom:Co,paddingLeft:Po,margin:To,marginTop:Bo,marginRight:Ro,marginBottom:zo,marginLeft:Io,width:Ao,height:Eo,minWidth:No,maxWidth:Mo,minHeight:Do,maxHeight:Wo,boxSizing:$o,top:Lo,right:Fo,bottom:jo,left:Ho,zIndex:Uo,flexDirection:Oo,alignItems:Go,justifyContent:Qo,center:Vo,gap:_o,flexWrap:qo,flexGrow:Yo,flexShrink:Jo,flexBasis:Ko,alignSelf:Xo,alignContent:Zo,justifySelf:er,justifyItems:tr,gridTemplateColumns:or,gridTemplateRows:rr,gridTemplateAreas:nr,gridColumn:ir,gridRow:ar,gridColumnStart:sr,gridColumnEnd:lr,gridRowStart:dr,gridRowEnd:cr,gridArea:pr,gridAutoColumns:ur,gridAutoRows:mr,gridAutoFlow:gr,border:hr,borderTop:fr,borderRight:yr,borderBottom:br,borderLeft:xr,borderWidth:vr,borderStyle:Sr,borderColor:kr,borderTopWidth:wr,borderRightWidth:Cr,borderBottomWidth:Pr,borderLeftWidth:Tr,borderTopStyle:Br,borderRightStyle:Rr,borderBottomStyle:zr,borderLeftStyle:Ir,borderTopColor:Ar,borderRightColor:Er,borderBottomColor:Nr,borderLeftColor:Mr,borderRadius:Dr,borderTopLeftRadius:Wr,borderTopRightRadius:$r,borderBottomLeftRadius:Lr,borderBottomRightRadius:Fr,outline:jr,outlineWidth:Hr,outlineStyle:Ur,outlineColor:Or,outlineOffset:Gr,backgroundColor:Qr,backgroundImage:Vr,backgroundRepeat:_r,backgroundPosition:qr,backgroundSize:Yr,backgroundAttachment:Jr,backgroundClip:Kr,backgroundOrigin:Xr,boxShadow:Zr,opacity:en,transition:tn,transitionProperty:rn,transitionDuration:nn,transitionTimingFunction:an,transitionDelay:sn,transform:ln,transformOrigin:dn,transformStyle:cn,perspective:pn,perspectiveOrigin:un,backfaceVisibility:mn,animation:gn,animationName:hn,animationDuration:fn,animationTimingFunction:yn,animationDelay:bn,animationIterationCount:xn,animationDirection:vn,animationFillMode:Sn,animationPlayState:kn,filter:wn,backdropFilter:Cn,overflow:Pn,overflowX:Tn,overflowY:Bn,visibility:Rn,objectFit:zn,objectPosition:In,listStyle:An,listStyleType:En,listStylePosition:Nn,listStyleImage:Mn,borderCollapse:Dn,borderSpacing:Wn,captionSide:$n,emptyCells:Ln,tableLayout:Fn,content:jn,quotes:Hn,counterReset:Un,counterIncrement:On,appearance:Gn,userSelect:Qn,pointerEvents:Vn,resize:_n,scrollBehavior:qn,clip:Yn,clipPath:Jn,isolation:Kn,mixBlendMode:Xn,willChange:Zn,contain:ei,pageBreakBefore:ti,pageBreakAfter:oi,pageBreakInside:ri,breakBefore:ni,breakAfter:ii,breakInside:ai,orphans:si,widows:di,columnCount:ci,columnFill:pi,columnGap:ui,columnRule:mi,columnRuleColor:gi,columnRuleStyle:hi,columnRuleWidth:fi,columnSpan:yi,columnWidth:bi,columns:xi,cursor:vi}=se;function Si(e){const r=e.trim();return r.startsWith("@media ")?{type:"media",condition:r.slice(7).trim()}:r.startsWith("@container ")?{type:"container",condition:r.slice(11).trim()}:r.startsWith("@supports ")?{type:"supports",condition:r.slice(10).trim()}:r.startsWith("@style ")?{type:"style",condition:r.slice(7).trim()}:{type:"media",condition:r}}function dt(e){const r=Array.isArray(e)?e:Object.entries(e);return function(i,s){let l,c;if(s!==void 0?(l=i,c=s):i instanceof U?(l=i,c=void 0):(l=void 0,c=i),!(l||c&&Object.keys(c).length!==0))return"";if(c&&Object.keys(c).length>0){const m=[];for(const[g,u]of r){const x=c[g];x&&m.push({queryName:g,atRule:Si(u),styles:x.getStyles()})}const f=[];if(l){const g=l.getStyles();f.push("default:"+Ee(g))}f.push(...m.map(({queryName:g,styles:u})=>`${g}:${Ee(u)}`));const b="n"+lt(f.sort().join("||"));let y={};l&&(y={...l.getStyles()},X(b,y));for(const{atRule:g,styles:u}of m)y={...y,...u},X(b,y,g.condition,g.type);return{className:b}}return l?{className:l.getClassName()}:""}}const ki=dt;var wi=Object.freeze({__proto__:null,StyleBuilder:U,accentColor:Qt,alignContent:Zo,alignItems:Go,alignSelf:Xo,animation:gn,animationDelay:bn,animationDirection:vn,animationDuration:fn,animationFillMode:Sn,animationIterationCount:xn,animationName:hn,animationPlayState:kn,animationTimingFunction:yn,appearance:Gn,backdropFilter:Cn,backfaceVisibility:mn,backgroundAttachment:Jr,backgroundClip:Kr,backgroundColor:Qr,backgroundImage:Vr,backgroundOrigin:Xr,backgroundPosition:qr,backgroundRepeat:_r,backgroundSize:Yr,bg:Ot,bold:Zt,border:hr,borderBottom:br,borderBottomColor:Nr,borderBottomLeftRadius:Lr,borderBottomRightRadius:Fr,borderBottomStyle:zr,borderBottomWidth:Pr,borderCollapse:Dn,borderColor:kr,borderLeft:xr,borderLeftColor:Mr,borderLeftStyle:Ir,borderLeftWidth:Tr,borderRadius:Dr,borderRight:yr,borderRightColor:Er,borderRightStyle:Rr,borderRightWidth:Cr,borderSpacing:Wn,borderStyle:Sr,borderTop:fr,borderTopColor:Ar,borderTopLeftRadius:Wr,borderTopRightRadius:$r,borderTopStyle:Br,borderTopWidth:wr,borderWidth:vr,bottom:jo,boxShadow:Zr,boxSizing:$o,breakAfter:ii,breakBefore:ni,breakInside:ai,captionSide:$n,center:Vo,clip:Yn,clipPath:Jn,color:Gt,columnCount:ci,columnFill:pi,columnGap:ui,columnRule:mi,columnRuleColor:gi,columnRuleStyle:hi,columnRuleWidth:fi,columnSpan:yi,columnWidth:bi,columns:xi,contain:ei,content:jn,counterIncrement:On,counterReset:Un,createBreakpoints:ki,createCSSClass:Lt,createStyleQueries:dt,cursor:vi,display:jt,emptyCells:Ln,filter:wn,flex:Ht,flexBasis:Ko,flexDirection:Oo,flexGrow:Yo,flexShrink:Jo,flexWrap:qo,fontFamily:qt,fontSize:Vt,fontStretch:oo,fontStyle:eo,fontVariant:to,fontWeight:_t,gap:_o,grid:Ut,gridArea:pr,gridAutoColumns:ur,gridAutoFlow:gr,gridAutoRows:mr,gridColumn:ir,gridColumnEnd:lr,gridColumnStart:sr,gridRow:ar,gridRowEnd:cr,gridRowStart:dr,gridTemplateAreas:nr,gridTemplateColumns:or,gridTemplateRows:rr,height:Eo,isolation:Kn,justifyContent:Qo,justifyItems:tr,justifySelf:er,left:Ho,letterSpacing:Jt,lineHeight:Yt,listStyle:An,listStyleImage:Mn,listStylePosition:Nn,listStyleType:En,margin:To,marginBottom:zo,marginLeft:Io,marginRight:Ro,marginTop:Bo,maxHeight:Wo,maxWidth:Mo,minHeight:Do,minWidth:No,mixBlendMode:Xn,objectFit:zn,objectPosition:In,opacity:en,orphans:si,outline:jr,outlineColor:Or,outlineOffset:Gr,outlineStyle:Ur,outlineWidth:Hr,overflow:Pn,overflowWrap:po,overflowX:Tn,overflowY:Bn,padding:So,paddingBottom:Co,paddingLeft:Po,paddingRight:wo,paddingTop:ko,pageBreakAfter:oi,pageBreakBefore:ti,pageBreakInside:ri,perspective:pn,perspectiveOrigin:un,pointerEvents:Vn,position:vo,quotes:Hn,resize:_n,right:Fo,scrollBehavior:qn,tableLayout:Fn,textAlign:Kt,textAlignLast:uo,textDecoration:Xt,textDecorationColor:ho,textDecorationLine:go,textDecorationStyle:fo,textDecorationThickness:yo,textIndent:no,textJustify:mo,textOverflow:io,textShadow:ao,textTransform:ro,textUnderlineOffset:bo,top:Lo,transform:ln,transformOrigin:dn,transformStyle:cn,transition:tn,transitionDelay:sn,transitionDuration:nn,transitionProperty:rn,transitionTimingFunction:an,userSelect:Qn,verticalAlign:xo,visibility:Rn,whiteSpace:so,widows:di,width:Ao,willChange:Zn,wordSpacing:lo,wordWrap:co,zIndex:Uo});function Ci(){if(Pt(),typeof globalThis<"u"){const e=globalThis;e.list=Rt,e.update=Mt,e.when=Et,e.on=Dt,e.render=Wt;for(const[r,i]of Object.entries(wi))try{e[r]=i}catch{}}}typeof globalThis<"u"&&Ci();const t={primary:"#84cc16",primaryHover:"#a3e635",primaryDark:"#65a30d",primaryGlow:"rgba(132, 204, 22, 0.3)",bg:"#0a0f1a",bgLight:"#111827",bgCard:"#1a2332",bgCode:"#0d1117",text:"#f8fafc",textMuted:"#94a3b8",textDim:"#64748b",border:"#1e293b",borderLight:"#334155",codeKeyword:"#c792ea",codeString:"#c3e88d",codeFunction:"#82aaff",codeComment:"#676e95",codeNumber:"#f78c6c"};function Pi(){const e=document.createElement("style");e.textContent=`
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
      background: ${t.bg};
      color: ${t.text};
      line-height: 1.6;
      min-height: 100vh;
    }

  
  `,document.head.appendChild(e)}const n=createStyleQueries({small:"@media (min-width: 341px)",medium:"@media (min-width: 601px)",large:"@media (min-width: 1025px)"}),o={container:n(padding("0 24px").maxWidth("1200px").margin("0 auto").width("100%")),header:n(display("flex").backgroundColor("#FF0000").alignItems("center").justifyContent("space-between").padding("20px 24px").backgroundColor("transparent").containerType("inline-size").position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${t.border}`),{medium:padding("20px 48px")}),logo:n(display("flex").alignItems("center").gap("12px").fontSize("20px").fontWeight("700").color(t.primary).transition("opacity 0.2s"),{medium:fontSize("24px")}),nav:n(display("flex").alignItems("center").gap("8px").width("100%").height("200px")),navLink:n(color(t.textMuted).fontSize("14px").fontWeight("500").transition("all 0.2s"),{medium:fontSize("15px")}),navLinkActive:n(color(t.text)),hero:n(padding("60px 24px 80px").textAlign("center").maxWidth("1000px").margin("0 auto").position("relative"),{medium:padding("100px 48px 120px")}),heroTitle:n(fontSize("40px").fontWeight("700").lineHeight("1.1").marginBottom("24px").color(t.text).letterSpacing("-0.02em"),{medium:fontSize("56px"),large:fontSize("64px")}),heroTitleAccent:n(color(t.primary)),heroTitleAccentStyle:{fontStyle:"italic"},heroSubtitle:n(fontSize("16px").color(t.textMuted).maxWidth("600px").margin("0 auto 48px").lineHeight("1.7"),{medium:fontSize("18px"),large:fontSize("20px")}),heroButtons:n(display("flex").gap("16px").justifyContent("center").flexWrap("wrap")),btnPrimary:n(padding("14px 32px").backgroundColor(t.primary).color(t.bg).borderRadius("8px").fontWeight("600").fontSize("15px").border("none").transition("all 0.2s")),btnPrimaryStyle:{boxShadow:`0 0 20px ${t.primaryGlow}`},btnSecondary:n(padding("14px 32px").backgroundColor("transparent").color(t.text).borderRadius("8px").fontWeight("600").fontSize("15px").border(`1px solid ${t.borderLight}`).transition("all 0.2s")),features:n(display("grid").gap("24px").padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("80px 48px")}),featuresStyle:{gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))"},featureCard:n(padding("32px").backgroundColor(t.bgCard).borderRadius("16px").border(`1px solid ${t.border}`).transition("all 0.3s").position("relative").overflow("hidden")),featureIcon:n(width("56px").height("56px").borderRadius("12px").display("flex").alignItems("center").justifyContent("center").marginBottom("20px").fontSize("28px")),featureIconStyle:{background:`linear-gradient(135deg, ${t.bgLight} 0%, ${t.bgCard} 100%)`,border:`1px solid ${t.border}`},featureTitle:n(fontSize("20px").fontWeight("600").marginBottom("12px").color(t.text)),featureDesc:n(fontSize("15px").color(t.textMuted).lineHeight("1.7")),codeBlock:n(backgroundColor(t.bgCode).borderRadius("12px").padding("24px").overflow("auto").border(`1px solid ${t.border}`).fontSize("14px").lineHeight("1.7")),codeInline:n(backgroundColor(t.bgLight).padding("3px 8px").borderRadius("6px").fontSize("14px").color(t.primary).border(`1px solid ${t.border}`)),section:n(padding("60px 24px").maxWidth("1200px").margin("0 auto"),{medium:padding("100px 48px")}),sectionTitle:n(fontSize("28px").fontWeight("700").marginBottom("16px").color(t.text).letterSpacing("-0.02em"),{medium:fontSize("36px"),large:fontSize("40px")}),sectionSubtitle:n(fontSize("18px").color(t.textMuted).marginBottom("56px").maxWidth("600px").lineHeight("1.7")),demoContainer:n(display("grid").gap("24px")),demoContainerStyle:{gridTemplateColumns:"1fr 1fr"},demoPanel:n(backgroundColor(t.bgCard).borderRadius("16px").border(`1px solid ${t.border}`).overflow("hidden")),demoPanelHeader:n(padding("14px 20px").backgroundColor(t.bgLight).borderBottom(`1px solid ${t.border}`).fontSize("13px").fontWeight("600").color(t.textMuted).textTransform("uppercase").letterSpacing("0.05em")),demoPanelContent:n(padding("24px")),footer:n(padding("48px").borderTop(`1px solid ${t.border}`).marginTop("auto").textAlign("center").backgroundColor(t.bgLight)),footerText:n(fontSize("14px").color(t.textDim)),footerLink:n(color(t.textMuted).transition("color 0.2s")),pageContent:n(padding("32px 24px 80px").maxWidth("900px").margin("0 auto"),{medium:padding("48px 48px 80px")}),pageTitle:n(fontSize("32px").fontWeight("700").marginBottom("24px").color(t.text).letterSpacing("-0.02em"),{medium:fontSize("40px"),large:fontSize("48px")}),pageSubtitle:n(fontSize("20px").color(t.textMuted).marginBottom("56px").lineHeight("1.7")),h2:n(fontSize("32px").fontWeight("600").marginTop("64px").marginBottom("20px").color(t.text).letterSpacing("-0.01em")),h3:n(fontSize("22px").fontWeight("600").marginTop("40px").marginBottom("16px").color(t.text)),p:n(fontSize("16px").color(t.textMuted).marginBottom("20px").lineHeight("1.8")),ul:n(paddingLeft("24px").marginBottom("20px")),li:n(fontSize("16px").color(t.textMuted).marginBottom("12px").lineHeight("1.7")),flex:n(display("flex")),flexCenter:n(display("flex").alignItems("center").justifyContent("center")),flexBetween:n(display("flex").alignItems("center").justifyContent("space-between")),flexCol:n(display("flex").flexDirection("column")),gap8:n(gap("8px")),gap16:n(gap("16px")),gap24:n(gap("24px")),gap32:n(gap("32px")),mt16:n(marginTop("16px")),mt24:n(marginTop("24px")),mt32:n(marginTop("32px")),mb16:n(marginBottom("16px")),mb24:n(marginBottom("24px")),table:n(width("100%").borderCollapse("collapse").marginBottom("24px").fontSize("14px")),th:n(padding("14px 16px").textAlign("left").borderBottom(`2px solid ${t.border}`).fontWeight("600").color(t.text).backgroundColor(t.bgLight)),td:n(padding("14px 16px").borderBottom(`1px solid ${t.border}`).color(t.textMuted)),glowBoxStyle:{boxShadow:`0 0 60px ${t.primaryGlow}, inset 0 0 60px rgba(132, 204, 22, 0.05)`}};let le="home";function B(){return le}function R(e){le=e;const r="/nuclo/";if(e==="home")window.history.pushState({},"",r);else{const i=r.endsWith("/")?`${r}#${e}`:`${r}/#${e}`;window.history.pushState({},"",i)}window.scrollTo(0,0),update()}const Je=["home","getting-started","core-api","tag-builders","styling","pitfalls","examples","example-counter","example-todo","example-subtasks","example-search","example-async","example-forms","example-nested","example-animations","example-routing","example-styled-card"];function Ti(){const e=window.location.hash.slice(1);Je.includes(e)&&(le=e),window.addEventListener("popstate",()=>{const r=window.location.hash.slice(1);le=Je.includes(r)?r:"home",update()})}function Bi(e=32,r=!1){return svgSvg({width:String(e),height:String(e),viewBox:"0 0 32 32",fill:"none"},i=>{if(r){const s=i;s.removeAttribute("width"),s.removeAttribute("height"),s.style.maxWidth="100%",s.style.width="100%",s.style.height="auto"}},circleSvg({cx:"16",cy:"16",r:"14",stroke:t.primary,"stroke-width":"2",fill:"none",opacity:"0.3"}),circleSvg({cx:"16",cy:"16",r:"12",stroke:t.primary,"stroke-width":"2",fill:"none"}),circleSvg({cx:"16",cy:"16",r:"5",fill:t.primary}),circleSvg({cx:"16",cy:"5",r:"2",fill:t.primaryHover}),circleSvg({cx:"24",cy:"20",r:"2",fill:t.primaryHover}),circleSvg({cx:"8",cy:"20",r:"2",fill:t.primaryHover}))}function Ri(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:t.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"}),pathSvg({d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"}),pathSvg({d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"}),pathSvg({d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"}))}function zi(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:t.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"}),pathSvg({d:"m3.3 7 8.7 5 8.7-5"}),pathSvg({d:"M12 22V12"}))}function Ii(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:t.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M13 2 3 14h9l-1 8 10-12h-9l1-8z"}))}function Ai(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:t.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),pathSvg({d:"M21 3v5h-5"}),pathSvg({d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),pathSvg({d:"M8 16H3v5"}))}function Ei(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:t.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m16 18 6-6-6-6"}),pathSvg({d:"m8 6-6 6 6 6"}))}function Ni(){return svgSvg({width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:t.primary,"stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"}),pathSvg({d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"}),pathSvg({d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"}))}function Mi(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M5 12h14"}),pathSvg({d:"m12 5 7 7-7 7"}))}function Di(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},pathSvg({d:"M20 6 9 17l-5-5"}))}function Wi(){return svgSvg({width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},rectSvg({x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"}),pathSvg({d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"}))}function $i(){return svgSvg({width:"20",height:"20",viewBox:"0 0 24 24",fill:"currentColor"},pathSvg({d:"M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"}))}function Li(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"3",y1:"6",x2:"21",y2:"6"}),lineSvg({x1:"3",y1:"12",x2:"21",y2:"12"}),lineSvg({x1:"3",y1:"18",x2:"21",y2:"18"}))}function Fi(){return svgSvg({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},lineSvg({x1:"18",y1:"6",x2:"6",y2:"18"}),lineSvg({x1:"6",y1:"6",x2:"18",y2:"18"}))}let Z=!1;function ji(){Z=!Z,update()}function ct(){Z=!1,update()}const pt=[{label:"Getting Started",route:"getting-started"},{label:"Core API",route:"core-api"},{label:"Tag Builders",route:"tag-builders"},{label:"Styling",route:"styling"},{label:"Pitfalls",route:"pitfalls"},{label:"Examples",route:"examples"}];function ut(e,r){const i=()=>B()===r||B().startsWith(r+"-");return a({href:`#${r}`},n(display("flex").alignItems("center").padding("8px 14px").borderRadius("8px").fontSize("14px").fontWeight("500").transition("all 0.2s").cursor("pointer")),{style:()=>({color:i()?t.primary:t.textMuted,backgroundColor:i()?"rgba(132, 204, 22, 0.1)":"transparent"})},e,on("click",s=>{s.preventDefault(),R(r),ct()}),on("mouseenter",s=>{i()||(s.target.style.color=t.primary,s.target.style.backgroundColor="rgba(132, 204, 22, 0.05)")}),on("mouseleave",s=>{i()||(s.target.style.color=t.textMuted,s.target.style.backgroundColor="transparent")}))}function Hi(){return a({href:"/nuclo/"},n(display("flex").alignItems("center").gap("10px").fontSize("18px").fontWeight("700").color(t.primary).transition("opacity 0.2s").cursor("pointer")),Bi(28),span("Nuclo"),on("click",e=>{e.preventDefault(),R("home"),ct()}),on("mouseenter",e=>{e.currentTarget.style.opacity="0.8"}),on("mouseleave",e=>{e.currentTarget.style.opacity="1"}))}function mt(){return a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer",ariaLabel:"GitHub"},n(display("flex").alignItems("center").justifyContent("center").width("36px").height("36px").borderRadius("8px").transition("all 0.2s")),{style:{color:t.textMuted,backgroundColor:"transparent"}},$i(),on("mouseenter",e=>{e.currentTarget.style.color=t.primary,e.currentTarget.style.backgroundColor="rgba(132, 204, 22, 0.1)"}),on("mouseleave",e=>{e.currentTarget.style.color=t.textMuted,e.currentTarget.style.backgroundColor="transparent"}))}function Ui(){return button(n(display("flex").alignItems("center").justifyContent("center").width("40px").height("40px").borderRadius("8px").backgroundColor("transparent").border("none").color(t.text).cursor("pointer").transition("all 0.2s"),{medium:display("none")}),when(()=>Z,Fi()).else(Li()),on("click",ji))}function Oi(){return when(()=>Z,div(n(position("fixed").top("64px").left("0").right("0").backgroundColor(t.bg).borderBottom(`1px solid ${t.border}`).padding("16px 24px").zIndex(99).display("flex").flexDirection("column").gap("8px")),{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.95)"}},...pt.map(e=>ut(e.label,e.route)),div(n(display("flex").alignItems("center").gap("8px").padding("8px 14px")),mt(),span(n(color(t.textMuted).fontSize("14px")),"GitHub"))))}function Gi(){const e=n(position("fixed").top("0").left("0").right("0").zIndex(100).borderBottom(`1px solid ${t.border}`)),r=n(display("flex").alignItems("center").justifyContent("space-between").maxWidth("1400px").margin("0 auto").padding("12px 24px"),{medium:padding("16px 48px")}),i=n(display("none").alignItems("center").gap("4px"),{medium:display("flex")}),s=n(display("flex").alignItems("center").gap("8px"));return div(header(e,{style:{backdropFilter:"blur(12px)",background:"rgba(10, 15, 26, 0.85)"}},div(r,Hi(),nav(i,...pt.map(l=>ut(l.label,l.route))),div(s,div(n(display("none"),{medium:display("flex")}),mt()),Ui()))),Oi())}function Qi(){return footer(o.footer,div(o.footerText,"Created by ",a({href:"https://github.com/dan2dev",target:"_blank",rel:"noopener noreferrer"},o.footerLink,"Danilo Celestino de Castro",on("mouseenter",e=>{e.target.style.color=t.primary}),on("mouseleave",e=>{e.target.style.color=t.textMuted}))," · MIT License · ",a({href:"https://github.com/dan2dev/nuclo",target:"_blank",rel:"noopener noreferrer"},o.footerLink,"GitHub",on("mouseenter",e=>{e.target.style.color=t.primary}),on("mouseleave",e=>{e.target.style.color=t.textMuted}))))}let gt={};function Ke(e,r){gt[e]=r,update()}function Xe(e){return gt[e]||!1}function Vi(e){return e.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,`<span style="color: ${t.codeString}">$&</span>`).replace(/(\/\/.*$)/gm,`<span style="color: ${t.codeComment}">$1</span>`).replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,`<span style="color: ${t.codeKeyword}">$1</span>`).replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,`<span style="color: ${t.codeFunction}">$1</span>(`).replace(/\b(\d+\.?\d*)\b/g,`<span style="color: ${t.codeNumber}">$1</span>`).replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g,`: <span style="color: ${t.codeKeyword}">$1</span>`)}function d(e,r="typescript",i=!0){const s=`code-${Math.random().toString(36).slice(2,9)}`,l=Vi(e.trim()),c={backgroundColor:t.bgLight,border:`1px solid ${t.border}`};return div(n(position("relative")),pre(o.codeBlock,code({innerHTML:l})),i?button(n(position("absolute").top("12px").right("12px").padding("6px 10px").borderRadius("6px").color(t.textMuted).fontSize("12px").cursor("pointer").display("flex").alignItems("center").gap("4px").transition("all 0.2s")),{style:c},()=>Xe(s)?Di():Wi(),()=>Xe(s)?"Copied!":"Copy",on("click",async()=>{await navigator.clipboard.writeText(e.trim()),Ke(s,!0),setTimeout(()=>Ke(s,!1),2e3)}),on("mouseenter",m=>{m.target.style.borderColor=t.borderLight,m.target.style.color=t.text}),on("mouseleave",m=>{m.target.style.borderColor=t.border,m.target.style.color=t.textMuted})):null)}function w(e){return code(o.codeInline,e)}const I=[{id:"counter",title:"Counter",description:"The classic counter example showing basic state management and event handling.",code:`import 'nuclo';

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

render(app, document.body);`}},_i=`import 'nuclo';

let count = 0;

const counter = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);`;let q=0;function qi(){return div(n(display("flex").flexDirection("column").gap("12px").padding("24px").backgroundColor(t.bgCard).border(`1px solid ${t.border}`).borderRadius("12px")),h3(n(fontSize("16px").fontWeight("600").color(t.text)),"Live Counter Demo"),div(n(display("flex").alignItems("center").gap("12px")),span(n(fontSize("32px").fontWeight("700").color(t.text)),()=>q),span(n(color(t.textDim)),()=>q%2===0?"even":"odd")),div(n(display("flex").gap("8px")),button(o.btnSecondary,"-",on("click",()=>{q--,update()})),button(o.btnSecondary,"Reset",on("click",()=>{q=0,update()})),button(o.btnPrimary,{style:o.btnPrimaryStyle},"+",on("click",()=>{q++,update()}))))}function Q(e,r,i){return div(o.featureCard,div(o.featureIcon,{style:o.featureIconStyle},e),h3(o.featureTitle,r),p(o.featureDesc,i),on("mouseenter",s=>{const l=s.currentTarget;l.style.borderColor=t.primary,l.style.transform="translateY(-4px)",l.style.boxShadow=`0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${t.primaryGlow}`}),on("mouseleave",s=>{const l=s.currentTarget;l.style.borderColor=t.border,l.style.transform="translateY(0)",l.style.boxShadow="none"}))}const Yi=["counter","todo","search","async","styled-card","subtasks"],Ji=I.filter(e=>Yi.includes(e.id));function Ki(e){R("examples"),setTimeout(()=>{const r=document.getElementById(e);r&&r.scrollIntoView({behavior:"smooth",block:"start"})},150)}function Xi(){return div(section(o.hero,h1(o.heroTitle,"Build ",span(o.heroTitleAccent,{style:o.heroTitleAccentStyle},"Faster"),", ",span(o.heroTitleAccent,{style:o.heroTitleAccentStyle},"Reactive")," Interfaces."),p(o.heroSubtitle,"A lightweight, flexible, component-based framework for the modern web. Just functions, plain objects, and explicit updates."),div(o.heroButtons,button(o.btnPrimary,{style:o.btnPrimaryStyle},n(display("flex").alignItems("center").gap("8px")),"Get Started",Mi(),on("click",()=>R("getting-started")),on("mouseenter",e=>{e.target.style.backgroundColor=t.primaryHover,e.target.style.transform="translateY(-2px)",e.target.style.boxShadow=`0 0 30px ${t.primaryGlow}`}),on("mouseleave",e=>{e.target.style.backgroundColor=t.primary,e.target.style.transform="translateY(0)",e.target.style.boxShadow=`0 0 20px ${t.primaryGlow}`})),button(o.btnSecondary,"View Demo",on("click",()=>R("examples")),on("mouseenter",e=>{e.target.style.borderColor=t.primary,e.target.style.color=t.primary,e.target.style.transform="translateY(-2px)"}),on("mouseleave",e=>{e.target.style.borderColor=t.borderLight,e.target.style.color=t.text,e.target.style.transform="translateY(0)"})))),section(n(padding("0 48px 100px").maxWidth("800px").margin("0 auto")),div(n(borderRadius("16px").border(`1px solid ${t.border}`).overflow("hidden")),{style:o.glowBoxStyle},div(n(padding("12px 20px").backgroundColor(t.bgLight).borderBottom(`1px solid ${t.border}`).display("flex").alignItems("center").gap("8px")),span(n(width("12px").height("12px").borderRadius("50%").backgroundColor("#ff5f57"))),span(n(width("12px").height("12px").borderRadius("50%").backgroundColor("#febc2e"))),span(n(width("12px").height("12px").borderRadius("50%").backgroundColor("#28c840"))),span(n(marginLeft("auto").fontSize("13px").color(t.textDim)),"main.ts")),d(_i,"typescript",!1))),section(o.features,{style:o.featuresStyle},Q(Ri(),"Lightweight & Fast","Zero dependencies, tiny bundle size. Built for performance from the ground up with direct DOM manipulation."),Q(zi(),"Component-Based","Build encapsulated components that manage their own state. Compose them to make complex UIs simple."),Q(Ai(),"Simple Reactivity","Explicit update() calls give you full control. No magic, no proxies, no hidden re-renders."),Q(Ii(),"Fine-Grained Updates","Only updates what changed. Elements are reused, branches are preserved, performance is maximized."),Q(Ei(),"TypeScript-First","Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime."),Q(Ni(),"Intuitive API","Global tag builders feel natural. Just use div(), span(), button() - no imports needed.")),section(o.section,h2(o.sectionTitle,"Quick Start"),p(o.sectionSubtitle,"Get up and running in seconds."),div(o.flexCol,o.gap32,div(h3(n(fontSize("18px").fontWeight("600").color(t.primary).marginBottom("16px")),"1. Install"),d("npm install nuclo","bash")),div(h3(n(fontSize("18px").fontWeight("600").color(t.primary).marginBottom("16px")),"2. Import and use"),d(`import 'nuclo';

// Now use div(), update(), on(), list(), when(), render() globally
const app = div(
  h1('Hello, Nuclo!'),
  p('Building UIs made simple.')
);

render(app, document.body);`,"typescript")),div(h3(n(fontSize("18px").fontWeight("600").color(t.primary).marginBottom("16px")),"3. Add TypeScript support"),d(`// tsconfig.json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`,"json"))),div(n(marginTop("32px")),h3(n(fontSize("18px").fontWeight("600").color(t.primary).marginBottom("16px")),"Try it live"),qi())),section(o.section,h2(o.sectionTitle,"Core Concepts"),p(o.sectionSubtitle,"Explicit updates, reactive functions, conditionals, list syncing, and styling."),div(o.demoContainer,{style:o.demoContainerStyle},div(o.demoPanel,div(o.demoPanelHeader,"Batch updates"),div(o.demoPanelContent,d(S.batchUpdates.code,S.batchUpdates.lang,!1))),div(o.demoPanel,div(o.demoPanelHeader,"Reactive functions"),div(o.demoPanelContent,d(S.reactiveText.code,S.reactiveText.lang,!1)))),div(n(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),div(o.featureCard,h3(o.featureTitle,"Conditional rendering"),d(`when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('Dashboard')
).else(
  div('Please log in')
);`,"typescript",!1)),div(o.featureCard,h3(o.featureTitle,"List synchronization"),d("list(() => items, (item, index) =>\n  div(() => `${index}: ${item.name}`)\n);","typescript",!1)),div(o.featureCard,h3(o.featureTitle,"CSS-in-JS styling"),d(h.overviewQuickExample.code,h.overviewQuickExample.lang,!1)))),section(o.section,h2(o.sectionTitle,"Examples"),p(o.sectionSubtitle,"Jump into any example from the original gallery."),div(n(display("grid").gap("20px"),{medium:gridTemplateColumns("repeat(3, 1fr)")}),...Ji.map(e=>div(o.featureCard,h3(o.featureTitle,e.title),p(o.featureDesc,e.description),button(o.btnSecondary,"View Example",on("click",()=>Ki(e.id))))))))}function Zi(){return div(o.pageContent,h1(o.pageTitle,"Getting Started"),p(o.pageSubtitle,"Everything from the original Nuclo docs: installs, Deno support, first app walkthrough, explicit updates, events, styling, and best practices."),h2(o.h2,"Installation"),p(o.p,"Install with your preferred package manager:"),d(S.installNpm.code,S.installNpm.lang),d(S.installYarn.code,S.installYarn.lang),d(S.installPnpm.code,S.installPnpm.lang),p(o.p,"Deno works too—import directly from npm:"),d(S.denoImport.code,S.denoImport.lang),p(o.p,"Or add it to ",w("deno.json"),":"),d(S.denoJson.code,S.denoJson.lang),p(o.p,"Then import once to register global builders:"),d(S.denoUsage.code,S.denoUsage.lang),h2(o.h2,"TypeScript Setup"),p(o.p,"Nuclo ships full typings for 140+ HTML/SVG builders. Enable them globally with ",w("types"),"."),d(S.tsconfigTypes.code,S.tsconfigTypes.lang),p(o.p,"…or add a reference to your env definition file:"),d(S.typesReference.code,S.typesReference.lang),h2(o.h2,"Your First App"),p(o.p,"Straight from the original landing page: a counter that shows state, events, and explicit ",w("update()"),"."),d(S.firstApp.code,S.firstApp.lang),h3(o.h3,"How it works"),ul(o.ul,li(o.li,strong("Import:")," ",w("import 'nuclo'")," registers global builders"),li(o.li,strong("State:")," plain variables/objects—no hooks or stores"),li(o.li,strong("Reactive content:")," zero-arg functions rerender on ",w("update()")),li(o.li,strong("Events:")," attach listeners with ",w("on()")),li(o.li,strong("Render:")," mount once with ",w("render()"))),h2(o.h2,"Understanding update()"),p(o.p,w("update()")," is explicit: mutate freely, then call it once to refresh reactive functions."),h3(o.h3,"Batching updates"),d(S.batchUpdates.code,S.batchUpdates.lang),h3(o.h3,"Why explicit?"),ul(o.ul,li(o.li,"Performance: batch multiple mutations into one DOM update"),li(o.li,"Control: you decide exactly when the UI refreshes"),li(o.li,"Predictability: no hidden re-renders or proxies"),li(o.li,"Debugging: set a breakpoint on ",w("update()")," to trace changes")),h2(o.h2,"Reactive Functions"),p(o.p,"Any zero-arg function is reactive. Use them for text, attributes, and styles."),h3(o.h3,"Text content"),d(S.reactiveText.code,S.reactiveText.lang),h3(o.h3,"Attributes"),d(S.reactiveAttributes.code,S.reactiveAttributes.lang),h3(o.h3,"Styles"),d(S.reactiveStyles.code,S.reactiveStyles.lang),h3(o.h3,"Complex expressions"),d(S.complexExpressions.code,S.complexExpressions.lang),h2(o.h2,"Event Handling with on()"),p(o.p,"The ",w("on()")," helper returns modifiers for any DOM event."),h3(o.h3,"Basic events"),d(S.eventBasic.code,S.eventBasic.lang),h3(o.h3,"Multiple events"),d(S.eventMultiple.code,S.eventMultiple.lang),h3(o.h3,"Event options"),d(S.eventOptions.code,S.eventOptions.lang),h3(o.h3,"Keyboard helpers"),d(S.keyboardEvents.code,S.keyboardEvents.lang),h2(o.h2,"Styling"),p(o.p,"Nuclo ships a CSS-in-JS system with chainable helpers and ",w("createStyleQueries"),"."),h3(o.h3,"Using createStyleQueries"),d(S.stylingSetup.code,S.stylingSetup.lang),h3(o.h3,"Responsive styles"),d(S.responsiveStyles.code,S.responsiveStyles.lang),h3(o.h3,"Dynamic styles"),d(S.dynamicStyles.code,S.dynamicStyles.lang),h2(o.h2,"Best Practices"),h3(o.h3,"Batch your updates"),d(S.bestPracticeBatch.code,S.bestPracticeBatch.lang),h3(o.h3,"Use computed helpers"),d(S.bestPracticeComputed.code,S.bestPracticeComputed.lang),h3(o.h3,"Component-like functions"),d(S.componentFunctions.code,S.componentFunctions.lang),h3(o.h3,"Use plain objects/arrays"),d(S.mutableState.code,S.mutableState.lang),h3(o.h3,"Handle async flows"),d(S.asyncFlow.code,S.asyncFlow.lang),h2(o.h2,"Next Steps"),ul(o.ul,li(o.li,strong("Core API:")," learn ",w("when()"),", ",w("list()"),", and more"),li(o.li,strong("Tag Builders:")," explore all HTML and SVG elements"),li(o.li,strong("Styling:")," CSS-in-JS helpers and responsive design"),li(o.li,strong("Examples:")," run through the full demo gallery")))}const v={updateUsage:{lang:"typescript",code:`let count = 0;

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
button('Hover me', tooltip('Click to submit'));`}};function ea(){return div(o.pageContent,h1(o.pageTitle,"Core API"),p(o.pageSubtitle,"The essential functions that power every Nuclo application: update(), render(), on(), list(), and when()."),h2(o.h2,{id:"update"},"update()"),p(o.p,"Trigger a synchronous refresh of every reactive function in your application."),d(v.updateUsage.code,v.updateUsage.lang),h3(o.h3,"Key Points"),ul(o.ul,li(o.li,"Call after batching mutations for best performance"),li(o.li,"Only zero-argument functions re-evaluate"),li(o.li,"Safe to call multiple times; prefer grouping work first")),h2(o.h2,{id:"render"},"render(element, container)"),p(o.p,"Mount an element tree to a DOM container (append, not replace)."),d(v.renderUsage.code,v.renderUsage.lang),h3(o.h3,"Key Points"),ul(o.ul,li(o.li,"Typical pattern: render one root that owns the whole app"),li(o.li,"You can render multiple trees if needed"),li(o.li,"Works with any element created by the tag builders")),h2(o.h2,{id:"on"},"on(event, handler, options?)"),p(o.p,"Attach event listeners with full TypeScript support."),d(v.onClick.code,v.onClick.lang),h3(o.h3,"Multiple Events"),p(o.p,"Attach multiple event handlers to the same element:"),d(v.onMultipleEvents.code,v.onMultipleEvents.lang),h3(o.h3,"Event Options"),p(o.p,"Pass standard event listener options:"),d(v.onPassive.code,v.onPassive.lang),h3(o.h3,"Keyboard Events"),d(v.onKeyboard.code,v.onKeyboard.lang),h3(o.h3,"Form Handling"),d(v.onFormSubmit.code,v.onFormSubmit.lang),h2(o.h2,{id:"list"},"list(provider, renderer)"),p(o.p,"Synchronize arrays to DOM nodes. Items stay mounted while object identity is stable—mutate objects in place instead of replacing them."),d(v.listBasic.code,v.listBasic.lang),h3(o.h3,"Object Identity"),p(o.p,"Nuclo tracks items by reference. Mutate objects to preserve their DOM elements:"),d(v.listIdentity.code,v.listIdentity.lang),h3(o.h3,"Nested Lists"),p(o.p,"Nested lists remain stable too:"),d(v.listNested.code,v.listNested.lang),h2(o.h2,{id:"when"},"when(condition, ...content)"),p(o.p,"Chain conditional branches; the first truthy branch wins and DOM is preserved when the branch stays the same."),h3(o.h3,"Basic Usage"),d(v.whenBasic.code,v.whenBasic.lang),h3(o.h3,"Multiple Conditions"),d(v.whenRoles.code,v.whenRoles.lang),h3(o.h3,"Content in Branches"),d(v.whenElseBranch.code,v.whenElseBranch.lang),h3(o.h3,"DOM Preservation"),p(o.p,"Elements persist across updates if the same branch is active:"),d(v.whenPreserve.code,v.whenPreserve.lang),h3(o.h3,"Nested Conditions"),d(v.whenNestedConditions.code,v.whenNestedConditions.lang))}function ta(){const e=[{title:"Document Structure",tags:"html, head, body, header, footer, main, section, article, aside, nav"},{title:"Content Sectioning",tags:"h1, h2, h3, h4, h5, h6, div, span, p, blockquote, pre, code"},{title:"Lists",tags:"ul, ol, li, dl, dt, dd"},{title:"Forms",tags:"form, input, textarea, button, select, option, label, fieldset, legend"},{title:"Tables",tags:"table, thead, tbody, tfoot, tr, th, td, caption, col, colgroup"},{title:"Media",tags:"img, video, audio, source, track, canvas, svg"},{title:"Interactive",tags:"a, button, details, summary, dialog"},{title:"Text Formatting",tags:"strong, em, mark, small, del, ins, sub, sup, abbr, cite, q, kbd, samp, var"}];return div(o.pageContent,h1(o.pageTitle,"Tag Builders"),p(o.pageSubtitle,"Every HTML and SVG element is available globally after importing Nuclo. Build your UI with simple function calls."),h2(o.h2,{id:"overview"},"Overview"),p(o.p,"Tag builders accept children, attributes, event modifiers, and arrays. After ",w("import 'nuclo'"),", all builders are available globally."),d(v.tagBuilderBasic.code,v.tagBuilderBasic.lang),h2(o.h2,{id:"html-tags"},"HTML Tags"),p(o.p,"Full HTML5 coverage with 140+ elements:"),...e.map(r=>div(h3(n(fontSize("18px").fontWeight("600").marginTop("24px").marginBottom("12px")),r.title),pre(o.codeBlock,code(r.tags)))),p(o.p,n(marginTop("24px")),"And 100+ more—see ",a({href:"https://github.com/dan2dev/nuclo/blob/main/packages/nuclo/src/core/tagRegistry.ts",target:"_blank",rel:"noopener noreferrer"},w("the full registry")),"."),h2(o.h2,{id:"svg-tags"},"SVG Tags"),p(o.p,"Full SVG support for graphics and icons:"),d(`svg, circle, ellipse, line, path, polygon, polyline, rect,
g, defs, use, symbol, marker, clipPath, mask, pattern,
linearGradient, radialGradient, stop, text, tspan, textPath`,"text"),h3(o.h3,"SVG Example"),d(v.svgExample.code,v.svgExample.lang),h2(o.h2,{id:"attributes"},"Attributes"),p(o.p,"Pass attributes as objects—values can be static or reactive functions."),h3(o.h3,"Static Attributes"),d(v.attributesStatic.code,v.attributesStatic.lang),h3(o.h3,"Reactive Attributes"),p(o.p,"Use functions for dynamic values that update on ",w("update()"),":"),d(v.attributesReactive.code,v.attributesReactive.lang),h3(o.h3,"Style Objects"),p(o.p,"Styles can be objects, strings, or reactive functions:"),d(v.attributesStyle.code,v.attributesStyle.lang),h3(o.h3,"Boolean Attributes"),d(v.attributesBoolean.code,v.attributesBoolean.lang),h3(o.h3,"Special Attributes"),p(o.p,"Some attributes are mapped for convenience:"),d(v.specialAttributes.code,v.specialAttributes.lang),h2(o.h2,{id:"className-merging"},"className Merging"),p(o.p,"Multiple ",w("className")," values are merged rather than overwritten—static strings, reactive functions, and style helper modifiers all compose."),d(v.classNameMerging.code,v.classNameMerging.lang),h3(o.h3,"Conditional Classes"),d(v.classNameConditional.code,v.classNameConditional.lang),h3(o.h3,"With Style Helpers"),d(v.styleHelperMerging.code,v.styleHelperMerging.lang),h3(o.h3,"Status Pattern"),p(o.p,"Common pattern for conditional styling:"),d(v.classNameStatusPattern.code,v.classNameStatusPattern.lang),h2(o.h2,{id:"modifiers"},"Modifiers"),p(o.p,"Objects with ",w("__modifier")," allow behaviors beyond attributes."),h3(o.h3,"Event Modifiers"),d(v.modifiersEvents.code,v.modifiersEvents.lang),h3(o.h3,"Style Modifiers"),d(v.modifiersStyles.code,v.modifiersStyles.lang),h3(o.h3,"Custom Modifiers"),p(o.p,"Create your own modifiers for reusable behaviors:"),d(v.modifiersCustomFocus.code,v.modifiersCustomFocus.lang))}function oa(){return div(o.pageContent,h1(o.pageTitle,"Styling"),p(o.pageSubtitle,"All of the original styling docs are here: chainable helpers, StyleBuilder utilities, responsive queries, and layout recipes."),h2(o.h2,"Overview"),p(o.p,"Nuclo's styling system is powered by chainable helpers that generate CSS classes for you. Start with any helper (",w("bg()"),", ",w("padding()"),", etc.), chain more, and wrap with ",w("createStyleQueries")," for responsive variants."),p(o.p,"Quick example straight from the legacy site:"),d(h.overviewQuickExample.code,h.overviewQuickExample.lang),h2(o.h2,"StyleBuilder"),p(o.p,"Each helper returns a StyleBuilder instance. You can chain helpers, pull out the generated class name, or read the computed styles."),h3(o.h3,"How it works"),d(h.styleBuilderUsage.code,h.styleBuilderUsage.lang),h3(o.h3,"StyleBuilder methods"),d(h.styleBuilderMethods.code,h.styleBuilderMethods.lang),h3(o.h3,"Generated CSS"),d(h.styleBuilderClass.code,h.styleBuilderClass.lang),h2(o.h2,"Style Helpers"),p(o.p,"95+ helpers mirror CSS properties: layout, spacing, typography, color, flexbox, grid, effects, and more. Chain them to build up reusable class names."),h3(o.h3,"Basic usage"),d(h.styleHelpersBasic.code,h.styleHelpersBasic.lang),h3(o.h3,"Available helpers (from the original reference)"),d(h.styleHelpersList.code,h.styleHelpersList.lang),h3(o.h3,"Shorthand helpers"),d(h.styleHelpersShorthand.code,h.styleHelpersShorthand.lang),h2(o.h2,"Style Queries"),p(o.p,"Use ",w("createStyleQueries")," to add media, container, or feature queries. Defaults can be merged with breakpoint overrides."),d(h.styleQueriesSetup.code,h.styleQueriesSetup.lang),h3(o.h3,"Defaults and overrides"),d(h.styleQueriesDefaults.code,h.styleQueriesDefaults.lang),h3(o.h3,"Generated CSS output"),d(h.styleQueriesGeneratedCss.code,h.styleQueriesGeneratedCss.lang,!1),h3(o.h3,"Query-only styles"),d(h.styleQueriesQueriesOnly.code,h.styleQueriesQueriesOnly.lang),h3(o.h3,"Container queries"),d(h.styleQueriesContainer.code,h.styleQueriesContainer.lang),h3(o.h3,"Feature queries"),d(h.styleQueriesFeature.code,h.styleQueriesFeature.lang),h3(o.h3,"Viewport breakpoints example"),d(h.styleQueriesExamples.code,h.styleQueriesExamples.lang),h2(o.h2,"Layout"),p(o.p,"Display, positioning, sizing, spacing, and overflow helpers pulled from the original docs."),h3(o.h3,"Display & position"),d(h.layoutDisplayPosition.code,h.layoutDisplayPosition.lang),h3(o.h3,"Sizing"),d(h.layoutSizing.code,h.layoutSizing.lang),h3(o.h3,"Spacing"),d(h.layoutSpacing.code,h.layoutSpacing.lang),h3(o.h3,"Overflow"),d(h.layoutOverflow.code,h.layoutOverflow.lang),h2(o.h2,"Typography"),p(o.p,"Font and text styling helpers."),h3(o.h3,"Font properties"),d(h.typographyFont.code,h.typographyFont.lang),h3(o.h3,"Text styling"),d(h.typographyText.code,h.typographyText.lang),h3(o.h3,"Typography system example"),d(h.typographySystem.code,h.typographySystem.lang),h2(o.h2,"Colors & Backgrounds"),h3(o.h3,"Colors"),d(h.colorsBasic.code,h.colorsBasic.lang),h3(o.h3,"Gradients"),d(h.colorsGradients.code,h.colorsGradients.lang),h3(o.h3,"Background properties"),d(h.colorsBackground.code,h.colorsBackground.lang),h2(o.h2,"Flexbox"),p(o.p,"Container and item helpers, plus an example navbar layout."),h3(o.h3,"Container helpers"),d(h.flexContainer.code,h.flexContainer.lang),h3(o.h3,"Item helpers"),d(h.flexItem.code,h.flexItem.lang),h3(o.h3,"Navbar example"),d(h.flexNavbarExample.code,h.flexNavbarExample.lang),h2(o.h2,"CSS Grid"),h3(o.h3,"Container helpers"),d(h.gridContainer.code,h.gridContainer.lang),h3(o.h3,"Item helpers"),d(h.gridItem.code,h.gridItem.lang),h3(o.h3,"Responsive card grid"),d(h.gridResponsiveExample.code,h.gridResponsiveExample.lang),h2(o.h2,"Effects & Transitions"),p(o.p,"Shadows, opacity, transitions, transforms, filters, and hover-friendly reactive styles."),h3(o.h3,"Box shadows"),d(h.effectsShadows.code,h.effectsShadows.lang),h3(o.h3,"Visibility"),d(h.effectsVisibility.code,h.effectsVisibility.lang),h3(o.h3,"Transitions"),d(h.effectsTransitions.code,h.effectsTransitions.lang),h3(o.h3,"Transforms"),d(h.effectsTransforms.code,h.effectsTransforms.lang),h3(o.h3,"Filters & backdrop"),d(h.effectsFilters.code,h.effectsFilters.lang),h3(o.h3,"Hover effects with reactive styles"),d(h.effectsHover.code,h.effectsHover.lang),h2(o.h2,"Organizing Styles"),p(o.p,"Reuse the theme + style modules from the legacy page: keep tokens, shared layout pieces, and component styles in one place."),h3(o.h3,"Theme constants"),d(h.organizingTheme.code,h.organizingTheme.lang),h3(o.h3,"Shared styles"),d(h.organizingStyles.code,h.organizingStyles.lang),h3(o.h3,"Using the styles"),d(h.organizingUsage.code,h.organizingUsage.lang),h2(o.h2,"Next Steps"),ul(o.ul,li(o.li,"Explore ",w("CodeBlock")," + ",w("InlineCode")," components to present snippets cleanly."),li(o.li,"Combine ",w("createStyleQueries")," with the helpers above for responsive variants."),li(o.li,"Jump to the ",a({href:"#examples"},"Examples page")," to see these styles in action.")))}function ra(){return div(o.pageContent,h1(o.pageTitle,"Common Pitfalls"),p(o.pageSubtitle,"Avoid these common mistakes when building with Nuclo. Learn the patterns that work and why."),h2(o.h2,{id:"conditional-elements"},"Conditional Element Rendering"),div(n(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(o.p,"Using a reactive function to conditionally return different elements won't work:"),d(`// ❌ Wrong - reactive function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // This won't display anything!
)`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(o.p,"Use ",w("when()")," for conditional element rendering:"),d(`// ✅ Correct - use when() for conditional elements
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(o.p,"Reactive functions ",w("() => value")," work great for text content and attribute values because Nuclo can update them in place. But elements need to be mounted/unmounted from the DOM, which requires ",w("when()")," to manage properly.")),h2(o.h2,{id:"forgetting-update"},"Forgetting to Call update()"),div(n(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(o.p,"Changing state without calling ",w("update()")," won't refresh the UI:"),d(`// ❌ Wrong - UI won't update
let count = 0;

button('Increment', on('click', () => {
  count++;  // State changed but UI stays the same
}))`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(o.p,"Always call ",w("update()")," after changing state:"),d(`// ✅ Correct - call update() to refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // Now the UI will reflect the new count
}))`,"typescript")),h2(o.h2,{id:"list-identity"},"Replacing Objects in Lists"),div(n(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(o.p,"Replacing objects instead of mutating them causes unnecessary DOM recreation:"),d(`// ❌ Wrong - creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(o.p,"Mutate the existing object to preserve its DOM element:"),d(`// ✅ Correct - mutate the object, element is preserved
todos[0].done = true;
update();`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(o.p,"Nuclo's ",w("list()")," tracks items by object identity (reference). When you replace an object with a new one, Nuclo sees it as a different item and recreates the DOM element. Mutating preserves identity and enables efficient updates.")),h2(o.h2,{id:"multiple-updates"},"Multiple update() Calls"),div(n(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(o.p,"Calling ",w("update()")," multiple times is wasteful:"),d(`// ❌ Inefficient - 3 updates instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
}`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(o.p,"Batch all state changes, then call ",w("update()")," once:"),d(`// ✅ Efficient - batch changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  update();  // One update for all changes
}`,"typescript")),h2(o.h2,{id:"static-vs-reactive"},"Static Values Instead of Reactive"),div(n(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(n(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(o.p,"Using a static value when you need it to update:"),d(`// ❌ Wrong - count is captured once, never updates
let count = 0;

div(
  \`Count: \${count}\`  // Always shows "Count: 0"
)`,"typescript"),h3(n(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(o.p,"Wrap in a function to make it reactive:"),d(`// ✅ Correct - function is called on each update()
let count = 0;

div(
  () => \`Count: \${count}\`  // Updates when count changes
)`,"typescript")),h2(o.h2,{id:"summary"},"Quick Reference"),div(n(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`)),ul(o.ul,li(o.li,strong("Conditional elements:")," Use ",w("when()"),", not ",w("() => condition ? A : B")),li(o.li,strong("State changes:")," Always call ",w("update()")," after modifying state"),li(o.li,strong("Lists:")," Mutate objects, don't replace them"),li(o.li,strong("Batching:")," Group state changes before a single ",w("update()")),li(o.li,strong("Dynamic content:")," Wrap in ",w("() =>")," to make reactive"))))}const na={counter:"example-counter",todo:"example-todo",subtasks:"example-subtasks",search:"example-search",async:"example-async",forms:"example-forms",nested:"example-nested",animations:"example-animations",routing:"example-routing","styled-card":"example-styled-card"},ia=n(backgroundColor(t.bgCard).padding("24px").borderRadius("12px").border(`1px solid ${t.border}`).cursor("pointer").transition("all 0.2s")),aa=n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("8px")),sa=n(fontSize("14px").color(t.textMuted).lineHeight("1.5")),be=n(display("grid").gridTemplateColumns("repeat(auto-fill, minmax(300px, 1fr))").gap("20px").marginBottom("48px")),xe=n(fontSize("20px").fontWeight("600").color(t.text).marginBottom("20px").marginTop("32px")),la=n(display("inline-block").padding("4px 8px").backgroundColor("rgba(132, 204, 22, 0.15)").color(t.primary).fontSize("11px").fontWeight("600").borderRadius("4px").marginLeft("8px").textTransform("uppercase"));function ve(e,r){const i=na[e.id];return div(ia,on("click",()=>R(i)),on("mouseenter",s=>{s.currentTarget.style.borderColor=t.primary,s.currentTarget.style.transform="translateY(-2px)",s.currentTarget.style.boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"}),on("mouseleave",s=>{s.currentTarget.style.borderColor=t.border,s.currentTarget.style.transform="translateY(0)",s.currentTarget.style.boxShadow="none"}),div(aa,e.title,r?span(la,"Live Demo"):null),p(sa,e.description))}const da=["counter","todo","subtasks"],ca=["search","async","forms"],pa=["nested","animations","routing","styled-card"];function Se(e){return I.filter(r=>e.includes(r.id))}function ua(){const e=new Set(["counter","todo","subtasks","search","async","forms","nested","animations","routing","styled-card"]);return div(o.pageContent,h1(o.pageTitle,"Examples"),p(o.pageSubtitle,"Explore practical examples demonstrating Nuclo's features. Examples with live demos are marked with a badge."),h2(xe,"Getting Started"),p(n(color(t.textMuted).marginBottom("16px")),"Simple examples to help you understand the basics."),div(be,...Se(da).map(r=>ve(r,e.has(r.id)))),h2(xe,"Data & Forms"),p(n(color(t.textMuted).marginBottom("16px")),"Working with data, APIs, and form handling."),div(be,...Se(ca).map(r=>ve(r,e.has(r.id)))),h2(xe,"Advanced Patterns"),p(n(color(t.textMuted).marginBottom("16px")),"More complex patterns and techniques."),div(be,...Se(pa).map(r=>ve(r,e.has(r.id)))),section(n(marginTop("48px").paddingTop("32px").borderTop(`1px solid ${t.border}`)),h2(o.h2,"More Examples"),p(o.p,"Find even more demos in the ",a({href:"https://github.com/dan2dev/nuclo/tree/main/examples",target:"_blank",rel:"noopener noreferrer"},n(color(t.primary)),"GitHub examples directory"),".")))}let te=0;const ma=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Ze=n(padding("10px 20px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),ga=n(padding("10px 20px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").fontWeight("500").cursor("pointer").transition("all 0.2s"));function ha(){return div(ma,div(o.flexBetween,div(h3(n(fontSize("48px").fontWeight("700").color(t.text).marginBottom("8px")),()=>te),p(n(fontSize("14px").color(t.textMuted)),"Current count")),div(o.flex,o.gap8,button(Ze,n(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"−",on("click",()=>{te--,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=t.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=t.primary,e.target.style.transform="scale(1)"})),button(Ze,n(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),"+",on("click",()=>{te++,update()}),on("mouseenter",e=>{e.target.style.backgroundColor=t.primaryHover,e.target.style.transform="scale(1.05)"}),on("mouseleave",e=>{e.target.style.backgroundColor=t.primary,e.target.style.transform="scale(1)"})),button(ga,"Reset",on("click",()=>{te=0,update()}),on("mouseenter",e=>{e.target.style.borderColor=t.primary}),on("mouseleave",e=>{e.target.style.borderColor=t.border})))))}function fa(){const e=I.find(r=>r.id==="counter");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),ha(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let M=[{id:1,text:"Learn Nuclo",done:!0},{id:2,text:"Build something awesome",done:!1},{id:3,text:"Share with friends",done:!1}],D="",et=4;const ya=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),ba=n(padding("10px 20px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),xa=n(padding("10px 14px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").outline("none").width("220px").transition("border-color 0.2s"));function va(){const e=n(width("20px").height("20px").cursor("pointer")),r={accentColor:t.primary},i=n(display("flex").alignItems("center").gap("14px").padding("14px 16px").backgroundColor(t.bgLight).borderRadius("10px").marginBottom("10px").transition("all 0.2s")),s=n(marginLeft("auto").padding("6px 10px").backgroundColor("transparent").color(t.textDim).border("none").borderRadius("6px").cursor("pointer").fontSize("18px").transition("all 0.2s"));return div(ya,div(o.flex,o.gap8,o.mb24,input(xa,{type:"text",placeholder:"Add a new task...",value:()=>D},on("input",l=>{D=l.target.value,update()}),on("keydown",l=>{l.key==="Enter"&&D.trim()&&(M.push({id:et++,text:D,done:!1}),D="",update())}),on("focus",l=>{l.target.style.borderColor=t.primary}),on("blur",l=>{l.target.style.borderColor=t.border})),button(ba,"Add Task",on("click",()=>{D.trim()&&(M.push({id:et++,text:D,done:!1}),D="",update())}),on("mouseenter",l=>{l.target.style.backgroundColor=t.primaryHover}),on("mouseleave",l=>{l.target.style.backgroundColor=t.primary}))),div(()=>`${M.filter(l=>!l.done).length} remaining · ${M.filter(l=>l.done).length} completed`,n(fontSize("13px").color(t.textDim).marginBottom("20px").fontWeight("500"))),when(()=>M.length>0,list(()=>M,l=>div(i,input(e,{style:r},{type:"checkbox",checked:()=>l.done},on("change",()=>{l.done=!l.done,update()})),span(()=>l.done?n(color(t.textDim).textDecoration("line-through").fontSize("15px")):n(color(t.text).fontSize("15px")),()=>l.text),button(s,"×",on("click",()=>{M=M.filter(c=>c.id!==l.id),update()}),on("mouseenter",c=>{c.target.style.backgroundColor="rgba(239, 68, 68, 0.1)",c.target.style.color="#ef4444"}),on("mouseleave",c=>{c.target.style.backgroundColor="transparent",c.target.style.color=t.textDim}))))).else(p(n(color(t.textDim).textAlign("center").padding("32px").fontSize("15px")),"No tasks yet. Add one above!")))}function Sa(){const e=I.find(r=>r.id==="todo");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),va(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let ee=[{id:1,text:"Learn Nuclo basics",done:!0,expanded:!0,subtasks:[{id:2,text:"Read documentation",done:!0,expanded:!0,subtasks:[]},{id:3,text:"Try examples",done:!1,expanded:!0,subtasks:[]}]},{id:4,text:"Build a project",done:!1,expanded:!0,subtasks:[{id:5,text:"Setup environment",done:!0,expanded:!0,subtasks:[]},{id:6,text:"Write components",done:!1,expanded:!0,subtasks:[]}]}],ka=7,W="";const wa=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Ca=n(padding("10px 14px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").outline("none").flex("1").transition("border-color 0.2s")),Pa=n(padding("10px 20px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Ta=n(marginBottom("8px")),Ba=n(display("flex").alignItems("center").gap("10px").padding("10px 14px").backgroundColor(t.bgLight).borderRadius("8px").transition("all 0.2s")),Ra=n(width("24px").height("24px").backgroundColor("transparent").border("none").color(t.textMuted).cursor("pointer").fontSize("12px").display("flex").alignItems("center").justifyContent("center").borderRadius("4px").transition("all 0.2s")),za=n(width("18px").height("18px").cursor("pointer")),Ia=n(marginLeft("auto").padding("4px 8px").backgroundColor("transparent").color(t.textDim).border("none").borderRadius("4px").cursor("pointer").fontSize("16px").transition("all 0.2s")),Aa=n(fontSize("12px").color(t.textDim).marginLeft("8px")),Ea=n(marginLeft("34px").marginTop("8px")),Na=n(marginLeft("34px").marginTop("8px")),Ma=n(padding("6px 10px").backgroundColor(t.bg).color(t.text).border(`1px solid ${t.border}`).borderRadius("6px").fontSize("13px").outline("none").width("200px").transition("border-color 0.2s"));function Da(e){return{id:ka++,text:e,done:!1,subtasks:[],expanded:!0}}function Ne(e,r){const i=Da(e);r?r.subtasks.push(i):ee.push(i),update()}function Wa(e){e.done=!e.done;function r(i,s){i.done=s,i.subtasks.forEach(l=>r(l,s))}r(e,e.done),update()}function $a(e){e.expanded=!e.expanded,update()}function La(e,r){r?r.subtasks=r.subtasks.filter(i=>i.id!==e.id):ee=ee.filter(i=>i.id!==e.id),update()}function ht(e,r){let i="";return div(Ta,div(Ba,when(()=>e.subtasks.length>0,button(Ra,()=>e.expanded?"▼":"▶",on("click",()=>$a(e)),on("mouseenter",s=>{s.target.style.backgroundColor=t.bgCard}),on("mouseleave",s=>{s.target.style.backgroundColor="transparent"}))).else(span(n(width("24px").display("inline-block")))),input(za,{style:{accentColor:t.primary}},{type:"checkbox",checked:()=>e.done},on("change",()=>Wa(e))),span(n(fontSize("14px").transition("all 0.2s")),{style:()=>({color:e.done?t.textDim:t.text,textDecoration:e.done?"line-through":"none"})},()=>e.text),when(()=>e.subtasks.length>0,span(Aa,()=>`(${e.subtasks.filter(s=>s.done).length}/${e.subtasks.length})`)),button(Ia,"×",on("click",()=>La(e,r)),on("mouseenter",s=>{s.target.style.backgroundColor="rgba(239, 68, 68, 0.1)",s.target.style.color="#ef4444"}),on("mouseleave",s=>{s.target.style.backgroundColor="transparent",s.target.style.color=t.textDim}))),when(()=>e.expanded&&e.subtasks.length>0,div(Ea,list(()=>e.subtasks,s=>ht(s,e)))),when(()=>e.expanded,div(Na,input(Ma,{type:"text",placeholder:"Add subtask...",value:()=>i},on("input",s=>{i=s.target.value,update()}),on("keydown",s=>{s.key==="Enter"&&i.trim()&&(Ne(i.trim(),e),i="",update())}),on("focus",s=>{s.target.style.borderColor=t.primary}),on("blur",s=>{s.target.style.borderColor=t.border})))))}function Fa(){return div(wa,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"Tasks with Subtasks"),div(o.flex,o.gap8,o.mb24,input(Ca,{type:"text",placeholder:"Add a new task...",value:()=>W},on("input",e=>{W=e.target.value,update()}),on("keydown",e=>{e.key==="Enter"&&W.trim()&&(Ne(W.trim()),W="",update())}),on("focus",e=>{e.target.style.borderColor=t.primary}),on("blur",e=>{e.target.style.borderColor=t.border})),button(Pa,"Add Task",on("click",()=>{W.trim()&&(Ne(W.trim()),W="",update())}),on("mouseenter",e=>{e.target.style.backgroundColor=t.primaryHover}),on("mouseleave",e=>{e.target.style.backgroundColor=t.primary}))),when(()=>ee.length>0,div(list(()=>ee,e=>ht(e)))).else(p(n(color(t.textDim).textAlign("center").padding("32px")),"No tasks yet. Add one above!")))}function ja(){const e=I.find(r=>r.id==="subtasks");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),Fa(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}const Ha=[{id:1,name:"Alice Johnson",email:"alice@example.com",role:"Admin"},{id:2,name:"Bob Smith",email:"bob@example.com",role:"User"},{id:3,name:"Charlie Brown",email:"charlie@example.com",role:"User"},{id:4,name:"Diana Prince",email:"diana@example.com",role:"Admin"},{id:5,name:"Eve Anderson",email:"eve@example.com",role:"User"}];let Y="",de="all";const Ua=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Oa=n(padding("10px 14px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").outline("none").flex("1").minWidth("200px").transition("border-color 0.2s")),Ga=n(padding("10px 14px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").outline("none").cursor("pointer").transition("border-color 0.2s")),Qa=n(padding("16px").backgroundColor(t.bgLight).borderRadius("10px").marginBottom("12px").transition("all 0.2s")),Va=n(display("inline-block").padding("4px 10px").borderRadius("20px").fontSize("12px").fontWeight("600"));function ke(){const e=Y.toLowerCase();return Ha.filter(r=>{const i=r.name.toLowerCase().includes(e)||r.email.toLowerCase().includes(e),s=de==="all"||r.role===de;return i&&s})}function _a(){return div(Ua,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"User Directory"),div(o.flex,o.gap16,o.mb24,n(flexWrap("wrap")),input(Oa,{type:"search",placeholder:"Search by name or email...",value:()=>Y},on("input",e=>{Y=e.target.value,update()}),on("focus",e=>{e.target.style.borderColor=t.primary}),on("blur",e=>{e.target.style.borderColor=t.border})),select(Ga,{value:()=>de},on("change",e=>{de=e.target.value,update()}),on("focus",e=>{e.target.style.borderColor=t.primary}),on("blur",e=>{e.target.style.borderColor=t.border}),option({value:"all"},"All Roles"),option({value:"Admin"},"Admins"),option({value:"User"},"Users"))),p(n(fontSize("13px").color(t.textDim).marginBottom("16px")),()=>{const e=ke().length;return`Showing ${e} user${e!==1?"s":""}`}),when(()=>ke().length>0,div(list(()=>ke(),e=>div(Qa,on("mouseenter",r=>{r.currentTarget.style.backgroundColor=t.bgCard}),on("mouseleave",r=>{r.currentTarget.style.backgroundColor=t.bgLight}),div(o.flexBetween,div(h4(n(fontSize("15px").fontWeight("600").color(t.text).marginBottom("4px")),e.name),p(n(fontSize("13px").color(t.textMuted).margin("0")),e.email)),span(Va,{style:{backgroundColor:e.role==="Admin"?"rgba(132, 204, 22, 0.15)":"rgba(100, 116, 139, 0.15)",color:e.role==="Admin"?t.primary:t.textMuted}},e.role)))))).else(div(n(textAlign("center").padding("32px").color(t.textDim)),()=>Y?`No users found matching "${Y}"`:"No users found")))}function qa(){const e=I.find(r=>r.id==="search");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),_a(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let T={status:"idle",products:[]},A="phone";const Ya=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Ja=n(padding("10px 14px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").outline("none").flex("1").transition("border-color 0.2s")),Ka=n(padding("10px 20px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s")),Xa={backgroundColor:t.bgLight,color:t.textDim,cursor:"not-allowed"},Za=n(display("grid").gap("12px").marginTop("20px")),es=n(padding("16px").backgroundColor(t.bgLight).borderRadius("10px").transition("all 0.2s")),ts=n(textAlign("center").padding("32px").color(t.textMuted)),os=n(padding("16px").backgroundColor("rgba(239, 68, 68, 0.1)").borderRadius("8px").color("#ef4444").marginTop("16px"));async function we(){if(A.trim()){T.status="loading",T.error=void 0,update();try{const e=await fetch(`https://dummyjson.com/products/search?q=${A}`);if(!e.ok)throw new Error("Failed to fetch products");const r=await e.json();T.products=r.products.slice(0,6),T.status="success"}catch(e){T.status="error",T.error=e.message}update()}}function rs(){return div(Ya,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"Product Search"),div(o.flex,o.gap8,input(Ja,{type:"search",placeholder:"Search products...",value:()=>A,disabled:()=>T.status==="loading"},on("input",e=>{A=e.target.value,update()}),on("keydown",e=>{e.key==="Enter"&&we()}),on("focus",e=>{e.target.style.borderColor=t.primary}),on("blur",e=>{e.target.style.borderColor=t.border})),button(Ka,{disabled:()=>T.status==="loading"||!A.trim(),style:()=>T.status==="loading"||!A.trim()?Xa:{}},()=>T.status==="loading"?"Searching...":"Search",on("click",we),on("mouseenter",e=>{T.status!=="loading"&&A.trim()&&(e.target.style.backgroundColor=t.primaryHover)}),on("mouseleave",e=>{T.status!=="loading"&&A.trim()&&(e.target.style.backgroundColor=t.primary)}))),when(()=>T.status==="loading",div(ts,"Loading products...")).when(()=>T.status==="error",div(os,o.flexBetween,span(()=>`Error: ${T.error}`),button(n(padding("6px 12px").backgroundColor("transparent").color("#ef4444").border("1px solid #ef4444").borderRadius("6px").fontSize("13px").cursor("pointer")),"Retry",on("click",we)))).when(()=>T.status==="success"&&T.products.length>0,div(p(n(fontSize("13px").color(t.textDim).marginTop("16px")),()=>`Found ${T.products.length} products`),div(Za,{style:{gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))"}},list(()=>T.products,e=>div(es,on("mouseenter",r=>{r.currentTarget.style.backgroundColor=t.bgCard}),on("mouseleave",r=>{r.currentTarget.style.backgroundColor=t.bgLight}),h4(n(fontSize("14px").fontWeight("600").color(t.text).marginBottom("6px")),e.title),p(n(fontSize("12px").color(t.textDim).margin("0 0 8px 0")),e.category),p(n(fontSize("16px").fontWeight("700").color(t.primary).margin("0")),`$${e.price.toFixed(2)}`)))))).when(()=>T.status==="success"&&T.products.length===0,div(n(textAlign("center").padding("32px").color(t.textDim)),()=>`No products found for "${A}"`)).else(div(n(textAlign("center").padding("32px").color(t.textDim)),"Enter a search term and click Search")))}function ns(){const e=I.find(r=>r.id==="async");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),rs(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let $={username:"",email:"",password:"",confirmPassword:""},z={},L=!1,ie="idle";const is=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),as=n(marginBottom("20px")),ss=n(display("block").fontSize("14px").fontWeight("500").color(t.text).marginBottom("8px")),ls=n(width("100%").padding("12px 14px").backgroundColor(t.bgLight).color(t.text).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").outline("none").transition("border-color 0.2s")),ds={borderColor:"#ef4444"},cs=n(fontSize("12px").color("#ef4444").marginTop("6px")),ps=n(width("100%").padding("14px 20px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s").marginTop("8px")),us={backgroundColor:t.bgLight,color:t.textDim,cursor:"not-allowed"},ms=n(padding("16px").backgroundColor("rgba(132, 204, 22, 0.1)").borderRadius("8px").color(t.primary).marginBottom("20px").textAlign("center"));function gs(){return z={},$.username.length<3&&(z.username="Username must be at least 3 characters"),$.email.includes("@")||(z.email="Please enter a valid email"),$.password.length<6&&(z.password="Password must be at least 6 characters"),$.password!==$.confirmPassword&&(z.confirmPassword="Passwords do not match"),Object.keys(z).length===0}async function hs(e){if(e.preventDefault(),!gs()){update();return}L=!0,ie="idle",update();try{await new Promise(r=>setTimeout(r,1e3)),ie="success",$={username:"",email:"",password:"",confirmPassword:""}}catch{ie="error"}L=!1,update()}function oe(e,r,i,s){return div(as,label(ss,r),input(ls,{type:i,placeholder:s,value:()=>$[e],disabled:()=>L,style:()=>z[e]?ds:{}},on("input",l=>{$[e]=l.target.value,delete z[e],update()}),on("focus",l=>{z[e]||(l.target.style.borderColor=t.primary)}),on("blur",l=>{z[e]||(l.target.style.borderColor=t.border)})),when(()=>!!z[e],span(cs,()=>z[e])))}function fs(){return div(is,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"Sign Up"),when(()=>ie==="success",div(ms,"Account created successfully!")),form(on("submit",hs),oe("username","Username","text","Enter username"),oe("email","Email","email","Enter email"),oe("password","Password","password","Enter password"),oe("confirmPassword","Confirm Password","password","Confirm password"),button(ps,{type:"submit",disabled:()=>L,style:()=>L?us:{}},()=>L?"Creating account...":"Sign Up",on("mouseenter",e=>{L||(e.target.style.backgroundColor=t.primaryHover)}),on("mouseleave",e=>{L||(e.target.style.backgroundColor=t.primary)}))))}function ys(){const e=I.find(r=>r.id==="forms");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),fs(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let ft=[{id:1,name:"Alice",avatar:"A",bio:"Software developer",followers:142},{id:2,name:"Bob",avatar:"B",bio:"Designer",followers:89},{id:3,name:"Charlie",avatar:"C",bio:"Product manager",followers:234}];const bs=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),xs=n(display("grid").gap("16px")),vs=n(padding("20px").backgroundColor(t.bgLight).borderRadius("12px").transition("all 0.2s")),Ss=n(width("48px").height("48px").borderRadius("50%").backgroundColor(t.primary).color(t.bg).display("flex").alignItems("center").justifyContent("center").fontSize("20px").fontWeight("600").marginBottom("12px")),ks=n(fontSize("16px").fontWeight("600").color(t.text).marginBottom("4px")),ws=n(fontSize("14px").color(t.textMuted).marginBottom("12px")),Cs=n(fontSize("13px").color(t.textDim).marginBottom("12px")),Ps=n(padding("8px 16px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("6px").fontSize("13px").fontWeight("600").cursor("pointer").transition("all 0.2s"));function Ts(e){const r=ft.find(i=>i.id===e);r&&(r.followers++,update())}function Bs(e){return div(vs,on("mouseenter",r=>{r.currentTarget.style.backgroundColor=t.bgCard,r.currentTarget.style.transform="translateY(-2px)"}),on("mouseleave",r=>{r.currentTarget.style.backgroundColor=t.bgLight,r.currentTarget.style.transform="translateY(0)"}),div(Ss,e.avatar),h4(ks,e.name),p(ws,e.bio),p(Cs,()=>`${e.followers} followers`),button(Ps,"Follow",on("click",()=>Ts(e.id)),on("mouseenter",r=>{r.target.style.backgroundColor=t.primaryHover}),on("mouseleave",r=>{r.target.style.backgroundColor=t.primary})))}function Rs(e){return div(xs,{style:{gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))"}},list(()=>e,r=>Bs(r)))}function zs(){return div(bs,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"User Directory"),p(n(fontSize("14px").color(t.textMuted).marginBottom("20px")),"This example shows reusable component functions."),Rs(ft))}function Is(){const e=I.find(r=>r.id==="nested");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),zs(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let ce=!0,Me=1,De=1,V=!1;const As=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Es=n(padding("12px 24px").backgroundColor(t.primary).color(t.bg).border("none").borderRadius("8px").fontSize("14px").fontWeight("600").cursor("pointer").transition("all 0.2s").marginBottom("24px")),Ns=n(width("200px").height("200px").borderRadius("16px").display("flex").alignItems("center").justifyContent("center").fontSize("16px").fontWeight("600").color(t.bg).margin("0 auto"));function Ms(){ce=!ce,update()}function Ds(){if(V)return;V=!0;const e=Date.now(),r=500;function i(){const s=Date.now()-e,l=Math.min(s/r,1),c=1-Math.pow(1-l,3);ce?(Me=c,De=.5+c*.5):(Me=1-c,De=1-c*.5),update(),l<1?requestAnimationFrame(i):V=!1}i()}function Ws(){return div(As,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"Animation Demo"),div(n(textAlign("center")),button(Es,{disabled:()=>V},()=>V?"Animating...":ce?"Hide":"Show",on("click",()=>{Ms(),Ds()}),on("mouseenter",e=>{V||(e.target.style.backgroundColor=t.primaryHover)}),on("mouseleave",e=>{e.target.style.backgroundColor=t.primary})),div(Ns,{style:()=>({opacity:String(Me),transform:`scale(${De})`,background:`linear-gradient(135deg, ${t.primary} 0%, ${t.primaryDark} 100%)`})},"Animated Box")))}function $s(){const e=I.find(r=>r.id==="animations");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),Ws(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let H="home";const Ls=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Fs=n(display("flex").gap("8px").marginBottom("24px").paddingBottom("16px").borderBottom(`1px solid ${t.border}`)),js=n(padding("10px 20px").backgroundColor("transparent").color(t.textMuted).border(`1px solid ${t.border}`).borderRadius("8px").fontSize("14px").fontWeight("500").cursor("pointer").transition("all 0.2s")),Hs={backgroundColor:t.primary,color:t.bg,borderColor:t.primary},Le=n(padding("24px").backgroundColor(t.bgLight).borderRadius("12px").minHeight("150px")),Fe=n(fontSize("20px").fontWeight("600").color(t.text).marginBottom("12px")),je=n(fontSize("14px").color(t.textMuted).lineHeight("1.6")),He=n(padding("8px 16px").backgroundColor(t.bgCard).color(t.primary).border(`1px solid ${t.border}`).borderRadius("6px").fontSize("13px").cursor("pointer").transition("all 0.2s").marginTop("16px"));function me(e){H=e,update()}function Us(){return div(Le,h3(Fe,"Home Page"),p(je,"Welcome to our website! This is a simple client-side routing example."),button(He,"Go to About →",on("click",()=>me("about")),on("mouseenter",e=>{e.target.style.borderColor=t.primary}),on("mouseleave",e=>{e.target.style.borderColor=t.border})))}function Os(){return div(Le,h3(Fe,"About Page"),p(je,"Learn more about us. We're passionate about building great software."),button(He,"Go to Contact →",on("click",()=>me("contact")),on("mouseenter",e=>{e.target.style.borderColor=t.primary}),on("mouseleave",e=>{e.target.style.borderColor=t.border})))}function Gs(){return div(Le,h3(Fe,"Contact Page"),p(je,"Get in touch! We'd love to hear from you."),button(He,"Go Home →",on("click",()=>me("home")),on("mouseenter",e=>{e.target.style.borderColor=t.primary}),on("mouseleave",e=>{e.target.style.borderColor=t.border})))}function Ce(e,r){return button(js,{style:()=>H===r?Hs:{}},e,on("click",()=>me(r)),on("mouseenter",i=>{H!==r&&(i.target.style.borderColor=t.primary,i.target.style.color=t.primary)}),on("mouseleave",i=>{H!==r&&(i.target.style.borderColor=t.border,i.target.style.color=t.textMuted)}))}function Qs(){return div(Ls,h3(n(fontSize("18px").fontWeight("600").color(t.text).marginBottom("20px")),"Mini Router Demo"),nav(Fs,Ce("Home","home"),Ce("About","about"),Ce("Contact","contact")),when(()=>H==="home",Us()).when(()=>H==="about",Os()).when(()=>H==="contact",Gs()))}function Vs(){const e=I.find(r=>r.id==="routing");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),Qs(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}let _s=[{id:1,name:"Wireless Headphones",description:"Premium noise-canceling headphones with 30-hour battery.",price:299.99,image:"🎧",inStock:!0},{id:2,name:"Smart Watch",description:"Track your fitness, receive notifications, and more.",price:399.99,image:"⌚",inStock:!0},{id:3,name:"Portable Speaker",description:"Waterproof speaker with incredible bass and clarity.",price:149.99,image:"🔊",inStock:!1}];const qs=n(backgroundColor(t.bgCard).padding("32px").borderRadius("16px").border(`1px solid ${t.border}`).marginBottom("32px")),Ys=n(textAlign("center").marginBottom("24px")),Js=n(fontSize("24px").fontWeight("700").color(t.text).marginBottom("8px")),Ks=n(fontSize("14px").color(t.textMuted)),Xs=n(display("grid").gap("20px")),Zs=n(backgroundColor(t.bgLight).borderRadius("12px").overflow("hidden").transition("all 0.3s").cursor("pointer")),el=n(position("relative").height("140px").display("flex").alignItems("center").justifyContent("center").fontSize("48px")),tl=n(position("absolute").top("0").left("0").right("0").bottom("0").backgroundColor("rgba(0,0,0,0.6)").display("flex").alignItems("center").justifyContent("center")),ol=n(color("white").fontSize("14px").fontWeight("600")),rl=n(padding("16px")),nl=n(fontSize("16px").fontWeight("600").color(t.text).marginBottom("8px")),il=n(fontSize("13px").color(t.textMuted).lineHeight("1.5").marginBottom("16px")),al=n(display("flex").justifyContent("space-between").alignItems("center")),sl=n(fontSize("18px").fontWeight("700").color(t.primary)),ll=n(padding("8px 16px").borderRadius("6px").border("none").fontSize("13px").fontWeight("600").cursor("pointer").transition("all 0.2s"));function dl(e){let r=!1;return div(Zs,{style:()=>({boxShadow:r?"0 10px 40px rgba(0,0,0,0.2)":"0 2px 8px rgba(0,0,0,0.1)",transform:r?"translateY(-4px)":"translateY(0)"})},on("mouseenter",()=>{r=!0,update()}),on("mouseleave",()=>{r=!1,update()}),div(el,{style:{background:`linear-gradient(135deg, ${t.bgCard} 0%, ${t.bgLight} 100%)`}},span({style:()=>({transform:r?"scale(1.1)":"scale(1)",transition:"transform 0.3s"})},e.image),when(()=>!e.inStock,div(tl,span(ol,"Out of Stock")))),div(rl,h4(nl,e.name),p(il,e.description),div(al,span(sl,`$${e.price.toFixed(2)}`),button(ll,{style:()=>({backgroundColor:e.inStock?t.primary:t.bgCard,color:e.inStock?t.bg:t.textDim,cursor:e.inStock?"pointer":"not-allowed"})},on("click",()=>{e.inStock&&alert(`Added ${e.name} to cart!`)}),on("mouseenter",i=>{e.inStock&&(i.target.style.backgroundColor=t.primaryHover)}),on("mouseleave",i=>{e.inStock&&(i.target.style.backgroundColor=t.primary)}),e.inStock?"Add to Cart":"Unavailable"))))}function cl(){return div(qs,div(Ys,h3(Js,"Featured Products"),p(Ks,"Discover our latest collection")),div(Xs,{style:{gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))"}},list(()=>_s,e=>dl(e))))}function pl(){const e=I.find(r=>r.id==="styled-card");return div(o.pageContent,a(n(color(t.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),"← Back to Examples",on("click",r=>{r.preventDefault(),R("examples")})),h1(o.pageTitle,e.title),p(o.pageSubtitle,e.description),cl(),h2(o.h2,"Source Code"),d(e.code,"typescript"))}Pi();Ti();const ml=div(Gi(),main({style:{minHeight:"calc(100vh - 160px)",paddingTop:"40px"}},when(()=>B()==="home",Xi()).when(()=>B()==="getting-started",Zi()).when(()=>B()==="core-api",ea()).when(()=>B()==="tag-builders",ta()).when(()=>B()==="styling",oa()).when(()=>B()==="pitfalls",ra()).when(()=>B()==="examples",ua()).when(()=>B()==="example-counter",fa()).when(()=>B()==="example-todo",Sa()).when(()=>B()==="example-subtasks",ja()).when(()=>B()==="example-search",qa()).when(()=>B()==="example-async",ns()).when(()=>B()==="example-forms",ys()).when(()=>B()==="example-nested",Is()).when(()=>B()==="example-animations",$s()).when(()=>B()==="example-routing",Vs()).when(()=>B()==="example-styled-card",pl())),Qi());render(ml,document.getElementById("app"));
