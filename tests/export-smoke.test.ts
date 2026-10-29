import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { catalog } from "../src/catalog";
import { generate } from "../src/export";
import { newProject, makeNode } from "../src/model";
for (const library of ["shadcn", "mui", "antd"] as const) {
  it.skipIf(!process.env.EXPORT_SMOKE)(
    `installs, typechecks and production-builds ${library} exports`,
    async () => {
      const p = newProject("Smoke test", library);
      for (const d of catalog.filter((d) => d.library === library))
        for (const variant of d.variants.length ? d.variants : [undefined])
          for (const size of d.sizes.length ? d.sizes : [undefined]) {
            const n = makeNode(d.id, variant);
            n.props.size = size;
            n.props.text = "A <real> dashboard {safe}";
            if (d.children) n.children.push(makeNode("layout.Heading"));
            p.root.children.push(n);
          }
      p.root.responsive.mobile = { flexDirection: "column", gap: 8 };
      const files = await generate(p),
        dir = await mkdtemp(join(tmpdir(), `studio-${library}-`));
      for (const [name, contents] of Object.entries(files)) {
        const path = join(dir, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, contents);
      }
      console.log(`Export fixture: ${dir}`);
      execFileSync("npm", ["install", "--ignore-scripts"], {
        cwd: dir,
        timeout: 180000,
        stdio: "pipe",
      });
      const output = execFileSync("npm", ["run", "build"], {
        cwd: dir,
        timeout: 120000,
        encoding: "utf8",
        stdio: "pipe",
      });
      expect(output).toContain("built in");
    },
    300000,
  );
}
