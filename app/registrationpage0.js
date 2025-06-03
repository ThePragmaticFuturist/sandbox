import React, { useState, useContext, useEffect, useRef } from 'react';
import { Alert, Linking, TouchableOpacity, View, Text, Switch, StyleSheet, ScrollView, ImageBackground, Dimensions, Platform, Device, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalNavigationContext, useGlobalLocationContext } from '../context/RootContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

//import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';

const RegistrationPage1 = () => {
    const { profileData, setProfileData, currentView, submittingRegistration, setSubmittingRegistration} = useGlobalContext();
    const { 
        locationPermissionGranted,
        setLocationPermissionGranted,
        requestLocationPermission,
      } = useGlobalLocationContext();
    const { navigate } = useGlobalNavigationContext();
    const { setFeedback} = useGlobalFeedbackContext();
    const insets = useSafeAreaInsets();
    const [scrollViewHeight, setScrollViewHeight] = useState(0);

    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        
        // Clean up when component unmounts
        return () => {
            mounted.current = false;
        };
    }, []);


    const handleChange = async (name, value) => {
        if (!mounted.current) return;
        //console.log(name, value);
        await setProfileData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const updateScrollViewHeight = () => {
        const windowHeight = Dimensions.get('window').height;
        setScrollViewHeight(windowHeight - (360 + insets.bottom + insets.top));
    };

    useEffect(() => {
        setSubmittingRegistration(false);

        updateScrollViewHeight();

        const dimensionsHandler = Dimensions.addEventListener('change', updateScrollViewHeight);

        return () => {
            dimensionsHandler.remove();
        };
    }, []);

    useEffect(() => {
        return () => {
            // Cleanup any picker references
            setProfileData(prev => ({...prev}));
        };
    }, []);

    return (
        
            <View style={[styles.box, { top: 190 + insets.top, bottom: insets.bottom, height: "100%"}]}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style = {styles.narrowColumn}>
                    <Text style={[styles.registrationWelcome, styles.centerText]}>Welcome to DRINX™</Text>
                    
                    <Text style={styles.centerText}>DRINX is the first and only app that notifies you when and where to find free drinks in your area and areas you might be traveling to in the future.</Text>
                    <Text style={styles.centerText}>First some formalities. {"\n"}Please verify the following:</Text>
                    <View style={[styles.contentContainer]}>
                        <View style={[styles.form]}>
                            <Switch
                                value={profileData.agecheck === "true" || profileData.agecheck === true}
                                onValueChange={(value) => handleChange('agecheck', value)}
                            />
                            <Text style={styles.label}>I am 21 years old or older.</Text>
                        </View>
                        {profileData.agecheck && !locationPermissionGranted &&
                            <>
                                <Text style={styles.centerText}>Why do we recommend allowing locations services for the Drinx app? There are several reasons but to put it simply, we want to match offers to your location.</Text>
                       
                              <TouchableOpacity style={styles.buttonLogout} onPress={() => {console.log('pressed'); requestLocationPermission();}}>
                                <Text style={styles.buttonText}>Continue to Location Settings</Text>
                              </TouchableOpacity>
                            </>}

                    </View>
                    </View>
                 </ScrollView>
            </View>
       
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    box: {
        position: 'absolute',
        backgroundColor: 'whitesmoke',
        top: 200,
        left: 0,
        right: 0,
        bottom: 160,
    },
    scrollViewContent: {
        flexGrow: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    narrowColumn: {
        backgroundColor: 'whitesmoke',
        padding: 10, 
        borderRadius: 8, 
        //width: '95%',
    },
    contentContainer: {
        alignItems: 'center',
    },
    form: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    centerText: {
        textAlign: 'center',
        marginVertical: 10,
    },
    registrationWelcome: {
        fontWeight: 'bold',
        marginBottom: 20,
        fontSize: 18,
    },
    zero: {
        marginTop: 0,
    },
    label: {
        marginLeft: 18,
        fontWeight: 'bold',
    },
    buttonLogout: {
        backgroundColor: 'whitesmoke',
        padding: 10,
        borderRadius: 5,
        borderColor: 'black',
        borderWidth: 1,
        flex: 1,
        marginHorizontal: 5,
        marginVertical: 15,
      },
      buttonText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
      },
      buttonSave: {
        backgroundColor: 'lightgreen',
        padding: 10,
        borderRadius: 5,
        borderColor: 'black',
        borderWidth: 1,
        flex: 1,
        marginHorizontal: 5,
        marginVertical: 15,
      },
});

export default React.memo(RegistrationPage1);