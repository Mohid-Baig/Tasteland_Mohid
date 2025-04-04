import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AddToCart } from '../../Components/redux/action';

const Internet = ({ selectedDate, orderBokerId, routeID, shopID }) => {
  const [internetAPI, setInternetAPI] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [GrossAmount, setGrossAmount] = useState(0);
  const [distributiveDiscount, setDistributiveDiscount] = useState(null);
  const [FinalDistributiveDiscount, setFinalDistributiveDiscount] = useState(0);
  const [SpecaialDiscount, setSpecialDiscount] = useState([]);
  const [applySpecialDiscount, setApplySpecialDiscount] = useState(0);
  const [gst, setGst] = useState(0);
  const [allProducts, setAllProducts] = useState([]);
  const [postOrderIds, setPostOrderIds] = useState([]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const gstRef = useRef(0);

  const FetchProduct = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const ProductDatakey = `ProductData_${userId}`;
      const ProductDataJSON = await AsyncStorage.getItem(ProductDatakey);
      const ProductData = JSON.parse(ProductDataJSON);
      setAllProducts(ProductData);
    } catch (error) {
      console.error('Error getting data of all product', error);
    }
  };

  const FetchLocalAPi = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const LocalAPIkey = `localofflinedata_${userId}`;
      const LocalAPIDataJSON = await AsyncStorage.getItem(LocalAPIkey);
      const LocalAPIData = LocalAPIDataJSON ? JSON.parse(LocalAPIDataJSON) : [];
      setInternetAPI(LocalAPIData);
      console.log(JSON.stringify(LocalAPIData), 'local api data')

      // We no longer set global cart items here, as we'll use the specific item's data
      // when a user clicks on an item in the FlatList
    } catch (error) {
      console.error('Error getting data of all product', error);
    }
  };

  const FetchPostOrderIDS = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const key = `postorderId_${userId}`;
      const OrderIDJSON = await AsyncStorage.getItem(key);
      const ParsedOrderID = OrderIDJSON ? JSON.parse(OrderIDJSON) : [];
      setPostOrderIds(ParsedOrderID);
    } catch (error) {
      console.log('Error in local screen fetch post order id', error);
    }
  };

  useEffect(() => {
    FetchProduct();
    setDistributiveDiscount(0);
  }, []);

  useEffect(() => {
    FetchLocalAPi();
    FetchPostOrderIDS();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen Focused - Resetting States');
      setGst(0);
      gstRef.current = 0;
      setGrossAmount(0);
    }, [])
  );

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const findMatchingOrderId = (shopId, date) => {
    const currentDate = getCurrentDate();
    const matchedOrder = postOrderIds.find(
      order => order?.shopId === shopId && order?.date?.split('T')[0] === currentDate
    );
    return matchedOrder ? matchedOrder.orderId : null;
  };

  // Calculate GST and gross amount for a specific cart item
  const calculateCartValues = (cartItem) => {
    if (!cartItem || !cartItem.cartItems) return { gstTotal: 0, grossTotal: 0 };

    let grossTotal = 0;
    let gstTotal = 0;

    cartItem.cartItems.forEach(item => {
      const { carton_ordered, box_ordered, itemss } = item;
      if (!itemss || !itemss.pricing) return;

      const { trade_offer = 0 } = itemss;
      const { trade_price = 0, box_in_carton = 0, pricing_gst = 0, gst_base = '', retail_price = 0 } = itemss.pricing;

      let quantity = 0;
      if (carton_ordered > 0) {
        quantity = carton_ordered * box_in_carton + box_ordered;
      } else {
        quantity = box_ordered;
      }

      const itemGrossAmount = trade_price * quantity;
      grossTotal += itemGrossAmount;

      if (gst_base === 'Retail Price') {
        const itemGST = retail_price * quantity * (pricing_gst / 100);
        gstTotal += itemGST;
      }
    });

    return { gstTotal, grossTotal };
  };

  // Handle the click on an item, dispatching that specific item's details
  const handleItemClick = (item) => {
    // Clear previous cart items
    dispatch({ type: 'REMOVE_ALL_CART' });

    // Make sure item.details exists before processing
    if (!item.details) {
      console.warn('No details found for this item');
      return;
    }

    // Calculate values for this specific cart item
    const { gstTotal, grossTotal } = calculateCartValues(item);
    console.log('Calculated GST:', gstTotal, 'Gross:', grossTotal);

    // Set current GST and gross amount for this specific cart
    gstRef.current = gstTotal;
    setGst(gstTotal);
    setGrossAmount(grossTotal);

    // Add each product from this specific cart to Redux
    item.details.forEach(val => {
      const product = allProducts.find(
        prod => prod.pricing.id === val.pricing_id || prod.pricing_id === val.pricing_id
      );

      if (product) {
        const uniqueItemss = JSON.parse(JSON.stringify(product));

        const cartItem = {
          carton_ordered: val.carton_ordered,
          box_ordered: val.box_ordered,
          pricing_id: val.pricing_id,
          itemss: uniqueItemss,
          pack_in_box: val.box_ordered,
        };

        dispatch(AddToCart(cartItem));
      } else {
        console.warn(`Product not found for pricing_id: ${val.pricing_id}`);
      }
    });

    // Navigate with this specific item's data
    const matchedOrderId = findMatchingOrderId(item.fk_shop, item.date);

    setTimeout(() => {
      navigation.navigate('AllShopsInvoice', {
        cartItems: item,
        Gst: gstTotal,
        grossAmount: grossTotal,
        existingOrderId: matchedOrderId,
      });
    }, 200);
  };

  return (
    <View style={styles.main}>
      {isLoading ? (
        <View style={{ alignItems: 'center', flex: 1, marginTop: '60%' }}>
          <ActivityIndicator size={50} color={'#16a4dd'} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 50 }}
          data={internetAPI}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const matchedOrderId = findMatchingOrderId(item.fk_shop, item.date);
            return (
              <Pressable
                style={styles.flatlistbackground}
                onPress={() => handleItemClick(item)}>
                <View style={styles.FlatList}>
                  <View style={styles.centre}>
                    <Text style={{ color: 'black' }}>Invoice #</Text>
                    <Text style={{ color: 'black' }}>{item.id || matchedOrderId}</Text>
                  </View>
                  <View style={styles.centre}>
                    <Text style={{ color: 'black' }}>Shop</Text>
                    <Text style={{ color: 'black' }}>{item.shop?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.centre}>
                    <Text style={{ color: 'black' }}>Order Date</Text>
                    <Text style={{ color: 'black' }}>{item.ordercreationdate || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.FlatList}>
                  <View style={styles.centre}>
                    <Text style={{ color: 'black' }}>Status</Text>
                    <Text style={{ color: 'black' }}>{matchedOrderId ? 'pending' : ''}</Text>
                  </View>
                  <View style={styles.centre}>
                    <Text style={{ color: 'black' }}>Gross Amount</Text>
                    <Text style={{ color: 'black' }}>{`${item.gross_amount || '0'}`}</Text>
                  </View>
                  <View style={styles.centre}>
                    <Text style={{ color: 'black' }}>Net Amount</Text>
                    <Text style={{ color: 'black' }}>
                      {item.net_amount || '0'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          keyExtractor={(item, index) => `item-${index}-${item.id || Math.random()}`}
        />
      )}
    </View>
  );
};

export default Internet;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  FlatList: {
    paddingVertical: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  flatlistbackground: {
    backgroundColor: '#f8f8f8',
    borderRadius: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderBottomWidth: 0.5,
    marginVertical: 2,
  },
  centre: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});