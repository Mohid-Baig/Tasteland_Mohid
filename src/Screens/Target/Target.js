import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

const Target = () => {
  const [isConnected, setIsConnected] = useState(true); // State to track internet connection

  useEffect(() => {
    // Subscribe to network state
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected); // Update connection status
    });

    // Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <View style={{flex: 1}}>
      {isConnected ? (
        <WebView
          source={{
            uri: 'https://bi.tasteland.com.pk/public/question/be49ca59-b0d5-49f7-b40e-a4a7320821b9',
          }} // Replace with your URL
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
