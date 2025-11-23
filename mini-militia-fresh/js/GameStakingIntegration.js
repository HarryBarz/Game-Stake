/**
 * Game-Staking Integration
 * Links staking mechanics to game bonuses and rewards
 */

// Initialize immediately - don't wait
(function() {
    console.log('🚀 Initializing staking integration...');
    
    // Create Web3 integration (handle errors gracefully)
    let web3Integration;
    try {
        if (typeof ethers !== 'undefined') {
            web3Integration = new Web3Integration();
            web3Integration.init().catch(err => {
                console.warn('Web3 init warning:', err);
            });
        } else {
            console.warn('ethers.js not loaded, creating basic Web3Integration');
            web3Integration = new Web3Integration();
        }
    } catch (error) {
        console.error('Web3Integration creation error:', error);
        web3Integration = new Web3Integration(); // Create anyway
    }

    // Initialize staking UI immediately
    function initNow() {
        try {
            console.log('Creating StakingUI...');
            const stakingUI = new StakingUI(web3Integration, window.game || null);
            window.stakingUI = stakingUI;
            window.web3Integration = web3Integration;
            console.log('✅ Staking UI created!');
        } catch (error) {
            console.error('❌ Error creating StakingUI:', error);
        }
    }

    // Try immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNow);
    } else {
        initNow();
    }

    // Also try after a short delay to catch game instance
    setTimeout(() => {
        if (window.game && window.stakingUI) {
            extendGameWithStaking(window.game, web3Integration);
        }
    }, 3000);
})();

function initializeStaking(web3Integration, gameInstance) {
    // Create staking UI
    const stakingUI = new StakingUI(web3Integration, gameInstance);

    // Extend game with staking bonuses
    if (gameInstance) {
        extendGameWithStaking(gameInstance, web3Integration);
    }

    // Make accessible globally
    window.stakingUI = stakingUI;
    window.web3Integration = web3Integration;
}

function extendGameWithStaking(game, web3Integration) {
    // Store original methods
    const originalRespawn = game.respawn;
    const originalGameOver = game.gameOver;

    // Add staking bonus to score calculation
    game.calculateStakingBonus = async function() {
        if (!web3Integration.account) return 1.0;

        try {
            const staked = await web3Integration.getUserStakedAmount();
            const stakedAmount = parseFloat(staked);

            // Bonus multiplier based on staking:
            // 1-10 staking tokens: 1.1x multiplier
            // 10-50: 1.25x multiplier
            // 50+: 1.5x multiplier
            if (stakedAmount >= 50) return 1.5;
            if (stakedAmount >= 10) return 1.25;
            if (stakedAmount >= 1) return 1.1;
            return 1.0;
        } catch (error) {
            console.error('Error calculating staking bonus:', error);
            return 1.0;
        }
    };

    // Enhanced respawn with staking benefits
    game.respawn = async function() {
        const bonus = await this.calculateStakingBonus();
        
        // Stakers get faster respawn (reduced by 20% if staked)
        this.respawnTime = bonus > 1.0 ? 5 : 6;
        
        this.pauseGame();
        this.messageBox.style.opacity = 1;
        
        // Apply staking bonus to score display
        const baseScore = this.shyame.actor.score;
        const bonusScore = Math.floor(baseScore * bonus);
        
        document.getElementById('score').innerHTML = baseScore;
        if (bonus > 1.0) {
            document.getElementById('score').innerHTML += ` <span style="color: #4CAF50;">(+${Math.floor((bonus - 1) * 100)}% staking bonus)</span>`;
        }
        
        document.getElementById('kills').innerHTML = this.shyame.actor.kills;
        document.getElementById('respawn-value').innerHTML = this.respawnTime;

        this.respawnInterval = setInterval(async function() {
            if (this.respawnTime == 0) {
                this.resumeGame();
                this.shyame.actor.noOfLifes -= 1;
                this.shyame.actor.health = this.shyame.actor.maxHealth;
                
                // Apply staking bonus to health if staked
                const bonus = await this.calculateStakingBonus();
                if (bonus > 1.0) {
                    this.shyame.actor.maxHealth = Math.floor(this.shyame.actor.maxHealth * (1 + (bonus - 1) * 0.2));
                    this.shyame.actor.health = this.shyame.actor.maxHealth;
                }
                
                clearInterval(this.respawnInterval);
            } else {
                this.respawnTime -= 1;
                document.getElementById('respawn-value').innerHTML = this.respawnTime;
            }
        }.bind(this), 1000);

        this.shyame.actor.position = {x: 1400, y: 10};
    };

    // Enhanced game over with staking rewards
    game.gameOver = async function() {
        this.messageBox.style.opacity = 1;
        document.getElementById('messageHeading').innerHTML = 'GAME OVER';
        
        const bonus = await this.calculateStakingBonus();
        const baseScore = this.shyame.actor.score;
        const finalScore = Math.floor(baseScore * bonus);
        
        document.getElementById('score').innerHTML = finalScore;
        if (bonus > 1.0) {
            document.getElementById('score').innerHTML += ` <span style="color: #4CAF50;">(Staking Bonus Applied)</span>`;
        }
        
        document.getElementById('kills').innerHTML = this.shyame.actor.kills;
        document.getElementById('respawn').innerHTML = '';
        document.getElementById('retryButton').style.display = 'block';

        this.pauseGame();
        this.removeControls();
        this.messageBox.style.opacity = 1;

        // Show staking reminder if not staked
        if (bonus === 1.0 && web3Integration.account) {
            setTimeout(() => {
                if (window.stakingUI) {
                    const message = document.createElement('div');
                    message.style.cssText = 'position: fixed; top: 100px; right: 20px; background: rgba(102, 126, 234, 0.9); color: white; padding: 15px; border-radius: 10px; z-index: 3000; max-width: 300px;';
                    message.innerHTML = '💡 <strong>Stake tokens to get score bonuses!</strong><br>Click the Staking button to get started.';
                    document.body.appendChild(message);
                    setTimeout(() => message.remove(), 10000);
                }
            }, 2000);
        }
    };

    // Add callback for successful stake
    game.onStakeSuccess = function(amount) {
        // Visual feedback
        if (this.shyame && this.shyame.actor) {
            // Add temporary health boost
            const currentHealth = this.shyame.actor.health;
            const maxHealth = this.shyame.actor.maxHealth;
            this.shyame.actor.health = Math.min(maxHealth, currentHealth + 20);
        }
    };

    // Add callback for rewards claimed
    game.onRewardsClaimed = function() {
        // Visual celebration
        console.log('Rewards claimed! Great job!');
    };

    // Enhance score calculation with staking bonus
    const originalAddScore = game.shyame?.actor?.addScore;
    if (originalAddScore) {
        game.shyame.actor.addScore = async function(points) {
            const bonus = await game.calculateStakingBonus();
            const bonusPoints = Math.floor(points * (bonus - 1));
            originalAddScore.call(this, points + bonusPoints);
        };
    }
}

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeStaking, extendGameWithStaking };
}

