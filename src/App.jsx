import { useState, useEffect } from "react";

// ─── BASEROW ─────────────────────────────────────────────────────────────────
const TOKEN = "Qu3ab715EJKly2rFhGJagUzPbbIqOYKl";
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
    taskIds:   (r["Tasks"]  || []).filter(Boolean).map(t => t.id),
    travelIds: (r["Travel"] || []).filter(Boolean).map(t => t.id),
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
    passengers: (r["Passengers"] || []).filter(Boolean).map(p => p.value),
    dayIds:     (r["Linked day"] || []).filter(Boolean).map(d => d.id),
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
  Adelaide:  { dot: "#ddcc68", text: "#ddcc68", bg: "#222219", border: "#383820" },
  Melbourne: { dot: "#7199dd", text: "#7199dd", bg: "#191d28", border: "#252d40" },
  Sydney:    { dot: "#9971dd", text: "#9971dd", bg: "#211928", border: "#342040" },
  Brisbane:  { dot: "#89b171", text: "#89b171", bg: "#192219", border: "#253525" },
};

const TYPE_STYLE = {
  Show:      { bg: "#1d2438", color: "#7199dd" },
  Festival:  { bg: "#271e38", color: "#9971dd" },
  Rehearsal: { bg: "#1e2a1a", color: "#89b171" },
};

const CAT_COLOR = {
  Travel:        "#7199dd",
  Accommodation: "#9971dd",
  Advancing:     "#ddcc68",
  Production:    "#dd9968",
  Tech:          "#89b171",
  Admin:         "#b4b4b4",
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "TBC";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { weekday:"short", day:"numeric", month:"short" });
}
function daysUntil(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso + "T00:00:00") - new Date("2026-03-11")) / 86400000);
}

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
function Dot({ city, size=8 }) {
  const dot = (CITY[city] || { dot: "#b4b4b4" }).dot;
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, background: dot }}
    />
  );
}

function Pill({ text, bg, color }) {
  return (
    <span
      className="text-[10px] font-bold tracking-[0.07em] uppercase px-[7px] py-[2px] rounded-[3px]"
      style={{ background: bg, color }}
    >
      {text}
    </span>
  );
}

function TabBtn({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={[
        "bg-transparent border-none cursor-pointer px-[18px] py-[10px]",
        "text-[11px] tracking-[0.08em] uppercase transition-colors duration-[120ms]",
        "flex items-center gap-[6px] border-b-2",
        active ? "font-bold text-fg1 border-b-yellow" : "font-normal text-comment border-b-transparent",
      ].join(" ")}
    >
      {label}
      {count != null && (
        <span className={[
          "rounded-[10px] text-[10px] font-bold px-[6px] py-[1px]",
          active ? "bg-yellow text-bg" : "bg-bg2 text-fg3",
        ].join(" ")}>
          {count}
        </span>
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
    <div className="flex min-h-[520px]">
      {/* Sidebar */}
      <div className="w-[290px] shrink-0 border-r border-bg2 overflow-y-auto">
        {tourDays.map(d => {
          const c = CITY[d.city] || CITY.Adelaide;
          const du = daysUntil(d.date);
          const active = sel === d.id;
          return (
            <div
              key={d.id}
              onClick={() => setSel(active ? null : d.id)}
              className="px-[15px] py-3 cursor-pointer border-b border-bg1 transition-colors duration-100 border-l-[3px]"
              style={{
                background: active ? c.bg : "transparent",
                borderLeftColor: active ? c.dot : "transparent",
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <div className={`text-[13px] font-semibold leading-[1.3] flex-1 ${active ? "text-fg1" : "text-fg"}`}>
                  {d.name}
                </div>
                {du != null && (
                  <span className="text-[11px] text-comment shrink-0 tabular-nums">
                    {du > 0 ? `${du}d` : du === 0 ? "today" : "past"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-[6px] mt-1">
                <Dot city={d.city} size={7} />
                <span className="text-[11px] text-comment">{formatDate(d.date)}</span>
                <span className="text-bg2">·</span>
                <span className="text-[11px]" style={{ color: c.text }}>{d.city}</span>
              </div>
              <div className="mt-[5px]">
                <Pill text={d.type} {...(TYPE_STYLE[d.type] || { bg: "#3d3d3d", color: "#b4b4b4" })} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail pane */}
      <div className="flex-1 p-[26px] overflow-y-auto">
        {!day ? (
          <div className="text-comment text-[13px] pt-5">Select a day.</div>
        ) : (
          <>
            <div
              className="rounded-[6px] px-[18px] py-[15px] mb-[18px] border"
              style={{ background: cc.bg, borderColor: cc.border }}
            >
              <div className="flex items-center gap-2 mb-[7px]">
                <Dot city={day.city} size={9} />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: cc.text }}>
                  {day.city}
                </span>
                <Pill text={day.type} {...(TYPE_STYLE[day.type] || { bg: "#3d3d3d", color: "#b4b4b4" })} />
                <Pill text={day.status} bg="#3d3d3d" color="#b4b4b4" />
              </div>
              <div className="text-[16px] font-bold text-fg2 mb-[3px]">{day.name}</div>
              <div className="text-[12px] text-fg3">{formatDate(day.date)} · {day.venue}</div>
            </div>

            <div className="grid grid-cols-4 gap-[7px] mb-[18px]">
              {[["Load-in", day.loadin], ["Soundcheck", day.soundcheck], ["Doors", day.doors], ["Curfew", day.curfew]].map(([lbl, val]) => (
                <div key={lbl} className="bg-bg1 rounded-[5px] px-[11px] py-[9px]">
                  <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-[3px]">{lbl}</div>
                  <div className={`text-[13px] font-semibold ${val ? "text-fg1" : "text-bg2"}`}>{val || "TBC"}</div>
                </div>
              ))}
            </div>

            {day.notes && (
              <div className="bg-bg1 rounded-[5px] px-[14px] py-[11px] mb-[18px] text-[13px] text-fg3 leading-[1.65]">
                {day.notes}
              </div>
            )}

            {day.supports && (
              <div className="mb-[18px]">
                <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-[6px]">Support Acts</div>
                <div className="text-[13px] text-fg">{day.supports}</div>
              </div>
            )}

            {dayTasks.length > 0 && (
              <div className="mb-[18px]">
                <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-[9px]">
                  Tasks ({dayTasks.length})
                </div>
                {dayTasks.map(t => (
                  <div key={t.id} className="flex items-start gap-[10px] py-2 border-b border-bg1">
                    <span
                      className="w-[6px] h-[6px] rounded-full mt-[5px] shrink-0"
                      style={{ background: CAT_COLOR[t.category] || "#b4b4b4" }}
                    />
                    <div className="flex-1">
                      <div className="text-[13px] text-fg">{t.task}</div>
                      {t.notes && <div className="text-[11px] text-comment mt-[2px]">{t.notes}</div>}
                    </div>
                    <span
                      className="text-[10px] px-[6px] py-[2px] rounded-[3px]"
                      style={{
                        background: t.status === "Done" ? "#1e2b1a" : "#282828",
                        color: t.status === "Done" ? "#89b171" : "#b4b4b4",
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {dayTravel.length > 0 && (
              <div>
                <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-[9px]">
                  Travel ({dayTravel.length})
                </div>
                {dayTravel.map(t => (
                  <div key={t.id} className="bg-bg1 rounded-[5px] px-3 py-[10px] mb-[7px] flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="text-[12px] text-fg1 font-semibold">{t.passengers.join(", ")}</div>
                      <div className="text-[12px] text-fg3 mt-[2px]">
                        {t.from} → {t.to}{t.dep ? ` · ${t.dep}` : ""}{t.arr ? ` → ${t.arr}` : ""}
                      </div>
                    </div>
                    {t.flightNo && <span className="font-mono text-[12px] text-cyan">{t.flightNo}</span>}
                    {t.ref      && <span className="font-mono text-[12px] text-yellow">{t.ref}</span>}
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
  const cats = ["All", ...Object.keys(CAT_COLOR)];
  const filtered = cat === "All" ? tasks : tasks.filter(t => t.category === cat);
  const open = filtered.filter(t => t.status !== "Done");
  const done = filtered.filter(t => t.status === "Done");

  return (
    <div className="py-5 px-6">
      <div className="flex gap-[7px] flex-wrap mb-5">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="px-3 py-1 rounded-[20px] border-none cursor-pointer text-[11px] font-bold tracking-[0.05em] transition-all duration-100"
            style={{
              background: cat === c ? (CAT_COLOR[c] || "#ddcc68") : "#3d3d3d",
              color: cat === c ? "#1a1a1a" : "#b4b4b4",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-[10px]">
          Open — {open.length}
        </div>
        {open.map(t => {
          const day = t.dayId ? tourDays.find(d => d.id === t.dayId) : null;
          const c = day ? (CITY[day.city] || CITY.Adelaide) : null;
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 px-3 py-[9px] bg-bg1 rounded-[5px] mb-[5px] border-l-[3px]"
              style={{ borderLeftColor: CAT_COLOR[t.category] || "#505050" }}
            >
              <div className="flex-1">
                <div className="text-[13px] text-fg font-medium">{t.task}</div>
                {t.notes && <div className="text-[11px] text-comment mt-[3px]">{t.notes}</div>}
              </div>
              <div className="flex items-center gap-[6px] shrink-0">
                {day && (
                  <span className="text-[11px] flex items-center gap-1" style={{ color: c.text }}>
                    <Dot city={day.city} size={6} />{day.city}
                  </span>
                )}
                <Pill text={t.category} bg="#3d3d3d" color={CAT_COLOR[t.category] || "#b4b4b4"} />
              </div>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div>
          <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-[10px]">
            Done — {done.length}
          </div>
          {done.map(t => (
            <div key={t.id} className="flex items-center gap-[10px] px-3 py-[7px] bg-bg1 rounded-[5px] mb-1 opacity-50">
              <span className="text-green text-[12px]">✓</span>
              <span className="text-[12px] text-fg3">{t.task}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PEOPLE ──────────────────────────────────────────────────────────────────
function PeopleTab({ people }) {
  const band = people.filter(p => p.type === "Band");
  const crew = people.filter(p => p.type === "Crew");

  const Card = ({ p }) => {
    const c = CITY[p.base] || CITY.Adelaide;
    return (
      <div
        className="bg-bg1 rounded-[6px] px-[15px] py-[13px] border-t-2"
        style={{ borderTopColor: c.dot }}
      >
        <div className="flex items-center gap-[10px] mb-2">
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 border-2"
            style={{ background: c.bg, borderColor: c.dot, color: c.text }}
          >
            {p.initials}
          </div>
          <div>
            <div className="text-[13px] font-bold text-fg1">{p.name}</div>
            <div className="text-[11px] text-comment">{p.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-[5px] mb-[5px]">
          <Dot city={p.base} size={6} />
          <span className="text-[11px]" style={{ color: c.text }}>{p.base}</span>
        </div>
        {p.phone && <div className="text-[11px] text-comment mb-[1px]">{p.phone}</div>}
        {p.email && <div className="text-[11px] text-comment">{p.email}</div>}
      </div>
    );
  };

  return (
    <div className="py-5 px-6">
      <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-3">Band</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[10px] mb-[26px]">
        {band.map(p => <Card key={p.id} p={p} />)}
      </div>
      <div className="text-[10px] text-comment uppercase tracking-[0.07em] mb-3">Crew</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[10px]">
        {crew.map(p => <Card key={p.id} p={p} />)}
      </div>
    </div>
  );
}

// ─── TRAVEL ──────────────────────────────────────────────────────────────────
function TravelTab({ travel }) {
  const booked  = travel.filter(t => t.ref || t.status === "Booked" || t.status === "Ticketed");
  const pending = travel.filter(t => !t.ref && t.status !== "Booked" && t.status !== "Ticketed");

  const Leg = ({ t }) => {
    const fromCity = Object.keys(CITY).find(c => t.from?.includes(c));
    const toCity   = Object.keys(CITY).find(c => t.to?.includes(c));
    const fc = CITY[fromCity] || { dot: "#b4b4b4", text: "#b4b4b4" };
    const tc = CITY[toCity]   || { dot: "#b4b4b4", text: "#b4b4b4" };
    return (
      <div className="bg-bg1 rounded-[6px] px-[14px] py-[11px] mb-[7px]">
        <div className="flex items-center gap-2 mb-[6px]">
          <span className="text-[12px] font-semibold text-fg">{t.passengers.join(", ")}</span>
          <div className="ml-auto flex gap-2">
            {t.flightNo && <span className="font-mono text-[12px] text-cyan">{t.flightNo}</span>}
            {t.ref      && <span className="font-mono text-[11px] text-yellow">{t.ref}</span>}
          </div>
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="flex items-center gap-1 text-[12px]" style={{ color: fc.text }}>
            <Dot city={fromCity} size={6} />{t.from}
          </span>
          <span className="text-bg2">→</span>
          <span className="flex items-center gap-1 text-[12px]" style={{ color: tc.text }}>
            <Dot city={toCity} size={6} />{t.to}
          </span>
          {(t.dep || t.arr) && (
            <span className="text-[11px] text-comment ml-auto">
              {t.dep}{t.arr ? ` → ${t.arr}` : ""}
            </span>
          )}
        </div>
        {t.date && <div className="text-[11px] text-comment mt-1">{formatDate(t.date)}</div>}
      </div>
    );
  };

  return (
    <div className="py-5 px-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] text-green uppercase tracking-[0.07em] mb-3 flex items-center gap-[6px]">
            <span className="w-[7px] h-[7px] rounded-full bg-green inline-block" />
            Booked — {booked.length}
          </div>
          {booked.map(t => <Leg key={t.id} t={t} />)}
        </div>
        <div>
          <div className="text-[10px] text-orange uppercase tracking-[0.07em] mb-3 flex items-center gap-[6px]">
            <span className="w-[7px] h-[7px] rounded-full bg-orange inline-block" />
            Pending — {pending.length}
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
  const bookedLegs  = travel.filter(t => t.ref || t.status === "Booked" || t.status === "Ticketed").length;
  const pendingLegs = travel.filter(t => !t.ref && t.status !== "Booked" && t.status !== "Ticketed").length;
  const nextDay     = tourDays.find(d => daysUntil(d.date) >= 0);
  const daysToShow  = nextDay ? daysUntil(nextDay.date) : null;

  const stats = [
    { label: "Days to show",   value: daysToShow != null ? `${daysToShow}d` : "—", color: "#ddcc68" },
    { label: "Open tasks",     value: openTasks,   color: openTasks > 10 ? "#dd6868" : "#dd9968" },
    { label: "Travel booked",  value: bookedLegs,  color: "#89b171" },
    { label: "Travel pending", value: pendingLegs, color: pendingLegs > 3 ? "#dd6868" : "#b4b4b4" },
    { label: "Shows",          value: tourDays.filter(d => d.type === "Show" || d.type === "Festival").length, color: "#89b4b4" },
  ];

  return (
    <div className="flex bg-bg1 border-b border-bg2">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="flex-1 px-4 py-3 text-center border-r border-bg2">
          <div className="text-[22px] font-extrabold tabular-nums leading-none" style={{ color }}>
            {value}
          </div>
          <div className="text-[10px] text-comment uppercase tracking-[0.07em] mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
const TABS = ["Tour Days", "Tasks", "People", "Travel"];

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
    <div className="bg-bg min-h-screen flex items-center justify-center text-comment font-mono text-[13px]">
      loading…
    </div>
  );

  if (error) return (
    <div className="bg-bg min-h-screen flex items-center justify-center text-red font-mono text-[13px]">
      error: {error}
    </div>
  );

  const openTasks   = tasks.filter(t => t.status !== "Done").length;
  const pendingLegs = travel.filter(t => !t.ref && t.status !== "Booked" && t.status !== "Ticketed").length;
  const counts = { "Tour Days": tourDays.length, Tasks: openTasks, People: people.length, Travel: pendingLegs };

  return (
    <div className="min-h-screen bg-bg text-fg font-mono flex flex-col">

      <div className="bg-bg1 border-b border-bg2 px-6 py-[14px] flex items-baseline gap-4">
        <span className="font-serif text-[22px] text-fg2 tracking-[-0.02em]">Bad Dreems</span>
        <span className="text-[11px] text-comment uppercase tracking-[0.14em] font-semibold">ADVANCING PORTAL</span>
        <span className="ml-auto text-[11px] text-bg2">Ultra Dundee · Apr–May 2026</span>
      </div>

      <StatsStrip tourDays={tourDays} tasks={tasks} travel={travel} />

      <div className="flex bg-bg1 border-b border-bg2 pl-2">
        {TABS.map(t => <TabBtn key={t} label={t} active={tab === t} onClick={() => setTab(t)} count={counts[t]} />)}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "Tour Days" && <TourDaysTab tourDays={tourDays} tasks={tasks} travel={travel} />}
        {tab === "Tasks"     && <TasksTab tasks={tasks} tourDays={tourDays} />}
        {tab === "People"    && <PeopleTab people={people} />}
        {tab === "Travel"    && <TravelTab travel={travel} />}
      </div>
    </div>
  );
}
