/**
*StakingUIComponentforMiniMilitiaGame
*Providesabeautiful,integratedstakinginterface
*/

classStakingUI{
constructor(web3Integration,gameInstance){
this.web3=web3Integration;
this.game=gameInstance;
this.isOpen=false;
this.stakingData={
staked:'0',
balance:'0',
price:'5083',
enabled:false
};
this.init();
}

init(){
try{
this.createUI();
this.setupEventListeners();
this.startDataRefresh();
console.log('StakingUIinitializedsuccessfully');
}catch(error){
console.error('ErrorinitializingStakingUI:',error);
}
}

createUI(){
//Createstakingpanel
conststakingPanel=document.createElement('div');
stakingPanel.id='stakingPanel';
stakingPanel.className='staking-panel';
stakingPanel.style.display='none';//Initiallyhidden
stakingPanel.style.zIndex='99998';
stakingPanel.innerHTML=`
<divclass="staking-header">
<h2>Staking&Rewards</h2>
<buttonid="closeStaking"class="close-btn">×</button>
</div>

<divclass="staking-content">
<divclass="wallet-section">
<divid="walletStatus"class="wallet-status">
<spanclass="status-indicator"></span>
<spanid="walletAddress">NotConnected</span>
</div>
<buttonid="connectWallet"class="connect-btn">ConnectWallet</button>
</div>

<divclass="staking-stats">
<divclass="stat-card">
<divclass="stat-label">StakedAmount</div>
<divclass="stat-value"id="stakedAmount">0HGM</div>
</div>
<divclass="stat-card">
<divclass="stat-label">YourBalance</div>
<divclass="stat-value"id="userBalance">0HGM</div>
</div>
<divclass="stat-card">
<divclass="stat-label">StakingPrice</div>
<divclass="stat-value"id="stakingPrice">5,083HGM</div>
</div>
</div>

<divclass="staking-actions">
<divclass="action-group">
<label>StakeAmount</label>
<divclass="input-group">
<inputtype="number"id="stakeAmount"placeholder="0"min="1"step="1">
<spanclass="input-suffix">StakingTokens</span>
</div>
<divclass="cost-display"id="stakeCost">Cost:0HGM</div>
<buttonid="stakeBtn"class="action-btnstake-btn">StakeTokens</button>
</div>

<divclass="action-group">
<label>UnstakeAmount</label>
<divclass="input-group">
<inputtype="number"id="unstakeAmount"placeholder="0"min="1"step="1">
<spanclass="input-suffix">StakingTokens</span>
</div>
<buttonid="unstakeBtn"class="action-btnunstake-btn">UnstakeTokens</button>
</div>

<divclass="action-group">
<buttonid="claimRewardsBtn"class="action-btnclaim-btn">ClaimRewards</button>
</div>
</div>

<divclass="staking-info">
<divclass="info-item">
<span>⚡Stakersget2xrewardswhenvalidatingtransactions</span>
</div>
<divclass="info-item">
<span>⏱Unstakingrequires21-daywaitingperiod</span>
</div>
<divclass="info-item">
<span>Rewardsarecalculatedbasedontime-weightedstaking</span>
</div>
</div>

<divid="stakingMessage"class="staking-message"></div>
</div>
`;

//Waitforbodytobeready
if(document.body){
document.body.appendChild(stakingPanel);
}else{
document.addEventListener('DOMContentLoaded',()=>{
document.body.appendChild(stakingPanel);
});
}

//Createtogglebutton
functioncreateButton(){
//Checkifbuttonalreadyexists
if(document.getElementById('stakingToggle')){
console.log('Stakingbuttonalreadyexists');
return;
}

consttoggleBtn=document.createElement('button');
toggleBtn.id='stakingToggle';
toggleBtn.className='staking-toggle';
toggleBtn.innerHTML='Staking';
toggleBtn.style.cssText='position:fixed!important;top:20px!important;right:20px!important;padding:12px24px!important;background:linear-gradient(135deg,#667eea0%,#764ba2100%)!important;color:white!important;border:none!important;border-radius:25px!important;font-size:16px!important;font-weight:bold!important;cursor:pointer!important;box-shadow:04px15pxrgba(102,126,234,0.4)!important;z-index:99999!important;display:block!important;visibility:visible!important;opacity:1!important;';

if(document.body){
document.body.appendChild(toggleBtn);
console.log('Stakingtogglebuttoncreatedattop-right');
}else{
document.addEventListener('DOMContentLoaded',()=>{
document.body.appendChild(toggleBtn);
console.log('Stakingtogglebuttoncreated(delayed)');
});
}
}

createButton();
}

setupEventListeners(){
//Togglepanel-handlebothexistingbuttonanddynamicallycreatedone
consttoggleBtn=document.getElementById('stakingToggle');
if(toggleBtn){
//Removeanyexistinglistenersbycloning
constnewBtn=toggleBtn.cloneNode(true);
toggleBtn.parentNode.replaceChild(newBtn,toggleBtn);

newBtn.addEventListener('click',()=>{
console.log('Stakingbuttonclicked!');
this.toggle();
});
console.log('Stakingbuttoneventlistenerattached');
}else{
console.error('Stakingtogglebuttonnotfound!');
}

//Closebutton
document.getElementById('closeStaking').addEventListener('click',()=>{
this.close();
});

//Connectwallet
document.getElementById('connectWallet').addEventListener('click',async()=>{
awaitthis.connectWallet();
});

//Stakebutton
document.getElementById('stakeBtn').addEventListener('click',async()=>{
awaitthis.handleStake();
});

//Unstakebutton
document.getElementById('unstakeBtn').addEventListener('click',async()=>{
awaitthis.handleUnstake();
});

//Claimrewardsbutton
document.getElementById('claimRewardsBtn').addEventListener('click',async()=>{
awaitthis.handleClaimRewards();
});

//Updatecostdisplaywhenstakeamountchanges
document.getElementById('stakeAmount').addEventListener('input',(e)=>{
this.updateStakeCost(e.target.value);
});

//Setmaxunstake
document.getElementById('unstakeAmount').addEventListener('focus',()=>{
document.getElementById('unstakeAmount').value=this.stakingData.staked;
});
}

asyncconnectWallet(){
try{
this.showMessage('Connectingwallet...','info');
constaddress=awaitthis.web3.connectWallet();
this.updateWalletStatus(address);
awaitthis.refreshData();
this.showMessage('Walletconnectedsuccessfully!','success');
}catch(error){
this.showMessage(`Connectionfailed:${error.message}`,'error');
}
}

updateWalletStatus(address){
conststatusEl=document.getElementById('walletStatus');
constaddressEl=document.getElementById('walletAddress');
constconnectBtn=document.getElementById('connectWallet');

if(address){
statusEl.querySelector('.status-indicator').style.backgroundColor='#4CAF50';
addressEl.textContent=this.web3.formatAddress(address);
connectBtn.textContent='Connected';
connectBtn.disabled=true;
}else{
statusEl.querySelector('.status-indicator').style.backgroundColor='#f44336';
addressEl.textContent='NotConnected';
connectBtn.textContent='ConnectWallet';
connectBtn.disabled=false;
}
}

asyncrefreshData(){
if(!this.web3.account){
this.updateWalletStatus(null);
return;
}

try{
const[staked,balance,price,enabled]=awaitPromise.all([
this.web3.getUserStakedAmount(),
this.web3.getUserBalance(),
this.web3.getStakingPrice(),
this.web3.isPublicStakingEnabled()
]);

this.stakingData={staked,balance,price,enabled};

document.getElementById('stakedAmount').textContent=`${parseFloat(staked).toFixed(2)}HGM`;
document.getElementById('userBalance').textContent=`${parseFloat(balance).toFixed(2)}HGM`;
document.getElementById('stakingPrice').textContent=`${parseFloat(price).toLocaleString()}HGM`;

//Enable/disablebuttonsbasedonstakingstatus
conststakeBtn=document.getElementById('stakeBtn');
constunstakeBtn=document.getElementById('unstakeBtn');

stakeBtn.disabled=!enabled;
unstakeBtn.disabled=!enabled||parseFloat(staked)===0;

if(!enabled){
this.showMessage('Publicstakingiscurrentlydisabled','warning');
}
}catch(error){
console.error('Errorrefreshingdata:',error);
}
}

updateStakeCost(amount){
constcost=parseFloat(amount||0)*parseFloat(this.stakingData.price);
document.getElementById('stakeCost').textContent=`Cost:${cost.toLocaleString()}HGM`;
}

asynchandleStake(){
constamount=document.getElementById('stakeAmount').value;

if(!amount||parseFloat(amount)<1){
this.showMessage('Pleaseenteravalidstakingamount','error');
return;
}

if(parseFloat(this.stakingData.balance)<parseFloat(amount)*parseFloat(this.stakingData.price)){
this.showMessage('Insufficientbalance','error');
return;
}

try{
this.showMessage('Processingstaketransaction...','info');
consttx=awaitthis.web3.stake(amount);
this.showMessage('Transactionsent!Waitingforconfirmation...','info');

constreceipt=awaitthis.web3.waitForTransaction(tx);
this.showMessage('Stakingsuccessful!','success');

//Updategamewithstakingbonus
if(this.game){
this.game.onStakeSuccess(parseFloat(amount));
}

//Refreshdataandclearinput
document.getElementById('stakeAmount').value='';
awaitthis.refreshData();
}catch(error){
this.showMessage(`Stakingfailed:${error.message}`,'error');
}
}

asynchandleUnstake(){
constamount=document.getElementById('unstakeAmount').value;
conststaked=parseFloat(this.stakingData.staked);

if(!amount||parseFloat(amount)<1){
this.showMessage('Pleaseenteravalidunstakingamount','error');
return;
}

if(parseFloat(amount)>staked){
this.showMessage('Cannotunstakemorethanstakedamount','error');
return;
}

try{
this.showMessage('Processingunstaketransaction...','info');
consttx=awaitthis.web3.unstake(amount);
this.showMessage('Transactionsent!Waitingforconfirmation...','info');

constreceipt=awaitthis.web3.waitForTransaction(tx);
this.showMessage('Unstakingsuccessful!','success');

document.getElementById('unstakeAmount').value='';
awaitthis.refreshData();
}catch(error){
this.showMessage(`Unstakingfailed:${error.message}`,'error');
}
}

asynchandleClaimRewards(){
try{
this.showMessage('Claimingrewards...','info');
consttx=awaitthis.web3.claimRewards();
this.showMessage('Transactionsent!Waitingforconfirmation...','info');

constreceipt=awaitthis.web3.waitForTransaction(tx);
this.showMessage('Rewardsclaimedsuccessfully!','success');

if(this.game){
this.game.onRewardsClaimed();
}

awaitthis.refreshData();
}catch(error){
this.showMessage(`Claimfailed:${error.message}`,'error');
}
}

showMessage(text,type='info'){
constmessageEl=document.getElementById('stakingMessage');
messageEl.textContent=text;
messageEl.className=`staking-message${type}`;
messageEl.style.display='block';

if(type==='success'||type==='error'){
setTimeout(()=>{
messageEl.style.display='none';
},5000);
}
}

toggle(){
console.log('Togglecalled,currentstate:',this.isOpen);
this.isOpen=!this.isOpen;
constpanel=document.getElementById('stakingPanel');
if(!panel){
console.error('Stakingpanelnotfound!');
return;
}

panel.style.display=this.isOpen?'block':'none';
panel.style.zIndex='99998';
console.log('Paneldisplaysetto:',panel.style.display);

if(this.isOpen){
this.refreshData();
}
}

close(){
this.isOpen=false;
document.getElementById('stakingPanel').style.display='none';
}

startDataRefresh(){
//Refreshdataevery30secondswhenpanelisopen
setInterval(()=>{
if(this.isOpen&&this.web3.account){
this.refreshData();
}
},30000);
}
}

if(typeofmodule!=='undefined'&&module.exports){
module.exports=StakingUI;
}

