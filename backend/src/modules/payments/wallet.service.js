const Wallet = require('./wallet.model');
const Transaction = require('./transaction.model');
const mongoose = require('mongoose');

/**
 * Wallet Service
 * Handles all wallet operations with transaction atomicity
 */

/**
 * Get or create wallet for a user
 */
async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ userId });
  
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0 });
  }
  
  return wallet;
}

/**
 * Get wallet balance
 */
async function getBalance(userId) {
  const wallet = await getOrCreateWallet(userId);
  const pendingWithdrawalAmount = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(userId)),
        type: 'withdrawal',
        status: 'pending'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const pendingAmount = pendingWithdrawalAmount[0]?.total || 0;

  return {
    balance: wallet.balance,
    pendingWithdrawalAmount: pendingAmount,
    availableWithdrawalBalance: Math.max(wallet.balance - pendingAmount, 0),
    totalDeposited: wallet.totalDeposited,
    totalWithdrawn: wallet.totalWithdrawn,
    totalSpent: wallet.totalSpent,
    totalEarned: wallet.totalEarned
  };
}

/**
 * Increment wallet balance (atomic operation)
 * Used for deposits and earnings
 */
async function incrementBalance(userId, amount, type = 'deposit', description, metadata = {}, retries = 3) {
  if (amount <= 0) {
    throw new Error('Số tiền phải lớn hơn 0');
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const wallet = await getOrCreateWallet(userId);
      
      // Get balance before transaction
      const balanceBefore = wallet.balance;
      
      // Update wallet balance
      if (type === 'deposit') {
        wallet.balance += amount;
        wallet.totalDeposited += amount;
      } else if (type === 'earning') {
        wallet.balance += amount;
        wallet.totalEarned += amount;
      } else {
        wallet.balance += amount;
      }
      
      await wallet.save({ session });
      
      // Create transaction record
      await Transaction.create([{
        walletId: wallet._id,
        userId: userId,
        type: type,
        amount: amount,
        status: 'completed',
        description: description,
        balanceBefore: balanceBefore,
        balanceAfter: wallet.balance,
        completedAt: new Date(),
        metadata: metadata
      }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      return wallet;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      // Retry on WriteConflict or TransientTransactionError
      if ((error.code === 112 || error.errorLabels?.includes('TransientTransactionError')) && attempt < retries) {
        console.log(`⚠️  Transaction conflict, retrying (${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

/**
 * Decrement wallet balance (atomic operation)
 * Used for payments and withdrawals
 */
async function decrementBalance(userId, amount, type = 'payment', description, metadata = {}, retries = 3) {
  if (amount <= 0) {
    throw new Error('Số tiền phải lớn hơn 0');
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const wallet = await getOrCreateWallet(userId);
      
      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new Error('Số dư không đủ');
      }
      
      // Get balance before transaction
      const balanceBefore = wallet.balance;
      
      // Update wallet balance
      if (type === 'payment') {
        wallet.balance -= amount;
        wallet.totalSpent += amount;
      } else if (type === 'withdrawal') {
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
      } else {
        wallet.balance -= amount;
      }
      
      await wallet.save({ session });
      
      // Create transaction record
      await Transaction.create([{
        walletId: wallet._id,
        userId: userId,
        type: type,
        amount: amount,
        status: 'completed',
        description: description,
        balanceBefore: balanceBefore,
        balanceAfter: wallet.balance,
        completedAt: new Date(),
        metadata: metadata
      }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      return wallet;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      // Don't retry on insufficient balance
      if (error.message === 'Số dư không đủ') {
        throw error;
      }
      
      // Retry on WriteConflict or TransientTransactionError
      if ((error.code === 112 || error.errorLabels?.includes('TransientTransactionError')) && attempt < retries) {
        console.log(`⚠️  Transaction conflict, retrying (${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

/**
 * Get transaction history
 */
async function getTransactions(userId, filters = {}, pagination = {}) {
  const wallet = await getOrCreateWallet(userId);
  
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Build query
  const query = { walletId: wallet._id };
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }
  
  // Get transactions
  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('orderId', 'agreedAmount status');
  
  const total = await Transaction.countDocuments(query);
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Create transaction record (without affecting balance)
 * Used for pending transactions like withdrawal requests
 */
async function createTransaction(userId, data) {
  const wallet = await getOrCreateWallet(userId);
  
  const transaction = await Transaction.create({
    walletId: wallet._id,
    userId: userId,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance,
    ...data
  });
  
  return transaction;
}

/**
 * Create withdrawal request
 */
async function createWithdrawal(userId, withdrawalData) {
  const { amount, bankAccount, bankName, accountHolder } = withdrawalData;
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('Số tiền rút không hợp lệ');
  }

  if (!Number.isInteger(normalizedAmount)) {
    throw new Error('Số tiền rút phải là số nguyên VND');
  }

  if (normalizedAmount < 50000) {
    throw new Error('Số tiền rút tối thiểu là 50,000 VND');
  }

  if (!bankAccount || String(bankAccount).trim().length < 6) {
    throw new Error('Số tài khoản ngân hàng không hợp lệ');
  }

  if (!bankName || String(bankName).trim().length < 2) {
    throw new Error('Tên ngân hàng không hợp lệ');
  }

  if (!accountHolder || String(accountHolder).trim().length < 2) {
    throw new Error('Tên chủ tài khoản không hợp lệ');
  }
  
  // Check if user has sufficient balance
  const balance = await getBalance(userId);
  if (balance.availableWithdrawalBalance < normalizedAmount) {
    throw new Error('Số dư không đủ để thực hiện giao dịch này');
  }
  
  // Create withdrawal transaction record
  const withdrawal = await createTransaction(userId, {
    type: 'withdrawal',
    amount: normalizedAmount,
    status: 'pending',
    description: `Yêu cầu rút tiền về ${String(bankName).trim()} - ${String(bankAccount).trim()}`,
    metadata: {
      bankAccount: String(bankAccount).trim(),
      bankName: String(bankName).trim(),
      accountHolder: String(accountHolder).trim(),
      availableBalanceAtRequest: balance.availableWithdrawalBalance,
      requestedAt: new Date()
    }
  });
  
  return withdrawal;
}

module.exports = {
  getOrCreateWallet,
  getBalance,
  incrementBalance,
  decrementBalance,
  getTransactions,
  createTransaction,
  createWithdrawal
};