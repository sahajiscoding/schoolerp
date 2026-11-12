import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// With expo-router, ExpoRoot is the entry point that renders app/_layout.tsx.
registerRootComponent(ExpoRoot);
