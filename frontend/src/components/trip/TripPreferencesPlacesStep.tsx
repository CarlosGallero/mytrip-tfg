import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { validatePlaceLocation, ValidatePlaceResult } from '../../api/destinations';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { DestinationTravelInfo } from '../../types';

interface TripPreferencesPlacesStepProps {
  countryInfo: DestinationTravelInfo | null;
  selectedInterests: string[];
  customInterests: string[];
  specificPlaces: string[];
  onInterestsChange: (interests: string[]) => void;
  onCustomInterestsChange: (custom: string[]) => void;
  onSpecificPlacesChange: (places: string[]) => void;
}

const PREDEFINED_INTERESTS = [
  { id: 'Indiferente', label: '✨ Indiferente' },
  { id: 'Historia y patrimonio', label: '🏛️ Historia y patrimonio' },
  { id: 'Música y arte', label: '🎨 Música y arte' },
  { id: 'Naturaleza y senderismo', label: '🌲 Naturaleza y senderismo' },
  { id: 'Playas y costa', label: '🏖️ Playas y costa' },
  { id: 'Vida nocturna y fiesta', label: '🍸 Vida nocturna y fiesta' },
  { id: 'Cultura y tradiciones', label: '🎭 Cultura y tradiciones' },
  { id: 'Compras y shopping', label: '🛍️ Compras / Shopping' },
  { id: 'Gastronomía y enoturismo', label: '🍷 Gastronomía' },
  { id: 'Deportes y aventura', label: '⚽ Deportes y aventura' },
  { id: 'Arquitectura y monumentos', label: '🏰 Arquitectura' },
];

export default function TripPreferencesPlacesStep({
  countryInfo,
  selectedInterests,
  customInterests,
  specificPlaces,
  onInterestsChange,
  onCustomInterestsChange,
  onSpecificPlacesChange,
}: TripPreferencesPlacesStepProps) {
  const [newCustomInterestInput, setNewCustomInterestInput] = useState('');
  const [newPlaceInput, setNewPlaceInput] = useState('');
  const [isValidatingPlace, setIsValidatingPlace] = useState(false);
  const [placeValidationFeedback, setPlaceValidationFeedback] = useState<ValidatePlaceResult | null>(null);

  const cityName = countryInfo?.destination_city || 'la ciudad';
  const countryName = countryInfo?.country_name || '';

  const isIndiferenteSelected = selectedInterests.includes('Indiferente');

  // Manejo de Intereses Predefinidos
  const handleToggleInterest = (interestId: string) => {
    if (interestId === 'Indiferente') {
      if (isIndiferenteSelected) {
        onInterestsChange([]);
      } else {
        // Al seleccionar Indiferente, no se permiten otras opciones y se limpia cualquier otra
        onInterestsChange(['Indiferente']);
        onCustomInterestsChange([]);
      }
      return;
    }

    // Si Indiferente está seleccionado, no se permite añadir otros intereses hasta desmarcarlo
    if (isIndiferenteSelected) {
      return;
    }

    const exists = selectedInterests.includes(interestId);
    if (exists) {
      onInterestsChange(selectedInterests.filter((id) => id !== interestId));
    } else {
      onInterestsChange([...selectedInterests, interestId]);
    }
  };

  // Manejo de Intereses Personalizados (máximo 50 caracteres)
  const handleAddCustomInterest = () => {
    if (isIndiferenteSelected) return;

    const textToAdd = newCustomInterestInput.trim().slice(0, 50);
    if (!textToAdd) return;

    if (!customInterests.some((ci) => ci.toLowerCase() === textToAdd.toLowerCase())) {
      onCustomInterestsChange([...customInterests, textToAdd]);
    }
    setNewCustomInterestInput('');
  };

  const handleRemoveCustomInterest = (indexToRemove: number) => {
    onCustomInterestsChange(customInterests.filter((_, idx) => idx !== indexToRemove));
  };

  // Manejo y Validación de Lugares Específicos con Gemini
  const handleValidateAndAddPlace = async () => {
    const placeToValidate = newPlaceInput.trim();
    if (!placeToValidate || isValidatingPlace) return;

    setIsValidatingPlace(true);
    setPlaceValidationFeedback(null);

    try {
      const result = await validatePlaceLocation(placeToValidate, cityName, countryName);
      setPlaceValidationFeedback(result);

      if (result.is_valid) {
        const placeNameToAdd = result.place_name || placeToValidate;
        if (!specificPlaces.some((p) => p.toLowerCase() === placeNameToAdd.toLowerCase())) {
          onSpecificPlacesChange([...specificPlaces, placeNameToAdd]);
        }
        setNewPlaceInput('');
      }
    } catch (err: any) {
      console.error('Error al validar lugar:', err);
      setPlaceValidationFeedback({
        is_valid: false,
        place_name: placeToValidate,
        message: 'No pudimos verificar la ubicación en este momento. Inténtalo de nuevo.',
      });
    } finally {
      setIsValidatingPlace(false);
    }
  };

  const handleRemovePlace = (indexToRemove: number) => {
    onSpecificPlacesChange(specificPlaces.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* SECCIÓN 1: CATEGORÍAS DE INTERÉS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🎯 ¿Qué te gusta hacer en tus viajes?</Text>
          <Text style={styles.cardSubtitle}>
            Selecciona las temáticas y actividades que más te interesan para tu estancia en {cityName}.
          </Text>
        </View>

        {/* Cuadrícula de chips de categorías */}
        <View style={styles.chipsWrap}>
          {PREDEFINED_INTERESTS.map((item) => {
            const isSelected = selectedInterests.includes(item.id);
            const isDisabled = isIndiferenteSelected && item.id !== 'Indiferente';

            return (
              <Pressable
                key={item.id}
                onPress={() => handleToggleInterest(item.id)}
                disabled={isDisabled}
                style={[
                  styles.interestChip,
                  isSelected && styles.interestChipActive,
                  isDisabled && styles.interestChipDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.interestChipText,
                    isSelected && styles.interestChipTextActive,
                    isDisabled && styles.interestChipTextDisabled,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Input de "Otros intereses" con límite de 50 caracteres */}
        <View style={styles.customInterestSection}>
          <Text style={styles.sectionInnerLabel}>Otro interés específico (máx. 50 caracteres):</Text>
          <View style={styles.inputActionRow}>
            <TextInput
              style={[
                styles.textInput,
                isIndiferenteSelected && styles.textInputDisabled,
              ]}
              placeholder={
                isIndiferenteSelected
                  ? "Opción 'Indiferente' seleccionada"
                  : 'Ej. Fotografía urbana, Mercados de antigüedades...'
              }
              placeholderTextColor={colors.textMuted}
              value={newCustomInterestInput}
              onChangeText={setNewCustomInterestInput}
              onSubmitEditing={handleAddCustomInterest}
              returnKeyType="done"
              maxLength={50}
              editable={!isIndiferenteSelected}
            />
            <Pressable
              onPress={handleAddCustomInterest}
              disabled={!newCustomInterestInput.trim() || isIndiferenteSelected}
              style={[
                styles.addButton,
                (!newCustomInterestInput.trim() || isIndiferenteSelected) && styles.addButtonDisabled,
              ]}
            >
              <Text style={styles.addButtonText}>+ Añadir</Text>
            </Pressable>
          </View>

          <View style={styles.counterRow}>
            <Text style={styles.charLimitNotice}>
              {isIndiferenteSelected
                ? "Desmarca 'Indiferente' para añadir temáticas específicas"
                : 'Límite 50 caracteres'}
            </Text>
            <Text
              style={[
                styles.charCounterText,
                newCustomInterestInput.length >= 50 && styles.charCounterLimit,
              ]}
            >
              {newCustomInterestInput.length}/50
            </Text>
          </View>
        </View>

        {/* Lista de intereses seleccionados y añadidos (como en salud y alimentación) */}
        {selectedInterests.length > 0 || customInterests.length > 0 ? (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Intereses y temáticas seleccionadas:</Text>
            <View style={styles.chipsWrap}>
              {selectedInterests.map((interest, index) => (
                <View
                  key={`sel-${index}`}
                  style={[
                    styles.activeTag,
                    interest === 'Indiferente' && styles.activeTagIndiferente,
                  ]}
                >
                  <Text
                    style={[
                      styles.activeTagText,
                      interest === 'Indiferente' && styles.activeTagIndiferenteText,
                    ]}
                  >
                    {interest === 'Indiferente' ? '✨ Indiferente (variado)' : `🎯 ${interest}`}
                  </Text>
                  <Pressable
                    onPress={() => handleToggleInterest(interest)}
                    style={styles.removeTagBtn}
                  >
                    <Text style={styles.removeTagBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}

              {customInterests.map((customItem, index) => (
                <View key={`cust-${index}`} style={styles.activeCustomTag}>
                  <Text style={styles.activeCustomTagText}>✨ {customItem}</Text>
                  <Pressable
                    onPress={() => handleRemoveCustomInterest(index)}
                    style={styles.removeTagBtn}
                  >
                    <Text style={styles.removeTagBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyNote}>Sin intereses específicos seleccionados.</Text>
        )}
      </View>

      {/* SECCIÓN 2: LUGARES O MONUMENTOS ESPECÍFICOS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📍 Lugares específicos que quieras visitar</Text>
          <Text style={styles.cardSubtitle}>
            ¿Hay algún monumento, museo o rincón concreto que no te quieras perder en {cityName}?
            El asistente verificará con IA si pertenece a la ciudad antes de añadirlo.
          </Text>
        </View>

        <View style={styles.inputActionRow}>
          <TextInput
            style={styles.textInput}
            placeholder={`Ej. Torre Eiffel, Coliseo, Sagrada Familia...`}
            placeholderTextColor={colors.textMuted}
            value={newPlaceInput}
            onChangeText={(text) => {
              setNewPlaceInput(text);
              if (placeValidationFeedback) setPlaceValidationFeedback(null);
            }}
            onSubmitEditing={handleValidateAndAddPlace}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleValidateAndAddPlace}
            disabled={!newPlaceInput.trim() || isValidatingPlace}
            style={[
              styles.addPlaceButton,
              (!newPlaceInput.trim() || isValidatingPlace) && styles.addButtonDisabled,
            ]}
          >
            {isValidatingPlace ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.addButtonText}>Verificar y Añadir</Text>
            )}
          </Pressable>
        </View>

        {/* Feedback de validación de Gemini */}
        {placeValidationFeedback && (
          <View
            style={[
              styles.feedbackBanner,
              placeValidationFeedback.is_valid
                ? styles.feedbackBannerSuccess
                : styles.feedbackBannerWarning,
            ]}
          >
            <Text style={styles.feedbackBannerIcon}>
              {placeValidationFeedback.is_valid ? '✓' : '⚠️'}
            </Text>
            <View style={styles.feedbackBannerContent}>
              <Text
                style={[
                  styles.feedbackBannerTitle,
                  placeValidationFeedback.is_valid
                    ? styles.feedbackBannerTitleSuccess
                    : styles.feedbackBannerTitleWarning,
                ]}
              >
                {placeValidationFeedback.is_valid
                  ? '¡Lugar verificado con éxito!'
                  : 'Lugar no coincidente'}
              </Text>
              <Text
                style={[
                  styles.feedbackBannerMessage,
                  placeValidationFeedback.is_valid
                    ? styles.feedbackBannerMessageSuccess
                    : styles.feedbackBannerMessageWarning,
                ]}
              >
                {placeValidationFeedback.message}
              </Text>
            </View>
          </View>
        )}

        {/* Lista de lugares específicos agregados */}
        {specificPlaces.length > 0 ? (
          <View style={styles.placesListContainer}>
            <Text style={styles.placesListTitle}>Lugares fijados para el itinerario:</Text>
            <View style={styles.placesChipsWrap}>
              {specificPlaces.map((place, index) => (
                <View key={index} style={styles.placeBadge}>
                  <Text style={styles.placeBadgeText}>📌 {place}</Text>
                  <Pressable
                    onPress={() => handleRemovePlace(index)}
                    style={styles.removeTagBtn}
                  >
                    <Text style={styles.removeTagBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyNote}>No has fijado monumentos específicos (el asistente elegirá los mejores).</Text>
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  interestChipActive: {
    backgroundColor: '#EEF4FF',
    borderColor: colors.primary,
  },
  interestChipDisabled: {
    opacity: 0.35,
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  interestChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  interestChipTextDisabled: {
    color: colors.textMuted,
  },
  customInterestSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionInnerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
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
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.6,
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
  addPlaceButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
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
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  charLimitNotice: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  charCounterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  charCounterLimit: {
    color: '#D97706',
    fontWeight: '800',
  },
  tagsContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tagsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#C7D7FE',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  activeTagIndiferente: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  activeTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  activeTagIndiferenteText: {
    color: '#7E22CE',
    fontWeight: '800',
  },
  activeCustomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#C7D7FE',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  activeCustomTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  feedbackBanner: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1.5,
  },
  feedbackBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  feedbackBannerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feedbackBannerIcon: {
    fontSize: 16,
  },
  feedbackBannerContent: {
    flex: 1,
  },
  feedbackBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  feedbackBannerTitleSuccess: {
    color: '#047857',
  },
  feedbackBannerTitleWarning: {
    color: '#B45309',
  },
  feedbackBannerMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
  feedbackBannerMessageSuccess: {
    color: '#065F46',
  },
  feedbackBannerMessageWarning: {
    color: '#92400E',
  },
  placesListContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  placesListTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  placesChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  placeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
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
  emptyNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
