import { useAuth } from '../../lib/auth';
import { OfflineBanner } from '../../components/OfflineBanner';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { profile, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated() || !profile) return null;

  return (
    <ScrollView style={styles.container}>
      <OfflineBanner />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile.full_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ID</Text>
          <Text style={styles.value}>{profile.login_id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{profile.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <View style={[styles.card, styles.mt16]}>
        <Text style={styles.sectionTitle}>Security</Text>
        {profile.must_change_password ? (
          <>
            <Text style={styles.notice}>
              You must change your password before continuing.
            </Text>
            <Pressable style={styles.button} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.buttonText}>Change password</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.button} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.buttonText}>Change password</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.card, styles.mt16]}>
        <Text style={styles.sectionTitle}>Data</Text>
        <Pressable style={styles.dangerButton} onPress={() => router.push('/(auth)/delete-account')}>
          <Text style={styles.dangerText}>Request account deletion</Text>
        </Pressable>
      </View>

      <View style={styles.signout}>
        <Pressable style={styles.signoutButton} onPress={signOut}>
          <Text style={styles.signoutText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mt16: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  notice: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  signout: {
    marginTop: 32,
    alignItems: 'center',
  },
  signoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  signoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
