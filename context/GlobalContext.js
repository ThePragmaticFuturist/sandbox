// // GlobalContext.js Client App
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { AppState, Platform, Keyboard, Alert  } from 'react-native';
import { GlobalContext, useGlobalFeedbackContext, useGlobalAudioContext, useGlobalNavigationContext } from './SharedContext';
import * as Device from 'expo-device';
import { invoiceSelectedTix } from '../components/stripe';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { useForegroundTimer } from '../components/useForegroundTimer';

import { 
  accessDatabase, 
  validateDOB, 
  validateEmail, 
  validateUSZipCode,   
  getLatLong, 
  newUserData, 
  getOperatingHours,
  checkProximity,
  dynamoDBToForm,
  dateToDynamoDB
} from '../components/apputilities';

const NOTIFICATION_CHANNEL_ID = 'drinx_notifications';
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
const BACKGROUND_TASK_NAME = 'BACKGROUND_TASK_NAME';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const BACKGROUND_FETCH_TASK = 'background-data-refresh';
const MINIMUM_FETCH_INTERVAL = 15; // in minutes

// Define notification categories
Notifications.setNotificationCategoryAsync('task', [
  { identifier: 'complete', buttonTitle: 'Complete Task', options: { opensAppToForeground: true } },
  { identifier: 'delay', buttonTitle: 'Delay Task', options: { opensAppToForeground: true } },
]);

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const foregroundPresentation = {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };

    if (Platform.OS === 'android') {
      return {
        ...foregroundPresentation,
        priority: Notifications.AndroidNotificationPriority.MAX,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          color: '#FF231F7C',
          priority: 'max',
          sticky: false,
          ongoing: false,
          vibrate: [0, 250, 250, 250],
        }
      };
    }

    return foregroundPresentation;
  }
});


const initializeNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      await Notifications.deleteNotificationChannelAsync(NOTIFICATION_CHANNEL_ID);
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Drinx Notifications',
        description: 'Receive notifications about new offers and updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    } catch (error) {
      console.error('Error setting up notification channel:', error);
    }
  }
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background fetch started');
    // Remove platform check to allow both iOS and Android
    await initializeData();
    console.log('Background fetch completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const GlobalProvider = React.memo(({ children }) => {
  const { setFeedback, setElipses } = useGlobalFeedbackContext();
  const { audioPlayer } = useGlobalAudioContext();
  const router = useRouter();

  const [bars, setBars] = useState([]);
  const [pixKeys, setPixKeys] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [offerIndex, setOfferIndex] = useState(0);
  const [tixOffers, setTixOffers] = useState([]);
  const [tixIndex, setTixIndex] = useState(0);
  const [pixSelection, setPixSelection] = useState(0);
  const [tixMode, setTixMode] = useState(true);
  const [activeOffers, setActiveOffers] = useState([]);
  const [selectingTix, setSelectingTix] = useState(false);
  const [profileData, setProfileData] = useState({ ...newUserData });
  const [currentView, setCurrentView] = useState('Login');
  const [oldView, setOldView] = useState('Login');
  const initializedRef = useRef(false);
  const profileDataRef = useRef({...newUserData});
  const notificationListener = useRef();
  const responseListener = useRef();
  const latestProfileDataRef = useRef(profileData);
  const loggedIn = useRef(false);
  const appState = useRef(AppState.currentState);
  const keyboardVisible = useRef(false);
  const lastNotificationId = useRef(0);

  const [submittingRegistration, setSubmittingRegistration] = useState(false);

  const navigate = useCallback(
    async (where, forced) => {
      // console.log(currentView, where, forced);

      // console.log(oldView, currentView);

      setOldView(currentView);

      if (forced) {
        await router.push(`/${forced.toLowerCase()}`);
        setCurrentView(forced);
      } else if (currentView !== where) {
        await router.push(`/${where.toLowerCase()}`);
        setCurrentView(where);
      }
    },
    [currentView, oldView, setOldView, router]
  );

  const initializeData = useCallback(
    async (newProfile) => {
      setElipses(true);

      //console.log('initializeData', oldView);
      
      if (oldView === 'Login'){
        setFeedback('Initializing Data');
      } else {
        setFeedback('Updating Data');
      }
      

      if (!newProfile) {
        newProfile = { ...profileData };
      }

      const previousCount = newProfile.notify_count;

      const { workingbars, currentKeys } = await currentPix(newProfile);
      const { newOffers } = await getNewOffers(currentKeys, newProfile);

      setBars(workingbars);
      setPixKeys(currentKeys);
      setAllOffers(newOffers);

      if (previousCount !== newOffers.length){
        if (newOffers.length > 0) {
          audioPlayer(require('../assets/sounds/cooler.mp3'));
        }

        Notifications.setBadgeCountAsync(newOffers.length);

        setProfileData(prevState => ({
          ...prevState,
          notify_count: newOffers.length
        }));

        const statements = [
          {
            Statement: `UPDATE "patrons" SET "notify_count"=? WHERE "patron-id"=?`,
            Parameters: [newOffers.length, newProfile["patron-id"]],
          },
        ];

        const data = {'tableName':'none', 'action':'batch', 'keypair':{}, 'content':statements};
        await accessDatabase(data);
      }

      setElipses(false);
      setFeedback('');
    },
    [profileData, oldView, audioPlayer, setElipses, setFeedback]
  );

  const registerBackgroundFetch = async () => {
    try {
      // Check if the device supports background fetch
      const available = await BackgroundFetch.getStatusAsync();
      if (available !== BackgroundFetch.BackgroundFetchStatus.Available) {
        console.log('Background fetch is not available on this device');
        return;
      }

      // Unregister any existing tasks first
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (isRegistered) {

        console.log('isRegistered', isRegistered);
        //await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      }

      // Register the task with proper error handling
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: MINIMUM_FETCH_INTERVAL * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Verify registration
      const verifyRegistration = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (verifyRegistration) {
        console.log('Background fetch registered successfully');
        
        // Set up minimum interval
        await BackgroundFetch.setMinimumIntervalAsync(MINIMUM_FETCH_INTERVAL * 60);
      } else {
        console.log('Failed to verify background fetch registration');
      }
    } catch (error) {
      console.log('Failed to register background fetch:', error);
    }
  };

  const handleNotification = useCallback(async (notification) => {
    if (!notification?.request?.content?.data) {
      console.log("Invalid notification data received");
      return;
    }

    const notificationId = notification.request.content.data.id;
    
    if (lastNotificationId.current !== notificationId) {
      console.log("Handling notification:", notificationId);
      lastNotificationId.current = notificationId;
      await initializeData(latestProfileDataRef.current);
    } else {
      console.log("Notification already handled:", notificationId);
    }
  }, [initializeData, lastNotificationId]);

  const refreshData = useCallback(async () => {
    console.log('Executing 15-minute refresh');
    try {
      await initializeData(latestProfileDataRef.current);
    } catch (error) {
      console.error('Error in 15-minute refresh:', error);
    }
  }, [initializeData, latestProfileDataRef]);

  // Initialize the timer hook
  const { startTimer, stopTimer } = useForegroundTimer(refreshData, loggedIn.current);

  useEffect(() => {
    const keyboardDidShow = () => (keyboardVisible.current = true);
    const keyboardDidHide = () => (keyboardVisible.current = false);

    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      keyboardDidShow
    );
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      keyboardDidHide
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (loggedIn.current && oldView !== 'Login' && currentView !== 'Login'){
      //console.log("set up app state", currentView);

      const subscription = AppState.addEventListener('change', async (nextAppState) => {
        console.log(appState.current, nextAppState);

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          //console.log('app state', 'initializeData');
          await initializeData();
        } 

        appState.current = nextAppState;
      });

      //console.log("subscription", 'registered');

      // Cleanup
      return () => {
        //console.log("remove app state");
        subscription.remove();
      };
    }
  }, [loggedIn.current, currentView]);

  useEffect(() => {
    const setupNotifications = async () => {
      // Initialize notification channel

      await initializeNotificationChannel();

      // Listen for user interaction with notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        handleNotification(response.notification);
      });

      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        handleNotification(notification);
        setFeedback('');
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    const setupBackgroundTasks = async () => {
      if (loggedIn.current) {
        await registerBackgroundFetch();
      }
    };

    setupBackgroundTasks();

    // Clean up on unmount
    return () => {
      const cleanup = async () => {
        try {
          const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
          if (isRegistered) {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
            console.log('Background fetch unregistered successfully');
          }
        } catch (error) {
          console.error('Failed to unregister background fetch:', error);
        }
      };
      cleanup();
    };
  }, [loggedIn.current]);

  useEffect(() => {
    if (loggedIn.current) {
      latestProfileDataRef.current = { ...profileData };
    }
  }, [profileData]);

  const contextValue = useMemo(() => ({
    startForegroundRefresh: startTimer,
    stopForegroundRefresh: stopTimer,
    bars,
    setBars,
    pixKeys,
    setPixKeys,
    currentView,
    setCurrentView,
    oldView,
    setOldView,
    allOffers,
    setAllOffers,
    activeOffers,
    setActiveOffers,
    offerIndex, 
    setOfferIndex,
    pixSelection, 
    setPixSelection,
    tixOffers, 
    setTixOffers,
    tixIndex, 
    setTixIndex,
    tixMode, 
    setTixMode,
    profileData,
    setProfileData, 
    profileDataRef,
    initializeData,
    latestProfileDataRef,
    loggedIn,
    setSelectingTix,
    navigate,
    submittingRegistration, 
    setSubmittingRegistration,
  }), [
    startTimer,
    stopTimer,
    bars,
    setBars,
    pixKeys,
    setPixKeys,
    currentView,
    setCurrentView,
    oldView,
    setOldView,
    allOffers,
    setAllOffers,
    activeOffers,
    setActiveOffers,
    offerIndex, 
    setOfferIndex,
    pixSelection, 
    setPixSelection,
    tixOffers, 
    setTixOffers,
    tixIndex, 
    setTixIndex,
    tixMode, 
    setTixMode,
    profileData,
    setProfileData, 
    profileDataRef,
    initializeData,
    latestProfileDataRef,
    loggedIn,
    setSelectingTix,
    navigate,
    submittingRegistration, 
    setSubmittingRegistration,
  ]);

  return <GlobalContext.Provider value={contextValue}>{children}</GlobalContext.Provider>;
});

export default React.memo(GlobalProvider);

///////////////////////////////////////

const currentPix = async (profileData) => {
  const currentDate = dateToDynamoDB(new Date());

  const workingbars = [];
  const currentKeys = [];

  const pixData = {
    'tableName':'"tix-status"."patron-id-index"', 
    'action':"query", 
    'keypair':{"patron-id": profileData["patron-id"]}, 
    'content':{"query":`"expirationdate" >= '${currentDate}'`, "conjunction": "AND"}
  };

  const allSelections = await accessDatabase(pixData);

  for (let i = 0; i < allSelections.length; i++) {
    let record = allSelections[i];

    if (currentKeys.indexOf(record.keyroot)<0){
      currentKeys.push(record.keyroot);
    }
  }

  for (let i = 0; i < allSelections.length; i++) {
    //console.log("pix data " + i);
    let record = allSelections[i];

    if (record.redeemed === "no") {

      const barData = {'tableName':'"bars"', 'action':"select", 'keypair':{"email": record["bar-id"]}, 'content':{} };
      const thisBar = await accessDatabase(barData);

      try {
        const isInProximity = await checkProximity(thisBar, profileData);

        if (isInProximity) {
          let tixKeyroot = {
            'tableName':'"tix"."bar-id-index"', 
            'action':"query", 
            'keypair':{"bar-id": thisBar[0]["email"]}, 
            'content':{"query":`"id" = '${record.keyroot}'`, "conjunction": "AND"}
          };
          
          let tixDetails = await accessDatabase(tixKeyroot);

          //updates tix details with bar information
          record = updateRecord(record, thisBar, tixDetails);

          workingbars.push(record);
        }
        
      } catch (error) {
        console.error("Error checking proximity:", error);
        return false
      }
    }
  }

  //console.log("workingbars", workingbars, "currentKeys", currentKeys);

  return {"workingbars": workingbars, "currentKeys": currentKeys} 
};

const updateRecord = (record, thisBar, tixDetails) => {
  //console.log("updateRecord", thisBar[0].name);
  const opHours = getOperatingHours();

  record["bar_name"] = thisBar[0].name;
  record["customer_id"] = thisBar[0].customer_id;
  record["selected_id"] = thisBar[0].selected_id;
  record["redeemed_id"] = thisBar[0].redeemed_id;
  record["bar_gps_lat"] = parseFloat(thisBar[0].lat);
  record["bar_gps_long"] = parseFloat(thisBar[0].long);

  if (!thisBar[0].logo || thisBar[0].logo === ''){
    record["bar_logo"] = "https://drinximages.s3.amazonaws.com/ticket.png"; //default ticket
  } else {
    record["bar_logo"] = thisBar[0].logo;
  }

  record["photo"] = tixDetails[0]["photo"];
  record["description"] = tixDetails[0]["description"];
  record["name"] = tixDetails[0]["name"];

  record["open"] = thisBar[0][`${opHours.openDay.toLowerCase()}_open`];
  record["close"] = thisBar[0][`${opHours.closeDay.toLowerCase()}_close`];

  return record
};

const getNewOffers = async (currentKeys, profileData) => {

  const todaysDate = dateToDynamoDB(new Date());
  
  const tixData = {'tableName':'"tix-status"."patron-id-index"', 'action':"query", 'keypair':{"patron-id": 0}, 'content':{"query":`"expirationdate" >= '${todaysDate}'`, "conjunction": "AND"}}; //AND "launchdate" <= '${todaysDate}'
  const nowOffers = await accessDatabase(tixData);

  const oneOfEach = [];
  const newOffers = [];

  for (let i = 0; i < nowOffers.length; i++) {
    let record = nowOffers[i];

    if (oneOfEach.indexOf(record.keyroot)<0 && currentKeys.indexOf(record.keyroot)<0){
      let data = {'tableName':'"bars"', 'action':"select", 'keypair':{"email": record["bar-id"]}, 'content':{}};
      let thisBar = await accessDatabase(data);

      //try {
        const isInProximity = await checkProximity(thisBar, profileData);

        if (isInProximity) {
          let tixKeyroot = {'tableName':'"tix"', 'action':"select", 'keypair':{"id": record["keyroot"]}, 'content':{}};
          let tixDetails = await accessDatabase(tixKeyroot);

          record = updateRecord(record, thisBar, tixDetails);

          newOffers.push(record);
          oneOfEach.push(record.keyroot);
        }
        
      // } catch (error) {
      //   console.error("Error checking proximity:", error);
      // }
    }
  }

  return {"newOffers": newOffers} 
};