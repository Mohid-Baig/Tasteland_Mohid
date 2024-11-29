import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {Remove_All_Cart} from '../../Components/redux/constants';
import {useSelector, useDispatch} from 'react-redux';
import {AddToCart} from '../../Components/redux/action';
const Internet = ({selectedDate, orderBokerId}) => {
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
  // console.log(orderBokerId);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.reducer);
  useEffect(() => {
    console.log(cartItems, 'Item');
    if (cartItems.length > 0) {
      // console.log(cartItems.length,'suh')
      let Product_Count = 0;
      let GrossAmount = 0;
      let TO_Discount = 0;
      let gst = 0;
      // let count = 0;
      cartItems.forEach(item => {
        // console.log(item, "Item kkk");
        Product_Count +=
          item?.itemss?.trade_price *
            (item?.pack_in_box * item?.carton_ordered + item?.box_ordered) -
          (item?.itemss?.trade_offer / 100) * item?.itemss?.trade_price;
        GrossAmount +=
          item?.itemss?.trade_price *
          (item?.pack_in_box * item?.carton_ordered + item?.box_ordered);
        // console.log(item?.itemss?.gst_base)
        if (item?.itemss?.gst_base === 'Retail Price') {
          gst =
            gst +
            item.itemss.retail_price *
              (item?.pack_in_box * item?.carton_ordered + item?.box_ordered) *
              (item?.itemss?.pricing_gst / 100);
          console.log(gst, 'GST Price');
        }
      });
      setTotalprice(Product_Count);
      setGrossAmount(GrossAmount);
      setSelectedProductData(cartItems);
      setGst(gst);
      // console.log(Product_Count,"Product Count");
      // dispatch(AddToCart(filteredData));
    } else {
      setTotalprice(0);
      setTotalprice(0);
      setGrossAmount(0);
      setGst(0);
    }
  }, [cartItems]);
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
      if (fkEmployee !== null) {
        // The value exists in AsyncStorage, now you can use it
        console.log('fk_employee:', fkEmployee);
      } else {
        // Handle case when there is no value for 'fk_employee'
        console.log('No fk_employee found in AsyncStorage');
      }
      const response = await instance.get(
        // `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
        `/secondary_order/all?employee_id=${fkEmployee}&include_shop=true&include_detail=true&order_date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      // console.log(JSON.stringify(response.data), 'For Edit ');
      setInternetAPI(response.data); // Set API response here
      setFormattedDate(formattedDate); // Store formattedDate in state
      console.log('Data of InternetAPI successfully coming');
    } catch (error) {
      console.log('Error Caught in InternetAPI -------', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (selectedDate) {
      getInternetAPi();
    }
  }, [selectedDate]);
  return (
    <View style={styles.main}>
      {isLoading ? (
        <View style={{alignItems: 'center', flex: 1, marginTop: '60%'}}>
          <ActivityIndicator size={50} color={'#16a4dd'} />
        </View>
      ) : (
        <FlatList
          data={internetAPI} // Bind correct state here
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.flatlistbackground}
              onPress={() => {
                item.details.forEach(val => {
                  // console.log(allProducts, 'Product');
                  let pro = allProducts.filter(
                    valfil => valfil.id === val.pricing_id,
                  );
                  // console.log(pro, '----');
                  let items = {
                    carton_ordered: val.carton_ordered,
                    box_ordered: val.box_ordered,
                    pricing_id: val.id,
                    itemss: pro[0],
                    pack_in_box: val.box_ordered,
                  };
                  // console.log(items, '+++++');
                  dispatch(AddToCart(items));
                });
                goTOEdit();
                navigation.navigate('ViewInvoice', {
                  cartItems: item,
                  Gst: gst,
                  orderBokerId: orderBokerId,
                });
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
                  <Text style={{color: 'black'}}>{formattedDate}</Text>
                </View>
              </View>
              <View style={styles.FlatList}>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Status</Text>
                  <Text style={{color: 'black'}}>{item.status}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Gross Amount</Text>
                  <Text
                    style={{color: 'black'}}>{`${item.gross_amount}.00`}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Net Amount</Text>
                  <Text style={{color: 'black'}}>{item.net_amount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id.toString()}
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
