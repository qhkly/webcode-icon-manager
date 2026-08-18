//! 图标满幅预处理
//!
//! macOS 26 (Tahoe) 会把没有 Icon Composer `.icon` 资源的老式 `.icns` 自动嵌进
//! 标准圆角方形底板。源图若自带透明留白，就会在系统底板上露出一圈背景。
//! 这里在交给 `tauri icon` 之前把源图规整成 1024² 满幅不透明 PNG，
//! 圆角和底板交给系统去做，避免「缩两次」。

use image::imageops::{self, FilterType};
use image::{Rgba, RgbaImage};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

/// 输出画布边长
const CANVAS: u32 = 1024;
/// PLATE 分支里图稿占画布的比例
const ART_RATIO: f32 = 0.92;
/// 视为「不透明」的 alpha 阈值
const OPAQUE: u8 = 200;
/// 视为「非全透明」的 alpha 阈值（用于求 bbox）
const VISIBLE: u8 = 8;

pub struct PrepResult {
    pub path: PathBuf,
    pub note: String,
    /// 是否生成了临时文件（调用方负责清理）
    pub is_temp: bool,
}

/// 把源图规整为满幅不透明 PNG。失败时返回 Err，调用方应回退到原图。
pub fn prepare_full_bleed(src: &Path) -> Result<PrepResult, String> {
    let ext = src
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // image crate 无法解码 SVG，原样透传
    if ext == "svg" {
        return Ok(PrepResult {
            path: src.to_path_buf(),
            note: "SVG 跳过满幅预处理".to_string(),
            is_temp: false,
        });
    }

    let img = image::open(src)
        .map_err(|e| format!("读取图片失败: {}", e))?
        .to_rgba8();

    let (bx, by, bw, bh) = alpha_bbox(&img).ok_or_else(|| "图片完全透明".to_string())?;
    let art = imageops::crop_imm(&img, bx, by, bw, bh).to_image();

    let aspect = bw.max(bh) as f32 / bw.min(bh) as f32;
    let coverage = opaque_ratio(&art);

    let (canvas, note) = if aspect <= 1.15 && coverage >= 0.90 {
        (cover_crop(&art), "满幅预处理: cover 裁切".to_string())
    } else {
        let bg = dominant_color(&art);
        let canvas = plate_fill(&art, bg);
        (
            canvas,
            format!(
                "满幅预处理: 底色 #{:02X}{:02X}{:02X} 填充",
                bg[0], bg[1], bg[2]
            ),
        )
    };

    let out = temp_png_path()?;
    canvas
        .save(&out)
        .map_err(|e| format!("写入预处理图片失败: {}", e))?;

    Ok(PrepResult {
        path: out,
        note,
        is_temp: true,
    })
}

/// 求非全透明像素的包围盒 (x, y, w, h)
fn alpha_bbox(img: &RgbaImage) -> Option<(u32, u32, u32, u32)> {
    let (w, h) = img.dimensions();
    let (mut x0, mut y0, mut x1, mut y1) = (w, h, 0u32, 0u32);

    for (x, y, px) in img.enumerate_pixels() {
        if px[3] > VISIBLE {
            x0 = x0.min(x);
            y0 = y0.min(y);
            x1 = x1.max(x);
            y1 = y1.max(y);
        }
    }

    if x0 > x1 || y0 > y1 {
        return None;
    }
    Some((x0, y0, x1 - x0 + 1, y1 - y0 + 1))
}

/// bbox 内不透明像素占比
fn opaque_ratio(img: &RgbaImage) -> f32 {
    let total = (img.width() as u64) * (img.height() as u64);
    if total == 0 {
        return 0.0;
    }
    let opaque = img.pixels().filter(|p| p[3] >= OPAQUE).count() as u64;
    opaque as f32 / total as f32
}

/// 色桶累计：(r 之和, g 之和, b 之和, 像素数)
type Bucket = (u64, u64, u64, u64);

/// 取不透明像素的主色调：16 级量化投票，取胜出色桶的均值
fn dominant_color(img: &RgbaImage) -> Rgba<u8> {
    let mut buckets: HashMap<(u8, u8, u8), Bucket> = HashMap::new();

    for px in img.pixels() {
        if px[3] < OPAQUE {
            continue;
        }
        let key = (px[0] / 16, px[1] / 16, px[2] / 16);
        let e = buckets.entry(key).or_insert((0, 0, 0, 0));
        e.0 += px[0] as u64;
        e.1 += px[1] as u64;
        e.2 += px[2] as u64;
        e.3 += 1;
    }

    match buckets.values().max_by_key(|e| e.3) {
        Some(&(r, g, b, n)) if n > 0 => Rgba([(r / n) as u8, (g / n) as u8, (b / n) as u8, 255]),
        // 全是半透明像素等退化情况，退回白色
        _ => Rgba([255, 255, 255, 255]),
    }
}

/// 等比放大到短边铺满画布，居中裁切
fn cover_crop(art: &RgbaImage) -> RgbaImage {
    let (w, h) = art.dimensions();
    let scale = (CANVAS as f32 / w as f32).max(CANVAS as f32 / h as f32);
    let nw = ((w as f32 * scale).ceil() as u32).max(CANVAS);
    let nh = ((h as f32 * scale).ceil() as u32).max(CANVAS);

    let scaled = imageops::resize(art, nw, nh, FilterType::Lanczos3);
    let ox = (nw - CANVAS) / 2;
    let oy = (nh - CANVAS) / 2;
    let cropped = imageops::crop_imm(&scaled, ox, oy, CANVAS, CANVAS).to_image();

    // 内部若仍有半透明像素，合成到自身主色底上，保证输出完全不透明
    let bg = dominant_color(&cropped);
    flatten(&cropped, bg)
}

/// 图稿等比缩到画布 ART_RATIO 内，居中叠在纯色底板上
fn plate_fill(art: &RgbaImage, bg: Rgba<u8>) -> RgbaImage {
    let (w, h) = art.dimensions();
    let target = (CANVAS as f32 * ART_RATIO).round();
    let scale = (target / w as f32).min(target / h as f32);
    let nw = ((w as f32 * scale).round() as u32).max(1);
    let nh = ((h as f32 * scale).round() as u32).max(1);

    let scaled = imageops::resize(art, nw, nh, FilterType::Lanczos3);
    let mut canvas = RgbaImage::from_pixel(CANVAS, CANVAS, bg);
    let ox = ((CANVAS - nw.min(CANVAS)) / 2) as i64;
    let oy = ((CANVAS - nh.min(CANVAS)) / 2) as i64;
    imageops::overlay(&mut canvas, &scaled, ox, oy);
    // overlay 的 alpha 合成会有舍入误差（出现 254 之类），统一压回不透明
    flatten(&canvas, bg)
}

/// 把半透明像素合成到底色上，并把 alpha 全部压成 255
fn flatten(img: &RgbaImage, bg: Rgba<u8>) -> RgbaImage {
    let mut out = img.clone();
    for px in out.pixels_mut() {
        let a = px[3] as u32;
        if a == 255 {
            continue;
        }
        for i in 0..3 {
            px[i] = ((px[i] as u32 * a + bg[i] as u32 * (255 - a)) / 255) as u8;
        }
        px[3] = 255;
    }
    out
}

fn temp_png_path() -> Result<PathBuf, String> {
    let dir = std::env::temp_dir().join("webcode-icon-manager");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    Ok(dir.join(format!("fullbleed-{}.png", stamp)))
}

// ── macOS 外观烘焙 ────────────────────────────────────────────────────────
//
// dev 模式下 macOS 的 Dock 图标直接取 `icons/icon.icns` 原图（见 tauri-codegen
// 的 `app_icon` 分支：Target::MacOS && dev），不经过系统 IconServices，
// 所以满幅图在 dev 里是没有圆角、铺满整格的直角方块。
//
// 解法是把系统合成的样子预先画进 icns：图稿缩到 824²（Apple 图标网格）居中，
// 套上系统同款圆角板形，再补上系统同款投影。实测这样的 icns 打包后会被系统
// 原样放行（不会二次缩小），于是 dev 和打包产物同时正确。
//
// 板形与投影是从系统合成结果里反解出来的：分别用纯白、纯黑图标渲染同一个
// .app，两次结果的差值即板体覆盖率，黑图里板体之外的部分即投影。

/// 系统板体尺寸（1024 画布中居中的 824²）
const PLATE: u32 = 824;
const PLATE_OFFSET: i64 = 100;

static PLATE_MASK: &[u8] = include_bytes!("../../assets/macos-plate-mask.png");
static PLATE_SHADOW: &[u8] = include_bytes!("../../assets/macos-plate-shadow.png");

/// 把满幅图稿合成为「macOS 外观」的 1024² 图：圆角板 + 投影
pub fn bake_macos_look(full_bleed: &RgbaImage) -> Result<RgbaImage, String> {
    let mask = image::load_from_memory(PLATE_MASK)
        .map_err(|e| format!("读取板形资源失败: {}", e))?
        .to_luma8();
    let shadow = image::load_from_memory(PLATE_SHADOW)
        .map_err(|e| format!("读取投影资源失败: {}", e))?
        .to_luma8();

    // 投影层：纯黑，alpha 取自投影资源
    let mut out = RgbaImage::from_pixel(CANVAS, CANVAS, Rgba([0, 0, 0, 0]));
    for (x, y, px) in out.enumerate_pixels_mut() {
        px[3] = shadow.get_pixel(x, y)[0];
    }

    // 板体层：图稿缩到 824² 居中，按板形裁剪
    let art = imageops::resize(full_bleed, PLATE, PLATE, FilterType::Lanczos3);
    let mut plate = RgbaImage::from_pixel(CANVAS, CANVAS, Rgba([0, 0, 0, 0]));
    imageops::overlay(&mut plate, &art, PLATE_OFFSET, PLATE_OFFSET);
    for (x, y, px) in plate.enumerate_pixels_mut() {
        px[3] = ((px[3] as u32 * mask.get_pixel(x, y)[0] as u32) / 255) as u8;
    }

    imageops::overlay(&mut out, &plate, 0, 0);
    Ok(out)
}

/// 用「macOS 外观」图重建 `icons/icon.icns`（依赖系统自带的 iconutil）
#[cfg(target_os = "macos")]
pub fn write_macos_icns(look: &RgbaImage, icons_dir: &Path) -> Result<(), String> {
    let staging = std::env::temp_dir().join(format!(
        "webcode-icon-manager/icns-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    ));
    let iconset = staging.join("icon.iconset");
    std::fs::create_dir_all(&iconset).map_err(|e| format!("创建 iconset 目录失败: {}", e))?;

    for base in [16u32, 32, 128, 256, 512] {
        for (scale, suffix) in [(1u32, ""), (2, "@2x")] {
            let px = base * scale;
            let resized = imageops::resize(look, px, px, FilterType::Lanczos3);
            let name = format!("icon_{}x{}{}.png", base, base, suffix);
            resized
                .save(iconset.join(&name))
                .map_err(|e| format!("写入 {} 失败: {}", name, e))?;
        }
    }

    let icns = icons_dir.join("icon.icns");
    let output = Command::new("iconutil")
        .args(["-c", "icns"])
        .arg(&iconset)
        .arg("-o")
        .arg(&icns)
        .output()
        .map_err(|e| format!("执行 iconutil 失败: {}", e))?;

    let _ = std::fs::remove_dir_all(&staging);

    if !output.status.success() {
        return Err(format!(
            "iconutil 失败: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn check_output(path: &Path) -> RgbaImage {
        let img = image::open(path).unwrap().to_rgba8();
        assert_eq!(img.dimensions(), (CANVAS, CANVAS), "输出应为 1024²");
        assert!(img.pixels().all(|p| p[3] == 255), "输出应完全不透明");
        img
    }

    /// 本仓库图标：圆角方形底板 + 四周透明留白 → COVER 分支，
    /// 放大到铺满后圆角处的透明像素被底板色补上，圆角交还给系统
    #[test]
    fn repo_icon_becomes_full_bleed() {
        let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("icons/icon.png");
        let prep = prepare_full_bleed(&src).unwrap();
        assert!(prep.note.contains("cover"), "note = {}", prep.note);
        let out = check_output(&prep.path);
        if let Some(path) = std::env::var_os("ICON_PREP_DUMP") {
            out.save(path).unwrap();
        }
        std::fs::remove_file(&prep.path).ok();
    }

    /// 不规则 glyph（圆形，bbox 内不透明度约 78%）→ PLATE 分支
    #[test]
    fn plate_branch_fills_canvas() {
        let mut art = RgbaImage::from_pixel(300, 300, Rgba([0, 0, 0, 0]));
        for (x, y, px) in art.enumerate_pixels_mut() {
            let (dx, dy) = (x as f32 - 149.5, y as f32 - 149.5);
            if dx * dx + dy * dy <= 150.0 * 150.0 {
                *px = Rgba([200, 60, 40, 255]);
            }
        }

        let dir = std::env::temp_dir().join("webcode-icon-manager-test");
        std::fs::create_dir_all(&dir).unwrap();
        let src = dir.join("circle.png");
        art.save(&src).unwrap();

        let prep = prepare_full_bleed(&src).unwrap();
        assert!(prep.note.contains("底色"), "note = {}", prep.note);
        let out = check_output(&prep.path);
        // 四角是底板色（取自图稿主色），中心是图稿本身
        assert_eq!(out.get_pixel(2, 2), out.get_pixel(CANVAS - 3, CANVAS - 3));

        std::fs::remove_file(&prep.path).ok();
        std::fs::remove_file(&src).ok();
    }

    /// 方形不透明底板 → COVER 分支，内容不被缩小
    #[test]
    fn cover_branch_keeps_square_plate() {
        let mut art = RgbaImage::from_pixel(300, 300, Rgba([10, 20, 30, 255]));
        // 角落打个标记，确认没有被裁掉
        art.put_pixel(4, 4, Rgba([255, 0, 0, 255]));

        let dir = std::env::temp_dir().join("webcode-icon-manager-test");
        std::fs::create_dir_all(&dir).unwrap();
        let src = dir.join("square.png");
        art.save(&src).unwrap();

        let prep = prepare_full_bleed(&src).unwrap();
        assert!(prep.note.contains("cover"), "note = {}", prep.note);
        let out = check_output(&prep.path);
        assert_eq!(out.get_pixel(CANVAS / 2, CANVAS / 2)[0], 10);

        std::fs::remove_file(&prep.path).ok();
        std::fs::remove_file(&src).ok();
    }

    /// SVG 原样透传
    #[test]
    fn svg_passes_through() {
        let src = Path::new("/tmp/nonexistent-icon.svg");
        let prep = prepare_full_bleed(src).unwrap();
        assert!(!prep.is_temp);
        assert_eq!(prep.path, src);
    }

    /// 烘焙出的「macOS 外观」应当：板体正好 824² 居中，外围有投影
    #[test]
    fn baked_look_matches_system_geometry() {
        let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("icons/icon.png");
        let prep = prepare_full_bleed(&src).unwrap();
        let full = image::open(&prep.path).unwrap().to_rgba8();
        std::fs::remove_file(&prep.path).ok();

        let look = bake_macos_look(&full).unwrap();
        assert_eq!(look.dimensions(), (CANVAS, CANVAS));

        // 板体边缘有一圈系统自带的半透明描边（alpha 从 140 起渐升），
        // 所以用 128 作为板体内外的判定线
        let solid: Vec<u32> = (0..CANVAS)
            .filter(|&x| look.get_pixel(x, CANVAS / 2)[3] > 128)
            .collect();
        assert_eq!(solid[0], PLATE_OFFSET as u32, "板体左边界");
        assert_eq!(
            solid[solid.len() - 1] - solid[0] + 1,
            PLATE,
            "板体宽度应为 824"
        );

        // 四角在板体之外，应当只剩投影（半透明）
        assert!(look.get_pixel(4, 4)[3] < 128, "角上不应是板体");

        if let Some(path) = std::env::var_os("ICON_LOOK_DUMP") {
            look.save(path).unwrap();
        }
    }
}
