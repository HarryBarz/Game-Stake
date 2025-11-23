/**
 * Landing Page Controller
 * Manages the flow: Landing → Connect Wallet → Staking UI → Game
 */

class LandingPage {
    constructor(web3Integration) {
        this.web3 = web3Integration;
        this.init();
    }

    init() {
        // Show landing page initially
        document.getElementById('landingPage').style.display = 'flex';
        document.getElementById('stakingPage').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'none';

        // Setup connect wallet button
        const connectBtn = document.getElementById('connectWalletLanding');
        connectBtn.addEventListener('click', () => this.connectWallet());

        // Setup start game button
        const startGameBtn = document.getElementById('startGameBtn');
        startGameBtn.addEventListener('click', () => this.startGame());

        // Check if already connected
        if (this.web3 && this.web3.account) {
            this.showStakingPage();
        }
    }

    async connectWallet() {
        const connectBtn = document.getElementById('connectWalletLanding');
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';

        try {
            // Check if ethers is loaded
            if (typeof ethers === 'undefined') {
                throw new Error('ethers.js library not loaded. Please refresh the page.');
            }

            if (!this.web3) {
                this.web3 = new Web3Integration();
            }

            await this.web3.connectWallet();
            
            // Show wallet address
            const walletStatus = document.getElementById('walletStatusLanding');
            const walletAddress = document.getElementById('walletAddressLanding');
            walletStatus.style.display = 'block';
            walletAddress.textContent = this.web3.account;

            // Show staking page
            this.showStakingPage();

        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect wallet: ' + error.message);
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect Wallet';
        }
    }

    showStakingPage() {
        // Hide landing page
        document.getElementById('landingPage').style.display = 'none';
        
        // Show staking page
        document.getElementById('stakingPage').style.display = 'block';

        // Initialize staking UI
        if (!window.stakingUI) {
            window.stakingUI = new StakingUI(this.web3, null);
        }

        // Setup staking buttons
        this.setupStakingButtons();

        // Refresh staking data
        this.refreshStakingData();
    }

    setupStakingButtons() {
        // Stake button - now accepts HGM amount
        document.getElementById('stakeBtnFull').addEventListener('click', async () => {
            const hgmAmount = document.getElementById('stakeAmountFull').value;
            if (!hgmAmount || parseFloat(hgmAmount) <= 0) {
                this.showMessage('Please enter a valid HGM amount to stake', 'error');
                return;
            }

            try {
                // Check balance
                const balance = parseFloat(this.stakingData?.balance || 0);
                if (parseFloat(hgmAmount) > balance) {
                    this.showMessage(`Insufficient balance. You have ${balance.toFixed(4)} HGM`, 'error');
                    return;
                }

                this.showMessage('Processing stake transaction...', 'info');
                
                // Convert HGM to staking tokens and stake
                const tx = await this.web3.stakeHGM(hgmAmount);
                this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
                
                const receipt = await this.web3.waitForTransaction(tx);
                this.showMessage('Staking successful!', 'success');
                
                document.getElementById('stakeAmountFull').value = '';
                await this.refreshStakingData();
            } catch (error) {
                console.error('Staking error:', error);
                this.showMessage(`Staking failed: ${error.message}`, 'error');
            }
        });

        // Unstake button
        document.getElementById('unstakeBtnFull').addEventListener('click', async () => {
            const amount = document.getElementById('unstakeAmountFull').value;
            if (!amount || parseFloat(amount) < 1) {
                this.showMessage('Please enter a valid unstaking amount', 'error');
                return;
            }

            try {
                this.showMessage('Processing unstake transaction...', 'info');
                const tx = await this.web3.unstake(amount);
                this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
                
                const receipt = await this.web3.waitForTransaction(tx);
                this.showMessage('Unstaking successful!', 'success');
                
                document.getElementById('unstakeAmountFull').value = '';
                await this.refreshStakingData();
            } catch (error) {
                this.showMessage(`Unstaking failed: ${error.message}`, 'error');
            }
        });

        // Claim rewards button
        document.getElementById('claimRewardsBtnFull').addEventListener('click', async () => {
            try {
                this.showMessage('Claiming rewards...', 'info');
                const tx = await this.web3.claimRewards();
                this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
                
                const receipt = await this.web3.waitForTransaction(tx);
                this.showMessage('Rewards claimed successfully!', 'success');
                
                await this.refreshStakingData();
            } catch (error) {
                this.showMessage(`Claim failed: ${error.message}`, 'error');
            }
        });

        // Get HGM button (faucet)
        document.getElementById('getHGMBtn').addEventListener('click', async () => {
            try {
                const btn = document.getElementById('getHGMBtn');
                btn.disabled = true;
                btn.textContent = 'Getting HGM...';
                
                this.showMessage('Requesting test HGM tokens from faucet...', 'info');
                const tx = await this.web3.getTestHGM();
                this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
                
                const receipt = await this.web3.waitForTransaction(tx);
                this.showMessage('Successfully received 10,000 HGM test tokens!', 'success');
                
                btn.disabled = false;
                btn.textContent = '💧 Get Test HGM';
                
                await this.refreshStakingData();
            } catch (error) {
                const btn = document.getElementById('getHGMBtn');
                btn.disabled = false;
                btn.textContent = '💧 Get Test HGM';
                this.showMessage(`Failed to get HGM: ${error.message}`, 'error');
            }
        });

        // Update stake tokens calculation on input (HGM -> Staking Tokens)
        document.getElementById('stakeAmountFull').addEventListener('input', (e) => {
            const hgmAmount = parseFloat(e.target.value) || 0;
            const price = parseFloat(this.stakingData?.price || 5083);
            if (hgmAmount > 0 && price > 0) {
                const stakingTokens = hgmAmount / price;
                document.getElementById('stakeTokensFull').textContent = `= ${stakingTokens.toFixed(6)} Staking Tokens`;
            } else {
                document.getElementById('stakeTokensFull').textContent = `= 0 Staking Tokens`;
            }
        });

        // Update unstake value calculation on input (Staking Tokens -> HGM)
        document.getElementById('unstakeAmountFull').addEventListener('input', (e) => {
            const stakingTokens = parseFloat(e.target.value) || 0;
            const price = parseFloat(this.stakingData?.price || 5083);
            if (stakingTokens > 0 && price > 0) {
                const hgmValue = stakingTokens * price;
                document.getElementById('unstakeValueFull').textContent = `= ${hgmValue.toLocaleString(undefined, {maximumFractionDigits: 4})} HGM`;
            } else {
                document.getElementById('unstakeValueFull').textContent = `= 0 HGM`;
            }
        });
    }

    async refreshStakingData() {
        if (!this.web3 || !this.web3.account) return;

        try {
            const staked = await this.web3.getUserStakedAmount();
            const balance = await this.web3.getUserBalance();
            const price = await this.web3.getStakingPrice();
            const enabled = await this.web3.isPublicStakingEnabled();

            this.stakingData = { staked, balance, price, enabled };

            // Update UI
            document.getElementById('stakedAmountFull').textContent = parseFloat(staked).toFixed(2);
            document.getElementById('userBalanceFull').textContent = parseFloat(balance).toFixed(2);
            document.getElementById('stakingPriceFull').textContent = parseFloat(price).toLocaleString();

            // Enable/disable buttons
            const stakeBtn = document.getElementById('stakeBtnFull');
            const unstakeBtn = document.getElementById('unstakeBtnFull');
            
            stakeBtn.disabled = !enabled;
            unstakeBtn.disabled = !enabled || parseFloat(staked) === 0;

        } catch (error) {
            console.error('Error refreshing staking data:', error);
        }
    }

    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('stakingMessageFull');
        messageEl.textContent = text;
        messageEl.style.display = 'block';
        messageEl.style.background = type === 'error' ? 'rgba(244, 67, 54, 0.2)' : 
                                     type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 
                                     'rgba(33, 150, 243, 0.2)';
        messageEl.style.color = 'white';
        messageEl.style.padding = '20px';
        messageEl.style.borderRadius = '10px';
        messageEl.style.margin = '20px 0';

        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }

    startGame() {
        // Hide staking page
        document.getElementById('stakingPage').style.display = 'none';
        
        // Show game
        document.getElementById('gameContainer').style.display = 'block';

        // Initialize game if not already initialized
        if (!window.game && window.gameCanvas && window.gameResources) {
            window.game = new Game(window.gameCanvas, window.gameResources);
            console.log('✅ Game started!');
        } else if (!window.game) {
            // Wait for resources to load
            const checkInterval = setInterval(() => {
                if (window.gameCanvas && window.gameResources) {
                    window.game = new Game(window.gameCanvas, window.gameResources);
                    clearInterval(checkInterval);
                    console.log('✅ Game started (delayed)!');
                }
            }, 100);
        }
    }
}

