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
  NativeModules,
} from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import OrderStatus from '../../Components/CreateOrderComponent.js/OrderStatus';
// import {ScrollView} from 'react-native-gesture-handler';
import ShopInvoiceCreate from '../../Components/CreateOrderComponent.js/ShopInvoiceCreate';
import { useSelector, useDispatch } from 'react-redux';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GetLocation from 'react-native-get-location';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import ShowValues from '../../Components/CreateOrderComponent.js/ShowValues';
import Loader from '../../Components/Loaders/Loader';
import { Remove_All_Cart } from '../../Components/redux/constants';
import NetInfo from '@react-native-community/netinfo';
import SpecialDis from '../../Components/CreateOrderComponent.js/SpecialDis';

const ConfirmOrder = ({ route, navigation }) => {
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
    ratte,
    discountRate,
    uuiddd,
    RouteDDate
  } = route.params;
  console.log(RouteDate, 'Route date')
  const [GrossAmount, setGrossAmount] = useState(0);
  const [totalPrice, setTotalprice] = useState(0);
  const [TotalCarton, setTotalCartons] = useState(0);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [gstText, setGstTxt] = useState([]);
  const [DateAuto, setDateAuto] = useState();
  const [unproductiveShops, setUnproductiveShops] = useState([]);
  const [unOfflineShops, setunOfflineShops] = useState();
  const isEditingOrder = !!orderId;
  const dispatch = useDispatch();

  const cartItems = route.params?.cItems || useSelector(state => state.reducer);
  // const cartItems = route.params.cartItems;
  console.log(uuiddd, 'unid')
  console.log(RouteDDate, 'RouteDDate in confirm order')

  console.log(JSON.stringify(cartItems), 'hello motherfather--');

  const { DateTimeModule } = NativeModules;
  useEffect(() => {
    DateTimeModule.isAutoTimeEnabled(isEnabled => {
      console.log('Auto time enabled:', isEnabled);
      setDateAuto(isEnabled);
    });
  }, []);

  // useEffect(() => {
  //   console.log(cartItems.length, 'cartlength');
  //   if (cartItems.length == 0) {
  //     setIsButtonVisible(false); // Set to false when the array is empty
  //   } else {
  //     setIsButtonVisible(true); // Set to true when the array has items
  //   }
  // }, [cartItems]);

  useEffect(() => {
    // Reset state when the component mounts or receives new cartItems
    const resetState = () => {
      setAllProducts([]);
      SetProductname([]);
      setGrossAmount(0);
      setTotalprice(0);
      setTotalCartons(0); // Reset total cartons too
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

    SetProductname(Array.from(productNames));
    setAllProducts(cartItems);

    // Only update price calculations if cartItems exist
    if (cartItems.length > 0) {
      let productCount = 0;
      let grossAmount = 0;
      let totalCartons = 0;

      cartItems.forEach(item => {
        const tradePrice = item?.itemss?.pricing.trade_price || 0;
        const tradeOffer = item?.itemss?.trade_offer || 0;
        const cartonOrdered = item?.carton_ordered || 0;
        const boxOrdered = item?.box_ordered || 0;

        // The key fix: Use box_in_carton from the pricing for carton calculations
        const boxInCarton = item?.itemss?.pricing?.box_in_carton || 0;

        // Calculate total units properly for both cartons and boxes
        const totalUnits = cartonOrdered * boxInCarton + boxOrdered;

        // Calculate discount properly
        const discount = (tradeOffer / 100) * tradePrice * totalUnits;

        // Calculate the price after trade offer discount
        productCount += tradePrice * totalUnits - discount;

        // Calculate gross amount (before discount)
        grossAmount += tradePrice * totalUnits;

        // Keep track of total cartons if needed
        totalCartons += cartonOrdered;
      });

      setTotalprice(productCount);
      setGrossAmount(grossAmount);
      setTotalCartons(totalCartons);
    }
  }, [cartItems]);
  useEffect(() => {
    // Extract pricing_gst from the first item
    const gst_pricing = cartItems[0]?.itemss?.pricing?.pricing_gst;

    // If the pricing_gst exists, store it in the state
    if (gst_pricing !== undefined) {
      setGstTxt(gst_pricing); // Set the gst value as a variable, not an array
    }
  }, [cartItems]);

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

  const loadUnproductiveShops = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const storedShops = await AsyncStorage.getItem(
        `unproductiveShops_${userId}`,
      );
      if (storedShops !== null) {
        const parsedShops = JSON.parse(storedShops);
        if (Array.isArray(parsedShops)) {
          setUnproductiveShops(parsedShops); // Set the unproductive shops state with stored data
        } else {
          console.log('Unexpected data format in AsyncStorage');
        }
      }
    } catch (error) {
      console.log('Error loading unproductive shops:', error);
    }
  };
  const loadUnproductiveOfflineOrders = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const storedShops = await AsyncStorage.getItem(
        `OfflinefailedUnProductiveOrders_${userId}`,
      );
      if (storedShops !== null) {
        const parsedShops = JSON.parse(storedShops);
        if (Array.isArray(parsedShops)) {
          setunOfflineShops(parsedShops); // Set the unproductive shops state with stored data
        } else {
          console.log('Unexpected data format in AsyncStorage');
        }
      }
    } catch (error) {
      console.log('Error loading unproductive offline orders:', error);
    }
  };
  useEffect(() => {
    loadUnproductiveShops()
    loadUnproductiveOfflineOrders()
  }, [])

  useEffect(() => {
    setIsButtonVisible(true); // Reset the button to visible when the screen is revisited
  }, []);

  const handleButtonPress = () => {
    if (DateAuto == true) {
      getLocation();
      setIsButtonVisible(false);
    } else {
      Alert.alert(
        'Date Issue',
        'Please enable "Set Automatically" for date and time in your settings',
      );
    }
  };

  const currentTime = moment().format('HH:mm:ss.SSS'); // Get the current time with milliseconds

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

    console.log('Starting calculation for total cartons (offline)...');

    orderItems.forEach((item, index) => {
      const { carton_ordered, box_ordered, itemss } = item;
      const { box_in_carton } = itemss.pricing; // Number of boxes in a carton

      console.log(`\nProcessing item ${index + 1}:`);
      console.log('carton_ordered:', carton_ordered);
      console.log('box_ordered:', box_ordered);
      console.log('box_in_carton:', box_in_carton);

      // Add the carton_ordered directly to the total cartons
      totalCartons += carton_ordered;
      console.log('After adding carton_ordered, totalCartons:', totalCartons);

      // Calculate the additional cartons from box_ordered
      if (box_ordered > 0) {
        const additionalCartons = box_ordered / box_in_carton;
        totalCartons += additionalCartons;
        console.log('After adding box_ordered, totalCartons:', totalCartons);
      }
    });

    console.log('\nFinal totalCartons (offline):', totalCartons);
    return totalCartons;
  };
  const calculateOrderForMultipleItems = async orderItems => {
    const userId = await AsyncStorage.getItem('userId');
    let totalCartons = 0;

    console.log('Starting calculation for total cartons...');

    orderItems.forEach((item, index) => {
      const { carton_ordered, box_ordered, itemss } = item;
      const { box_in_carton } = itemss.pricing; // Number of boxes in a carton

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
    const getCurrentDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${day}-${month}-${year}`;
    };

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
      ordercreationdate: getCurrentDate()
    };

    try {
      const key = `offlineOrders_${userId}`;
      const key2 = `localofflinedata_${userId}`;

      const existingOrders = await AsyncStorage.getItem(key);
      const existingLocalOrders = await AsyncStorage.getItem(key2);
      console.log("Existing Orders:", existingOrders);
      console.log("Existing Local Orders:", existingLocalOrders);
      let offlineOrders = existingOrders ? JSON.parse(existingOrders) : [];
      let offlineLocalOrders = existingLocalOrders ? JSON.parse(existingLocalOrders) : [];
      if (!Array.isArray(offlineLocalOrders)) {
        offlineLocalOrders = [];
      }
      if (!Array.isArray(offlineOrders)) {
        offlineOrders = [];
      }
      if (uuiddd) {
        offlineLocalOrders = offlineLocalOrders.filter(order => order.unid !== uuiddd);
        await AsyncStorage.setItem(key2, JSON.stringify(offlineLocalOrders));
        offlineOrders = offlineOrders.filter(order => order.unid !== uuiddd);
        await AsyncStorage.setItem(key, JSON.stringify(offlineOrders));
      }
      offlineOrders.push(offlineOrder);
      offlineLocalOrders.push(offlineOrder);

      const storedTotalCartons = await AsyncStorage.getItem(
        `totalCartons_${userId}`,
      );
      const storedCartons = await AsyncStorage.getItem(`totalCartonsinInvoice_${userId}`);
      if (storedCartons && uuiddd) {
        const storedCartonsValue = parseFloat(storedCartons) || 0;
        let previousTotalCartons = parseFloat(storedTotalCartons) || 0;

        const cartonedit = totalCarton - storedCartonsValue;
        const updatedTotalCartons = previousTotalCartons + cartonedit;

        setTotalCartons(updatedTotalCartons);

        await AsyncStorage.setItem(
          `totalCartons_${userId}`,
          updatedTotalCartons.toFixed(1),
        );
        console.log(`Updated Total Cartons in offline: ${updatedTotalCartons}`);
      } else {
        const storedTotalCartons = await AsyncStorage.getItem(
          `totalCartons_${userId}`,
        );
        let previousTotalCartons = parseFloat(storedTotalCartons) || 0;
        const add = previousTotalCartons + totalCarton
        await AsyncStorage.setItem(
          `totalCartons_${userId}`,
          add.toFixed(1),
        );
        console.log(`Updated Total Cartons in offline second: ${totalCarton}`);
      }


      // console.log(`Updated Total Cartons in offline second: ${totalCarton}`);

      await AsyncStorage.setItem(key, JSON.stringify(offlineOrders));
      await AsyncStorage.setItem(key2, JSON.stringify(offlineLocalOrders));
      const isUnproductive = unproductiveShops.includes(Store.id);
      const matchingUNOfflineOrderbyID = Array.isArray(unOfflineShops)
        ? unOfflineShops.find(order => order.fk_shop === Store.id)
        : null;
      if (isUnproductive || matchingUNOfflineOrderbyID) {
        console.log('Unproductive order is already marked')
      } else {
        if (!uuiddd) {
          incrementTotalVisits();
        }
      }

      Alert.alert('Order Saved', 'Order has been saved locally for syncing.', [
        {
          text: 'OK',
          onPress: () => {
            console.log('UUID Value:', uuiddd);
            if (!uuiddd) {
              navigation.navigate('AllShops', {
                RouteDate: RouteDate,
              });
            }
            console.log(RouteDate, 'RouteDate');
          },
        },
      ]);


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
        if (!uuiddd) {
          const getCurrentDate = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${day}-${month}-${year}`;
          };

          const storedData = await AsyncStorage.getItem(`totalAmountOffline_${userId}`);
          let totalData = storedData ? JSON.parse(storedData) : { totalAmount: 0, date: '' }; // Default values

          // Update totalAmount and set the current date
          totalData.totalAmount += parseFloat(currentOrderAmount);
          totalData.date = getCurrentDate();

          console.log(`Total Amount: ${totalData.totalAmount}, Date: ${totalData.date}`);

          // Store the updated data as a string
          await AsyncStorage.setItem(
            `totalAmountOffline_${userId}`,
            JSON.stringify(totalData)
          );
        } else {
          const getCurrentDate = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${day}-${month}-${year}`;
          };
          const storedData = await AsyncStorage.getItem(`totalViewShopInvoice_${userId}`);
          const storedEditData = await AsyncStorage.getItem(`totalEditlocalAmountOffline_${userId}`);

          let totalData = JSON.parse(storedData);
          let totalEditData = storedEditData ? JSON.parse(storedEditData) : { totalAmount: 0, date: '' };
          const editamount = currentOrderAmount - totalData;

          // Update totalEditData with the new edit amount
          totalEditData.totalAmount += parseFloat(editamount.toString());
          totalEditData.date = getCurrentDate();

          console.log(`Total Amount: ${totalEditData.totalAmount}, Date: ${totalEditData.date}`);

          // Store the updated totalEditAmountOffline data back to AsyncStorage
          await AsyncStorage.setItem(
            `totalEditAmountOffline_${userId}`,
            JSON.stringify(totalEditData)
          );
        }

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

        console.log('Response data after posting', JSON.stringify(response.data))

        let orderCount = await AsyncStorage.getItem(`orderCount_${userId}`);
        orderCount = parseInt(orderCount) || 0;

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
        const isUnproductive = unproductiveShops.includes(Store.id);
        const matchingUNOfflineOrderbyID = Array.isArray(unOfflineShops)
          ? unOfflineShops.find(order => order.fk_shop === Store.id)
          : null;

        // if (response.status == 200) {
        //   if (isUnproductive || matchingUNOfflineOrderbyID) {
        //     console.log('Unproductive order is already marked')
        //   } else {
        //     incrementTotalVisits();
        //   }
        // }
        console.log('Post Data', response.data);
        const postorderId = response.data.id;
        const shop_id = Store.id;
        Alert.alert('Success', 'Order Created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              console.log('UUID Value:', uuiddd);
              if (!uuiddd) {
                navigation.navigate('AllShops', {
                  RouteDate: RouteDate,
                });
              }
              console.log(RouteDate, 'RouteDate');
            },
          },
        ]);
        await updateStoredOrderIds(userId, postorderId, shop_id);
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
      Alert.alert('Error', 'An error occurred while processing your request.', [
        {
          text: 'ok',
          onPress: () => {
            console.log('UUID Value:', uuiddd);
            if (!uuiddd) {
              navigation.navigate('AllShops', {
                RouteDate: RouteDate,
              });
            }
            console.log(RouteDate, 'RouteDate');
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  let orderDetails = cartItems.map(item => ({
    carton_ordered: item.carton_ordered,
    box_ordered: item.box_ordered,
    pricing_id: item.pricing_id,
  }));
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const offlineOrder = {
    unid: generateUniqueId(),
    // lng: currentLocation.longitude,
    // lat: currentLocation.latitude,
    detailss: orderDetails,
    totalPrice: currentOrderAmount,
    todiscount: Math.round(GrossAmount - totalPrice),
    // totalCarton: TotalCarton,
    // date: formattedDate,
    // details: mergedCartItems,
    // shop: Store,
    // location: currentLocation,
    // fk_distribution: parseInt(distributor_id),
    fk_shop: Store.id,
    // fk_orderbooker_employee: parseInt(fk_employee),
    discount: (GrossAmount - totalPrice).toFixed(2),
    // cartItems: cartItems,
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
    ordercreationdate: getCurrentDate()
  };

  const updateOrder = async (currentLocation) => {
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const fk_employee = await AsyncStorage.getItem('fk_employee');

    const networkInfo = await NetInfo.fetch();
    const networkAvailable = networkInfo.isConnected;

    // Recalculate total amount and total cartons from scratch
    let totalAmount = 0;
    let totalCartons = 0;

    cartItems.forEach((item) => {
      const tradePrice = item?.itemss?.pricing.trade_price || 0;
      const tradeOffer = item?.itemss?.trade_offer || 0;
      const cartonOrdered = item?.carton_ordered || 0;
      const boxOrdered = item?.box_ordered || 0;
      const boxInCarton = item?.itemss?.pricing?.box_in_carton || 0;

      const totalUnits = cartonOrdered * boxInCarton + boxOrdered;
      const discount = (tradeOffer / 100) * tradePrice * totalUnits;
      totalAmount += tradePrice * totalUnits - discount;
      totalCartons += cartonOrdered;
    });

    const mergedCartItems = cartItems.map((item) => {
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
      date: formattedDate,
      totalPrice: totalAmount, // Use the recalculated total amount
      totalCarton: totalCartons, // Use the recalculated total cartons
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
          }
        );

        // Update AsyncStorage with the new totals
        await AsyncStorage.setItem(`totalAmount_${userId}`, totalAmount.toString());
        await AsyncStorage.setItem(`totalCartons_${userId}`, totalCartons.toFixed(1));


        const key2 = `localofflinedata_${userId}`;

        const existingLocalOrders = await AsyncStorage.getItem(key2);

        let offlineLocalOrders = existingLocalOrders ? JSON.parse(existingLocalOrders) : [];

        if (!Array.isArray(offlineLocalOrders)) {
          offlineLocalOrders = [];
        }

        offlineLocalOrders = offlineLocalOrders.filter(order => order.unid !== uuiddd);

        // More explicit approach with control over which properties to include
        offlineLocalOrders.push({
          id: data.id,
          details: data.details,
          shop: data.shop,
          date: data.date,
          totalPrice: data.totalPrice,
          totalCarton: data.totalCarton,
          cartItems: data.cartItems,

          unid: offlineOrder.unid,
          detailss: offlineOrder.detailss,
          todiscount: offlineOrder.todiscount,
          fk_shop: offlineOrder.fk_shop,
          discount: offlineOrder.discount,
          gst_amount: offlineOrder.gst_amount,
          net_amount: offlineOrder.net_amount,
          gross_amount: offlineOrder.gross_amount,
          distributionTO: offlineOrder.distributionTO,
          distribution: offlineOrder.distribution,
          special: offlineOrder.special,
          ordercreationdate: offlineOrder.ordercreationdate,

          fk_distribution: parseInt(distributor_id),
          fk_orderbooker_employee: parseInt(fk_employee),
        });

        await AsyncStorage.setItem(key2, JSON.stringify(offlineLocalOrders));

        console.log("Order updated successfully!");


        console.log(response.data, 'Put data');
        console.log(response.status, 'status');
        Alert.alert('Success', 'Order edited successfully!', [
          {
            text: 'OK',
            onPress: () => {
              console.log('UUID Value:', uuiddd);
              if (RouteDDate) {
                navigation.navigate('AllShops', {
                  RouteDate: RouteDDate,
                });
              }
              console.log(RouteDate, 'RouteDate');
            },
          },
        ]);
      } else {
        // Offline: Save to offline edit storage
        const offlineEditOrders = await AsyncStorage.getItem(`offlineEditOrders_${userId}`);
        const parsedOfflineEditOrders = offlineEditOrders ? JSON.parse(offlineEditOrders) : [];

        // Append the new order to the list
        parsedOfflineEditOrders.push({
          id: data.id,
          details: data.details,
          shop: data.shop,
          date: data.date,
          totalPrice: data.totalPrice,
          totalCarton: data.totalCarton,
          cartItems: data.cartItems,

          unid: offlineOrder.unid,
          detailss: offlineOrder.detailss,
          todiscount: offlineOrder.todiscount,
          fk_shop: offlineOrder.fk_shop,
          discount: offlineOrder.discount,
          gst_amount: offlineOrder.gst_amount,
          net_amount: offlineOrder.net_amount,
          gross_amount: offlineOrder.gross_amount,
          distributionTO: offlineOrder.distributionTO,
          distribution: offlineOrder.distribution,
          special: offlineOrder.special,
          ordercreationdate: offlineOrder.ordercreationdate,

          fk_distribution: parseInt(distributor_id),
          fk_orderbooker_employee: parseInt(fk_employee),
        });

        // Save the updated list to AsyncStorage
        await AsyncStorage.setItem(`offlineEditOrders_${userId}`, JSON.stringify(parsedOfflineEditOrders));
        const getCurrentDate = () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          return `${day}-${month}-${year}`;
        };

        const key2 = `localofflinedata_${userId}`;

        const existingLocalOrders = await AsyncStorage.getItem(key2);

        let offlineLocalOrders = existingLocalOrders ? JSON.parse(existingLocalOrders) : [];

        if (!Array.isArray(offlineLocalOrders)) {
          offlineLocalOrders = [];
        }

        offlineLocalOrders = offlineLocalOrders.filter(order => order.unid !== uuiddd);

        offlineLocalOrders.push({
          id: data.id,
          details: data.details,
          shop: data.shop,
          date: data.date,
          totalPrice: data.totalPrice,
          totalCarton: data.totalCarton,
          cartItems: data.cartItems,

          unid: offlineOrder.unid,
          detailss: offlineOrder.detailss,
          todiscount: offlineOrder.todiscount,
          fk_shop: offlineOrder.fk_shop,
          discount: offlineOrder.discount,
          gst_amount: offlineOrder.gst_amount,
          net_amount: offlineOrder.net_amount,
          gross_amount: offlineOrder.gross_amount,
          distributionTO: offlineOrder.distributionTO,
          distribution: offlineOrder.distribution,
          special: offlineOrder.special,
          ordercreationdate: offlineOrder.ordercreationdate,

          fk_distribution: parseInt(distributor_id),
          fk_orderbooker_employee: parseInt(fk_employee),
        });

        await AsyncStorage.setItem(key2, JSON.stringify(offlineLocalOrders));

        console.log("Order updated successfully!");


        const storedData = await AsyncStorage.getItem(`totalViewInvoice_${userId}`);
        const storedEditData = await AsyncStorage.getItem(`totalEditAmountOffline_${userId}`);

        let totalData = JSON.parse(storedData);
        let totalEditData = storedEditData ? JSON.parse(storedEditData) : { totalAmount: 0, date: '' };

        // Calculate the edit amount
        const editamount = totalAmount - totalData;

        // Update totalEditData with the new edit amount
        totalEditData.totalAmount += parseFloat(editamount.toString());
        totalEditData.date = getCurrentDate();

        console.log(`Total Amount: ${totalEditData.totalAmount}, Date: ${totalEditData.date}`);

        // Store the updated totalEditAmountOffline data back to AsyncStorage
        await AsyncStorage.setItem(
          `totalEditAmountOffline_${userId}`,
          JSON.stringify(totalEditData)
        );
        let totalcartons = 0;

        cartItems.forEach((item) => {
          const tradePrice = item?.itemss?.pricing.trade_price || 0;
          const tradeOffer = item?.itemss?.trade_offer || 0;
          const cartonOrdered = item?.carton_ordered || 0;
          const boxOrdered = item?.box_ordered || 0;
          const boxInCarton = item?.itemss?.pricing?.box_in_carton || 0;

          const totalUnits = cartonOrdered * boxInCarton + boxOrdered;
          const discount = (tradeOffer / 100) * tradePrice * totalUnits;
          totalAmount += tradePrice * totalUnits - discount;
          totalcartons += cartonOrdered;
        });
        const storedTotalCartons = await AsyncStorage.getItem(
          `totalCartons_${userId}`,
        );
        const storedCartons = await AsyncStorage.getItem(`totalCartonsinInvoice_${userId}`);
        const storedCartonsValue = parseFloat(storedCartons) || 0;
        let previousTotalCartons = parseFloat(storedTotalCartons) || 0;

        const cartonedit = totalcartons - storedCartonsValue;
        const updatedTotalCartons = previousTotalCartons + cartonedit;

        setTotalCartons(updatedTotalCartons);

        await AsyncStorage.setItem(
          `totalCartons_${userId}`,
          updatedTotalCartons.toFixed(1),
        );
        console.log(`Updated Total Cartons in offline: ${updatedTotalCartons}`);

        console.log('Order saved for offline update.');
        Alert.alert('Info', 'No network. Changes saved offline and will be synced when online', [{ text: 'OK' }]);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity('Please Log in again', ToastAndroid.LONG, ToastAndroid.CENTER);
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
        Alert.alert('Error', 'An error occurred while updating the order.', [{ text: 'OK' }]);
      }
    }
  };
  const updateStoredOrderIds = async (userId, newOrderId, shopId) => {
    try {
      // Use a transaction to ensure atomicity
      await AsyncStorage.setItem(
        `postorderId_${userId}`,
        JSON.stringify(
          await AsyncStorage.getItem(`postorderId_${userId}`).then(
            storedOrderIds => {
              let postorderIds = [];
              if (storedOrderIds) {
                try {
                  postorderIds = JSON.parse(storedOrderIds);
                  if (!Array.isArray(postorderIds)) {
                    postorderIds = [];
                  }
                } catch (e) {
                  console.error('Error in parsing:', e);
                }
              }

              // Add the new orderId and shopId as an object
              postorderIds.push({ orderId: newOrderId, shopId: shopId });
              return postorderIds;
            },
          ),
        ),
      );
      console.log(
        `Order ID ${newOrderId} and Shop ID ${shopId} added successfully.`,
      );
    } catch (error) {
      console.error('Error updating stored order IDs:', error);
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

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginTop: 5 }}>
          <OrderStatus Lefttxt={'Invoice Number'} RightText={'-'} />
          <OrderStatus Lefttxt={'Order Status'} RightText={'Draft'} />
          <OrderStatus Lefttxt={'Payment Done'} RightText={'False'} />
        </View>
        <View style={{ padding: '3%' }}>
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
            Lefttxt={'Total GST:'}
            RightText={GST.toFixed(2)}
            gstTxt={gstText}
          />
          <ShowValues
            Lefttxt={'Gross Amount:'}
            RightText={`(Inclusive of GST) ${GrossAmount.toFixed(2)}`}
            leftStyle={{ fontWeight: 'bold', color: '#000' }}
          />
          <ShowValues
            Lefttxt={'T.O Discount:'}
            RightText={(GrossAmount - totalPrice).toFixed(2)}
          />
          <ShowValues
            Lefttxt={'Distribution Discount:'}
            RightText={FinalDistributiveDiscount.toFixed(2)}
            percent={ratte}
            gross={GrossAmount.toFixed(2)}
          />
          <ShowValues
            Lefttxt={'Special Discount:'}
            RightText={applySpecialDiscount.toFixed(2)}
            percent={discountRate}
            gross={GrossAmount.toFixed(2)}
          />
        </View>
        <View style={{ padding: '2%' }}>
          <View
            style={{
              width: '100%',
              height: 1,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
              marginTop: '2%',
            }}></View>
        </View>
        {/* <View style={{justifyContent: 'center'}}> */}

        {/* <Text
            style={{
              marginTop: -10,
              marginLeft: 10,
              color: '#000',
              fontWeight: '800',
              textAlign: 'right',
            }}>
            (Inclusive of GST)
          </Text> */}
        {/* </View> */}
        <View>
          <ShowValues
            Lefttxt={'Total Discount:'}
            RightText={(
              GrossAmount -
              totalPrice +
              applySpecialDiscount +
              FinalDistributiveDiscount
            ).toFixed(2)}
          />
        </View>
        <ShowValues
          Lefttxt={'Net Price:'}
          RightText={(
            totalPrice -
            applySpecialDiscount -
            FinalDistributiveDiscount
          ).toFixed(2)}
          leftStyle={{ fontWeight: 'bold', color: '#000' }}
        />
      </ScrollView>
      {cartItems.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 5,
            width: '100%',
            padding: 10,
            backgroundColor: '#f5f5f5',
          }}>
          {isButtonVisible && (
            <TouchableOpacity
              style={{
                backgroundColor: '#407BFF',
                paddingVertical: 12,
                borderRadius: 10,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleButtonPress}>
              <AntDesign name="shoppingcart" size={24} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 10 }}>
                {!orderId ? 'Confirm Order' : 'Edit Order'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
      {isLoading ? <Loader /> : null}
    </View>
  );
};
export default ConfirmOrder;
