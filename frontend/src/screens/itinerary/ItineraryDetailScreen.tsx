import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { ItineraryActivity, TripResponse } from '../../types';

interface ItineraryDetailScreenProps {
  trip: TripResponse;
  onBack?: () => void;
}

export default function ItineraryDetailScreen({
  trip,
  onBack,
}: ItineraryDetailScreenProps) {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(
    trip.days.length > 0 ? trip.days[0].day_number : 1
  );

  const activeDay = trip.days.find((d) => d.day_number === selectedDayNumber) || trip.days[0];

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
        return '🌅 Mañana';
      case 'lunch':
        return '🍽️ Almuerzo';
      case 'afternoon':
        return '🌇 Tarde';
      case 'dinner':
        return '🍷 Cena';
      case 'night':
        return '🌙 Noche';
      default:
        return '⏰ Actividad';
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
              {trip.destination_city}
            </Text>
            <Text style={styles.headerSubtitle}>
              {trip.country_name} • {trip.total_days} {trip.total_days === 1 ? 'día' : 'días'}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          

          {/* SELECTOR HORIZONTAL DE DÍAS */}
          <View style={styles.daySelectorWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsRow}>
              {trip.days.map((day) => {
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
                <Text style={styles.dayCostValue}>{activeDay.daily_estimated_cost.toFixed(0)} {trip.currency}</Text>
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
                          {getSlotIcon(slot.time_slot)} • {slot.time_range}
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

                      {/* Dirección y Botón Google Maps */}
                      <View style={styles.addressMapsBlock}>
                        <Text style={styles.addressText} numberOfLines={1}>
                          📍 {slot.address}
                        </Text>

                        {slot.maps_url ? (
                          <Pressable
                            onPress={() => handleOpenMaps(slot.maps_url)}
                            style={styles.mapsButton}
                          >
                            <Text style={styles.mapsButtonText}>
                              🗺️ Ver ubicación y web oficial en Google Maps
                            </Text>
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
  addressMapsBlock: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addressText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  mapsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  mapsButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
