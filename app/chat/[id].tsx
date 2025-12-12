import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getChatMessages, sendMessage } from '@/lib/database';
import { getProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'them';
    time: string;
}

interface UserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams(); // This is the other user's ID
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const otherUserId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        if (!user || !otherUserId) return;

        // 1. Fetch the other user's profile
        getProfile(otherUserId).then((data) => {
            setOtherUser(data);
        }).catch((err) => console.error("Error fetching user profile:", err));

        // 2. Initial fetch of messages
        fetchMessages();

        // 3. Set up Realtime subscription
        const channel = supabase.channel(`chat:${user.id}:${otherUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`, 
                },
                (payload) => {
                    // Check if the message is from the person we are currently chatting with
                    if (payload.new.sender_id === otherUserId) {
                        const newMessage: Message = {
                            id: payload.new.id,
                            text: payload.new.content,
                            sender: 'them',
                            time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                        setMessages((prev) => [...prev, newMessage]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, otherUserId]);

    const fetchMessages = async () => {
        if (!user || !otherUserId) return;
        try {
            const data = await getChatMessages(user.id, otherUserId);
            if (data) {
                const mappedMessages: Message[] = data.map((m: any) => ({
                    id: m.id,
                    text: m.content,
                    sender: m.sender_id === user.id ? 'me' : 'them',
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }));
                setMessages(mappedMessages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user || !otherUserId) return;

        const content = inputText.trim();
        setInputText(''); // Clear input immediately for better UX

        // Optimistic update
        const optimisticMsg: Message = {
            id: Date.now().toString(),
            text: content,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            await sendMessage(user.id, otherUserId, content);
            // We don't strictly need to replace the optimistic message if the order is preserved,
            // but fetching or confirming ID is often good practice. For now, we rely on the optimistic push.
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally remove the optimistic message on failure
        }
    };

    const renderItem = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.sender === 'me' ? styles.myMessage : styles.theirMessage
        ]}>
            <Text style={[
                styles.messageText,
                item.sender === 'me' ? styles.myMessageText : styles.theirMessageText
            ]}>
                {item.text}
            </Text>
            <Text style={[
                styles.timeText,
                item.sender === 'me' ? styles.myTimeText : styles.theirTimeText
            ]}>{item.time}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/messages')} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                {otherUser && (
                    <>
                        <Image 
                            source={{ uri: otherUser.avatar_url || 'https://ui-avatars.com/api/?name=' + otherUser.username }} 
                            style={styles.avatar} 
                        />
                        <Text style={styles.headerTitle}>{otherUser.username}</Text>
                    </>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.light.tint} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <Pressable onPress={handleSend} style={styles.sendButton} disabled={!inputText.trim()}>
                        <Send size={20} color="#fff" />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 16,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.light.tint,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#f5f5f5',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimeText: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimeText: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 10,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
});
