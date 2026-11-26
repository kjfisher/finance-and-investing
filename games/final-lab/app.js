(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {ri,pick,shuffle,money,pct}=window.BANKUTIL;
const B=window.BANK, TG=window.TARGETS, V=window.VOCAB, C=window.CASES;
const UNAME={1:"Overview",2:"Markets",3:"Companies",4:"Funds",5:"Bonds",6:"Portfolio",7:"Derivatives",8:"Crypto & Alts"};
const store={get(k,d){try{const v=localStorage.getItem("finallab-"+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("finallab-"+k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const strip=s=>String(s).replace(/<[^>]+>/g,"");
function passport(slug,score,total){try{const P=JSON.parse(localStorage.getItem("fi-passport"))||{s:{}},e=P.s[slug]||{n:0,best:null,of:total};e.n++;if(e.best==null||score>e.best){e.best=score;e.of=total}e.t=Date.now();P.s[slug]=e;localStorage.setItem("fi-passport",JSON.stringify(P))}catch(e){}}

/* tabs */
function show(p){$$(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.p===p));$$(".panel").forEach(s=>s.hidden=s.id!=="p-"+p);store.set("tab",p)}
$$(".tab").forEach(t=>t.addEventListener("click",()=>show(t.dataset.p)));

/* index generators: unit, target, math */
const GENS=[];
for(const u in B)B[u].forEach(g=>{const s=g();GENS.push({u:+u,t:s.t,m:s.m,g})});

/* ---------- quiz engine (instant feedback) ---------- */
function quiz(o){
  const st={qs:[],i:0,right:0,streak:0,missed:[],locked:false};
  const body=$(o.body),bar=$(o.bar),count=$(o.count),stk=o.streak&&$(o.streak);
  function start(qs){st.qs=qs;st.i=0;st.right=0;st.streak=0;st.missed=[];render()}
  function hud(){bar.style.width=(st.i/st.qs.length*100)+"%";count.textContent=`Question ${Math.min(st.i+1,st.qs.length)} of ${st.qs.length} · ${st.right} right`;if(stk)stk.textContent=st.streak>1?`Streak ${st.streak}`:""}
  function render(){
    if(st.i>=st.qs.length)return end();
    st.locked=false;const q=st.qs[st.i];q._order=shuffle(q.opts.map((t,k)=>({t,k})));
    body.innerHTML=`<div class="eyebrow">${q.tag||""}</div><div class="q">${q.prompt}</div><div class="opts">${q._order.map((x,j)=>`<button class="opt" data-j="${j}"><span class="k">${j+1}</span><span>${x.t}</span></button>`).join("")}</div><div id="${o.id}-fb"></div>`;
    body.querySelectorAll(".opt").forEach(b=>b.onclick=()=>answer(+b.dataset.j));hud();
  }
  function answer(j){
    if(st.locked)return;st.locked=true;const q=st.qs[st.i],ok=q._order[j].k===0;
    body.querySelectorAll(".opt").forEach((b,jj)=>{b.disabled=true;if(q._order[jj].k===0)b.classList.add("right");else if(jj===j)b.classList.add("wrong")});
    if(ok){st.right++;st.streak++}else{st.streak=0;st.missed.push(q)}
    if(o.onAnswer)o.onAnswer(q,ok);
    $("#"+o.id+"-fb").innerHTML=`<div class="callout ${ok?"good":"bad"}"><b>${ok?pick(["Correct.","Nice work.","That's it.","Yes."]):pick(["Not quite.","Close, but no.","Check this one."])}</b> ${q.ex}</div><div class="btnrow" style="margin-top:12px"><button class="btn primary" id="${o.id}-next">${st.i+1<st.qs.length?"Next":"See results"}</button></div>`;
    $("#"+o.id+"-next").onclick=()=>{st.i++;render()};$("#"+o.id+"-next").focus({preventScroll:true});hud();
  }
  function end(){
    bar.style.width="100%";count.textContent=`Done · ${st.right} of ${st.qs.length}`;if(stk)stk.textContent="";
    if(o.passport)passport(o.passport,st.right,st.qs.length);
    body.innerHTML=`<div class="big num">${st.right}/${st.qs.length}</div>
     ${st.missed.length?`<div class="callout"><b>Review these:</b><ul class="miss">${st.missed.map(q=>`<li>${strip(q.prompt)}<br><span class="note">${q.ex}</span></li>`).join("")}</ul></div>`:`<div class="callout good"><b>Perfect round.</b> Go again for a new set.</div>`}
     <div class="btnrow" style="margin-top:14px"><button class="btn primary" id="${o.id}-again">New round</button>${st.missed.length?`<button class="btn" id="${o.id}-retry">Retry the ${st.missed.length} I missed</button>`:""}</div>`;
    $("#"+o.id+"-again").onclick=()=>start(o.make());const r=$("#"+o.id+"-retry");if(r){const m=st.missed.slice();r.onclick=()=>start(m)}
  }
  document.addEventListener("keydown",e=>{if($(o.panel).hidden||!st.qs.length)return;if(/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName))return;const n=+e.key;if(n>=1&&n<=4&&!st.locked&&st.i<st.qs.length){const b=body.querySelector(`.opt[data-j="${n-1}"]`);if(b)b.click()}else if(e.key==="Enter"&&st.locked){const nx=$("#"+o.id+"-next");if(nx&&document.activeElement!==nx)nx.click()}});
  return {start};
}

/* ---------- REVIEW LAB ---------- */
let units=new Set(store.get("units",[1,2,3,4,5,6,7,8])),mathOnly=false,rlen=10;
const tr=store.get("tracker",{});
function renderUnits(){$("#rv-units").innerHTML=[1,2,3,4,5,6,7,8].map(u=>`<button class="chip" data-u="${u}" aria-pressed="${units.has(u)}">Unit ${u} · ${UNAME[u]}</button>`).join("");
  $$("#rv-units .chip").forEach(c=>c.onclick=()=>{const u=+c.dataset.u;if(units.has(u)){if(units.size>1)units.delete(u)}else units.add(u);store.set("units",[...units]);renderUnits()})}
$$("[data-uq]").forEach(b=>b.onclick=()=>{units=new Set(b.dataset.uq.split("").map(Number));store.set("units",[...units]);renderUnits()});
$("#rv-math").onclick=e=>{mathOnly=!mathOnly;e.currentTarget.setAttribute("aria-pressed",mathOnly)};
$("#rv-len").onclick=e=>{rlen=rlen===10?20:10;e.currentTarget.textContent=rlen+" questions"};
function renderTracker(){
  const rows=[];for(let u=1;u<=8;u++)for(let k=1;k<=5;k++){const id=u+"."+k,s=tr[id],name=(TG.find(t=>t[0]===id)||[])[1]||"";
    let cls="",lab="–";if(s&&s[1]){const p=s[0]/s[1];cls=p>=.8?"g":p>=.6?"y":"r";lab=s[0]+"/"+s[1]}
    rows.push(`<div class="cell ${cls}" title="${id} ${esc(name)}">${id}<small>${lab}</small></div>`)}
  $("#tracker").innerHTML=rows.join("");
}
function record(t,ok){const s=tr[t]||[0,0];s[1]++;if(ok)s[0]++;tr[t]=s;store.set("tracker",tr);renderTracker()}
$("#rv-reset").onclick=()=>$("#rv-resetconfirm").hidden=false;
$("#rv-resetno").onclick=()=>$("#rv-resetconfirm").hidden=true;
$("#rv-resetyes").onclick=()=>{for(const k in tr)delete tr[k];store.set("tracker",tr);renderTracker();$("#rv-resetconfirm").hidden=true};
function tagged(g){const q=g.g();const name=(TG.find(t=>t[0]===q.t)||[])[1]||"";q.tag=`Unit ${g.u} · ${q.t} ${name}`;return q}
function roundFrom(pool,n){
  // spread across units, avoid repeats where possible
  const byU={};pool.forEach(g=>(byU[g.u]=byU[g.u]||[]).push(g));Object.keys(byU).forEach(u=>byU[u]=shuffle(byU[u]));
  const out=[],us=shuffle(Object.keys(byU));let i=0,guard=0;
  while(out.length<n&&guard<500){const u=us[i%us.length];const list=byU[u];const idx=Math.floor(i/us.length)%list.length;out.push(list[idx]);i++;guard++}
  return shuffle(out).map(tagged);
}
function makeRound(){let pool=GENS.filter(g=>units.has(g.u)&&(!mathOnly||g.m));if(!pool.length)pool=GENS.filter(g=>units.has(g.u));return roundFrom(pool,rlen)}
const review=quiz({id:"rv",panel:"#p-review",body:"#rv-body",bar:"#rv-bar",count:"#rv-count",streak:"#rv-streak",passport:"final-lab",make:makeRound,onAnswer:(q,ok)=>record(q.t,ok)});
$("#rv-start").onclick=()=>review.start(makeRound());
$("#rv-weak").onclick=()=>{
  const scored=TG.map(t=>{const s=tr[t[0]];return {id:t[0],p:s&&s[1]?s[0]/s[1]:-1,n:s?s[1]:0}});
  const tried=scored.filter(s=>s.n>0);
  if(tried.length<5){$("#rv-body").innerHTML=`<div class="callout mid">Play a round or two first so the tracker knows your weak spots. You've tried ${tried.length} of 40 targets.</div>`;return}
  const weak=tried.sort((a,b)=>a.p-b.p||b.n-a.n).slice(0,6).map(s=>s.id);
  const pool=GENS.filter(g=>weak.includes(g.t));review.start(shuffle(Array.from({length:10},(_, i)=>pool[i%pool.length])).map(tagged));
  $("#rv-count").textContent="Weak-spot round: "+weak.join(", ");
};
renderUnits();renderTracker();

/* ---------- MOCK FINAL ---------- */
const CER=[
 {p:"Your cousin is 22 and wants to put her entire $5,000 savings into one hot tech stock she saw online. Should she? Make a claim, back it with evidence from the course, and explain your reasoning.",
  model:"Claim: No. She should put most of it in a diversified, low-cost index fund. Evidence: one company can collapse (Enron workers lost their 401(k)s in their own company's stock); company-specific risk is unsystematic and can be diversified away; most active stock picking trails the index (SPIVA: 65% of active large-cap funds trailed the S&P 500). Reasoning: spreading money across hundreds of companies keeps the market's long-run return while removing the risk of one company wrecking her savings.",
  c:["Claim takes a clear side (diversify instead of one stock)","Evidence: a specific fact, number or case (Enron, SPIVA, unsystematic risk)","Reasoning explains why the evidence supports the claim"]},
 {p:"A 17-year-old with a summer job asks whether to open a Roth IRA or a Traditional IRA. Make a claim, give evidence, and explain your reasoning.",
  model:"Claim: Roth IRA. Evidence: Roth contributions are taxed now and grow tax-free; Traditional gets a tax break now but is taxed later; a teen's tax rate is very low now; money invested at 17 has nearly 50 years to compound (Rule of 72 at 8%: doubles about every 9 years). Reasoning: paying tax while the rate is low and withdrawing decades of growth tax-free keeps far more money.",
  c:["Claim picks Roth (or argues Traditional with a real reason)","Evidence: how each account is taxed, plus the low tax rate now or compounding","Reasoning connects tax timing to keeping more money"]},
 {p:"Interest rates are expected to rise next year. A retiree is choosing between a 30-year bond and a 2-year Treasury. Which should she buy? Claim, evidence, reasoning.",
  model:"Claim: The 2-year Treasury. Evidence: bond prices fall when rates rise; longer bonds fall more (interest-rate risk); Silicon Valley Bank collapsed holding long-term bonds that lost value when rates rose. Reasoning: a short bond returns her $1,000 soon so she can reinvest at the higher rates, while a 30-year bond would lose a lot of value if she needs to sell.",
  c:["Claim picks the short-term bond","Evidence: price-rate inverse, longer = more interest-rate risk, or SVB","Reasoning explains how that protects the retiree"]},
 {p:"A friend says crypto is \"guaranteed to go up\" and wants to put half his savings into a new coin that promises 2% a day. Respond with a claim, evidence and reasoning.",
  model:"Claim: He shouldn't; at most a small slice (about 0–5%) in an established asset, and never in a coin promising guaranteed returns. Evidence: guaranteed returns are a scam red flag; TerraUSD promised 19.45% and fell to 10 cents; FTX misused customer money; crypto swings far more than stocks. Reasoning: an investment that can drop 70%+ or vanish should be small enough that losing it won't wreck his plan.",
  c:["Claim rejects the plan or limits crypto to a small slice","Evidence: a red flag, a case (TerraUSD, FTX, Mt. Gox) or volatility","Reasoning ties risk to the size of the bet"]},
 {p:"The stock market just fell 25%. A 25-year-old investing for retirement wants to sell everything and wait for things to calm down. Good idea? Claim, evidence, reasoning.",
  model:"Claim: No, she should stay invested (and rebalance if her plan says to). Evidence: a 20%+ drop is a bear market, and markets have recovered from every U.S. bear market given time (Black Monday's 22.6% one-day drop); selling locks in the loss and loss aversion/herding push people to sell low; she has 40 years until she needs the money. Reasoning: with a long time horizon she can wait out the drop, while selling risks missing the recovery.",
  c:["Claim: stay invested / follow the plan","Evidence: market history (a recovery or case), a bias, or her time horizon","Reasoning explains why selling now hurts her"]},
 {p:"An airline is worried jet fuel prices will spike next year. Should it use futures contracts? Claim, evidence, reasoning.",
  model:"Claim: Yes, it should hedge part of its fuel. Evidence: a futures contract locks in a price today; Southwest saved billions by hedging fuel before prices rose; hedgers use derivatives to reduce risk, unlike speculators (Barings, Amaranth). Reasoning: locking in fuel costs makes the airline's expenses predictable, so a price spike can't wreck its profits. The trade-off is missing out if fuel gets cheaper.",
  c:["Claim takes a side on hedging","Evidence: how futures lock a price, or Southwest / Delta","Reasoning explains reduced risk (and may name the trade-off)"]},
 {p:"For retirement savings, which is better: an active fund with a 1% fee that beat the market last year, or an S&P 500 index fund with a 0.03% fee? Claim, evidence, reasoning.",
  model:"Claim: The index fund. Evidence: most active funds trail their index over time (SPIVA); last year's winner often cools off (ARK rose 170% then fell 78%); a 1% fee costs $100 a year per $10,000 versus $3, and that gap compounds for decades. Reasoning: lower costs and matching the market beat paying more for a manager who probably won't keep winning.",
  c:["Claim picks the index fund (or defends the active fund with real evidence)","Evidence: SPIVA, ARK, or a fee calculation","Reasoning explains how fees and performance-chasing affect long-run returns"]},
 {p:"Two companies: Company A has a P/E of 45 and debt-to-equity of 3.0. Company B has a P/E of 14 and debt-to-equity of 0.4. Which is the better buy for a careful investor? Claim, evidence, reasoning.",
  model:"Claim: Company B. Evidence: P/E 14 means paying $14 per $1 of earnings versus $45; D/E 0.4 means much less borrowed money than A's 3.0, so less risk if business slows. Reasoning: B is cheaper relative to its earnings and safer financially; A would need very fast growth (a PEG near 1) to justify its price.",
  c:["Claim picks a company","Evidence uses both numbers correctly (P/E and D/E)","Reasoning explains price and risk for a careful investor"]}
];
const mk={state:"start",qs:[],ans:[],cer:[],cerText:["",""],cerScore:[[0,0,0],[0,0,0]],timer:null,end:0,confirm:false};
function mkStart(){
  const root=$("#mk-root");
  root.innerHTML=`<div class="box stack"><div><h3 style="font-size:22px">Before you start</h3><p class="note" style="font-size:16px">44 multiple-choice questions spread across all 8 units, then two short written answers. Nothing is graded until you submit. Plan on about 60 minutes.</p></div>
   <label class="check"><input type="checkbox" id="mk-timed" checked> Show a 60-minute countdown (you can still finish after it hits zero)</label>
   <div class="btnrow"><button class="btn primary" id="mk-go">Start the mock final</button>${store.get("mock-best",null)!=null?`<span class="note">Best on this device: <b class="num">${store.get("mock-best")}/50</b></span>`:""}</div></div>`;
  $("#mk-go").onclick=()=>{
    const per={1:5,2:5,3:6,4:6,5:5,6:6,7:5,8:6};
    let qs=[];for(let u=1;u<=8;u++){const gs=shuffle(GENS.filter(g=>g.u===u)).slice(0,per[u]);gs.forEach(g=>{const q=g.g();q.u=u;q._order=shuffle(q.opts.map((t,k)=>({t,k})));qs.push(q)})}
    mk.qs=qs;mk.ans=qs.map(()=>null);mk.cer=shuffle(CER).slice(0,2);mk.cerText=["",""];mk.cerScore=[[0,0,0],[0,0,0]];mk.confirm=false;
    mk.end=$("#mk-timed").checked?Date.now()+60*60*1000:0;mkExam();
  };
}
function mkExam(){
  const root=$("#mk-root");
  root.innerHTML=`<div class="exambar"><span><b class="num" id="mk-done">0</b>/44 answered</span><span class="num" id="mk-clock"></span><button class="btn primary sm" id="mk-submit">Submit</button></div>
   <div class="box" id="mk-list">${mk.qs.map((q,i)=>`<div class="examq" id="mq${i}"><div class="qn">${i+1}.</div><div class="q">${q.prompt}</div><div class="opts">${q._order.map((x,j)=>`<button class="opt" data-q="${i}" data-j="${j}"><span class="k">${"ABCD"[j]}</span><span>${x.t}</span></button>`).join("")}</div></div>`).join("")}
   ${mk.cer.map((c,k)=>`<div class="cer"><div class="qn num">${45+k*3}–${47+k*3}. Your call (3 points)</div><p style="margin:6px 0 10px;font-weight:600">${c.p}</p><label class="lbl" for="cer${k}">Claim, evidence, reasoning</label><textarea id="cer${k}" placeholder="Claim: … Evidence: … Reasoning: …"></textarea></div>`).join("")}
   <div class="btnrow" style="margin-top:14px"><button class="btn primary" id="mk-submit2">Submit my final</button></div><div id="mk-confirm"></div></div>`;
  $$("#mk-list .opt").forEach(b=>b.onclick=()=>{const i=+b.dataset.q,j=+b.dataset.j;mk.ans[i]=j;$$(`#mq${i} .opt`).forEach((x,jj)=>x.classList.toggle("sel",jj===j));$("#mk-done").textContent=mk.ans.filter(a=>a!=null).length});
  mk.cer.forEach((c,k)=>$("#cer"+k).addEventListener("input",e=>mk.cerText[k]=e.target.value));
  $("#mk-submit").onclick=$("#mk-submit2").onclick=mkTrySubmit;
  clearInterval(mk.timer);
  const tick=()=>{if(!mk.end){$("#mk-clock").textContent="";return}const left=Math.max(0,mk.end-Date.now()),m=Math.floor(left/60000),s=Math.floor(left%60000/1000);const el=$("#mk-clock");if(!el){clearInterval(mk.timer);return}el.textContent=left?`${m}:${String(s).padStart(2,"0")} left`:"Time's up: finish and submit";el.style.color=left<300000?"var(--loss)":""};
  tick();mk.timer=setInterval(tick,1000);
}
function mkTrySubmit(){
  const un=mk.ans.filter(a=>a==null).length;
  if(un&&!mk.confirm){mk.confirm=true;const first=mk.ans.findIndex(a=>a==null);$("#mk-confirm").innerHTML=`<div class="callout mid">You have <b>${un}</b> unanswered question${un>1?"s":""} (first: #${first+1}). Unanswered questions score 0. <button class="btn sm" id="mk-go2">Submit anyway</button> <button class="btn sm" id="mk-jump">Go to #${first+1}</button></div>`;$("#mk-confirm").scrollIntoView({block:"center"});
    $("#mk-go2").onclick=mkResults;$("#mk-jump").onclick=()=>{$("#mq"+first).scrollIntoView({block:"center"});mk.confirm=false};return}
  mkResults();
}
function sbg(x){return x>=45?"1.0":x>=40?"0.85":x>=35?"0.70":"0.55"}
function mkResults(){
  clearInterval(mk.timer);
  const right=mk.qs.map((q,i)=>mk.ans[i]!=null&&q._order[mk.ans[i]].k===0);
  const mc=right.filter(Boolean).length;
  mk.qs.forEach((q,i)=>record(q.t,right[i]));
  const per={};mk.qs.forEach((q,i)=>{per[q.u]=per[q.u]||[0,0];per[q.u][1]++;if(right[i])per[q.u][0]++});
  const root=$("#mk-root");
  const draw=()=>{
    const cer=mk.cerScore.flat().reduce((a,b)=>a+b,0),tot=mc+cer;
    $("#mk-total").textContent=tot;$("#mk-sbg").textContent=sbg(tot);$("#mk-cerpts").textContent=cer;
    const best=store.get("mock-best",0);if(tot>best)store.set("mock-best",tot);
  };
  const missed=mk.qs.map((q,i)=>({q,i})).filter(x=>!right[x.i]);
  root.innerHTML=`<div class="grid2">
    <div class="box"><p class="lbl">Your mock final</p><div class="big num"><span id="mk-total">${mc}</span>/50</div>
      <p style="margin:0;font-size:18px">Score <b class="num" id="mk-sbg"></b> · multiple choice <b class="num">${mc}/44</b> · written <b class="num" id="mk-cerpts">0</b>/6</p>
      <p class="note">Score your two written answers below; the total updates as you check boxes.</p></div>
    <div class="box"><p class="lbl">By unit (multiple choice)</p><div class="ubars">${Object.keys(per).map(u=>{const [a,b]=per[u],p=a/b;return `<div class="ubar"><span>Unit ${u}</span><span class="tr"><i style="width:${p*100}%;background:var(${p>=.8?"--gain":p>=.6?"--mid":"--loss"})"></i></span><span class="num">${a}/${b}</span></div>`}).join("")}</div></div></div>
   ${mk.cer.map((c,k)=>`<div class="box" style="margin-top:16px"><p class="lbl">Written answer ${k+1} · self-score (3 points)</p><p style="font-weight:600;margin:0 0 8px">${c.p}</p>
     <div class="callout"><b>Your answer:</b> ${mk.cerText[k].trim()?esc(mk.cerText[k]).replace(/\n/g,"<br>"):"<i>(left blank)</i>"}</div>
     <div class="callout good"><b>Strong answer:</b> ${c.model}</div>
     ${c.c.map((t,j)=>`<label class="check"><input type="checkbox" data-k="${k}" data-j="${j}" ${mk.cerText[k].trim()?"":"disabled"}> ${t}</label>`).join("")}</div>`).join("")}
   <div class="box" style="margin-top:16px"><p class="lbl">Questions you missed (${missed.length})</p>${missed.length?`<ul class="miss">${missed.map(({q,i})=>`<li><b>#${i+1} · ${q.t}</b> ${q.prompt}<br>Correct: <b>${q.opts[0]}</b>${mk.ans[i]!=null?` · You chose: ${q._order[mk.ans[i]].t}`:" · Left blank"}<br><span class="note">${q.ex}</span></li>`).join("")}</ul>`:"<p>None. Great work.</p>"}
     <div class="btnrow" style="margin-top:12px"><button class="btn primary" id="mk-again">Take a new mock final</button><button class="btn" id="mk-totrack">See my target tracker</button></div></div>`;
  $$("#mk-root input[type=checkbox]").forEach(x=>x.onchange=()=>{mk.cerScore[+x.dataset.k][+x.dataset.j]=x.checked?1:0;draw()});
  $("#mk-again").onclick=mkStart;$("#mk-totrack").onclick=()=>{show("review");$("#tracker").scrollIntoView({block:"center"})};
  draw();passport("final-lab",mc,44);window.scrollTo({top:$("#p-mock").offsetTop-10});
}
mkStart();

/* ---------- PORTFOLIO BUILDER ---------- */
const A=[
 {k:"us",n:"U.S. stock index fund",er:9,sd:16,fee:0.03,g:"stock",col:"--accent"},
 {k:"intl",n:"International stock index fund",er:8,sd:18,fee:0.07,g:"stock",col:"--accent"},
 {k:"bond",n:"Bond index fund",er:4.5,sd:6,fee:0.04,g:"bond",col:"--gain"},
 {k:"cash",n:"High-yield savings (cash)",er:3.5,sd:0.5,fee:0,g:"cash",col:"--muted"},
 {k:"reit",n:"REIT index fund",er:8,sd:20,fee:0.12,g:"re",col:"--mid"},
 {k:"active",n:"Active growth fund",er:9,sd:18,fee:1.0,g:"stock",col:"--accent"},
 {k:"single",n:"One hot tech stock",er:10,sd:45,fee:0,g:"single",col:"--loss"},
 {k:"crypto",n:"Bitcoin ETF",er:12,sd:70,fee:0.25,g:"crypto",col:"--loss"},
 {k:"gold",n:"Gold fund",er:5,sd:15,fee:0.25,g:"gold",col:"--gold"}
];
const RHO=(a,b)=>{if(a===b)return 1;const s=[a.g,b.g].sort().join("|"),eq=(x,y)=>s===[x,y].sort().join("|");
  const stocky=x=>x==="stock"||x==="single";if(stocky(a.g)&&stocky(b.g))return a.k==="intl"||b.k==="intl"?.75:.85;
  if(eq("re","stock")||eq("re","single"))return .65;if(eq("bond","stock")||eq("bond","single"))return .1;if(eq("bond","re"))return .2;
  if(eq("crypto","stock")||eq("crypto","single"))return .4;if(eq("crypto","re"))return .3;if(eq("gold","stock")||eq("gold","single"))return .05;if(eq("bond","gold"))return .25;return 0};
const P=[
 {id:"maya",n:"Maya, 16",goal:"Retirement",yrs:49,risk:"High",note:"Just opened a Roth IRA with summer-job money. She won't touch it for decades and says big drops don't scare her.",stock:[80,100],safeMin:0,crypto:5,extra:{t:"Holds international stocks (Unit 4: the 3-fund portfolio covers the whole world)",f:w=>w.intl>=10}},
 {id:"jordan",n:"Jordan, 18",goal:"A used car",yrs:2,risk:"Low",note:"Has $6,000 saved and needs it in 2 years. If it drops, there's no time to wait for a recovery.",stock:[0,20],safeMin:80,crypto:0,extra:{t:"At least 80% in cash and bonds because the money is needed soon (Unit 6: time horizon)",f:w=>w.cash+w.bond>=80}},
 {id:"alvarez",n:"Mrs. Alvarez, 62",goal:"Retirement income",yrs:3,risk:"Low",note:"Retires in 3 years. Wants steady income and smaller swings, but her money also has to last 25+ years.",stock:[30,50],safeMin:40,crypto:0,extra:{t:"At least 40% in bonds and cash for steadier income (Unit 5: bonds in a portfolio)",f:w=>w.bond+w.cash>=40}},
 {id:"sam",n:"Sam, 30",goal:"House down payment",yrs:5,risk:"Medium",note:"Wants $40,000 for a down payment in about 5 years. A 30% drop right before buying would be a problem.",stock:[20,50],safeMin:50,crypto:0,extra:{t:"At least half in bonds and cash for a medium-term goal",f:w=>w.bond+w.cash>=50}},
 {id:"chen",n:"Dr. Chen, 45",goal:"Retirement",yrs:20,risk:"Medium",note:"Twenty years to retirement. Comfortable with some ups and downs but wants a plan she can stick with.",stock:[60,80],safeMin:15,crypto:5,extra:{t:"Includes bonds (at least 15%) to smooth the ride (Unit 6: allocation)",f:w=>w.bond>=15}},
 {id:"tyler",n:"Tyler, 25",goal:"Retirement",yrs:40,risk:"Low",note:"Forty years away, but he sold everything in a panic during the last crash. He needs a mix he won't bail on.",stock:[50,80],safeMin:15,crypto:5,extra:{t:"Risk (std. deviation) at 13% or below so he can stick with it (Unit 6: behavioral finance)",f:(w,m)=>m.sd<=13}}
];
let pf=P[0],w={};
$("#pf-pick").innerHTML=P.map(p=>`<option value="${p.id}">${p.n}: ${p.goal}</option>`).join("");
function pfLoad(id){pf=P.find(p=>p.id===id)||P[0];$("#pf-pick").value=pf.id;w=store.get("pf-"+pf.id,null)||Object.fromEntries(A.map(a=>[a.k,0]));
  $("#pf-prof").innerHTML=`<div class="eyebrow">Client profile</div><h3>${pf.n}</h3><div class="facts"><span class="fact">Goal: ${pf.goal}</span><span class="fact">Timeline: ${pf.yrs} years</span><span class="fact">Risk comfort: ${pf.risk}</span></div><p style="margin:0">${pf.note}</p>`;
  $("#pf-assets").innerHTML=A.map(a=>`<div class="arow"><label class="an" for="pa-${a.k}">${a.n}<small>~${a.er}%/yr · risk ${a.sd}% · fee ${a.fee}%</small></label><input type="range" id="pa-${a.k}" min="0" max="100" step="5" value="${w[a.k]}"><span class="pv" id="pv-${a.k}">${w[a.k]}%</span></div>`).join("");
  A.forEach(a=>$("#pa-"+a.k).addEventListener("input",e=>{w[a.k]=+e.target.value;$("#pv-"+a.k).textContent=w[a.k]+"%";store.set("pf-"+pf.id,w);pfCalc(false)}));
  $("#pf-checks").innerHTML="";pfCalc(false);
}
function metrics(){const tot=A.reduce((s,a)=>s+w[a.k],0);const f=tot?1/tot:0;
  let er=0,fee=0,v=0;A.forEach(a=>{const x=w[a.k]*f;er+=x*(a.er-a.fee);fee+=x*a.fee});
  A.forEach(a=>A.forEach(b=>{v+=w[a.k]*f*w[b.k]*f*a.sd*b.sd*RHO(a,b)}));
  const stock=w.us+w.intl+w.active+w.single+w.reit;return {tot,er,fee,sd:Math.sqrt(v),stock}}
function pfCalc(grade){
  const m=metrics();
  $("#pf-total").className="total "+(m.tot===100?"ok":"no");$("#pf-total").innerHTML=`<span>Total</span><span class="num">${m.tot}% ${m.tot===100?"✓":m.tot<100?`(add ${100-m.tot}%)`:`(remove ${m.tot-100}%)`}</span>`;
  $("#pf-mix").innerHTML=A.filter(a=>w[a.k]).map(a=>`<i title="${a.n} ${w[a.k]}%" style="width:${w[a.k]/Math.max(m.tot,100)*100}%;background:var(${a.col});opacity:${a.k==="intl"||a.k==="active"?.6:1}"></i>`).join("");
  $("#pf-mixleg").innerHTML=A.filter(a=>w[a.k]).map(a=>`<span><i style="background:var(${a.col});opacity:${a.k==="intl"||a.k==="active"?.6:1}"></i>${a.n.replace(" index fund","").replace(" fund","")} ${w[a.k]}%</span>`).join("")||"<span>Move the sliders to build a mix.</span>";
  if(!m.tot){["er","sd","bad","fee"].forEach(k=>$("#pf-"+k).textContent="–");$("#pf-proj").textContent="Start with the profile: how long until the money is needed, and how much can it drop?";return}
  $("#pf-er").textContent=pct(m.er,1);$("#pf-sd").textContent=pct(m.sd,1);$("#pf-bad").textContent=pct(m.er-2*m.sd,0);$("#pf-fee").textContent=money(10000*m.fee/100,2);
  const fv=10000*Math.pow(1+m.er/100,pf.yrs);
  $("#pf-proj").innerHTML=`At about ${pct(m.er,1)} a year, $10,000 could grow to roughly <b class="num">${money(fv,0)}</b> in ${pf.yrs} years. In a rough year (about 1 in 40), this mix could fall around <b class="num">${pct(Math.min(0,m.er-2*m.sd),0)}</b>, which is <b class="num">${money(Math.min(0,(m.er-2*m.sd))*100,0)}</b> on $10,000.`;
  if(!grade)return;
  if(m.tot!==100){$("#pf-checks").innerHTML=`<div class="callout bad">Your total is ${m.tot}%. Make it exactly 100% to grade.</div>`;return}
  const ck=[
   {t:`Stock share (stocks + REITs) between ${pf.stock[0]}% and ${pf.stock[1]}% for a ${pf.yrs}-year ${pf.goal.toLowerCase()} goal`,ok:m.stock>=pf.stock[0]&&m.stock<=pf.stock[1],why:`You have ${m.stock}%. ${pf.yrs<=5?"Money needed soon can't wait out a crash.":"More years means more time to recover from drops, so more stock fits."}`,u:"Units 5–6"},
   {t:"Diversified: no single stock above 10%, and at least 3 holdings",ok:w.single<=10&&A.filter(a=>w[a.k]>=5).length>=3,why:`One stock carries unsystematic risk (Enron). You have ${w.single}% in one stock and ${A.filter(a=>w[a.k]>=5).length} holdings.`,u:"Unit 6"},
   {t:`Crypto at ${pf.crypto}% or less`,ok:w.crypto<=pf.crypto,why:pf.crypto?"Crypto can swing 70%+; most advice keeps it to a small slice.":"With a short timeline or low risk comfort, crypto's swings don't fit at all.",u:"Unit 8"},
   {t:"Average fee at 0.25% or less",ok:m.fee<=0.25,why:`Your blended fee is ${m.fee.toFixed(2)}% (${money(10000*m.fee/100,2)}/yr on $10k). A 1% active fund costs more and usually trails the index (SPIVA).`,u:"Unit 4"},
   {t:pf.extra.t,ok:pf.extra.f(w,m),why:"This client's profile calls for it.",u:"Profile"}
  ];
  const sc=ck.filter(c=>c.ok).length;
  $("#pf-checks").innerHTML=`<div class="callout ${sc===5?"good":sc>=3?"mid":"bad"}"><b class="num" style="font-size:20px">${sc}/5</b> checks passed${sc===5?`. This is a plan ${pf.n.split(",")[0]} could stick with.`:". Adjust and grade again."}</div>`+ck.map(c=>`<div class="ck ${c.ok?"pass":"fail"}"><b class="ic">${c.ok?"✓":"✗"}</b><div><b>${c.t}</b><br><span class="note" style="margin:0">${c.ok?"":c.why+" "}<i>${c.u}</i></span></div></div>`).join("");
  if(sc===5)passport("final-lab-portfolio",5,5);
}
$("#pf-pick").onchange=e=>pfLoad(e.target.value);
$("#pf-grade").onclick=()=>pfCalc(true);
$("#pf-clear").onclick=()=>{A.forEach(a=>w[a.k]=0);store.set("pf-"+pf.id,w);pfLoad(pf.id)};
pfLoad(store.get("pf-current","maya"));$("#pf-pick").addEventListener("change",e=>store.set("pf-current",e.target.value));

/* ---------- VOCAB ---------- */
let vUnits=new Set([1,2,3,4,5,6,7,8]),deck=[],di=0,known=0;
function vRenderUnits(){$("#vb-units").innerHTML=[1,2,3,4,5,6,7,8].map(u=>`<button class="chip" data-u="${u}" aria-pressed="${vUnits.has(u)}">Unit ${u}</button>`).join("");
  $$("#vb-units .chip").forEach(c=>c.onclick=()=>{const u=+c.dataset.u;if(vUnits.has(u)){if(vUnits.size>1)vUnits.delete(u)}else vUnits.add(u);vRenderUnits();vReset()})}
function pool(){return V.filter(v=>vUnits.has(v[0]))}
function vReset(){deck=shuffle(pool());di=0;known=0;vCard();if(!$("#vb-match").hidden)mNew()}
function vCard(){
  const el=$("#vb-cards");
  if(di>=deck.length){el.innerHTML=`<div class="callout good"><b>Deck done.</b> You marked ${known} of ${pool().length} as known on the first try.</div><div class="btnrow" style="margin-top:10px"><button class="btn primary" id="vb-again">Shuffle and restart</button></div>`;$("#vb-again").onclick=vReset;return}
  const [u,t,d]=deck[di];
  el.innerHTML=`<div class="scoreline" style="margin-bottom:8px"><span>Card ${di+1} of ${deck.length}</span><span>${known} known</span></div>
   <button class="card" id="vb-card" aria-label="Flashcard, tap to flip"><div class="card-inner"><div class="face"><small>Unit ${u} · ${UNAME[u]}</small><div class="term">${esc(t)}</div><small>Tap to flip</small></div><div class="face back"><small>${esc(t)}</small><div class="def">${esc(d)}</div></div></div></button>
   <div class="btnrow" style="margin-top:12px;justify-content:center"><button class="btn" id="vb-again2">Study again</button><button class="btn primary" id="vb-know">Got it</button></div>`;
  $("#vb-card").onclick=()=>$("#vb-card").classList.toggle("flip");
  $("#vb-know").onclick=()=>{known++;di++;vCard()};
  $("#vb-again2").onclick=()=>{deck.push(deck[di]);di++;vCard()};
}
let mState=null;
function mNew(){
  const items=shuffle(pool()).slice(0,6);mState={items,sel:null,done:0,t0:Date.now(),miss:0};
  const terms=shuffle(items.map((x,i)=>({i,t:x[1]}))),defs=shuffle(items.map((x,i)=>({i,t:x[2]})));
  $("#vb-match").innerHTML=`<div class="scoreline" style="margin-bottom:8px"><span>Tap a term, then its definition.</span><span class="num" id="m-time">0.0s</span></div>
   <div class="match"><div class="mcol">${terms.map(x=>`<button class="mitem" data-side="t" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div><div class="mcol">${defs.map(x=>`<button class="mitem" data-side="d" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div></div><div id="m-res"></div>`;
  $$("#vb-match .mitem").forEach(b=>b.onclick=()=>mTap(b));
  clearInterval(mState.tm);mState.tm=setInterval(()=>{const el=$("#m-time");if(el&&mState.done<6)el.textContent=((Date.now()-mState.t0)/1000).toFixed(1)+"s"},100);
}
function mTap(b){
  if(b.classList.contains("done"))return;
  if(!mState.sel||mState.sel.dataset.side===b.dataset.side){$$("#vb-match .mitem.sel").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");mState.sel=b;return}
  const a=mState.sel;mState.sel=null;a.classList.remove("sel");
  if(a.dataset.i===b.dataset.i){a.classList.add("done");b.classList.add("done");a.disabled=b.disabled=true;mState.done++;
    if(mState.done===6){clearInterval(mState.tm);const s=(Date.now()-mState.t0)/1000+mState.miss*2;const best=store.get("match-best",null);if(best==null||s<best)store.set("match-best",s);
      $("#m-res").innerHTML=`<div class="callout good"><b>${s.toFixed(1)} seconds</b>${mState.miss?` (includes +2s for each of ${mState.miss} miss${mState.miss>1?"es":""})`:""}. Best on this device: ${Math.min(best??s,s).toFixed(1)}s.</div><div class="btnrow" style="margin-top:10px"><button class="btn primary" id="m-again">New set of 6</button></div>`;$("#m-again").onclick=mNew}}
  else{mState.miss++;[a,b].forEach(x=>{x.classList.add("shake");setTimeout(()=>x.classList.remove("shake"),450)})}
}
$("#vb-modeCards").onclick=()=>{$("#vb-cards").hidden=false;$("#vb-match").hidden=true;$("#vb-modeCards").setAttribute("aria-pressed",true);$("#vb-modeMatch").setAttribute("aria-pressed",false)};
$("#vb-modeMatch").onclick=()=>{$("#vb-cards").hidden=true;$("#vb-match").hidden=false;$("#vb-modeCards").setAttribute("aria-pressed",false);$("#vb-modeMatch").setAttribute("aria-pressed",true);mNew()};
vRenderUnits();vReset();

/* ---------- CASE CONNECTIONS ---------- */
function caseRound(){
  const picks=shuffle(C).slice(0,10);
  return picks.map((c,i)=>{
    const others=shuffle(C.filter(x=>x[0]!==c[0])).slice(0,3);
    if(i%2===0)return {tag:"Which case shows this idea?",prompt:`<b>${c[3]}.</b> Which case is the best example?`,opts:[c[1],...others.map(x=>x[1])],ex:`<b>${c[1]}</b> (Unit ${c[0]}): ${c[2]}`};
    return {tag:`Unit ${c[0]} case`,prompt:`<b>${c[1]}</b>: ${c[2]} What big idea does this case teach?`,opts:[c[3],...others.map(x=>x[3])],ex:`${c[1]} is a Unit ${c[0]} case about this idea. Use it as evidence on Unit ${c[0]} questions.`};
  });
}
const cases=quiz({id:"cs",panel:"#p-cases",body:"#cs-body",bar:"#cs-bar",count:"#cs-count",make:caseRound});
cases.start(caseRound());

/* boot */
const t=store.get("tab","review");if(t!=="review"&&$("#p-"+t))show(t);
})();
