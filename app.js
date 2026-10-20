'use strict';
const $=id=>document.getElementById(id);
const show=id=>['config','auth','dashboard'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
let settings=null, token=null;
function parseConfig(){try{const value=JSON.parse(localStorage.getItem('topteam_public_config'));if(value&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value.url)&&value.key)return value;}catch{}return null;}
function headers(extra={}){return {'apikey':settings.key,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{}),...extra};}
async function api(path,opts={}){const res=await fetch(settings.url.replace(/\/$/,'')+path,{...opts,headers:headers(opts.headers||{})});const body=await res.json().catch(()=>({}));if(!res.ok)throw Error(body.msg||body.error_description||body.message||'Pedido não concluído ('+res.status+')');return body;}
function roleName(role){return ({administrador:'Administrador',distribuidor:'Distribuidor',cliente:'Cliente'})[role]||'Utilizador';}
async function loadProfile(user){$('welcome').textContent='Olá'+(user.email?', '+user.email.split('@')[0]:'');$('role').textContent='Sessão iniciada';show('dashboard');try{const p=await api('/rest/v1/perfis?id=eq.'+encodeURIComponent(user.id)+'&select=*',{headers:{'Accept':'application/json'}});if(Array.isArray(p)&&p.length){const profile=p[0];$('role').textContent=roleName(profile.tipo||profile.papel||profile.role)+(profile.nome?' · '+profile.nome:'');}}catch{$('role').textContent='Sessão iniciada · perfil não disponível';}}
$('connect').onclick=()=>{const url=$('url').value.trim().replace(/\/$/,'');const key=$('key').value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!key){$('configError').textContent='Confirma o URL do projeto e a chave pública.';return;}settings={url,key};localStorage.setItem('topteam_public_config',JSON.stringify(settings));show('auth');};
$('resetConfig').onclick=()=>{localStorage.removeItem('topteam_public_config');settings=null;show('config');};
$('login').onsubmit=async e=>{e.preventDefault();$('authError').textContent='';try{const data=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});token=data.access_token;await loadProfile(data.user);}catch(err){$('authError').textContent=err.message;}};
$('logout').onclick=async()=>{try{await api('/auth/v1/logout',{method:'POST'});}catch{}token=null;$('password').value='';show('auth');};
settings=parseConfig();show(settings?'auth':'config');
