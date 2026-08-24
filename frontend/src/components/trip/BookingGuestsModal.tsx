import React, { useState, useEffect } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { TripResponse } from '../../types';

interface BookingGuestsModalProps {
  visible: boolean;
  trip: TripResponse | null;
  onClose: () => void;
}

const AGE_OPTIONS = Array.from({ length: 18 }, (_, i) => i); // 0 a 17

export default function BookingGuestsModal({
  visible,
  trip,
  onClose,
}: BookingGuestsModalProps) {
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [selectingAgeForChild, setSelectingAgeForChild] = useState<number | null>(null);

  // Reset state when opening with a new trip
  useEffect(() => {
    if (visible) {
      setAdults(2);
      setChildrenCount(0);
      setChildAges([]);
      setSelectingAgeForChild(null);
    }
  }, [visible]);

  if (!trip) return null;

  const handleChildrenChange = (newCount: number) => {
    if (newCount < 0 || newCount > 6) return;
    setChildrenCount(newCount);
    setChildAges((prev) => {
      if (newCount > prev.length) {
        // Añadir nuevos niños con edad por defecto de 5 años
        const added = Array(newCount - prev.length).fill(5);
        return [...prev, ...added];
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  const handleSetChildAge = (childIndex: number, age: number) => {
    setChildAges((prev) => {
      const updated = [...prev];
      updated[childIndex] = age;
      return updated;
    });
    setSelectingAgeForChild(null);
  };

  const handleSearchBooking = async () => {
    try {
      const city = encodeURIComponent(trip.destination_city || trip.destination);
      let url = `https://www.booking.com/searchresults.es.html?ss=${city}&checkin=${trip.start_date}&checkout=${trip.end_date}&group_adults=${adults}&group_children=${childrenCount}&no_rooms=1`;

      if (childrenCount > 0) {
        childAges.forEach((age) => {
          url += `&age=${age}`;
        });
      }

      await Linking.openURL(url);
      onClose();
    } catch (err) {
      console.error('Error al abrir Booking.com:', err);
    }
  };

  const formatAgeLabel = (age: number) => {
    if (age === 0) return '0 años (menor de 1 año)';
    if (age === 1) return '1 año';
    return `${age} años`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* CABECERA DEL MODAL */}
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconText}>🏨</Text>
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.modalTitle}>Buscar Alojamiento</Text>
              <Text style={styles.modalSubtitle}>
                {trip.destination_city} • {trip.start_date} al {trip.end_date}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
            {/* STEPPER: ADULTOS */}
            <View style={styles.stepperRow}>
              <View>
                <Text style={styles.stepperLabel}>Adultos</Text>
                <Text style={styles.stepperHint}>De 18 años o más</Text>
              </View>
              <View style={styles.counterControls}>
                <Pressable
                  onPress={() => setAdults((prev) => Math.max(1, prev - 1))}
                  disabled={adults <= 1}
                  style={[styles.countBtn, adults <= 1 && styles.countBtnDisabled]}
                >
                  <Text style={[styles.countBtnText, adults <= 1 && styles.countBtnTextDisabled]}>−</Text>
                </Pressable>
                <Text style={styles.countValue}>{adults}</Text>
                <Pressable
                  onPress={() => setAdults((prev) => Math.min(10, prev + 1))}
                  disabled={adults >= 10}
                  style={[styles.countBtn, adults >= 10 && styles.countBtnDisabled]}
                >
                  <Text style={styles.countBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* STEPPER: NIÑOS */}
            <View style={styles.stepperRow}>
              <View>
                <Text style={styles.stepperLabel}>Niños</Text>
                <Text style={styles.stepperHint}>De 0 a 17 años</Text>
              </View>
              <View style={styles.counterControls}>
                <Pressable
                  onPress={() => handleChildrenChange(childrenCount - 1)}
                  disabled={childrenCount <= 0}
                  style={[styles.countBtn, childrenCount <= 0 && styles.countBtnDisabled]}
                >
                  <Text style={[styles.countBtnText, childrenCount <= 0 && styles.countBtnTextDisabled]}>−</Text>
                </Pressable>
                <Text style={styles.countValue}>{childrenCount}</Text>
                <Pressable
                  onPress={() => handleChildrenChange(childrenCount + 1)}
                  disabled={childrenCount >= 6}
                  style={[styles.countBtn, childrenCount >= 6 && styles.countBtnDisabled]}
                >
                  <Text style={styles.countBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* DESPLEGABLES DE EDAD DE CADA NIÑO (OBLIGATORIOS) */}
            {childrenCount > 0 && (
              <View style={styles.childrenAgesSection}>
                <Text style={styles.childrenAgesSectionTitle}>
                  👶 Edad de los niños (Obligatorio para Booking):
                </Text>

                {childAges.map((age, idx) => (
                  <View key={`child-${idx}`} style={styles.childAgeRow}>
                    <Text style={styles.childAgeLabel}>Niño {idx + 1}:</Text>
                    <Pressable
                      onPress={() => setSelectingAgeForChild(idx)}
                      style={({ pressed }) => [
                        styles.ageSelectorBtn,
                        pressed && styles.ageSelectorBtnPressed,
                      ]}
                    >
                      <Text style={styles.ageSelectorValue}>
                        {formatAgeLabel(age)}
                      </Text>
                      <Text style={styles.ageSelectorArrow}>▼</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* MODAL / SUB-DIALOGO PARA ELEGIR LA EDAD DEL NIÑO */}
            {selectingAgeForChild !== null && (
              <View style={styles.agePickerDropdownCard}>
                <Text style={styles.agePickerTitle}>
                  Selecciona la edad del Niño {selectingAgeForChild + 1}:
                </Text>
                <ScrollView
                  nestedScrollEnabled
                  style={styles.agePickerScroll}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.ageChipsGrid}>
                    {AGE_OPTIONS.map((optAge) => {
                      const isSelected = childAges[selectingAgeForChild] === optAge;
                      return (
                        <Pressable
                          key={`age-opt-${optAge}`}
                          onPress={() => handleSetChildAge(selectingAgeForChild, optAge)}
                          style={[
                            styles.ageChip,
                            isSelected && styles.ageChipSelected,
                          ]}
                        >
                          <Text style={[styles.ageChipText, isSelected && styles.ageChipTextSelected]}>
                            {optAge === 0 ? '< 1 año' : `${optAge} ${optAge === 1 ? 'año' : 'años'}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* BOTONES DE ACCIÓN INFERIORES */}
          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>

            <Pressable onPress={handleSearchBooking} style={styles.searchBookingBtn}>
              <Text style={styles.searchBookingBtnText}>Ver en Booking.com ↗</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  titleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  bodyContent: {
    gap: 14,
    paddingBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  stepperHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  countBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    elevation: 0,
  },
  countBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  countBtnTextDisabled: {
    color: '#94A3B8',
  },
  countValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  childrenAgesSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  childrenAgesSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 2,
  },
  childAgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  childAgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  ageSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 8,
  },
  ageSelectorBtnPressed: {
    backgroundColor: '#EEF4FF',
  },
  ageSelectorValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  ageSelectorArrow: {
    fontSize: 10,
    color: colors.primary,
  },
  agePickerDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  agePickerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  agePickerScroll: {
    maxHeight: 150,
  },
  ageChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ageChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  ageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  ageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  ageChipTextSelected: {
    color: colors.white,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  searchBookingBtn: {
    flex: 1.5,
    backgroundColor: '#003580', // Booking Official Blue
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003580',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchBookingBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
