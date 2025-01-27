import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Alert,
  Platform,
  FlatList,
  ScrollView,
  ToastAndroid,
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
import SpecialDis from '../../Components/CreateOrderComponent.js/SpecialDis';

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
    SpecaialDiscount,
    distributiveDiscount,
  } = route.params;
  const [GrossAmount, setGrossAmount] = useState(0);
  const [totalPrice, setTotalprice] = useState(0);
  const [TotalCarton, setTotalCartons] = useState(0);
  const isEditingOrder = !!orderId;
  const dispatch = useDispatch();

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
        item.itemss.pricing.product &&
        !productNames.has(item.itemss.pricing.product.name)
      ) {
        filteredData.push(item.itemss.pricing.product.name);
        productNames.add(item.itemss.pricing.product.name);
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
        const tradePrice = item?.itemss?.pricing.trade_price || 0;
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

  const TokenRenew = async () => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    const payload = {
      refresh_token: refreshToken,
    };
    console.log(refreshToken);
    try {
      const response = await instance.post('/login/renew_token', payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log(response.data, 'Token after refreashing');
      // await AsyncStorage.removeItem('AUTH_TOKEN');
      const AuthToken = response.data.access_token;
      await AsyncStorage.setItem('AUTH_TOKEN', AuthToken);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Please Log in again',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        Alert.alert('Session Expired', 'Please Login Again', [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('refresh_token');
              navigation.replace('Login');
              // console.log('ok token newnew');
              // TokenRenew();
            },
          },
        ]);
      } else {
        console.log('Error in tokenRenew', error);
      }
    }
  };
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
      // if (!state.isConnected) {
      //   saveOrderOffline(currentLocation);
      // } else {
      //   console.log('------ There is network connected ------');
      // }
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

  const currentOrderAmount = (
    totalPrice -
    applySpecialDiscount -
    FinalDistributiveDiscount
  ).toFixed(2);
  const calculateOrderForMultipleOfflineItems = async orderItems => {
    const userId = await AsyncStorage.getItem('userId');
    let totalCartons = 0;

    orderItems.forEach(item => {
      const {box_in_carton} = item.itemss.pricing; // Number of boxes in a carton
      const boxOrdered = item.box_ordered; // Number of boxes ordered by the user

      // Calculate the value (number of cartons) for the item
      const cartonsForItem = boxOrdered / box_in_carton;

      // Add this item's carton value to the total carton value
      totalCartons += cartonsForItem;
    });
    return totalCartons;
  };
  const calculateOrderForMultipleItems = async orderItems => {
    const userId = await AsyncStorage.getItem('userId');
    let totalCartons = 0;

    orderItems.forEach(item => {
      const {box_in_carton} = item.itemss.pricing; // Number of boxes in a carton
      const boxOrdered = item.box_ordered; // Number of boxes ordered by the user

      // Calculate the value (number of cartons) for the item
      const cartonsForItem = boxOrdered / box_in_carton;

      // Add this item's carton value to the total carton value
      totalCartons += cartonsForItem;
    });
    await AsyncStorage.setItem(
      `totalCartons_${userId}`,
      totalCartons.toFixed(1),
    );
    return totalCartons;
  };
  const generateUniqueId = () => {
    return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  };

  const saveOrderOffline = async (currentLocation, totalCarton) => {
    const userId = await AsyncStorage.getItem('userId');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const fk_employee = await AsyncStorage.getItem('fk_employee');

    const uniqueOrderId = generateUniqueId();

    let orderDetails = cartItems.map(item => ({
      carton_ordered: item.carton_ordered,
      box_ordered: item.box_ordered,
      pricing_id: item.pricing_id,
    }));

    const offlineOrder = {
      unid: uniqueOrderId,
      lng: currentLocation.longitude,
      lat: currentLocation.latitude,
      detailss: orderDetails,
      totalPrice: currentOrderAmount,
      todiscount: Math.round(GrossAmount - totalPrice),
      totalCarton: totalCarton,
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
      distributionTO:
        GrossAmount -
        totalPrice +
        applySpecialDiscount +
        FinalDistributiveDiscount,
      distribution: FinalDistributiveDiscount,
      special: applySpecialDiscount,
      trade_price: cartItems.itemss?.pricing.trade_price,
      trade_offer: cartItems.itemss?.trade_offer,
    };

    try {
      const key = `offlineOrders_${userId}`;
      const existingOrders = await AsyncStorage.getItem(key);
      let offlineOrders = existingOrders ? JSON.parse(existingOrders) : [];

      offlineOrders.push(offlineOrder);
      await AsyncStorage.setItem(key, JSON.stringify(offlineOrders));
      Alert.alert('Order Saved', 'Order has been saved locally for syncing.');
    } catch (error) {
      console.error('Failed to save order offline:', error);
      Alert.alert('Error', 'Failed to save the order locally.');
    }
  };

  const mergedCartItems = cartItems.map(item => {
    const {
      carton_ordered,
      box_ordered,
      pricing_id,
      itemss: {
        trade_offer,
        pricing: {
          box_in_carton,
          retail_price,
          invoice_price,
          trade_price,
          pricing_gst,
          fk_variant,
          fk_product,
          pieces,
          product,
          sku,
          variant,
        },
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

  const postOrder = async currentLocation => {
    setIsLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const fk_employee = await AsyncStorage.getItem('fk_employee');

    let details = cartItems.map(item => ({
      carton_ordered: item.carton_ordered,
      box_ordered: item.box_ordered,
      pricing_id: item.itemss.pricing.id,
    }));
    const data = {
      date: formattedDate,
      lng: currentLocation.longitude,
      lat: currentLocation.latitude,
      fk_distribution: parseInt(distributor_id),
      fk_shop: Store.id,
      fk_orderbooker_employee: parseInt(fk_employee),
      details: details,
    };
    try {
      const state = await NetInfo.fetch();
      const totalCarton = await calculateOrderForMultipleOfflineItems(
        cartItems,
      );
      setTotalCartons(totalCarton);
      if (!state.isConnected) {
        await saveOrderOffline(currentLocation, totalCarton);
        return;
      } else {
        console.log(data, 'Payload data');
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

        const storedTotalAmount = await AsyncStorage.getItem(
          `totalAmount_${userId}`,
        );
        let totalAmount = parseFloat(storedTotalAmount) || 0; // Initialize with 0 if not found

        totalAmount += parseFloat(currentOrderAmount);

        await AsyncStorage.setItem(
          `totalAmount_${userId}`,
          totalAmount.toString(),
        );

        console.log(`Updated Total Amount: ${totalAmount}`);

        let orderCount = await AsyncStorage.getItem(`orderCount_${userId}`);
        orderCount = parseInt(orderCount) || 0; // Initialize with 0 if not found

        orderCount++;

        await AsyncStorage.setItem(
          `orderCount_${userId}`,
          orderCount.toString(),
        );

        console.log(`Updated Order Count: ${orderCount}`);

        const storedTotalCartons = await AsyncStorage.getItem(
          `totalCartons_${userId}`,
        );
        let previousTotalCartons = parseFloat(storedTotalCartons) || 0;

        const newTotalCartons = await calculateOrderForMultipleItems(cartItems);

        const updatedTotalCartons = previousTotalCartons + newTotalCartons;
        setTotalCartons(updatedTotalCartons);
        await AsyncStorage.setItem(
          `totalCartons_${userId}`,
          updatedTotalCartons.toFixed(1),
        );

        console.log(`Updated Total Cartons: ${updatedTotalCartons}`);

        console.log('Post Data', response.data);
        Alert.alert('Success', 'Order Created successfully!', [
          {
            text: 'OK',
          },
        ]);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Please Log in again',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      } else {
        console.log('Error ', error);
      }
      const uniqueOrderId = generateUniqueId();

      const failedOrder = {
        unid: uniqueOrderId,
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

    const networkInfo = await NetInfo.fetch();
    const networkAvailable = networkInfo.isConnected;

    const mergedCartItems = cartItems.map(item => {
      const {
        carton_ordered,
        box_ordered,
        pricing_id,
        itemss: {
          id,
          trade_offer,
          pricing: {
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
            gst_base,
          },
        },
        pack_in_box,
      } = item;

      const product_name = product ? product.name : null;
      const sku_name = sku ? sku.name : null;
      const variant_name = variant ? variant.name : null;

      return {
        id: product.id, // Using product.id as unique identifier
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
        gst_base: 0.0, // Fix potential undefined GST
        pricing_id: item.itemss.pricing.id,
        pack_in_box,
      };
    });

    const data = {
      id: orderId, // Use orderId to uniquely identify the order
      details: mergedCartItems,
      shop: Store,
      // date: new Date().toISOString(),
      date: formattedDate,
      totalPrice: currentOrderAmount,
      totalCarton: TotalCarton,
      cartItems: cartItems,
    };

    try {
      console.log(JSON.stringify(data), 'Data to be updated');

      if (networkAvailable) {
        // Network available: Update the order via API
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

        const storedTotalAmount = await AsyncStorage.getItem(
          `totalAmount_${userId}`,
        );
        let totalAmount = parseFloat(storedTotalAmount) || 0; // Initialize with 0 if not found
        totalAmount += parseFloat(currentOrderAmount);

        await AsyncStorage.setItem(
          `totalAmount_${userId}`,
          totalAmount.toString(),
        );

        console.log(`Updated Total Amount: ${totalAmount}`);

        const storedTotalCartons = await AsyncStorage.getItem(
          `totalCartons_${userId}`,
        );
        let previousTotalCartons = parseFloat(storedTotalCartons) || 0;
        const newTotalCartons = await calculateOrderForMultipleItems(cartItems);
        const updatedTotalCartons = previousTotalCartons + newTotalCartons;

        setTotalCartons(updatedTotalCartons);
        await AsyncStorage.setItem(
          `totalCartons_${userId}`,
          updatedTotalCartons.toFixed(1),
        );

        console.log(`Updated Total Cartons: ${updatedTotalCartons}`);

        console.log(response.data, 'Put data');
        console.log(response.status, 'status');
        Alert.alert('Success', 'Order edited successfully!', [{text: 'OK'}]);
      } else {
        // Offline: Save to offline edit storage
        const offlineEditOrders = await AsyncStorage.getItem(
          `offlineEditOrders_${userId}`,
        );
        const parsedOfflineEditOrders = offlineEditOrders
          ? JSON.parse(offlineEditOrders)
          : [];

        // Append the new order to the list
        parsedOfflineEditOrders.push(data);

        // Save the updated list to AsyncStorage
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
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Please Log in again',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      } else {
        console.log('Error ', error);
      }

      // Handle saving to failed orders if the network is available but the API fails
      if (networkAvailable) {
        const uniqueOrderId = generateUniqueId();

        const failedOrder = {
          unid: uniqueOrderId,
          id: orderId,
          details: mergedCartItems,
          shop: Store,
          cartItems: cartItems,
          error: error.message || 'Order creation failed',
        };

        await saveFailedOrder(userId, failedOrder);
        Alert.alert('Error', 'An error occurred while updating the order.', [
          {text: 'OK'},
        ]);
      }
    }
  };

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
  const incrementTotalVisits = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return; // Ensure userId is available

    const totalVisitsKey = `totalVisits_${userId}`;
    const visits = await AsyncStorage.getItem(totalVisitsKey);
    const totalVisits = parseInt(visits) || 0;
    const newTotal = totalVisits + 1;

    // Update the total visits in AsyncStorage
    await AsyncStorage.setItem(totalVisitsKey, newTotal.toString());

    // Show success message or do something else
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
            percent={distributiveDiscount}
            gross={GrossAmount.toFixed(2)}
          />
          <SpecialDis
            Lefttxt={'Special Discount:'}
            RightText={applySpecialDiscount.toFixed(2)}
            percent={SpecaialDiscount}
            gross={GrossAmount.toFixed(2)}
          />
          <ShowValues Lefttxt={'Total GST:'} RightText={GST.toFixed(2)} />
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
            incrementTotalVisits();
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
