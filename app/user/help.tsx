import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Mail, ExternalLink } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const FAQ_DATA = [
    {
        question: 'How do I create a post?',
        answer: 'Tap the + button in the bottom navigation bar. You can add photos or videos, write a caption, add location, and tag products before publishing.',
    },
    {
        question: 'How do I edit my profile?',
        answer: 'Go to the Me tab, then tap "Edit Profile". You can change your profile picture, name, bio, and other details.',
    },
    {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Privacy & Security. At the bottom, you\'ll find the option to request account deletion. This action is permanent and cannot be undone.',
    },
    {
        question: 'Why can\'t I see someone\'s posts?',
        answer: 'The user may have a private account. You\'ll need to follow them and wait for their approval to see their content.',
    },
    {
        question: 'How do I report inappropriate content?',
        answer: 'Tap the three dots (...) on any post or profile, then select "Report". Choose the reason for reporting and submit.',
    },
    {
        question: 'How do I change my password?',
        answer: 'Go to Settings > Privacy & Security. If you\'ve forgotten your password, use the "Forgot Password" option on the login screen.',
    },
];

export default function HelpScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleContactSupport = () => {
        if (!message.trim()) {
            Alert.alert('Empty Message', 'Please describe your issue before submitting.');
            return;
        }

        Alert.alert(
            'Message Sent',
            'Thanks for reaching out! Our support team will get back to you within 24-48 hours.',
            [{ text: 'OK', onPress: () => setMessage('') }]
        );
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@pixo.app?subject=Pixo Support Request');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

                {FAQ_DATA.map((item, index) => (
                    <Pressable
                        key={index}
                        style={styles.faqItem}
                        onPress={() => toggleFAQ(index)}
                    >
                        <View style={styles.faqQuestion}>
                            <Text style={styles.faqQuestionText}>{item.question}</Text>
                            {expandedIndex === index ? (
                                <ChevronUp size={20} color="#666" />
                            ) : (
                                <ChevronDown size={20} color="#666" />
                            )}
                        </View>
                        {expandedIndex === index && (
                            <Text style={styles.faqAnswer}>{item.answer}</Text>
                        )}
                    </Pressable>
                ))}

                <Text style={styles.sectionHeader}>Contact Support</Text>

                <View style={styles.contactSection}>
                    <Text style={styles.contactLabel}>Describe your issue</Text>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Tell us what's happening..."
                        placeholderTextColor="#999"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <Pressable style={styles.submitButton} onPress={handleContactSupport}>
                        <MessageCircle size={18} color="#fff" />
                        <Text style={styles.submitText}>Send Message</Text>
                    </Pressable>

                    <View style={styles.divider} />

                    <Text style={styles.orText}>Or reach us directly</Text>

                    <Pressable style={styles.emailButton} onPress={handleEmailSupport}>
                        <Mail size={18} color={Colors.light.tint} />
                        <Text style={styles.emailText}>support@pixo.app</Text>
                        <ExternalLink size={14} color="#999" />
                    </Pressable>
                </View>
            </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 20,
        textTransform: 'uppercase',
    },
    faqItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    faqQuestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    contactSection: {
        padding: 20,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#333',
        height: 120,
        backgroundColor: '#fafafa',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.light.tint,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 24,
    },
    orText: {
        textAlign: 'center',
        color: '#888',
        marginBottom: 16,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    emailText: {
        color: Colors.light.tint,
        fontSize: 15,
        fontWeight: '600',
    },
});
