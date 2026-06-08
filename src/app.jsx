/* global React, ReactDOM, Bridge */
const { useState, useMemo, useRef, useEffect, useCallback } = React;

const I = {
  folder: <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3.1c.4 0 .77.16 1.06.44L9 5.5h4.5A1.5 1.5 0 0 1 15 7v5.5A1.5 1.5 0 0 1 13.5 14h-10A1.5 1.5 0 0 1 2 12.5z" />,
  search: <g><circle cx="7" cy="7" r="4.4" /><path d="m11 11 3 3" /></g>,
  scan: <g><path d="M3 6V4.5A1.5 1.5 0 0 1 4.5 3H6M12 3h1.5A1.5 1.5 0 0 1 15 4.5V6M15 12v1.5a1.5 1.5 0 0 1-1.5 1.5H12M6 15H4.5A1.5 1.5 0 0 1 3 13.5V12" /><path d="M3 9h12" /></g>,
  gear: <g><path d="M3 4.5h2m4 0h6M3 9h8m4 0h0M3 13.5h5m4 0h3" /><circle cx="7" cy="4.5" r="1.8" /><circle cx="13" cy="9" r="1.8" /><circle cx="10" cy="13.5" r="1.8" /></g>,
  sun: <g><circle cx="9" cy="9" r="3" /><path d="M9 1.8v1.6M9 14.6v1.6M16.2 9h-1.6M3.4 9H1.8M14.1 3.9l-1.1 1.1M5 13l-1.1 1.1M14.1 14.1 13 13M5 5 3.9 3.9" /></g>,
  moon: <path d="M14.5 10.2A5.8 5.8 0 0 1 7.8 3.5a5.8 5.8 0 1 0 6.7 6.7z" />,
  grid: <g><rect x="2.5" y="2.5" width="5" height="5" rx="1.2" /><rect x="10.5" y="2.5" width="5" height="5" rx="1.2" /><rect x="2.5" y="10.5" width="5" height="5" rx="1.2" /><rect x="10.5" y="10.5" width="5" height="5" rx="1.2" /></g>,
  rows: <g><rect x="2.5" y="3" width="13" height="3.4" rx="1.2" /><rect x="2.5" y="7.8" width="13" height="3.4" rx="1.2" /><rect x="2.5" y="12.6" width="13" height="2" rx="1" /></g>,
  chev: <path d="m4.5 7 4.5 4 4.5-4" />,
  swap: <g><path d="M3 6h8l-2-2M15 12H7l2 2" /></g>,
  broom: <g><path d="M11 2 9 7M13 4 8 9M6 14l3-5 2.5 2.5-5 3z" /><path d="M5.5 11 3 14.5" /></g>,
  box: <g><path d="M9 2 3 5v6l6 3 6-3V5z" /><path d="M3 5l6 3 6-3M9 8v6" /></g>,
  bug: <g><rect x="6" y="6" width="6" height="7" rx="3" /><path d="M9 3v3M4 8h2M12 8h2M4 12h2M12 12h2M6 5 4.5 3.5M12 5l1.5-1.5" /></g>,
  copy: <g><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M3.5 10.5V3.8A1.3 1.3 0 0 1 4.8 2.5h6.7" /></g>,
  trash: <g><path d="M3.5 5h9M7 5V3.5h2V5M4.5 5l.6 8.2A1 1 0 0 0 6.1 14h3.8a1 1 0 0 0 1-0.8L11.5 5" /></g>,
  expand: <path d="m4.5 11 4.5-4 4.5 4" />,
  collapse: <path d="m4.5 7 4.5 4 4.5-4" />,
  check: <path d="m3.5 8.5 3 3 6-6.5" />,
  globe: <g><circle cx="9" cy="9" r="6.3" /><path d="M2.7 9h12.6M9 2.7c1.8 1.8 1.8 10.8 0 12.6M9 2.7c-1.8 1.8-1.8 10.8 0 12.6" /></g>,
};

const Svg = ({ d, w = 17, sw = 1.5, fill }) => (
  <svg
    width={w}
    height={w}
    viewBox="0 0 18 18"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

const EXTRA = {
  zh: {
    search: "搜索项目...",
    all: "全部",
    withTarget: "有 target",
    noTargetFilter: "缺失",
    projects: "项目",
    missing: "缺失 target",
    files: "个图标文件",
    noMatch: "没有匹配的项目",
    noProjectsHint: "请扫描工作区或在设置里选择目录",
    activityLog: "操作日志",
    entries: "条",
    hasTarget: "target 存在",
    noTarget: "无 target",
    iconDir: "src-tauri/icons",
    appearance: "外观设置",
    selectDir: "选择目录",
    lightTheme: "亮色模式",
    darkTheme: "暗色模式",
  },
  en: {
    search: "Search projects...",
    all: "All",
    withTarget: "Has target",
    noTargetFilter: "Missing",
    projects: "projects",
    missing: "missing target",
    files: "icon files",
    noMatch: "No matching projects",
    noProjectsHint: "Scan the workspace or choose a directory in Settings",
    activityLog: "Activity log",
    entries: "entries",
    hasTarget: "target exists",
    noTarget: "no target",
    iconDir: "src-tauri/icons",
    appearance: "Appearance",
    selectDir: "Choose",
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
  },
};

function useI18n() {
  const [lang, setLang] = useState(() => window.i18n.getLang());

  useEffect(() => {
    const handler = (e) => setLang(e.detail);
    window.addEventListener("i18n-change", handler);
    return () => window.removeEventListener("i18n-change", handler);
  }, []);

  const t = useCallback((key, ...args) => {
    let text = window.i18n.t(key);
    if (text === key) text = EXTRA[lang]?.[key] || key;
    args.forEach((arg, i) => {
      text = text.replace(`{${i}}`, arg);
    });
    return text;
  }, [lang]);

  const toggleLang = useCallback(() => {
    window.i18n.setLang(lang === "zh" ? "en" : "zh");
  }, [lang]);

  return { lang, t, toggleLang };
}

function shortPath(p) {
  if (!p) return window.i18n.t("dirNotSet");
  const home = String(p).match(/^\/home\/[^/]+/)?.[0] || String(p).match(/^\/Users\/[^/]+/)?.[0];
  return home ? "~" + p.slice(home.length) : p;
}

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function markForName(name) {
  return String(name || "??")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toLowerCase() || "ic";
}

function normalizeProject(project) {
  const name = project.name || "";
  return {
    ...project,
    id: project.path || name,
    versionText: String(project.version || "0.0.0").replace(/^v/i, ""),
    desc: project.description || "",
    files: project.iconFiles || [],
    hue: hashHue(project.path || name || "icon-manager"),
    mark: markForName(name),
  };
}

function AppIcon({ p, size = 64 }) {
  if (p.icon) {
    return (
      <div className="appicon image" style={{ width: size, height: size }}>
        <img src={p.icon} alt="" />
      </div>
    );
  }

  // Generate a vibrant gradient based on the hue
  const h1 = p.hue;
  const h2 = (p.hue + 40) % 360;
  const h3 = (p.hue + 80) % 360;
  const bg = `linear-gradient(135deg, oklch(0.65 0.2 ${h1}), oklch(0.55 0.2 ${h2}), oklch(0.45 0.2 ${h3}))`;

  return (
    <div
      className="appicon"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: bg,
      }}
    >
      <span className="mk">{p.mark}</span>
    </div>
  );
}

const KEY_FILES = new Set(["icon.png", "icon.icns", "icon.ico"]);
function Files({ p, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="files">
      <div className="frow">
        <span className="fcount"><b>{p.files.length}</b> {t("files")}</span>
        <button className={"expander" + (open ? " open" : "")} onClick={() => setOpen(!open)}>
          {open ? t("collapse") : t("expand")} <Svg d={I.chev} w={13} sw={1.7} />
        </button>
      </div>
      {open && (
        <div className="chips">
          {p.files.map((f) => (
            <span key={f} className={"chip" + (KEY_FILES.has(f) ? " key" : "")}>{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ p, t, onAct, selected, onSelect, loading }) {
  return (
    <div className={"card" + (selected ? " sel" : "") + (loading ? " busy" : "")} onClick={() => onSelect(p.id)}>
      <div className="chead">
        <AppIcon p={p} />
        <div className="cmeta">
          <div className="cname">
            <h3 title={p.name}>{p.name}</h3>
            <span className="ver">v{p.versionText}</span>
          </div>
          <p className={"cdesc" + (p.desc ? "" : " empty")}>{p.desc || t("noDescription")}</p>
          <p className="cpath" title={p.path}>{shortPath(p.path)}</p>
        </div>
      </div>
      <Files p={p} t={t} />
      <div className="actions" onClick={(e) => e.stopPropagation()}>
        <button className="act" disabled={loading} onClick={() => onAct(p, "replace")}><Svg d={I.swap} w={14} />{t("replaceIcon")}</button>
        <button className="act" disabled={loading || !p.hasTarget} onClick={() => onAct(p, "clean")}><Svg d={I.broom} w={14} />{t("cleanCache")}</button>
        <button className="act" disabled={loading} onClick={() => onAct(p, "build")}><Svg d={I.box} w={14} />{t("build")}</button>
        <button className="act" disabled={loading} onClick={() => onAct(p, "debug")}><Svg d={I.bug} w={14} />{t("debug")}</button>
      </div>
    </div>
  );
}

function Row({ p, t, onAct, selected, onSelect, loading }) {
  return (
    <div className={"row" + (selected ? " sel" : "") + (loading ? " busy" : "")} onClick={() => onSelect(p.id)}>
      <AppIcon p={p} size={42} />
      <div className="rmeta">
        <div className="rname"><h3 title={p.name}>{p.name}</h3><span className="ver">v{p.versionText}</span></div>
        <div className="rdesc" title={p.desc || t("noDescription")}>{p.desc || t("noDescription")}</div>
      </div>
      <Files p={p} t={t} />
      <div className="ractions" onClick={(e) => e.stopPropagation()}>
        <button className="act" disabled={loading} onClick={() => onAct(p, "replace")} title={t("replaceIcon")}><Svg d={I.swap} w={15} /></button>
        <button className="act" disabled={loading || !p.hasTarget} title={t("cleanCache")} onClick={() => onAct(p, "clean")}><Svg d={I.broom} w={15} /></button>
        <button className="act" disabled={loading} title={t("build")} onClick={() => onAct(p, "build")}><Svg d={I.box} w={15} /></button>
        <button className="act" disabled={loading} title={t("debug")} onClick={() => onAct(p, "debug")}><Svg d={I.bug} w={15} /></button>
      </div>
    </div>
  );
}

function Dock({ log, t, onClear }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);
  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [log, open]);

  const copyLog = async () => {
    const text = log.map((l) => `${l.t} ${l.scope ? "[" + l.scope + "] " : ""}${l.msg}`).join("\n");
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
  };

  return (
    <div className="dock">
      <div className="dockhead">
        <h4><span className="live pulse" />{t("activityLog")}</h4>
        <span className="badgec">{log.length} {t("entries")}</span>
        <div className="docktools">
          {open && (
            <>
              <button className="ghost" onClick={onClear}><Svg d={I.trash} w={13} /><span>{t("clear")}</span></button>
              <button className="ghost" onClick={copyLog}><Svg d={I.copy} w={13} /><span>{t("copy")}</span></button>
            </>
          )}
          <button className="ghost" onClick={() => setOpen(!open)}>
            <Svg d={open ? I.collapse : I.expand} w={13} /><span>{open ? t("collapse") : t("expand")}</span>
          </button>
        </div>
      </div>
      <div className={"logbody scroll" + (open ? "" : " collapsed")} ref={bodyRef}>
        {log.map((l, i) => (
          <div className={"logline " + l.level + (l.scope ? "" : " nosc")} key={i}>
            <span className="ts">{l.t}</span>
            {l.scope && <span className="sc">[{l.scope}]</span>}
            <span className="mg" title={l.msg}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsModal({ open, settings, onClose, onSave, t }) {
  const [draft, setDraft] = useState(settings);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  const selectDirectory = async () => {
    setSelecting(true);
    try {
      const selected = await Bridge.selectDirectory();
      if (selected) setDraft({ ...draft, base_dir: selected });
    } catch (e) {
      console.error(t("selectDirFailed"), e);
    } finally {
      setSelecting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2>{t("settingsTitle")}</h2>
          <p>{t("workspaceDir")}</p>
        </div>
        <div className="fieldrow">
          <input
            value={draft?.base_dir || ""}
            onChange={(e) => setDraft({ ...draft, base_dir: e.target.value })}
            placeholder={t("selectDirPlaceholder")}
          />
          <button className="btn" onClick={selectDirectory} disabled={selecting}>
            <Svg d={I.folder} w={14} />{selecting ? t("selecting") : t("selectDir")}
          </button>
        </div>
        <div className="modalactions">
          <button className="btn" onClick={onClose}>{t("cancel")}</button>
          <button className="btn primary" onClick={() => onSave(draft)}>{t("saveAndRescan")}</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { lang, t, toggleLang } = useI18n();
  const [theme, setTheme] = useState(() => localStorage.getItem("icon-manager.theme") || "light");
  const [view, setView] = useState(() => localStorage.getItem("icon-manager.view") || "grid");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState({ base_dir: "" });
  const [scanning, setScanning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [log, setLog] = useState([]);
  const [loadingPaths, setLoadingPaths] = useState({});
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("icon-manager.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("icon-manager.view", view);
  }, [view]);

  const pushLog = useCallback((level, msg, scope = null) => {
    const time = new Date().toLocaleTimeString("en-CA", { hour12: false });
    setLog((prev) => [{ t: time, level, msg, scope }, ...prev.slice(0, 199)]);
  }, []);

  const doScan = useCallback(async (s = settingsRef.current) => {
    if (!s.base_dir) {
      pushLog("warn", t("pleaseSetWorkspaceDir"));
      setSettingsOpen(true);
      return;
    }

    setScanning(true);
    pushLog("info", t("scanProjectsAt", shortPath(s.base_dir)));
    try {
      const list = await Bridge.scanProjects(s.base_dir);
      const normalized = list.map(normalizeProject);
      setProjects(normalized);
      pushLog("ok", t("scanCompleteFound", normalized.length));
    } catch (e) {
      pushLog("warn", `${t("scanFailedMsg")}: ${e}`);
    } finally {
      setScanning(false);
    }
  }, [pushLog, t]);

  useEffect(() => {
    Bridge.loadSettings()
      .then((s) => {
        setSettings(s);
        settingsRef.current = s;
        if (s.base_dir) doScan(s);
      })
      .catch((e) => pushLog("warn", `${t("logFailedToLoad")}: ${e}`));
  }, [doScan, pushLog, t]);

  const withLoading = async (project, task) => {
    setLoadingPaths((prev) => ({ ...prev, [project.path]: true }));
    try {
      await task();
    } catch (e) {
      pushLog("warn", `${t("error")}: ${e}`, project.name);
    } finally {
      setLoadingPaths((prev) => {
        const next = { ...prev };
        delete next[project.path];
        return next;
      });
    }
  };

  const replaceIcon = async (project) => {
    const selectedFile = await Bridge.openFile();
    if (!selectedFile) {
      pushLog("info", t("noFileSelected"), project.name);
      return;
    }

    await withLoading(project, async () => {
      pushLog("info", t("replacingIconFor"), project.name);
      const result = await Bridge.replaceIcon(project.path, project.tauriDir, selectedFile);
      if (result.success) {
        pushLog("ok", t("iconReplaceOk"), project.name);
        await doScan();
      } else {
        pushLog("warn", `${t("iconReplaceFailedFor")}: ${result.output}`, project.name);
      }
    });
  };

  const cargoClean = async (project) => {
    if (!confirm(t("confirmCleanCache", project.name))) return;
    await withLoading(project, async () => {
      pushLog("info", t("cleaningCacheFor"), project.name);
      const result = await Bridge.cargoClean(project.path, project.tauriDir);
      if (result.success) {
        pushLog("ok", t("cacheCleanOk"), project.name);
        setProjects((prev) => prev.map((p) => p.path === project.path ? { ...p, hasTarget: false } : p));
      } else {
        pushLog("warn", `${t("cleanCacheFailedFor")}: ${result.output}`, project.name);
      }
    });
  };

  const buildProject = async (project) => {
    if (!confirm(t("confirmBuild", project.name))) return;
    await withLoading(project, async () => {
      pushLog("info", t("buildInProgress"), project.name);
      const unlisten = Bridge.listenBuildOutput((msg) => pushLog("info", msg, project.name));
      try {
        const result = await Bridge.buildProject(project.path);
        if (result.success) {
          pushLog("ok", t("buildOk"), project.name);
        } else {
          pushLog("warn", `${t("buildFailedFor")}: ${result.output}`, project.name);
        }
      } finally {
        unlisten();
      }
    });
  };

  const debugProject = async (project) => {
    await withLoading(project, async () => {
      pushLog("info", t("debugModeStarted"), project.name);
      const unlisten = Bridge.listenBuildOutput((msg) => pushLog("info", msg, project.name));
      try {
        const result = await Bridge.debugProject(project.path);
        if (result.success) {
          pushLog("ok", t("debugOk"), project.name);
        } else {
          pushLog("warn", `${t("debugFailedFor")}: ${result.output}`, project.name);
        }
      } finally {
        unlisten();
      }
    });
  };

  const onAct = useCallback((project, kind) => {
    if (kind === "replace") replaceIcon(project);
    if (kind === "clean") cargoClean(project);
    if (kind === "build") buildProject(project);
    if (kind === "debug") debugProject(project);
  }, [replaceIcon, cargoClean, buildProject, debugProject]);

  const saveSettings = async (next) => {
    try {
      await Bridge.saveSettings(next);
      setSettings(next);
      settingsRef.current = next;
      setSettingsOpen(false);
      pushLog("ok", t("settingsSaved"));
      await doScan(next);
    } catch (e) {
      pushLog("warn", `${t("saveSettingsFailed")}: ${e}`);
    }
  };

  const normalizedProjects = useMemo(() => projects.map(normalizeProject), [projects]);
  const counts = useMemo(() => ({
    all: normalizedProjects.length,
    ok: normalizedProjects.filter((p) => p.hasTarget).length,
    no: normalizedProjects.filter((p) => !p.hasTarget).length,
  }), [normalizedProjects]);

  const shown = useMemo(() => normalizedProjects.filter((p) => {
    if (filter === "ok" && !p.hasTarget) return false;
    if (filter === "no" && p.hasTarget) return false;
    const haystack = `${p.name} ${p.desc} ${p.path}`.toLowerCase();
    return !q || haystack.includes(q.toLowerCase());
  }), [filter, normalizedProjects, q]);

  return (
    <div className="app">
      <header className="titlebar">
        <div className="traffic"><i className="r" /><i className="y" /><i className="g" /></div>
        <div className="brand">
          <span className="glyph"><Svg d={I.grid} w={18} fill /></span>
          <div><h1>{t("appTitle")} · Icon Manager</h1><p>{t("appSubtitle")}</p></div>
        </div>
        <button className="pathchip" onClick={() => setSettingsOpen(true)} title={settings.base_dir || t("dirNotSet")}>
          <Svg d={I.folder} w={15} />
          <span className="mono">{shortPath(settings.base_dir)}</span>
        </button>
        <div className="tbspacer" />
        <div className="tbtools">
          <button className="iconbtn langbtn" title={lang === "zh" ? t("langToggleToEn") : t("langToggleToZh")} onClick={toggleLang}>
            {lang === "zh" ? "中" : "EN"}
          </button>
          <button className="iconbtn" title={theme === "light" ? t("darkTheme") : t("lightTheme")} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Svg d={theme === "light" ? I.moon : I.sun} w={16} fill={theme === "light"} />
          </button>
          <button className="iconbtn" title={t("settings")} onClick={() => setSettingsOpen(true)}><Svg d={I.gear} w={16} /></button>
          <button className="btn primary" onClick={() => doScan()} disabled={scanning}>
            <Svg d={I.scan} w={15} />{scanning ? t("scanning") : t("scanProjects")}
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="search">
          <Svg d={I.search} w={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} />
        </div>
        <div className="filters">
          {[["all", t("all"), counts.all], ["ok", t("withTarget"), counts.ok], ["no", t("noTargetFilter"), counts.no]].map(([k, label, count]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
              {label} <span className="cnt">{count}</span>
            </button>
          ))}
        </div>
        <div className="tbspacer" />
        <div className="stat"><span className="dotk" /><b>{counts.ok}</b> {t("withTarget")}</div>
        <div className="stat"><span className="dotk muted" /><b>{counts.no}</b> {t("missing")}</div>
        <div className="seg">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} title={t("viewGrid")}><Svg d={I.grid} w={14} fill /></button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} title={t("viewList")}><Svg d={I.rows} w={14} fill /></button>
        </div>
      </div>

      <main className="main scroll">
        {shown.length === 0 ? (
          <div className="empty-state">
            <Svg d={projects.length ? I.search : I.scan} w={48} sw={1} />
            <p>{projects.length ? t("noMatch") : t("noProjects")}</p>
            <span>{settings.base_dir ? t("noProjectsHint") : t("noProjectsHintNoDir")}</span>
          </div>
        ) : view === "grid" ? (
          <div className="grid">
            {shown.map((p) => (
              <Card
                key={p.id}
                p={p}
                t={t}
                onAct={onAct}
                selected={selected === p.id}
                onSelect={setSelected}
                loading={!!loadingPaths[p.path]}
              />
            ))}
          </div>
        ) : (
          <div className="list">
            {shown.map((p) => (
              <Row
                key={p.id}
                p={p}
                t={t}
                onAct={onAct}
                selected={selected === p.id}
                onSelect={setSelected}
                loading={!!loadingPaths[p.path]}
              />
            ))}
          </div>
        )}
      </main>

      <Dock log={log} t={t} onClear={() => setLog([])} />
      <SettingsModal open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} t={t} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
