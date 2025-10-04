import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  stock_quantity: number;
  expiry_date?: string;
  category?: string;
  prescription_image?: string;
  reminders?: Array<{time: string; enabled: boolean}>;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/medicines`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      } else {
        console.error('Failed to fetch medicines');
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = async (medicineData: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/medicines`, {
        method: 'POST',
        headers,
        body: JSON.stringify(medicineData)
      });

      if (response.ok) {
        const newMedicine = await response.json();
        setMedicines(prev => [...prev, newMedicine]);
        return true;
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to add medicine');
        return false;
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      return false;
    }
  };

  const updateMedicine = async (id: string, medicineData: Partial<Medicine>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/medicines/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(medicineData)
      });

      if (response.ok) {
        const updatedMedicine = await response.json();
        setMedicines(prev => 
          prev.map(med => med.id === id ? updatedMedicine : med)
        );
        return true;
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to update medicine');
        return false;
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      return false;
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/medicines/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setMedicines(prev => prev.filter(med => med.id !== id));
        return true;
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to delete medicine');
        return false;
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  return {
    medicines,
    loading,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    refetch: fetchMedicines
  };
}
