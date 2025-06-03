import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    Platform, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Dimensions 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-datepicker';
import { Picker } from '@react-native-picker/picker';
import ImageUploader from '../components/ImageUploader';
import { dateToDynamoDB, dynamoDBToDate, dynamoDBToDisplay } from '../components/apputilities';
import { useGlobalContext } from '../context/RootContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../assets/react-datepicker.css";

const GenderSelect = ({ value, onChange, disabled }) => (
  <View style={radiostyles.container}>
    <Text style={styles.label}>Gender</Text>
    <View style={radiostyles.optionsContainer}>
      {['none', 'male', 'female', 'other'].map(option => (
        <TouchableOpacity
          key={option}
          onPress={() => {if (!disabled){onChange('gender', option)}}}
          style={radiostyles.option}
        >
          <View style={[radiostyles.radio, value === option && radiostyles.radioSelected]}>
            {value === option && <View style={radiostyles.radioInner} />}
          </View>
          <Text style={[radiostyles.optionText, disabled && radiostyles.disabled]}>
            {option === 'none' ? 'Opt Out' : option.charAt(0).toUpperCase() + option.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const RegistrationPage2 = () => {
    const { profileData, setProfileData } = useGlobalContext();
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const insets = useSafeAreaInsets();
    
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        
        // Clean up when component unmounts
        return () => {
            mounted.current = false;
        };
    }, []);

    const handleChange = useCallback((name, value) => {
        if (!mounted.current) return;

        setProfileData(prevState => ({
          ...prevState,
          [name]: name === 'dob' ? dateToDynamoDB(value) :  
                  value
        }));
      }, []);

    const handleDateChange = useCallback((event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
          handleChange('dob', selectedDate);
        }
      }, [handleChange]);

    const renderDatePicker = useCallback(() => {
        let dateValue = dynamoDBToDate(profileData.dob) || new Date();

        try {
            if (isNaN(dateValue.getTime())) {
                throw new Error('Invalid date');
            }
        } catch (error) {
            console.warn('Invalid date, using current date as fallback');
            dateValue = new Date(); // Use current date as fallback
        }

        if (Platform.OS === 'ios'){
            return (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={dateValue}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => handleChange('dob', selectedDate)}
                />
            );
            
        } else {
            const openDatePicker = () => {
              setShowDatePicker(true);
            };

            return (
              <View>
                <TouchableOpacity onPress={openDatePicker}>
                  <View style={styles.datePickerButton}>
                    <Text style={styles.graymediumText} >{dateToDynamoDB(dateValue)}</Text>
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={dateValue}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => handleDateChange('dob', selectedDate)}
                  />
                )}
              </View>
            );
        }
      }, [profileData.dob, showDatePicker, handleChange]);

    const memoizedDatePicker = useMemo(() => renderDatePicker(), [renderDatePicker]);

    useEffect(() => {
        return () => {
            // Cleanup any picker references
            setProfileData(prev => ({...prev}));
        };
    }, []);

    return (
        <View style={[styles.box, { top: 190 + insets.top, bottom: 0, height: "80%"}]}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.narrowColumn}>
                    <View >
                        <Text style={styles.centerText}>Now that you know who we are, tell us a little about yourself…</Text>
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter first name"
                            value={profileData.firstname}
                            onChangeText={(text) => handleChange('firstname', text)}
                            maxLength={40}
                            autoComplete="off"
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter last name"
                            value={profileData.lastname}
                            onChangeText={(text) => handleChange('lastname', text)}
                            maxLength={40}
                            autoComplete="off"
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Birthdate</Text>
                        <View style={styles.datePickerContainer}>
                            {memoizedDatePicker}
                        </View>
                    </View>

                    <GenderSelect 
                        value={profileData.gender}
                        onChange={handleChange}
                        disabled={false}
                      />

                    
                </View>
            </ScrollView>
        </View>
    );
};

const radiostyles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  radioSelected: {
    borderColor: 'black',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'black',
  },
  optionText: {
    fontSize: 16,
    color: 'black',
  },
  disabled: {
    opacity: 0.5,
  },
});

const styles = StyleSheet.create({
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
        borderRadius: 8, 
        //width: '95%',
    },
    centerText: {
        textAlign: 'center',
        fontSize: 16, 
        paddingVertical: 20,
    },
    photoSection: {
        marginBottom: 20,
    },
    formGroup: {
        width: '100%',
        marginBottom: 15,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 5,
        marginLeft: 10,
        marginRight: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: 'white',
    },
    datePickerContainer: {
        //borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 10,
        alignItems: 'left',
    },
    dateDisplay: {
        color: '#ccc',
    },
    picker: (Platform.OS === 'ios') ? {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    } : {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingTop: 0,
        paddingBottom: 60,
        paddintLeft: 60,
        paddingRight: 60,
    },
    picklabel: {
        fontWeight: 'bold',
    },
});

export default RegistrationPage2;