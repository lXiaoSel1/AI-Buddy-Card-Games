import en from '../locales/en.json' with {type:'json'};

const zh={sound:'声音',mute:'全部静音',music:'音乐',sfx:'音效'};
const speaker='M4 9v6h4l5 4V5L8 9H4Zm12 .5a3.5 3.5 0 0 1 0 5v-5Zm0-4a7.5 7.5 0 0 1 0 13v-2.2a5.5 5.5 0 0 0 0-8.6V5.5Z';

export function AudioSettingsControl({React,lang,settings,change,result=false}){
 const {createElement:h,useEffect,useId,useRef,useState}=React;
 const [open,setOpen]=useState(false),id=useId(),root=useRef(null),trigger=useRef(null);
 const labels=lang==='en'?en:zh;
 useEffect(()=>{
  if(!open)return;
  const owner=root.current.ownerDocument;
  const outside=event=>{if(!root.current?.contains(event.target))setOpen(false);};
  const escape=event=>{
   if(event.key!=='Escape')return;
   setOpen(false);
   trigger.current?.focus();
  };
  owner.addEventListener('pointerdown',outside);
  owner.addEventListener('keydown',escape);
  return ()=>{
   owner.removeEventListener('pointerdown',outside);
   owner.removeEventListener('keydown',escape);
  };
 },[open]);
 const volume=channel=>{
  const percent=Math.round(settings[channel]*100);
  return h('label',{className:'cg-sound-row'},h('span',null,labels[channel]),
   h('input',{type:'range',min:0,max:100,step:1,value:percent,'aria-label':labels[channel],'data-audio-channel':channel,
    onChange:event=>change({...settings,[channel]:Number(event.currentTarget.value)/100})}),h('b',{'aria-hidden':true},percent));
 };
 return h('div',{ref:root,className:'cg-sound-control'+(result?' cg-result-sound':''),'data-audio-settings':true},
  h('button',{ref:trigger,type:'button',className:'cg-sound-button','data-game-control':'sound','aria-label':labels.sound,title:labels.sound,
   'aria-expanded':open,'aria-controls':id,onClick:()=>setOpen(value=>!value)},
   h('svg',{viewBox:'0 0 24 24','aria-hidden':true},h('path',{fill:'currentColor',d:speaker}))),
  h('div',{id,hidden:!open,className:'cg-sound-popover',role:'group','aria-label':labels.sound},
   h('button',{type:'button',className:'cg-sound-row cg-sound-mute',role:'switch','aria-checked':settings.muted,
    onClick:()=>change({...settings,muted:!settings.muted})},labels.mute,h('span',{className:'cg-sound-switch','aria-hidden':true})),
   volume('music'),volume('sfx')));
}
