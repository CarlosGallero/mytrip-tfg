import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { getCurrentUser, isAuthenticated, logoutUser, type UserProfile } from './src/api/auth';
import AuthScreen from './src/screens/auth/AuthScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import MyTripsScreen from './src/screens/trips/MyTripsScreen';
import { colors } from './src/theme/colors';
import { theme } from './src/theme/theme';

type ActiveTab = 'profile' | 'trips';

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setProfile(currentUser);
      }
    };

    loadUser();
  }, []);

  return (
    <View style={styles.appShell}>
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('profile')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'profile' && styles.tabActive,
            pressed && styles.tabPressed,
          ]}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            Perfil
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('trips')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'trips' && styles.tabActive,
            pressed && styles.tabPressed,
          ]}
        >
          <Text style={[styles.tabText, activeTab === 'trips' && styles.tabTextActive]}>
            Viajes
          </Text>
        </Pressable>
      </View>

      {activeTab === 'profile' ? (
        <ProfileScreen
          user={profile ?? undefined}
          onProfileUpdated={setProfile}
          onLogout={onLogout}
        />
      ) : (
        <MyTripsScreen onLogout={onLogout} />
      )}
    </View>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await isAuthenticated();
        setAuthenticated(result);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {authenticated ? (
        <AuthenticatedApp onLogout={handleLogout} />
      ) : (
        <AuthScreen onLoginSuccess={() => setAuthenticated(true)} />
      )}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabPressed: {
    opacity: 0.9,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.white,
  },
});
