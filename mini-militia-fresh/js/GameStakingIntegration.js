/**
*Game-StakingIntegration
*Linksstakingmechanicstogamebonusesandrewards
*/

//Initializeimmediately-don'twait
(function(){
console.log('Initializingstakingintegration...');

//CreateWeb3integration(handleerrorsgracefully)
letweb3Integration;
try{
if(typeofethers!=='undefined'){
web3Integration=newWeb3Integration();
web3Integration.init().catch(err=>{
console.warn('Web3initwarning:',err);
});
}else{
console.warn('ethers.jsnotloaded,creatingbasicWeb3Integration');
web3Integration=newWeb3Integration();
}
}catch(error){
console.error('Web3Integrationcreationerror:',error);
web3Integration=newWeb3Integration();//Createanyway
}

//InitializestakingUIimmediately
functioninitNow(){
try{
console.log('CreatingStakingUI...');
conststakingUI=newStakingUI(web3Integration,window.game||null);
window.stakingUI=stakingUI;
window.web3Integration=web3Integration;
console.log('StakingUIcreated!');
}catch(error){
console.error('ErrorcreatingStakingUI:',error);
}
}

//Tryimmediately
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',initNow);
}else{
initNow();
}

//Alsotryafterashortdelaytocatchgameinstance
setTimeout(()=>{
if(window.game&&window.stakingUI){
extendGameWithStaking(window.game,web3Integration);
}
},3000);
})();

functioninitializeStaking(web3Integration,gameInstance){
//CreatestakingUI
conststakingUI=newStakingUI(web3Integration,gameInstance);

//Extendgamewithstakingbonuses
if(gameInstance){
extendGameWithStaking(gameInstance,web3Integration);
}

//Makeaccessibleglobally
window.stakingUI=stakingUI;
window.web3Integration=web3Integration;
}

functionextendGameWithStaking(game,web3Integration){
//Storeoriginalmethods
constoriginalRespawn=game.respawn;
constoriginalGameOver=game.gameOver;

//Addstakingbonustoscorecalculation
game.calculateStakingBonus=asyncfunction(){
if(!web3Integration.account)return1.0;

try{
conststaked=awaitweb3Integration.getUserStakedAmount();
conststakedAmount=parseFloat(staked);

//Bonusmultiplierbasedonstaking:
//1-10stakingtokens:1.1xmultiplier
//10-50:1.25xmultiplier
//50+:1.5xmultiplier
if(stakedAmount>=50)return1.5;
if(stakedAmount>=10)return1.25;
if(stakedAmount>=1)return1.1;
return1.0;
}catch(error){
console.error('Errorcalculatingstakingbonus:',error);
return1.0;
}
};

//Enhancedrespawnwithstakingbenefits
game.respawn=asyncfunction(){
constbonus=awaitthis.calculateStakingBonus();

//Stakersgetfasterrespawn(reducedby20%ifstaked)
this.respawnTime=bonus>1.0?5:6;

this.pauseGame();
this.messageBox.style.opacity=1;

//Applystakingbonustoscoredisplay
constbaseScore=this.shyame.actor.score;
constbonusScore=Math.floor(baseScore*bonus);

document.getElementById('score').innerHTML=baseScore;
if(bonus>1.0){
document.getElementById('score').innerHTML+=`<spanstyle="color:#4CAF50;">(+${Math.floor((bonus-1)*100)}%stakingbonus)</span>`;
}

document.getElementById('kills').innerHTML=this.shyame.actor.kills;
document.getElementById('respawn-value').innerHTML=this.respawnTime;

this.respawnInterval=setInterval(asyncfunction(){
if(this.respawnTime==0){
this.resumeGame();
this.shyame.actor.noOfLifes-=1;
this.shyame.actor.health=this.shyame.actor.maxHealth;

//Applystakingbonustohealthifstaked
constbonus=awaitthis.calculateStakingBonus();
if(bonus>1.0){
this.shyame.actor.maxHealth=Math.floor(this.shyame.actor.maxHealth*(1+(bonus-1)*0.2));
this.shyame.actor.health=this.shyame.actor.maxHealth;
}

clearInterval(this.respawnInterval);
}else{
this.respawnTime-=1;
document.getElementById('respawn-value').innerHTML=this.respawnTime;
}
}.bind(this),1000);

this.shyame.actor.position={x:1400,y:10};
};

//Enhancedgameoverwithstakingrewards
game.gameOver=asyncfunction(){
this.messageBox.style.opacity=1;
document.getElementById('messageHeading').innerHTML='GAMEOVER';

constbonus=awaitthis.calculateStakingBonus();
constbaseScore=this.shyame.actor.score;
constfinalScore=Math.floor(baseScore*bonus);

document.getElementById('score').innerHTML=finalScore;
if(bonus>1.0){
document.getElementById('score').innerHTML+=`<spanstyle="color:#4CAF50;">(StakingBonusApplied)</span>`;
}

document.getElementById('kills').innerHTML=this.shyame.actor.kills;
document.getElementById('respawn').innerHTML='';
document.getElementById('retryButton').style.display='block';

this.pauseGame();
this.removeControls();
this.messageBox.style.opacity=1;

//Showstakingreminderifnotstaked
if(bonus===1.0&&web3Integration.account){
setTimeout(()=>{
if(window.stakingUI){
constmessage=document.createElement('div');
message.style.cssText='position:fixed;top:100px;right:20px;background:rgba(102,126,234,0.9);color:white;padding:15px;border-radius:10px;z-index:3000;max-width:300px;';
message.innerHTML='💡<strong>Staketokenstogetscorebonuses!</strong><br>ClicktheStakingbuttontogetstarted.';
document.body.appendChild(message);
setTimeout(()=>message.remove(),10000);
}
},2000);
}
};

//Addcallbackforsuccessfulstake
game.onStakeSuccess=function(amount){
//Visualfeedback
if(this.shyame&&this.shyame.actor){
//Addtemporaryhealthboost
constcurrentHealth=this.shyame.actor.health;
constmaxHealth=this.shyame.actor.maxHealth;
this.shyame.actor.health=Math.min(maxHealth,currentHealth+20);
}
};

//Addcallbackforrewardsclaimed
game.onRewardsClaimed=function(){
//Visualcelebration
console.log('Rewardsclaimed!Greatjob!');
};

//Enhancescorecalculationwithstakingbonus
constoriginalAddScore=game.shyame?.actor?.addScore;
if(originalAddScore){
game.shyame.actor.addScore=asyncfunction(points){
constbonus=awaitgame.calculateStakingBonus();
constbonusPoints=Math.floor(points*(bonus-1));
originalAddScore.call(this,points+bonusPoints);
};
}
}

//Exportfordebugging
if(typeofmodule!=='undefined'&&module.exports){
module.exports={initializeStaking,extendGameWithStaking};
}

