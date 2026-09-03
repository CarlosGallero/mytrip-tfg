import React from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

type WelcomeScreenProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export default function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ZONA CENTRAL: LOGO Y TÍTULO */}
        <View style={styles.centerContent}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>✦</Text>
          </View>

          <Text style={styles.brandTitle}>MyTrip</Text>
          <Text style={styles.brandTagline}>Planifica tu viaje perfecto</Text>
        </View>

        {/* ZONA INFERIOR: BOTONES DIRECTOS */}
        <View style={styles.buttonsContainer}>
          <Pressable
            onPress={onLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
          </Pressable>

          <Pressable
            onPress={onRegister}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl * 2,
    paddingBottom: theme.spacing.xxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: '#EEF4FF',
    borderWidth: 1.5,
    borderColor: '#C7D7FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  brandBadgeText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  secondaryButtonPressed: {
    backgroundColor: '#EDF1F7',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
