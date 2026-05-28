const { getStore } = require('@netlify/blobs');

function json(status, body){
  return {statusCode:status,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)};
}

function clean(v){ return String(v || '').trim(); }
function validEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

async function mlFetch(path, options={}){
  const key = process.env.MAILERLITE_API_KEY;
  if(!key) return { skipped:true, reason:'MAILERLITE_API_KEY not configured' };
  const res = await fetch('https://connect.mailerlite.com/api' + path, {
    ...options,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw:text }; }
  if(!res.ok) throw new Error(`MailerLite ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function getMailerLiteGroupId(){
  if(process.env.MAILERLITE_GROUP_ID) return process.env.MAILERLITE_GROUP_ID;
  const desiredName = process.env.MAILERLITE_GROUP_NAME || 'Sanctum Updates';
  const groups = await mlFetch('/groups?limit=100');
  if(groups.skipped) return null;
  const existing = (groups.data || []).find(g => String(g.name || '').toLowerCase() === desiredName.toLowerCase());
  if(existing) return existing.id;
  const created = await mlFetch('/groups', { method:'POST', body: JSON.stringify({ name: desiredName }) });
  return created?.data?.id || null;
}

async function subscribeToMailerLite(data){
  if(!data.updates) return { subscribed:false, reason:'visitor did not consent to updates' };
  const email = clean(data.email);
  if(!validEmail(email)) return { subscribed:false, reason:'invalid email' };
  const groupId = await getMailerLiteGroupId();
  if(!groupId) return { subscribed:false, reason:'MailerLite not configured' };
  const payload = {
    email,
    groups: [String(groupId)],
    fields: {
      name: clean(data.name),
      source: 'Emberlight Sanctum',
      enquiry_type: clean(data.type),
      message_preview: clean(data.message).slice(0, 240)
    }
  };
  const result = await mlFetch('/subscribers', { method:'POST', body: JSON.stringify(payload) });
  return { subscribed:true, groupId, subscriberId: result?.data?.id || null };
}

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  let data = {};
  try { data = JSON.parse(event.body || '{}'); } catch { return json(400,{error:'Invalid JSON'}); }

  const submission = {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    createdAt: new Date().toISOString(),
    name: clean(data.name),
    email: clean(data.email),
    type: clean(data.type),
    message: clean(data.message),
    consent: !!data.consent,
    updates: !!data.updates
  };
  if(!submission.name || !validEmail(submission.email) || !submission.message) {
    return json(422,{error:'Name, valid email, and message are required.'});
  }

  const store = getStore('emberlight-sanctum');
  const CONTACTS_KEY = 'sanctum-contacts-v31';
  const existing = await store.get(CONTACTS_KEY,{type:'json'}).catch(()=>null) || [];
  existing.unshift(submission);
  await store.setJSON(CONTACTS_KEY, existing.slice(0,500));

  let mailerLite = { subscribed:false, reason:'not attempted' };
  try { mailerLite = await subscribeToMailerLite(submission); }
  catch(err) { mailerLite = { subscribed:false, error: err.message }; console.error(err); }

  return json(200,{ok:true,stored:true,mailerLite});
};
