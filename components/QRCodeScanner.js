import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useContext } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform, SafeAreaView } from 'react-native';
import QrReader from "react-qr-scanner";
import { useGlobalFeedbackContext } from '../context/RootContext';


const QRCodeScanner = ({ onScan }) => {
  const { setFeedback } = useGlobalFeedbackContext();

  const [facing, setFacing] = useState('back');
  const [scanned, setScanned] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const askPermission = async () => {
    const { granted } = await requestPermission();
  }

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.<Button onPress={askPermission} title="Grant Permission" />
    return (
      <View style={[styles.container]}>
        <Text style={styles.granttext} >DRINX needs your permission to enable the camera for you to scan the QR code for this offer.</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={askPermission}>
            <Text style={styles.text} >Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (permission.granted === null || permission.granted === false) {
    return <View />;
  } 

  function toggleCameraFacing() {
    //onScan('waapsdev@gmail.com');
    setFacing(current => (current === 'back' ? 'front' : 'back'));//
  }

  const handleBarCodeScanned = (data) => {setScanned(true); onScan(data.data)};

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        barcodeScannerSettings={{barcodeTypes: ["qr"], }}
        onBarcodeScanned = {scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={toggleCameraFacing}>
            <Text style={styles.text} >Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    alignContent: 'flex-end',
    marginBottom: 180,
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    height: 50,
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 8,
    backgroundColor: 'white',
  },
  granttext: {
    top: "40%",
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: "80%",
    marginLeft: "10%",
    borderRadius: 10,
  },
  grantCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default QRCodeScanner;