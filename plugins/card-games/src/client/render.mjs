import {chatStatusText} from './chat-receipt.mjs';
import {AudioSettingsControl} from './audio-settings.mjs';
import {DDZ_DEAL_TIMING} from './ddz-lifecycle.mjs';
import {bestHand} from '../rules/texas.mjs';
import {artUrl,bubblePlacement,ddzDisplayHand,FX,effectParticles,packagedAsset,playingCard,portraitUrl,safeTheme,seatPositions,stageFit,THEMES,tokenArt} from './visual.mjs';

const PHASES={calling:['叫地主','Call landlord'],robbing:['抢地主','Rob landlord'],doubling:['普通加倍','Double'],playing:['出牌','Play'],preflop:['翻前','Preflop'],flop:['翻牌','Flop'],turn:['转牌','Turn'],river:['河牌','River'],settled:['已结算','Settled'],'redeal-required':['全不叫，等待重新发牌','No landlord · redeal']};
const ACTIONS={blind:['盲注','Blind'],'uncalled-return':['退回未跟注码','Uncalled bet returned'],fold:['弃牌','Fold'],check:['过牌','Check'],call:['跟注','Call'],'all-in':['ALL IN','ALL IN'],'call-landlord':['叫地主','Call landlord'],decline:['不叫 / 不抢','Decline'],rob:['抢地主','Rob'],pass:['不出','Pass'],play:['出牌','Play'],raise:['加注','Raise'],leave:['离开','Leave'],double:['加倍','Double']};
const PATTERNS={single:['单张','Single'],pair:['对子','Pair'],triple:['三张','Triple'],'triple-single':['三带一','Triple with a single'],'triple-pair':['三带二','Triple with a pair'],straight:['顺子','Straight'],'pair-straight':['连对','Consecutive pairs'],airplane:['飞机','Plane'],'airplane-single':['飞机带单','Plane with singles'],'airplane-pair':['飞机带对','Plane with pairs'],'four-single':['四带两单','Four with two singles'],'four-pair':['四带两对','Four with two pairs'],bomb:['炸弹','Bomb'],rocket:['王炸','Rocket']};
const STATES={active:['进行中','In play'],paused:['已暂停','Paused'],completed:['已结算','Settled'],closed:['已关闭','Closed'],waiting:['正在思考','Thinking'],cancelled:['已取消','Cancelled'],'needs-retry':['请重试','Retry needed'],'paused-or-failed':['已暂停或失败','Paused or failed']};
const IC={pause:'M7 5h3.4v14H7zM13.6 5H17v14h-3.4z',chat:'M4 5h16v11H9l-5 4z',auto:'M12 5a7 7 0 0 1 6.7 5H21l-3.3 3.6L14.4 10h2.2A5 5 0 0 0 7 12H5a7 7 0 0 1 7-7zm0 14a7 7 0 0 1-6.7-5H3l3.3-3.6L9.6 14H7.4A5 5 0 0 0 17 12h2a7 7 0 0 1-7 7z',back:'M15 5l-7 7 7 7'};

const MODEL_STATES={waiting:['正在思考','Thinking'],queued:['排队中','Queued'],completed:['模型已回复','Model replied'],cancelled:['已取消','Cancelled'],'needs-retry':['需要重试','Retry needed'],'paused-or-failed':['已暂停或失败','Paused or failed']};
const GAME_ERRORS={
 GAME_MODEL_TIMEOUT:['模型长时间没有返回数据。','The model stopped sending data.'],
 GAME_MODEL_BUSY:['这个牌桌已有模型请求正在进行。','A model request is already running for this table.'],
 GAME_MODEL_FORMAT:['模型回复格式不完整。','The model response format was incomplete.'],
 GAME_MODEL_CORRECTION_REQUIRED:['模型多次未返回合法动作。','The model did not return a legal move after retries.'],
 GAME_BINDING_REVOKED:['角色的模型连接已经变化，请核对后再试。','The character’s model connection changed. Check it and try again.'],
 GAME_BINDING_MISSING:['这个角色没有可用的模型连接。','This character has no available model connection.'],
 GAME_INSUFFICIENT_POINTS:['可用积分不足，请核对钱包。','There are not enough available points. Check your wallet.'],
 GAME_MINIMUM_BUYIN:['桌上筹码不足，请补筹后再开始。','There are not enough chips. Top up before starting.'],
 GAME_REQUEST_UNCONFIRMED:['不确定上一步保存了没有。','Not sure the last move was saved.'],
 GAME_STALE_VERSION:['牌桌状态已变化，请核对最新状态。','The table state changed. Check the latest state.'],
 GAME_COMMAND_CONFLICT:['这条命令和已保存的操作不一致，请核对牌桌。','This command does not match the saved action. Check the table.'],
 GAME_PAUSED_OR_COMPLETED:['当前牌局已暂停或结束，请核对状态。','The game is paused or ended. Check the table state.'],
 GAME_USER_ACTION_DENIED:['这一步无法提交，请核对当前可选行动。','This move could not be submitted. Check the available actions.'],
 GAME_SAFE_BOUNDARY_REQUIRED:['请在本手结算后再操作。','Wait for this hand to settle before making this change.'],
 GAME_TABLE_NOT_FOUND:['找不到这张牌桌，请刷新大厅。','This table could not be found. Refresh the lobby.'],
 GAME_LIFE_CHANGED:['角色或人生状态已变更，请刷新大厅。','The character or life changed. Refresh the lobby.'],
 GAME_PERSONA_DENIED:['当前身份无权操作这张牌桌。','The current identity cannot access this table.']
};

function playerOrder(players,userId){
 const pivot=players.findIndex(p=>p.id===userId);
 return pivot<0?players:[...players.slice(pivot+1),...players.slice(0,pivot)];
}
function texasHandName([kind,rank,second],t){
 const mark=n=>({11:'J',12:'Q',13:'K',14:'A'}[n]??String(n));
 const labels=[
  ['高牌 '+mark(rank),mark(rank)+' high'],['一对 '+mark(rank),'Pair of '+mark(rank)+'s'],
  ['两对 '+mark(rank)+'、'+mark(second),'Two pair: '+mark(rank)+'s and '+mark(second)+'s'],
  ['三条 '+mark(rank),'Three '+mark(rank)+'s'],['顺子','Straight'],['同花','Flush'],
  ['葫芦','Full house'],['四条 '+mark(rank),'Four '+mark(rank)+'s'],
  rank===14?['皇家同花顺','Royal flush']:['同花顺','Straight flush'],
 ];
 return t(...labels[kind]);
}
export function renderCardGames(React,p){
 const h=React.createElement,t=(zh,en)=>p.lang==='en'?en:zh;
 const theme=safeTheme(p.theme);
 const v=p.view,table=p.table,closed=table?.status==='closed',ddz=v?.type==='doudizhu',overlay=p.overlay;
 const screen=p.screen??(table?'table':'lobby'),inTable=screen==='table'&&table&&v;
 const viewer=(inTable?table.currentCharacterId:p.lobby.currentCharacterId)??p.character??theme;
 const presentationBusy=p.boardBusy||p.ddzDealing||!!p.ddzEndStage;
 const dealFlights=p.ddzDealing&&!p.ddzDealReduced;
 const presentationSettled=p.settled&&!presentationBusy,modelBusy=p.modelBusy??!!p.modelRequest;
 const showdownWinners=!ddz&&presentationSettled?v?.settlement?.winnerIds??[]:[];
 const actionsAllowed=!p.busy&&!p.pendingRetry&&!presentationBusy&&!modelBusy&&!p.paused&&p.isUser&&!closed;
 const displayPhase=p.ddzEndStage==='holding'?'playing':!ddz&&p.boardBusy?((p.boardPhaseCount??0)>=5?'river':(p.boardPhaseCount??0)>=4?'turn':(p.boardPhaseCount??0)>=3?'flop':'preflop'):v?.phase;
 const stackAtTable=player=>{
  const ended=presentationSettled?v.settlement?.endingStacks?.[player?.id]:undefined;
  return ended==null?player?.stack:ended+(table.topups?.[player.id]??0);
 };
 const visibleEmotions=p.visibleEmotions??table?.presentation?.emotions;
 const waitStage=p.modelTurn?.stage??p.modelTurn?.phase;
 const retryNumber=Math.max(1,(p.modelTurn?.attempt??2)-1);
 const waitText=waitStage==='queued'?t('排队中','Queued'):waitStage==='correcting'?t('格式不对，正在重答（第 '+retryNumber+' 次）','Retrying after an invalid response format (retry '+retryNumber+')'):t('正在思考','Thinking');

 const fit=stageFit(p.size?.width,p.size?.height);
 const errorText=code=>t(...(Object.hasOwn(GAME_ERRORS,code)?GAME_ERRORS[code]:['操作未完成，请核对状态后重试。','The operation did not complete. Check its status and try again.']));
 const label=id=>p.available.find(character=>character.id===id)?.label??p.available.find(character=>character.id===id)?.name??(id==='hunyuan'?t('混元','Hunyuan'):id==='chatgpt'?'GPT':id??t('AI','AI'));
 const name=id=>id===p.userId?t('你','You'):p.players.find(player=>player.id===id)?.name??label(p.players.find(player=>player.id===id)?.characterId??id);
 const gameName=type=>type==='doudizhu'?t('斗地主','Dou Dizhu'):t('德州','Hold’em');
 const actionLabel=(a,phase=v?.phase)=>a?.type==='decline'?(phase==='robbing'?t('不抢','Decline rob'):t('不叫','Decline')):a?.type==='double'?(a.factor===2?t('普通加倍 ×2','Double ×2'):t('不加倍','No double')):t(...(ACTIONS[a?.type]??[a?.type,a?.type]));
 const button=(text,onClick,disabled=p.busy,extra={})=>h('button',{type:'button',onClick,disabled,...extra},text);
 const gb=(text,onClick,disabled=p.busy,variant='',extra={})=>button(text,onClick,disabled,{className:'cg-gb '+variant,...extra});
 const ib=(text,onClick,disabled=p.busy,extra={})=>button(text,onClick,disabled,{className:'cg-ib',...extra});
 const sound=(result=false)=>p.audioSettings&&h(AudioSettingsControl,{React,lang:p.lang,settings:p.audioSettings,change:p.setAudioSettings,result});
 const row=(...children)=>h('div',{className:'cg-row'},...children);
 const quiet=text=>h('p',{className:'cg-quiet'},text);
 const field=(text,control)=>h('label',{className:'cg-field'},text,control);
 const toolLabel=(icon,text)=>h(React.Fragment,null,h('svg',{viewBox:'0 0 24 24','aria-hidden':true},
  h('path',icon==='back'?{d:IC[icon],fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'}:{d:IC[icon],fill:'currentColor'})),text);
 const show=panel=>p.setOverlay?.(panel),close=()=>show(null);
 const refresh=()=>p.refresh(inTable?table.tableId:undefined).catch(p.setError);
 const coin=(amount,asset='coin')=>h('span',{className:'cg-coin'},h('img',{src:tokenArt(asset),alt:''}),amount??'–');
 const activePlayer=p.players.find(player=>player.id===v?.actorId);
 const spectating=!ddz&&!p.settled&&p.players.some(player=>player.id===p.userId&&player.folded);
 const art=(kind,id,emotion='')=>artUrl(p.art,kind,id,emotion),themeBackground=art('bg',theme);
 const pic=(id,emotion='cheerful',{full=false,alt='',className=''}={})=>{
  const url=portraitUrl(p.art,id,emotion,full),caption=label(id);
  return url?h('img',{src:url,alt,draggable:false,className}):h('span',{className:'cg-initial '+className,'aria-label':alt||caption},Array.from(String(caption))[0]??'·');
 };
 const face=(id,emotion='cheerful')=>h('span',{className:'cg-face'},pic(id,emotion));
 const approvedFace=(id,emotion='cheerful',icon=false)=>{
  const src=icon?packagedAsset('misc/icon.png'):portraitUrl(p.art,id,emotion);
  return h('span',{className:'cg-approved-face',style:src?{backgroundImage:'url('+src+')',...(icon?{backgroundSize:'cover',backgroundPosition:'center'}:{})}:undefined},
   !src&&Array.from(label(id))[0]);
 };
 const card=(code,width,key)=>playingCard(h,code,{type:v?.type??p.type,theme,t,width,key});
 const cards=(items,width=78,className='')=>h('div',{className:'cg-cards '+className},...items.map((c,i)=>card(c,width,i)));
 const position=(x,y,multiple=1)=>({left:x+'px',top:'calc('+y+'px + var(--dy)*'+multiple+')'});
 const compactClose=(action,label)=>button('×',action,false,{className:'cg-overlay-close','aria-label':label,title:label});
 const modal=(key,title,body,footer,extra='')=>h('section',{key,hidden:overlay!==key,className:'cg-modal '+extra,'data-overlay':key,role:'dialog','aria-modal':overlay===key?'true':undefined,'aria-label':key==='chat'?t('公开桌聊','Public table chat'):title,tabIndex:-1},
  h('header',null,h('h2',null,title),['chat','wallet','pause','leave'].includes(key)?compactClose(close,t('关闭','Close')):ib(t('关闭','Close'),close,false)),h('div',{className:'cg-modal-content'},...body),footer&&h('footer',null,...footer));

 function setup(){
  const tx=p.type==='texas',chosen=p.roster.slice(0,p.rosterCount).filter(Boolean),funds=p.lobby.wallet?.available,selected=new Set(chosen);
  const buy=Number(p.buyIn),validBuy=Number.isSafeInteger(buy)&&buy>=20&&(funds==null||buy<=funds);
  const adjust=overlay==='seats';
  const eligible=c=>c.entry?.[p.type]!==false||(adjust&&p.players.some(player=>player.characterId===c.id));
  const readyChoices=p.available.filter(eligible);
  const valid=chosen.length===p.rosterCount&&selected.size===p.rosterCount&&chosen.every(id=>readyChoices.some(c=>c.id===id));
  const toggle=id=>p.setRoster(old=>old.includes(id)?old.filter(value=>value!==id):old.length<p.rosterCount?[...old,id]:old);
   const minimum=tx?20:32;
   const reason=p.available.length<p.rosterCount?t('可选角色不足，请减少德州人数或先添加角色。','Not enough characters. Reduce the seat count or add characters first.'):!adjust&&funds!=null&&funds<minimum?t('你的可用积分是 '+funds+'，开桌至少要 '+minimum+'。','You have '+funds+' free points. This table needs at least '+minimum+'.'):tx&&!adjust&&!validBuy?t('带入须为至少 20 的整数，且不超过可用积分。','Buy-in must be a whole number from 20 up to your available points.'):null;
  const choices=p.available.map(c=>{
   const allowed=eligible(c),isSelected=selected.has(c.id);
   const warning=allowed?null:c.entry.welfareRemaining===0?t('可用 '+c.entry.available+'，今天低保已用完','Available '+c.entry.available+'; no daily top-ups left'):t('可用 '+c.entry.available+'，积分不足','Available '+c.entry.available+'; not enough points');
    return button(h(React.Fragment,null,pic(c.id),isSelected&&h('span',{className:'cg-pick-number'},chosen.indexOf(c.id)+1),
     h('span',{className:'cg-pick-character-label'},h('b',null,c.label??c.name??c.id),Number.isFinite(c.entry?.available)&&h('small',null,c.entry.available+t(' 积分',' pts'))),
     warning&&h('small',{className:'cg-pick-why'},warning)),()=>toggle(c.id),p.busy||!allowed&&!isSelected||(!isSelected&&chosen.length>=p.rosterCount),
     {className:'cg-character'+(isSelected?' chosen':'')+(!allowed?' unavailable':''),key:c.id,'aria-pressed':isSelected,title:warning??undefined});
  });
  const countOptions=Array.from({length:9},(_,i)=>i+2);
   const line=(...children)=>h('div',{className:'cg-pick-line'},...children);
   const segments=(options,current,change,label)=>h('div',{className:'cg-segments','aria-label':label},...options.map(value=>
    button(String(value).replace('/',' / '),()=>change(value),p.busy,{key:value,className:value===current?'on':'','aria-pressed':value===current})));
  return h('section',{hidden:!['setup','seats'].includes(overlay),className:'cg-picker','data-overlay':adjust?'seats':'setup',role:'dialog','aria-modal':['setup','seats'].includes(overlay)?'true':undefined,tabIndex:-1,'aria-label':t('选牌友','Pick opponents')},
    h('div',{className:'cg-stage-background',style:rootStyle}),
   h('header',null,h('div',null,h('h2',null,adjust?t('调整下一手座位','Next-hand seats'):tx?t('选牌友上桌','Pick your table'):t('选两位牌友','Pick two opponents')),quiet(tx?t('默认五人。已选 '+chosen.length+' 位，还差 '+Math.max(0,p.rosterCount-chosen.length)+' 位。','Five players by default. '+chosen.length+' picked, '+Math.max(0,p.rosterCount-chosen.length)+' to go.'):t('她们用自己绑定的模型出牌，换绑定下一局生效。','Each character uses her own bound model. Changes apply next game.'))),ib(t('返回','Back'),close,false)),
   h('div',{className:'cg-pick-grid'},...choices),
   h('aside',{className:'cg-pick-side'},tx?h(React.Fragment,null,
     line(h('b',null,t('人数','Players')),h('small',null,t('含你','incl. you'))),segments(countOptions,p.count,p.changeCount,t('总人数','Total seats')),
     !adjust&&h(React.Fragment,null,line(h('b',null,t('盲注','Blinds'))),segments(['1/2','2/5'],p.blinds,p.setBlinds,t('盲注','Blinds')),
      line(h('label',{htmlFor:'cg-pick-buy-in'},t('你的带入','Your buy-in')),h('span',{className:'cg-pick-buy-in'},h('img',{src:tokenArt('coin'),alt:''}),
       h('input',{type:'number',id:'cg-pick-buy-in',min:20,max:funds,step:1,value:p.buyIn,onChange:e=>p.setBuyIn(e.target.value)}))),
      h('input',{type:'range',min:20,max:Math.max(20,funds??200),step:1,value:validBuy?buy:20,onChange:e=>p.setBuyIn(e.target.value),'aria-label':t('带入','Buy-in')}),
      line(h('small',null,t('最低 20','Min 20')),h('small',null,t('可用 '+(funds??'–'),(funds??'–')+' free'))),
      line(h('small',null,t('AI 默认带 200，两手之间自动补回','AI players bring 200 and top up between hands'))))):
     h(React.Fragment,null,line(h('b',null,t('牌桌','Table')),h('small',null,t('底分 1 · 每人至少 32 可用积分','Base 1 · 32 available points per player'))),
      line(h('small',null,t('这 32 分是门槛，不是入场费。','The 32 points are a threshold, not an entry fee.')))),
     h('div',{className:'cg-pick-seats'},...chosen.map(id=>h('span',{key:id,title:label(id)},approvedFace(id)))),
     (reason||!valid)&&h('p',{className:'cg-warning',role:'status'},reason??t('还差 '+Math.max(1,p.rosterCount-chosen.length)+' 位牌友',Math.max(1,p.rosterCount-chosen.length)+' more opponent(s) needed')),
    adjust?gb(t('保存下一手座位','Save next-hand seats'),async()=>{if(await p.tableCommand('games.table.seats',{players:[{kind:'user'},...chosen.map(characterId=>({characterId}))]}))close();},p.busy||!valid||!p.settled||closed):gb(t('开始发牌','Deal'),p.create,p.busy||!valid||!!reason,'',{'data-game-control':'deal'})));
 }

 function lobby(){
  const saved=(p.lobby.tables??[]).filter(x=>x.status!=='closed');
  const progressRows=['doudizhu','texas'].flatMap(type=>{
   const progress=p.lobby.currentCharacterProgress?.[type];
   if(!progress)return [];
   const {completed,remainder,next}=progress;
   return [h('span',{key:type,'data-game-progress':type},
    gameName(type)+' '+completed+t(type==='texas'?' 手':' 局',' played')+' · '+remainder+'/'+next)];
  });
  const points=value=>Number.isFinite(value)?value.toLocaleString(p.lang==='en'?'en-US':'zh-CN'):'–';
  const door=(type,actors,demo)=>{
   const isDdz=type==='doudizhu',room=art('bg',isDdz?'grok':'claude');
   return button(h(React.Fragment,null,h('div',{className:'cg-door-room',style:room?{backgroundImage:'url('+room+')'}:undefined}),h('img',{className:'cg-door-table',src:tokenArt('t/'+(isDdz?'ddz':'texas')+'-'+theme),alt:''}),...actors.map((id,i)=>h('span',{className:'cg-door-portrait pos'+i,key:id},pic(id))),
    h('strong',null,isDdz?t('斗地主','Dou Dizhu'):t('德州扑克','Texas Hold’em')),
    h('small',null,isDdz?t('三人一桌 · 每人至少 32 积分','3 players · 32 points each'):t('默认 5 人 · 盲注 1/2 或 2/5','5 players by default · blinds 1/2 or 2/5')),
    h('span',{className:'cg-door-cards'},...demo.map((code,i)=>playingCard(h,code,{type,theme,t,width:60,key:i})))),()=>p.openSetup?.(type),p.busy,{className:'cg-door','data-game-entry':type,'data-room':room?true:undefined});
  };
  return h('div',{className:'cg-lobby'},
   h('div',{className:'cg-lobby-host'},pic(viewer,'cheerful',{full:true,alt:label(viewer),className:'cg-breathe'})),
   h('div',{className:'cg-bubble cg-lobby-greeting'},t('今天想玩什么？我陪你。','What shall we play? I’m in.')),
   h('header',{className:'cg-lobby-top'},h('img',{className:'cg-brand',src:packagedAsset('misc/icon.png'),alt:''}),h('h1',null,t('一起玩牌','Card table')),h('span',{className:'cg-grow'}),sound(),ib(h(React.Fragment,null,coin(points(p.lobby.wallet?.balance)),t('可用 '+points(p.lobby.wallet?.available),points(p.lobby.wallet?.available)+' free')),()=>show('wallet'),false,{'aria-label':t('钱包与在桌资金','Wallet & table funds')}),ib(t('刷新状态','Refresh'),refresh,p.busy)),
   h('div',{className:'cg-lobby-doors'},
    saved.length>0&&h('div',{className:'cg-resume-list'},...saved.map(entry=>{
     const roster=entry.characterIds??[],round=entry.hand>0?t(' · 第 '+entry.hand+(entry.type==='texas'?' 手':' 局'),' · '+(entry.type==='texas'?'hand ':'game ')+entry.hand):'';
     return h('div',{className:'cg-resume',key:entry.tableId},approvedFace(roster[0]??viewer),h('span',null,h('b',null,gameName(entry.type)+round),h('br'),h('small',null,
      (roster.length?t('和 ','With ')+roster.map(label).join(t('、',', '))+' · ':'')+t(...(STATES[entry.status]??['已保存','Saved'])))),
      gb(t('继续','Resume'),()=>p.openSaved?.(entry.tableId),p.busy,'',{'data-saved-table':entry.tableId}));
    })),
    door('doudizhu',['grok','gemini'],[53,40,37]),door('texas',['claude','chatgpt'],[48,49])),
   h('div',{className:'cg-host-label'},approvedFace(viewer),h('span',null,h('b',null,label(viewer)),progressRows.length>0&&h('small',null,...progressRows.map((part,index)=>index?h(React.Fragment,{key:part.key},' · ',part):part),t(' → 好感 +1',' → +1 affection')))));
 }

function hand(){
   if(!ddz){
    const list=spectating?(p.ownHand??[]).map(()=> 'back'):(p.ownHand??[]);
    return h('div',{className:'cg-cards cg-tx-hand','aria-label':t('你的手牌','Your hand')},...list.map((code,index)=>
     playingCard(h,code,{type:v.type,theme,t,width:122,key:index,style:{transform:index?'rotate(5deg) translateY(4px)':'rotate(-5deg) translateY(0px)'}})));
   }
  const list=ddzDisplayHand(p.ownHand??[]),n=list.length,mid=(n-1)/2,w=104,step=Math.min(58,(1040-w)/Math.max(1,n-1));
  return h('div',{className:'cg-hand ddz-hand','aria-label':t('你的手牌','Your hand')},...list.map((code,index)=>{
   const offset=index-mid,selected=p.selected.includes(code);
   const style={left:(offset*step-w/2)+'px',transform:'translateY('+(offset**2*.2-(selected?26:0))+'px) rotate('+offset*.4+'deg)'};
   const face=card(code,w),entry=p.ddzDealing?h('span',{className:'cg-deal',style:{'--deal-delay':DDZ_DEAL_TIMING.deck+index*DDZ_DEAL_TIMING.stagger+'ms'}},face):face;
   return button(entry,()=>p.toggleCard?.(code),!actionsAllowed,{key:code,className:'cg-card-slot '+(selected?'picked':''),style,'aria-pressed':selected,'data-user-card':code});
  }));
 }
 function dealDdz(){
  const {deck,stagger,flight,total}=DDZ_DEAL_TIMING;
  const arrivals=deck+16*stagger+flight;
  const fly=(key,x,y,delay,duration)=>h('span',{className:'cg-deal-flight',key,style:{
   '--deal-x':x-640+'px','--deal-y':y-428+'px','--deal-delay':delay+'ms','--deal-duration':duration+'ms',
  }},card('back',44));
  const positions=seatPositions(2,'doudizhu');
  return h('div',{key:'ddz-deal',className:'cg-ddz-deal','data-game-dealing':true,'aria-hidden':true},
   h('div',{className:'cg-deal-stack'},card('back',44),card('back',44),card('back',44)),
   ...positions.flatMap((pos,lane)=>Array.from({length:17},(_,i)=>fly(lane+'-'+i,pos.plateX,pos.py+30,deck+i*stagger,flight))),
   ...Array.from({length:3},(_,i)=>fly('bottom-'+i,590+i*50,92,arrivals+i*24,total-arrivals-48)));
 }
 function revealDdz(){
  const hands=table.presentation?.remainingHands??{},winner=v.settlement?.winnerIds?.includes(v.landlordId);
  return h('div',{key:'ddz-reveal',className:'cg-ddz-reveal','data-game-reveal':true},
   ...playerOrder(p.players,p.userId).map((player,index)=>{
    const remaining=hands[player.id],items=Array.isArray(remaining)?ddzDisplayHand(remaining):null;
    return h('div',{key:player.id,className:'cg-ddz-reveal-hand',style:position(index?808:458,454,.5),'aria-label':name(player.id)},
     items?.length?items.map((code,i)=>{
      const offset=i-(items.length-1)/2,step=Math.min(64,245/Math.max(1,items.length-1));
      return h('span',{key:code,className:'cg-ddz-reveal-card',style:{
       left:offset*step-29+'px',transform:'translateY('+offset**2*.3+'px) rotate('+offset*1.7+'deg)','--reveal-delay':i*40+'ms',
      }},h('span',{className:'cg-ddz-reveal-inner'},h('span',{className:'cg-ddz-reveal-back'},card('back',58)),h('span',{className:'cg-ddz-reveal-face'},card(code,58))));
     }):items&&h('span',{className:'cg-ddz-out'},t('出完了','All cards played')));
   }),
   h('div',{className:'cg-controls ddz cg-ddz-reveal-controls'},h('strong',null,winner?t('地主胜','Landlord wins'):t('农民胜','Farmers win')),
    gb(t('继续','Continue'),p.continueDdzSettlement,false,'gold',{'data-game-control':'continue-ddz-settlement'})));
 }
  function nameplate(player,pos,dimmed=player.folded){
  const user=player.id===p.userId,active=player.id===v.actorId,style=user?{left:'112px',bottom:ddz?'178px':'20px'}:position(pos.plateX??pos.x,pos.py);
   const id=user?viewer:player.characterId,[color,ink]=THEMES[id]??THEMES[theme],orn=art('orn',id)||art('orn','whale');
  const final=['doubling','playing','settled'].includes(v.phase),landlord=ddz&&final&&player.id===v.landlordId;
   const last=!ddz&&(v.history??[]).findLast(entry=>entry.actorId===player.id&&entry.street===displayPhase&&!['blind','uncalled-return'].includes(entry.type));
  const account=table.accounts?.find(item=>item.playerId===player.id),stack=stackAtTable(player);
  const role=ddz?(final?(landlord?t('地主','Landlord'):t('农民','Farmer')):player.id===v.landlordId?t('候选地主','Landlord candidate'):t('地主未定','Landlord undecided')):null;
  const marks=[['buttonSeat','D'],['smallBlindSeat','SB'],['bigBlindSeat','BB']].filter(([key])=>v.blindPlan?.[key]===player.id).map(([,text])=>text);
   const actionAmount=last?.type==='call'?last.amount:last?.raiseTo;
   const tag=!player.folded&&last&&(actionLabel(last)+(actionAmount>0?' '+actionAmount:''));
   const allIn=player.allIn&&!presentationSettled;
   const sub=player.folded?t('已弃牌','Folded'):allIn?'ALL IN':ddz?coin(account?.available??account?.balance):coin(stack);
   return h('article',{key:'plate-'+player.id,className:['cg-ribbon',user?'you':'',active?'active':'',showdownWinners.includes(player.id)?'winner':'',dimmed?'out':'',allIn?'allin':''].join(' '),style:{...style,'--ribbon-width':(user?186:pos.pw)+'px','--char-accent':color,'--char-on':ink},'data-seat':player.id,'data-seat-position':user?'you':pos.side?'side':'back'},
   h('i',{className:'cg-ornament'},orn?h('img',{src:orn,alt:''}):h('svg',{viewBox:'0 0 24 24','aria-hidden':true},h('path',{fill:'currentColor',d:'M12 21c-.8-4-2-6-4-8C6 13 2 12 2 7c5 0 8 2 10 6 2-4 5-6 10-6 0 5-4 6-6 6-2 2-3.2 4-4 8Z'}))),
    h('strong',{className:'cg-ribbon-name'},h('span',null,name(player.id))),h('span',{className:'cg-ribbon-sub'},h('span',null,sub,
     ddz&&!user&&h('span',{className:'cg-card-count'},h('img',{src:tokenArt('back/'+theme),alt:''}),p.ddzDealing?p.ddzDealCount:player.handCount))),
   (role||marks.length>0)&&h('span',{className:'cg-position '+(landlord?'landlord':''),title:role??marks.join(' ')},ddz?(landlord?t('主','L'):final?t('农','F'):'?'):marks.join(' ')),
   role&&h('span',{className:'cg-sr-only'},role),tag&&h('i',{className:'cg-action-tag'},tag));
 }
 function seating(){
  const ordered=playerOrder(p.players,p.userId),positions=seatPositions(ordered.length,v.type),thinking=modelBusy;
  const seated=[],foreground=[],speaker=p.speech?.actorId&&p.players.find(player=>player.id===p.speech.actorId);
   const lastByActor=new Map(),showdown=ddz?null:table.presentation?.showdown;
   const dimmed=player=>player.folded||presentationSettled&&showdown&&!Object.hasOwn(showdown,player.id);
  if(ddz){for(const item of [...(v.history??[])].reverse()){if(!['play','pass'].includes(item.type))continue;if(lastByActor.has(item.actorId))break;lastByActor.set(item.actorId,item);if(lastByActor.size>=p.players.length)break;}}
  ordered.forEach((player,index)=>{
   const pos=positions[index];if(!pos)return;
   const active=v.actorId===player.id,emotion=thinking&&active?'serious':visibleEmotions?.[player.id]??'cheerful';
    const tone=dimmed(player)?'out':showdownWinners.includes(player.id)?'winner':active?'active':v.actorId&&v.actorId!==p.userId||!ddz&&presentationSettled?'idle':'';
   const spot=pos.side&&active&&!p.isUser&&!p.paused;
   if(pos.side){
     const portrait=portraitUrl(p.art,player.characterId,emotion);
     foreground.push(h('div',{key:'medal-'+player.id,className:'cg-medal '+tone,role:'img','aria-label':name(player.id),style:{
      ...position(pos.x-52,pos.y-6,.7),'--char-accent':THEMES[player.characterId]?.[0],backgroundImage:portrait?'url('+portrait+')':undefined
     }},!portrait&&h('span',{'aria-hidden':true},Array.from(name(player.id))[0])));
     if(spot)foreground.push(h('div',{key:'spot-'+player.id,className:'cg-spot'},pic(player.characterId,emotion)));
   }else seated.push(h('div',{key:'bust-'+player.id,className:'cg-bust '+tone,style:{...position(pos.x-pos.cw/2,pos.y,.7),width:pos.cw+'px'}},pic(player.characterId,emotion,{alt:name(player.id),className:active?'':'cg-breathe'})));
    foreground.push(nameplate(player,pos,dimmed(player)));
   if((speaker?.id===player.id||thinking&&active)&&!p.paused){
    const isThinking=thinking&&active&&speaker?.id!==player.id;
     const placement=isThinking&&spot?{tail:'spot',style:{left:'860px',bottom:'375px'}}:
      bubblePlacement(pos,ordered.length,ddz,active);
    const bubbleText=isThinking?waitText:p.speech.text;
    foreground.push(h('div',{className:'cg-bubble cg-bubble-'+placement.tail+(isThinking?' thinking':''),key:'say-'+player.id,style:placement.style,'aria-live':'polite'},
     isThinking?h(React.Fragment,null,h('span',{className:'cg-sr-only'},bubbleText),h('i'),h('i'),h('i')):h('span',{className:'cg-bubble-text'},bubbleText)));

   }
   if(ddz){
     if(p.ddzEndStage==='revealed')return;
    const last=lastByActor.get(player.id),coords=position(index?690:330,404);
     if(last?.type==='play')foreground.push(h('div',{key:'played-'+player.id,className:'cg-played cg-ddz-played',style:coords},cards(last.cards??[],78,last.cards?.length>3?'cg-tight':'')));
     else if(last?.type==='pass')foreground.push(h('span',{key:'pass-'+player.id,className:'cg-pass',style:position(index?750:390,424)},t('不出','Pass')));
   }else{
     const amount=player.streetCommitted,large=ordered.length<=4,x=large?pos.x:pos.side?(pos.x<640?226:1054):pos.x+(640-pos.x)*.1+30;
    const y=large?402:pos.side?(pos.y<300?392:pos.y>400?520:440):pos.py+78;
     const showCards=p.settled?showdown?.[player.id]:null;
     if(Array.isArray(showCards)&&showCards.length===2)foreground.push(h('div',{key:'shown-'+player.id,className:'cg-played cg-showdown-cards',style:position(x-(large?62:56),y-(large?0:8))},cards(showCards,large?58:52)));
     else if(!large&&!dimmed(player))foreground.push(h('span',{key:'backs-'+player.id,className:'cg-seat-backs',style:position(x-66,y-3),'aria-hidden':true},
      h('img',{src:tokenArt('back/'+theme),alt:''}),h('img',{src:tokenArt('back/'+theme),alt:''})));
     const betX=x-(large?36:30)+(Math.abs(pos.x-640)<110?118:0);
     if(amount>0&&!p.settled)foreground.push(h('div',{key:'bet-'+player.id,className:'cg-bet',style:position(betX,y),'data-seat-bet':player.id},h('img',{src:tokenArt('chip-red'),alt:''}),amount));
   }
  });
  const user=p.players.find(player=>player.id===p.userId);
   if(user)foreground.push(nameplate(user,null,dimmed(user)));
   if(ddz){const last=lastByActor.get(p.userId);if(p.ddzEndStage!=='revealed'&&last?.type==='play')foreground.push(h('div',{key:'played-you',className:'cg-played cg-ddz-played',style:position(420,442)},cards(last.cards??[],78,last.cards?.length>3?'cg-tight':'')));}
   else if(user?.streetCommitted>0&&!p.settled)foreground.push(h('div',{key:'bet-you',className:'cg-bet cg-you-bet',style:{bottom:ordered.length<=4?190:168},'data-seat-bet':p.userId},h('img',{src:tokenArt('chip-blue'),alt:''}),user.streetCommitted));
  return [seated,foreground];
 }
 function actionControls(){
  if(!actionsAllowed)return null;
   const call=p.legal.find(action=>action.type==='call'),allIn=p.legal.find(action=>action.type==='all-in'),raise=p.legal.find(action=>action.type==='raise');
   const shortAllIn=call?.raiseTo!=null&&allIn?.raiseTo===call.raiseTo;
   const offers=p.legal.filter(action=>!['play','raise'].includes(action.type)&&!((raise||shortAllIn)&&action.type==='all-in'));
   if(ddz)offers.sort((a,b)=>Number(b.type==='decline')-Number(a.type==='decline'));
   const choices=offers.map((action,index)=>{
    const suffix=action.type==='call'&&action.amount?' '+action.amount+(shortAllIn?' · ALL IN':''):'';
    const variant=action.type==='fold'?'danger':action.type==='all-in'||ddz&&action.type==='double'&&action.factor===2?'gold':
     ddz&&['call-landlord','rob'].includes(action.type)?'':'quiet';
    const label=ddz&&action.type==='double'&&action.factor===2?t('加倍 ×2','Double ×2'):actionLabel(action);
    return gb(label+suffix,()=>p.action(action.type==='all-in'?{type:'all-in'}:action),false,variant,{key:action.type+'-'+index,'data-game-action':action.type});
   });
  if(ddz&&v.phase==='playing'){
   const play=pattern=>p.action({type:'play',cards:p.selected,pattern:pattern.pattern,bodyRanks:pattern.bodyRanks});
   if(p.selectedPatterns.length>1)return h('div',{className:'cg-controls ddz',role:'group','aria-label':t('牌型解释','Choose how to play the selected cards')},
    ...p.selectedPatterns.map(pattern=>gb(t(...(PATTERNS[pattern.pattern]??[pattern.pattern,pattern.pattern]))+' · '+pattern.bodyRanks.join(', '),()=>play(pattern),false,'',{key:pattern.moveId,'data-game-action':'play'})),...choices);
   choices.push(gb(t('出牌','Play')+(p.selected.length?' ('+p.selected.length+')':''),()=>p.chosenPattern&&play(p.chosenPattern),!p.chosenPattern,'',{'data-game-action':'play'}));
  }
   if(ddz){
    const doubling=v.phase==='doubling'&&v.landlordId===p.userId;
    return h(React.Fragment,null,doubling&&h('div',{className:'cg-note',style:{top:'calc(352px + var(--dy))'}},
     t('地主加倍对两位农民都生效','A landlord double applies to both farmers')),
     h('div',{className:'cg-controls ddz'},...choices));
   }
   if(raise){
    const {minRaiseTo:min,maxRaiseTo:max}=raise,requested=Number(p.raiseTo);
    const amount=Number.isSafeInteger(requested)&&requested>=min&&requested<=max?requested:min;
    const pot=p.players.reduce((sum,player)=>sum+(player.committed??0),0);
    const quick=ratio=>Math.min(max,Math.max(min,v.currentBet+Math.floor(pot*ratio)));
    const presets=[[t('最小','Min'),min],[t('半池','½ pot'),quick(.5)],[t('一池','Pot'),quick(1)],['ALL IN',max]];
    const selectedAllIn=!!allIn&&amount===max;
    choices.push(gb(selectedAllIn?'ALL IN':t('加注','Raise'),()=>p.action(selectedAllIn?{type:'all-in'}:{type:'raise',raiseTo:amount}),false,selectedAllIn?'gold':'',{'data-game-action':selectedAllIn?'all-in':'raise'}));
    return h('div',{className:'cg-controls texas'},h('div',{className:'cg-raise'},
     h('label',{htmlFor:'cg-raise-amount'},t('加注到','Raise to')),
     h('input',{type:'range',id:'cg-raise-amount',min,max,step:1,value:amount,onChange:e=>p.setRaiseTo(e.target.value),'aria-label':t('加注金额','Raise amount')}),
     h('output',{className:'cg-raise-value',htmlFor:'cg-raise-amount'},amount),
     h('div',{className:'cg-raise-quick'},...presets.map(([label,value])=>button(label+' '+value,()=>p.setRaiseTo(String(value)),false,{key:label})))),
    h('div',{className:'cg-action-buttons'},...choices));
   }
   return h('div',{className:'cg-controls texas'},h('div',{className:'cg-action-buttons'},...choices));
 }
 function tableView(){
  if(ddz&&presentationSettled)return settlement();
  const [portraits,foreground]=seating();
  const board=ddz?(v.bottom?.length?v.bottom:['back','back','back']):(v.board??[]);
  const boardCount=p.boardCount??board.length,phaseCount=p.boardPhaseCount??boardCount;
  const account=table.accounts?.find(item=>item.playerId===p.userId);
  const pots=presentationSettled?v.settlement?.pots??[]:[];
  const pot=pots[0]?.amount??p.players.reduce((sum,player)=>sum+(player.committed??0),0);
  const sides=pots.slice(1).map(item=>t(' · 边池 ',' · Side pot ')+item.amount).join('');
  const width=ddz?44:86,top=ddz?72:p.players.length<=5?452:474;
  const canAsk=!p.pendingRetry&&p.modelStatus?.status!=='needs-retry'&&!presentationBusy&&!p.isUser&&!p.paused&&!p.settled&&activePlayer&&!closed;
   const status=p.ddzDealing?t('发牌中','Dealing'):p.ddzEndStage?null:p.boardBusy?t('正在揭牌','Revealing cards'):modelBusy?name(p.modelTurn?.actorId??v.actorId)+' · '+waitText:closed?t('本桌已关闭','Table closed'):presentationSettled?t('本手已结算','Hand settled'):p.paused?t('牌局已暂停','Game paused'):v.phase==='redeal-required'?t('三位都不叫，等待重新发牌。','Nobody called. Ready to redeal.'):spectating?t('你已弃牌，看她们打完这手','You folded. Watch them finish this hand'):p.isUser?null:t('等待 '+name(v.actorId)+' 行动',name(v.actorId)+' to act');
  const publicCards=()=>h('div',{className:'cg-cards'},...Array.from({length:5},(_,index)=>{
   const animation=p.boardAnimations?.[index];
   const code=index<boardCount?board[index]:undefined;
   return h('span',{key:index,className:'cg-board-slot','data-board-card':index<phaseCount?code:undefined,'aria-hidden':index>=phaseCount||undefined},
    code==null?null:!animation?card(code,width):h('span',{className:'cg-board-reveal '+animation.phase+(animation.reduced?' reduced':''),style:{'--reveal-duration':animation.duration+'ms','--reveal-delay':animation.delay+'ms'}},
     h('span',{className:'cg-board-back'},card('back',width)),h('span',{className:'cg-board-face'},card(code,width))));
  }));
  const pairRows=[];
  if(ddz&&['doubling','playing','settled'].includes(v.phase)&&v.landlordId){
   for(const farmer of p.players.filter(player=>player.id!==v.landlordId)){
    const stake=v.publicMultiplier*(v.doubles?.[v.landlordId]??1)*(v.doubles?.[farmer.id]??1);
    pairRows.push(h('span',{key:farmer.id,'data-pair-stake':farmer.id,'data-cap-reached':stake>=16},t(name(farmer.id)+' ↔ 地主：当前倍率 '+Math.min(16,stake)+(stake>=16?' · 已封顶':''),name(farmer.id)+' ↔ Landlord: multiplier '+Math.min(16,stake)+(stake>=16?' · Capped':''))));
   }
  }
  return h(React.Fragment,null,
   h('div',{className:'cg-vignette'}),...portraits,
   h('img',{className:'cg-table-picture',src:tokenArt('t/'+(ddz?'ddz':'texas')+'-'+theme),alt:''}),
   ...foreground,
   h('header',{className:'cg-top'},
     ib(toolLabel('back',t('大厅','Lobby')),p.showLobby??(()=>{}),false,{'data-game-control':'lobby'}),h('span',{className:'cg-ib'},gameName(v.type)+(ddz?'':' · '+(v.blinds?.small??'–')+' / '+(v.blinds?.big??'–'))),h('span',{className:'cg-ib cg-phase'},t(...(PHASES[displayPhase]??[displayPhase,displayPhase]))),h('span',{className:'cg-grow'}),
     sound(),
     ib(toolLabel('auto',t('AI 自动行动','AI auto')),()=>{p.lastAuto.current='';p.setAutoAI(!p.autoAI);},p.settled||closed||p.paused,{className:'cg-ib '+(p.autoAI?'on':''),'aria-pressed':p.autoAI,'data-game-control':'auto'}),
     ib(toolLabel('chat',t('桌聊','Chat')),()=>show('chat'),false,{'data-game-control':'chat'}),ib(coin(account?.available??p.lobby.wallet?.available),()=>show('wallet'),false,{'aria-label':t('钱包与在桌资金','Wallet & table funds')}),
     ib(p.paused?t('恢复牌局','Resume'):toolLabel('pause',t('暂停','Pause')),async()=>{if(p.paused||await p.tableCommand('games.table.pause'))show('pause');},p.boardBusy||p.settled||closed||p.busy&&!modelBusy,{'data-game-control':'pause'}),
    ib(t('更多','More'),()=>show('more'),false)),
    ddz?h('div',{className:'cg-multiplier'},h('b',null,'×'+(v.publicMultiplier??1)),h('span',null,h('small',null,t('公共倍率','Multiplier')),h('small',{className:v.publicMultiplier>=16?'cap':''},v.publicMultiplier>=16?t('本局已封顶 16','Capped at 16'):t('每位农民封顶 16','Cap 16 per farmer'))),pairRows.length>0&&h('details',{className:'cg-pair-stakes'},h('summary',null,t('分对倍率','Pair stakes')),...pairRows)):
     h('div',{className:'cg-pot',style:{top:'calc('+String(top-38)+'px + var(--dy))'}},h('img',{src:tokenArt('chip-gold'),alt:''}),t('底池 ','Pot ')+pot+sides),
   h('div',{className:'cg-board'+(dealFlights?' cg-deal-bottom':''),style:{top:'calc('+top+'px + var(--dy)*'+(ddz?0:1)+')'}},ddz?cards(board,width):publicCards()),
   hand(),actionControls(),dealFlights&&dealDdz(),p.ddzEndStage==='revealed'&&revealDdz(),
    status&&!presentationSettled&&h('div',{className:'cg-turn-note '+(ddz?'ddz':'texas'),role:'status','aria-live':'polite'},h('span',{className:'cg-turn-status'},status),
    modelBusy&&p.modelWaitLong&&h('small',null,t('比平时久，可以继续等，也可以取消。','Taking longer than usual. You can keep waiting or cancel.')),
     modelBusy&&gb(t('取消这次请求','Cancel request'),p.cancelModel,false,'quiet'),
     spectating&&!p.paused&&!closed&&!p.boardBusy&&gb(table.leaveAfter?t('已安排本手后离开','Leaving after this hand'):t('本手后离开','Leave after hand'),()=>p.tableCommand('games.table.leave',{afterHand:true}),p.busy||modelBusy||table.leaveAfter,'quiet',{'data-game-control':'leave-after'}),
    canAsk&&!modelBusy&&gb(t('让 '+name(v.actorId)+' 出牌','Ask '+name(v.actorId)+' to play'),p.startModel,p.busy,'',{'data-game-control':'model'}),
    v.phase==='redeal-required'&&gb(t('重新发牌','Redeal'),()=>p.tableCommand('games.table.next'),p.busy,'',{'data-game-control':'redeal'})),
   presentationSettled&&settlement());
 }
 function settlement(){
  const value=v.settlement,deltas=value.deltasByPlayer??{},winners=value.winnerIds??[];
  const userWon=winners.includes(p.userId),landlordWon=winners.includes(v.landlordId);
  const winner=p.players.find(player=>winners.includes(player.id)&&player.id!==p.userId);
  const hero=userWon?p.players.findLast(player=>player.id!==p.userId&&deltas[player.id]<0):winner;
  const title=landlordWon?t('地主胜','Landlord wins'):t('农民胜','Farmers win');
  const needsTopup=!ddz&&!closed&&stackAtTable(p.players.find(player=>player.id===p.userId))===0;
  const returnLobby=()=>gb(t('返回大厅','Return to lobby'),p.returnLobby??p.showLobby,false,'',{'data-game-control':'return-lobby'});
  const next=()=>gb(ddz?t('下一局','Next game'):t('下一手','Next hand'),()=>p.tableCommand('games.table.next'),p.busy||modelBusy||needsTopup,'',{'data-game-control':'next'});
  const hide=['history','replay'].includes(overlay);
  if(!ddz){
   const showdown=table.presentation?.showdown,pots=value.pots??[];
   const winnerId=userWon?p.userId:winners[0],holes=showdown?.[winnerId];
   const cards=holes&&[...holes,...(v.board??[])];
   const score=cards?.length===7&&new Set(cards).size===7&&cards.every(card=>Number.isInteger(card)&&card>=0&&card<52)?bestHand(cards).score:null;
   const rank=score&&texasHandName(score,t);
   const recipients=ids=>[...ids].sort((a,b)=>Number(b===p.userId)-Number(a===p.userId)).map(name).join(t('和',' and '));
   const awards=pots.map((pot,i)=>t(i?'边池 ':'主池 ',i?'Side pot ':'Main pot ')+pot.amount+' '+(pot.winnerIds.length>1?
    recipients(pot.winnerIds)+t('平分',' split'):t('归','to ')+recipients(pot.winnerIds)));
   const won=userWon?t('你赢了','You win'):winnerId?name(winnerId)+t('赢了',' wins'):t('本手结算','Hand settled');
   const note=showdown?pots.length>1?awards.join(' · '):won+(rank?' · '+rank:''):
    winners.length?recipients(winners)+t(' 赢下底池',' wins the pot'):won;
   return h('section',{className:'cg-tex-result',hidden:hide,'data-game-result':true},
    h('div',{className:'cg-note',style:{top:'calc(578px + var(--dy))'}},note),
    closed&&h('strong',{className:'cg-sr-only',role:'status'},t('本桌已关闭','Table closed')),
    h('div',{className:'cg-controls texas cg-tex-result-actions'},needsTopup&&quiet(t('筹码已用完，请补筹或离开牌桌。','Out of chips. Top up or leave the table.')),
     h('div',{className:'cg-action-buttons'},
      gb(t('全牌回放','Full replay'),()=>p.openReplay(v.handId),p.busy,'quiet',{'data-game-control':'replay'}),
      closed?returnLobby():h(React.Fragment,null,
       gb(t('离开并收回桌上筹码','Leave and collect chips'),()=>p.tableCommand('games.table.leave'),p.busy,'quiet'),
       gb(t('补筹','Top up'),()=>show('topup'),false,'quiet'),next()))));
  }
  const factors=[];
  for(const event of v.history??[]){
   if(event.type==='rob')factors.push(t('抢地主 ×2','Rob ×2'));
   if(event.pattern==='bomb')factors.push(t('炸弹 ×2','Bomb ×2'));
   if(event.pattern==='rocket')factors.push(t('王炸 ×2','Rocket ×2'));
   if(event.type==='double'&&event.factor===2)factors.push((event.actorId===v.landlordId?t('地主','Landlord'):t('农民','Farmer'))+t('加倍 ×2',' double ×2'));
  }
  if(value.spring)factors.push(value.spring==='spring'?t('春天 ×2','Spring ×2'):t('反春天 ×2','Counter-spring ×2'));
  const capped=Object.values(value.pairStakes??{}).includes(16);
  const relations=Object.entries(table.relationshipProgress??{});
  return h('section',{className:'cg-result cg-ddz-result','data-game-result':true},
   hero&&h('div',{className:'cg-result-hero'},pic(hero.characterId,userWon?'exasperated':'starry')),
   ib(toolLabel('back',t('大厅','Lobby')),p.showLobby??(()=>{}),false,{className:'cg-ib cg-result-lobby','data-game-control':'lobby'}),
   sound(true),
   h('div',{className:'cg-result-panel'},h('h2',null,title),
    (factors.length>0||capped)&&h('div',{className:'cg-result-factors'},...factors.map((factor,i)=>h('span',{key:i},factor)),capped&&h('span',{className:'cap'},t('封顶 16','Capped at 16'))),
    ...p.players.filter(player=>Object.hasOwn(deltas,player.id)).map(({id,characterId})=>{
     const delta=deltas[id],role=id===v.landlordId?t('地主','Landlord'):t('农民','Farmer');
     return h('div',{key:'result-'+id,className:'cg-result-line'},approvedFace(id===p.userId?viewer:characterId,delta>0?'starry':'exasperated',id===p.userId),h('span',null,h('b',null,name(id)),h('br'),h('small',null,role)),h('span',{className:'cg-result-points '+(delta>0?'won':'lost')},delta>0?'+'+delta:delta));
    }),
    ...relations.map(([id,{next,remainder,awarded}])=>{
     const count=awarded?next:remainder;
     const progress=awarded?t('好感 +1！和 '+name(id)+' 一起打满 '+next+' 局','+1 affection after '+next+' games with '+name(id)):
      t('和 '+name(id)+' 一起打了 '+remainder+' / '+next+' 局，再打 '+(next-remainder)+' 局好感 +1',remainder+' of '+next+' games with '+name(id)+'; '+(next-remainder)+' more for +1 affection');
     return h('div',{key:'progress-'+id,className:'cg-result-progress'},h('b',null,progress),
      h('div',{className:'cg-progress-track',role:'progressbar','aria-label':name(id),'aria-valuemin':0,'aria-valuemax':next,'aria-valuenow':count},
       ...Array.from({length:next},(_,i)=>h('i',{key:i,className:i<count?'on':undefined}))));
    }),
    h('div',{className:'cg-result-buttons'},closed?returnLobby():h(React.Fragment,null,gb(t('离开','Leave'),()=>p.tableCommand('games.table.leave'),p.busy,'quiet'),next()))));
 }

function topup(){
  if(overlay!=='topup'||ddz||!inTable||!presentationSettled||closed)return null;
  const stack=stackAtTable(p.players.find(player=>player.id===p.userId));
  const available=table.accounts?.find(account=>account.playerId===p.userId)?.available??p.lobby.wallet?.available??0;
  const requested=Number(p.topup??20);
  const amount=available>0?Math.min(available,Math.max(1,Number.isSafeInteger(requested)?requested:1)):0;
  return modal('topup',t('从钱包补筹','Top up from wallet'),[
   quiet(t('在桌 '+stack+' · 可用 '+available,'On table '+stack+' · '+available+' free')),
   h('input',{type:'range',min:1,max:Math.max(1,available),value:Math.max(1,amount),disabled:!amount,
    'aria-label':t('补筹金额','Top-up amount'),onChange:e=>p.setTopup?.(e.target.value)}),
   h('p',{className:'cg-topup-preview'},t('补 '+amount+'，下一手在桌 '+(stack+amount),'Add '+amount+' for '+(stack+amount)+' next hand')),
  ],[gb(t('先不补','Not now'),close,false,'quiet'),
   gb(t('补筹','Top up'),async()=>{if(await p.tableCommand('games.table.topup',{amount}))close();},!amount||p.busy||modelBusy)],'cg-topup-sheet');
 }

 function wallet(){
  const accounts=inTable?table.accounts??[]:[],rows=accounts.length
   ?accounts.map(account=>[name(account.playerId),account,account.playerId===p.userId?viewer:p.players.find(player=>player.id===account.playerId)?.characterId,account.playerId===p.userId])
   :[[t('你','You'),p.lobby.wallet??{},viewer,true]];
  const balance=t('余额','Balance'),held=t('占用','Reserved'),free=t('可用','Available');
  const body=[h('dl',{className:'cg-wallet'},...rows.map(([owner,account,characterId,user])=>h('div',{key:account.playerId??'user'},
   h('dt',null,h('span',{'aria-hidden':true},approvedFace(characterId,'cheerful',user)),h('strong',null,owner)),h('dd',null,balance+' '+(account.balance??'–')+' · '+held+' '+(account.held??'–')+' · '+free+' '+(account.available??'–'))))),
   quiet(t('占用不是入场费，结算后按真实输赢退回。两款游戏共用本体钱包。','Held points are no fee; they return at settlement. Both games share the app wallet.'))];
  if(inTable&&table.type==='texas'){
   const amount=Number(p.topup??20),freePoints=accounts.find(account=>account.playerId===p.userId)?.available??p.lobby.wallet?.available;
   const stack=stackAtTable(p.players.find(player=>player.id===p.userId));
   const canTopup=!p.busy&&!modelBusy&&presentationSettled&&!closed&&Number.isSafeInteger(amount)&&amount>0&&(freePoints==null||amount<=freePoints);
   body.push(quiet(t('在桌 ','On table ')+(stack??'–')+' · '+t('可用 ','Available ')+(freePoints??'–')));
   body.push(field(t('手间补筹','Top up between hands'),h('input',{type:'number',min:1,max:freePoints,step:1,id:'cg-topup',value:p.topup??20,onChange:e=>p.setTopup?.(e.target.value)})),
    h('input',{type:'range',min:1,max:Math.max(1,freePoints??1),step:1,value:Math.max(1,Math.min(freePoints??1,amount||1)),disabled:!presentationSettled||closed||!freePoints||modelBusy,'aria-label':t('补筹金额','Top-up amount'),onChange:e=>p.setTopup?.(e.target.value)}),
    row(gb(t('从钱包补筹','Top up from wallet'),()=>p.tableCommand('games.table.topup',{amount}),!canTopup),gb(t('调整下一手座位','Change next-hand seats'),p.openSeats??(()=>{}),p.busy||modelBusy||!presentationSettled||closed,'quiet')));
  }
  return modal('wallet',t('钱包与在桌资金','Wallet & table funds'),body,null,'cg-wallet-drawer');
 }
 function chat(){
  const receipt=p.chatReceipt;
  const options=p.players.filter(player=>player.characterId).map(player=>h('option',{key:player.characterId,value:player.characterId},player.name??label(player.characterId)));
  const assistantRetry=receipt?.inputAccepted===true&&receipt.retryAllowed===true&&['failed','cancelled','unavailable'].includes(receipt.assistantStatus);
  return modal('chat',t('桌聊','Table chat'),[
   h('div',{className:'cg-chat','aria-live':'polite'},...(p.messages??[]).map((message,index)=>{
    const user=message.role==='user',sender=user?t('你','You'):label(message.characterId);
    return h('article',{key:message.id??index,className:user?'me':undefined,'aria-label':sender},
     !user&&h('span',{'aria-hidden':true},approvedFace(message.characterId,message.emotion)),h('p',null,message.text));
   })),
   quiet(t('桌聊不含隐藏手牌，不算出牌或工作指令。','Chat holds no hidden cards and is never a move or a work instruction.')),
   h('details',{className:'cg-chat-settings'},h('summary',null,t('桌聊设置','Chat settings')),
    field(t('回复角色','Who replies'),h('select',{value:p.chatCharacter??'',disabled:p.chatBusy,onChange:e=>p.setChatCharacter(e.target.value),'aria-label':t('在场聊天角色','Seated chat character')},h('option',{value:''},t('自动选择当前AI / 首位参局AI','Current or first AI player')),...options)),
    ib(t('核对聊天记录','Check chat records'),p.refreshChat,p.chatBusy)),
   (receipt||p.chatBusy)&&h('p',{className:'cg-quiet',role:'status','aria-live':'polite'},chatStatusText(receipt&&{...receipt,code:null},p.chatBusy,p.lang)),
   (receipt?.code||receipt?.message)&&!['cancelled','completed'].includes(receipt.assistantStatus)&&quiet(errorText(receipt.code)),
   p.chatBusy&&p.cancelChat&&ib(t('取消这次回复','Cancel this reply'),p.cancelChat,false),
   p.chatRetry&&ib(assistantRetry?t('重试这条消息的AI回复','Retry this AI reply'):t('以同一消息编号核对 / 重试','Check / retry the same message ID'),p.retryChat,p.chatBusy),
   table?.outboxPending>0&&quiet(t(table.outboxPending+' 项关系或经历等待宿主确认。',table.outboxPending+' relationship or experience records await confirmation.'))],
   [h('div',{className:'cg-chat-input'},h('textarea',{rows:1,value:p.text,onChange:e=>p.setText(e.target.value),'aria-label':t('公开桌聊草稿','Public table chat draft'),placeholder:t('写下想说的话…','Say something…')}),
    gb(p.chatBusy?t('等待回复中…','Waiting…'):t('发送','Send'),p.submitChat,p.chatBusy||!String(p.text??'').trim()))],'cg-chat-drawer');
 }
 function replay(){
  if(!p.replay||overlay!=='replay')return null;
  const record=p.replay,participants=record.players??[];
  const replayName=id=>id===p.userId?name(id):participants.find(player=>player.id===id)?.name??label(participants.find(player=>player.id===id)?.characterId??id);
  const review=()=>p.startReview?.(p.reviewCharacter,record.handId);
  const streets=['preflop','flop','turn','river'];
  const pots=record.settlement?.pots??[];
   const handNumber=(table?.history?.indexOf(record.handId)??-1)+1;
   const title=handNumber?t('第 '+handNumber+' 手回放','Hand '+handNumber+' replay'):t('手牌回放','Hand replay');
   const total=pots.reduce((sum,pot)=>sum+pot.amount,0);
   const won=pots.reduce((sum,pot)=>sum+(pot.winnerIds.includes(p.userId)?Math.floor(pot.amount/pot.winnerIds.length)+Number(pot.oddChipRecipients?.includes(p.userId)??false):0),0);
   const activeStreet=(record.history??[]).findLast(move=>streets.includes(move.street))?.street??'preflop';
   return h('section',{className:'cg-modal cg-replay','data-overlay':'replay',role:'dialog','aria-modal':true,'aria-label':title,tabIndex:-1},
    h('div',{className:'cg-stage-background',style:rootStyle}),
   h('div',{className:'cg-replay-panes'},
    h('section',{className:'cg-replay-plays','aria-label':t('牌局记录','Hand record')},
      h('div',{className:'cg-replay-title'},h('h2',null,title),h('span',null,t('已结算','Settled'))),
      h('div',{className:'cg-replay-board'},record.board?.length>0&&cards(record.board,68),
       pots.length>0&&h('div',{className:'cg-replay-pots'},h('span',null,t('底池 ','Pot ')+total),won>0&&h('span',null,t('你赢 ','You won ')+won))),
     h('div',{className:'cg-replay-hands'},...Object.entries(record.allHands??{}).map(([id,values])=>{
      const player=participants.find(seat=>seat.id===id);
       return h('article',{key:id},approvedFace(id===p.userId?viewer:player?.characterId,'cheerful',id===p.userId),h('b',null,replayName(id)),cards(values,62));
     })),
     h('div',{className:'cg-replay-history'},...streets.map(street=>{
      const moves=(record.history??[]).filter(move=>(move.street??'preflop')===street);
       return h('details',{key:street,open:street===activeStreet},h('summary',null,t(...PHASES[street])),
        h('p',null,moves.length?moves.map(move=>replayName(move.actorId)+' '+actionLabel(move,street)+(move.raiseTo!=null?' '+move.raiseTo:move.amount!=null?' '+move.amount:'')).join(' · '):t('本街无动作','No actions on this street')));
     }))),
     h('aside',{className:'cg-replay-review'},h('div',{className:'cg-replay-review-title'},h('h3',null,t('请她复盘','Ask her to review')),ib(t('关闭','Close'),close,false)),
      h('div',{className:'cg-segments'},...participants.filter(player=>player.characterId&&player.id!==p.userId).map(player=>ib(replayName(player.id),()=>{p.setReviewCharacter(player.characterId);p.setReview(null);},p.reviewBusy,{key:player.characterId,'aria-pressed':p.reviewCharacter===player.characterId,className:'cg-ib '+(p.reviewCharacter===player.characterId?'on':'')}))),
      p.review&&h('div',{className:'cg-replay-response'},approvedFace(p.reviewCharacter,'exasperated'),h('p',{className:'cg-review-text','aria-live':'polite'},p.review.text)),
     quiet(t('复盘是事后了解这手牌，不改变已结算的积分、好感或当前牌局。','Review shows this settled hand in hindsight. It does not change points, affection, or the current game.')),
     p.reviewBusy&&h('p',{role:'status'},t('正在等待复盘…','Waiting for the review…')),
      row(gb(t('请求AI复盘','Ask AI to review'),review,p.reviewBusy||!p.reviewCharacter),p.reviewBusy&&ib(t('取消复盘','Cancel review'),p.cancelReview,false)))));
 }
 function history(){
  let phase=ddz?'calling':null;
  const entries=(v?.history??[]).map((action,i)=>{
   const label=actionLabel(action,action.street??phase);
   if(ddz&&action.type==='call-landlord')phase='robbing';
   else if(ddz&&action.type==='double')phase='doubling';
   return h('div',{key:i,className:'cg-history-entry'},h('span',null,name(action.actorId)+' · '+label+(action.raiseTo!=null?' '+action.raiseTo:'')),action.cards&&cards(action.cards,37,'cg-tight'));
  });
  return modal('history',t('公开行动记录','Public action history'),[
   ...entries,
   table?.type==='texas'&&h('div',null,h('h3',null,t('历史手牌','Past hands')),row(...(table.history??[]).map(entry=>{const id=typeof entry==='string'?entry:entry.handId;return id&&ib(id.slice(-10),()=>p.openReplay(id),p.busy,{key:id});})))]);
 }

 function effect(){
  const event=p.effect,definition=FX[event?.kind];
  if(!definition)return null;
  const title=t(definition[0],definition[1]),latin=p.lang==='en'||event.kind==='allin',length=Array.from(title).length;
  if(!definition[2])return h('div',{key:event.id,className:'cg-lite-effect'+(latin?' latin':''),role:'status'},title);
  const player=p.players.find(row=>row.id===event.actorId),me=!player||player.id===p.userId;
  const pet=art('pet',safeTheme(viewer)),who=me?(pet?h('img',{src:pet,alt:''}):pic(viewer)):pic(player.characterId,(event.kind==='allin'?visibleEmotions:table.presentation?.emotions)?.[player.id]??'starry');
  return h('div',{key:event.id,className:'cg-cut-in '+(p.lang==='en'||event.kind==='allin'?'latin':''),'data-effect':event.kind,role:'status',style:{'--cut-size':(latin?(event.kind==='allin'?176:Math.min(176,960/length)):length>=5?122:length>=3?146:176)+'px'}},h('div',{className:'cg-cut-band',style:{backgroundImage:'url('+tokenArt('fx/'+event.kind)+')'}},
   h('div',{className:'cg-particles','aria-hidden':true},...effectParticles(h,event.kind,event.suit)),h('div',{className:'cg-cut-portrait '+(me?'me':'')},who),h('b',{className:'cg-cut-name'},me?t('你','You'):name(player.id)),h('strong',{className:'cg-cut-title'},title),
   ['bomb','rocket','spring','antispring'].includes(event.kind)&&h('span',{className:'cg-cut-multiplier'},'×2'),
   event.cards?.length===5&&h('div',{className:'cg-cut-cards'},cards(event.cards,66))));
 }
 const stateTitle=p.ready?t('先升级 AI 酱','Update AI Buddy first'):t('正在检查插件','Checking plugin');
 const isDialog=['setup','seats','wallet','chat','pause','leave','more','history','replay','topup'].includes(overlay);
 const isDrawer=['wallet','chat'].includes(overlay);
 const stageStyle={height:fit.height+'px','--dy':fit.shift+'px',transform:'translateX('+fit.x+'px) scale('+fit.scale+')'};
 const rootStyle=themeBackground?{backgroundImage:'url('+themeBackground+')'}:undefined;
 const content=p.ready?.mode==='runtime'?(inTable?tableView():lobby()):h('section',{className:'cg-unready'},h('h1',null,stateTitle),
  quiet(p.ready?t('一起玩牌需要新版 AI 酱提供的积分和牌桌服务。升级后存档和钱包都会保留。','Card table needs the points and table service in a newer AI Buddy. Saves and wallet are kept.'):t('正在连接本机宿主…','Connecting to the local host…')),
  h('footer',null,gb(t('刷新状态','Refresh'),p.refreshReadiness??refresh,false)));
 const model=p.modelStatus;
 const gameMenu=table&&modal('more',t('牌桌操作','Table controls'),[
  model&&quiet(t('模型','Model')+' · '+t(...(MODEL_STATES[model.status]??['模型已回复','Model replied']))+(model.latencyMs!=null?' · '+Math.round(model.latencyMs)+' ms':'')+(model.corrections!=null?' · '+t('纠错 ','Corrections ')+model.corrections:'')),
  field(t('提供角色策略框架','Give characters a strategy framework'),h('input',{type:'checkbox',checked:!!p.strategy,onChange:e=>p.setStrategy(e.target.checked)})),
  row(ib(t('刷新状态','Refresh'),refresh),ib(t('公开行动记录','Public action history'),()=>show('history'),false),ib(t('离开牌桌','Leave table'),()=>show('leave'),closed||p.busy||modelBusy||p.boardBusy))]);
 const pause=table&&modal('pause',t('牌局已暂停','Game paused'),[
  quiet(t('这局已保存。恢复后接着打同一手牌，不会自动请求模型。','Saved. Resuming continues the same hand and asks no model by itself.'))],
  [gb(t('本局后离开','Leave after hand'),()=>show('leave'),p.busy,'quiet'),gb(t('恢复牌局','Resume'),async()=>{if(await p.tableCommand('games.table.resume'))close();},p.busy)],'cg-pause-sheet');
 const leaveOptions=[
  ['after',ddz?t('本局后离开','After this game'):t('本手后离开','After this hand'),ddz?t('完成本局后离开，已有行动会保留。','Finish this game; completed moves will be kept.'):t('打完这手再走，筹码回到钱包。','Finish the hand; chips return to your wallet.')],
  ...(!ddz&&!p.paused?[['now',t('立即离开','Leave now'),t('没 ALL IN 就算弃牌，已下的注留在底池。已 ALL IN 会保留摊牌资格。','If not ALL IN you fold and your bets stay in the pot. ALL IN players keep showdown eligibility.')]]:[])
 ];
 const leave=table&&overlay==='leave'&&modal('leave',t('离开牌桌','Leave table'),[
  !ddz&&p.paused&&quiet(t('若要立即离开，请先恢复牌局。','Resume the table before leaving immediately.')),
  h('form',{id:'cg-leave-form',className:'cg-leave-options',onSubmit:async event=>{
   event.preventDefault();
   if(p.busy||modelBusy||p.boardBusy)return;
   const mode=new FormData(event.currentTarget).get('leave-mode');
   if(await p.tableCommand('games.table.leave',mode==='now'&&!ddz&&!p.paused?{immediate:true}:{afterHand:true}))close();
  }},...leaveOptions.map(([mode,title,description])=>h('label',{className:'cg-leave-option',key:mode},
   h('input',{className:'cg-sr-only',type:'radio',name:'leave-mode',value:mode,defaultChecked:mode==='after'}),h('b',null,title),h('span',null,description))))],
  [gb(t('继续玩','Stay'),close,false,'quiet'),gb(t('离开','Leave'),undefined,p.busy||modelBusy||p.boardBusy,'danger',{type:'submit',form:'cg-leave-form'})],'cg-leave-sheet');
 const failed=model?.status==='needs-retry';
 const faultActor=failed&&(model.actorId??v?.actorId);
 const reason=errorText(p.errorCode??model?.code??(p.pendingRetry?'GAME_REQUEST_UNCONFIRMED':null));
 const errors=(p.error||p.errorCode||failed)&&h('div',{className:'cg-error',role:'alert'},
  h('span',null,faultActor?t(name(faultActor)+' 这步没出成：'+reason,name(faultActor)+' could not move. '+reason):reason),
  p.pendingRetry&&h(React.Fragment,null,gb(t('核对','Check'),p.checkPending??refresh,p.busy,'',{'aria-label':t('核对保存状态','Check saved state')}),gb(t('重试同一命令','Retry same command'),p.retry,p.busy,'quiet')),
  !p.pendingRetry&&failed&&(p.paused?gb(t('恢复牌局','Resume'),()=>show('pause'),p.busy):h(React.Fragment,null,
   gb(t('重试','Retry'),p.startModel,p.busy||modelBusy||presentationBusy||p.isUser||!activePlayer||closed),
   gb(t('暂停','Pause'),async()=>{if(await p.tableCommand('games.table.pause'))show('pause');},p.busy||presentationBusy||closed,'quiet'))),
  compactClose(()=>{p.setError('');p.clearModelStatus?.();},t('关闭提示','Dismiss')));

 return h('main',{ref:p.stageRef,className:'cg-root','data-card-games':true,'data-game-screen':inTable?'table':'lobby','data-table-type':inTable?v.type:undefined,'data-game-phase':inTable?displayPhase:undefined,style:rootStyle,onClickCapture:p.onAudioClick},
  h('style',null,p.stylesheet),h('div',{className:'cg-stage',style:stageStyle},
   h('div',{className:'cg-stage-background'+(p.ready&&p.ready.mode!=='runtime'?' cg-host-upgrade':(screen==='lobby'||ddz&&presentationSettled)?' cg-approved-brightness':''),style:rootStyle}),
   h('div',{className:'cg-content',ref:element=>{if(element)element.inert=isDialog;}},content),
   effect(),
   isDialog&&h('button',{className:'cg-scrim'+(isDrawer?' cg-drawer-scrim':['pause','leave'].includes(overlay)?' cg-pause-scrim':''),type:'button',onClick:close,tabIndex:-1,'aria-hidden':true}),
   p.ready?.mode==='runtime'&&h(React.Fragment,null,setup(),wallet(),topup(),table&&chat(),gameMenu,pause,leave,table&&history(),replay()),
   errors));
}

