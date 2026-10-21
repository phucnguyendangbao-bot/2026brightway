// Optional lab measurement. Install tools under .cache/qa-tools, not app dependencies.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright-core');
const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'.cache','quality-2026-10-21','lighthouse');
fs.mkdirSync(artifacts,{recursive:true});
fs.mkdirSync(path.join(artifacts,'browser-profile'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,body)=>error?res.writeHead(404).end():res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(body));
});
(async()=>{
  let chrome;
  const measurements=[];
  try {
    const {default:lighthouse}=await import(pathToFileURL(path.join(root,'.cache/qa-tools/node_modules/lighthouse/core/index.js')));
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    const probe=http.createServer();
    await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
    const port=probe.address().port;
    await new Promise(resolve=>probe.close(resolve));
    chrome=await chromium.launch({channel:'msedge',headless:true,args:[`--remote-debugging-port=${port}`]});
    for(const file of ['index.html','page2.html','careers-holland.html','profile.html?tab=journey']) {
      console.log('Measuring '+file);
      const result=await lighthouse(base+'/'+file,{port,output:['json','html'],onlyCategories:['performance','accessibility','best-practices'],logLevel:'error',formFactor:'mobile'});
      const key=file.split('.')[0];
      fs.writeFileSync(path.join(artifacts,key+'.json'),result.report[0]);
      fs.writeFileSync(path.join(artifacts,key+'.html'),result.report[1]);
      const lhr=result.lhr;
      measurements.push({file,lighthouseVersion:lhr.lighthouseVersion,fetchTime:lhr.fetchTime,environment:lhr.environment,performance:lhr.categories.performance.score,accessibility:lhr.categories.accessibility.score,bestPractices:lhr.categories['best-practices'].score,LCP_ms:lhr.audits['largest-contentful-paint'].numericValue,CLS:lhr.audits['cumulative-layout-shift'].numericValue,TBT_ms:lhr.audits['total-blocking-time'].numericValue,runtimeError:lhr.runtimeError || null});
    }
  } finally {
    await chrome?.close();
    if(server.listening) await new Promise(resolve=>server.close(resolve));
    fs.writeFileSync(path.join(artifacts,'summary.json'),JSON.stringify({conditions:'Single local Lighthouse mobile simulated-throttling lab run per page; not production field data or p75. TBT is not INP.',measurements},null,2));
    console.log(JSON.stringify(measurements,null,2));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
