import {test,expect} from '@playwright/test';
import {catalog,examples} from '../../src/catalog';
test.beforeEach(async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Create project',exact:true}).click();});
test('only shadcn is offered, and search finds exact types and states',async({page})=>{
 await expect(page.getByText('Material UI',{exact:true})).toHaveCount(0);
 await page.getByRole('textbox',{name:'Search components and examples'}).fill('input password');
 await expect(page.locator('.variantTile')).toHaveCount(12);await expect(page.locator('.sample input[type=password]')).toHaveCount(12);
 await page.getByRole('textbox',{name:'Search components and examples'}).fill('button disabled');
 await expect(page.locator('.variantTile[data-example-id^="shadcn.Button:"]')).toHaveCount(96);
 await page.getByRole('textbox',{name:'Search components and examples'}).fill('link');await expect(page.locator('.exampleFamily h3').filter({hasText:'Link'})).toBeVisible();
 await page.getByRole('textbox',{name:'Search components and examples'}).fill('unfindable-xyz');await expect(page.getByText('No matching ready-to-use examples')).toBeVisible();
});
test('add and drag preserve a password example through history and code',async({page})=>{
 await page.getByRole('textbox',{name:'Search components and examples'}).fill('input password');
 const example=page.locator('.variantTile').filter({hasText:'password · invalid · with-help'});await example.dragTo(page.locator('.empty'));
 await expect(page.locator('.canvas input')).toHaveAttribute('type','password');await expect(page.locator('.canvas input')).toHaveAttribute('aria-invalid','true');
 await page.getByLabel('Placeholder',{exact:true}).fill('Secret');await expect(page.locator('.canvas input')).toHaveAttribute('placeholder','Secret');
 await page.getByTitle('Duplicate',{exact:true}).click();await expect(page.locator('.canvas input')).toHaveCount(2);await page.getByTitle('Undo',{exact:true}).click();await expect(page.locator('.canvas input')).toHaveCount(1);await page.getByTitle('Redo',{exact:true}).click();await expect(page.locator('.canvas input')).toHaveCount(2);
 await page.getByRole('button',{name:'Code',exact:true}).click();await expect(page.locator('.codeDialog textarea')).toHaveValue(/type=\{"password"\}/);await expect(page.locator('.codeDialog textarea')).toHaveValue(/Secret/);
});
test('dialog only opens in interactive preview, not edit mode',async({page})=>{
 await page.getByRole('combobox',{name:'Component',exact:true}).selectOption('shadcn.Dialog');const tile=page.locator('.variantTile').first();await tile.getByRole('button',{name:/^Add /}).click();
 await page.locator('.canvas button').click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Preview',exact:true}).click();await page.locator('.canvas button').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('heading',{name:'Edit profile',exact:true})).toBeVisible();await page.keyboard.press('Escape');
});
test('every family renders and its interactive example opens without errors',async({page})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const family of catalog){await page.getByRole('combobox',{name:'Component',exact:true}).selectOption(family.id);await expect(page.locator('.variantTile')).toHaveCount(examples.filter(e=>e.componentId===family.id).length);await expect(page.getByText('Preview failed:',{exact:false})).toHaveCount(0);const first=page.locator('.variantTile').first();await first.getByRole('button',{name:/^Preview /}).click();await expect(page.getByRole('dialog',{name:'Component preview'})).toBeVisible();await page.getByRole('button',{name:'Close component preview'}).click();}
 expect(errors).toEqual([]);
});
