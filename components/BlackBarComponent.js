import React, { useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions } from 'react-native';
import { useGlobalFeedbackContext, versionNumber } from '../context/RootContext';

const BlackBarComponent = React.memo(() => {
  const { blackBarLink, feedback, elipses } = useGlobalFeedbackContext();

  const [dots, setDots] = useState('');

  const openWindowURL = useCallback(() => {
    if (blackBarLink && blackBarLink.length > 0) {
      Linking.openURL(blackBarLink);
    }
  }, [blackBarLink]);

  const updateDots = useCallback(() => {
    setDots(prevDots => (prevDots.length < 3 && elipses && feedback.length > 1 && feedback !== versionNumber) ? prevDots + '.' : '');
  }, [elipses, setDots]);

  useEffect(() => {
    const intervalId = setInterval(updateDots, 250);
    return () => clearInterval(intervalId);
  }, [updateDots]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openWindowURL}>
        <Text style={styles.feedback}>
          <Text>{feedback + dots}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: "100%",
  },
  feedback: {
    width: '100%',
    textAlign: 'center',
    color: 'white',
    backgroundColor: 'black',
    fontWeight: 'bold',
    zIndex: 20,
    fontSize: 12, // Using a numeric value instead of 'small'
  } 
});

export default BlackBarComponent;