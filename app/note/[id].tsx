import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, Alert, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Heart, MessageCircle, Star, Share2, ChevronLeft, Send } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Comment, Note, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getNoteById, getComments, addComment, likeNote, collectNote, checkUserInteractions, followUser } from '@/lib/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

interface DBComment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [collectsCount, setCollectsCount] = useState(0);

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const noteId = id as string;
      
      if (!isValidUUID(noteId)) {
        const mockNote = MOCK_NOTES.find(n => n.id === noteId);
        setNote(mockNote || null);
        if (mockNote) {
          setLikesCount(mockNote.likes);
          setCollectsCount(mockNote.collects);
        }
        setLoading(false);
        return;
      }
      
      const data = await getNoteById(noteId);
      if (data) {
        const transformedNote: Note = {
          id: data.id,
          userId: data.user_id,
          user: {
            id: data.profiles.id,
            username: data.profiles.username,
            avatar: data.profiles.avatar_url || 'https://ui-avatars.com/api/?name=User',
            followers: data.profiles.followers_count || 0,
            following: 0,
            likes: 0,
            collects: 0,
          },
          title: data.title,
          description: data.content || '',
          media: data.images || [],
          tags: [],
          likes: data.likes_count,
          collects: data.collects_count,
          commentsCount: data.comments_count,
          createdAt: data.created_at,
          location: data.location,
        };
        setNote(transformedNote);
        setLikesCount(data.likes_count);
        setCollectsCount(data.collects_count);
        
        const dbComments = await getComments(data.id);
        if (dbComments) {
          setComments(dbComments.map((c: DBComment) => ({
            id: c.id,
            noteId: data.id,
            user: {
              id: c.profiles.id,
              username: c.profiles.username,
              avatar: c.profiles.avatar_url || 'https://ui-avatars.com/api/?name=User',
              followers: 0,
              following: 0,
              likes: 0,
              collects: 0,
            },
            text: c.content,
            createdAt: c.created_at,
          })));
        }
        
        if (user) {
          const interactions = await checkUserInteractions(user.id, data.id);
          setIsLiked(interactions.isLiked);
          setIsCollected(interactions.isCollected);
        }
      } else {
        const mockNote = MOCK_NOTES.find(n => n.id === id);
        setNote(mockNote || null);
        if (mockNote) {
          setLikesCount(mockNote.likes);
          setCollectsCount(mockNote.collects);
        }
      }
    } catch (error) {
      console.error('Error loading note:', error);
      const mockNote = MOCK_NOTES.find(n => n.id === id);
      setNote(mockNote || null);
      if (mockNote) {
        setLikesCount(mockNote.likes);
        setCollectsCount(mockNote.collects);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to follow');
      return;
    }
    if (!note || !isValidUUID(note.user.id)) {
      Alert.alert('Info', 'Follow feature not available for demo content');
      return;
    }
    
    try {
      const following = await followUser(user.id, note.user.id);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleTagPress = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveImageIndex(roundIndex);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to comment');
      return;
    }
    if (!note) return;
    
    try {
      const newComment = await addComment(user.id, note.id, commentText.trim());
      if (newComment) {
        setComments([{
          id: newComment.id,
          noteId: note.id,
          user: {
            id: newComment.profiles.id,
            username: newComment.profiles.username,
            avatar: newComment.profiles.avatar_url || 'https://ui-avatars.com/api/?name=User',
            followers: 0,
            following: 0,
            likes: 0,
            collects: 0,
          },
          text: newComment.content,
          createdAt: newComment.created_at,
        }, ...comments]);
      }
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like this note');
      return;
    }
    if (!note) return;
    
    try {
      const liked = await likeNote(user.id, note.id);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking note:', error);
    }
  };

  const handleCollect = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to collect this note');
      return;
    }
    if (!note) return;
    
    try {
      const collected = await collectNote(user.id, note.id);
      setIsCollected(collected);
      setCollectsCount(prev => collected ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error collecting note:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <ChevronLeft size={28} color={Colors.light.text} />
          </Pressable>
        </View>
        <Text style={styles.errorText}>Note not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <ChevronLeft size={28} color={Colors.light.text} />
        </Pressable>
        
        <View style={styles.headerRight}>
          <Pressable>
            <Share2 size={24} color={Colors.light.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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
                resizeMode="cover"
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
            <Pressable 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.description}>{note.description}</Text>
          
          <View style={styles.tagsContainer}>
            {note.tags.map(tag => (
              <Pressable key={tag} onPress={() => handleTagPress(tag)}>
                <Text style={styles.tag}>#{tag}</Text>
              </Pressable>
            ))}
          </View>
          
          <Text style={styles.date}>
             {new Date(note.createdAt).toLocaleDateString()} {note.location ? `• ${note.location}` : ''}
          </Text>

          <View style={styles.divider} />
          
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          {comments.map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUsername}>{comment.user.username}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
          
          {comments.length === 0 && (
            <Text style={styles.noComments}>Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>

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
            <Pressable onPress={handleAddComment}>
               <Send size={20} color={Colors.light.tint} />
            </Pressable>
          )}
        </View>
        
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Heart size={24} color={isLiked ? Colors.light.tint : Colors.light.text} fill={isLiked ? Colors.light.tint : 'none'} />
            <Text style={styles.actionText}>{likesCount}</Text>
          </Pressable>
          
          <Pressable style={styles.actionButton} onPress={handleCollect}>
            <Star size={24} color={isCollected ? '#FFD700' : Colors.light.text} fill={isCollected ? '#FFD700' : 'none'} />
            <Text style={styles.actionText}>{collectsCount}</Text>
          </Pressable>
          
          <Pressable style={styles.actionButton}>
            <MessageCircle size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>{comments.length}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
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
  followingButton: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  followButtonText: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
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
    height: 80,
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
