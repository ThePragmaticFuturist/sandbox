import { createContext, useContext } from 'react';
import { GlobalProvider } from './GlobalContext';
import { GlobalTimer } from './GlobalTimerContext';
import { GlobalAudio } from './GlobalAudioContext';
import { GlobalFeedback } from './GlobalFeedbackContext';
import { GlobalLocation } from './GlobalLocationContext';
import { GlobalNavigation } from './GlobalNavigationContext';

const RootContext = createContext();

export const RootProvider = ({ children }) => {
  return (
    <GlobalFeedback>
      <GlobalAudio>
        <GlobalProvider>
          <GlobalNavigation>
            <GlobalTimer>
              <GlobalLocation>
                <RootContext.Provider value={{}}>
                  {children}
                </RootContext.Provider>
              </GlobalLocation>
            </GlobalTimer>
          </GlobalNavigation>
        </GlobalProvider>
      </GlobalAudio>
    </GlobalFeedback>
  );
};

export const useRootContext = () => {
  const context = useContext(RootContext);
  if (context === undefined) {
    throw new Error('useRootContext must be used within a RootProvider');
  }
  return context;
};

export const versionNumber = "Release v1.02";

export * from './SharedContext';