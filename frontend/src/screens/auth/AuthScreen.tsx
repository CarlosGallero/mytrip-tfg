import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getCountries, loginUser, registerUser } from '../../api/auth';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { FALLBACK_COUNTRIES, getCountryCode, getCurrencyInfo } from '../../utils/constants';

type AuthMode = 'login' | 'register';

type LoginFormState = {
  username: string;
  password: string;
};

type RegisterFormState = {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  confirm_password: string;
};

// Estructura de errores por cada campo individual
type FieldErrors = {
  first_name?: string;
  last_name?: string;
  username?: string;
  password?: string;
  confirm_password?: string;
  country_of_residence?: string;
  general?: string;
};

const initialLoginForm: LoginFormState = {
  username: '',
  password: '',
};

const initialRegisterForm: RegisterFormState = {
  first_name: '',
  last_name: '',
  username: '',
  password: '',
  confirm_password: '',
};

type AuthScreenProps = {
  onLoginSuccess?: () => void;
};

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterForm);
  const [selectedCountry, setSelectedCountry] = useState('España');
  const [countries, setCountries] = useState<string[]>(FALLBACK_COUNTRIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado de errores por campo
  const [errors, setErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Limpiar mensaje de éxito automáticamente después de 4 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Cargar países al montarse el componente
  useEffect(() => {
    let mounted = true;

    const loadCountries = async () => {
      try {
        const response = await getCountries();
        if (mounted && Array.isArray(response) && response.length > 0) {
          setCountries(response);
          if (!response.includes(selectedCountry)) {
            setSelectedCountry(response[0]);
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
    return countries.filter((country) => country.toLowerCase().includes(normalized));
  }, [countries, searchTerm]);

  const currencyInfo = useMemo(() => getCurrencyInfo(selectedCountry), [selectedCountry]);
  const countryCode = useMemo(() => getCountryCode(selectedCountry), [selectedCountry]);

  const resetMessages = () => {
    setErrors({});
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    resetMessages();
    setLoading(true);

    const newErrors: FieldErrors = {};

    try {
      if (mode === 'login') {
        // Validación local de Login
        const username = loginForm.username.trim();
        const password = loginForm.password;

        if (!username) newErrors.username = 'El nombre de usuario es obligatorio.';
        if (!password) newErrors.password = 'La contraseña es obligatoria.';

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          setLoading(false);
          return;
        }

        await loginUser({ username, password });

        setSuccessMessage('Sesión iniciada correctamente.');
        Alert.alert('Bienvenido', 'Sesión iniciada correctamente.');
        onLoginSuccess?.();
        setLoading(false);
        return;
      }

      // Validación local de Registro
      const firstName = registerForm.first_name.trim();
      const lastName = registerForm.last_name.trim();
      const username = registerForm.username.trim();
      const password = registerForm.password;
      const confirmPassword = registerForm.confirm_password;

      if (!firstName) {
        newErrors.first_name = 'El nombre es obligatorio.';
      } else if (firstName.length > 49) {
        newErrors.first_name = 'El nombre no puede exceder 49 caracteres.';
      }

      if (!lastName) {
        newErrors.last_name = 'Los apellidos son obligatorios.';
      } else if (lastName.length > 49) {
        newErrors.last_name = 'Los apellidos no pueden exceder 49 caracteres.';
      }

      if (!username) {
        newErrors.username = 'El nombre de usuario es obligatorio.';
      } else if (username.length < 5) {
        newErrors.username = 'Debe tener al menos 5 caracteres.';
      } else if (username.length > 49) {
        newErrors.username = 'No puede exceder 49 caracteres.';
      }

      if (!password) {
        newErrors.password = 'La contraseña es obligatoria.';
      } else if (password.length < 6) {
        newErrors.password = 'Debe tener al menos 6 caracteres.';
      }

      if (!confirmPassword) {
        newErrors.confirm_password = 'Debes confirmar la contraseña.';
      } else if (password !== confirmPassword) {
        newErrors.confirm_password = 'Las contraseñas no coinciden.';
      }

      if (!selectedCountry) {
        newErrors.country_of_residence = 'Selecciona un país de origen.';
      }

      // Si hay errores de validación previa en el cliente, no llamamos a la API
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      await registerUser({
        first_name: firstName,
        last_name: lastName,
        username,
        password,
        confirm_password: confirmPassword,
        country_of_residence: selectedCountry,
      });

      setSuccessMessage('Cuenta creada correctamente. Ya puedes iniciar sesión.');
      setMode('login');
      setLoginForm({ username, password });
      setRegisterForm(initialRegisterForm);
      Alert.alert('Cuenta creada', 'Ya puedes iniciar sesión con tu usuario.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.';
      
      // Mapear respuestas del servidor a campos específicos
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('usuario') || lowerMsg.includes('username')) {
        setErrors({ username: message });
      } else if (lowerMsg.includes('contraseña') || lowerMsg.includes('password')) {
        setErrors({ password: message });
      } else if (lowerMsg.includes('país') || lowerMsg.includes('country')) {
        setErrors({ country_of_residence: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCountryItem = ({ item }: { item: string }) => {
    const code = getCountryCode(item);
    const isSelected = item === selectedCountry;

    return (
      <Pressable
        onPress={() => {
          setSelectedCountry(item);
          setCountryModalVisible(false);
          setSearchTerm('');
          setErrors((prev) => ({ ...prev, country_of_residence: undefined }));
        }}
        style={({ pressed }) => [
          styles.countryRow,
          isSelected && styles.countryRowSelected,
          pressed && styles.countryRowPressed,
        ]}
      >
        <View style={styles.countryRowLeft}>
          <View style={styles.countryCodeBadge}>
            <Text style={styles.countryCodeText}>{code}</Text>
          </View>
          <Text style={styles.countryRowText}>{item}</Text>
        </View>
        {isSelected ? <Text style={styles.countryCheck}>✓</Text> : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={styles.hero}>
              <View style={styles.heroDecorTop} />
              <View style={styles.heroDecorBottom} />

              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>✦</Text>
                </View>
                <Text style={styles.brandText}>MyTrip</Text>
              </View>

              <Text style={styles.heroTitle}>
                {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {mode === 'login'
                  ? 'Tu próxima aventura te espera'
                  : 'Empieza a planificar viajes con asistencia inteligente'}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.segmentedControl}>
                <Pressable
                  onPress={() => {
                    setMode('login');
                    resetMessages();
                  }}
                  style={({ pressed }) => [
                    styles.segment,
                    mode === 'login' && styles.segmentActive,
                    pressed && styles.segmentPressed,
                  ]}
                >
                  <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                    Iniciar sesión
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMode('register');
                    resetMessages();
                  }}
                  style={({ pressed }) => [
                    styles.segment,
                    mode === 'register' && styles.segmentActive,
                    pressed && styles.segmentPressed,
                  ]}
                >
                  <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>
                    Crear cuenta
                  </Text>
                </Pressable>
              </View>

              {/* Banner solo para errores generales que no pertenezcan a un campo especifico */}
              {errors.general ? <Text style={styles.errorBanner}>{errors.general}</Text> : null}
              {successMessage ? <Text style={styles.successBanner}>{successMessage}</Text> : null}

              {mode === 'register' ? (
                <View style={styles.formGrid}>
                  <View style={styles.halfFieldRow}>
                    {/* Nombre */}
                    <View style={styles.fieldHalfContainer}>
                      <View style={[styles.fieldHalf, styles.inputShadow, errors.first_name && styles.fieldErrorBorder]}>
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                          placeholder="Tu nombre"
                          placeholderTextColor={colors.hint}
                          style={styles.input}
                          value={registerForm.first_name}
                          onChangeText={(value) => {
                            setRegisterForm((current) => ({ ...current, first_name: value }));
                            setErrors((prev) => ({ ...prev, first_name: undefined }));
                          }}
                        />
                      </View>
                      {errors.first_name ? <Text style={styles.fieldErrorText}>{errors.first_name}</Text> : null}
                    </View>

                    {/* Apellidos */}
                    <View style={styles.fieldHalfContainer}>
                      <View style={[styles.fieldHalf, styles.inputShadow, errors.last_name && styles.fieldErrorBorder]}>
                        <Text style={styles.label}>Apellidos</Text>
                        <TextInput
                          placeholder="Tus apellidos"
                          placeholderTextColor={colors.hint}
                          style={styles.input}
                          value={registerForm.last_name}
                          onChangeText={(value) => {
                            setRegisterForm((current) => ({ ...current, last_name: value }));
                            setErrors((prev) => ({ ...prev, last_name: undefined }));
                          }}
                        />
                      </View>
                      {errors.last_name ? <Text style={styles.fieldErrorText}>{errors.last_name}</Text> : null}
                    </View>
                  </View>

                  {/* Username */}
                  <View>
                    <View style={[styles.field, styles.inputShadow, errors.username && styles.fieldErrorBorder]}>
                      <Text style={styles.label}>Nombre de usuario</Text>
                      <TextInput
                        placeholder="usuario123"
                        placeholderTextColor={colors.hint}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        value={registerForm.username}
                        onChangeText={(value) => {
                          setRegisterForm((current) => ({ ...current, username: value }));
                          setErrors((prev) => ({ ...prev, username: undefined }));
                        }}
                      />
                    </View>
                    {errors.username ? <Text style={styles.fieldErrorText}>{errors.username}</Text> : null}
                  </View>

                  {/* Password */}
                  <View>
                    <View style={[styles.field, styles.inputShadow, errors.password && styles.fieldErrorBorder]}>
                      <Text style={styles.label}>Contraseña</Text>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={colors.hint}
                        secureTextEntry
                        style={styles.input}
                        value={registerForm.password}
                        onChangeText={(value) => {
                          setRegisterForm((current) => ({ ...current, password: value }));
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                      />
                    </View>
                    {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
                  </View>

                  {/* Confirm Password */}
                  <View>
                    <View style={[styles.field, styles.inputShadow, errors.confirm_password && styles.fieldErrorBorder]}>
                      <Text style={styles.label}>Confirmar contraseña</Text>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={colors.hint}
                        secureTextEntry
                        style={styles.input}
                        value={registerForm.confirm_password}
                        onChangeText={(value) => {
                          setRegisterForm((current) => ({ ...current, confirm_password: value }));
                          setErrors((prev) => ({ ...prev, confirm_password: undefined }));
                        }}
                      />
                    </View>
                    {errors.confirm_password ? <Text style={styles.fieldErrorText}>{errors.confirm_password}</Text> : null}
                  </View>

                  {/* Country Selection */}
                  <View>
                    <Text style={styles.label}>País de origen</Text>
                    <Pressable
                      onPress={() => setCountryModalVisible(true)}
                      style={({ pressed }) => [
                        styles.countryButton,
                        styles.inputShadow,
                        errors.country_of_residence && styles.fieldErrorBorder,
                        pressed && styles.countryButtonPressed,
                      ]}
                    >
                      <View style={styles.countryButtonLeft}>
                        <Text style={styles.countryButtonCode}>{countryCode}</Text>
                        <Text style={styles.countryButtonLabel}>{selectedCountry}</Text>
                      </View>
                      <Text style={styles.countryButtonChevron}>⌄</Text>
                    </Pressable>
                    {errors.country_of_residence ? (
                      <Text style={styles.fieldErrorText}>{errors.country_of_residence}</Text>
                    ) : null}
                  </View>

                  {/* Currency Auto-detected */}
                  <Text style={styles.label}>Divisa</Text>
                  <View style={styles.currencyCard}>
                    <View style={styles.currencyLeft}>
                      <View style={styles.currencyIcon}>
                        <Text style={styles.currencyIconText}></Text>
                      </View>
                      <View>
                        <Text style={styles.currencyText}>
                          {currencyInfo.code} — {currencyInfo.name}
                        </Text>
                        <Text style={styles.currencyHint}>Auto-detectado</Text>
                      </View>
                    </View>

                    <View style={styles.currencyChip}>
                      <Text style={styles.currencyChipText}>Auto-detectado</Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* Formularios de Login con errores individuales */
                <View style={styles.formGrid}>
                  <View>
                    <View style={[styles.field, styles.inputShadow, errors.username && styles.fieldErrorBorder]}>
                      <Text style={styles.label}>Usuario</Text>
                      <TextInput
                        placeholder="Nombre de usuario"
                        placeholderTextColor={colors.hint}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        value={loginForm.username}
                        onChangeText={(value) => {
                          setLoginForm((current) => ({ ...current, username: value }));
                          setErrors((prev) => ({ ...prev, username: undefined }));
                        }}
                      />
                    </View>
                    {errors.username ? <Text style={styles.fieldErrorText}>{errors.username}</Text> : null}
                  </View>

                  <View>
                    <View style={[styles.field, styles.inputShadow, errors.password && styles.fieldErrorBorder]}>
                      <Text style={styles.label}>Contraseña</Text>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={colors.hint}
                        secureTextEntry
                        style={styles.input}
                        value={loginForm.password}
                        onChangeText={(value) => {
                          setLoginForm((current) => ({ ...current, password: value }));
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                      />
                    </View>
                    {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
                  </View>
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !loading && styles.primaryButtonPressed,
                  loading && styles.primaryButtonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                </Text>
              </Pressable>

              <View style={styles.footerRow}>
                <View style={styles.footerLine} />
                <Text style={styles.footerLabel}>
                  {mode === 'login' ? '¿Primera vez?' : '¿Ya tienes cuenta?'}
                </Text>
                <View style={styles.footerLine} />
              </View>

              <Pressable
                onPress={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  resetMessages();
                }}
                style={({ pressed }) => [pressed && styles.linkPressed]}
              >
                <Text style={styles.linkText}>
                  {mode === 'login' ? 'Crear cuenta gratuita →' : 'Volver a iniciar sesión →'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent
        visible={countryModalVisible}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCountryModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecciona tu país</Text>
            <TextInput
              placeholder="Buscar país"
              placeholderTextColor={colors.hint}
              style={styles.modalSearch}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              renderItem={renderCountryItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.countryList}
              ListEmptyComponent={
                <Text style={styles.emptyState}>No se encontraron países con ese texto.</Text>
              }
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.primary,
    minHeight: 260,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  heroDecorTop: {
    position: 'absolute',
    top: -18,
    right: -26,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroDecorBottom: {
    position: 'absolute',
    bottom: -48,
    left: -36,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  brandText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    flex: 1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 18,
    lineHeight: 26,
    maxWidth: 320,
  },
  card: {
    marginTop: -24,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 24,
    elevation: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    padding: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  segmentPressed: {
    opacity: 0.9,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  errorBanner: {
    backgroundColor: '#FFF2F4',
    color: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: colors.successSoft,
    color: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  formGrid: {
    gap: 14,
    marginBottom: 12,
  },
  halfFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalfContainer: {
    flex: 1,
  },
  fieldHalf: {
    borderRadius: theme.radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  field: {
    borderRadius: theme.radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldErrorBorder: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  inputShadow: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'android' ? 8 : 6,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  countryButtonPressed: {
    opacity: 0.92,
  },
  countryButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryButtonCode: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  countryButtonLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  countryButtonChevron: {
    color: colors.textMuted,
    fontSize: 22,
    marginTop: -2,
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currencyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  currencyIconText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  currencyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  currencyHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  currencyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.successSoft,
  },
  currencyChipText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
    marginTop: 10,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 22,
    marginBottom: 10,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  linkPressed: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    maxHeight: '78%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalSearch: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    marginBottom: 12,
    fontWeight: '600',
  },
  countryList: {
    paddingBottom: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  countryRowSelected: {
    backgroundColor: colors.surfaceSoft,
  },
  countryRowPressed: {
    backgroundColor: '#EEF1FF',
  },
  countryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  countryCodeBadge: {
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCodeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  countryRowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  countryCheck: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyState: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 18,
    fontSize: 14,
  },
});
