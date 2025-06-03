import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ImageBackground, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useGlobalContext, useGlobalTimerContext, useGlobalAudioContext } from '../context/RootContext';
import { haversine, accessDatabase } from '../components/apputilities';
import { invoiceRedeemedTix } from '../components/stripe';

const TIMER_DURATION = 5 * 60; // 5 minutes in seconds

const CountdownModal = () => {
  const { bars, pixSelection, setBars, initializeData, setCurrentView, currentView, setOldView } = useGlobalContext();
  const { timerVisible, setTimerVisible, isActive, setIsActive } = useGlobalTimerContext();
  const { audioPlayer } = useGlobalAudioContext();

  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);

  const shouldResetRef = useRef(false);

  const navigate = useCallback(async () => {
    setIsActive(false);
    setTimerVisible(false);
    setTimeLeft(0);
    setOldView(currentView)
    setCurrentView("Pix");
    router.push('/pix');
    setIsActive(false);
  }, [setTimerVisible, setCurrentView, currentView, router]);

  const handleClick = useCallback(async () => {
    setIsActive(false);
    setTimerVisible(false);
    setTimeLeft(0);
    audioPlayer(require('../assets/sounds/beerpour.mp3'));

    try {
      const oldBarValues = [...bars];
      const today = new Date().toISOString().split('T')[0];

      oldBarValues[pixSelection].redeemed = today;

      const tixData = { 'tableName': '"tix-status"', 'action': "update", 'keypair': { "id": oldBarValues[pixSelection].id }, 'content': { "redeemed": today } };
      await accessDatabase(tixData);

      let tixKeyroot = { 'tableName': '"tix-per-bar"', 'action': "select", 'keypair': { "id": oldBarValues[pixSelection].keyroot }, 'content': {} };
      let tixDetails = await accessDatabase(tixKeyroot);

      await invoiceRedeemedTix(oldBarValues[pixSelection].customer_id, oldBarValues[pixSelection].redeemed_id, tixDetails[0].name);

      setBars([...oldBarValues]);
      await navigate();
    } catch (error) {
      console.error('Error in handleClick:', error);
      setTimeLeft(0);
    }
  }, [bars, pixSelection, audioPlayer, setBars, navigate]);

  const formatCountdownTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [timeLeft]);

  useEffect(() => {
    if (timerVisible) {
      setIsActive(true);
      setTimeLeft(TIMER_DURATION);
    } else {
      setIsActive(false);
      setTimeLeft(0);
    }
  }, [timerVisible]);

  useEffect(() => {
    let interval;
    if (isActive && timerVisible) {
      interval = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft <= 1) {
            clearInterval(interval);
            shouldResetRef.current = true;
            return 0;
          }
          return prevTimeLeft - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timerVisible]);

  // Separate effect to handle state resets
  useEffect(() => {
      if (shouldResetRef.current && timeLeft <= 0) {
        shouldResetRef.current = false;
        setIsActive(false);
        setTimerVisible(false);
      }
  }, [timeLeft]);


  if (!timerVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity onPress={handleClick}>
      <ImageBackground 
        source={require('../assets/images/bartenders.png')} 
        style={styles.container}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.contentContainer}>
          <View style={styles.timerModal}>
            
              <Text style={styles.timerMessageFont}>Go see the bartender. You have {formatCountdownTime()} to redeem your Tix.</Text>
            
          </View>
        </View>
      </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 320,
    height: 320,
    borderRadius: 10,
    overflow: 'hidden',
  },
  backgroundImage: {
    borderRadius: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  timerModal: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
    borderRadius: 10,
    marginHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  timerMessageFont: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: "white",
    fontSize: 24,
    //marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  }
});

export default React.memo(CountdownModal);