import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CityAutocomplete from '../../components/CityAutocomplete';
import CountryTravelInfoCard from '../../components/trip/CountryTravelInfoCard';
import TripDateBudgetStep from '../../components/trip/TripDateBudgetStep';
import { fetchDestinationTravelInfo } from '../../api/destinations';
import { DestinationTravelInfo, TripWizardData } from '../../types';
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
  const totalSteps = 4;
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
    return true;
  }, [currentStep, destination, countryInfo, hasPassport, startDate, endDate, budget]);

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

    // Al finalizar el último paso (Paso 4), emitir datos consolidados
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

    // Paso 4: Resumen final
    return (
      <View style={styles.stepContent}>
        <Text style={styles.title}>Resumen del Viaje</Text>
        <Text style={styles.subtitle}>Revisa los detalles antes de crear tu itinerario para {destination}.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Destino:</Text>
            <Text style={styles.summaryValue}>{countryInfo?.destination_city || destination}, {countryInfo?.country_name}</Text>
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
            <Text style={styles.summaryLabel}>Presupuesto (Comidas y ocio):</Text>
            <Text style={styles.summaryValue}>{budget} {countryInfo?.estimated_daily_cost?.currency || 'EUR'}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getPrimaryButtonText = () => {
    if (currentStep === 1) {
      return 'Consultar y Continuar';
    }
    if (currentStep === 2) {
      if (countryInfo?.passport_required && hasPassport === null) {
        return 'Indica si tienes pasaporte';
      }
      return 'Continuar';
    }
    if (currentStep === 3) {
      if (!startDate || !endDate) {
        return 'Selecciona las fechas';
      }
      if (!budget || budget <= 0) {
        return 'Indica tu presupuesto';
      }
      return 'Continuar';
    }
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
              <Pressable
                onPress={() => setCurrentStep(1)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cambiar ciudad</Text>
              </Pressable>
            )}

            {currentStep === 3 && (
              <Pressable
                onPress={() => setCurrentStep(2)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Ver requisitos</Text>
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
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
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
