/* Guided practice uses normal movement, collision and reflection mechanics. */
(function(root){'use strict';
function install(E){const p=E.prototype,original={};for(const key of ['reset','emit','pressParry','swap','evade','damage','hitEnemy','replenish','updateEnemy','reflect','update'])original[key]=p[key];
p.reset=function(...args){this.tutorial=null;return original.reset.apply(this,args);};
p.startTutorial=function(){this.reset();this.clearField();this.input={left:false,right:false};this.inv=0;this.bannerTime=0;this.musicTime=0;this.tutorial={step:0,count:0,left:0,right:0,nextAt:null};};
p.tutorialAllows=function(step){return !this.tutorial||this.tutorial.step>=step;};
p.pressParry=function(){if(this.tutorialAllows(3))return original.pressParry.call(this);};
p.swap=function(...args){if(this.tutorialAllows(2))return original.swap.apply(this,args);return false;};
p.evade=function(...args){if(this.tutorialAllows(1))return original.evade.apply(this,args);};
p.emit=function(type,...args){original.emit.call(this,type,...args);const t=this.tutorial;if(!t||t.nextAt!==null)return;if(type==='dodge'&&t.step===1||type==='swap'&&t.step===2){t.count++;if(t.count>=(t.step===2?3:1))t.nextAt=this.time+2.5;}};
p.damage=function(amount){if(!this.tutorial)return original.damage.call(this,amount);if(this.mode!=='playing'||this.inv>0||this.parry>0)return false;this.hpFlash=.2;this.inv=1;this.emit('hurt');return true;};
p.hitEnemy=function(...args){if(this.tutorial)return false;return original.hitEnemy.apply(this,args);};
p.replenish=function(){if(!this.tutorial)return original.replenish.call(this);};
p.updateEnemy=function(e,dt){if(!this.tutorial)return original.updateEnemy.call(this,e,dt);e.age+=dt;e.flash=Math.max(0,(e.flash||0)-dt);if(e.phase==='enter'){e.y=Math.min(320,e.y+90*dt);if(e.y===320){e.phase='hold';e.inv=false;e.shot=1.5;}return;}const t=this.tutorial;if(t.step<3||t.nextAt!==null)return;for(const shot of e.pendingShots||[]){shot.delay-=dt;if(shot.delay<=0)this.fireShot(e,shot.tier,shot.angle,shot.down);}e.pendingShots=(e.pendingShots||[]).filter(s=>s.delay>0);e.shot-=dt;if(e.shot<=0){this.shoot(e,0);e.shot=t.step===4?2.6:2;}};
p.reflect=function(bullet,just){const charged=this.parryCharged;original.reflect.call(this,bullet,just);const t=this.tutorial;if(!t||t.nextAt!==null)return;if(t.step===3&&!charged){t.count++;this.gauge=0;this.stocks=0;if(t.count>=3)t.nextAt=this.time+2.5;}else if(t.step===4&&charged){t.count=1;t.nextAt=this.time+2;}};
p.update=function(dt){const t=this.tutorial;if(!t)return original.update.call(this,dt);this.obstacleClock=-100000;const oldX=this.x;original.update.call(this,dt);if(this.mode!=='playing')return;if(t.step===0&&t.nextAt===null){const dx=this.x-oldX;if(dx<0)t.left-=dx;else t.right+=dx;if(t.left>=12&&t.right>=12){t.count=1;t.nextAt=this.time+2.5;}}if(t.step===4&&t.nextAt===null&&this.stocks===0&&!this.held&&this.parry<=0){this.stocks=1;this.gauge=0;this.emit('stock-ready');}if(t.nextAt!==null&&this.time>=t.nextAt){if(t.step===4){this.clearCharge();this.clearField();this.mode='tutorial-complete';return;}t.step++;t.count=0;t.nextAt=null;this.lastTap={left:null,right:null};this.finishParry();this.clearCharge();this.gauge=0;this.stocks=0;this.bullets=[];this.bombs=[];if(t.step===3){const e=this.spawn('Feeble_A');e.x=240;e.targetY=320;}if(t.step===4){this.stocks=1;this.emit('stock-ready');for(const e of this.enemies){e.pendingShots=[];e.shot=1.5;}}}};
}
if(typeof module!=='undefined')module.exports=install;else install(root.MVEngine);
})(typeof window!=='undefined'?window:globalThis);
