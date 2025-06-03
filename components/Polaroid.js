import { View, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { useGlobalContext } from '../context/RootContext';
import { getImageSource } from './apputilities.js';

export default function Polaroid() {
  const { profileData } = useGlobalContext();

  if (!profileData.firstname) {
    return null;
  }

  const profilePic = () => {
    switch (profileData.gender) {
      case 'male':
        return require('../assets/images/male.png');

        break;

      case 'female':
        return require('../assets/images/female.png');

        break;

      case 'other':
        return require('../assets/images/other.png');

        break;

      default:
        return require('../assets/images/opt-out.png');
    }

    return require('../assets/images/opt-out.png');
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
        <View style={styles.polaroid} pointerEvents="box-none">
          <View style={styles.imageContainer} pointerEvents="box-none">
            <Image source={profilePic()} style={styles.image} />
          </View>
          <View style={styles.textContainer} pointerEvents="box-none">
            <Text style={styles.text}>{profileData.firstname}</Text>
          </View>
        </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    maxWidth: 150,
    position: 'absolute',
    //alignContent: "center",
    //left: (Dimensions.get('window').width * 0.5) - 180,
    //top: 20,
    //transform: [{"translateX": -180}, {"translateY": 25}]
  },
  polaroid: {
    position: 'absolute',
    width: 70,
    aspectRatio: 0.85,
    backgroundColor: 'white',
    paddingTop: 5,
    paddingLeft: 5,
    paddingRight: 5,
    transform: [{ rotate: '-20deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: -3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    top: -4,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Segoe Script',
    color: '#333',
  },
});