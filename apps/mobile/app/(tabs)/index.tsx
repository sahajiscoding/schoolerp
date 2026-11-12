import { useAuth } from '../../lib/auth';
import { OfflineBanner } from '../../components/OfflineBanner';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { profile, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated() || !profile) {
    return null;
  }

  const go = (route: string) => () => router.push(route);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OfflineBanner />

      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back, {profile?.full_name ?? 'User'}</Text>
        <Text style={styles.role}>
          {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)} &bull;
          {profile?.login_id}
        </Text>
      </View>

      <View style={styles.grid}>
        <Pressable style={styles.card} onPress={go('/(tabs)/assignments')}>
          <View style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Homeworks</Text>
          <Text style={styles.cardSubtitle}>View and submit assignments</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={go('/(tabs)/messages')}>
          <View style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Messages</Text>
          <Text style={styles.cardSubtitle}>Teacher-to-student threads</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={go('/(tabs)/notices')}>
          <View style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Notices</Text>
          <Text style={styles.cardSubtitle}>School circulars and announcements</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={go('/(tabs)/profile')}>
          <View style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardSubtitle}>Account and settings</Text>
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
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcome: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  role: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  grid: {
    gap: 12,
  },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
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
