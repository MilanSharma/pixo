import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Trash2, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Note } from '@/types';
import { useVideoPlayer, VideoView } from 'expo-video';

interface NoteCardProps {
  note: Note;
  onPress?: (note: Note) => void;
  onRemove?: (note: Note) => void;
  removeType?: 'delete' | 'remove';
}

export const NoteCard = ({ note, onPress, onRemove, removeType }: NoteCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(note);
    } else {
      router.push(`/note/${note.id}`);
    }
  };

  const mediaUri = note.media && note.media.length > 0 ? note.media[0] : null;
  const isVideo = mediaUri && (mediaUri.toLowerCase().endsWith('.mp4') || mediaUri.toLowerCase().endsWith('.mov') || mediaUri.toLowerCase().endsWith('.webm'));

  // Video Player for Thumbnail
  // We use useVideoPlayer even in the card to render the first frame
  // Note: For many cards this can be heavy, but it's the only way to get a frame without a backend thumbnail service
  const player = useVideoPlayer(isVideo ? mediaUri : null, player => {
      player.muted = true;
      player.loop = false;
      // We don't play it, just loading it shows the first frame (poster)
  });

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      delayLongPress={500}
    >
      <View style={styles.imageContainer}>
          {mediaUri ? (
             isVideo ? (
               <View style={styles.videoContainer}>
                   <VideoView 
                        style={styles.image} 
                        player={player} 
                        contentFit="cover" 
                        nativeControls={false}
                   />
                   {/* Overlay to prevent video interaction in list view */}
                   <View style={StyleSheet.absoluteFill} /> 
               </View>
             ) : (
               <Image
                 source={{ uri: mediaUri }}
                 style={styles.image}
                 contentFit="cover"
                 transition={200}
               />
             )
          ) : (
             <View style={[styles.image, { backgroundColor: '#eee' }]} />
          )}
          
          {/* REMOVE BUTTON */}
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
             <Text style={styles.likes}>{note.likes || 0}</Text>
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
    height: 280, 
  },
  imageContainer: {
    height: 200, 
    width: '100%',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
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
    height: 24,
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
