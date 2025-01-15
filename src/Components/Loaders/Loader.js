import React from 'react';
import {StyleSheet, View, ActivityIndicator} from 'react-native';

const Loader = ({
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  indicatorColor = '#ccc',
}) => {
  return (
    <View style={[styles.loaderContainer, {backgroundColor}]}>
      <ActivityIndicator size={60} color={indicatorColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    position: 'absolute',
    flex: 1,
    zIndex: 1000,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
});

export default Loader;
