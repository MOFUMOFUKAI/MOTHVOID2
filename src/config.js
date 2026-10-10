/* Game data. No runtime state belongs in this file. */
(function(root){'use strict';
const C={width:480,height:720,playerY:594,version:'35.28',
 tuning:{rockDensity:.6,largeRockChance:.15,chargeDelay:.8,chargeDuration:2,chargeScales:{yamamayu:.8,oomizuao:.6,yonagunisan:1},doubleTapWindow:.2,dodgeStep:60,dodgeDuration:.3,dodgeBoost:2,justFlashDuration:.45,parryMissRecovery:.2,parryHitRecovery:.1,attackWarning:.45,yonagunisanBlastScale:1.6,rockBlastScale:2},
 moths:[
  {id:'yamamayu',hitRadius:11,parryRadius:48,justRadius:32,name:'マダガスカルオナガヤママユ',nameColor:'#ffdc69',color:'#8cdb77',role:'緑 / 三方向',size:68,moveScale:1,dodgeScale:.8,dodgeInv:.2,asset:'assets/moths/anm_mv2_yamamayu_act.png'},
  {id:'oomizuao',hitRadius:9,parryRadius:46,justRadius:32,name:'オオミズアオ',nameColor:'#79c7ff',color:'#ff858f',role:'赤 / 高速・貫通',size:50,moveScale:1.1,dodgeScale:1,dodgeInv:.3,asset:'assets/moths/anm_mv2_omza_act.png'},
  {id:'yonagunisan',hitRadius:14,parryRadius:52,justRadius:33,name:'ヨナグニサン',nameColor:'#ff7d88',color:'#82bfff',role:'青 / 爆発',size:82,moveScale:.9,dodgeScale:.7,dodgeInv:.2,asset:'assets/moths/anm_mv2_yonaguni_act.png'}
 ],
 bossAnimation:{cell:512,scale:1.2,armTips:[[420,350],[350,395]],strongTip:[256,302]},
 enemyAtlases:{Feeble_A:{scale:1,origin:[.5,.74]},Feeble_B:{scale:1,origin:[.5,.74]},
  Tough_A:{scale:1.4,origin:[.5,.5]},Tough_B:{scale:1.4,origin:[.5,.5]},
  Powerful_A:{scale:1.2,origin:[.665,.585]},Powerful_B:{scale:1.2,origin:[.5,.5]},
  Boss_C:{scale:1.2,origin:[.5,.67]}
 },
 tiers:[{d:1,s:115,r:4},{d:2,s:230,r:8},{d:3,s:345,r:12},{d:4,s:460,r:14},{d:5,s:575,r:16}],
 enemies:{
  Feeble_A:{hp:1,size:40,score:1000,xp:10,tier:0},Mild_A:{hp:3,size:60,score:2000,xp:20,tier:1},
  Standard_A:{hp:6,size:90,score:3000,xp:30,tier:2},Tough_A:{hp:10,size:120,score:4000,xp:40,tier:3},
  Feeble_B:{hp:1,size:40,score:2000,xp:20,tier:0},Mild_B:{hp:3,size:60,score:3000,xp:30,tier:1},
  Standard_B:{hp:6,size:90,score:4000,xp:40,tier:2},Tough_B:{hp:10,size:120,score:5000,xp:50,tier:3},
  Powerful_A:{hp:15,size:200,score:8000,xp:80,tier:3},Powerful_B:{hp:15,size:200,score:9000,xp:90,tier:3},
  Boss_A:{hp:300,size:300,score:50000,xp:500,tier:2,boss:true},
  Boss_B:{hp:240,size:200,score:35000,xp:350,tier:4,boss:true},
  Boss_C:{hp:460,size:300,score:90000,xp:900,tier:4,boss:true}
 },
 stages:[[
  {caps:{Feeble_A:5},quota:20},{caps:{Mild_A:4,Feeble_A:2},quota:30},
  {caps:{Mild_A:3,Standard_A:3},quota:30},{caps:{Standard_A:4,Tough_A:2},quota:40},
  {caps:{Boss_A:1,Tough_A:2},boss:'Boss_A'}
 ],[
  {caps:{Feeble_B:8},quota:30},{caps:{Mild_B:5,Feeble_B:2},quota:30},
  {caps:{Boss_B:1,Standard_B:4},boss:'Boss_B'},{caps:{Standard_B:4,Tough_B:3},quota:40},
  {caps:{Boss_C:1,Powerful_A:1,Powerful_B:1},boss:'Boss_C'}
 ]],
 titleTrack:{file:'bgm_mv2_title.mp3',title:'Radiant Trinity'},
 gameoverTrack:{file:'bgm_mv2_gameover.mp3',title:'Until We Fly Again'},
 tracks:[[{"file":"bgm_mv2_stg1_wv1.mp3","title":"Wings of Valor"},{"file":"bgm_mv2_stg1_wv2.mp3","title":"Trinity in Motion"},{"file":"bgm_mv2_stg1_wv3.mp3","title":"No Ground Given"},{"file":"bgm_mv2_stg1_wv4.mp3","title":"Surge of the Trinity"},{"file":"bgm_mv2_stg1_wv5.mp3","title":"Weight of the Abyss"}],[{"file":"bgm_mv2_stg2_wv1.mp3","title":"Wings Toward Tomorrow"},{"file":"bgm_mv2_stg2_wv2.mp3","title":"Forward Through the Dark"},{"file":"bgm_mv2_stg2_wv3.mp3","title":"Crown of Dread"},{"file":"bgm_mv2_stg2_wv4.mp3","title":"Into the Final Light"},{"file":"bgm_mv2_stg2_wv5.mp3","title":"Light Beyond the End"}]],
 ranking:[{name:'MOTH',score:400000,rank:'SS'},{name:'LMNG',score:350000,rank:'S'},{name:'KAIK',score:300000,rank:'A'},{name:'YMMY',score:250000,rank:'B'},{name:'OOMZ',score:200000,rank:'C'}],
 factors:{SSS:4,SS:3.6,S:3.2,A:2.8,B:2.4,C:2,D:1.6,E:1.2}
};
root.MVConfig=C;if(typeof module!=='undefined')module.exports=C;
})(typeof window!=='undefined'?window:globalThis);
