import { useState } from "react";

// Arthur Base16: base00:#1a1a1a base01:#242424 base02:#3d3d3d base03:#525252
// base04:#6f6f6f base05:#b5b5b5 base06:#d9d9d9 base07:#f5f5f5
// base08:#b55c57(red) base09:#d5974c(orange) base0A:#d5b251(yellow)
// base0B:#8faf54(green) base0C:#6bacb5(cyan) base0D:#6b8faf(blue)
// base0E:#9b7faf(purple) base0F:#7f5f3f(brown)

const TOUR_DAYS = [
  { id:3, name:"Production Rehearsal", date:"2026-04-09", type:"Rehearsal", city:"Adelaide", venue:"UniBar / Cloisters — Adelaide University", loadin:"TBC", soundcheck:null, doors:null, settime:null, curfew:null, status:"Advancing", notes:"Line-check Thu night if possible, leave rig set, full soundcheck + run-through Fri before show. AC available from 9pm. Miles arrives 9:10pm, Jeff 8:30pm.", supports:null },
  { id:4, name:"Gather Sounds — Album Launch", date:"2026-04-10", type:"Festival", city:"Adelaide", venue:"UniBar / Cloisters — Adelaide University", loadin:"TBC", soundcheck:"TBC", doors:"TBC", settime:null, curfew:"TBC", status:"Advancing", notes:"Bad Dreems headlining. Set time and production window TBC — chase Gareth Lewis.", supports:"West Thebarton, The Empty Threats, Jon Ann" },
  { id:5, name:"Gather Sounds — Festival Day", date:"2026-04-11", type:"Festival", city:"Adelaide", venue:"UniBar / Cloisters — Adelaide University", loadin:"TBC", soundcheck:"TBC", doors:"2:00pm", settime:null, curfew:"Midnight", status:"Advancing", notes:"Cloisters + UniBar. GA Entertainment running all festival production. Bad Dreems slot TBC.", supports:null },
  { id:6, name:"Thornbury Theatre", date:"2026-04-18", type:"Show", city:"Melbourne", venue:"Thornbury Theatre", loadin:"12:00pm", soundcheck:"4:00pm", doors:"7:00pm", settime:null, curfew:"1:00am", status:"Advancing", notes:"Venue hire $6.60/payer. Lighting pkg $195. FOH + LX $55/hr/tech. Security 50/50. OneMusic 1.65%. Hospitality up to $200.", supports:"The Pretty Littles, Don't Thank Me Spank Me, Caitlin Harnett & The Pony Boys" },
  { id:7, name:"Marrickville Bowling Club — Night 1", date:"2026-04-30", type:"Show", city:"Sydney", venue:"Marrickville Bowling Club", loadin:"9:00am", soundcheck:"Performer's discretion", doors:"7:30pm", settime:null, curfew:"11:30pm", status:"Advancing", notes:"Sound curfew 6:30–7:30pm. Door staff: performer provides and pays own — not yet sourced", supports:"The Pretty Littles, Don't Thank Me Spank Me, Caitlin Harnett & The Pony Boys" },
  { id:8, name:"Marrickville Bowling Club — Night 2", date:"2026-05-01", type:"Show", city:"Sydney", venue:"Marrickville Bowling Club", loadin:"9:00am", soundcheck:"Performer's discretion", doors:"7:30pm", settime:null, curfew:"11:30pm", status:"Advancing", notes:"SOLD OUT. Sound curfew 6:30–7:30pm. Door staff: performer provides and pays own.", supports:"The Pretty Littles, Don't Thank Me Spank Me, Caitlin Harnett & The Pony Boys" },
  { id:9, name:"The Brightside (Outdoors)", date:"2026-05-02", type:"Show", city:"Brisbane", venue:"The Brightside (Outdoors)", loadin:"3:00pm", soundcheck:"4:00pm–6:30pm", doors:"7:00pm", settime:null, curfew:"Midnight", status:"Advancing", notes:"No split system — Jeff at FOH for monitors. LX: decision needed (venue $440 inc GST or own). Outdoor — weather contingency TBC.", supports:"The Pretty Littles, Don't Thank Me Spank Me, Caitlin Harnett & The Pony Boys" },
];

const PEOPLE = [
  { id:3, name:"Alex Cameron", initials:"AC", role:"Guitar / Band Mgmt", type:"Band", base:"Adelaide", phone:"", email:"mgmt@baddreems.com" },
  { id:4, name:"Ben Marwe", initials:"BM", role:"Vocals", type:"Band", base:"Adelaide", phone:"+61 422 520 845", email:"mgmt@baddreems.com" },
  { id:5, name:"Miles Wilson", initials:"MW", role:"Drums", type:"Band", base:"Melbourne", phone:"", email:"" },
  { id:6, name:"Deon Slaviero", initials:"DS", role:"Bass", type:"Band", base:"Melbourne", phone:"+61 475 554 086", email:"" },
  { id:7, name:"Mathias Dowle", initials:"MD", role:"Guitar / SPD / Synth", type:"Band", base:"Melbourne", phone:"+61 404 494 609", email:"" },
  { id:8, name:"Jeff Hahn", initials:"JH", role:"Sound Engineer", type:"Crew", base:"Brisbane", phone:"", email:"jeffthesoundguy@gmail.com" },
  { id:9, name:"Alex Beck", initials:"AB", role:"Tour Manager", type:"Crew", base:"Melbourne", phone:"0437 484 888", email:"alex@goldenpointaudio.com" },
];

const TRAVEL = [
  { id:3, date:"2026-04-03", from:"Melbourne", to:"Adelaide", mode:"Drive", flightNo:null, dep:null, arr:null, ref:null, status:"Booked", passengers:["Miles Wilson"] },
  { id:4, date:"2026-04-03", from:"Melbourne", to:"Adelaide", mode:"Drive", flightNo:null, dep:null, arr:null, ref:null, status:"Booked", passengers:["Deon Slaviero"] },
  { id:5, date:null, from:"Adelaide", to:"Melbourne", mode:"Drive", flightNo:null, dep:null, arr:null, ref:null, status:"TBC", passengers:["Miles Wilson"] },
  { id:6, date:null, from:"Adelaide", to:"Melbourne", mode:"Drive", flightNo:null, dep:null, arr:null, ref:null, status:"TBC", passengers:["Deon Slaviero"] },
  { id:7, date:"2026-04-09", from:"Melbourne", to:"Adelaide", mode:"Fly", flightNo:"VA 247", dep:"8:15pm", arr:"9:10pm", ref:null, status:"Booked", passengers:["Miles Wilson"] },
  { id:8, date:"2026-04-12", from:"Adelaide", to:"Melbourne", mode:"Fly", flightNo:"VA 222", dep:"1:45pm", arr:"3:35pm", ref:null, status:"Booked", passengers:["Miles Wilson"] },
  { id:9, date:"2026-04-09", from:"Brisbane", to:"Adelaide", mode:"Fly", flightNo:"VA 1402", dep:"6:05pm", arr:"8:30pm", ref:"QVIQAB", status:"Booked", passengers:["Jeff Hahn"] },
  { id:10, date:"2026-04-12", from:"Adelaide", to:"Brisbane", mode:"Fly", flightNo:"VA 1393", dep:"11:50am", arr:"2:45pm", ref:"QVIQAB", status:"Booked", passengers:["Jeff Hahn"] },
];

const TASKS = [
  { id:3,  task:"Book Deon's Adelaide flight",                   dayId:3,    category:"Travel",        status:"Not started", notes:"Not booked — Ben's info was wrong." },
  { id:4,  task:"Book Mathias's Adelaide flight",                dayId:3,    category:"Travel",        status:"Not started", notes:null },
  { id:5,  task:"Book Alex Beck's Adelaide flight",              dayId:3,    category:"Travel",        status:"Not started", notes:null },
  { id:6,  task:"Book Marrickville flights — all",               dayId:7,    category:"Travel",        status:"Not started", notes:"Everyone needs flights." },
  { id:7,  task:"Book Brisbane flights — all",                   dayId:9,    category:"Travel",        status:"Not started", notes:"Except Jeff — confirm his own arrangements first." },
  { id:8,  task:"Confirm Miles + Deon Easter driving dates",     dayId:3,    category:"Travel",        status:"Not started", notes:"Exact dates TBC." },
  { id:9,  task:"Confirm Jeff's Brisbane arrangements",          dayId:9,    category:"Travel",        status:"Not started", notes:"Home city — likely own arrangements." },
  { id:10, task:"Book van — Adelaide + Melbourne/Sydney",        dayId:3,    category:"Travel",        status:"Not started", notes:"Ben: There'll be kit. Get a van." },
  { id:11, task:"Book Melbourne accommodation",                  dayId:6,    category:"Accommodation", status:"Not started", notes:null },
  { id:12, task:"Book Sydney accommodation",                     dayId:7,    category:"Accommodation", status:"Not started", notes:null },
  { id:13, task:"Book Brisbane accommodation",                   dayId:9,    category:"Accommodation", status:"Not started", notes:null },
  { id:14, task:"Confirm Thursday rehearsal plan with Jeff+Gus", dayId:3,    category:"Production",    status:"Not started", notes:"Live option from 8pm — decision needed now." },
  { id:15, task:"Chase Gareth — set times Fri + Sat",            dayId:4,    category:"Advancing",     status:"Not started", notes:"Blocks all production planning." },
  { id:16, task:"Chase Gareth — Friday production window",       dayId:4,    category:"Advancing",     status:"Not started", notes:null },
  { id:17, task:"Chase Gareth — PA audio list with make/model",  dayId:4,    category:"Advancing",     status:"Not started", notes:"Jeff specifically requested this." },
  { id:18, task:"Confirm touring support lineup with AC/Select", dayId:6,    category:"Advancing",     status:"Not started", notes:"Press release vs transcript discrepancy — confirm before advancing." },
  { id:19, task:"Decide LX for Brightside",                      dayId:9,    category:"Production",    status:"Not started", notes:"Venue supplies for $440 inc GST or source own." },
  { id:20, task:"Get Jeff's console quotes",                     dayId:3,    category:"Tech",          status:"Not started", notes:"Melbourne contacts, possibly Travis Chzn." },
  { id:21, task:"Assess Soundcraft UI rig as backup",            dayId:3,    category:"Tech",          status:"Not started", notes:"AC bringing rig to Melbourne — Alex Beck to check functionality." },
  { id:22, task:"Purchase generic earpieces for Ben + Miles",    dayId:3,    category:"Tech",          status:"Not started", notes:"535s or similar. Packs + transmitters already in UI rig box." },
  { id:23, task:"Source door staff — Marrickville Night 1",      dayId:7,    category:"Admin",         status:"Not started", notes:"Performer's responsibility." },
  { id:24, task:"Source door staff — Marrickville Night 2",      dayId:8,    category:"Admin",         status:"Not started", notes:"Performer's responsibility." },
  { id:25, task:"Source merch seller — all headline shows",      dayId:6,    category:"Admin",         status:"Not started", notes:"All four headline shows require performer's own seller." },
  { id:26, task:"Ask AC to fix Google Sheet permissions",        dayId:null, category:"Admin",         status:"Not started", notes:"Currently view only — needs edit access." },
  { id:27, task:"Ask AC to send Jeff tech meeting recording",    dayId:null, category:"Tech",          status:"Not started", notes:"Drop in Cowork folder for transcription into Tech Specs." },
  { id:28, task:"Send availability form link to group chat",     dayId:null, category:"Admin",         status:"Not started", notes:"Replaces broken Dropbox spreadsheet." },
  { id:29, task:"Send observer portal link to Alex + Ben",       dayId:null, category:"Admin",         status:"Not started", notes:"Flagged to Ben 6 Mar — confirm sent." },
];

const CITY_COLOR = {
  Adelaide:  { bg:"#2a1f14", accent:"#d5974c", text:"#d5b251", badge:"#4a3520" },
  Melbourne: { bg:"#1a2030", accent:"#6b8faf", text:"#8aafc9", badge:"#2a3545" },
  Sydney:    { bg:"#221a2a", accent:"#9b7faf", text:"#b09fca", badge:"#3a2a45" },
  Brisbane:  { bg:"#1a2a1a", accent:"#8faf54", text:"#aacf74", badge:"#2a3f1a" },
};

const TYPE_BADGE = {
  Show:      { bg:"#2a3545", color:"#8aafc9" },
  Festival:  { bg:"#332545", color:"#b09fca" },
  Rehearsal: { bg:"#243520", color:"#aacf74" },
};

const CAT_COLOR = {
  Travel:        "#6b8faf",
  Accommodation: "#9b7faf",
  Advancing:     "#d5974c",
  Production:    "#b55c57",
  Tech:          "#8faf54",
  Admin:         "#6f6f6f",
  Band:          "#6bacb5",
};

function formatDate(iso) {
  if (!iso) return "TBC";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-AU", { weekday:"short", day:"numeric", month:"short" });
}

function daysUntil(iso) {
  if (!iso) return null;
  const now = new Date("2026-03-11");
  return Math.round((new Date(iso + "T00:00:00") - now) / 86400000);
}

function CityDot({ city, size=8 }) {
  const c = CITY_COLOR[city] || { accent:"#525252" };
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:c.accent, flexShrink:0 }} />;
}

function Badge({ text, bg, color }) {
  return <span style={{ background:bg, color, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"2px 7px", borderRadius:3 }}>{text}</span>;
}

function TabButton({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 18px", fontSize:13, fontWeight:active?700:400, color:active?"#d9d9d9":"#525252", borderBottom:active?"2px solid #d5974c":"2px solid transparent", letterSpacing:"0.04em", textTransform:"uppercase", transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
      {label}
      {count != null && <span style={{ background:active?"#d5974c":"#3d3d3d", color:active?"#1a1a1a":"#6f6f6f", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 6px" }}>{count}</span>}
    </button>
  );
}

function TourDaysTab() {
  const [selected, setSelected] = useState(null);
  const day = selected ? TOUR_DAYS.find(d => d.id === selected) : null;
  const cityC = day ? (CITY_COLOR[day.city] || CITY_COLOR.Adelaide) : null;
  const dayTasks = selected ? TASKS.filter(t => t.dayId === selected) : [];
  const dayTravel = selected ? TRAVEL.filter(t => { const d = TOUR_DAYS.find(x => x.id === selected); return d && t.date === d.date; }) : [];

  return (
    <div style={{ display:"flex", minHeight:520 }}>
      <div style={{ width:300, flexShrink:0, borderRight:"1px solid #242424", overflowY:"auto" }}>
        {TOUR_DAYS.map(d => {
          const c = CITY_COLOR[d.city] || CITY_COLOR.Adelaide;
          const du = daysUntil(d.date);
          const sel = selected === d.id;
          return (
            <div key={d.id} onClick={() => setSelected(sel ? null : d.id)} style={{ padding:"14px 16px", cursor:"pointer", borderBottom:"1px solid #1f1f1f", background:sel?c.bg:"transparent", borderLeft:sel?`3px solid ${c.accent}`:"3px solid transparent", transition:"all 0.15s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#d9d9d9", lineHeight:1.3, flex:1 }}>{d.name}</div>
                {du != null && <span style={{ fontSize:11, color:"#525252", flexShrink:0 }}>{du > 0 ? `${du}d` : du === 0 ? "today" : "past"}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                <CityDot city={d.city} />
                <span style={{ fontSize:11, color:"#525252" }}>{formatDate(d.date)}</span>
                <span style={{ fontSize:11, color:"#3d3d3d" }}>·</span>
                <span style={{ fontSize:11, color:c.text }}>{d.city}</span>
              </div>
              <div style={{ marginTop:5 }}><Badge text={d.type} {...(TYPE_BADGE[d.type] || { bg:"#2a2a2a", color:"#6f6f6f" })} /></div>
            </div>
          );
        })}
      </div>

      <div style={{ flex:1, padding:28, overflowY:"auto" }}>
        {!day ? <div style={{ color:"#525252", fontSize:14, paddingTop:20 }}>Select a day to see details.</div> : (
          <div>
            <div style={{ background:cityC.bg, border:`1px solid ${cityC.badge}`, borderRadius:8, padding:"18px 22px", marginBottom:22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <CityDot city={day.city} size={10} />
                <span style={{ fontSize:11, color:cityC.text, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>{day.city}</span>
                <Badge text={day.type} {...(TYPE_BADGE[day.type] || { bg:"#2a2a2a", color:"#6f6f6f" })} />
                <Badge text={day.status} bg="#242424" color="#6f6f6f" />
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:"#f5f5f5", marginBottom:4 }}>{day.name}</div>
              <div style={{ fontSize:13, color:"#6f6f6f" }}>{formatDate(day.date)} · {day.venue}</div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginBottom:22 }}>
              {[["Load-in", day.loadin], ["Soundcheck", day.soundcheck], ["Doors", day.doors], ["Curfew", day.curfew]].map(([label, val]) => (
                <div key={label} style={{ background:"#242424", borderRadius:6, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:val?"#d9d9d9":"#3d3d3d" }}>{val || "TBC"}</div>
                </div>
              ))}
            </div>

            {day.notes && <div style={{ background:"#242424", borderRadius:6, padding:"12px 14px", marginBottom:22, fontSize:13, color:"#6f6f6f", lineHeight:1.6 }}>{day.notes}</div>}

            {day.supports && <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Support Acts</div>
              <div style={{ fontSize:13, color:"#b5b5b5" }}>{day.supports}</div>
            </div>}

            {dayTasks.length > 0 && <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Tasks ({dayTasks.length})</div>
              {dayTasks.map(t => (
                <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px", borderBottom:"1px solid #242424" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", marginTop:5, flexShrink:0, background:CAT_COLOR[t.category]||"#525252" }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#d9d9d9" }}>{t.task}</div>
                    {t.notes && <div style={{ fontSize:11, color:"#525252", marginTop:2 }}>{t.notes}</div>}
                  </div>
                  <span style={{ fontSize:10, padding:"2px 6px", borderRadius:3, background:t.status==="Done"?"#243520":"#2a2520", color:t.status==="Done"?"#aacf74":"#6f6f6f" }}>{t.status}</span>
                </div>
              ))}
            </div>}

            {dayTravel.length > 0 && <div>
              <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Travel ({dayTravel.length})</div>
              {dayTravel.map(t => (
                <div key={t.id} style={{ background:"#242424", borderRadius:6, padding:"10px 12px", marginBottom:8, display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:"#d9d9d9", fontWeight:600 }}>{t.passengers.join(", ")}</div>
                    <div style={{ fontSize:12, color:"#525252", marginTop:2 }}>{t.from} to {t.to}{t.dep ? ` · ${t.dep}` : ""}{t.arr ? ` to ${t.arr}` : ""}</div>
                  </div>
                  {t.flightNo && <span style={{ fontFamily:"monospace", fontSize:12, color:"#6b8faf" }}>{t.flightNo}</span>}
                  {t.ref && <span style={{ fontFamily:"monospace", fontSize:12, color:"#d5974c" }}>{t.ref}</span>}
                </div>
              ))}
            </div>}
          </div>
        )}
      </div>
    </div>
  );
}

function TasksTab() {
  const [cat, setCat] = useState("All");
  const cats = ["All", ...Object.keys(CAT_COLOR)];
  const filtered = cat === "All" ? TASKS : TASKS.filter(t => t.category === cat);
  const open = filtered.filter(t => t.status !== "Done");
  const done = filtered.filter(t => t.status === "Done");
  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, letterSpacing:"0.04em", background:cat===c?(CAT_COLOR[c]||"#d5974c"):"#2a2a2a", color:cat===c?"#1a1a1a":"#6f6f6f", transition:"all 0.15s" }}>{c}</button>
        ))}
      </div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Open — {open.length}</div>
        {open.map(t => {
          const day = t.dayId ? TOUR_DAYS.find(d => d.id === t.dayId) : null;
          const c = day ? (CITY_COLOR[day.city] || CITY_COLOR.Adelaide) : null;
          return (
            <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 12px", background:"#242424", borderRadius:6, marginBottom:6, borderLeft:`3px solid ${CAT_COLOR[t.category]||"#525252"}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#d9d9d9", fontWeight:500 }}>{t.task}</div>
                {t.notes && <div style={{ fontSize:11, color:"#525252", marginTop:3 }}>{t.notes}</div>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                {day && <span style={{ fontSize:11, color:c.text, display:"flex", alignItems:"center", gap:4 }}><CityDot city={day.city} size={6} />{day.city}</span>}
                <Badge text={t.category} bg={CAT_COLOR[t.category]+"33"} color={CAT_COLOR[t.category]||"#6f6f6f"} />
              </div>
            </div>
          );
        })}
      </div>
      {done.length > 0 && <div>
        <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Done — {done.length}</div>
        {done.map(t => (
          <div key={t.id} style={{ display:"flex", gap:12, padding:"8px 12px", background:"#1f1f1f", borderRadius:6, marginBottom:4, opacity:0.6 }}>
            <span style={{ fontSize:13, color:"#8faf54" }}>✓</span>
            <div style={{ fontSize:12, color:"#525252" }}>{t.task}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

function PeopleTab() {
  const band = PEOPLE.filter(p => p.type === "Band");
  const crew = PEOPLE.filter(p => p.type === "Crew");
  const PersonCard = ({ p }) => {
    const c = CITY_COLOR[p.base] || CITY_COLOR.Adelaide;
    return (
      <div style={{ background:"#242424", borderRadius:8, padding:"14px 16px", borderTop:`2px solid ${c.accent}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:c.bg, border:`2px solid ${c.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:c.text, flexShrink:0 }}>{p.initials}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#d9d9d9" }}>{p.name}</div>
            <div style={{ fontSize:11, color:"#525252" }}>{p.role}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
          <CityDot city={p.base} size={7} />
          <span style={{ fontSize:12, color:c.text }}>{p.base}</span>
        </div>
        {p.phone && <div style={{ fontSize:11, color:"#525252", marginBottom:2 }}>{p.phone}</div>}
        {p.email && <div style={{ fontSize:11, color:"#525252" }}>{p.email}</div>}
      </div>
    );
  };
  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Band</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12, marginBottom:28 }}>
        {band.map(p => <PersonCard key={p.id} p={p} />)}
      </div>
      <div style={{ fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Crew</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
        {crew.map(p => <PersonCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function TravelTab() {
  const booked = TRAVEL.filter(t => t.ref || t.status === "Booked");
  const pending = TRAVEL.filter(t => !t.ref && t.status !== "Booked");
  const LegCard = ({ t }) => {
    const fromCity = Object.keys(CITY_COLOR).find(c => t.from.includes(c));
    const toCity = Object.keys(CITY_COLOR).find(c => t.to.includes(c));
    const fromC = CITY_COLOR[fromCity] || { text:"#6f6f6f" };
    const toC = CITY_COLOR[toCity] || { text:"#6f6f6f" };
    return (
      <div style={{ background:"#242424", borderRadius:8, padding:"12px 16px", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"#d9d9d9" }}>{t.passengers.join(", ")}</span>
          {t.flightNo && <span style={{ fontFamily:"monospace", fontSize:12, color:"#6b8faf", marginLeft:"auto" }}>{t.flightNo}</span>}
          {t.ref && <span style={{ fontFamily:"monospace", fontSize:11, color:"#d5974c" }}>{t.ref}</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}><CityDot city={fromCity} size={7} /><span style={{ fontSize:12, color:fromC.text }}>{t.from}</span></div>
          <span style={{ color:"#3d3d3d" }}>to</span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}><CityDot city={toCity} size={7} /><span style={{ fontSize:12, color:toC.text }}>{t.to}</span></div>
          {(t.dep||t.arr) && <span style={{ fontSize:11, color:"#525252", marginLeft:"auto" }}>{t.dep}{t.arr?` to ${t.arr}`:""}</span>}
        </div>
        {t.date && <div style={{ fontSize:11, color:"#525252", marginTop:5 }}>{formatDate(t.date)}</div>}
      </div>
    );
  };
  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
        <div>
          <div style={{ fontSize:11, color:"#8faf54", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#8faf54", display:"inline-block" }} />Booked — {booked.length}
          </div>
          {booked.map(t => <LegCard key={t.id} t={t} />)}
        </div>
        <div>
          <div style={{ fontSize:11, color:"#d5974c", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#d5974c", display:"inline-block" }} />Pending — {pending.length}
          </div>
          {pending.map(t => <LegCard key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

function StatsStrip() {
  const openTasks = TASKS.filter(t => t.status !== "Done").length;
  const bookedLegs = TRAVEL.filter(t => t.ref || t.status === "Booked").length;
  const pendingLegs = TRAVEL.filter(t => !t.ref && t.status !== "Booked").length;
  const nextDay = TOUR_DAYS.find(d => daysUntil(d.date) >= 0);
  const daysToShow = nextDay ? daysUntil(nextDay.date) : null;
  return (
    <div style={{ display:"flex", background:"#141414", borderBottom:"1px solid #242424" }}>
      {[
        { label:"Days to show",   value: daysToShow != null ? `${daysToShow}d` : "—", color:"#d5974c" },
        { label:"Open tasks",     value: openTasks,   color: openTasks > 10 ? "#b55c57" : "#d5b251" },
        { label:"Travel booked",  value: bookedLegs,  color:"#8faf54" },
        { label:"Travel pending", value: pendingLegs, color: pendingLegs > 3 ? "#b55c57" : "#6f6f6f" },
        { label:"Shows",          value: TOUR_DAYS.filter(d => d.type==="Show"||d.type==="Festival").length, color:"#6b8faf" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ flex:1, padding:"12px 16px", textAlign:"center", borderRight:"1px solid #242424" }}>
          <div style={{ fontSize:22, fontWeight:800, color, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:10, color:"#3d3d3d", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

const TABS = ["Tour Days", "Tasks", "People", "Travel"];

export default function App() {
  const [tab, setTab] = useState("Tour Days");
  const openTasks = TASKS.filter(t => t.status !== "Done").length;
  const pendingLegs = TRAVEL.filter(t => !t.ref && t.status !== "Booked").length;
  const tabCounts = { "Tour Days": TOUR_DAYS.length, Tasks: openTasks, People: PEOPLE.length, Travel: pendingLegs };
  return (
    <div style={{ minHeight:"100vh", background:"#1a1a1a", color:"#b5b5b5", fontFamily:"'Inter', system-ui, sans-serif", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"#141414", borderBottom:"1px solid #242424", padding:"16px 24px", display:"flex", alignItems:"baseline", gap:16 }}>
        <span style={{ fontFamily:"'DM Serif Display', Georgia, serif", fontSize:22, color:"#f5f5f5", letterSpacing:"-0.02em" }}>Bad Dreems</span>
        <span style={{ fontSize:13, color:"#3d3d3d", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600 }}>ADVANCING PORTAL</span>
        <span style={{ marginLeft:"auto", fontSize:11, color:"#2a2a2a" }}>Ultra Dundee · Apr–May 2026</span>
      </div>
      <StatsStrip />
      <div style={{ display:"flex", background:"#141414", borderBottom:"1px solid #242424", paddingLeft:8 }}>
        {TABS.map(t => <TabButton key={t} label={t} active={tab===t} onClick={() => setTab(t)} count={tabCounts[t]} />)}
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {tab === "Tour Days" && <TourDaysTab />}
        {tab === "Tasks"    && <TasksTab />}
        {tab === "People"   && <PeopleTab />}
        {tab === "Travel"   && <TravelTab />}
      </div>
    </div>
  );
}
