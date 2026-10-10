/* Approved procedural celestial background; no bitmap downloads. */
(function(root){'use strict';root.MVCelestialBackground=function(c){
let seed=1769;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}const TAU=Math.PI*2;
const RING_SPEED=.16;function orbitMotion(o,t){const a=o.phase+t*o.spin;return {x:o.orbit*(Math.cos(a)-Math.cos(o.phase)),y:o.orbit*(Math.sin(a)-Math.sin(o.phase)),angle:t*o.spin}}function wrapX(x){return ((x+180)%840+840)%840-180}
const palettes=[['#070c18','#17223a','#ac8d55','#bccbd9'],['#0d0a18','#2b203a','#ac8d55','#bccbd9'],['#140817','#401d3a','#ac8d55','#bccbd9'],['#071513','#173a35','#ac8d55','#bccbd9'],['#050e09','#14291b','#ac8d55','#bccbd9'],['#110506','#351015','#ac8d55','#bccbd9']];
function star(x,y,r,n=4,fill=true){c.beginPath();for(let j=0;j<n*2;j++){let a=j*Math.PI/n-Math.PI/2,d=j%2?r*.22:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}c.closePath();fill?c.fill():c.stroke()}
function circle(r){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke()}
const stars=Array.from({length:130},()=>({x:rnd()*480,y:rnd()*720,r:.9+rnd()*.65,s:3+rnd()*8,p:rnd()*TAU}));
const nodes=Array.from({length:4},()=>Array.from({length:6},()=>[rnd()*120-60,rnd()*170-85]));
const motifs=Array.from({length:8},(_,i)=>({x:i%2?435:45,y:i*164-180,r:[38,112,68,150,52,92,132,78][i],kind:i%8,phase:rnd()*TAU,fall:7+rnd()*10,spin:(i%2?-1:1)*RING_SPEED*(.4+rnd()*.6),orbit:500+rnd()*300,orbitPhase:rnd()*TAU,orbitSpin:(i%2?-1:1)*RING_SPEED*.125*1.25*.5*(.5+rnd()*.5)}));
const constellations=Array.from({length:6},(_,i)=>({x:i%2?410:70,y:i*220,phase:rnd()*TAU,fall:5+rnd()*5,spin:(i%2?-1:1)*RING_SPEED*.0625*(.5+rnd()*.5),orbit:500+rnd()*300,spread:1.2+.8*i/5}));
const near=Array.from({length:16},(_,i)=>({x:i%2?385+rnd()*65:30+rnd()*65,y:rnd()*1000,r:2+rnd()*5,phase:rnd()*TAU,orbit:500+rnd()*300,spin:(i%2?-1:1)*RING_SPEED/12*(.5+rnd()*.5),kind:i%6}));
function wrap(y,t,v,period){return ((y+t*v)%period+period)%period-180}
function ringShape(kind,r){
function arc(radius,a,b,x=0,y=0){c.beginPath();c.arc(x,y,radius,a,b);c.stroke()}
function dot(x,y,size,solid=true){if(size>6)solid=false;c.beginPath();c.arc(x,y,size,0,TAU);solid?c.fill():c.stroke()}
switch(kind){
case 0: circle(r);arc(r*.61,0,TAU,r*.27,-r*.12);dot(-r*.7,r*.71,r*.1);dot(r,0,r*.07,false);break;
case 1: arc(r,-Math.PI*.85,Math.PI*.25);arc(r*.81,-Math.PI*.65,Math.PI*.48);dot(Math.cos(Math.PI*.25)*r,Math.sin(Math.PI*.25)*r,r*.065);break;
case 2: c.setLineDash([1,6]);circle(r);c.setLineDash([]);dot(r*.65,-r*.76,r*.11);dot(-r*.65,r*.76,r*.065,false);break;
case 3: circle(r);circle(r*.86);dot(r*.18,-r*.14,r*.24,false);dot(-r*.8,-r*.6,r*.095);dot(r*.64,r*.77,r*.065);star(r*.48,r*.22,r*.1,8);break;
case 4: circle(r);c.save();c.rotate(-.55);c.scale(1.45,.32);circle(r);c.restore();dot(-r*.83,r*.56,r*.085);break;
case 5: arc(r*.7,0,TAU,-r*.23,-r*.17);arc(r*.52,0,TAU,r*.46,r*.32);c.setLineDash([3,5]);arc(r,-Math.PI*.3,Math.PI*1.3);c.setLineDash([]);dot(r*.55,r*.82,r*.08);break;
case 6: arc(r,-Math.PI*.5,Math.PI*.5);arc(r*.74,-Math.PI*.5,Math.PI*.5,-r*.16,0);for(let k=0;k<13;k++){let a=-Math.PI*.5+k*Math.PI/12;c.beginPath();c.moveTo(Math.cos(a)*r*.83,Math.sin(a)*r*.83);c.lineTo(Math.cos(a)*r*.95,Math.sin(a)*r*.95);c.stroke()}dot(0,-r,r*.045);break;
case 7: c.setLineDash([1,5]);circle(r);c.setLineDash([]);arc(r*.58,0,TAU,r*.22,r*.28);c.beginPath();c.moveTo(-r*.3,-r*1.4);c.lineTo(-r*.3,r*.2);c.moveTo(r*.7,r*.4);c.lineTo(r*.7,r*1.3);c.stroke();dot(-r*.3,-r*1.4,r*.055);dot(r*.7,r*1.3,r*.055);break;
}}
function ring(m,t){c.save();const motion=orbitMotion({phase:m.orbitPhase,spin:m.orbitSpin,orbit:m.orbit},t);c.translate(wrapX(m.x+motion.x),wrap(m.y+motion.y,t,m.fall,1350));c.rotate(m.phase+t*m.spin);c.lineWidth=.65;ringShape(m.kind,m.r);c.restore()}
// Low-resolution seamless radial mottling; rebuilt only on palette changes.
const backdrop=document.createElement('canvas');backdrop.width=128;backdrop.height=384;let backdropColor='';
const clouds=[[12,35,83,.65],[103,128,96,.80],[30,249,90,.70],[111,352,72,.55],[88,62,44,-.40],[25,165,62,-.50],[108,275,52,-.40]];
function drawBackdrop(p,t){if(backdropColor!==p[0]){backdropColor=p[0];const q=backdrop.getContext('2d');q.fillStyle=p[0];q.fillRect(0,0,128,384);for(const [x,y,r,alpha] of clouds){for(const offset of [-384,0,384]){const color=alpha>0?p[1]:p[0],g=q.createRadialGradient(x,y+offset,0,x,y+offset,r);g.addColorStop(0,color+Math.round(Math.abs(alpha)*255).toString(16).padStart(2,'0'));g.addColorStop(.4,color+Math.round(Math.abs(alpha)*135).toString(16).padStart(2,'0'));g.addColorStop(1,color+'00');q.fillStyle=g;q.fillRect(x-r,y+offset-r,r*2,r*2)}}}const y=(t*7)%1440;c.drawImage(backdrop,0,y-1440,480,1440);c.drawImage(backdrop,0,y,480,1440)}

return {draw(time,stage,wave){const paletteIndex=stage===0?(wave<3?0:wave===3?1:2):(wave===2?4:wave===4?5:3);c.save();
const t=time,p=palettes[paletteIndex];drawBackdrop(p,t);
for(const s of stars){c.globalAlpha=.38+.25*(.5+.5*Math.sin(t*.6+s.p));c.fillStyle=p[3];c.fillRect(s.x,(s.y+t*s.s)%720,s.r,s.r)}
if(true){c.strokeStyle=c.fillStyle=p[2];c.globalAlpha=.40;for(const m of motifs)ring(m,t);for(let i=0;i<6;i++){c.save();const group=constellations[i];const motion=orbitMotion(group,t);c.translate(wrapX(group.x+motion.x),wrap(group.y+motion.y,t,group.fall,1500));c.rotate(group.phase+motion.angle);const ns=nodes[i%4].map(([x,y])=>[x*group.spread,y*group.spread]);c.globalAlpha=.43;c.lineWidth=1.05;c.beginPath();ns.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.stroke();for(let j=0;j<ns.length;j++){let [x,y]=ns[j];c.beginPath();c.arc(x,y,2.1,0,TAU);c.fill();if(j%3===0)star(x,y,4.5)}c.restore()}}
if(true){c.fillStyle=c.strokeStyle=p[2];for(const n of near){c.globalAlpha=.34+.20*(.5+.5*Math.sin(t*.8+n.phase));const motion=orbitMotion(n,t);c.save();c.translate(wrapX(n.x+motion.x),wrap(n.y+motion.y,t,5,1100));c.rotate(motion.angle);let y=0;if(n.kind===0){c.beginPath();for(let j=0;j<16;j++){const a=j*Math.PI/8-Math.PI/2;const radius=j%2?n.r*.17:(j%4===0?n.r*2:n.r*.88);c.lineTo(Math.cos(a)*radius,Math.sin(a)*radius)}c.closePath();c.fill();}else star(0,y,n.r,n.kind===1?8:4,n.kind!==2);c.restore()}}c.globalAlpha=1;c.restore();}};};})(typeof globalThis!=='undefined'?globalThis:this);
