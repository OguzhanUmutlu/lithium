(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))c(l);new MutationObserver(l=>{for(const o of l)if(o.type==="childList")for(const y of o.addedNodes)y.tagName==="LINK"&&y.rel==="modulepreload"&&c(y)}).observe(document,{childList:!0,subtree:!0});function p(l){const o={};return l.integrity&&(o.integrity=l.integrity),l.referrerPolicy&&(o.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?o.credentials="include":l.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function c(l){if(l.ep)return;l.ep=!0;const o=p(l);fetch(l.href,o)}})();function H(h){const s=[],p=/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|\/\*(.|[\r\n])*?\*\/|\/\/[^\r\n]*|\/(\/)?([^\r\n\/])*|([A-Za-z_]\w*)|(-?\d+(\.\d*)?|0x[0-9a-f]+|\.\d+)|./g;return h.replace(p,(c,...l)=>c===" "?(s.push({color:"",value:"&nbsp;"}),""):c==='""'||c==="''"||l[0]||l[1]?(s.push({color:"#699f52",value:c}),""):l[2]||l[3]?(s.push({color:"#787d73",value:c}),""):l[4]?(s.push({color:"#53a7d5",value:c}),""):l[5]?(s.push({color:"#29ab94",value:c}),""):(s.push({color:"auto",value:c}),"")),s}function $(h){const s=document.querySelector(".cursor"),p=document.querySelector(".selection"),c=h.querySelector(".lines"),l=h.querySelector(".code");let o=!1,y=!1;const g=8.88,w=19,e={line1:0,key1:0,line2:0,key2:0};function L(n,i){return c.getBoundingClientRect().width+n*g+.5+"px "+(i*w+1.5)+"px"}function E(n,i){return`<div style="translate: ${L(n,i)}; width: ${(t[i].length-n)*g}px"></div>`}function a(){if(s.style.translate=L(e.key2,e.line2),!k()){p.innerHTML="";return}let n="";if(e.line1===e.line2){const i=Math.min(e.key1,e.key2),r=Math.max(e.key1,e.key2);n=`<div style="translate: ${L(i,e.line1)}; width: ${(r-i)*g}px"></div>`}else{const i=Math.min(e.line1,e.line2),r=Math.max(e.line1,e.line2);let u=i===e.line1?e.key1:e.key2,M=i===e.line2?e.key1:e.key2;n+=E(u,i);for(let f=i+1;f<r;f++)n+=E(0,f);e.line1!==e.line2&&(n+=`<div style="translate: ${L(0,r)}; width: ${M*g}px"></div>`)}p.innerHTML=n}function S(n){o!==n&&n&&(o=n,s.hidden=!o,o||(y=!1),a())}function C(){let n="";for(let i=0;i<t.length;i++)n+=`<div class="lines-line">${i+1}</div>`;c.innerHTML=n}function d(n){const i=l.children[n];let r="";const u=t[n],M=H(u);for(let f=0;f<M.length;f++){const D=M[f];r+=`<span style="color:${D.color}">${D.value}</span>`}i.innerHTML=r}function v(n){if(n===`
`)return m.Enter();if(n==="\b")return m.Backspace();k()&&m.Backspace();const i=t[e.line1];t[e.line1]=i.substring(0,e.key1)+n+i.substring(e.key1),e.key1=++e.key2,d(e.line1),a()}function k(){return e.key1!==e.key2||e.line1!==e.line2}function x(){const n=Math.max(e.key1,e.key2),i=Math.max(e.line1,e.line2);e.key1=e.key2=n,e.line1=e.line2=i,a()}function b(){e.key1<0&&(e.key1=e.key2=0),e.key1>t[e.line1].length&&(e.key1=e.key2=t[e.line1].length),e.line1<0&&(e.line1=e.line2=0),e.line1>t.length-1&&(e.line1=e.line2=t.length-1),a()}c.innerHTML="1",s.hidden=!0;const t=["11111111111","11111111111","11111111111","11111111111"];for(let n=0;n<t.length;n++)l.innerHTML+='<div class="line"></div>',C(),d(n),e.line1=++e.line2;addEventListener("blur",()=>S(!1)),addEventListener("mousedown",n=>{S(n.composedPath().includes(l))});const m={Enter(){k()&&m.Backspace();const n=document.createElement("div");n.classList.add("line");const i=l.children[e.line1];i?i.insertAdjacentElement("afterend",n):l.appendChild(n),t.splice(e.line1+1,0,"");const r=t[e.line1];t[e.line1]=r.substring(0,e.key1),t[e.line1+1]=r.substring(e.key1),e.line1=++e.line2,e.key1=0,e.key2=0,d(e.line1-1),d(e.line1),a(),C(),h.scrollTop=h.scrollHeight},Backspace(){if(k()){if(e.line1===e.line2){const u=Math.min(e.key1,e.key2),M=Math.max(e.key1,e.key2),f=t[e.line1];t[e.line1]=f.substring(0,u)+f.substring(M),e.key1=e.key2=u,d(e.line1),a();return}const i=Math.min(e.line1,e.line2),r=Math.max(e.line1,e.line2);t.splice(i+1,r-i-1),[...l.children].slice(i+1,r).forEach(u=>u.remove()),i===e.line1?(t[e.line1]=t[e.line1].substring(0,e.key1),t[e.line2]=t[e.line2].substring(e.key2),e.key2=e.key1,e.line2=e.line1):(t[e.line1]=t[e.line1].substring(e.key1),t[e.line2]=t[e.line2].substring(0,e.key2),e.key1=e.key2,e.line1=e.line2),d(e.line1),e.line1!==e.line2&&d(e.line2),a();return}if(e.key1===0){if(e.line1===0)return;const i=t[e.line1];t.splice(e.line1,1),l.children[e.line1].remove(),e.line1=--e.line2,e.key1=e.key2=t[e.line1].length,t[e.line1]+=i,d(e.line1),C(),a();return}const n=t[e.line1];t[e.line1]=t[e.line2]=n.substring(0,e.key1-1)+n.substring(e.key1),d(e.line1),e.key1=--e.key2,a()},ArrowRight(n){if(n.preventDefault(),k())return x();e.key1=++e.key2,e.key1>t[e.line1].length&&e.line1<t.length-1&&(e.line1=++e.line2,e.key1=e.key2=0),b()},ArrowLeft(n){if(n.preventDefault(),k())return x();e.key1=--e.key2,e.key1<0&&e.line1>0&&(e.line1=--e.line2,e.key1=e.key2=1/0),b()},ArrowUp(n){if(n.preventDefault(),k())return x();e.line1=--e.line2,b()},ArrowDown(n){if(n.preventDefault(),k())return x();e.line1>=t.length-1||(e.line1=++e.line2,b())},Tab(n){n.preventDefault(),v(" "),v(" "),v(" "),v(" ")}},T=["Alt","Shift","Control"];addEventListener("keydown",n=>{if(o&&!T.includes(n.key)){if(n.key in m)return m[n.key](n);if(n.key.length!==1)return console.log(n.key);v(n.key)}}),l.addEventListener("mousedown",n=>{y=!0;const i=l.getBoundingClientRect(),r=Math.max(0,Math.min(t.length-1,Math.floor((n.clientY-i.y)/w))),u=Math.max(0,Math.min(t[r].length,Math.round((n.clientX-i.x)/g)));e.line1=r,e.line2=r,e.key1=u,e.key2=u,a()}),addEventListener("mousemove",n=>{if(!y)return;const i=l.getBoundingClientRect(),r=Math.max(0,Math.min(t.length-1,Math.floor((n.clientY-i.y)/w))),u=Math.max(0,Math.min(t[r].length,Math.round((n.clientX-i.x)/g)));e.line2=r,e.key2=u,a()}),addEventListener("mouseup",()=>{y&&(y=!1)})}$(document.querySelector(".editor"));
