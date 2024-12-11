import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Alert,
  Platform,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useEffect, useState, useContext} from 'react';
import OrderStatus from '../../Components/CreateOrderComponent.js/OrderStatus';
// import {ScrollView} from 'react-native-gesture-handler';
import ShopInvoiceCreate from '../../Components/CreateOrderComponent.js/ShopInvoiceCreate';
import {useSelector, useDispatch} from 'react-redux';
import {TouchableOpacity} from '@gorhom/bottom-sheet';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GetLocation from 'react-native-get-location';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import ShowValues from '../../Components/CreateOrderComponent.js/ShowValues';
import Loader from '../../Components/Loaders/Loader';
import {Remove_All_Cart} from '../../Components/redux/constants';
import NetInfo from '@react-native-community/netinfo';

const ConfirmOrder = ({route, navigation}) => {
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productNaame, SetProductname] = useState([]);
  const [date, setdate] = useState();
  const {
    Store,
    FinalDistributiveDiscount,
    applySpecialDiscount,
    GST,
    orderId,
    RouteDate,
  } = route.params;
  const [GrossAmount, setGrossAmount] = useState(0);
  const [totalPrice, setTotalprice] = useState(0);
  const isEditingOrder = !!orderId;
  const dispatch = useDispatch();
  // console.log(RouteDate, 'RouteDate');
  console.log(GST, 'gst');
  // console.log(Store, 'Store');
  // useEffect(() => {
  //   return () => {
  //     dispatch({type: Remove_All_Cart}); // Clear cart when leaving the screen
  //   };
  // }, [dispatch]);
  // useEffect(() => {
  //   if (!isEditingOrder) {
  //     dispatch({type: Remove_All_Cart}); // Clear cart if it's a new order
  //   }
  // }, [isEditingOrder, dispatch]);
  // const cartItems = useSelector(state => state.reducer);
  const cartItems = route.params?.cItems || useSelector(state => state.reducer);
  // const cartItems = route.params.cartItems;
  console.log(JSON.stringify(cartItems), 'hello motherfather--');

  useEffect(() => {
    // Reset state when the component mounts or receives new cartItems
    const resetState = () => {
      setAllProducts([]);
      SetProductname([]); // Reset product names properly
      setGrossAmount(0);
      setTotalprice(0);
    };
    resetState();

    const filteredData = [];
    const productNames = new Set(); // Ensures unique product names

    cartItems.forEach(item => {
      if (
        item &&
        item.itemss &&
        item.itemss.product &&
        !productNames.has(item.itemss.product.name)
      ) {
        filteredData.push(item.itemss.product.name);
        productNames.add(item.itemss.product.name);
      }
    });

    SetProductname(Array.from(productNames)); // Ensure unique product names
    setAllProducts(cartItems);
    // console.log(allProducts, 'allproducts');

    // Only update price calculations if cartItems exist
    if (cartItems.length > 0) {
      let productCount = 0;
      let grossAmount = 0;

      cartItems.forEach(item => {
        const tradePrice = item?.itemss?.trade_price || 0;
        const tradeOffer = item?.itemss?.trade_offer || 0;
        const cartonOrdered = item?.carton_ordered || 0;
        const boxOrdered = item?.box_ordered || 0;
        const packInBox = item?.pack_in_box || 0;
        const totalUnits = cartonOrdered * packInBox + boxOrdered;
        const discount = (tradeOffer / 100) * tradePrice * totalUnits;
        productCount += tradePrice * totalUnits - discount;
        grossAmount += tradePrice * totalUnits;
      });

      setTotalprice(productCount);
      setGrossAmount(grossAmount);
    }
  }, [cartItems]); // Ensure the effect runs only when cartItems change

  // Ensure that values are numbers and not NaN before rendering
  const safeNumber = value => {
    return !isNaN(value) && value !== null ? value : 0;
  };
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to show your current position.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  const getLocation = async () => {
    // console.log('lllllldldlld');
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to continue.',
      );
      return;
    }
    try {
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 60000,
      });
      const currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      // Call post or put depending on if we're editing or creating a new order
      if (isEditingOrder) {
        updateOrder(currentLocation); // PUT request
      } else {
        postOrder(currentLocation); // POST request
      }
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        saveOrderOffline(currentLocation);
      } else {
        console.log('There is network');
      }
    } catch (error) {
      if (error.code === 'CANCELLED') {
        console.log('Location request was cancelled by the user.');
      } else {
        Alert.alert('Error', 'Unable to fetch location. Please try again.');
      }
      console.warn(error);
    }
  };

  const currentTime = moment().format('HH:mm:ss.SSS'); // Get the current time with milliseconds

  // Combine the RouteDate with the current time
  const formattedDate = moment(
    `${route.params.RouteDate}T${currentTime}`,
  ).toISOString();
  // Function to save the order offline when there is no network
  const saveOrderOffline = async currentLocation => {
    const userId = await AsyncStorage.getItem('userId');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const fk_employee = await AsyncStorage.getItem('fk_employee');

    let orderDetails = cartItems.map(item => ({
      carton_ordered: item.carton_ordered,
      box_ordered: item.box_ordered,
      pricing_id: item.pricing_id,
    }));

    // Generate a unique ID for each order (combining timestamp and random string)
    const uniqueOrderId = `order_${new Date().getTime()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    const offlineOrder = {
      id: uniqueOrderId, // Add unique order ID
      date: formattedDate,
      lng: currentLocation.longitude,
      lat: currentLocation.latitude,
      fk_distribution: parseInt(distributor_id),
      fk_shop: Store.id,
      fk_orderbooker_employee: parseInt(fk_employee),
      details: orderDetails,
    };

    try {
      const key = `offlineOrders_${userId}`;
      const existingOrders = await AsyncStorage.getItem(key);
      let offlineOrders = existingOrders ? JSON.parse(existingOrders) : [];

      // Check if the order with the same ID already exists in offline storage
      if (offlineOrders.some(order => order.id === offlineOrder.id)) {
        console.log(
          'Order with the same ID already exists in offline storage.',
        );
        return; // Prevent saving the same order again
      }

      offlineOrders.push(offlineOrder);
      await AsyncStorage.setItem(key, JSON.stringify(offlineOrders));
      Alert.alert('Order Saved', 'Order has been saved locally for syncing.');
    } catch (error) {
      console.error('Failed to save order offline:', error);
      Alert.alert('Error', 'Failed to save the order locally.');
    }
  };

  const postOrder = async currentLocation => {
    setIsLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const fk_employee = await AsyncStorage.getItem('fk_employee');

    let details = cartItems.map(item => ({
      carton_ordered: item.carton_ordered,
      box_ordered: item.box_ordered,
      pricing_id: item.pricing_id,
    }));

    try {
      const state = await NetInfo.fetch();

      // If there's no network, save the order offline
      if (!state.isConnected) {
        await saveOrderOffline(currentLocation);
        return; // Exit early to prevent further execution
      } else {
        // Proceed with posting the order to the server
        const data = {
          date: formattedDate,
          lng: currentLocation.longitude,
          lat: currentLocation.latitude,
          fk_distribution: parseInt(distributor_id),
          fk_shop: Store.id,
          fk_orderbooker_employee: parseInt(fk_employee),
          details: details,
        };

        const response = await instance.post(
          '/secondary_order',
          JSON.stringify(data),
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        const currentOrderAmount = (
          totalPrice -
          applySpecialDiscount -
          FinalDistributiveDiscount
        ).toFixed(2);
        console.log(currentOrderAmount, 'Total Order Price');

        // Retrieve existing total amount from AsyncStorage
        const storedTotalAmount = await AsyncStorage.getItem(
          `totalAmount_${userId}`,
        );
        let totalAmount = parseFloat(storedTotalAmount) || 0; // Initialize with 0 if not found

        // Add current order amount to the total
        totalAmount += parseFloat(currentOrderAmount);

        // Save updated total amount in AsyncStorage
        await AsyncStorage.setItem(
          `totalAmount_${userId}`,
          totalAmount.toString(),
        );

        console.log(`Updated Total Amount: ${totalAmount}`);

        // Retrieve existing order count from AsyncStorage
        let orderCount = await AsyncStorage.getItem(`orderCount_${userId}`);
        orderCount = parseInt(orderCount) || 0; // Initialize with 0 if not found

        // Increment the order count
        orderCount++;

        // Save updated order count in AsyncStorage
        await AsyncStorage.setItem(
          `orderCount_${userId}`,
          orderCount.toString(),
        );

        console.log(`Updated Order Count: ${orderCount}`);

        console.log('Post Data', response.data);
        Alert.alert('Success', 'Order Created successfully!', [
          {
            text: 'OK',
          },
        ]);
      }
    } catch (error) {
      console.log(error);

      // Save failed order data when posting fails
      const mergedCartItems = cartItems.map(item => {
        const {
          carton_ordered,
          box_ordered,
          pricing_id,
          itemss: {
            retail_price,
            invoice_price,
            trade_price,
            pricing_gst,
            fk_variant,
            fk_product,
            pieces,
            box_in_carton,
            product,
            sku,
            variant,
            trade_offer,
          },
          pack_in_box,
        } = item;

        const product_name = product ? product.name : null;
        const sku_name = sku ? sku.name : null;
        const variant_name = variant ? variant.name : null;

        return {
          carton_ordered,
          box_ordered,
          pricing_id,
          retail_price,
          invoice_price,
          trade_price,
          pricing_gst,
          fk_variant,
          fk_product,
          pieces,
          box_in_carton,
          product: product_name,
          sku: sku_name,
          variant: variant_name,
          trade_offer,
          pack_in_box,
        };
      });

      const failedOrder = {
        date: formattedDate,
        details: mergedCartItems,
        shop: Store,
        location: currentLocation,
        fk_distribution: parseInt(distributor_id),
        fk_shop: Store.id,
        fk_orderbooker_employee: parseInt(fk_employee),
        discount: (GrossAmount - totalPrice).toFixed(2),
        cartItems: cartItems,
        gst_amount: GST,
        net_amount: (
          totalPrice -
          applySpecialDiscount -
          FinalDistributiveDiscount
        ).toFixed(2),
        gross_amount: GrossAmount.toFixed(2),
        error: error.message || 'Order creation failed',
      };

      await saveFailedOrder(userId, failedOrder);
      Alert.alert('Error', 'An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrder = async currentLocation => {
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    // Check network availability using NetInfo
    const networkInfo = await NetInfo.fetch();
    const networkAvailable = networkInfo.isConnected;

    const mergedCartItems = cartItems.map(item => {
      const {
        carton_ordered,
        box_ordered,
        pricing_id,
        itemss: {
          id,
          retail_price,
          invoice_price,
          trade_price,
          pricing_gst,
          fk_variant,
          fk_product,
          pieces,
          box_in_carton,
          product,
          sku,
          variant,
          trade_offer,
          gst_base,
        },
        pack_in_box,
      } = item;

      const product_name = product ? product.name : null;
      const sku_name = sku ? sku.name : null;
      const variant_name = variant ? variant.name : null;

      return {
        id: product.id,
        product: product_name,
        variant: variant_name,
        sku: sku_name,
        pieces,
        box_in_carton,
        carton_ordered,
        box_ordered,
        free_piece_ordered: 0,
        carton_dispatched: 0,
        box_dispatched: 0,
        free_piece_dispatched: 0,
        carton_received: 0,
        box_received: 0,
        free_piece_received: 0,
        retail_price,
        trade_price,
        invoice_price,
        gross_price: 0,
        net_price: 0,
        trade_offer,
        gst_rate: pricing_gst,
        gst_base: GST || 0,
        pricing_id: id,
        pack_in_box,
      };
    });

    const data = {
      id: orderId,
      details: mergedCartItems,
      shop: Store,
    };

    try {
      if (networkAvailable) {
        // If network is available, update order via API
        const response = await instance.put(
          `/secondary_order/${orderId}`,
          JSON.stringify(data),
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        console.log(response.data, 'Put data');
        console.log(response.status, 'status');
        Alert.alert('Success', 'Order edited successfully!', [{text: 'OK'}]);
      } else {
        // If no network, save to offline edit storage (editOrders)
        const offlineEditOrders = await AsyncStorage.getItem(
          `offlineEditOrders_${userId}`,
        );
        const parsedOfflineEditOrders = offlineEditOrders
          ? JSON.parse(offlineEditOrders)
          : [];
        parsedOfflineEditOrders.push(data); // Save the update data to edit orders
        await AsyncStorage.setItem(
          `offlineEditOrders_${userId}`,
          JSON.stringify(parsedOfflineEditOrders),
        );

        console.log('Order saved for offline update.');
        Alert.alert('Info', 'No network. Order saved for offline edit.', [
          {text: 'OK'},
        ]);
      }
    } catch (error) {
      console.log(error);

      // Handle only saving to failed orders if the network is available but the API fails
      if (networkAvailable) {
        const failedOrder = {
          id: orderId,
          details: mergedCartItems,
          shop: Store,
          cartItems: cartItems,
          error: error.message || 'Order update failed',
        };
        await saveFailedOrder(userId, failedOrder); // Save in failedOrders if API fails
        Alert.alert('Error', 'An error occurred while updating the order.', [
          {text: 'OK'},
        ]);
      } else {
        // Do not save to failedOrders if offline; only save in editOrders
        console.log(
          'Order saved to offlineEditOrders, no entry in failedOrders.',
        );
      }
    }
  };

  // Helper function to save failed orders in AsyncStorage
  const saveFailedOrder = async (userId, failedOrder) => {
    try {
      const key = `failedOrders_${userId}`;
      const existingFailedOrders = await AsyncStorage.getItem(key);
      let failedOrders = existingFailedOrders
        ? JSON.parse(existingFailedOrders)
        : [];

      // Add the new failed order
      failedOrders.push(failedOrder);

      // Save back to AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(failedOrders));
      console.log('Failed order saved successfully');
    } catch (error) {
      console.error('Error saving failed order:', error);
    }
  };
  return (
    <View style={{flex: 1, position: 'relative'}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 100}}>
        <View style={{marginTop: 5}}>
          <OrderStatus Lefttxt={'Invoice Number'} RightText={'-'} />
          <OrderStatus Lefttxt={'Order Status'} RightText={'Draft'} />
          <OrderStatus Lefttxt={'Payment Done'} RightText={'False'} />
        </View>
        <View style={{padding: '3%'}}>
          <OrderStatus Lefttxt={'Shop Id '} RightText={Store.id} />
          <OrderStatus Lefttxt={'Shop Name'} RightText={Store.name} />
          <OrderStatus Lefttxt={'Owner'} RightText={Store.owner} />
          <OrderStatus Lefttxt={'Cell No'} RightText={Store?.cell} />
        </View>
        <View>
          <ShopInvoiceCreate datas={allProducts} allProduct={productNaame} />
        </View>
        <View>
          <ShowValues
            Lefttxt={'T.O Discount:'}
            RightText={(GrossAmount - totalPrice).toFixed(2)}
          />
          <ShowValues
            Lefttxt={'Distribution Discount:'}
            RightText={FinalDistributiveDiscount.toFixed(2)}
          />
          <ShowValues
            Lefttxt={'Special Discount:'}
            RightText={applySpecialDiscount.toFixed(2)}
          />
          <ShowValues Lefttxt={'Total GST:'} RightText={GST} />
        </View>
        <View style={{padding: '2%'}}>
          <View
            style={{
              width: '100%',
              height: 1,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
              marginTop: '2%',
            }}></View>
        </View>
        <ShowValues
          Lefttxt={'Gross Amount:'}
          RightText={GrossAmount.toFixed(2)}
          leftStyle={{fontWeight: 'bold', color: '#000'}}
        />
        <ShowValues
          Lefttxt={'Total Discount:'}
          RightText={(
            GrossAmount -
            totalPrice +
            applySpecialDiscount +
            FinalDistributiveDiscount
          ).toFixed(2)}
        />
        <ShowValues
          Lefttxt={'Total Price:'}
          RightText={(
            totalPrice -
            applySpecialDiscount -
            FinalDistributiveDiscount
          ).toFixed(2)}
          leftStyle={{fontWeight: 'bold', color: '#000'}}
        />
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          bottom: 5,
          width: '100%',
          padding: 10,
          backgroundColor: '#f5f5f5',
        }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#407BFF',
            paddingVertical: 12,
            borderRadius: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            getLocation();
          }}>
          <AntDesign name="shoppingcart" size={24} color="#fff" />
          <Text style={{color: '#fff', marginLeft: 10}}>
            {!orderId ? 'Confirm Order' : 'Edit Order'}
          </Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <Loader /> : null}
    </View>
  );
};
export default ConfirmOrder;
