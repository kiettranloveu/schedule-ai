import './src/shield';
import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Register for all possible native entry point names on iOS
registerRootComponent(App);
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('ScheduleAI', () => App);
AppRegistry.registerComponent('schedule-ai', () => App);
AppRegistry.registerComponent('ScheduleAIMobile', () => App);


