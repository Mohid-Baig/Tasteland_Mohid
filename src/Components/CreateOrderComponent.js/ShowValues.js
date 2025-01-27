import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const ShowValues = ({
  leftStyle,
  Lefttxt,
  rightStyle,
  RightText,
  percent,
  gross,
}) => {
  return (
    <View
      style={{
        paddingLeft: '4%',
        paddingRight: '4%',
        marginRight: 10,
        marginBottom: 10,
      }}>
      <View style={{flexDirection: 'row'}}>
        <View style={{width: '50%'}}>
          <Text style={[{color: '#000'}, leftStyle]}>{Lefttxt}</Text>
        </View>
        <View style={{width: '50%'}}>
          {percent ? (
            <Text style={[{marginLeft: 'auto', color: '#000'}, rightStyle]}>
              {gross >= percent?.lower_limit &&
              gross <= percent?.upper_limit ? (
                <Text> ({percent.rate}%)</Text>
              ) : (
                <Text>(0.0%)</Text>
              )}{' '}
              {RightText}
            </Text>
          ) : (
            <Text style={[{marginLeft: 'auto', color: '#000'}, rightStyle]}>
              {RightText}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default ShowValues;

const styles = StyleSheet.create({});
