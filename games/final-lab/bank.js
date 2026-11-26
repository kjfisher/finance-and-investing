/* Final Lab question bank. Each generator returns {t, prompt, opts (correct first), ex, m (true = math item)}.
   Numbers are re-drawn every call. Wrong answers come from common mistakes. */
(function(){
const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a, pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const money=(v,d)=>{const neg=v<0;v=Math.abs(v);const dec=d!=null?d:(Math.abs(v-Math.round(v))<1e-9?0:2);return (neg?"−":"")+"$"+v.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})};
const pct=(v,d=2)=>{let s=(+v).toFixed(d);if(s.includes("."))s=s.replace(/\.?0+$/,"");return s.replace("-","−")+"%"};
const big=v=>v>=1e9?"$"+(+(v/1e9).toFixed(1)).toLocaleString("en-US")+" billion":v>=1e6?"$"+(+(v/1e6).toFixed(1)).toLocaleString("en-US")+" million":money(v,0);
function N(t,prompt,correct,wrongs,fmt,ex){
  const seen=new Set([fmt(correct)]),opts=[fmt(correct)];
  for(const w of wrongs){if(!isFinite(w))continue;const f=fmt(w);if(!seen.has(f)){seen.add(f);opts.push(f)}if(opts.length===4)break}
  for(const m of [1.5,0.5,2,0.75,1.25,3,0.1,10]){if(opts.length===4)break;const f=fmt(correct*m);if(!seen.has(f)){seen.add(f);opts.push(f)}}
  for(const d of [100,-100,200,-200,50,-50,1,-1]){if(opts.length===4)break;const f=fmt(correct+d);if(!seen.has(f)){seen.add(f);opts.push(f)}}
  return {t,prompt,opts,ex,m:true};
}
const S=(t,prompt,c,w,ex)=>({t,prompt,opts:[c,...w],ex,m:false});
const B={};

/* ---------------- Unit 1 ---------------- */
B[1]=[
 ()=>{const r=pick([3,4,6,8,9,12]),y=72/r;return N("1.2",`Using the Rule of 72, about how many years does it take money to double at ${r}% per year?`,y,[100/r,144/r,r*2],v=>(+v.toFixed(1))+" years",`Years to double ≈ 72 ÷ ${r} = ${+y.toFixed(1)} years.`)},
 ()=>{const P=pick([1000,2000,5000]),r=pick([5,8,10]),t=pick([2,3]),v=P*Math.pow(1+r/100,t);return N("1.2",`You invest ${money(P)} at ${r}% compounded once a year. What is it worth after ${t} years?`,v,[P*(1+r/100*t),P*r/100*t,v-P],x=>money(x,2),`${money(P)} × ${(1+r/100).toFixed(2)}<sup>${t}</sup> = ${money(v,2)}. ${money(P*(1+r/100*t),2)} is simple interest, which leaves out interest on interest.`)},
 ()=>{const n=ri(7,12),i=ri(2,6);return N("1.3",`Your investment earned ${n}% this year. Inflation was ${i}%. What was your real return?`,n-i,[n+i,n,i],v=>(v>0?"+":"")+pct(v,1),`Real return = return − inflation = ${n}% − ${i}% = ${pct(n-i,1)}.`)},
 ()=>{const n=pick([0,0.5,1]),i=pick([3,4,6,8]);return N("1.3",`A savings account pays ${pct(n)} while inflation is ${i}%. What is the real return?`,n-i,[i-n,n+i,n],v=>(v>0?"+":"")+pct(v,1),`Real return = ${pct(n)} − ${i}% = ${pct(n-i,1)}. Negative: the balance grows but buys less.`)},
 ()=>{const a=pick([280,300,310,320]),r=pick([2,3,4,5,6]),b=+(a*(1+r/100)).toFixed(1);return N("1.5",`The CPI rose from ${a} to ${b} over the past year. What was the inflation rate?`,r,[b-a,(b-a)/b*100,b/a],v=>pct(v,1),`(${b} − ${a}) ÷ ${a} = ${pct(r,1)}.`)},
 ()=>{const x=pick([["Farmland","Real asset"],["A share of Nike stock","Financial asset"],["A gold bar","Real asset"],["A Treasury bond","Financial asset"],["A factory","Real asset"],["A bank deposit","Financial asset"]]);return S("1.1",`${x[0]} is a…`,x[1],[x[1]==="Real asset"?"Financial asset":"Real asset","Derivative","Liability"],"Real assets are physical things that are useful or produce something. Financial assets are claims on money or future profits.")},
 ()=>S("1.4","A company sells new shares to the public for the first time (an IPO). Where does this happen?","The primary market",["The secondary market","The Federal Reserve","An index fund"],"In the primary market the company sells new shares and gets the money. Later trades between investors are the secondary market."),
 ()=>S("1.4","Rank from least to most risky:","Cash → bonds → stocks → crypto",["Stocks → cash → bonds → crypto","Bonds → cash → crypto → stocks","Cash → stocks → bonds → crypto"],"Cash barely moves, bonds a little, stocks more, crypto the most."),
 ()=>S("1.5","Inflation is high and rising. What does the Fed usually do?","Raise the Fed funds rate",["Cut the Fed funds rate","Print more money","Buy more stocks"],"Higher rates make borrowing cost more, which slows spending and inflation (the Volcker Shock)."),
 ()=>S("1.5","GDP has shrunk two quarters in a row and unemployment is rising. Which phase is this?","Contraction",["Expansion","Peak","Trough"],"Falling output and rising unemployment mean contraction.")
];

/* ---------------- Unit 2 ---------------- */
B[2]=[
 ()=>{const bid=ri(2000,15000)/100,s=pick([1,2,5,10,20])/100,ask=+(bid+s).toFixed(2);return N("2.1",`A stock quote shows Bid ${money(bid,2)} / Ask ${money(ask,2)}. What is the spread?`,s,[s*10,ask+bid,(ask+bid)/2],v=>money(v,2),`Spread = ask − bid = ${money(ask,2)} − ${money(bid,2)} = ${money(s,2)}.`)},
 ()=>{const cls=pick(["Large","Mid","Small"]),cap=cls==="Large"?ri(12,900)*1e9:cls==="Mid"?ri(25,90)*1e8:ri(3,18)*1e8,p=ri(15,250),sh=Math.round(cap/p/1e6),c=p*sh*1e6,k=c>1e10?"Large cap":c>=2e9?"Mid cap":"Small cap";return S("2.3",`A company's stock is ${money(p)} and it has ${sh.toLocaleString("en-US")} million shares outstanding. What size is it?`,k,["Large cap","Mid cap","Small cap"].filter(x=>x!==k).concat(["Can't tell without the P/E"]).slice(0,3),`Market cap = ${money(p)} × ${sh.toLocaleString("en-US")} million = ${big(c)}. Large > $10B, mid $2–10B, small < $2B.`)},
 ()=>{const p=ri(20,400),sh=ri(50,900),c=p*sh*1e6;return N("2.3",`A stock trades at ${money(p)} with ${sh} million shares outstanding. What is its market cap?`,c,[c/1000,p*sh*1e3,p+sh*1e6],big,`Market cap = price × shares = ${money(p)} × ${sh} million = ${big(c)}.`)},
 ()=>{const d=pick([6,8,12,15,18,22,28,35]),k=d>=20?"Bear market":d>=10?"Correction":"Neither: a normal dip";return S("2.5",`The S&P 500 falls ${d}% from its recent high. What is this called?`,k,["Bear market","Correction","Neither: a normal dip","Bubble"].filter(x=>x!==k),`A correction is a drop of 10% or more; a bear market is 20% or more. ${d}% → ${k.toLowerCase()}.`)},
 ()=>{const d=pick([20,25,40,50,60]),g=d/(100-d)*100;return N("2.5",`A stock falls ${d}%. What percent gain does it need to get back to where it started?`,g,[d,100-d,d*2],v=>pct(v,1),`After a ${d}% drop you have ${100-d}% left. To get back: ${d} ÷ ${100-d} = ${pct(g,1)}. Losses take bigger gains to recover.`)},
 ()=>S("2.2","You want to buy a stock only if its price drops to $40 or less. Which order?","Limit order",["Market order","Stop order","Short sale"],"A limit order fills only at your price or better, and it might never fill."),
 ()=>S("2.2","You own a stock at $60 and want it sold automatically if it falls to $52. Which order?","Stop order",["Limit buy order","Market order right now","Margin order"],"A stop order becomes a market order when the price hits the stop. It's used to limit losses."),
 ()=>S("2.2","Why is short selling riskier than buying a stock?","Losses have no upper limit, because the price can keep rising",["You can only lose what you invested","Short sales are only allowed in bear markets","Short sellers must hold for a year"],"A stock can rise without limit, so a short seller's loss has no ceiling (the Volkswagen squeeze)."),
 ()=>S("2.4","How many companies are in the Dow Jones Industrial Average?","30",["100","About 500","About 3,000"],"The Dow tracks 30 large U.S. companies. The S&P 500 tracks about 500."),
 ()=>S("2.2","Buying on margin means…","Using borrowed money, which makes gains and losses bigger",["Buying only at the bid price","Buying stocks with no fees","Buying shares in an IPO"],"Margin is borrowed money. It magnifies both gains and losses.")
];

/* ---------------- Unit 3 ---------------- */
B[3]=[
 ()=>{const rev=ri(20,400),m=pick([4,6,8,10,12,15,20,25]),ni=+(rev*m/100).toFixed(1);return N("3.2",`A company had revenue of $${rev} million and net income of $${ni} million. What is its profit margin?`,m,[100-m,rev/ni,m*10],v=>pct(v,1),`Profit margin = net income ÷ revenue = ${ni} ÷ ${rev} = ${pct(m,1)}.`)},
 ()=>{const sh=pick([50,80,100,200,250,400]),eps=pick([1.25,2,2.5,3.2,4,5.5]),ni=+(sh*eps).toFixed(0);return N("3.2",`Net income is $${ni} million and there are ${sh} million shares outstanding. What is EPS?`,ni/sh,[sh/ni,ni/sh*10,ni],v=>money(v,2),`EPS = net income ÷ shares = ${ni} ÷ ${sh} = ${money(ni/sh,2)}.`)},
 ()=>{const pe=pick([8,10,12,15,20,25,30,40]),eps=pick([1.5,2,2.5,3,4,5]),p=+(pe*eps).toFixed(2);return N("3.5",`A stock trades at ${money(p,2)} and has EPS of ${money(eps,2)}. What is its P/E ratio?`,pe,[eps/p,p*eps,p-eps],v=>(+v.toFixed(2)).toString(),`P/E = price ÷ EPS = ${money(p,2)} ÷ ${money(eps,2)} = ${pe}. Investors pay $${pe} for each $1 of earnings.`)},
 ()=>{const q=pick([0.25,0.4,0.5,0.6,0.75]),p=pick([20,25,40,50,60,80]),dy=q*4/p*100;return N("3.5",`A stock priced at ${money(p)} pays a dividend of ${money(q,2)} every quarter. What is its dividend yield?`,dy,[q/p*100,p/(q*4),q*12/p*100],v=>pct(v,2),`Yearly dividend = ${money(q,2)} × 4 = ${money(q*4,2)}. Yield = ${money(q*4,2)} ÷ ${money(p)} = ${pct(dy,2)}.`)},
 ()=>{const pe=pick([15,20,24,30,40]),g=pick([10,15,20,30]),peg=pe/g;return N("3.5",`A stock has a P/E of ${pe} and expected growth of ${g}% a year. What is its PEG ratio?`,peg,[g/pe,pe*g,pe-g],v=>(+v.toFixed(2)).toString(),`PEG = P/E ÷ growth = ${pe} ÷ ${g} = ${(+peg.toFixed(2))}. Near 1 means the price fits the growth; ${peg>1.3?"above 1 looks pricey":peg<0.8?"below 1 looks cheap":"this is close to fair"}.`)},
 ()=>{const L=ri(20,90)*10,E=ri(20,90)*10;return N("3.3",`A company has $${L} million in liabilities and $${E} million in shareholders' equity. What is its debt-to-equity ratio?`,L/E,[E/L,L/(L+E),(L+E)/E],v=>(+v.toFixed(2)).toString(),`D/E = liabilities ÷ equity = ${L} ÷ ${E} = ${(+(L/E).toFixed(2))}. Higher means more borrowed money and more risk.`)},
 ()=>{const ca=ri(30,120)*10;let cl;do{cl=ri(30,120)*10}while(Math.abs(ca/cl-1)<0.08);const r=ca/cl,ok=r>=1;return S("3.3",`Current assets are $${ca} million and current liabilities are $${cl} million. What does the current ratio tell you?`,`${r.toFixed(2)}: it ${ok?"can":"may not be able to"} pay its short-term bills`,[`${r.toFixed(2)}: it ${ok?"may not be able to":"can"} pay its short-term bills`,`${(cl/ca).toFixed(2)}: it ${ok?"can":"may not be able to"} pay its short-term bills`,`${(cl/ca).toFixed(2)}: it ${ok?"may not be able to":"can"} pay its short-term bills`],`Current ratio = current assets ÷ current liabilities = ${ca} ÷ ${cl} = ${r.toFixed(2)}. Above 1 means it can cover short-term bills.`)},
 ()=>{const o=ri(40,200)*5,c=ri(10,60)*5;return N("3.4",`Cash from operations is $${o} million and spending on property and equipment is $${c} million. What is free cash flow?`,o-c,[o+c,o,c],v=>"$"+v+" million",`FCF = operating cash flow − capital spending = ${o} − ${c} = $${o-c} million.`)},
 ()=>S("3.3","Which equation is always true on a balance sheet?","Assets = liabilities + equity",["Revenue − costs = assets","Equity = assets + liabilities","Net income = assets − revenue"],"A balance sheet balances: what a company owns equals what it owes plus what belongs to owners."),
 ()=>S("3.1","Millions of users make an app more useful for each new user. What kind of moat is that?","Network effect",["Low-cost producer","Switching costs","Technical analysis"],"A network effect makes a product more valuable as more people use it."),
 ()=>S("3.1","Studying a company's profits, debt and business model is…","Fundamental analysis",["Technical analysis","Market timing","Short selling"],"Fundamental analysis studies the business; technical analysis studies price charts.")
];

/* ---------------- Unit 4 ---------------- */
B[4]=[
 ()=>{const inv=pick([5000,10000,25000,50000]),er=pick([0.03,0.1,0.25,0.5,0.75,1]),fee=inv*er/100;return N("4.1",`You have ${money(inv)} in a fund with a ${er}% expense ratio. About how much do you pay in fees each year?`,fee,[fee*10,fee*100,fee/10],v=>money(v,2),`Fee = ${money(inv)} × ${er}% = ${money(inv)} × ${er/100} = ${money(fee,2)}.`)},
 ()=>{const sh=pick([2,4,5,8,10]),nav=pick([12.5,20,25,32,40.5]),a=sh*nav;return N("4.1",`A mutual fund holds $${a.toFixed(0)} million in assets and has ${sh} million shares. What is its NAV per share?`,nav,[sh/a,a*sh,a],v=>money(v,2),`NAV = assets ÷ shares = ${a.toFixed(0)} ÷ ${sh} = ${money(nav,2)}.`)},
 ()=>{const sal=pick([40000,50000,60000,80000]),[rate,cap]=pick([[0.5,6],[1,4],[1,3],[0.5,4]]),c=pick([2,3,4,6,8,10]),m=rate*Math.min(c,cap)/100*sal;return N("4.3",`You earn ${money(sal)}. Your employer matches ${rate===1?"100%":"50%"} of your 401(k) contributions, up to ${cap}% of your salary. You contribute ${c}%. How much does your employer add per year?`,m,[rate*c/100*sal,cap/100*sal,c/100*sal],v=>money(v,0),`The match covers up to ${cap}% of salary, so ${Math.min(c,cap)}% counts. ${rate===1?"100%":"50%"} × ${Math.min(c,cap)}% × ${money(sal)} = ${money(m,0)}.`)},
 ()=>{const mo=pick([6,9,11,13,18,24]),st=mo<=12;return S("4.4",`You sell a stock for a profit after holding it ${mo} months. How is the gain taxed?`,st?"Short-term: taxed like regular income":"Long-term: lower tax rates",[st?"Long-term: lower tax rates":"Short-term: taxed like regular income","Not taxed until retirement","Taxed only if you reinvest it"],"One year or less is short-term (taxed like income). More than one year is long-term, with lower rates.")},
 ()=>S("4.3","You're 17 with a low tax rate now and expect to earn much more later. Which account fits best?","Roth IRA: pay tax now, tax-free later",["Traditional IRA: tax break now, taxed later","A regular brokerage account","Neither; teens can't have IRAs"],"With a low tax rate now, paying tax now and withdrawing tax-free later usually wins."),
 ()=>S("4.2","Which fund trades all day on an exchange like a stock?","ETF",["Mutual fund","Target-date mutual fund","Money market account"],"ETFs trade all day. Mutual funds trade once a day at NAV."),
 ()=>S("4.2","An index fund tries to…","Match the market's return at low cost",["Beat the market by picking winners","Avoid all losses","Guarantee a 10% return"],"Passive index funds match an index; active funds try to beat it, usually with higher fees."),
 ()=>S("4.5","A 3-fund portfolio holds…","U.S. stocks, international stocks and bonds",["Three tech stocks","Cash, gold and crypto","A growth fund, a value fund and a sector fund"],"Three broad index funds cover the whole U.S. market, the world outside it, and bonds."),
 ()=>S("4.5","How does a target-date 2070 fund change over time?","It shifts from stocks toward bonds as 2070 gets closer",["It shifts from bonds toward stocks","It stays 100% stocks until 2070","It sells everything in 2070"],"Target-date funds get more conservative as the target year approaches."),
 ()=>S("4.1","A 5% fee charged when you buy a mutual fund is called…","A front-end load",["An expense ratio","A back-end load","A spread"],"A load is a sales charge: front-end when buying, back-end when selling.")
];

/* ---------------- Unit 5 ---------------- */
B[5]=[
 ()=>{const r=pick([2,3,4.5,5,6,7.5]),C=10*r;return N("5.1",`A $1,000 bond has a ${pct(r)} coupon rate. How much interest does it pay each year?`,C,[r,C*10,1000+C],v=>money(v),`Coupon = $1,000 × ${pct(r)} = ${money(C)}.`)},
 ()=>{const r=pick([4,5,6,7]),C=10*r,p=pick([880,920,950,980,1020,1050,1100]);return N("5.3",`A bond pays ${money(C)} a year and sells for ${money(p)}. What is its current yield?`,C/p*100,[r,p/C,C/(p+1000)*100],v=>pct(v,2),`Current yield = ${money(C)} ÷ ${money(p)} = ${pct(C/p*100,2)}.`)},
 ()=>{const r=pick([4,5,6]),y=pick([5,10]);return N("5.1",`A $1,000 bond with a ${r}% coupon matures in ${y} years. How much total interest does it pay over its life?`,10*r*y,[10*r,10*r*y+1000,r*y],v=>money(v),`${money(10*r)} per year × ${y} years = ${money(10*r*y)}.`)},
 ()=>{const c=pick([3,4,5,6]),m=c+pick([-2,-1,1,2]),prem=m<c;return S("5.3",`Your bond pays ${c}%. New bonds now pay ${m}%. What happens to your bond's price?`,prem?"Rises above $1,000 (premium)":"Falls below $1,000 (discount)",[prem?"Falls below $1,000 (discount)":"Rises above $1,000 (premium)","Stays at $1,000","Its coupon changes"],"Rates and bond prices move in opposite directions. The coupon never changes.")},
 ()=>{const r=pick(["BB","B","CCC","BBB","A","AA"]),ig=["BBB","A","AA"].includes(r);return S("5.4",`A bond rated ${r} is…`,ig?"Investment grade":"Junk (high-yield)",[ig?"Junk (high-yield)":"Investment grade","In default","Backed by the government"],"BBB or higher is investment grade; BB or lower is junk.")},
 ()=>S("5.4","Short-term Treasuries yield more than 10-year Treasuries. The yield curve is…","Inverted",["Normal","Flat","Junk"],"Inverted = short rates above long rates. It has come before many recessions."),
 ()=>S("5.2","Which bond's interest is usually free from federal income tax?","Municipal bond",["Corporate bond","Treasury bond","Junk bond"],"Munis are issued by states and cities; interest is usually federal-tax-free."),
 ()=>S("5.2","Which bond adjusts its principal for inflation?","TIPS",["Municipal bond","Corporate bond","Zero-coupon junk bond"],"TIPS principal rises with CPI."),
 ()=>S("5.3","Rates rise 1%. Which bond's price falls most?","A 30-year bond",["A 2-year bond","A 6-month T-bill","They fall the same"],"Longer bonds have more interest-rate risk."),
 ()=>S("5.5","A bond fund compared with one bond:","Spreads risk across many bonds but has no maturity date",["Always returns $1,000 at maturity","Can't lose value when rates rise","Pays a coupon that never changes"],"A fund diversifies default risk, but it never matures and its price still falls when rates rise.")
];

/* ---------------- Unit 6 ---------------- */
B[6]=[
 ()=>{const rf=pick([2,3,4,5]),rm=pick([8,9,10,11]),b=pick([0.5,0.8,1.2,1.5,2]),e=rf+b*(rm-rf);return N("6.2",`The safe rate is ${rf}%, the market is expected to return ${rm}%, and a stock's beta is ${b}. Using CAPM, what is its expected return?`,e,[rf+b*rm,b*rm,rm],v=>pct(v,2),`E(R) = ${rf}% + ${b} × (${rm}% − ${rf}%) = ${pct(e,2)}.`)},
 ()=>{const ps=pick([[25,50,25],[20,50,30],[30,40,30]]),rs=[pick([-20,-15,-10]),pick([6,8,10]),pick([20,25,30])],e=ps.reduce((s,p,i)=>s+p/100*rs[i],0);return N("6.1",`A stock has a ${ps[0]}% chance of ${rs[0]}%, a ${ps[1]}% chance of +${rs[1]}%, and a ${ps[2]}% chance of +${rs[2]}%. What is its expected return?`,e,[(rs[0]+rs[1]+rs[2])/3,rs[1],rs[2]],v=>pct(v,1),`(${ps[0]/100} × ${rs[0]}) + (${ps[1]/100} × ${rs[1]}) + (${ps[2]/100} × ${rs[2]}) = ${pct(e,1)}.`)},
 ()=>{const b=pick([0.5,0.8,1.5,2]),m=pick([-10,-5,4,6,10]);return N("6.2",`The market ${m>0?"rises":"falls"} ${Math.abs(m)}%. A stock has a beta of ${b}. About how much should it move?`,b*m,[m,m/b,b+m],v=>(v>0?"+":"")+pct(v,1),`Beta × market move = ${b} × ${m}% = ${pct(b*m,1)}.`)},
 ()=>{const e=pick([7,8,9,10,12]),t=pick([2,3,4,5]);return N("6.1",`A stock fund's expected return is ${e}%. T-bills pay ${t}%. What is the risk premium?`,e-t,[e+t,e,t],v=>pct(v,1),`Risk premium = expected return − T-bill = ${e}% − ${t}% = ${pct(e-t,1)}.`)},
 ()=>S("6.2","Which risk can you remove by diversifying?","Unsystematic risk, like one company's scandal",["Systematic risk, like a recession","Inflation risk","Interest-rate risk"],"Company-specific risk can be diversified away; market-wide risk cannot (Enron 401(k)s)."),
 ()=>S("6.3","Which pair diversifies a portfolio best?","Two assets with a correlation near −1",["Two assets with a correlation of +1","Two stocks in the same industry","Two funds that track the S&P 500"],"Assets that move opposite each other smooth out the ups and downs."),
 ()=>{const x=pick([["Kai won't sell a losing stock until it gets back to what he paid.","Loss aversion"],["Ava buys a coin because everyone at school is buying it.","Herding / FOMO"],["Ben thinks a stock is cheap because it used to be $200.","Anchoring"],["Lena only reads posts that agree with her stock pick.","Confirmation bias"],["Omar trades every day, sure he can beat the market.","Overconfidence"]]);return S("6.4",x[0]+" Which bias is this?",x[1],["Loss aversion","Herding / FOMO","Anchoring","Confirmation bias","Overconfidence"].filter(b=>b!==x[1]).slice(0,3),"Name the bias, then fix it with a written plan, an IPS, and diversification.")},
 ()=>S("6.5","Your target is 70% stocks / 30% bonds. After a big rally you're at 80/20. Rebalancing means…","Sell some stocks and buy bonds to get back to 70/30",["Buy more stocks to ride the rally","Sell all bonds","Do nothing; targets don't matter"],"Rebalancing brings the portfolio back to its target by trimming what grew."),
 ()=>S("6.5","An investment policy statement (IPS) is…","A written plan for your goals, risk and allocation",["A broker's monthly statement","A tax form","A list of hot stocks"],"An IPS keeps you on plan when emotions run high.")
];

/* ---------------- Unit 7 ---------------- */
B[7]=[
 ()=>{const K=pick([40,50,60,80,100]),p=pick([2,3,4,5]),S0=K+pick([-8,-4,2,6,10,15]),pps=Math.max(S0-K,0)-p,pr=pps*100;return N("7.2",`You buy 1 call contract with a $${K} strike for a $${p} premium. At expiration the stock is $${S0}. What is your profit or loss?`,pr,[pps,(S0-K)*100,(Math.max(S0-K,0)+p)*100],v=>(v>0?"+":"")+money(v),`Per share: max(${S0} − ${K}, 0) − ${p} = ${money(pps)}. One contract = 100 shares → ${money(pr)}.`)},
 ()=>{const K=pick([40,50,60,80]),p=pick([2,3,4]),S0=K+pick([-12,-8,-3,4,8]),pps=Math.max(K-S0,0)-p,pr=pps*100;return N("7.2",`You buy 1 put contract with a $${K} strike for a $${p} premium. At expiration the stock is $${S0}. What is your profit or loss?`,pr,[pps,(K-S0)*100,(S0-K-p)*100],v=>(v>0?"+":"")+money(v),`Per share: max(${K} − ${S0}, 0) − ${p} = ${money(pps)}. × 100 shares = ${money(pr)}.`)},
 ()=>{const K=pick([25,40,50,75,100]),p=pick([1.5,2,3,4.5]);return N("7.2",`A call has a $${K} strike and a $${p} premium. What is its breakeven price at expiration?`,K+p,[K-p,K,K+p*100],v=>money(v,2),`Call breakeven = strike + premium = ${K} + ${p} = ${money(K+p,2)}.`)},
 ()=>{const p=pick([1.5,2,3,4]),n=pick([1,2,3]);return N("7.1",`An option's premium is $${p} per share. How much do ${n} contract${n>1?"s":""} cost?`,p*100*n,[p*n,p*100,p*10*n],v=>money(v),`1 contract = 100 shares. ${money(p,2)} × 100 × ${n} = ${money(p*100*n)}.`)},
 ()=>S("7.3","You own 100 shares and buy a put to limit how much you can lose. This is a…","Protective put",["Covered call","Naked call","Short squeeze"],"Owning shares + buying a put works like insurance."),
 ()=>S("7.3","You own 100 shares and sell a call to earn extra income. This is a…","Covered call",["Protective put","Long call","Futures hedge"],"Own shares + sell a call = covered call. You give up gains above the strike."),
 ()=>S("7.4","A corn farmer agrees today on a price for corn she'll deliver in fall. She is a…","Hedger",["Speculator","Short seller","Market maker"],"A hedger uses derivatives to reduce risk (Southwest fuel hedging)."),
 ()=>S("7.4","How is a futures contract different from buying an option?","Futures are an obligation to buy or sell; an option is a right",["Futures are a right; options are an obligation","Futures can't lose money","Only options trade on exchanges"],"Both sides of a futures contract must follow through. An option buyer can walk away."),
 ()=>S("7.1","What is the most the buyer of a call can lose?","The premium paid",["Unlimited","The strike price","Nothing"],"An option buyer's loss is capped at the premium.")
];

/* ---------------- Unit 8 ---------------- */
B[8]=[
 ()=>{const inv=pick([250000,500000,1000000,2000000]),st=pick([5,10,20,25,40]),v=inv/(st/100);return N("8.5",`An investor pays ${big(inv)} for a ${st}% stake in a startup. What valuation does that put on the company?`,v,[inv*st/100,inv,inv/st],big,`Valuation = investment ÷ stake = ${big(inv)} ÷ ${st/100} = ${big(v)}.`)},
 ()=>{const rent=pick([1800,2100,2400,2800]),mort=pick([1200,1400,1600]),ti=pick([250,300,400]),rep=pick([150,200,300]),cf=rent-(mort+ti+rep);return N("8.4",`A rental brings in ${money(rent)}/month. Costs: mortgage ${money(mort)}, taxes and insurance ${money(ti)}, repairs and other ${money(rep)}. What is the monthly cash flow?`,cf,[rent-mort,rent,mort+ti+rep],v=>(v<0?"":"")+money(v),`Cash flow = ${money(rent)} − (${money(mort)} + ${money(ti)} + ${money(rep)}) = ${money(cf)}.`)},
 ()=>S("8.2","Which is the biggest scam red flag?","“Guaranteed 2% a day, but act now”",["“Prices go up and down”","“This fund has a 0.05% expense ratio”","“Bitcoin's supply is capped”"],"Guaranteed returns plus pressure to act fast are classic red flags (TerraUSD)."),
 ()=>S("8.1","What happens if you lose your crypto wallet's private key?","You lose access to the coins",["The exchange resets it","Your coins move to a bank","Nothing; the blockchain has a copy of your key"],"Not your keys, not your coins: the key proves ownership."),
 ()=>S("8.1","What is the maximum number of bitcoin that will ever exist?","21 million",["21 billion","No limit","1 million"],"Bitcoin's supply is capped at 21 million."),
 ()=>S("8.4","Compared with owning a rental house, a REIT is…","Easier to buy and sell, and pays most income as dividends",["Harder to sell and pays no dividends","Guaranteed by the government","A type of cryptocurrency"],"REITs trade like stocks (liquid) and must pay out most taxable income."),
 ()=>S("8.5","Which pays its owner no income?","Gold",["A REIT","A dividend stock","A corporate bond"],"Gold earns no interest or dividends; its price moves with fear, inflation, rates and the dollar."),
 ()=>S("8.3","Which crypto allocation fits most experts' advice for a long-term investor?","A small slice, about 0–5%",["50% or more","100% if you're young","Whatever you can borrow"],"Crypto is very volatile, so most advice keeps it small enough that a crash won't wreck your plan."),
 ()=>S("8.1","Each block in a blockchain stores the previous block's…","Hash",["Private key","Stake","Expense ratio"],"Linking hashes makes the record hard to change.")
];

window.BANK=B;
window.BANKUTIL={ri,pick,shuffle,money,pct,big};
})();
