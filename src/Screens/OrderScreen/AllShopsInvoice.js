import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableHighlight,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector, useDispatch } from 'react-redux';
import { Remove_All_Cart } from '../../Components/redux/constants';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const AllShopsInvoice = ({ route, navigation }) => {
  const [Detail, setDetail] = useState([]);
  const [singleDetail, setSingleDetail] = useState();
  const [gstRate, setGSTrate] = useState();
  const { cartItems, Gst, orderBokerId, local, existingOrderId } = route.params;
  const dispatch = useDispatch();
  // const state =  NetInfo.fetch();

  useEffect(() => {
    return () => {
      dispatch({ type: Remove_All_Cart }); // Clear cart when leaving the screen
    };
  }, [dispatch]);


  console.log(JSON.stringify(cartItems), '-----mm');

  useEffect(() => {
    if (cartItems?.details) {
      const uu = cartItems.details.map(item => {
        setSingleDetail(item);
      });
      setDetail(cartItems.details);
    }
  }, [cartItems]);

  const TO_amount = cartItems?.net_amount;

  const storeTotalEditAmount = async () => {
    const TO_amount = cartItems?.net_amount;
    const userId = await AsyncStorage.getItem('userId');


    const totalAmount = parseFloat(TO_amount)
    try {
      await AsyncStorage.setItem(
        `totalViewShopInvoice_${userId}`,
        JSON.stringify(totalAmount)
      );

      console.log(`Stored Total Edit Amount: ${totalAmount}`);
    } catch (error) {
      console.error("Error storing total edit amount: ", error);
    }
  };
  const calculateOrderForMultipleItems = async () => {
    const userId = await AsyncStorage.getItem('userId');
    let totalCartons = 0;

    console.log('Starting calculation for total cartons...');

    cartItems.cartItems.forEach((item, index) => {
      const { carton_ordered, box_ordered, itemss } = item;
      const { box_in_carton } = itemss.pricing;

      console.log(`\nProcessing item ${index + 1}:`);
      console.log('carton_ordered:', carton_ordered);
      console.log('box_ordered:', box_ordered);
      console.log('box_in_carton:', box_in_carton);

      totalCartons += carton_ordered;
      console.log('After adding carton_ordered, totalCartons:', totalCartons);

      if (box_ordered > 0) {
        const additionalCartons = box_ordered / box_in_carton;
        totalCartons += additionalCartons;
        console.log('After adding box_ordered, totalCartons:', totalCartons);
      }
    });

    console.log('\nFinal totalCartons:', totalCartons);

    await AsyncStorage.setItem(
      `totalCartonsinInvoice_${userId}`,
      totalCartons.toFixed(1),
    );
    return totalCartons;
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    return dateString.slice(0, 10);
  };

  console.log(formatDate(cartItems.date));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.main}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.StaticContainer}>
          <View>
            <Text style={styles.Text1}>Invoice Number</Text>
            <Text style={styles.Text1}>Order Status</Text>
            <Text style={styles.Text1}>Payment Done</Text>
          </View>
          <View style={{ marginLeft: 25 }}>
            <Text style={styles.Text2}>{existingOrderId ? existingOrderId : '--'}</Text>
            {cartItems?.status ? (
              <View style={styles.pending}>
                <Text style={[styles.Text2, { color: '#fff' }]}>
                  {cartItems?.status}
                </Text>
              </View>
            ) : (
              <View style={[styles.pending, { backgroundColor: '#fff' }]}></View>
            )}
            <Text style={styles.Text2}>--</Text>
          </View>
        </View>

        <View style={[styles.StaticContainer, { marginTop: 25 }]}>
          <View>
            <Text style={styles.Text1}>Shop ID</Text>
            <Text style={styles.Text1}>Shop Name</Text>
            <Text style={styles.Text1}>Owner</Text>
            <Text style={styles.Text1}>Cell Number</Text>
          </View>
          <View style={{ marginLeft: 30 }}>
            <Text style={styles.Text2}>{cartItems?.shop?.id}</Text>
            <Text style={styles.Text2}>{cartItems?.shop?.name}</Text>
            <Text style={styles.Text2}>{cartItems?.shop?.owner}</Text>
            <Text style={styles.Text2}>{cartItems?.shop?.cell}</Text>
          </View>
        </View>

        <View style={styles.ContainerAdjustment}>
          {Detail.map(it => {
            return (
              <View style={styles.OrderDetail} key={it?.id}>
                <Text style={{ fontSize: 23, color: '#000', fontWeight: '700' }}>
                  {it?.product}
                </Text>
                <View style={{ marginTop: 25 }}>
                  <Text style={styles.OrderDetailText}>
                    {it?.product} {it?.variant}
                  </Text>
                  <Text style={styles.OrderDetailText}>{it?.sku}</Text>
                  <View style={styles.C1}>
                    <View style={styles.centre}>
                      <Text style={styles.C1_text1}>Quantity</Text>
                      <Text style={styles.C1_text2}>
                        {it?.carton_ordered} - {it?.box_ordered}
                      </Text>
                    </View>
                    <View style={styles.centre}>
                      <Text style={styles.C1_text1}>Trade Price</Text>
                      <Text style={styles.C1_text2}>
                        {(it?.trade_price).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.centre}>
                      <Text style={styles.C1_text1}>Trade Offer</Text>
                      <Text style={styles.C1_text2}>
                        {(it?.trade_price * (it?.trade_offer / 100)).toFixed(2)}{' '}
                        ({Math.round(it?.trade_offer)}
                        %)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.C1}>
                    <View style={styles.centre}>
                      <Text style={styles.C1_text1}>Gross Amount</Text>
                      <Text style={styles.C1_text2}>
                        {Math.round(
                          it.trade_price *
                          (it.carton_ordered * it.box_in_carton +
                            it.box_ordered)
                        )}
                      </Text>
                    </View>
                    <View style={styles.centre}>
                      <Text style={styles.C1_text1}>After TO Amount</Text>
                      <Text style={styles.C1_text2}>
                        {Math.round(
                          it.trade_price *
                          (it.carton_ordered *
                            it.box_in_carton +
                            it.box_ordered) -
                          it.trade_price *
                          (it.trade_offer / 100) *
                          (it.carton_ordered *
                            it.box_in_carton +
                            it.box_ordered)
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View>
          <View
            style={[
              styles.ContainerAdjustment,
              {
                borderTopWidth: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <View>
              <Text style={styles.gstText}>Total GST:</Text>
              <Text style={styles.gstText}>Gross Total:</Text>
              <Text style={styles.gstText}>TO Discount:</Text>
              <Text style={styles.gstText}>Distributor Discount:</Text>
              <Text style={styles.gstText}>Special Discount:</Text>
            </View>
            <View style={{ marginLeft: 15, justifyContent: 'center' }}>
              <Text style={styles.Text2}>
                {Gst.toFixed(2)}
                {/* ({singleDetail?.gst_rate})% */}
              </Text>
              <Text style={styles.Text2}>
                {cartItems?.gross_amount} (Inclusive of GST)
              </Text>
              <Text style={styles.Text2}>
                {(cartItems?.todiscount).toFixed(2)}
              </Text>

              <Text style={styles.Text2}>
                {Math.round(cartItems?.distribution || 0)}
              </Text>

              <Text style={styles.Text2}>
                {(cartItems?.special).toFixed(2) || 0}
              </Text>
            </View>
          </View>

          <View style={styles.StaticContainer}>
            <View>
              <Text style={styles.Text1}>Total Discount:</Text>
              <Text style={styles.Text1}>Net Invoice:</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.Text2}>
                {Math.round(cartItems?.distributionTO)}
              </Text>
              <Text style={[styles.Text2, { fontWeight: 'bold' }]}>
                {Math.round(TO_amount)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {(cartItems?.status === 'pending' || cartItems?.unid) && (
        <TouchableHighlight
          style={styles.EditButton}
          onPress={async () => {
            try {
              await storeTotalEditAmount();
              calculateOrderForMultipleItems();
              navigation.navigate('CreateOrder', {
                shopData: {
                  Shopid: cartItems?.shop?.id,
                  Shopname: cartItems?.shop?.name,
                },
                Invoiceitems: {
                  ...cartItems,
                },
                Store: cartItems?.shop,
                existingOrderId: existingOrderId,
                RouteDate: formatDate(cartItems?.date),
                uuiddd: cartItems?.unid,
              });
            } catch (error) {
              console.error('Error during navigation or storing total edit amount:', error);
            }
          }}

          underlayColor="#0e8ebd">
          <FontAwesome name="pencil" size={25} color={'#fff'} />
        </TouchableHighlight>
      )}
    </View>
  );
};
export default AllShopsInvoice;
const styles = StyleSheet.create({
  main: {
    // flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    paddingHorizontal: 20,
  },
  StaticContainer: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  Text1: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  Text2: {
    fontSize: 15,
    color: '#000',
  },
  pending: {
    height: 30,
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2eb5ea',
    borderRadius: 5,
  },
  ContainerAdjustment: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cccccc',
    paddingVertical: 25,
  },
  OrderDetail: {
    padding: 13,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 5,
  },
  OrderDetailText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  C1: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // alignItems: 'center',
    marginTop: 10,
  },
  C1_text1: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
  },
  C1_text2: {
    fontSize: 14,
    color: '#000',
  },
  centre: {
    // justifyContent: 'center',
    // alignItems: 'center',
    width: '33.33%',
  },
  gstText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  EditButton: {
    backgroundColor: '#16a4dd',
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    position: 'absolute',
    bottom: '4%',
    right: '5%',
  },
});
