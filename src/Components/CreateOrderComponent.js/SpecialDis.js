// import {StyleSheet, Text, View} from 'react-native';
// import React from 'react';

// const ShowValues = ({
//   leftStyle,
//   Lefttxt,
//   rightStyle,
//   RightText,
//   percent, // Ensure percent is passed correctly
//   gross,
// }) => {
//   // console.log('Received percent data:', percent);
//   // console.log('Gross value:', gross);
//   // console.log(RightText, 'right text');
//   // Find the applicable discount based on the gross value
//   let displayRate = 0;

//   // Make sure percent is an array and has data
//   // if (Array.isArray(percent) && percent.length > 0) {
//   //   percent.forEach(item => {
//   //     // Check if the gross falls within the range defined by lower_limit and upper_limit
//   //     if (gross >= item.lower_limit && gross <= item.upper_limit) {
//   //       displayRate = item.rate; // Set the rate from the matched item
//   //     }
//   //   });
//   // }

//   // Fallback message if no matching rate is found
//   const rateText = percent
//     ? `(${parseFloat(percent).toFixed(2)}%)` // Show percent with 2 decimals
//     : '(0.00%)';

//   return (
//     <View
//       style={{
//         paddingLeft: '4%',
//         paddingRight: '4%',
//         marginRight: 10,
//         marginBottom: 10,
//       }}>
//       <View style={{flexDirection: 'row'}}>
//         <View style={{width: '50%'}}>
//           <Text style={[{color: '#000'}, leftStyle]}>{Lefttxt}</Text>
//         </View>
//         <View style={{width: '50%'}}>
//           {percent ? (
//             <Text style={[{marginLeft: 'auto', color: '#000'}, rightStyle]}>
//               {rateText} {/* Display dynamic rate */} {RightText}
//             </Text>
//           ) : (
//             <Text style={[{marginLeft: 'auto', color: '#000'}, rightStyle]}>
//               {RightText}
//             </Text>
//           )}
//         </View>
//       </View>
//     </View>
//   );
// };

// export default ShowValues;

// const styles = StyleSheet.create({});

import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const SpecialDis = ({
  leftStyle,
  Lefttxt,
  rightStyle,
  RightText,
  percent, // Ensure percent is passed correctly
  gross,
}) => {
  // Log percent to check its value
  console.log('Received percent:', percent);

  // Default to 0 if percent is falsy
  const displayRate = percent ? parseFloat(percent).toFixed(2) : '0.00';

  // Prepare rate text if percent exists
  const rateText = percent ? `(${displayRate}%)` : '';

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
          <Text style={[{marginLeft: 'auto', color: '#000'}, rightStyle]}>
            {rateText}
            {RightText}
          </Text>
        </View>
      </View>
    </View>
  );
};
export default SpecialDis;
