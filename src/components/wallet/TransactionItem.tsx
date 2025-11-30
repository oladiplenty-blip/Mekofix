import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletTransaction } from '../../services/walletService';

interface TransactionItemProps {
  transaction: WalletTransaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const getTransactionIcon = () => {
    switch (transaction.transaction_type) {
      case 'commission_deduction':
        return 'remove-circle-outline';
      case 'withdrawal':
        return 'cash-outline';
      case 'top_up':
        return 'add-circle-outline';
      case 'credit':
        return 'arrow-down-circle-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getTransactionColor = () => {
    if (transaction.amount < 0) {
      return '#FF3B30'; // Red for deductions/withdrawals
    }
    return '#34C759'; // Green for credits/top-ups
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    return `₦${absAmount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getTransactionIcon()}
          size={24}
          color={getTransactionColor()}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
        {transaction.status === 'pending' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        )}
      </View>
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            { color: getTransactionColor() },
          ]}
        >
          {transaction.amount < 0 ? '-' : '+'}
          {formatAmount(transaction.amount)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFD60A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

