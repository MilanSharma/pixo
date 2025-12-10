import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [media, setMedia] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled) {
      setMedia([...media, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handlePublish = () => {
    if (media.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title');
      return;
    }

    setIsPublishing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsPublishing(false);
      Alert.alert('Success', 'Your note has been published!', [
        { text: 'OK', onPress: () => {
          setMedia([]);
          setTitle('');
          setDescription('');
          router.push('/');
        }}
      ]);
    }, 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Note</Text>
        <Pressable 
          onPress={handlePublish} 
          disabled={isPublishing}
          style={[styles.publishButton, isPublishing && styles.disabledButton]}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* Media Picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
          {media.map((uri, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.image} />
              <Pressable style={styles.removeButton} onPress={() => removeImage(index)}>
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          
          <Pressable style={styles.addMediaButton} onPress={pickImage}>
            <Camera size={24} color="#999" />
            <Text style={styles.addMediaText}>Add Photo</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.form}>
          <TextInput
            style={styles.titleInput}
            placeholder="Add a title..."
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          
          <View style={styles.divider} />
          
          <TextInput
            style={styles.descInput}
            placeholder="Add a description... #hashtags"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
          
          <View style={styles.divider} />
          
          <Pressable style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <MapPin size={20} color={Colors.light.text} />
              <Text style={styles.optionText}>Add Location</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          
          <View style={styles.divider} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  publishButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  publishText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    padding: 16,
    flexDirection: 'row',
  },
  addMediaButton: {
    width: 100,
    height: 133, // 3:4 aspect ratio
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addMediaText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  imagePreview: {
    width: 100,
    height: 133,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    paddingVertical: 12,
  },
  descInput: {
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 150,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
  },
});
