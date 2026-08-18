import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DestinationTravelInfo } from '../../types';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';

interface CountryTravelInfoCardProps {
  info: DestinationTravelInfo;
}

export default function CountryTravelInfoCard({ info }: CountryTravelInfoCardProps) {
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);

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
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <Text style={styles.flagEmoji}>{info.flag_emoji || '🌍'}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.countryName}>{info.country_name}</Text>
          <Text style={styles.destinationCity}>Destino: {info.destination_city}</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✨ Información de viaje con IA</Text>
          </View>
        </View>
      </View>

      {/* Origin Context Notice */}
      <View style={styles.contextNotice}>
        <Text style={styles.contextNoticeText}>
          Requisitos personalizados para residentes de{' '}
          <Text style={styles.boldText}>{info.origin_country || 'tu país'}</Text>
        </Text>
      </View>

      {/* Grid of Info Cards */}
      <View style={styles.cardsGrid}>
        {/* Moneda */}
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

        {/* Pasaporte y Documentación */}
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
              <Text style={styles.cardLabel}>Pasaporte y Visado</Text>
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
                  {info.passport_required ? 'Pasaporte Obligatorio' : 'No requiere Pasaporte'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.cardDescription}>{info.passport_details}</Text>

          {/* Pregunta interactiva si se requiere pasaporte */}
          {info.passport_required && (
            <View style={styles.passportQuestionSection}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionTitle}>¿Posees pasaporte actualmente?</Text>
                <Text style={styles.questionSubtitle}>
                  Indica si dispones de pasaporte en vigor para tu viaje a {info.country_name}.
                </Text>
              </View>

              <View style={styles.choiceRow}>
                <Pressable
                  onPress={() => setHasPassport(true)}
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
                  onPress={() => setHasPassport(false)}
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

        {/* Vacunación */}
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
              <Text style={styles.cardLabel}>Requisitos de Vacunación</Text>
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
                  {info.vaccination_required ? 'Vacunas Obligatorias' : 'Sin vacunas obligatorias'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.cardDescription}>{info.vaccination_details}</Text>
        </View>

        {/* Situación Bélica / Guerras */}
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
              <Text style={styles.cardLabel}>Seguridad y Conflictos</Text>
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
                  {info.has_armed_conflict ? 'Conflicto Bélico Activo' : 'País Seguro y Estable'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.cardDescription}>{info.conflict_details}</Text>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: theme.spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  flagEmoji: {
    fontSize: 54,
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
  },
  destinationCity: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  contextNotice: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  contextNoticeText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  cardsGrid: {
    gap: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardMainValue: {
    fontSize: 16,
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
  cardDescription: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSoft,
    paddingTop: 10,
  },
  passportQuestionSection: {
    marginTop: 16,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  questionSubtitle: {
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  choiceButtonTextActive: {
    color: colors.white,
  },
  passportReadyCard: {
    marginTop: 12,
    backgroundColor: colors.successSoft,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  passportReadyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#08877B',
    lineHeight: 18,
  },
  passportHelpCard: {
    marginTop: 12,
    backgroundColor: '#FFFDF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  helpHeaderRow: {
    marginBottom: 6,
  },
  helpBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  helpAuthority: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  helpInstructions: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
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
    shadowOpacity: 0.15,
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
