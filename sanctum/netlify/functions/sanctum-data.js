const { getStore } = require('@netlify/blobs');
const fs = require('fs');
const path = require('path');
const KEY = 'sanctum-state-v31';
function json(status, body){return {statusCode:status,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)}}
exports.handler = async (event) => {
  const store = getStore('emberlight-sanctum');
  if(event.httpMethod === 'GET'){
    const saved = await store.get(KEY, { type:'json' });
    if(saved) return json(200, saved);
    const fallback = JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/default-state.json'),'utf8'));
    return json(200, fallback);
  }
  if(event.httpMethod === 'POST'){
    const expected = process.env.ADMIN_KEY;
    if(!expected) return json(500,{error:'ADMIN_KEY environment variable is missing in Netlify.'});
    if(event.headers['x-admin-key'] !== expected) return json(401,{error:'Invalid admin key.'});
    const data = JSON.parse(event.body || '{}');
    data.updatedAt = new Date().toISOString();
    await store.setJSON(KEY, data);
    return json(200,{ok:true,updatedAt:data.updatedAt});
  }
  return json(405,{error:'Method not allowed'});
};
