'use strict';

/** FAMÍLIA SOUZA — GAME ARENA
 * Site estático. Edições usam localStorage no dispositivo; publicação compartilhada
 * é feita opcionalmente pelo GitHub Contents API, com token somente na memória da aba.
 */
const STORAGE_KEY = 'familia_souza_placar_v1';
const DEFAULT_REPO = 'jonatanoficial-bit/Placar-familia-souza';
const REMOTE_PATH = 'data/placar.json';
const DEFAULT_DATA = {
  version: 1, family: 'Família Souza', updatedAt: '2026-11-01T21:00:00.000Z',
  players: [
    {id:'ariane', name:'Ariane', photo:'assets/ariane.webp'},
    {id:'jonatan', name:'Jonatan', photo:'assets/jonatan.webp'},
    {id:'nicolas', name:'Nicolas', photo:'assets/nicolas.webp'}
  ],
  games: [
    {id:'domino', name:'Dominó', icon:'domino', players:['ariane','jonatan','nicolas'], scores:{ariane:2, jonatan:1, nicolas:0}},
    {id:'xadrez', name:'Xadrez', icon:'chess', players:['jonatan','nicolas'], scores:{jonatan:2,nicolas:1}}
  ],
  history: []
};
const $ = (id) => document.getElementById(id);
let data = structuredClone(DEFAULT_DATA);
let dirty = false;
let editing = false;
let remoteSha = null;
let lastKnownRepo = DEFAULT_REPO;
let toastTimer;

const html = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const cleanSlug = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,42);
const relativePhoto = value => typeof value === 'string' && (/^assets\/[\w.-]+$/.test(value) || /^data:image\/(webp|png|jpeg);base64,[\w+/=]+$/.test(value)) ? value : '';
const formatTime = iso => {try {return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(iso));}catch {return '—';}};
const icon = name => ({domino:'🎲',chess:'♞',cards:'🃏',dice:'🎲',trophy:'🏆',ball:'⚽',puzzle:'🧩'})[name] || '🏆';

function validate(input) {
  if (!input || !Array.isArray(input.players) || !Array.isArray(input.games)) throw Error('Arquivo de placar inválido.');
  if (input.players.length > 30 || input.games.length > 40) throw Error('O limite é 30 jogadores e 40 jogos.');
  const players = input.players.map(p => ({id:cleanSlug(p.id),name:String(p.name||'').slice(0,26),photo:relativePhoto(p.photo)}));
  if (players.some(p => !p.id || !p.name) || new Set(players.map(p=>p.id)).size!==players.length) throw Error('Jogadores inválidos ou repetidos.');
  const known = new Set(players.map(p=>p.id));
  const games = input.games.map(g => {
    const ids = Array.isArray(g.players) ? [...new Set(g.players.filter(id=>known.has(id)))].slice(0,30) : [];
    const scores = Object.fromEntries(ids.map(id=>[id,Math.max(0,Math.min(99999,Math.floor(Number(g.scores?.[id])||0)))]));
    return {id:cleanSlug(g.id), name:String(g.name||'').slice(0,34), icon:String(g.icon||'trophy').slice(0,15), players:ids,scores};
  });
  if (games.some(g=>!g.id||!g.name) || new Set(games.map(g=>g.id)).size!==games.length) throw Error('Jogos inválidos ou repetidos.');
  const history = (Array.isArray(input.history)?input.history:[]).filter(h=>h&&typeof h==='object').slice(0,50).map(h=>({
    at:String(h.at||''), gameId:cleanSlug(h.gameId),playerId:cleanSlug(h.playerId),
    before:Math.max(0,Math.floor(Number(h.before)||0)),after:Math.max(0,Math.floor(Number(h.after)||0))
  }));
  return {version:1,family:'Família Souza',updatedAt:String(input.updatedAt||new Date().toISOString()),players,games,history};
}
function saveLocal() {
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify({data,dirty,remoteSha,repo:lastKnownRepo}));}
  catch(error) {toast('Armazenamento do dispositivo cheio. Exporte o backup JSON.',true);console.error(error);}
}
function toast(msg, error=false){const node=$('toast');node.textContent=msg;node.style.borderColor=error?'#ff6379':'#4bc9e8';node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),4100);}
function updateSyncBadge(){const node=$('syncTag');node.classList.toggle('dirty',dirty);node.classList.toggle('online',!dirty&&!!remoteSha);node.lastChild.textContent=dirty?' NÃO PUBLICADO':remoteSha?' ONLINE':' DADOS LOCAIS';}
function render(){
  document.body.classList.toggle('editing',editing);
  $('editModeBtn').querySelector('span').textContent = editing?'CONCLUIR EDIÇÃO':'ATUALIZAR PLACAR';
  $('lastUpdated').textContent='ATUALIZADO: '+formatTime(data.updatedAt);
  updateSyncBadge();
  renderPlayers();renderBoards();renderMetrics();renderHistory();
}
function renderPlayers(){
  const cards = data.players.map((p,index)=>{
    const total=data.games.reduce((acc,g)=>acc+(g.players.includes(p.id)?g.scores[p.id]||0:0),0);
    const pic=relativePhoto(p.photo)?`<img class="player-photo" src="${html(p.photo)}" alt="Foto de ${html(p.name)}" loading="lazy">`:`<div class="player-photo no-photo">${html(p.name.slice(0,1).toUpperCase())}</div>`;
    return `<article class="player-card" data-player="${html(p.id)}">${pic}<span class="player-number">${String(index+1).padStart(2,'0')} / PLAYER</span><div class="player-card-bottom"><div><div class="player-name">${html(p.name)}</div><div class="player-subtitle">FAMÍLIA SOUZA</div></div><div class="player-total"><strong>${total}</strong><span>PTS</span></div></div></article>`;
  }).join('');
  $('playerCards').innerHTML = cards+`<button type="button" class="add-player-card edit-only" id="addPlayerCard"><span>＋</span>NOVO JOGADOR</button>`;
  $('addPlayerCard').addEventListener('click',()=>showDialog('newPlayerDialog'));
}
function renderBoards(){
  $('boards').innerHTML=data.games.map(game=>{
    const ranked=game.players.map(id=>({id, player:data.players.find(p=>p.id===id),score:game.scores[id]||0})).filter(x=>x.player).sort((a,b)=>b.score-a.score || game.players.indexOf(a.id)-game.players.indexOf(b.id));
    const rows=ranked.map(({id,player,score},index)=>{
      const rank=ranked.findIndex(x=>x.score===score)+1;
      const first=rank===1 && score>0;
      return `<div class="game-row ${first?'champion':''}"><span class="rank">${rank}º</span><span class="rank-rule"></span>${first?'<span class="crown" title="Líder">♛</span>':''}<span class="score-name">${html(player.name)}</span><span class="score-value">${score} ${score===1?'ponto':'pontos'}</span><span class="score-controls"><button type="button" data-action="minus" data-game="${html(game.id)}" data-player="${html(id)}" aria-label="Tirar ponto de ${html(player.name)} em ${html(game.name)}">−</button><span class="editable-number">${score}</span><button type="button" data-action="plus" data-game="${html(game.id)}" data-player="${html(id)}" aria-label="Adicionar ponto a ${html(player.name)} em ${html(game.name)}">+</button></span></div>`;
    }).join('');
    return `<article class="board"><div class="board-header"><div class="game-icon" aria-hidden="true">${icon(game.icon)}</div><div><h3>${html(game.name)}</h3><small>${game.players.length} PARTICIPANTES</small></div></div>${rows||'<div class="board-empty">Nenhum jogador neste jogo.</div>'}</article>`;
  }).join('');
  $('boards').querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>changeScore(button.dataset.game,button.dataset.player,button.dataset.action==='plus'?1:-1)));
}
function renderMetrics(){const points=data.games.reduce((total,g)=>total+Object.values(g.scores).reduce((a,b)=>a+b,0),0);$('metrics').innerHTML=`<div class="metric"><div><label>PARTIDAS REGISTRADAS</label><strong>${points}</strong></div><span class="metric-icon">★</span></div><div class="metric"><div><label>JOGADORES</label><strong>${data.players.length}</strong></div><span class="metric-icon">♟</span></div><div class="metric"><div><label>MODALIDADES</label><strong>${data.games.length}</strong></div><span class="metric-icon">🏆</span></div>`;}
function renderHistory(){const items=data.history.slice(0,8).map(h=>{const g=data.games.find(g=>g.id===h.gameId);const p=data.players.find(p=>p.id===h.playerId);const delta=h.after-h.before;return `<div class="history-item"><span class="history-bullet">${delta>0?'+':'−'}</span><span><strong>${html(p?.name||h.playerId)}</strong> ${delta>0?'ganhou':'perdeu'} um ponto em <strong>${html(g?.name||h.gameId)}</strong> (${h.before} → ${h.after})</span><time>${formatTime(h.at)}</time></div>`;}).join('');$('history').innerHTML=items||'<p class="empty-history">Ainda não há alterações registradas. Toque em “Atualizar placar” para começar.</p>';}
function changeScore(gameId,playerId,delta){
  const game=data.games.find(x=>x.id===gameId);if(!game||!game.players.includes(playerId))return;
  const before=game.scores[playerId]||0;const after=Math.max(0,Math.min(99999,before+delta));if(after===before)return;
  game.scores[playerId]=after;data.updatedAt=new Date().toISOString();data.history.unshift({at:data.updatedAt,gameId,playerId,before,after});data.history=data.history.slice(0,50);dirty=true;saveLocal();render();toast(`Placar atualizado: ${data.players.find(p=>p.id===playerId)?.name||'Jogador'} ${after} ponto(s).`);
}
function undo(){const h=data.history[0];if(!h){toast('Nenhum lance para desfazer.');return;}const game=data.games.find(g=>g.id===h.gameId);if(!game||!game.players.includes(h.playerId)||game.scores[h.playerId]!==h.after){toast('Não foi possível desfazer essa alteração.',true);return;}game.scores[h.playerId]=h.before;data.history.shift();data.updatedAt=new Date().toISOString();dirty=true;saveLocal();render();toast('Última alteração desfeita.');}
function showDialog(id){$(id).showModal();}
function closeDialog(id){$(id).close();}
function chosenRepo(){const repo=$('repositoryInput').value.trim();if(!/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(repo))throw Error('Informe o repositório no formato usuário/nome.');return repo;}
function token(){return $('tokenInput').value.trim();}
function encodeUnicodeBase64(content){const bytes=new TextEncoder().encode(content);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);}
function decodeUnicodeBase64(content){const bytes=Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0));return new TextDecoder().decode(bytes);}
async function requestGithub(repo,method='GET',body=null,useToken=true){
  const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(useToken && token())headers.Authorization=`Bearer ${token()}`;
  if(body)headers['Content-Type']='application/json';
  const response=await fetch(`https://api.github.com/repos/${repo}/contents/${REMOTE_PATH}`,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  if(response.status===404)throw Object.assign(new Error('Arquivo online não encontrado. Primeiro crie o repositório e envie os arquivos.'),{status:404});
  if(!response.ok){let detail='';try{detail=(await response.json()).message||'';}catch{}throw Object.assign(new Error(`GitHub retornou ${response.status}. ${detail}`),{status:response.status});}
  return response.json();
}
async function loadOnline({quiet=false,force=false}={}){
  try{
    const repo=chosenRepo();if(dirty&&!force){if(!confirm('Você tem pontos ainda não publicados neste aparelho. Deseja DESCARTÁ-LOS e carregar o placar do GitHub?'))return;}
    const result=await requestGithub(repo,'GET');
    if(!result.content)throw Error('O arquivo do GitHub não possui conteúdo legível.');
    const next=validate(JSON.parse(decodeUnicodeBase64(result.content)));
    data=next;remoteSha=result.sha;lastKnownRepo=repo;dirty=false;saveLocal();render();if(!quiet)toast('Placar carregado do GitHub para este dispositivo.');
  }catch(error){if(!quiet)toast(error.message,true);else console.info('Placar remoto indisponível:',error.message);}
}
async function publishOnline(){
  try{
    const repo=chosenRepo();if(!token()){showDialog('settingsDialog');toast('Informe um token de acesso do GitHub para salvar online.',true);return;}
    let currentSha=null;
    try{const remote=await requestGithub(repo,'GET');currentSha=remote.sha;}catch(error){if(error.status!==404)throw error;}
    if(currentSha && (!remoteSha || currentSha!==remoteSha || repo!==lastKnownRepo))throw Error('O placar online foi alterado ou ainda não foi carregado nesta sessão. Faça backup e carregue a versão online antes de publicar, para evitar sobrescrever dados de outro aparelho.');
    const payload={message:`Atualiza placar Família Souza — ${new Date().toLocaleString('pt-BR')}`,content:encodeUnicodeBase64(JSON.stringify(data,null,2)+'\n'),...(currentSha?{sha:currentSha}:{})};
    const result=await requestGithub(repo,'PUT',payload);
    remoteSha=result.content?.sha||null;lastKnownRepo=repo;dirty=false;saveLocal();render();toast('Placar publicado no GitHub! Todos podem atualizar a página para ver.');
  }catch(error){toast(error.message,true);}
}
function exportJSON(){const file=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='placar-familia-souza-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup JSON baixado.');}
async function importJSON(file){if(!file)return;try{const fresh=validate(JSON.parse(await file.text()));if(!confirm('Substituir o placar deste aparelho pelo arquivo selecionado?'))return;data=fresh;dirty=true;saveLocal();render();toast('Backup restaurado neste dispositivo.');}catch(error){toast(error.message,true);}}
function fillNewGamePlayers(){$('newGamePlayers').innerHTML=data.players.map(p=>`<label><input type="checkbox" value="${html(p.id)}" checked> ${html(p.name)}</label>`).join('');}
function addGame(event){event.preventDefault();if(data.games.length>=40)return toast('Limite de jogos atingido.',true);const name=$('newGameName').value.trim();const selected=[...$('newGamePlayers').querySelectorAll('input:checked')].map(n=>n.value);if(!name||!selected.length)return toast('Informe o nome e pelo menos um jogador.',true);let id=cleanSlug(name),suffix=2;while(data.games.some(g=>g.id===id))id=cleanSlug(name)+'-'+suffix++;data.games.push({id,name,icon:$('newGameIcon').value,players:selected,scores:Object.fromEntries(selected.map(x=>[x,0]))});data.updatedAt=new Date().toISOString();dirty=true;saveLocal();render();closeDialog('newGameDialog');$('newGameForm').reset();toast(`Novo jogo ${name} criado.`);}
function compressImage(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');if(file.size>12*1024*1024)return reject(Error('Imagem muito grande. Escolha uma foto de até 12 MB.'));const img=new Image();const objectUrl=URL.createObjectURL(file);img.onload=()=>{try{const canvas=document.createElement('canvas');const side=420;canvas.width=side;canvas.height=side;const c=canvas.getContext('2d');const sw=Math.min(img.width,img.height),sx=(img.width-sw)/2,sy=(img.height-sw)/2;c.drawImage(img,sx,sy,sw,sw,0,0,side,side);const url=canvas.toDataURL('image/webp',.70);URL.revokeObjectURL(objectUrl);resolve(url);}catch(e){URL.revokeObjectURL(objectUrl);reject(e);}};img.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(Error('Não foi possível abrir a foto.'));};img.src=objectUrl;});}
async function addPlayer(event){event.preventDefault();if(data.players.length>=30)return toast('Limite de jogadores atingido.',true);const name=$('newPlayerName').value.trim();if(!name)return;let id=cleanSlug(name),suffix=2;while(data.players.some(p=>p.id===id))id=cleanSlug(name)+'-'+suffix++;try{const photo=await compressImage($('newPlayerPhoto').files[0]);data.players.push({id,name,photo});data.updatedAt=new Date().toISOString();dirty=true;saveLocal();render();closeDialog('newPlayerDialog');$('newPlayerForm').reset();toast(`${name} adicionado ao placar.`);}catch(error){toast(error.message,true);}}
async function bootstrap(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const cached=JSON.parse(raw);data=validate(cached.data);dirty=!!cached.dirty;remoteSha=cached.remoteSha||null;lastKnownRepo=cached.repo||DEFAULT_REPO;}}
  catch(error){console.warn('Cache local ignorado:',error);}
  $('repositoryInput').value=lastKnownRepo;
  $('editModeBtn').addEventListener('click',()=>{editing=!editing;render();if(editing)toast('Modo edição: use os botões + e − ao lado de cada jogador.');});
  $('settingsBtn').addEventListener('click',()=>showDialog('settingsDialog'));
  $('refreshBtn').addEventListener('click',()=>loadOnline());
  $('publishBtn').addEventListener('click',()=>{if(!token()){showDialog('settingsDialog');toast('Para publicar online, informe o token na configuração.');}else publishOnline();});
  $('onlineLoadBtn').addEventListener('click',()=>loadOnline());
  $('onlineSaveBtn').addEventListener('click',publishOnline);
  $('undoBtn').addEventListener('click',undo);
  $('newGameBtn').addEventListener('click',()=>{fillNewGamePlayers();showDialog('newGameDialog');});
  $('newGameForm').addEventListener('submit',addGame);
  $('newPlayerForm').addEventListener('submit',addPlayer);
  $('exportBtn').addEventListener('click',exportJSON);
  $('importBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',e=>{importJSON(e.target.files[0]);e.target.value='';});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
  render();
  if(!dirty)await loadOnline({quiet:true,force:true});
}
bootstrap();
