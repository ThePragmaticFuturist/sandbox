// //index.js
import { useEffect, useContext, useCallback } from 'react';
import { TouchableOpacity, View, Text, ImageBackground, SafeAreaView, StyleSheet, Dimensions, TouchableNativeFeedback, Platform  } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

//import { useGlobalFeedbackContext, useGlobalContext, useGlobalNavigationContext  } from '../context/RootContext';
import { useGlobalNavigationContext, useGlobalFeedbackContext, useGlobalContext } from '../context/SharedContext';

export default function Index() {
  const { 
    setFeedback, 
    setElipses,
  } = useGlobalFeedbackContext();

  const { 
    navigate, 
  } = useGlobalNavigationContext();

  const { 
    setCurrentView, 
  } = useGlobalContext();

  const ButtonComponent = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

  useEffect(() => {
    setFeedback(' ');
    setElipses(false);
    setCurrentView('index');
    navigate('Login');
  }, [navigate]);

  return (
    <ImageBackground source={require('../assets/images/barbackground.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <ButtonComponent
          style={[styles.box, {width: Dimensions.get('window').width, height: Dimensions.get('window').height}]}
          onPress={() => {}}
          background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('rgba(255,255,255,0.2)', false) : undefined}
        >
          <View>
            <Text style={styles.buttonText}>&nbsp;</Text>
          </View>
        </ButtonComponent>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? 'bold' : '700',
    color: 'white',
    textAlign: 'center',
  },
});