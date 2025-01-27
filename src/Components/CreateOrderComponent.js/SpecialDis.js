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
  console.log('Received percent data:', percent);
  console.log('Gross value:', gross);

  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (percent && percent.length > 0) {
      // Loop through percent array to find the matching discount rate based on gross
      percent.forEach(it => {
        if (gross >= it.gross_amount) {
          setRate(it.rate); // Set the discount rate dynamically
        }
      });
    }
  }, [percent, gross]); // Trigger whenever percent or gross changes

  // Default to 0 if no matching rate is found
  const displayRate = rate > 0 ? `(${rate}%)` : '(0.0%)';

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
              {displayRate} {/* Display the dynamically calculated rate */}
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
