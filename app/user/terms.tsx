import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function TermsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                    By accessing or using Pixo ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </Text>

                <Text style={styles.sectionTitle}>2. User Accounts</Text>
                <Text style={styles.paragraph}>
                    You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </Text>

                <Text style={styles.sectionTitle}>3. User Content</Text>
                <Text style={styles.paragraph}>
                    You retain ownership of content you post on Pixo. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the App.
                </Text>
                <Text style={styles.paragraph}>
                    You agree not to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.
                </Text>

                <Text style={styles.sectionTitle}>4. Prohibited Activities</Text>
                <Text style={styles.paragraph}>
                    You may not:{'\n'}
                    • Use the App for any illegal purpose{'\n'}
                    • Harass, bully, or intimidate other users{'\n'}
                    • Post spam or misleading content{'\n'}
                    • Attempt to hack or disrupt the App{'\n'}
                    • Create fake accounts or impersonate others{'\n'}
                    • Scrape or collect user data without permission
                </Text>

                <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
                <Text style={styles.paragraph}>
                    The App, including its design, features, and content (excluding user content), is owned by Pixo and protected by copyright, trademark, and other laws.
                </Text>

                <Text style={styles.sectionTitle}>6. Termination</Text>
                <Text style={styles.paragraph}>
                    We may suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion. You may also delete your account at any time through the App settings.
                </Text>

                <Text style={styles.sectionTitle}>7. Disclaimers</Text>
                <Text style={styles.paragraph}>
                    The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be uninterrupted, secure, or error-free.
                </Text>

                <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
                <Text style={styles.paragraph}>
                    To the maximum extent permitted by law, Pixo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
                </Text>

                <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
                <Text style={styles.paragraph}>
                    We may modify these terms at any time. Continued use of the App after changes constitutes acceptance of the modified terms.
                </Text>

                <Text style={styles.sectionTitle}>10. Contact</Text>
                <Text style={styles.paragraph}>
                    For questions about these Terms of Service, please contact us at legal@pixo.app.
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 Pixo. All rights reserved.</Text>
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
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#888',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginTop: 20,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 15,
        color: '#444',
        lineHeight: 24,
        marginBottom: 12,
    },
    footer: {
        marginTop: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: '#999',
    },
});
