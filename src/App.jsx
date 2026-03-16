import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  bg:       "#111110",
  bg1:      "#1c1c1a",
  bg2:      "#272724",
  bg3:      "#313130",
  line:     "#2e2e2b",
  muted:    "#58584f",
  subtle:   "#8a8a7e",
  body:     "#c8c8b8",
  heading:  "#e8e8d8",
  white:    "#f4f4ec",

  amber:    "#e8a84c",
  amberBg:  "#1e1a0e",
  amberBdr: "#2e2610",

  blue:     "#6b9fd4",
  blueBg:   "#0e1520",
  blueBdr:  "#162030",

  violet:   "#9b7fd4",
  violetBg: "#16111e",
  violetBdr:"#221830",

  sage:     "#7ab87a",
  sageBg:   "#0e1a0e",
  sageBdr:  "#162616",

  red:      "#d46b6b",
  orange:   "#d49b6b",
};

const CITY = {
  Adelaide:  { accent: T.amber,  bg: T.amberBg,  border: T.amberBdr,  label: "ADL" },
  Melbourne: { accent: T.blue,   bg: T.blueBg,   border: T.blueBdr,   label: "MEL" },
  Sydney:    { accent: T.violet, bg: T.violetBg, border: T.violetBdr, label: "SYD" },
  Brisbane:  { accent: T.sage,   bg: T.sageBg,   border: T.sageBdr,   label: "BNE" },
};

const TYPE_BADGE = {
  Show:       { bg: "#0e1a2e", color: T.blue },
  Festival:   { bg: "#16102a", color: T.violet },
  Rehearsal:  { bg: "#0e1e10", color: T.sage },
  Travel:     { bg: "#1a1408", color: T.amber },
  Production: { bg: "#1a1408", color: T.orange },
  Off:        { bg: T.bg2, color: T.muted },
};

const CAT_GROUP = {
  "Communication": { label: "Communication", color: T.blue   },
  "Production":    { label: "Production",    color: T.orange },
  "Travel":        { label: "Travel",        color: T.blue   },
  "Accommodation": { label: "Accommodation", color: T.violet },
  "Admin":         { label: "Admin",         color: T.subtle },
};
const GROUP_ORDER = ["Communication", "Production", "Travel", "Accommodation", "Admin"];
const taskPrefix = name => { const i = name.indexOf(" — "); return i > -1 ? name.slice(0, i) : name; };

// ─── BASEROW ─────────────────────────────────────────────────────────────────
const TOKEN = "Qu3ab715EJKly2rFhGJagUzPbbIqOYKl";
const BASE  = "https://api.baserow.io/api/database/rows/table";

async function fetchAll(tableId) {
  let results = [], page = 1;
  while (true) {
    const res = await fetch(
      `${BASE}/${tableId}/?user_field_names=true&size=100&page=${page}`,
      { headers: { Authorization: `Token ${TOKEN}` } }
    );
    const data = await res.json();
    results = results.concat(data.results || []);
    if (!data.next) break;
    page++;
  }
  return results;
}

// ─── MAPPERS ─────────────────────────────────────────────────────────────────
const mapTourDay = r => ({
  id:         r.id,
  name:       r["Name"],
  date:       r["Date"],
  type:       r["Type"]?.value || "",
  city:       r["City"],
  venue:      r["Venue"]?.[0]?.value || "",
  loadin:     r["Load-in"],
  soundcheck: r["Soundcheck"],
  doors:      r["Doors"],
  settime:    r["Set time"],
  curfew:     r["Curfew"],
  setlength:  r["Set length"],
  status:     r["Status"]?.value || "",
  notes:      r["Notes"],
  supports:   r["Support acts"],
  taskIds:    (r["Tasks"]  || []).map(t => t.id),
  travelIds:  (r["Travel"] || []).map(t => t.id),
});

const mapPerson = r => ({
  id:       r.id,
  name:     r["Name"],
  initials: r["Initials"],
  role:     r["Role"],
  type:     r["Type"]?.value || "",
  base:     r["Base city"],
  phone:    r["Phone"],
  email:    r["Email"],
});

const mapTravel = r => ({
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
});

const mapTask = r => ({
  id:       r.id,
  task:     r["Task"],
  dayId:    r["Linked day"]?.[0]?.id || null,
  category: r["Category"]?.value || "",
  status:   r["Status"]?.value || "Not started",
  priority: r["Priority"]?.value || "",
  notes:    r["Notes"],
});

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmtDate = (iso, opts = {}) => {
  if (!iso) return "TBC";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", ...opts
  });
};
const fmtMonth = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { month: "long", year: "numeric" });
const today = new Date("2026-03-12");
const daysFrom = iso => iso ? Math.round((new Date(iso + "T00:00:00") - today) / 86400000) : null;
const cityOf = str => Object.keys(CITY).find(c => (str||"").includes(c));

// ─── SHARED PRIMITIVES ───────────────────────────────────────────────────────
const Dot = ({ city, size = 7 }) => (
  <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: (CITY[city] || { accent: T.muted }).accent, flexShrink: 0,
  }} />
);

const Badge = ({ text, type }) => {
  const s = TYPE_BADGE[type] || TYPE_BADGE[text] || { bg: T.bg2, color: T.subtle };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 3, flexShrink: 0,
    }}>{text}</span>
  );
};

const StatusDot = ({ status }) => {
  const color = status === "Done" ? T.sage : status === "In progress" ? T.amber : status === "Blocked" ? T.red : T.muted;
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />;
};

const Divider = () => <div style={{ height: 1, background: T.line, margin: "0" }} />;

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 10 }}>
    {children}
  </div>
);

// ─── PACKLIST DATA (static for v1) ───────────────────────────────────────────
const PACKLIST = {
  "Instruments & Electronics": [
    "Guitars (touring set — confirm with AC and MD)",
    "Bass (Deon — confirm own)",
    "Kick drum trigger / drum hardware",
    "SPD-SX (Mathias)",
    "Synth unit (Mathias) + dedicated amp cable",
    "Pedalboards (all guitarists)",
    "Direct boxes (spares x2)",
    "Instrument cables (x10 minimum)",
  ],
  "IEM System": [
    "Soundcraft UI24R (Option B only)",
    "IEM transmitter packs (Ben, Miles — confirm count)",
    "IEM receiver belt packs",
    "Earpieces — 535s for Ben and Miles ⚠ purchase required",
    "IEM antenna",
    "iPad (stage tech position)",
    "iPad (Jeff — FOH, Option B only)",
  ],
  "Audio": [
    "Stage box + multicore",
    "DI boxes (as above)",
    "Spare XLRs (x6)",
    "Gaffer tape",
    "Cable ties",
  ],
  "Backline": [
    "Guitar amps (confirm with AC, MD)",
    "Bass amp (confirm with DS)",
    "Jazz amp for synth (Mathias)",
    "Spare tubes / fuses",
  ],
  "Merchandise": [
    "Merch stock (confirm count with management)",
    "Cash float",
    "Card reader",
    "Merch display / hangers",
  ],
  "Admin": [
    "Rider copies (hard + digital)",
    "Stage plot (current version)",
    "Input list",
    "Emergency contacts list",
    "First aid kit",
  ],
};

const BACKLINE = [
  { item: "Guitar amp 1", spec: "TBC — Alex Cameron", status: "TBC" },
  { item: "Guitar amp 2", spec: "TBC — Mathias Dowle", status: "TBC" },
  { item: "Bass amp", spec: "TBC — Deon Slaviero", status: "TBC" },
  { item: "Jazz amp (synth)", spec: "Dedicated stage amp, not DI", status: "Confirmed — AC" },
  { item: "Drum kit", spec: "Mathias Dowle / Miles Wilson", status: "TBC" },
  { item: "SPD-SX", spec: "Mathias Dowle — personal unit", status: "Confirmed" },
  { item: "Synth", spec: "Mathias Dowle — personal unit", status: "Confirmed" },
];

// ─── FORMS DATA ───────────────────────────────────────────────────────────────
const FORMS = [
  {
    id: "travel",
    title: "Travel Details",
    desc: "Collect passport, frequent flyer, dietary, and emergency contact info from all travellers.",
    fields: ["Full legal name", "Passport number", "Passport expiry", "Frequent flyer number", "Dietary requirements", "Emergency contact name", "Emergency contact phone"],
    recipients: "Band + Crew",
    status: "Not sent",
  },
  {
    id: "gear",
    title: "Gear Needs",
    desc: "Confirm what each member needs provided vs. bringing own.",
    fields: ["Instrument(s)", "Amp requirements", "In-ear monitoring (Yes/No/If track)", "IEM brand/model preference", "Any special requirements"],
    recipients: "Band + Crew",
    status: "Not sent",
  },
  {
    id: "avail",
    title: "Rehearsal Availability",
    desc: "Collect availability for pre-tour rehearsal dates in Adelaide.",
    fields: ["Available dates (Apr 7–9)", "Location constraints", "Notes"],
    recipients: "Band",
    status: "Not sent",
  },
];

// ─── ADVANCING TOKEN ─────────────────────────────────────────────────────────
const ADV_TOKEN = "adv2026ud";
const isAdvancing = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("adv") === ADV_TOKEN;
  } catch { return false; }
};

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tourDays, onSelectDay }) {
  const [viewMode, setViewMode] = useState("list");
  const [monthOffset, setMonthOffset] = useState(0);

  const sorted = [...tourDays].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const byMonth = {};
  sorted.forEach(d => {
    if (!d.date) return;
    const key = d.date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(d);
  });
  const months = Object.keys(byMonth).sort();

  const upcoming = sorted.find(d => daysFrom(d.date) >= 0);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: 0 }}>Tour Schedule</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Ultra Dundee · April 9 – May 9, 2026</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: T.bg2, borderRadius: 6, padding: 3 }}>
          {["list", "month"].map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: "5px 14px", borderRadius: 4, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em",
              background: viewMode === m ? T.bg3 : "transparent",
              color: viewMode === m ? T.heading : T.muted,
            }}>{m}</button>
          ))}
        </div>
      </div>

      {upcoming && (
        <div style={{ margin: "16px 28px 0", background: (CITY[upcoming.city] || CITY.Adelaide).bg, border: `1px solid ${(CITY[upcoming.city] || CITY.Adelaide).border}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Dot city={upcoming.city} size={8} />
          <div>
            <span style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Next up</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.heading, marginTop: 1 }}>{upcoming.name}</div>
            <div style={{ fontSize: 12, color: T.subtle }}>{fmtDate(upcoming.date)} · {upcoming.venue}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: (CITY[upcoming.city] || CITY.Adelaide).accent, lineHeight: 1 }}>
              {daysFrom(upcoming.date)}
            </div>
            <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>days</div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 28px 28px" }}>
        {viewMode === "list" ? (
          months.map(monthKey => (
            <div key={monthKey} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${T.line}` }}>
                {fmtMonth(monthKey + "-01")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {byMonth[monthKey].map(d => {
                  const c = CITY[d.city] || CITY.Adelaide;
                  const du = daysFrom(d.date);
                  const isPast = du !== null && du < 0;
                  return (
                    <div key={d.id} onClick={() => onSelectDay(d)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: T.bg1, borderRadius: 6, cursor: "pointer",
                      border: `1px solid ${T.line}`, opacity: isPast ? 0.45 : 1,
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.bg2; e.currentTarget.style.borderColor = c.border; }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.bg1; e.currentTarget.style.borderColor = T.line; }}
                    >
                      <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: c.accent, flexShrink: 0 }} />
                      <div style={{ width: 52, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: T.muted }}>{fmtDate(d.date, { weekday: "short" }).split(",")[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.body }}>{fmtDate(d.date, { day: "numeric", month: "short" })}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.heading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: T.subtle, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                          <Dot city={d.city} size={6} />
                          {d.city}{d.venue ? ` · ${d.venue}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                        <Badge text={d.type} type={d.type} />
                        {du !== null && du >= 0 && <span style={{ fontSize: 10, color: T.muted, fontVariantNumeric: "tabular-nums" }}>{du === 0 ? "today" : `${du}d`}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          months.map(monthKey => {
            const firstDay = new Date(monthKey + "-01T00:00:00");
            const startDow = firstDay.getDay();
            const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
            const cells = Array(startDow === 0 ? 6 : startDow - 1).fill(null);
            for (let i = 1; i <= daysInMonth; i++) cells.push(i);
            while (cells.length % 7 !== 0) cells.push(null);

            return (
              <div key={monthKey} style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.heading, marginBottom: 12 }}>{fmtMonth(monthKey + "-01")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
                  {["M","T","W","T","F","S","S"].map((d,i) => (
                    <div key={i} style={{ fontSize: 10, color: T.muted, textAlign: "center", paddingBottom: 4, fontWeight: 600 }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const iso = `${monthKey}-${String(day).padStart(2, "0")}`;
                    const events = byMonth[monthKey]?.filter(d => d.date === iso) || [];
                    const hasEvent = events.length > 0;
                    const c = hasEvent ? (CITY[events[0].city] || CITY.Adelaide) : null;
                    return (
                      <div key={i} onClick={() => hasEvent && onSelectDay(events[0])} style={{
                        aspectRatio: "1", borderRadius: 5, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", position: "relative",
                        background: hasEvent ? c.bg : T.bg1,
                        border: `1px solid ${hasEvent ? c.border : T.line}`,
                        cursor: hasEvent ? "pointer" : "default",
                      }}>
                        <span style={{ fontSize: 12, fontWeight: hasEvent ? 700 : 400, color: hasEvent ? c.accent : T.muted }}>{day}</span>
                        {hasEvent && <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.accent, marginTop: 2 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── DAY DETAIL PANEL ─────────────────────────────────────────────────────────
function DayDetail({ day, tasks, travel, onClose }) {
  if (!day) return null;
  const c = CITY[day.city] || CITY.Adelaide;
  const dayTasks  = tasks.filter(t => day.taskIds.includes(t.id));
  const dayTravel = travel.filter(t => t.dayIds.includes(day.id));

  return (
    <div style={{
      width: 340, flexShrink: 0, borderLeft: `1px solid ${T.line}`,
      background: T.bg1, overflowY: "auto", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.line}`, background: c.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <Dot city={day.city} size={8} />
              <span style={{ fontSize: 11, color: c.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{day.city}</span>
              <Badge text={day.type} type={day.type} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.heading }}>{day.name}</div>
            <div style={{ fontSize: 12, color: T.subtle, marginTop: 3 }}>{fmtDate(day.date)}{day.venue ? ` · ${day.venue}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: "0 0 0 8px" }}>×</button>
        </div>
      </div>

      <div style={{ padding: "16px 18px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
          {[["Load-in", day.loadin], ["Soundcheck", day.soundcheck], ["Doors", day.doors], ["Set time", day.settime], ["Curfew", day.curfew], ["Set length", day.setlength]].map(([lbl, val]) => (
            <div key={lbl} style={{ background: T.bg2, borderRadius: 5, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: val ? T.heading : T.bg3 }}>{val || "TBC"}</div>
            </div>
          ))}
        </div>

        {day.supports && (
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>Support</SectionLabel>
            <div style={{ fontSize: 13, color: T.body }}>{day.supports}</div>
          </div>
        )}

        {day.notes && (
          <div style={{ background: T.bg2, borderRadius: 5, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: T.subtle, lineHeight: 1.65 }}>
            {day.notes}
          </div>
        )}

        {dayTravel.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Travel ({dayTravel.length})</SectionLabel>
            {dayTravel.map(t => (
              <div key={t.id} style={{ background: T.bg2, borderRadius: 5, padding: "9px 11px", marginBottom: 5 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.heading, marginBottom: 3 }}>{t.passengers.join(", ")}</div>
                <div style={{ fontSize: 11, color: T.subtle }}>{t.from} → {t.to}{t.dep ? ` · ${t.dep}` : ""}{t.arr ? ` – ${t.arr}` : ""}</div>
                {t.flightNo && <div style={{ fontFamily: "monospace", fontSize: 11, color: T.blue, marginTop: 3 }}>{t.flightNo}{t.ref ? ` · ${t.ref}` : ""}</div>}
              </div>
            ))}
          </div>
        )}

        {dayTasks.length > 0 && (
          <div>
            <SectionLabel>Tasks ({dayTasks.length})</SectionLabel>
            {dayTasks.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>
                <StatusDot status={t.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: t.status === "Done" ? T.muted : T.body }}>{t.task}</div>
                </div>
                <span style={{ fontSize: 10, color: (CAT_GROUP[t.category] || { color: T.muted }).color, flexShrink: 0 }}>{t.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VENUES VIEW ─────────────────────────────────────────────────────────────
function VenuesView({ tourDays }) {
  const showDays = tourDays.filter(d => d.type === "Show" || d.type === "Festival");
  const [sel, setSel] = useState(null);

  const VENUE_NOTES = {
    "Gather Sounds": { address: "Adelaide University, Adelaide SA 5000", type: "Festival site", prodContact: "Gus Smith (audio) via GA Entertainment", promoContact: "Gareth Lewis — GA Entertainment", notes: "GA Entertainment running all production. TM coordinates Bad Dreems slot only: set times, load-in, soundcheck window. No split system. Jeff liaising directly with Gus on PA." },
    "Thornbury Theatre": { address: "868 High St, Thornbury VIC 3071", type: "Theatre", prodContact: "In-house FOH + LX at $55 inc GST/hr", promoContact: "TBC", notes: "Lighting package $195 flat. Security 50/50 split. OneMusic 1.65% of total sales. Hospitality up to $200 inc GST. Backline: Bad Dreems own." },
    "Marrickville Bowling Club": { address: "533 Illawarra Rd, Marrickville NSW 2204", type: "Club", prodContact: "FOH + LX FOC (set & forget lighting)", promoContact: "TBC", notes: "Sound curfew 6:30–7:30pm — no soundcheck in that window. Door staff: performer provides and pays. ⚠ Not yet sourced. Backline: Bad Dreems own." },
    "The Brightside (Outdoors)": { address: "27 Warner St, Fortitude Valley QLD 4006", type: "Outdoor", prodContact: "FOH FOC", promoContact: "TBC", notes: "No split system — Jeff at FOH for monitors. LX: ⚠ decision needed — venue $440 inc GST or source own. Door staff: venue FOC. Outdoor — weather contingency to discuss." },
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.line}` }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: 0 }}>Venues</h1>
        <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{showDays.length} shows</p>
      </div>
      <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {showDays.map(d => {
          const c = CITY[d.city] || CITY.Adelaide;
          const vn = VENUE_NOTES[d.venue] || {};
          return (
            <div key={d.id} onClick={() => setSel(sel === d.id ? null : d.id)} style={{
              background: T.bg1, border: `1px solid ${sel === d.id ? c.border : T.line}`,
              borderTop: `3px solid ${c.accent}`, borderRadius: 7, padding: "16px 18px",
              cursor: "pointer", transition: "border-color 0.12s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{d.venue || "TBC"}</div>
                  <div style={{ fontSize: 11, color: c.accent, display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <Dot city={d.city} size={6} />{d.city}
                  </div>
                </div>
                <Badge text={d.type} type={d.type} />
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{fmtDate(d.date)}</div>
              {vn.address && <div style={{ fontSize: 11, color: T.subtle, marginBottom: 8, lineHeight: 1.5 }}>{vn.address}</div>}
              {sel === d.id && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>
                  {vn.prodContact && (
                    <div style={{ marginBottom: 7 }}>
                      <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Production</div>
                      <div style={{ fontSize: 12, color: T.body }}>{vn.prodContact}</div>
                    </div>
                  )}
                  {vn.promoContact && (
                    <div style={{ marginBottom: 7 }}>
                      <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Promoter</div>
                      <div style={{ fontSize: 12, color: T.body }}>{vn.promoContact}</div>
                    </div>
                  )}
                  {vn.notes && <div style={{ fontSize: 11, color: T.subtle, lineHeight: 1.6, marginTop: 6 }}>{vn.notes}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PACKLIST VIEW ─────────────────────────────────────────────────────────────
function PacklistView() {
  const [open, setOpen] = useState(Object.keys(PACKLIST));
  const toggle = cat => setOpen(o => o.includes(cat) ? o.filter(c => c !== cat) : [...o, cat]);
  const total = Object.values(PACKLIST).flat().length;
  const warnings = Object.values(PACKLIST).flat().filter(i => i.includes("⚠")).length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: 0 }}>Packlist</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{total} items across {Object.keys(PACKLIST).length} categories</p>
        </div>
        {warnings > 0 && (
          <div style={{ marginLeft: "auto", background: "#1e1408", border: `1px solid #2e2010`, borderRadius: 6, padding: "6px 12px", fontSize: 12, color: T.orange }}>
            ⚠ {warnings} item{warnings > 1 ? "s" : ""} need attention
          </div>
        )}
      </div>
      <div style={{ padding: "20px 28px" }}>
        {Object.entries(PACKLIST).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <button onClick={() => toggle(cat)} style={{
              width: "100%", background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6,
              padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              color: T.heading, fontSize: 13, fontWeight: 600, textAlign: "left",
              borderBottomLeftRadius: open.includes(cat) ? 0 : 6, borderBottomRightRadius: open.includes(cat) ? 0 : 6,
            }}>
              <span style={{ fontSize: 11, color: T.muted, transform: open.includes(cat) ? "rotate(90deg)" : "none", transition: "transform 0.12s", display: "inline-block" }}>▶</span>
              {cat}
              <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted }}>{items.length}</span>
            </button>
            {open.includes(cat) && (
              <div style={{ background: T.bg1, border: `1px solid ${T.line}`, borderTop: "none", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, padding: "4px 0 8px" }}>
                {items.map((item, i) => (
                  <div key={i} style={{ padding: "6px 14px 6px 36px", fontSize: 12, color: item.includes("⚠") ? T.orange : T.body, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: item.includes("⚠") ? T.orange : T.muted, flexShrink: 0 }}>{item.includes("⚠") ? "⚠" : "·"}</span>
                    {item.replace("⚠ ", "")}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BACKLINE VIEW ────────────────────────────────────────────────────────────
function BacklineView() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.line}` }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: 0 }}>Backline</h1>
        <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Current confirmed and TBC backline requirements</p>
      </div>
      <div style={{ padding: "20px 28px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Item", "Spec / Owner", "Status"].map(h => (
                <th key={h} style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", padding: "6px 12px 10px", borderBottom: `1px solid ${T.line}`, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BACKLINE.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: T.heading }}>{row.item}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: T.body }}>{row.spec}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 3,
                    background: row.status === "Confirmed" ? "#0e1e10" : row.status.startsWith("Confirmed") ? "#0e1e10" : T.bg2,
                    color: row.status.startsWith("Confirmed") ? T.sage : T.muted,
                  }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 20, background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6, padding: "12px 16px", fontSize: 12, color: T.subtle, lineHeight: 1.65 }}>
          <strong style={{ color: T.body }}>Synth note:</strong> Mathias's synth runs through a dedicated Jazz amp on stage — not DI. AC confirmed.
        </div>
      </div>
    </div>
  );
}

// ─── FORMS VIEW ──────────────────────────────────────────────────────────────
function FormsView({ people }) {
  const [sel, setSel] = useState(null);
  const form = FORMS.find(f => f.id === sel);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.line}` }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: 0 }}>Information Requests</h1>
        <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Send forms to band and crew; view responses here when submitted</p>
      </div>
      <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: sel ? "1fr 1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {FORMS.map(f => (
            <div key={f.id} onClick={() => setSel(sel === f.id ? null : f.id)} style={{
              background: T.bg1, border: `1px solid ${sel === f.id ? T.amber : T.line}`,
              borderRadius: 7, padding: "16px 18px", cursor: "pointer",
              transition: "border-color 0.12s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{f.title}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: T.bg2, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{f.status}</span>
              </div>
              <div style={{ fontSize: 12, color: T.subtle, lineHeight: 1.55, marginBottom: 10 }}>{f.desc}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{f.recipients}</div>
            </div>
          ))}
        </div>

        {form && (
          <div style={{ background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 7, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.heading }}>{form.title}</div>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 16 }}>×</button>
            </div>
            <SectionLabel>Fields</SectionLabel>
            {form.fields.map((f, i) => (
              <div key={i} style={{ padding: "7px 0", borderBottom: `1px solid ${T.line}`, fontSize: 12, color: T.body, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.muted }}>·</span> {f}
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <SectionLabel>Send to</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {people.filter(p => form.recipients === "Band + Crew" || (form.recipients === "Band" && p.type === "Band")).map(p => (
                  <span key={p.id} style={{ fontSize: 11, padding: "3px 9px", background: T.bg2, borderRadius: 20, color: T.body }}>{p.name}</span>
                ))}
              </div>
            </div>
            <button style={{
              marginTop: 18, width: "100%", padding: "10px", borderRadius: 6,
              background: T.bg2, border: `1px solid ${T.line}`, cursor: "pointer",
              fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.05em",
            }}>
              Send via WhatsApp / Email ↗
            </button>
            <p style={{ fontSize: 10, color: T.muted, marginTop: 8, textAlign: "center" }}>Form sending not yet wired up — coming in next iteration</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADVANCING VIEW ───────────────────────────────────────────────────────────
function AdvancingView({ tourDays, tasks, travel }) {
  const [advTab, setAdvTab] = useState("tasks");
  const [collapsed, setCollapsed] = useState({});
  const openTasks = tasks.filter(t => t.status !== "Done");
  const booked    = travel.filter(t => t.ref || t.status === "Booked" || t.status === "Ticketed");
  const pending   = travel.filter(t => !t.ref && t.status !== "Booked" && t.status !== "Ticketed");

  const toggleGroup = key => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  const grouped = {};
  GROUP_ORDER.forEach(g => { grouped[g] = {}; });
  openTasks.forEach(t => {
    const cat = t.category || "Admin";
    const grp = CAT_GROUP[cat] ? cat : "Admin";
    const prefix = taskPrefix(t.task);
    if (!grouped[grp][prefix]) grouped[grp][prefix] = [];
    grouped[grp][prefix].push(t);
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "24px 28px 0", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: 0 }}>Advancing</h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "#1e1a0a", color: T.amber, borderRadius: 3, letterSpacing: "0.08em", border: `1px solid ${T.amberBdr}` }}>PRIVATE</span>
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 12 }}>
          {[["tasks", `Tasks (${openTasks.length} open)`], ["travel", `Travel (${pending.length} pending)`]].map(([id, label]) => (
            <button key={id} onClick={() => setAdvTab(id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px 16px",
              fontSize: 11, fontWeight: advTab === id ? 700 : 400,
              color: advTab === id ? T.amber : T.muted,
              borderBottom: advTab === id ? `2px solid ${T.amber}` : "2px solid transparent",
              letterSpacing: "0.07em", textTransform: "uppercase",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        {advTab === "tasks" && GROUP_ORDER.map(groupName => {
          const prefixMap = grouped[groupName];
          if (!Object.keys(prefixMap).length) return null;
          const groupCfg = CAT_GROUP[groupName];
          const totalInGroup = Object.values(prefixMap).flat().length;

          return (
            <div key={groupName} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, color: groupCfg.color, textTransform: "uppercase",
                letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8,
                paddingBottom: 6, borderBottom: `1px solid ${T.line}`,
                display: "flex", justifyContent: "space-between",
              }}>
                <span>{groupName}</span>
                <span style={{ color: T.muted }}>{totalInGroup}</span>
              </div>

              {Object.entries(prefixMap).map(([prefix, items]) => {
                const isCollapsible = items.length > 1;
                const key = `${groupName}:${prefix}`;
                const isOpen = !collapsed[key];

                return (
                  <div key={prefix} style={{ marginBottom: 4 }}>
                    {isCollapsible ? (
                      <>
                        <div onClick={() => toggleGroup(key)} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                          background: T.bg1, borderRadius: isOpen ? "5px 5px 0 0" : 5,
                          cursor: "pointer", border: `1px solid ${T.line}`,
                          borderLeft: `3px solid ${groupCfg.color}`,
                        }}>
                          <span style={{ fontSize: 10, color: T.muted, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.12s", display: "inline-block", flexShrink: 0 }}>▶</span>
                          <span style={{ fontSize: 13, color: T.body, fontWeight: 600, flex: 1 }}>{prefix}</span>
                          <span style={{ fontSize: 11, color: T.muted }}>{items.length} people</span>
                        </div>
                        {isOpen && (
                          <div style={{ background: T.bg2, border: `1px solid ${T.line}`, borderTop: "none", borderRadius: "0 0 5px 5px", padding: "4px 0" }}>
                            {items.map(t => {
                              const suffix = t.task.includes(" — ") ? t.task.split(" — ").slice(1).join(" — ") : t.task;
                              const day = t.dayId ? tourDays.find(d => d.id === t.dayId) : null;
                              const c = day ? (CITY[day.city] || CITY.Adelaide) : null;
                              return (
                                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 32px" }}>
                                  <StatusDot status={t.status} />
                                  <span style={{ fontSize: 12, color: t.status === "Done" ? T.muted : T.body, flex: 1 }}>{suffix}</span>
                                  {day && c && <span style={{ fontSize: 11, color: c.accent, display: "flex", alignItems: "center", gap: 3 }}><Dot city={day.city} size={5} />{day.city}</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      items.map(t => {
                        const day = t.dayId ? tourDays.find(d => d.id === t.dayId) : null;
                        const c = day ? (CITY[day.city] || CITY.Adelaide) : null;
                        return (
                          <div key={t.id} style={{
                            display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px",
                            background: T.bg1, borderRadius: 5, marginBottom: 4,
                            border: `1px solid ${T.line}`, borderLeft: `3px solid ${groupCfg.color}`,
                          }}>
                            <StatusDot status={t.status} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: T.body, fontWeight: 500 }}>{t.task}</div>
                              {t.notes && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{t.notes}</div>}
                            </div>
                            {day && c && <span style={{ fontSize: 11, color: c.accent, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Dot city={day.city} size={6} />{day.city}</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {advTab === "travel" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <SectionLabel>Booked — {booked.length}</SectionLabel>
              {booked.map(t => <TravelLeg key={t.id} t={t} />)}
            </div>
            <div>
              <SectionLabel>Pending — {pending.length}</SectionLabel>
              {pending.map(t => <TravelLeg key={t.id} t={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TravelLeg({ t }) {
  const fc = cityOf(t.from);
  const tc = cityOf(t.to);
  return (
    <div style={{ background: T.bg1, borderRadius: 6, padding: "10px 12px", marginBottom: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.heading, marginBottom: 5 }}>{t.passengers.join(", ")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ color: fc ? (CITY[fc] || {accent: T.muted}).accent : T.muted }}>{t.from}</span>
        <span style={{ color: T.muted }}>→</span>
        <span style={{ color: tc ? (CITY[tc] || {accent: T.muted}).accent : T.muted }}>{t.to}</span>
        {(t.dep || t.arr) && <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>{t.dep}{t.arr ? ` – ${t.arr}` : ""}</span>}
      </div>
      {t.flightNo && <div style={{ fontFamily: "monospace", fontSize: 11, color: T.blue, marginTop: 4 }}>{t.flightNo}{t.ref ? ` · ${t.ref}` : ""}</div>}
      {t.date && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{fmtDate(t.date)}</div>}
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "calendar",   icon: "◈", label: "Calendar"  },
  { id: "venues",     icon: "⌖", label: "Venues"    },
  { id: "packlist",   icon: "☰", label: "Packlist"  },
  { id: "backline",   icon: "◎", label: "Backline"  },
  { id: "forms",      icon: "◻", label: "Forms"     },
];

const ADV_NAV = { id: "advancing", icon: "⬡", label: "Advancing" };

function Sidebar({ active, onNav, advancing }) {
  const items = advancing ? [...NAV_ITEMS, ADV_NAV] : NAV_ITEMS;
  return (
    <div style={{
      width: 200, flexShrink: 0, background: T.bg1, borderRight: `1px solid ${T.line}`,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: T.white, letterSpacing: "-0.02em", lineHeight: 1 }}>Bad Dreems</div>
        <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", letterSpacing: "0.16em", marginTop: 5, fontWeight: 700 }}>TourBook</div>
      </div>

      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {items.map(item => {
          const isAdv = item.id === "advancing";
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: isActive ? (isAdv ? T.amberBg : T.bg2) : "transparent",
              color: isActive ? (isAdv ? T.amber : T.heading) : T.subtle,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              marginBottom: 2, textAlign: "left",
              transition: "background 0.1s, color 0.1s",
              borderLeft: isActive && isAdv ? `2px solid ${T.amber}` : "2px solid transparent",
            }}>
              <span style={{ fontSize: 14, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
              {isAdv && <span style={{ marginLeft: "auto", fontSize: 8, color: T.amber, fontWeight: 800, letterSpacing: "0.08em" }}>ADV</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.line}`, fontSize: 10, color: T.muted }}>
        <div style={{ fontWeight: 700, color: T.subtle, marginBottom: 2 }}>Ultra Dundee</div>
        <div>Apr 9 – May 9, 2026</div>
        <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(CITY).map(([city, c]) => (
            <span key={city} style={{ display: "flex", alignItems: "center", gap: 3, color: c.accent, fontSize: 9 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.accent, display: "inline-block" }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const advancing               = isAdvancing();
  const [page, setPage]         = useState(advancing ? "advancing" : "calendar");
  const [selDay, setSelDay]     = useState(null);
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
      setTourDays(days.map(mapTourDay).sort((a, b) => (a.date || "").localeCompare(b.date || "")));
      setPeople(ppl.map(mapPerson));
      setTravel(trv.map(mapTravel));
      setTasks(tsk.map(mapTask));
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const handleSelectDay = day => { setSelDay(day); };

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: T.white }}>Bad Dreems</div>
      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.14em" }}>Loading tour data…</div>
    </div>
  );

  if (error) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.red, fontFamily: "monospace", fontSize: 13 }}>
      error: {error}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.body,
      fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
      display: "flex",
    }}>
      <Sidebar active={page} onNav={p => { setPage(p); setSelDay(null); }} advancing={advancing} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: "100vh" }}>
        {page === "calendar" && (
          <>
            <CalendarView tourDays={tourDays} onSelectDay={handleSelectDay} />
            {selDay && <DayDetail day={selDay} tasks={tasks} travel={travel} onClose={() => setSelDay(null)} />}
          </>
        )}
        {page === "venues"    && <VenuesView tourDays={tourDays} />}
        {page === "packlist"  && <PacklistView />}
        {page === "backline"  && <BacklineView />}
        {page === "forms"     && <FormsView people={people} />}
        {page === "advancing" && advancing && <AdvancingView tourDays={tourDays} tasks={tasks} travel={travel} />}
      </div>
    </div>
  );
}
