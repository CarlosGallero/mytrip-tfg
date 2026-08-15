import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CityAutocomplete from '../../components/CityAutocomplete';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

type CreateTripWizardScreenProps = {
  onCancel?: () => void;
  onNext?: (formData: { destination: string }) => void;
};

export default function CreateTripWizardScreen({
  onCancel,
  onNext,
}: CreateTripWizardScreenProps) {
  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(1);
  const [destination, setDestination] = useState('');

  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);
  const canContinue = destination.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((step) => step + 1);
      onNext?.({ destination: destination.trim() });
      return;
    }

    onNext?.({ destination: destination.trim() });
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>¿A qué ciudad quieres viajar?</Text>
          <Text style={styles.subtitle}>
            Elige tu ciudad destino para empezar a crear tu próximo viaje.
          </Text>

          <CityAutocomplete
            value={destination}
            onChangeText={setDestination}
            onSelectCity={(city) => setDestination(city)}
            placeholder="Escribe la ciudad de destino..."
          />
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.title}>Paso {currentStep}</Text>
        <Text style={styles.subtitle}>Placeholder del paso {currentStep}.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>

          <Text style={styles.stepText}>Paso {currentStep} de {totalSteps}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {renderStepContent()}

        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>Siguiente</Text>
        </Pressable>
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
    marginBottom: theme.spacing.xxl,
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
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
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
