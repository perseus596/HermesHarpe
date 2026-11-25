const {
  useState,
  useRef
} = React;
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return {
    r,
    g,
    b
  };
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function normalizeChannel(name) {
  if (!name) return name;
  const n = name.trim().toLowerCase().replace(/s$/, "");
  const map = {
    red: "Reds",
    yellow: "Yellows",
    green: "Greens",
    cyan: "Cyans",
    blue: "Blues",
    magenta: "Magentas",
    white: "Whites",
    neutral: "Neutrals",
    black: "Blacks"
  };
  return map[n] || name;
}
const CHANNEL_COLORS = {
  Reds: "#7a1a1a",
  Yellows: "#6a5800",
  Greens: "#1a5230",
  Cyans: "#0a4858",
  Blues: "#1a2a58",
  Magentas: "#521050",
  Whites: "#b0b4b8",
  Neutrals: "#3a3e42",
  Blacks: "#111"
};

// Unofficial, publicly-circulated approximations of common Pantone Solid Coated
// swatches. Not licensed Pantone data, not spectrally exact - nearest-match only.
const PANTONE_APPROX = [{
  name: "186 C",
  hex: "#C8102E"
}, {
  name: "485 C",
  hex: "#DA291C"
}, {
  name: "1795 C",
  hex: "#D22630"
}, {
  name: "199 C",
  hex: "#D50032"
}, {
  name: "219 C",
  hex: "#CE0058"
}, {
  name: "233 C",
  hex: "#AA0061"
}, {
  name: "2385 C",
  hex: "#CC0066"
}, {
  name: "021 C",
  hex: "#FE5000"
}, {
  name: "1585 C",
  hex: "#FF6720"
}, {
  name: "158 C",
  hex: "#E27425"
}, {
  name: "1495 C",
  hex: "#F2A03D"
}, {
  name: "Yellow C",
  hex: "#FEDD00"
}, {
  name: "116 C",
  hex: "#FFD100"
}, {
  name: "7548 C",
  hex: "#FFC72C"
}, {
  name: "1235 C",
  hex: "#FFB81C"
}, {
  name: "368 C",
  hex: "#78BE21"
}, {
  name: "355 C",
  hex: "#00A651"
}, {
  name: "347 C",
  hex: "#009B48"
}, {
  name: "3298 C",
  hex: "#007A53"
}, {
  name: "3425 C",
  hex: "#00594C"
}, {
  name: "320 C",
  hex: "#00A9CE"
}, {
  name: "321 C",
  hex: "#00778B"
}, {
  name: "3145 C",
  hex: "#007680"
}, {
  name: "2995 C",
  hex: "#00A9E0"
}, {
  name: "300 C",
  hex: "#005EB8"
}, {
  name: "286 C",
  hex: "#0033A0"
}, {
  name: "2935 C",
  hex: "#0072CE"
}, {
  name: "289 C",
  hex: "#002664"
}, {
  name: "Reflex Blue C",
  hex: "#001489"
}, {
  name: "2685 C",
  hex: "#330072"
}, {
  name: "2607 C",
  hex: "#7D3F98"
}, {
  name: "528 C",
  hex: "#93328E"
}, {
  name: "677 C",
  hex: "#B491C8"
}, {
  name: "183 C",
  hex: "#E8A7B7"
}, {
  name: "faded-pink 705 C",
  hex: "#F4C6D7"
}, {
  name: "469 C",
  hex: "#6F4E37"
}, {
  name: "1545 C",
  hex: "#7B3F00"
}, {
  name: "462 C",
  hex: "#4A3728"
}, {
  name: "7527 C",
  hex: "#C7B299"
}, {
  name: "Cool Gray 1 C",
  hex: "#D9D9D6"
}, {
  name: "Cool Gray 5 C",
  hex: "#B1B3B3"
}, {
  name: "Cool Gray 9 C",
  hex: "#75787B"
}, {
  name: "Cool Gray 11 C",
  hex: "#53565A"
}, {
  name: "Black C",
  hex: "#2D2926"
}, {
  name: "White",
  hex: "#FFFFFF"
}];
function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function rgbToLab(r, g, b) {
  const rl = srgbToLinear(r),
    gl = srgbToLinear(g),
    bl = srgbToLinear(b);
  const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
  const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) / 1.0;
  const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x),
    fy = f(y),
    fz = f(z);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}
function labDist(p, q) {
  return Math.sqrt((p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2);
}
function nearestPantone(r, g, b) {
  const target = rgbToLab(r, g, b);
  let best = null,
    bestD = Infinity;
  for (const p of PANTONE_APPROX) {
    const c = hexToRgb(p.hex);
    const d = labDist(target, rgbToLab(c.r, c.g, c.b));
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}
function PantoneTag({
  r,
  g,
  b
}) {
  const match = nearestPantone(r, g, b);
  if (!match) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#8a8f96",
      marginTop: 6
    }
  }, "≈ PANTONE ", match.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.65
    }
  }, "(approx, unofficial)"));
}
function ChannelBadge({
  name,
  suspect
}) {
  const norm = normalizeChannel(name);
  const bg = CHANNEL_COLORS[norm] || "#333";
  const textColor = norm === "Whites" ? "#111" : "#fff";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      color: textColor,
      padding: "6px 14px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      border: suspect ? "1px solid #7ac8ff" : "1px solid rgba(255,255,255,0.15)"
    }
  }, norm.toUpperCase()), suspect && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      background: "rgba(90,176,255,0.15)",
      color: "#7ac8ff",
      padding: "3px 8px",
      borderRadius: 8,
      letterSpacing: "0.1em",
      fontWeight: 600
    }
  }, "PRIMARY"));
}
function Panel({
  children,
  style,
  glow,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: "#1c1c1e",
      border: glow ? "1px solid rgba(100,180,255,0.45)" : "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "14px 16px",
      marginBottom: 10,
      ...style
    }
  }, children);
}
function Label({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: "#8a8f96",
      marginBottom: 6,
      display: "block",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, children);
}
function RgbHexRow({
  r,
  g,
  b,
  hex,
  onRgb,
  onHex,
  inputStyle,
  big
}) {
  const sw = rgbToHex(r, g, b);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: big ? 46 : 36,
      height: big ? 46 : 36,
      borderRadius: 6,
      background: sw,
      border: "1px solid rgba(255,255,255,0.18)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flex: 1
    }
  }, [["R", r, v => onRgb(v, g, b)], ["G", g, v => onRgb(r, v, b)], ["B", b, v => onRgb(r, g, v)]].map(([lbl, val, fn]) => /*#__PURE__*/React.createElement("div", {
    key: lbl,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: "#8a8f96",
      fontWeight: 600
    }
  }, lbl), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    min: 0,
    max: 255,
    value: val,
    onChange: e => fn(Math.max(0, Math.min(255, parseInt(e.target.value) || 0))),
    style: {
      ...inputStyle,
      width: 48,
      textAlign: "center",
      padding: "6px 2px",
      fontSize: 14,
      fontWeight: 600
    }
  })))), /*#__PURE__*/React.createElement("input", {
    value: hex,
    onChange: e => onHex(e.target.value),
    maxLength: 7,
    style: {
      ...inputStyle,
      width: 80,
      padding: "6px 8px",
      fontSize: 12,
      fontFamily: "monospace"
    },
    placeholder: "#hex"
  }));
}
function App() {
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);
  const [hex, setHex] = useState("#000000");
  const [useTarget, setUseTarget] = useState(false);
  const [tr, setTr] = useState(180);
  const [tg, setTg] = useState(180);
  const [tb, setTb] = useState(190);
  const [thex, setThex] = useState("#b4b4be");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState("relative");
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [library, setLibrary] = useState([]);
  const [libName, setLibName] = useState("");
  const [tab, setTab] = useState("advisor");
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("sca_api_key") || "";
    } catch (e) {
      return "";
    }
  });
  const [photoSrc, setPhotoSrc] = useState(null);
  const [calibrate, setCalibrate] = useState(false);
  const [refType, setRefType] = useState("white");
  const [refPoint, setRefPoint] = useState(null);
  const [sampledRaw, setSampledRaw] = useState(null);
  const [sampledCorrected, setSampledCorrected] = useState(null);
  const resultRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  function syncFromRgb(nr, ng, nb) {
    setR(nr);
    setG(ng);
    setB(nb);
    setHex(rgbToHex(nr, ng, nb));
  }
  function syncFromHex(h) {
    setHex(h);
    const c = hexToRgb(h);
    if (c) {
      setR(c.r);
      setG(c.g);
      setB(c.b);
    }
  }
  function syncTargetRgb(nr, ng, nb) {
    setTr(nr);
    setTg(ng);
    setTb(nb);
    setThex(rgbToHex(nr, ng, nb));
  }
  function syncTargetHex(h) {
    setThex(h);
    const c = hexToRgb(h);
    if (c) {
      setTr(c.r);
      setTg(c.g);
      setTb(c.b);
    }
  }
  function onApiKeyChange(v) {
    setApiKey(v);
    try {
      localStorage.setItem("sca_api_key", v);
    } catch (e) {}
  }
  function resetPhotoSample() {
    setRefPoint(null);
    setSampledRaw(null);
    setSampledCorrected(null);
  }
  function onPhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoSrc(reader.result);
      resetPhotoSample();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function onPhotoImgLoad(e) {
    const img = e.target;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxW = 460;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  function onCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(canvas.width - 1, Math.max(0, Math.round((e.clientX - rect.left) * (canvas.width / rect.width))));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.round((e.clientY - rect.top) * (canvas.height / rect.height))));
    const data = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
    const px = {
      r: data[0],
      g: data[1],
      b: data[2]
    };
    if (calibrate && !refPoint) {
      setRefPoint(px);
      return;
    }
    setSampledRaw(px);
    if (calibrate && refPoint) {
      const targetVal = refType === "white" ? 255 : 128;
      const corrected = {
        r: Math.max(0, Math.min(255, Math.round(px.r * (refPoint.r > 0 ? targetVal / refPoint.r : 1)))),
        g: Math.max(0, Math.min(255, Math.round(px.g * (refPoint.g > 0 ? targetVal / refPoint.g : 1)))),
        b: Math.max(0, Math.min(255, Math.round(px.b * (refPoint.b > 0 ? targetVal / refPoint.b : 1))))
      };
      setSampledCorrected(corrected);
    } else {
      setSampledCorrected(null);
    }
  }
  async function analyze() {
    if (!goal.trim() && !useTarget) return;
    if (!apiKey.trim()) {
      setResult({
        error: "Add your Anthropic API key above first."
      });
      return;
    }
    setLoading(true);
    setResult(null);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    const colorSwatch = rgbToHex(r, g, b);
    const targetLine = useTarget ? `TARGET COLOR: RGB(${tr},${tg},${tb}) / ${rgbToHex(tr, tg, tb)} — calculate the moves needed to shift the input color toward this target.` : "";
    const goalLine = goal.trim() ? `GOAL: "${goal}"` : "GOAL: shift the input color toward the target color.";
    const prompt = `You are a professional Photoshop color correction expert specializing in Selective Color and Curves adjustments. The user is a professional retoucher working in RGB mode.

INPUT COLOR: RGB(${r},${g},${b}) / ${colorSwatch}
${targetLine}
MODE: Photoshop Selective Color — ${mode.toUpperCase()} mode
${goalLine}

Respond ONLY in this exact JSON format, no markdown, no extra text:
{
  "primaryChannel":"channel name",
  "primaryNote":"one sentence why this is the main channel",
  "channels":[{"name":"Reds/Yellows/Greens/Cyans/Blues/Magentas/Whites/Neutrals/Blacks","suspect":true,"sliders":[{"name":"Cyan","direction":"+","reason":"one-line why"},{"name":"Magenta","direction":"-","reason":"one-line why"}],"skipSliders":["Yellow","Black"]}],
  "conflicts":["warning"],
  "curvesNote":"curves advice or empty string",
  "modeNote":"one sentence about ${mode} mode effect"
}
Use exactly these plural channel names: Reds, Yellows, Greens, Cyans, Blues, Magentas, Whites, Neutrals, Blacks. Only include channels and sliders that need adjustment. Be direct and practical.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: prompt
          }]
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const entry = {
        id: Date.now(),
        rgb: {
          r,
          g,
          b
        },
        hex: colorSwatch,
        target: useTarget ? {
          r: tr,
          g: tg,
          b: tb,
          hex: rgbToHex(tr, tg, tb)
        } : null,
        goal,
        mode,
        result: parsed
      };
      setResult(parsed);
      setHistory(h => [entry, ...h].slice(0, 20));
      setTimeout(() => resultRef.current?.scrollIntoView({
        behavior: "smooth"
      }), 100);
    } catch (e) {
      setResult({
        error: `Analysis failed: ${e.message || "check your API key and connection"}`
      });
    }
    clearInterval(timerRef.current);
    setLoading(false);
  }
  function saveToLibrary() {
    if (!result || !libName.trim()) return;
    const entry = {
      id: Date.now(),
      name: libName.trim(),
      rgb: {
        r,
        g,
        b
      },
      hex: rgbToHex(r, g, b),
      target: useTarget ? {
        r: tr,
        g: tg,
        b: tb,
        hex: rgbToHex(tr, tg, tb)
      } : null,
      goal,
      mode,
      result
    };
    setLibrary(l => [entry, ...l]);
    setLibName("");
  }
  function loadEntry(e) {
    syncFromRgb(e.rgb.r, e.rgb.g, e.rgb.b);
    if (e.target) {
      setUseTarget(true);
      syncTargetRgb(e.target.r, e.target.g, e.target.b);
    } else setUseTarget(false);
    setGoal(e.goal);
    setMode(e.mode);
    setResult(e.result);
    setTab("advisor");
  }
  function copyResult() {
    if (!result) return;
    let txt = `Selective Color Advisor\nRGB(${r},${g},${b}) | Mode: ${mode}\n`;
    if (useTarget) txt += `Target: RGB(${tr},${tg},${tb})\n`;
    txt += `Goal: ${goal}\n\n`;
    result.channels?.forEach(ch => {
      txt += `${ch.suspect ? "* " : ""}${normalizeChannel(ch.name)}:\n`;
      ch.sliders?.forEach(s => {
        txt += `  ${s.name}: ${s.direction} - ${s.reason}\n`;
      });
    });
    if (result.conflicts?.length) txt += `\nWarning: ${result.conflicts.join("\n")}\n`;
    if (result.curvesNote) txt += `\nCurves: ${result.curvesNote}\n`;
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const pageBg = dark ? "#2a2a2a" : "#707070";
  const textMain = "#e4e6e9";
  const textSec = "#9aa0a8";
  const textTer = "#6a6f76";
  const divider = "rgba(255,255,255,0.07)";
  const accentColor = "#90c8ff";
  const inputStyle = {
    background: "#111113",
    border: "1px solid rgba(255,255,255,0.1)",
    color: textMain,
    borderRadius: 5,
    fontFamily: "system-ui,sans-serif",
    outline: "none"
  };
  const tabBtn = (id, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setTab(id),
    style: {
      flex: 1,
      padding: "10px 0",
      fontSize: 11,
      fontWeight: tab === id ? 700 : 400,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      background: tab === id ? "#1c1c1e" : "transparent",
      color: tab === id ? accentColor : textSec,
      border: "none",
      borderBottom: tab === id ? `2px solid ${accentColor}` : "2px solid transparent",
      cursor: "pointer",
      fontFamily: "system-ui,sans-serif"
    }
  }, label, id === "library" && library.length > 0 ? ` (${library.length})` : "");
  const hasKey = apiKey.trim().length > 0;
  const canAnalyze = (goal.trim() || useTarget) && hasKey;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      margin: "-1rem 0",
      boxSizing: "border-box",
      fontFamily: "system-ui,sans-serif",
      backgroundColor: pageBg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 14px 40px",
      maxWidth: 520,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 0 14px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      letterSpacing: "0.3em",
      color: textSec,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Photoshop Tool"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "0.14em",
      color: textMain,
      textTransform: "uppercase"
    }
  }, "Selective Color Advisor"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDark(d => !d),
    style: {
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: textSec,
      borderRadius: 12,
      padding: "5px 12px",
      fontSize: 9,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      cursor: "pointer"
    }
  }, dark ? "Light" : "Dark"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginBottom: 12,
      borderBottom: `1px solid ${divider}`
    }
  }, tabBtn("advisor", "Advisor"), tabBtn("history", "History"), tabBtn("library", "Library")), tab === "advisor" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement(Label, null, "Anthropic API key"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: apiKey,
    onChange: e => onApiKeyChange(e.target.value),
    placeholder: "sk-ant-...",
    style: {
      ...inputStyle,
      width: "100%",
      boxSizing: "border-box",
      padding: "9px 12px",
      fontSize: 12,
      fontFamily: "monospace"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: textTer,
      margin: "8px 0 0",
      lineHeight: 1.5
    }
  }, "Stored only in this browser and sent directly to Anthropic when you click Analyze. Get a key at", " ", /*#__PURE__*/React.createElement("a", {
    href: "https://console.anthropic.com/settings/keys",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: accentColor
    }
  }, "console.anthropic.com"), ".")), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement(Label, null, "Input color"), /*#__PURE__*/React.createElement(RgbHexRow, {
    r: r,
    g: g,
    b: b,
    hex: hex,
    onRgb: syncFromRgb,
    onHex: syncFromHex,
    inputStyle: inputStyle,
    big: true
  }), /*#__PURE__*/React.createElement(PantoneTag, {
    r: r,
    g: g,
    b: b
  })), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: useTarget ? 12 : 0
    }
  }, /*#__PURE__*/React.createElement(Label, null, "Target color (optional)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setUseTarget(t => !t),
    style: {
      width: 38,
      height: 20,
      borderRadius: 10,
      position: "relative",
      cursor: "pointer",
      border: "none",
      background: useTarget ? "#3a78dc" : "rgba(255,255,255,0.15)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: useTarget ? 19 : 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      background: "#fff"
    }
  }))), useTarget && /*#__PURE__*/React.createElement(RgbHexRow, {
    r: tr,
    g: tg,
    b: tb,
    hex: thex,
    onRgb: syncTargetRgb,
    onHex: syncTargetHex,
    inputStyle: inputStyle
  }), useTarget && /*#__PURE__*/React.createElement(PantoneTag, {
    r: tr,
    g: tg,
    b: tb
  })), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement(Label, null, "Sample color from a photo"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    onChange: onPhotoSelected,
    style: {
      display: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileInputRef.current?.click(),
    style: {
      ...inputStyle,
      padding: "9px 16px",
      fontSize: 11,
      cursor: "pointer"
    }
  }, photoSrc ? "Retake / choose another photo" : "Take or upload photo"), photoSrc && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: textSec
    }
  }, "Calibrate with a reference card"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCalibrate(c => !c);
      resetPhotoSample();
    },
    style: {
      width: 38,
      height: 20,
      borderRadius: 10,
      position: "relative",
      cursor: "pointer",
      border: "none",
      background: calibrate ? "#3a78dc" : "rgba(255,255,255,0.15)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: calibrate ? 19 : 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      background: "#fff"
    }
  }))), calibrate && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 10
    }
  }, ["white", "gray"].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => {
      setRefType(t);
      resetPhotoSample();
    },
    style: {
      flex: 1,
      padding: "7px 0",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontWeight: refType === t ? 700 : 400,
      background: refType === t ? "#2a5aa8" : "rgba(255,255,255,0.07)",
      color: refType === t ? accentColor : textSec,
      border: refType === t ? "1px solid #4a90e0" : "1px solid rgba(255,255,255,0.12)",
      borderRadius: 5,
      cursor: "pointer"
    }
  }, t === "white" ? "White card (255)" : "Gray card (128)"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: textSec,
      margin: "0 0 8px",
      lineHeight: 1.5
    }
  }, calibrate && !refPoint ? `Tap the ${refType} reference card in the photo first, like framing a dollar bill for scale.` : "Tap anywhere on the photo to sample that color."), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    onClick: onCanvasClick,
    style: {
      maxWidth: "100%",
      width: "100%",
      borderRadius: 6,
      cursor: "crosshair",
      display: "block",
      border: "1px solid rgba(255,255,255,0.12)"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: photoSrc,
    onLoad: onPhotoImgLoad,
    style: {
      display: "none"
    },
    alt: ""
  }), calibrate && refPoint && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 4,
      background: rgbToHex(refPoint.r, refPoint.g, refPoint.b),
      border: "1px solid rgba(255,255,255,0.18)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: textSec
    }
  }, "Reference sampled. Now tap your target color."), /*#__PURE__*/React.createElement("button", {
    onClick: resetPhotoSample,
    style: {
      ...inputStyle,
      padding: "4px 10px",
      fontSize: 10,
      cursor: "pointer",
      marginLeft: "auto"
    }
  }, "Reset")), sampledRaw && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, calibrate && sampledCorrected ? "Raw sample" : "Sampled color"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 5,
      background: rgbToHex(sampledRaw.r, sampledRaw.g, sampledRaw.b),
      border: "1px solid rgba(255,255,255,0.18)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: textSec,
      fontFamily: "monospace"
    }
  }, rgbToHex(sampledRaw.r, sampledRaw.g, sampledRaw.b)))), calibrate && sampledCorrected && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "Corrected"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 5,
      background: rgbToHex(sampledCorrected.r, sampledCorrected.g, sampledCorrected.b),
      border: "1px solid #7ac8ff"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: accentColor,
      fontFamily: "monospace"
    }
  }, rgbToHex(sampledCorrected.r, sampledCorrected.g, sampledCorrected.b))))), /*#__PURE__*/React.createElement(PantoneTag, {
    r: (sampledCorrected || sampledRaw).r,
    g: (sampledCorrected || sampledRaw).g,
    b: (sampledCorrected || sampledRaw).b
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const c = sampledCorrected || sampledRaw;
      syncFromRgb(c.r, c.g, c.b);
    },
    style: {
      ...inputStyle,
      flex: 1,
      padding: "8px 0",
      fontSize: 11,
      cursor: "pointer"
    }
  }, "Use as input color"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const c = sampledCorrected || sampledRaw;
      setUseTarget(true);
      syncTargetRgb(c.r, c.g, c.b);
    },
    style: {
      ...inputStyle,
      flex: 1,
      padding: "8px 0",
      fontSize: 11,
      cursor: "pointer"
    }
  }, "Use as target color"))))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement(Label, null, "Photoshop mode"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, ["relative", "absolute"].map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    onClick: () => setMode(m),
    style: {
      flex: 1,
      padding: "9px 0",
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontWeight: mode === m ? 700 : 400,
      background: mode === m ? "#2a5aa8" : "rgba(255,255,255,0.07)",
      color: mode === m ? accentColor : textSec,
      border: mode === m ? "1px solid #4a90e0" : "1px solid rgba(255,255,255,0.12)",
      borderRadius: 5,
      cursor: "pointer"
    }
  }, m)))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement(Label, null, "What do you want to do?"), /*#__PURE__*/React.createElement("textarea", {
    value: goal,
    onChange: e => setGoal(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        analyze();
      }
    },
    placeholder: useTarget ? "Optional notes..." : "e.g. make it paler, less pink, cooler...",
    style: {
      ...inputStyle,
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 12px",
      fontSize: 13,
      lineHeight: 1.5,
      resize: "vertical",
      minHeight: 64
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: analyze,
    disabled: loading || !canAnalyze,
    style: {
      width: "100%",
      padding: "14px",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      background: loading ? "rgba(255,255,255,0.05)" : "#2a5aa8",
      border: "1px solid #4a90e0",
      color: loading ? textSec : accentColor,
      borderRadius: 7,
      cursor: loading || !canAnalyze ? "not-allowed" : "pointer",
      marginBottom: 14,
      opacity: !canAnalyze ? 0.4 : 1
    }
  }, loading ? `Analyzing... ${elapsed}s` : "Analyze"), !hasKey && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: textTer,
      margin: "-6px 0 14px",
      textAlign: "center"
    }
  }, "Add your Anthropic API key above to enable analysis."), result && /*#__PURE__*/React.createElement("div", {
    ref: resultRef
  }, result.error && /*#__PURE__*/React.createElement(Panel, {
    style: {
      borderColor: "rgba(224,96,96,0.4)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#e06c6c",
      fontSize: 13,
      margin: "0 0 10px"
    }
  }, result.error), /*#__PURE__*/React.createElement("button", {
    onClick: analyze,
    style: {
      ...inputStyle,
      padding: "8px 16px",
      fontSize: 11,
      cursor: "pointer",
      color: accentColor
    }
  }, "Retry")), result.channels?.map((ch, ci) => /*#__PURE__*/React.createElement(Panel, {
    key: ci,
    glow: ch.suspect
  }, /*#__PURE__*/React.createElement(ChannelBadge, {
    name: ch.name,
    suspect: ch.suspect
  }), ch.suspect && result.primaryNote && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: textSec,
      margin: "0 0 10px",
      lineHeight: 1.5
    }
  }, result.primaryNote), ch.sliders?.map((sl, si) => /*#__PURE__*/React.createElement("div", {
    key: si,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 8,
      paddingBottom: 8,
      borderBottom: si < ch.sliders.length - 1 ? `1px solid ${divider}` : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: sl.direction === "+" ? "#4ecf80" : "#e06060",
      minWidth: 16,
      textAlign: "center"
    }
  }, sl.direction), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      minWidth: 56,
      color: textMain
    }
  }, sl.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: textSec,
      lineHeight: 1.5,
      flex: 1
    }
  }, sl.reason))), ch.skipSliders?.length > 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: textTer,
      margin: "6px 0 0"
    }
  }, "Unchanged: ", ch.skipSliders.join(", ")))), result.conflicts?.filter(Boolean).map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "rgba(160,100,0,0.15)",
      border: "1px solid rgba(180,120,0,0.3)",
      borderRadius: 6,
      padding: "9px 12px",
      fontSize: 11,
      color: "#d4a840",
      marginBottom: 8
    }
  }, w)), result.curvesNote && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(30,100,55,0.18)",
      border: "1px solid rgba(50,140,80,0.3)",
      borderRadius: 6,
      padding: "9px 12px",
      fontSize: 11,
      color: "#4ecf80",
      marginBottom: 8
    }
  }, "Curves: ", result.curvesNote), result.modeNote && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 6,
      padding: "9px 12px",
      fontSize: 11,
      color: textSec,
      marginBottom: 8
    }
  }, mode, " mode: ", result.modeNote), !result.error && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: copyResult,
    style: {
      ...inputStyle,
      padding: "9px 16px",
      fontSize: 11,
      cursor: "pointer",
      marginBottom: 10
    }
  }, copied ? "Copied" : "Copy instructions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: libName,
    onChange: e => setLibName(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") saveToLibrary();
    },
    placeholder: "Name this fix to save...",
    style: {
      ...inputStyle,
      flex: 1,
      padding: "9px 12px",
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveToLibrary,
    disabled: !libName.trim(),
    style: {
      ...inputStyle,
      padding: "9px 16px",
      fontSize: 11,
      cursor: libName.trim() ? "pointer" : "not-allowed",
      opacity: libName.trim() ? 1 : 0.4
    }
  }, "Save"))))), tab === "history" && /*#__PURE__*/React.createElement(React.Fragment, null, history.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: textSec,
      padding: "1rem 0"
    }
  }, "No history yet."), history.map(h => /*#__PURE__*/React.createElement(Panel, {
    key: h.id,
    style: {
      cursor: "pointer"
    },
    onClick: () => loadEntry(h)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 5,
      background: h.hex,
      border: "1px solid rgba(255,255,255,0.15)"
    }
  }), h.target && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: textTer
    }
  }, "->"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 5,
      background: h.target.hex,
      border: "1px solid rgba(255,255,255,0.15)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      color: textMain
    }
  }, h.goal || "(target shift)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: textSec
    }
  }, "RGB(", h.rgb.r, ",", h.rgb.g, ",", h.rgb.b, ") - ", h.mode)))))), tab === "library" && /*#__PURE__*/React.createElement(React.Fragment, null, library.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: textSec,
      padding: "1rem 0"
    }
  }, "No saved fixes yet."), library.map(l => /*#__PURE__*/React.createElement(Panel, {
    key: l.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 5,
      background: l.hex,
      border: "1px solid rgba(255,255,255,0.15)"
    }
  }), l.target && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: textTer
    }
  }, "->"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 5,
      background: l.target.hex,
      border: "1px solid rgba(255,255,255,0.15)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: textMain
    }
  }, l.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: textSec
    }
  }, "RGB(", l.rgb.r, ",", l.rgb.g, ",", l.rgb.b, ") - ", l.mode)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => loadEntry(l),
    style: {
      ...inputStyle,
      padding: "6px 10px",
      fontSize: 10,
      cursor: "pointer"
    }
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLibrary(lib => lib.filter(x => x.id !== l.id)),
    style: {
      ...inputStyle,
      padding: "6px 10px",
      fontSize: 10,
      color: "#e06060",
      cursor: "pointer"
    }
  }, "X"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: textSec,
      marginBottom: 6
    }
  }, l.goal), l.result?.channels?.map((ch, ci) => /*#__PURE__*/React.createElement("div", {
    key: ci,
    style: {
      fontSize: 11,
      color: textSec,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: textMain,
      fontWeight: 600
    }
  }, normalizeChannel(ch.name), ":"), " ", ch.sliders?.map(s => `${s.name} ${s.direction}`).join(", "))))))));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
