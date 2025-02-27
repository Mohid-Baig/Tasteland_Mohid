import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Remove_All_Cart } from '../../Components/redux/constants';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AddToCart } from '../../Components/redux/action';

const Internet = ({ selectedDate, orderBokerId, routeID, shopID }) => {
  const [internetAPI, setInternetAPI] = useState([]);
  const [weekDates, setWeekDates] = useState({ startDate: null, endDate: null });
  const [formattedDate, setFormattedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [GrossAmount, setGrossAmount] = useState(0);
  const [distributiveDiscount, setDistributiveDiscount] = useState(null);
  const [FinalDistributiveDiscount, setFinalDistributiveDiscount] = useState(0);
  const [SpecaialDiscount, setSpecialDiscount] = useState([]);
  const [applySpecialDiscount, setApplySpecialDiscount] = useState(0);
  const [gst, setGst] = useState(0);
  const [allProducts, setAllProducts] = useState([]);
  const [SelectedProductData, setSelectedProductData] = useState([]);
  const [totalPrice, setTotalprice] = useState(0);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.reducer);
  // console.log(JSON.stringify(cartItems), 'cartItems');
  const gstRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen Focused - Resetting States');

      // Reset states to avoid using old data
      setTotalprice(0);
      setGrossAmount(0);
      setGst(0);
      gstRef.current = 0;

      // Add a check to ensure cartItems is available
      if (cartItems.length > 0) {
        console.log('cartItems found, recalculating values');

        let Product_Count = 0;
        let GrossAmount = 0;
        let gst = 0;

        cartItems.forEach(item => {
          const { carton_ordered, box_ordered, itemss } = item;
          const { trade_offer, pricing } = itemss;
          const { trade_price, box_in_carton, pricing_gst, gst_base, retail_price } = pricing;

          // Calculate the total quantity (boxes or pieces)
          let quantity = 0;
          if (carton_ordered > 0) {
            // For carton orders, calculate total boxes
            quantity = carton_ordered * box_in_carton + box_ordered;
          } else {
            // For box orders only
            quantity = box_ordered;
          }

          // Calculate Gross Amount (total price before any discount)
          const itemGrossAmount = trade_price * quantity;
          GrossAmount += itemGrossAmount;

          // Calculate Trade Offer Discount
          const itemTODiscount = (trade_offer / 100) * itemGrossAmount;

          // Calculate Product_Count (total price after trade offer discount)
          Product_Count += itemGrossAmount - itemTODiscount;

          // Calculate GST
          if (gst_base === 'Retail Price') {
            const itemGST = retail_price * quantity * (pricing_gst / 100);
            gst += itemGST;
          }
        });

        // Update states with the new values after loop
        console.log('New GST Calculated:', gst);
        setTotalprice(Product_Count);
        setGrossAmount(GrossAmount);
        setGst(gst);
        gstRef.current = gst; // Store the final value in useRef
      } else {
        console.log('No cartItems found, values will remain 0');
      }
    }, [cartItems]), // Add cartItems as dependency
  );

  const goTOEdit = () => {
    // navigation.navigate('ConfirmOrder', { Store: Store, "RouteDate": RouteDate,'applySpecialDiscount':applySpecialDiscount ,'FinalDistributiveDiscount':FinalDistributiveDiscount ,'GST':gst})
  };

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
  useEffect(() => {
    FetchProduct();
    setDistributiveDiscount(0);
  }, []);
  const FetchLocalAPi = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const LocalAPIkey = `LocalAPI_${userId}`;
      const LocalAPIDataJSON = await AsyncStorage.getItem(LocalAPIkey);
      const LocalAPIData = JSON.parse(LocalAPIDataJSON);
      setInternetAPI(LocalAPIData);
    } catch (error) {
      console.error('Error getting data of all product', error);
    }
  };
  useEffect(() => {
    FetchLocalAPi();
  }, []);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
          data={internetAPI} // Bind correct state here
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.flatlistbackground}
              onPress={() => {
                // Add items to cart first
                item.details.forEach(val => {
                  let pro = allProducts.filter(
                    valfil => valfil.pricing.id === val.pricing_id,
                  );
                  console.log(pro, 'pro');
                  let items = {
                    carton_ordered: val.carton_ordered,
                    box_ordered: val.box_ordered,
                    pricing_id: val.pricing_id,
                    itemss: pro[0],
                    pack_in_box: val.box_ordered,
                  };
                  dispatch(AddToCart(items));
                });

                // Wait for GST to update before navigating
                setTimeout(() => {
                  console.log('Current GST after setting:', gstRef.current); // Ensure GST is correctly updated
                  navigation.navigate('ViewInvoice', {
                    cartItems: item,
                    Gst: gstRef.current, // Use the gstRef value here
                    grossAmount: GrossAmount,
                  });
                }, 200);
              }}>
              <View style={styles.FlatList}>
                <View style={styles.centre}>
                  <Text style={{ color: 'black' }}>Invoice #</Text>
                  <Text style={{ color: 'black' }}>{item.id}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{ color: 'black' }}>Shop</Text>
                  <Text style={{ color: 'black' }}>{item.shop.name}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{ color: 'black' }}>Order Date</Text>
                  <Text style={{ color: 'black' }}>{getCurrentDate()}</Text>
                </View>
              </View>
              <View style={styles.FlatList}>
                <View style={styles.centre}>
                  <Text style={{ color: 'black' }}>Status</Text>
                  <Text style={{ color: 'black' }}>{item.status}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{ color: 'black' }}>Gross Amount</Text>
                  <Text style={{ color: 'black' }}>{`${item.gross_amount.toFixed(
                    1,
                  )}`}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{ color: 'black' }}>Net Amount</Text>
                  <Text style={{ color: 'black' }}>
                    {item.net_amount.toFixed(1)}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
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
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderBottomWidth: 0.5,
    // marginBottom: 1s
    marginVertical: 2,
  },
  centre: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
