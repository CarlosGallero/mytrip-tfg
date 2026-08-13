import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/auth/AuthScreen';

export default function App() {
  return (
    <>
      <AuthScreen />
      <StatusBar style="light" />
    </>
  );
}
