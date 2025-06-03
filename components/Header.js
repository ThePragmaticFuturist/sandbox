import { memo } from 'react';
import { View, Image, StyleSheet, SafeAreaView, Dimensions} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PolaroidClick from '../components/PolaroidClick.js';
import Polaroid from '../components/Polaroid';
import { useGlobalContext } from '../context/RootContext';


const MemoizedPolaroidClick = memo(PolaroidClick);

const Header = () => {
  const clicked = () => {
    //console.log("foreground clicked");
  }

  const { 
    currentView,
  } = useGlobalContext();

  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    centerContent: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    view:{
      width: '100%',
      position: 'absolute',
      top: insets.top + 10,
      left: 0,
      right: 0,
    },
    container: {
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    polaroid: {
      position: 'relative',
      top: 25,
      left: -180,
    },
    polaroidtwo: {
      position: 'relative',
      top: 15,
      left: -110,
    },
    backgroundPressable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      //zIndex: 30,
      
    },
    logo: {
      width: '100%',
      paddingTop: 16, // Equivalent to 1em
      paddingBottom: 8, // Equivalent to 0.5em
      
    },
  });

  return (
    <View style={styles.view}>
      {currentView !== 'Map' && <View style={styles.centerContent} pointerEvents="box-none">
      
        {(currentView === 'Pix' || currentView === 'Tix' ) && <View style={styles.polaroid}>
            <Polaroid />
        </View>}

        <View style={styles.backgroundPressable} pointerEvents="box-none">
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode='contain'
          />
        </View>

        <View style={styles.polaroid}>
            {(currentView === 'Pix' || currentView === 'Tix' ) && <MemoizedPolaroidClick />}
        </View>

      </View>}
    </View>
  )
};



export default Header;