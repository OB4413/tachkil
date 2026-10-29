use std::process::Command;
use std::collections::BTreeMap;

#[tauri::command]
pub async fn install_library(library: String, approved: bool) -> Result<Option<String>, String> {
    if !approved { return Err("Installation requires approval".into()); }
    if !["shadcn", "mui", "antd"].contains(&library.as_str()) { return Err("Unknown library".into()); }
    let Some(folder) = rfd::AsyncFileDialog::new().set_title("Choose parent folder for a NEW library workspace").pick_folder().await else { return Ok(None) };
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = tempfile::Builder::new().prefix("component-studio-library-").tempdir_in(folder.path()).map_err(|e| e.to_string())?.keep();
        // Preserve the workspace and logs on failure. No user directory is overwritten.
        let result = (|| -> Result<String,String> {
            let mut deps = BTreeMap::from([("react", "^19.0.0"), ("react-dom", "^19.0.0")]);
            match library.as_str() {
                "mui" => { deps.extend([("@mui/material", "^9.5.0"), ("@emotion/react", "^11.14.0"), ("@emotion/styled", "^11.14.0")]); },
                "antd" => { deps.insert("antd", "^6.6.0"); },
                _ => { deps.extend([("tailwindcss", "^4.0.0"), ("@tailwindcss/vite", "^4.0.0"), ("class-variance-authority", "^0.7.1"), ("clsx", "^2.1.1"), ("tailwind-merge", "^3.0.0"), ("lucide-react", "^0.468.0")]); }
            }
            let package = serde_json::json!({"name":"studio-library","version":"0.1.0","private":true,"type":"module","scripts":{"dev":"vite","build":"vite build"},"dependencies":deps,"devDependencies":{"vite":"^7.0.0","typescript":"^5.9.0","@types/react":"^19.0.0","@types/react-dom":"^19.0.0"}});
            std::fs::create_dir_all(workspace.join("src/lib")).map_err(|e| e.to_string())?;
            let config = serde_json::json!({"$schema":"https://ui.shadcn.com/schema.json","style":"new-york","rsc":false,"tsx":true,"tailwind":{"config":"","css":"src/styles.css","baseColor":"neutral","cssVariables":true},"aliases":{"components":"@/components","utils":"@/lib/utils","ui":"@/components/ui","lib":"@/lib","hooks":"@/hooks"}});
            let files = [
                ("package.json",package.to_string()),
                ("components.json",config.to_string()),
                ("tsconfig.json",r#"{"compilerOptions":{"target":"ES2020","jsx":"react-jsx","module":"ESNext","moduleResolution":"Bundler","baseUrl":".","paths":{"@/*":["./src/*"]}}}"#.into()),
                ("vite.config.ts",if library=="shadcn" { "import {defineConfig} from 'vite'; import tailwindcss from '@tailwindcss/vite'; export default defineConfig({plugins:[tailwindcss()],resolve:{alias:{'@':new URL('./src',import.meta.url).pathname}}});".into() } else { "export default {};".into() }),
                ("src/styles.css",if library=="shadcn" { "@import 'tailwindcss';".into() } else { "".into() }),
                ("src/lib/utils.ts","import {clsx,type ClassValue} from 'clsx'; import {twMerge} from 'tailwind-merge'; export function cn(...inputs:ClassValue[]){return twMerge(clsx(inputs));}".into()),
                ("src/main.tsx","import {createRoot} from 'react-dom/client'; import './styles.css'; createRoot(document.getElementById('root')!).render(<h1>Library workspace ready</h1>);".into()),
                ("index.html","<div id=\"root\"></div><script type=\"module\" src=\"/src/main.tsx\"></script>".into()),
            ];
            for (name,contents) in files { std::fs::write(workspace.join(name),contents).map_err(|e| e.to_string())?; }
            let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };
            let output = Command::new(npm).args(["install","--ignore-scripts"]).current_dir(&workspace).output().map_err(|e| format!("Node.js/npm is required: {e}"))?;
            let mut log = format!("{}\n{}",String::from_utf8_lossy(&output.stdout),String::from_utf8_lossy(&output.stderr));
            std::fs::write(workspace.join("install.log"),&log).map_err(|e| e.to_string())?;
            if !output.status.success() { return Err("npm install failed; see install.log".into()); }
            if library == "shadcn" {
                // Fixed official CLI, fixed registry selection, no shell or metadata-supplied arguments.
                let output = Command::new(npm).args(["exec","--yes","--package=shadcn@3.8.5","--","shadcn","add","--all","--yes"]).env("npm_config_ignore_scripts","true").current_dir(&workspace).output().map_err(|e| e.to_string())?;
                log.push_str(&format!("\n{}\n{}",String::from_utf8_lossy(&output.stdout),String::from_utf8_lossy(&output.stderr)));
                std::fs::write(workspace.join("install.log"),log).map_err(|e| e.to_string())?;
                if !output.status.success() { return Err("shadcn registry installation failed; see install.log".into()); }
            }
            Ok(workspace.display().to_string())
        })();
        result.map(Some).map_err(|e| format!("{e}. Workspace preserved at {}",workspace.display()))
    }).await.map_err(|e| e.to_string())?
}
