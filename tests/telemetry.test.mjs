import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';
import {validateMeasurement} from '../telemetry.mjs';

test('telemetry derives states from calibrated readings and validates GPS',()=>{
  assert.equal(validateMeasurement({pointId:'B-07',signal:74,baseline:46,status:'NORMAL'}).status,'ANOMALY');
  assert.equal(validateMeasurement({pointId:'B-01',signal:48,baseline:46}).status,'NORMAL');
  assert.equal(validateMeasurement({pointId:'B-02',signal:63,baseline:46}).status,'RECHECK');
  assert.equal(validateMeasurement({pointId:'B-01',signal:45,baseline:46}).deviation,1);
  assert.equal(validateMeasurement({pointId:'B-07',signal:0,baseline:0,lat:0,lng:0}).lat,0);
  assert.throws(()=>validateMeasurement({pointId:'<script>',signal:74,baseline:46}));
  for(const input of [{signal:'74'},{signal:NaN},{signal:101},{baseline:undefined},{lat:49},{lat:91,lng:86},{lat:49,lng:'86'}])assert.throws(()=>validateMeasurement({pointId:'B-07',signal:74,baseline:46,...input}));
});

test('API authenticates, persists and streams measurements without exposing private files',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'berel-test-'));const storageFile=path.join(dir,'measurements.json');
  const server=createApp({storageFile,deviceToken:'test-token'});let restarted;
  server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  const abort=new AbortController();
  try{
    const empty=await(await fetch(base+'/api/measurements')).json();assert.equal(empty.latest,null);assert.equal(empty.connected,false);
    const events=await fetch(base+'/api/events',{signal:abort.signal});const reader=events.body.getReader();const decoder=new TextDecoder();assert.match(decoder.decode((await reader.read()).value),/event: snapshot/);
    const payload={pointId:'B-07',signal:74,baseline:46,lat:49.3333,lng:86.3667,moundId:'K-11'};
    const post=(body,token='test-token')=>fetch(base+'/api/measurements',{method:'POST',headers:{'Content-Type':'application/json','X-Device-Token':token},body:JSON.stringify(body)});
    assert.equal((await post(payload,'wrong')).status,401);
    assert.equal((await post({...payload,lat:100})).status,400);
    const saved=await post(payload);assert.equal(saved.status,201);const {measurement}=await saved.json();assert.equal(measurement.status,'ANOMALY');assert.equal(measurement.deviation,28);assert.equal(measurement.source,'ESP32');
    const streamed=decoder.decode((await reader.read()).value);assert.match(streamed,/event: measurement/);assert.match(streamed,/"pointId":"B-07"/);
    const data=await(await fetch(base+'/api/measurements')).json();assert.equal(data.connected,true);assert.equal(data.measurements.length,1);assert.equal(data.latest.id,measurement.id);
    for(const privateFile of ['/server.mjs','/.runtime/measurements.json','/firmware/berel_arheoscan/config.h','/public/%2e%2e/server.mjs'])assert.notEqual((await fetch(base+privateFile)).status,200);
    assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/live.js')).status,200);
    assert.equal((await fetch(base+'/api/measurements',{method:'POST',headers:{'Content-Type':'application/json','X-Device-Token':'test-token'},body:'{broken'})).status,400);
    assert.equal((await fetch(base+'/api/measurements',{method:'POST',headers:{'Content-Type':'application/json','X-Device-Token':'test-token'},body:'x'.repeat(9000)})).status,413);
    restarted=createApp({storageFile,deviceToken:'test-token'});restarted.listen(0,'127.0.0.1');await once(restarted,'listening');const restored=await(await fetch(`http://127.0.0.1:${restarted.address().port}/api/measurements`)).json();assert.equal(restored.latest.id,measurement.id);
    abort.abort();await reader.cancel().catch(()=>{});
  }finally{abort.abort();server.closeAllConnections();await new Promise(r=>server.close(r));if(restarted){restarted.closeAllConnections();await new Promise(r=>restarted.close(r));}fs.rmSync(dir,{recursive:true,force:true});}
});

test('unconfigured ingestion returns actionable setup error',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'berel-empty-'));const server=createApp({deviceToken:'',storageFile:path.join(dir,'data.json')});server.listen(0,'127.0.0.1');await once(server,'listening');
  try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/measurements`,{method:'POST'});assert.equal(response.status,503);assert.match((await response.json()).error,/DEVICE_TOKEN/);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
