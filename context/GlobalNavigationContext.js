//navigation context
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { GlobalNavigationContext, useGlobalFeedbackContext, useGlobalContext } from './SharedContext';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { 
  accessDatabase, 
  validateDOB, 
  validateEmail, 
  validateUSZipCode,   
  getLatLong, 
  newUserData, 
  getOperatingHours,
  dateToDbString,
  dbStringToDate,
} from '../components/apputilities';

export const GlobalNavigation = React.memo(({ children }) => {
  //console.log('resetting GlobalNavigation variables');

  const { setFeedback } = useGlobalFeedbackContext();
  const { profileData, setProfileData, currentView, setCurrentView, oldView, setOldView, tixMode, setTixMode, loggedIn, setSubmittingRegistration} = useGlobalContext(); 
  
  const [loadingPage, setLoadingPage] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [profileFormEnabled, setProfileFormEnabled] = useState(false);
  const profileDataRef = useRef({...newUserData});
  const [editProfile, setEditProfile] = useState(false);

  const router = useRouter();

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

  const registrationNavigate = useCallback(async (direction) => {
    if (direction > 0) {
      let nextStep = registrationStep;

      // console.log(nextStep);

      switch (registrationStep) {
        case 1:
          setFeedback('');
          nextStep = 2;
          setRegistrationStep(2);
          break;

        case 2:
          if (!profileData.dob) {
            setFeedback("Date of birth is required");
            await navigate("Registration");
            break;
          }

          if (!validateDOB(profileData.dob)) {
            setFeedback("You must be >= 21 yrs old to use this app.");
            await navigate("Registration");
            break;
          }

          setProfileData(prevState => ({
            ...prevState,
            dob: profileData.dob
          }));

          if (!profileData.firstname) {
            setFeedback("First Name is required");
            await navigate("Registration");
            break;
          }
          
          if (!profileData.lastname) {
            setFeedback("Last Name is required");
            await navigate("Registration");
            break;
          }

          // console.log('chckpoint');

          setFeedback('');
          nextStep = 3;
          setRegistrationStep(3);

          break;

        case 3:
          const validatedZipcode = await validateUSZipCode(profileData.zipcode);
          console.log('validatedZipcode', validatedZipcode);

          if (!validatedZipcode) {
            setFeedback("You must enter a valid zipcode.");
            await navigate("Registration");
            break;
          }

          const zipLatLong = await getLatLong(validatedZipcode);

          console.log('zipLatLong', zipLatLong);

          if (!zipLatLong){
            setFeedback("You must enter a valid zipcode.");
            await navigate("Registration");
            break;
          } else {
            setProfileData(prevState => ({
              ...prevState,
              zipcode: validatedZipcode,
              lat: zipLatLong.lat,
              long: zipLatLong.long,
              radius: prevState.radius || 5
            }));
          }

          const validatedTravelZip = await validateUSZipCode(profileData.travelzip);

          console.log('validatedTravelZip', validatedTravelZip);

          if (validatedTravelZip) {
            const travLatLong = await getLatLong(validatedTravelZip);

            if (!travLatLong){
              setFeedback("Invalid Travel zipcode.");
              await navigate("Registration");
              break;
            } else {
              setProfileData(prevState => ({
                ...prevState,
                travelzip: validatedTravelZip,
                travel_lat: travLatLong.lat,
                travel_long: travLatLong.long
              }));
            }
          } else {
            setProfileData(prevState => ({
              ...prevState,
              travelzip: '',
              travel_lat: 0,
              travel_long: 0
            }));
          }

          console.log('after zip');

          setFeedback('');
          nextStep = 4;
          setRegistrationStep(4);

          break;

        case 4:
          loggedIn.current = false;

          const userName = validateEmail(profileData.email);

          if (!userName || userName === ''){
            setFeedback("Please enter a valid email address.");
            await navigate("Registration");
            break;
          } 

          setProfileData(prevState => ({
              ...prevState,
              password: profileData.password.trim(),
              email: userName,
          }));

          //console.log("profileData.password", profileData.password);

          if (!profileData.password || profileData.password.length < 8 ){
            setFeedback("Password minimum of 8 chars.");

            setProfileData(prevState => ({
              ...prevState,
              password: ''
            }));

            await navigate("Registration");
            break;
          } 

          setFeedback("");

          setSubmittingRegistration(true);

          const statement = {
              Statement: `SELECT * FROM patrons WHERE (email=?)`,
              Parameters: [profileData.email.toLowerCase()],
            };
              
          const patronRequest = {'tableName':'none', 'action':'execute', 'keypair':{}, 'content':statement};
          const patronRegistration = await accessDatabase(patronRequest); 

          if (patronRegistration && (patronRegistration.length > 0)){
              setFeedback("This email is already in use.");
              setSubmittingRegistration(false);
              await navigate("Registration");
              break;
          }  

          const today = new Date();
          const patronId = today.getTime();
          const registrationNumber = today.toISOString().split('T')[0];
          const originationPoint = 0;

          // console.log(today, patronId, registrationNumber, originationPoint);

          const newProfileData = {
            ...profileData,
            email: profileData.email.toLowerCase(),
            password: profileData.password,
            "patron-id": patronId,
            registration: registrationNumber,
            origination: originationPoint
          };

          const data = {'tableName':'"patrons"', 'action':"insert", 'keypair':{"email": profileData.email.toLowerCase()}, 'content':newProfileData};
          const result = await accessDatabase(data);

          // console.log(JSON.stringify(result, null, 2));

          if (result.httpStatusCode === 200 || result.length) {
            setProfileData(newProfileData);

            loggedIn.current = true;

            setFeedback('Registration successful.');

            //await initializeNotificationsWithRetry();
            await initializeNotifications();

            await navigate('Login');
            nextStep = 1;
            setRegistrationStep(1);

            setFeedback('Registration successful.');
          } else {
            setFeedback(result.httpStatusCode);
            setSubmittingRegistration(false);
            await navigate("Registration");
            break;
          }

          break;

        default:
          return false;
      }

      //console.log("gone forward", registrationStep, nextStep);

    } else {
      setFeedback('');

      //console.log("gone back", registrationStep);

      if (registrationStep > 1){
        setRegistrationStep(prevState => prevState + direction);
      } else {
        await navigate(true, "Login");
        setRegistrationStep(1);
      }
    }
  }, [registrationStep, profileData, navigate, setFeedback]);

  const navigate = useCallback(async (where, forced) => {
    // console.log('navigating to', (where || forced), 'from', currentView);
    // console.log(currentView, where, forced);

    //   console.log(oldView, currentView);

      setOldView(currentView);
    
    if (forced) {
        await router.push(`/${forced.toLowerCase()}`);
        setCurrentView(forced);
        // console.log('going to', forced);
      } else if (currentView !== where){
      router.push(`/${where.toLowerCase()}`);
      setCurrentView(where);
      // console.log('going to', where);
    }


  }, [currentView, oldView, setOldView, router]);

  const contextValue = useMemo(() => ({
    registrationStep,
    setRegistrationStep,
    registrationNavigate,
    navigate,
    editProfile,
    setEditProfile,
    loadingPage,
    setLoadingPage,
    profileFormEnabled, 
    setProfileFormEnabled,
    tixMode,
    setTixMode,
  }), [
    registrationStep,
    setRegistrationStep,
    registrationNavigate,
    navigate,
    editProfile,
    setEditProfile,
    loadingPage,
    setLoadingPage,
    profileFormEnabled, 
    setProfileFormEnabled,
    tixMode,
    setTixMode,
  ]);

  return (
    <GlobalNavigationContext.Provider value={contextValue}>
      {children}
    </GlobalNavigationContext.Provider>
  );
});

export default GlobalNavigation;