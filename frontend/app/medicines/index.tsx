import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMedicines } from '../../hooks/useMedicines';
import { format, parseISO, isAfter } from 'date-fns';

export default function MedicinesScreen() {
  const { medicines, loading, deleteMedicine, refetch } = useMedicines();

  const handleDeleteMedicine = (id: string, name: string) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteMedicine(id) 
        }
      ]
    );
  };

  const getExpiryStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return null;
    
    try {
      const expiry = parseISO(expiryDate);
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (isAfter(now, expiry)) {
        return { status: 'expired', color: '#F44336' };
      } else if (isAfter(thirtyDaysLater, expiry)) {
        return { status: 'expiring', color: '#FF9800' };
      }
    } catch {
      return null;
    }
    return null;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'pain_relief': '#FF5722',
      'antibiotics': '#2196F3',
      'vitamins': '#4CAF50',
      'heart': '#E91E63',
      'diabetes': '#9C27B0',
      'general': '#666'
    };
    return colors[category] || colors.general;
  };

  const MedicineCard = ({ medicine }: { medicine: any }) => {
    const expiryStatus = getExpiryStatus(medicine.expiry_date);
    
    return (
      <TouchableOpacity 
        style={styles.medicineCard}
        onPress={() => router.push(`/medicines/${medicine.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.medicineHeader}>
          <View style={styles.medicineInfo}>
            <Text style={styles.medicineName}>{medicine.name}</Text>
            <Text style={styles.medicineDosage}>{medicine.dosage} • {medicine.frequency}</Text>
            
            <View style={styles.categoryContainer}>
              <View 
                style={[
                  styles.categoryBadge, 
                  { backgroundColor: getCategoryColor(medicine.category) }
                ]}
              >
                <Text style={styles.categoryText}>{medicine.category || 'general'}</Text>
              </View>
              
              {expiryStatus && (
                <View 
                  style={[
                    styles.statusBadge,
                    { backgroundColor: expiryStatus.color }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {expiryStatus.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleDeleteMedicine(medicine.id, medicine.name)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.medicineDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="layers-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Stock: {medicine.stock_quantity}</Text>
          </View>
          
          {medicine.expiry_date && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                Expires: {format(parseISO(medicine.expiry_date), 'MMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>
        
        {medicine.instructions && (
          <Text style={styles.instructions} numberOfLines={2}>
            {medicine.instructions}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Medicines</Text>
        <TouchableOpacity 
          onPress={() => router.push('/medicines/add')} 
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Medicines Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first medicine to start tracking your health
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/medicines/add')}
            >
              <Text style={styles.emptyButtonText}>Add Medicine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.medicinesList}>
            {medicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </View>
        )}
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
  addButton: {
    padding: 4
  },
  content: {
    flex: 1,
    padding: 20
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  medicinesList: {
    paddingBottom: 20
  },
  medicineCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  medicineInfo: {
    flex: 1,
    marginRight: 16
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  medicineDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  deleteButton: {
    padding: 8
  },
  medicineDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20
  }
});
