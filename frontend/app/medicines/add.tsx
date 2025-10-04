import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMedicines } from '../../hooks/useMedicines';

export default function AddMedicineScreen() {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    instructions: '',
    stock_quantity: '0',
    expiry_date: '',
    category: 'general'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { addMedicine } = useMedicines();

  const frequencies = [
    { value: 'once_daily', label: 'Once Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'three_times_daily', label: '3 Times Daily' },
    { value: 'four_times_daily', label: '4 Times Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'as_needed', label: 'As Needed' }
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'pain_relief', label: 'Pain Relief' },
    { value: 'antibiotics', label: 'Antibiotics' },
    { value: 'vitamins', label: 'Vitamins' },
    { value: 'heart', label: 'Heart Health' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'blood_pressure', label: 'Blood Pressure' },
    { value: 'other', label: 'Other' }
  ];

  const handleSave = async () => {
    if (!formData.name || !formData.dosage) {
      Alert.alert('Error', 'Please fill in medicine name and dosage');
      return;
    }

    setIsLoading(true);
    
    const medicineData = {
      ...formData,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      expiry_date: formData.expiry_date || undefined,
      reminders: []
    };

    const success = await addMedicine(medicineData);
    setIsLoading(false);

    if (success) {
      Alert.alert('Success', 'Medicine added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const FrequencySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Frequency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {frequencies.map((freq) => (
          <TouchableOpacity
            key={freq.value}
            style={[
              styles.selectorItem,
              formData.frequency === freq.value && styles.selectorItemActive
            ]}
            onPress={() => updateFormData('frequency', freq.value)}
          >
            <Text style={[
              styles.selectorText,
              formData.frequency === freq.value && styles.selectorTextActive
            ]}>
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const CategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.selectorItem,
              formData.category === cat.value && styles.selectorItemActive
            ]}
            onPress={() => updateFormData('category', cat.value)}
          >
            <Text style={[
              styles.selectorText,
              formData.category === cat.value && styles.selectorTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Medicine</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="medical-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Medicine Name *"
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="flask-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dosage (e.g., 10mg, 1 tablet) *"
                value={formData.dosage}
                onChangeText={(text) => updateFormData('dosage', text)}
              />
            </View>

            <FrequencySelector />
            <CategorySelector />
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="layers-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Stock Quantity (number of pills/tablets)"
                value={formData.stock_quantity}
                onChangeText={(text) => updateFormData('stock_quantity', text)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Expiry Date (YYYY-MM-DD)"
                value={formData.expiry_date}
                onChangeText={(text) => updateFormData('expiry_date', text)}
              />
            </View>

            <View style={styles.textAreaContainer}>
              <Ionicons name="document-text-outline" size={20} color="#666" style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Instructions or notes (e.g., take with food, before meals)"
                value={formData.instructions}
                onChangeText={(text) => updateFormData('instructions', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.mainSaveButton, isLoading && styles.mainSaveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="white" />
            <Text style={styles.mainSaveButtonText}>
              {isLoading ? 'Adding Medicine...' : 'Add Medicine'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50'
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  keyboardView: {
    flex: 1
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
    marginBottom: 16
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333'
  },
  textAreaContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  textAreaIcon: {
    marginRight: 12,
    marginTop: 4
  },
  textArea: {
    flex: 1,
    minHeight: 80,
    fontSize: 16,
    color: '#333'
  },
  selectorContainer: {
    marginBottom: 16
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  selectorScroll: {
    marginHorizontal: -4
  },
  selectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectorItemActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  selectorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  selectorTextActive: {
    color: 'white'
  },
  mainSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 20,
    marginBottom: 40
  },
  mainSaveButtonDisabled: {
    opacity: 0.7
  },
  mainSaveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8
  }
});
