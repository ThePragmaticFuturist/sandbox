import React, { useState, useRef, useContext, useEffect, useCallback, useMemo } from 'react';
import { AppState, Keyboard, Text, View, TextInput, TouchableOpacity, StyleSheet, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, Alert, Linking  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

//import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';

import { useGlobalFeedbackContext, useGlobalContext, useGlobalTimerContext, useGlobalLocationContext, useGlobalNavigationContext, versionNumber } from '../context/RootContext';
import { accessDatabase, validateEmail, newUserData } from '../components/apputilities';

const Login = () => {

  //console.log('chkpt 1');

  const {
    profileData,
    setProfileData, 
    initializedRef,
    initializeData,
    currentView, 
    setCurrentView,
    loggedIn,
    latestProfileDataRef
  } = useGlobalContext();

  const { 
    locationPermissionGranted,
    setUserLocation,
    setLocationPermissionGranted,
    getLocation,
    requestLocationPermission,
  } = useGlobalLocationContext();

  const {
    setFeedback,
    setElipses,
  } = useGlobalFeedbackContext();

  const {
    setRegistrationStep, 
    navigate, 
    setLoadingPage,
    
  } = useGlobalNavigationContext();

  const insets = useSafeAreaInsets();

  const email = useRef('');
  const setEmail = (value) => {
    // if (value.length) {console.log('email', value)};
    email.current = value.trim();
  }

  const password = useRef('');
  const setPassword = (value) => {
    // if (value.length) {console.log('password', value)};
    password.current = value.trim();
  }

  //const [showModal, setShowModal] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [showUI, setShowUI] = useState(true);

  const isRetry = useRef(false);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const appState = useRef(AppState.currentState);

  const getStoredCredentials = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await SecureStore.getItemAsync('password');
      return { email: storedEmail, password: storedPassword };
    } catch (error) {
      console.log('Error retrieving stored credentials:', error);
      return null;
    }
  }

  const setStoredCredentials = async (email, password) => {
    try {
      await AsyncStorage.setItem('email', email.toLowerCase().trim());
      await SecureStore.setItemAsync('password', password.toLowerCase().trim());
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
  }

  const requestPermissions = async (profileEmail) => {
    // console.log("saving token for " + profileEmail);
    // return false;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });

      if (newStatus !== 'granted') {
        return 
      }
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
      experienceId: '@kenhub/drinxapp'
    });
    
    const updatedata = {
      tableName: '"patrons"',
      action: 'insert',
      keypair: { email: profileEmail },
      content: { notificationtoken: token.data },
    };
    await accessDatabase(updatedata);

    setProfileData((prev) => ({ ...prev, notificationtoken: token.data }));

    console.log("saving token ", token.data);
  };


  const handleLogin = useCallback(async (initiating) => {
    
    setShowUI(false); 
    setElipses(true);

    if (!initiating || modalVisible) {
      setShowUI(true);
      return false;
    }

    if (currentView !== 'Login') {
      setCurrentView('Login');
    } 

    let cookieValue = { 
      email: email.current.toLowerCase().trim(),
      password: password.current,
    };

    let credentialsFound = false;

    if (initiating === 'blue') {
      const storedCredentials = await getStoredCredentials();

      if (storedCredentials && storedCredentials.email && storedCredentials.password) {
        setEmail(storedCredentials.email);
        setPassword(storedCredentials.password);
        credentialsFound = true;
        cookieValue = {
          email: storedCredentials.email,
          password: storedCredentials.password,
        }
      }
    }
    
    const checkEmail = validateEmail(cookieValue.email);

    if (checkEmail.length < 6 || cookieValue.password.length < 8) {
      setElipses(false);
      if (initiating !== 'blue') {
        setFeedback(checkEmail.length < 6 ? "Invalid username." : "Invalid password (>= 8 chars).");
      } else {
        setFeedback('');
      }
      setShowUI(true);
      return false;
    }

    cookieValue.email = checkEmail;

    if (initiating === 'login'){
      setElipses(true);
      setFeedback('Logging In');
    }
    
    const data = { 
      tableName: '"patrons"', 
      action: "query", 
      keypair: { "email": cookieValue.email }, 
      content: { "password": cookieValue.password, "conjunction": "AND" } 
    };

    const result = await accessDatabase(data);

    if (result.length) {
      //console.log(JSON.stringify(result, null, 2));

      let profileDataObj = result[0];

      setProfileData(profileDataObj);
      latestProfileDataRef.current = profileDataObj;

      if (!credentialsFound) {
        await setStoredCredentials(cookieValue.email, cookieValue.password);
      }

      //console.log("ask for location");

      //await requestLocationPermission();

      const results = await requestLocationPermission();

      //console.log("requestLocationPermission", results);
      
      setElipses(false);
      setFeedback(`versionNumber ${versionNumber}`);

      await requestPermissions(cookieValue.email);

      loggedIn.current = true;

      navigate("Pix");
      
      await initializeData(profileDataObj);

      //console.log('navigated to Pix');
      
      return false;
      
    } else {
      setElipses(false);

      if (initiating === 'login'){
        setFeedback("Incorrect email or password.");
      } else {
        setFeedback('');
      }
    }

    setShowUI(true);

  }, [loggedIn, setFeedback]);//, setElipses, setFeedback, setShowUI, setProfileData, setUserLocation

  const registerNewUser = useCallback(() => {
    console.log('chkpt', 'new user');
    setFeedback('');

    if (modalVisible) return false;

    const userData = {...newUserData};

    userData.location = locationPermissionGranted;

    setProfileData(userData);

    loggedIn.current = false;
    setRegistrationStep(1);
    //setCurrentView('Login');
    navigate(true, 'Registration');
  }, [modalVisible, setFeedback, setProfileData, loggedIn, setRegistrationStep, navigate]);

  // useEffect(() => {
  //   const setToken = async () => {
  //       if (!profileData.notificationtoken || typeof profileData.notificationtoken !== 'string'){
  //           const token = await initializeNotifications();
          
  //           setProfileData(prev => ({ ...prev, notificationtoken: token}));
  //       }
  //   };
  // }, [profileData.notificationtoken, setProfileData, initializeNotifications]);

  useEffect(() => {
    //console.log('thing 2');
    if (!loggedIn.current){
      handleLogin('blue');  
    }
  }, []);

  useEffect(() => {
    return () => {
      setElipses(false);
      setFeedback(' ');
    };
  }, [setElipses, setFeedback]);

  useEffect(() => {
    const keyboardDidShow = () => setIsKeyboardVisible(true);
    const keyboardDidHide = () => setIsKeyboardVisible(false);

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      keyboardDidShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      keyboardDidHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const memoizedSlogan = useMemo(() => (
    <>
      {!isKeyboardVisible && (
        <View style={styles.centerSlogan}>
          <Text style={styles.styleSlogan}>If you're last,{'\n'}it ain't free.</Text>
        </View>
      )}
    </>
  ), [isKeyboardVisible]);

  const memoizedLoginForm = useMemo(() => (
    <View style={styles.loginForm}>
      <View style={styles.loginField}>
        <TextInput
          style={styles.loginInput}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          inputmode='email'
          autoCapitalize="none"
        />
      </View>
      <View style={styles.loginField}>
        <TextInput
          style={styles.loginInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.forgotLinkPosition} onPress={() => setModalVisible(true)}>
          <Text style={styles.forgotLink}>Forgot</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.loginActions}>
        <TouchableOpacity style={[styles.loginButtons, styles.loginButtonsLeft]} onPress={registerNewUser}>
          <Text style={styles.buttonText}>New User</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.loginButtons, styles.loginButtonsRight]} onPress={() => {setShowUI(false); handleLogin('login');}}>
          <Text style={[styles.buttonText, styles.buttonWeight]}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [email, password]);

  return (
    <ImageBackground source={require('../assets/images/barbackground.jpg')} style={styles.container, {position: 'absolute',width: '100%',
    top: (insets.top + 10), bottom: insets.bottom,
  }}>
      <View style={styles.container}>
        <View style={styles.loginContainer}>
        
          {memoizedSlogan}

          {!modalVisible && showUI && memoizedLoginForm}
          
          <ForgotPasswordModal
            isVisible={modalVisible}
            onClose={() => setModalVisible(false)}
            email={email}
            setEmail={setEmail}
          />

          </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 480,
    position: 'absolute',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  centerSlogan: {
    alignItems: 'center',
    marginBottom: 20,
  },
  styleSlogan: {
    color: 'white',
    fontWeight: Platform.OS === 'ios' ? 'bold' : '700',
    fontSize: 32,
    textAlign: 'center',
  },
  loginForm: {
    width: '100%',
    maxWidth: 256,
    alignItems: 'center',
  },
  loginField: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'white',
    marginBottom: 10,
  },
  loginInput: {
    width: '100%',
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 1,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: Platform.OS === 'ios' ? 'bold' : '700',
  },
  forgotLinkPosition: {
    position: 'absolute',
    right: 5,
    top: '50%',
    transform: [{ translateY: -6 }],
  },
  loginActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  loginButtons: {
    width: '48%',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonsLeft: {
    backgroundColor: 'white',
  },
  loginButtonsRight: {
    backgroundColor: 'lightgreen',
  },
  buttonText: {
    textAlign: 'center',
  },
  buttonWeight: {
    fontWeight: Platform.OS === 'ios' ? 'bold' : '700',
  }
});

export default React.memo(Login);