import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AudioSettingsControl} from '../../plugins/card-games/src/client/audio-settings.mjs';
import {createNativeGamePlugin} from '../../plugins/card-games/src/index.mjs';

test('approved voice slider uses existing audio mix without changing music or effects',()=>{
 const markup=renderToStaticMarkup(React.createElement(AudioSettingsControl,{React,lang:'zh',settings:{muted:false,music:.4,sfx:.6,voice:.8},change:()=>{},voiceAvailable:true}));
 assert.match(markup,/aria-label="语音"[^>]*data-audio-channel="voice"[^>]*value="80"/);assert.match(markup,/data-audio-channel="music"[^>]*value="40"/);assert.match(markup,/data-audio-channel="sfx"[^>]*value="60"/);
 const oldHost=renderToStaticMarkup(React.createElement(AudioSettingsControl,{React,lang:'en',settings:{muted:false,music:.4,sfx:.6,voice:.8},change:()=>{},voiceAvailable:false}));assert.doesNotMatch(oldHost,/data-audio-channel="voice"/);
});

test('saved plugin voice mix reaches only the authenticated host audio operation',async()=>{
 const dataDirectory=await mkdtemp(join(tmpdir(),'card-voice-ui-')),calls=[];let api;
 const plugin=await createNativeGamePlugin({buddyVoiceGamesServices:{openPlugin:async()=>({dataDirectory,describe:async()=>({cardAudioVolume:true}),authorizeRequest:async(_request,scope)=>{calls.push({type:'authorize',...scope});return{contextToken:'fixture'};},invoke:async(method,payload)=>{calls.push({type:'invoke',method,payload});return{voice:payload.voice,muted:payload.muted};},close:async()=>{}})},connection:{fetch:{register:route=>{if(route.path==='/api/ai-buddy/card-games')api=route;return()=>{};}}},effect:()=>{}});
 try{assert.equal(plugin.readiness().cardAudioVolume,true);const request=new Request('http://127.0.0.1/api/ai-buddy/card-games',{method:'POST',body:JSON.stringify({method:'audio.settings',payload:{settings:{muted:true,music:.4,sfx:.6,voice:.2}}})}),response=await api.fetch(request);assert.equal(response.status,200);assert.equal(calls[0].action,'games.table.audio');assert.deepEqual(calls.find(row=>row.type==='invoke'),{type:'invoke',method:'games.table.audio',payload:{voice:.2,muted:true,principal:{contextToken:'fixture'}}});assert.equal((await response.json()).settings.voice,.2);}finally{await plugin.close();await rm(dataDirectory,{recursive:true,force:true});}
});
