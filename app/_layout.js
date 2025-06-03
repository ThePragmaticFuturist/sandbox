// //_layout.js
import { useEffect, useState, useRef, memo, useContext, useCallback } from 'react';
import { Slot } from 'expo-router';
import { View, Text, AppState, SafeAreaView, BackHandler, StatusBar, Platform  } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { RootProvider} from '../context/RootContext';
import { useKeepAwake } from 'expo-keep-awake';
import { NetworkManager } from '../components/networkManager.js';
import * as SplashScreen from 'expo-splash-screen';
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import CountdownModal from '../components/CountdownModal.js';
// import BlackBarComponent from '../components/BlackBarComponent.js';
//import PolaroidClick from '../components/PolaroidClick.js'; 

import "../assets/body.css";

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillUpdate has been renamed',
  'Warning: Deprecated Prop Types',
  'Warning: TRenderEngineProvider',
]);

SplashScreen.preventAutoHideAsync();

const MemoizedHeader = memo(Header);
const MemoizedFooter = memo(Footer);

const MemoizedCountdownModal = memo(CountdownModal);
// const MemoizedBlackBarComponent = memo(BlackBarComponent);
//const MemoizedPolaroidClick = memo(PolaroidClick);

export default function RootLayout() {
  useKeepAwake();

  const [fontsLoaded, setFontsLoaded] = useState(false);

  async function loadFonts() {
    await Font.loadAsync({
      'Segoe Script': require('../assets/fonts/SegoeScript.ttf'),
    });
  }

  useEffect(() => {
    async function prepare() {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();

    NetworkManager.initialize();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        NetworkManager.attemptReconnection();
      }
    });

    // Cleanup listeners on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('black');
      StatusBar.setTranslucent(false);
    }
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Return true to prevent default behavior
        return true;
      }
    );

    // Cleanup on component unmount <MemoizedPolaroidClick />
    return () => backHandler.remove();
  }, []);

  return (
    <RootProvider>
      <View style={{ flex: 1, backgroundColor: 'black' }}>
          <Slot />
          <MemoizedHeader />
          <FooterWrapper />
          <MemoizedCountdownModal />
      </View>
    </RootProvider>
  );
}

// const FeedbackWrapper = () => <MemoizedBlackBarComponent />;
const FooterWrapper = () => <MemoizedFooter />;