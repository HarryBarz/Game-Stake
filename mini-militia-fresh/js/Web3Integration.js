/**
*Web3IntegrationforMiniMilitiaGame
*Handleswalletconnection,contractinteractions,andEVVMstaking
*/

classWeb3Integration{
constructor(){
this.provider=null;
this.signer=null;
this.account=null;
this.stakingContract=null;
this.evvmContract=null;
this.chainId=421614;//ArbitrumSepolia
this.evvmID=null;

//Contractaddresses(fromyourdeployment)
this.STAKING_ADDRESS='0xdB11ba5D0233f05a91409fA0C6f8cFBbB03B627b';
this.EVVM_ADDRESS='0x29ba6C233FF3a009Ca8263B4A54545Df2b271c47';
this.PRINCIPAL_TOKEN_ADDRESS='0x0000000000000000000000000000000000000001';

//StakingABI(expandedwithallusefulfunctions)
this.STAKING_ABI=[
"functionpublicStaking(addressuser,boolisStaking,uint256amountOfStaking,uint256nonce,bytesmemorysignature,uint256priorityFee_EVVM,uint256nonce_EVVM,boolpriorityFlag_EVVM,bytesmemorysignature_EVVM)external",
"functiongetUserAmountStaked(address_account)externalviewreturns(uint256)",
"functiongetAddressHistory(address_account)externalviewreturns(tuple(bytes32transactionType,uint256amount,uint256timestamp,uint256totalStaked)[])",
"functiongetAddressHistoryByIndex(address_account,uint256_index)externalviewreturns(tuple(bytes32transactionType,uint256amount,uint256timestamp,uint256totalStaked))",
"functiongetSizeOfAddressHistory(address_account)externalviewreturns(uint256)",
"functiongetAllDataOfAllowPublicStaking()externalviewreturns(tuple(boolflag,uint256timeToAccept))",
"functiongetAllowPresaleStaking()externalviewreturns(tuple(boolflag,uint256timeToAccept))",
"functionpriceOfStaking()externalpurereturns(uint256)",
"functiongimmeYiel(addressuser)externalreturns(bytes32,address,uint256,uint256,uint256)",
"functioncheckIfStakeNonceUsed(address_account,uint256_nonce)externalviewreturns(bool)",
"functiongetTimeToUserUnlockStakingTime(address_account)externalviewreturns(uint256)",
"functiongetTimeToUserUnlockFullUnstakingTime(address_account)externalviewreturns(uint256)",
"functiongetSecondsToUnlockStaking()externalviewreturns(uint256)",
"functiongetSecondsToUnlockFullUnstaking()externalviewreturns(uint256)",
"functiongetEstimatorAddress()externalviewreturns(address)",
"functiongetEvvmAddress()externalviewreturns(address)",
"functiongetOwner()externalviewreturns(address)",
"functiongetGoldenFisher()externalviewreturns(address)",
"functiongetPresaleStaker(address_account)externalviewreturns(bool,uint256)",
"functiongetPresaleStakerCount()externalviewreturns(uint256)"
];

this.EVVM_ABI=[
"functiongetEvvmID()externalviewreturns(uint256)",
"functiongetBalance(addressaccount,addresstoken)externalviewreturns(uint256)",
"functiongetNextCurrentSyncNonce(addressuser)externalviewreturns(uint256)",
"functionaddBalance(addressuser,addresstoken,uint256quantity)external",
"functionisAddressStaker(address_address)externalviewreturns(bool)",
"functiongetRewardAmount()externalviewreturns(uint256)",
"functionpay(addressfrom,addressto_address,stringmemoryto_identity,addresstoken,uint256amount,uint256priorityFee,uint256nonce,boolpriorityFlag,addressexecutor,bytesmemorysignature)external"
];
}

/**
*InitializeWeb3andcheckforMetaMask
*/
asyncinit(){
//Verifyethersisloaded
if(typeofethers==='undefined'){
thrownewError('ethers.jslibrarynotloaded.Pleaserefreshthepage.');
}

//Verifyethers.providersexists(ethersv5)
if(!ethers.providers||!ethers.providers.Web3Provider){
thrownewError('ethers.jsv5notdetected.Pleasecheckthelibraryversion.');
}

if(typeofwindow.ethereum==='undefined'){
console.warn('MetaMasknotdetected.Stakingfeatureswillbelimited.');
return;//Don'tthrow,justreturn-UIwillstillshow
}

try{
//Useethersv5API
this.provider=newethers.providers.Web3Provider(window.ethereum);

//Checkifalreadyconnected
constaccounts=awaitthis.provider.listAccounts();
if(accounts.length>0){
this.signer=this.provider.getSigner();
this.account=awaitthis.signer.getAddress();
awaitthis.setupContracts();
}
}catch(error){
console.warn('Web3initializationwarning:',error);
//Don'tthrow-allowUItoshowanyway
}
}

/**
*Connectwallet
*/
asyncconnectWallet(){
try{
//Verifyethersisloaded
if(typeofethers==='undefined'){
thrownewError('ethers.jslibrarynotloaded.Pleaserefreshthepage.');
}

//Verifyethers.providersexists(ethersv5)
if(!ethers.providers||!ethers.providers.Web3Provider){
thrownewError('ethers.jsv5notdetected.Pleasecheckthelibraryversion.');
}

if(typeofwindow.ethereum==='undefined'){
thrownewError('MetaMasknotdetected');
}

//Requestaccountaccess
awaitwindow.ethereum.request({method:'eth_requestAccounts'});

this.provider=newethers.providers.Web3Provider(window.ethereum);
this.signer=this.provider.getSigner();
this.account=awaitthis.signer.getAddress();

//Checknetwork
constnetwork=awaitthis.provider.getNetwork();
if(Number(network.chainId)!==this.chainId){
awaitthis.switchNetwork();
}

awaitthis.setupContracts();
returnthis.account;
}catch(error){
console.error('Walletconnectionerror:',error);
throwerror;
}
}

/**
*SwitchtoArbitrumSepolianetwork
*/
asyncswitchNetwork(){
try{
awaitwindow.ethereum.request({
method:'wallet_switchEthereumChain',
params:[{chainId:`0x${this.chainId.toString(16)}`}],
});
}catch(switchError){
//Chaindoesn'texist,addit
if(switchError.code===4902){
awaitwindow.ethereum.request({
method:'wallet_addEthereumChain',
params:[{
chainId:`0x${this.chainId.toString(16)}`,
chainName:'ArbitrumSepolia',
nativeCurrency:{
name:'ETH',
symbol:'ETH',
decimals:18
},
rpcUrls:['https://sepolia-rollup.arbitrum.io/rpc'],
blockExplorerUrls:['https://sepolia.arbiscan.io']
}],
});
}else{
throwswitchError;
}
}
}

/**
*Setupcontractinstances
*/
asyncsetupContracts(){
this.stakingContract=newethers.Contract(
this.STAKING_ADDRESS,
this.STAKING_ABI,
this.signer
);

this.evvmContract=newethers.Contract(
this.EVVM_ADDRESS,
this.EVVM_ABI,
this.signer
);

//GetEVVMID-CRITICAL:Mustmatchwhatcontractuses
try{
constid=awaitthis.evvmContract.getEvvmID();
constidStr=id.toString();
//IfIDis0,itmeansithasn'tbeensetyet
if(idStr==='0'){
console.error('EVVMIDis0oncontract!YoumustcallsetEvvmID(1078)ontheEVVMcontractfirst.');
thrownewError('EVVMIDnotsetoncontract.PleasecallsetEvvmID(1078)ontheEVVMcontract.');
}
this.evvmID=idStr;
console.log('EVVMIDfetchedfromcontract:',this.evvmID);
}catch(error){
console.error('CouldnotfetchEVVMID:',error);
thrownewError('FailedtofetchEVVMIDfromcontract.PleaseensurethecontractisproperlydeployedandEVVMIDisset.');
}
}

/**
*Checkifpublicstakingisenabled
*/
asyncisPublicStakingEnabled(){
try{
constdata=awaitthis.stakingContract.getAllDataOfAllowPublicStaking();
returndata.flag;
}catch(error){
console.error('Errorcheckingstakingstatus:',error);
returnfalse;
}
}

/**
*Getuser'sstakedamount
*/
asyncgetUserStakedAmount(){
if(!this.account)return0;
try{
constamount=awaitthis.stakingContract.getUserAmountStaked(this.account);
returnethers.utils.formatEther(amount);
}catch(error){
console.error('Errorgettingstakedamount:',error);
return0;
}
}

/**
*Getstakingprice(MATEtokensperstakingtoken)
*/
asyncgetStakingPrice(){
try{
constprice=awaitthis.stakingContract.priceOfStaking();
returnethers.utils.formatEther(price);
}catch(error){
console.error('Errorgettingstakingprice:',error);
return'5083';//Default:5083MATEperstakingtoken
}
}

/**
*Getuser'sbalanceinEVVM
*/
asyncgetUserBalance(){
if(!this.account)return'0';
try{
constbalance=awaitthis.evvmContract.getBalance(
this.account,
this.PRINCIPAL_TOKEN_ADDRESS
);
returnethers.utils.formatEther(balance);
}catch(error){
console.error('Errorgettingbalance:',error);
return'0';
}
}

/**
*GenerateEIP-191signatureforstaking
*Messageformat:{evvmID},publicStaking,{isStaking},{amount},{nonce}
*Whereamountisthestakingtokenamount(notinwei,justthenumberasstring)
*/
asyncgenerateStakingSignature(isStaking,amount,nonce){
if(!this.signer){
thrownewError('Walletnotconnected');
}

//EnsureEVVMIDisset
if(!this.evvmID||this.evvmID==='0'){
thrownewError('EVVMIDnotset.Pleaseensurethecontractisproperlyinitialized.');
}

//CRITICAL:ContractusesStrings.toString()whichconvertsuint256todecimalstring
//Amountandnoncecomeinasnumbers,converttostringsformessage
constamountNum=Math.floor(Number(amount));
constnonceNum=Math.floor(Number(nonce));

if(amountNum<=0){
thrownewError('Amountmustbeapositiveinteger');
}

//ConverttostringsexactlyascontractdoeswithStrings.toString()
constamountStr=amountNum.toString();
constnonceStr=nonceNum.toString();

//CRITICAL:MessageformatmustmatchcontractEXACTLY
//Contract:SignatureRecover.signatureVerification(
//Strings.toString(evvmID),//"1078"
//"publicStaking",
//string.concat("true",",",Strings.toString(amount),",",Strings.toString(nonce))
//)
//Final:"{evvmID},publicStaking,true,{amount},{nonce}"
constmessage=`${this.evvmID},publicStaking,${isStaking?'true':'false'},${amountStr},${nonceStr}`;

console.log('Generatingstakingsignaturewith:');
console.log('-EVVMID:',this.evvmID);
console.log('-Message:',message);
console.log('-Amount:',amountStr,'(stakingtokens)');
console.log('-Nonce:',nonceStr);

constsignature=awaitthis.signer.signMessage(message);
console.log('-Signaturegenerated:',signature.substring(0,20)+'...');

returnsignature;
}

/**
*GenerateEVVMpaymentsignature(forstakingpayment)
*Format:{evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
*
*CRITICAL:TheexecutormustbetheStakingcontractaddress,nottheuser'saddress!
*TheStakingcontractcallspay()withexecutor=address(this),sothesignaturemustmatch.
*/
asyncgenerateEVVMSignature(amount,nonce,priorityFee=0,isAsync=false){
if(!this.signer){
thrownewError('Walletnotconnected');
}

//EnsureEVVMIDisset
if(!this.evvmID||this.evvmID==='0'){
thrownewError('EVVMIDnotset.Pleaseensurethecontractisproperlyinitialized.');
}

//Convertaddressestochecksumformat(ethersv5)
//CRITICAL:ContractusesAdvancedStrings.addressToString()whichconvertstolowercase
//Butethers.utils.getAddress()returnschecksummed.Weneedlowercase!
constreceiver=this.STAKING_ADDRESS.toLowerCase();
consttoken=this.PRINCIPAL_TOKEN_ADDRESS.toLowerCase();
//CRITICAL:ExecutormustbeStakingcontractaddress,notuseraddress!
constexecutor=this.STAKING_ADDRESS.toLowerCase();

//Messageformat:{evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
//CRITICAL:amountisBigNumber,converttostringwithoutdecimals
constamountStr=typeofamount==='object'&&amount.toString?amount.toString():amount.toString();
constmessage=`${this.evvmID},pay,${receiver},${token},${amountStr},${priorityFee.toString()},${nonce.toString()},${isAsync?'true':'false'},${executor}`;

console.log('GeneratingEVVMsignaturewith:');
console.log('-EVVMID:',this.evvmID);
console.log('-Message:',message);
console.log('-Amount:',amountStr,'(wei)');
console.log('-Nonce:',nonce.toString());
console.log('-Receiver:',receiver);
console.log('-Executor:',executor);

constsignature=awaitthis.signer.signMessage(message);
console.log('-Signaturegenerated:',signature.substring(0,20)+'...');

returnsignature;
}

/**
*GetnextsyncnoncefromEVVM(forsyncpayments)
*ThisisCRITICAL-syncpaymentsmustusetheexactnoncefromthecontract
*/
asyncgetNextSyncNonce(){
if(!this.account||!this.evvmContract){
thrownewError('Walletnotconnected');
}
try{
constnonce=awaitthis.evvmContract.getNextCurrentSyncNonce(this.account);
returnnonce.toString();
}catch(error){
console.error('Errorgettingsyncnonce:',error);
thrownewError('Failedtogetsyncnonce.Pleasetryagain.');
}
}

/**
*StakeHGMtokens(convertstostakingtokensautomatically)
*@param{string}hgmAmount-AmountinHGMtokens
*/
asyncstakeHGM(hgmAmount){
if(!this.account){
thrownewError('Walletnotconnected');
}

try{
//Getstakingprice
constprice=awaitthis.getStakingPrice();
constpriceNum=parseFloat(price);
consthgmNum=parseFloat(hgmAmount);

if(hgmNum<=0){
thrownewError('Amountmustbegreaterthan0');
}

//ConvertHGMtostakingtokens
conststakingTokens=hgmNum/priceNum;

//Rounddowntowholestakingtokens(contractrequiresintegeramounts)
conststakingTokensWhole=Math.floor(stakingTokens);

if(stakingTokensWhole<=0){
thrownewError(`Amounttoosmall.Minimum:${priceNum}HGMfor1stakingtoken`);
}

console.log(`Staking${hgmNum}HGM=${stakingTokensWhole}stakingtokens`);

//Usethestakefunctionwithwholestakingtokens
returnawaitthis.stake(stakingTokensWhole.toString());
}catch(error){
console.error('StakeHGMerror:',error);
throwerror;
}
}

/**
*Staketokens(instakingtokens)
*@param{string}amount-Amountinstakingtokens
*/
asyncstake(amount){
if(!this.account){
thrownewError('Walletnotconnected');
}

try{
//EnsurecontractsaresetupandEVVMIDisfetched
if(!this.evvmContract||!this.stakingContract){
awaitthis.setupContracts();
}

//CRITICAL:FetchEVVMIDfromcontract-signatureMUSTusethesameIDascontract
try{
constid=awaitthis.evvmContract.getEvvmID();
this.evvmID=id.toString();
console.log('FetchedEVVMIDfromcontract:',this.evvmID);

if(this.evvmID==='0'){
thrownewError('EVVMIDis0.PleasecallsetEvvmID(1078)ontheEVVMcontractfirst.Thecontractaddressis:'+this.EVVM_ADDRESS);
}
}catch(e){
if(e.message&&e.message.includes('setEvvmID')){
throwe;//Re-throwthesetEvvmIDerror
}
console.error('CouldnotfetchEVVMID:',e);
thrownewError('FailedtofetchEVVMIDfromcontract.Pleaseensurethecontractisproperlydeployed.');
}

//Checkifpublicstakingisenabled
constisEnabled=awaitthis.isPublicStakingEnabled();
if(!isEnabled){
thrownewError('Publicstakingiscurrentlydisabled.Pleasetryagainlater.');
}
console.log('Publicstakingisenabled:',isEnabled);

//Getstakingprice
constprice=awaitthis.getStakingPrice();
consttotalAmount=ethers.utils.parseEther((parseFloat(amount)*parseFloat(price)).toString());

//Convertamounttointeger(stakingtokensmustbewholenumbers)
constamountNum=parseFloat(amount);
constamountForContract=Math.floor(amountNum);//Contractexpectsintegerstakingtokens

if(amountForContract<=0){
thrownewError('Stakingamountmustbeatleast1stakingtoken');
}

//CRITICAL:FetchEVVMIDfreshfromcontract-contractusesthisexactvalue
constid=awaitthis.evvmContract.getEvvmID();
constevvmIDForSignature=id.toString();
if(evvmIDForSignature==='0'){
thrownewError('EVVMIDis0.CallsetEvvmID(1078)onEVVMcontract:'+this.EVVM_ADDRESS);
}
this.evvmID=evvmIDForSignature;

constuserAddress=ethers.utils.getAddress(this.account);

//Generateauniquestakingnonce-usetimestamp+randomtoavoidcollisions
//Keeptryinguntilwefindanunusednonce
letstakingNonceNum;
letattempts=0;
constmaxAttempts=10;
do{
//Usetimestamp+randomcomponenttoensureuniqueness
stakingNonceNum=Date.now()+Math.floor(Math.random()*1000000);
constisUsed=awaitthis.stakingContract.checkIfStakeNonceUsed(userAddress,stakingNonceNum);
if(!isUsed){
break;
}
attempts++;
if(attempts>=maxAttempts){
thrownewError('Couldnotgenerateauniquenonce.Pleasetryagain.');
}
//Waitabitbeforeretrying
awaitnewPromise(resolve=>setTimeout(resolve,100));
}while(true);

console.log('Generateduniquestakingnonce:',stakingNonceNum);

//GetEVVMsyncnonce
constevvmNonce=awaitthis.getNextSyncNonce();
constevvmNonceNum=Number(evvmNonce);
console.log('EVVMsyncnonce:',evvmNonceNum);

//Buildexactmessagethatcontractwillverify
//Contract:string.concat(evvmID,",","publicStaking",",",string.concat("true",",",amount,",",nonce))
constexpectedMessage=`${evvmIDForSignature},publicStaking,true,${amountForContract},${stakingNonceNum}`;
console.log('Expectedsignaturemessage:',expectedMessage);
console.log('Messagelength:',expectedMessage.length);

//Generatesignatures
console.log('Generatingstakingsignature...');
conststakingSignature=awaitthis.generateStakingSignature(true,amountForContract,stakingNonceNum);
console.log('Stakingsignaturegenerated');

console.log('GeneratingEVVMsignature...');
constevvmSignature=awaitthis.generateEVVMSignature(
totalAmount,
evvmNonceNum,
0,
false
);
console.log('EVVMsignaturegenerated');

//Verifybalancebeforeattemptingtransaction
constbalance=awaitthis.getUserBalance();
constbalanceNum=parseFloat(balance);
constrequiredAmount=parseFloat(amount)*parseFloat(price);
console.log(`Balance:${balanceNum}HGM,Required:${requiredAmount}HGM`);

if(balanceNum<requiredAmount){
thrownewError(`Insufficientbalance.Youhave${balanceNum.toFixed(4)}HGM,butneed${requiredAmount.toFixed(4)}HGM`);
}

console.log('Sendingtransaction...');
consttx=awaitthis.stakingContract.publicStaking(
userAddress,
true,
amountForContract,
stakingNonceNum,
stakingSignature,
0,
evvmNonceNum,
false,
evvmSignature
);

returntx;
}catch(error){
console.error('Stakingerror:',error);

//Trytodecodetheerrorforbetteruserfeedback
if(error.message&&error.message.includes('executionreverted')){
//Checkforspecificerrorreasons
if(error.message.includes('InvalidSignature')||error.data==='0x8baa579f'){
thrownewError('Invalidsignature.Thisusuallymeans:\n1.EVVMIDmismatch-ensureEVVMIDissetcorrectlyoncontract\n2.Messageformatmismatch-pleaserefreshandtryagain\n3.Noncealreadyused-tryagainwithanewtransaction');
}
if(error.message.includes('StakingNonceAlreadyUsed')){
thrownewError('Thisnoncehasalreadybeenused.Pleasetryagain.');
}
if(error.message.includes('InsufficientBalance')){
thrownewError('Insufficientbalance.PleaseensureyouhaveenoughHGMtokens.');
}
if(error.message.includes('PublicStakingDisabled')){
thrownewError('Publicstakingiscurrentlydisabled.');
}
thrownewError('Transactionfailed.Checkconsolefordetails.Possibleissues:Invalidsignature,insufficientbalance,noncealreadyused,orpublicstakingdisabled.');
}
throwerror;
}
}

/**
*Unstaketokens
*/
asyncunstake(amount){
if(!this.account){
thrownewError('Walletnotconnected');
}

try{
//Checkunlocktimes
constunlockTimes=awaitthis.getUnlockTimes();
conststaked=awaitthis.getUserStakedAmount();
conststakedNum=parseFloat(staked);

//Checkiftryingtounstakealltokens
constamountNum=parseFloat(amount);
constamountForContract=Math.floor(amountNum);

if(amountForContract<=0){
thrownewError('Unstakingamountmustbeatleast1stakingtoken');
}

if(amountForContract>stakedNum){
thrownewError(`Cannotunstake${amountForContract}tokens.Youonlyhave${stakedNum}staked.`);
}

//Checkiffullunstake(alltokens)
constisFullUnstake=amountForContract>=stakedNum;

if(isFullUnstake&&!unlockTimes.canUnstake){
constunlockDate=unlockTimes.fullUnstakeUnlockDate;
thrownewError(`Fullunstakingislockeduntil${unlockDate?unlockDate.toLocaleString():'unknown'}.Youcanonlypartiallyunstakefornow.`);
}

//Generateuniquenonce
letstakingNonceNum;
letattempts=0;
constmaxAttempts=10;
do{
stakingNonceNum=Date.now()+Math.floor(Math.random()*1000000);
constisUsed=awaitthis.stakingContract.checkIfStakeNonceUsed(this.account,stakingNonceNum);
if(!isUsed){
break;
}
attempts++;
if(attempts>=maxAttempts){
thrownewError('Couldnotgenerateauniquenonce.Pleasetryagain.');
}
awaitnewPromise(resolve=>setTimeout(resolve,100));
}while(true);

constevvmNonce=awaitthis.getNextSyncNonce();
constevvmNonceNum=Number(evvmNonce);

console.log('🔓Unstakingwith:');
console.log('-Amount:',amountForContract,'stakingtokens');
console.log('-Nonce:',stakingNonceNum);
console.log('-Isfullunstake:',isFullUnstake);

conststakingSignature=awaitthis.generateStakingSignature(false,amountForContract,stakingNonceNum);
//Forunstaking,westillneedEVVMsignaturebutamountis0(nopaymentneeded)
constevvmSignature=awaitthis.generateEVVMSignature(
'0',//amount=0forunstaking
0,//priorityfee(optional)
evvmNonceNum,//nonce
false//sync
);

consttx=awaitthis.stakingContract.publicStaking(
this.account,
false,//isStaking
amountForContract,//amountOfStaking(mustbeinteger,instakingtokens)
stakingNonceNum,
stakingSignature,
0,//priorityFee_EVVM(optionalforunstaking)
evvmNonceNum,
false,//priorityFlag_EVVM
evvmSignature
);

returntx;
}catch(error){
console.error('Unstakingerror:',error);
throwerror;
}
}

/**
*Claimrewards
*/
asyncclaimRewards(){
if(!this.account){
thrownewError('Walletnotconnected');
}

try{
consttx=awaitthis.stakingContract.gimmeYiel(this.account);
returntx;
}catch(error){
console.error('Claimrewardserror:',error);
throwerror;
}
}

/**
*Getstakinghistory
*/
asyncgetStakingHistory(){
if(!this.account)return[];
try{
consthistory=awaitthis.stakingContract.getAddressHistory(this.account);
returnhistory.map(item=>({
type:item.transactionType,
amount:ethers.utils.formatEther(item.amount),
timestamp:Number(item.timestamp),
totalStaked:ethers.utils.formatEther(item.totalStaked)
}));
}catch(error){
console.error('Errorgettinghistory:',error);
return[];
}
}

/**
*GettestHGMtokensfromfaucet(testnetonly)
*ThiscallstheaddBalancefunctiononEVVMcontract
*/
asyncgetTestHGM(){
if(!this.account){
thrownewError('Walletnotconnected');
}

if(!this.evvmContract){
awaitthis.setupContracts();
}

try{
//Give10,000HGM(enoughfor~2stakingtokens)
constamount=ethers.utils.parseEther('10000');

//CalladdBalanceonEVVMcontract(faucetfunction)
consttx=awaitthis.evvmContract.addBalance(
this.account,
this.PRINCIPAL_TOKEN_ADDRESS,
amount
);

returntx;
}catch(error){
console.error('ErrorgettingtestHGM:',error);
throwerror;
}
}

/**
*Waitfortransactionconfirmationwithstatusupdates
*/
asyncwaitForTransaction(tx,onStatusUpdate=null){
if(onStatusUpdate){
onStatusUpdate('pending','Transactionsubmitted,waitingforconfirmation...');
}

try{
constreceipt=awaittx.wait();

if(onStatusUpdate){
onStatusUpdate('confirmed','Transactionconfirmed!');
}

returnreceipt;
}catch(error){
if(onStatusUpdate){
onStatusUpdate('failed','Transactionfailed:'+error.message);
}
throwerror;
}
}

/**
*Gettransactionstatus
*/
asyncgetTransactionStatus(txHash){
try{
constreceipt=awaitthis.provider.getTransactionReceipt(txHash);
if(receipt){
return{
status:receipt.status===1?'success':'failed',
blockNumber:receipt.blockNumber,
gasUsed:receipt.gasUsed.toString(),
confirmations:receipt.confirmations
};
}
return{status:'pending'};
}catch(error){
return{status:'error',error:error.message};
}
}

/**
*Getuser'sstakingtierbasedonstakedamount
*/
asyncgetStakingTier(){
if(!this.account)return0;

try{
conststaked=awaitthis.getUserStakedAmount();
conststakedNum=parseFloat(staked);

//Definetierthresholds(adjustbasedonyourgamedesign)
if(stakedNum>=100)return5;//Tier5:100+stakingtokens
if(stakedNum>=50)return4;//Tier4:50-99
if(stakedNum>=25)return3;//Tier3:25-49
if(stakedNum>=10)return2;//Tier2:10-24
if(stakedNum>=1)return1;//Tier1:1-9
return0;//Notier
}catch(error){
console.error('Errorgettingstakingtier:',error);
return0;
}
}

/**
*Getunlocktimesforstakingoperations
*/
asyncgetUnlockTimes(){
if(!this.account){
//Defaulttoallowingifnotconnected(willbecheckedelsewhere)
return{
canStake:true,
canUnstake:false,
stakeUnlockTime:0,
fullUnstakeUnlockTime:0
};
}

if(!this.stakingContract){
console.warn('Stakingcontractnotinitialized');
//Defaulttoallowingifcontractnotready
return{
canStake:true,
canUnstake:false,
stakeUnlockTime:0,
fullUnstakeUnlockTime:0
};
}

try{
conststakeUnlockTime=awaitthis.stakingContract.getTimeToUserUnlockStakingTime(this.account);
constfullUnstakeUnlockTime=awaitthis.stakingContract.getTimeToUserUnlockFullUnstakingTime(this.account);
constcurrentTime=Math.floor(Date.now()/1000);

conststakeUnlock=Number(stakeUnlockTime);
constfullUnstakeUnlock=Number(fullUnstakeUnlockTime);

return{
canStake:stakeUnlock===0||stakeUnlock<=currentTime,
canUnstake:fullUnstakeUnlock===0||fullUnstakeUnlock<=currentTime,
stakeUnlockTime:stakeUnlock,
fullUnstakeUnlockTime:fullUnstakeUnlock,
stakeUnlockDate:stakeUnlock>0?newDate(stakeUnlock*1000):null,
fullUnstakeUnlockDate:fullUnstakeUnlock>0?newDate(fullUnstakeUnlock*1000):null
};
}catch(error){
console.error('Errorgettingunlocktimes:',error);
//Onerror,defaulttoallowingstaking(betterUX)
return{
canStake:true,
canUnstake:false,
stakeUnlockTime:0,
fullUnstakeUnlockTime:0
};
}
}

/**
*Getestimatedrewards(ifavailablefromestimator)
*Note:Thisrequirescallingthecontractwhichmayconsumegas
*/
asyncgetEstimatedRewards(){
if(!this.account)returnnull;

try{
//Checkifuserhasstakinghistoryfirst
consthistory=awaitthis.getStakingHistory();
if(!history||history.length===0){
returnnull;
}

//Note:gimmeYielactuallyclaimsrewards,sowecan'tjust"estimate"
//Instead,we'llcheckthehistoryforrewardtransactions
constrewardTransactions=history.filter(h=>
h.type!=='0x0000000000000000000000000000000000000000000000000000000000000001'&&//notstake
h.type!=='0x0000000000000000000000000000000000000000000000000000000000000002'//notunstake
);

if(rewardTransactions.length>0){
constlatestReward=rewardTransactions[rewardTransactions.length-1];
return{
hasRewards:true,
latestReward:{
type:latestReward.type,
amount:latestReward.amount,
timestamp:latestReward.timestamp
},
totalRewardTransactions:rewardTransactions.length
};
}

return{
hasRewards:false,
message:'Norewardsavailableyet.Keepstakingtoearnrewards!'
};
}catch(error){
console.log('Rewardcheckerror:',error.message);
returnnull;
}
}

/**
*Getcompletestakinginformation
*/
asyncgetCompleteStakingInfo(){
if(!this.account)returnnull;

try{
const[
staked,
balance,
price,
enabled,
tier,
unlockTimes,
history,
isStaker
]=awaitPromise.all([
this.getUserStakedAmount(),
this.getUserBalance(),
this.getStakingPrice(),
this.isPublicStakingEnabled(),
this.getStakingTier(),
this.getUnlockTimes(),
this.getStakingHistory(),
this.evvmContract.isAddressStaker(this.account)
]);

return{
staked:parseFloat(staked),
balance:parseFloat(balance),
price:parseFloat(price),
enabled,
tier,
unlockTimes,
history,
isStaker,
canPlay:parseFloat(staked)>0&&enabled
};
}catch(error){
console.error('Errorgettingcompletestakinginfo:',error);
returnnull;
}
}

/**
*Listentocontractevents(usingtransactionreceiptssincecontractdoesn'temitevents)
*/
asyncwatchTransaction(txHash,onUpdate=null){
returnnewPromise((resolve,reject)=>{
constcheckInterval=setInterval(async()=>{
try{
constreceipt=awaitthis.provider.getTransactionReceipt(txHash);
if(receipt){
clearInterval(checkInterval);

if(receipt.status===1){
if(onUpdate)onUpdate('confirmed',receipt);
resolve(receipt);
}else{
if(onUpdate)onUpdate('failed',receipt);
reject(newError('Transactionfailed'));
}
}elseif(onUpdate){
onUpdate('pending',null);
}
}catch(error){
clearInterval(checkInterval);
reject(error);
}
},2000);//Checkevery2seconds

//Timeoutafter5minutes
setTimeout(()=>{
clearInterval(checkInterval);
reject(newError('Transactiontimeout'));
},300000);
});
}

/**
*Formataddressfordisplay
*/
formatAddress(address){
if(!address)return'';
return`${address.slice(0,6)}...${address.slice(-4)}`;
}

/**
*Batchgetstakinginfoformultipleaddresses
*Usefulforleaderboardsoradminviews
*/
asyncgetBatchStakingInfo(addresses){
if(!addresses||addresses.length===0)return[];

if(!this.stakingContract){
console.warn('Stakingcontractnotinitialized');
returnaddresses.map(addr=>({address:addr,staked:0,tier:0}));
}

try{
constpromises=addresses.map(async(address)=>{
try{
conststaked=awaitthis.stakingContract.getUserAmountStaked(address);
consttier=awaitthis.getStakingTierForAddress(address);
return{
address,
staked:parseFloat(ethers.utils.formatEther(staked)),
tier
};
}catch(error){
console.error(`Errorgettinginfofor${address}:`,error);
return{
address,
staked:0,
tier:0,
error:error.message
};
}
});

returnawaitPromise.all(promises);
}catch(error){
console.error('Batchstakinginfoerror:',error);
return[];
}
}

/**
*Getstakingtierforaspecificaddress
*/
asyncgetStakingTierForAddress(address){
if(!this.stakingContract){
console.warn('Stakingcontractnotinitialized');
return0;
}

try{
conststaked=awaitthis.stakingContract.getUserAmountStaked(address);
conststakedNum=parseFloat(ethers.utils.formatEther(staked));

if(stakedNum>=100)return5;
if(stakedNum>=50)return4;
if(stakedNum>=25)return3;
if(stakedNum>=10)return2;
if(stakedNum>=1)return1;
return0;
}catch(error){
console.error('Errorgettingtier:',error);
return0;
}
}

/**
*Getleaderboard(topstakers)
*Note:Thisrequiresknowingaddressesorusinganindexer
*/
asyncgetLeaderboard(addresses,limit=10){
constinfo=awaitthis.getBatchStakingInfo(addresses);

//Sortbystakedamountdescending
info.sort((a,b)=>b.staked-a.staked);

//ReturntopN
returninfo.slice(0,limit).map((item,index)=>({
rank:index+1,
...item
}));
}

/**
*CalculateHGMneededforstakingtokens
*/
calculateHGMForStaking(stakingTokens){
constprice=5083;//PRICE_OF_STAKING/10^18
returnstakingTokens*price;
}

/**
*CalculatestakingtokensfromHGM
*/
calculateStakingFromHGM(hgmAmount){
constprice=5083;
returnhgmAmount/price;
}

/**
*Getcontractconfiguration
*/
asyncgetContractConfig(){
try{
const[
stakingPrice,
publicStakingEnabled,
stakeUnlockSeconds,
fullUnstakeUnlockSeconds,
evvmID
]=awaitPromise.all([
this.getStakingPrice(),
this.isPublicStakingEnabled(),
this.stakingContract.getSecondsToUnlockStaking(),
this.stakingContract.getSecondsToUnlockFullUnstaking(),
this.evvmContract.getEvvmID()
]);

return{
stakingPrice:parseFloat(stakingPrice),
publicStakingEnabled,
stakeUnlockSeconds:Number(stakeUnlockSeconds),
fullUnstakeUnlockSeconds:Number(fullUnstakeUnlockSeconds),
evvmID:evvmID.toString(),
stakingAddress:this.STAKING_ADDRESS,
evvmAddress:this.EVVM_ADDRESS,
chainId:this.chainId
};
}catch(error){
console.error('Errorgettingcontractconfig:',error);
returnnull;
}
}
}

//Exportforuseinotherfiles
if(typeofmodule!=='undefined'&&module.exports){
module.exports=Web3Integration;
}

