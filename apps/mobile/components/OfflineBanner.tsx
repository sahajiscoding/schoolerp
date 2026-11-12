import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';

export function OfflineBanner() {
  const [offline, setOffline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => {
      setOffline(navigator.onLine === false);
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (offline === null || !offline) return null;

  return (
    <View style={styles.banner}>
      <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
      <Text style={styles.text}>You are offline. Some actions are disabled until you reconnect.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    width: Dimensions.get('window').width,
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
