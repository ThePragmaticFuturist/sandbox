import React, { useState, forwardRef, useImperativeHandle, useCallback, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useGlobalFeedbackContext } from '../context/RootContext';

import { accessDatabase, getImageSource } from './apputilities';
// setFormData, 
const ImageUploader = forwardRef(({ formData, profileFormEnabled, setFormData }, ref) => {
    const { setFeedback, setElipses } = useGlobalFeedbackContext();

    const [allowImages, setAllowImages] = useState(false);
  
    const [imageBuffer, setImageBuffer] = useState(formData.photo || '');
    const [originalPhoto] = useState(formData.photo || '');

    useImperativeHandle(ref, () => ({
        resetPhoto: () => setImageBuffer(originalPhoto)
    }));

    const handleImagePicker = useCallback(async () => {
        if (!profileFormEnabled) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { return };

        setElipses(true);
        setFeedback('Loading photo');

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            exif: false,
        });

        if (result.canceled) return;

        const { uri, width, height } = result.assets[0];
        const fileType = uri.split('.').pop().toLowerCase();

        if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
            setFeedback("Please choose a JPG, PNG, or WebP image.");
            return;
        }

        const scaleFactor = 128 / width;
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 128, height: Math.round(height * scaleFactor) } }],
            { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );

        const randomID = Math.floor(Math.random() * 10000000);
        const filename = `${randomID}.${fileType}`;

        const base64Image = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        await accessDatabase({
            action: "upload",
            keypair: filename,
            content: `image/${fileType}`,
            tableName: atob(base64Image),
        });
        
        
        setFormData(prevState => ({
            ...prevState,
            photo: `https://drinximages.s3.amazonaws.com/${filename}`
        }));
        
        
        setImageBuffer(manipulatedImage.uri);

        setElipses(false);
        setFeedback(' ');

    }, [profileFormEnabled, formData, setFormData, setFeedback, setElipses]);

    const ImageContent = useCallback(() => (
        imageBuffer ? (
            <Image source={getImageSource(imageBuffer)} style={styles.image} />
        ) : (
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Tap to upload image</Text>
            </View>
        )
    ), [imageBuffer]);

    return (
        <View style={styles.container}>
            {profileFormEnabled ? (
                <TouchableOpacity onPress={handleImagePicker} style={styles.imageContainer}>
                    <ImageContent />
                </TouchableOpacity>
            ) : (
                <View style={styles.imageContainer}>
                    <ImageContent />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    placeholderText: {
        color: '#aaa',
        textAlign: 'center',
    },
});

export default ImageUploader;