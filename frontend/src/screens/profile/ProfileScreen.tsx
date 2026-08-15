import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getCountries, type UserProfile, updateUserProfile } from '../../api/auth';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { FALLBACK_COUNTRIES } from '../../utils/constants';

type ProfileScreenProps = {
  user?: UserProfile;
  onProfileUpdated?: (user: UserProfile) => void;
  onLogout?: () => void;
};

type FieldErrors = {
  first_name?: string;
  last_name?: string;
  username?: string;
  country_of_residence?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
};

export default function ProfileScreen({ user, onProfileUpdated, onLogout }: ProfileScreenProps) {
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [country, setCountry] = useState(user?.country_of_residence || 'España');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [countries, setCountries] = useState<string[]>(FALLBACK_COUNTRIES);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setUsername(user.username || '');
      setCountry(user.country_of_residence || 'España');
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadCountries = async () => {
      try {
        const response = await getCountries();
        if (mounted && Array.isArray(response) && response.length > 0) {
          setCountries(response);
          if (!response.includes(country)) {
            setCountry(response[0]);
          }
        }
      } catch {
        if (mounted) {
          setCountries(FALLBACK_COUNTRIES);
        }
      }
    };

    loadCountries();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return countries;
    return countries.filter((item) => item.toLowerCase().includes(normalized));
  }, [countries, searchTerm]);

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!firstName.trim()) {
      nextErrors.first_name = 'El nombre es obligatorio.';
    } else if (firstName.trim().length > 49) {
      nextErrors.first_name = 'El nombre no puede superar 49 caracteres.';
    }

    if (!lastName.trim()) {
      nextErrors.last_name = 'Los apellidos son obligatorios.';
    } else if (lastName.trim().length > 49) {
      nextErrors.last_name = 'Los apellidos no pueden superar 49 caracteres.';
    }

    if (!username.trim()) {
      nextErrors.username = 'El nombre de usuario es obligatorio.';
    } else if (username.trim().length < 5) {
      nextErrors.username = 'El usuario debe tener al menos 5 caracteres.';
    } else if (username.trim().length > 49) {
      nextErrors.username = 'El usuario no puede superar 49 caracteres.';
    }

    if (!country.trim()) {
      nextErrors.country_of_residence = 'Selecciona un país válido.';
    }

    if (passwordEnabled) {
      if (!password) {
        nextErrors.password = 'La nueva contraseña es obligatoria.';
      } else if (password.length < 6) {
        nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
      }

      if (!confirmPassword) {
        nextErrors.confirm_password = 'Debes confirmar la nueva contraseña.';
      } else if (password !== confirmPassword) {
        nextErrors.confirm_password = 'Las contraseñas no coinciden.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        country_of_residence: country,
        password: passwordEnabled ? password : undefined,
        confirm_password: passwordEnabled ? confirmPassword : undefined,
      });

      onProfileUpdated?.(updatedUser);
      setPassword('');
      setConfirmPassword('');
      setPasswordEnabled(false);
      Alert.alert('Perfil actualizado', 'Los cambios se han guardado correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.';
      setErrors({ general: message });
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (firstName || username || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          <Text style={styles.title}>Tu perfil</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                setErrors((prev) => ({ ...prev, first_name: undefined, general: undefined }));
              }}
              style={[styles.input, errors.first_name && styles.inputError]}
              placeholder="Tu nombre"
              autoCapitalize="words"
            />
            {errors.first_name ? <Text style={styles.errorText}>{errors.first_name}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Apellidos</Text>
            <TextInput
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                setErrors((prev) => ({ ...prev, last_name: undefined, general: undefined }));
              }}
              style={[styles.input, errors.last_name && styles.inputError]}
              placeholder="Tus apellidos"
              autoCapitalize="words"
            />
            {errors.last_name ? <Text style={styles.errorText}>{errors.last_name}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                setErrors((prev) => ({ ...prev, username: undefined, general: undefined }));
              }}
              style={[styles.input, errors.username && styles.inputError]}
              placeholder="Nombre de usuario"
              autoCapitalize="none"
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>País</Text>
            <Pressable
              onPress={() => setCountryModalVisible(true)}
              style={[styles.input, styles.countrySelector, errors.country_of_residence && styles.inputError]}
            >
              <Text style={styles.countryText}>{country || 'Selecciona un país'}</Text>
              <Text style={styles.countryChevron}>▾</Text>
            </Pressable>
            {errors.country_of_residence ? <Text style={styles.errorText}>{errors.country_of_residence}</Text> : null}
          </View>

          <View style={styles.passwordRow}>
            <Text style={styles.label}>Cambiar contraseña</Text>
            <Switch value={passwordEnabled} onValueChange={setPasswordEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} />
          </View>

          {passwordEnabled ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
                  }}
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setErrors((prev) => ({ ...prev, confirm_password: undefined, general: undefined }));
                  }}
                  style={[styles.input, errors.confirm_password && styles.inputError]}
                  placeholder="Repite la nueva contraseña"
                  secureTextEntry
                />
                {errors.confirm_password ? <Text style={styles.errorText}>{errors.confirm_password}</Text> : null}
              </View>
            </>
          ) : null}

          {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

          <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
          </Pressable>

          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={countryModalVisible} transparent animationType="slide" onRequestClose={() => setCountryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona un país</Text>
              <Pressable onPress={() => setCountryModalVisible(false)}>
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
            </View>

            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar país"
              style={styles.modalInput}
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              style={styles.countryList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setCountry(item);
                    setCountryModalVisible(false);
                    setSearchTerm('');
                    setErrors((prev) => ({ ...prev, country_of_residence: undefined, general: undefined }));
                  }}
                  style={[styles.countryOption, item === country && styles.countryOptionSelected]}
                >
                  <Text style={styles.countryOptionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 24,
    alignSelf: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    alignSelf: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  inputError: {
    borderColor: '#d9534f',
  },
  errorText: {
    color: '#d9534f',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  generalError: {
    color: '#d9534f',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryText: {
    color: colors.text,
    fontSize: 15,
  },
  countryChevron: {
    color: colors.textMuted,
    fontSize: 18,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButton: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: '#fdecef',
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  closeText: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    marginBottom: 12,
    color: colors.text,
  },
  countryList: {
    maxHeight: 320,
  },
  countryOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  countryOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  countryOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
