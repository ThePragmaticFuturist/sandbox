import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Linking } from 'react-native';

const TermsModal = ({ termsVisible, handleTermsClick }) => {
  const [scrollViewHeight, setScrollViewHeight] = useState(Dimensions.get('window').height - 360);

  const updateScrollViewHeight = useCallback(() => {
    const windowHeight = Dimensions.get('window').height;
    setScrollViewHeight(windowHeight - 360);
  }, []);

  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', updateScrollViewHeight);
    return () => dimensionsHandler.remove();
  }, [updateScrollViewHeight]);

  if (!termsVisible) {
    return null;
  }

  const handleEmailPress = () => {
    Linking.openURL('mailto:contact@drinx.mobi');
  };

  return (
    <View style={[styles.container, { height: "100%" }]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.narrowColumn}>
          <Text style={styles.title}>Terms of Use for Drinx Mobile App</Text>
          <Text style={styles.date}>Effective Date: January 1, 2024</Text>
          <Text>{'\n'}</Text>

          <Text>Welcome to Drinx, the ultimate mobile app for discovering exciting drink offers near you. Before you embark on this thrilling journey, please take a moment to review our updated Terms of Use:</Text>
          <Text>{'\n'}</Text>
          <Text>
            1. <Text style={styles.bold}>Acceptance of Terms</Text>{'\n'}
            By downloading, installing, or using the Drinx mobile app, you agree to abide by these Terms of Use.
          </Text>
          
          <Text>
            2. <Text style={styles.bold}>Age Restriction</Text>{'\n'}
            To use our mobile app, you must be at least 21 years old. If you are under 21 years old, you are prohibited from using the application.
          </Text>

          <Text>
            3. <Text style={styles.bold}>Drinking and Driving</Text>{'\n'}
            We do not condone or encourage drinking and driving. If you choose to consume alcohol, do not drive under the influence. We are not responsible for any legal consequences or damages resulting from drinking and driving.
          </Text>

          <Text>
            4. <Text style={styles.bold}>Collection of User Data</Text>{'\n'}
            We may collect and store certain information about you to provide a more customized experience, including your location, preferences, and actual usage. By using the App, you consent to our collection and use of this information.
          </Text>

          <Text>
            5. <Text style={styles.bold}>Access to Camera</Text>{'\n'}
            To scan QR codes, the App requires access to your device's camera. By using the App, you grant us permission to access your camera.
          </Text>

          <Text>
            6. <Text style={styles.bold}>Location Services Activation</Text>{'\n'}
            To fully utilize the application's features, you must activate your device's location services. This is essential for identifying your location in proximity to the bars where offers have been launched. Drinx relies on this information to provide you with accurate and relevant drink offers.
          </Text>

          <Text>
            7. <Text style={styles.bold}>Notifications Enablement</Text>{'\n'}
            In order to receive real-time updates on new drink offers from bars within your requested location and radius, notifications must be enabled on your device. This ensures that you stay informed about exciting opportunities to enjoy your favorite beverages at nearby establishments.
          </Text>

          <Text>
            8. <Text style={styles.bold}>Liability</Text>{'\n'}
            The developer of the mobile app is not responsible or liable for any misuse of the application. By using the application, you assume all risks associated with your use of the application. The developer is not responsible for any damages, direct or indirect, resulting from your use of the application.
          </Text>

          <Text>
            9. <Text style={styles.bold}>User Conduct</Text>{'\n'}
            You agree to use the mobile app in accordance with all applicable laws and regulations. You also agree not to use the application for any illegal or unauthorized purpose.
          </Text>

          <Text>
            10. <Text style={styles.bold}>Intellectual Property</Text>{'\n'}
            All content and intellectual property associated with the application are owned by the developer. You agree not to use, copy, or distribute any of the content or intellectual property without the express written consent of the developer.
          </Text>

          <Text>
            11. <Text style={styles.bold}>Governing Law</Text>{'\n'}
            These terms and conditions shall be governed by and construed in accordance with the laws of the State of Georgia without regard to its conflict of law provisions.
          </Text>

          <Text>
            12. <Text style={styles.bold}>User Responsibilities</Text>{'\n'}
            As a Drinx user, you are responsible for maintaining the accuracy and security of your account information. Any misuse or unauthorized access to your account should be reported immediately to Drinx support.
          </Text>

          <Text>
            13. <Text style={styles.bold}>Usage Restrictions</Text>{'\n'}
            You agree not to use the Drinx app for any unlawful or prohibited activities. This includes, but is not limited to, engaging in disruptive behavior, attempting to access unauthorized areas of the app, or violating the rights of other users.
          </Text>

          <Text>
            14. <Text style={styles.bold}>Termination of Services</Text>{'\n'}
            Drinx reserves the right to terminate or suspend services to any user found in violation of these Terms of Use. We also reserve the right to modify or discontinue the app, or any part thereof, at any time.
          </Text>

          <Text>
            15. <Text style={styles.bold}>Privacy Policy</Text>{'\n'}
            Your use of the Drinx app is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information. Please review our Privacy Policy to understand our practices.
          </Text>

          <Text>
            By continuing to use the Drinx app, you acknowledge that you have read, understood, and agreed to these Terms of Use. We are thrilled to have you as part of the Drinx community, and we hope you enjoy discovering fantastic drink offers in your area.
          </Text>

          <Text>If you have any questions or concerns, please contact our support team at:</Text>
          <Text>Drinx Support: <Text style={styles.link} onPress={handleEmailPress}>contact@drinx.mobi</Text></Text>

          <Text>Cheers,</Text>
          <Text>The Drinx Team</Text>

          <Text>&nbsp;</Text>

          <Text style={styles.title}>Drinx Mobile App Privacy Policy</Text>
          <Text style={styles.date}><Text style={styles.bold}>Effective Date:</Text> January 1, 2024</Text>
          <Text>Welcome to DRINX! This Privacy Policy outlines how we collect, store, and use Personally Identifiable Information (PCI) data within the Drinx mobile application. By using our app, you agree to the practices described in this policy.</Text>

          <Text>
            1. <Text style={styles.bold}>Collection of PCI Data:</Text>{'\n'}
            When you use the Drinx app, we may collect PCI data, including but not limited to:{'\n'}
            - Full Name{'\n'}
            - Contact Information{'\n'}
            - Gender{'\n'}
            - Location Information{'\n'}
            - Transaction History{'\n'}
            This information is collected to facilitate secure and convenient transactions for drink redemptions at participating establishments.
          </Text>

          <Text>
            2. <Text style={styles.bold}>Storage of PCI Data:</Text>{'\n'}
            We take the security of your PCI data seriously. All sensitive information is encrypted and stored in compliance with Payment Card Industry Data Security Standard (PCI DSS) guidelines. Our servers employ industry-standard security measures to protect your data against unauthorized access, disclosure, alteration, and destruction.
          </Text>

          <Text>
            3. <Text style={styles.bold}>Usage of PCI Data:</Text>{'\n'}
            Your PCI data is used for the following purposes:{'\n'}
            - Facilitating Transactions: To process drink redemptions securely and accurately.{'\n'}
            - Personalization: To enhance your app experience by providing tailored recommendations and offers based on your preferences and purchase history.{'\n'}
            - Communication: To send transaction receipts, updates on offers, and relevant promotional content.
          </Text>

          <Text>
            4. <Text style={styles.bold}>Third-Party Services:</Text>{'\n'}
            We may engage third-party services to provide other app-related functionalities. These service providers are required to adhere to data protection standards and security measures.
          </Text>

          <Text>
            5. <Text style={styles.bold}>Consent:</Text>{'\n'}
            By using the Drinx app, you explicitly consent to the collection, storage, and usage of your PCI data as outlined in this Privacy Policy. You may withdraw your consent at any time by discontinuing the use of the app.
          </Text>

          <Text>
            6. <Text style={styles.bold}>Data Retention:</Text>{'\n'}
            We retain your PCI data for as long as necessary to fulfill the purposes outlined in this Privacy Policy. If you wish to have your data deleted, please contact us at [contact@drinx.mobi].
          </Text>

          <Text>
            7. <Text style={styles.bold}>Updates to the Privacy Policy:</Text>{'\n'}
            We reserve the right to update this Privacy Policy to reflect changes in our data practices. Any material changes will be communicated through the app or via email.
          </Text>

          <Text>
            <Text style={styles.bold}>Contact Information:</Text>{'\n'}
            If you have questions or concerns about our privacy practices, please contact us at:{'\n'}
            Drinx Support: <Text style={styles.link} onPress={handleEmailPress}>contact@drinx.mobi</Text>
          </Text>

          <Text>Thank you for trusting Drinx with your information. Cheers to a secure and enjoyable experience with our mobile app!</Text>

          <Text>Do you accept these terms and conditions?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => handleTermsClick(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={() => handleTermsClick(true)}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //width: '100%',
    position: 'absolute',
    backgroundColor: 'whitesmoke',
    left: 0,
    right: 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: 'white',
    paddingLeft: 20,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 400,
  },
  narrowColumn: {
    //width: '95%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    padding: 10,
    margin: 10,
    borderRadius: 4,
    width: '40%',
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#cdcece',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default TermsModal;