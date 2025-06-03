import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { useGlobalFeedbackContext} from '../context/RootContext';

import { accessDatabase } from './apputilities';

const ForgotPasswordModal = ({ isVisible, onClose, email, setEmail}) => {
  const {
    setFeedback,
    setElipses,
  } = useGlobalFeedbackContext();

  const [processing, setProcessing] = useState(false);

  //console.log(email);
  
  const handleSubmit = useCallback(async () => {
    setProcessing(true);

    const sendTo = email.current.trim();

    const data = {
      tableName: '"patrons"',
      action: "forgot",
      keypair: { email: sendTo },
      content: {}
    };

    try {
      setFeedback('Sending new password.');
      const result = await accessDatabase(data);
      //console.log('result', result);
      setFeedback(result === "success" ? 'Check email for new password.' : 'Email failure. Try again.');
      setProcessing(false);
    } catch (error) {
      //console.error('Error resetting password:', error);
      setFeedback('A network error occurred. Please try again.');
      setProcessing(false);
    } finally {
      setProcessing(false);
      onClose();
    }
  }, [email, setEmail, onClose]);

  const handleCancel = () => {
    setEmail('');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <Text style={styles.title}>Reset Password</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          {!processing && 
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={[styles.buttonText, styles.submitButtonText]}>
                  Reset
                </Text>
              </TouchableOpacity>
          </View>}

          {processing &&
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                
              >
                <View style={styles.buttonCenter}><ActivityIndicator color="#fff" /></View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                
              >
                <View style={styles.buttonCenter}><ActivityIndicator color="#fff" /></View>
              </TouchableOpacity>
          </View>
          }
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    padding: 10,
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  submitButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  buttonCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, 
  },
  submitButtonText: {
    color: 'white',
  },
});

export default ForgotPasswordModal;