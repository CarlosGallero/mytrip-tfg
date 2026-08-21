import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { DestinationTravelInfo } from '../../types';

interface TripDateBudgetStepProps {
  countryInfo: DestinationTravelInfo | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  onDatesChange: (start: string | null, end: string | null, totalDays: number, totalNights: number) => void;
  onBudgetChange: (budget: number | null) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_OF_WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function TripDateBudgetStep({
  countryInfo,
  startDate,
  endDate,
  budget,
  onDatesChange,
  onBudgetChange,
}: TripDateBudgetStepProps) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const dailyCostInfo = countryInfo?.estimated_daily_cost;
  const currencySymbol = dailyCostInfo?.currency || 'EUR';
  const cityName = countryInfo?.destination_city || 'la ciudad';

  // Navegación de mes
  const handlePrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prev);
    }
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  };

  // Generación de días del mes
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isPast: boolean;
      isCurrentMonth: boolean;
    }> = [];

    // Relleno mes anterior
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = formatDate(prevDate);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isPast: true,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isPast = dateObj < today;
      const dateStr = formatDate(dateObj);
      days.push({
        dateStr,
        dayNumber: d,
        isPast,
        isCurrentMonth: true,
      });
    }

    // Relleno mes siguiente para completar la cuadrícula (múltiplos de 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = formatDate(nextDate);
      days.push({
        dateStr,
        dayNumber: d,
        isPast: false,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, today]);

  function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Selección de fecha en el calendario
  const handleDatePress = (dateStr: string, isPast: boolean) => {
    if (isPast) return;

    if (!startDate || (startDate && endDate)) {
      // Primer click: definir fecha de inicio
      onDatesChange(dateStr, null, 1, 0);
    } else if (startDate && !endDate) {
      // Segundo click: definir fecha de fin
      if (dateStr < startDate) {
        onDatesChange(dateStr, null, 1, 0);
      } else if (dateStr === startDate) {
        onDatesChange(startDate, null, 1, 0);
      } else {
        const start = new Date(startDate);
        const end = new Date(dateStr);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const diffDays = diffNights + 1;
        onDatesChange(startDate, dateStr, diffDays, diffNights);
      }
    }
  };

  // Cálculo de días y noches
  const { totalDays, totalNights } = useMemo(() => {
    if (!startDate) return { totalDays: 0, totalNights: 0 };
    if (!endDate) return { totalDays: 1, totalNights: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return { totalDays: nights + 1, totalNights: nights };
  }, [startDate, endDate]);

  // Presupuesto sugerido por la IA para toda la estancia
  const suggestedTotalBudget = useMemo(() => {
    if (!dailyCostInfo) return null;
    const days = totalDays > 0 ? totalDays : 1;
    return Math.round(dailyCostInfo.total_daily_cost * days);
  }, [dailyCostInfo, totalDays]);

  const handleApplySuggestedBudget = () => {
    if (suggestedTotalBudget !== null) {
      onBudgetChange(suggestedTotalBudget);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* SECCIÓN 1: CALENDARIO DE FECHAS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📅 Fechas del viaje</Text>
          <Text style={styles.cardSubtitle}>
            Selecciona la fecha de llegada y de salida en el calendario
          </Text>
        </View>

        {/* Cabecera del calendario con navegación de mes */}
        <View style={styles.monthHeader}>
          <Pressable onPress={handlePrevMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>◀</Text>
          </Pressable>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>

          <Pressable onPress={handleNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>▶</Text>
          </Pressable>
        </View>

        {/* Días de la semana */}
        <View style={styles.weekDaysRow}>
          {DAYS_OF_WEEK.map((d, index) => (
            <Text key={index} style={styles.weekDayText}>{d}</Text>
          ))}
        </View>

        {/* Cuadrícula de días */}
        <View style={styles.daysGrid}>
          {calendarDays.map((item, index) => {
            const isStart = item.dateStr === startDate;
            const isEnd = item.dateStr === endDate;
            const isInRange =
              startDate &&
              endDate &&
              item.dateStr > startDate &&
              item.dateStr < endDate;

            return (
              <Pressable
                key={index}
                onPress={() => handleDatePress(item.dateStr, item.isPast || !item.isCurrentMonth)}
                disabled={item.isPast || !item.isCurrentMonth}
                style={[
                  styles.dayCell,
                  isInRange && styles.dayCellInRange,
                  isStart && styles.dayCellStart,
                  isEnd && styles.dayCellEnd,
                  (!item.isCurrentMonth || item.isPast) && styles.dayCellDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    (!item.isCurrentMonth || item.isPast) && styles.dayTextDisabled,
                    isInRange && styles.dayTextInRange,
                    (isStart || isEnd) && styles.dayTextSelected,
                  ]}
                >
                  {item.dayNumber}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Resumen de días y noches calculados */}
        {startDate && (
          <View style={styles.durationBanner}>
            <View style={styles.durationPill}>
              <Text style={styles.durationPillText}>☀️ {totalDays} {totalDays === 1 ? 'día' : 'días'}</Text>
            </View>
            <View style={styles.durationPill}>
              <Text style={styles.durationPillText}>🌙 {totalNights} {totalNights === 1 ? 'noche' : 'noches'}</Text>
            </View>
            <Text style={styles.datesRangeText}>
              {startDate} {endDate ? `al ${endDate}` : '(selecciona salida)'}
            </Text>
          </View>
        )}
      </View>

      {/* SECCIÓN 2: ESTIMACIÓN Y PRESUPUESTO DEL USUARIO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💰 Presupuesto para comidas y ocio</Text>
          <Text style={styles.cardSubtitle}>
            Indica cuánto deseas destinar para la estancia en {cityName}.
          </Text>
        </View>

        {/* Estimación calculada por la IA para la ciudad */}
        {dailyCostInfo && (
          <View style={styles.aiEstimateCard}>
            <View style={styles.aiEstimateHeader}>
              <Text style={styles.aiEstimateBadge}>✨ Estimación calculada por IA</Text>
              <Text style={styles.aiEstimateRate}>
                {dailyCostInfo.total_daily_cost.toFixed(0)} {currencySymbol} / día por persona
              </Text>
            </View>

            <View style={styles.aiBreakdownRow}>
              <View style={styles.aiBreakdownItem}>
                <Text style={styles.aiBreakdownLabel}>🍽️ Desayuno + Comida</Text>
                <Text style={styles.aiBreakdownValue}>~{dailyCostInfo.food_daily_cost.toFixed(0)} {currencySymbol}/día</Text>
              </View>
              <View style={styles.aiBreakdownItem}>
                <Text style={styles.aiBreakdownLabel}>🎟️ 1 Actividad diaria</Text>
                <Text style={styles.aiBreakdownValue}>~{dailyCostInfo.activities_daily_cost.toFixed(0)} {currencySymbol}/día</Text>
              </View>
            </View>

            {dailyCostInfo.breakdown_details ? (
              <Text style={styles.aiBreakdownDetailsText}>{dailyCostInfo.breakdown_details}</Text>
            ) : null}

            {suggestedTotalBudget !== null && (
              <Pressable
                style={styles.applyBudgetButton}
                onPress={handleApplySuggestedBudget}
              >
                <Text style={styles.applyBudgetButtonText}>
                  Usar presupuesto sugerido: {suggestedTotalBudget} {currencySymbol} ({totalDays} {totalDays === 1 ? 'día' : 'días'})
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Input para el presupuesto del usuario */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tu presupuesto estimado ({currencySymbol}):</Text>
          <View style={styles.currencyInputWrapper}>
            <TextInput
              style={styles.currencyInput}
              keyboardType="numeric"
              placeholder="Ej. 150"
              placeholderTextColor={colors.textMuted}
              value={budget !== null && budget !== undefined ? String(budget) : ''}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                onBudgetChange(cleaned ? Number(cleaned) : null);
              }}
            />
            <Text style={styles.currencySuffix}>{currencySymbol}</Text>
          </View>
        </View>

        {/* ALERTA OBLIGATORIA: TRANSPORTE Y ALOJAMIENTO VAN POR SEPARADO */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>ℹ️</Text>
          <View style={styles.disclaimerTextContainer}>
            <Text style={styles.disclaimerTitle}>Importante sobre el presupuesto</Text>
            <Text style={styles.disclaimerBody}>
              Este cálculo contempla <Text style={styles.boldText}>exclusivamente comidas y actividades/visitas turísticas</Text> en {cityName}.
              El transporte (vuelos, trenes) y el alojamiento se configuran por separado.
            </Text>
          </View>
        </View>
      </View>
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
  },
  navButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 6,
  },
  dayCell: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  dayCellInRange: {
    backgroundColor: '#EEF2FF',
    borderRadius: 0,
  },
  dayCellStart: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 19,
    borderBottomLeftRadius: 19,
  },
  dayCellEnd: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 19,
    borderBottomRightRadius: 19,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  dayTextInRange: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  durationPill: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  datesRangeText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  aiEstimateCard: {
    backgroundColor: '#F5F7FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDE5FF',
    marginBottom: 16,
  },
  aiEstimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiEstimateBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  aiEstimateRate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  aiBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  aiBreakdownItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5EDFF',
  },
  aiBreakdownLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  aiBreakdownValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  aiBreakdownDetailsText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  applyBudgetButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  applyBudgetButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  currencyInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: 12,
  },
  currencySuffix: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    fontSize: 18,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  disclaimerBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  boldText: {
    fontWeight: '800',
  },
});
