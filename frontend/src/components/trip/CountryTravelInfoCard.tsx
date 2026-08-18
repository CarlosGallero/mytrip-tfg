import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DestinationTravelInfo } from '../../types';
import { getCountryFlagUrl } from '../../utils/flags';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

interface CountryTravelInfoCardProps {
  info: DestinationTravelInfo;
  hasPassport?: boolean | null;
  onPassportChange?: (hasPassport: boolean) => void;
}

export default function CountryTravelInfoCard({
  info,
  hasPassport: externalHasPassport,
  onPassportChange,
}: CountryTravelInfoCardProps) {
  const [internalHasPassport, setInternalHasPassport] = useState<boolean | null>(null);
  const [showPassportInfo, setShowPassportInfo] = useState(false);
  const [showVaccineInfo, setShowVaccineInfo] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  const hasPassport =
    externalHasPassport !== undefined ? externalHasPassport : internalHasPassport;

  const handleSelectPassport = (val: boolean) => {
    setInternalHasPassport(val);
    onPassportChange?.(val);
  };

  const destinationFlagUrl = getCountryFlagUrl(
    info.country_name,
    info.flag_emoji,
    info.flag_image_url
  );

  const originFlagUrl = getCountryFlagUrl(info.origin_country);

  const handleOpenPassportLink = () => {
    const targetUrl =
      info.passport_application_url ||
      `https://www.google.com/search?q=${encodeURIComponent(
        `solicitar pasaporte cita previa ${info.origin_country}`
      )}`;

    Linking.openURL(targetUrl).catch((err) =>
      console.error('No se pudo abrir el enlace:', err)
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Destination Banner - Resalta sobre toda la pantalla */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTopRow}>
          <View style={styles.flagBackdrop}>
            <Image
              source={{ uri: destinationFlagUrl }}
              style={styles.heroFlagImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.heroBadgeGroup}>
            <View style={styles.heroAiPill}>
              <Text style={styles.heroAiPillText}>✨ Verificado con IA</Text>
            </View>
            <View style={styles.heroCountryPill}>
              <Text style={styles.heroCountryPillText}>{info.country_name}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.heroDestinationCity}>{info.destination_city}</Text>

        <View style={styles.heroContextRow}>
          <Text style={styles.heroContextLabel}>Viajando desde</Text>
          <View style={styles.heroOriginBadge}>
            <Image
              source={{ uri: originFlagUrl }}
              style={styles.originFlagSmall}
              resizeMode="cover"
            />
            <Text style={styles.heroOriginText}>{info.origin_country || 'Origen'}</Text>
          </View>
        </View>
      </View>

      {/* Grid of Info Cards */}
      <View style={styles.cardsGrid}>
        {/* 1. Moneda */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#EBF3FF' }]}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardLabel}>Moneda Oficial</Text>
              <Text style={styles.cardMainValue}>{info.currency}</Text>
            </View>
          </View>
        </View>

        {/* 2. Pasaporte y Documentación */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: info.passport_required ? '#FFF4E5' : '#E6FFFB' },
              ]}
            >
              <Text style={styles.iconText}>🛂</Text>
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardLabel}>Pasaporte</Text>
              <View
                style={[
                  styles.statusTag,
                  info.passport_required ? styles.statusWarning : styles.statusSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    info.passport_required
                      ? styles.statusWarningText
                      : styles.statusSuccessText,
                  ]}
                >
                  {info.passport_required ? 'Obligatorio' : 'No necesario'}
                </Text>
              </View>
            </View>

            {/* Botón + info */}
            <Pressable
              onPress={() => setShowPassportInfo((prev) => !prev)}
              style={({ pressed }) => [
                styles.infoToggleBtn,
                showPassportInfo && styles.infoToggleBtnActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.infoToggleBtnText,
                  showPassportInfo && styles.infoToggleBtnTextActive,
                ]}
              >
                {showPassportInfo ? '- info' : '+ info'}
              </Text>
            </Pressable>
          </View>

          {/* Información detallada al pulsar + info */}
          {showPassportInfo && (
            <View style={styles.expandedInfoContainer}>
              <Text style={styles.expandedInfoText}>{info.passport_details}</Text>
            </View>
          )}

          {/* Pregunta interactiva obligatoria si se requiere pasaporte */}
          {info.passport_required && (
            <View
              style={[
                styles.passportQuestionSection,
                hasPassport === null && styles.passportQuestionPending,
              ]}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionTitleRow}>
                  <Text style={styles.questionTitle}>¿Posees pasaporte actualmente?</Text>
                  {hasPassport === null && (
                    <View style={styles.requiredPill}>
                      <Text style={styles.requiredPillText}>Respuesta requerida</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.questionSubtitle}>
                  Para continuar debes indicar si tienes pasaporte en vigor para viajar a {info.country_name}.
                </Text>
              </View>

              <View style={styles.choiceRow}>
                <Pressable
                  onPress={() => handleSelectPassport(true)}
                  style={[
                    styles.choiceButton,
                    hasPassport === true && styles.choiceButtonActiveSuccess,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      hasPassport === true && styles.choiceButtonTextActive,
                    ]}
                  >
                    ✓ Sí, tengo pasaporte
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectPassport(false)}
                  style={[
                    styles.choiceButton,
                    hasPassport === false && styles.choiceButtonActiveWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      hasPassport === false && styles.choiceButtonTextActive,
                    ]}
                  >
                    ✕ No tengo pasaporte
                  </Text>
                </Pressable>
              </View>

              {/* Si tiene pasaporte */}
              {hasPassport === true && (
                <View style={styles.passportReadyCard}>
                  <Text style={styles.passportReadyText}>
                    ✓ ¡Genial! Cuentas con la documentación requerida para este viaje.
                  </Text>
                </View>
              )}

              {/* Si NO tiene pasaporte -> Enlace oficial para solicitarlo */}
              {hasPassport === false && (
                <View style={styles.passportHelpCard}>
                  <View style={styles.helpHeaderRow}>
                    <Text style={styles.helpBadge}>🏛️ Trámite oficial en {info.origin_country}</Text>
                  </View>

                  {info.passport_authority_name && (
                    <Text style={styles.helpAuthority}>
                      {info.passport_authority_name}
                    </Text>
                  )}

                  {info.passport_instructions && (
                    <Text style={styles.helpInstructions}>
                      {info.passport_instructions}
                    </Text>
                  )}

                  <Pressable
                    onPress={handleOpenPassportLink}
                    style={styles.openLinkButton}
                  >
                    <Text style={styles.openLinkButtonText}>
                      🔗 Solicitar cita previa / Tramitar pasaporte oficial ↗
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 3. Vacunación */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: info.vaccination_required ? '#FFF4E5' : '#EBF9F5' },
              ]}
            >
              <Text style={styles.iconText}>💉</Text>
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardLabel}>Vacunación</Text>
              <View
                style={[
                  styles.statusTag,
                  info.vaccination_required ? styles.statusWarning : styles.statusSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    info.vaccination_required
                      ? styles.statusWarningText
                      : styles.statusSuccessText,
                  ]}
                >
                  {info.vaccination_required ? 'Obligatoria' : 'No necesaria'}
                </Text>
              </View>
            </View>

            {/* Botón + info */}
            <Pressable
              onPress={() => setShowVaccineInfo((prev) => !prev)}
              style={({ pressed }) => [
                styles.infoToggleBtn,
                showVaccineInfo && styles.infoToggleBtnActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.infoToggleBtnText,
                  showVaccineInfo && styles.infoToggleBtnTextActive,
                ]}
              >
                {showVaccineInfo ? '- info' : '+ info'}
              </Text>
            </Pressable>
          </View>

          {/* Información detallada al pulsar + info */}
          {showVaccineInfo && (
            <View style={styles.expandedInfoContainer}>
              <Text style={styles.expandedInfoText}>{info.vaccination_details}</Text>
            </View>
          )}
        </View>

        {/* 4. Situación Bélica / Guerras */}
        <View
          style={[
            styles.infoCard,
            info.has_armed_conflict && styles.infoCardDanger,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: info.has_armed_conflict ? '#FFEBEB' : '#EBF9F5' },
              ]}
            >
              <Text style={styles.iconText}>
                {info.has_armed_conflict ? '⚠️' : '🛡️'}
              </Text>
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardLabel}>Seguridad y Guerra</Text>
              <View
                style={[
                  styles.statusTag,
                  info.has_armed_conflict ? styles.statusDanger : styles.statusSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    info.has_armed_conflict
                      ? styles.statusDangerText
                      : styles.statusSuccessText,
                  ]}
                >
                  {info.has_armed_conflict ? 'Conflicto Bélico Activo' : 'País Seguro'}
                </Text>
              </View>
            </View>

            {/* Botón + info */}
            <Pressable
              onPress={() => setShowSecurityInfo((prev) => !prev)}
              style={({ pressed }) => [
                styles.infoToggleBtn,
                showSecurityInfo && styles.infoToggleBtnActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.infoToggleBtnText,
                  showSecurityInfo && styles.infoToggleBtnTextActive,
                ]}
              >
                {showSecurityInfo ? '- info' : '+ info'}
              </Text>
            </Pressable>
          </View>

          {/* Información detallada al pulsar + info */}
          {showSecurityInfo && (
            <View style={styles.expandedInfoContainer}>
              <Text style={styles.expandedInfoText}>{info.conflict_details}</Text>
            </View>
          )}
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
    paddingBottom: theme.spacing.lg,
  },
  /* Hero Banner - Resalta el destino con jerarquía visual */
  heroBanner: {
    backgroundColor: '#2F1DB2',
    borderRadius: 24,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: '#2F1DB2',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  flagBackdrop: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  heroFlagImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  heroBadgeGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
  heroAiPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroAiPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroCountryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  heroCountryPillText: {
    color: '#2F1DB2',
    fontSize: 13,
    fontWeight: '800',
  },
  heroDestinationCity: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 10,
  },
  heroContextLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroOriginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  originFlagSmall: {
    width: 18,
    height: 13,
    borderRadius: 3,
  },
  heroOriginText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardsGrid: {
    gap: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  infoCardDanger: {
    borderColor: '#FFA8A8',
    backgroundColor: '#FFF8F8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardMainValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusSuccess: {
    backgroundColor: colors.successSoft,
  },
  statusSuccessText: {
    color: '#08877B',
    fontSize: 12,
    fontWeight: '800',
  },
  statusWarning: {
    backgroundColor: '#FFF4E5',
  },
  statusWarningText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '800',
  },
  statusDanger: {
    backgroundColor: '#FFEBEB',
  },
  statusDangerText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  /* Botón + info */
  infoToggleBtn: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginLeft: 8,
  },
  infoToggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  infoToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  infoToggleBtnTextActive: {
    color: colors.white,
  },
  btnPressed: {
    opacity: 0.8,
  },
  /* Contenedor expandido */
  expandedInfoContainer: {
    marginTop: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  expandedInfoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  /* Pregunta interactiva de pasaporte */
  passportQuestionSection: {
    marginTop: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passportQuestionPending: {
    borderColor: '#D97706',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF9',
  },
  questionHeader: {
    marginBottom: 10,
  },
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  requiredPill: {
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredPillText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  questionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceButtonActiveSuccess: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceButtonActiveWarning: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  choiceButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  choiceButtonTextActive: {
    color: colors.white,
  },
  passportReadyCard: {
    marginTop: 10,
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  passportReadyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#08877B',
    lineHeight: 16,
  },
  passportHelpCard: {
    marginTop: 10,
    backgroundColor: '#FFFDF7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  helpHeaderRow: {
    marginBottom: 4,
  },
  helpBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  helpAuthority: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  helpInstructions: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
    marginBottom: 10,
  },
  openLinkButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  openLinkButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
