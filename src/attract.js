/* Presentation-only attract controller; all actions use normal game mechanics. */
(function(root){'use strict';
class Attract{
 constructor(game){this.game=game;this.time=0;this.actions=new Set();}
 start(){const g=this.game;g.reset();g.demo=true;g.events=[];g.bannerTime=0;g.spawnClock=-1000;g.obstacleClock=-1000;g.clearField();g.stocks=3;this.time=0;this.actions.clear();this.finished=false;this.spawn();}
 spawn(){const g=this.game;for(const [type,x]of [['Feeble_A',60],['Feeble_A',150],['Mild_A',240],['Feeble_A',330],['Feeble_A',420]]){const e=g.spawn(type);e.x=x;e.y=180+g.enemies.length%2*65;e.inv=false;e.phase='hold';e.targetY=e.y;e.timer=2;e.shot=2;}}
 shot(){const g=this.game;let enemy=g.enemies.find(e=>!e.dead&&!e.inv);if(!enemy){this.spawn();enemy=g.enemies.find(e=>!e.dead&&!e.inv);}g.fireShot(enemy,0,0,false);const bullet=g.bullets[g.bullets.length-1];bullet.vx=(g.x-bullet.x)/1.2;bullet.vy=(root.MVConfig.playerY-bullet.y)/1.2;}
 update(dt){const g=this.game;this.time+=dt;if(this.time>=40){this.finished=true;return;}const cycle=Math.floor(this.time/8),phase=this.time%8;
 const once=(name,at,action)=>{const key=cycle+':'+name;if(phase>=at&&!this.actions.has(key)){this.actions.add(key);action();}};
 if(!g.held&&g.parry<=0&&!(phase>=2.1&&phase<=3.5)){const target=240+Math.sin(this.time*.8)*100;const dx=target-g.x;if(!this.moveDirection&&Math.abs(dx)>30)this.moveDirection=Math.sign(dx);if(this.moveDirection&&dx*this.moveDirection<8)this.moveDirection=0;g.input.left=this.moveDirection<0;g.input.right=this.moveDirection>0;}else g.input={left:false,right:false};
 once('dodge',2,()=>g.evade(g.x>240?-1:1));
 once('incoming',2.1,()=>this.shot());
once('parry',3.22,()=>{g.parryRecovery=0;g.pressParry();g.releaseParry();});
 once('charge',4,()=>{g.parryRecovery=0;g.stocks=Math.max(g.stocks,1);g.pressParry();});
 once('charged-incoming',6,()=>this.shot());
once('charged-release',7.1,()=>g.releaseParry());
 once('swap',7.6,()=>g.swap(1));
 g.inv=Math.max(g.inv,.1);g.spawnClock=-1000;g.obstacleClock=-1000;g.update(dt);g.effects=g.effects.filter(f=>f.kind!=="dodge-trail");
 if(g.enemies.filter(e=>!e.dead).length===0)this.spawn();
 }
}
root.MVAttract=Attract;if(typeof module!=='undefined')module.exports=Attract;
})(typeof window!=='undefined'?window:globalThis);
