//feedback
import React, { createContext, useState, useMemo, useRef, useCallback } from 'react';
import { GlobalFeedbackContext, versionNumber } from './SharedContext';

export const GlobalFeedback = React.memo(({ children }) => {
  const [blackBarLink, setBlackBarLink] = useState("");
  const [elipses, setElipses] = useState(false);

  const [feedback, setFeedback] = useState(versionNumber);

  const contextValue = useMemo(() => ({
    blackBarLink, 
    setBlackBarLink,
    elipses, 
    setElipses,
    feedback,
    setFeedback
  }), [
    blackBarLink, 
    setBlackBarLink,
    elipses, 
    setElipses,
    feedback,
    setFeedback
  ]);

  return (
    <GlobalFeedbackContext.Provider value={contextValue}>
      {children}
    </GlobalFeedbackContext.Provider>
  );
});

export default GlobalFeedback;