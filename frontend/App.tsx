import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { getCurrentUser, logoutUser, type UserProfile } from './src/api/auth';
import WelcomeScreen from './src/screens/welcome/WelcomeScreen';
import AuthScreen from './src/screens/auth/AuthScreen';
import CreateTripWizardScreen from './src/screens/trip/CreateTripWizardScreen';
import ItineraryDetailScreen from './src/screens/itinerary/ItineraryDetailScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import MyTripsScreen from './src/screens/trips/MyTripsScreen';
import { colors } from './src/theme/colors';
import { theme } from './src/theme/theme';
import { TripResponse } from './src/types';

type ActiveTab = 'profile' | 'trips';

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('trips');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showCreateTripWizard, setShowCreateTripWizard] = useState(false);
  const [activeTrip, setActiveTrip] = useState<TripResponse | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setProfile(currentUser);
      } else {
        // Si el token es inválido o no se puede cargar el usuario, redirigir a login
        onLogout();
      }
    };

    loadUser();
  }, [onLogout]);

  // Pantalla de Detalle de Itinerario generado
  if (activeTrip) {
    return (
      <ItineraryDetailScreen
        trip={activeTrip}
        onBack={() => setActiveTrip(null)}
      />
    );
  }

  // Asistente de Creación de Viaje en 7 Pasos
  if (showCreateTripWizard) {
    return (
      <CreateTripWizardScreen
        onCancel={() => setShowCreateTripWizard(false)}
        onTripCreated={(createdTrip) => {
          setShowCreateTripWizard(false);
          setActiveTrip(createdTrip);
        }}
      />
    );
  }

  return (
    <View style={styles.appShell}>
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('trips')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'trips' && styles.tabActive,
            pressed && styles.tabPressed,
          ]}
        >
          <Text style={[styles.tabText, activeTab === 'trips' && styles.tabTextActive]}>
            Mis Viajes
          </Text>
        </Pressable>

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
      </View>

      {activeTab === 'trips' ? (
        <MyTripsScreen
          onLogout={onLogout}
          onStartTrip={() => setShowCreateTripWizard(true)}
          onSelectTrip={(trip) => setActiveTrip(trip)}
        />
      ) : (
        <ProfileScreen
          user={profile ?? undefined}
          onProfileUpdated={setProfile}
          onLogout={onLogout}
        />
      )}
    </View>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'welcome' | 'auth'>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Al arrancar la aplicación, limpiamos cualquier sesión residual previa
        // para garantizar que la pantalla inicial de bienvenida sea SIEMPRE la primera que vea el usuario
        // y solo se pueda acceder a Perfil o Mis Viajes tras autenticarse explícitamente.
        await logoutUser();
        setAuthenticated(false);
        setAuthView('welcome');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setAuthenticated(false);
    setAuthView('welcome');
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
      ) : authView === 'welcome' ? (
        <WelcomeScreen
          onLogin={() => {
            setAuthMode('login');
            setAuthView('auth');
          }}
          onRegister={() => {
            setAuthMode('register');
            setAuthView('auth');
          }}
        />
      ) : (
        <AuthScreen
          initialMode={authMode}
          onBack={() => setAuthView('welcome')}
          onLoginSuccess={() => setAuthenticated(true)}
        />
      )}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#EDF1F7',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
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
