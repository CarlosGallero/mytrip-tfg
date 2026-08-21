import React, { useState } from 'react';
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

interface TripAccessibilityHealthStepProps {
  hasMobilityIssues: boolean | null;
  healthConditions: string[];
  dietaryPreferences: string[];
  onMobilityChange: (hasMobility: boolean) => void;
  onHealthConditionsChange: (conditions: string[]) => void;
  onDietaryPreferencesChange: (preferences: string[]) => void;
}

const COMMON_DIETS = [
  { id: 'Vegana', label: '🌱 Vegana' },
  { id: 'Vegetariana', label: '🧀 Vegetariana' },
  { id: 'Sin gluten (Celiaquía)', label: '🌾 Sin Gluten' },
  { id: 'Sin lactosa', label: '🥛 Sin Lactosa' },
  { id: 'Pescatariana', label: '🐟 Pescatariana' },
  { id: 'Halal', label: '🥩 Halal' },
  { id: 'Kosher', label: '✡️ Kosher' },
];

const COMMON_HEALTH_TAGS = [
  'Asma',
  'Diabetes',
  'Cardiopatía',
  'Embarazo',
  'Alergia a picaduras',
];

export default function TripAccessibilityHealthStep({
  hasMobilityIssues,
  healthConditions,
  dietaryPreferences,
  onMobilityChange,
  onHealthConditionsChange,
  onDietaryPreferencesChange,
}: TripAccessibilityHealthStepProps) {
  const [newHealthInput, setNewHealthInput] = useState('');
  const [newDietInput, setNewDietInput] = useState('');

  // Manejo de Condiciones de Salud
  const handleAddHealthCondition = (conditionText?: string) => {
    const textToAdd = (conditionText || newHealthInput).trim();
    if (!textToAdd) return;

    if (!healthConditions.some((c) => c.toLowerCase() === textToAdd.toLowerCase())) {
      onHealthConditionsChange([...healthConditions, textToAdd]);
    }
    setNewHealthInput('');
  };

  const handleRemoveHealthCondition = (indexToRemove: number) => {
    onHealthConditionsChange(healthConditions.filter((_, idx) => idx !== indexToRemove));
  };

  // Manejo de Preferencias Dietéticas
  const handleToggleDiet = (dietName: string) => {
    const exists = dietaryPreferences.some((d) => d.toLowerCase() === dietName.toLowerCase());
    if (exists) {
      onDietaryPreferencesChange(
        dietaryPreferences.filter((d) => d.toLowerCase() !== dietName.toLowerCase())
      );
    } else {
      onDietaryPreferencesChange([...dietaryPreferences, dietName]);
    }
  };

  const handleAddCustomDiet = () => {
    const textToAdd = newDietInput.trim();
    if (!textToAdd) return;

    if (!dietaryPreferences.some((d) => d.toLowerCase() === textToAdd.toLowerCase())) {
      onDietaryPreferencesChange([...dietaryPreferences, textToAdd]);
    }
    setNewDietInput('');
  };

  const handleRemoveDiet = (indexToRemove: number) => {
    onDietaryPreferencesChange(dietaryPreferences.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* SECCIÓN 1: MOVILIDAD Y ACCESIBILIDAD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>♿ Movilidad y Accesibilidad</Text>
          <Text style={styles.cardSubtitle}>
            ¿Tienes problemas de movilidad o necesitas que el itinerario sea 100% accesible?
          </Text>
        </View>

        <View style={styles.choiceRow}>
          <Pressable
            onPress={() => onMobilityChange(true)}
            style={[
              styles.choiceButton,
              hasMobilityIssues === true && styles.choiceButtonActivePrimary,
            ]}
          >
            <Text
              style={[
                styles.choiceButtonText,
                hasMobilityIssues === true && styles.choiceButtonTextActive,
              ]}
            >
              ♿ Sí, necesito rutas adaptadas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onMobilityChange(false)}
            style={[
              styles.choiceButton,
              hasMobilityIssues === false && styles.choiceButtonActiveSecondary,
            ]}
          >
            <Text
              style={[
                styles.choiceButtonText,
                hasMobilityIssues === false && styles.choiceButtonTextActive,
              ]}
            >
              🚶‍♂️ No, sin dificultades
            </Text>
          </Pressable>
        </View>

        {hasMobilityIssues === true && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>ℹ️</Text>
            <Text style={styles.infoBannerText}>
              El asistente priorizará monumentos con rampas/ascensores, transporte adaptado y evitará recorridos con escaleras o desniveles pronunciados.
            </Text>
          </View>
        )}
      </View>

      {/* SECCIÓN 2: CONDICIONES DE SALUD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🩺 Salud y Medicación</Text>
          <Text style={styles.cardSubtitle}>
            Indica si tienes alguna condición médica o alerta de salud a tener en cuenta (opcional).
          </Text>
        </View>

        {/* Input para escribir condición a mano */}
        <View style={styles.inputActionRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ej. Asma, Diabetes, Alergia a picaduras..."
            placeholderTextColor={colors.textMuted}
            value={newHealthInput}
            onChangeText={setNewHealthInput}
            onSubmitEditing={() => handleAddHealthCondition()}
            returnKeyType="done"
          />
          <Pressable
            onPress={() => handleAddHealthCondition()}
            disabled={!newHealthInput.trim()}
            style={[
              styles.addButton,
              !newHealthInput.trim() && styles.addButtonDisabled,
            ]}
          >
            <Text style={styles.addButtonText}>+ Añadir</Text>
          </Pressable>
        </View>

        {/* Sugerencias rápidas */}
        <View style={styles.quickSuggestionsContainer}>
          <Text style={styles.quickSuggestionsTitle}>Sugerencias frecuentes:</Text>
          <View style={styles.quickChipsRow}>
            {COMMON_HEALTH_TAGS.map((tag, idx) => {
              const isSelected = healthConditions.some(
                (c) => c.toLowerCase() === tag.toLowerCase()
              );
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleAddHealthCondition(tag)}
                  disabled={isSelected}
                  style={[
                    styles.quickChip,
                    isSelected && styles.quickChipDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      isSelected && styles.quickChipTextDisabled,
                    ]}
                  >
                    + {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Lista de condiciones añadidas */}
        {healthConditions.length > 0 ? (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Condiciones registradas:</Text>
            <View style={styles.chipsWrap}>
              {healthConditions.map((item, index) => (
                <View key={index} style={styles.activeTag}>
                  <Text style={styles.activeTagText}>🩺 {item}</Text>
                  <Pressable
                    onPress={() => handleRemoveHealthCondition(index)}
                    style={styles.removeTagBtn}
                  >
                    <Text style={styles.removeTagBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyNote}>Sin condiciones registradas actualmente.</Text>
        )}
      </View>

      {/* SECCIÓN 3: PREFERENCIAS DIETÉTICAS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🥗 Dieta y Preferencias Alimentarias</Text>
          <Text style={styles.cardSubtitle}>
            Selecciona tus dietas o añade alergias e intolerancias para adaptar los restaurantes recomendados.
          </Text>
        </View>

        {/* Chips de selección rápida */}
        <View style={styles.chipsWrap}>
          {COMMON_DIETS.map((diet) => {
            const isSelected = dietaryPreferences.some(
              (d) => d.toLowerCase() === diet.id.toLowerCase()
            );
            return (
              <Pressable
                key={diet.id}
                onPress={() => handleToggleDiet(diet.id)}
                style={[
                  styles.dietToggleChip,
                  isSelected && styles.dietToggleChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.dietToggleChipText,
                    isSelected && styles.dietToggleChipTextActive,
                  ]}
                >
                  {diet.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Input para añadir otra dieta / alergia a mano */}
        <View style={[styles.inputActionRow, { marginTop: 14 }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Otra dieta o alergia (ej. Sin frutos secos)..."
            placeholderTextColor={colors.textMuted}
            value={newDietInput}
            onChangeText={setNewDietInput}
            onSubmitEditing={handleAddCustomDiet}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddCustomDiet}
            disabled={!newDietInput.trim()}
            style={[
              styles.addButton,
              !newDietInput.trim() && styles.addButtonDisabled,
            ]}
          >
            <Text style={styles.addButtonText}>+ Añadir</Text>
          </Pressable>
        </View>

        {/* Lista completa de dietas y alergias seleccionadas */}
        {dietaryPreferences.length > 0 ? (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Preferencias y alergias activas:</Text>
            <View style={styles.chipsWrap}>
              {dietaryPreferences.map((dietItem, index) => (
                <View key={index} style={styles.activeDietTag}>
                  <Text style={styles.activeDietTagText}>🍽️ {dietItem}</Text>
                  <Pressable
                    onPress={() => handleRemoveDiet(index)}
                    style={styles.removeTagBtn}
                  >
                    <Text style={styles.removeTagBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyNote}>Sin restricciones alimentarias (dieta estándar).</Text>
        )}
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
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  choiceButtonActivePrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceButtonActiveSecondary: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  choiceButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  choiceButtonTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EEF4FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D7FE',
    marginTop: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoBannerIcon: {
    fontSize: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 17,
    fontWeight: '500',
  },
  inputActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  quickSuggestionsContainer: {
    marginTop: 12,
  },
  quickSuggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipDisabled: {
    opacity: 0.35,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  quickChipTextDisabled: {
    color: colors.textMuted,
  },
  tagsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tagsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  activeTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  activeDietTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  activeDietTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  removeTagBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTagBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  dietToggleChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dietToggleChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  dietToggleChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dietToggleChipTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  emptyNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
