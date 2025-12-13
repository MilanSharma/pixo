import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Heart, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onLongPress?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

export const NoteCard = ({ note, onLongPress, onDelete }: NoteCardProps) => {
  const router = useRouter();
  const [aspectRatio, setAspectRatio] = useState(3 / 4);

  useEffect(() => {
    if (!note.media || note.media.length === 0) return;
    
    const uri = note.media[0];
    if (!uri) return;

    Image.getSize(uri, (width, height) => {
      if (width && height) setAspectRatio(width / height);
    }, () => {});
  }, [note.media]);

  const handlePress = () => {
    router.push(`/note/${note.id}`);
  };

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      onLongPress={() => onLongPress && onLongPress(note)}
      delayLongPress={500}
    >
      <Image
        source={{ uri: note.media && note.media.length > 0 ? note.media[0] : 'https://via.placeholder.com/150' }}
        style={[styles.image, { aspectRatio }]}
        resizeMode="cover"
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
            />
            <Text style={styles.username} numberOfLines={1}>
              {note.user.username}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {onDelete && (
              <Pressable onPress={() => onDelete(note)} hitSlop={10}>
                <Trash2 size={16} color={Colors.light.tint} />
              </Pressable>
            )}
            <View style={styles.likesContainer}>
              <Heart size={14} color={Colors.light.icon} />
              <Text style={styles.likes}>{note.likes}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
  },
  image: {
    width: '100%',
    backgroundColor: '#eee',
  },
  content: {
    padding: 10,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
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
    marginRight: 6,
    gap: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  username: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likes: {
    fontSize: 12,
    color: '#666',
  },
});
