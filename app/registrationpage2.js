import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ImageBackground, Dimensions, Platform  } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useGlobalContext } from '../context/RootContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RadiusPicker = React.memo(({ value, onChange }) => (
    <Picker
        selectedValue={value}
        style={styles.picker}
        onValueChange={onChange}
    >
        {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((value) => (
          <Picker.Item key={value} label={`${value} miles`} value={value.toString()} />
        ))}
    </Picker>
));

const RegistrationPage3 = () => {
    const { profileData, setProfileData } = useGlobalContext();
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const insets = useSafeAreaInsets();

    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        
        // Clean up when component unmounts
        return () => {
            mounted.current = false;
        };
    }, []);

    const handleChange = (name, value) => {
        setProfileData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    useEffect(() => {
        return () => {
            // Cleanup any picker references
            setProfileData(prev => ({...prev}));
        };
    }, []);

    return (
        <View style={[styles.box, { top: 190 + insets.top, bottom: 0, height: "80%"}]}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style = {styles.narrowColumn}>
                    <Text style={styles.centerText}>We only use your zipcode to ensure local offers are sent to you!</Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Zipcode</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="5-digit zipcode"
                            value={profileData.zipcode}
                            onChangeText={(text) => handleChange('zipcode', text)}
                            maxLength={5}
                            //keyboardType="numeric"
                            autoComplete="off"
                        />
                    </View>
                    
                    <Text style={styles.centerText}>The optional travel zipcode is used to receive DRINX™ offers for where you are headed. </Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Travel Zipcode</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="optional"
                            value={profileData.travelzip}
                            onChangeText={(text) => handleChange('travelzip', text)}
                            maxLength={5}
                            //keyboardType="numeric"
                            autoComplete="off"
                        />
                    </View>
                    <Text style={styles.centerText}>Your Radius is the distance from your zipcode you want us to search for offers. </Text>
                    
                    <View style={styles.formPicker}>
                        <Text style={styles.label}>Radius</Text>
                        <RadiusPicker value={profileData.radius} onChange={(itemValue) => handleChange('radius', itemValue)} />
                    </View>
                    
                 </View>
            </ScrollView>
        </View>
    );
};

// <Picker
//     selectedValue={profileData.radius}
//     style={styles.picker}
//     onValueChange={(itemValue) => handleChange('radius', itemValue)}
// >
//     <Picker.Item label="5 miles" value="5" />
//     <Picker.Item label="10 miles" value="10" />
//     <Picker.Item label="15 miles" value="15" />
//     <Picker.Item label="20 miles" value="20" />
//     <Picker.Item label="25 miles" value="25" />
//     <Picker.Item label="30 miles" value="30" />
//     <Picker.Item label="35 miles" value="35" />
//     <Picker.Item label="40 miles" value="40" />
//     <Picker.Item label="45 miles" value="45" />
//     <Picker.Item label="50 miles" value="50" />
// </Picker>

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
        //top: 200,
        left: 0,
        right: 0,
        //bottom: 160,
    },
    scrollViewContent: (Platform.OS === 'ios') ? {
        flexGrow: 1,
        backgroundColor: 'white',
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 10,
    } : {
        flexGrow: 1,
        backgroundColor: 'white',
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 200,
    },
    narrowColumn: {
        backgroundColor: 'whitesmoke',
        padding: 10, 
        borderRadius: 8, 
        //width: '95%',
    },

  registrationPageContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 10,
    alignItems: 'center',
  },
  form: {
    //width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formPicker: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
  picker: {
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 20,
        //fontSize: 5,
        //height: '50%',
    },
  pickerFont: {
        fontSize: 10,
    },
  centerText: {
    textAlign: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    fontSize: 16,
  },
  registrationWelcome: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  zero: {
    marginTop: 0,
  },
  label: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: 10,
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
});

export default RegistrationPage3;
