import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface FamilyMember {
  id: string;
  full_name: string;
  email: string;
  blood_type?: string;
  allergies?: string[];
}

export default function FamilyScreen() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchFamilyMembers = async () => {
    try {
      setRefreshing(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/family/members`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      } else {
        console.error('Failed to fetch family members');
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const inviteFamilyMember = async () => {
    if (!inviteEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/family/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ invitee_email: inviteEmail })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setInviteEmail('');
        fetchFamilyMembers();
      } else {
        Alert.alert('Error', data.detail || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting family member:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const FamilyMemberCard = ({ member }: { member: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#4CAF50" />
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{member.full_name}</Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
          
          <View style={styles.memberTags}>
            {member.blood_type && (
              <View style={styles.tag}>
                <Ionicons name="water" size={12} color="#F44336" />
                <Text style={[styles.tagText, { color: '#F44336' }]}>Blood: {member.blood_type}</Text>
              </View>
            )}
            {member.allergies && member.allergies.length > 0 && (
              <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="warning" size={12} color="#FF9800" />
                <Text style={[styles.tagText, { color: '#FF9800' }]}>
                  {member.allergies.length} Allergies
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.viewButton}>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Family</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchFamilyMembers} />
        }
      >
        {/* Invite Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Family Member</Text>
          <Text style={styles.sectionSubtitle}>
            Add family members to share health information and coordinate care
          </Text>
          
          <View style={styles.inviteContainer}>
            <View style={styles.inviteInputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.inviteInput}
                placeholder="Enter email address"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity 
              style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
              onPress={inviteFamilyMember}
              disabled={loading}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members ({familyMembers.length})</Text>
          
          {familyMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>No Family Members Yet</Text>
              <Text style={styles.emptySubtitle}>
                Invite family members to start sharing health information
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {familyMembers.map((member) => (
                <FamilyMemberCard key={member.id} member={member} />
              ))}
            </View>
          )}
        </View>

        {/* Family Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Features</Text>
          
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="bar-chart" size={24} color="#4CAF50" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Family Health Dashboard</Text>
              <Text style={styles.featureSubtitle}>View family-wide health metrics</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="notifications" size={24} color="#2196F3" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Shared Reminders</Text>
              <Text style={styles.featureSubtitle}>Get notified about family medication</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#FF9800" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Emergency Contacts</Text>
              <Text style={styles.featureSubtitle}>Quick access to family emergency info</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
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
  placeholder: {
    width: 32
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
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20
  },
  inviteContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  inviteInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  inputIcon: {
    marginRight: 12
  },
  inviteInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333'
  },
  inviteButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inviteButtonDisabled: {
    opacity: 0.7
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  membersList: {
    gap: 12
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  memberDetails: {
    flex: 1
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4
  },
  viewButton: {
    padding: 8
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  featureInfo: {
    flex: 1
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#666'
  }
});
