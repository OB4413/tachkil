import { useState } from "react";
import { installLibrary } from "./desktop";
import type { Library } from "./catalog";
export function LibraryManager({ close }: { close: () => void }) {
  const [library, setLibrary] = useState<Library>("shadcn"),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState("");
  return (
    <div className="overlay">
      <div className="dialog">
        <h2>Install a library workspace</h2>
        <p>
          Install into a new folder using Node.js/npm. shadcn downloads all
          components from its official registry; MUI and Ant Design install
          their complete packages.
        </p>
        <label>
          Library
          <select
            disabled={busy}
            value={library}
            onChange={(e) => setLibrary(e.target.value as Library)}
          >
            <option value="shadcn">shadcn/ui · all registry components</option>
            <option value="mui">Material UI</option>
            <option value="antd">Ant Design</option>
          </select>
        </label>
        <p>Commands that will run in the new workspace:</p>
        <pre>
          npm install --ignore-scripts
          {library === "shadcn"
            ? "\nnpm exec --yes --package=shadcn@3.8.5 --\n  shadcn add --all --yes"
            : ""}
        </pre>
        <p>
          Installation downloads dependencies and, for shadcn, runs the official
          CLI. Only Button, Input and Card currently have visual adapters;
          installing other components does not enable them in the canvas yet.
        </p>
        {result && <p role="status">{result}</p>}
        <div className="actions">
          <button
            className="accent"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setResult("Installing… this can take several minutes.");
              try {
                const path = await installLibrary(library);
                setResult(
                  path ? `Installed in ${path}` : "Installation canceled.",
                );
              } catch (e) {
                setResult(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Installing…" : "Approve & choose folder"}
          </button>
          <button disabled={busy} onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
