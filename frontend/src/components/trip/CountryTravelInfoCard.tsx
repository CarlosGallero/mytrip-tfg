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
            <View style={[styles.iconCircle, { backgroundColor: '#EEF4FF' }]}>
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
                { backgroundColor: info.passport_required ? '#FFFBEB' : '#ECFDF5' },
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
                { backgroundColor: info.vaccination_required ? '#FFFBEB' : '#ECFDF5' },
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
                { backgroundColor: info.has_armed_conflict ? '#FEF2F2' : '#ECFDF5' },
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
    shadowColor: '#1E127D',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    borderColor: 'rgba(255, 255, 255, 0.75)',
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
  heroCountryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
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
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 10,
  },
  heroContextLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroOriginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    gap: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  infoCardDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF8F8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusSuccessText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
  },
  statusWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusWarningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  statusDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusDangerText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  /* Botón + info */
  infoToggleBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  expandedInfoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  /* Pregunta interactiva de pasaporte */
  passportQuestionSection: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  passportQuestionPending: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFDF9',
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  requiredPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  requiredPillText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  questionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
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
  choiceButtonActiveSuccess: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceButtonActiveWarning: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  choiceButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  choiceButtonTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  passportReadyCard: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  passportReadyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    lineHeight: 17,
  },
  passportHelpCard: {
    marginTop: 12,
    backgroundColor: '#FFFDF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  helpHeaderRow: {
    marginBottom: 6,
  },
  helpBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  helpAuthority: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  helpInstructions: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  openLinkButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  openLinkButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
