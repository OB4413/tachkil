import React, { Component, type ReactNode } from 'react';
import * as command from './components/ui/command';
import * as contextMenu from './components/ui/context-menu';
import * as menubar from './components/ui/menubar';
import * as navigationMenu from './components/ui/navigation-menu';
import * as field from './components/ui/field';
import * as item from './components/ui/item';
import * as inputOTP from './components/ui/input-otp';
import * as drawer from './components/ui/drawer';
import * as carousel from './components/ui/carousel';
import * as resizable from './components/ui/resizable';
import * as studioMenuCheckbox from './components/ui/studio-menu-checkbox';
import { PlusIcon, ArrowRightIcon, CheckIcon, InfoIcon, FolderIcon, SearchIcon, BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import { recipe, type Child, type Element } from './recipes';
import type { Node } from './model';
import * as m0 from './components/ui/accordion';
import * as m1 from './components/ui/alert';
import * as m2 from './components/ui/alert-dialog';
import * as m3 from './components/ui/aspect-ratio';
import * as m4 from './components/ui/avatar';
import * as m5 from './components/ui/badge';
import * as m6 from './components/ui/breadcrumb';
import * as m7 from './components/ui/button';
import * as m8 from './components/ui/button-group';
import * as m9 from './components/ui/card';
import * as m10 from './components/ui/checkbox';
import * as m11 from './components/ui/collapsible';
import * as m12 from './components/ui/dialog';
import * as m13 from './components/ui/dropdown-menu';
import * as m14 from './components/ui/empty';
import * as m15 from './components/ui/hover-card';
import * as m16 from './components/ui/input';
import * as m17 from './components/ui/input-group';
import * as m18 from './components/ui/kbd';
import * as m19 from './components/ui/label';
import * as m20 from './components/ui/native-select';
import * as m21 from './components/ui/pagination';
import * as m22 from './components/ui/popover';
import * as m23 from './components/ui/progress';
import * as m24 from './components/ui/radio-group';
import * as m25 from './components/ui/scroll-area';
import * as m26 from './components/ui/select';
import * as m27 from './components/ui/separator';
import * as m28 from './components/ui/sheet';
import * as m29 from './components/ui/skeleton';
import * as m30 from './components/ui/slider';
import * as m31 from './components/ui/spinner';
import * as m32 from './components/ui/switch';
import * as m33 from './components/ui/table';
import * as m34 from './components/ui/tabs';
import * as m35 from './components/ui/textarea';
import * as m36 from './components/ui/toggle';
import * as m37 from './components/ui/toggle-group';
import * as m38 from './components/ui/tooltip';
const modules:Record<string, Record<string,unknown>> = {
 command,'context-menu':contextMenu,menubar,'navigation-menu':navigationMenu,field,item,'input-otp':inputOTP,drawer,carousel,resizable,'studio-menu-checkbox':studioMenuCheckbox,
'accordion':m0,
'alert':m1,
'alert-dialog':m2,
'aspect-ratio':m3,
'avatar':m4,
'badge':m5,
'breadcrumb':m6,
'button':m7,
'button-group':m8,
'card':m9,
'checkbox':m10,
'collapsible':m11,
'dialog':m12,
'dropdown-menu':m13,
'empty':m14,
'hover-card':m15,
'input':m16,
'input-group':m17,
'kbd':m18,
'label':m19,
'native-select':m20,
'pagination':m21,
'popover':m22,
'progress':m23,
'radio-group':m24,
'scroll-area':m25,
'select':m26,
'separator':m27,
'sheet':m28,
'skeleton':m29,
'slider':m30,
'spinner':m31,
'switch':m32,
'table':m33,
'tabs':m34,
'textarea':m35,
'toggle':m36,
'toggle-group':m37,
'tooltip':m38,'lucide-react':{PlusIcon,ArrowRightIcon,CheckIcon,InfoIcon,FolderIcon,SearchIcon,BoldIcon,ItalicIcon,UnderlineIcon}};

export function resolveElement(element:Element):React.ElementType {
 if(!element.module)return element.tag as React.ElementType;
 const component=modules[element.module]?.[element.tag];
 if(!component)throw new Error('Missing registered component '+element.module+'.'+element.tag);
 return component as React.ElementType;
}
export function ComponentView({node,children,style}:{node:Node;children?:ReactNode;style?:React.CSSProperties}) {
 const root=recipe(node);
 function render(item:Child,key:string):ReactNode {
  if(typeof item==='string')return item;
  if('slot' in item)return <React.Fragment key={key}>{children}</React.Fragment>;
  const props={...item.props,key,...(item===root?{style}: {})};
  const content=item.children.map((child,i)=>render(child,key+'-'+i));
  return React.createElement(resolveElement(item),props,...content);
 }
 return render(root,node.id);
}
export class PreviewBoundary extends Component<{children:ReactNode;resetKey:string},{error:string}> {
 state={error:''};
 static getDerivedStateFromError(error:Error){return {error:error.message};}
 componentDidUpdate(prev:{resetKey:string}){if(prev.resetKey!==this.props.resetKey&&this.state.error)this.setState({error:''});}
 render(){return this.state.error?<div role="alert" className="previewError">Preview failed: {this.state.error}</div>:this.props.children;}
}
