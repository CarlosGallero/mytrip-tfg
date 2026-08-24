import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchUserTrips, deleteTrip } from '../../api/itinerary';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { TripResponse } from '../../types';

type MyTripsScreenProps = {
  onLogout?: () => void;
  onStartTrip?: () => void;
  onSelectTrip?: (trip: TripResponse) => void;
};

export default function MyTripsScreen({
  onLogout,
  onStartTrip,
  onSelectTrip,
}: MyTripsScreenProps) {
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await fetchUserTrips();
      setTrips(data);
    } catch (err) {
      console.error('Error cargando viajes:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTrips();
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      console.error('Error al eliminar viaje:', err);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tus viajes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (trips.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>✈️</Text>
          </View>

          <Text style={styles.emptyTitle}>Todavía no tienes viajes</Text>
          <Text style={styles.emptySubtitle}>
            Crea tu primer viaje personalizado con itinerarios día a día organizados con IA.
          </Text>

          <Pressable onPress={onStartTrip} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Empezar mi primer viaje</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Viajes </Text>
        </View>

        <Pressable onPress={onStartTrip} style={styles.newTripButton}>
          <Text style={styles.newTripButtonText}>+ Nuevo Viaje</Text>
        </Pressable>
      </View>

      <FlatList
        data={trips}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectTrip?.(item)}
            style={({ pressed }) => [
              styles.tripCard,
              pressed && styles.tripCardPressed,
            ]}
          >
            <View style={styles.tripCardTopRow}>
              <View style={styles.tripBadge}>
                <Text style={styles.tripBadgeText}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripTitle}>{item.destination_city}</Text>
                <Text style={styles.tripDestination}>{item.country_name}</Text>
              </View>
              <View style={styles.tripDaysBadge}>
                <Text style={styles.tripDaysBadgeText}>
                  {item.total_days} {item.total_days === 1 ? 'día' : 'días'}
                </Text>
              </View>
            </View>

            <View style={styles.tripDatesRow}>
              <Text style={styles.tripDates}>
                🗓️ {item.start_date} al {item.end_date}
              </Text>
              <Text style={styles.tripBudget}>
                💰 ~{item.total_estimated_cost.toFixed(0)} {item.currency}
              </Text>
            </View>

            {/* Píldoras de personalización */}
            <View style={styles.pillsRow}>
              {item.has_mobility_issues && (
                <View style={[styles.pill, styles.pillBlue]}>
                  <Text style={styles.pillBlueText}>♿ Adaptado</Text>
                </View>
              )}
              {item.dietary_preferences.map((d, idx) => (
                <View key={`d-${idx}`} style={[styles.pill, styles.pillGreen]}>
                  <Text style={styles.pillGreenText}>🥗 {d}</Text>
                </View>
              ))}
              {item.specific_places.map((p, idx) => (
                <View key={`p-${idx}`} style={[styles.pill, styles.pillOrange]}>
                  <Text style={styles.pillOrangeText}>📌 {p}</Text>
                </View>
              ))}
            </View>

            <View style={styles.tripCardFooter}>
              <Text style={styles.viewItineraryLink}>Ver itinerario completo →</Text>
            </View>
          </Pressable>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#C7D7FE',
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
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    maxWidth: 320,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  newTripButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
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
    fontSize: 28,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: 14,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  tripCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  tripCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D7FE',
  },
  tripBadgeText: {
    fontSize: 20,
  },
  tripTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  tripDestination: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  tripDaysBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripDaysBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  tripDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tripDates: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  tripBudget: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  pillBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  pillBlueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  pillGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pillGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  pillOrange: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pillOrangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  tripCardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  viewItineraryLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
