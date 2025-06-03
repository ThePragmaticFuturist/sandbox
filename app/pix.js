// //pix.js
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useContext, useCallback, memo } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ImageBackground, FlatList, Dimensions, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dynamoDBToDisplay, dynamoDBToDate } from '../components/apputilities';
//import Polaroid from '../components/Polaroid';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalTimerContext, useGlobalLocationContext, useGlobalNavigationContext } from '../context/RootContext';

const launchedAlready = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison
  // Parse the input date string
  const inputDate = dynamoDBToDate(dateString); 
  // Compare the dates
  return inputDate <= today;
};

const ListItem = memo(({ item, index, onPress }) => (
  <TouchableOpacity onPress={() => onPress(index)} style={styles.tablerow}>
    {launchedAlready(item.launchdate) && <Text style={styles.tablecellleft}><Ionicons name="lock-open-outline" size={32} color="#00FF00" /></Text>}
    {!launchedAlready(item.launchdate) && <Text style={styles.tablecellleft}><Ionicons name="lock-closed-outline" size={32} color="#990000" /></Text>}
    
    {launchedAlready(item.launchdate) && <Text style={[styles.tablecellcenter, styles.mediumText]}>{`${item.bar_name}:\n${item.name}`}</Text>}
    {!launchedAlready(item.launchdate) && <Text style={[styles.tablecellcenter, styles.graymediumText]}>{`${item.bar_name}:\n${item.name}`}</Text>}
   
    {launchedAlready(item.launchdate) && <Text style={[styles.tablecellright, styles.mediumText]}>{dynamoDBToDisplay(item.expirationdate)}</Text>}
    {!launchedAlready(item.launchdate) && <Text style={[styles.tablecellright, styles.graymediumText]}>{dynamoDBToDisplay(item.expirationdate)}</Text>}
  </TouchableOpacity>
));

const TableHeader = memo(({ maxWidth }) => (
  <View style={styles.tablerow}>
    <Text style={[styles.tablecellleft, styles.tableheader, { maxWidth }]}>Tix</Text>
    <Text style={[styles.tablecellcenter, styles.tableheader, { maxWidth }]}>&nbsp;</Text>
    <Text style={[styles.tablecellright, styles.tableheader]}>Expires</Text>
  </View>
));

const Pix = () => { 
  //console.log('Pix');
  
  const { 
    bars, 
    setPixSelection, 
    setTixIndex,
    setTixOffers,
    initializeData
  } = useGlobalContext();

  const { 
    setTimerVisible
  } = useGlobalTimerContext();

  const { 
    navigate, 
    setLoadingPage, 
    loadingPage, 
    setTixMode, 
  } = useGlobalNavigationContext();

  const { 
    setElipses,
    setFeedback
  } = useGlobalFeedbackContext();

  const [maxHeaderWidth, setMaxHeaderWidth] = useState(Dimensions.get('window').width / 4.0);

  const [sortedBars, setSortedBars] = useState([]);

  const selectPix = useCallback(async (barIndex) => {
    if (!loadingPage) {
      setPixSelection(barIndex);
      setTixMode(false);
      setTixIndex(barIndex);
      //setTixOffers(bars);
      setTixOffers(sortedBars);
      navigate("Tix");
    }
  }, [loadingPage, setPixSelection, setTixMode, navigate, sortedBars]);

  useEffect(() => {
    // console.log('returned to Pix');
    initializeData();
    setLoadingPage(false);
    setTimerVisible(false);

    return () => {
      // console.log("leaving pix")
      setElipses(false);
      setFeedback('');
    };
  }, []);//setLoadingPage, setElipses, setTimerVisible, setFeedback

  const renderItem = useCallback(({ item, index }) => (
    <ListItem item={item} index={index} onPress={selectPix} />
  ), [selectPix]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMaxHeaderWidth(Dimensions.get('window').width / 4.0);
  }, []);

  useEffect(() => {
    const sorted = [...bars].sort((a, b) => {
      const dateA = dynamoDBToDate(a.expirationdate);
      const dateB = dynamoDBToDate(b.expirationdate);
      
      // First sort by whether the offer has launched
      const aLaunched = launchedAlready(a.launchdate);
      const bLaunched = launchedAlready(b.launchdate);
      
      if (aLaunched && !bLaunched) return -1;
      if (!aLaunched && bLaunched) return 1;
      
      // Then sort by expiration date
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    
    setSortedBars(sorted);
  }, [bars]);

  return (
    <View style={styles.frame, {position: 'absolute',width: '100%',
    top: insets.top, bottom: insets.bottom,
  }} pointerEvents="box-none">
      <ImageBackground source={require('../assets/images/chalkboard.jpg')} style={styles.container}>
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <TableHeader maxWidth={maxHeaderWidth} />
            <FlatList
              data={sortedBars}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.scrollingListContent}
              showsVerticalScrollIndicator={true}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={5}
              bounces={false}
              overScrollMode="never"
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default React.memo(Pix);

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    marginTop: 200,
    marginBottom: 160,
    paddingHorizontal: '5%',
  },
  tablerow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  tablecellleft: {
    flex: .12,
    padding: 5,
    color: 'white',
    textAlign: 'left',
  },
  tablecellcenter: {
    flex: .58,
    padding: 5,
    color: 'white',
    textAlign: 'left',
  },
  tablecellright: {
    flex: .3,
    padding: 5,
    color: 'white',
    textAlign: 'right',
  },
  tableheader: {
    //fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Segoe Script',
    fontSize: 28,
  },
  icons: {
    fontWeight: 'bold',
    fontFamily: "Ionicons",
    fontSize: 28,
    color: 'gray',
  },
  mediumText: {
    fontSize: 16,
  },
  graymediumText: {
    fontSize: 16,
    color: 'gray',
  },
  scrollingListContent: {
    flexGrow: 1,
  },
});