use base64::Engine as _;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::process::Stdio;
use tauri::Emitter;
use tokio::io::AsyncBufReadExt;
use tokio::process::Command as TokioCommand;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TauriProject {
    pub name: String,
    pub path: String,
    pub tauri_dir: String,
    pub icon_path: String,
    pub icon_data_url: String,
    pub description: String,
    pub version: String,
    pub icon_files: Vec<String>,
    pub has_target: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IconOpResult {
    pub success: bool,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub base_dir: String,
}

impl Default for Settings {
    fn default() -> Self {
        // Return empty string to prompt user to select directory
        Self {
            base_dir: String::new(),
        }
    }
}

fn settings_path() -> Result<PathBuf, String> {
    dirs::config_dir()
        .ok_or_else(|| "无法获取配置目录".to_string())
        .map(|d| d.join("webcode-icon-manager").join("settings.json"))
}

#[tauri::command]
pub async fn icon_load_settings() -> Result<Settings, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(Settings::default());
    }
    let raw = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("读取配置失败: {}", e))?;
    serde_json::from_str(&raw).map_err(|e| format!("解析配置失败: {}", e))
}

#[tauri::command]
pub async fn icon_save_settings(settings: Settings) -> Result<(), String> {
    let path = settings_path()?;
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    let json =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("序列化配置失败: {}", e))?;
    tokio::fs::write(&path, json)
        .await
        .map_err(|e| format!("保存配置失败: {}", e))
}

fn find_tauri_conf(project_dir: &Path) -> Option<PathBuf> {
    let standard = project_dir.join("src-tauri/tauri.conf.json");
    if standard.exists() {
        return Some(standard);
    }
    // 非标准结构：最多扫两层子目录（如 crates/tauri-app/tauri.conf.json）
    for l1 in fs::read_dir(project_dir).ok()?.flatten() {
        let p1 = l1.path();
        if !p1.is_dir() {
            continue;
        }
        let c1 = p1.join("tauri.conf.json");
        if c1.exists() {
            return Some(c1);
        }
        if let Ok(entries) = fs::read_dir(&p1) {
            for l2 in entries.flatten() {
                let p2 = l2.path();
                if !p2.is_dir() {
                    continue;
                }
                let c2 = p2.join("tauri.conf.json");
                if c2.exists() {
                    return Some(c2);
                }
            }
        }
    }
    None
}

fn icon_to_data_url(path: &Path) -> String {
    match fs::read(path) {
        Ok(bytes) => {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            format!("data:image/png;base64,{}", b64)
        }
        Err(_) => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".to_string(), // 1x1 transparent pixel
    }
}

fn get_icon_files(icons_dir: &Path) -> Vec<String> {
    if !icons_dir.exists() {
        return vec![];
    }
    fs::read_dir(icons_dir)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
                .map(|e| e.file_name().to_string_lossy().to_string())
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
pub async fn icon_scan_projects(base_dir: String) -> Result<Vec<TauriProject>, String> {
    let base_path = Path::new(&base_dir);
    if !base_path.exists() {
        return Err(format!("目录不存在: {}", base_dir));
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(base_path).map_err(|e| format!("读取目录失败: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("读取条目失败: {}", e))?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let Some(tauri_conf) = find_tauri_conf(&path) else {
            continue;
        };
        let Some(tauri_dir) = tauri_conf.parent().map(|p| p.to_path_buf()) else {
            continue; // Skip if tauri.conf has no parent directory
        };
        let icons_dir = tauri_dir.join("icons");
        let icon_path = icons_dir.join("icon.png");

        if !icon_path.exists() {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();

        let description = if let Ok(content) = fs::read_to_string(&tauri_conf) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                json["bundle"]["longDescription"]
                    .as_str()
                    .or_else(|| json["bundle"]["shortDescription"].as_str())
                    .unwrap_or("")
                    .to_string()
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        let version = if let Ok(content) = fs::read_to_string(&tauri_conf) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                json["version"].as_str().unwrap_or("0.0.0").to_string()
            } else {
                "0.0.0".to_string()
            }
        } else {
            "0.0.0".to_string()
        };

        let icon_data_url = icon_to_data_url(&icon_path);
        let icon_files = get_icon_files(&icons_dir);
        let has_target = tauri_dir.join("target").exists();

        projects.push(TauriProject {
            name,
            path: path.to_string_lossy().to_string(),
            tauri_dir: tauri_dir.to_string_lossy().to_string(),
            icon_path: icon_path.to_string_lossy().to_string(),
            icon_data_url,
            description,
            version,
            icon_files,
            has_target,
        });
    }

    projects.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(projects)
}

#[tauri::command]
pub async fn icon_replace_icon(
    project_path: String,
    tauri_dir: String,
    icon_path: String,
) -> Result<IconOpResult, String> {
    let tauri_path = Path::new(&tauri_dir);
    let icon_file = Path::new(&icon_path);

    if !tauri_path.exists() {
        return Ok(IconOpResult {
            success: false,
            output: format!("项目目录不存在: {}", project_path),
        });
    }

    if !icon_file.exists() {
        return Ok(IconOpResult {
            success: false,
            output: format!("图标文件不存在: {}", icon_path),
        });
    }

    let project_root = Path::new(&project_path);

    // 优先使用项目本地的 CLI；若无则降级到 cargo tauri icon
    // 通过 shell + with_nvm 确保 node 在 PATH 中（Tauri 进程不继承 shell PATH）
    let local_bin = project_root.join("node_modules/.bin/tauri");
    let shell = user_shell();
    let output = if local_bin.exists() {
        let cmd = with_nvm(&format!(
            "node_modules/.bin/tauri icon '{}'",
            icon_path.replace('\'', "'\\''")
        ));
        Command::new(&shell)
            .args(["-c", &cmd])
            .current_dir(project_root)
            .output()
            .map_err(|e| format!("执行命令失败: {}", e))?
    } else {
        // ai-kanban 等使用 cargo tauri，从 src-tauri 目录运行
        run_cargo(&["tauri", "icon", &icon_path], tauri_path)
            .map_err(|e| format!("执行命令失败: {}", e))?
    };

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let combined = if !stdout.is_empty() && !stderr.is_empty() {
        format!("{}\n{}", stdout, stderr)
    } else if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else {
        "命令执行完成".to_string()
    };

    Ok(IconOpResult {
        success: output.status.success(),
        output: combined,
    })
}

#[tauri::command]
pub async fn icon_build_project(
    project_path: String,
    app_handle: tauri::AppHandle,
) -> Result<IconOpResult, String> {
    let project_dir = Path::new(&project_path);

    if !project_dir.exists() {
        return Ok(IconOpResult {
            success: false,
            output: format!("项目目录不存在: {}", project_path),
        });
    }

    let build_cmd = with_nvm(&resolve_build_command(project_dir));
    let shell = user_shell();
    let mut child = TokioCommand::new(&shell)
        .args(["-c", &build_cmd])
        .current_dir(project_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动构建失败: {}", e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "无法捕获 stdout".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "无法捕获 stderr".to_string())?;
    let ah1 = app_handle.clone();
    let ah2 = app_handle.clone();

    let t1 = tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            ah1.emit("build_output", line).ok();
        }
    });
    let t2 = tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            ah2.emit("build_output", line).ok();
        }
    });

    let status = child
        .wait()
        .await
        .map_err(|e| format!("等待构建失败: {}", e))?;
    let _ = tokio::join!(t1, t2);

    if !status.success() {
        return Ok(IconOpResult {
            success: false,
            output: "构建失败，请查看日志".to_string(),
        });
    }

    let product_name = read_product_name(project_dir).unwrap_or_default();
    let bundle_dir = project_dir.join("src-tauri/target/release/bundle");
    let reveal_path = find_bundle_artifact(&bundle_dir, &product_name);
    open_in_finder(&reveal_path);

    Ok(IconOpResult {
        success: true,
        output: format!("构建成功，产物位于: {}", reveal_path.display()),
    })
}

#[tauri::command]
pub async fn icon_debug_project(
    project_path: String,
    app_handle: tauri::AppHandle,
) -> Result<IconOpResult, String> {
    let project_dir = Path::new(&project_path);

    if !project_dir.exists() {
        return Ok(IconOpResult {
            success: false,
            output: format!("项目目录不存在: {}", project_path),
        });
    }

    let raw_cmd = resolve_dev_command(project_dir);

    // Tauri dev 会启动桌面壳并持有前端进程，使用独立 Terminal 更稳。
    if is_tauri_dev_command(&raw_cmd) {
        // cargo tauri dev 内部用 PTY 管理子进程，pipe 捕获不到输出，改用新 Terminal 窗口运行
        return launch_in_terminal(project_path, raw_cmd);
    }

    let dev_cmd = with_nvm(&raw_cmd);
    let project_dir_buf = project_dir.to_path_buf();
    let shell = user_shell();

    let mut child = TokioCommand::new(&shell)
        .args(["-c", &dev_cmd])
        .current_dir(&project_dir_buf)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动调试失败: {}", e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "无法捕获 stdout".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "无法捕获 stderr".to_string())?;
    let ah1 = app_handle.clone();
    let ah2 = app_handle.clone();

    // 长驻进程：在后台任务中持续流式推送日志，不阻塞命令返回
    tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            ah1.emit("build_output", line).ok();
        }
    });
    tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            ah2.emit("build_output", line).ok();
        }
    });
    // child 移入后台，不等待退出
    tokio::spawn(async move { child.wait().await });

    Ok(IconOpResult {
        success: true,
        output: format!(
            "已启动调试模式（{}），日志实时输出中，首次 Rust 编译需约 1 分钟",
            dev_cmd
        ),
    })
}

fn user_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
}

// Run `cargo <args>` via shell with $HOME/.cargo/bin in PATH.
// Direct Command::new("cargo") fails in installed app bundles because macOS
// strips PATH to /usr/bin:/bin only — cargo lives in ~/.cargo/bin.
fn run_cargo(args: &[&str], cwd: &std::path::Path) -> std::io::Result<std::process::Output> {
    let shell = user_shell();
    let cargo_args = args.join(" ");
    let cmd = format!("export PATH=\"$HOME/.cargo/bin:$PATH\"; cargo {}", cargo_args);
    Command::new(&shell)
        .args(["-c", &cmd])
        .current_dir(cwd)
        .output()
}

fn with_nvm(cmd: &str) -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "~".to_string());

    // 扫描所有 nvm node 版本，找含 pnpm 的 bin 目录直接注入 PATH（版本号降序，较新的优先）
    let mut extra_paths: Vec<(String, String)> = vec![];
    let nvm_node_dir = PathBuf::from(&home).join(".nvm/versions/node");
    if let Ok(versions) = fs::read_dir(&nvm_node_dir) {
        for v in versions.flatten() {
            let ver_name = v.file_name().to_string_lossy().to_string();
            let bin = v.path().join("bin");
            if bin.join("pnpm").exists() {
                extra_paths.push((ver_name, bin.to_string_lossy().to_string()));
            }
        }
    }
    extra_paths.sort_by(|a, b| b.0.cmp(&a.0)); // 版本号字符串降序（v22 > v20 > v16）
    let extra_paths: Vec<String> = extra_paths.into_iter().map(|(_, p)| p).collect();

    if !extra_paths.is_empty() {
        let inject = extra_paths.join(":");
        format!(r#"export PATH="{inject}:$PATH"; {cmd}"#)
    } else {
        // fallback：source nvm（单独两行，无 || 优先级问题）
        format!(
            r#"[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"; \
[ -s "{home}/.nvm/nvm.sh" ] && . "{home}/.nvm/nvm.sh"; \
{cmd}"#
        )
    }
}

fn launch_in_terminal(project_path: String, raw_cmd: String) -> Result<IconOpResult, String> {
    let full_cmd = with_nvm(&raw_cmd);
    let shell = user_shell();
    let preflight = if is_tauri_dev_command(&raw_cmd) {
        r#"
if [ -f package.json ] && grep -q '"@tauri-apps/cli"' package.json && [ ! -x node_modules/.bin/tauri ]; then
  echo "=== 未找到 node_modules/.bin/tauri，正在执行 npm install ==="
  npm install || exit $?
fi
"#
    } else {
        ""
    };

    // 写临时脚本文件，避免 osascript 字符串里的引号冲突
    // -il: interactive + login，确保 .zshrc/.bash_profile 加载，cargo/nvm 都在 PATH
    let uid = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    let tmp = format!("/tmp/webcode-debug-{}-{}.sh", std::process::id(), uid);
    // 唯一窗口标签（PID + 纳秒时间戳），脚本结束后只关闭本窗口
    let win_tag = format!("webcode-debug-{}-{}", std::process::id(), uid);
    let close_line = format!(
        r#"osascript -e 'tell application "Terminal" to close (every window whose custom title is "{win_tag}")' 2>/dev/null"#
    );
    let script = format!(
        "#!{shell} -il\n\
export PATH=\"$HOME/.cargo/bin:$PATH\"\n\
cd '{project_path}' || {{ echo \"cd 失败: {project_path}\"; read -r; exit 1; }}\n\
{preflight}\
echo \"=== 执行: {full_cmd} ===\"\n\
{full_cmd}\n\
_EXIT=$?\n\
if [ $_EXIT -ne 0 ] && [ $_EXIT -ne 130 ]; then\n\
  echo \"=== 异常退出 ($_EXIT)，按 Enter 关闭 ===\"\n\
  read -r\n\
fi\n\
{close_line}\n"
    );
    fs::write(&tmp, script).map_err(|e| format!("写临时脚本失败: {}", e))?;
    Command::new("chmod").args(["+x", &tmp]).output().ok();

    // 启动后给窗口贴上唯一标签，脚本结束时据此关闭
    let apple_script = format!(
        "tell application \"Terminal\"\n\
do script \"{tmp}\"\n\
delay 0.3\n\
set custom title of front window to \"{win_tag}\"\n\
activate\n\
end tell"
    );
    Command::new("osascript")
        .args(["-e", &apple_script])
        .spawn()
        .map_err(|e| format!("打开终端失败: {}", e))?;

    Ok(IconOpResult {
        success: true,
        output: format!("已在新 Terminal 窗口启动（{raw_cmd}），请查看弹出的 Terminal"),
    })
}

fn resolve_dev_command(project_dir: &Path) -> String {
    let pkg_path = project_dir.join("package.json");
    if let Ok(content) = fs::read_to_string(&pkg_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(scripts) = json["scripts"].as_object() {
                // 明确的桌面启动命令优先；纯 Vite 的 dev 只能作为最后回退。
                if scripts.contains_key("tauri:dev") {
                    return "npm run tauri:dev".to_string();
                }
                if scripts.contains_key("tauri") {
                    return "npm run tauri -- dev".to_string();
                }
                if script_contains_tauri_dev(scripts.get("dev")) {
                    return "npm run dev".to_string();
                }
                if scripts.contains_key("dev") {
                    return "npm run dev".to_string();
                }
            }
        }
    }
    "npx tauri dev".to_string()
}

fn is_tauri_dev_command(cmd: &str) -> bool {
    cmd.contains("tauri:dev")
        || cmd.contains("tauri dev")
        || cmd.contains("tauri -- dev")
        || cmd.contains("cargo tauri dev")
        || cmd.contains("pnpm tauri dev")
}

fn script_contains_tauri_dev(script: Option<&serde_json::Value>) -> bool {
    script
        .and_then(|value| value.as_str())
        .map(is_tauri_dev_command)
        .unwrap_or(false)
}

fn resolve_build_command(project_dir: &Path) -> String {
    let pkg_path = project_dir.join("package.json");
    if let Ok(content) = fs::read_to_string(&pkg_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(scripts) = json["scripts"].as_object() {
                if scripts.contains_key("tauri:build") {
                    // On macOS, skip DMG bundling (requires create-dmg)
                    return if cfg!(target_os = "macos") {
                        "npm run tauri:build -- --bundles app".to_string()
                    } else {
                        "npm run tauri:build".to_string()
                    };
                }
                if scripts.contains_key("tauri") {
                    return if cfg!(target_os = "macos") {
                        "npm run tauri -- build --bundles app".to_string()
                    } else {
                        "npm run tauri -- build".to_string()
                    };
                }
                if scripts.contains_key("build") {
                    return "npm run build".to_string();
                }
            }
        }
    }
    if cfg!(target_os = "macos") {
        "npx tauri build --bundles app".to_string()
    } else {
        "npx tauri build".to_string()
    }
}

fn read_product_name(project_dir: &Path) -> Option<String> {
    let conf = fs::read_to_string(project_dir.join("src-tauri/tauri.conf.json")).ok()?;
    let json: serde_json::Value = serde_json::from_str(&conf).ok()?;
    json["productName"].as_str().map(|s| s.to_string())
}

fn find_bundle_artifact(bundle_dir: &Path, _product_name: &str) -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if !_product_name.is_empty() {
            let app = bundle_dir
                .join("macos")
                .join(format!("{}.app", _product_name));
            if app.exists() {
                return app;
            }
        }
        return bundle_dir.join("macos");
    }
    #[cfg(target_os = "linux")]
    {
        let dir = bundle_dir.join("appimage");
        if let Ok(entries) = fs::read_dir(&dir) {
            for e in entries.flatten() {
                if e.path().extension().map_or(false, |x| x == "AppImage") {
                    return e.path();
                }
            }
        }
        return dir;
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    bundle_dir.to_path_buf()
}

fn open_in_finder(path: &Path) {
    #[cfg(target_os = "macos")]
    {
        if path.is_dir() && path.extension().map_or(true, |e| e != "app") {
            Command::new("open").arg(path).spawn().ok();
        } else {
            Command::new("open")
                .args(["-R", &path.to_string_lossy().to_string()])
                .spawn()
                .ok();
        }
    }
    #[cfg(target_os = "linux")]
    {
        let target = if path.is_file() {
            path.parent().unwrap_or(path)
        } else {
            path
        };
        Command::new("xdg-open").arg(target).spawn().ok();
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    let _ = path;
}

#[tauri::command]
pub async fn icon_cargo_clean(
    _project_path: String,
    tauri_dir: String,
) -> Result<IconOpResult, String> {
    let tauri_path = Path::new(&tauri_dir);

    if !tauri_path.exists() {
        return Ok(IconOpResult {
            success: false,
            output: format!("目录不存在: {}", tauri_dir),
        });
    }

    let output = run_cargo(&["clean"], tauri_path)
        .map_err(|e| format!("执行命令失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let combined = if !stdout.is_empty() && !stderr.is_empty() {
        format!("{}\n{}", stdout, stderr)
    } else if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else {
        "清理完成".to_string()
    };

    Ok(IconOpResult {
        success: output.status.success(),
        output: combined,
    })
}
