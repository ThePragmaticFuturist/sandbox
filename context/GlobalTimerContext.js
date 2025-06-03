//Global Timer
import React, { createContext, useState, useMemo, useContext } from 'react';
import { GlobalTimerContext } from './SharedContext';

export const GlobalTimer = React.memo(({ children }) => {
  //console.log('resetting GlobalTimer variables');
  
  const [timerVisible, setTimerVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const contextValue = useMemo(() => ({
    timerVisible, 
    setTimerVisible,
    isActive, setIsActive
  }), [
    timerVisible, 
    setTimerVisible,
    isActive, setIsActive
  ]);

  return (
    <GlobalTimerContext.Provider value={contextValue}>
      {children}
    </GlobalTimerContext.Provider>
  );
});

export default GlobalTimer;