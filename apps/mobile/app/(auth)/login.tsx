import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { signIn, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated()) {
    router.replace('/(tabs)');
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    const result = await signIn(loginId, password);
    if (result.error) {
      setError(result.error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Pacific World School</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Admission / Staff ID"
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => {}}
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  inputRow: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
  },
});
