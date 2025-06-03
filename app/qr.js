import React, { useContext, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, SafeAreaView } from 'react-native';
import * as Location from 'expo-location'; //expo install expo-location
import QRCodeScanner from '../components/QRCodeScanner';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalTimerContext, useGlobalNavigationContext } from '../context/RootContext';

import { haversine, dynamoDBToDate } from '../components/apputilities';

export default function Qr() {
  const { 
    bars, 
    setPixSelection,
    setTixIndex,
    setTixOffers
  } = useGlobalContext();

  const { 
    timerVisible, 
    setTimerVisible,
  } = useGlobalTimerContext();

  const {  
    setFeedback,
    setElipses 
  } = useGlobalFeedbackContext();

  const { 
    navigate, 
    loadingPage, 
    setLoadingPage,
    setTixMode, 
  } = useGlobalNavigationContext();

  const launchedAlready = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison

    const inputDate = dynamoDBToDate(dateString); 

    // Compare the dates
    return inputDate <= today;
  };

  const handleScan = async (data) => {
    // console.log('chkpt', loadingPage, timerVisible, data.toLowerCase());

    if (loadingPage || timerVisible ){
      return
    }

     if (data) {
      const today = new Date();

      for (let i=0; i<bars.length; i++){
        if (bars[i]['bar-id'].toLowerCase() === data.toLowerCase()){
          // console.log('scan', bars[i].name, bars[i].launchdate, launchedAlready(bars[i].launchdate));
          //patronIsInTheBar(bars[i]) && 

          if (launchedAlready(bars[i].launchdate)){
            setTixMode(false);
            setPixSelection(i);
            setTixIndex(i);
            setTixOffers([...bars]);
            setTimerVisible(true);
            navigate('Tix');
            setFeedback('');
            return;
          }
        }
      }
    }

    alert((data.toLowerCase() === "https://bit.ly/drinx-on-us") ? `That is an invalid QR code.` : `You do not have any active Tix for this bar.`);

    await navigate('Pix');
  };

  const patronIsInTheBar = async (bar) => {
    // console.log(bar["name"]);
    
    const distance = 2000;

    const showError = (error) => {
      setFeedback(error);
    };

    const getPosition = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setFeedback('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const proximity = haversine(
        parseFloat(location.coords.latitude),
        parseFloat(location.coords.longitude),
        bar["bar_gps_lat"],
        bar["bar_gps_long"]
      );

      if (proximity > distance) {
        // console.log("not in bar");
        return false
      } else {
        // console.log("in bar");
        return true
      }
    };

    getPosition();
  };

  useEffect(() => {
    setElipses(false);
    setLoadingPage(false);
  }, [setElipses, setFeedback]);

  return (
    <ImageBackground source={require('../assets/images/chalkboard.jpg')} style={styles.container}>
      <View style={styles.container}>
        <QRCodeScanner onScan={handleScan} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    minHeight: 480,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  scancontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camcontainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scannedData: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
  },
  scanner: {
    width: '100%',
    height: 'auto',
  },
  videoHide: {
    position: 'relative',
    zIndex: -1,
  },
  videoShow: {
    position: 'relative',
    zIndex: 1,
  },
});