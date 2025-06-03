import React, { useContext, useMemo, useCallback } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, ImageBackground, Platform } from 'react-native';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalTimerContext, useGlobalLocationContext, useGlobalNavigationContext } from '../context/RootContext';
import { dynamoDBToDate } from '../components/apputilities';
import BlackBarComponent from '../components/BlackBarComponent.js';

const FooterOption = ({ option, onPress, counter }) => (

  <TouchableOpacity style={option.button} onPress={onPress} >
    {(typeof counter === 'number' && counter > 0) && (
      <View style={styles.counter}>
        <Text style={styles.tixCounter}>{counter}</Text>
        {counter > 0 && (
          <Image style={[styles.tixArrowImg, styles.tixArrow]} source={require('../assets/images/tix_arrow.png')} alt='Get Tix' />
        )}
      </View>
    )}
    <Image style={option.button} source={option.src} alt={option.alt} />
  </TouchableOpacity>
);

const Footer = ()=> {
  const { 
    bars,
    currentView,
    allOffers, 
    pixKeys,  
    profileData,
    tixOffers,
    setTixOffers,
    tixIndex,
    setTixIndex,
    selectingTix,
    tixMode,
    setTixMode, 
    initializeData,
    submittingRegistration,
  } = useGlobalContext();

  const { 
    registrationStep, 
    registrationNavigate, 
    navigate, 
    profileFormEnabled,
    setProfileFormEnabled
  } = useGlobalNavigationContext();

  const { 
    locationPermissionGranted,
    setLocationPermissionGranted,
    showDirections, 
    setShowDirections,
  } = useGlobalLocationContext();

  const { 
    timerVisible, 
    setTimerVisible, 
    isActive, setIsActive
  } = useGlobalTimerContext();

  const { 
    setElipses,
    setFeedback
  } = useGlobalFeedbackContext();

  const regPageNext = (tc, age, loc) => {
    //console.log("location button ", registrationStep, tc, age, loc);

    if (registrationStep > 3) {
      if (tc !== false && tc !== 'false') {
        return require('../assets/images/submit.png');
      }
      //console.log("Display nothing");
      return '';
    } else if (registrationStep === 1) {
      if (age === false || age === 'false' ) {
        return '';
      }
    }

    //console.log("2registrationStep " + registrationStep);

    return require('../assets/images/next.png');
  };

  const launchedAlready = (dateString, today) => {
    const inputDate = dynamoDBToDate(dateString); 
    return inputDate <= today;
  };

  const activeBars = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison
    for (bar in bars){
      //console.log(JSON.stringify(bars[bar], null, 2));
      if (launchedAlready(bars[bar].launchdate), today) {
        return true;
      }
    }
    return false;
  };

  const options = useMemo(() => ({
    Pix: {
      left: activeBars() ? {
        button: [styles.leftFooterButton, styles.noTapHighlight],
        src: require('../assets/images/scan.png'),
        alt: 'QR Scanner',
        action: () => {setElipses(false); setFeedback('');  navigate('QR')}
      } : {},
      right: {
        button: [styles.rightFooterButton, styles.noTapHighlight],
        src: require('../assets/images/tickets.png'),
        alt: 'Available TIX',
        action: async () => { setElipses(false); setFeedback(''); setTixMode(true); setTixIndex(0); setTixOffers(allOffers);  if (Platform.OS === 'android') { await initializeData(); setElipses(false); setFeedback('');}; navigate('Tix'); },
      },
    },
    Tix: (!isActive ? {
      left: (!timerVisible) ? {
        button: [styles.leftFooterReturn, styles.noTapHighlight],
        src: require('../assets/images/pix.png'),
        alt: 'Return to PIX',
        action: async () => { if(!selectingTix){setElipses(false); setFeedback('');  setTimerVisible(false); navigate('Pix'); setTixMode(true);} },
      } : {},
      right: ((allOffers && allOffers.length && !timerVisible) || (!tixMode && !timerVisible)) ? {
        button: [styles.rightFooterMap, styles.noTapHighlight],
        src: require('../assets/images/map.png'),
        alt: 'Directions',
        action: () => { if(!selectingTix){setElipses(true); setFeedback('Inilizing Map'); setShowDirections(false); navigate('Map') }},
      } : {},
    } : {}),
    QR: {
      left: { 
              button: [styles.leftFooterReturn, styles.noTapHighlight],
              src: require('../assets/images/pix.png'),
              alt: 'Return to PIX',
              action: () => {setElipses(false); setFeedback('');  navigate('Pix');},
            },
    },
    Map: {
      left: {
        button: [styles.leftFooterReturn, styles.noTapHighlight],
        src: require('../assets/images/tix.png'),
        alt: 'Return to TIX',
        action: () => {setElipses(false); setFeedback(''); navigate('Tix');},
      },
      right: (Platform.OS === 'ios' || true) ? {
        button: [styles.rightFooterMap, styles.noTapHighlight],
        src: showDirections ? require('../assets/images/map.png') : require('../assets/images/directions.png'),
        alt: 'Toggle Directions',
        action: () => {setElipses(false); setFeedback(''); setShowDirections(!showDirections);},
      } : {},
    },
    Profile: {
      left: {
        button: [styles.leftFooterReturn, styles.noTapHighlight],
        src: require('../assets/images/pix.png'),
        alt: 'Return to PIX',
        action: () => {setElipses(false); setFeedback(''); setProfileFormEnabled(false); navigate('Pix');},
      },
    },
    Registration: {
      left: !submittingRegistration ? {
        button: [styles.leftFooterButtonBack, styles.noTapHighlight],
        src: require('../assets/images/back.png'),
        alt: 'back',
        action: () => registrationNavigate(-1),
      }  : {},
      right: !submittingRegistration ? {
        button: [styles.rightFooterButtonNext, styles.noTapHighlight],
        src: regPageNext(profileData.tccheck, profileData.agecheck, locationPermissionGranted),
        alt: 'next',
        action: () => registrationNavigate(1),
      } : {},
    },
  }), [setFeedback, setElipses, currentView, pixKeys, allOffers, timerVisible, tixMode, showDirections, registrationStep, locationPermissionGranted, profileData.agecheck, profileData.tccheck, navigate, setTixMode, setTimerVisible, setShowDirections, registrationNavigate, regPageNext]);

  const renderCenter = () => {
    if (currentView === "Tix" && tixOffers.length > 0 && tixIndex > -1 && tixOffers[tixIndex]?.photo) {
      return (
        <Image
          source={{uri: tixOffers[tixIndex].photo}}
          style={[styles.drinkImage, !tixOffers.length && styles.hideThis]}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Background bar image - bottommost layer */}
      <ImageBackground 
        source={require('../assets/images/bartop_48.png')} 
        style={styles.barBackground}
      />

      {/* Black bar component - 48px from bottom */}
      <View style={styles.blackBarWrapper}>
        <BlackBarComponent />
      </View>

      {/* Navigation buttons row */}
      <View style={styles.navigationContainer}>
        {/* Left button */}
        {options[currentView]?.left && (
          <View style={(currentView === "Registration") ? styles.leftSectionReg : styles.leftSection} >
            <FooterOption
              option={options[currentView].left}
              onPress={options[currentView].left.action}
            />
          </View>
        )}

        {/* Center content */}
        {currentView !== "Registration" && <View style={styles.centerSection}>
          {renderCenter()}
        </View>}

        {/* Right button */}
        {options[currentView]?.right && (
          <View style={(currentView === "Registration") ? styles.rightSectionReg : styles.rightSection} >
            {(options[currentView].right.src !== '') && <FooterOption
              option={options[currentView].right}
              onPress={options[currentView].right.action}
              counter={(currentView === "Pix" && allOffers) ? allOffers.length : 0}
            />}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({

  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48, // Adjust based on your needs
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  // Background bar image
  barBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    width: '100%',
    resizeMode: 'cover',
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  // Black bar component wrapper
  blackBarWrapper: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 1,
  },

  // Navigation container
  navigationContainer: {
    position: 'absolute',
    //top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    bottom: 0,
    //paddingHorizontal: 10,
    zIndex: 2,
  },

  // Section styles
  leftSectionReg: {
    width: 160,
    height: 48,
    bottom: 0,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  leftSection: {
    width: 160,
    height: 0,
    bottom: -160,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  // centerSection: {
  //   flex: 1,
  //   height: 160,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingHorizontal: 10,
  //   backgroundColor: "rgba(0, 255, 0, 0.5)",
  // },

  centerSection: {
    flex: 1,
    height: 160,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  rightSectionReg: {
    width: 160,
    height: 48,
    bottom: 0,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  rightSection: {
    width: 160,
    height: 0,
    bottom: -160,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  leftFooterButton: {
    position: 'absolute',
    width: 128,
    height: 160,
    left: 0,
    bottom: -1,
    zIndex:1, 
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  rightFooterButton: {
    position: 'absolute',
    width: 128,
    height: 160,
    right: 0,
    bottom: -2,
    zIndex:1,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  leftFooterButtonBack: {
    position: 'absolute',
    width: 156,
    height: 48,
    left: 0,
    bottom: -1,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  rightFooterButtonNext: {
    position: 'absolute',
    width: 156,
    height: 48,
    right: 0,
    bottom: -1,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  leftFooterReturn: {
    position: 'absolute',
    bottom: -2,
    width: 128,
    height: 48,
    cursor: 'pointer',
    left: -3,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  rightFooterMap: {
    position: 'absolute',
    bottom: 2,
    width: 128,
    height: 48,
    cursor: 'pointer',
    right: 0,
    //backgroundColor: "rgba(0, 255, 0, 0.5)",
  },

  navBtn: {
    bottom: 0,
    height: 'auto',
  },

  tixArrow: {
    position: 'relative',
    zIndex: 2,
    right: 100,
    bottom: 95,
  },

  counter: {
    position: 'relative',
    color: 'white',
    ...Platform.select({
      ios: {
        right: 15,
        bottom: -20,
      },
      android: {
        right: 15,
        bottom: -20,
      },
      default: {
        right: 15,
        bottom: -20,
      },
    }),
    zIndex: 3,
  },

  tixCounter: {
    textAlign: 'right',
    position: 'relative',
    color: 'white',
    right: 15,
    bottom: -25,
    zIndex: 3,
    fontSize: 36,
    fontWeight: 'bold',
  },

  tixArrowImg: {
    transform: [{ scale: 0.5 }],
  },

  noTapHighlight: {
    WebkitTapHighlightColor: 'transparent',
    tapHighlightColor: 'transparent',
  },

  drinkImage: {
    resizeMode: 'contain',
    width: 128,
    height: 204,
    bottom: 20,
  },
  hideThis: {
    display: 'none',
  },
});

export default React.memo(Footer);