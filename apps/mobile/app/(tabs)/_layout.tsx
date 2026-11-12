import { Tabs } from 'expo-router';
import { Home, MessageSquare, BookOpen, Calendar, User } from 'lucide-react';
import type { ColorValue } from 'react-native';

const tabIcon = (Icon: React.ComponentType<any>) => ({
  focused,
  color,
}: {
  focused: boolean;
  color: ColorValue | undefined;
}) => <Icon size={24} color={color ?? '#64748b'} />;

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon(Home),
        }}
      />
      <Tabs.Screen
        name="(tabs)/assignments"
        options={{
          title: 'Homeworks',
          tabBarIcon: tabIcon(BookOpen),
        }}
      />
      <Tabs.Screen
        name="(tabs)/messages"
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon(MessageSquare),
        }}
      />
      <Tabs.Screen
        name="(tabs)/notices"
        options={{
          title: 'Notices',
          tabBarIcon: tabIcon(Calendar),
        }}
      />
      <Tabs.Screen
        name="(tabs)/profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon(User),
        }}
      />
    </Tabs>
  );
}
