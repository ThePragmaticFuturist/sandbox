//audio
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { GlobalAudioContext } from './SharedContext';

export const GlobalAudio = React.memo(({ children }) => {
  //console.log('resetting GlobalAudio variables');
  
  const audioPlayerObj = useRef(new Audio.Sound());
  const audioSync = useRef(false);

  const audioPlayer = useCallback(async (soundFile) => {
    try {
      if (audioPlayerObj.current._loaded) {
        await audioPlayerObj.current.unloadAsync();
      }

      //console.log("audio " + soundFile);

      const source = typeof soundFile === 'string' ? { uri: soundFile } : soundFile;
      const status = await audioPlayerObj.current.loadAsync(source, {}, true);

      if (status.isLoaded) {
        await audioPlayerObj.current.playAsync();
      } 
      
    } catch (e) {
      //
    }
  }, []);

  useEffect(() => {
    if (!audioSync.current){
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });

      audioSync.current = true;
    }

    return () => {
      audioSync.current = false;

      if (audioPlayerObj.current._loaded) {
        audioPlayerObj.current.unloadAsync();
      }
    };
  }, []);

	const contextValue = useMemo(() => ({
	    audioPlayer,
	  }), [
	    audioPlayer
	  ]);

	  return (
	    <GlobalAudioContext.Provider value={contextValue}>
	      {children}
	    </GlobalAudioContext.Provider>
	  );
});

export default GlobalAudio;
