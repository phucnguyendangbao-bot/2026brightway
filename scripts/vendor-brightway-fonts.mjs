// Mechanical asset vendoring; retains the existing two BrightWay typefaces.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../assets/fonts');
const source='https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Quicksand:wght@500;600;700&display=optional';
const response=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'},signal:AbortSignal.timeout(20000)});
if(!response.ok) throw new Error('Font stylesheet HTTP '+response.status);
let css=await response.text();
const urls=[...new Set([...css.matchAll(/url\((https:\/\/fonts.gstatic.com\/[^)]+)\)/g)].map(match=>match[1]))];
if(!urls.length || urls.some(url=>!url.endsWith('.woff2'))) throw new Error('Expected official WOFF2 font resources');
await fs.mkdir(directory,{recursive:true});
let totalBytes=0;
for(const [index,url] of urls.entries()) {
  const resource=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!resource.ok) throw new Error('Font HTTP '+resource.status);
  const bytes=Buffer.from(await resource.arrayBuffer());
  if(bytes.subarray(0,4).toString()!=='wOF2') throw new Error('Invalid WOFF2 data');
  const filename=`brightway-${index+1}.woff2`;
  await fs.writeFile(path.join(directory,filename),bytes);
  css=css.replaceAll(url,filename);
  totalBytes+=bytes.length;
}
await fs.writeFile(path.join(directory,'brightway-fonts.css'),'/* Existing BrightWay fonts. SIL Open Font License; see OFL files. */\n'+css);
for(const family of ['bevietnampro','quicksand']) {
  const license=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`,{signal:AbortSignal.timeout(20000)});
  if(!license.ok) throw new Error('Missing font license');
  await fs.writeFile(path.join(directory,`${family}-OFL.txt`),await license.text());
}
await fs.writeFile(path.join(directory,'SOURCES.json'),JSON.stringify({stylesheet:source,resources:urls,licenseSource:'https://github.com/google/fonts/tree/main/ofl'},null,2));
console.log(JSON.stringify({files:urls.length,totalBytes,directory}));
