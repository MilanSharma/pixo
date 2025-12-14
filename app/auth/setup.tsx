import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Camera, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/storage';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleNext = async () => {
    if (!nickname || !gender) {
      Alert.alert('Incomplete', 'Please fill in your nickname and gender');
      return;
    }

    try {
      setUploading(true);
      let avatarUrl = avatar;

      // Only upload if it's a local file URI (not an http url)
      if (avatar && user && !avatar.startsWith('http')) {
        avatarUrl = await uploadImage(user.id, avatar, 'avatar.jpg');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: nickname,
          gender: gender,
          avatar_url: avatarUrl
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      router.push('/auth/interests');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Complete Profile</Text>
      <Text style={styles.subTitle}>Let others know you better</Text>

      <Pressable style={styles.avatarContainer} onPress={pickImage}>
        <Image 
          source={avatar ? { uri: avatar } : { uri: 'https://ui-avatars.com/api/?name=User&background=f0f0f0&color=999' }} 
          style={styles.avatar} 
        />
        <View style={styles.cameraIcon}>
          <Camera size={16} color="#fff" />
        </View>
      </Pressable>

      <View style={styles.form}>
        <Text style={styles.label}>Nickname</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a nickname"
          value={nickname}
          onChangeText={setNickname}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          <Pressable 
            style={[styles.genderButton, gender === 'male' && styles.genderActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
          </Pressable>
          <Pressable 
            style={[styles.genderButton, gender === 'female' && styles.genderActive]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, (!nickname || !gender) && styles.disabledButton]}
          onPress={handleNext}
          disabled={!nickname || !gender || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.nextText}>Next</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  subTitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: -10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  genderButton: {
    flex: 1,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  genderText: {
    fontSize: 16,
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    marginBottom: 40,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
