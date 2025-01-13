import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Remove_All_Cart} from '../../Components/redux/constants';
import {useSelector, useDispatch} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {AddToCart} from '../../Components/redux/action';

const Internet = ({selectedDate, orderBokerId, routeID, shopID}) => {
  const [internetAPI, setInternetAPI] = useState([]);
  const [weekDates, setWeekDates] = useState({startDate: null, endDate: null});
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
          // Calculate Product Count
          Product_Count +=
            item?.itemss?.trade_price *
              (item?.pack_in_box * item?.carton_ordered + item?.box_ordered) -
            (item?.itemss?.trade_offer / 100) * item?.itemss?.trade_price;

          // Calculate Gross Amount
          GrossAmount +=
            item?.itemss?.trade_price *
            (item?.pack_in_box * item?.carton_ordered + item?.box_ordered);

          // GST Calculation based on gst_base value
          if (item?.itemss?.gst_base === 'Retail Price') {
            gst +=
              item.itemss.retail_price *
              (item?.pack_in_box * item?.carton_ordered + item?.box_ordered) *
              (item?.itemss?.pricing_gst / 100);
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

  const getProduct = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    try {
      const response = await instance.get(
        '/pricing/all?sort_alphabetically=true&active=true',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      setAllProducts(response.data);
      // console.log(JSON.stringify(response.data), '---111----');
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
    setDistributiveDiscount(0);
  }, []);

  const getMondayToSundayWeek = date => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const monday = 1;
    let daysUntilMonday = dayOfWeek - monday;
    if (daysUntilMonday < 0) {
      daysUntilMonday += 7;
    }
    const startDate = new Date(dateObj);
    startDate.setDate(dateObj.getDate() - daysUntilMonday);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return {startDate, endDate};
  };

  const formatDateToYYYYMMDD = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const currentDate = new Date();
    if (currentDate) {
      const {startDate, endDate} = getMondayToSundayWeek(currentDate);
      setWeekDates({
        startDate: formatDateToYYYYMMDD(startDate),
        endDate: formatDateToYYYYMMDD(endDate),
      });
    }
  }, []);

  const getInternetAPi = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const formattedDate = selectedDate
      ? formatDateToYYYYMMDD(selectedDate)
      : '';
    console.log(formattedDate, 'date');
    console.log(orderBokerId);
    try {
      const fkEmployee = await AsyncStorage.getItem('fk_employee');
      let apiUrl = `/secondary_order/all?employee_id=${fkEmployee}&include_shop=true&include_detail=true&order_date=${formattedDate}`;

      // Conditionally add the routeID if it's available
      if (routeID) {
        apiUrl += `&route_id=${routeID}`;
      }
      if (shopID) {
        apiUrl += `&shop_id=${shopID}`;
      }

      const response = await instance.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // console.log(JSON.stringify(response.data), 'For Edit ');
      console.log(
        `/secondary_order/all?employee_id=${fkEmployee}&include_shop=true&include_detail=true&order_date=${formattedDate}`,
      );
      setInternetAPI(response.data); // Set API response here
      setFormattedDate(formattedDate); // Store formattedDate in state
      console.log('Data of InternetAPI successfully coming');
    } catch (error) {
      console.log('Error Caught in InternetAPI -------', error);
    } finally {
      setIsLoading(false);
    }
  };
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (selectedDate) {
      getInternetAPi();
    }
  }, [selectedDate, routeID, shopID]);

  return (
    <View style={styles.main}>
      {isLoading ? (
        <View style={{alignItems: 'center', flex: 1, marginTop: '60%'}}>
          <ActivityIndicator size={50} color={'#16a4dd'} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{paddingBottom: 50}}
          data={internetAPI} // Bind correct state here
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <Pressable
              style={styles.flatlistbackground}
              onPress={() => {
                // Add items to cart first
                item.details.forEach(val => {
                  let pro = allProducts.filter(
                    valfil => valfil.id === val.pricing_id,
                  );
                  let items = {
                    carton_ordered: val.carton_ordered,
                    box_ordered: val.box_ordered,
                    pricing_id: val.id,
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
                  <Text style={{color: 'black'}}>Invoice #</Text>
                  <Text style={{color: 'black'}}>{item.id}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Shop</Text>
                  <Text style={{color: 'black'}}>{item.shop.name}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Order Date</Text>
                  <Text style={{color: 'black'}}>{getCurrentDate()}</Text>
                </View>
              </View>
              <View style={styles.FlatList}>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Status</Text>
                  <Text style={{color: 'black'}}>{item.status}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Gross Amount</Text>
                  <Text style={{color: 'black'}}>{`${item.gross_amount.toFixed(
                    1,
                  )}`}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Net Amount</Text>
                  <Text style={{color: 'black'}}>
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
