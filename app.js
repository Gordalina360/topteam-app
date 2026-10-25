'use strict';
const $=id=>document.getElementById(id);
const show=id=>['config','auth','signup','forgot','newPassword','dashboard'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
let settings=null,token=null,userId=null,profile=null,distributors=[],clients=[],editingId=null;
function parseConfig(){try{const value=JSON.parse(localStorage.getItem('topteam_public_config'));if(value&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value.url)&&value.key)return value;}catch{}return null;}
function headers(extra={}){return {'apikey':settings.key,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{}),...extra};}
async function api(path,opts={}){const res=await fetch(settings.url.replace(/\/$/,'')+path,{...opts,headers:headers(opts.headers||{})});const raw=await res.text();let body={};try{body=raw?JSON.parse(raw):{};}catch{}if(!res.ok)throw Error(body.msg||body.error_description||body.message||body.hint||'Pedido não concluído ('+res.status+')');return body;}
function roleName(role){return ({administrador:'Administrador',distribuidor:'Distribuidor',cliente:'Cliente'})[role]||'Utilizador';}
function message(id,value){$(id).textContent=value||'';}
function textNode(tag,value,cls){const n=document.createElement(tag);n.textContent=value??'';if(cls)n.className=cls;return n;}
async function loadProfile(user){
  userId=user.id;profile=null;
  try{
    const p=await api('/rest/v1/perfis?id=eq.'+encodeURIComponent(user.id)+'&select=*');
    if(!Array.isArray(p)||!p.length)throw Error('O teu perfil ainda não está disponível. Contacta o administrador.');
    profile=p[0];
    if(profile.ativo!==true||profile.estado_aprovacao!=='aprovado'){
      token=null;userId=null;profile=null;show('auth');
      message('authError','A tua conta está pendente de aprovação pelo administrador.');return;
    }
    message('welcome','Olá, '+(profile.nome||user.email.split('@')[0]));
    message('role',roleName(profile.tipo||profile.papel||profile.role)+' · '+(profile.nome||''));
    show('dashboard');
  }catch(err){token=null;userId=null;profile=null;show('auth');message('authError',err.message);}
}
async function openClients(){$('home').classList.add('hidden');$('clientsView').classList.remove('hidden');$('clientFormPanel').classList.add('hidden');message('clientsMessage','A carregar clientes…');try{if(!profile||!['administrador','distribuidor'].includes(profile.tipo))throw Error('Este módulo está reservado a administradores e distribuidores.');if(profile.tipo==='administrador'){distributors=await api('/rest/v1/perfis?select=id,nome,tipo&tipo=in.(administrador,distribuidor)&order=nome.asc');}else{distributors=[{id:userId,nome:profile.nome,tipo:profile.tipo}];}await loadClients();}catch(e){message('clientsMessage',e.message);}}
async function loadClients(){clients=await api('/rest/v1/clientes?select=id,nome,email,telefone,objetivo,ativo,distribuidor_id,criado_em&order=nome.asc&limit=500');message('clientsMessage',clients.length+' cliente(s) encontrado(s)');renderClients();}
function renderClients(){const list=$('clientsList');list.replaceChildren();const q=$('clientSearch').value.trim().toLocaleLowerCase('pt-PT');const filtered=clients.filter(c=>[c.nome,c.email,c.telefone].some(v=>(v||'').toLocaleLowerCase('pt-PT').includes(q)));if(!filtered.length){list.append(textNode('p','Sem clientes para apresentar.'));return;}for(const c of filtered){const item=document.createElement('article');item.className='clientItem'+(c.ativo?'':' muted');item.append(textNode('h3',c.nome+(c.ativo?'':' · Inativo')));if(c.email)item.append(textNode('p','Email: '+c.email));if(c.telefone)item.append(textNode('p','Telefone: '+c.telefone));if(c.objetivo)item.append(textNode('p','Objetivo: '+c.objetivo));const d=distributors.find(x=>x.id===c.distribuidor_id);item.append(textNode('p','Distribuidor: '+(d?.nome||'Não disponível')));const b=document.createElement('button');b.className='secondary';b.textContent='Ver / editar ficha';b.onclick=()=>editClient(c.id);item.append(b);list.append(item);}}
function fillDistributorOptions(selected){const select=$('clientDistributor');select.replaceChildren();for(const d of distributors){const option=document.createElement('option');option.value=d.id;option.textContent=d.nome||d.id;select.append(option);}select.value=selected||userId;$('distributorLabel').classList.toggle('hidden',profile?.tipo!=='administrador');}
function editClient(id=null){editingId=id;const c=clients.find(x=>x.id===id);message('formError','');message('formTitle',c?'Ficha do cliente':'Adicionar cliente');$('clientName').value=c?.nome||'';$('clientEmail').value=c?.email||'';$('clientPhone').value=c?.telefone||'';$('clientGoal').value=c?.objetivo||'';$('clientActive').checked=c?.ativo??true;fillDistributorOptions(c?.distribuidor_id);$('clientFormPanel').classList.remove('hidden');$('clientFormPanel').scrollIntoView({behavior:'smooth',block:'start'});}
$('connect').onclick=()=>{const url=$('url').value.trim().replace(/\/$/,'');const key=$('key').value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!key){message('configError','Confirma o URL do projeto e a chave pública.');return;}settings={url,key};localStorage.setItem('topteam_public_config',JSON.stringify(settings));show('auth');};
$('resetConfig').onclick=()=>{localStorage.removeItem('topteam_public_config');settings=null;token=null;show('config');};
$('login').onsubmit=async e=>{e.preventDefault();message('authError','');$('login').querySelector('button').disabled=true;try{const data=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});token=data.access_token;await loadProfile(data.user);}catch(err){message('authError',err.message);}finally{$('login').querySelector('button').disabled=false;}};
const returnUrl=()=>window.location.origin+window.location.pathname;
$('openSignup').onclick=()=>{message('signupMessage','');show('signup');};
$('openForgot').onclick=()=>{message('forgotMessage','');$('forgotEmail').value=$('email').value;show('forgot');};
$('signupBack').onclick=$('forgotBack').onclick=()=>show('auth');
$('signupForm').onsubmit=async e=>{
  e.preventDefault();message('signupMessage','');const btn=$('signupForm').querySelector('button');btn.disabled=true;
  try{
    const email=$('signupEmail').value.trim();const password=$('signupPassword').value;const nome=$('signupName').value.trim();
    if(password.length<8)throw Error('A palavra-passe deve ter pelo menos 8 caracteres.');
    await api('/auth/v1/signup?redirect_to='+encodeURIComponent(returnUrl()),{method:'POST',body:JSON.stringify({email,password,data:{nome}})});
    $('signupForm').reset();message('signupMessage','Pedido recebido. Verifica o teu email para confirmar o registo, se solicitado. A conta só ficará disponível após aprovação.');
  }catch(err){message('signupMessage',err.message);}finally{btn.disabled=false;}
};
$('forgotForm').onsubmit=async e=>{
  e.preventDefault();message('forgotMessage','');const btn=$('forgotForm').querySelector('button');btn.disabled=true;
  try{
    await api('/auth/v1/recover',{method:'POST',body:JSON.stringify({email:$('forgotEmail').value.trim(),redirect_to:returnUrl()})});
    message('forgotMessage','Se existir uma conta associada a este email, receberás uma ligação para recuperar a palavra-passe. Verifica também o spam.');
  }catch(err){message('forgotMessage',err.message);}finally{btn.disabled=false;}
};
$('newPasswordForm').onsubmit=async e=>{
  e.preventDefault();message('newPasswordMessage','');const btn=$('newPasswordForm').querySelector('button');btn.disabled=true;
  try{
    const password=$('newPasswordValue').value;
    if(password!==$('newPasswordConfirm').value)throw Error('As palavras-passe não coincidem.');
    if(!token)throw Error('Ligação expirada. Pede uma nova recuperação.');
    await api('/auth/v1/user',{method:'PUT',body:JSON.stringify({password})});
    try{await api('/auth/v1/logout',{method:'POST'});}catch{}
    token=null;window.history.replaceState({},'',returnUrl());$('newPasswordForm').reset();show('auth');
    message('authError','Palavra-passe alterada. Já podes iniciar sessão.');
  }catch(err){message('newPasswordMessage',err.message);}finally{btn.disabled=false;}
};
function handleAuthReturn(){
  const fragment=new URLSearchParams(window.location.hash.slice(1));
  const query=new URLSearchParams(window.location.search);
  const error=fragment.get('error_description')||query.get('error_description');
  if(error){show('auth');message('authError',error);return;}
  if(fragment.get('type')==='recovery'&&fragment.get('access_token')){
    token=fragment.get('access_token');show('newPassword');return;
  }
  if(query.get('token_hash')&&query.get('type')==='recovery'){
    // Supabase PKCE/token-hash recovery links require server-side verification.
    show('auth');message('authError','Esta ligação de recuperação não é compatível. Solicita uma nova ligação.');return;
  }
  if(fragment.get('type')==='signup'){show('auth');message('authError','Email confirmado. Aguarda a aprovação da tua conta.');}
}
$('logout').onclick=async()=>{try{await api('/auth/v1/logout',{method:'POST'});}catch{}token=null;userId=null;profile=null;$('password').value='';$('clientsView').classList.add('hidden');$('home').classList.remove('hidden');show('auth');};
$('openClients').onclick=openClients;
$('backHome').onclick=()=>{$('clientsView').classList.add('hidden');$('home').classList.remove('hidden');};
$('newClient').onclick=()=>editClient();
$('cancelClient').onclick=()=>{$('clientFormPanel').classList.add('hidden');};
$('clientSearch').oninput=renderClients;
$('clientForm').onsubmit=async e=>{e.preventDefault();message('formError','');const btn=$('saveClient');btn.disabled=true;try{const payload={nome:$('clientName').value.trim(),email:$('clientEmail').value.trim()||null,telefone:$('clientPhone').value.trim()||null,objetivo:$('clientGoal').value.trim()||null,ativo:$('clientActive').checked,distribuidor_id:profile.tipo==='administrador'?$('clientDistributor').value:userId};if(!payload.nome)throw Error('Introduz o nome do cliente.');if(!payload.distribuidor_id)throw Error('Seleciona um distribuidor.');const path=editingId?'/rest/v1/clientes?id=eq.'+encodeURIComponent(editingId):'/rest/v1/clientes';await api(path,{method:editingId?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});$('clientFormPanel').classList.add('hidden');await loadClients();message('clientsMessage','Cliente guardado com sucesso.');}catch(err){message('formError',err.message);}finally{btn.disabled=false;}};
settings=parseConfig();show(settings?'auth':'config');if(settings)handleAuthReturn();
