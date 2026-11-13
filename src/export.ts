import ts from 'typescript';
import { format } from 'prettier/standalone';
import * as typescript from 'prettier/plugins/typescript';
import * as estree from 'prettier/plugins/estree';
import { recipe, type Child, type Element, type Value } from './recipes';
import { parseProject, type Node, type Project, type Style } from './model';
import utilsSource from './lib/utils.ts?raw';
import theme from './theme.css?raw';
import manifest from '../package.json';
import notices from '../THIRD_PARTY_NOTICES.md?raw';
const sources=import.meta.glob('./components/ui/*.tsx',{query:'?raw',import:'default',eager:true}) as Record<string,string>;
const f=ts.factory;
function expression(value:Value):ts.Expression {if(Array.isArray(value))return f.createArrayLiteralExpression(value.map(v=>expression(v)));if(typeof value==='boolean')return value?f.createTrue():f.createFalse();if(typeof value==='number')return f.createNumericLiteral(value);return f.createStringLiteral(value);}
export async function generate(project:Project):Promise<Record<string,string>>{
 const validated=parseProject(JSON.stringify(project));
 const imports=new Map<string,Set<string>>(),nodes:Node[]=[];
 function element(item:Child,owner:Node):ts.JsxChild[]{
  if(typeof item==='string')return [f.createJsxExpression(undefined,expression(item))];
  if('slot' in item)return owner.children.map(node);
  if(item.module){const path=item.module==='lucide-react'?'lucide-react':`./components/ui/${item.module}`;if(!imports.has(path))imports.set(path,new Set());imports.get(path)!.add(item.tag);}
  const attributes=Object.entries(item.props).map(([name,value])=>f.createJsxAttribute(f.createIdentifier(name),f.createJsxExpression(undefined,expression(value))));
  const tag=f.createIdentifier(item.tag),children=item.children.flatMap(c=>element(c,owner));
  return [children.length?f.createJsxElement(f.createJsxOpeningElement(tag,undefined,f.createJsxAttributes(attributes)),children,f.createJsxClosingElement(tag)):f.createJsxSelfClosingElement(tag,undefined,f.createJsxAttributes(attributes))];
 }
 function node(n:Node):ts.JsxElement|ts.JsxSelfClosingElement {nodes.push(n);const root:Element=recipe(n);root.props.className=`${root.props.className||''} cs-${n.id}`.trim();return element(root,n)[0] as ts.JsxElement;}
 const body=node(validated.root);
 const declarations=[...imports].map(([path,names])=>f.createImportDeclaration(undefined,f.createImportClause(false,undefined,f.createNamedImports([...names].sort().map(name=>f.createImportSpecifier(false,undefined,f.createIdentifier(name))))),f.createStringLiteral(path)));
 declarations.push(f.createImportDeclaration(undefined,undefined,f.createStringLiteral('./styles.css')));
 const component=f.createFunctionDeclaration([f.createModifier(ts.SyntaxKind.ExportKeyword),f.createModifier(ts.SyntaxKind.DefaultKeyword)],undefined,'App',undefined,[],undefined,f.createBlock([f.createReturnStatement(body)],true));
 const source=f.createSourceFile([...declarations,component],f.createToken(ts.SyntaxKind.EndOfFileToken),ts.NodeFlags.None);
 const code=await format(ts.createPrinter().printFile(source),{parser:'typescript',plugins:[typescript,estree]});
 function css(style:Style){return Object.entries(style).map(([key,value])=>`${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}: ${value}${typeof value==='number'?'px':''};`).join(' ');}
 const rules=nodes.map(n=>`.cs-${n.id} { ${css(n.styles)} }`).join('\n');
 const responsive=(key:'tablet'|'mobile',width:number)=>`@media (max-width:${width}px) {\n${nodes.filter(n=>n.responsive[key]).map(n=>`.cs-${n.id} { ${css(n.responsive[key]!)} }`).join('\n')}\n}`;
 const files:Record<string,string>={
  'src/App.tsx':code,
  'src/styles.css':`@import "tailwindcss";\n@import "tw-animate-css";\n${theme}\nbody {margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:white;color:#171717;}\n* {box-sizing:border-box;}\n${rules}\n${responsive('tablet',900)}\n${responsive('mobile',600)}`,
  'src/main.tsx':'import {createRoot} from "react-dom/client"; import App from "./App"; createRoot(document.getElementById("root")!).render(<App/>);',
  'index.html':'<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Dashboard</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
  'tsconfig.json':JSON.stringify({compilerOptions:{target:'ES2020',lib:['ES2020','DOM'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,esModuleInterop:true,noEmit:true},include:['src']},null,2),
  'vite.config.ts':"import {defineConfig} from 'vite'; import react from '@vitejs/plugin-react'; import tailwindcss from '@tailwindcss/vite'; export default defineConfig({plugins:[react(),tailwindcss()]});",
  'README.md':'# Exported shadcn/ui dashboard\n\nRun `npm install`, then `npm run dev` or `npm run build`. Preview interactions are local UI only; connect actions to your application logic.\n\n'+notices
 };
 const packages=new Set(['react','react-dom']);
 const visited=new Set<string>();
 function include(module:string){if(visited.has(module))return;visited.add(module);const content=sources[`./components/ui/${module}.tsx`];if(!content)throw new Error('Missing export source: '+module);files[`src/components/ui/${module}.tsx`]=content;
  for(const match of content.matchAll(/from\s+["']([^"']+)["']/g)){const path=match[1];if(path.startsWith('./'))include(path.slice(2));else if(path==='../../lib/utils'){files['src/lib/utils.ts']=utilsSource;packages.add('clsx');packages.add('tailwind-merge');}else if(!path.startsWith('.'))packages.add(path.startsWith('@')?path.split('/').slice(0,2).join('/'):path.split('/')[0]);}
 }
 for(const path of imports.keys())if(path==='lucide-react')packages.add(path);else include(path.split('/').pop()!);
 function versions(names:Iterable<string>){return Object.fromEntries([...names].sort().map(name=>{const version=({...manifest.dependencies,...manifest.devDependencies} as Record<string,string>)[name];if(!version)throw new Error('Missing dependency version: '+name);return [name,version];}));}
 files['package.json']=JSON.stringify({name:'studio-dashboard',version:'1.0.0',private:true,type:'module',scripts:{dev:'vite',build:'tsc && vite build'},dependencies:versions(packages),devDependencies:versions(['vite','typescript','@types/react','@types/react-dom','@vitejs/plugin-react','tailwindcss','@tailwindcss/vite','tw-animate-css'])},null,2);
 return files;
}
