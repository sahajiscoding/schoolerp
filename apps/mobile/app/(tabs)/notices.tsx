import { useAuth } from '../../lib/auth';
import { OfflineBanner } from '../../components/OfflineBanner';
import { StyleSheet, Text, View, ScrollView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export type NoticeItem = {
  id: string;
  title: string;
  body: string;
  audience: string;
  published_at: string;
  read_at: string | null;
};

export default function NoticesScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated()) return null;

  const notices: NoticeItem[] = [
    {
      id: 'notice-1',
      title: 'Winter Uniform Circular',
      body: 'Winter uniform is mandatory from 1 December.',
      audience: 'school',
      published_at: '2026-11-10T08:00:00Z',
      read_at: null,
    },
    {
      id: 'notice-2',
      title: 'Parent-Teacher Meeting',
      body: 'PTM scheduled for Saturday, 15 November, 9 AM to 12 PM.',
      audience: 'school',
      published_at: '2026-11-08T10:00:00Z',
      read_at: '2026-11-09T08:30:00Z',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OfflineBanner />

      <View style={styles.header}>
        <Text style={styles.title}>Notices</Text>
        <Text style={styles.subtitle}>School circulars and announcements</Text>
      </View>

      {notices.length === 0 ? (
        <Text style={styles.empty}>No notices at the moment.</Text>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/notices/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.cardTime}>{new Date(item.published_at).toLocaleDateString()}</Text>
              {item.read_at === null && <Text style={styles.cardUnread}>Unread</Text>}
            </Pressable>
          )}
        />
      )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  cardUnread: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
});
