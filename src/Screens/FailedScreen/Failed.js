import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import FailTopTab from '../../Navigations/TopTab/FailTopTab';

const Failed = ({route}) => {
  const {userId} = route.params;
  return (
    <View style={{flex: 1}}>
      <FailTopTab userId={userId} />
    </View>
  );
};

export default Failed;

const styles = StyleSheet.create({});
