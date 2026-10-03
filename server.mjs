import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateMeasurement,STALE_MS} from './telemetry.mjs';
export function createApp({root=path.dirname(fileURLToPath(import.meta.url)),storageFile=path.join(root,'.runtime','measurements.json'),deviceToken=process.env.DEVICE_TOKEN}={}) {
  if(deviceToken===undefined){
    const tokenFile=path.join(root,'.runtime','device-token');
    fs.mkdirSync(path.dirname(tokenFile),{recursive:true});
    if(!fs.existsSync(tokenFile))fs.writeFileSync(tokenFile,crypto.randomBytes(32).toString('hex'),{mode:0o600});
    deviceToken=fs.readFileSync(tokenFile,'utf8').trim();
  }
  let history=[];
  try { history=JSON.parse(fs.readFileSync(storageFile,'utf8'));if(!Array.isArray(history))throw new Error('Invalid history'); } catch(e){if(e.code!=='ENOENT')throw e;}
  const clients=new Set();
  const latest=()=>history.at(-1)||null;
  const snapshot=()=>({measurements:history,latest:latest(),connected:!!latest()&&Date.now()-Date.parse(latest().receivedAt)<STALE_MS,tokenConfigured:!!deviceToken});
  const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const publish=(event,data)=>{for(const c of clients)c.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);};
  const server=http.createServer(async(req,res)=>{
    let url;try{url=new URL(req.url,'http://localhost');}catch{return json(res,400,{error:'Қате URL'});}
    if(url.pathname==='/api/measurements'&&req.method==='GET')return json(res,200,snapshot());
    if(url.pathname==='/api/events'&&req.method==='GET'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
      res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot())}\n\n`);clients.add(res);
      const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),10000);req.on('close',()=>{clearInterval(heartbeat);clients.delete(res);});return;
    }
    if(url.pathname==='/api/measurements'&&req.method==='POST'){
      if(!deviceToken)return json(res,503,{error:'Серверде DEVICE_TOKEN орнатылмаған.'});
      const supplied=Buffer.from(req.headers['x-device-token']||'');const expected=Buffer.from(deviceToken);
      if(supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected))return json(res,401,{error:'Құрылғы кілті дұрыс емес.'});
      if(!req.headers['content-type']?.includes('application/json'))return json(res,415,{error:'Content-Type: application/json қажет.'});
      let body='';try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192){json(res,413,{error:'Дерек көлемі тым үлкен.'});return;}}}catch{return json(res,400,{error:'Сұрау үзілді.'});}
      let measurement;try{measurement=validateMeasurement(JSON.parse(body));}catch(e){return json(res,400,{error:e instanceof SyntaxError?'JSON дұрыс емес.':e.message});}
      measurement={...measurement,id:crypto.randomUUID(),receivedAt:new Date().toISOString()};
      const next=[...history,measurement].slice(-1000);
      try{fs.mkdirSync(path.dirname(storageFile),{recursive:true});fs.writeFileSync(storageFile+'.tmp',JSON.stringify(next));fs.renameSync(storageFile+'.tmp',storageFile);}catch{return json(res,500,{error:'Өлшемді сақтау мүмкін болмады.'});}
      history=next;publish('measurement',measurement);return json(res,201,{measurement});
    }
    if(url.pathname.startsWith('/api/'))return json(res,404,{error:'API жолы табылмады.'});
    if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Әдіс рұқсат етілмеген.'});
    let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return json(res,400,{error:'Қате URL'});}
    // Only public website assets can be served; tokens, history, firmware and server code stay private.
    const allowed=new Set(['/index.html','/app.js','/data.js','/live.js','/styles.css']);
    if(pathname==='/')pathname='/index.html';
    if(!allowed.has(pathname)&&!/^\/public\/[a-zA-Z0-9_./-]+$/.test(pathname))return json(res,404,{error:'Файл табылмады.'});
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||pathname.split('/').some(part=>part.startsWith('.')))return json(res,403,{error:'Рұқсат жоқ.'});
    const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};
    fs.readFile(file,(err,data)=>{if(err)return json(res,404,{error:'Файл табылмады.'});res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);});
  });
  server.on('close',()=>{for(const c of clients)c.end();});return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=createApp();server.requestTimeout=10000;
  server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>{console.log(`Berel ArheoScan: http://localhost:${Number(process.env.PORT)||3000}`);console.log('ESP32 қосылымы: firmware/berel_arheoscan және README.md');});
}
