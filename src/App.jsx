import { useState, useEffect } from "react";

// ─── ARTHUR BASE16 ──────────────────────────────────────────────────────────
const A = {
  bg:      "#1a1a1a",
  bg1:     "#282828",
  bg2:     "#3d3d3d",
  comment: "#505050",
  fg3:     "#b4b4b4",
  fg:      "#d0d0d0",
  fg1:     "#e8e8e8",
  fg2:     "#f8f8f8",
  red:     "#dd6868",
  orange:  "#dd9968",
  yellow:  "#ddcc68",
  green:   "#89b171",
  cyan:    "#89b4b4",
  blue:    "#7199dd",
  magenta: "#9971dd",
  brown:   "#ab6868",
};

// ─── BASEROW ─────────────────────────────────────────────────────────────────
const TOKEN = "CXw5eZ9NeLncSGdHZAyMxNmCZrZ5g3OH";
const BASE  = "https://api.baserow.io/api/database/rows/table";

async function fetchAll(tableId) {
  let results = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${BASE}/${tableId}/?user_field_names=true&size=100&page=${page}`,
      { headers: { Authorization: `Token ${TOKEN}` } }
    );
    const data = await res.json();
    results = results.concat(data.results);
    if (!data.next) break;
    page++;
  }
  return results;
}

// ─── FIELD MAPPERS ───────────────────────────────────────────────────────────

function mapTourDay(r) {
  return {
    id:        r.id,
    name:      r["Name"],
    date:      r["Date"],
    type:      r["Type"]?.value || "",
    city:      r["City"],
    venue:     r["Venue"]?.[0]?.value || "",
    loadin:    r["Load-in"],
    soundcheck:r["Soundcheck"],
    doors:     r["Doors"],
    settime:   r["Set time"],
    curfew:    r["Curfew"],
    status:    r["Status"]?.value || "",
    notes:     r["Notes"],
    supports:  r["Support acts"],
    taskIds:   (r["Tasks"] || []).map(t => t.id),
    travelIds: (r["Travel"] || []).map(t => t.id),
  };
}

function mapPerson(r) {
  return {
    id:       r.id,
    name:     r["Name"],
    initials: r["Initials"],
    role:     r["Role"],
    type:     r["Type"]?.value || "",
    base:     r["Base city"],
    phone:    r["Phone"],
    email:    r["Email"],
  };
}

function mapTravel(r) {
  return {
    id:         r.id,
    leg:        r["Leg"],
    date:       r["Date"],
    from:       r["From"],
    to:         r["To"],
    mode:       r["Mode"]?.value || "",
    flightNo:   r["Flight number"],
    dep:        r["Departure time"],
    arr:        r["Arrival time"],
    ref:        r["Booking reference"],
    status:     r["Status"]?.value || "",
    passengers: (r["Passengers"] || []).map(p => p.value),
    dayIds:     (r["Linked day"] || []).map(d => d.id),
  };
}

function mapTask(r) {
  return {
    id:       r.id,
    task:     r["Task"],
    dayId:    r["Linked day"]?.[0]?.id || null,
    category: r["Category"]?.value || "",
    status:   r["Status"]?.value || "Not started",
    notes:    r["Notes"],
  };
}

// ─── CITY / TYPE STYLES ──────────────────────────────────────────────────────
const CITY = {
  Adelaide:  { dot: A.yellow,  text: A.yellow,  bg: "#222219", border: "#383820" },
  Melbourne: { dot: A.blue,    text: A.blue,    bg: "#191d28", border: "#252d40" },
  Sydney:    { dot: A.magenta, text: A.magenta, bg: "#211928", border: "#342040" },
  Brisbane:  { dot: A.green,   text: A.green,   bg: "#192219", border: "#253525" },
};

const TYPE_STYLE = {
  Show:      { bg: "#1d2438", color: A.blue },
  Festival:  { bg: "#271e38", color: A.magenta },
  Rehearsal: { bg: "#1e2a1a", color: A.green },
};

const CAT_COLOR = {
  Travel:        A.blue,
  Accommodation: A.magenta,
  Advancing:     A.yellow,
  Production:    A.orange,
  Tech:          A.green,
  Admin:         A.fg3,
};

// ─── UTILS ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "TBC";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { weekday:"short", day:"numeric", month:"short" });
}
function daysUntil(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso + "T00:00:00") - new Date("2026-03-11")) / 86400000);
}

// ─── PRIMITIVES ─────────────────────────────────────────────────────────────
function Dot({ city, size=8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:(CITY[city]||{dot:A.fg3}).dot, flexShrink:0 }} />;
}
function Pill({ text, bg, color }) {
  return <span style={{ background:bg, color, fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", padding:"2px 7px", borderRadius:3 }}>{text}</span>;
}
function TabBtn({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      background:"none", border:"none", cursor:"pointer", padding:"10px 18px",
      fontSize:11, fontWeight:active?700:400, color:active?A.fg1:A.comment,
      borderBottom:active?`2px solid ${A.yellow}`:"2px solid transparent",
      letterSpacing:"0.08em", textTransform:"uppercase", transition:"color 0.12s",
      display:"flex", alignItems:"center", gap:6,
    }}>
      {label}
      {count != null && (
        <span style={{ background:active?A.yellow:A.bg2, color:active?A.bg:A.fg3, borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 6px" }}>{count}</span>
      )}
    </button>
  );
}

// ─── TOUR DAYS ───────────────────────────────────────────────────────────────
function TourDaysTab({ tourDays, tasks, travel }) {
  const [sel, setSel] = useState(null);
  const day = sel ? tourDays.find(d => d.id === sel) : null;
  const cc = day ? (CITY[day.city] || CITY.Adelaide) : null;
  const dayTasks  = day ? tasks.filter(t => day.taskIds.includes(t.id)) : [];
  const dayTravel = day ? travel.filter(t => t.dayIds.includes(day.id)) : [];

  return (
    <div style={{ display:"flex", minHeight:520 }}>
      <div style={{ width:290, flexShrink:0, borderRight:`1px solid ${A.bg2}`, overflowY:"auto" }}>
        {tourDays.map(d => {
          const c = CITY[d.city] || CITY.Adelaide;
          const du = daysUntil(d.date);
          const active = sel === d.id;
          return (
            <div key={d.id} onClick={() => setSel(active ? null : d.id)} style={{
              padding:"12px 15px", cursor:"pointer", borderBottom:`1px solid ${A.bg1}`,
              background:active?c.bg:"transparent",
              borderLeft:`3px solid ${active?c.dot:"transparent"}`,
              transition:"background 0.1s",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                <div style={{ fontSize:13, fontWeight:600, color:active?A.fg1:A.fg, lineHeight:1.3, flex:1 }}>{d.name}</div>
                {du != null && <span style={{ fontSize:11, color:A.comment, flexShrink:0, fontVariantNumeric:"tabular-nums" }}>{du>0?`${du}d`:du===0?"today":"past"}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                <Dot city={d.city} size={7} />
                <span style={{ fontSize:11, color:A.comment }}>{formatDate(d.date)}</span>
                <span style={{ color:A.bg2 }}>·</span>
                <span style={{ fontSize:11, color:c.text }}>{d.city}</span>
              </div>
              <div style={{ marginTop:5 }}>
                <Pill text={d.type} {...(TYPE_STYLE[d.type]||{bg:A.bg2,color:A.fg3})} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex:1, padding:26, overflowY:"auto" }}>
        {!day ? (
          <div style={{ color:A.comment, fontSize:13, paddingTop:20 }}>Select a day.</div>
        ) : (
          <>
            <div style={{ background:cc.bg, border:`1px solid ${cc.border}`, borderRadius:6, padding:"15px 18px", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                <Dot city={day.city} size={9} />
                <span style={{ fontSize:11, color:cc.text, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>{day.city}</span>
                <Pill text={day.type} {...(TYPE_STYLE[day.type]||{bg:A.bg2,color:A.fg3})} />
                <Pill text={day.status} bg={A.bg2} color={A.fg3} />
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:A.fg2, marginBottom:3 }}>{day.name}</div>
              <div style={{ fontSize:12, color:A.fg3 }}>{formatDate(day.date)} · {day.venue}</div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7, marginBottom:18 }}>
              {[["Load-in",day.loadin],["Soundcheck",day.soundcheck],["Doors",day.doors],["Curfew",day.curfew]].map(([lbl,val]) => (
                <div key={lbl} style={{ background:A.bg1, borderRadius:5, padding:"9px 11px" }}>
                  <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{lbl}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:val?A.fg1:A.bg2 }}>{val||"TBC"}</div>
                </div>
              ))}
            </div>

            {day.notes && <div style={{ background:A.bg1, borderRadius:5, padding:"11px 14px", marginBottom:18, fontSize:13, color:A.fg3, lineHeight:1.65 }}>{day.notes}</div>}

            {day.supports && (
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Support Acts</div>
                <div style={{ fontSize:13, color:A.fg }}>{day.supports}</div>
              </div>
            )}

            {dayTasks.length > 0 && (
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:9 }}>Tasks ({dayTasks.length})</div>
                {dayTasks.map(t => (
                  <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:`1px solid ${A.bg1}` }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", marginTop:5, flexShrink:0, background:CAT_COLOR[t.category]||A.fg3 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:A.fg }}>{t.task}</div>
                      {t.notes && <div style={{ fontSize:11, color:A.comment, marginTop:2 }}>{t.notes}</div>}
                    </div>
                    <span style={{ fontSize:10, padding:"2px 6px", borderRadius:3, background:t.status==="Done"?"#1e2b1a":A.bg1, color:t.status==="Done"?A.green:A.fg3 }}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}

            {dayTravel.length > 0 && (
              <div>
                <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:9 }}>Travel ({dayTravel.length})</div>
                {dayTravel.map(t => (
                  <div key={t.id} style={{ background:A.bg1, borderRadius:5, padding:"10px 12px", marginBottom:7, display:"flex", gap:12, alignItems:"center" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:A.fg1, fontWeight:600 }}>{t.passengers.join(", ")}</div>
                      <div style={{ fontSize:12, color:A.fg3, marginTop:2 }}>{t.from} → {t.to}{t.dep?` · ${t.dep}`:""}{t.arr?` → ${t.arr}`:""}</div>
                    </div>
                    {t.flightNo && <span style={{ fontFamily:"monospace", fontSize:12, color:A.cyan }}>{t.flightNo}</span>}
                    {t.ref      && <span style={{ fontFamily:"monospace", fontSize:12, color:A.yellow }}>{t.ref}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function TasksTab({ tasks, tourDays }) {
  const [cat, setCat] = useState("All");
  const cats = ["All",...Object.keys(CAT_COLOR)];
  const filtered = cat==="All" ? tasks : tasks.filter(t => t.category===cat);
  const open = filtered.filter(t => t.status !== "Done");
  const done = filtered.filter(t => t.status === "Done");

  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:20 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer",
            fontSize:11, fontWeight:700, letterSpacing:"0.05em",
            background:cat===c?(CAT_COLOR[c]||A.yellow):A.bg2,
            color:cat===c?A.bg:A.fg3, transition:"all 0.1s",
          }}>{c}</button>
        ))}
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Open — {open.length}</div>
        {open.map(t => {
          const day = t.dayId ? tourDays.find(d => d.id===t.dayId) : null;
          const c = day ? (CITY[day.city]||CITY.Adelaide) : null;
          return (
            <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"9px 12px", background:A.bg1, borderRadius:5, marginBottom:5, borderLeft:`3px solid ${CAT_COLOR[t.category]||A.comment}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:A.fg, fontWeight:500 }}>{t.task}</div>
                {t.notes && <div style={{ fontSize:11, color:A.comment, marginTop:3 }}>{t.notes}</div>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                {day && <span style={{ fontSize:11, color:c.text, display:"flex", alignItems:"center", gap:4 }}><Dot city={day.city} size={6} />{day.city}</span>}
                <Pill text={t.category} bg={A.bg2} color={CAT_COLOR[t.category]||A.fg3} />
              </div>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Done — {done.length}</div>
          {done.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 12px", background:A.bg1, borderRadius:5, marginBottom:4, opacity:0.5 }}>
              <span style={{ color:A.green, fontSize:12 }}>✓</span>
              <span style={{ fontSize:12, color:A.fg3 }}>{t.task}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PEOPLE ──────────────────────────────────────────────────────────────────
function PeopleTab({ people }) {
  const band = people.filter(p => p.type==="Band");
  const crew = people.filter(p => p.type==="Crew");

  const Card = ({ p }) => {
    const c = CITY[p.base]||CITY.Adelaide;
    return (
      <div style={{ background:A.bg1, borderRadius:6, padding:"13px 15px", borderTop:`2px solid ${c.dot}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:c.bg, border:`2px solid ${c.dot}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:c.text, flexShrink:0 }}>{p.initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:A.fg1 }}>{p.name}</div>
            <div style={{ fontSize:11, color:A.comment }}>{p.role}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}><Dot city={p.base} size={6} /><span style={{ fontSize:11, color:c.text }}>{p.base}</span></div>
        {p.phone && <div style={{ fontSize:11, color:A.comment, marginBottom:1 }}>{p.phone}</div>}
        {p.email && <div style={{ fontSize:11, color:A.comment }}>{p.email}</div>}
      </div>
    );
  };

  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Band</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10, marginBottom:26 }}>
        {band.map(p => <Card key={p.id} p={p} />)}
      </div>
      <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Crew</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
        {crew.map(p => <Card key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// ─── TRAVEL ──────────────────────────────────────────────────────────────────
function TravelTab({ travel }) {
  const booked  = travel.filter(t => t.ref || t.status==="Booked" || t.status==="Ticketed");
  const pending = travel.filter(t => !t.ref && t.status!=="Booked" && t.status!=="Ticketed");

  const Leg = ({ t }) => {
    const fromCity = Object.keys(CITY).find(c => t.from?.includes(c));
    const toCity   = Object.keys(CITY).find(c => t.to?.includes(c));
    const fc = CITY[fromCity]||{dot:A.fg3,text:A.fg3};
    const tc = CITY[toCity]  ||{dot:A.fg3,text:A.fg3};
    return (
      <div style={{ background:A.bg1, borderRadius:6, padding:"11px 14px", marginBottom:7 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:600, color:A.fg }}>{t.passengers.join(", ")}</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            {t.flightNo && <span style={{ fontFamily:"monospace", fontSize:12, color:A.cyan }}>{t.flightNo}</span>}
            {t.ref      && <span style={{ fontFamily:"monospace", fontSize:11, color:A.yellow }}>{t.ref}</span>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:fc.text }}><Dot city={fromCity} size={6} />{t.from}</span>
          <span style={{ color:A.bg2 }}>→</span>
          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:tc.text }}><Dot city={toCity} size={6} />{t.to}</span>
          {(t.dep||t.arr) && <span style={{ fontSize:11, color:A.comment, marginLeft:"auto" }}>{t.dep}{t.arr?` → ${t.arr}`:""}</span>}
        </div>
        {t.date && <div style={{ fontSize:11, color:A.comment, marginTop:4 }}>{formatDate(t.date)}</div>}
      </div>
    );
  };

  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div>
          <div style={{ fontSize:10, color:A.green, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:A.green, display:"inline-block" }} /> Booked — {booked.length}
          </div>
          {booked.map(t => <Leg key={t.id} t={t} />)}
        </div>
        <div>
          <div style={{ fontSize:10, color:A.orange, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:A.orange, display:"inline-block" }} /> Pending — {pending.length}
          </div>
          {pending.map(t => <Leg key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

// ─── STATS STRIP ─────────────────────────────────────────────────────────────
function StatsStrip({ tourDays, tasks, travel }) {
  const openTasks   = tasks.filter(t => t.status !== "Done").length;
  const bookedLegs  = travel.filter(t => t.ref || t.status==="Booked" || t.status==="Ticketed").length;
  const pendingLegs = travel.filter(t => !t.ref && t.status!=="Booked" && t.status!=="Ticketed").length;
  const nextDay     = tourDays.find(d => daysUntil(d.date) >= 0);
  const daysToShow  = nextDay ? daysUntil(nextDay.date) : null;

  return (
    <div style={{ display:"flex", background:A.bg1, borderBottom:`1px solid ${A.bg2}` }}>
      {[
        { label:"Days to show",   value:daysToShow!=null?`${daysToShow}d`:"—", color:A.yellow },
        { label:"Open tasks",     value:openTasks,   color:openTasks>10?A.red:A.orange },
        { label:"Travel booked",  value:bookedLegs,  color:A.green },
        { label:"Travel pending", value:pendingLegs, color:pendingLegs>3?A.red:A.fg3 },
        { label:"Shows",          value:tourDays.filter(d=>d.type==="Show"||d.type==="Festival").length, color:A.cyan },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ flex:1, padding:"12px 16px", textAlign:"center", borderRight:`1px solid ${A.bg2}` }}>
          <div style={{ fontSize:22, fontWeight:800, color, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:10, color:A.comment, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
const TABS = ["Tour Days","Tasks","People","Travel"];

export default function App() {
  const [tab, setTab]           = useState("Tour Days");
  const [tourDays, setTourDays] = useState([]);
  const [people, setPeople]     = useState([]);
  const [travel, setTravel]     = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    Promise.all([
      fetchAll(873330),
      fetchAll(873326),
      fetchAll(873333),
      fetchAll(873335),
    ]).then(([days, ppl, trv, tsk]) => {
      setTourDays(days.map(mapTourDay));
      setPeople(ppl.map(mapPerson));
      setTravel(trv.map(mapTravel));
      setTasks(tsk.map(mapTask));
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ background:A.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:A.comment, fontFamily:"monospace", fontSize:13 }}>
      loading…
    </div>
  );

  if (error) return (
    <div style={{ background:A.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:A.red, fontFamily:"monospace", fontSize:13 }}>
      error: {error}
    </div>
  );

  const openTasks   = tasks.filter(t => t.status !== "Done").length;
  const pendingLegs = travel.filter(t => !t.ref && t.status!=="Booked" && t.status!=="Ticketed").length;
  const counts = { "Tour Days":tourDays.length, Tasks:openTasks, People:people.length, Travel:pendingLegs };

  return (
    <div style={{ minHeight:"100vh", background:A.bg, color:A.fg, fontFamily:"'IBM Plex Mono','Fira Code','Courier New',monospace", display:"flex", flexDirection:"column" }}>

      <div style={{ background:A.bg1, borderBottom:`1px solid ${A.bg2}`, padding:"14px 24px", display:"flex", alignItems:"baseline", gap:16 }}>
        <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, color:A.fg2, letterSpacing:"-0.02em" }}>Bad Dreems</span>
        <span style={{ fontSize:11, color:A.comment, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:600 }}>ADVANCING PORTAL</span>
        <span style={{ marginLeft:"auto", fontSize:11, color:A.bg2 }}>Ultra Dundee · Apr–May 2026</span>
      </div>

      <StatsStrip tourDays={tourDays} tasks={tasks} travel={travel} />

      <div style={{ display:"flex", background:A.bg1, borderBottom:`1px solid ${A.bg2}`, paddingLeft:8 }}>
        {TABS.map(t => <TabBtn key={t} label={t} active={tab===t} onClick={() => setTab(t)} count={counts[t]} />)}
      </div>

      <div style={{ flex:1, overflowY:"auto" }}>
        {tab==="Tour Days" && <TourDaysTab tourDays={tourDays} tasks={tasks} travel={travel} />}
        {tab==="Tasks"     && <TasksTab tasks={tasks} tourDays={tourDays} />}
        {tab==="People"    && <PeopleTab people={people} />}
        {tab==="Travel"    && <TravelTab travel={travel} />}
      </div>
    </div>
  );
}
