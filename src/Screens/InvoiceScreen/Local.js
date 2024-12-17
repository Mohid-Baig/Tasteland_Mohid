import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {Remove_All_Cart} from '../../Components/redux/constants';
import {useSelector, useDispatch} from 'react-redux';
import {AddToCart} from '../../Components/redux/action';
import NetInfo from '@react-native-community/netinfo';
const Local = ({selectedDate, orderBokerId}) => {
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
  // console.log(selectedDate, 'rr');
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
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };
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
          keyExtractor={item => item.id.toString()}
        />
      )}

      {/* <TouchableOpacity style={styles.button}>
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity> */}
    </View>
  );
};
export default Local;
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
