import { View, Text, Image, TouchableWithoutFeedback, StyleSheet, Platform } from 'react-native';
import { useGlobalFeedbackContext, useGlobalContext, useGlobalTimerContext, useGlobalAudioContext, useGlobalNavigationContext } from '../context/RootContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PolaroidClick() {
  const { profileData, currentView } = useGlobalContext();
  const { navigate, loadingPage} = useGlobalNavigationContext();
  const { timerVisible } = useGlobalTimerContext();
  const insets = useSafeAreaInsets();

  if ((!profileData.firstname || profileData.firstname === '') || !(currentView === 'Pix' || currentView === 'Tix')){
    return null;
  }

  const goToProfile = async () => {
    //alert("clicked");
    if (loadingPage || timerVisible) {
      return false;
    }

    navigate("Profile");
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={goToProfile}>
        <View style={styles.polaroid} >
          <View style={styles.imageContainer} >
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    maxWidth: 150,
    position: 'absolute',
  },
  polaroid: {
    width: 70,
    aspectRatio: 0.85,
    backgroundColor: 'rgba(0,0,0,0)',
    padding: 10,
    transform: [{ rotate: '-20deg' }],
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 5,
    backgroundColor: 'rgba(0,0,0,0)',
  },
});