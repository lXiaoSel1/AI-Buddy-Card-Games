export const stylesheet=`
@font-face{font-family:CGDisplay;src:url('/api/ai-buddy/card-games/assets/fonts/zcool-qingke-huangyou.woff2') format('woff2');font-display:swap}
@font-face{font-family:CGBrush;src:url('/api/ai-buddy/card-games/assets/fonts/ma-shan-zheng.woff2') format('woff2');font-display:swap}
.cg-root{--cg-ui:var(--buddy-f-ui,"Segoe UI","Microsoft YaHei UI",sans-serif);--cg-display:CGDisplay,"Microsoft YaHei UI",sans-serif;--cg-brush:CGBrush,"KaiTi",serif;--cg-bg:var(--buddy-bg,#0a1220);--cg-surface:var(--buddy-surface,#111d33);--cg-panel:var(--buddy-dlg-bg,#0d1830);--cg-border:var(--buddy-border,#263a5c);--cg-ink:var(--buddy-text,#e8eef7);--cg-muted:var(--buddy-muted,#9fb0c8);--cg-accent:var(--buddy-accent,#5b9bff);--cg-on:var(--buddy-on-accent,#071226);--cg-gold:#efc96f;--cg-paper:#fbf7ee;position:relative;overflow:hidden;isolation:isolate;min-width:0;width:100%;height:100%;min-height:0;box-sizing:border-box;color:var(--cg-ink);background:var(--cg-bg) center/cover;font:15px/1.4 var(--cg-ui)}
.cg-root *{box-sizing:border-box}
.cg-root{--cg-number:var(--cg-gold);--cg-negative:#ff9d9d}
html[data-buddy-scheme="light"] .cg-root{--cg-number:#8a5a00;--cg-negative:#b3261e}
.cg-root [hidden]{display:none!important}
.cg-root h1,.cg-root h2,.cg-root h3,.cg-root p{margin:0}
.cg-root img{display:block;max-width:none}
.cg-root input,.cg-root textarea,.cg-root select,.cg-root button{font:inherit;color:inherit}
.cg-root input:not([type="range"],[type="checkbox"]),.cg-root textarea,.cg-root select{background:var(--cg-bg);border:1px solid var(--cg-border);border-radius:8px;padding:8px 10px;max-width:100%;min-width:0}
.cg-root textarea{width:100%;min-height:82px;resize:vertical}
.cg-root input[type="range"],.cg-root input[type="checkbox"]{accent-color:var(--cg-accent)}
.cg-root button{cursor:pointer}
.cg-root button:disabled{opacity:.48;cursor:not-allowed}
.cg-root button:focus-visible,.cg-root input:focus-visible,.cg-root textarea:focus-visible,.cg-root select:focus-visible,.cg-root summary:focus-visible{outline:3px solid var(--cg-accent);outline-offset:3px}
.cg-stage{position:absolute;top:0;left:0;width:1280px;transform-origin:0 0;overflow:hidden}
.cg-content,.cg-stage-background,.cg-vignette{position:absolute;inset:0}
.cg-stage-background{background:var(--cg-bg) center/cover;filter:brightness(.66) saturate(.92)}
.cg-stage-background.cg-approved-brightness{filter:brightness(.8)}
.cg-vignette{background:radial-gradient(ellipse 75% 62% at 50% 34%,transparent 40%,rgba(4,8,20,.62) 100%);pointer-events:none}
.cg-table-picture{position:absolute;z-index:3;left:0;top:calc(80px + var(--dy));width:1280px;height:720px;pointer-events:none}
.cg-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.cg-top{position:absolute;z-index:13;inset:0 0 auto;height:56px;display:flex;align-items:center;gap:10px;padding:0 16px;background:linear-gradient(rgba(4,8,20,.62),transparent)}
.cg-grow{flex:1}
.cg-ib{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 12px;border-radius:10px;background:color-mix(in srgb,var(--cg-surface) 88%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);font:600 14px var(--cg-ui)!important;white-space:nowrap}
.cg-ib.on{background:var(--cg-accent);color:var(--cg-on);border-color:transparent}
.cg-ib:hover:enabled{border-color:var(--cg-accent)}
.cg-top .cg-ib{height:36px;background:color-mix(in srgb,var(--cg-surface) 84%,transparent);font:600 13.5px var(--cg-ui)!important}
.cg-top .cg-ib.on{background:var(--cg-accent)}
.cg-top .cg-ib svg,.cg-result-lobby svg{width:17px;height:17px;flex:none}
.cg-sound-control{position:relative;flex:none;width:44px;height:36px}
.cg-root .cg-sound-button{position:relative;display:grid;place-items:center;width:44px;height:36px;padding:0;border:0;border-radius:10px;background:var(--cg-gold);color:#3a2706;box-shadow:0 4px 10px rgba(0,0,0,.45);z-index:31}
.cg-sound-button svg{width:24px;height:24px}
.cg-sound-popover{position:absolute;top:46px;left:-138px;width:300px;padding:8px 14px;border-radius:15px;background:color-mix(in srgb,var(--cg-surface) 95%,transparent);box-shadow:0 12px 26px rgba(0,0,0,.5),inset 0 0 0 1px color-mix(in srgb,var(--cg-ink) 16%,transparent);z-index:30}
.cg-root .cg-sound-row{display:grid;grid-template-columns:64px 1fr 40px;align-items:center;gap:10px;min-height:46px;font:400 21px/1 var(--cg-display);color:var(--cg-ink)}
.cg-sound-row input{width:100%;margin:0;accent-color:var(--cg-accent)}
.cg-sound-row b{font-weight:400;text-align:right;color:var(--cg-muted)}
.cg-root .cg-sound-mute{grid-template-columns:1fr auto;width:100%;padding:0;border:0;background:none;text-align:left}
.cg-sound-switch{position:relative;display:block;width:52px;height:28px;border-radius:14px;background:color-mix(in srgb,var(--cg-ink) 24%,transparent)}
.cg-sound-switch:after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff}
.cg-sound-mute[aria-checked="true"] .cg-sound-switch{background:var(--cg-accent)}
.cg-sound-mute[aria-checked="true"] .cg-sound-switch:after{transform:translateX(24px)}
.cg-result-sound{position:absolute;right:16px;top:10px;z-index:13}
.cg-result-sound .cg-sound-popover{left:auto;right:0}
.cg-gb{display:inline-flex;align-items:center;justify-content:center;min-width:112px;min-height:50px;padding:7px 20px;border:0;border-radius:14px;font:400 25px/1 var(--cg-display)!important;letter-spacing:.02em;color:var(--cg-on)!important;background:var(--cg-accent);box-shadow:inset 0 2px rgba(255,255,255,.34),inset 0 -3px rgba(0,0,0,.2),0 7px 14px rgba(0,0,0,.36)}
.cg-gb.quiet{background:var(--cg-surface);color:var(--cg-ink)!important;box-shadow:inset 0 0 0 1px var(--cg-border),0 7px 14px rgba(0,0,0,.32)}
.cg-gb.gold{background:var(--cg-gold);color:#3a2706!important}
.cg-gb.danger{background:#b8373f;color:#fff!important}
.cg-coin,.cg-card-count{display:inline-flex;align-items:center;gap:5px;font-weight:700;font-variant-numeric:tabular-nums}
.cg-coin img{width:20px;height:20px;object-fit:contain}
.cg-card-count img{width:17px;height:24px;border-radius:3px}
.cg-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.cg-quiet{font-size:13px;color:var(--cg-muted);line-height:1.45}
.cg-field{display:flex;align-items:center;gap:10px}
.cg-cards{display:flex;align-items:center;gap:6px}
.cg-cards.cg-tight{gap:0}
.cg-cards.cg-tight .cg-card+.cg-card{margin-left:calc(var(--cw)*-.57)}
.cg-card{position:relative;display:block;flex:none;width:var(--cw);height:calc(var(--cw)*1.4);border-radius:calc(var(--cw)*.075);overflow:hidden;background:var(--cg-paper);color:#1c2233;box-shadow:0 2px 3px #0005,0 7px 14px #0005;font-size:calc(var(--cw)/5)}
.cg-card.red{color:#d4263a}
.cg-card:after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px #281e0a35;pointer-events:none}
.cg-card>img{width:100%;height:100%;object-fit:cover}
.cg-index{position:absolute;top:.16em;left:.16em;z-index:2;display:flex;flex-direction:column;align-items:center;width:1.04em;font:800 1.2em/1 var(--cg-ui);letter-spacing:-.04em}
.cg-index svg{width:.82em;height:.82em;margin-top:.1em}
.cg-card.art .cg-index{background:var(--cg-paper);border-radius:.34em;padding:.14em .08em .12em;left:.2em;top:.18em;box-shadow:0 1px 3px rgba(0,0,0,.35);font-size:1.16em}
.cg-card.art .cg-joker-index{font:400 .86em/1.02 var(--cg-display);writing-mode:vertical-rl;width:auto;min-width:0;padding:.22em .12em;letter-spacing:.04em;left:.2em;top:.18em}
.cg-pips{position:absolute;inset:0;width:100%;height:100%}
.cg-hand{position:absolute;z-index:9;left:50%;bottom:14px;width:0;height:150px}
.cg-tx-hand{position:absolute;left:50%;bottom:16px;transform:translateX(-300px);gap:10px;z-index:9}
.cg-card-slot{position:absolute;display:block;bottom:0;border:0;border-radius:8px;background:none;padding:0;transition:transform .16s ease-out}
.cg-card-slot:disabled{opacity:1!important;cursor:default}
.cg-card-slot.picked{filter:drop-shadow(0 0 3px var(--cg-gold))}
.cg-deal{display:block;animation:cg-deal .3s cubic-bezier(.2,.8,.3,1) var(--deal-delay) both}
@keyframes cg-deal{from{transform:translateY(-300px) rotate(14deg);opacity:0}}
.cg-ddz-deal{position:absolute;left:640px;top:calc(428px + var(--dy)*.5);z-index:9;pointer-events:none}
.cg-deal-stack,.cg-deal-flight{position:absolute;left:-22px;top:-31px}
.cg-deal-stack{animation:cg-deal-stack 120ms step-end both}
.cg-deal-stack>.cg-card{position:absolute}
.cg-deal-stack>.cg-card:nth-child(1){transform:translate(4px,4px) rotate(7deg)}
.cg-deal-stack>.cg-card:nth-child(2){transform:translate(2px,2px) rotate(-5deg)}
.cg-deal-flight{animation:cg-deal-flight var(--deal-duration) cubic-bezier(.2,.8,.3,1) var(--deal-delay) both}
.cg-board.cg-deal-bottom{opacity:0}
@keyframes cg-deal-stack{from{opacity:1}to{opacity:0}}
@keyframes cg-deal-flight{0%{opacity:0;transform:scale(1)}8%{opacity:1}100%{opacity:0;transform:translate(var(--deal-x),var(--deal-y)) scale(.24)}}
.cg-ddz-reveal-hand{position:absolute;z-index:7;perspective:450px;text-align:center}
.cg-ddz-reveal-card,.cg-ddz-reveal-inner,.cg-ddz-reveal-back,.cg-ddz-reveal-face{position:absolute;display:block;width:58px;height:81.2px}
.cg-ddz-reveal-inner{transform-style:preserve-3d;animation:cg-board-flip 300ms var(--reveal-delay) both}
.cg-ddz-reveal-back,.cg-ddz-reveal-face{inset:0;backface-visibility:hidden}
.cg-ddz-reveal-face{transform:rotateY(180deg)}
.cg-ddz-out{display:inline-block;transform:translateX(-50%);white-space:nowrap;color:#fff;text-shadow:0 2px 4px #000}
.cg-controls.ddz.cg-ddz-reveal-controls{flex-direction:column;align-items:center;gap:8px}
.cg-ddz-reveal-controls strong{color:var(--cg-gold);font:400 45px/1 var(--cg-display);text-shadow:0 3px 0 rgba(0,0,0,.4)}
.cg-bust{position:absolute;z-index:1;pointer-events:none;transition:transform .4s cubic-bezier(.2,.8,.2,1),filter .3s}
.cg-bust img,.cg-lobby-host img,.cg-result-hero img{width:100%;height:auto;filter:drop-shadow(0 10px 18px #0007)}
.cg-bust.active{z-index:2;transform:translateY(-16px) scale(1.09);transform-origin:50% 70%}
.cg-bust.active img{filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 22px var(--cg-accent))}
.cg-bust.winner img{filter:drop-shadow(0 0 2px #fff4a2) drop-shadow(0 0 24px var(--cg-gold))}
.cg-bust.idle{filter:brightness(.72) saturate(.85)}
.cg-bust.out{filter:grayscale(.75) brightness(.55)}
.cg-breathe{animation:cg-breathe 5.2s ease-in-out infinite}
@keyframes cg-breathe{50%{transform:translateY(-5px)}}
.cg-initial{display:grid;place-items:center;width:90px;height:90px;margin:0 auto;border-radius:50%;background:var(--cg-surface);color:var(--cg-ink);border:2px solid var(--cg-accent);font:400 44px/1 var(--cg-display)}
.cg-bust .cg-initial{width:min(65%,230px);height:auto;aspect-ratio:1;font-size:100px}
.cg-face{display:grid;place-items:center;overflow:hidden;width:46px;height:46px;border-radius:50%;background:var(--cg-surface);border:2px solid color-mix(in srgb,var(--cg-ink) 34%,transparent);flex:none}
.cg-face img{width:100%;height:100%;object-fit:cover;object-position:center top;scale:1.35;transform-origin:50% 10%}
.cg-face .cg-initial{border:0;width:100%;height:100%;font-size:24px}
.cg-root .cg-medal{position:absolute;width:104px;height:104px;border-radius:50%;background-size:236%;background-position:50% 5%;background-repeat:no-repeat;background-color:color-mix(in srgb,var(--cg-accent) 20%,#0c1426);border:3px solid var(--char-accent,var(--cg-accent));box-shadow:0 8px 16px rgba(0,0,0,.45);z-index:4;display:grid;place-items:center;transition:transform .4s cubic-bezier(.2,.8,.2,1),filter .3s}
.cg-root .cg-medal.active{box-shadow:0 0 0 4px color-mix(in srgb,var(--char-accent,var(--cg-accent)) 60%,transparent),0 0 20px var(--char-accent,var(--cg-accent)),0 8px 16px rgba(0,0,0,.45)}
.cg-root .cg-medal.out{filter:grayscale(.8) brightness(.6)}
.cg-root .cg-medal.winner{box-shadow:0 0 20px #ffda7a99,0 8px 16px rgba(0,0,0,.45)}
.cg-spot{position:absolute;right:132px;bottom:-64px;width:340px;z-index:7;pointer-events:none;animation:cg-rise .3s ease-out}
.cg-spot img{width:100%;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 20px color-mix(in srgb,var(--cg-accent) 62%,transparent))}
@keyframes cg-rise{from{transform:translateY(140px);opacity:0}}
.cg-ribbon{position:absolute;z-index:5;width:var(--ribbon-width);margin-left:calc(var(--ribbon-width)/-2);text-align:center;color:#f4f6fb;filter:drop-shadow(0 6px 7px rgba(0,0,0,.6))}
.cg-ribbon-name{display:block;font:400 23px/1.08 var(--cg-display);white-space:nowrap;padding:5px 12px 3px 24px;background:linear-gradient(100deg,color-mix(in srgb,var(--char-accent) 88%,#fff),var(--char-accent) 46%,color-mix(in srgb,var(--char-accent) 74%,#000));color:var(--char-on);transform:skewX(-13deg);border-radius:5px 7px 3px 3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.14)}
.cg-ribbon-name span{display:block;transform:skewX(13deg);overflow:hidden;text-overflow:ellipsis}
.cg-ribbon-sub{display:inline-flex;font:700 14.5px/1.15 var(--cg-ui);font-variant-numeric:tabular-nums;white-space:nowrap;padding:3px 15px 3px;margin-top:-1px;background:linear-gradient(180deg,#121a2e,#0a0f1d);transform:skewX(-13deg);border-radius:0 0 7px 7px}
.cg-ribbon-sub>span{display:inline-flex;align-items:center;gap:8px;transform:skewX(13deg)}
.cg-ribbon .cg-coin img{width:17px;height:17px}
.cg-ribbon .cg-card-count img{width:14px;height:20px}
.cg-ribbon.active{filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 13px var(--char-accent)) drop-shadow(0 5px 6px rgba(0,0,0,.5))}
.cg-ribbon.winner{filter:drop-shadow(0 0 13px var(--cg-gold)) drop-shadow(0 5px 6px rgba(0,0,0,.5))}
.cg-ribbon.out{filter:grayscale(.92) brightness(.68) drop-shadow(0 5px 6px rgba(0,0,0,.5))}
.cg-ribbon.allin .cg-ribbon-sub{background:#b8373f;color:#fff}
.cg-ornament{position:absolute;left:-13px;top:-12px;font-style:normal;z-index:2}
.cg-ornament img{width:auto;height:38px;max-width:46px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.65))}
.cg-ornament svg{width:27px;height:27px;color:var(--cg-paper)}
.cg-position{position:absolute;right:-9px;top:-11px;width:27px;height:27px;border-radius:50%;background:var(--cg-paper);color:#1c2233;font:800 12.5px/27px var(--cg-ui);font-style:normal;box-shadow:0 2px 5px rgba(0,0,0,.55);z-index:3;white-space:nowrap}
.cg-position.landlord{background:#c8322f;color:#ffe9b0}
.cg-action-tag{position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);padding:1px 10px;border-radius:8px;background:var(--cg-accent);color:var(--cg-on);font:700 13px var(--cg-ui);font-style:normal;white-space:nowrap;z-index:3;box-shadow:0 2px 5px rgba(0,0,0,.4)}
.cg-bubble{position:absolute;z-index:8;max-width:230px;padding:9px 14px;border-radius:14px;background:var(--cg-paper);color:#1d2436;font-weight:600;box-shadow:0 6px 16px #0005;overflow-wrap:anywhere}
.cg-bubble:after{content:"";position:absolute;bottom:-9px;left:26px;border:9px solid transparent;border-top-color:var(--cg-paper);border-bottom:0}
.cg-bubble-spot:after{left:auto;right:26px}
.cg-bubble-left,.cg-bubble-right,.cg-bubble-up,.cg-bubble-spot{pointer-events:none}
.cg-bubble-left:after,.cg-bubble-right:after{top:16px;bottom:auto;border:8px solid transparent}
.cg-bubble-left:after{left:-15px;border-right-color:var(--cg-paper)}
.cg-bubble-right:after{left:auto;right:-15px;border-left-color:var(--cg-paper)}
.cg-bubble-up{transform:translateX(-50%)}
.cg-bubble-up:after{top:-15px;bottom:auto;left:calc(50% - 8px);border:8px solid transparent;border-bottom-color:var(--cg-paper)}
.cg-bubble-text{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;line-height:1.32;max-height:3.96em}
.cg-bubble.thinking{display:flex;gap:6px;padding:12px 16px}
.cg-bubble.thinking i{width:9px;height:9px;border-radius:50%;background:#46506a;animation:cg-dot 1.1s infinite}
.cg-bubble.thinking i:nth-of-type(2){animation-delay:.16s}.cg-bubble.thinking i:nth-of-type(3){animation-delay:.32s}
@keyframes cg-dot{30%{transform:translateY(-5px);opacity:1}0%,60%,100%{transform:none;opacity:.45}}
.cg-played,.cg-seat-backs,.cg-bet,.cg-pass{position:absolute;z-index:5}
.cg-played{width:245px;display:flex;justify-content:center}
.cg-showdown-cards{width:auto;z-index:4}
.cg-seat-backs{display:flex;z-index:4}
.cg-seat-backs img{width:27px;height:38px;border-radius:3px;box-shadow:0 2px 3px rgba(0,0,0,.5);transform:rotate(-7deg)}
.cg-seat-backs img+img{margin-left:-15px;transform:rotate(8deg)}
.cg-ddz-played{width:250px;z-index:4}
.cg-ddz-played .cg-cards.cg-tight{gap:6px}
.cg-ddz-played .cg-cards.cg-tight>.cg-card+.cg-card{margin-left:calc(var(--cw)*-.52)}
.cg-pass{font:400 34px/1 var(--cg-display);color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.7);z-index:4}
.cg-pot{display:flex;align-items:center;gap:9px;padding:5px 15px;border-radius:999px;background:rgba(4,12,24,.72);color:#fff;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.cg-bet{display:flex;align-items:center;gap:5px;padding:3px 10px 3px 4px;border-radius:999px;background:rgba(4,12,24,.74);color:#fff;font-weight:700;font-size:14px;font-variant-numeric:tabular-nums}
.cg-pot img,.cg-bet img{width:24px;height:24px}
.cg-you-bet{left:50%;margin-left:-40px}
.cg-board,.cg-pot{position:absolute;left:50%;z-index:5;transform:translateX(-50%)}
.cg-board-slot{display:block;flex:none;position:relative;width:86px;height:120.4px;border:1px dashed #ffffff42;border-radius:7px;background:#040b1733;perspective:450px}
.cg-board-slot>.cg-card,.cg-board-reveal{position:absolute;inset:-1px}
.cg-board-reveal{display:block;transform-style:preserve-3d;animation:cg-board-flip var(--reveal-duration) var(--reveal-delay) both}
.cg-board-reveal.turn{--board-lift:-9px}
.cg-board-reveal.river{--board-lift:-17px}
.cg-board-face,.cg-board-back{display:block;position:absolute;inset:0;backface-visibility:hidden}
.cg-board-face{transform:rotateY(180deg)}
.cg-board-reveal.reduced{animation:none}
.cg-board-reveal.reduced .cg-board-back{display:none}
.cg-board-reveal.reduced .cg-board-face{transform:none;animation:cg-board-fade var(--reveal-duration) var(--reveal-delay) both}
@keyframes cg-board-flip{0%{transform:rotateY(0)}50%{transform:translateY(var(--board-lift,0)) rotateY(90deg)}100%{transform:rotateY(180deg)}}
@keyframes cg-board-fade{from{opacity:0}to{opacity:1}}
.cg-multiplier{position:absolute;left:50%;top:8px;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:6px 16px;border-radius:14px;background:color-mix(in srgb,var(--cg-surface) 88%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);z-index:14}
.cg-multiplier b{font:400 30px/1 var(--cg-display);color:var(--cg-number)}
.cg-multiplier small{display:block;font-size:12.5px;color:var(--cg-muted)}
.cg-multiplier .cap{color:var(--cg-negative);font-weight:700}
.cg-pair-stakes{position:absolute;top:100%;left:50%;transform:translateX(-50%);background:var(--cg-surface);border-radius:8px;padding:1px 8px;font:600 12px/1.1 var(--cg-ui);white-space:nowrap}
.cg-pair-stakes[open]{padding:6px 10px;line-height:1.4}
.cg-pair-stakes span{display:block}
.cg-controls{position:absolute;z-index:11}
.cg-controls.ddz{bottom:198px;left:0;right:0;display:flex;gap:14px;justify-content:center}
.cg-controls.texas{right:18px;bottom:16px;width:560px;display:grid;gap:10px}
.cg-controls.texas .cg-action-buttons{display:flex;gap:10px;justify-content:flex-end}
.cg-controls .cg-row{justify-content:center;gap:8px}
.cg-controls.texas .cg-gb,.cg-turn-note .cg-gb{height:52px;padding:0 22px;letter-spacing:.04em;box-shadow:inset 0 2px 0 rgba(255,255,255,.34),inset 0 -3px 0 rgba(0,0,0,.2),0 7px 14px rgba(0,0,0,.42)}
.cg-controls.texas .cg-gb.quiet,.cg-turn-note .cg-gb.quiet{background:color-mix(in srgb,var(--cg-surface) 92%,transparent);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--cg-ink) 24%,transparent),0 7px 14px rgba(0,0,0,.42)}
.cg-raise{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:color-mix(in srgb,var(--cg-surface) 92%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent)}
.cg-raise input[type=range]{width:100%;accent-color:var(--cg-accent)}
.cg-raise-value{font:400 28px/1 var(--cg-display);color:var(--cg-number);min-width:64px;text-align:right}
.cg-raise-quick{grid-column:1/-1;display:flex;gap:8px}
.cg-root .cg-raise-quick button{padding:3px 11px;border:0;border-radius:8px;background:color-mix(in srgb,var(--cg-ink) 10%,transparent);font-size:13px;font-weight:600}
.cg-turn-note{position:absolute;z-index:9;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;color:#fff}
.cg-turn-note.ddz{left:0;right:0;bottom:198px;justify-content:center;text-align:center}
.cg-turn-note.texas{right:18px;bottom:16px;width:560px;justify-content:flex-end;text-align:right}
.cg-turn-status,.cg-turn-note>small{flex-basis:100%;font-size:14px}
.cg-turn-status{font-weight:600;text-shadow:0 2px 6px rgba(0,0,0,.7)}
.cg-lobby{position:absolute;inset:0}
.cg-lobby-host{position:absolute;left:-30px;top:24px;width:760px;pointer-events:none}
.cg-lobby-host .cg-initial{margin-top:86px;width:250px;height:250px;font-size:120px}
.cg-lobby-greeting{top:120px;left:470px}
.cg-lobby-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:14px;padding:14px 22px;z-index:6}
.cg-brand{width:44px;height:44px;border-radius:50%}
.cg-lobby-top h1,.cg-unready h1{font:400 40px/1 var(--cg-display);color:#fff;text-shadow:0 3px 8px rgba(0,0,0,.6)}
.cg-host-label{position:absolute;left:24px;bottom:20px;z-index:6;display:flex;align-items:center;gap:10px;padding:7px 14px 7px 8px;border-radius:12px;background:color-mix(in srgb,var(--cg-surface) 88%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);box-shadow:0 6px 14px rgba(0,0,0,.34);white-space:nowrap}
.cg-host-label b{font-size:16px;font-weight:700}
.cg-host-label small{display:block;color:var(--cg-muted);font-size:12.5px}
.cg-approved-face{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:50%;background-size:236%;background-position:50% 5%;background-color:color-mix(in srgb,var(--cg-accent) 22%,#0c1426);border:2px solid color-mix(in srgb,var(--cg-ink) 34%,transparent)}
.cg-lobby-doors{position:absolute;right:30px;top:88px;width:500px;display:grid;gap:16px;z-index:5}
.cg-resume-list{max-height:160px;overflow:auto;display:grid;gap:6px}
.cg-resume{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:color-mix(in srgb,var(--cg-surface) 92%,transparent);border:1.5px solid var(--cg-accent)}
.cg-resume small{color:var(--cg-muted)}
.cg-resume .cg-gb{height:42px;min-height:42px;min-width:92px;font-size:21px}
.cg-door{position:relative;height:238px;border-radius:18px;overflow:hidden;box-shadow:0 12px 26px rgba(0,0,0,.5);border:2px solid color-mix(in srgb,var(--cg-ink) 22%,transparent);background:#101a30;padding:0;text-align:left}
.cg-door-room{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.62)}
.cg-door-table{position:absolute;left:-90px;top:-34px;width:680px}
.cg-door-portrait{position:absolute;bottom:-182px;width:262px}
.cg-door-portrait.pos0{right:118px}.cg-door-portrait.pos1{right:-34px}
.cg-door-portrait img{width:100%}
.cg-door strong{position:absolute;left:20px;top:14px;font:400 58px/1.05 var(--cg-display);color:#fff;-webkit-text-stroke:5px #0a1228;paint-order:stroke fill}
.cg-door small{position:absolute;left:22px;top:84px;color:#fff;font-weight:600;text-shadow:0 1px 4px #000}
.cg-door-cards{position:absolute;left:22px;bottom:14px;display:flex}
.cg-door-cards .cg-card+.cg-card{margin-left:-30px}
.cg-picker{position:absolute;z-index:15;inset:0;background:var(--cg-bg);color:#f4f6fb}
.cg-picker:before{content:"";position:absolute;inset:0;z-index:2;background:rgba(5,10,24,.56);pointer-events:none}
.cg-picker header{position:absolute;left:26px;right:22px;top:14px;z-index:3;display:flex;justify-content:space-between;align-items:flex-start}
.cg-picker h2,.cg-modal h2,.cg-result h2{font:400 42px/1.1 var(--cg-display)}
.cg-picker header .cg-quiet{position:absolute;left:2px;top:52px;color:#dfe6f3;font-size:15px}
.cg-picker .cg-ib{color:var(--cg-ink)}
.cg-pick-grid{position:absolute;left:24px;top:102px;width:826px;z-index:3;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;max-height:calc(100% - 126px);overflow:auto;padding:3px;margin:-3px;box-sizing:content-box}
.cg-root .cg-character{position:relative;height:226px;overflow:hidden;border-radius:13px;background:color-mix(in srgb,var(--cg-surface) 90%,transparent);border:2px solid color-mix(in srgb,var(--cg-ink) 16%,transparent);padding:0;text-align:left}
.cg-root .cg-character:disabled{opacity:1}
.cg-character img{position:absolute;left:-8%;top:0;width:116%}
.cg-character .cg-initial{margin-top:20px}
.cg-pick-character-label{position:absolute;inset:auto 0 0;padding:18px 9px 7px;background:linear-gradient(180deg,transparent,rgba(4,8,20,.88) 44%);color:#fff}
.cg-pick-character-label b{display:block;font-size:15px}
.cg-pick-character-label small{display:block;font-size:12px;color:#d5deee}
.cg-root .cg-character.chosen{border-color:var(--cg-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--cg-accent) 50%,transparent)}
.cg-pick-number{position:absolute;right:7px;top:7px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--cg-accent);color:var(--cg-on);font-weight:800}
.cg-character.unavailable img{filter:grayscale(.85) brightness(.6)}
.cg-pick-why{position:absolute;left:7px;right:7px;top:9px;padding:3px 7px;border-radius:7px;background:rgba(70,14,22,.86);color:#ffd5d5;font-size:12px;font-weight:600}
.cg-pick-side{position:absolute;right:22px;top:102px;width:386px;z-index:3;display:grid;gap:12px;padding:14px;border-radius:16px;background:color-mix(in srgb,var(--cg-surface) 92%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);color:var(--cg-ink);max-height:calc(100% - 126px);overflow:auto}
.cg-pick-line{display:flex;justify-content:space-between;align-items:center;gap:10px}
.cg-pick-line small{color:var(--cg-muted)}
.cg-pick-side input[type=range]{width:100%;accent-color:var(--cg-accent)}
.cg-pick-buy-in{display:inline-flex;align-items:center;gap:5px}
.cg-pick-buy-in img{width:20px;height:20px}
.cg-root .cg-pick-buy-in input{width:70px;padding:2px 3px;font-weight:700;font-variant-numeric:tabular-nums}
.cg-segments{display:flex;gap:6px}
.cg-root .cg-segments button{flex:1;text-align:center;padding:6px 0;border:0;border-radius:9px;background:color-mix(in srgb,var(--cg-ink) 9%,transparent);font-weight:600;font-variant-numeric:tabular-nums}
.cg-root .cg-segments button.on{background:var(--cg-accent);color:var(--cg-on)}
.cg-pick-seats{display:flex;flex-wrap:wrap;gap:8px}
.cg-warning{color:var(--cg-negative)}
.cg-scrim{position:absolute;z-index:14;inset:0;background:#05081192;border:0;cursor:default!important}
.cg-drawer-scrim{background:transparent}
.cg-pause-scrim{background:rgba(3,7,18,.62)}
.cg-modal{position:absolute;z-index:16;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,90%);max-height:calc(100% - 94px);overflow:auto;padding:24px;display:grid;gap:17px;border:1px solid var(--cg-border);border-radius:19px;background:var(--cg-panel);box-shadow:0 12px 42px #0008}
.cg-modal>header,.cg-modal>footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.cg-modal>footer{justify-content:flex-end}
.cg-modal-content{display:grid;gap:15px}
.cg-overlay-close{display:inline-grid;place-items:center;flex:none;width:28px;height:28px;padding:0;border:0;border-radius:7px;background:transparent;color:inherit;font:600 20px/1 var(--cg-ui)!important}
.cg-overlay-close:hover{background:color-mix(in srgb,currentColor 12%,transparent)}
.cg-chat-drawer,.cg-wallet-drawer{top:62px;right:14px;bottom:14px;left:auto;transform:none;width:330px;max-height:none;display:flex;flex-direction:column;gap:9px;padding:12px;border-radius:15px;background:color-mix(in srgb,var(--cg-surface) 95%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);box-shadow:none;overflow:hidden}
.cg-chat-drawer>header h2,.cg-wallet-drawer>header h2{margin:0;font:400 24px/1.1 var(--cg-display)}
.cg-chat-drawer .cg-modal-content,.cg-wallet-drawer .cg-modal-content{gap:9px;min-height:0;overflow:auto;overscroll-behavior:contain}
.cg-chat-drawer .cg-modal-content{display:flex;flex-direction:column;align-items:stretch}
.cg-chat{display:grid;gap:9px;min-height:0;overflow:auto;overscroll-behavior:contain}
.cg-chat article{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:start;gap:8px;white-space:pre-wrap;overflow-wrap:anywhere}
.cg-chat article .cg-approved-face{width:34px;height:34px}
.cg-chat article p{padding:6px 10px;border-radius:10px;background:color-mix(in srgb,var(--cg-ink) 9%,transparent)}
.cg-chat article.me{grid-template-columns:1fr}
.cg-chat article.me p{justify-self:end;background:var(--cg-accent);color:var(--cg-on)}
.cg-chat-settings{color:var(--cg-muted);font-size:12.5px}
.cg-chat-settings>summary{cursor:pointer}
.cg-chat-settings[open]>*+*{margin-top:6px}
.cg-chat-settings .cg-field{flex-wrap:wrap}
.cg-chat-drawer>footer{margin-top:auto}
.cg-chat-input{display:flex;gap:7px;width:100%}
.cg-chat-input textarea{flex:1;width:auto;height:52px;min-height:52px;padding:9px 11px;border:0;border-radius:10px;background:color-mix(in srgb,var(--cg-ink) 9%,transparent);resize:none}
.cg-chat-input .cg-gb{height:52px;padding:0 22px}
.cg-wallet{margin:0;display:grid;gap:9px}
.cg-wallet>div{position:relative;display:grid;align-content:center;min-height:62px;padding:7px 14px 7px 64px;border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);border-radius:12px;background:color-mix(in srgb,var(--cg-surface) 88%,transparent);box-shadow:0 6px 14px rgba(0,0,0,.34)}
.cg-wallet dt .cg-approved-face{position:absolute;left:8px;top:7px}
.cg-wallet dt strong{font-size:16px}
.cg-wallet dd{margin:0;color:var(--cg-muted);font-size:12.5px}
.cg-pause-sheet,.cg-leave-sheet,.cg-unready{width:520px;display:grid;gap:12px;padding:20px 22px;border-radius:18px;background:var(--cg-surface);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);box-shadow:0 22px 44px rgba(0,0,0,.55)}
.cg-pause-sheet>header h2,.cg-leave-sheet>header h2,.cg-unready h1{margin:0;font:400 34px/1.1 var(--cg-display);color:var(--cg-ink)}
.cg-pause-sheet .cg-quiet,.cg-leave-sheet .cg-quiet,.cg-unready .cg-quiet{font:inherit;color:var(--cg-muted)}
.cg-pause-sheet>footer,.cg-leave-sheet>footer,.cg-unready>footer{display:flex;justify-content:flex-end;gap:10px}
.cg-pause-sheet .cg-gb,.cg-leave-sheet .cg-gb,.cg-unready .cg-gb{height:46px;min-height:46px;padding:0 22px;font-size:22px!important}
.cg-history-entry{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--cg-border);padding:5px 0;gap:8px}
.cg-replay{inset:0;width:auto;max-height:none;transform:none;padding:0;border:0;border-radius:0;background:var(--cg-bg);box-shadow:none;overflow:hidden}
.cg-replay>.cg-stage-background{filter:brightness(.4)}
.cg-replay-panes{position:absolute;inset:18px;display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:16px}
.cg-replay-plays{display:grid;align-content:start;gap:10px;min-width:0;overflow:auto;padding:0 4px 4px 0}
.cg-replay-title,.cg-replay-board{display:flex;align-items:center;gap:12px}
.cg-replay-title h2{font:400 38px/1 var(--cg-display);color:#fff}
.cg-replay-title>span{font-size:12px;padding:1px 7px;border-radius:6px;background:color-mix(in srgb,var(--cg-accent) 26%,transparent);color:var(--cg-ink);font-weight:700}
.cg-replay-board,.cg-replay-board .cg-cards{gap:8px}
.cg-replay-pots{display:flex;flex-wrap:wrap;gap:7px;margin-left:10px}
.cg-replay-pots>span,.cg-replay-history summary{padding:3px 11px;border-radius:9px;background:color-mix(in srgb,var(--cg-surface) 86%,transparent);font-size:14px;font-weight:600}
.cg-replay-hands{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.cg-replay-hands article,.cg-replay-history p{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;padding:8px;border-radius:12px;background:color-mix(in srgb,var(--cg-surface) 88%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);box-shadow:0 6px 14px rgba(0,0,0,.34)}
.cg-replay-hands article>b{font-size:16px}
.cg-replay-hands article>.cg-cards{grid-column:1/-1;gap:4px}
.cg-replay-history{display:grid;grid-template-columns:repeat(4,max-content) minmax(0,1fr);gap:7px}
.cg-replay-history details,.cg-replay-history details[open]::details-content{display:contents}
.cg-replay-history summary{display:block;grid-row:1;cursor:pointer}
.cg-replay-history details[open] summary{color:var(--cg-on);background:var(--cg-accent)}
.cg-replay-history details p{display:block;grid-column:1/-1;padding:9px 12px;font-size:12.5px;line-height:1.7;color:var(--cg-muted)}
.cg-replay-review{display:flex;flex-direction:column;gap:9px;min-width:0;padding:12px;border-radius:15px;background:color-mix(in srgb,var(--cg-surface) 95%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);overflow:auto}
.cg-replay-review-title{display:flex;align-items:center;justify-content:space-between;gap:9px}
.cg-replay-review h3{font:400 24px/1.1 var(--cg-display)}
.cg-replay-review .cg-segments{flex-wrap:wrap}
.cg-root .cg-replay-review .cg-segments button{flex:1 0 22%;min-height:0;padding:6px 0;font:600 15px/1.4 var(--cg-ui)!important}
.cg-replay-response{display:grid;grid-template-columns:34px 1fr;gap:8px}
.cg-replay-response>.cg-face{width:34px;height:34px}
.cg-replay-review .cg-review-text{padding:6px 10px;border-radius:10px;background:color-mix(in srgb,var(--cg-ink) 9%,transparent)}
.cg-replay-review>.cg-row{margin-top:auto;justify-content:flex-end}
.cg-review-text{white-space:pre-wrap;overflow-wrap:anywhere}
.cg-result{position:absolute;inset:0;z-index:12;background:linear-gradient(90deg,rgba(4,10,24,.2) 30%,rgba(4,10,24,.86) 62%)}
.cg-result-hero{position:absolute;left:0;top:18px;width:690px;pointer-events:none}
.cg-result-panel{position:absolute;right:36px;top:64px;width:548px;display:grid;gap:12px}
.cg-result .cg-result-panel h2{margin:0;font:400 72px/1.05 var(--cg-display);color:var(--cg-gold);text-shadow:0 3px 0 rgba(0,0,0,.4)}
.cg-result-lobby{position:absolute;left:16px;top:10px;z-index:13}
.cg-result-line{display:grid;grid-template-columns:46px 1fr auto;align-items:center;gap:12px;padding:8px 14px;border-radius:12px;background:color-mix(in srgb,var(--cg-surface) 86%,transparent)}
.cg-result-line small{color:var(--cg-muted)}
.cg-result-points{font:400 30px/1 var(--cg-display);font-variant-numeric:tabular-nums}
.cg-result-points.won{color:var(--buddy-ok,#5ed3a5)}.cg-result-points.lost{color:var(--buddy-err,#ff8d96)}
.cg-result-buttons{display:flex;gap:10px;justify-content:flex-end}
.cg-note{position:absolute;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:10px;background:rgba(4,10,24,.76);color:#fff;font-weight:600;z-index:8;white-space:nowrap}
.cg-controls.texas.cg-tex-result-actions{width:auto;max-width:700px}
.cg-tex-result-actions .cg-quiet{text-align:right;color:#fff}
.cg-leave-options{display:grid;gap:8px}
.cg-leave-option{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px;padding:8px 10px;border-radius:12px;background:color-mix(in srgb,var(--cg-ink) 8%,transparent);cursor:pointer}
.cg-leave-option:has(input:checked){outline:2px solid var(--cg-accent)}
.cg-leave-option:has(input:focus-visible){outline:3px solid var(--cg-accent);outline-offset:2px}
.cg-leave-option span{color:var(--cg-muted)}
.cg-result-factors{display:flex;flex-wrap:wrap;gap:7px}
.cg-result-factors span{padding:3px 11px;border-radius:9px;background:color-mix(in srgb,var(--cg-surface) 86%,transparent);font-size:14px;font-weight:600}
.cg-result-factors span.cap{color:var(--buddy-err,#ff8d96)}
.cg-result-progress{display:grid;gap:5px;padding:9px 14px;border-radius:12px;background:color-mix(in srgb,var(--cg-surface) 86%,transparent)}
.cg-progress-track{display:flex;gap:6px}
.cg-progress-track i{flex:1;height:9px;border-radius:5px;background:color-mix(in srgb,var(--cg-ink) 16%,transparent)}
.cg-progress-track i.on{background:#ff8fb1}
.cg-error{position:absolute;z-index:20;left:50%;top:77px;transform:translateX(-50%);max-width:calc(100% - 48px);width:max-content;display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:9px 12px 9px 16px;border:1px solid #b8626f;background:#47202a;border-radius:13px;color:#ffe3e3;overflow-wrap:anywhere}
.cg-root[data-game-screen="table"] .cg-error{top:300px}
.cg-error .cg-gb{height:38px;min-height:38px;min-width:76px;padding:0 13px;font-size:19px!important}
.cg-unready{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.cg-host-upgrade{filter:brightness(.42)}
.cg-cut-portrait img{width:100%;filter:drop-shadow(0 8px 14px rgba(0,0,0,.55))}
.cg-cut-portrait.me img{height:290px;width:auto}
.cg-cut-portrait.me{left:262px;top:34px;width:auto}
.cg-cut-in.latin .cg-cut-title{font:400 calc(var(--cut-size,176px)*.82)/1.3 var(--cg-display)}
.cg-cut-band:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,8,20,.7),rgba(3,8,20,.12) 36%,rgba(3,8,20,.2) 72%,rgba(3,8,20,.55))}
.cg-cut-band{position:relative;width:1500px;height:356px;margin-left:-110px;transform:skewY(-4deg);background:#071a3f center/cover;box-shadow:0 0 0 3px var(--cg-gold),0 22px 40px rgba(0,0,0,.55);overflow:hidden;animation:cg-band .46s cubic-bezier(.16,1,.3,1) both}
.cg-cut-portrait{position:absolute;left:118px;top:-16px;width:600px;transform:skewY(4deg);z-index:2}
.cg-cut-title{position:absolute;left:700px;top:calc(50% - 118px);transform:skewY(4deg);font:400 var(--cut-size,176px)/1.15 var(--cg-brush);color:#fff;-webkit-text-stroke:7px #0a1228;paint-order:stroke fill;text-shadow:0 7px 0 rgba(0,0,0,.3);white-space:nowrap;z-index:3}
.cg-cut-cards{position:absolute;left:706px;bottom:18px;display:flex;gap:7px;transform:skewY(4deg);z-index:3}
.cg-cut-name{position:absolute;left:180px;bottom:20px;transform:skewY(4deg);padding:3px 16px;border-radius:9px;background:rgba(4,10,24,.8);color:#fff;font:700 21px var(--cg-ui);z-index:3}
.cg-modal.cg-topup-sheet{width:520px;left:50%;top:50%;right:auto;bottom:auto;transform:translate(-50%,-50%);gap:12px;padding:20px 22px;border-radius:18px;background:var(--cg-surface);box-shadow:0 22px 44px rgba(0,0,0,.55)}
.cg-topup-sheet h2{font:400 34px/1.1 var(--cg-display)}
.cg-topup-sheet .cg-gb{height:46px;font-size:22px}
.cg-topup-sheet input[type=range]{width:100%;accent-color:var(--cg-accent)}
.cg-topup-preview{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0;padding:7px 14px 7px 8px;border-radius:12px;background:color-mix(in srgb,var(--cg-surface) 88%,transparent);border:1px solid color-mix(in srgb,var(--cg-ink) 18%,transparent);box-shadow:0 6px 14px rgba(0,0,0,.34)}
.cg-cut-in{position:absolute;inset:0;z-index:21;display:grid;place-items:center;background:rgba(2,6,16,.46);pointer-events:none;overflow:hidden}
.cg-cut-cards .cg-cards{gap:7px}
.cg-cut-multiplier{position:absolute;right:190px;top:30px;transform:skewY(4deg);font:400 66px/1 var(--cg-display);color:var(--cg-gold);-webkit-text-stroke:4px #0a1228;paint-order:stroke fill;z-index:4}
.cg-particles{position:absolute;z-index:2;inset:0;pointer-events:none}
.cg-particle{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);animation:cg-particle .57s var(--dl) both}
.cg-particle.petal{background:#ffc0e0;border-radius:75% 20%;box-shadow:0 0 10px #ffd0ed}
.cg-particle.snow{background:#e1f7ff;border-radius:50%;width:calc(var(--s)*.28);height:calc(var(--s)*.28);box-shadow:0 0 11px #8ecbff}
.cg-particle.trail,.cg-particle.comet{height:6px;width:calc(var(--s)*15);border-radius:50%;background:linear-gradient(90deg,transparent,#fff4ab);box-shadow:0 0 14px #ff950f}
.cg-particle.comet{left:0;top:28%;height:15px;width:75%;--r:-12deg}
.cg-particle.comet:nth-child(2){left:12%;top:61%;--r:13deg;background:linear-gradient(90deg,transparent,#7fd3ff)}
.cg-particle.shock{background:#fff3ad;clip-path:polygon(50% 0,62% 36%,100% 50%,64% 60%,50% 100%,39% 63%,0 50%,37% 38%)}
.cg-particle.shock:nth-child(-n+2){left:55%;top:45%;width:180px;height:180px;border:5px solid #ffe082;border-radius:50%;clip-path:none;background:transparent;animation:cg-shock .6s var(--dl) both}
.cg-particle.rays{width:770px;height:770px;left:48%;top:-65%;background:repeating-conic-gradient(#ffe3a681 0deg 8deg,transparent 8deg 29deg);border-radius:50%;animation:cg-rays .94s both}
.cg-particle.bolt{left:68%;top:0;width:130px;height:98%;background:#fff5b8;clip-path:polygon(53% 0,91% 0,56% 39%,87% 39%,17% 100%,43% 55%,10% 55%);box-shadow:0 0 13px #f9f2b0;animation:cg-bolt .8s both}
.cg-particle.pillars,.cg-particle.beams{height:120%;top:-10%;width:35px;filter:blur(4px);background:#ffebad;box-shadow:0 0 24px #ffd18e}
.cg-particle.pillars:nth-child(1),.cg-particle.beams:nth-child(1){left:38%}.cg-particle.pillars:nth-child(2),.cg-particle.beams:nth-child(2){left:53%}.cg-particle.pillars:nth-child(3),.cg-particle.beams:nth-child(3){left:68%}.cg-particle.pillars:nth-child(4){left:83%}
.cg-particle.beams{width:80px;transform:rotate(var(--r));background:#ffcde8}
.cg-particle.suit{color:#ffbfda;font-size:var(--s);text-shadow:0 0 8px #fff}
.cg-lite-effect{position:absolute;left:50%;top:calc(300px + var(--dy,0px));transform:translateX(-50%) skewX(-8deg);padding:4px 34px;background:color-mix(in srgb,var(--char-accent,#5b9bff) 88%,#000);box-shadow:0 0 0 2px var(--cg-gold),0 8px 16px rgba(0,0,0,.45);z-index:21;font:400 54px/1.2 var(--cg-brush);color:#fff;-webkit-text-stroke:3px #0a1228;paint-order:stroke fill;white-space:nowrap;pointer-events:none;animation:cg-lite .9s cubic-bezier(.16,1,.3,1) both}
.cg-lite-effect.latin{font:400 44px/1.3 var(--cg-display)}
@keyframes cg-band{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0)}}
@keyframes cg-particle{0%{opacity:0;transform:translate(-85px,-16px) rotate(var(--r)) scale(.7)}25%{opacity:1}100%{opacity:0;transform:translate(65px,49px) rotate(calc(var(--r) + 80deg)) scale(1.3)}}
@keyframes cg-shock{from{opacity:1;transform:scale(.4)}to{opacity:0;transform:scale(4)}}
@keyframes cg-rays{from{opacity:.25;transform:rotate(0deg)}to{opacity:.8;transform:rotate(60deg)}}
@keyframes cg-bolt{0%,38%,68%,100%{opacity:0}20%,55%,80%{opacity:1}}
@keyframes cg-lite{0%,100%{opacity:0}12%,80%{opacity:1}}
@media(prefers-reduced-motion:reduce){.cg-root *,.cg-root *::after{animation:none!important;transition:none!important}.cg-root .cg-particles{display:none}.cg-root .cg-board-reveal.reduced .cg-board-face{animation:cg-board-fade var(--reveal-duration) var(--reveal-delay) both!important}}
@media(prefers-reduced-motion:reduce){
 .cg-root .cg-deal{animation:cg-board-fade 120ms both!important}
 .cg-root .cg-deal-bottom{opacity:1}
 .cg-root .cg-ddz-deal,.cg-root .cg-ddz-reveal-back{display:none}
 .cg-root .cg-ddz-reveal-face{transform:none}
}
`;

