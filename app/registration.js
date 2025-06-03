import { useState, useContext, useEffect } from 'react';
import { ImageBackground, StyleSheet, SafeAreaView } from 'react-native';
import RegistrationPage1 from './registrationpage0';
import RegistrationPage2 from './registrationpage1';
import RegistrationPage3 from './registrationpage2';
import RegistrationPage4 from './registrationpage3';
import { useGlobalNavigationContext, useGlobalContext } from '../context/RootContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const Registration = () => {
    const { registrationStep } = useGlobalNavigationContext();
    const { currentView, setCurrentView } = useGlobalContext();
    const insets = useSafeAreaInsets();

    const getPage = () => {
        switch (registrationStep) {
            case 1:
                return (<RegistrationPage1 />)
                break;

            case 2: 
                return (<RegistrationPage2 />)
                break;

            case 3:
                return (<RegistrationPage3 />)
                break;

            case 4:
                return (<RegistrationPage4 />)
                break;

            default:
                break;

        }
    }

    useEffect(() => {
        if (currentView !== 'Registration') {
            setCurrentView('Registration');
        }
    }, []);

    return (
        <ImageBackground source={require('../assets/images/chalkboard.jpg')} style={[styles.container, {position: 'absolute',width: '100%',
    top: insets.top, bottom: 0,
  }]}>
            {getPage()}
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
    }
});

export default Registration;