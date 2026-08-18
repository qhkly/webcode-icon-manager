(window.i18n = {
  zh: {
    // 应用标题
    appTitle: "图标管理器",
    appSubtitle: "Tauri 项目图标管理",

    // 顶部栏
    scanProjects: "扫描项目",
    scanning: "扫描中",
    settings: "设置",
    selectDir: "选择目录",

    // 统计
    total: "总计",
    needAttention: "需关注",
    notSubmitted: "未提交",
    localAhead: "本地领先",
    buildFailed: "构建失败",
    synced: "已同步",

    // 空状态
    scanningDir: "正在扫描...",
    noProjects: "没有找到 Tauri 项目",
    noProjectsHint: "检查工作区目录中是否包含 Tauri 项目",
    noProjectsHintNoDir: "请先在设置中选择工作区目录",

    // 项目卡片
    iconFiles: "图标文件",
    replaceIcon: "更换图标",
    cleanCache: "清理缓存",
    build: "打包",
    debug: "调试",

    // 按钮和操作
    expand: "展开",
    collapse: "收起",
    clear: "清空",
    copy: "拷贝",
    copied: "已复制!",
    save: "保存",
    cancel: "取消",
    saveAndRescan: "保存并重新扫描",

    // 设置
    settingsTitle: "设置",
    settingsSubtitle: "工作区目录",
    workspaceDir: "工作区目录",
    selectDirBtn: "选择目录",
    selecting: "选择中...",
    fullBleedLabel: "macOS 满幅预处理",
    fullBleedHint: "替换前裁掉透明边并铺满画布，避免 macOS 26 自动套底板时露出一圈背景",

    // 日志
    operationLog: "操作日志",
    logCount: "条",
    waiting: "等待操作",

    // 外观设置
    appearance: "外观设置",
    density: "密度",
    densityCompact: "紧凑",
    densityRegular: "标准",
    densityComfy: "宽松",
    view: "视图",
    viewGrid: "网格",
    viewList: "列表",
    accentColor: "主题色",
    showLog: "显示操作日志",

    // 主题模式
    themeSystem: "跟随系统",
    themeDark: "暗色模式",
    themeLight: "亮色模式",
    themeSystemDesc: "跟随系统（点击切换暗色）",
    themeDarkDesc: "暗色模式（点击切换亮色）",
    themeLightDesc: "亮色模式（点击跟随系统）",

    // 消息提示
    noDirSet: "未设置",
    noDirTitle: "请选择工作区目录",
    setDirFirst: "请先点击 📁 按钮选择工作区目录",
    dirSet: "工作区目录已设置",
    scanStart: "开始扫描 Tauri 项目...",
    scanComplete: "扫描完成，找到",
    scanProjectsCount: "个 Tauri 项目",
    scanFailed: "扫描失败",

    // 图标操作
    replacingIcon: "正在替换图标",
    iconReplaceSuccess: "图标替换成功",
    iconReplaceFailed: "图标替换失败",
    noFileSelected: "未选择图标文件",
    cleaningCache: "正在清理缓存",
    cacheCleanSuccess: "缓存清理成功",
    cacheCleanFailed: "缓存清理失败",
    cacheCleanConfirm: "确定要清理",
    cacheCleanConfirmHint: "的编译缓存吗？这将删除 target 目录，下次编译会重新生成。",
    building: "开始构建",
    buildConfirm: "确定要构建",
    buildConfirmHint: "吗？可能需要 5-15 分钟。",
    buildSuccess: "构建完成",
    buildFailed: "构建失败",
    debugStarting: "正在启动调试模式",
    debugSuccess: "调试模式已启动",
    debugFailed: "启动调试失败",

    // 状态
    ok: "成功",
    error: "错误",
    warn: "警告",
    info: "信息",

    // 其他
    dirNotSet: "未设置目录",
    langToggleToEn: "切换到英文",
    langToggleToZh: "切换到中文",
    noDescription: "无描述",
    iconFilesWithCount: "图标文件 ({0})",
    copyFail: "拷贝失败",
    selectDirFailed: "选择目录失败",
    logFailedToLoad: "加载设置失败",
    pleaseSetWorkspaceDir: "请先设置工作区目录",
    settingsSaved: "设置已保存",
    saveSettingsFailed: "保存设置失败",
    replacingIconFor: "正在替换图标",
    iconReplaceFailedFor: "图标替换失败",
    cleanCacheFailedFor: "缓存清理失败",
    buildFailedFor: "构建失败",
    debugFailedFor: "启动调试失败",
    debugModeStarted: "正在启动调试模式",
    buildInProgress: "开始构建",
    cleaningCacheFor: "正在清理缓存",
    confirmCleanCache: "确定要清理 {0} 的编译缓存吗？\n\n这将删除 target 目录。",
    confirmBuild: "确定要构建 {0} 吗？\n\n可能需要 5-15 分钟。",
    scanProjectsAt: "开始扫描 {0}",
    scanCompleteFound: "扫描完成，找到 {0} 个 Tauri 项目",
    scanFailedMsg: "扫描失败",
    iconReplaceOk: "图标替换成功",
    cacheCleanOk: "缓存清理成功",
    buildOk: "构建完成",
    debugOk: "调试模式已启动",
    selectDirPlaceholder: "/home/xxx/智能体/webcode",
    pageTitle: "Tauri 图标管理器",

    targetExists: "target 存在",
    targetNotExists: "无 target",
  },

  en: {
    // App Title
    appTitle: "Icon Manager",
    appSubtitle: "Tauri Project Icon Manager",

    // Top Bar
    scanProjects: "Scan Projects",
    scanning: "Scanning",
    settings: "Settings",
    selectDir: "Select Directory",

    // Stats
    total: "Total",
    needAttention: "Need Attention",
    notSubmitted: "Not Submitted",
    localAhead: "Local Ahead",
    buildFailed: "Build Failed",
    synced: "Synced",

    // Empty State
    scanningDir: "Scanning...",
    noProjects: "No Tauri Projects Found",
    noProjectsHint: "Check if workspace directory contains Tauri projects",
    noProjectsHintNoDir: "Please select workspace directory in settings first",

    // Project Card
    iconFiles: "Icon Files",
    replaceIcon: "Replace Icon",
    cleanCache: "Clean Cache",
    build: "Build",
    debug: "Debug",

    // Buttons & Actions
    expand: "Expand",
    collapse: "Collapse",
    clear: "Clear",
    copy: "Copy",
    copied: "Copied!",
    save: "Save",
    cancel: "Cancel",
    saveAndRescan: "Save & Rescan",

    // Settings
    settingsTitle: "Settings",
    settingsSubtitle: "Workspace Directory",
    workspaceDir: "Workspace Directory",
    selectDirBtn: "Select Directory",
    selecting: "Selecting...",
    fullBleedLabel: "macOS full-bleed preprocessing",
    fullBleedHint: "Trim transparent edges and fill the canvas before replacing, so macOS 26's automatic icon plate doesn't show a ring of background",

    // Log
    operationLog: "Operation Log",
    logCount: "entries",
    waiting: "Waiting for operation",

    // Appearance Settings
    appearance: "Appearance Settings",
    density: "Density",
    densityCompact: "Compact",
    densityRegular: "Regular",
    densityComfy: "Comfy",
    view: "View",
    viewGrid: "Grid",
    viewList: "List",
    accentColor: "Accent Color",
    showLog: "Show Operation Log",

    // Theme Mode
    themeSystem: "System",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystemDesc: "Follow system (click to toggle dark)",
    themeDarkDesc: "Dark mode (click to toggle light)",
    themeLightDesc: "Light mode (click to follow system)",

    // Messages
    noDirSet: "Not Set",
    noDirTitle: "Please select workspace directory",
    setDirFirst: "Please click 📁 button to select workspace directory first",
    dirSet: "Workspace directory set",
    scanStart: "Starting to scan Tauri projects...",
    scanComplete: "Scan complete, found",
    scanProjectsCount: "Tauri projects",
    scanFailed: "Scan failed",

    // Icon Operations
    replacingIcon: "Replacing icon",
    iconReplaceSuccess: "Icon replaced successfully",
    iconReplaceFailed: "Failed to replace icon",
    noFileSelected: "No icon file selected",
    cleaningCache: "Cleaning cache",
    cacheCleanSuccess: "Cache cleaned successfully",
    cacheCleanFailed: "Failed to clean cache",
    cacheCleanConfirm: "Are you sure you want to clean",
    cacheCleanConfirmHint: "'s build cache? This will delete the target directory.",
    building: "Starting build",
    buildConfirm: "Are you sure you want to build",
    buildConfirmHint: "? This may take 5-15 minutes.",
    buildSuccess: "Build completed",
    buildFailed: "Build failed",
    debugStarting: "Starting debug mode",
    debugSuccess: "Debug mode started",
    debugFailed: "Failed to start debug",

    // Status
    ok: "Success",
    error: "Error",
    warn: "Warning",
    info: "Info",

    // Other
    dirNotSet: "Directory Not Set",
    langToggleToEn: "Switch to English",
    langToggleToZh: "Switch to Chinese",
    noDescription: "No description",
    iconFilesWithCount: "Icon Files ({0})",
    copyFail: "Failed to copy",
    selectDirFailed: "Failed to select directory",
    logFailedToLoad: "Failed to load settings",
    pleaseSetWorkspaceDir: "Please set workspace directory first",
    settingsSaved: "Settings saved",
    saveSettingsFailed: "Failed to save settings",
    replacingIconFor: "Replacing icon",
    iconReplaceFailedFor: "Failed to replace icon",
    cleanCacheFailedFor: "Failed to clean cache",
    buildFailedFor: "Build failed",
    debugFailedFor: "Failed to start debug",
    debugModeStarted: "Starting debug mode",
    buildInProgress: "Starting build",
    cleaningCacheFor: "Cleaning cache",
    confirmCleanCache: "Are you sure you want to clean {0}'s build cache?\n\nThis will delete the target directory.",
    confirmBuild: "Are you sure you want to build {0}?\n\nThis may take 5-15 minutes.",
    scanProjectsAt: "Starting to scan {0}",
    scanCompleteFound: "Scan complete, found {0} Tauri projects",
    scanFailedMsg: "Scan failed",
    iconReplaceOk: "Icon replaced successfully",
    cacheCleanOk: "Cache cleaned successfully",
    buildOk: "Build completed",
    debugOk: "Debug mode started",
    selectDirPlaceholder: "/home/xxx/workspace/webcode",
    pageTitle: "Tauri Icon Manager",

    targetExists: "target exists",
    targetNotExists: "no target",
  },
});

// 翻译函数
window.i18n.t = function (key) {
  const lang = window.i18n.currentLang || 'zh';
  const keys = key.split('.');
  let value = window.i18n[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
};

// 格式化翻译（支持替换占位符）
window.i18n.tf = function (key, ...args) {
  let text = window.i18n.t(key);
  args.forEach((arg, i) => {
    text = text.replace(`{${i}}`, arg);
  });
  return text;
};

// 设置当前语言
window.i18n.setLang = function (lang) {
  window.i18n.currentLang = lang;
  localStorage.setItem('icon-manager.lang', lang);
  // 触发自定义事件，通知 React 组件更新
  window.dispatchEvent(new CustomEvent('i18n-change', { detail: lang }));
};

// 获取当前语言
window.i18n.getLang = function () {
  return window.i18n.currentLang || localStorage.getItem('icon-manager.lang') || 'zh';
};

// 初始化语言
window.i18n.currentLang = window.i18n.getLang();
