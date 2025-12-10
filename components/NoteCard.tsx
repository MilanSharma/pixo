import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/note/${note.id}`);
  };

  // Random height for masonry effect (mocking aspect ratio)
  // In real app, we should have aspect ratio from server
  // For now, let's just assume some variance if not provided, 
  // but better to keep it consistent or random based on ID.
  // Let's rely on the image loading or pre-calculated aspect ratio.
  // For simplicity, I'll use a fixed height + random small variance or just 4:3 / 16:9 mixing.
  const aspectRatio = note.id.length % 2 === 0 ? 3 / 4 : 1; 

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Image
        source={{ uri: note.media[0] }}
        style={[styles.image, { aspectRatio }]}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>
        <View style={styles.footer}>
          <View style={styles.userContainer}>
            <Image
              source={{ uri: note.user.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <Text style={styles.username} numberOfLines={1}>
              {note.user.username}
            </Text>
          </View>
          <View style={styles.likesContainer}>
            <Heart size={14} color={Colors.light.icon} />
            <Text style={styles.likes}>{note.likes}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1, // Important for column layout
  },
  image: {
    width: '100%',
    backgroundColor: '#eee',
  },
  content: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  username: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likes: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
});
