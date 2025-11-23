/**
 * Staking UI Component for Mini Militia Game
 * Provides a beautiful, integrated staking interface
 */

class StakingUI {
    constructor(web3Integration, gameInstance) {
        this.web3 = web3Integration;
        this.game = gameInstance;
        this.isOpen = false;
        this.stakingData = {
            staked: '0',
            balance: '0',
            price: '5083',
            enabled: false
        };
        this.init();
    }

    init() {
        try {
            this.createUI();
            this.setupEventListeners();
            this.startDataRefresh();
            console.log('Staking UI initialized successfully');
        } catch (error) {
            console.error('Error initializing Staking UI:', error);
        }
    }

    createUI() {
        // Create staking panel
        const stakingPanel = document.createElement('div');
        stakingPanel.id = 'stakingPanel';
        stakingPanel.className = 'staking-panel';
        stakingPanel.style.display = 'none'; // Initially hidden
        stakingPanel.style.zIndex = '99998';
        stakingPanel.innerHTML = `
            <div class="staking-header">
                <h2>🎮 Staking & Rewards</h2>
                <button id="closeStaking" class="close-btn">×</button>
            </div>
            
            <div class="staking-content">
                <div class="wallet-section">
                    <div id="walletStatus" class="wallet-status">
                        <span class="status-indicator"></span>
                        <span id="walletAddress">Not Connected</span>
                    </div>
                    <button id="connectWallet" class="connect-btn">Connect Wallet</button>
                </div>

                <div class="staking-stats">
                    <div class="stat-card">
                        <div class="stat-label">Staked Amount</div>
                        <div class="stat-value" id="stakedAmount">0 HGM</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Your Balance</div>
                        <div class="stat-value" id="userBalance">0 HGM</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Staking Price</div>
                        <div class="stat-value" id="stakingPrice">5,083 HGM</div>
                    </div>
                </div>

                <div class="staking-actions">
                    <div class="action-group">
                        <label>Stake Amount</label>
                        <div class="input-group">
                            <input type="number" id="stakeAmount" placeholder="0" min="1" step="1">
                            <span class="input-suffix">Staking Tokens</span>
                        </div>
                        <div class="cost-display" id="stakeCost">Cost: 0 HGM</div>
                        <button id="stakeBtn" class="action-btn stake-btn">Stake Tokens</button>
                    </div>

                    <div class="action-group">
                        <label>Unstake Amount</label>
                        <div class="input-group">
                            <input type="number" id="unstakeAmount" placeholder="0" min="1" step="1">
                            <span class="input-suffix">Staking Tokens</span>
                        </div>
                        <button id="unstakeBtn" class="action-btn unstake-btn">Unstake Tokens</button>
                    </div>

                    <div class="action-group">
                        <button id="claimRewardsBtn" class="action-btn claim-btn">Claim Rewards</button>
                    </div>
                </div>

                <div class="staking-info">
                    <div class="info-item">
                        <span>⚡ Stakers get 2x rewards when validating transactions</span>
                    </div>
                    <div class="info-item">
                        <span>⏱️ Unstaking requires 21-day waiting period</span>
                    </div>
                    <div class="info-item">
                        <span>💰 Rewards are calculated based on time-weighted staking</span>
                    </div>
                </div>

                <div id="stakingMessage" class="staking-message"></div>
            </div>
        `;

        // Wait for body to be ready
        if (document.body) {
            document.body.appendChild(stakingPanel);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(stakingPanel);
            });
        }

        // Create toggle button
        function createButton() {
            // Check if button already exists
            if (document.getElementById('stakingToggle')) {
                console.log('Staking button already exists');
                return;
            }

            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'stakingToggle';
            toggleBtn.className = 'staking-toggle';
            toggleBtn.innerHTML = '💰 Staking';
            toggleBtn.style.cssText = 'position: fixed !important; top: 20px !important; right: 20px !important; padding: 12px 24px !important; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; border: none !important; border-radius: 25px !important; font-size: 16px !important; font-weight: bold !important; cursor: pointer !important; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4) !important; z-index: 99999 !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
            
            if (document.body) {
                document.body.appendChild(toggleBtn);
                console.log('✅ Staking toggle button created at top-right');
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(toggleBtn);
                    console.log('✅ Staking toggle button created (delayed)');
                });
            }
        }

        createButton();
    }

    setupEventListeners() {
        // Toggle panel - handle both existing button and dynamically created one
        const toggleBtn = document.getElementById('stakingToggle');
        if (toggleBtn) {
            // Remove any existing listeners by cloning
            const newBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
            
            newBtn.addEventListener('click', () => {
                console.log('Staking button clicked!');
                this.toggle();
            });
            console.log('✅ Staking button event listener attached');
        } else {
            console.error('❌ Staking toggle button not found!');
        }

        // Close button
        document.getElementById('closeStaking').addEventListener('click', () => {
            this.close();
        });

        // Connect wallet
        document.getElementById('connectWallet').addEventListener('click', async () => {
            await this.connectWallet();
        });

        // Stake button
        document.getElementById('stakeBtn').addEventListener('click', async () => {
            await this.handleStake();
        });

        // Unstake button
        document.getElementById('unstakeBtn').addEventListener('click', async () => {
            await this.handleUnstake();
        });

        // Claim rewards button
        document.getElementById('claimRewardsBtn').addEventListener('click', async () => {
            await this.handleClaimRewards();
        });

        // Update cost display when stake amount changes
        document.getElementById('stakeAmount').addEventListener('input', (e) => {
            this.updateStakeCost(e.target.value);
        });

        // Set max unstake
        document.getElementById('unstakeAmount').addEventListener('focus', () => {
            document.getElementById('unstakeAmount').value = this.stakingData.staked;
        });
    }

    async connectWallet() {
        try {
            this.showMessage('Connecting wallet...', 'info');
            const address = await this.web3.connectWallet();
            this.updateWalletStatus(address);
            await this.refreshData();
            this.showMessage('Wallet connected successfully!', 'success');
        } catch (error) {
            this.showMessage(`Connection failed: ${error.message}`, 'error');
        }
    }

    updateWalletStatus(address) {
        const statusEl = document.getElementById('walletStatus');
        const addressEl = document.getElementById('walletAddress');
        const connectBtn = document.getElementById('connectWallet');

        if (address) {
            statusEl.querySelector('.status-indicator').style.backgroundColor = '#4CAF50';
            addressEl.textContent = this.web3.formatAddress(address);
            connectBtn.textContent = 'Connected';
            connectBtn.disabled = true;
        } else {
            statusEl.querySelector('.status-indicator').style.backgroundColor = '#f44336';
            addressEl.textContent = 'Not Connected';
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
    }

    async refreshData() {
        if (!this.web3.account) {
            this.updateWalletStatus(null);
            return;
        }

        try {
            const [staked, balance, price, enabled] = await Promise.all([
                this.web3.getUserStakedAmount(),
                this.web3.getUserBalance(),
                this.web3.getStakingPrice(),
                this.web3.isPublicStakingEnabled()
            ]);

            this.stakingData = { staked, balance, price, enabled };

            document.getElementById('stakedAmount').textContent = `${parseFloat(staked).toFixed(2)} HGM`;
            document.getElementById('userBalance').textContent = `${parseFloat(balance).toFixed(2)} HGM`;
            document.getElementById('stakingPrice').textContent = `${parseFloat(price).toLocaleString()} HGM`;

            // Enable/disable buttons based on staking status
            const stakeBtn = document.getElementById('stakeBtn');
            const unstakeBtn = document.getElementById('unstakeBtn');
            
            stakeBtn.disabled = !enabled;
            unstakeBtn.disabled = !enabled || parseFloat(staked) === 0;

            if (!enabled) {
                this.showMessage('Public staking is currently disabled', 'warning');
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    updateStakeCost(amount) {
        const cost = parseFloat(amount || 0) * parseFloat(this.stakingData.price);
        document.getElementById('stakeCost').textContent = `Cost: ${cost.toLocaleString()} HGM`;
    }

    async handleStake() {
        const amount = document.getElementById('stakeAmount').value;
        
        if (!amount || parseFloat(amount) < 1) {
            this.showMessage('Please enter a valid staking amount', 'error');
            return;
        }

        if (parseFloat(this.stakingData.balance) < parseFloat(amount) * parseFloat(this.stakingData.price)) {
            this.showMessage('Insufficient balance', 'error');
            return;
        }

        try {
            this.showMessage('Processing stake transaction...', 'info');
            const tx = await this.web3.stake(amount);
            this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
            
            const receipt = await this.web3.waitForTransaction(tx);
            this.showMessage('Staking successful!', 'success');
            
            // Update game with staking bonus
            if (this.game) {
                this.game.onStakeSuccess(parseFloat(amount));
            }

            // Refresh data and clear input
            document.getElementById('stakeAmount').value = '';
            await this.refreshData();
        } catch (error) {
            this.showMessage(`Staking failed: ${error.message}`, 'error');
        }
    }

    async handleUnstake() {
        const amount = document.getElementById('unstakeAmount').value;
        const staked = parseFloat(this.stakingData.staked);

        if (!amount || parseFloat(amount) < 1) {
            this.showMessage('Please enter a valid unstaking amount', 'error');
            return;
        }

        if (parseFloat(amount) > staked) {
            this.showMessage('Cannot unstake more than staked amount', 'error');
            return;
        }

        try {
            this.showMessage('Processing unstake transaction...', 'info');
            const tx = await this.web3.unstake(amount);
            this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
            
            const receipt = await this.web3.waitForTransaction(tx);
            this.showMessage('Unstaking successful!', 'success');

            document.getElementById('unstakeAmount').value = '';
            await this.refreshData();
        } catch (error) {
            this.showMessage(`Unstaking failed: ${error.message}`, 'error');
        }
    }

    async handleClaimRewards() {
        try {
            this.showMessage('Claiming rewards...', 'info');
            const tx = await this.web3.claimRewards();
            this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
            
            const receipt = await this.web3.waitForTransaction(tx);
            this.showMessage('Rewards claimed successfully!', 'success');

            if (this.game) {
                this.game.onRewardsClaimed();
            }

            await this.refreshData();
        } catch (error) {
            this.showMessage(`Claim failed: ${error.message}`, 'error');
        }
    }

    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('stakingMessage');
        messageEl.textContent = text;
        messageEl.className = `staking-message ${type}`;
        messageEl.style.display = 'block';

        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }

    toggle() {
        console.log('Toggle called, current state:', this.isOpen);
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('stakingPanel');
        if (!panel) {
            console.error('❌ Staking panel not found!');
            return;
        }
        
        panel.style.display = this.isOpen ? 'block' : 'none';
        panel.style.zIndex = '99998';
        console.log('Panel display set to:', panel.style.display);
        
        if (this.isOpen) {
            this.refreshData();
        }
    }

    close() {
        this.isOpen = false;
        document.getElementById('stakingPanel').style.display = 'none';
    }

    startDataRefresh() {
        // Refresh data every 30 seconds when panel is open
        setInterval(() => {
            if (this.isOpen && this.web3.account) {
                this.refreshData();
            }
        }, 30000);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StakingUI;
}

