import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Heart, Trash2, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
  onRemove?: (note: Note) => void;
  removeType?: 'delete' | 'remove'; // 'delete' = Trash icon, 'remove' = X icon
}

export const NoteCard = ({ note, onPress, onRemove, removeType }: NoteCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/note/${note.id}`);
  };

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      delayLongPress={500}
    >
      <View style={styles.imageContainer}>
          <Image
            source={{ uri: note.media && note.media.length > 0 ? note.media[0] : 'https://via.placeholder.com/150' }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* COMMON REMOVE BUTTON (Top Right Overlay) */}
          {onRemove && (
              <Pressable 
                style={styles.removeBtn} 
                onPress={() => onRemove(note)}
                hitSlop={10}
              >
                  {removeType === 'delete' ? (
                      <Trash2 size={14} color="#fff" />
                  ) : (
                      <X size={14} color="#fff" />
                  )}
              </Pressable>
          )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {note.title || 'Untitled'}
        </Text>
        <View style={styles.footer}>
          <View style={styles.userContainer}>
            <Image
              source={{ uri: note.user?.avatar || 'https://ui-avatars.com/api/?name=User' }}
              style={styles.avatar}
            />
            <Text style={styles.username} numberOfLines={1}>
              {note.user?.username || 'user'}
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
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    height: 280, // Fixed height for consistency
  },
  imageContainer: {
    height: 200, // Fixed image height
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  removeBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
  },
  content: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    lineHeight: 16,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 24, // Fixed footer height to prevent retraction
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
    gap: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  username: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likes: {
    fontSize: 11,
    color: '#666',
  },
});
