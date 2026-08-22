import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { DayPaceConfig, TripPaceLevel } from '../../types';

interface TripPaceStepProps {
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  paceType: 'global' | 'custom_days';
  globalPace: TripPaceLevel;
  dailyPace: DayPaceConfig[];
  onPaceTypeChange: (type: 'global' | 'custom_days') => void;
  onGlobalPaceChange: (pace: TripPaceLevel) => void;
  onDailyPaceChange: (daily: DayPaceConfig[]) => void;
}

const GLOBAL_PACE_OPTIONS: Array<{
  id: TripPaceLevel;
  icon: string;
  title: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'relaxed',
    icon: '🌴',
    title: 'Relajado y sin prisas',
    badge: '1 - 2 visitas / día',
    description: 'Paseos tranquilos, descansos frecuentes en cafeterías/terrazas y tiempo libre para improvisar.',
  },
  {
    id: 'moderate',
    icon: '🚶‍♂️',
    title: 'Medio y equilibrado',
    badge: '2 - 4 visitas / día',
    description: 'El equilibrio ideal: visitas a los lugares imprescindibles con tiempo para disfrutar de la comida y descansar.',
  },
  {
    id: 'intense',
    icon: '⚡',
    title: 'A full / Intenso',
    badge: '4+ actividades / día',
    description: 'Aprovecha cada hora del día con un itinerario dinámico de mañana a noche para ver el máximo posible.',
  },
];

export default function TripPaceStep({
  startDate,
  endDate,
  totalDays,
  paceType,
  globalPace,
  dailyPace,
  onPaceTypeChange,
  onGlobalPaceChange,
  onDailyPaceChange,
}: TripPaceStepProps) {
  // Generar lista de días del viaje a partir de startDate y totalDays
  const tripDaysList = useMemo(() => {
    const daysCount = totalDays > 0 ? totalDays : 1;
    const daysArr: Array<{ dayNumber: number; dateStr: string; label: string }> = [];

    let baseDate: Date;
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      baseDate = new Date(y, m - 1, d);
    } else {
      baseDate = new Date();
    }

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const dayNum = i + 1;
      const dayFormatted = String(d.getDate()).padStart(2, '0');
      const monthFormatted = String(d.getMonth() + 1).padStart(2, '0');
      const yearFormatted = d.getFullYear();
      const dateStr = `${yearFormatted}-${monthFormatted}-${dayFormatted}`;

      daysArr.push({
        dayNumber: dayNum,
        dateStr,
        label: `Día ${dayNum} (${dayFormatted}/${monthFormatted})`,
      });
    }

    return daysArr;
  }, [startDate, totalDays]);

  // Actualizar el ritmo de un día concreto
  const handleSetDayPace = (dayNumber: number, dateStr: string, pace: TripPaceLevel) => {
    const updated = [...dailyPace];
    const existingIdx = updated.findIndex((d) => d.dayNumber === dayNumber);

    if (existingIdx >= 0) {
      updated[existingIdx] = { dayNumber, dateStr, pace };
    } else {
      updated.push({ dayNumber, dateStr, pace });
    }

    onDailyPaceChange(updated);
  };

  // Obtener el ritmo asignado a un día
  const getDayPace = (dayNumber: number): TripPaceLevel => {
    const found = dailyPace.find((d) => d.dayNumber === dayNumber);
    return found ? found.pace : globalPace || 'moderate';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Selector de Modo: Global vs Por Días */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>⚡ ¿Qué ritmo prefieres para tu viaje?</Text>
          <Text style={styles.cardSubtitle}>
            Define la intensidad de actividades y el tiempo libre para recorrer la ciudad.
          </Text>
        </View>

        <View style={styles.modeTabsRow}>
          <Pressable
            onPress={() => onPaceTypeChange('global')}
            style={[
              styles.modeTab,
              paceType === 'global' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                paceType === 'global' && styles.modeTabTextActive,
              ]}
            >
              🌐 Mismo ritmo todo el viaje
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onPaceTypeChange('custom_days')}
            style={[
              styles.modeTab,
              paceType === 'custom_days' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                paceType === 'custom_days' && styles.modeTabTextActive,
              ]}
            >
              📅 Personalizar por días ({totalDays} {totalDays === 1 ? 'día' : 'días'})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* MODO 1: RITMO GLOBAL */}
      {paceType === 'global' && (
        <View style={styles.optionsList}>
          {GLOBAL_PACE_OPTIONS.map((option) => {
            const isSelected = globalPace === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onGlobalPaceChange(option.id)}
                style={[
                  styles.paceOptionCard,
                  isSelected && styles.paceOptionCardActive,
                ]}
              >
                <View style={styles.paceOptionTopRow}>
                  <View style={styles.paceIconContainer}>
                    <Text style={styles.paceIcon}>{option.icon}</Text>
                  </View>
                  <View style={styles.paceTitleBlock}>
                    <Text style={styles.paceTitle}>{option.title}</Text>
                    <View
                      style={[
                        styles.paceBadge,
                        isSelected && styles.paceBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paceBadgeText,
                          isSelected && styles.paceBadgeTextActive,
                        ]}
                      >
                        {option.badge}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                </View>
                <Text style={styles.paceDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* MODO 2: PERSONALIZADO POR DÍAS */}
      {paceType === 'custom_days' && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📅 Configuración Día a Día</Text>
            <Text style={styles.cardSubtitle}>
              Selecciona el nivel de intensidad deseado para cada día de tu estancia:
            </Text>
          </View>

          <View style={styles.daysContainer}>
            {tripDaysList.map((dayItem) => {
              const currentDayPace = getDayPace(dayItem.dayNumber);

              return (
                <View key={dayItem.dayNumber} style={styles.dayCardItem}>
                  <View style={styles.dayCardHeader}>
                    <Text style={styles.dayCardTitle}>{dayItem.label}</Text>
                    <Text style={styles.dayPaceStatusText}>
                      {currentDayPace === 'relaxed' && '🌴 Relajado'}
                      {currentDayPace === 'moderate' && '🚶‍♂️ Medio'}
                      {currentDayPace === 'intense' && '⚡ A full'}
                    </Text>
                  </View>

                  <View style={styles.dayPaceButtonsRow}>
                    <Pressable
                      onPress={() => handleSetDayPace(dayItem.dayNumber, dayItem.dateStr, 'relaxed')}
                      style={[
                        styles.dayPaceBtn,
                        currentDayPace === 'relaxed' && styles.dayPaceBtnActiveRelaxed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPaceBtnText,
                          currentDayPace === 'relaxed' && styles.dayPaceBtnTextActive,
                        ]}
                      >
                        🌴 Relajado
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSetDayPace(dayItem.dayNumber, dayItem.dateStr, 'moderate')}
                      style={[
                        styles.dayPaceBtn,
                        currentDayPace === 'moderate' && styles.dayPaceBtnActiveModerate,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPaceBtnText,
                          currentDayPace === 'moderate' && styles.dayPaceBtnTextActive,
                        ]}
                      >
                        🚶‍♂️ Medio
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSetDayPace(dayItem.dayNumber, dayItem.dateStr, 'intense')}
                      style={[
                        styles.dayPaceBtn,
                        currentDayPace === 'intense' && styles.dayPaceBtnActiveIntense,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPaceBtnText,
                          currentDayPace === 'intense' && styles.dayPaceBtnTextActive,
                        ]}
                      >
                        ⚡ A full
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  modeTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  optionsList: {
    gap: 12,
  },
  paceOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  paceOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAF9FF',
  },
  paceOptionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paceIcon: {
    fontSize: 22,
  },
  paceTitleBlock: {
    flex: 1,
  },
  paceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  paceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paceBadgeActive: {
    backgroundColor: '#EEF4FF',
    borderColor: '#C7D7FE',
  },
  paceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  paceBadgeTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paceDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  daysContainer: {
    gap: 12,
  },
  dayCardItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  dayPaceStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  dayPaceButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPaceBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dayPaceBtnActiveRelaxed: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  dayPaceBtnActiveModerate: {
    backgroundColor: '#EEF4FF',
    borderColor: colors.primary,
  },
  dayPaceBtnActiveIntense: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  dayPaceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  dayPaceBtnTextActive: {
    fontWeight: '800',
    color: colors.text,
  },
});
