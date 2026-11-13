import { it,expect } from 'vitest';
import { mkdtemp,mkdir,writeFile } from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,dirname} from 'node:path';import {execFileSync} from 'node:child_process';
import {examples,descriptor} from '../src/catalog';import {generate} from '../src/export';import {newProject,makeExampleNode,makeNode} from '../src/model';
it.skipIf(!process.env.EXPORT_SMOKE)('installs, typechecks and builds every shadcn catalog example',async()=>{
 const p=newProject('All shadcn examples');p.root.children=examples.map(e=>{const n=makeExampleNode(e.componentId,e.props);if(descriptor(n.componentId).children)n.children.push(makeNode('layout.Text'));return n;});p.root.responsive.mobile={flexDirection:'column',gap:8};
 const files=await generate(p),dir=await mkdtemp(join(tmpdir(),'studio-shadcn-all-'));for(const [name,contents]of Object.entries(files)){const path=join(dir,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,contents);}console.log(`Export fixture: ${dir} (${examples.length} examples)`);
 execFileSync('npm',['install','--ignore-scripts'],{cwd:dir,timeout:180000,stdio:'pipe'});
 try{const output=execFileSync('npm',['run','build'],{cwd:dir,timeout:180000,encoding:'utf8',stdio:'pipe'});expect(output).toContain('built in');}catch(error){const e=error as {stdout?:string;stderr?:string};throw new Error(`${e.stdout}\n${e.stderr}`);}
},360000);
