import { useState } from "react";

const BETA_CODES = ["PREDIQ20","MIROFISH","SWARM01","INDIA2026","CHILE2026","HAL2026","GOLD2026","NSE2026","NIFTY01","LATAM01"];
const WEB3FORMS_KEY = "1da1663f-084f-4777-ab36-619c76981bcd";

export default function LandingPageES() {
  const [email,setEmail]=useState("");
  const [code,setCode]=useState("");
  const [view,setView]=useState<"landing"|"waitlist"|"access"|"joined"|"entering">("landing");
  const [error,setError]=useState("");

  const joinWaitlist = async () => {
    if (!email || !email.includes("@")) { setError("Ingresa un email valido"); return; }
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "PREDIQ Lista de Espera — LATAM",
          from_name: "PREDIQ Lista de Espera",
          email: email,
          message: "Nueva inscripcion LATAM: " + email + " — " + new Date().toLocaleString(),
        }),
      });
    } catch(e) {}
    setView("joined");
  };

  const enterCode = () => {
    if (BETA_CODES.includes(code.toUpperCase().trim())) {
      setView("entering");
      setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
    } else {
      setError("Codigo invalido. Unete a la lista de espera para solicitar acceso.");
    }
  };

  return (
    <div style={{background:"#030810",minHeight:"100vh",fontFamily:"'SF Mono','Fira Code',monospace",color:"#e0e8f0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",position:"relative",overflow:"hidden"}}>

      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:600,height:600,background:"radial-gradient(circle,rgba(0,255,136,0.04) 0%,transparent 70%)",pointerEvents:"none"}}/>

      {/* BETA badge */}
      <div style={{position:"absolute",top:16,right:16,background:"#ffaa0015",border:"1px solid #ffaa00",borderRadius:4,padding:"4px 12px",fontSize:10,fontWeight:700,color:"#ffaa00",letterSpacing:2}}>
        BETA PRIVADA
      </div>

      {/* Language toggle */}
      <div style={{position:"absolute",top:16,left:16,display:"flex",gap:6}}>
        <a href="/" style={{fontSize:10,color:"#3a6080",textDecoration:"none",border:"1px solid #0d2035",padding:"3px 10px",borderRadius:4}}>EN</a>
        <span style={{fontSize:10,color:"#00ff88",border:"1px solid #00ff88",padding:"3px 10px",borderRadius:4}}>ES</span>
      </div>

      {/* LOGO */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:48,fontWeight:700,letterSpacing:4,color:"#00ff88",marginBottom:8,textShadow:"0 0 40px rgba(0,255,136,0.3)"}}>PREDIQ</div>
        <div style={{fontSize:14,color:"#3a6080",letterSpacing:3,marginBottom:24}}>TIME MACHINE</div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:32}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 8px #00ff88"}}/>
          <span style={{fontSize:11,color:"#00ff88",letterSpacing:1}}>ENJAMBRE ACTIVO</span>
          <div style={{width:1,height:12,background:"#0d2035"}}/>
          <span style={{fontSize:11,color:"#3a6080"}}>847 en lista de espera</span>
        </div>

        <div style={{maxWidth:520,margin:"0 auto 16px"}}>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e0e8f0",lineHeight:1.4,margin:0}}>
            Prediccion de acciones con IA<br/>
            <span style={{color:"#00ff88"}}>2.4 millones de agentes swarm</span>
          </h1>
        </div>

        <div style={{maxWidth:480,margin:"0 auto 32px",fontSize:12,color:"#8ab0cc",lineHeight:1.8}}>
          Modelado en el comportamiento de bancos de peces. Cada agente tiene su propio apetito de riesgo, estado de animo e influencia social. Cuando el banco gira — esa es tu senal.
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>
          {[["83.3%","PRECISION EN VIVO"],["423","SENALES REGISTRADAS"],["GPT-5 +14.6%","SUPERA A LA IA"],["28","ACTIVOS"]].map(([v,l])=>(
            <div key={l} style={{background:"#050d1a",border:"1px solid #0d2035",borderRadius:8,padding:"12px 20px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:"#00ff88",marginBottom:3}}>{v}</div>
              <div style={{fontSize:9,color:"#3a6080",letterSpacing:1}}>{l}</div>
            </div>
          ))}
        </div>

        {/* LATAM assets */}
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
          {[["SQM","Litio Chile"],["IPSA","Bolsa Santiago"],["CLP/USD","Peso Chileno"],["COBRE","Mercado Global"],["PETROLEO","WTI + Brent"]].map(([code,name])=>(
            <div key={code} style={{background:"#0a001a",border:"1px solid #aa44ff44",borderRadius:6,padding:"6px 12px",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#aa66ff"}}>{code}</div>
              <div style={{fontSize:9,color:"#3a6080"}}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LANDING */}
      {view==="landing" && (
        <div style={{width:"100%",maxWidth:440}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <button onClick={()=>setView("waitlist")} style={{padding:"14px",borderRadius:6,cursor:"pointer",background:"#00ff88",border:"none",color:"#030810",fontWeight:700,fontSize:12,letterSpacing:1,fontFamily:"inherit"}}>
              UNIRSE A LA LISTA
            </button>
            <button onClick={()=>setView("access")} style={{padding:"14px",borderRadius:6,cursor:"pointer",background:"transparent",border:"1px solid #00ff88",color:"#00ff88",fontWeight:700,fontSize:12,letterSpacing:1,fontFamily:"inherit"}}>
              TENGO UN CODIGO
            </button>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8}}>
            <a href="/accuracy" style={{fontSize:10,color:"#3a6080",textDecoration:"none"}}>PRECISION</a>
            <a href="/disclaimer" style={{fontSize:10,color:"#3a6080",textDecoration:"none"}}>AVISO LEGAL</a>
            <a href="/network" style={{fontSize:10,color:"#aa66ff",textDecoration:"none"}}>RED DE AGENTES</a>
          </div>
          <div style={{textAlign:"center",fontSize:10,color:"#1a3a5c"}}>Beta privada — 20 usuarios activos — Chile + India</div>
        </div>
      )}

      {/* WAITLIST */}
      {view==="waitlist" && (
        <div style={{width:"100%",maxWidth:440,background:"#050d1a",border:"1px solid #0d2035",borderRadius:10,padding:24}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e0e8f0",letterSpacing:1,marginBottom:4}}>UNIRSE A LA LISTA DE ESPERA</div>
          <div style={{fontSize:10,color:"#3a6080",marginBottom:20}}>Aprobamos traders en grupos de 20. Recibiras tu codigo de acceso beta en 48 horas.</div>
          <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} placeholder="tu@email.com"
            style={{width:"100%",background:"#030810",border:"1px solid #0d2035",borderRadius:4,padding:"10px 14px",color:"#e0e8f0",fontFamily:"inherit",fontSize:13,marginBottom:10,boxSizing:"border-box" as const}}/>
          {error && <div style={{fontSize:10,color:"#ff4466",marginBottom:8}}>{error}</div>}
          <button onClick={joinWaitlist} style={{width:"100%",padding:"11px",borderRadius:4,cursor:"pointer",background:"#00ff88",border:"none",color:"#030810",fontWeight:700,fontSize:11,letterSpacing:2,fontFamily:"inherit",marginBottom:10}}>
            SOLICITAR ACCESO BETA
          </button>
          <button onClick={()=>setView("landing")} style={{width:"100%",padding:"8px",borderRadius:4,cursor:"pointer",background:"transparent",border:"1px solid #0d2035",color:"#3a6080",fontSize:10,fontFamily:"inherit"}}>
            VOLVER
          </button>
        </div>
      )}

      {/* JOINED */}
      {view==="joined" && (
        <div style={{width:"100%",maxWidth:440,background:"#002a18",border:"1px solid #00ff88",borderRadius:10,padding:28,textAlign:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 12px #00ff88",margin:"0 auto 16px"}}/>
          <div style={{fontSize:14,fontWeight:700,color:"#00ff88",letterSpacing:1,marginBottom:8}}>ESTAS EN LA LISTA</div>
          <div style={{fontSize:11,color:"#006644",lineHeight:1.8,marginBottom:16}}>
            Te enviaremos tu codigo de acceso beta en 48 horas. Traders de Chile e India tienen prioridad.
          </div>
          <div style={{fontSize:10,color:"#3a6080"}}>Sigue a Vinayraj George en LinkedIn para actualizaciones.</div>
        </div>
      )}

      {/* ACCESS */}
      {view==="access" && (
        <div style={{width:"100%",maxWidth:440,background:"#050d1a",border:"1px solid #0d2035",borderRadius:10,padding:24}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e0e8f0",letterSpacing:1,marginBottom:4}}>INGRESAR CODIGO BETA</div>
          <div style={{fontSize:10,color:"#3a6080",marginBottom:20}}>Ingresa el codigo recibido de Vinayraj para acceder al dashboard de PREDIQ.</div>
          <input value={code} onChange={e=>{setCode(e.target.value);setError("");}} placeholder="XXXXXXXX"
            style={{width:"100%",background:"#030810",border:"1px solid #0d2035",borderRadius:4,padding:"10px 14px",color:"#00ff88",fontFamily:"inherit",fontSize:16,fontWeight:700,letterSpacing:4,marginBottom:10,boxSizing:"border-box" as const,textTransform:"uppercase" as const}}/>
          {error && <div style={{fontSize:10,color:"#ff4466",marginBottom:8}}>{error}</div>}
          <button onClick={enterCode} style={{width:"100%",padding:"11px",borderRadius:4,cursor:"pointer",background:"transparent",border:"1px solid #00ff88",color:"#00ff88",fontWeight:700,fontSize:11,letterSpacing:2,fontFamily:"inherit",marginBottom:10}}>
            ENTRAR A PREDIQ
          </button>
          <button onClick={()=>setView("landing")} style={{width:"100%",padding:"8px",borderRadius:4,cursor:"pointer",background:"transparent",border:"1px solid #0d2035",color:"#3a6080",fontSize:10,fontFamily:"inherit"}}>
            VOLVER
          </button>
        </div>
      )}

      {/* ENTERING */}
      {view==="entering" && (
        <div style={{textAlign:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 16px #00ff88",margin:"0 auto 20px"}}/>
          <div style={{fontSize:14,fontWeight:700,color:"#00ff88",letterSpacing:2,marginBottom:8}}>CODIGO VERIFICADO</div>
          <div style={{fontSize:11,color:"#3a6080"}}>Entrando al enjambre...</div>
        </div>
      )}

      {/* BOTTOM TICKER */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#020609",borderTop:"1px solid #0d2035",padding:"5px 20px",display:"flex",gap:20,overflowX:"auto"}}>
        {[["SQM","$38.42","+2.10%",true],["IPSA","6,821","+0.40%",true],["CLP/USD","984","+0.80%",true],["COBRE","$4.82","+1.05%",true],["ORO","$4,450","+0.28%",true],["WTI","$68.74","+2.69%",true],["USD","₹83.42","-0.12%",false]].map(([l,p,c,up])=>(
          <div key={l as string} style={{display:"flex",gap:5,alignItems:"center",flexShrink:0,fontSize:10}}>
            <span style={{color:"#3a6080"}}>{l}</span>
            <span style={{color:"#8ab0cc"}}>{p}</span>
            <span style={{color:(up as boolean)?"#00ff88":"#ff4466"}}>{c}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
