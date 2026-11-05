import {ddzRank} from '../rules/doudizhu.mjs';
const SUITS=['♠','♥','♦','♣'];
const SUIT_IDS=['s','h','d','c'];
const COURT={sK:'court-k-grok',hK:'court-k-deepseek',cK:'court-k-qwen',dK:'court-k-gemini',sQ:'court-q-glm',hQ:'court-q-claude',cQ:'court-q-kimi',dQ:'court-q-hunyuan',sJ:'court-j-gpt',hJ:'court-j-minimax',cJ:'court-j-seed',dJ:'court-j-aijiang'};
const SUIT={s:'M12 2c3.4 4.6 9.6 8 9.6 12.6 0 2.9-2.2 4.9-4.7 4.9-1.6 0-3-.7-3.9-1.9.2 1.7.9 3.1 2.2 4.4H8.8c1.3-1.3 2-2.7 2.2-4.4-.9 1.2-2.3 1.9-3.9 1.9-2.5 0-4.7-2-4.7-4.9C2.4 10 8.6 6.6 12 2z',
 h:'M12 21.5C5.6 16 2 12.7 2 8.6 2 5.3 4.6 3 7.4 3c1.9 0 3.6 1 4.6 2.6C13 4 14.7 3 16.6 3 19.4 3 22 5.3 22 8.6c0 4.1-3.6 7.4-10 12.9z',
 c:'M12 2.2a4.9 4.9 0 0 1 4.3 7.3 4.9 4.9 0 1 1-3.1 8c.2 1.7.9 3 2.2 4.3H8.6c1.3-1.3 2-2.6 2.2-4.3a4.9 4.9 0 1 1-3.1-8A4.9 4.9 0 0 1 12 2.2z',
 d:'M12 1.8c2.2 3.6 5 7 8.2 10.2-3.2 3.2-6 6.6-8.2 10.2C9.8 18.6 7 15.2 3.8 12 7 8.8 9.8 5.4 12 1.8z'};
const TAIL='M12 21c-.5-3.8-1.3-6.4-2.8-8.6C7.4 9.8 4.4 8.6 1.8 9c.2 3.6 3 6 6.6 6.2.7 0 1.2.1 1.6.3-.6 2.2-1.6 3.8-3.1 5.5h10.2c-1.5-1.7-2.5-3.3-3.1-5.5.4-.2.9-.3 1.6-.3 3.6-.2 6.4-2.6 6.6-6.2-2.6-.4-5.6.8-7.4 3.4-1.5 2.2-2.3 4.8-2.8 8.6z';
const PIPS={2:[[50,30],[50,110,1]],3:[[50,30],[50,70],[50,110,1]],4:[[36,30],[64,30],[36,110,1],[64,110,1]],5:[[36,30],[64,30],[50,70],[36,110,1],[64,110,1]],6:[[36,30],[64,30],[36,70],[64,70],[36,110,1],[64,110,1]],7:[[36,30],[64,30],[50,50],[36,70],[64,70],[36,110,1],[64,110,1]],8:[[36,30],[64,30],[50,50],[36,70],[64,70],[50,90,1],[36,110,1],[64,110,1]],9:[[36,26],[64,26],[36,54],[64,54],[50,70],[36,86,1],[64,86,1],[36,114,1],[64,114,1]],10:[[36,26],[64,26],[50,40],[36,54],[64,54],[36,86,1],[64,86,1],[50,100,1],[36,114,1],[64,114,1]]};
export const THEMES={deepseek:['#5b9bff','#071226'],grok:['#c8324d','#fff6f7'],seed:['#6044f2','#fff'],kimi:['#a3a8f5','#0b0f21'],qwen:['#2a49ae','#fff'],minimax:['#c9452f','#fff'],chatgpt:['#5e56a8','#fff'],gemini:['#8c7dff','#0d0a1e'],claude:['#be5129','#fff'],glm:['#84a0c8','#0d0e11'],hunyuan:['#bd2d36','#fff']};
export const EMOTIONS=['cheerful','shy','serious','confused','angry','frightened','exasperated','starry'];
export const FX={
 landlord:['地主','LANDLORD','coins'],plane:['飞机','PLANE','trail'],bomb:['炸弹','BOMB','shock'],rocket:['王炸','ROCKET','comet'],
 spring:['春天','SPRING','petal'],antispring:['反春天','ANTI-SPRING','snow'],allin:['ALL IN!','ALL IN!','chips'],
 royal:['皇家同花顺','ROYAL FLUSH','rays'],straightflush:['同花顺','STRAIGHT FLUSH','bolt'],quads:['四条','FOUR OF A KIND','pillars'],
 fullhouse:['葫芦','FULL HOUSE','coins'],flush:['同花','FLUSH','suit'],straight:['顺子','STRAIGHT','trail'],trips:['三条','THREE OF A KIND','beams'],
 ddzstraight:['顺子','STRAIGHT'],chainpair:['连对','CONSECUTIVE PAIRS'],twopair:['两对','TWO PAIR'],pair:['一对','ONE PAIR']
};
export const packagedAsset=path=>'/api/ai-buddy/card-games/assets/'+path;
const asset=name=>packagedAsset('art/'+name+'.webp');
export const safeTheme=id=>Object.hasOwn(THEMES,id)?id:'deepseek';
export const artKey=(kind,id,emotion='')=>[kind,id,emotion].join(':');
export function artUrl(art,kind,id,emotion=''){
 const value=art?.[artKey(kind,id,emotion)];
 return typeof value==='string'&&value.startsWith('data:image/')?value:null;
}
export function portraitUrl(art,id,emotion='cheerful',full=false){
 if(!Object.hasOwn(THEMES,id)||full)return artUrl(art,'p',id)||artUrl(art,'b',id,emotion);
 return artUrl(art,'b',id,emotion)||artUrl(art,'b',id,'cheerful')||EMOTIONS.map(e=>artUrl(art,'b',id,e)).find(Boolean);
}
export function stageFit(width,height){
 if(!(width>0&&height>0))return {height:800,shift:0,scale:1,x:0};
 const logicalHeight=1280*height/width;
 if(logicalHeight<800){const scale=height/800;return {height:800,shift:0,scale,x:(width-1280*scale)/2};}
 const visible=Math.min(logicalHeight,1180);
 return {height:visible,shift:(visible-800)*.8,scale:width/1280,x:0};
}
const side=(x,y)=>({x,y,py:y+90,pw:154,side:true});
const upper=(count,spacing,width)=>Array.from({length:count},(_,index)=>{
 const x=640+(index-(count-1)/2)*spacing,arc=((x-640)/500)**2*44;
 return {x,y:345-.7875*width+arc,py:324+arc,cw:width,pw:Math.min(spacing-12,172)};
});
export function seatPositions(count,type){
 if(type==='doudizhu')return [{x:246,y:44,py:392,cw:560,pw:196,plateX:142},{x:1034,y:44,py:392,cw:560,pw:196,plateX:1118}];
 if(count<=4){const xs={1:[640],2:[320,960],3:[230,640,1050],4:[150,470,810,1130]}[count]??[];return xs.map(x=>({x,y:count===1?30:40,py:326,cw:[0,600,560,470,410][count],pw:count===4?168:186}));}
 return {
  5:()=>upper(5,226,340),6:()=>upper(6,190,306),7:()=>[side(92,340),...upper(5,196,300),side(1188,340)],
  8:()=>[side(92,340),...upper(6,166,270),side(1188,340)],
  9:()=>[side(92,440),side(92,258),...upper(5,172,276),side(1188,258),side(1188,440)]
 }[count]?.()??[];
}
export function ddzDisplayHand(cards){
 return cards.toSorted((a,b)=>ddzRank(b)-ddzRank(a)||a-b);
}

export function bubblePlacement(seat,opponents,ddz,active){
 const top=(y,shift=.7)=>'calc('+Math.round(y)+'px + var(--dy)*'+shift+')';
 const toRight=seat.x<=640;
 const edge=(x,y,maxWidth)=>({tail:toRight?'left':'right',style:{
  [toRight?'left':'right']:(toRight?x:1280-x)+'px',top:top(y),maxWidth:maxWidth+'px'
 }});
 if(seat.side)return edge(seat.x+(toRight?1:-1)*(active?64:56),seat.y+5,230);
 if(!ddz&&opponents>=5)return {tail:'up',style:{
  left:Math.min(1144,Math.max(136,seat.x))+'px',top:top(seat.y+.34*seat.cw+12)
 }};
 const ownEdge=Math.round(seat.x+(toRight?1:-1)*(seat.cw*.11+13));
 const adjacent=seatPositions(opponents,ddz?'doudizhu':'texas')
  .filter(next=>toRight?next.x>seat.x:next.x<seat.x)
  .sort((a,b)=>Math.abs(a.x-seat.x)-Math.abs(b.x-seat.x))[0];
 const farEdge=adjacent?adjacent.x-(toRight?1:-1)*(adjacent.cw*.11+13):toRight?1268:12;
 const avoidBottom=ddz?(toRight?560:720):farEdge;
 return edge(ownEdge,ddz?108:Math.max(82,seat.y+56),Math.min(230,Math.abs(avoidBottom-ownEdge)));
}

export function cardInfo(code,type){
 if(code==='back')return {back:true};
 if(type==='doudizhu'&&(code===52||code===53))return {joker:code===53?'big':'small',red:code===53};
 if(!Number.isInteger(code)||code<0||code>=52)return null;
 const n=Math.floor(code/4)+(type==='doudizhu'?3:2),rank=String(({11:'J',12:'Q',13:'K',14:'A',15:'2'})[n]??n);
 const suit=SUITS[code%4],court=COURT[SUIT_IDS[code%4]+rank];
 return {rank,suit,suitId:SUIT_IDS[code%4],court,red:suit==='♥'||suit==='♦'};
}
export function playingCard(h,code,{type,theme,t,width=100,key,className='',style={}}){
 const info=cardInfo(code,type);if(!info)return null;
 const {rank,suit,suitId,court,red,joker,back}=info,label=back?t('牌背','Face down'):joker?t(joker==='big'?'大王':'小王',joker==='big'?'Big joker':'Small joker'):rank+suit;
 const pic=back?asset('back/'+theme):court?asset(court):joker?asset('joker-'+joker):null;
 const suitPath=SUIT[suitId];
 const pipArt=suitPath&&h('svg',{className:'cg-pips',viewBox:'0 0 100 140','aria-hidden':true},rank==='A'?[
  h('path',{key:'suit',fill:'currentColor',d:suitPath,transform:'translate(16 36) scale(2.84)'}),
  h('path',{key:'cutout',fill:'var(--cg-paper)',d:TAIL,transform:'translate(36 58) scale(1.16)'})
 ]:[
  h('path',{key:'watermark',fill:'#16386e',opacity:.07,d:TAIL,transform:'translate(30 50) scale(1.68)'}),
  ...(PIPS[rank]??[]).map(([x,y,inverted],i)=>h('path',{key:i,fill:'currentColor',d:suitPath,transform:'translate('+x+' '+y+') '+(inverted?'rotate(180) ':'')+'scale(.6) translate(-12 -12)'}))
 ]);
 return h('span',{key,className:['cg-card',pic&&!back?'art':'',red?'red':'',className].filter(Boolean).join(' '),style:{'--cw':width+'px',...style},'aria-label':label,role:'img'},
  pic?h('img',{src:pic,alt:'',draggable:false}):pipArt,
  !back&&h('span',{className:'cg-index'+(joker?' cg-joker-index':''),'aria-hidden':true,style:joker?{color:joker==='big'?'#c8322f':'#233a8a'}:undefined},
   joker?t(joker==='big'?'大王':'小王','JOKER'):rank,
   !joker&&h('svg',{viewBox:'0 0 24 24','aria-hidden':true},h('path',{fill:'currentColor',d:suitPath}))));
}
export const tokenArt=name=>asset(name);
export function effectParticles(h,kind,suit){
 const particles=FX[kind]?.[2];
 if(!particles)return [];
 const counts={coins:26,trail:12,shock:28,comet:2,petal:46,snow:60,chips:28,rays:1,bolt:1,pillars:4,suit:30,beams:3};
 const pool=['chip-red','chip-gold','chip-blue','chip-white'];
 let seed=7;
 const random=(a,b)=>{seed=(seed*16807)%2147483647;return a+(seed%10000)/10000*(b-a);};
 return Array.from({length:counts[particles]},(_,i)=>{
  const style={'--x':random(15,96)+'%','--y':random(8,93)+'%','--s':random(7,45)+'px','--dl':random(0,450)+'ms','--r':random(-35,35)+'deg'};
  const props={key:i,className:'cg-particle '+particles,style};
  if(particles==='coins'||particles==='chips')return h('img',{...props,src:asset(particles==='coins'?'coin':pool[i%4]),alt:''});
  const symbol={spade:SUITS[0],heart:SUITS[1],diamond:SUITS[2],club:SUITS[3],s:'♠',h:'♥',d:'♦',c:'♣','♠':'♠','♥':'♥','♦':'♦','♣':'♣'}[suit]??'♥';
  return h('i',props,particles==='suit'?symbol:null);
 });
}

