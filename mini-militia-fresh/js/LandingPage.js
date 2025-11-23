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

        // Setup start game button - changes behavior based on staking status
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            console.log('✅ Start game button found, attaching click handler');
            startGameBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🎮 Start game button clicked!');
                
                // Check current staking status
                if (this.web3 && this.web3.account) {
                    try {
                        console.log('📊 Checking staking status...');
                        const info = await this.web3.getCompleteStakingInfo();
                        console.log('📊 Staking info:', info);
                        
                        if (info && info.canPlay) {
                            // Can play - start the game
                            console.log('✅ Can play - starting game');
                            this.startGame();
                        } else {
                            // Can't play - scroll to staking form
                            console.log('⚠️ Cannot play - scrolling to staking form');
                            this.showMessage('Please stake tokens first to unlock the game!', 'info');
                            const stakeInput = document.getElementById('stakeAmountFull');
                            if (stakeInput) {
                                stakeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                setTimeout(() => stakeInput.focus(), 500);
                            } else {
                                console.error('❌ Stake input not found!');
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error checking play status:', error);
                        // If error, just scroll to staking form
                        this.showMessage('Error checking staking status. Please try staking first.', 'error');
                        const stakeInput = document.getElementById('stakeAmountFull');
                        if (stakeInput) {
                            stakeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                } else {
                    // Not connected - connect wallet first
                    console.log('⚠️ Wallet not connected');
                    this.showMessage('Please connect your wallet first!', 'error');
                    // Try to trigger wallet connection
                    const connectBtn = document.getElementById('connectWalletLanding');
                    if (connectBtn) {
                        connectBtn.click();
                    }
                }
            });
        } else {
            console.error('❌ Start game button not found in DOM!');
        }

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

        // Enable buttons by default (will be updated after data loads)
        const stakeBtn = document.getElementById('stakeBtnFull');
        const unstakeBtn = document.getElementById('unstakeBtnFull');
        if (stakeBtn) {
            stakeBtn.disabled = false; // Start enabled
        }
        if (unstakeBtn) {
            unstakeBtn.disabled = false; // Start enabled
        }

        // Refresh staking data (this will update button states)
        this.refreshStakingData();
    }

    setupStakingButtons() {
        // Get buttons
        const stakeBtn = document.getElementById('stakeBtnFull');
        const unstakeBtn = document.getElementById('unstakeBtnFull');
        
        if (!stakeBtn) {
            console.error('❌ Stake button not found!');
            return;
        }
        
        if (!unstakeBtn) {
            console.error('❌ Unstake button not found!');
            return;
        }
        
        // Remove any existing listeners by cloning
        const newStakeBtn = stakeBtn.cloneNode(true);
        stakeBtn.parentNode.replaceChild(newStakeBtn, stakeBtn);
        
        const newUnstakeBtn = unstakeBtn.cloneNode(true);
        unstakeBtn.parentNode.replaceChild(newUnstakeBtn, unstakeBtn);
        
        console.log('✅ Setting up staking buttons...');
        
        // Stake button - now accepts HGM amount
        newStakeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Stake button clicked!');
            
            const stakeBtnEl = newStakeBtn; // Use the cloned button
            if (stakeBtnEl) {
                stakeBtnEl.disabled = true;
                stakeBtnEl.textContent = 'Processing...';
            }
            
            const hgmAmount = document.getElementById('stakeAmountFull').value;
            if (!hgmAmount || parseFloat(hgmAmount) <= 0) {
                this.showMessage('Please enter a valid HGM amount to stake', 'error');
                if (stakeBtnEl) {
                    stakeBtnEl.disabled = false;
                    stakeBtnEl.textContent = 'Stake Tokens';
                }
                return;
            }

            try {
                // Check balance
                const balance = parseFloat(this.stakingData?.balance || 0);
                if (parseFloat(hgmAmount) > balance) {
                    this.showMessage(`Insufficient balance. You have ${balance.toFixed(4)} HGM`, 'error');
                    if (stakeBtnEl) {
                        stakeBtnEl.disabled = false;
                        stakeBtnEl.textContent = 'Stake Tokens';
                    }
                    return;
                }

                this.showMessage('Processing stake transaction...', 'info');
                
                // Convert HGM to staking tokens and stake
                const tx = await this.web3.stakeHGM(hgmAmount);
                this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
                
                // Use watchTransaction for better UX with status updates
                await this.web3.watchTransaction(tx.hash, (status, data) => {
                    if (status === 'pending') {
                        this.showMessage('Transaction pending...', 'info');
                    } else if (status === 'confirmed') {
                        this.showMessage('Staking successful!', 'success');
                        document.getElementById('stakeAmountFull').value = '';
                        if (stakeBtnEl) {
                            stakeBtnEl.disabled = false;
                            stakeBtnEl.textContent = 'Stake Tokens';
                        }
                        this.refreshStakingData();
                    } else if (status === 'failed') {
                        this.showMessage('Transaction failed. Please try again.', 'error');
                        if (stakeBtnEl) {
                            stakeBtnEl.disabled = false;
                            stakeBtnEl.textContent = 'Stake Tokens';
                        }
                    }
                });
            } catch (error) {
                console.error('Staking error:', error);
                this.showMessage(`Staking failed: ${error.message}`, 'error');
                if (stakeBtnEl) {
                    stakeBtnEl.disabled = false;
                    stakeBtnEl.textContent = 'Stake Tokens';
                }
            }
        });

        // Unstake button
        newUnstakeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Unstake button clicked!');
            
            const unstakeBtnEl = newUnstakeBtn; // Use the cloned button
            if (unstakeBtnEl) {
                unstakeBtnEl.disabled = true;
                unstakeBtnEl.textContent = 'Processing...';
            }
            const amount = document.getElementById('unstakeAmountFull').value;
            if (!amount || parseFloat(amount) < 1) {
                this.showMessage('Please enter a valid unstaking amount', 'error');
                return;
            }

            try {
                // Check unlock times first
                const unlockTimes = await this.web3.getUnlockTimes();
                if (!unlockTimes.canUnstake && unlockTimes.fullUnstakeUnlockDate) {
                    this.showMessage(`Cannot unstake yet. Available: ${unlockTimes.fullUnstakeUnlockDate.toLocaleString()}`, 'error');
                    return;
                }

                this.showMessage('Processing unstake transaction...', 'info');
                const tx = await this.web3.unstake(amount);
                this.showMessage('Transaction sent! Waiting for confirmation...', 'info');
                
                // Use watchTransaction for better UX
                await this.web3.watchTransaction(tx.hash, (status, data) => {
                    if (status === 'pending') {
                        this.showMessage('Transaction pending...', 'info');
                    } else if (status === 'confirmed') {
                        this.showMessage('Unstaking successful!', 'success');
                        document.getElementById('unstakeAmountFull').value = '';
                        if (unstakeBtnEl) {
                            unstakeBtnEl.disabled = false;
                            unstakeBtnEl.textContent = 'Unstake Tokens';
                        }
                        this.refreshStakingData();
                    } else if (status === 'failed') {
                        this.showMessage('Transaction failed. Please try again.', 'error');
                        if (unstakeBtnEl) {
                            unstakeBtnEl.disabled = false;
                            unstakeBtnEl.textContent = 'Unstake Tokens';
                        }
                    }
                });
            } catch (error) {
                console.error('Unstaking error:', error);
                this.showMessage(`Unstaking failed: ${error.message}`, 'error');
                if (unstakeBtnEl) {
                    unstakeBtnEl.disabled = false;
                    unstakeBtnEl.textContent = 'Unstake Tokens';
                }
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
            // Use the new getCompleteStakingInfo() function for better performance
            const info = await this.web3.getCompleteStakingInfo();
            
            if (!info) {
                console.warn('Could not get staking info');
                return;
            }

            this.stakingData = {
                staked: info.staked.toString(),
                balance: info.balance.toString(),
                price: info.price.toString(),
                enabled: info.enabled,
                tier: info.tier,
                unlockTimes: info.unlockTimes,
                canPlay: info.canPlay
            };

            // Update UI
            document.getElementById('stakedAmountFull').textContent = info.staked.toFixed(2);
            document.getElementById('userBalanceFull').textContent = info.balance.toFixed(2);
            document.getElementById('stakingPriceFull').textContent = info.price.toLocaleString();

            // Update tier display
            const tierCard = document.getElementById('tierCard');
            const tierElement = document.getElementById('stakingTierFull');
            if (tierCard && tierElement) {
                tierElement.textContent = `Tier ${info.tier}`;
                if (info.tier > 0) {
                    tierCard.style.display = 'block';
                    // Color based on tier
                    const colors = ['', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336'];
                    tierElement.style.color = colors[info.tier] || '#4CAF50';
                } else {
                    tierCard.style.display = 'none';
                }
            }

            // Update unlock times if elements exist
            const unlockInfo = document.getElementById('unlockInfoFull');
            if (unlockInfo) {
                if (!info.unlockTimes.canStake && info.unlockTimes.stakeUnlockDate) {
                    unlockInfo.innerHTML = `<small>⏱️ Can stake again: ${info.unlockTimes.stakeUnlockDate.toLocaleString()}</small>`;
                    unlockInfo.style.display = 'block';
                } else if (!info.unlockTimes.canUnstake && info.unlockTimes.fullUnstakeUnlockDate) {
                    unlockInfo.innerHTML = `<small>⏱️ Full unstake available: ${info.unlockTimes.fullUnstakeUnlockDate.toLocaleString()}</small>`;
                    unlockInfo.style.display = 'block';
                } else {
                    unlockInfo.style.display = 'none';
                }
            }

            // Enable/disable buttons based on unlock times
            const stakeBtn = document.getElementById('stakeBtnFull');
            const unstakeBtn = document.getElementById('unstakeBtnFull');
            
            // Only disable stake button if staking is disabled OR unlock time hasn't passed
            // But allow staking if unlockTimes check fails (default to allowing)
            const canStakeNow = info.enabled && (info.unlockTimes.canStake !== false);
            stakeBtn.disabled = !canStakeNow;
            
            // Show helpful message if disabled
            if (stakeBtn.disabled) {
                if (!info.enabled) {
                    stakeBtn.title = 'Public staking is currently disabled';
                } else if (!info.unlockTimes.canStake) {
                    const unlockDate = info.unlockTimes.stakeUnlockDate;
                    stakeBtn.title = `Can stake again at: ${unlockDate ? unlockDate.toLocaleString() : 'soon'}`;
                }
            } else {
                stakeBtn.title = 'Click to stake tokens';
            }
            
            // Unstake button - only disable if no staked tokens or can't unstake
            unstakeBtn.disabled = !info.enabled || info.staked === 0 || (info.unlockTimes.canUnstake === false && info.staked > 0);
            
            if (unstakeBtn.disabled && info.staked > 0) {
                const unlockDate = info.unlockTimes.fullUnstakeUnlockDate;
                unstakeBtn.title = `Full unstake available at: ${unlockDate ? unlockDate.toLocaleString() : 'soon'}`;
            } else {
                unstakeBtn.title = 'Click to unstake tokens';
            }
            
            console.log('🔘 Button states:', {
                stakeEnabled: canStakeNow,
                unstakeEnabled: !unstakeBtn.disabled,
                publicStakingEnabled: info.enabled,
                canStake: info.unlockTimes.canStake,
                staked: info.staked
            });

            // Update play button if it exists
            const playBtn = document.getElementById('startGameBtn');
            if (playBtn) {
                // Never disable - it should either start game or scroll to staking
                playBtn.disabled = false;
                if (info.canPlay) {
                    playBtn.textContent = '🎮 Play Game';
                    playBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    playBtn.style.cursor = 'pointer';
                } else {
                    playBtn.textContent = '💰 Stake to Play';
                    playBtn.style.background = 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)';
                    playBtn.style.cursor = 'pointer';
                }
            }

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

