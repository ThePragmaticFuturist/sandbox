import { useState, useContext, useEffect, useRef  } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, Dimensions, Platform, ActivityIndicator  } from 'react-native';
import TermsModal from '../components/TermsModal';
import { useGlobalContext } from '../context/RootContext';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
//import NotificationServices from '../components/NotificationServices';

const NOTIFICATION_CHANNEL_ID = 'drinx_notifications';

const RegistrationPage4 = () => {
    const { profileData, setProfileData, registerForPushNotificationsAsync, submittingRegistration } = useGlobalContext();

    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    const [termsVisible, setTermsVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    //const { width, height } = dimensions;

    const insets = useSafeAreaInsets();

    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        
        // Clean up when component unmounts
        return () => {
            mounted.current = false;
        };
    }, []);

    const styles = StyleSheet.create({
        container: {
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'absolute',
        },
        centerText: {
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            paddingBottom: 10,
          },
          centerContent: {
            flex: 1,
            top:0,
            left:0,
            right:0,
            bottom:0,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          },
        box: {
            position: 'absolute',
            backgroundColor: 'whitesmoke',
            //top: 200,
            left: 0,
            right: 0,
            //bottom: 160,
        },
        scrollViewContent: {
          flexGrow: 1,
          backgroundColor: 'white',
          padding: 20,
        },
        narrowColumn: {
            backgroundColor: 'whitesmoke',
            padding: 10, 
            borderRadius: 8, 
            //width: '95%',
        },
        formGroup: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        },
        formGroupOptions: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        },
        form: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        },
        centerText: {
          textAlign: 'center',
          paddingBottom: 10,
          paddingTop: 10,
          fontSize: 16,
        },
        centerProcessingText: {
           flex: 1,
            top:0,
            left:0,
            right:0,
            bottom: 0,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: '50%',
        },
        centerTextWhite: {
          textAlign: 'center',
          color: 'whitesmoke',
          fontSize: 16,
          fontWeight: "bold",
          paddingBottom: 10,
        },
        registrationWelcome: {
          fontWeight: 'bold',
          marginBottom: 20,
        },
        zero: {
          marginTop: 0,
        },
        label: {
          flex: 1,
          fontWeight: 'bold',
          marginRight: 10,
          marginLeft: 8,
        },
        show: {
          position: 'relative',
          zIndex: 20,
          marginLeft: 5,
        },
        passwordContainer: {
          // Empty for now, add specific styles if needed
            width: "50%",
        },
        centerTextPadding: {
          textAlign: 'center',
          paddingBottom: 20,
          fontSize: 16,
        },
        leftJustify: {
          textAlign: 'left',
        },
        input: {
          flex: 2,
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 5,
          backgroundColor: "white",
        },
        buttonStyleUnchecked: {
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          backgroundColor: 'rgb(220, 0, 0)',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            android: {
              elevation: 5,
            },
          }),
        },
        buttonStyleChecked: {
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'black',
        },
        button: {
          padding: 8,
          paddingHorizontal: 15,
          borderRadius: 4,
          marginRight: 10,
        },
        buttonTextStyle: {
          fontSize: 16,
          textAlign: 'center',
          color: '#fff', // For unchecked button
          fontWeight: 'bold',
        },
        buttonTextStyleChecked: {
          fontSize: 14,
          color: '#000', // For checked button
          textAlign: 'center',
        },
    });

    const getButtonStyle = () => {
        return ((profileData.tccheck === true) ? styles.buttonStyleChecked : styles.buttonStyleUnchecked);
    }

    const getButtonTextStyle = () => {
        return ((profileData.tccheck === true) ? styles.buttonTextStyleChecked : styles.buttonTextStyle);
    }

    const initializeNotifications = async () => {
        try {
          if (!Device.isDevice) {
            //console.warn('Must use physical device for Push Notifications');
            return null;
          }

          // Request permissions
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync({
              ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowAnnouncements: true,
              },
            });
            finalStatus = status;
          }

          if (finalStatus !== 'granted') {
            //console.warn('Failed to get push token for push notification!');
            return null;
          }

          // Set up Android channel first
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
              name: 'Drinx Notifications',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
              sound: true,
              enableVibrate: true,
              enableLights: true,
              showBadge: true,
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            });
          }

          // Get push token
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
            experienceId: '@kenhub/drinxapp'
          });

          return token.data;
        } catch (error) {
          console.error('Error initializing notifications:', error);
          return null;
        }
      }

    const handleChange = async (name, value, type) => {
        if (!mounted.current) return;

        let dynamicValue = value;

        if (name === 'mobile') {
            dynamicValue = dynamicValue.replace(/\D/g, '');

            // Format the phone number
            let formattedPhoneNumber = '';
            if (dynamicValue.length > 0) {
                formattedPhoneNumber += '(' + dynamicValue.substring(0, 3);
            }
            if (dynamicValue.length >= 4) {
                formattedPhoneNumber += ') ' + dynamicValue.substring(3, 6);
            }
            if (dynamicValue.length >= 7) {
                formattedPhoneNumber += '-' + dynamicValue.substring(6, 10);
            }

            dynamicValue = formattedPhoneNumber;
        }

        setProfileData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? value : dynamicValue
        }));
    };

    const togglePasswordVisibility = () => {
        if (!mounted.current) return;

        setShowPassword(prevVisibility => !prevVisibility);
    };

    const handleTermsClick = (accepted) => {
        if (!mounted.current) return;

        setTermsVisible(false);
        setProfileData(prevState => ({
            ...prevState,
            ["tccheck"]: accepted
        }));
    };

    useEffect(() => {
        const setToken = async () => {
            if (!profileData.notificationtoken || typeof profileData.notificationtoken !== 'string'){
                const token = await initializeNotifications();
              
                setProfileData(prev => ({ ...prev, notificationtoken: token}));
            }
        };

        setToken();
    }, []);

    useEffect(() => {
        return () => {
            // Cleanup any picker references
            setProfileData(prev => ({...prev}));
        };
    }, []);

    return (
        <>
                {!submittingRegistration && 
                    <View style={[styles.box, { top: 190 + insets.top, bottom: 0, height: "80%"}]}>

                        <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    
                        {!termsVisible && (
                            <View style = {styles.narrowColumn}>
                                <Text style={styles.centerTextPadding}>Keep your account secure.</Text>
                                
                                
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="email address"
                                        value={profileData.email}
                                        onChangeText={(text) => handleChange('email', text.trim())}
                                        maxLength={96}
                                        //keyboardType="default"
                                        autoComplete="off"
                                    />
                                </View>
                                <View style={styles.formGroupOptions}>
                                    <Text style={styles.label}>Password</Text>
                                    <View style={[styles.passwordContainer]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="password (8+ chars)"
                                            value={profileData.password}
                                            onChangeText={(text) => handleChange('password', text.trim())}
                                            secureTextEntry={!showPassword}
                                            autoComplete="off"
                                        />
                                        
                                    </View>
                                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.show}>
                                            <Text style={styles.showHide}>{showPassword ? "Hide" : "Show"}</Text>
                                        </TouchableOpacity>
                                </View>

                                {(!profileData.notificationtoken || typeof profileData.notificationtoken !== 'string') && <Text style={styles.centerTextPadding}>To opt in for notifications when new Tix offers are available in your locations, update your device application settings.</Text>}
                                
                                <TouchableOpacity style={[getButtonStyle()]} onPress={() => setTermsVisible(true)} >
                                    <Text style={[getButtonTextStyle()]}>Terms and Conditions</Text>
                                </TouchableOpacity>

                                <Text style={styles.centerText}>Please accept our terms and conditions to use the DRINX™ app.</Text>
                                
                            </View>
                        )}
                        <TermsModal termsVisible={termsVisible} handleTermsClick={handleTermsClick} />
                    </ScrollView>
                </View>
            }
        
            {submittingRegistration && 
                <View style={[{ top: 190 + insets.top, bottom: 0, height: "80%"}]}>
                    <View style={styles.centerProcessingText} ><Text style={styles.centerTextWhite} >Submitting Registration</Text>
                    <ActivityIndicator color="#fff" />
                    </View>
                </View>
            }
        
        </>

    );
};

export default RegistrationPage4;