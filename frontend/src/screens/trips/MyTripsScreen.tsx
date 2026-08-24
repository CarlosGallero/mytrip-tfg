import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchUserTrips, deleteTrip } from '../../api/itinerary';
import BookingGuestsModal from '../../components/trip/BookingGuestsModal';
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

  // Estado para el modal de confirmación de eliminación
  const [tripToDelete, setTripToDelete] = useState<TripResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estado para el modal de configuración de huéspedes de Booking
  const [tripForBooking, setTripForBooking] = useState<TripResponse | null>(null);

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

  const handleConfirmDelete = async () => {
    if (!tripToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteTrip(tripToDelete.id);
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
      setTripToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar viaje:', err);
      setDeleteError(err?.message || 'No se pudo eliminar el viaje de la base de datos.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenBooking = async (trip: TripResponse) => {
    try {
      const city = trip.destination_city || trip.destination;
      const encodedCity = encodeURIComponent(city);
      const bookingUrl = `https://www.booking.com/searchresults.es.html?ss=${encodedCity}&checkin=${trip.start_date}&checkout=${trip.end_date}&group_adults=2&no_rooms=1&group_children=0`;
      await Linking.openURL(bookingUrl);
    } catch (err) {
      console.error('Error al abrir Booking.com:', err);
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
          <Text style={styles.headerTitle}>Mis Viajes</Text>
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

              <View style={styles.topRightActionsRow}>
                <View style={styles.tripDaysBadge}>
                  <Text style={styles.tripDaysBadgeText}>
                    {item.total_days} {item.total_days === 1 ? 'día' : 'días'}
                  </Text>
                </View>

                {/* Botón de eliminar viaje */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setDeleteError(null);
                    setTripToDelete(item);
                  }}
                  style={styles.deleteIconButton}
                  hitSlop={8}
                >
                  <Text style={styles.deleteIconText}>🗑️</Text>
                </Pressable>
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

            {/* BOTÓN DE AYUDA PARA BUSCAR ALOJAMIENTO EN BOOKING */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setTripForBooking(item);
              }}
              style={({ pressed }) => [
                styles.bookingButton,
                pressed && styles.bookingButtonPressed,
              ]}
            >
              <View style={styles.bookingIconWrap}>
                <Text style={styles.bookingIconText}>🏨</Text>
              </View>
              <View style={styles.bookingTextWrap}>
                <Text style={styles.bookingButtonTitle}>Te ayudamos a buscar alojamiento</Text>
                <Text style={styles.bookingButtonSubtitle}>
                  Configurar viajeros y ver hoteles en {item.destination_city} ↗
                </Text>
              </View>
            </Pressable>

            <View style={styles.tripCardFooter}>
              <Text style={styles.viewItineraryLink}>Ver itinerario completo →</Text>
            </View>
          </Pressable>
        )}
      />

      {/* MODAL DE CONFIGURACIÓN DE HUÉSPEDES PARA BOOKING */}
      <BookingGuestsModal
        visible={tripForBooking !== null}
        trip={tripForBooking}
        onClose={() => setTripForBooking(null)}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Modal
        visible={tripToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setTripToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalDangerIcon}>🗑️</Text>
            </View>

            <Text style={styles.modalTitle}>¿Eliminar este viaje?</Text>
            <Text style={styles.modalSubtitle}>
              Se eliminará permanentemente tu viaje a{' '}
              <Text style={styles.modalHighlight}>"{tripToDelete?.destination_city}"</Text>{' '}
              ({tripToDelete?.start_date} al {tripToDelete?.end_date}) y todo su itinerario generado de la base de datos.
            </Text>

            {deleteError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{deleteError}</Text>
              </View>
            )}

            <View style={styles.modalButtonsRow}>
              <Pressable
                onPress={() => setTripToDelete(null)}
                disabled={isDeleting}
                style={[styles.modalSecondaryBtn, isDeleting && styles.btnDisabled]}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                style={[styles.modalDangerBtn, isDeleting && styles.btnDisabled]}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalDangerBtnText}>Sí, eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  topRightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconText: {
    fontSize: 14,
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
  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  bookingButtonPressed: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  bookingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  bookingIconText: {
    fontSize: 18,
  },
  bookingTextWrap: {
    flex: 1,
  },
  bookingButtonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  bookingButtonSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalDangerIcon: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  modalHighlight: {
    color: colors.text,
    fontWeight: '800',
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalErrorText: {
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  modalDangerBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  modalDangerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
