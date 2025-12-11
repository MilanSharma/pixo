import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_USERS } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([
        { id: 'm1', text: 'Hey, is this still available?', sender: 'me', time: '10:00 AM' },
        { id: 'm2', text: 'Yes, it is!', sender: 'them', time: '10:05 AM' },
        { id: 'm3', text: 'Great, I would like to buy it.', sender: 'me', time: '10:06 AM' },
    ]);
    const [inputText, setInputText] = useState('');

    const user = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[1];

    const handleSend = () => {
        if (inputText.trim()) {
            setMessages([...messages, {
                id: Date.now().toString(),
                text: inputText,
                sender: 'me',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            setInputText('');
        }
    };

    const renderItem = ({ item }: any) => (
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
            <Text style={styles.timeText}>{item.time}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <Text style={styles.headerTitle}>{user.username}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                inverted={false}
            />

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
                    <Pressable onPress={handleSend} style={styles.sendButton}>
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
    listContent: {
        padding: 16,
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
        opacity: 0.7,
        alignSelf: 'flex-end',
        color: 'inherit',
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
