import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface AdherenceStats {
  adherence_rate: number;
  total_doses: number;
  taken_doses: number;
  missed_doses: number;
  period_days: number;
}

interface ExpiringMedicine {
  id: string;
  name: string;
  expiry_date: string;
  stock_quantity: number;
}

export default function AnalyticsScreen() {
  const [adherenceStats, setAdherenceStats] = useState<AdherenceStats | null>(null);
  const [expiringMedicines, setExpiringMedicines] = useState<ExpiringMedicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const headers = await getAuthHeaders();
      
      // Fetch adherence stats
      const adherenceResponse = await fetch(`${API_URL}/analytics/adherence`, { headers });
      if (adherenceResponse.ok) {
        const adherenceData = await adherenceResponse.json();
        setAdherenceStats(adherenceData);
      }
      
      // Fetch expiring medicines
      const expiringResponse = await fetch(`${API_URL}/analytics/upcoming-expiries`, { headers });
      if (expiringResponse.ok) {
        const expiringData = await expiringResponse.json();
        setExpiringMedicines(expiringData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return '#4CAF50';
    if (rate >= 70) return '#FF9800';
    return '#F44336';
  };

  const getAdherenceStatus = (rate: number) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Good';
    if (rate >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#4CAF50' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <Text style={[styles.percentageText, { color }]}>
          {Math.round(percentage)}%
        </Text>
        <View 
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: '#E0E0E0'
            }
          ]}
        />
        <View 
          style={[
            styles.progressCircle,
            styles.progressOverlay,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '-90deg' }]
            }
          ]}
        />
      </View>
    );
  };

  const StatsCard = ({ icon, title, value, subtitle, color }: any) => (
    <View style={[styles.statsCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statsHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statsValue}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Health Analytics</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAnalytics} />
        }
      >
        {/* Adherence Overview */}
        {adherenceStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Adherence</Text>
            <Text style={styles.sectionSubtitle}>Last 30 days</Text>
            
            <View style={styles.adherenceCard}>
              <View style={styles.adherenceMain}>
                <CircularProgress 
                  percentage={adherenceStats.adherence_rate} 
                  color={getAdherenceColor(adherenceStats.adherence_rate)}
                />
                <View style={styles.adherenceInfo}>
                  <Text style={[
                    styles.adherenceStatus, 
                    { color: getAdherenceColor(adherenceStats.adherence_rate) }
                  ]}>
                    {getAdherenceStatus(adherenceStats.adherence_rate)}
                  </Text>
                  <Text style={styles.adherenceDescription}>
                    You've taken {adherenceStats.taken_doses} out of {adherenceStats.total_doses} scheduled doses
                  </Text>
                </View>
              </View>
              
              <View style={styles.adherenceStats}>
                <View style={styles.adherenceStatItem}>
                  <Text style={styles.adherenceStatNumber}>{adherenceStats.taken_doses}</Text>
                  <Text style={styles.adherenceStatLabel}>Taken</Text>
                </View>
                <View style={styles.adherenceStatItem}>
                  <Text style={[styles.adherenceStatNumber, { color: '#F44336' }]}>{adherenceStats.missed_doses}</Text>
                  <Text style={styles.adherenceStatLabel}>Missed</Text>
                </View>
                <View style={styles.adherenceStatItem}>
                  <Text style={styles.adherenceStatNumber}>{adherenceStats.total_doses}</Text>
                  <Text style={styles.adherenceStatLabel}>Total</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          
          <View style={styles.statsGrid}>
            <StatsCard 
              icon="medical"
              title="Active Medicines"
              value="0"
              subtitle="Currently tracking"
              color="#4CAF50"
            />
            <StatsCard 
              icon="calendar"
              title="Streak"
              value="0 days"
              subtitle="Consistency record"
              color="#2196F3"
            />
            <StatsCard 
              icon="trending-up"
              title="Improvement"
              value="+0%"
              subtitle="vs last month"
              color="#FF9800"
            />
            <StatsCard 
              icon="shield-checkmark"
              title="Health Score"
              value="85"
              subtitle="Overall rating"
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Expiring Medicines */}
        {expiringMedicines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expiring Soon</Text>
            <Text style={styles.sectionSubtitle}>Medicines expiring in the next 30 days</Text>
            
            {expiringMedicines.map((medicine) => (
              <View key={medicine.id} style={styles.expiringCard}>
                <View style={styles.expiringInfo}>
                  <Text style={styles.expiringName}>{medicine.name}</Text>
                  <Text style={styles.expiringDate}>
                    Expires: {new Date(medicine.expiry_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.expiringStock}>
                    Stock: {medicine.stock_quantity} remaining
                  </Text>
                </View>
                <View style={styles.expiringAction}>
                  <Ionicons name="warning" size={24} color="#FF9800" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Health Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          
          <View style={styles.insightCard}>
            <Ionicons name="bulb" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Great job maintaining your medication schedule!</Text>
              <Text style={styles.insightText}>
                Your adherence rate shows consistent medication management. Keep up the excellent work!
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="trending-up" size={24} color="#2196F3" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Consider setting up reminders</Text>
              <Text style={styles.insightText}>
                Adding medication reminders can help improve your adherence rate even further.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    padding: 4
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  filterButton: {
    padding: 4
  },
  content: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  adherenceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  adherenceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  circularProgress: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24
  },
  percentageText: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    zIndex: 1
  },
  progressCircle: {
    position: 'absolute'
  },
  progressOverlay: {
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent'
  },
  adherenceInfo: {
    flex: 1
  },
  adherenceStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  adherenceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  adherenceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  adherenceStatItem: {
    alignItems: 'center'
  },
  adherenceStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  adherenceStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    flex: 1,
    minWidth: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#666'
  },
  expiringCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  expiringInfo: {
    flex: 1
  },
  expiringName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  expiringDate: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 2
  },
  expiringStock: {
    fontSize: 14,
    color: '#666'
  },
  expiringAction: {
    padding: 8
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  insightContent: {
    flex: 1,
    marginLeft: 16
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
});
