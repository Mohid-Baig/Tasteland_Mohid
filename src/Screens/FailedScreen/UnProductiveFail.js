import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UnProductiveFail = ({userId}) => {
  const loadFailedOrders = async () => {
    try {
      const storedFailedUNOrders = await AsyncStorage.getItem(
        `failedUnProductiveOrders_${userId}`,
      );

      if (storedFailedUNOrders) {
        const parsedOrders = JSON.parse(storedFailedUNOrders);
        console.log(JSON.stringify(parsedOrders));
      } else {
        console.log('No failed un productive orders found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error loading failed unproductive orders:', error);
    }
  };
  useEffect(() => {
    if (userId) {
      loadFailedOrders();
    }
  }, [userId]);
  return (
    <View>
      <Text>unProductiveFail</Text>
    </View>
  );
};

export default UnProductiveFail;

const styles = StyleSheet.create({});
