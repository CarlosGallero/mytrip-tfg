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
import { fetchDestinationTravelInfo } from '../../api/destinations';
import { DestinationTravelInfo } from '../../types';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

type CreateTripWizardScreenProps = {
  onCancel?: () => void;
  onNext?: (formData: { destination: string; countryInfo?: DestinationTravelInfo | null }) => void;
};

export default function CreateTripWizardScreen({
  onCancel,
  onNext,
}: CreateTripWizardScreenProps) {
  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [countryInfo, setCountryInfo] = useState<DestinationTravelInfo | null>(null);
  const [isLoadingCountryInfo, setIsLoadingCountryInfo] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [lastFetchedDestination, setLastFetchedDestination] = useState('');

  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);
  const canContinue = destination.trim().length > 0;

  const loadTravelData = async (targetDestination: string) => {
    setIsLoadingCountryInfo(true);
    setLoadingError(null);
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

    if (currentStep < totalSteps) {
      setCurrentStep((step) => step + 1);
      onNext?.({ destination: cleanDest, countryInfo });
      return;
    }

    onNext?.({ destination: cleanDest, countryInfo });
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
              <Text style={styles.highlightText}>"{destination.trim()}"</Text> con Gemini IA
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
              }
            }}
            onSelectCity={(city) => {
              setDestination(city);
              if (city !== lastFetchedDestination) {
                setCountryInfo(null);
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
          <Text style={styles.subtitle}>
            Requisitos clave y datos de seguridad verificados para tu viaje.
          </Text>

          {countryInfo ? (
            <CountryTravelInfoCard info={countryInfo} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay información disponible para este destino.</Text>
            </View>
          )}
        </View>
      );
    }

    // Pasos siguientes
    return (
      <View style={styles.stepContent}>
        <Text style={styles.title}>Paso {currentStep}</Text>
        <Text style={styles.subtitle}>Configuración del viaje hacia {destination}.</Text>
      </View>
    );
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

            <Pressable
              onPress={handleContinue}
              disabled={!canContinue || isLoadingCountryInfo}
              style={[
                styles.primaryButton,
                currentStep === 2 && styles.primaryButtonFlex,
                (!canContinue || isLoadingCountryInfo) && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {currentStep === 1 ? 'Consultar y Continuar' : 'Continuar'}
              </Text>
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
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
    fontWeight: '700',
  },
  loadingBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  loadingBadge: {
    backgroundColor: colors.surfaceSoft,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 16,
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
    shadowOpacity: 0.2,
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
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
