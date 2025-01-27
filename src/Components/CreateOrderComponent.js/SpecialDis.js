import {StyleSheet, Text, View} from 'react-native';
import React, {useState, useEffect} from 'react';

const SpecialDis = ({
  leftStyle,
  Lefttxt,
  rightStyle,
  RightText,
  percent,
  gross,
}) => {
  const [per, setPer] = useState(0);

  // Update 'per' when 'percent' changes
  useEffect(() => {
    if (percent && percent.length > 0) {
      percent.forEach(it => {
        setPer(it.rate); // This will set 'per' to the last item in 'percent'
      });
    }
  }, [percent]); // Only run when 'percent' changes

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
              {gross >= 2000 ? (
                <Text> ({per}%)</Text> // Displaying the state variable 'per'
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

export default SpecialDis;

const styles = StyleSheet.create({});
