import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

type Trip = {
  id: string;
  title: string;
  destination: string;
  dates: string;
};

type MyTripsScreenProps = {
  onLogout?: () => void;
  onStartTrip?: () => void;
};

export default function MyTripsScreen({ onLogout, onStartTrip }: MyTripsScreenProps) {
  const [trips] = useState<Trip[]>([]);

  const hasTrips = trips.length > 0;
  const primaryActionLabel = hasTrips
    ? 'Empezar nuevo viaje'
    : 'Empezar mi primer viaje';

  if (!hasTrips) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          

          <Text style={styles.emptyTitle}>Todavía no tienes viajes</Text>
          <Text style={styles.emptySubtitle}>
            Crea tu primer viaje y empieza a planificar toda tu aventura.
          </Text>

          <Pressable onPress={onStartTrip} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
          </Pressable>

        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Mis viajes</Text>
          <Text style={styles.headerTitle}>Viajes guardados</Text>
        </View>

        <Pressable onPress={onStartTrip} style={styles.newTripButton}>
          <Text style={styles.newTripButtonText}>{primaryActionLabel}</Text>
        </Pressable>
      </View>

      <FlatList
        data={trips}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripBadge}>
                <Text style={styles.tripBadgeText}>✦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripTitle}>{item.title}</Text>
                <Text style={styles.tripDestination}>{item.destination}</Text>
              </View>
            </View>
            <Text style={styles.tripDates}>{item.dates}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: colors.background,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  newTripButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  newTripButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  headerEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripBadgeText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  tripTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  tripDestination: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  tripDates: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 14,
    fontSize: 14,
  },
});
