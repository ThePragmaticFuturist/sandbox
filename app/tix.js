// //tix.js
import React, { useEffect, useContext, useCallback, memo } from 'react';
import { View, StyleSheet, ImageBackground, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TixSelector from '../components/TixSelector';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalNavigationContext } from '../context/RootContext';

const MemoizedTixSelector = memo(TixSelector);

const Tix = () => {
  const { 
    allOffers, 
    offerIndex, 
    bars, 
    pixSelection, 
    setTixOffers,
    setTixIndex,
    tixMode,
  } = useGlobalContext();

  const { 
    setLoadingPage, 
  } = useGlobalNavigationContext();

  const {  
    setElipses,
    setFeedback 
  } = useGlobalFeedbackContext();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    setElipses(false);
    setLoadingPage(false);

    return () => {
      setElipses(false);
      setFeedback('');
    };
  }, [setLoadingPage, setElipses, setFeedback]);

  return (
    <ImageBackground source={require('../assets/images/chalkboard.jpg')} style={styles.container, {position: 'absolute',width: '100%',
    top: insets.top, bottom: insets.bottom,
  }}>
      <View style={styles.container}>
      <View style={styles.contentContainer}>
        <MemoizedTixSelector />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    minHeight: 480,
    overflow: 'hidden',
    left: 0,
    top: 0,
  },
  contentContainer: {
    flex: 1,
    marginTop: 200,
    marginBottom: 160,
    paddingHorizontal: '5%',
  },
});

export default React.memo(Tix);