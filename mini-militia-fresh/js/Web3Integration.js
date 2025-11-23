/**
 * Web3 Integration for Mini Militia Game
 * Handles wallet connection, contract interactions, and EVVM staking
 */

class Web3Integration {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.stakingContract = null;
        this.evvmContract = null;
        this.chainId = 421614; // Arbitrum Sepolia
        this.evvmID = null;
        
        // Contract addresses (from your deployment)
        this.STAKING_ADDRESS = '0xdB11ba5D0233f05a91409fA0C6f8cFBbB03B627b';
        this.EVVM_ADDRESS = '0x29ba6C233FF3a009Ca8263B4A54545Df2b271c47';
        this.PRINCIPAL_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001';
        
        // Staking ABI (minimal for our needs)
        this.STAKING_ABI = [
            "function publicStaking(address user, bool isStaking, uint256 amountOfStaking, uint256 nonce, bytes memory signature, uint256 priorityFee_EVVM, uint256 nonce_EVVM, bool priorityFlag_EVVM, bytes memory signature_EVVM) external",
            "function getUserAmountStaked(address _account) external view returns (uint256)",
            "function getAddressHistory(address _account) external view returns (tuple(bytes32 transactionType, uint256 amount, uint256 timestamp, uint256 totalStaked)[])",
            "function getAllDataOfAllowPublicStaking() external view returns (tuple(bool flag, uint256 timeToAccept))",
            "function priceOfStaking() external pure returns (uint256)",
            "function gimmeYiel(address user) external returns (bytes32, address, uint256, uint256, uint256)"
        ];
        
        this.EVVM_ABI = [
            "function getEvvmID() external view returns (uint256)",
            "function getBalance(address account, address token) external view returns (uint256)",
            "function getNextCurrentSyncNonce(address user) external view returns (uint256)",
            "function addBalance(address user, address token, uint256 quantity) external"
        ];
    }

    /**
     * Initialize Web3 and check for MetaMask
     */
    async init() {
        // Verify ethers is loaded
        if (typeof ethers === 'undefined') {
            throw new Error('ethers.js library not loaded. Please refresh the page.');
        }

        // Verify ethers.providers exists (ethers v5)
        if (!ethers.providers || !ethers.providers.Web3Provider) {
            throw new Error('ethers.js v5 not detected. Please check the library version.');
        }

        if (typeof window.ethereum === 'undefined') {
            console.warn('MetaMask not detected. Staking features will be limited.');
            return; // Don't throw, just return - UI will still show
        }

        try {
            // Use ethers v5 API
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if already connected
            const accounts = await this.provider.listAccounts();
            if (accounts.length > 0) {
                this.signer = this.provider.getSigner();
                this.account = await this.signer.getAddress();
                await this.setupContracts();
            }
        } catch (error) {
            console.warn('Web3 initialization warning:', error);
            // Don't throw - allow UI to show anyway
        }
    }

    /**
     * Connect wallet
     */
    async connectWallet() {
        try {
            // Verify ethers is loaded
            if (typeof ethers === 'undefined') {
                throw new Error('ethers.js library not loaded. Please refresh the page.');
            }

            // Verify ethers.providers exists (ethers v5)
            if (!ethers.providers || !ethers.providers.Web3Provider) {
                throw new Error('ethers.js v5 not detected. Please check the library version.');
            }

            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask not detected');
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.account = await this.signer.getAddress();

            // Check network
            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== this.chainId) {
                await this.switchNetwork();
            }

            await this.setupContracts();
            return this.account;
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    /**
     * Switch to Arbitrum Sepolia network
     */
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.chainId.toString(16)}` }],
            });
        } catch (switchError) {
            // Chain doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${this.chainId.toString(16)}`,
                        chainName: 'Arbitrum Sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                        blockExplorerUrls: ['https://sepolia.arbiscan.io']
                    }],
                });
            } else {
                throw switchError;
            }
        }
    }

    /**
     * Setup contract instances
     */
    async setupContracts() {
        this.stakingContract = new ethers.Contract(
            this.STAKING_ADDRESS,
            this.STAKING_ABI,
            this.signer
        );

        this.evvmContract = new ethers.Contract(
            this.EVVM_ADDRESS,
            this.EVVM_ABI,
            this.signer
        );

        // Get EVVM ID
        try {
            const id = await this.evvmContract.getEvvmID();
            this.evvmID = id.toString();
            // If ID is 0, it means it hasn't been set yet - use a placeholder
            if (this.evvmID === '0') {
                console.warn('EVVM ID not set yet. Using registered ID 1078.');
                this.evvmID = '1078'; // Your registered EVVM ID
            }
        } catch (error) {
            console.warn('Could not fetch EVVM ID:', error);
            // Use your registered EVVM ID as fallback
            this.evvmID = '1078'; // Your registered EVVM ID
        }
    }

    /**
     * Check if public staking is enabled
     */
    async isPublicStakingEnabled() {
        try {
            const data = await this.stakingContract.getAllDataOfAllowPublicStaking();
            return data.flag;
        } catch (error) {
            console.error('Error checking staking status:', error);
            return false;
        }
    }

    /**
     * Get user's staked amount
     */
    async getUserStakedAmount() {
        if (!this.account) return 0;
        try {
            const amount = await this.stakingContract.getUserAmountStaked(this.account);
            return ethers.utils.formatEther(amount);
        } catch (error) {
            console.error('Error getting staked amount:', error);
            return 0;
        }
    }

    /**
     * Get staking price (MATE tokens per staking token)
     */
    async getStakingPrice() {
        try {
            const price = await this.stakingContract.priceOfStaking();
            return ethers.utils.formatEther(price);
        } catch (error) {
            console.error('Error getting staking price:', error);
            return '5083'; // Default: 5083 MATE per staking token
        }
    }

    /**
     * Get user's balance in EVVM
     */
    async getUserBalance() {
        if (!this.account) return '0';
        try {
            const balance = await this.evvmContract.getBalance(
                this.account,
                this.PRINCIPAL_TOKEN_ADDRESS
            );
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    /**
     * Generate EIP-191 signature for staking
     * Message format: {evvmID},publicStaking,{isStaking},{amount},{nonce}
     * Where amount is the staking token amount (not in wei, just the number as string)
     */
    async generateStakingSignature(isStaking, amount, nonce) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        // Ensure amount is an integer string (contract expects uint256)
        const amountStr = Math.floor(parseFloat(amount)).toString();
        const nonceStr = nonce.toString();
        
        // Message format matches contract: {evvmID},publicStaking,{isStaking},{amount},{nonce}
        // Contract builds: string.concat(evvmID, ",", "publicStaking", ",", string.concat("true", ",", amount, ",", nonce))
        const message = `${this.evvmID},publicStaking,${isStaking ? 'true' : 'false'},${amountStr},${nonceStr}`;
        
        console.log('Signing staking message:', message);
        console.log('Message components:', {
            evvmID: this.evvmID,
            functionName: 'publicStaking',
            isStaking: isStaking ? 'true' : 'false',
            amount: amountStr,
            nonce: nonceStr
        });
        
        // Sign message using EIP-191 format (ethers.js signMessage handles this automatically)
        const signature = await this.signer.signMessage(message);
        console.log('Signature generated:', signature.slice(0, 20) + '...');
        return signature;
    }

    /**
     * Generate EVVM payment signature (for staking payment)
     * Format: {evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
     */
    async generateEVVMSignature(amount, nonce, priorityFee = 0, isAsync = false) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        // Convert addresses to checksum format (ethers v5)
        const receiver = ethers.utils.getAddress(this.STAKING_ADDRESS);
        const token = ethers.utils.getAddress(this.PRINCIPAL_TOKEN_ADDRESS);
        const executor = ethers.utils.getAddress(this.account);
        
        // Message format: {evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
        const message = `${this.evvmID},pay,${receiver},${token},${amount.toString()},${priorityFee.toString()},${nonce.toString()},${isAsync ? 'true' : 'false'},${executor}`;
        
        const signature = await this.signer.signMessage(message);
        return signature;
    }

    /**
     * Get next sync nonce from EVVM (for sync payments)
     * This is CRITICAL - sync payments must use the exact nonce from the contract
     */
    async getNextSyncNonce() {
        if (!this.account || !this.evvmContract) {
            throw new Error('Wallet not connected');
        }
        try {
            const nonce = await this.evvmContract.getNextCurrentSyncNonce(this.account);
            return nonce.toString();
        } catch (error) {
            console.error('Error getting sync nonce:', error);
            throw new Error('Failed to get sync nonce. Please try again.');
        }
    }

    /**
     * Stake HGM tokens (converts to staking tokens automatically)
     * @param {string} hgmAmount - Amount in HGM tokens
     */
    async stakeHGM(hgmAmount) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            // Get staking price
            const price = await this.getStakingPrice();
            const priceNum = parseFloat(price);
            const hgmNum = parseFloat(hgmAmount);

            if (hgmNum <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            // Convert HGM to staking tokens
            const stakingTokens = hgmNum / priceNum;
            
            // Round down to whole staking tokens (contract requires integer amounts)
            const stakingTokensWhole = Math.floor(stakingTokens);

            if (stakingTokensWhole <= 0) {
                throw new Error(`Amount too small. Minimum: ${priceNum} HGM for 1 staking token`);
            }

            console.log(`Staking ${hgmNum} HGM = ${stakingTokensWhole} staking tokens`);

            // Use the stake function with whole staking tokens
            return await this.stake(stakingTokensWhole.toString());
        } catch (error) {
            console.error('StakeHGM error:', error);
            throw error;
        }
    }

    /**
     * Stake tokens (in staking tokens)
     * @param {string} amount - Amount in staking tokens
     */
    async stake(amount) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            // Get staking price
            const price = await this.getStakingPrice();
            const totalAmount = ethers.utils.parseEther((parseFloat(amount) * parseFloat(price)).toString());
            
            // Generate nonces
            const stakingNonce = Date.now();
            const evvmNonce = await this.getNextSyncNonce();

            // Convert amount to integer (staking tokens must be whole numbers or very specific decimals)
            // Round to 6 decimal places, then convert to string for signature
            const amountNum = parseFloat(amount);
            const amountRounded = Math.floor(amountNum * 1000000) / 1000000;
            const amountForContract = Math.floor(amountRounded); // Contract expects integer staking tokens
            
            if (amountForContract <= 0) {
                throw new Error('Staking amount must be at least 1 staking token');
            }

            // Generate signatures - CRITICAL: amount in signature must match amount sent to contract
            const stakingSignature = await this.generateStakingSignature(true, amountForContract.toString(), stakingNonce);
            // CRITICAL: For sync payments, the nonce in signature must match getNextCurrentSyncNonce
            const evvmSignature = await this.generateEVVMSignature(
                totalAmount,    // amount in wei
                0,              // priority fee
                evvmNonce,      // nonce (must match getNextCurrentSyncNonce for sync)
                false           // sync (priorityFlag = false)
            );

            console.log('Staking parameters:', {
                user: this.account,
                isStaking: true,
                amount: amountForContract,
                stakingNonce: stakingNonce.toString(),
                evvmNonce: evvmNonce.toString(),
                evvmID: this.evvmID
            });

            // Call publicStaking - amount must be integer (staking tokens)
            const tx = await this.stakingContract.publicStaking(
                this.account,           // user
                true,                   // isStaking
                amountForContract,      // amountOfStaking (must be integer, in staking tokens)
                stakingNonce,           // nonce
                stakingSignature,       // signature
                0,                      // priorityFee_EVVM
                evvmNonce,              // nonce_EVVM (for sync, this should match nextSyncUsedNonce)
                false,                  // priorityFlag_EVVM (false = sync)
                evvmSignature           // signature_EVVM
            );

            return tx;
        } catch (error) {
            console.error('Staking error:', error);
            throw error;
        }
    }

    /**
     * Unstake tokens
     */
    async unstake(amount) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            const stakingNonce = Date.now();
            const evvmNonce = await this.getNextSyncNonce();

            const stakingSignature = await this.generateStakingSignature(false, amount, stakingNonce);
            // For unstaking, we still need EVVM signature but amount is 0 (no payment needed)
            const evvmSignature = await this.generateEVVMSignature(
                '0',           // amount = 0 for unstaking
                0,              // priority fee (optional)
                evvmNonce,      // nonce
                false           // sync
            );

            // Convert amount to integer (staking tokens must be whole numbers)
            const amountNum = parseFloat(amount);
            const amountForContract = Math.floor(amountNum);
            
            if (amountForContract <= 0) {
                throw new Error('Unstaking amount must be at least 1 staking token');
            }
            
            const tx = await this.stakingContract.publicStaking(
                this.account,
                false, // isStaking
                amountForContract, // amountOfStaking (must be integer, in staking tokens)
                stakingNonce,
                stakingSignature,
                0,      // priorityFee_EVVM (optional for unstaking)
                evvmNonce,
                false,  // priorityFlag_EVVM
                evvmSignature
            );

            return tx;
        } catch (error) {
            console.error('Unstaking error:', error);
            throw error;
        }
    }

    /**
     * Claim rewards
     */
    async claimRewards() {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            const tx = await this.stakingContract.gimmeYiel(this.account);
            return tx;
        } catch (error) {
            console.error('Claim rewards error:', error);
            throw error;
        }
    }

    /**
     * Get staking history
     */
    async getStakingHistory() {
        if (!this.account) return [];
        try {
            const history = await this.stakingContract.getAddressHistory(this.account);
            return history.map(item => ({
                type: item.transactionType,
                amount: ethers.utils.formatEther(item.amount),
                timestamp: Number(item.timestamp),
                totalStaked: ethers.utils.formatEther(item.totalStaked)
            }));
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Get test HGM tokens from faucet (testnet only)
     * This calls the addBalance function on EVVM contract
     */
    async getTestHGM() {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        if (!this.evvmContract) {
            await this.setupContracts();
        }

        try {
            // Give 10,000 HGM (enough for ~2 staking tokens)
            const amount = ethers.utils.parseEther('10000');
            
            // Call addBalance on EVVM contract (faucet function)
            const tx = await this.evvmContract.addBalance(
                this.account,
                this.PRINCIPAL_TOKEN_ADDRESS,
                amount
            );

            return tx;
        } catch (error) {
            console.error('Error getting test HGM:', error);
            throw error;
        }
    }

    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(tx) {
        return await tx.wait();
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Web3Integration;
}

