import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { walletService, WalletTransaction } from '../../services/walletService';
import { TransactionItem } from '../../components/wallet/TransactionItem';
import { Button } from '../../components/common/Button';

export const WalletScreen: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadWalletData = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await walletService.getWallet(pageNum, 20);

      if (response.success) {
        setBalance(response.data.balance);
        
        if (append) {
          setTransactions((prev) => [...prev, ...response.data.recent_transactions]);
        } else {
          setTransactions(response.data.recent_transactions);
        }

        setHasMore(pageNum < response.data.pagination.total_pages);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Error loading wallet data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to load wallet data'
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWalletData(1, false);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadWalletData(page + 1, true);
    }
  };

  const handleWithdraw = () => {
    Alert.prompt(
      'Withdraw Funds',
      'Enter the amount you want to withdraw',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw',
          onPress: async (amount) => {
            if (!amount) {
              Alert.alert('Error', 'Please enter an amount');
              return;
            }

            const withdrawAmount = parseFloat(amount);
            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
              Alert.alert('Error', 'Please enter a valid amount');
              return;
            }

            if (withdrawAmount > balance) {
              Alert.alert('Error', 'Insufficient balance');
              return;
            }

            try {
              const response = await walletService.withdraw({
                amount: withdrawAmount,
                bank_details: {
                  // For now, just save the request without bank details
                  // In the future, this could be a form with bank details
                },
              });

              if (response.success) {
                Alert.alert('Success', 'Withdrawal request submitted successfully');
                // Refresh wallet data
                loadWalletData(1, false);
              }
            } catch (error: any) {
              console.error('Error withdrawing:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error?.message || 'Failed to process withdrawal'
              );
            }
          },
        },
      ],
      'plain-text',
      undefined,
      'numeric'
    );
  };

  const formatBalance = (amount: number) => {
    return `₦${amount.toFixed(2)}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
        
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleWithdraw}
          activeOpacity={0.7}
        >
          <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Transaction History</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your transaction history will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={({ item }) => <TransactionItem transaction={item} />}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#8E8E93" />
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  balanceCard: {
    backgroundColor: '#000000',
    padding: 24,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

