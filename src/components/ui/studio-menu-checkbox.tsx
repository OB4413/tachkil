// Studio compositions: stateful wrappers around the real shadcn menu items.
import {useState} from 'react';
import type {ComponentProps} from 'react';
import {DropdownMenuCheckboxItem} from './dropdown-menu';
import {ContextMenuCheckboxItem} from './context-menu';
export function StudioDropdownCheckbox({defaultChecked=false,...props}:Omit<ComponentProps<typeof DropdownMenuCheckboxItem>,'checked'|'onCheckedChange'>&{defaultChecked?:boolean}) {const [checked,setChecked]=useState(defaultChecked);return <DropdownMenuCheckboxItem {...props} checked={checked} onCheckedChange={setChecked} onSelect={e=>e.preventDefault()}/>;}
export function StudioContextCheckbox({defaultChecked=false,...props}:Omit<ComponentProps<typeof ContextMenuCheckboxItem>,'checked'|'onCheckedChange'>&{defaultChecked?:boolean}) {const [checked,setChecked]=useState(defaultChecked);return <ContextMenuCheckboxItem {...props} checked={checked} onCheckedChange={setChecked} onSelect={e=>e.preventDefault()}/>;}
