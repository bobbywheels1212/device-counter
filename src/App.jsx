import { useState } from "react";

const DEFAULT_DEVICES = [
  { id: "sw1",  name: "Single Pole", cat: "Switches",    slot: "S" },
  { id: "sw2",  name: "3-Way",       cat: "Switches",    slot: "S" },
  { id: "sw3",  name: "Dimmer",      cat: "Switches",    slot: "S" },
  { id: "rec1", name: "Duplex",      cat: "Receptacles", slot: "D" },
  { id: "rec2", name: "GFCI",        cat: "Receptacles", slot: "B" },
  { id: "rec3", name: "20A",         cat: "Receptacles", slot: "D" },
  { id: "rec4", name: "USB",         cat: "Receptacles", slot: "B" },
];

const DEVICE_SUGGESTIONS = [
  "4-Way","AFCI","Smart Switch","Fan Switch","Outlet 240V",
  "Dryer Outlet","Range Outlet","Blank","Phone Jack","Cable",
];

const DEFAULT_PLATES = [
  { code: "S",   label: "Switch",                   gang: 1 },
  { code: "D",   label: "Duplex",                   gang: 1 },
  { code: "B",   label: "Box / Decora",             gang: 1 },
  { code: "SS",  label: "Switch / Switch",          gang: 2 },
  { code: "SSS", label: "Switch / Switch / Switch", gang: 3 },
];

const SLOT_SUGGESTIONS = ["SD","SB","DS","BS","DSS","SSB","SSD","SSSS","SDS","BDS"];
const slotLabel = (ch) => ch === "S" ? "Switch" : ch === "D" ? "Duplex" : "Box";
const parseCode = (raw) => { const code = raw.toUpperCase().replace(/[^SDB]/g,""); return { code, gang: code.length }; };
const makeRoom = (n, devs, plates) => ({
  id: Date.now() + Math.random(),
  name: `Room ${n}`,
  counts: Object.fromEntries(devs.map(d=>[d.id,0])),
  plates: Object.fromEntries(plates.map(p=>[p.code,0])),
});

export default function App() {
  const [devices, setDevices]     = useState(DEFAULT_DEVICES);
  const [plateDefs, setPlateDefs] = useState(DEFAULT_PLATES);
  const [rooms, setRooms]         = useState(() => [makeRoom(1, DEFAULT_DEVICES, DEFAULT_PLATES)]);
  const [activeId, setActiveId]   = useState(null);
  const [editName, setEditName]   = useState(null);
  const [tab, setTab]             = useState("devices");
  const [view, setView]           = useState("count");
  const [showAddDev, setShowAddDev]     = useState(false);
  const [newDevName, setNewDevName]     = useState("");
  const [newDevCat, setNewDevCat]       = useState("Switches");
  const [newDevSlot, setNewDevSlot]     = useState("S");
  const [showAddPlate, setShowAddPlate] = useState(false);
  const [newPlateCode, setNewPlateCode] = useState("");

  const roomId = activeId ?? rooms[0]?.id;
  const room   = rooms.find(r=>r.id===roomId) ?? rooms[0];
  const mutRoom = fn => setRooms(prev=>prev.map(r=>r.id===room.id?fn(r):r));
  const incCount = (id,d) => mutRoom(r=>({...r,counts:{...r.counts,[id]:Math.max(0,(r.counts[id]??0)+d)}}));
  const incPlate = (code,d) => mutRoom(r=>({...r,plates:{...r.plates,[code]:Math.max(0,(r.plates[code]??0)+d)}}));

  const addRoom = () => { const r=makeRoom(rooms.length+1,devices,plateDefs); setRooms(p=>[...p,r]); setActiveId(r.id); };
  const removeRoom = id => { if(rooms.length===1)return; const rest=rooms.filter(r=>r.id!==id); setRooms(rest); if(roomId===id)setActiveId(rest[0].id); };
  const renameRoom = (id,name) => setRooms(p=>p.map(r=>r.id===id?{...r,name}:r));
  const resetRoom = () => mutRoom(r=>({...r,counts:Object.fromEntries(devices.map(d=>[d.id,0])),plates:Object.fromEntries(plateDefs.map(p=>[p.code,0]))}));

  const commitAddDev = () => {
    const name=newDevName.trim(); if(!name)return;
    const id="c_"+Date.now(); const dev={id,name,cat:newDevCat,slot:newDevSlot};
    setDevices(p=>[...p,dev]); setRooms(p=>p.map(r=>({...r,counts:{...r.counts,[id]:0}})));
    setNewDevName(""); setShowAddDev(false);
  };
  const commitAddPlate = () => {
    const {code}=parseCode(newPlateCode); if(!code||plateDefs.find(p=>p.code===code))return;
    const def={code,label:[...code].map(slotLabel).join(" / "),gang:code.length};
    setPlateDefs(p=>[...p,def]); setRooms(p=>p.map(r=>({...r,plates:{...r.plates,[code]:0}})));
    setNewPlateCode(""); setShowAddPlate(false);
  };

  const getMismatch = r => {
    const slots={S:0,D:0,B:0}, devs={S:0,D:0,B:0};
    plateDefs.forEach(p=>{const q=r.plates[p.code]??0;[...p.code].forEach(c=>{slots[c]=(slots[c]??0)+q;});});
    devices.forEach(d=>{devs[d.slot]=(devs[d.slot]??0)+(r.counts[d.id]??0);});
    return {slots,devs};
  };
  const {slots:curSlots,devs:curDevs}=getMismatch(room);
  const hasMismatch=["S","D","B"].some(k=>curSlots[k]!==curDevs[k]);
  const cats=[...new Set(devices.map(d=>d.cat))];

  const grandCounts=Object.fromEntries(devices.map(d=>[d.id,rooms.reduce((s,r)=>s+(r.counts[d.id]??0),0)]));
  const grandPlates=Object.fromEntries(plateDefs.map(p=>[p.code,rooms.reduce((s,r)=>s+(r.plates[p.code]??0),0)]));
  const grandDevTotal=Object.values(grandCounts).reduce((a,b)=>a+b,0);
  const grandSlots={S:0,D:0,B:0}, grandDevSlots={S:0,D:0,B:0};
  plateDefs.forEach(p=>{[...p.code].forEach(c=>{grandSlots[c]=(grandSlots[c]??0)+(grandPlates[p.code]??0);});});
  devices.forEach(d=>{grandDevSlots[d.slot]=(grandDevSlots[d.slot]??0)+(grandCounts[d.id]??0);});
  const roomDevTotal=r=>Object.values(r.counts).reduce((a,b)=>a+b,0);
  const roomPlateTotal=r=>Object.values(r.plates).reduce((a,b)=>a+b,0);

  return (
    <div style={sx.app}>
      <div style={sx.header}>
        <div style={sx.headerLeft}><span style={sx.bolt}>⚡</span><div><div style={sx.appTitle}>Device Counter</div><div style={sx.appSub}>Spark Doc Electric</div></div></div>
        <button style={sx.summaryToggle} onClick={()=>setView(view==="count"?"summary":"count")}>{view==="count"?"Summary":"← Count"}</button>
      </div>

      {view==="count" ? <>
        <div style={sx.roomBar}>
          <div style={sx.roomTabs}>
            {rooms.map(r=>(
              <div key={r.id} style={{...sx.roomTab,...(r.id===roomId?sx.roomTabActive:{})}} onClick={()=>setActiveId(r.id)}>
                {editName===r.id
                  ? <input autoFocus style={sx.roomInput} value={r.name} onChange={e=>renameRoom(r.id,e.target.value)} onBlur={()=>setEditName(null)} onKeyDown={e=>e.key==="Enter"&&setEditName(null)} onClick={e=>e.stopPropagation()}/>
                  : <span onDoubleClick={()=>setEditName(r.id)}>{r.name}</span>}
                {rooms.length>1&&r.id===roomId&&<span style={sx.removeRoom} onClick={e=>{e.stopPropagation();removeRoom(r.id);}}>×</span>}
              </div>
            ))}
          </div>
          <button style={sx.addRoomBtn} onClick={addRoom}>+ Room</button>
        </div>

        <div style={sx.roomMeta}>
          <div style={sx.tabSwitcher}>
            <button style={{...sx.tabBtn,...(tab==="devices"?sx.tabBtnActive:{})}} onClick={()=>setTab("devices")}>Devices</button>
            <button style={{...sx.tabBtn,...(tab==="plates"?sx.tabBtnActive:{}),position:"relative"}} onClick={()=>setTab("plates")}>
              Plates{hasMismatch&&<span style={sx.dot}/>}
            </button>
          </div>
          <button style={sx.resetBtn} onClick={resetRoom}>Reset</button>
        </div>

        {tab==="devices"&&<>
          {cats.map(cat=>(
            <div key={cat} style={sx.section}>
              <div style={sx.sectionLabel}>{cat}</div>
              {devices.filter(d=>d.cat===cat).map(d=>(
                <div key={d.id} style={sx.deviceRow}>
                  <span style={sx.deviceName}>{d.name}</span>
                  <Counter value={room.counts[d.id]??0} onInc={()=>incCount(d.id,1)} onDec={()=>incCount(d.id,-1)}/>
                </div>
              ))}
            </div>
          ))}
          <div style={sx.addRow}><button style={sx.addBtn} onClick={()=>setShowAddDev(true)}>+ Add Device Type</button></div>
        </>}

        {tab==="plates"&&<>
          <div style={sx.section}>
            <div style={sx.sectionLabel}>Cover Plates</div>
            {plateDefs.map(p=>(
              <div key={p.code} style={sx.deviceRow}>
                <div style={sx.plateInfo}><span style={sx.plateCode}>{p.code}</span><span style={sx.plateLabel}>{p.label}</span></div>
                <Counter value={room.plates[p.code]??0} onInc={()=>incPlate(p.code,1)} onDec={()=>incPlate(p.code,-1)}/>
              </div>
            ))}
          </div>
          <div style={sx.addRow}><button style={sx.addBtn} onClick={()=>setShowAddPlate(true)}>+ Add Plate Type</button></div>
          <div style={sx.section}>
            <div style={sx.sectionLabel}>Plate ↔ Device Check</div>
            {["S","D","B"].map(k=>{const dv=curDevs[k]??0,pl=curSlots[k]??0,diff=dv-pl,ok=diff===0;return(
              <div key={k} style={sx.checkRow}>
                <span style={sx.checkLabel}>{k==="S"?"Switch":k==="D"?"Duplex":"Box/Decora"}</span>
                <span style={sx.checkNums}>
                  <span style={sx.checkSub}>Dev: {dv}</span><span style={sx.checkSub}>Plt: {pl}</span>
                  <span style={{...sx.badge,background:ok?C.greenDim:C.redDim,color:ok?C.green:C.red}}>{ok?"✓":diff>0?`+${diff}`:`${diff}`}</span>
                </span>
              </div>
            );})}
          </div>
        </>}
      </> : (
        <div style={sx.summaryWrap}>
          <div style={sx.summaryHeader}>Total: {grandDevTotal} devices</div>
          {cats.map(cat=>{
            const catDevs=devices.filter(d=>d.cat===cat&&grandCounts[d.id]>0); if(!catDevs.length)return null;
            return(<div key={cat} style={sx.summarySection}>
              <div style={sx.summaryCatHdr}><span>{cat}</span><span>{catDevs.reduce((s,d)=>s+grandCounts[d.id],0)}</span></div>
              {catDevs.map(d=>(<div key={d.id} style={sx.summaryItem}><span style={sx.summaryItemName}>{d.name}</span><span style={sx.summaryItemCount}>{grandCounts[d.id]}</span></div>))}
            </div>);
          })}
          {Object.values(grandPlates).some(v=>v>0)&&(
            <div style={sx.summarySection}>
              <div style={sx.summaryCatHdr}><span>Cover Plates</span><span>{Object.values(grandPlates).reduce((a,b)=>a+b,0)}</span></div>
              {plateDefs.filter(p=>grandPlates[p.code]>0).map(p=>(<div key={p.code} style={sx.summaryItem}><span style={sx.summaryItemName}><span style={sx.plateCode}>{p.code}</span> — {p.label}</span><span style={sx.summaryItemCount}>{grandPlates[p.code]}</span></div>))}
            </div>
          )}
          <div style={sx.summarySection}>
            <div style={sx.summaryCatHdr}><span>Plate ↔ Device Check</span></div>
            {["S","D","B"].map(k=>{const dv=grandDevSlots[k]??0,pl=grandSlots[k]??0,diff=dv-pl,ok=diff===0;return(
              <div key={k} style={sx.checkRow}>
                <span style={sx.checkLabel}>{k==="S"?"Switch":k==="D"?"Duplex":"Box/Decora"}</span>
                <span style={sx.checkNums}><span style={sx.checkSub}>Dev: {dv}</span><span style={sx.checkSub}>Plt: {pl}</span><span style={{...sx.badge,background:ok?C.greenDim:C.redDim,color:ok?C.green:C.red}}>{ok?"✓":diff>0?`+${diff}`:`${diff}`}</span></span>
              </div>
            );})}
          </div>
          <div style={sx.summarySection}>
            <div style={sx.summaryCatHdr}><span>By Room</span></div>
            {rooms.map(r=>(<div key={r.id} style={sx.summaryItem}><span style={sx.summaryItemName}>{r.name}</span><span style={sx.checkNums}><span style={sx.checkSub}>{roomDevTotal(r)} dev</span><span style={sx.checkSub}>{roomPlateTotal(r)} plates</span></span></div>))}
          </div>
        </div>
      )}

      {showAddDev&&<Modal onClose={()=>setShowAddDev(false)}>
        <div style={sx.modalTitle}>Add Device Type</div>
        <div style={sx.modalLabel}>Name</div>
        <input autoFocus style={sx.modalInput} placeholder="e.g. Fan Switch" value={newDevName} onChange={e=>setNewDevName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commitAddDev()}/>
        <div style={sx.suggestWrap}>{DEVICE_SUGGESTIONS.filter(sg=>!devices.find(d=>d.name===sg)&&(!newDevName||sg.toLowerCase().includes(newDevName.toLowerCase()))).map(sg=>(<button key={sg} style={sx.chip} onClick={()=>setNewDevName(sg)}>{sg}</button>))}</div>
        <div style={sx.modalLabel}>Category</div>
        <div style={sx.chipRow}>{["Switches","Receptacles","Other"].map(c=>(<button key={c} style={{...sx.chip,...(newDevCat===c?sx.chipActive:{})}} onClick={()=>setNewDevCat(c)}>{c}</button>))}</div>
        <div style={sx.modalLabel}>Plate Slot Type</div>
        <div style={sx.chipRow}>{[["S","Switch"],["D","Duplex"],["B","Box/Decora"]].map(([k,l])=>(<button key={k} style={{...sx.chip,...(newDevSlot===k?sx.chipActive:{})}} onClick={()=>setNewDevSlot(k)}>{l}</button>))}</div>
        <button style={sx.modalConfirm} onClick={commitAddDev}>Add Device</button>
      </Modal>}

      {showAddPlate&&<Modal onClose={()=>setShowAddPlate(false)}>
        <div style={sx.modalTitle}>Add Plate Type</div>
        <div style={sx.modalLabel}>Code — S=Switch · D=Duplex · B=Box</div>
        <input autoFocus style={sx.modalInput} placeholder="e.g. SSD" value={newPlateCode} onChange={e=>setNewPlateCode(e.target.value.toUpperCase().replace(/[^SDB]/g,""))} onKeyDown={e=>e.key==="Enter"&&commitAddPlate()}/>
        {newPlateCode.length>0&&<div style={sx.platePreview}>{[...newPlateCode].map(slotLabel).join(" / ")} — {newPlateCode.length}-gang</div>}
        <div style={sx.suggestWrap}>{SLOT_SUGGESTIONS.filter(sg=>!plateDefs.find(p=>p.code===sg)&&(!newPlateCode||sg.startsWith(newPlateCode))).map(sg=>(<button key={sg} style={sx.chip} onClick={()=>setNewPlateCode(sg)}>{sg}</button>))}</div>
        <button style={sx.modalConfirm} onClick={commitAddPlate}>Add Plate</button>
      </Modal>}
    </div>
  );
}

function Counter({value,onInc,onDec}){return(<div style={sx.counterRow}><button style={sx.btn} onClick={onDec}>−</button><span style={sx.count}>{value}</span><button style={{...sx.btn,...sx.btnPlus}} onClick={onInc}>+</button></div>);}
function Modal({children,onClose}){return(<div style={sx.overlay} onClick={onClose}><div style={sx.modalBox} onClick={e=>e.stopPropagation()}><button style={sx.modalClose} onClick={onClose}>×</button>{children}</div></div>);}

const C={bg:"#0f1117",surface:"#1a1d27",surface2:"#222536",border:"#2a2d3a",yellow:"#f5c518",yellowDim:"#c9a010",text:"#e8eaf0",muted:"#7a7e94",green:"#22c55e",greenDim:"rgba(34,197,94,0.15)",red:"#ef4444",redDim:"rgba(239,68,68,0.15)"};
const sx={
  app:{background:C.bg,minHeight:"100vh",fontFamily:"'DM Mono','Courier New',monospace",color:C.text,maxWidth:480,margin:"0 auto",paddingBottom:60},
  header:{background:C.surface,borderBottom:`2px solid ${C.yellow}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10},
  headerLeft:{display:"flex",alignItems:"center",gap:10},bolt:{fontSize:28},
  appTitle:{fontSize:18,fontWeight:700,color:C.yellow,letterSpacing:1},
  appSub:{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase"},
  summaryToggle:{background:"transparent",border:`1px solid ${C.yellow}`,color:C.yellow,padding:"6px 14px",borderRadius:4,cursor:"pointer",fontSize:13,fontFamily:"inherit"},
  roomBar:{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderBottom:`1px solid ${C.border}`,overflowX:"auto"},
  roomTabs:{display:"flex",gap:6,flex:1,overflowX:"auto"},
  roomTab:{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:4,border:`1px solid ${C.border}`,cursor:"pointer",whiteSpace:"nowrap",fontSize:13,color:C.muted},
  roomTabActive:{border:`1px solid ${C.yellow}`,color:C.yellow,background:"rgba(245,197,24,0.07)"},
  roomInput:{background:"transparent",border:"none",outline:"none",color:C.yellow,fontFamily:"inherit",fontSize:13,width:80},
  removeRoom:{color:C.muted,fontSize:16,cursor:"pointer"},
  addRoomBtn:{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:12,fontFamily:"inherit",whiteSpace:"nowrap"},
  roomMeta:{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:`1px solid ${C.border}`},
  tabSwitcher:{display:"flex",flex:1},
  tabBtn:{flex:1,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"7px 0",cursor:"pointer",fontFamily:"inherit",fontSize:13},
  tabBtnActive:{background:"rgba(245,197,24,0.08)",border:`1px solid ${C.yellow}`,color:C.yellow},
  dot:{position:"absolute",top:4,right:6,width:7,height:7,borderRadius:"50%",background:C.red},
  resetBtn:{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"4px 10px",borderRadius:3,cursor:"pointer",fontSize:11,fontFamily:"inherit"},
  section:{borderBottom:`1px solid ${C.border}`,paddingBottom:4},
  sectionLabel:{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.yellow,padding:"10px 16px 4px",fontWeight:700},
  deviceRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 16px",borderTop:`1px solid ${C.border}`},
  deviceName:{fontSize:15,color:C.text,flex:1},
  plateInfo:{display:"flex",flexDirection:"column",gap:1,flex:1},
  plateCode:{fontSize:14,fontWeight:700,color:C.yellow,letterSpacing:1},
  plateLabel:{fontSize:11,color:C.muted},
  addRow:{padding:"10px 16px"},
  addBtn:{background:"transparent",border:`1px dashed ${C.yellowDim}`,color:C.yellowDim,padding:"8px 16px",borderRadius:4,cursor:"pointer",fontSize:13,fontFamily:"inherit",width:"100%"},
  counterRow:{display:"flex",alignItems:"center"},
  btn:{width:44,height:44,background:C.surface,border:`1px solid ${C.border}`,color:C.text,fontSize:22,cursor:"pointer",fontFamily:"inherit",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"},
  btnPlus:{background:"rgba(245,197,24,0.12)",border:`1px solid ${C.yellowDim}`,color:C.yellow},
  count:{width:48,textAlign:"center",fontSize:20,fontWeight:700,color:C.text,fontVariantNumeric:"tabular-nums"},
  checkRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",borderTop:`1px solid ${C.border}`},
  checkLabel:{fontSize:13,color:C.text,flex:1},
  checkNums:{display:"flex",alignItems:"center",gap:8},
  checkSub:{fontSize:12,color:C.muted},
  badge:{fontSize:12,fontWeight:700,padding:"2px 8px",borderRadius:3,minWidth:28,textAlign:"center"},
  summaryWrap:{padding:16},
  summaryHeader:{fontSize:20,fontWeight:700,color:C.yellow,marginBottom:16,borderBottom:`1px solid ${C.border}`,paddingBottom:12},
  summarySection:{marginBottom:12,background:C.surface,borderRadius:6,border:`1px solid ${C.border}`,overflow:"hidden"},
  summaryCatHdr:{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:"rgba(245,197,24,0.08)",fontSize:12,letterSpacing:1.5,textTransform:"uppercase",color:C.yellow,fontWeight:700,borderBottom:`1px solid ${C.border}`},
  summaryItem:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderBottom:`1px solid ${C.border}`,fontSize:14},
  summaryItemName:{color:C.text,flex:1},summaryItemCount:{color:C.yellow,fontWeight:700},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  modalBox:{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:"12px 12px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,position:"relative"},
  modalClose:{position:"absolute",top:12,right:16,background:"transparent",border:"none",color:C.muted,fontSize:22,cursor:"pointer",fontFamily:"inherit"},
  modalTitle:{fontSize:16,fontWeight:700,color:C.yellow,marginBottom:16},
  modalLabel:{fontSize:11,color:C.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,marginTop:14},
  modalInput:{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"10px 12px",borderRadius:4,fontFamily:"inherit",fontSize:15,boxSizing:"border-box",outline:"none"},
  platePreview:{fontSize:12,color:C.yellow,marginTop:6},
  suggestWrap:{display:"flex",flexWrap:"wrap",gap:6,marginTop:8},
  chipRow:{display:"flex",gap:8,flexWrap:"wrap"},
  chip:{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,padding:"5px 10px",borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  chipActive:{border:`1px solid ${C.yellow}`,color:C.yellow,background:"rgba(245,197,24,0.1)"},
  modalConfirm:{marginTop:20,width:"100%",background:C.yellow,border:"none",color:"#0f1117",padding:12,borderRadius:6,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"inherit"},
};
