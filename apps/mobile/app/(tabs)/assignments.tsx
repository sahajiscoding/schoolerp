import { useAuth } from '../../lib/auth';
import { OfflineBanner } from '../../components/OfflineBanner';
import { StyleSheet, Text, View, ScrollView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export type AssignmentItem = {
  id: string;
  title: string;
  instructions: string | null;
  due_at: string | null;
  attachment_path: string | null;
  created_at: string;
};

export default function AssignmentsScreen() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated()) return null;

  // Demo data — replaced by Supabase queries in Milestone C
  const assignments: AssignmentItem[] = [
    {
      id: 'demo-1',
      title: 'Math Exercise 5.1',
      instructions: 'Solve problems 1-10 from chapter 5.',
      due_at: '2026-11-20',
      attachment_path: null,
      created_at: '2026-11-12',
    },
    {
      id: 'demo-2',
      title: 'Science Lab Report',
      instructions: 'Write up the photosynthesis experiment.',
      due_at: '2026-11-25',
      attachment_path: null,
      created_at: '2026-11-13',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OfflineBanner />

      <View style={styles.header}>
        <Text style={styles.title}>Homeworks</Text>
        <Text style={styles.subtitle}>Assignments shared with you</Text>
      </View>

      {assignments.length === 0 ? (
        <Text style={styles.empty}>No assignments at the moment.</Text>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/assignments/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.instructions && <Text style={styles.cardBody}>{item.instructions}</Text>}
              <Text style={styles.cardDue}>Due: {item.due_at ?? 'No due date'}</Text>
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
  cardDue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
});
