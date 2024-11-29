import { StyleSheet, Text, View } from 'react-native'
import React ,{useState}from 'react'

const OrderStatus = ({leftStyle,Lefttxt,rightStyle,RightText}) => {
  return (
    <View style={{paddingLeft:'4%',paddingRight:'4%'}}>
      <View style={{flexDirection:'row'}}>
        <View style={{width:'40%'}}>
        <Text style={[{color:"#000",fontWeight:'bold'},leftStyle]}>
                {Lefttxt}
            </Text>

        </View>
        <View style={{width:'60%'}}>
            <Text style={[{color:"#000"},rightStyle]}>
                {RightText}
            </Text>
        </View>
      </View>
    </View>
  )
}

export default OrderStatus

const styles = StyleSheet.create({})