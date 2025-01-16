import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Target = ({route}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [employeeID, setEmployeeID] = useState();
  const [formattedString, setFormattedString] = useState('');
  const [DistributerName, setDistributerName] = useState('');
  const {first, last} = route.params;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const fk_employee = async () => {
    const fk_employeeID = await AsyncStorage.getItem('fk_employee');
    setEmployeeID(fk_employeeID);
    const distributerNameStored = await AsyncStorage.getItem('DistributerName');
    if (distributerNameStored) {
      setDistributerName(distributerNameStored);
      console.log('DistributerName:', distributerNameStored);
    } else {
      console.log('No DistributerName found in AsyncStorage.');
    }
    if (fk_employeeID && first && last) {
      const formatted = `${fk_employeeID} - ${first} ${last}`;
      setFormattedString(formatted);
      console.log(formatted);
    }
  };

  useEffect(() => {
    fk_employee();
  }, [first, last]);

  return (
    <View style={{flex: 1}}>
      {isConnected ? (
        <WebView
          source={{
            uri: `https://bi.tasteland.com.pk/public/question/be49ca59-b0d5-49f7-b40e-a4a7320821b9?employee=${formattedString}&date=past30days&distribution=${DistributerName}#hide_parameters=distribution,target_item,employee`,
          }}
          style={{marginTop: 20}}
        />
      ) : (
        <View style={styles.noConnectionContainer}>
          <Text style={styles.noConnectionText}>Your internet is off</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  noConnectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da', // Light red background for no connection
  },
  noConnectionText: {
    fontSize: 18,
    color: '#721c24', // Dark red text
    textAlign: 'center',
  },
});

export default Target;
