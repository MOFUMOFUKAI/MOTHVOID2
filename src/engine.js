/* Deterministic game simulation. All timers use simulation time, never setTimeout.
   Each attack belongs to one wave epoch. Cleanup is visual-only. */
(function(root){'use strict';
const C=root.MVConfig||(typeof require==='function'?require('./config.js'):null);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hypot=Math.hypot;
class Engine{
 constructor(random=Math.random){this.random=random;this.serial=0;this.epoch=0;this.events=[];this.mode='title';this.reset();this.mode='title';}
 reset(){this.epoch++;this.mode='playing';this.time=0;this.runTime=0;this.score=0;this.level=1;this.exp=0;this.stage=0;this.wave=0;this.loop=1;this.active=0;this.x=240;this.vx=0;this.hpFlash=0;this.inv=0;this.parry=0;this.parryAnim=0;this.parryRecovery=0;this.parryResult=null;this.parryRearm=false;this.revivedCount=0;this.reviveBannerTime=0;this.justFlash=0;this.justOwner=null;this.lastTap={left:null,right:null};this.parryCharged=false;this.held=false;this.hold=0;this.chargeReady=false;this.gauge=0;this.stocks=0;this.dodge=0;this.dodgeCooldown=0;this.grape=0;this.strawberry=0;this.combo=0;this.comboEnd=0;this.lastCombo=0;this.comboShow=0;this.obstacleClock=0;this.spawnClock=0;this.killed=0;this.clearTimer=0;this.input={left:false,right:false};this.moths=C.moths.map(m=>({id:m.id,hp:3,maxHp:3,alive:true}));this.enemies=[];this.bullets=[];this.bombs=[];this.items=[];this.obstacles=[];this.effects=[];this.events=[];this.banner='';this.bannerTime=0;this.musicTime=0;this.beginWave(0,0);}
 emit(type,data={}){this.events.push({type,...data});}
 rand(a,b){return a+(b-a)*this.random();}
 get canMove(){return ['playing','transition','interlude'].includes(this.mode);}
 get current(){return this.moths[this.active];}
 get hitRadius(){return C.moths[this.active].hitRadius;}
 get radius(){return C.moths[this.active].parryRadius+2*(this.level-1);}
 get justRadius(){return C.moths[this.active].justRadius+2*(this.level-1);}
 get charging(){return this.held&&this.stocks>0&&this.hold>=this.chargeDelay;}
 get chargeScale(){return C.tuning.chargeScales[this.current.id]||1;}
 get chargeDelay(){return C.tuning.chargeDelay*this.chargeScale;}
 get chargeDuration(){return C.tuning.chargeDuration*this.chargeScale;}
 get maxStocks(){return 1+Math.floor((this.level-1)/2);}
 get def(){return C.stages[this.stage][this.wave];}
 get loopScale(){return 1+.05*Math.min(10,Math.max(0,this.loop-1));}
 get quota(){return this.def.quota===undefined?null:this.def.quota+5*Math.min(5,Math.max(0,this.loop-1));}
 get scroll(){return this.score<300000?2:Math.min(9,3+Math.floor((this.score-300000)/150000));}
 get obstacleInterval(){return Math.max(.2,.8-.2*Math.floor(this.score/200000))/C.tuning.rockDensity;}
 get rank(){const n=this.score/Math.max(1,this.runTime*1000);return n>=4?'SSS':n>=3.6?'SS':n>=3.2?'S':n>=2.8?'A':n>=2.4?'B':n>=2?'C':n>=1.6?'D':'E';}
 notice(text,seconds=2){this.banner=text;this.bannerTime=seconds;}
 clearCharge(){this.held=false;this.hold=0;this.chargeReady=false;this.emit('charge-stop');}
 clearField(keepItems=false){this.enemies=[];this.bullets=[];this.bombs=[];if(!keepItems)this.items=[];this.obstacles=[];}
 beginWave(stage,wave,carry=false){this.epoch++;this.clearField(carry);this.effects=carry?this.effects.filter(f=>f.kind==='sprite-burst'):[];this.stage=stage;this.wave=wave;this.mode='playing';this.killed=0;this.spawnClock=0;this.obstacleClock=0;if(!carry){this.parry=0;this.clearCharge();}this.inv=Math.max(this.inv,.8);this.replenish();this.notice(wave===0?`Stage${stage+1} wave1 start！`:`wave${wave+1} start！`,2.2);this.musicTime=5;this.emit('music',{stage,wave});}
 spawn(type){const def=C.enemies[type];if(!def)return;const index=this.enemies.filter(e=>e.type===type).length;const total=this.def.caps[type]||1;const size=def.size;const e={id:++this.serial,epoch:this.epoch,type,...def,hp:def.boss?Math.round(def.hp*this.loopScale):def.hp,maxHp:def.boss?Math.round(def.hp*this.loopScale):def.hp,x:clamp((index+1)*480/(total+1)+this.rand(-20,20),size/2,480-size/2),y:-size/2,age:0,timer:0,shot:0,burst:0,burstTime:0,dir:this.random()<.5?-1:1,phase:'enter',targetY:0,targetX:240,inv:true,dead:false,warp:0,cycles:0};
  if(type.startsWith('Feeble'))e.targetY=360+this.rand(0,type.endsWith('A')?100:80);
  if(type.startsWith('Mild'))e.targetY=type.endsWith('A')?200+this.rand(-85,85):250+this.rand(-100,100);
  if(type.startsWith('Standard'))e.targetY=type.endsWith('A')?this.rand(350,450):this.rand(200,400);
  if(type.startsWith('Tough')){e.x=e.dir>0?-size/2:480+size/2;e.y=type.endsWith('A')?this.rand(290,350):this.rand(200,400);e.targetY=e.y;}
  if(def.boss){e.x=240;e.targetY=200;e.shot=1;}
  if(type.startsWith('Powerful')){e.targetY=50;e.angle=type.endsWith('A')?0:Math.PI;e.x=240+Math.cos(e.angle)*(type.endsWith('B')?400:200);}
  this.enemies.push(e);return e;
 }
 replenish(){if(this.mode!=='playing')return;for(const [type,cap]of Object.entries(this.def.caps)){const n=this.enemies.filter(e=>!e.dead&&e.type===type).length;for(let i=n;i<cap;i++)this.spawn(type);}}
 openParry(charged=false){this.parry=.35;this.parryCharged=charged;this.parryAnim=charged?.48:.38;this.parryResult='miss';this.parryRearm=false;}
 finishParry(){if(this.parryResult!==null)this.parryRecovery=Math.max(this.parryRecovery,this.parryResult==='just'?0:this.parryResult==='normal'?C.tuning.parryHitRecovery:C.tuning.parryMissRecovery);this.parry=0;this.parryRearm=false;this.parryResult=null;}
 pressParry(){if(!this.canMove||this.held||this.parryRecovery>0||(this.parry>0&&!this.parryRearm))return;this.held=true;this.hold=0;this.chargeReady=false;this.openParry();this.emit('parry');}
 releaseParry(){if(!this.held)return;if(this.canMove&&this.chargeReady&&this.stocks>0){this.stocks--;this.openParry(true);this.emit('charged');}this.clearCharge();}
 swap(dir=1){if(!this.canMove)return false;for(let k=1;k<3;k++){const i=(this.active+dir*k+6)%3;if(this.moths[i].alive&&this.moths[i].hp>0){this.finishParry();this.active=i;this.clearCharge();this.parryAnim=0;this.emit('swap');return true;}}return false;}
 tapDirection(direction){if(!this.canMove||!['left','right'].includes(direction)||this.input[direction])return;this.input[direction]=true;const prev=this.lastTap[direction];this.lastTap[direction==='left'?'right':'left']=null;if(prev!==null&&this.time-prev<=C.tuning.doubleTapWindow){this.evade(direction==='left'?-1:1);this.lastTap[direction]=null;}else this.lastTap[direction]=this.time;}
 evade(dir=this.input.right?1:this.input.left?-1:0){if(!this.canMove||this.charging||(this.parryCharged&&this.parry>0)||this.dodgeCooldown>1e-9||!dir)return;const moth=C.moths[this.active],distance=C.tuning.dodgeStep*moth.dodgeScale,start=this.x;this.dodge=C.tuning.dodgeDuration;this.dodgeDir=dir;this.dodgeCooldown=C.tuning.dodgeDuration;this.inv=Math.max(this.inv,moth.dodgeInv);this.x=clamp(start+dir*distance,24,456);for(const x of [start,clamp(start+dir*distance/2,24,456)])this.effects.push({kind:'dodge-trail',moth:moth.id,size:moth.size,x,y:C.playerY,time:this.time,life:.1,max:.1});this.effect(this.x,C.playerY,20,moth.nameColor);this.emit('dodge');}
 pause(){if(['playing','transition','interlude'].includes(this.mode)){this.resumeMode=this.mode;this.mode='paused';this.lastTap={left:null,right:null};this.clearCharge();this.input={left:false,right:false};}else if(this.mode==='paused')this.mode=this.resumeMode;}
 damage(amount){if(this.mode!=='playing'||this.inv>0||this.parry>0||this.grape>0||!this.current.alive)return false;const m=this.current;m.hp=Math.max(0,m.hp-amount);this.hpFlash=.2;this.inv=1;this.emit('hurt');if(m.hp===0){m.alive=false;this.clearCharge();this.parry=0;this.parryAnim=0;const next=this.moths.findIndex(n=>n.alive&&n.hp>0);if(next===-1){this.mode='gameover';this.clearField();this.combo=0;this.emit('gameover');}else{this.active=next;this.inv=1.2;this.notice(`${C.moths[next].name} 出撃`,1.3);}}return true;}
 award(score,xp,x=this.x,y=C.playerY){if(this.mode==='gameover'||this.mode==='clear'||this.mode==='title')return;this.score+=score;if(score>0||xp>0&&this.level<10)this.effects.push({kind:'reward',x,y,score,xp:this.level<10?xp:0,life:1.2,max:1.2});if(this.level===10)return;this.exp+=xp;while(this.level<10&&this.exp>=this.level*300){this.exp-=this.level*300;this.level++;for(const m of this.moths){m.maxHp++;if(m.alive&&m.hp>0)m.hp=Math.min(m.maxHp,m.hp+1);}this.emit('levelup');this.notice(`LEVEL ${this.level}`,1.2);}if(this.level===10)this.exp=0;}
 gaugeHit(just){if(this.stocks>=this.maxStocks){this.gauge=0;return;}this.gauge+=just?20:10;if(this.gauge>=100){this.gauge=0;this.stocks++;this.emit('stock-ready');}}
 effect(x,y,r=30,color='#ffd773'){this.effects.push({x,y,r,color,life:.4,max:.4});}
 finishCombo(){if(this.combo>=2){this.award(this.combo*1000,this.combo*10);this.lastCombo=this.combo;this.comboShow=2;}this.combo=0;this.comboEnd=0;}
 addCombo(meta={}){if(this.combo>0&&this.time<this.comboEnd){this.combo=Math.min(50,this.combo+1);if(meta.just)this.comboEnd+=1;}else if(meta.just||meta.charged){this.combo=1;this.comboEnd=this.time+3;}}
 burst(x,y,key,size,r=0){const duration=C.explosionFrames[key]?.reduce((sum,t)=>sum+t,0)||.64;this.effects.push({kind:'sprite-burst',x,y,key,size,r,life:duration,max:duration});}
 enemyBurst(e){if(e.boss){this.effect(e.x,e.y,e.size*.7,'#fff2bc');return;}const group=e.type.startsWith('Powerful')?'powerful':/^(Standard|Tough)_/.test(e.type)?'standard-tough':'feeble-mild';this.burst(e.x,e.y,'enemy-'+group,Math.max(120,e.size*1.8));}
 kill(e,meta={}){if(e.dead||e.epoch!==this.epoch||this.mode!=='playing')return;e.dead=true;this.enemyBurst(e);this.emit(e.boss?'boss-kill':'kill');this.award(e.score,e.xp,e.x,e.y-e.size/2);
  this.addCombo(meta);
  this.drop(e,meta);if(e.boss&&e.type===this.def.boss){this.startTransition();if(this.stage===1&&this.wave===4)this.clearTimer=Math.max(this.clearTimer,(665-e.y)/65+.1);}else if(!this.def.boss){this.killed++;if(this.killed>=this.quota)this.startTransition();}}
 reviveMoths(){this.revivedCount=0;for(const m of this.moths){if(!m.alive||m.hp<=0){m.alive=true;m.hp=Math.ceil(m.maxHp/2);this.revivedCount++;}}if(this.revivedCount){this.reviveBannerTime=3;this.emit('revive',{count:this.revivedCount});}}
 hitEnemy(e,damage,meta){if(e.dead||e.inv||e.epoch!==this.epoch||this.mode!=='playing')return false;const oldHp=e.hp;e.hp=Math.max(0,e.hp-damage);if(['Boss_B','Boss_C'].includes(e.type)&&e.phase==='hold'&&oldHp>e.maxHp/2&&e.hp<=e.maxHp/2)e.timer=Math.max(0,e.timer-2);e.flash=.1;if(e.hp===0)this.kill(e,meta);return true;}
 startTransition(){if(this.mode!=='playing')return;this.mode='transition';this.clearTimer=3;this.cleanupTimer=3;this.cleanupDone=false;this.bullets=[];this.bombs=[];this.obstacles=[];this.notice(this.wave===4?'STAGE CLEAR':'WAVE CLEAR',2.8);}
 cleanupWave(){if(this.cleanupDone)return;this.cleanupDone=true;// Cleanup adds combo only, without enemy rewards or drops.
  for(const e of this.enemies)if(!e.dead){this.enemyBurst(e);if(!e.boss)this.combo=Math.min(50,this.combo+1);}
  this.finishCombo();
  this.clearField(true);
 }
 finishTransition(){this.cleanupWave();this.epoch++;this.mode='interlude';this.clearTimer=.45;if(this.wave<4)this.emit('music',{stage:this.stage,wave:this.wave+1});else if(this.stage===0)this.emit('music',{stage:1,wave:0});else this.emit('music-title');
 }
 advance(){if(this.wave<4)this.beginWave(this.stage,this.wave+1,true);else if(this.stage===0)this.beginWave(1,0,true);else{this.mode='clear';this.finishCombo();this.clearCharge();this.emit('clear',{rank:this.rank});}}
 continueRun(){if(this.mode!=='clear')return;this.loop++;for(const m of this.moths){m.alive=true;m.hp=m.maxHp;}this.active=0;this.inv=2;this.grape=0;this.strawberry=0;this.combo=0;this.beginWave(0,0);}
 drop(e,meta){if(e.boss)this.items.push({type:'rainbow',x:e.x,y:e.y,age:0});if(meta.just||meta.charged){const v=this.random(),grape=/^(Standard|Tough)_/.test(e.type);const type=v<.05?'lemon':v<.08?'strawberry':grape&&v<.11?'grape':null;if(type)this.items.push({type,x:e.x+9,y:e.y,age:0});}}
 collect(item){if(item.dead)return;const m=this.current;switch(item.type){case'rainbow':if(m.alive)m.hp=m.maxHp;this.reviveMoths();break;case'heart':if(m.alive)m.hp=Math.min(m.maxHp,m.hp+1);break;case'gold':if(m.alive)m.hp=m.maxHp;break;case'lemon':this.award(2000,200,item.x,item.y);if(this.stocks<this.maxStocks){this.gauge+=20;if(this.gauge>=100){this.gauge-=100;this.stocks++;this.emit('stock-ready');if(this.stocks>=this.maxStocks)this.gauge=0;}}break;case'grape':this.award(8000,0,item.x,item.y);this.grape=10;break;case'strawberry':this.award(5000,0,item.x,item.y);this.strawberry=30;break;}item.dead=true;this.emit('item');}
 shoot(e,tier=e.tier,angle=0,down=false){if(this.mode!=='playing'||e.dead||e.inv||e.epoch!==this.epoch)return;const arm=e.type==='Boss_A'&&tier!==4?(e.nextArm??0):undefined;if(arm!==undefined)e.nextArm=(arm+1)%4;(e.pendingShots??=[]).push({tier,angle,down,arm,delay:C.tuning.attackWarning});}
 fireShot(e,tier,angle,down,arm){if(this.mode!=='playing'||e.dead||e.inv||e.epoch!==this.epoch)return;e.lastSpitAt=e.age;if(e.type==='Boss_A'){e.lastShotTier=tier;if(tier!==4)e.lastArm=arm??e.pendingShots?.find(s=>s.tier===tier)?.arm??e.lastArm??0;}const origin=this.shotOrigin(e,tier),a=down?Math.PI/2:Math.atan2(C.playerY-origin.y,this.x-origin.x);const t=C.tiers[tier];this.bullets.push({id:++this.serial,epoch:this.epoch,x:origin.x,y:origin.y,vx:Math.cos(a+angle)*t.s*this.loopScale,vy:Math.sin(a+angle)*t.s*this.loopScale,tier,r:t.r,d:t.d,owner:'enemy',age:0,hit:new Set()});}
 shotOrigin(e,tier){if(e.type==='Boss_A'){const a=C.bossAnimation,arm=e.lastArm??0,tip=tier===4?a.strongTip:a.armTips[arm>=2?1:0],scale=e.size*a.scale/a.cell;return {x:e.x+(tip[0]-256)*scale*(tier!==4&&arm%2?-1:1),y:e.y+(tip[1]-256)*scale};}const atlas=C.enemyAtlases[e.type];if(atlas)return {x:e.x+(atlas.origin[0]-.5)*e.size*atlas.scale,y:e.y+(atlas.origin[1]-.5)*e.size*atlas.scale};return {x:e.x,y:e.y+e.size*(e.type.startsWith('Standard_')?.43:.24)};}
 beginWarp(e){if(e.pendingShots?.length){e.warpRequested=true;return;}e.warpRequested=false;e.inv=true;e.phase='warp';e.timer=.45;e.warp=.45;}
 moveTo(e,x,y,speed,dt){const dx=x-e.x,dy=y-e.y,d=hypot(dx,dy);if(d<=speed*dt){e.x=x;e.y=y;return true;}e.x+=dx/d*speed*dt;e.y+=dy/d*speed*dt;return false;}
 // B variants use charge time inclusive of the existing final attack warning.
 standardBWarp(e){e.warpTarget={x:e.x,y:clamp(e.y-this.rand(200,400),e.size/2,560-e.size/2)};this.beginWarp(e);}
 updateBEnemy(e,dt){
  if(e.type==='Standard_B'){
   if(e.shot<=0){this.shoot(e);e.shot=2;}
   if(e.phase==='hold'&&e.timer<=0){e.phase='descend';e.targetY=this.rand(200,400);}
   if(e.phase==='descend'&&this.moveTo(e,e.x,e.targetY,75,dt))this.standardBWarp(e);
   return;
  }
  const mild=e.type==='Mild_B',charge=mild?3:2;
  if(e.phase==='hold'&&e.timer<=C.tuning.attackWarning){
   this.shoot(e);if(mild)for(const offset of [.16,.32]){this.shoot(e);e.pendingShots.at(-1).delay+=offset;}
   e.phase='firing';
  }else if(e.phase==='firing'&&!e.pendingShots?.length){e.phase='wait';e.timer=mild?3:1;}
  else if(e.phase==='wait'&&e.timer<=0){
   if(mild){const shift=()=>this.rand(100,300)*(this.random()<.5?-1:1);e.warpTarget={x:clamp(e.x+shift(),e.size/2,480-e.size/2),y:clamp(e.y+shift(),e.size/2,560-e.size/2)};this.beginWarp(e);}
   else{e.targetX=clamp(e.x+this.rand(-200,200),e.size/2,480-e.size/2);e.targetY=clamp(e.y+this.rand(-200,200),e.size/2,560-e.size/2);e.phase='move';}
  }else if(e.phase==='move'&&this.moveTo(e,e.targetX,e.targetY,100,dt)){e.phase='hold';e.timer=charge;}
 }
 updateEnemy(e,dt){e.age+=dt;if(e.pendingShots?.length){for(const shot of e.pendingShots)shot.delay-=dt;const ready=e.pendingShots.filter(shot=>shot.delay<=0);e.pendingShots=e.pendingShots.filter(shot=>shot.delay>0);for(const shot of ready)this.fireShot(e,shot.tier,shot.angle,shot.down,shot.arm);}if(e.warpRequested){if(!e.pendingShots?.length)this.beginWarp(e);return;}e.flash=Math.max(0,(e.flash||0)-dt);e.shot-=dt;e.timer-=dt;const b=e.type.endsWith('B'),type=e.type.split('_')[0];
  if(e.phase==='enter'){
   let reached;if(type==='Tough')reached=this.moveTo(e,e.dir>0?e.size/2:480-e.size/2,e.y,b?150:90,dt);else reached=this.moveTo(e,e.x,e.targetY,e.type==='Feeble_B'?200:100,dt);
   if(type==='Standard'&&e.y>=100){e.inv=false;if(e.shot<=0){this.shoot(e);e.shot=2;}}
   if(reached){e.inv=false;e.phase=type==='Tough'?'move':'hold';e.timer=type==='Feeble'?(b?2:3):type==='Tough'?this.rand(b?2:1,b?4:3):3;if(e.type==='Standard_B'){this.standardBWarp(e);}else if(type==='Powerful')e.shot=b?3:5;else if(e.type==='Tough_B')e.shot=4;else if(type!=='Standard')e.shot=type==='Boss'?1:0;}
   return;
  }
  if(e.phase==='warp'){if(e.timer<=0){e.x=e.warpTarget?.x??this.rand(e.size/2,480-e.size/2);e.y=e.warpTarget?.y??(type==='Boss'?this.rand(e.size/2,450-e.size/2):this.rand(100,type==='Mild'?500:200));e.warpTarget=null;e.inv=false;e.phase='hold';e.timer=type==='Boss'?(e.hp<=e.maxHp/2?1:3):type==='Standard'?5:3;e.shot=2;}return;}
  if(['Feeble_B','Mild_B','Standard_B'].includes(e.type)){this.updateBEnemy(e,dt);return;}
  if(type==='Boss'){
   if(e.type==='Boss_A'){if(e.shot<=0&&e.phase!=='charge'&&!(e.pendingShots?.some(s=>s.tier===4))){this.shoot(e,2);e.shot=1;}if(e.timer<=0&&!(e.pendingShots?.length)&&(e.age-(e.lastSpitAt??-Infinity)>=.44)){e.phase=e.phase==='charge'?'hold':'charge';e.timer=e.phase==='charge'?2:8;if(e.phase==='hold')this.shoot(e,4);}}
   else if(e.timer<=C.tuning.attackWarning){if(e.type==='Boss_C')for(const a of(e.hp<=e.maxHp/2?[-.42,-.14,.14,.42]:[-.28,0,.28]))this.shoot(e,4,a);else this.shoot(e,4);this.beginWarp(e);}return;
  }
  if(type==='Powerful'){const enraged=this.enemies.some(boss=>boss.type==='Boss_C'&&!boss.dead&&boss.hp<=boss.maxHp/2);if(enraged&&!e.enraged){e.enraged=true;if(b)e.shot=Math.min(e.shot,2);}e.angle+=(b?-1:1)*dt*.65*(b&&enraged?2:1);const radius=b?400:200;e.x=240+Math.cos(e.angle)*radius;e.y=50+Math.sin(e.angle)*radius;if(e.shot<=0){this.shoot(e,3);if(!b&&enraged)for(const offset of [.16,.32]){this.shoot(e,3);e.pendingShots.at(-1).delay+=offset;}e.shot=b?(enraged?2:3):5;}return;}
  if(type==='Standard'){
   if(e.shot<=0){this.shoot(e);e.shot=!b&&e.cycles>0?1:2;}
   if(e.phase==='hold'&&e.timer<=0){e.phase='descend';e.targetY=b?this.rand(200,400):this.rand(350,450);}
   if(e.phase==='descend'&&this.moveTo(e,e.x,e.targetY,75,dt)){if(b)this.beginWarp(e);else{e.phase='ascend';e.targetY=clamp(e.y-this.rand(250,350),70,200);}}
   if(e.phase==='ascend'&&this.moveTo(e,e.x,e.targetY,90,dt)){e.phase='hold';e.timer=5;e.cycles++;}return;
  }
  if(type==='Tough'){
   if(b){if(e.shot<=0){this.shoot(e,3);e.shot=4;}if(e.phase==='hold'&&e.timer<=0)e.phase='move';if(e.phase==='move'){e.x+=e.dir*150*dt;if(e.x<e.size/2||e.x>480-e.size/2){e.x=clamp(e.x,e.size/2,480-e.size/2);e.dir*=-1;e.phase='hold';e.timer=2;}}}
   else{if(e.phase==='hold'&&e.timer<=0){e.phase='charge';e.timer=1;}else if(e.phase==='charge'&&e.timer<=0){this.shoot(e,3,0,true);e.phase='move';e.timer=this.rand(1,3);}else if(e.phase==='move'){e.x+=e.dir*75*dt;if(e.x<60||e.x>420){e.x=clamp(e.x,60,420);e.dir*=-1;}if(e.timer<=0){e.phase='hold';e.timer=1;}}}return;
  }
  // Feeble / Mild: windup, shot(s), movement, windup. Burst timers live on the enemy.
  if(e.burst>0){e.burstTime-=dt;if(e.burstTime<=0){this.shoot(e);e.burst--;e.burstTime=.16;}}
  if(e.phase==='hold'&&e.timer<=0){this.shoot(e);if(type==='Mild'){e.burst=b?2:1;e.burstTime=.16;}e.phase='wait';e.timer=b?(type==='Mild'?3:1):.35;}
  else if(e.phase==='wait'&&e.timer<=0){if(b&&type==='Mild')this.beginWarp(e);else{e.targetX=clamp(e.x+this.rand(-1,1)*(type==='Mild'?300:b?200:150),e.size/2,480-e.size/2);e.phase='move';}}
  else if(e.phase==='move'&&this.moveTo(e,e.targetX,e.y,type==='Mild'?150:b?100:50,dt)){e.phase='hold';e.timer=type==='Feeble'&&b?2:3;}
 }
 reflect(p,just){const charged=this.parryCharged,id=this.current.id,t=C.tiers[p.tier];p.dead=true;if(this.parryResult!==null){if(just&&!charged){this.parryResult='just';this.parryRearm=true;this.parryRecovery=0;}else if(this.parryResult!=='just')this.parryResult='normal';}this.gaugeHit(just&&!charged);if(just&&!charged){this.justFlash=C.tuning.justFlashDuration;this.justOwner=id;}this.emit(charged?'charged':just?'just':'reflect');this.effect(p.x,p.y,just||charged?40:22,just||charged?'#9fefff':'#ffe077');const bomb=id==='yonagunisan';const speed=t.s*(bomb?.5:id==='oomizuao'?3:2)*(just||charged?1.6:1);let damage=t.d+(id==='yamamayu'?1:bomb?2:0);damage*=charged?(id==='yamamayu'?3:4):just?2:1;const rockToken=p.rock?{dropped:false}:null;const spread=id==='yamamayu'&&(just||charged)?[-Math.PI/6,0,Math.PI/6]:[0];const dir=this.input.right?1:this.input.left?-1:0;let angle=-Math.PI/2;
  if(bomb)angle=Math.atan2(-p.vy,-p.vx);else if(dir)angle+=dir*Math.PI/4;else if(id==='yamamayu'){const dx=p.x-this.x,dy=C.playerY-p.y;if(Math.abs(dx)>Math.abs(dy))angle+=Math.sign(dx)*Math.PI/4;}
  if(this.dodge>0)angle=this.dodgeDir>0?0:Math.PI;
  for(const a of spread){const bullet={id:++this.serial,epoch:this.epoch,x:p.x,y:p.y,vx:Math.cos(angle+a)*speed+(dir&&!bomb?this.vx:0),vy:Math.sin(angle+a)*speed,tier:p.tier,r:t.r*(charged?(id==='oomizuao'?3:2):just&&id!=='yamamayu'?2:1),d:damage,owner:'player',age:0,hit:new Set(),just:just&&!charged,charged,bomb,rock:!!p.rock,rockVariant:p.rockVariant,rockToken,pierce:charged||(just&&id==='oomizuao'),curve:!bomb&&dir&&this.dodge<=0?(id==='yamamayu'?1.5:.5):0,bombRadius:(50+p.tier*20)/2*(charged?3:just?2:1)*C.tuning.yonagunisanBlastScale};bullet.initialVX=bullet.vx;this.bullets.push(bullet);}
  if(this.strawberry>0&&!p.rock)for(const a of[-.4,0,.4])this.bullets.push({id:++this.serial,epoch:this.epoch,x:this.x,y:C.playerY,vx:Math.sin(a)*240,vy:-Math.cos(a)*240,r:5,d:2,owner:'player',tier:0,age:-.12,fire:true,hit:new Set()});
 }
 explode(p){if(p.epoch!==this.epoch||this.mode!=='playing')return;this.effect(p.x,p.y,p.bombRadius,'#fca778');const bomb={x:p.x,y:p.y,r:p.bombRadius,d:p.d,epoch:this.epoch,life:.3,hit:new Set(),just:p.just,charged:p.charged};this.bombs.push(bomb);this.applyBomb(bomb);}
 applyBomb(b){if(b.epoch!==this.epoch||this.mode!=='playing')return;for(const e of this.enemies){if(!e.dead&&!e.inv&&!b.hit.has(e.id)&&hypot(e.x-b.x,e.y-b.y)<b.r+e.size*.38){b.hit.add(e.id);this.hitEnemy(e,b.d,b);if(this.mode!=='playing')return;}}}
 rockRadius(tier=1){return (50+tier*20)*C.tuning.rockBlastScale/2*.4;}
 destroyRock(o,meta={}){if(o.dead||this.mode!=='playing'||(o.epoch!==undefined&&o.epoch!==this.epoch))return;const epoch=this.epoch;o.dead=true;const r=this.rockRadius(o.tier??1);this.burst(o.x,o.y,(o.tier??1)===2?'rock-medium':'rock-small',r*3,r);this.emit('rock-burst',{tier:o.tier??1});if(!o.rockToken||!o.rockToken.scored){if(o.rockToken)o.rockToken.scored=true;this.award((o.tier??1)===2?500:300,0,o.x,o.y);}
  if(!o.rockToken||!o.rockToken.dropped){if(o.rockToken)o.rockToken.dropped=true;const roll=this.random(),lowHp=this.current.hp<=2,medium=o.tier===2,heartRate=medium?.08:.05,goldLimit=medium?.10:.07;const type=roll<heartRate?'heart':lowHp&&roll<goldLimit?'gold':null;if(type)this.items.push({type,x:o.x,y:o.y,age:0});}
  for(const q of this.bullets)if(q.owner==='enemy'&&!q.dead&&q.epoch===epoch&&hypot(q.x-o.x,q.y-o.y)<r+q.r)q.dead=true;
  const blast={x:o.x,y:o.y,r,d:o.d??C.tiers[o.tier??1].d,epoch,life:.3,hit:new Set(),just:!!meta.just,charged:!!meta.charged};this.bombs.push(blast);this.applyBomb(blast);
 }
 updateItems(dt){for(const item of this.items){item.age+=dt;item.y+=65*(item.type==='rainbow'?1.1:1)*dt;if(hypot(item.x-this.x,item.y-C.playerY)<30)this.collect(item);if(item.y>665)item.dead=true;}this.items=this.items.filter(i=>!i.dead);}
 updateBullet(p,dt){if(p.dead)return;if(p.epoch!==this.epoch){p.dead=true;return;}p.age+=dt;if(p.age<0)return;if(p.curve){p.vx=p.initialVX*Math.max(0,1-p.age/p.curve);}p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(p.owner==='enemy'){
   const d=hypot(p.x-this.x,p.y-C.playerY);if(this.parry>0&&d<this.radius+p.r){this.reflect(p,d<this.justRadius+p.r);return;}if(d<p.r+this.hitRadius){p.dead=true;this.damage(p.d);return;}
  }else{
   if(p.just||p.charged)for(const q of this.bullets)if(q.owner==='enemy'&&!q.dead&&hypot(q.x-p.x,q.y-p.y)<q.r+p.r)q.dead=true;
   if(p.rock&&p.age>=2.2){this.destroyRock(p,p);return;}if(p.bomb&&p.age>=2.2){p.dead=true;this.explode(p);return;}
   for(const e of this.enemies){if(e.dead||e.inv||p.hit.has(e.id))continue;if(hypot(e.x-p.x,e.y-p.y)<e.size*.38+p.r){p.hit.add(e.id);if(p.rock){this.destroyRock(p,p);}else if(p.bomb){p.dead=true;this.explode(p);}else{this.hitEnemy(e,p.d,p);if(!p.pierce)p.dead=true;}if(p.dead||this.mode!=='playing')break;}}
   if(!p.dead)for(const o of this.obstacles)if(!o.dead&&hypot(o.x-p.x,o.y-p.y)<o.r+p.r){this.destroyRock(o,p);if(p.rock&&!p.dead&&this.mode==='playing')this.destroyRock(p,p);if(!p.pierce)p.dead=true;break;}
  }
  if(p.x<-100||p.x>580||p.y<-180||p.y>790||p.age>8)p.dead=true;
 }
 update(dt){if(!['playing','transition','interlude'].includes(this.mode))return;dt=clamp(dt,0,.05);this.time+=dt;this.runTime+=dt;const parryBefore=this.parry;for(const key of['inv','hpFlash','parry','parryRecovery','reviveBannerTime','parryAnim','justFlash','dodge','dodgeCooldown','grape','strawberry','bannerTime','musicTime','comboShow'])this[key]=Math.max(0,this[key]-dt);if(parryBefore>0&&this.parry===0)this.finishParry();for(const f of this.effects)f.life-=dt;this.effects=this.effects.filter(f=>f.life>0);if(this.mode!=='transition'&&this.combo&&this.time>=this.comboEnd)this.finishCombo();
  const dir=(this.input.right?1:0)-(this.input.left?1:0);this.vx=dir*240*C.moths[this.active].moveScale*Math.pow(1.02,this.level-1)*(this.dodge>1e-9?C.tuning.dodgeBoost:1)*(this.held&&this.stocks>0?.64:1);if(this.dodge>0&&dir)this.dodgeDir=dir;this.x=clamp(this.x+this.vx*dt,24,456);
  if(this.held){const old=this.hold;this.hold+=dt;if(old<this.chargeDelay&&this.hold>=this.chargeDelay&&this.stocks>0)this.emit('charge-start');if(this.hold>=this.chargeDelay+this.chargeDuration&&this.stocks>0&&!this.chargeReady){this.chargeReady=true;this.emit('ready');}}
  this.updateItems(dt);
  if(this.mode==='transition'){this.cleanupTimer-=dt;if(this.cleanupTimer<=1e-9)this.cleanupWave();this.clearTimer-=dt;if(this.clearTimer<=0)this.finishTransition();return;}
  if(this.mode==='interlude'){this.clearTimer-=dt;if(this.clearTimer<=0)this.advance();return;}

  for(const e of this.enemies)if(!e.dead)this.updateEnemy(e,dt);
  // Snapshot excludes newly reflected bullets until next tick.
  for(const p of this.bullets.slice()){this.updateBullet(p,dt);if(this.mode!=='playing')return;}
  for(const b of this.bombs){b.life-=dt;this.applyBomb(b);if(this.mode!=='playing')return;}this.bombs=this.bombs.filter(b=>b.life>0&&b.epoch===this.epoch);
  this.bullets=this.bullets.filter(p=>!p.dead);this.enemies=this.enemies.filter(e=>!e.dead);
  
  this.obstacleClock+=dt;if(this.obstacleClock>=this.obstacleInterval){this.obstacleClock-=this.obstacleInterval;const large=this.random()<C.tuning.largeRockChance;this.obstacles.push({rockVariant:large?1:2,tier:large?2:1,x:this.rand(25,455),y:-30,r:large?this.rand(21,25):this.rand(11,15),angle:this.rand(0,6),speed:this.rand(35,55)+this.scroll*15});}
  for(const o of this.obstacles){if(o.dead)continue;o.y+=o.speed*dt;o.angle+=dt*.5;const distance=hypot(o.x-this.x,o.y-C.playerY);if(this.parry>0&&distance<this.radius+o.r){o.dead=true;this.reflect({x:o.x,y:o.y,vx:0,vy:o.speed,tier:o.tier??1,rockVariant:o.rockVariant,rock:true},distance<this.justRadius+o.r);}else if(distance<o.r+this.hitRadius){o.dead=true;this.damage(1);if(this.mode!=='playing')return;}}this.obstacles=this.obstacles.filter(o=>!o.dead&&o.y<750);
  this.spawnClock+=dt;if(this.spawnClock>=.5){this.spawnClock=0;this.replenish();}
 }
}
root.MVEngine=Engine;if(typeof module!=='undefined')module.exports=Engine;
})(typeof window!=='undefined'?window:globalThis);
