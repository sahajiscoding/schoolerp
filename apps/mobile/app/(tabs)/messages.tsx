import { useAuth } from '../../lib/auth';
import { OfflineBanner } from '../../components/OfflineBanner';
import { StyleSheet, Text, View, ScrollView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export type ThreadItem = {
  id: string;
  student_id: string;
  student_name: string;
  subject: string;
  last_message_at: string;
  unread_count: number;
};

export default function MessagesScreen() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated()) return null;

  const threads: ThreadItem[] = [
    {
      id: 'demo-thread-1',
      student_id: 'demo-student-1',
      student_name: 'Student A',
      subject: 'Math homework help',
      last_message_at: '2026-11-12T09:30:00Z',
      unread_count: 1,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OfflineBanner />

      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>
          {profile?.role === 'teacher' ? 'Your class conversations' : 'Your teacher conversations'}
        </Text>
      </View>

      {threads.length === 0 ? (
        <Text style={styles.empty}>No messages yet.</Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/messages/${item.id}`)}>
              <View style={styles.cardBodyWrapper}>
                <Text style={styles.cardTitle}>{item.student_name}</Text>
                <Text style={styles.cardUnread}>{item.unread_count > 0 ? `${item.unread_count} new` : ''}</Text>
              </View>
              <Text style={styles.cardSubject}>{item.subject}</Text>
              <Text style={styles.cardTime}>{new Date(item.last_message_at).toLocaleDateString()}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardUnread: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  cardBodyWrapper: {
    flex: 1,
  },
  cardSubject: {
    fontSize: 14,
    color: '#475569',
  },
  cardTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
});
