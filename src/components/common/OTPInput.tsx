import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  error,
}) => {
  const [codes, setCodes] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const code = codes.join('');
    if (code.length === length) {
      onComplete(code);
    }
  }, [codes, length, onComplete]);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Handle paste
      const pastedCodes = numericText.slice(0, length).split('');
      const newCodes = [...codes];
      pastedCodes.forEach((char, i) => {
        if (index + i < length) {
          newCodes[index + i] = char;
        }
      });
      setCodes(newCodes);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + pastedCodes.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCodes = [...codes];
      newCodes[index] = numericText;
      setCodes(newCodes);

      // Auto-focus next input
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {codes.map((code, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              error && styles.inputError,
              code && styles.inputFilled,
            ]}
            value={code}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  inputFilled: {
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'center',
  },
});

