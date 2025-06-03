// // //map.js
import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Polaroid from '../components/Polaroid';
import HTML5ToReactNativeConverter from '../components/HTML5ToReactNativeConverter';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalLocationContext, useGlobalNavigationContext } from '../context/RootContext';

const MapComponent = () => {
  const { 
    tixOffers,
    tixIndex,
  } = useGlobalContext();

  const {
    locationPermissionGranted,
    setLocationPermissionGranted, 
    getLocation,
    userLocation, 
    showDirections,
    setShowDirections,
    initializedMap, 
    setInitializedMap,
  } = useGlobalLocationContext();

  const { 
    setElipses,
    setFeedback
  } = useGlobalFeedbackContext();

  const { 
    setLoadingPage, 
  } = useGlobalNavigationContext();

  // const [initializedMap, setInitializedMap] = useState(false);
  const [wayPoints, setWayPoints] = useState([]);
  const [guide, setGuide] = useState('<h1>&nbsp;</h1>');

  const startingLocation = useRef({
    latitude: Number(userLocation?.latitude) || 0,
    longitude: Number(userLocation?.longitude) || 0
  });

  const barLocation = useMemo(() => ({
    latitude: Number(tixOffers[tixIndex]?.bar_gps_lat) || 0,
    longitude: Number(tixOffers[tixIndex]?.bar_gps_long) || 0,
    barName: tixOffers[tixIndex]?.bar_name || 'Bar',
  }), []);

  const region = useMemo(() => {
    //console.log(barLocation);

    if (!userLocation || !barLocation.latitude || !barLocation.longitude) return null;

    const padding = 1.5; // 50% padding around the points

    const minLat = Math.min(userLocation.latitude, barLocation.latitude);
    const maxLat = Math.max(userLocation.latitude, barLocation.latitude);
    const minLng = Math.min(userLocation.longitude, barLocation.longitude);
    const maxLng = Math.max(userLocation.longitude, barLocation.longitude);

    const latDelta = (maxLat - minLat) * padding;
    const lngDelta = (maxLng - minLng) * padding;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01), // Ensure a minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }, [userLocation, barLocation]);

  function removeStyleFromHtml(html) {
    // Regular expression to match style attributes
    //console.log('html', html);

    const styleRegex = /\s*style\s*=\s*["']([^"']*)["']/gi;
    
    // Replace all occurrences of style attributes with an empty string
    html = html.replace(styleRegex, '');

    html = html.replace(/<div>/gi, "<br/><span><i>");
    html = html.replace(/<\/div>/gi, "</i></span>");

    html = html.replace(/, USA/gi, "");
    html = html.replace(/<wbr\/>/gi, "");

    //console.log('htmlfixed', html);
    
    return html 
  }

  const initializeMap = useCallback(async () => {
    //console.log('initializedMap3', initializedMap);

    if (!initializedMap && barLocation.latitude && barLocation.longitude) {
      
      const uLoc = await getLocation(false);

      try {
        const thisBody = JSON.stringify({
            "patronLocation": { "lat": Number(uLoc.latitude), "lng": Number(uLoc.longitude) },
            "barLocation": { "lat": Number(barLocation.latitude), "lng": Number(barLocation.longitude) },
          });

        //console.log('thisBody', thisBody);

        const response = await fetch('https://oh6a53xbnpm37zzon5d55svsci0ljcai.lambda-url.us-east-1.on.aws/', {
          method: "POST",
          body: thisBody,
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          }
        });

        const result = await response.json();

        //console.log('initializedMap waiting', result);

        if (result.statusCode !== 200){
          setWayPoints([]);
          setShowDirections(false);
          setGuide(`<div><p><h1>Directions</h1></p>We are sorry, but a network error is preventing DRINX from retrieving directions to this offer. Please check your connection and try again later.</div>`);
          setFeedback('Network error getting directions.');

        } else {
          setWayPoints(result.waypoints);

          const steps = result.guide.map((html, index) => `<div>${index + 1}. ${removeStyleFromHtml(html)}</div><p></p>`);

          //console.log(JSON.stringify(steps, null, 2));

          setGuide(`<div><p><h1>Directions</h1></p>${steps.join('')}</div>`);
        }

        setInitializedMap(true);
      } catch (error) {
        setWayPoints([]);
        setShowDirections(false);
        setGuide(`<div><p><h1>Directions</h1></p>We are sorry, but a network error is preventing DRINX from retrieving directions to this offer. Please check your connection and try again later.</div>`);
        setFeedback('Network error getting directions.');
      }
    } 
  }, [setFeedback, setElipses, locationPermissionGranted, setShowDirections]);

  useEffect(() => {
    if (!initializedMap){
      initializeMap();
    } else {
      setElipses(false);
      setFeedback('');
    }

    return () => {
      setInitializedMap(false);
      setElipses(false);
      setFeedback('');
    };
  }, [setElipses, setFeedback, initializeMap, setInitializedMap]);

  useEffect(() => {
    setLoadingPage(false);
  }, [setLoadingPage]);

  const mapView = useMemo(() => (
    <MapView
      style={styles.map}
      region={region}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}
      showsScale={true}
    > 
      {userLocation && (
        <Marker
          coordinate={ userLocation }
          title="You"
        />
      )}
      {barLocation.latitude && barLocation.longitude && (
        <Marker
          coordinate={barLocation}
          title={barLocation.barName}
        />
      )}
      {wayPoints && <Polyline
          key="editingPolyline"
          coordinates={wayPoints}
          strokeColor="#000"
          strokeWidth={4}
          lineJoin="round"
        />}
      
    </MapView>
  ), [region, userLocation, barLocation, wayPoints]);

  return (
    <ImageBackground source={require('../assets/images/chalkboard.jpg')} style={styles.container}>
      <View style={styles.container}>
        {!showDirections && mapView}
        {showDirections && initializedMap &&
          <View style={styles.contentContainer}>
            <HTML5ToReactNativeConverter htmlContent={guide} />
          </View>
        }
        {!initializedMap && <View style={styles.centerContent} ><Text style={styles.centerText} >Loading Map</Text><ActivityIndicator color="#fff" /></View>}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    flex: 1,
    marginTop: 0,
    marginBottom: 80,
    paddingHorizontal: '5%',
  },
  centerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    paddingBottom: 10,
  },
  centerContent: {
    flex: 1,
    top:0,
    left:0,
    right:0,
    bottom:0,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  tableheader: {
    //fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Segoe Script',
    fontSize: 28,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'left',
  },
  map: {
    width: "100%", //Dimensions.get('window').width,
    height: "100%", //Dimensions.get('window').height, 
  },
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
  },
  buttonImage: {
    width: 30,
    height: 30,
  },
});

export default React.memo(MapComponent);