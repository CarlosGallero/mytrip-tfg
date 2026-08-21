import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { searchCities } from '../api/cities';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

type CityAutocompleteProps = {
  value: string;
  onChangeText?: (text: string) => void;
  onSelectCity: (city: string) => void;
  placeholder?: string;
};

export default function CityAutocomplete({
  value,
  onChangeText,
  onSelectCity,
  placeholder = 'Escribe la ciudad de destino...',
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(inputValue);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue]);

  const handleChangeText = (text: string) => {
    setInputValue(text);
    onChangeText?.(text);

    if (!text.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (text.trim() && text.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleSelect = (city: string) => {
    const cleanCity = city.trim();
    setInputValue(cleanCity);
    setSuggestions([]);
    setIsOpen(false);
    onChangeText?.(cleanCity);
    onSelectCity(cleanCity);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={inputValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="words"
        autoCorrect={false}
        onFocus={() => {
          if (inputValue.trim().length >= 2 && suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
      />

      {isOpen && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((item, index) => (
            <Pressable
              key={`${item}-${index}`}
              style={styles.option}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  dropdown: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
