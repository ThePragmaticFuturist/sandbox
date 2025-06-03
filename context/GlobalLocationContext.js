//location context
import React, { createContext, useState, useMemo, useContext, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { GlobalLocationContext, useGlobalContext, useGlobalFeedbackContext,  useGlobalNavigationContext} from './SharedContext';
import { Linking } from 'react-native';
import { accessDatabase } from '../components/apputilities';

export const GlobalLocation = React.memo(({ children }) => {
  //console.log('resetting GlobalLocation variables');
  const {
    profileData,
    setProfileData,
    currentView,
  } = useGlobalContext();

  const {
    setElipses,
    setFeedback,
  } = useGlobalFeedbackContext();

  const {
    navigate, 
  } = useGlobalNavigationContext();

  const [showDirections, setShowDirections] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [initializedMap, setInitializedMap] = useState(false);
  const [userLocation, setUserLocation] = useState({"latitude": profileData.lat, "longitude": profileData.long});

  // console.log('location profile', profileData.lat, profileData.long);

  const requestLocationPermission = async () => {
      let curState = await Location.requestForegroundPermissionsAsync();

      try {
        if ((curState.canAskAgain && !curState.granted)){
          if (locationPermissionGranted !== curState.granted){
            setInitializedMap(false);
          }
        // } else if (!curState.canAskAgain && !curState.granted && currentView === 'Registration') {
        //   Linking.openSettings();
        }
      } catch (error) {
        if (currentView === 'Registration') {
          console.log(error);
        }
      }

      setLocationPermissionGranted(curState.granted);

      return curState.granted;
  };


  const getLocation = useCallback(async (useFeedback) => {
    let perm = await requestLocationPermission();

    // console.log('perm', perm);

    // console.log("profileData", JSON.stringify(profileData, null, 2));

    if (!perm) {
      setElipses(false);
      setFeedback('');

      setUserLocation({"latitude": Number(profileData.lat), "longitude": Number(profileData.long)});

      return {"latitude": Number(profileData.lat), "longitude": Number(profileData.long)};

    } else {
      setElipses(true);

      //setFeedback('Getting location.');
      try {
        const location = await Location.getCurrentPositionAsync({});

        // console.log('location', location);

        location.latitude = Number(location.latitude);
        location.longitude = Number(location.longitude);

        setUserLocation({"latitude": Number(location.coords.latitude), "longitude": Number(location.coords.longitude)});

        setElipses(false);
        setFeedback('');

        return {"latitude": Number(location.coords.latitude), "longitude": Number(location.coords.longitude)} 
      } catch (error) {
        console.log('Error getting location:', error);

        setElipses(false);
        setFeedback('');

        setUserLocation({"latitude": Number(profileData.lat), "longitude": Number(profileData.long)})

        return {"latitude": Number(profileData.lat), "longitude": Number(profileData.long)};
      }
    }

  }, [setUserLocation, setLocationPermissionGranted, profileData]);//, setFeedback

  useEffect(() => {
    const locator = []; 

    if (locationPermissionGranted){
      // console.log("location started");
      locator[0] = setInterval(getLocation, 10000);
      getLocation(true);
    } else {
      setUserLocation({"latitude": Number(profileData.lat), "longitude": Number(profileData.long)});
      setInitializedMap(false);
      window.clearInterval(locator[0]);
    }

    return () => {
      window.clearInterval(locator[0]);
    }
  }, [getLocation, locationPermissionGranted, setInitializedMap]);

  const contextValue = useMemo(() => ({
    showDirections, 
    setShowDirections,
    locationPermissionGranted, 
    setLocationPermissionGranted,
    requestLocationPermission,
    userLocation, 
    setUserLocation,
    getLocation,
    initializedMap, 
    setInitializedMap,
  }), [
    showDirections, 
    setShowDirections,
    locationPermissionGranted, 
    setLocationPermissionGranted,
    requestLocationPermission,
    userLocation, 
    setUserLocation,
    getLocation,
    initializedMap, 
    setInitializedMap,
  ]);

  return (
    <GlobalLocationContext.Provider value={contextValue}>
      {children}
    </GlobalLocationContext.Provider>
  );
});

export default GlobalLocation;