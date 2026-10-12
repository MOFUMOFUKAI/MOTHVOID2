/* Canvas-only presentation. Animation transforms never affect the hitbox. */
(function(root){'use strict';const C=root.MVConfig;
class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images={};this.loaded=Promise.all(C.moths.map(m=>new Promise(resolve=>{const im=new Image();im.onload=()=>{this.images[m.id+'Atlas']=im;resolve();};im.onerror=()=>resolve();im.src=m.asset+'?v='+C.version+(m.id==='oomizuao'?'&art=tarot-clean-v2':m.id==='yamamayu'||m.id==='yonagunisan'?'&art=tarot-v1':'');})));this.loaded=Promise.all([this.loaded,new Promise(resolve=>{const im=new Image();im.onload=()=>{this.images.Standard_A=im;resolve();};im.onerror=()=>resolve();im.src='assets/enemies/standard-a-animation.png?v='+C.version;})]);this.loaded=Promise.all([this.loaded,...[['Feeble_A','feeble-a-idle-8.png'],['Feeble_B','feeble-b-idle-8.png'],['Standard_B','standard-b-animation.png'],['Boss_A_idle','boss-a-idle-16.png'],['Boss_A_strong','boss-a-strong-attack-8.png'],['Boss_A_upper','boss-a-upper-right-8.png'],['Boss_A_lower','boss-a-lower-right-8.png'],['Boss_B_idle','boss-b-idle-8.png'],['Tough_A','tough-a-idle-8.png'],['Tough_B','tough-b-idle-8.png'],['Powerful_A','powerful-a-idle-8.png'],['Powerful_B','powerful-b-idle-8.png'],['Boss_C','boss-c-idle-8.png'],['Mild_A','mild-a-idle-8.png'],['Mild_B','mild-b-idle-8.png']].map(([key,file])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{this.images[key]=im;resolve();};im.onerror=()=>resolve();im.src='assets/enemies/'+file+'?v='+C.version;}))]);this.loaded=Promise.all([this.loaded,...['meteor-atlas','rock-small','rock-medium','enemy-feeble-mild','enemy-standard-tough','enemy-powerful'].map(key=>new Promise(resolve=>{const im=new Image();im.onload=()=>{this.images[key]=im;resolve();};im.onerror=()=>resolve();im.src='assets/effects/'+key+'.png?v='+C.version+(C.explosionFrames[key]?'&fx=tarot-rock2':'');}))]);this.celestialBackground=root.MVCelestialBackground(this.ctx);this.loaded=this.loaded.then(()=>this.prepareExplosionFrames());}
 prepareExplosionFrames(){for(const key of Object.keys(C.explosionFrames)){const im=this.images[key];if(!im)continue;let sizes;if(key.startsWith('rock-'))sizes=[key==='rock-small'?84:108];else{const types=Object.entries(C.enemies).filter(([type])=>key==='enemy-powerful'?type.startsWith('Powerful'):key==='enemy-standard-tough'?/^(Standard|Tough)_/.test(type):/^(Feeble|Mild)_/.test(type));sizes=new Set(types.map(([,e])=>Math.max(120,e.size*1.8)));}for(const size of sizes)for(let f=0;f<8;f++)this.drawEnemyFrame(im,f%4*im.width/4,Math.floor(f/4)*im.height/2,im.width/4,im.height/2,-1000,-1000,size,size);}}
 drawBackdrop(g){this.celestialBackground.draw(g.time,g.stage,g.wave);}
 drawEnemyFrame(im,sx,sy,sw,sh,dx,dy,dw,dh,tint='normal',resolutionStep=1){
  if(typeof document==='undefined'){this.ctx.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);return;}
  // Cache cropped frames at display resolution; avoid per-draw canvas filters.
  this.enemyFrameCache ||= new WeakMap();let frames=this.enemyFrameCache.get(im);
  if(!frames){frames=new Map();this.enemyFrameCache.set(im,frames);}
  const width=Math.ceil(dw/resolutionStep)*resolutionStep,height=Math.ceil(dh/resolutionStep)*resolutionStep,key=[sx,sy,sw,sh,width,height,tint].join(':');let frame=frames.get(key);
  if(!frame){frame=document.createElement('canvas');frame.width=width;frame.height=height;const ctx=frame.getContext('2d');ctx.imageSmoothingEnabled=this.ctx.imageSmoothingEnabled;ctx.drawImage(im,sx,sy,sw,sh,0,0,width,height);
   if(tint!=='normal'){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=tint==='bright'?.48:.72;ctx.fillStyle=tint==='bright'?'#ffffff':'#ff244e';ctx.fillRect(0,0,width,height);}
   frames.set(key,frame);
  }this.ctx.drawImage(frame,dx,dy,dw,dh);
 }

 mildFrame(e){const since=e.age-(e.lastSpitAt??-Infinity);if(since<.22)return 7;if(e.pendingShots?.length){const delay=Math.min(...e.pendingShots.map(s=>s.delay));return delay>.30?4:delay>.15?5:6;}if(since<.40)return 6;if(since<.58)return 5;if(since<.72)return 4;return [0,1,2,3,2,1][Math.floor(e.age/.18)%6];}
 mildEnemy(e){const c=this.ctx,im=this.images[e.type],w=im.width/4,h=im.height/2,f=this.mildFrame(e),size=e.size*1.2;c.save();c.translate(e.x,e.y);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.globalAlpha=e.inv?.35:1;this.drawEnemyFrame(im,f%4*w,Math.floor(f/4)*h,w,h,-size/2,-size/2,size,size,e.flash>0?'bright':'normal');if(e.hp<e.maxHp){c.globalAlpha=1;c.fillStyle='#151a31';c.fillRect(-e.size*.42,e.size*.49,e.size*.84,3);c.fillStyle='#dd9dbd';c.fillRect(-e.size*.42,e.size*.49,e.size*.84*e.hp/e.maxHp,3);}c.restore();}
 rock(o,time){const im=this.images['meteor-atlas'];if(!im)return false;const row=o.tier===2?4:2,col=Math.floor(time*.6/.2)%8,size=(o.r+3)*3;this.drawEnemyFrame(im,col*128,row*128,128,128,o.x-size/2,o.y-size/2,size,size,'normal',4);return true;}
 background(a,b){const c=document.createElement('canvas');c.width=240;c.height=360;const x=c.getContext('2d');x.fillStyle='#080d1e';x.fillRect(0,0,240,360);for(const [cx,cy,color]of[[50,160,a],[185,240,b],[160,40,a]]){const g=x.createRadialGradient(cx,cy,0,cx,cy,160);g.addColorStop(0,color+'a0');g.addColorStop(1,'#080d1e00');x.fillStyle=g;x.fillRect(0,0,240,360);}return c;}
 text(t,x,y,size=12,color='#d9e5fc',align='left'){const c=this.ctx;c.fillStyle=color;c.font=`600 ${Math.max(10,size)}px Consolas, monospace`;c.textAlign=align;c.fillText(t,x,y);}
 mothFrame(time,move,parry,parryDuration){const elapsed=Math.max(0,parryDuration-parry);if(parry>0&&elapsed<.24)return {row:3,col:Math.min(3,Math.floor((elapsed+1e-9)/.06))};return {row:move<0?1:move>0?2:0,col:[0,1,2,3,2,1][Math.floor(time/.1)%6]};}
 moth(ctx,id,x,y,size,time,move=0,parry=0,parryDuration=.38){size*=C.moths.find(m=>m.id===id)?.displayScale??1;const atlas=this.images[id+'Atlas'];if(atlas){const {row,col}=this.mothFrame(time,id==='yonagunisan'?-move:move,parry,parryDuration),cw=atlas.width/4,ch=atlas.height/4;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,col*cw,row*ch,cw,ch,Math.round(x)-size/2,Math.round(y)-size/2,size,size);ctx.restore();return;}const im=this.images[id];ctx.save();ctx.translate(Math.round(x),Math.round(y));let flap=.83+.17*Math.sin(time*12);if(parry>0){const p=1-Math.min(1,parry/.38),spin=Math.min(1,Math.max(0,parryDuration-parry)/.24);if(id==='yamamayu')ctx.rotate(-spin*Math.PI*2);else if(id==='oomizuao')ctx.scale(1,Math.cos(spin*Math.PI*2));else flap=p<.4?.22+.12*p:1.12;}ctx.rotate(move*.12);ctx.translate(move*4,0);ctx.imageSmoothingEnabled=false;
  if(!im){ctx.fillStyle=id==='yamamayu'?'#ffcd55':id==='oomizuao'?'#a4e8d4':'#c85c3e';ctx.fillRect(-size*.4,-size*.2,size*.8,size*.4);ctx.restore();return;}
  // Native alpha is retained; crop empty margins without altering source assets.
  const crop=id==='yamamayu'?[150,190,1240,660]:id==='yonagunisan'?[0,245,1254,710]:[0,195,1254,900];
  const [sx,sy,sw,sh]=crop;const h=size*sh/sw;
  // Split wing halves with a fixed central body: asymmetric bank and cyclic flap.
  for(const side of[-1,1]){ctx.save();ctx.transform(flap*(1-side*move*.13),side*move*.09,0,1,-move*size*.035,0);if(side<0)ctx.drawImage(im,sx,sy,sw/2,sh,-size/2,-h/2,size/2,h);else ctx.drawImage(im,sx+sw/2,sy,sw/2,sh,0,-h/2,size/2,h);ctx.restore();}
  ctx.drawImage(im,sx+sw*.46,sy,sw*.08,sh,-size*.04,-h/2,size*.08,h);ctx.restore();
 }
 standardFrame(e){
  if(e.pendingShots?.length){const remaining=Math.min(...e.pendingShots.map(s=>s.delay));return remaining>C.tuning.attackWarning*.55?4:5;}
  const elapsed=e.age-(e.lastSpitAt??-Infinity);if(elapsed<.12)return 6;if(elapsed<.26)return 7;
  return Number.isFinite(elapsed)?[3,2,1,0,1,2][Math.floor((elapsed-.26)/.16)%6]:[0,1,2,3,2,1][Math.floor(e.age/.16)%6];
 }
 standardEnemy(e,time){const c=this.ctx,im=this.images[e.type],frame=this.standardFrame(e),cw=im.width/4,ch=im.height/2,sy=frame<4?0:ch;c.save();c.translate(Math.round(e.x),Math.round(e.y));c.globalAlpha=e.inv?.35:1;c.imageSmoothingEnabled=false;
  // Fixed cell registration keeps the body steady between poses; transparent alpha retained.
  const tint=e.flash>0?'bright':e.pendingShots?.length&&Math.sin(e.age*32)>0?'red':'normal';
  this.drawEnemyFrame(im,(frame%4)*cw,sy,cw,ch,-e.size/2,-e.size/2,e.size,e.size*ch/cw,tint);
  if(e.hp<e.maxHp){c.globalAlpha=1;c.fillStyle='#151a31';c.fillRect(-e.size*.42,e.size*.49,e.size*.84,3);c.fillStyle='#dd9dbd';c.fillRect(-e.size*.42,e.size*.49,e.size*.84*e.hp/e.maxHp,3);}c.restore();
 }
 bossPose(e){
  const pending=e.pendingShots||[],strong=pending.find(s=>s.tier===4),since=e.age-(e.lastSpitAt??-Infinity);
  if(strong)return {sheet:'strong',frame:4};
  if(e.phase==='charge'){const elapsed=2-e.timer;return {sheet:'strong',frame:elapsed<.18?0:elapsed<.36?1:elapsed<.54?2:elapsed<1.1?3:4};}
  if(since<.44&&e.lastShotTier===4)return {sheet:'strong',frame:since<.12?5:since<.24?6:7};
  if(pending.length){const shot=pending[0],arm=shot.arm??0;return {sheet:arm>=2?'lower':'upper',frame:Math.min(4,Math.max(0,Math.floor((1-shot.delay/C.tuning.attackWarning)*5))),flip:arm%2===1};}
  if(since<.44&&e.lastShotTier!==4){const arm=e.lastArm??0;return {sheet:arm>=2?'lower':'upper',frame:since<.12?5:since<.24?6:7,flip:arm%2===1};}
  const cycle=e.age%(13*.28+3*.065);return {sheet:'idle',frame:cycle<13*.28?Math.floor(cycle/.28):13+Math.min(2,Math.floor((cycle-13*.28)/.065))};
 }
 bossEnemy(e,time){
  const pose=e.type==='Boss_B'?{sheet:'idle',frame:Math.floor(e.age/.32)%8}:this.bossPose(e),im=this.images[e.type+'_'+pose.sheet];if(!im)return;
  const c=this.ctx,rows=e.type==='Boss_A'&&pose.sheet==='idle'?4:2,w=im.width/4,h=im.height/rows,size=e.size*C.bossAnimation.scale;
  c.save();c.translate(e.x,e.y);if(pose.flip)c.scale(-1,1);
  c.globalAlpha=e.phase==='enter'?Math.max(0,Math.min(1,(e.y+e.size/2)/(e.targetY+e.size/2))):e.inv?.35:1;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const tint=e.flash>0?'bright':'normal';
  if(e.type==='Boss_B'&&(e.warpRequested||(e.phase==='hold'&&e.timer<=.6)))c.globalAlpha=Math.floor(e.age/.075)%2?.18:1;
  this.drawEnemyFrame(im,pose.frame%4*w,Math.floor(pose.frame/4)*h,w,h,-size/2,-size/2,size,size,tint);
  c.restore();
 }
 celestialFrame(e){
  if(e.type.startsWith('Tough_'))return Math.floor(e.age/.28)%8;
  const since=e.age-(e.lastSpitAt??-Infinity),pending=e.pendingShots||[];
  if(e.type.startsWith('Feeble_')){if(since<.6)return since<.18?6:since<.42?7:6;if(pending.length)return 6;return [0,1,2,1,0,3,4,5,4,3][Math.floor(e.age/.18)%10];}
  if(since<.36){if(e.type==='Powerful_A')return since<.13?5:since<.26?6:7;return since<.12?6:7;}
  if(pending.length){if(e.type==='Powerful_A')return 4;if(e.type==='Powerful_B')return 5;return Math.min(...pending.map(s=>s.delay))>C.tuning.attackWarning/2?4:5;}
  if(e.type==='Powerful_B'){const cycle=e.age%1.7;return cycle<1.4?Math.floor(cycle/.28):cycle<1.48?5:7;}
  return Math.floor(e.age/(e.type==='Boss_C'?.24:.28))%4;
 }
 celestialEnemy(e){
  const c=this.ctx,im=this.images[e.type],f=this.celestialFrame(e),w=im.width/4,h=im.height/2,size=e.size*C.enemyAtlases[e.type].scale;
  c.save();c.translate(e.x,e.y);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  // The attack afterimage stays at the departure point during the existing warp.
  c.globalAlpha=e.phase==='warp'?Math.max(0,1-(e.age-e.lastSpitAt)/.36):e.inv?.35:1;
  if(e.boss&&e.phase==='enter')c.globalAlpha=Math.max(0,Math.min(1,(e.y+e.size/2)/(e.targetY+e.size/2)));
  const tint=e.flash>0?'bright':(e.type.startsWith('Tough_')||e.type.startsWith('Powerful_'))&&e.pendingShots?.length&&Math.sin(e.age*32)>0?'red':'normal';
  this.drawEnemyFrame(im,f%4*w,Math.floor(f/4)*h,w,h,-size/2,-size/2,size,size,tint);
  if(!e.boss&&e.hp<e.maxHp){c.globalAlpha=1;c.fillStyle='#151a31';c.fillRect(-e.size*.42,e.size*.49,e.size*.84,3);c.fillStyle='#dd9dbd';c.fillRect(-e.size*.42,e.size*.49,e.size*.84*e.hp/e.maxHp,3);}c.restore();
 }
 chargeOrbs(g){const c=this.ctx,count=g.maxStocks,spacing=Math.min(22,130/Math.max(1,count-1)),start=240-(count-1)*spacing/2;
  c.save();for(let i=0;i<count;i++){const x=start+i*spacing,y=704,lit=i<g.stocks,r=5.5;const fill=c.createRadialGradient(x-1.5,y-2,.3,x,y,r);fill.addColorStop(0,lit?'#ffffed':'#354057');fill.addColorStop(.45,lit?'#ffeaa0':'#232c40');fill.addColorStop(1,lit?'#d6993f':'#111827');c.fillStyle=fill;c.shadowColor=lit?'#ffd879':'transparent';c.shadowBlur=lit?10:0;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle=lit?'#fff0b7':'#45506a';c.lineWidth=.8;c.stroke();}c.restore();
 }
 grapeAlpha(remaining){if(remaining<=0)return 0;if(remaining>=3)return 1;const t=3-remaining,phase=2*t+4*t*t/3;return Math.sin(phase*Math.PI*2)>=0?1:.12;}
 enemy(e,time){const c=this.ctx;if(e.dead)return;if(e.phase==='warp'){if(e.type==='Boss_C'&&e.age-(e.lastSpitAt??-Infinity)<.36&&this.images.Boss_C)this.celestialEnemy(e);return;}if(e.type.startsWith('Mild_')&&this.images[e.type]){this.mildEnemy(e);return;}if(this.images[e.type]&&C.enemyAtlases[e.type]){this.celestialEnemy(e);return;}if(e.type.startsWith('Standard_')&&this.images[e.type]){this.standardEnemy(e,time);return;}if((e.type==='Boss_A'||e.type==='Boss_B')&&this.images[e.type+'_idle']){this.bossEnemy(e,time);return;}c.save();c.translate(Math.round(e.x),Math.round(e.y));let alpha=e.inv?.35:1;if(e.boss&&e.phase==='enter')alpha=Math.max(0,Math.min(1,(e.y+e.size/2)/(e.targetY+e.size/2)));c.globalAlpha=alpha;const s=e.size*.42,boss=e.boss;const palette=e.type.endsWith('B')?['#3c7d83','#79c7b2','#143646']:e.type==='Boss_C'?['#894c83','#db8aba','#321c46']:['#68528e','#b29acd','#272446'];
  const warning=e.pendingShots?.length>0;if(warning&&Math.sin(e.age*32)>0){palette[0]='#e94b63';palette[1]='#ff9ca7';palette[2]='#681b36';}
  c.fillStyle=palette[0];const limbs=boss?8:e.type.startsWith('Tough')?6:4;
  for(let i=0;i<limbs;i++){const a=i/limbs*Math.PI*2;for(let k=1;k<5;k++){const d=s*(.5+k*.13),angle=a+Math.sin(time*2+i+k*.5)*.23;c.fillStyle=k%2?palette[0]:palette[1];const q=Math.max(3,s*.15*(1-k*.1));c.fillRect(Math.round(Math.cos(angle)*d/3)*3-q/2,Math.round(Math.sin(angle)*d/3)*3-q/2,q,q);}}
  c.fillStyle=e.flash>0?'#fff4d6':palette[0];c.beginPath();for(let i=0;i<12;i++){const a=i/12*6.283,r=s*(i%2?.64:.72);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.fillStyle=palette[2];c.fillRect(-s*.44,-s*.22,s*.88,s*.44);c.fillStyle='#f7cc8a';c.fillRect(-s*.31,-s*.15,s*.62,s*.3);c.fillStyle='#ff7764';c.fillRect(-s*.13,-s*.2,s*.26,s*.4);c.fillStyle='#171326';c.fillRect(-s*.07,-s*.18,s*.14,s*.36);c.fillStyle='#fff5c1';c.fillRect(-s*.16,-s*.12,Math.max(2,s*.09),Math.max(2,s*.09));
  if(!boss&&e.hp<e.maxHp){c.globalAlpha=1;c.fillStyle='#151a31';c.fillRect(-s,e.size*.49,s*2,3);c.fillStyle='#dd9dbd';c.fillRect(-s,e.size*.49,s*2*e.hp/e.maxHp,3);}c.restore();}
 chargeIndicator(e){if(e.dead||e.type!=='Mild_B'||!['hold','firing'].includes(e.phase))return;const c=this.ctx,w=e.size*.8,p=e.phase==='firing'?1:Math.max(0,Math.min(1,1-e.timer/3));c.save();c.fillStyle='#361724';c.fillRect(e.x-w/2,e.y+e.size*.52,w,5);c.globalAlpha=.5+.5*Math.abs(Math.sin(e.age*12));c.fillStyle='#ff455c';c.fillRect(e.x-w/2,e.y+e.size*.52,w*p,5);c.restore();}
 render(g,wall){const c=this.ctx;c.globalAlpha=1;if(g.mode==='title'){this.celestialBackground.draw(wall,0,0);return;}this.drawBackdrop(g);
  const enemies=g.enemies.slice().sort((a,b)=>Number(b.boss||false)-Number(a.boss||false));for(const e of enemies){this.enemy(e,g.time);this.chargeIndicator(e);}
  for(const o of g.obstacles){if(this.rock(o,g.time+o.angle))continue;c.save();c.translate(o.x,o.y);c.scale(1,.6+.4*Math.cos((g.time+o.angle)*.6/.2*Math.PI/4));c.fillStyle=o.tier===2?'#776b68':'#4b5269';c.beginPath();for(let i=0;i<7;i++){const a=i/7*6.283; c.lineTo(Math.cos(a)*o.r*(i%2?.75:1),Math.sin(a)*o.r);}c.fill();if(o.tier===2){c.strokeStyle='#d5b184';c.lineWidth=2;c.stroke();}c.fillStyle=o.tier===2?'#d5b184':'#82869a';c.fillRect(-o.r*.4,-o.r*.45,o.r*.65,4);c.restore();}
  for(const p of g.bullets){if(p.dead||p.age<0)continue;if(p.moon){root.MVFruitIcon(c,"moonfruit",p.x,p.y,p.r*2,wall,p.angle);continue;}if(p.rock&&this.rock(p,g.time))continue;const rainbow=p.just||p.charged,col=rainbow?`hsl(${(wall*240+p.id*29)%360} 95% 74%)`:p.owner==='enemy'?'#ff3548':p.bomb?'#a8cbff':p.fire?'#ffc66d':'#b9efaf';if(p.owner==='enemy'){c.fillStyle=col;c.globalAlpha=.3;c.beginPath();c.arc(p.x,p.y,p.r+3,0,Math.PI*2);c.fill();c.globalAlpha=1;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fill();c.fillStyle='#ffd0d4';c.beginPath();c.arc(p.x-p.r*.2,p.y-p.r*.2,p.r*.35,0,Math.PI*2);c.fill();continue;}c.fillStyle=col;c.globalAlpha=.3;c.fillRect(p.x-p.r-3,p.y-p.r-3,p.r*2+6,p.r*2+6);c.globalAlpha=1;c.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);if(p.rock){c.save();c.translate(p.x,p.y);c.scale(1,.6+.4*Math.cos(g.time*.6/.2*Math.PI/4));c.fillStyle=col;c.beginPath();for(let k=0;k<7;k++){const a=k*Math.PI*2/7;c.lineTo(Math.cos(a)*(p.r+3),Math.sin(a)*(p.r+3));}c.fill();c.restore();}c.fillStyle=p.owner==='enemy'?'#ffd0d4':'#fffce0';c.fillRect(p.x-p.r*.4,p.y-p.r*.4,p.r*.8,p.r*.8);}
  for(const i of g.items){if(i.type==="starfruit"||i.type==="moonfruit"){root.MVFruitIcon(c,i.type,i.x,i.y,26,wall);continue;}const colors={heart:'#e7a1b3',gold:'#ffda70',lemon:'#fff17b',grape:'#bb8bf5',strawberry:'#ff6588'};c.save();c.translate(i.x,i.y);c.scale(1.2,1.2);c.fillStyle=colors[i.type];if(i.type==='rainbow'){c.scale(2,2);const glow=c.createLinearGradient(-9,-5,9,10);for(let k=0;k<7;k++)glow.addColorStop(k/6,`hsl(${(k*60+wall*100)%360} 100% 65%)`);c.fillStyle=glow;c.shadowColor=`hsl(${wall*100%360} 100% 70%)`;c.shadowBlur=12;}if(i.type==='heart'||i.type==='gold'||i.type==='rainbow'){c.fillRect(-8,-4,6,6);c.fillRect(2,-4,6,6);c.beginPath();c.moveTo(-8,1);c.lineTo(8,1);c.lineTo(0,9);c.fill();}else if(i.type==='grape'){for(const [x,y]of[[-4,-4],[4,-4],[0,3],[-3,1],[0,8]])c.fillRect(x-3,y-3,6,6);}else{c.fillRect(-6,-4,12,12);c.fillStyle='#9cde7d';c.fillRect(-2,-8,5,4);}c.restore();}
  if(g.current.alive){const info=C.moths[g.active];if(g.demo||g.justFlash>0||g.inv<=0||Math.floor(g.time*14)%2===0||g.mode==='title'){this.moth(c,info.id,g.x,C.playerY,info.size,g.time,g.vx?Math.sign(g.vx):0,g.parryAnim,g.parryCharged?.48:.38);}
   if(g.justFlash>0&&g.justOwner===info.id){const strength=g.justFlash/C.tuning.justFlashDuration;c.save();c.globalAlpha=strength;c.globalCompositeOperation='lighter';this.moth(c,info.id,g.x,C.playerY,info.size,g.time,g.vx?Math.sign(g.vx):0,g.parryAnim,g.parryCharged?.48:.38);c.restore();c.save();c.globalAlpha=strength;for(let i=0;i<8;i++){const a=i*Math.PI/4+g.time*2,r=25+(1-strength)*42;c.fillStyle=`hsl(${i*45} 100% 80%)`;c.fillRect(g.x+Math.cos(a)*r-2,C.playerY+Math.sin(a)*r-2,5,5);}this.text('JUST PARRY!',g.x,C.playerY-65,16,'#efffff','center');c.restore();}
   c.fillStyle='#fffce0';c.fillRect(g.x-2,C.playerY-2,4,4);
   if(g.parry>0){c.lineWidth=g.parryCharged?4:2;c.strokeStyle=g.parryCharged?`hsl(${wall*240%360} 90% 72%)`:'#ffe68a';c.beginPath();c.arc(g.x,C.playerY,g.radius,0,Math.PI*2);c.stroke();c.globalAlpha=.3;c.beginPath();c.arc(g.x,C.playerY,g.justRadius,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
   if(g.held&&g.hold>=g.chargeDelay&&g.stocks>0){const p=Math.min(1,(g.hold-g.chargeDelay)/g.chargeDuration);c.strokeStyle=g.chargeReady?'#ffffaf':'#83dcd8';c.lineWidth=4;c.beginPath();c.arc(g.x,C.playerY,42,-Math.PI/2,-Math.PI/2+p*Math.PI*2);c.stroke();this.text(g.chargeReady?'RELEASE!':'CHARGE',g.x,C.playerY-47,10,'#f7e7af','center');}
  }
  for(const f of g.effects){if(f.kind==='sprite-burst'){const im=this.images[f.key];if(im){const timing=C.explosionFrames[f.key];let col=0,elapsed=Math.max(0,f.max-f.life);if(timing){while(col<7&&elapsed>=timing[col])elapsed-=timing[col++];}else col=Math.min(7,Math.floor(elapsed/.08));const columns=timing?4:8,cell=im.width/columns,height=timing?im.height/2:im.height;c.save();c.globalAlpha=timing?(col===7?Math.max(0,1-elapsed/timing[7]):1):Math.min(1,f.life/.16);c.translate(f.x,f.y);c.rotate(f.angle||0);this.drawEnemyFrame(im,(col%columns)*cell,timing?Math.floor(col/columns)*height:0,cell,height,-f.size/2,-f.size/2,f.size,f.size);c.restore();}continue;}if(f.kind==='reward'){c.save();c.globalAlpha=Math.min(1,f.life/.3);c.shadowColor='#000';c.shadowBlur=3;const x=Math.max(65,Math.min(415,f.x)),y=Math.max(105,f.y-12-(1-f.life/f.max)*28);if(f.score>0)this.text('+'+f.score,x,y,12,'#ffe191','center');if(f.xp>0)this.text('EXP +'+f.xp,x,y+(f.score>0?15:0),12,'#a7edff','center');c.restore();continue;}if(f.kind==='dodge-trail'){c.save();c.globalAlpha=.4*f.life/f.max;this.moth(c,f.moth,f.x,f.y,f.size,f.time);c.restore();continue;}const p=1-f.life/f.max;c.globalAlpha=1-p;c.strokeStyle=f.color;c.lineWidth=3;c.beginPath();c.arc(f.x,f.y,f.r*p,0,Math.PI*2);c.stroke();for(let k=0;k<8;k++){const a=k*Math.PI/4;c.fillStyle=f.color;c.fillRect(f.x+Math.cos(a)*f.r*p-2,f.y+Math.sin(a)*f.r*p-2,4,4);}c.globalAlpha=1;}

  if(g.parryRecovery>0)this.text('RECOVER',g.x,640,10,'#d998a8','center');
  this.hud(g);if(g.grape>0){c.save();c.globalAlpha=this.grapeAlpha(g.grape);for(const [x,y]of[[g.x,C.playerY],[90,675],[390,675]])for(let i=0;i<3;i++){const a=g.time*3+i*2.094;c.fillStyle='#c49bff';c.beginPath();c.arc(x+Math.cos(a)*34,y+Math.sin(a)*18,3,0,Math.PI*2);c.fill();}c.restore();}if(g.reviveBannerTime>0)this.text(`MOTH REVIVE ×${g.revivedCount}`,240,386,15,'#adf1c5','center');if(g.hpFlash>0){c.fillStyle=`rgba(255,70,90,${g.hpFlash})`;c.fillRect(0,0,480,720);}if(g.bannerTime>0&&g.mode!=='title'){c.save();c.shadowColor='#000';c.shadowBlur=3;this.text(g.banner,240,341,20,'#ffe2a2','center');c.restore();}
 }
 hudStar(x,y,size=4,color='#d8b975'){const c=this.ctx;c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,r=i%2?size*.24:size;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();}
 hudLine(x,y,x2,y2,color='#776743'){const c=this.ctx;c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 hudHeart(x,y,active){const c=this.ctx;c.fillStyle=active?'#e7a1b3':'#3e3b50';c.beginPath();c.moveTo(x,y+6);c.bezierCurveTo(x-14,y-2,x-7,y-12,x,y-5);c.bezierCurveTo(x+7,y-12,x+14,y-2,x,y+6);c.fill();}
 hud(g){const c=this.ctx;c.save();c.fillStyle='#0c1022f5';c.fillRect(0,0,480,86);this.hudLine(12,13,468,13);this.hudLine(12,82,468,82);for(const x of [18,462]){this.hudLine(x,15,x,75,'#d8b975');this.hudStar(x,17);this.hudStar(x,79,3);}this.hudStar(240,13,3);for(const x of [153,327]){this.hudStar(x,41,5);this.hudLine(x+(x<240?-33:12),41,x+(x<240?-12:33),41);}
  this.text('SCORE',240,27,10,'#d8b975','center');c.fillStyle='#f2dfad';c.font="bold 28px Georgia, 'Yu Mincho', serif";c.textAlign='center';c.fillText(String(g.score).padStart(8,'0'),240,56);this.text(`STAGE ${g.stage+1} / WAVE ${g.wave+1}`,32,74,10,'#d8b975');this.text(`Lv.${g.level}  EXP ${g.exp}/${g.level<10?g.level*300:'MAX'}`,240,74,11,'#d6d2e4','center');
  this.text(`${Math.floor(g.runTime/60).toString().padStart(2,'0')}:${Math.floor(g.runTime%60).toString().padStart(2,'0')}`,448,74,10,'#d8b975','right');
  const boss=g.enemies.find(e=>e.boss&&!e.dead);if(boss){c.fillStyle='#15162d';c.fillRect(60,104,360,7);c.fillStyle='#e69dc3';c.fillRect(60,104,360*Math.max(0,Math.min(1,boss.hp/boss.maxHp)),7);this.hudLine(60,103,420,103);this.hudLine(60,112,420,112);this.hudStar(53,108);this.hudStar(427,108);this.text(`${boss.type.toUpperCase()}  ${Math.ceil(boss.hp)} / ${boss.maxHp}`,240,99,10,'#d8b975','center');}else this.text(`VOID ${g.killed} / ${g.quota||'BOSS'}`,240,104,10,'#d8b975','center');
  if(g.combo>1)this.text(`${g.combo} HITS`,462,480,26,'#ffe191','right');else if(g.comboShow>0)this.text(`${g.lastCombo} HITS +${g.lastCombo*1000}`,462,480,17,'#ffe191','right');if(g.strawberry>0)this.text(`FIRE ${Math.ceil(g.strawberry)}s`,12,510,14,'#ff9a87');if(g.moonFruit>0){root.MVFruitIcon(c,'moonfruit',24,536,20,g.time);this.text(`${Math.ceil(g.moonFruit)}s`,40,541,12,'#f2dfad');}if(g.grape>0)this.text(`GUARD ${Math.ceil(g.grape)}s`,16,158,10,'#c79efa');
  c.fillStyle='#0c1022f5';c.fillRect(0,645,480,75);this.hudLine(15,648,465,648);this.hudStar(240,648,3);if(g.current.id==='yamamayu'){this.text('マダガスカル',240,656,10,C.moths[g.active].nameColor,'center');this.text('オナガヤママユ',240,666,10,C.moths[g.active].nameColor,'center');}else this.text(C.moths[g.active].name,240,663,12,C.moths[g.active].nameColor,'center');
  const max=g.current.maxHp,spacing=Math.min(20,140/Math.max(1,max)),start=240-(max-1)*spacing/2;for(let i=0;i<max;i++)this.hudHeart(start+i*spacing,678,i<g.current.hp);
  c.fillStyle='#262638';c.fillRect(160,690,160,5);c.fillStyle='#83ccd6';c.fillRect(160,690,160*Math.max(0,Math.min(1,g.gauge/100)),5);this.hudLine(160,688,320,688,'#d8b975');this.hudLine(160,697,320,697,'#d8b975');this.hudStar(150,692,5);this.hudStar(330,692,5);this.text('PARRY',340,696,10,'#d8b975');this.chargeOrbs(g);root.MVFruitIcon(c,'starfruit',438,674,18,g.time);this.text('×'+(g.starStocks||0),449,679,11,'#f2dfad');
  let seat=0;for(let i=0;i<3;i++)if(i!==g.active){const m=g.moths[i],x=seat++===0?86:394;if(m.alive){this.moth(c,m.id,x,675,36,g.time+i);for(let j=0;j<m.maxHp;j++){c.fillStyle=j<m.hp?C.moths[i].color:'#34405a';c.beginPath();c.arc(x-(m.maxHp-1)*4+j*8,698,2.5,0,Math.PI*2);c.fill();}this.hudLine(x-25,708,x+25,708);}else this.text('LOST',x,680,11,'#65708a','center');}c.restore();
 }
}
root.MVRenderer=Renderer;
})(window);

