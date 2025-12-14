import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { signIn } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome, Apple, Facebook, Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react-native';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Enter email or phone').refine((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  }, 'Enter a valid email or phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Check your inputs';
      setError(firstError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    router.push('/auth/forgot-password');
  };

  const socialButtons = [
    { label: 'Continue with Google', icon: Chrome, color: '#F2F2F2', textColor: '#1F1F1F' },
    { label: 'Continue with Apple', icon: Apple, color: '#0B0B0B', textColor: '#FFFFFF' },
    { label: 'Continue with Facebook', icon: Facebook, color: '#1877F2', textColor: '#FFFFFF' },
  ];

  return (
    <LinearGradient colors={['#f7f8fa', '#eef2f5']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <View style={styles.brandBlock}>
            <Text style={styles.logo}>pixo</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to keep exploring inspiration.</Text>
          </View>

          <View style={styles.socialRow}>
            {socialButtons.map((btn) => (
              <TouchableOpacity key={btn.label} style={[styles.socialBtn, { backgroundColor: btn.color }]} onPress={() => Alert.alert('Social Login', 'Social login requires developer credentials. Configure them in your Supabase dashboard to enable this feature.')}>
                <btn.icon size={18} color={btn.textColor} />
                <Text style={[styles.socialText, { color: btn.textColor }]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Mail size={18} color="#777" />
              <TextInput
                style={styles.input}
                placeholder="Email or phone"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputWrap}>
              <Lock size={18} color="#777" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color="#777" /> : <Eye size={18} color="#777" />}
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgot} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.footerLink}>
            <Text style={styles.footerText}>New here? <Text style={styles.footerBold}>Create account</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  socialRow: {
    gap: 12,
    marginBottom: 16,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eceef1',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  error: {
    color: '#d14343',
    textAlign: 'center',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotRow: {
    alignItems: 'center',
  },
  forgotText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    color: '#444',
    fontSize: 14,
  },
  footerBold: {
    color: '#111827',
    fontWeight: '700',
  },
});