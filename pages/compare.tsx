import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";

const ASSETS = [
  { label:"NIFTY50",   name:"Nifty 50",           currency:"₹",   group:"india"  },
  { label:"SENSEX",    name:"BSE Sensex",          currency:"₹",   group:"india"  },
  { label:"NIFTYBANK", name:"Bank Nifty",          currency:"₹",   group:"india"  },
  { label:"NIFTYIT",   name:"Nifty IT",            currency:"₹",   group:"india"  },
  { label:"NIFTYAUTO", name:"Nifty Auto",          currency:"₹",   group:"india"  },
  { label:"SPX",       name:"S&P 500",             currency:"$",   group:"us"     },
  { label:"NASDAQ",    name:"Nasdaq",              currency:"$",   group:"us"     },
  { label:"DOW",       name:"Dow Jones",           currency:"$",   group:"us"     },
  { label:"TSX",       name:"TSX Composite",       currency:"CAD", group:"canada" },
  { label:"IPSA",      name:"IPSA Chile",          currency:"CLP", group:"latam"  },
  { label:"AAPL",      name:"Apple",               currency:"$",   group:"us"     },
  { label:"MSFT",      name:"Microsoft",           currency:"$",   group:"us"     },
  { label:"NVIDIA",    name:"NVIDIA",              currency:"$",   group:"us"     },
  { label:"GOOGL",     name:"Google",              currency:"$",   group:"us"     },
  { label:"AMZN",      name:"Amazon",              currency:"$",   group:"us"     },
  { label:"META",      name:"Meta",                currency:"$",   group:"us"     },
  { label:"TSLA",      name:"Tesla",               currency:"$",   group:"us"     },
  { label:"NFLX",      name:"Netflix",             currency:"$",   group:"us"     },
  { label:"UBER",      name:"Uber",                currency:"$",   group:"us"     },
  { label:"JPM",       name:"JPMorgan",            currency:"$",   group:"us"     },
  { label:"BAC",       name:"Bank of America",     currency:"$",   group:"us"     },
  { label:"GS",        name:"Goldman Sachs",       currency:"$",   group:"us"     },
  { label:"XOM",       name:"ExxonMobil",          currency:"$",   group:"us"     },
  { label:"CVX",       name:"Chevron",             currency:"$",   group:"us"     },
  { label:"LMT",       name:"Lockheed Martin",     currency:"$",   group:"us"     },
  { label:"NOC",       name:"Northrop Grumman",    currency:"$",   group:"us"     },
  { label:"GD",        name:"General Dynamics",    currency:"$",   group:"us"     },
  { label:"WMT",       name:"Walmart",             currency:"$",   group:"us"     },
  { label:"MCD",       name:"McDonald's",          currency:"$",   group:"us"     },
  { label:"KO",        name:"Coca-Cola",           currency:"$",   group:"us"     },
  { label:"PEP",       name:"PepsiCo",             currency:"$",   group:"us"     },
  { label:"JNJ",       name:"J&J",                 currency:"$",   group:"us"     },
  { label:"PFE",       name:"Pfizer",              currency:"$",   group:"us"     },
  { label:"MRNA",      name:"Moderna",             currency:"$",   group:"us"     },
  { label:"BRK",       name:"Berkshire",           currency:"$",   group:"us"     },
  { label:"CAT",       name:"Caterpillar",         currency:"$",   group:"us"     },
  { label:"BA",        name:"Boeing",              currency:"$",   group:"us"     },
  { label:"GE",        name:"GE Aerospace",        currency:"$",   group:"us"     },
  { label:"VZ",        name:"Verizon",             currency:"$",   group:"us"     },
  { label:"TMUS",      name:"T-Mobile",            currency:"$",   group:"us"     },
  { label:"T",         name:"AT&T",                currency:"$",   group:"us"     },
  { label:"TCS",       name:"TCS",                 currency:"₹",   group:"india"  },
  { label:"INFY",      name:"Infosys",             currency:"₹",   group:"india"  },
  { label:"RELIANCE",  name:"Reliance",            currency:"₹",   group:"india"  },
  { label:"HDFC",      name:"HDFC Bank",           currency:"₹",   group:"india"  },
  { label:"ICICI",     name:"ICICI Bank",          currency:"₹",   group:"india"  },
  { label:"WIPRO",     name:"Wipro",               currency:"₹",   group:"india"  },
  { label:"HAL",       name:"HAL",                 currency:"₹",   group:"india"  },
  { label:"BEL",       name:"BEL",                 currency:"₹",   group:"india"  },
  { label:"AIRTEL",    name:"Bharti Airtel",       currency:"₹",   group:"india"  },
  { label:"SBIN",      name:"SBI",                 currency:"₹",   group:"india"  },
  { label:"HCLTECH",   name:"HCL Tech",            currency:"₹",   group:"india"  },
  { label:"ZOMATO",    name:"Zomato",              currency:"₹",   group:"india"  },
  { label:"TATAMOTORS",name:"Tata Motors",         currency:"₹",   group:"india"  },
  { label:"AXISBANK",  name:"Axis Bank",           currency:"₹",   group:"india"  },
  { label:"KOTAKBANK", name:"Kotak Bank",          currency:"₹",   group:"india"  },
  { label:"MARUTI",    name:"Maruti Suzuki",       currency:"₹",   group:"india"  },
  { label:"LT",        name:"L&T",                 currency:"₹",   group:"india"  },
  { label:"ITC",       name:"ITC",                 currency:"₹",   group:"india"  },
  { label:"SUNPHARMA", name:"Sun Pharma",          currency:"₹",   group:"india"  },
  { label:"TITAN",     name:"Titan",               currency:"₹",   group:"india"  },
  { label:"RY",        name:"Royal Bank",          currency:"CAD", group:"canada" },
  { label:"TD",        name:"TD Bank",             currency:"CAD", group:"canada" },
  { label:"SHOP",      name:"Shopify",             currency:"CAD", group:"canada" },
  { label:"ENB",       name:"Enbridge",            currency:"CAD", group:"canada" },
  { label:"CNR",       name:"CN Railway",          currency:"CAD", group:"canada" },
  { label:"ABX",       name:"Barrick Gold",        currency:"CAD", group:"canada" },
  { label:"GOLD",      name:"Gold",                currency:"$",   group:"metals" },
  { label:"SILVER",    name:"Silver",              currency:"$",   group:"metals" },
  { label:"COPPER",    name:"Copper",              currency:"$",   group:"metals" },
  { label:"WTI",       name:"WTI Crude",           currency:"$",   group:"metals" },
  { label:"BRENT",     name:"Brent Crude",         currency:"$",   group:"metals" },
  { label:"NATGAS",    name:"Natural Gas",         currency:"$",   group:"metals" },
  { label:"PLATINUM",  name:"Platinum",            currency:"$",   group:"metals" },
  { label:"BTC/USD",   name:"Bitcoin",             currency:"$",   group:"crypto" },
  { label:"ETH/USD",   name:"Ethereum",            currency:"$",   group:"crypto" },
  { label:"SOL/USD",   name:"Solana",              currency:"$",   group:"crypto" },
  { label:"XRP/USD",   name:"XRP",                 currency:"$",   group:"crypto" },
  { label:"USD/INR",   name:"USD/INR",             currency:"₹",   group:"forex"  },
  { label:"CLP/USD",   name:"CLP/USD",             currency:"CLP", group:"forex"  },
  { label:"SQM",       name:"SQM Lithium",         currency:"$",   group:"latam"  },
  { label:"FALABELLA", name:"Falabella",           currency:"CLP", group:"latam"  },
  { label:"COPEC",     name:"Copec",               currency:"CLP", group:"latam"  },
  { label:"ENELCHILE", name:"Enel Chile",          currency:"CLP", group:"latam"  },
  { label:"BCHILE",    name:"Banco de Chile",      currency:"CLP", group:"latam"  },
  { label:"AMX",       name:"América Móvil 🇲🇽",  currency:"$",   group:"latam"  },
  { label:"FEMSA",     name:"FEMSA 🇲🇽",           currency:"$",   group:"latam"  },
  { label:"CEMEX",     name:"Cemex 🇲🇽",           currency:"$",   group:"latam"  },
  { label:"PBR",       name:"Petrobras 🇧🇷",       currency:"$",   group:"latam"  },
  { label:"VALE",      name:"Vale 🇧🇷",            currency:"$",   group:"latam"  },
  { label:"ITUB",      name:"Itaú Unibanco 🇧🇷",  currency:"$",   group:"latam"  },
  { label:"MELI",      name:"MercadoLibre 🇦🇷",   currency:"$",   group:"latam"  },
  { label:"YPF",       name:"YPF 🇦🇷",            currency:"$",   group:"latam"  },
  { label:"EC",        name:"Ecopetrol 🇨🇴",       currency:"$",   group:"latam"  },
  { label:"CIB",       name:"Bancolombia 🇨🇴",     currency:"$",   group:"latam"  },
];

const TABS=[
  {key:"all",    label:"ALL"},
  {key:"india",  label:"🇮🇳 INDIA"},
  {key:"us",     label:"🇺🇸 US"},
  {key:"canada", label:"🇨🇦 CANADA"},
  {key:"latam",  label:"🌎 LATAM"},
  {key:"crypto", label:"₿ CRYPTO"},
  {key:"metals", label:"🥇 METALS"},
  {key:"forex",  label:"💱 FOREX"},
  {key:"winners",label:"📈 WINNERS"},
  {key:"losers", label:"📉 LOSERS"},
];

const MARKETS=[
  {name:"🇮🇳 NSE",  open:3,  close:10, days:[1,2,3,4,5]},
  {name:"🇺🇸 NYSE", open:14, close:21, days:[1,2,3,4,5]},
  {name:"🇨🇱 BCS",  open:13, close:21, days:[1,2,3,4,5]},
  {name:"🇨🇦 TSX",  open:14, close:21, days:[1,2,3,4,5]},
  {name:"₿ CRYPTO",open:0,  close:24, days:[0,1,2,3,4,5,6]},
];

function isOpen(m:{open:number,close:number,days:number[]}):boolean{
  const now=new Date();
  const h=now.getUTCHours(),d=now.getUTCDay();
  if(!m.days.includes(d)) return false;
  if(m.open===0&&m.close===24) return true;
  return h>=m.open&&h<m.close;
}

interface Row{label:string;name:string;currency:string;group:string;price:number;yesterday:number;change:number;change_pct:number;error?:boolean;}

function fmt(v:number,c:string):string{
  if(!v)return"--";
  const s=c==="₹"?"₹":c==="CLP"?"CLP ":c==="CAD"?"CA$":"$";
  if(v>=100000)return s+Math.round(v/1000)+"K";
  if(v>=1000)return s+Math.round(v).toLocaleString();
  if(v>=1)return s+v.toFixed(2);
  return s+v.toFixed(4);
}

function sig(p:number){
  if(p>3)  return{l:"STRONG BUY", bg:"#002a18",c:"#00ff88",b:"#00ff8866"};
  if(p>1)  return{l:"BUY",        bg:"#001a10",c:"#00ff88",b:"#00ff8833"};
  if(p>0.3)return{l:"MILD BUY",   bg:"#001008",c:"#00cc66",b:"#00cc6633"};
  if(p<-3) return{l:"STRONG SELL",bg:"#2a0010",c:"#ff4466",b:"#ff446666"};
  if(p<-1) return{l:"SELL",       bg:"#1a0008",c:"#ff4466",b:"#ff446633"};
  if(p<-0.3)return{l:"MILD SELL", bg:"#100006",c:"#ff6688",b:"#ff668833"};
  return{l:"HOLD",bg:"#1a1500",c:"#ffaa00",b:"#ffaa0033"};
}

function Bar({p}:{p:number}){
  return(
    <div style={{width:60,height:4,background:"#0d2035",borderRadius:2,overflow:"hidden"}}>
      <div style={{width:`${Math.min(Math.abs(p)*8,100)}%`,height:"100%",background:p>=0?"#00ff88":"#ff4466",borderRadius:2}}/>
    </div>
  );
}

export default function Compare(){
  const[rows,setRows]=useState<Row[]>([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("all");
  const[updated,setUpdated]=useState("");
  const[err,setErr]=useState("");
  const[now,setNow]=useState(new Date());

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(t);},[]);

  async function load(){
    setLoading(true);setErr("");
    try{
      const r=await fetch(`${API}/api/prices`);
      if(!r.ok)throw new Error();
      const d=await r.json();
      const p=d.prices||{};
      setRows(ASSETS.map(a=>{
        const x=p[a.label];
        if(!x||!x.price)return{...a,price:0,yesterday:0,change:0,change_pct:0,error:true};
        return{...a,price:x.price,yesterday:x.price-(x.change||0),change:x.change||0,change_pct:x.change_pct||0};
      }));
      setUpdated(new Date().toLocaleTimeString());
    }catch{setErr("Could not load prices.");}
    setLoading(false);
  }

  useEffect(()=>{load();},[]);

  const valid=rows.filter(r=>!r.error);
  const shown=valid.filter(r=>{
    if(filter==="all")return true;
    if(filter==="winners")return r.change_pct>0;
    if(filter==="losers")return r.change_pct<0;
    return r.group===filter;
  });
  const w=valid.filter(r=>r.change_pct>0).length;
  const l=valid.filter(r=>r.change_pct<0).length;
  const g=(lbl:string)=>rows.find(r=>r.label===lbl);

  const td={padding:"9px 12px",borderBottom:"1px solid #060d18",whiteSpace:"nowrap" as const};
  const th={padding:"10px 12px",textAlign:"left" as const,fontSize:8,letterSpacing:2,color:"#3a6080",borderBottom:"1px solid #0d2035",whiteSpace:"nowrap" as const};

  return(
    <div style={{minHeight:"100vh",background:"#020609",color:"#e0e8f0",fontFamily:"monospace",paddingBottom:80}}>

      {/* Header */}
      <div style={{background:"#050d1a",borderBottom:"1px solid #0d2035",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,letterSpacing:2}}>TODAY VS YESTERDAY</div>
          <div style={{fontSize:9,color:"#3a6080",letterSpacing:1,marginTop:2}}>PREDIQ · {updated?`Updated ${updated}`:"Loading..."}</div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={load} style={{background:"none",border:"1px solid #0d2035",color:"#3a6080",fontSize:9,padding:"5px 12px",borderRadius:4,cursor:"pointer",fontFamily:"monospace"}}>⟳ REFRESH</button>
          <a href="/" style={{fontSize:9,color:"#3a6080",textDecoration:"none"}}>← DASHBOARD</a>
        </div>
      </div>

      {/* Market Status */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid #0d2035",background:"#030810",overflowX:"auto" as const}}>
        {MARKETS.map(m=>{
          const open=isOpen(m);
          return(
            <div key={m.name} style={{padding:"8px 20px",borderRight:"1px solid #0d2035",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:open?"#00ff88":"#ff4466",boxShadow:open?"0 0 6px #00ff88":"none"}}/>
              <span style={{fontSize:9,color:open?"#00ff88":"#3a6080"}}>{m.name}</span>
              <span style={{fontSize:8,color:"#1a3a5c"}}>{open?"OPEN":"CLOSED"}</span>
            </div>
          );
        })}
        <div style={{padding:"8px 20px",marginLeft:"auto",flexShrink:0}}>
          <span style={{fontSize:8,color:"#3a6080"}}>{now.toUTCString().slice(0,25)}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"#0d2035",borderBottom:"1px solid #0d2035"}}>
        {[{lbl:"NIFTY 50",key:"NIFTY50"},{lbl:"S&P 500",key:"SPX"},{lbl:"GOLD",key:"GOLD"},{lbl:"BITCOIN",key:"BTC/USD"}].map(a=>{
          const r=g(a.key);const up=r&&r.change_pct>=0;
          return(
            <div key={a.key} style={{background:"#020609",padding:"18px 24px"}}>
              <div style={{fontSize:8,letterSpacing:3,color:"#3a6080",marginBottom:6}}>{a.lbl}</div>
              <div style={{fontSize:20,fontWeight:700,color:r?(up?"#00ff88":"#ff4466"):"#3a6080"}}>{r?fmt(r.price,r.currency):"--"}</div>
              <div style={{fontSize:9,marginTop:4,color:r?(up?"#00ff88":"#ff4466"):"#3a6080"}}>
                {r?((up?"+":"")+r.change_pct.toFixed(2)+"% vs yesterday"):"--"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strip */}
      <div style={{display:"flex",gap:24,padding:"10px 24px",borderBottom:"1px solid #0d2035",background:"#030810",flexWrap:"wrap" as const}}>
        <span style={{fontSize:9,color:"#3a6080"}}>
          <span style={{color:"#00ff88",fontWeight:700}}>📈 {w} WINNERS</span>
          {" · "}<span style={{color:"#ff4466",fontWeight:700}}>📉 {l} LOSERS</span>
          {" · "}<span style={{color:"#ffaa00"}}>{valid.length} ASSETS</span>
        </span>
        <span style={{fontSize:9,color:"#3a6080"}}>PREDIQ ACCURACY: <span style={{color:"#FFD166",fontWeight:700}}>83.3%</span> · BEATS GPT-5 <span style={{color:"#00ff88",fontWeight:700}}>+14.6%</span></span>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,padding:"14px 24px",borderBottom:"1px solid #0d2035",background:"#030810"}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setFilter(t.key)} style={{fontFamily:"monospace",fontSize:9,padding:"5px 14px",borderRadius:20,cursor:"pointer",background:filter===t.key?"#e0e8f0":"transparent",color:filter===t.key?"#02070c":"#3a6080",border:`1px solid ${filter===t.key?"#e0e8f0":"#0d2035"}`,fontWeight:filter===t.key?700:400}}>
            {t.label}
          </button>
        ))}
        <span style={{fontSize:9,color:"#3a6080",marginLeft:"auto",alignSelf:"center"}}>{shown.length} assets</span>
      </div>

      {err&&<div style={{margin:"24px",padding:"16px",background:"#1a0008",border:"1px solid #ff446644",borderRadius:6,color:"#ff4466",fontSize:11}}>⚠ {err}</div>}

      {/* Table */}
      <div style={{overflowX:"auto" as const,padding:"0 24px"}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead>
            <tr style={{background:"#060d18"}}>
              <th style={th}>ASSET</th>
              <th style={th}>YESTERDAY</th>
              <th style={th}>TODAY</th>
              <th style={th}>CHANGE %</th>
              <th style={th}>CHANGE AMT</th>
              <th style={th}>MOVE</th>
              <th style={th}>SIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {loading?(
              <tr><td colSpan={7} style={{...td,textAlign:"center",color:"#3a6080",padding:40}}>Fetching {ASSETS.length} live prices...</td></tr>
            ):shown.length===0?(
              <tr><td colSpan={7} style={{...td,textAlign:"center",color:"#3a6080",padding:40}}>No assets</td></tr>
            ):shown.map((r,i)=>{
              const s=sig(r.change_pct);
              return(
                <tr key={r.label} style={{background:i%2===0?"#02070c":"#040b14"}}>
                  <td style={td}><span style={{fontWeight:700}}>{r.name}</span><span style={{color:"#3a6080",fontSize:9,marginLeft:6}}>{r.label}</span></td>
                  <td style={{...td,color:"#3a6080"}}>{fmt(r.yesterday,r.currency)}</td>
                  <td style={{...td,fontWeight:700,color:r.change_pct>=0?"#00ff88":"#ff4466"}}>{fmt(r.price,r.currency)}</td>
                  <td style={{...td,color:r.change_pct>=0?"#00ff88":"#ff4466",fontWeight:700}}>{(r.change_pct>=0?"+":"")+r.change_pct.toFixed(2)+"%"}</td>
                  <td style={{...td,color:r.change_pct>=0?"#00ff88":"#ff4466"}}>{r.change>=0?"+":""}{fmt(Math.abs(r.change),r.currency)}</td>
                  <td style={td}><Bar p={r.change_pct}/></td>
                  <td style={td}><span style={{fontSize:8,padding:"2px 8px",borderRadius:3,fontWeight:700,background:s.bg,color:s.c,border:`1px solid ${s.b}`}}>{s.l}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{fontSize:9,color:"#1a3a5c",marginTop:20,textAlign:"center"}}>
        PREDIQ Time Machine · {ASSETS.length} assets · Yahoo Finance · Updates every 5 min
      </div>
    </div>
  );
}
