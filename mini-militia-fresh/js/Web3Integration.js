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
        
        // Staking ABI (expanded with all useful functions)
        this.STAKING_ABI = [
            "function publicStaking(address user, bool isStaking, uint256 amountOfStaking, uint256 nonce, bytes memory signature, uint256 priorityFee_EVVM, uint256 nonce_EVVM, bool priorityFlag_EVVM, bytes memory signature_EVVM) external",
            "function getUserAmountStaked(address _account) external view returns (uint256)",
            "function getAddressHistory(address _account) external view returns (tuple(bytes32 transactionType, uint256 amount, uint256 timestamp, uint256 totalStaked)[])",
            "function getAddressHistoryByIndex(address _account, uint256 _index) external view returns (tuple(bytes32 transactionType, uint256 amount, uint256 timestamp, uint256 totalStaked))",
            "function getSizeOfAddressHistory(address _account) external view returns (uint256)",
            "function getAllDataOfAllowPublicStaking() external view returns (tuple(bool flag, uint256 timeToAccept))",
            "function getAllowPresaleStaking() external view returns (tuple(bool flag, uint256 timeToAccept))",
            "function priceOfStaking() external pure returns (uint256)",
            "function gimmeYiel(address user) external returns (bytes32, address, uint256, uint256, uint256)",
            "function checkIfStakeNonceUsed(address _account, uint256 _nonce) external view returns (bool)",
            "function getTimeToUserUnlockStakingTime(address _account) external view returns (uint256)",
            "function getTimeToUserUnlockFullUnstakingTime(address _account) external view returns (uint256)",
            "function getSecondsToUnlockStaking() external view returns (uint256)",
            "function getSecondsToUnlockFullUnstaking() external view returns (uint256)",
            "function getEstimatorAddress() external view returns (address)",
            "function getEvvmAddress() external view returns (address)",
            "function getOwner() external view returns (address)",
            "function getGoldenFisher() external view returns (address)",
            "function getPresaleStaker(address _account) external view returns (bool, uint256)",
            "function getPresaleStakerCount() external view returns (uint256)"
        ];
        
        this.EVVM_ABI = [
            "function getEvvmID() external view returns (uint256)",
            "function getBalance(address account, address token) external view returns (uint256)",
            "function getNextCurrentSyncNonce(address user) external view returns (uint256)",
            "function addBalance(address user, address token, uint256 quantity) external",
            "function isAddressStaker(address _address) external view returns (bool)",
            "function getRewardAmount() external view returns (uint256)",
            "function pay(address from, address to_address, string memory to_identity, address token, uint256 amount, uint256 priorityFee, uint256 nonce, bool priorityFlag, address executor, bytes memory signature) external"
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

        // Ensure EVVM ID is set
        if (!this.evvmID || this.evvmID === '0') {
            throw new Error('EVVM ID not set. Please ensure the contract is properly initialized.');
        }

        // CRITICAL: Contract uses Strings.toString() which converts uint256 to decimal string
        // Amount and nonce come in as numbers, convert to strings for message
        const amountNum = Math.floor(Number(amount));
        const nonceNum = Math.floor(Number(nonce));
        
        if (amountNum <= 0) {
            throw new Error('Amount must be a positive integer');
        }
        
        // Convert to strings exactly as contract does with Strings.toString()
        const amountStr = amountNum.toString();
        const nonceStr = nonceNum.toString();
        
        // CRITICAL: Message format must match contract EXACTLY
        // Contract: SignatureRecover.signatureVerification(
        //   Strings.toString(evvmID),  // "1078"
        //   "publicStaking",
        //   string.concat("true", ",", Strings.toString(amount), ",", Strings.toString(nonce))
        // )
        // Final: "{evvmID},publicStaking,true,{amount},{nonce}"
        const message = `${this.evvmID},publicStaking,${isStaking ? 'true' : 'false'},${amountStr},${nonceStr}`;
        
        console.log('🔐 Generating staking signature with:');
        console.log('  - EVVM ID:', this.evvmID);
        console.log('  - Message:', message);
        console.log('  - Amount:', amountStr, '(staking tokens)');
        console.log('  - Nonce:', nonceStr);
        
        const signature = await this.signer.signMessage(message);
        console.log('  - Signature generated:', signature.substring(0, 20) + '...');
        
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

        // Ensure EVVM ID is set
        if (!this.evvmID || this.evvmID === '0') {
            throw new Error('EVVM ID not set. Please ensure the contract is properly initialized.');
        }

        // Convert addresses to checksum format (ethers v5)
        // CRITICAL: Contract uses AdvancedStrings.addressToString() which converts to lowercase
        // But ethers.utils.getAddress() returns checksummed. We need lowercase!
        const receiver = this.STAKING_ADDRESS.toLowerCase();
        const token = this.PRINCIPAL_TOKEN_ADDRESS.toLowerCase();
        // CRITICAL: Executor must be Staking contract address, not user address!
        const executor = this.STAKING_ADDRESS.toLowerCase();
        
        // Message format: {evvmID},pay,{receiverAddress},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
        // CRITICAL: amount is BigNumber, convert to string without decimals
        const amountStr = typeof amount === 'object' && amount.toString ? amount.toString() : amount.toString();
        const message = `${this.evvmID},pay,${receiver},${token},${amountStr},${priorityFee.toString()},${nonce.toString()},${isAsync ? 'true' : 'false'},${executor}`;
        
        console.log('🔐 Generating EVVM signature with:');
        console.log('  - EVVM ID:', this.evvmID);
        console.log('  - Message:', message);
        console.log('  - Amount:', amountStr, '(wei)');
        console.log('  - Nonce:', nonce.toString());
        console.log('  - Receiver:', receiver);
        console.log('  - Executor:', executor);
        
        const signature = await this.signer.signMessage(message);
        console.log('  - Signature generated:', signature.substring(0, 20) + '...');
        
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

            const userAddress = ethers.utils.getAddress(this.account);
            
            // Generate a unique staking nonce - use timestamp + random to avoid collisions
            // Keep trying until we find an unused nonce
            let stakingNonceNum;
            let attempts = 0;
            const maxAttempts = 10;
            do {
                // Use timestamp + random component to ensure uniqueness
                stakingNonceNum = Date.now() + Math.floor(Math.random() * 1000000);
                const isUsed = await this.stakingContract.checkIfStakeNonceUsed(userAddress, stakingNonceNum);
                if (!isUsed) {
                    break;
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new Error('Could not generate a unique nonce. Please try again.');
                }
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 100));
            } while (true);
            
            console.log('✅ Generated unique staking nonce:', stakingNonceNum);
            
            // Get EVVM sync nonce
            const evvmNonce = await this.getNextSyncNonce();
            const evvmNonceNum = Number(evvmNonce);
            console.log('✅ EVVM sync nonce:', evvmNonceNum);
            
            // Build exact message that contract will verify
            // Contract: string.concat(evvmID, ",", "publicStaking", ",", string.concat("true", ",", amount, ",", nonce))
            const expectedMessage = `${evvmIDForSignature},publicStaking,true,${amountForContract},${stakingNonceNum}`;
            console.log('📝 Expected signature message:', expectedMessage);
            console.log('📝 Message length:', expectedMessage.length);
            
            // Generate signatures
            console.log('🔐 Generating staking signature...');
            const stakingSignature = await this.generateStakingSignature(true, amountForContract, stakingNonceNum);
            console.log('✅ Staking signature generated');
            
            console.log('🔐 Generating EVVM signature...');
            const evvmSignature = await this.generateEVVMSignature(
                totalAmount,
                evvmNonceNum,
                0,
                false
            );
            console.log('✅ EVVM signature generated');
            
            // Verify balance before attempting transaction
            const balance = await this.getUserBalance();
            const balanceNum = parseFloat(balance);
            const requiredAmount = parseFloat(amount) * parseFloat(price);
            console.log(`💰 Balance: ${balanceNum} HGM, Required: ${requiredAmount} HGM`);
            
            if (balanceNum < requiredAmount) {
                throw new Error(`Insufficient balance. You have ${balanceNum.toFixed(4)} HGM, but need ${requiredAmount.toFixed(4)} HGM`);
            }
            
            console.log('📤 Sending transaction...');
            const tx = await this.stakingContract.publicStaking(
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

            return tx;
        } catch (error) {
            console.error('Staking error:', error);
            
            // Try to decode the error for better user feedback
            if (error.message && error.message.includes('execution reverted')) {
                // Check for specific error reasons
                if (error.message.includes('InvalidSignature') || error.data === '0x8baa579f') {
                    throw new Error('Invalid signature. This usually means:\n1. EVVM ID mismatch - ensure EVVM ID is set correctly on contract\n2. Message format mismatch - please refresh and try again\n3. Nonce already used - try again with a new transaction');
                }
                if (error.message.includes('StakingNonceAlreadyUsed')) {
                    throw new Error('This nonce has already been used. Please try again.');
                }
                if (error.message.includes('InsufficientBalance')) {
                    throw new Error('Insufficient balance. Please ensure you have enough HGM tokens.');
                }
                if (error.message.includes('PublicStakingDisabled')) {
                    throw new Error('Public staking is currently disabled.');
                }
                throw new Error('Transaction failed. Check console for details. Possible issues: Invalid signature, insufficient balance, nonce already used, or public staking disabled.');
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
            // Check unlock times
            const unlockTimes = await this.getUnlockTimes();
            const staked = await this.getUserStakedAmount();
            const stakedNum = parseFloat(staked);
            
            // Check if trying to unstake all tokens
            const amountNum = parseFloat(amount);
            const amountForContract = Math.floor(amountNum);
            
            if (amountForContract <= 0) {
                throw new Error('Unstaking amount must be at least 1 staking token');
            }

            if (amountForContract > stakedNum) {
                throw new Error(`Cannot unstake ${amountForContract} tokens. You only have ${stakedNum} staked.`);
            }

            // Check if full unstake (all tokens)
            const isFullUnstake = amountForContract >= stakedNum;
            
            if (isFullUnstake && !unlockTimes.canUnstake) {
                const unlockDate = unlockTimes.fullUnstakeUnlockDate;
                throw new Error(`Full unstaking is locked until ${unlockDate ? unlockDate.toLocaleString() : 'unknown'}. You can only partially unstake for now.`);
            }

            // Generate unique nonce
            let stakingNonceNum;
            let attempts = 0;
            const maxAttempts = 10;
            do {
                stakingNonceNum = Date.now() + Math.floor(Math.random() * 1000000);
                const isUsed = await this.stakingContract.checkIfStakeNonceUsed(this.account, stakingNonceNum);
                if (!isUsed) {
                    break;
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new Error('Could not generate a unique nonce. Please try again.');
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            } while (true);

            const evvmNonce = await this.getNextSyncNonce();
            const evvmNonceNum = Number(evvmNonce);

            console.log('🔓 Unstaking with:');
            console.log('  - Amount:', amountForContract, 'staking tokens');
            console.log('  - Nonce:', stakingNonceNum);
            console.log('  - Is full unstake:', isFullUnstake);

            const stakingSignature = await this.generateStakingSignature(false, amountForContract, stakingNonceNum);
            // For unstaking, we still need EVVM signature but amount is 0 (no payment needed)
            const evvmSignature = await this.generateEVVMSignature(
                '0',           // amount = 0 for unstaking
                0,              // priority fee (optional)
                evvmNonceNum,   // nonce
                false           // sync
            );
            
            const tx = await this.stakingContract.publicStaking(
                this.account,
                false, // isStaking
                amountForContract, // amountOfStaking (must be integer, in staking tokens)
                stakingNonceNum,
                stakingSignature,
                0,      // priorityFee_EVVM (optional for unstaking)
                evvmNonceNum,
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
     * Wait for transaction confirmation with status updates
     */
    async waitForTransaction(tx, onStatusUpdate = null) {
        if (onStatusUpdate) {
            onStatusUpdate('pending', 'Transaction submitted, waiting for confirmation...');
        }
        
        try {
            const receipt = await tx.wait();
            
            if (onStatusUpdate) {
                onStatusUpdate('confirmed', 'Transaction confirmed!');
            }
            
            return receipt;
        } catch (error) {
            if (onStatusUpdate) {
                onStatusUpdate('failed', 'Transaction failed: ' + error.message);
            }
            throw error;
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(txHash) {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            if (receipt) {
                return {
                    status: receipt.status === 1 ? 'success' : 'failed',
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    confirmations: receipt.confirmations
                };
            }
            return { status: 'pending' };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Get user's staking tier based on staked amount
     */
    async getStakingTier() {
        if (!this.account) return 0;
        
        try {
            const staked = await this.getUserStakedAmount();
            const stakedNum = parseFloat(staked);
            
            // Define tier thresholds (adjust based on your game design)
            if (stakedNum >= 100) return 5; // Tier 5: 100+ staking tokens
            if (stakedNum >= 50) return 4;  // Tier 4: 50-99
            if (stakedNum >= 25) return 3;  // Tier 3: 25-49
            if (stakedNum >= 10) return 2;  // Tier 2: 10-24
            if (stakedNum >= 1) return 1;   // Tier 1: 1-9
            return 0; // No tier
        } catch (error) {
            console.error('Error getting staking tier:', error);
            return 0;
        }
    }

    /**
     * Get unlock times for staking operations
     */
    async getUnlockTimes() {
        if (!this.account) {
            return {
                canStake: false,
                canUnstake: false,
                stakeUnlockTime: 0,
                fullUnstakeUnlockTime: 0
            };
        }

        if (!this.stakingContract) {
            console.warn('Staking contract not initialized');
            return {
                canStake: false,
                canUnstake: false,
                stakeUnlockTime: 0,
                fullUnstakeUnlockTime: 0
            };
        }

        try {
            const stakeUnlockTime = await this.stakingContract.getTimeToUserUnlockStakingTime(this.account);
            const fullUnstakeUnlockTime = await this.stakingContract.getTimeToUserUnlockFullUnstakingTime(this.account);
            const currentTime = Math.floor(Date.now() / 1000);

            return {
                canStake: Number(stakeUnlockTime) === 0 || Number(stakeUnlockTime) <= currentTime,
                canUnstake: Number(fullUnstakeUnlockTime) === 0 || Number(fullUnstakeUnlockTime) <= currentTime,
                stakeUnlockTime: Number(stakeUnlockTime),
                fullUnstakeUnlockTime: Number(fullUnstakeUnlockTime),
                stakeUnlockDate: Number(stakeUnlockTime) > 0 ? new Date(Number(stakeUnlockTime) * 1000) : null,
                fullUnstakeUnlockDate: Number(fullUnstakeUnlockTime) > 0 ? new Date(Number(fullUnstakeUnlockTime) * 1000) : null
            };
        } catch (error) {
            console.error('Error getting unlock times:', error);
            return {
                canStake: false,
                canUnstake: false,
                stakeUnlockTime: 0,
                fullUnstakeUnlockTime: 0
            };
        }
    }

    /**
     * Get estimated rewards (if available from estimator)
     * Note: This requires calling the contract which may consume gas
     */
    async getEstimatedRewards() {
        if (!this.account) return null;

        try {
            // Check if user has staking history first
            const history = await this.getStakingHistory();
            if (!history || history.length === 0) {
                return null;
            }

            // Note: gimmeYiel actually claims rewards, so we can't just "estimate"
            // Instead, we'll check the history for reward transactions
            const rewardTransactions = history.filter(h => 
                h.type !== '0x0000000000000000000000000000000000000000000000000000000000000001' && // not stake
                h.type !== '0x0000000000000000000000000000000000000000000000000000000000000002'   // not unstake
            );

            if (rewardTransactions.length > 0) {
                const latestReward = rewardTransactions[rewardTransactions.length - 1];
                return {
                    hasRewards: true,
                    latestReward: {
                        type: latestReward.type,
                        amount: latestReward.amount,
                        timestamp: latestReward.timestamp
                    },
                    totalRewardTransactions: rewardTransactions.length
                };
            }

            return {
                hasRewards: false,
                message: 'No rewards available yet. Keep staking to earn rewards!'
            };
        } catch (error) {
            console.log('Reward check error:', error.message);
            return null;
        }
    }

    /**
     * Get complete staking information
     */
    async getCompleteStakingInfo() {
        if (!this.account) return null;

        try {
            const [
                staked,
                balance,
                price,
                enabled,
                tier,
                unlockTimes,
                history,
                isStaker
            ] = await Promise.all([
                this.getUserStakedAmount(),
                this.getUserBalance(),
                this.getStakingPrice(),
                this.isPublicStakingEnabled(),
                this.getStakingTier(),
                this.getUnlockTimes(),
                this.getStakingHistory(),
                this.evvmContract.isAddressStaker(this.account)
            ]);

            return {
                staked: parseFloat(staked),
                balance: parseFloat(balance),
                price: parseFloat(price),
                enabled,
                tier,
                unlockTimes,
                history,
                isStaker,
                canPlay: parseFloat(staked) > 0 && enabled
            };
        } catch (error) {
            console.error('Error getting complete staking info:', error);
            return null;
        }
    }

    /**
     * Listen to contract events (using transaction receipts since contract doesn't emit events)
     */
    async watchTransaction(txHash, onUpdate = null) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    const receipt = await this.provider.getTransactionReceipt(txHash);
                    if (receipt) {
                        clearInterval(checkInterval);
                        
                        if (receipt.status === 1) {
                            if (onUpdate) onUpdate('confirmed', receipt);
                            resolve(receipt);
                        } else {
                            if (onUpdate) onUpdate('failed', receipt);
                            reject(new Error('Transaction failed'));
                        }
                    } else if (onUpdate) {
                        onUpdate('pending', null);
                    }
                } catch (error) {
                    clearInterval(checkInterval);
                    reject(error);
                }
            }, 2000); // Check every 2 seconds

            // Timeout after 5 minutes
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Transaction timeout'));
            }, 300000);
        });
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Batch get staking info for multiple addresses
     * Useful for leaderboards or admin views
     */
    async getBatchStakingInfo(addresses) {
        if (!addresses || addresses.length === 0) return [];
        
        if (!this.stakingContract) {
            console.warn('Staking contract not initialized');
            return addresses.map(addr => ({ address: addr, staked: 0, tier: 0 }));
        }

        try {
            const promises = addresses.map(async (address) => {
                try {
                    const staked = await this.stakingContract.getUserAmountStaked(address);
                    const tier = await this.getStakingTierForAddress(address);
                    return {
                        address,
                        staked: parseFloat(ethers.utils.formatEther(staked)),
                        tier
                    };
                } catch (error) {
                    console.error(`Error getting info for ${address}:`, error);
                    return {
                        address,
                        staked: 0,
                        tier: 0,
                        error: error.message
                    };
                }
            });

            return await Promise.all(promises);
        } catch (error) {
            console.error('Batch staking info error:', error);
            return [];
        }
    }

    /**
     * Get staking tier for a specific address
     */
    async getStakingTierForAddress(address) {
        if (!this.stakingContract) {
            console.warn('Staking contract not initialized');
            return 0;
        }
        
        try {
            const staked = await this.stakingContract.getUserAmountStaked(address);
            const stakedNum = parseFloat(ethers.utils.formatEther(staked));
            
            if (stakedNum >= 100) return 5;
            if (stakedNum >= 50) return 4;
            if (stakedNum >= 25) return 3;
            if (stakedNum >= 10) return 2;
            if (stakedNum >= 1) return 1;
            return 0;
        } catch (error) {
            console.error('Error getting tier:', error);
            return 0;
        }
    }

    /**
     * Get leaderboard (top stakers)
     * Note: This requires knowing addresses or using an indexer
     */
    async getLeaderboard(addresses, limit = 10) {
        const info = await this.getBatchStakingInfo(addresses);
        
        // Sort by staked amount descending
        info.sort((a, b) => b.staked - a.staked);
        
        // Return top N
        return info.slice(0, limit).map((item, index) => ({
            rank: index + 1,
            ...item
        }));
    }

    /**
     * Calculate HGM needed for staking tokens
     */
    calculateHGMForStaking(stakingTokens) {
        const price = 5083; // PRICE_OF_STAKING / 10^18
        return stakingTokens * price;
    }

    /**
     * Calculate staking tokens from HGM
     */
    calculateStakingFromHGM(hgmAmount) {
        const price = 5083;
        return hgmAmount / price;
    }

    /**
     * Get contract configuration
     */
    async getContractConfig() {
        try {
            const [
                stakingPrice,
                publicStakingEnabled,
                stakeUnlockSeconds,
                fullUnstakeUnlockSeconds,
                evvmID
            ] = await Promise.all([
                this.getStakingPrice(),
                this.isPublicStakingEnabled(),
                this.stakingContract.getSecondsToUnlockStaking(),
                this.stakingContract.getSecondsToUnlockFullUnstaking(),
                this.evvmContract.getEvvmID()
            ]);

            return {
                stakingPrice: parseFloat(stakingPrice),
                publicStakingEnabled,
                stakeUnlockSeconds: Number(stakeUnlockSeconds),
                fullUnstakeUnlockSeconds: Number(fullUnstakeUnlockSeconds),
                evvmID: evvmID.toString(),
                stakingAddress: this.STAKING_ADDRESS,
                evvmAddress: this.EVVM_ADDRESS,
                chainId: this.chainId
            };
        } catch (error) {
            console.error('Error getting contract config:', error);
            return null;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Web3Integration;
}

