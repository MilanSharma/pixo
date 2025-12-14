import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, Alert, Pressable, Share } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Heart, MessageCircle, Star, Share2, ChevronLeft, Send, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_NOTES } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Comment, Note } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getNoteById, getComments, addComment, likeNote, collectNote, checkUserInteractions, followUser, deleteNote, getFollowStatus } from '@/lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const noteId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth(); // Destructure profile here
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Interaction States
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [collectsCount, setCollectsCount] = useState(0);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      if (!noteId) return;
      
      const isRealId = UUID_REGEX.test(noteId);

      if (isRealId) {
        // --- REAL DB NOTE ---
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
          
          // Comments
          const dbComments = await getComments(data.id);
          if (dbComments) {
            setComments(dbComments.map((c: DBComment) => ({
              id: c.id,
              noteId: data.id,
              user: {
                id: c.profiles.id,
                username: c.profiles.username,
                avatar: c.profiles.avatar_url || 'https://ui-avatars.com/api/?name=User',
                followers: 0, following: 0, likes: 0, collects: 0,
              },
              text: c.content,
              createdAt: c.created_at,
            })));
          }
          
          if (user) {
            const interactions = await checkUserInteractions(user.id, data.id);
            setIsLiked(interactions.isLiked);
            setIsCollected(interactions.isCollected);
            
            const followStatus = await getFollowStatus(user.id, data.user_id);
            setIsFollowing(followStatus);
          }
        }
      } else {
        // --- MOCK NOTE ---
        const mockNote = MOCK_NOTES.find(n => n.id === noteId);
        if (mockNote) {
            setNote(mockNote);
            setLikesCount(mockNote.likes);
            setCollectsCount(mockNote.collects);
            
            // Load Local Interactions
            if (user) {
                // Likes
                const likedStr = await AsyncStorage.getItem(`liked_mock_notes_${user.id}`);
                const likedArr = likedStr ? JSON.parse(likedStr) : [];
                setIsLiked(likedArr.includes(noteId));

                // Collects
                const collectedStr = await AsyncStorage.getItem(`collected_mock_notes_${user.id}`);
                const collectedArr = collectedStr ? JSON.parse(collectedStr) : [];
                setIsCollected(collectedArr.includes(noteId));

                // Follows
                const followedStr = await AsyncStorage.getItem(`followed_mock_${mockNote.userId}`);
                setIsFollowing(followedStr === 'true');

                // Comments
                const commentsStr = await AsyncStorage.getItem(`mock_comments_${noteId}`);
                if (commentsStr) {
                    setComments(JSON.parse(commentsStr));
                }
            }
        }
      }
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to follow');
      return;
    }
    if (!note) return;

    const newState = !isFollowing;
    setIsFollowing(newState); // Optimistic

    const isRealId = UUID_REGEX.test(note.userId);
    
    try {
      if (isRealId) {
          await followUser(user.id, note.userId);
      } else {
          // Local Persistence
          await AsyncStorage.setItem(`followed_mock_${note.userId}`, newState ? 'true' : 'false');
      }
    } catch (error) {
      console.error('Error following user:', error);
      setIsFollowing(!newState); // Revert
    }
  };

  const handleUserPress = () => {
    if (note && note.userId) {
        router.push(`/user/${note.userId}`);
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
    
    const text = commentText.trim();
    setCommentText(''); // Clear input

    const isRealId = UUID_REGEX.test(note.id);

    try {
        if (isRealId) {
            // Real DB
            const newComment = await addComment(user.id, note.id, text);
            if (newComment) {
                setComments(prev => [{
                    id: newComment.id,
                    noteId: note.id,
                    user: {
                        id: newComment.profiles.id,
                        username: newComment.profiles.username,
                        avatar: newComment.profiles.avatar_url,
                        followers: 0, following: 0, likes: 0, collects: 0
                    },
                    text: newComment.content,
                    createdAt: newComment.created_at,
                }, ...prev]);
            }
        } else {
            // Mock Comment
            // Use profile data if available, fallback to defaults
            const username = profile?.username || 'user';
            const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${username}`;

            const newMockComment: Comment = {
                id: Date.now().toString(),
                noteId: note.id,
                user: {
                    id: user.id,
                    username: username,
                    avatar: avatar,
                    followers: 0, following: 0, likes: 0, collects: 0
                },
                text: text,
                createdAt: new Date().toISOString()
            };
            const updatedComments = [newMockComment, ...comments];
            setComments(updatedComments);
            await AsyncStorage.setItem(`mock_comments_${note.id}`, JSON.stringify(updatedComments));
        }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like this note');
      return;
    }
    if (!note) return;
    
    const newState = !isLiked;
    setIsLiked(newState);
    setLikesCount(prev => newState ? prev + 1 : prev - 1);

    const isRealId = UUID_REGEX.test(note.id);

    try {
        if (isRealId) {
            await likeNote(user.id, note.id);
        } else {
            // Local Mock Like
            const likedStr = await AsyncStorage.getItem(`liked_mock_notes_${user.id}`);
            let likedArr = likedStr ? JSON.parse(likedStr) : [];
            if (newState) {
                if (!likedArr.includes(note.id)) likedArr.push(note.id);
            } else {
                likedArr = likedArr.filter((id: string) => id !== note.id);
            }
            await AsyncStorage.setItem(`liked_mock_notes_${user.id}`, JSON.stringify(likedArr));
        }
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
    
    const newState = !isCollected;
    setIsCollected(newState);
    setCollectsCount(prev => newState ? prev + 1 : prev - 1);

    const isRealId = UUID_REGEX.test(note.id);

    try {
        if (isRealId) {
            await collectNote(user.id, note.id);
        } else {
            // Local Mock Collect
            const colStr = await AsyncStorage.getItem(`collected_mock_notes_${user.id}`);
            let colArr = colStr ? JSON.parse(colStr) : [];
            if (newState) {
                if (!colArr.includes(note.id)) colArr.push(note.id);
            } else {
                colArr = colArr.filter((id: string) => id !== note.id);
            }
            await AsyncStorage.setItem(`collected_mock_notes_${user.id}`, JSON.stringify(colArr));
        }
    } catch (error) {
      console.error('Error collecting note:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            if (!note) return;
            try {
              setLoading(true);
              if (UUID_REGEX.test(note.id)) {
                  await deleteNote(note.id);
              }
              // For mock notes, we just navigate back since we can't delete them from the mock file dynamically
              router.replace('/(tabs)/me');
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete note");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    if (!note) return;
    try {
        await Share.share({
            message: `Check out ${note.title} by @${note.user.username} on Pixo!`,
            url: note.media[0] || undefined,
            title: note.title
        });
    } catch (error) {
        console.error("Share error:", error);
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
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <ChevronLeft size={28} color={Colors.light.text} />
        </Pressable>
        
        <View style={styles.headerRight}>
          {user && note && user.id === note.userId && (
            <Pressable onPress={handleDelete} style={{ marginRight: 16 }}>
              <Trash2 size={24} color={Colors.light.tint} />
            </Pressable>
          )}
          <Pressable onPress={handleShare}>
            <Share2 size={24} color={Colors.light.text} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={0} 
      >
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
            
            <View style={styles.userInfo}>
              <Pressable onPress={handleUserPress} style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
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
              </Pressable>
              
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

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 10 }]}>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    minHeight: 80,
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
