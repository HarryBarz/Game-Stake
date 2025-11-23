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

        // Get EVVM ID - CRITICAL: Must match what contract uses
        try {
            const id = await this.evvmContract.getEvvmID();
            const idStr = id.toString();
            // If ID is 0, it means it hasn't been set yet
            if (idStr === '0') {
                console.error('❌ EVVM ID is 0 on contract! You must call setEvvmID(1078) on the EVVM contract first.');
                throw new Error('EVVM ID not set on contract. Please call setEvvmID(1078) on the EVVM contract.');
            }
            this.evvmID = idStr;
            console.log('✅ EVVM ID fetched from contract:', this.evvmID);
        } catch (error) {
            console.error('❌ Could not fetch EVVM ID:', error);
            throw new Error('Failed to fetch EVVM ID from contract. Please ensure the contract is properly deployed and EVVM ID is set.');
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

        // CRITICAL: Contract uses Strings.toString() which converts to decimal string
        // Ensure amount is an integer (contract expects uint256)
        const amountNum = Math.floor(parseFloat(amount));
        if (amountNum <= 0) {
            throw new Error('Amount must be a positive integer');
        }
        const amountStr = amountNum.toString(); // No decimals, no scientific notation
        const nonceStr = nonce.toString(); // Convert to string
        
        // CRITICAL: Message format must match contract EXACTLY
        // Contract builds: string.concat(evvmID, ",", "publicStaking", ",", string.concat("true", ",", amount, ",", nonce))
        // This creates: "{evvmID},publicStaking,true,{amount},{nonce}"
        const message = `${this.evvmID},publicStaking,${isStaking ? 'true' : 'false'},${amountStr},${nonceStr}`;
        
        const signerAddress = await this.signer.getAddress();
        
        // Sign message using EIP-191 format (ethers.js signMessage handles this automatically)
        const signature = await this.signer.signMessage(message);
        
        return signature;
    }

    /**
     * Generate EVVM payment signature (for staking payment)
     * Format: {evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
     * 
     * CRITICAL: The executor must be the Staking contract address, not the user's address!
     * The Staking contract calls pay() with executor = address(this), so the signature must match.
     */
    async generateEVVMSignature(amount, nonce, priorityFee = 0, isAsync = false) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        // Convert addresses to checksum format (ethers v5)
        const receiver = ethers.utils.getAddress(this.STAKING_ADDRESS);
        const token = ethers.utils.getAddress(this.PRINCIPAL_TOKEN_ADDRESS);
        // CRITICAL: Executor must be Staking contract address, not user address!
        // The Staking contract passes address(this) as executor when calling pay()
        const executor = ethers.utils.getAddress(this.STAKING_ADDRESS);
        
        // Message format: {evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
        const message = `${this.evvmID},pay,${receiver},${token},${amount.toString()},${priorityFee.toString()},${nonce.toString()},${isAsync ? 'true' : 'false'},${executor}`;
        
        console.log('=== EVVM PAYMENT SIGNATURE DEBUG ===');
        console.log('Full message to sign:', message);
        console.log('Message components:', {
            evvmID: this.evvmID,
            functionName: 'pay',
            receiver: receiver,
            token: token,
            amount: amount.toString(),
            priorityFee: priorityFee.toString(),
            nonce: nonce.toString(),
            priorityFlag: isAsync ? 'true' : 'false',
            executor: executor
        });
        console.log('Signer address:', await this.signer.getAddress());
        
        const signature = await this.signer.signMessage(message);
        
        // Verify signature locally
        try {
            const recoveredAddress = ethers.utils.verifyMessage(message, signature);
            console.log('✅ EVVM Signature verification:', recoveredAddress === await this.signer.getAddress() ? 'PASSED' : 'FAILED');
            console.log('Expected:', await this.signer.getAddress());
            console.log('Recovered:', recoveredAddress);
        } catch (e) {
            console.warn('Could not verify EVVM signature locally:', e);
        }
        
        console.log('EVVM Signature (first 20 chars):', signature.slice(0, 20) + '...');
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
            // Ensure contracts are set up and EVVM ID is fetched
            if (!this.evvmContract || !this.stakingContract) {
                await this.setupContracts();
            }
            
            // CRITICAL: Fetch EVVM ID from contract - signature MUST use the same ID as contract
            try {
                const id = await this.evvmContract.getEvvmID();
                this.evvmID = id.toString();
                console.log('✅ Fetched EVVM ID from contract:', this.evvmID);
                
                if (this.evvmID === '0') {
                    throw new Error('EVVM ID is 0. Please call setEvvmID(1078) on the EVVM contract first. The contract address is: ' + this.EVVM_ADDRESS);
                }
            } catch (e) {
                if (e.message && e.message.includes('setEvvmID')) {
                    throw e; // Re-throw the setEvvmID error
                }
                console.error('❌ Could not fetch EVVM ID:', e);
                throw new Error('Failed to fetch EVVM ID from contract. Please ensure the contract is properly deployed.');
            }
            
            // Check if public staking is enabled
            const isEnabled = await this.isPublicStakingEnabled();
            if (!isEnabled) {
                throw new Error('Public staking is currently disabled. Please try again later.');
            }
            console.log('Public staking is enabled:', isEnabled);

            // Get staking price
            const price = await this.getStakingPrice();
            const totalAmount = ethers.utils.parseEther((parseFloat(amount) * parseFloat(price)).toString());
            
            // Generate nonces
            const stakingNonce = Date.now();
            const evvmNonce = await this.getNextSyncNonce();

            // Convert amount to integer (staking tokens must be whole numbers)
            const amountNum = parseFloat(amount);
            const amountForContract = Math.floor(amountNum); // Contract expects integer staking tokens
            
            if (amountForContract <= 0) {
                throw new Error('Staking amount must be at least 1 staking token');
            }

            // CRITICAL: Fetch EVVM ID fresh from contract - contract uses this exact value
            const id = await this.evvmContract.getEvvmID();
            const evvmIDForSignature = id.toString();
            if (evvmIDForSignature === '0') {
                throw new Error('EVVM ID is 0. Call setEvvmID(1078) on EVVM contract: ' + this.EVVM_ADDRESS);
            }
            this.evvmID = evvmIDForSignature;

            // Generate signatures with fresh EVVM ID
            const stakingSignature = await this.generateStakingSignature(true, amountForContract.toString(), stakingNonce);
            const evvmSignature = await this.generateEVVMSignature(
                totalAmount,
                0,
                evvmNonce,
                false
            );

            const userAddress = ethers.utils.getAddress(this.account);
            
            const tx = await this.stakingContract.publicStaking(
                userAddress,
                true,
                amountForContract,
                stakingNonce,
                stakingSignature,
                0,
                evvmNonce,
                false,
                evvmSignature
            );

            return tx;
        } catch (error) {
            console.error('Staking error:', error);
            if (error.message && error.message.includes('execution reverted')) {
                throw new Error('Transaction failed. Check console for details. Possible issues: Invalid signature, insufficient balance, or public staking disabled.');
            }
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

