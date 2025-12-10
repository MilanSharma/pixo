import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Heart, MessageCircle, Star, Share2, ChevronLeft, Send } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_NOTES, CURRENT_USER } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Comment } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const note = MOCK_NOTES.find(n => n.id === id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]); // Mock comments locally for now

  if (!note) {
    return (
      <View style={styles.container}>
        <Text>Note not found</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveImageIndex(roundIndex);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: Math.random().toString(),
      noteId: note.id,
      user: CURRENT_USER,
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <PressableIcon onPress={() => router.back()}>
          <ChevronLeft size={28} color={Colors.light.text} />
        </PressableIcon>
        
        <View style={styles.headerRight}>
          <PressableIcon>
            <Share2 size={24} color={Colors.light.text} />
          </PressableIcon>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {note.media.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.carouselImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          
          {note.media.length > 1 && (
            <View style={styles.pagination}>
              {note.media.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    activeImageIndex === index && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{note.title}</Text>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Image
              source={{ uri: note.user.avatar }}
              style={styles.avatar}
            />
            <View style={styles.userMeta}>
              <Text style={styles.username}>{note.user.username}</Text>
              {note.location && (
                <Text style={styles.location}>{note.location}</Text>
              )}
            </View>
            <PressableIcon style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </PressableIcon>
          </View>

          <Text style={styles.description}>{note.description}</Text>
          
          <View style={styles.tagsContainer}>
            {note.tags.map(tag => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
          
          <Text style={styles.date}>
             {new Date(note.createdAt).toLocaleDateString()} {note.location ? `• ${note.location}` : ''}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Comments Section Header */}
          <Text style={styles.commentsTitle}>Comments ({comments.length + note.commentsCount})</Text>

          {/* Mock Existing Comments */}
          {comments.map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUsername}>{comment.user.username}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
          
          {/* Placeholder for no comments */}
          {comments.length === 0 && (
            <Text style={styles.noComments}>Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Interaction Bar */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={[styles.bottomBar, { paddingBottom: insets.bottom || 10 }]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Say something..."
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
          />
          {commentText.length > 0 && (
            <PressableIcon onPress={handleAddComment}>
               <Send size={20} color={Colors.light.tint} />
            </PressableIcon>
          )}
        </View>
        
        <View style={styles.actions}>
          <PressableIcon style={styles.actionButton}>
            <Heart size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>{note.likes}</Text>
          </PressableIcon>
          
          <PressableIcon style={styles.actionButton}>
            <Star size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>{note.collects}</Text>
          </PressableIcon>
          
          <PressableIcon style={styles.actionButton}>
            <MessageCircle size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>{note.commentsCount}</Text>
          </PressableIcon>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const PressableIcon = ({ children, style, onPress }: any) => (
  <View onTouchEnd={onPress} style={style}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    // Add subtle gradient or background if needed, but keeping it transparent for now
    // or adding a back button circle background for visibility
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  carouselContainer: {
    height: 450,
    position: 'relative',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 450,
    backgroundColor: '#eee',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userMeta: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  location: {
    fontSize: 12,
    color: '#999',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  followButtonText: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    color: Colors.light.blue,
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 12,
    borderTopLeftRadius: 2,
  },
  commentUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  noComments: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    height: 80, // Adjustable based on insets
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    marginRight: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.light.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 10,
    color: Colors.light.text,
  },
});
