import React, { useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { dynamoDBToDisplay, dynamoDBToDate, dateToDynamoDB, accessDatabase } from '../components/apputilities';
import { useGlobalFeedbackContext, useGlobalAudioContext } from '../context/SharedContext';
import { useGlobalContext, useGlobalNavigationContext } from '../context/RootContext';
import { invoiceSelectedTix } from '../components/stripe';

const TixSelector = () => {
  const {  
    tixOffers, 
    tixIndex, 
    tixMode, 
    setTixMode, 
    allOffers, 
    activeOffers, 
    setAllOffers, 
    setActiveOffers, 
    setTixOffers, 
    setTixIndex, 
    bars, 
    setBars,
    pixKeys, 
    setPixKeys,
    profileData, 
    navigate, 
    offerIndex, 
    setSelectingTix } = useGlobalContext();

  const { audioPlayer } = useGlobalAudioContext();

  const { setFeedback, setElipses } = useGlobalFeedbackContext();

  const [showButtons, setShowButtons] = useState(tixMode);

  const [buttonStates, setButtonStates] = useState({
    thumbsUp: styles.dimButton,
    thumbsDown: styles.dimButton
  });

  const onSelectOffer = useCallback(async (buttonname) => {
    setSelectingTix(true);

    const offerList = [...allOffers];
    const trashedOffers = [...activeOffers];
    
    if (offerList.length) {
      const barList = [...bars];
      const keyList = [...pixKeys];

      if (buttonname === "thumbsUp") {
        let thisOffer = offerList.splice(0, 1)[0];

        if (keyList.indexOf(thisOffer.keyroot) > -1){
          //alertLog('ALREADY HAVE THIS OFFER');
          return 
        }

        let data = {'tableName':'"tix-status"."keyroot-index"', 'action':"query", 'keypair':{"keyroot": thisOffer.keyroot}, 'content':{"patron-id":0, "conjunction": "AND"} };
        let thisBar = await accessDatabase(data);
        
        if (thisBar.length) {
          data = {'tableName':'"tix-status"', 'action':"insert", 'keypair':{"id": thisBar[0].id}, 'content':{"patron-id":profileData["patron-id"], "selected":dateToDynamoDB(new Date())} };
          const barDetails = await accessDatabase(data);
          if (barDetails.length) {
            thisOffer["patron-id"] = profileData["patron-id"];
            barList.push(thisOffer);
            keyList.push(thisOffer.keyroot);
            setBars([...barList]);
            setPixKeys([...keyList]);

            await audioPlayer(require('../assets/sounds/chalk.mp3'));
            
            let tixKeyroot = {'tableName':'"tix-per-bar"', 'action':"select", 'keypair':{"id": thisOffer.keyroot}, 'content':{}};
            await accessDatabase(tixKeyroot);// <<<<<<<<<<<<<<<<<<<<<<< WHY IS THIS NOT RETURNING A VALUE - WHAT IS THIS CALL FOR?


            await invoiceSelectedTix(thisOffer.customer_id, thisOffer.selected_id, thisOffer.name);
          } else {
            //alertLog('error updating database');
          }
        } else {
          setFeedback("If you're last, it ain't free.");
        }
      } else if (buttonname === "thumbsDown") {

        trashedOffers.push(offerList.splice(0, 1)[0]);
        setActiveOffers(prevState => [...trashedOffers]);
        await audioPlayer(require("../assets/sounds/recycle.mp3"));
      }
      
      setAllOffers(prevState => [...offerList]);
    }

    setSelectingTix(false);

    if (offerList.length < 1) {
      setAllOffers([...trashedOffers]);
      setActiveOffers([]);
      setTixMode(false);
      
      await navigate("Pix");

      setFeedback(' ');
    } else {
      setTixMode(true);
      setTixOffers(prevState => [...offerList]);
      setTixIndex(prevState => offerIndex);

      await navigate("Tix");
    }

    //return 'done'
  }, [allOffers, activeOffers, setAllOffers, setActiveOffers, setTixOffers, setTixMode, setTixIndex, bars, pixKeys, profileData.id, audioPlayer, navigate, offerIndex, setSelectingTix]);


  const handleButtonInteraction = useCallback(async (buttonName, interactionType) => {
    if (interactionType === 'start') {
      setButtonStates(prev => ({
        ...prev,
        [buttonName]: styles.brightButton
      }));
    } else if (interactionType === 'end') {
      setButtonStates(prev => ({
        ...prev,
        [buttonName]: styles.dimButton
      }));
      setShowButtons(false);

      const activityComplete = await onSelectOffer(buttonName);

      //console.log(activityComplete);

      setShowButtons(true);
    }
  }, [setTixMode, onSelectOffer]);

  const renderContent = useMemo(() => {
    if (tixOffers && tixOffers[tixIndex]) {
      const offer = tixOffers[tixIndex];
      
      return (
        <>
          {offer.bar_logo && (
            <Image 
              source={{ uri: offer.bar_logo }} 
              style={[styles.logoImage, {width: Dimensions.get('window').width * 0.25, height: Dimensions.get('window').width * 0.25}]} 
            />
          )}
          <Text style={styles.barNameTix}>{offer.bar_name}</Text>
          <Text style={styles.nameOfTix}>{offer.name}</Text>
          <Text style={styles.descriptionOfTix}>{offer.description}</Text>
          <Text style={styles.datesOfTix}>
            {`${dynamoDBToDisplay(offer.launchdate)} to ${dynamoDBToDisplay(offer.expirationdate)}`}
          </Text>
        </>
      );
    } else {
      return (
        <>
          <Text style={[styles.barNameTix, {paddingTop: 60}]}>No offers are currently available.</Text>
          <Text style={styles.nameOfTix}>{'\u00A0'}</Text>
          <Text style={styles.descriptionOfTix}>Check back soon!</Text>
        </>
      );
    }
  }, [tixOffers, tixIndex]);

  const renderButton = useCallback((buttonName, imagePath) => (
    <TouchableOpacity
      onPressIn={() => handleButtonInteraction(buttonName, 'start')}
      onPressOut={() => handleButtonInteraction(buttonName, 'end')}
      style={buttonStates[buttonName]}
      activeOpacity={1}
    >
      <Image 
        source={imagePath}
        style={(tixOffers && tixOffers.length) ? styles.buttonStyle : styles.hideThis} 
        resizeMode="contain" 
      />
    </TouchableOpacity>
  ), [handleButtonInteraction, buttonStates, tixOffers]);

  return (
    <View style={styles.container}>
      {showButtons ? (
        <View style={styles.horizontalContainer}>
          <View style={styles.buttonSection}>
            {renderButton('thumbsDown', require('../assets/images/thumbsdown.png'))}
          </View>
          
          <View style={styles.contentSection}>
            {renderContent}
          </View>
          
          <View style={styles.buttonSection}>
            {renderButton('thumbsUp', require('../assets/images/thumbsup.png'))}
          </View>
        </View>
      ) : (
        <View style={styles.contentOnly}>
          {renderContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    minHeight: 300, // Ensure container has enough height
  },
  contentOnly: {
    alignItems: 'center',
    width: '100%',
  },
  buttonSection: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  contentSection: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300, // Match with horizontalContainer
  },
  buttonWrapper: {
    padding: 10,
    alignSelf: 'center',
  },
  buttonStyle: {
    width: 150,
    height: 150,
  },
  hideThis: {
    display: 'none',
  },
  dimButton: {
    transform: [{ scale: 0.75 }],
    opacity: 0.7,
  },
  brightButton: {
    transform: [{ scale: 1.0 }],
    opacity: 1,
  },
  tixText: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  logoImage: {
    resizeMode: 'contain',
    maxWidth: 256,
    marginTop: 0,
    marginBottom: 5,
  },
  barNameTix: {
    fontSize: 20,
    ...Platform.select({
      ios: {
        fontWeight: '600',
      },
      default: {
        fontWeight: 'bold',
      },
    }),
    color: 'white',
    marginBottom: 5,
    textAlign: 'center'
  },
  nameOfTix: {
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
  },
  descriptionOfTix: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  datesOfTix: {
    fontSize: 14,
    ...Platform.select({
      ios: {
        fontWeight: '600',
      },
      default: {
        fontWeight: 'bold',
      },
    }),
    color: 'white',
  },
  timesOfTix: {
    fontSize: 14,
    ...Platform.select({
      ios: {
        fontWeight: '600',
      },
      android: {
        fontWeight: 'bold',
      },
    }),
    color: 'white',
  },
});

export default React.memo(TixSelector);