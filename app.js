const emailKey="rg_email_v5_local";
const userKey="rg_user_v5_local";

let reports=[];
let updates=[];
let emailCfg=JSON.parse(localStorage.getItem(emailKey)||"null")||{
  para:"",cc:"",bcc:"",
  assunto:"[REPORTO #{ID}] {APLICACAO} - Ticket {TICKET}",
  corpo:`Bom dia,

Foi registada uma ocorrência relativamente à aplicação {APLICACAO}.

ID do reporte: {ID}
N.º Ticket: {TICKET}
Técnico: {TECNICO}
Data/Hora: {DATA}

Problema:
{PROBLEMA}

Agradeço a análise da situação.

Cumprimentos,
{TECNICO}`
};

const updateDefault={
  para:"",cc:"",bcc:"",
  assunto3:"Aviso — Atualização programada em {DIAS} dias — {DATA}",
  corpo3:`Bom dia,

Informamos que está prevista uma atualização programada para o dia {DATA}, entre as {HORA_INICIAL} e {HORA_FINAL}.

Durante este período, a aplicação/serviço {SERVICO} poderá encontrar-se indisponível.

Motivo: {MOTIVO}

Este é um aviso prévio para que possam ser tomadas as devidas precauções.

Cumprimentos,`,
  assunto1:"⚠️ Lembrete — Atualização programada amanhã — {DATA}",
  corpo1:`Bom dia,

Relembramos que amanhã, {DATA}, será realizada uma atualização programada entre as {HORA_INICIAL} e {HORA_FINAL}.

Durante este período, a aplicação/serviço {SERVICO} estará indisponível.

Motivo: {MOTIVO}

Solicitamos que tenham em consideração esta indisponibilidade durante o período indicado.

Cumprimentos,`
};

let user=JSON.parse(localStorage.getItem(userKey)||"null")||{nome:"Ricardo Gingeira",login:"ricardo"};

const pages={
 dashboard:["Dashboard","Gestão de reportes técnicos"],
 novo:["Novo Reporte","Registar uma nova ocorrência"],
 reportes:["Reportes","Consulta e gestão de todos os reportes"],
 atualizacoes:["Atualizações","Agendar indisponibilidades e gerar emails"],
 emails:["Emails","Modelos e destinatários"],
 config:["Configuração","Definições da aplicação"],
 sobre:["Sobre","Informação da aplicação"]
};

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const ano=()=>new Date().getFullYear();
const agora=()=>new Date().toLocaleString("pt-PT");
const badge=s=>`<span class="badge ${s==="Resolvido"?"res":s==="Stand By"?"sb":""}">${esc(s)}</span>`;

function setBusy(btn,busy,text="Aguarde..."){if(!btn)return;btn.disabled=busy;if(busy){btn.dataset.old=text;btn.textContent=text}else btn.textContent=btn.dataset.old||btn.textContent}

async function carregarDados(){
  const [{data:r,error:re},{data:u,error:ue}]=await Promise.all([
    supabaseClient.from("reportes").select("*").order("id",{ascending:false}),
    supabaseClient.from("atualizacoes").select("*").order("id",{ascending:false})
  ]);
  if(re) throw re;
  if(ue) throw ue;
  reports=(r||[]).map(x=>({
    dbid:x.id,id:x.codigo||`${x.sequencia}/${x.ano}`,ano:x.ano,sequencia:x.sequencia,
    aplicacao:x.aplicacao,tecnico:x.tecnico,ticket:x.ticket,problema:x.problema,
    data:x.data_hora?new Date(x.data_hora).toLocaleString("pt-PT"):"",
    estado:x.estado,emailPreparado:x.email_preparado
  }));
  updates=(u||[]).map(x=>({
    dbid:x.id,id:x.codigo||`AT-${x.sequencia}/${x.ano}`,ano:x.ano,
    data:x.data_display||x.data_iso,dataISO:x.data_iso,inicio:x.hora_inicial,fim:x.hora_final,
    servico:x.servico,motivo:x.motivo,obs:x.observacoes,estado:x.estado,
    lembretes:x.lembretes,aviso3Enviado:x.aviso3_enviado,aviso1Enviado:x.aviso1_enviado,criado:x.criado_em
  }));
}

function nextSeq(){
  const vals=reports.filter(r=>Number(r.ano)===ano()).map(r=>Number(r.sequencia)||0);
  return vals.length?Math.max(...vals)+1:1;
}
function nextLabel(){return `${nextSeq()}/${ano()}`}

async function prep(){
  $("id").value=nextLabel();
  $("tecnico").value=user.nome;
  $("datahora").value=agora();
  $("estado").value="Aguardar";
}

async function showPage(p){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active-page"));
  const page=$(p); if(page) page.classList.add("active-page");
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
  $("pageTitle").textContent=pages[p]?.[0]||"RG Reportes";
  $("pageSubtitle").textContent=pages[p]?.[1]||"";
  if(p==="novo")await prep();
  if(p==="dashboard")renderDash();
  if(p==="reportes")renderReportes();
  if(p==="emails")loadEmail();
  if(p==="config")loadUser();
  if(p==="atualizacoes"){loadUpdateTemplate();renderUpdates()}
}

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));

async function limparFormulario(){
  $("ticket").value="";$("problema").value="";$("aplicacao").value="";
  await prep();
}

async function guardar(mail){
  if(!$("aplicacao").value||!$("ticket").value.trim()||!$("problema").value.trim()){
    alert("Preencha Aplicação, N.º Ticket e Problema.");return;
  }
  const s=nextSeq(), y=ano();
  const row={
    codigo:`${s}/${y}`,ano:y,sequencia:s,aplicacao:$("aplicacao").value,
    tecnico:user.nome,ticket:$("ticket").value.trim(),problema:$("problema").value.trim(),
    data_hora:new Date().toISOString(),estado:$("estado").value,email_preparado:false
  };
  const {data,error}=await supabaseClient.from("reportes").insert(row).select().single();
  if(error){alert("Erro ao guardar o reporte: "+error.message);return}
  const r={
    dbid:data.id,id:data.codigo,ano:data.ano,sequencia:data.sequencia,aplicacao:data.aplicacao,
    tecnico:data.tecnico,ticket:data.ticket,problema:data.problema,data:new Date(data.data_hora).toLocaleString("pt-PT"),
    estado:data.estado,emailPreparado:data.email_preparado
  };
  reports.unshift(r);
  renderDash();renderReportes();
  if(mail)await prepMail(r);else{alert(`Reporte ${r.id} guardado.`);await limparFormulario()}
}

function sub(t,r){
  return t.replaceAll("{ID}",r.id).replaceAll("{APLICACAO}",r.aplicacao)
    .replaceAll("{TECNICO}",r.tecnico).replaceAll("{TICKET}",r.ticket)
    .replaceAll("{PROBLEMA}",r.problema).replaceAll("{DATA}",r.data)
    .replaceAll("{ESTADO}",r.estado);
}

async function prepMail(r){
  await supabaseClient.from("reportes").update({email_preparado:true}).eq("id",r.dbid);
  r.emailPreparado=true;
  location.href="mailto:"+encodeURIComponent(emailCfg.para)+"?cc="+encodeURIComponent(emailCfg.cc)+"&bcc="+encodeURIComponent(emailCfg.bcc||"")+
    "&subject="+encodeURIComponent(sub(emailCfg.assunto,r))+"&body="+encodeURIComponent(sub(emailCfg.corpo,r));
  await limparFormulario();
}

function renderDash(){
  $("total").textContent=reports.length;
  $("aguardar").textContent=reports.filter(r=>r.estado==="Aguardar").length;
  $("standby").textContent=reports.filter(r=>r.estado==="Stand By").length;
  $("resolvidos").textContent=reports.filter(r=>r.estado==="Resolvido").length;
  const lp=lembretesPendentes();
  $("lembretesDashboard").innerHTML=lp.length?lp.map(x=>`<div class="reminder"><div><strong>${x.tipo==="3 dias"?"🟠 Aviso prévio":"🔴 Lembrete da atualização"}</strong><br><b>${esc(x.u.servico)}</b> — ${esc(x.u.data)} — ${esc(x.u.inicio)} às ${esc(x.u.fim)}<br><span>${x.tipo==="em atraso"?"⚠️ Email pendente/em atraso":x.tipo==="véspera"?"A atualização é amanhã.":"Aviso de 3 dias pendente."}</span></div><button class="primary small" onclick='gerarEmailUpdate(${JSON.stringify(x.u)},${x.tipo==="véspera"||x.tipo==="em atraso"?1:3})'>📧 Preparar Email</button></div>`).join("")
  :"<p class='hint'>Não existem avisos pendentes.</p>";
  $("recent").innerHTML=reports.length?`<table><thead><tr><th>Reporte</th><th>Aplicação</th><th>Técnico</th><th>Ticket</th><th>Estado</th></tr></thead><tbody>${reports.slice(0,8).map(r=>`<tr><td>${esc(r.id)}</td><td>${esc(r.aplicacao)}</td><td>${esc(r.tecnico)}</td><td>${esc(r.ticket)}</td><td>${badge(r.estado)}</td></tr>`).join("")}</tbody></table>`:"<p class='hint'>Ainda não existem reportes.</p>";
}

function renderReportes(){
  const q=($("pesquisa").value||"").toLowerCase(),f=$("filtroEstado").value;
  const list=reports.filter(r=>(!f||r.estado===f)&&Object.values(r).join(" ").toLowerCase().includes(q));
  $("tabela").innerHTML=list.length?list.map(r=>`<tr>
  <td>${esc(r.id)}</td><td>${esc(r.aplicacao)}</td><td>${esc(r.tecnico)}</td><td>${esc(r.ticket)}</td>
  <td>${esc(r.problema)}</td><td>${esc(r.data)}</td><td>${badge(r.estado)}</td>
  <td class="actions-cell">
  <select onchange="setEstado('${r.dbid}',this.value)"><option ${r.estado==="Aguardar"?"selected":""}>Aguardar</option><option ${r.estado==="Resolvido"?"selected":""}>Resolvido</option><option ${r.estado==="Stand By"?"selected":""}>Stand By</option></select>
  <button class="linkbtn" onclick="editarReporte('${r.dbid}')">✏️</button>
  <button class="linkbtn danger" onclick="apagarReporte('${r.dbid}')">🗑️</button>
  <button class="linkbtn" onclick='prepMail(${JSON.stringify(r).replace(/'/g,"&#39;")})'>📧</button>
  <button class="linkbtn" onclick="procurarOutlook('${r.dbid}')">🔎</button>
  </td></tr>`).join("")
  :"<tr><td colspan='8'>Sem resultados.</td></tr>";
}

async function editarReporte(dbid){
  const r=reports.find(x=>String(x.dbid)===String(dbid));if(!r)return;
  const a=prompt("Aplicação:",r.aplicacao);if(a===null)return;
  const t=prompt("N.º Ticket:",r.ticket);if(t===null)return;
  const p=prompt("Problema:",r.problema);if(p===null)return;
  const {error}=await supabaseClient.from("reportes").update({aplicacao:a,ticket:t,problema:p}).eq("id",dbid);
  if(error){alert("Erro ao editar: "+error.message);return}
  r.aplicacao=a;r.ticket=t;r.problema=p;renderReportes();renderDash();
}

async function apagarReporte(dbid){
  const r=reports.find(x=>String(x.dbid)===String(dbid));
  if(r&&confirm(`Tem a certeza que pretende apagar o reporte ${r.id}?`)){
    const {error}=await supabaseClient.from("reportes").delete().eq("id",dbid);
    if(error){alert("Erro ao apagar: "+error.message);return}
    reports=reports.filter(x=>String(x.dbid)!==String(dbid));renderReportes();renderDash();
  }
}

function procurarOutlook(dbid){
  const r=reports.find(x=>String(x.dbid)===String(dbid));if(!r)return;
  const q=encodeURIComponent(`subject:"[REPORTO #${r.id}] ${r.aplicacao}"`);
  window.open("https://outlook.office.com/mail/search?q="+q,"_blank");
}

async function setEstado(dbid,s){
  const r=reports.find(x=>String(x.dbid)===String(dbid));if(!r)return;
  const {error}=await supabaseClient.from("reportes").update({estado:s}).eq("id",dbid);
  if(error){alert("Erro ao alterar estado: "+error.message);return}
  r.estado=s;renderReportes();renderDash();
}

function loadEmail(){
  $("emailPara").value=emailCfg.para;$("emailCc").value=emailCfg.cc;$("emailBcc").value=emailCfg.bcc||"";
  $("emailAssunto").value=emailCfg.assunto;$("emailCorpo").value=emailCfg.corpo;
}
function guardarEmailConfig(){
  emailCfg={para:$("emailPara").value,cc:$("emailCc").value,bcc:$("emailBcc").value,assunto:$("emailAssunto").value,corpo:$("emailCorpo").value};
  localStorage.setItem(emailKey,JSON.stringify(emailCfg));alert("Configuração guardada neste navegador.");
}
function loadUser(){$("cfgTecnico").value=user.nome;$("cfgLogin").value=user.login}
function guardarUtilizador(){
  user={nome:$("cfgTecnico").value||"Ricardo Gingeira",login:$("cfgLogin").value||"ricardo"};
  localStorage.setItem(userKey,JSON.stringify(user));$("userName").textContent=user.nome;$("userLogin").textContent="Login: "+user.login;prep();alert("Utilizador atualizado.");
}

function vars(t,u,dias){
  return t.replaceAll("{ID_ATUALIZACAO}",u.id).replaceAll("{DATA}",u.data)
    .replaceAll("{HORA_INICIAL}",u.inicio).replaceAll("{HORA_FINAL}",u.fim)
    .replaceAll("{SERVICO}",u.servico||"").replaceAll("{MOTIVO}",u.motivo||"")
    .replaceAll("{OBSERVACOES}",u.obs||"").replaceAll("{DIAS}",String(dias||""));
}

function loadUpdateTemplate(){
  const s=JSON.parse(localStorage.getItem("rg_update_template_v5")||"null")||updateDefault;
  $("atPara").value=s.para||"";$("atCc").value=s.cc||"";$("atBcc").value=s.bcc||"";
  $("atAssunto3").value=s.assunto3||updateDefault.assunto3;$("atCorpo3").value=s.corpo3||updateDefault.corpo3;
  $("atAssunto1").value=s.assunto1||updateDefault.assunto1;$("atCorpo1").value=s.corpo1||updateDefault.corpo1;
  if(!$("atData").value)$("atData").value=new Date().toISOString().slice(0,10);
  if(!$("atServico").value)$("atServico").value="MEDIDATA";
  if(!$("atInicio").value)$("atInicio").value="09:00";
  if(!$("atFim").value)$("atFim").value="17:30";
}

async function guardarAtualizacao(mail){
  if(!$("atData").value||!$("atInicio").value||!$("atFim").value){alert("Indique a data, hora inicial e hora final.");return}
  if($("atFim").value<=$("atInicio").value){alert("A hora final deve ser posterior à hora inicial.");return}
  const y=ano(), n=updates.filter(x=>Number(x.ano)===y).length+1;
  const dataISO=$("atData").value;
  const row={
    codigo:`AT-${n}/${y}`,ano:y,sequencia:n,data_iso:dataISO,
    data_display:new Date(dataISO+"T00:00:00").toLocaleDateString("pt-PT"),
    hora_inicial:$("atInicio").value,hora_final:$("atFim").value,
    servico:$("atServico").value||"MEDIDATA",motivo:$("atMotivo").value||"",
    observacoes:$("atObs").value||"",estado:$("atEstado").value,
    lembretes:$("atLembretes").checked,aviso3_enviado:false,aviso1_enviado:false
  };
  const {data,error}=await supabaseClient.from("atualizacoes").insert(row).select().single();
  if(error){alert("Erro ao guardar atualização: "+error.message);return}
  updates.unshift({...row,dbid:data.id,id:data.codigo, data:data.data_display,inicio:data.hora_inicial,fim:data.hora_final,servico:data.servico,motivo:data.motivo,obs:data.observacoes,aviso3Enviado:data.aviso3_enviado,aviso1Enviado:data.aviso1_enviado});
  localStorage.setItem("rg_update_template_v5",JSON.stringify({para:$("atPara").value,cc:$("atCc").value,bcc:$("atBcc").value,assunto3:$("atAssunto3").value,corpo3:$("atCorpo3").value,assunto1:$("atAssunto1").value,corpo1:$("atCorpo1").value}));
  renderUpdates();renderDash();
  if(mail)gerarEmailUpdate(updates[0],3);else alert(`Atualização ${row.codigo} guardada.`);
}

function diasAte(u){
  const d=new Date((u.dataISO||"")+"T00:00:00"),hoje=new Date();hoje.setHours(0,0,0,0);
  return Math.round((d-hoje)/86400000);
}
function lembretesPendentes(){
  const out=[];
  updates.filter(u=>u.lembretes&&u.estado!=="Cancelada").forEach(u=>{
    const d=diasAte(u);
    if(d<=3&&d>=0&&!u.aviso3Enviado)out.push({u,tipo:"3 dias",dias:d});
    if(d<=1&&d>=0&&!u.aviso1Enviado)out.push({u,tipo:"véspera",dias:d});
    if(d<0&&!u.aviso1Enviado)out.push({u,tipo:"em atraso",dias:d});
  });
  return out;
}

function renderUpdates(){
  $("tabelaAtualizacoes").innerHTML=updates.length?updates.map(u=>`<tr><td>${esc(u.id)}</td><td>${esc(u.data)}</td><td>${esc(u.inicio)}–${esc(u.fim)}</td><td>${esc(u.servico)}</td><td>${esc(u.estado)}</td><td>${u.lembretes?`3 dias: ${u.aviso3Enviado?"✅":"🟠"}<br>Véspera: ${u.aviso1Enviado?"✅":"🔴"}`:"—"}</td><td><button class="linkbtn" onclick='gerarEmailUpdate(${JSON.stringify(u)},3)'>3 dias</button><button class="linkbtn" onclick='gerarEmailUpdate(${JSON.stringify(u)},1)'>Véspera</button><button class="linkbtn" onclick="editarAtualizacao('${u.dbid}')">✏️</button><button class="linkbtn danger" onclick="apagarAtualizacao('${u.dbid}')">🗑️</button></td></tr>`).join("")
  :"<tr><td colspan='7'>Sem atualizações registadas.</td></tr>";
}

async function editarAtualizacao(dbid){
  const u=updates.find(x=>String(x.dbid)===String(dbid));if(!u)return;
  const d=prompt("Data (AAAA-MM-DD):",u.dataISO||"");if(d===null)return;
  const i=prompt("Hora inicial:",u.inicio);if(i===null)return;
  const f=prompt("Hora final:",u.fim);if(f===null)return;
  const s=prompt("Aplicação/Serviço:",u.servico);if(s===null)return;
  const payload={data_iso:d,data_display:new Date(d+"T00:00:00").toLocaleDateString("pt-PT"),hora_inicial:i,hora_final:f,servico:s};
  const {error}=await supabaseClient.from("atualizacoes").update(payload).eq("id",dbid);
  if(error){alert("Erro ao editar atualização: "+error.message);return}
  Object.assign(u,{dataISO:d,data:payload.data_display,inicio:i,fim:f,servico:s});
  renderUpdates();renderDash();
}

async function apagarAtualizacao(dbid){
  if(!confirm("Tem a certeza que pretende apagar esta atualização?"))return;
  const {error}=await supabaseClient.from("atualizacoes").delete().eq("id",dbid);
  if(error){alert("Erro ao apagar atualização: "+error.message);return}
  updates=updates.filter(x=>String(x.dbid)!==String(dbid));renderUpdates();renderDash();
}

async function gerarEmailUpdate(u,tipo){
  const dias=tipo===1?1:3;
  const assunto=tipo===1?$("atAssunto1").value:$("atAssunto3").value;
  const corpo=tipo===1?$("atCorpo1").value:$("atCorpo3").value;
  const payload=tipo===1?{aviso1_enviado:true}:{aviso3_enviado:true};
  await supabaseClient.from("atualizacoes").update(payload).eq("id",u.dbid);
  u[tipo===1?"aviso1Enviado":"aviso3Enviado"]=true;
  renderUpdates();renderDash();
  location.href="mailto:"+encodeURIComponent($("atPara").value)+"?cc="+encodeURIComponent($("atCc").value)+"&bcc="+encodeURIComponent($("atBcc").value)+
    "&subject="+encodeURIComponent(vars(assunto,u,dias))+"&body="+encodeURIComponent(vars(corpo,u,dias));
}

async function login(){
  const email=$("loginEmail").value.trim(),password=$("loginPassword").value;
  if(!email||!password){$("loginMsg").textContent="Indique o email e a password.";return}
  $("loginMsg").textContent="A entrar...";
  const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){$("loginMsg").textContent=error.message;return}
  await iniciarSessao(data.user);
}

async function iniciarSessao(authUser){
  user={nome:authUser.user_metadata?.nome||authUser.email?.split("@")[0]||"Utilizador",login:authUser.email||""};
  localStorage.setItem(userKey,JSON.stringify(user));
  $("userName").textContent=user.nome;$("userLogin").textContent="Login: "+user.login;
  $("loginScreen").style.display="none";$("appShell").style.display="block";$("mainApp").style.display="block";
  try{
    await carregarDados();
    await prep();renderDash();loadEmail();loadUser();loadUpdateTemplate();renderUpdates();
  }catch(e){
    alert("Não foi possível carregar os dados do Supabase: "+e.message);
  }
}

async function logout(){
  await supabaseClient.auth.signOut();
  $("loginScreen").style.display="flex";$("appShell").style.display="none";$("mainApp").style.display="none";
}

$("btnLogin").onclick=login;
$("btnLogout").onclick=logout;

$("loginPassword").addEventListener("keydown",e=>{if(e.key==="Enter")login()});

(async()=>{
  $("appShell").style.display="none";$("mainApp").style.display="none";
  const {data}=await supabaseClient.auth.getSession();
  if(data.session) await iniciarSessao(data.session.user);
})();