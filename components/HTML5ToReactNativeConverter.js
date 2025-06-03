import React from 'react';
import { ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import HTMLView from 'react-native-htmlview';

export default function HTML5ToReactNativeConverter({ htmlContent = '<p>No directions available.</p>' }){
  
  const { width } = useWindowDimensions();

  const mixedStyle = StyleSheet.create({
    div: {
      whiteSpace: 'normal',
      color: '#fff',
      fontSize: 20,
    },
    span: {
      whiteSpace: 'normal',
      color: '#fff',
      fontSize: 15,
    },
    h1: {
      whiteSpace: 'normal',
      color: '#fff',
      fontSize: 36,
      textAlign: 'center',
    },
  });

  return (
    <ScrollView style={{ flex: 1 }}>
      <HTMLView
        value={htmlContent}
        stylesheet={mixedStyle}
      />
    </ScrollView>
  );
};