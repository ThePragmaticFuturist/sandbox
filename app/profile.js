import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { Alert, Linking, View, Text, TextInput, Image, TouchableOpacity, Switch, StyleSheet, ScrollView, ImageBackground, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-datepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accessDatabase, 
        getLatLong, 
        validateEmail, 
        validateMobilePhoneNumber, 
        validateUSZipCode, 
        validateDOB,
        dynamoDBToDateObject,
        dateToDynamoDB } from '../components/apputilities';

import ImageUploader from '../components/ImageUploader';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import "../assets/react-datepicker.css";

import { useGlobalFeedbackContext, useGlobalContext, useGlobalNavigationContext } from '../context/RootContext';

const NOTIFICATION_CHANNEL_ID = 'drinx_notifications';

const scrollBarStyles = `
  ::-webkit-scrollbar {
    width: 12px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const formatMobile = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const GenderSelect = ({ value, onChange, disabled }) => (
  <View style={radiostyles.container}>
    <Text style={styles.label}>Gender</Text>
    <View style={radiostyles.optionsContainer}>
      {['none', 'male', 'female', 'other'].map(option => (
        <TouchableOpacity
          key={option}
          onPress={() => {if (!disabled){onChange('gender', option)}}}
          style={radiostyles.option}
        >
          <View style={[radiostyles.radio, value === option && radiostyles.radioSelected]}>
            {value === option && <View style={radiostyles.radioInner} />}
          </View>
          <Text style={[radiostyles.optionText, disabled && radiostyles.disabled]}>
            {option === 'none' ? 'Opt Out' : option.charAt(0).toUpperCase() + option.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const RadiusPicker = React.memo(({ value, onChange }) => (
    <Picker
        selectedValue={value}
        style={styles.picker}
        onValueChange={onChange}
    >
    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((value) => (
      <Picker.Item key={value} label={`${value} miles`} value={value.toString()} />
    ))}
    </Picker>
));

const Profile = React.memo(() => {
  const { 
    profileData, 
    setProfileData,  
    initializeData,
  } = useGlobalContext();

  const {  
    setFeedback,  
    setElipses, 
  } = useGlobalFeedbackContext();

  const { 
    navigate, 
    profileFormEnabled, 
    setProfileFormEnabled, 
    setLoadingPage, 
    loadingPage, 
  } = useGlobalNavigationContext();
  

  const [formData, setFormData] = useState({...profileData});

  const [showPassword, setShowPassword] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const childRef = useRef();

  const mounted = useRef(false);

  useEffect(() => {
      mounted.current = true;
      
      // Clean up when component unmounts
      return () => {
          mounted.current = false;
      };
  }, []);

  const saveNotificationsToken = async (token) => {
    if (token && profileData?.email) {
      const updatedata = {
        tableName: '"patrons"',
        action: "insert",
        keypair: { email: profileData.email.toLowerCase().trim() },
        content: { notificationtoken: token },
      };
      await accessDatabase(updatedata);
    }
  };

  const initializeNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
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
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
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

  const handleChange = useCallback(async (name, value) => {
    if (!mounted.current) return;
  
    if (name === 'zipcode'){
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      const validatedZipcode = await validateUSZipCode(value);
     
      if (validatedZipcode) {
        
        const zipLatLong = await getLatLong(validatedZipcode);

        console.log(validatedZipcode);

        if (zipLatLong){
          setFeedback("");

          setProfileData(prevState => ({
            ...prevState,
            zipcode: validatedZipcode,
            lat: zipLatLong.lat,
            long: zipLatLong.long,
            radius: prevState.radius || 5
          }));
        } else {
          setFeedback("You must enter a valid zipcode.");
        }

      } else {
        setFeedback("You must enter a valid zipcode.");
      }

    } else if (name === 'travelzip'){
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      const validatedTravelZip = await validateUSZipCode(value);

      if (validatedTravelZip) {
        const travLatLong = await getLatLong(validatedTravelZip);

        if (travLatLong){
          setFeedback("");
          
          setProfileData(prevState => ({
            ...prevState,
            travelzip: validatedTravelZip,
            travel_lat: travLatLong.lat,
            travel_long: travLatLong.long
          }));
          
        } else {
          setFeedback("Invalid Travel zipcode.");
        } 

      } else {
        setFeedback("Invalid Travel zipcode.");
      }

      

    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'dob') ? dateToDynamoDB(value) : 
                 (name === 'mobile') ? formatMobile(value) : 
                 value
      }));
    }
    
  }, [setFormData]);

  const enableProfileFields = useCallback(() => {
    if (!loadingPage) {
      setProfileFormEnabled(prev => !prev);
    }
  }, [loadingPage, setProfileFormEnabled]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const unsubscribeModal = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Do you want to permanently delete your account?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteProfile(),
          style: 'destructive', // iOS only
        },
      ],
      {
        cancelable: true, // Android only: allows you to tap outside to dismiss
        onDismiss: () => console.log('Alert dismissed'), // Called when alert is dismissed
      }
    );
  }, []);

  const handleCancel = useCallback(() => {
    setFormData({...profileData});
    //formData.current = {...profileData};
    setProfileFormEnabled(false);
  }, [profileData, setProfileFormEnabled]);

  const logoutUser = () => {
    AsyncStorage.multiRemove(['email', 'password'], err => {
      setProfileFormEnabled(false);
      navigate('Login');
    });
  }

  const deleteProfile = async () => {
    statements = [
            {
              Statement: `DELETE FROM "patrons" WHERE "email"=?`,
              Parameters: [profileData.email],
            },
          ];

    const data = {'tableName':'none', 'action':'batch', 'keypair':{}, 'content':statements};
    await accessDatabase(data);

    logoutUser();
  };

  const handleSave = useCallback(async () => {
    const sendData = {...formData};

    setSavingProfile(true);

    console.log("setFormData", JSON.stringify(sendData, null, 2));

    setFeedback('Saving profile');
    setElipses(true);

    const data = {'tableName':'"patrons"', 'action':"insert", 'keypair':{"email": sendData.email.toLowerCase()}, 'content':sendData};
    const result = await accessDatabase(data);

    if (result.httpStatusCode === 200 || result.length) {
      setProfileData({ ...sendData});
      setProfileFormEnabled(false);
      navigate('Pix');
    } else {
      setFeedback('Error saving profile.');
      setElipses(false);
      setSavingProfile(false);
    }

  }, [formData]);//, setFeedback, setElipses, setProfileData, setProfileFormEnabled, navigate

  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      handleChange('dob', selectedDate);
    }
  }, [handleChange]);

  const renderDatePicker = useCallback(() => {
    let dateValue = dynamoDBToDateObject(formData.dob);

    try {
      dateValue = new Date(dateValue);
      if (isNaN(dateValue.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      console.warn('Invalid date, using current date as fallback');
      dateValue = new Date();
    }

    const openDatePicker = () => {
      if (profileFormEnabled) {
        setShowDatePicker(true);
      }
    };

    if (Platform.OS === 'ios'){
      return (
          <View>
            <DateTimePicker
              testID="dateTimePicker"
              value={dateValue}
              mode="date"
              display="default"
              onChange={handleDateChange}
              disabled={!profileFormEnabled}
            />
        </View>
      );
        
    } else {

      return (
        <View>
          {!profileFormEnabled && <TouchableOpacity onPress={openDatePicker} disabled={!profileFormEnabled}>
            <View style={styles.datePickerButton}>
              <Text style={styles.graymediumText} >{dateValue.toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>}
          {profileFormEnabled && 
          <TouchableOpacity onPress={openDatePicker} disabled={!profileFormEnabled}>
            <View style={styles.datePickerButton}>
              <Text style={styles.blackText} >{dateValue.toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>}
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={dateValue}
              mode="date"
              display="default"
              onChange={handleDateChange}
              disabled={!profileFormEnabled}
            />
          )}
        </View>
      );
    }
  }, [formData.dob, profileFormEnabled, showDatePicker, handleDateChange]);


  useEffect(() => {
    setElipses(false);
    setLoadingPage(false);

    return () => {
      setProfileFormEnabled(false);
      setElipses(false);
      setFeedback('');
    };
  }, [setLoadingPage, setElipses, setFeedback, setProfileFormEnabled]);

  const memoizedDatePicker = useMemo(() => renderDatePicker(), [renderDatePicker]);

  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={require('../assets/images/chalkboard.jpg')} style={styles.container, {position: 'absolute',width: '100%',
    top: insets.top, bottom: 25,
  }}>
      {savingProfile && <View style={styles.centerContent} ><Text style={styles.centerText} >Saving Profile</Text><ActivityIndicator color="#fff" /></View>}
      {!savingProfile && <View style={styles.scrollContainer}>

        <View style={styles.form}>
          {!profileFormEnabled && (
              <View style={styles.options}>
                <TouchableOpacity style={[styles.editButton, styles.red]} onPress={unsubscribeModal}>
                  <Text style={styles.editButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={enableProfileFields}>
                  <Text style={styles.editButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.form}>
      
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={formData.firstname}
              onChangeText={(text) => handleChange('firstname', text.trim())}
              editable={profileFormEnabled}
              placeholder="<first name>"
              maxLength={40}
            />

              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastname}
                onChangeText={(text) => handleChange('lastname', text.trim())}
                editable={profileFormEnabled}
                placeholder="<last name>"
                maxLength={40}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleChange('email', text.trim())}
                editable={profileFormEnabled}
                placeholder="<email address>"
                maxLength={96}
                keyboardType="email-address"
              />

              <Text style={styles.label}>Birthdate</Text>
              <View style={styles.dob}>
                <View style={styles.datePickerContainer}>
                  {memoizedDatePicker}
                </View>
              </View>

              <GenderSelect 
                value={formData.gender}
                onChange={handleChange}
                disabled={!profileFormEnabled}
              />

              <Text style={styles.label}>Zipcode</Text>
              <TextInput
                style={styles.input}
                value={formData.zipcode}
                onChangeText={(text) => handleChange('zipcode', text.trim())}
                editable={profileFormEnabled}
                placeholder="12345"
                maxLength={5}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Zipcode Radius</Text>

              {(profileFormEnabled) && <RadiusPicker value={formData.radius || "5"} onChange={(itemValue) => handleChange('radius', itemValue)} />}
                    
              
              {(!profileFormEnabled) && <TextInput
                value={formData.radius} 
                enabled={false}
                editable={false}
                style={styles.input}
              />}

              <Text style={styles.label}>Travel Zipcode</Text>
              <TextInput
                style={styles.input}
                value={formData.travelzip}
                onChangeText={(text) => handleChange('travelzip', text.trim())}
                editable={profileFormEnabled}
                placeholder="Travel zipcode (optional)"
                maxLength={5}
                keyboardType="numeric"
              />

              {false && <>
                <Text style={styles.label}>Mobile #</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mobile}
                  onChangeText={(text) => handleChange('mobile', text.trim())}
                  editable={profileFormEnabled}
                  placeholder="(123) 456-7890"
                  maxLength={14}
                  keyboardType="phone-pad"
                />
              </>}

              {false && <View style={styles.switchContainer}>
                <Text style={styles.label}>SMS messages</Text>
                <Switch
                  value={formData.sms === true || formData.sms === "true"}
                  onValueChange={(value) => handleChange('sms', value)}
                  disabled={!profileFormEnabled}
                />
              </View>}

              {(!profileData.notificationtoken || typeof profileData.notificationtoken !== 'string') && <View style={styles.switchContainer}>
                <TouchableOpacity style={styles.buttonNotification} onPress={() => {Linking.openSettings()}}>
                  <Text style={styles.buttonText}>Click to Enable Tix Notifications</Text>
                </TouchableOpacity>
              </View>}

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(text) => handleChange('password', text.trim())}
                editable={profileFormEnabled}
                placeholder="password"
                secureTextEntry={!showPassword}
              />
              {profileFormEnabled && (
                <TouchableOpacity style={styles.eyeIcon} onPress={togglePasswordVisibility}>
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          {profileFormEnabled && (
            <>
              <TouchableOpacity style={styles.buttonSave} onPress={handleSave}>
                <Text style={styles.buttonText}>SAVE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonCancel} onPress={handleCancel}>
                <Text style={styles.buttonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonLogout} onPress={logoutUser}>
                <Text style={styles.buttonText}>LOGOUT</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>}
    </ImageBackground>
  );
});

export default Profile;

const radiostyles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  radioSelected: {
    borderColor: 'white',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  optionText: {
    fontSize: 16,
    color: 'white',
  },
  disabled: {
    opacity: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  scrollContainer: {
    flex: 1,
    paddingTop: 200,
    paddingBottom: 150,

  },
  scrollContent: {
    flexGrow: 1,
    showsVerticalScrollIndicator: true,
    indicatorStyle: { backgroundColor: 'red', width: 25 },
    persistentScrollbar: true,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  form: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  editButton: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: 'whitesmoke',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  editButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  red: {
    backgroundColor: 'indianred',
  },
  label: {
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  inputdate: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
  },
  datePickerContainer: {
        backgroundColor: 'white',
        padding: 0,
        borderRadius: 5,
        
  },
  datePickerButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    alignItems: 'left',
  },
  dateField: {
    backgroundColor: 'white',
    margin: 7,
    borderRadius: 5,
  },
  picker: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    zIndex: 20
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonCancel: {
    backgroundColor: 'indianred',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonSave: {
    backgroundColor: 'lightgreen',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonLogout: {
    backgroundColor: 'whitesmoke',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonNotification: {
    backgroundColor: 'whitesmoke',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    //marginHorizontal: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
  dob: {
    alignSelf: 'left',
    zIndex: 20
  },
  dobField: {
    width: '100%',
  },
  image: {
    width: 40,
  },
  imageContainer:{
    flex: 1,
    width: '100%',
    alignItems: 'center'
  },
  graymediumText:{
    color: 'lightgray',
  },
  blackText:{
    color: 'black',
  }
});