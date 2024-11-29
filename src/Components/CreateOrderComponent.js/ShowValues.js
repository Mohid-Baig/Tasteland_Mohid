import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ShowValues = ({leftStyle,Lefttxt,rightStyle,RightText}) => {
  return (
    <View style={{paddingLeft:'4%',paddingRight:'4%',marginRight:10,marginBottom:10}}>
      <View style={{flexDirection:'row'}}>
        <View style={{width:'50%'}}>
        <Text style={[{color:"#b0b0b0"},leftStyle]}>
                {Lefttxt}
            </Text>

        </View>
        <View style={{width:'50%'}}>
            <Text style={[{marginLeft:'auto',color:"#b0b0b0"},rightStyle]}>
                {RightText}
            </Text>
        </View>
      </View>
    </View>
  )
}

export default ShowValues

const styles = StyleSheet.create({})