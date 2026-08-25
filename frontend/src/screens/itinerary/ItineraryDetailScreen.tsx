import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { regenerateTripSlot } from '../../api/itinerary';
import BookingGuestsModal from '../../components/trip/BookingGuestsModal';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { ItineraryActivity, TripResponse } from '../../types';

interface ItineraryDetailScreenProps {
  trip: TripResponse;
  onBack?: () => void;
  onTripUpdated?: (updated: TripResponse) => void;
}

interface ChangingSlotTarget {
  dayNumber: number;
  slotIndex: number;
  timeSlot: string;
  currentTitle: string;
}

export default function ItineraryDetailScreen({
  trip: initialTrip,
  onBack,
  onTripUpdated,
}: ItineraryDetailScreenProps) {
  const [currentTrip, setCurrentTrip] = useState<TripResponse>(initialTrip);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(
    initialTrip.days.length > 0 ? initialTrip.days[0].day_number : 1
  );

  // Modal de huéspedes para Booking.com
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Modal de cambio de actividad
  const [slotToChange, setSlotToChange] = useState<ChangingSlotTarget | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const activeDay = currentTrip.days.find((d) => d.day_number === selectedDayNumber) || currentTrip.days[0];

  const handleOpenMaps = async (url: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening maps URL:', err);
    }
  };

  const getSlotIcon = (timeSlot: string) => {
    switch (timeSlot.toLowerCase()) {
      case 'morning':
        return '';
      case 'lunch':
        return '';
      case 'afternoon':
        return '';
      case 'dinner':
        return '';
      case 'night':
        return '';
      default:
        return '';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'restaurant':
        return { label: 'Gastronomía', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
      case 'monument':
      case 'culture':
        return { label: 'Cultura y Patrimonio', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'beach':
        return { label: 'Playa y Costa', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' };
      case 'leisure':
        return { label: 'Paseo y Ocio', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
      default:
        return { label: 'Visita turística', color: '#475569', bg: '#F8FAFC', border: '#E2E8F0' };
    }
  };

  const handleExecuteChange = async (replacementType: string) => {
    if (!slotToChange || isRegenerating) return;

    setIsRegenerating(true);
    setRegenerateError(null);

    try {
      const updated = await regenerateTripSlot(
        currentTrip.id,
        slotToChange.dayNumber,
        slotToChange.slotIndex,
        replacementType
      );
      setCurrentTrip(updated);
      onTripUpdated?.(updated);
      setSlotToChange(null);
    } catch (err: any) {
      console.error('Error al regenerar slot:', err);
      setRegenerateError(
        err?.message || 'No se pudo generar la alternativa. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderModalOptions = () => {
    if (!slotToChange) return null;
    const slotType = slotToChange.timeSlot.toLowerCase();

    // 1. Franja de Mañana: Otra Actividad vs Bar de Desayuno
    if (slotType === 'morning') {
      return (
        <View style={styles.modalOptionsContainer}>
          <Pressable
            onPress={() => handleExecuteChange('activity')}
            disabled={isRegenerating}
            style={({ pressed }) => [
              styles.modalOptionButton,
              pressed && styles.modalOptionButtonPressed,
            ]}
          >
            <View style={styles.optionIconWrap}>
              <Text style={styles.optionIcon}>🏛️</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Otra Actividad / Visita</Text>
              <Text style={styles.optionDesc}>
                Monumento, museo o paseo cultural en la misma zona.
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleExecuteChange('breakfast_cafe')}
            disabled={isRegenerating}
            style={({ pressed }) => [
              styles.modalOptionButton,
              pressed && styles.modalOptionButtonPressed,
            ]}
          >
            <View style={styles.optionIconWrap}>
              <Text style={styles.optionIcon}>☕</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Bar / Cafetería para desayunar</Text>
              <Text style={styles.optionDesc}>
                Café tradicional o de especialidad y tostadas en este barrio.
              </Text>
            </View>
          </Pressable>
        </View>
      );
    }

    // 2. Franja de Almuerzo / Cena: Otro Restaurante vs Actividad
    if (slotType === 'lunch' || slotType === 'dinner') {
      return (
        <View style={styles.modalOptionsContainer}>
          <Pressable
            onPress={() => handleExecuteChange('restaurant')}
            disabled={isRegenerating}
            style={({ pressed }) => [
              styles.modalOptionButton,
              pressed && styles.modalOptionButtonPressed,
            ]}
          >
            <View style={styles.optionIconWrap}>
              <Text style={styles.optionIcon}>🍽️</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Otro Restaurante</Text>
              <Text style={styles.optionDesc}>
                Mesón, taberna o restaurante local adaptado a tus dietas.
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleExecuteChange('activity')}
            disabled={isRegenerating}
            style={({ pressed }) => [
              styles.modalOptionButton,
              pressed && styles.modalOptionButtonPressed,
            ]}
          >
            <View style={styles.optionIconWrap}>
              <Text style={styles.optionIcon}>🏛️</Text>
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Cambiar por una Actividad</Text>
              <Text style={styles.optionDesc}>
                Sustituir la comida por una visita turística o paseo.
              </Text>
            </View>
          </Pressable>
        </View>
      );
    }

    // 3. Franja de Tarde / Noche: Otra Actividad vs Restaurante / Bar
    return (
      <View style={styles.modalOptionsContainer}>
        <Pressable
          onPress={() => handleExecuteChange('activity')}
          disabled={isRegenerating}
          style={({ pressed }) => [
            styles.modalOptionButton,
            pressed && styles.modalOptionButtonPressed,
          ]}
        >
          <View style={styles.optionIconWrap}>
            <Text style={styles.optionIcon}>🏛️</Text>
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Otra Actividad / Paseo</Text>
            <Text style={styles.optionDesc}>
              Parque, monumento o recorrido turístico cercano.
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleExecuteChange('restaurant')}
          disabled={isRegenerating}
          style={({ pressed }) => [
            styles.modalOptionButton,
            pressed && styles.modalOptionButtonPressed,
          ]}
        >
          <View style={styles.optionIconWrap}>
            <Text style={styles.optionIcon}>🍷</Text>
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Restaurante / Bar de Tapas</Text>
            <Text style={styles.optionDesc}>
              Parada gastronómica o merienda/cena en este barrio.
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER SUPERIOR */}
        <View style={styles.headerRow}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </Pressable>
          )}
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentTrip.destination_city}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentTrip.country_name} • {currentTrip.total_days} {currentTrip.total_days === 1 ? 'día' : 'días'}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* TARJETA HERO DEL VIAJE */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroDestinationBlock}>
                <Text style={styles.heroDestinationTitle}>
                  📍 {currentTrip.destination_city}
                </Text>
                <Text style={styles.heroDates}>
                  FECHA: {currentTrip.start_date} al {currentTrip.end_date}
                </Text>
              </View>
              <View style={styles.budgetBadgeContainer}>
                <Text style={styles.budgetBadgeLabel}>Presupuesto</Text>
                <Text style={styles.budgetBadgeValue}>
                  {currentTrip.total_estimated_cost.toFixed(0)} / {currentTrip.total_budget} {currentTrip.currency}
                </Text>
              </View>
            </View>

            {/* Píldoras de personalización */}
            <View style={styles.heroPillsWrap}>
              {currentTrip.has_mobility_issues && (
                <View style={[styles.heroPill, styles.heroPillBlue]}>
                  <Text style={styles.heroPillBlueText}>♿ Rutas adaptadas</Text>
                </View>
              )}
              {currentTrip.dietary_preferences.map((diet, i) => (
                <View key={`diet-${i}`} style={[styles.heroPill, styles.heroPillGreen]}>
                  <Text style={styles.heroPillGreenText}>🥗 {diet}</Text>
                </View>
              ))}
              {currentTrip.health_conditions.map((health, i) => (
                <View key={`health-${i}`} style={[styles.heroPill, styles.heroPillRed]}>
                  <Text style={styles.heroPillRedText}>🩺 {health}</Text>
                </View>
              ))}
              {currentTrip.specific_places.map((place, i) => (
                <View key={`place-${i}`} style={[styles.heroPill, styles.heroPillOrange]}>
                  <Text style={styles.heroPillOrangeText}>📌 {place}</Text>
                </View>
              ))}
            </View>

            {/* BOTÓN DE ALOJAMIENTO EN BOOKING */}
            <Pressable
              onPress={() => setShowBookingModal(true)}
              style={({ pressed }) => [
                styles.heroBookingButton,
                pressed && styles.heroBookingButtonPressed,
              ]}
            >
              <Text style={styles.heroBookingButtonText}>
                🏨 ¿Buscas alojamiento en {currentTrip.destination_city}? Ver en Booking.com ↗
              </Text>
            </Pressable>
          </View>

          {/* SELECTOR HORIZONTAL DE DÍAS */}
          <View style={styles.daySelectorWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsRow}>
              {currentTrip.days.map((day) => {
                const isSelected = day.day_number === selectedDayNumber;
                return (
                  <Pressable
                    key={day.day_number}
                    onPress={() => setSelectedDayNumber(day.day_number)}
                    style={[
                      styles.dayTab,
                      isSelected && styles.dayTabActive,
                    ]}
                  >
                    <Text style={[styles.dayTabNumber, isSelected && styles.dayTabNumberActive]}>
                      Día {day.day_number}
                    </Text>
                    <Text style={[styles.dayTabDate, isSelected && styles.dayTabDateActive]}>
                      {day.day_of_week.slice(0, 3)} {day.date.split('-')[2]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* BANNER INFORMATIVO DEL DÍA SELECCIONADO */}
          {activeDay && (
            <View style={styles.dayInfoBanner}>
              <View style={styles.dayInfoLeft}>
                <Text style={styles.dayInfoTitle}>
                  {activeDay.day_of_week} • Día {activeDay.day_number}
                </Text>
                <Text style={styles.dayInfoZone}>
                  📍 Zona: <Text style={styles.dayInfoZoneBold}>{activeDay.zone_name}</Text>
                </Text>
              </View>
              <View style={styles.dayCostTag}>
                <Text style={styles.dayCostLabel}>Est. día</Text>
                <Text style={styles.dayCostValue}>{activeDay.daily_estimated_cost.toFixed(0)} {currentTrip.currency}</Text>
              </View>
            </View>
          )}

          {/* LISTA DE ACTIVIDADES Y COMIDAS DEL DÍA */}
          {activeDay && (
            <View style={styles.activitiesContainer}>
              {activeDay.slots.map((slot: ItineraryActivity, index: number) => {
                const typeBadge = getTypeBadge(slot.type);

                return (
                  <View key={index} style={styles.activityCard}>
                    {/* CABECERA DE LA ACTIVIDAD CON FRANJA HORARIA */}
                    <View style={styles.activityCardHeader}>
                      <View style={styles.timeSlotPill}>
                        <Text style={styles.timeSlotPillText}>
                           {slot.time_range}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.typeTag,
                          { backgroundColor: typeBadge.bg, borderColor: typeBadge.border },
                        ]}
                      >
                        <Text style={[styles.typeTagText, { color: typeBadge.color }]}>
                          {typeBadge.label}
                        </Text>
                      </View>
                    </View>

                    {/* CUERPO DE LA ACTIVIDAD */}
                    <View style={styles.activityBody}>
                      <View style={styles.titleCostRow}>
                        <Text style={styles.activityTitle}>{slot.title}</Text>
                        <View style={styles.costBadge}>
                          <Text style={styles.costBadgeText}>
                            {slot.estimated_cost > 0
                              ? `~${slot.estimated_cost.toFixed(0)} ${slot.currency}`
                              : 'Gratuito'}
                          </Text>
                        </View>
                      </View>

                      {/* Descripción */}
                      <Text style={styles.activityDescription}>{slot.description}</Text>

                      {/* Motivos de selección */}
                      {slot.selection_reasons && slot.selection_reasons.length > 0 && (
                        <View style={styles.reasonsContainer}>
                          <Text style={styles.reasonsTitle}>🏷️ Motivos de selección:</Text>
                          <View style={styles.reasonsChipsWrap}>
                            {slot.selection_reasons.map((reason, rIdx) => (
                              <View key={rIdx} style={styles.reasonBadge}>
                                <Text style={styles.reasonBadgeText}>✓ {reason}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Dirección */}
                      <Text style={styles.addressText} numberOfLines={1}>
                        📍 {slot.address}
                      </Text>

                      {/* BOTONES DE ACCIÓN: CAMBIAR PARADA Y GOOGLE MAPS */}
                      <View style={styles.actionButtonsRow}>
                        <Pressable
                          onPress={() =>
                            setSlotToChange({
                              dayNumber: activeDay.day_number,
                              slotIndex: index,
                              timeSlot: slot.time_slot,
                              currentTitle: slot.title,
                            })
                          }
                          style={styles.changeSlotButton}
                        >
                          <Text style={styles.changeSlotButtonText}>🔄 Cambiar parada</Text>
                        </Pressable>

                        {slot.maps_url ? (
                          <Pressable
                            onPress={() => handleOpenMaps(slot.maps_url)}
                            style={styles.mapsButton}
                          >
                            <Text style={styles.mapsButtonText}>🗺️ Ver en Maps</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* MODAL DE SELECCIÓN DE REEMPLAZO */}
        <Modal
          visible={slotToChange !== null}
          transparent
          animationType="fade"
          onRequestClose={() => !isRegenerating && setSlotToChange(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {isRegenerating ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.modalLoadingTitle}>Buscando alternativa con IA...</Text>
                  <Text style={styles.modalLoadingSubtitle}>
                    Optimizando ubicación en {activeDay?.zone_name} y manteniendo tu presupuesto.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>🔄 Cambiar parada</Text>
                    <Pressable
                      onPress={() => setSlotToChange(null)}
                      style={styles.modalCloseBtn}
                    >
                      <Text style={styles.modalCloseBtnText}>✕</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.modalSubtitle}>
                    Reemplazar{' '}
                    <Text style={styles.modalHighlight}>"{slotToChange?.currentTitle}"</Text>{' '}
                    por una opción en la misma zona ({activeDay?.zone_name}):
                  </Text>

                  {regenerateError && (
                    <View style={styles.modalErrorBox}>
                      <Text style={styles.modalErrorText}>{regenerateError}</Text>
                    </View>
                  )}

                  {renderModalOptions()}
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* MODAL DE CONFIGURACIÓN DE HUÉSPEDES PARA BOOKING */}
        <BookingGuestsModal
          visible={showBookingModal}
          trip={currentTrip}
          onClose={() => setShowBookingModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF1F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#EDF1F7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  heroCard: {
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
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroDestinationBlock: {
    flex: 1,
    marginRight: 10,
  },
  heroDestinationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  heroDates: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  budgetBadgeContainer: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D7FE',
    alignItems: 'flex-end',
  },
  budgetBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  budgetBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  heroPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  heroPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  heroPillBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  heroPillBlueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  heroPillGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  heroPillGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  heroPillRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  heroPillRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  heroPillOrange: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  heroPillOrangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  heroBookingButton: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBookingButtonPressed: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  heroBookingButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  daySelectorWrapper: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dayTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  dayTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dayTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  dayTabNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  dayTabNumberActive: {
    color: colors.white,
  },
  dayTabDate: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  dayTabDateActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  dayInfoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dayInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  dayInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  dayInfoZone: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dayInfoZoneBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayCostTag: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dayCostLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dayCostValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  activitiesContainer: {
    gap: 14,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  timeSlotPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeSlotPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  activityBody: {
    padding: 16,
    paddingTop: 10,
  },
  titleCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  activityTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  costBadge: {
    backgroundColor: '#EEF4FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C7D7FE',
  },
  costBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  typeTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reasonsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  reasonsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reasonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  addressText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  changeSlotButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  changeSlotButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  mapsButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  mapsButtonText: {
    fontSize: 12,
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
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMuted,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalErrorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  modalOptionsContainer: {
    gap: 12,
  },
  modalOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    gap: 12,
  },
  modalOptionButtonPressed: {
    backgroundColor: '#EEF4FF',
    borderColor: colors.primary,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionIcon: {
    fontSize: 22,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  modalLoadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  modalLoadingSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
