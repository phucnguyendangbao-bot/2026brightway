import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup() {
  const node = tag => ({tag, attributes:{},children:[],textContent:'',setAttribute(name,value){this.attributes[name]=value;},replaceChildren(...children){this.children=children;},append(...children){this.children.push(...children);},addEventListener(name,handler){this[name]=handler;}});
  const context={window:{},document:{createElement:node},WeakMap,Promise,Error,setTimeout,clearTimeout};
  vm.runInNewContext(fs.readFileSync(new URL('../assets/js/content-state.js',import.meta.url),'utf8'),context);
  return {load:context.window.BWContent.load,host:node('main')};
}

test('CMS loading settles and renders the original successful response', async()=>{
  const {load,host}=setup();
  const data=Object.freeze({source:'existing-request'});
  let rendered;
  const pending=load(host,()=>data,value=>{rendered=value;});
  assert.equal(host.attributes['aria-busy'],'true');
  await pending;
  assert.equal(rendered,data);
  assert.equal(host.attributes['aria-busy'],'false');
});

test('CMS failure has a working retry without exposing internal errors',async()=>{
  const {load,host}=setup();
  let retried=0;
  await load(host,()=>Promise.reject(new Error('private implementation detail')),()=>{}, {errorTitle:'Không thể tải',retry:()=>retried++});
  const state=host.children[0];
  assert.equal(state.children[0].textContent,'Không thể tải');
  assert.ok(!state.children.some(child=>child.textContent.includes('private')));
  const button=state.children[2];
  button.click();
  assert.equal(retried,1);
  assert.equal(button.disabled,true);
  assert.equal(host.attributes['aria-busy'],'false');
});

test('CMS requests that never respond become a retry state',async()=>{
  const {load,host}=setup();
  let rendered=false;
  await load(host,()=>new Promise(()=>{}),()=>{rendered=true;},{timeoutMs:5,retry:()=>{}});
  assert.equal(rendered,false);
  assert.equal(host.children[0].children[2].textContent,'Thử lại');
  assert.equal(host.attributes['aria-busy'],'false');
});

test('late CMS results cannot overwrite a newer search or release its loading state',async()=>{
  const {load,host}=setup();
  let resolveOld,resolveNew;
  const seen=[];
  const older=load(host,()=>new Promise(resolve=>{resolveOld=resolve;}),value=>seen.push(value));
  await Promise.resolve();
  const newer=load(host,()=>new Promise(resolve=>{resolveNew=resolve;}),value=>seen.push(value));
  await Promise.resolve();
  resolveOld('stale');
  await older;
  assert.equal(host.attributes['aria-busy'],'true');
  resolveNew('current');
  await newer;
  assert.deepEqual(seen,['current']);
  assert.equal(host.attributes['aria-busy'],'false');
});

test('a response arriving after timeout does not replace the recovery controls',async()=>{
  const {load,host}=setup();
  let resolve;
  let renders=0;
  await load(host,()=>new Promise(done=>{resolve=done;}),()=>renders++,{timeoutMs:5});
  resolve('late');
  await Promise.resolve();
  assert.equal(renders,0);
  assert.equal(host.children[0].children[2].textContent,'Thử lại');
});
