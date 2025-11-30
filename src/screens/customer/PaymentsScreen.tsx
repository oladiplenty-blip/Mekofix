import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { serviceRequestService } from '../../services/serviceRequestService';
import { ServiceRequest } from '../../types';
import { CustomerStackParamList } from '../../navigation/types';

type PaymentsScreenNavigationProp = StackNavigationProp<CustomerStackParamList>;

export const PaymentsScreen: React.FC = () => {
  const navigation = useNavigation<PaymentsScreenNavigationProp>();
  const [payments, setPayments] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestService.getServiceRequests();
      if (response.success) {
        // Filter only completed transactions with payment info
        const completedPayments = response.data.filter(
          (req) => req.status === 'completed' && req.total_cost
        );
        setPayments(completedPayments);
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toFixed(2)}`;
  };

  const renderPayment = ({ item }: { item: ServiceRequest }) => {
    return (
      <TouchableOpacity
        style={styles.paymentCard}
        onPress={() => {
          navigation.navigate('RequestTracking', { requestId: item.id });
        }}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={styles.mechanicName}>
              {item.mechanic?.full_name || 'Unknown Mechanic'}
            </Text>
            <Text style={styles.date}>{formatDate(item.completed_at || item.created_at)}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{formatCurrency(item.total_cost || 0)}</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>PAID</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              {item.vehicle
                ? `${item.vehicle.car_name} ${item.vehicle.car_model}`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="build-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{item.category?.name || 'N/A'}</Text>
          </View>
          {item.labor_cost && (
            <View style={styles.costBreakdown}>
              <Text style={styles.costLabel}>Labor: {formatCurrency(item.labor_cost)}</Text>
              {item.material_cost && (
                <Text style={styles.costLabel}>
                  Materials: {formatCurrency(item.material_cost)}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalSpent = payments.reduce((sum, payment) => sum + (payment.total_cost || 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Spent</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
        <Text style={styles.summaryCount}>{payments.length} transactions</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyText}>No payment history</Text>
          <Text style={styles.emptySubtext}>
            Your completed service payments will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 32,
  },
  summaryCard: {
    backgroundColor: '#000000',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listContent: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentDetails: {
    borderTopWidth: 0.5,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
  },
  costBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#F2F2F7',
  },
  costLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});

