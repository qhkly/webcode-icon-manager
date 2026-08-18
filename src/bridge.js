(function () {
  const tauriInvoke = window.__TAURI__?.core?.invoke;

  // Fallback settings for browser preview mode
  const fallbackSettings = {
    base_dir: "/home/ubuntu/projects/智能体/webcode",
    full_bleed: true,
  };

  // Fallback projects for browser preview mode
  const fallbackProjects = [
    {
      name: "webclaw-launcher-tauri",
      path: "/home/ubuntu/projects/智能体/webcode/webclaw-launcher-tauri",
      tauri_dir: "src-tauri",
      icon_path: "src-tauri/icons/icon.png",
      icon_data_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23444' rx='16'/%3E%3Ctext x='64' y='80' text-anchor='middle' fill='white' font-size='48'%3E🚀%3C/text%3E%3C/svg%3E",
      description: "Cross-platform desktop launcher",
      version: "v0.1.0",
      icon_files: ["icon.png", "icon.icns", "icon.ico"],
    },
    {
      name: "webcode-git-manager",
      path: "/home/ubuntu/projects/智能体/webcode/webcode-git-manager",
      tauri_dir: "src-tauri",
      icon_path: "src-tauri/icons/icon.png",
      icon_data_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23555' rx='16'/%3E%3Ctext x='64' y='80' text-anchor='middle' fill='white' font-size='48'%3E📦%3C/text%3E%3C/svg%3E",
      description: "Local Git repository manager",
      version: "v1.0.0",
      icon_files: ["32x32.png", "128x128.png", "icon.icns", "icon.ico"],
    },
  ];

  // Core invoke function with fallback support
  function invoke(command, args) {
    if (!tauriInvoke) {
      // Browser preview mode fallbacks
      if (command === "icon_load_settings") return Promise.resolve(fallbackSettings);
      if (command === "icon_save_settings") return Promise.resolve();
      if (command === "icon_scan_projects") return Promise.resolve(fallbackProjects);
      if (command === "icon_replace_icon") {
        return Promise.resolve({
          success: true,
          output: "Browser preview mode: icon replacement simulated",
        });
      }
      if (command === "icon_cargo_clean") {
        return Promise.resolve({
          success: true,
          output: "Browser preview mode: cargo clean simulated",
        });
      }
      if (command === "icon_build_project") {
        return Promise.resolve({
          success: true,
          output: "Browser preview mode: build simulated",
        });
      }
      if (command === "icon_debug_project") {
        return Promise.resolve({
          success: true,
          output: "Browser preview mode: debug simulated",
        });
      }

      return Promise.resolve({
        success: false,
        output: "Browser preview mode: command not available",
      });
    }
    return tauriInvoke(command, args);
  }

  // Transform project data from backend to frontend format
  function transformProject(p) {
    return {
      raw: p,
      name: p.name || "",
      path: p.path || "",
      tauriDir: p.tauri_dir || "",
      iconPath: p.icon_path || "",
      icon: p.icon_data_url || "",
      description: p.description || "",
      version: p.version || "",
      iconFiles: p.icon_files || [],
      hasTarget: p.has_target ?? false,
    };
  }

  // Transform operation result
  function transformOpResult(result) {
    return {
      success: result?.success ?? false,
      output: result?.output || "",
      command: result?.command || "",
    };
  }

  // Bridge API - unified command interface
  window.Bridge = {
    // Settings
    loadSettings: () => invoke("icon_load_settings"),
    saveSettings: (settings) => invoke("icon_save_settings", { settings }),

    // Project operations
    scanProjects: async (baseDir) => {
      const projects = await invoke("icon_scan_projects", { baseDir });
      return projects.map(transformProject);
    },

    replaceIcon: (projectPath, tauriDir, iconPath, fullBleed = true) =>
      invoke("icon_replace_icon", { projectPath, tauriDir, iconPath, fullBleed }).then(transformOpResult),

    cargoClean: (projectPath, tauriDir) =>
      invoke("icon_cargo_clean", { projectPath, tauriDir }).then(transformOpResult),

    buildProject: (projectPath) =>
      invoke("icon_build_project", { projectPath }).then(transformOpResult),

    debugProject: (projectPath) =>
      invoke("icon_debug_project", { projectPath }).then(transformOpResult),

    // Dialog
    openFile: (filters) => {
      if (!window.__TAURI__?.dialog) {
        return Promise.resolve(null); // Browser mode
      }
      return window.__TAURI__.dialog.open({
        multiple: false,
        filters: filters || [{ name: "Images", extensions: ["png", "svg", "jpg", "jpeg"] }],
      });
    },

    selectDirectory: () => {
      if (!window.__TAURI__?.dialog) {
        return Promise.resolve(null); // Browser mode
      }
      return window.__TAURI__.dialog.open({
        directory: true,
        multiple: false,
        title: "Select workspace directory",
      });
    },

    // Event listeners for build output streaming
    listenBuildOutput: (callback) => {
      if (!window.__TAURI__?.event) {
        return () => {};
      }
      let unlistenFn = null;
      window.__TAURI__.event.listen("build_output", (e) => callback(e.payload))
        .then((fn) => { unlistenFn = fn; });
      return () => { if (unlistenFn) unlistenFn(); };
    },
  };

  // Export utility to check if running in Tauri
  window.Bridge.isTauriAvailable = () => !!tauriInvoke;
})();
