export const DEFAULT_AUDIO=Object.freeze({muted:false,music:.4,sfx:.6,voice:1});

export function audioSettings(value,base=DEFAULT_AUDIO){
 const channel=id=>Number.isFinite(value?.[id])?Math.max(0,Math.min(1,value[id])):base[id];
 return {muted:typeof value?.muted==='boolean'?value.muted:base.muted,music:channel('music'),sfx:channel('sfx'),voice:channel('voice')};
}
