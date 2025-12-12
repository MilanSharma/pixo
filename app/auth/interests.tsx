import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const INTERESTS = [
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'beauty', label: 'Beauty', emoji: '💄' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'home', label: 'Home Decor', emoji: '🏠' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'tech', label: 'Tech', emoji: '📱' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'pets', label: 'Pets', emoji: '🐱' },
  { id: 'photography', label: 'Photo', emoji: '📸' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'books', label: 'Reading', emoji: '📚' },
];

export default function InterestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleFinish = async () => {
    if (selected.length < 4) {
      Alert.alert('Select more', 'Please select at least 4 interests to personalize your feed');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ interests: selected })
        .eq('id', user?.id);

      if (error) throw error;
      
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick Your Interests</Text>
        <Text style={styles.subtitle}>Select at least 4 topics you like</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {INTERESTS.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable
              key={item.id}
              style={[styles.bubble, isSelected && styles.bubbleActive]}
              onPress={() => toggleInterest(item.id)}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.label, isSelected && styles.labelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{selected.length}/4 selected</Text>
        </View>
        <Pressable 
          style={[styles.button, selected.length < 4 && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={selected.length < 4 || saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Setting up...' : 'Start Exploring'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  bubble: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bubbleActive: {
    borderColor: Colors.light.tint,
    backgroundColor: '#fff0f2',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  countContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    color: '#999',
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
