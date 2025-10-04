import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const quickActions = [
    {
      id: '1',
      title: 'Add Medicine',
      icon: 'medical-outline' as keyof typeof Ionicons.glyphMap,
      color: '#4CAF50',
      onPress: () => router.push('/medicines/add')
    },
    {
      id: '2', 
      title: 'Scan Prescription',
      icon: 'camera-outline' as keyof typeof Ionicons.glyphMap,
      color: '#2196F3',
      onPress: () => router.push('/prescription-scan')
    },
    {
      id: '3',
      title: 'Family',
      icon: 'people-outline' as keyof typeof Ionicons.glyphMap, 
      color: '#FF9800',
      onPress: () => router.push('/family')
    },
    {
      id: '4',
      title: 'Emergency Card',
      icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
      color: '#F44336', 
      onPress: () => router.push('/emergency-card')
    }
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <View style={styles.header}>
            <Ionicons name="medical" size={80} color="#4CAF50" />
            <Text style={styles.title}>HealthHub</Text>
            <Text style={styles.subtitle}>Your Personal Healthcare Assistant</Text>
          </View>
          
          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user.full_name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.color }]}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Ionicons name={action.icon} size={32} color="white" />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          
          <TouchableOpacity 
            style={styles.overviewCard}
            onPress={() => router.push('/medicines')}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="pill" size={24} color="#4CAF50" />
              <Text style={styles.overviewTitle}>My Medicines</Text>
            </View>
            <Text style={styles.overviewSubtext}>Manage your medication schedule</Text>
            <View style={styles.overviewArrow}>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.overviewCard}
            onPress={() => router.push('/analytics')}
          >
            <View style={styles.overviewHeader}>
              <Ionicons name="analytics" size={24} color="#2196F3" />
              <Text style={styles.overviewTitle}>Health Analytics</Text>
            </View>
            <Text style={styles.overviewSubtext}>Track your medication adherence</Text>
            <View style={styles.overviewArrow}>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    padding: 20
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 50
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24
  },
  authButtons: {
    width: '100%',
    maxWidth: 300
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#4CAF50'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50'
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600'
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  logoutButton: {
    padding: 8
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickActionCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center'
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12
  },
  overviewSubtext: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 48
  },
  overviewArrow: {
    marginLeft: 8
  }
});
