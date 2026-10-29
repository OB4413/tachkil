import { invoke, isTauri } from "@tauri-apps/api/core";
import { parseProject, type Project } from "./model";
function native() {
  if (!isTauri())
    throw new Error(
      "Launch with npm run desktop for native file operations. This browser window is development preview only.",
    );
}
export async function saveProject(project: Project) {
  native();
  return invoke<string | null>("save_project", {
    contents: JSON.stringify(project, null, 2),
  });
}
export async function openProject() {
  native();
  const raw = await invoke<string | null>("open_project");
  return raw ? parseProject(raw) : null;
}
export async function exportFiles(files: Record<string, string>) {
  native();
  return invoke<string | null>("export_files", { files });
}
export async function installLibrary(library: string) {
  native();
  return invoke<string | null>("install_library", { library, approved: true });
}
