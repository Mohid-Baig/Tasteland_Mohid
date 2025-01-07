import React, {useEffect} from 'react';
import {StatusBar, StyleSheet, Image, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';

const Splash = ({navigation}) => {
  useEffect(() => {
    checkToken();
  }, [navigation]);

  const checkToken = async () => {
    // navigation.replace('Login')
    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    if (token) {
      navigation.replace('Home');
    } else {
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    }
  };

  return (
    <View style={styles.MainContainer}>
      <StatusBar backgroundColor={'#393a3f'} />
      <View>
        <Image
          style={styles.Imagestyle}
          source={require('../../assets/Images/Pic.png')}
        />
      </View>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  MainContainer: {
    flex: 1,
    backgroundColor: '#393a3f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  Imagestyle: {
    height: 200,
    width: 150,
    alignSelf: 'center',
  },
});
