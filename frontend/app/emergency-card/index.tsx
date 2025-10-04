import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function EmergencyCardScreen() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const emergencyContacts = [
    {
      id: '1',
      name: 'Emergency Services',
      phone: '911',
      relation: 'Emergency'
    },
    {
      id: '2',
      name: 'Poison Control',
      phone: '1-800-222-1222',
      relation: 'Poison Emergency'
    },
    ...(user?.emergency_contacts || [])
  ];

  const medicalInfo = {
    bloodType: user?.blood_type || 'Unknown',
    allergies: user?.allergies || [],
    conditions: ['None reported'],
    medications: ['See medication list'],
    emergencyNotes: 'No additional notes'
  };

  const handleCall = (phone: string) => {
    Alert.alert(
      'Call Emergency Contact',
      `Do you want to call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Emergency Card',
       'This feature will allow sharing your emergency information with healthcare providers.',
      [{ text: 'OK' }]
    );
  };

  const InfoSection = ({ icon, title, content, isImportant = false }: any) => (
    <View style={[styles.infoSection, isImportant && styles.importantSection]}>
      <View style={styles.sectionHeader}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isImportant ? '#F44336' : '#4CAF50'} 
        />
        <Text style={[styles.sectionTitle, isImportant && styles.importantTitle]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.sectionContent, isImportant && styles.importantContent]}>
        {Array.isArray(content) ? content.join(', ') : content}
      </Text>
    </View>
  );

  const EmergencyContactCard = ({ contact }: any) => (
    <TouchableOpacity 
      style={styles.contactCard}
      onPress={() => handleCall(contact.phone)}
      activeOpacity={0.7}
    >
      <View style={styles.contactInfo}>
        <View style={styles.contactIcon}>
          <Ionicons 
            name={contact.relation === 'Emergency' ? 'medical' : 'person'} 
            size={24} 
            color={contact.relation === 'Emergency' ? '#F44336' : '#4CAF50'} 
          />
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactRelation}>{contact.relation}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
        </View>
      </View>
      <Ionicons name="call" size={20} color="#4CAF50" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Card</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <Ionicons name="medical" size={32} color="white" />
          <Text style={styles.emergencyTitle}>MEDICAL EMERGENCY</Text>
          <Text style={styles.emergencySubtitle}>Show this to medical personnel</Text>
        </View>

        {/* Patient Information */}
        <View style={styles.patientCard}>
          <Text style={styles.patientName}>{user?.full_name || 'Unknown Patient'}</Text>
          <Text style={styles.patientId}>ID: {user?.id?.slice(0, 8) || 'N/A'}</Text>
          
          <View style={styles.criticalInfo}>
            <InfoSection 
              icon="water"
              title="Blood Type"
              content={medicalInfo.bloodType}
              isImportant={true}
            />
            
            {medicalInfo.allergies.length > 0 && (
              <InfoSection 
                icon="warning"
                title="ALLERGIES"
                content={medicalInfo.allergies}
                isImportant={true}
              />
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleCall('911')}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.actionButtonText}>Call 911</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.medicineButton]}
            onPress={() => router.push('/medicines')}
          >
            <Ionicons name="medical" size={24} color="white" />
            <Text style={styles.actionButtonText}>Medicines</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderText}>Emergency Contacts</Text>
          {emergencyContacts.map((contact) => (
            <EmergencyContactCard key={contact.id} contact={contact} />
          ))}
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.sectionHeaderText}>Medical Information</Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.medicalInfo}>
              <InfoSection 
                icon="heart"
                title="Medical Conditions"
                content={medicalInfo.conditions}
              />
              
              <InfoSection 
                icon="medical"
                title="Current Medications"
                content={medicalInfo.medications}
              />
              
              <InfoSection 
                icon="document-text"
                title="Emergency Notes"
                content={medicalInfo.emergencyNotes}
              />
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions for Medical Personnel</Text>
          <Text style={styles.instructionsText}>
            • Check patient's medical allergies before administering any medication
            • Refer to current medications list in the app
            • Contact emergency contacts if needed
            • Blood type information is displayed above
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>HealthHub Emergency Card</Text>
          <Text style={styles.footerSubtext}>Generated: {new Date().toLocaleDateString()}</Text>
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
    backgroundColor: '#F44336'
  },
  backButton: {
    padding: 4
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  shareButton: {
    padding: 4
  },
  content: {
    flex: 1,
    padding: 20
  },
  emergencyBanner: {
    backgroundColor: '#F44336',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4
  },
  emergencySubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8
  },
  patientId: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  criticalInfo: {
    gap: 16
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16
  },
  importantSection: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  importantTitle: {
    color: '#F44336',
    textTransform: 'uppercase'
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  importantContent: {
    fontSize: 18,
    color: '#F44336',
    fontWeight: 'bold'
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8
  },
  callButton: {
    backgroundColor: '#F44336'
  },
  medicineButton: {
    backgroundColor: '#4CAF50'
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  section: {
    marginBottom: 24
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  contactDetails: {
    flex: 1
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  contactRelation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  contactPhone: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500'
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  medicalInfo: {
    gap: 16
  },
  instructions: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999'
  }
});
