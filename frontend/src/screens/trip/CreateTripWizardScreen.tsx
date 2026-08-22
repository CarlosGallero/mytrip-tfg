import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CityAutocomplete from '../../components/CityAutocomplete';
import CountryTravelInfoCard from '../../components/trip/CountryTravelInfoCard';
import TripDateBudgetStep from '../../components/trip/TripDateBudgetStep';
import TripAccessibilityHealthStep from '../../components/trip/TripAccessibilityHealthStep';
import TripPreferencesPlacesStep from '../../components/trip/TripPreferencesPlacesStep';
import TripPaceStep from '../../components/trip/TripPaceStep';
import { fetchDestinationTravelInfo } from '../../api/destinations';
import { DestinationTravelInfo, TripWizardData, TripPaceLevel, DayPaceConfig } from '../../types';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

type CreateTripWizardScreenProps = {
  onCancel?: () => void;
  onComplete?: (formData: TripWizardData) => void;
  onNext?: (formData: TripWizardData) => void;
};

export default function CreateTripWizardScreen({
  onCancel,
  onComplete,
  onNext,
}: CreateTripWizardScreenProps) {
  const totalSteps = 7;
  const [currentStep, setCurrentStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [countryInfo, setCountryInfo] = useState<DestinationTravelInfo | null>(null);
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);

  // Paso 3: Fechas y Presupuesto
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(0);
  const [totalNights, setTotalNights] = useState(0);
  const [budget, setBudget] = useState<number | null>(null);

  // Paso 4: Accesibilidad, Salud y Preferencias Dietéticas
  const [hasMobilityIssues, setHasMobilityIssues] = useState<boolean | null>(null);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);

  // Paso 5: Preferencias Temáticas y Lugares Específicos
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [specificPlaces, setSpecificPlaces] = useState<string[]>([]);

  // Paso 6: Ritmo de Viaje
  const [paceType, setPaceType] = useState<'global' | 'custom_days'>('global');
  const [globalPace, setGlobalPace] = useState<TripPaceLevel>('moderate');
  const [dailyPace, setDailyPace] = useState<DayPaceConfig[]>([]);

  const [isLoadingCountryInfo, setIsLoadingCountryInfo] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [lastFetchedDestination, setLastFetchedDestination] = useState('');

  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);

  // Validación para poder avanzar de paso
  const canContinue = useMemo(() => {
    if (currentStep === 1) {
      return destination.trim().length > 0;
    }
    if (currentStep === 2) {
      // Si el país exige pasaporte, es obligatorio indicar si se tiene o no
      if (countryInfo?.passport_required) {
        return hasPassport !== null;
      }
      return true;
    }
    if (currentStep === 3) {
      // En el paso 3 se requiere tener fecha de inicio, fin y presupuesto > 0
      return (
        startDate !== null &&
        endDate !== null &&
        budget !== null &&
        budget > 0
      );
    }
    if (currentStep === 4) {
      // En el paso 4 se debe indicar si tiene o no problemas de movilidad
      return hasMobilityIssues !== null;
    }
    // Pasos 5, 6 y 7 siempre son válidos para avanzar
    return true;
  }, [
    currentStep,
    destination,
    countryInfo,
    hasPassport,
    startDate,
    endDate,
    budget,
    hasMobilityIssues,
  ]);

  const loadTravelData = async (targetDestination: string) => {
    setIsLoadingCountryInfo(true);
    setLoadingError(null);
    setHasPassport(null);
    try {
      const data = await fetchDestinationTravelInfo(targetDestination);
      setCountryInfo(data);
      setLastFetchedDestination(targetDestination);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Error fetching travel info:', err);
      setLoadingError(
        err?.message || 'No se pudo obtener la información del país. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsLoadingCountryInfo(false);
    }
  };

  const handleDatesChange = (
    start: string | null,
    end: string | null,
    days: number,
    nights: number
  ) => {
    setStartDate(start);
    setEndDate(end);
    setTotalDays(days);
    setTotalNights(nights);
  };

  const handleContinue = async () => {
    if (!canContinue || isLoadingCountryInfo) {
      return;
    }

    const cleanDest = destination.trim();

    // Si estamos en el paso 1, cargamos los datos del país destino desde Gemini
    if (currentStep === 1) {
      if (countryInfo && lastFetchedDestination === cleanDest) {
        setCurrentStep(2);
      } else {
        await loadTravelData(cleanDest);
      }
      return;
    }

    // Avanzar internamente en los pasos del wizard
    if (currentStep < totalSteps) {
      setCurrentStep((step) => step + 1);
      return;
    }

    // Al finalizar el último paso (Paso 7), emitir datos consolidados
    const finalData: TripWizardData = {
      destination: cleanDest,
      countryInfo,
      hasPassport,
      startDate,
      endDate,
      totalDays,
      totalNights,
      budget,
      currency: countryInfo?.estimated_daily_cost?.currency || 'EUR',
      hasMobilityIssues,
      healthConditions,
      dietaryPreferences,
      interests: selectedInterests,
      customInterests,
      specificPlaces,
      paceType,
      globalPace,
      dailyPace,
    };

    if (onComplete) {
      onComplete(finalData);
    } else if (onNext) {
      onNext(finalData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
      setLoadingError(null);
    } else {
      onCancel?.();
    }
  };

  const renderStepContent = () => {
    // Pantalla de carga mientras se obtienen los datos con la API de Gemini
    if (isLoadingCountryInfo) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <View style={styles.spinnerWrapper}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.loadingTitle}>Obteniendo datos del país...</Text>
            <Text style={styles.loadingSubtitle}>
              Consultando requisitos de viaje, visados, vacunas y seguridad para{' '}
              <Text style={styles.highlightText}>"{destination.trim()}"</Text>
            </Text>
            <View style={styles.loadingBadgeContainer}>
              <Text style={styles.loadingBadge}>✨ Moneda y Bandera</Text>
              <Text style={styles.loadingBadge}>🛂 Pasaporte y Visado</Text>
              <Text style={styles.loadingBadge}>💉 Vacunación</Text>
              <Text style={styles.loadingBadge}>🛡️ Alertas de Seguridad</Text>
            </View>
          </View>
        </View>
      );
    }

    // Pantalla de error si falló la carga
    if (loadingError && currentStep === 1) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>¿A qué ciudad quieres viajar?</Text>
          <Text style={styles.subtitle}>
            Elige tu ciudad destino para empezar a crear tu próximo viaje.
          </Text>

          <CityAutocomplete
            value={destination}
            onChangeText={(text) => {
              setDestination(text);
              setLoadingError(null);
            }}
            onSelectCity={(city) => {
              setDestination(city);
              setLoadingError(null);
            }}
            placeholder="Escribe la ciudad de destino..."
          />

          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>⚠️ No pudimos conectar con el asistente</Text>
            <Text style={styles.errorMessage}>{loadingError}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => loadTravelData(destination.trim())}
            >
              <Text style={styles.retryButtonText}>Reintentar consulta</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Paso 1: Selección del destino
    if (currentStep === 1) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>¿A qué ciudad quieres viajar?</Text>
          <Text style={styles.subtitle}>
            Elige tu ciudad destino para empezar a crear tu próximo viaje.
          </Text>

          <CityAutocomplete
            value={destination}
            onChangeText={(text) => {
              setDestination(text);
              if (text !== lastFetchedDestination) {
                setCountryInfo(null);
                setHasPassport(null);
              }
            }}
            onSelectCity={(city) => {
              setDestination(city);
              if (city !== lastFetchedDestination) {
                setCountryInfo(null);
                setHasPassport(null);
              }
            }}
            placeholder="Escribe la ciudad de destino..."
          />
        </View>
      );
    }

    // Paso 2: Información del país y requisitos de viaje devueltos por Gemini
    if (currentStep === 2) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Información del Destino</Text>

          {countryInfo ? (
            <CountryTravelInfoCard
              info={countryInfo}
              hasPassport={hasPassport}
              onPassportChange={setHasPassport}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay información disponible para este destino.</Text>
            </View>
          )}
        </View>
      );
    }

    // Paso 3: Fechas y Presupuesto
    if (currentStep === 3) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Fechas y Presupuesto</Text>
          <Text style={styles.subtitle}>
            Indica los días de estancia en {countryInfo?.destination_city || destination} y define tu presupuesto de ocio.
          </Text>

          <TripDateBudgetStep
            countryInfo={countryInfo}
            startDate={startDate}
            endDate={endDate}
            budget={budget}
            onDatesChange={handleDatesChange}
            onBudgetChange={setBudget}
          />
        </View>
      );
    }

    // Paso 4: Accesibilidad, Salud y Dieta
    if (currentStep === 4) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Accesibilidad y Salud</Text>
          <Text style={styles.subtitle}>
            Personaliza el viaje según tus necesidades físicas, médicas y alimentarias.
          </Text>

          <TripAccessibilityHealthStep
            hasMobilityIssues={hasMobilityIssues}
            healthConditions={healthConditions}
            dietaryPreferences={dietaryPreferences}
            onMobilityChange={setHasMobilityIssues}
            onHealthConditionsChange={setHealthConditions}
            onDietaryPreferencesChange={setDietaryPreferences}
          />
        </View>
      );
    }

    // Paso 5: Preferencias Temáticas y Lugares Específicos
    if (currentStep === 5) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Intereses y Monumentos</Text>
          <Text style={styles.subtitle}>
            Elige las temáticas que más te apasionan y fija monumentos imprescindibles para tu visita a {countryInfo?.destination_city || destination}.
          </Text>

          <TripPreferencesPlacesStep
            countryInfo={countryInfo}
            selectedInterests={selectedInterests}
            customInterests={customInterests}
            specificPlaces={specificPlaces}
            onInterestsChange={setSelectedInterests}
            onCustomInterestsChange={setCustomInterests}
            onSpecificPlacesChange={setSpecificPlaces}
          />
        </View>
      );
    }

    // Paso 6: Ritmo de Viaje
    if (currentStep === 6) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Ritmo e Intensidad</Text>

          <TripPaceStep
            startDate={startDate}
            endDate={endDate}
            totalDays={totalDays}
            paceType={paceType}
            globalPace={globalPace}
            dailyPace={dailyPace}
            onPaceTypeChange={setPaceType}
            onGlobalPaceChange={setGlobalPace}
            onDailyPaceChange={setDailyPace}
          />
        </View>
      );
    }

    // Paso 7: Resumen Final Consolidado
    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Resumen del Viaje</Text>
        <Text style={styles.subtitle}>
          Revisa todos los detalles configurados antes de generar tu itinerario completo para {countryInfo?.destination_city || destination}.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Destino:</Text>
            <Text style={styles.summaryValue}>
              {countryInfo?.destination_city || destination}, {countryInfo?.country_name}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fechas:</Text>
            <Text style={styles.summaryValue}>{startDate} al {endDate}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duración:</Text>
            <Text style={styles.summaryValue}>{totalDays} días ({totalNights} noches)</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Presupuesto comidas y ocio:</Text>
            <Text style={styles.summaryValue}>
              {budget} {countryInfo?.estimated_daily_cost?.currency || 'EUR'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Accesibilidad:</Text>
            <Text style={styles.summaryValue}>
              {hasMobilityIssues ? '♿ Rutas 100% Adaptadas' : '🚶‍♂️ Estándar'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ritmo del viaje:</Text>
            <Text style={styles.summaryValue}>
              {paceType === 'global'
                ? globalPace === 'relaxed'
                  ? '🌴 Relajado'
                  : globalPace === 'moderate'
                  ? '🚶‍♂️ Medio'
                  : '⚡ A full'
                : '📅 Personalizado por días'}
            </Text>
          </View>

          {/* Preferencias temáticas */}
          <View style={styles.summarySectionBlock}>
            <Text style={styles.summarySectionTitle}>Temáticas e intereses:</Text>
            {selectedInterests.length > 0 || customInterests.length > 0 ? (
              <View style={styles.summaryBadgesWrap}>
                {selectedInterests.map((interest, idx) => (
                  <View key={`sel-${idx}`} style={styles.summaryInterestBadge}>
                    <Text style={styles.summaryInterestBadgeText}>{interest}</Text>
                  </View>
                ))}
                {customInterests.map((cInterest, idx) => (
                  <View key={`cust-${idx}`} style={styles.summaryInterestBadge}>
                    <Text style={styles.summaryInterestBadgeText}>✨ {cInterest}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.summaryMutedText}>Intereses generales variados</Text>
            )}
          </View>

          {/* Lugares específicos */}
          {specificPlaces.length > 0 && (
            <View style={styles.summarySectionBlock}>
              <Text style={styles.summarySectionTitle}>Monumentos y lugares fijados:</Text>
              <View style={styles.summaryBadgesWrap}>
                {specificPlaces.map((place, idx) => (
                  <View key={idx} style={styles.summaryPlaceBadge}>
                    <Text style={styles.summaryPlaceBadgeText}>📌 {place}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Condiciones de salud */}
          <View style={styles.summarySectionBlock}>
            <Text style={styles.summarySectionTitle}>Condiciones de salud:</Text>
            {healthConditions.length > 0 ? (
              <View style={styles.summaryBadgesWrap}>
                {healthConditions.map((hc, idx) => (
                  <View key={idx} style={styles.summaryHealthBadge}>
                    <Text style={styles.summaryHealthBadgeText}>🩺 {hc}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.summaryMutedText}>Sin condiciones médicas registradas</Text>
            )}
          </View>

          {/* Preferencias dietéticas */}
          <View style={styles.summarySectionBlock}>
            <Text style={styles.summarySectionTitle}>Dietas y alergias:</Text>
            {dietaryPreferences.length > 0 ? (
              <View style={styles.summaryBadgesWrap}>
                {dietaryPreferences.map((dp, idx) => (
                  <View key={idx} style={styles.summaryDietBadge}>
                    <Text style={styles.summaryDietBadgeText}>🍽️ {dp}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.summaryMutedText}>Dieta estándar (sin restricciones)</Text>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const getPrimaryButtonText = () => {
    if (currentStep === 1) return 'Consultar y Continuar';
    if (currentStep === 2) {
      if (countryInfo?.passport_required && hasPassport === null) {
        return 'Indica si tienes pasaporte';
      }
      return 'Continuar';
    }
    if (currentStep === 3) {
      if (!startDate || !endDate) return 'Selecciona las fechas';
      if (!budget || budget <= 0) return 'Indica tu presupuesto';
      return 'Continuar';
    }
    if (currentStep === 4) {
      if (hasMobilityIssues === null) return 'Indica tu movilidad';
      return 'Continuar a Intereses';
    }
    if (currentStep === 5) return 'Continuar a Ritmo';
    if (currentStep === 6) return 'Ver Resumen';
    return 'Crear Viaje';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.cancelButton} disabled={isLoadingCountryInfo}>
            <Text style={styles.cancelText}>
              {currentStep > 1 ? '← Atrás' : 'Cancelar'}
            </Text>
          </Pressable>

          <Text style={styles.stepText}>Paso {currentStep} de {totalSteps}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {renderStepContent()}

        {!isLoadingCountryInfo && (
          <View style={styles.buttonRow}>
            {currentStep === 2 && (
              <Pressable onPress={() => setCurrentStep(1)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cambiar ciudad</Text>
              </Pressable>
            )}

            {currentStep === 3 && (
              <Pressable onPress={() => setCurrentStep(2)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Ver requisitos</Text>
              </Pressable>
            )}

            {currentStep === 4 && (
              <Pressable onPress={() => setCurrentStep(3)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Modificar fechas</Text>
              </Pressable>
            )}

            {currentStep === 5 && (
              <Pressable onPress={() => setCurrentStep(4)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Editar salud</Text>
              </Pressable>
            )}

            {currentStep === 6 && (
              <Pressable onPress={() => setCurrentStep(5)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Editar intereses</Text>
              </Pressable>
            )}

            {currentStep === 7 && (
              <Pressable onPress={() => setCurrentStep(6)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Modificar ritmo</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleContinue}
              disabled={!canContinue || isLoadingCountryInfo}
              style={[
                styles.primaryButton,
                currentStep > 1 && styles.primaryButtonFlex,
                (!canContinue || isLoadingCountryInfo) && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>{getPrimaryButtonText()}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  stepText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
  },
  spinnerWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#C7D7FE',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  highlightText: {
    color: colors.primary,
    fontWeight: '800',
  },
  loadingBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  loadingBadge: {
    backgroundColor: '#F1F5F9',
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
    gap: 14,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
  },
  summarySectionBlock: {
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summarySectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  summaryBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryInterestBadge: {
    backgroundColor: '#EEF4FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C7D7FE',
  },
  summaryInterestBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryPlaceBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  summaryPlaceBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryHealthBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  summaryHealthBadgeText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDietBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  summaryDietBadgeText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryMutedText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.md,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonFlex: {
    flex: 1,
    width: 'auto',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
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
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
