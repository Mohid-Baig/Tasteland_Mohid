import React from 'react';
import { StyleSheet, View, ActivityIndicator, } from 'react-native';

const Loader = () => {
  return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size={60} color="#ccc" />
      </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    position: 'absolute',
    flex:1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    width:'100%',
    height:'100%',
    justifyContent:'center'
   
  },
});

export default Loader;