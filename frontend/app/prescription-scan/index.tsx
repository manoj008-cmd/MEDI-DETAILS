import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function PrescriptionScanScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to scan prescriptions.',
        [{ text: 'OK' }]
      );
    }
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const imageBase64 = result.assets[0].base64;
        
        setImage(imageUri);
        
        // Simulate OCR processing
        await processPrescription(imageBase64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const imageBase64 = result.assets[0].base64;
        
        setImage(imageUri);
        
        // Simulate OCR processing
        await processPrescription(imageBase64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processPrescription = async (imageBase64: string | undefined) => {
    setIsProcessing(true);
    
    try {
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR results - In real implementation, this would call an OCR API
      const mockResult = {
        medicines: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'once_daily',
            instructions: 'Take with water, preferably in the morning'
          },
          {
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'twice_daily',
            instructions: 'Take with meals'
          }
        ],
        confidence: 0.85,
        practitioner: 'Dr. Sarah Johnson',
        date: new Date().toISOString().split('T')[0]
      };
      
      setScanResult(mockResult);
    } catch (error) {
      console.error('Error processing prescription:', error);
      Alert.alert('Error', 'Failed to process prescription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addMedicineFromScan = (medicine: any) => {
    // Navigate to add medicine screen with pre-filled data
    router.push({
      pathname: '/medicines/add',
      params: medicine
    });
  };

  const addAllMedicines = () => {
    Alert.alert(
      'Add All Medicines',
      'This would add all scanned medicines to your list. This feature will be implemented with the medicine management system.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Prescription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Instructions */}
        {!image && (
          <View style={styles.instructionsCard}>
            <Ionicons name="document-text" size={48} color="#4CAF50" />
            <Text style={styles.instructionsTitle}>Scan Your Prescription</Text>
            <Text style={styles.instructionsText}>
              Take a clear photo of your prescription to automatically add medicines to your list
            </Text>
            
            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>Tips for better scanning:</Text>
              <Text style={styles.tipItem}>• Ensure good lighting</Text>
              <Text style={styles.tipItem}>• Keep the prescription flat</Text>
              <Text style={styles.tipItem}>• Include the entire document</Text>
              <Text style={styles.tipItem}>• Avoid shadows or glare</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {!image && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={takePicture}>
              <Ionicons name="camera" size={32} color="white" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={pickImage}>
              <Ionicons name="image" size={32} color="#4CAF50" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image Preview */}
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.retakeButton} onPress={() => setImage(null)}>
              <Ionicons name="camera-reverse" size={20} color="#4CAF50" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing */}
        {isProcessing && (
          <View style={styles.processingCard}>
            <Ionicons name="scan" size={48} color="#4CAF50" />
            <Text style={styles.processingTitle}>Processing Prescription...</Text>
            <Text style={styles.processingText}>
              Our AI is reading your prescription and extracting medicine information
            </Text>
          </View>
        )}

        {/* Scan Results */}
        {scanResult && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.resultsTitle}>Scan Complete!</Text>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(scanResult.confidence * 100)}%
              </Text>
            </View>

            {scanResult.practitioner && (
              <View style={styles.metaInfo}>
                <Text style={styles.metaLabel}>Prescribed by:</Text>
                <Text style={styles.metaValue}>{scanResult.practitioner}</Text>
                <Text style={styles.metaLabel}>Date:</Text>
                <Text style={styles.metaValue}>{scanResult.date}</Text>
              </View>
            )}

            <Text style={styles.medicinesTitle}>Found Medicines ({scanResult.medicines.length})</Text>
            
            {scanResult.medicines.map((medicine: any, index: number) => (
              <View key={index} style={styles.medicineCard}>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDosage}>{medicine.dosage} • {medicine.frequency}</Text>
                  {medicine.instructions && (
                    <Text style={styles.medicineInstructions}>{medicine.instructions}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addMedicineFromScan(medicine)}
                >
                  <Ionicons name="add-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addAllButton} onPress={addAllMedicines}>
              <Ionicons name="medical" size={20} color="white" />
              <Text style={styles.addAllButtonText}>Add All Medicines</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            AI scanning is for convenience only. Always verify medicine information with your healthcare provider or pharmacist.
          </Text>
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
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24
  },
  tips: {
    alignSelf: 'stretch'
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20
  },
  actionButtons: {
    gap: 16,
    marginBottom: 32
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4CAF50'
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#4CAF50'
  },
  imageContainer: {
    marginBottom: 24
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 16
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12
  },
  retakeButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600'
  },
  processingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24
  },
  resultsContainer: {
    marginBottom: 24
  },
  resultsHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  confidenceText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600'
  },
  metaInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  metaLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4
  },
  metaValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12
  },
  medicinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  medicineCard: {
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
  medicineInfo: {
    flex: 1,
    marginRight: 16
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  medicineDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  medicineInstructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  addButton: {
    padding: 8
  },
  addAllButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8
  },
  addAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  disclaimer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    lineHeight: 20
  }
});