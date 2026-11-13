import { describe,it,expect } from 'vitest';
import { newProject,makeNode,makeExampleNode,move,parseProject,cloneNode,validateProps } from './model';
import { catalog,examples,searchExamples,descriptor } from './catalog';
import { recipe,type Child } from './recipes';
import { resolveElement } from './renderer';
import { generate } from './export';
import { useStudio } from './store';
describe('shadcn catalog contract',()=>{
 it('has unique, valid examples, with renderable imports for every recipe',()=>{
  expect(new Set(examples.map(e=>e.id)).size).toBe(examples.length);
  function check(child:Child){if(typeof child==='string'||'slot' in child)return;expect(resolveElement(child)).toBeTruthy();child.children.forEach(check);}
  for(const e of examples){const node=makeExampleNode(e.componentId,e.props);check(recipe(node));}
 });
 it('searches specific input types and button states, not only family names',()=>{
  const password=searchExamples('input password');expect(password.length).toBeGreaterThan(0);expect(password.every(e=>e.componentId==='shadcn.Input'&&e.props.inputType==='password')).toBe(true);
  const disabled=searchExamples('button disabled');expect(disabled.length).toBeGreaterThan(0);expect(disabled.every(e=>e.props.state==='disabled')).toBe(true);
  expect(searchExamples('link').some(e=>e.componentId==='shadcn.Link')).toBe(true);
  expect(searchExamples('no-such-component')).toEqual([]);
 });
 it('covers every button style and size, with no redundant icon placement',()=>{
  for(const variant of ['default','secondary','outline','ghost','destructive','link'])for(const size of ['default','xs','sm','lg','icon','icon-xs','icon-sm','icon-lg'])expect(examples.some(e=>e.componentId==='shadcn.Button'&&e.props.variant===variant&&e.props.size===size)).toBe(true);
  expect(examples.filter(e=>e.componentId==='shadcn.Button'&&String(e.props.size).startsWith('icon')).every(e=>e.props.iconPlacement==='none')).toBe(true);
 });
});
describe('document and history',()=>{
 it('round-trips every example and preserves responsive overrides',()=>{const p=newProject('All examples');p.root.children=examples.map(e=>makeExampleNode(e.componentId,e.props));p.root.responsive.mobile={gridTemplateColumns:'repeat(1, minmax(0, 1fr))'};expect(parseProject(JSON.stringify(p))).toEqual(p);});
 it('rejects legacy non-shadcn projects without conversion',()=>{expect(()=>parseProject(JSON.stringify({...newProject('Old'),library:'mui'}))).toThrow('shadcn/ui projects only');});
 it('migrates old button icon fields',()=>{const p=newProject('Old'),n=makeNode('shadcn.Button');n.props={text:'Save',variant:'outline',size:'default',icon:true};p.root.children.push(n);expect(parseProject(JSON.stringify(p)).root.children[0].props.iconPlacement).toBe('leading');});
 it('rejects unknown props, unsafe links, invalid enums and duplicate IDs',()=>{expect(()=>validateProps('shadcn.Input',{inputType:'script'})).toThrow();expect(()=>validateProps('shadcn.Link',{href:'javascript:alert(1)'})).toThrow();expect(()=>validateProps('shadcn.Button',{onClick:'evil()'})).toThrow();const p=newProject('Invalid');p.root.children.push({...makeNode('shadcn.Button'),id:p.root.id});expect(()=>parseProject(JSON.stringify(p))).toThrow();});
 it('rejects cycles and invalid nesting while reparenting',()=>{const p=newProject('Tree'),a=makeNode('layout.Flex'),b=makeNode('layout.Grid'),button=makeNode('shadcn.Button');p.root.children.push(a,button);a.children.push(b);expect(move(p.root,a.id,b.id)).toBe(false);expect(move(p.root,a.id,button.id)).toBe(false);expect(move(p.root,button.id,b.id)).toBe(true);expect(b.children[0].id).toBe(button.id);expect(cloneNode(a).children[0].id).not.toBe(b.id);});
 it('undoes and redoes exact example settings',()=>{useStudio.getState().load(newProject('History'));const e=searchExamples('input password')[0];useStudio.getState().edit(p=>{p.root.children.push(makeExampleNode(e.componentId,e.props));});const before=JSON.stringify(useStudio.getState().project);useStudio.getState().undo();expect(useStudio.getState().project.root.children).toHaveLength(0);useStudio.getState().redo();expect(JSON.stringify(useStudio.getState().project)).toBe(before);});
});
describe('export',()=>{
 it('includes transitive sources and only needed UI dependencies',async()=>{const p=newProject('Dialog');p.root.children.push(makeNode('shadcn.Dialog'));const files=await generate(p);expect(files['src/components/ui/dialog.tsx']).toBeTruthy();expect(files['src/components/ui/button.tsx']).toBeTruthy();expect(files['src/components/ui/slider.tsx']).toBeUndefined();const deps=JSON.parse(files['package.json']).dependencies;expect(deps['radix-ui']).toBeTruthy();expect(deps.antd).toBeUndefined();expect(deps['@mui/material']).toBeUndefined();});
 it('escapes text and emits real inputs and anchors',async()=>{const p=newProject('Escaping');const n=makeNode('shadcn.Link');n.props.text='</a>{danger} "quoted"';p.root.children.push(n,makeExampleNode('shadcn.Input',{inputType:'password',composition:'with-label',state:'disabled'}));const files=await generate(p);expect(files['src/App.tsx']).toContain(n.props.text);expect(files['src/App.tsx']).toContain('type={"password"}');expect(files['src/App.tsx']).toContain('disabled={true}');expect(files['src/App.tsx']).toContain('<a');});
});
