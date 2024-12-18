import {
  StyleSheet,
  Text,
  View,
  Image,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {TextInput} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import instance from '../../Components/BaseUrl';
import Loader from '../../Components/Loaders/Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async () => {
    // navigation.replace('Home')
    try {
      setIsLoading(true);
      const response = await instance.post(
        '/login/token',
        {
          username: username,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      console.log(response.data, 'Login');
      if (response.status === 200) {
        // console.log(response.data);
        const authToken = response.data.access_token;
        const employeeId = response.data.employee.id;
        const userId = response.data.user.id;

        await AsyncStorage.setItem('AUTH_TOKEN', authToken);
        await AsyncStorage.setItem('employeeId', employeeId.toString());
        await AsyncStorage.setItem('userId', userId.toString());

        ToastAndroid.show('Successfully Logged In', ToastAndroid.SHORT);
        navigation.replace('Home');
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } catch (error) {
      ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.LONG);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.MainContainer}>
      <View>
        <View>
          <Image
            style={styles.Imagestyle}
            source={require('../../assets/Images/TastelandLogo.jpeg')}
          />
        </View>
        <View style={styles.LoginContainer}>
          <Text style={styles.LoginTxt}>Login</Text>

          <View style={styles.TextInputContainer}>
            <TextInput
              style={{backgroundColor: '#fff'}}
              label="User Name"
              value={username}
              textColor={'#000'}
              activeUnderlineColor="#3ef0c0"
              onChangeText={text => {
                let formattedText = text;
                formattedText = formattedText.replace(/\D/g, '');
                if (formattedText.length > 4) {
                  formattedText =
                    formattedText.slice(0, 4) + '-' + formattedText.slice(4);
                }
                formattedText = formattedText.slice(0, 12);

                setUsername(formattedText);
              }}
            />
          </View>

          <View style={styles.TextInputContainer}>
            <TextInput
              style={{backgroundColor: '#fff'}}
              label="Password"
              value={password}
              textColor={'#000'}
              secureTextEntry={true}
              activeUnderlineColor="#3ef0c0"
              onChangeText={password => setPassword(password)}
            />
          </View>

          <Text style={styles.forgotColor}>Forgot password?</Text>
        </View>

        <TouchableOpacity onPress={handleLogin} style={styles.ButtonContainer}>
          <LinearGradient
            colors={['#4db6ac', '#4b0082']}
            start={{x: 0, y: 0}}
            end={{x: 1.3, y: 0}}
            style={styles.linearGradient}>
            <Text style={styles.buttonText}>Login</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {isLoading ? <Loader /> : null}
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  MainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  Imagestyle: {
    height: 200,
    width: 150,
    alignSelf: 'center',
    marginTop: '20%',
  },
  LoginContainer: {
    height: 250,
    backgroundColor: '#e0e0e0',
    width: '90%',
    elevation: 4,
    padding: 10,
    shadowColor: '#fff',
    marginTop: 10,
    alignSelf: 'center',
    marginTop: '5%',
  },
  LoginTxt: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 10,
  },
  TextInputContainer: {
    marginTop: 10,
  },
  forgotColor: {
    color: 'indigo',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    paddingRight: 5,
    marginTop: 10,
  },
  linearGradient: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 3,
    zIndex: 2,
    elevation: 7,
    shadowColor: '#fff',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  ButtonContainer: {
    marginTop: '5%',
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    alignSelf: 'center',
    marginTop: 10,
  },
});
