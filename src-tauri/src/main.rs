#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::io::Write;
mod install;

// The frontend never supplies a filesystem path. Every access originates in a native dialog.
#[tauri::command]
async fn save_project(contents: String) -> Result<Option<String>, String> {
    let value: serde_json::Value = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    if value["schemaVersion"] != 1 || value["library"] != "shadcn" { return Err("Unsupported project version or library".into()); }
    let Some(file) = rfd::AsyncFileDialog::new().add_filter("Component Studio", &["cstudio"]).set_file_name("project.cstudio").save_file().await else { return Ok(None) };
    let path = file.path();
    let mut tmp = tempfile::NamedTempFile::new_in(path.parent().ok_or("Invalid folder")?).map_err(|e| e.to_string())?;
    tmp.write_all(contents.as_bytes()).map_err(|e| e.to_string())?;
    tmp.as_file().sync_all().map_err(|e| e.to_string())?;
    tmp.persist(path).map_err(|e| e.to_string())?;
    Ok(Some(path.display().to_string()))
}

#[tauri::command]
async fn open_project() -> Result<Option<String>, String> {
    let Some(file) = rfd::AsyncFileDialog::new().add_filter("Component Studio", &["cstudio"]).pick_file().await else { return Ok(None) };
    let metadata = std::fs::metadata(file.path()).map_err(|e| e.to_string())?;
    if metadata.len() > 5_000_000 { return Err("Project exceeds 5 MB limit".into()); }
    std::fs::read_to_string(file.path()).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_files(files: std::collections::BTreeMap<String, String>) -> Result<Option<String>, String> {
    // Only known project files can be emitted; never follow paths from metadata.
    if files.len() > 128 || files.values().map(|v| v.len()).sum::<usize>() > 10_000_000 || files.keys().any(|k| !valid_export_path(k)) { return Err("Invalid export file set".into()); }
    let Some(folder) = rfd::AsyncFileDialog::new().pick_folder().await else { return Ok(None) };
    // A new directory preserves all existing user files, including on partial failure.
    let output = tempfile::Builder::new().prefix("component-studio-export-").tempdir_in(folder.path()).map_err(|e| e.to_string())?;
    for (name, contents) in files {
        let path = output.path().join(name);
        std::fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
        std::fs::write(path, contents).map_err(|e| e.to_string())?;
    }
    Ok(Some(output.keep().display().to_string()))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_project, open_project, export_files, install::install_library])
        .run(tauri::generate_context!())
        .expect("Failed to start Component Studio");
}

fn valid_export_path(path: &str) -> bool {
    let allowed = ["package.json", "index.html", "src/App.tsx", "src/main.tsx", "src/styles.css", "vite.config.ts", "tsconfig.json", "README.md", "src/lib/utils.ts"];
    if allowed.contains(&path) { return true; }
    match path.strip_prefix("src/components/ui/").and_then(|p| p.strip_suffix(".tsx")) {
        Some(name) => !name.is_empty() && name.chars().all(|c| c.is_ascii_lowercase() || c == '-'),
        None => false,
    }
}

#[cfg(test)]
mod tests {
    use super::valid_export_path;
    #[test]
    fn export_paths_are_confined_to_known_project_locations() {
        for path in ["src/components/ui/alert-dialog.tsx", "vite.config.ts", "src/App.tsx"] { assert!(valid_export_path(path)); }
        for path in ["../secret", "/etc/passwd", "src/components/ui/../../file.tsx", "src/components/ui/a/b.tsx", "src/components/ui/a\\b.tsx", "src/components/ui/.tsx"] { assert!(!valid_export_path(path)); }
    }
}
