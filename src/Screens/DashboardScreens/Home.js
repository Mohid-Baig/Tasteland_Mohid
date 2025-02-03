import React, {useEffect, useState, useContext, useCallback} from 'react';
import {
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ToastAndroid,
  DevSettings,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import Loader from '../../Components/Loaders/Loader';
import instance from '../../Components/BaseUrl';
import GetLocation from 'react-native-get-location';
import {useIsFocused, useFocusEffect} from '@react-navigation/native';
const Home = ({navigation}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [headingData, setHeadingData] = useState({});
  const [orderBokerId, setOrderBokerId] = useState({});
  const [DistributerName, setDistributerName] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState({startDate: null, endDate: null});
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [checkAttandance, setCheckAttandance] = useState(false);
  const [id, setID] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalCartons, setTotalCartons] = useState(0);
  const getAllStoredOrderIds = async userId => {
    try {
      const storedOrderIds = await AsyncStorage.getItem(
        `postorderId_${userId}`,
      );
      if (storedOrderIds) {
        try {
          const parsedOrderIds = JSON.parse(storedOrderIds);
          if (Array.isArray(parsedOrderIds)) {
            console.log('All stored Order Ids:', parsedOrderIds);
            return parsedOrderIds;
          } else {
            console.warn('Stored order IDs is not a valid array.');
            return [];
          }
        } catch (parseError) {
          console.error('Error parsing stored order IDs:', parseError);
          return [];
        }
      } else {
        console.log('No order IDs found in storage.');
        return [];
      }
    } catch (error) {
      console.error('Error getting stored order IDs:', error);
      return [];
    }
  };
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
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
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
      getAttandanceStatus();
      getHeadingData();
      getOrderBookerID();
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
  // useEffect(() => {
  //   TokenRenew();
  // }, []);
  useEffect(() => {
    const fetchStoredIds = async () => {
      const userId = await AsyncStorage.getItem('userId');
      await getAllStoredOrderIds(userId);
    };

    fetchStoredIds();
  }, []);
  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    // await AsyncStorage.removeItem(`failedOrders_${userId}`);
    // await AsyncStorage.removeItem(`offlineOrders_${userId}`);
    navigation.replace('Login');
  };
  const refreshApp = () => {
    DevSettings.reload();
  };
  useFocusEffect(
    useCallback(() => {
      const checkNewDay = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          return;
        } // Ensure userId is available

        const today = new Date().toDateString();
        const lastVisitDateKey = `lastVisitDate_${userId}`;
        const totalVisitsKey = `totalVisits_${userId}`;

        const savedDate = await AsyncStorage.getItem(lastVisitDateKey);

        if (savedDate !== today) {
          // New day, reset the total visits
          await AsyncStorage.setItem(totalVisitsKey, '0');
          await AsyncStorage.setItem(lastVisitDateKey, today);
          setTotalVisits(0);
        } else {
          // Get total visits for this user
          const visits = await AsyncStorage.getItem(totalVisitsKey);
          setTotalVisits(parseInt(visits) || 0);
        }
      };

      checkNewDay();

      // Optionally, return a cleanup function if necessary
      return () => {
        // Cleanup logic if needed
      };
    }, []),
  );

  const getHeadingData = async () => {
    // setIsLoading(true);
    const employeeId = await AsyncStorage.getItem('employeeId');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    try {
      const response = await instance.get(`/employee/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setHeadingData(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Please Log in again',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      } else {
        console.log('Error in heading data', error);
      }
    } finally {
      // setIsLoading(false);
    }
  };
  const getOrderBookerID = async () => {
    // setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    try {
      const response = await instance.get('/login/user_entity', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('respon', response.data, 'respon');

      setOrderBokerId(response?.data?.orderbooker?.id);
      setID(response.data.orderbooker.employee.fk_user);
      AsyncStorage.setItem(
        'orderBokerId',
        response?.data?.orderbooker?.id.toString(),
      );
      await AsyncStorage.setItem(
        'orderbooker',
        response?.data?.orderbooker?.id.toString(),
      );
      console.log(response?.data?.orderbooker?.fk_employee, 'response?.data');
      await AsyncStorage.setItem(
        'distribution_id',
        response?.data?.orderbooker?.distribution.toString(),
      );
      await AsyncStorage.setItem(
        'fk_employee',
        response?.data?.orderbooker?.fk_employee.toString(),
      );
    } catch (error) {
      console.log('Error in orderbooker', error);
    } finally {
      // setIsLoading(false);
    }
  };
  const getNameData = async () => {
    // setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    try {
      console.log(
        `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}-----`,
      );
      const response = await instance.get(
        `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      console.log('data coming in name', response.data);
      await AsyncStorage.setItem(
        'DistributerName',
        response?.data?.distribution?.name.toString(),
      );
      setDistributerName(response?.data?.distribution?.name);
    } catch (error) {
      console.log('Error in getname', error);
    } finally {
      // setIsLoading(false);
    }
  };
  const getAttandanceStatus = async () => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const currentDate = new Date();
    const apiCurrentDate = formatDate(currentDate);
    try {
      // setIsLoading(true);
      const response = await instance.get(
        `/attendance/get_attendances/${userId}?date_=${apiCurrentDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      console.log(response.data, 'Attandance');
      if (response.data?.attendance_check_in) {
        setCheckAttandance(true);
      } else if (response.data?.message) {
        getLocation();
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Please Log in again',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      }
      console.log('Attandance Error', error);
    }
    // setIsLoading(false);
  };
  const requestLocationPermission = async () => {
    try {
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
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the location');
        return true;
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Permission Denied',
          'Location permission is required to Mark Attendance Go on app setting and turn on Location',
        );
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return;
    }

    try {
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 60000,
      });

      // Store the location in a const variable
      const currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      navigation.navigate('MapStart', {
        location: location,
        orderBokerId: orderBokerId,
      });

      console.log('Current Location:', currentLocation);

      // Now you can use `currentLocation` wherever needed
      // For example, set it to a state or pass it to another function
    } catch (error) {
      // const {code, message} = error;
      // console.warn(code, message);
      Alert.alert(
        'Location Required',
        'To mark your attendence enable your location',
      );
    }
  };
  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem('userId');
      setUserId(userId);
      console.log(userId, 'userID');
    };
    const loadInitialData = async () => {
      setIsLoading(true);
      await getHeadingData();
      await getOrderBookerID();
      await getUserId();
      // await getNameData();
      setIsInitialDataLoaded(true);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);
  useEffect(() => {
    if (userId) {
      getAttandanceStatus();
    }
  }, [userId]);

  useEffect(() => {
    if (weekDates.startDate && weekDates.endDate && orderBokerId) {
      getNameData();
    }
  }, [weekDates, orderBokerId]);

  const calculateOrderForMultipleItems = async orderItems => {
    const userId = await AsyncStorage.getItem('userId');
    let totalCartons = 0;

    orderItems.details.forEach(item => {
      const cartonsForItem = item.box_ordered / item.box_in_carton;

      totalCartons += cartonsForItem;
    });
    await AsyncStorage.setItem(
      `totalCartons_${userId}`,
      totalCartons.toFixed(1),
    );
    return totalCartons; // Return the total number of cartons for all items
  };
  let hasSyncErrors = false; // Track sync errors
  const syncOrders = async () => {
    setIsLoading(true);
    let OrderSyncErrors = false;
    try {
      // Clear previous Territorial, Discount Slab, Special Discount Slab, and Pricing data
      await AsyncStorage.removeItem(`territorialData_${userId}`);
      await AsyncStorage.removeItem(`discountSlabData_${userId}`);
      await AsyncStorage.removeItem(`specialDiscountSlabData_${userId}`);
      await AsyncStorage.removeItem(`pricingData_${userId}`);
      await AsyncStorage.removeItem(`ShopTypeData_${userId}`);
      await AsyncStorage.removeItem(`LocalAPI_${userId}`);
      await AsyncStorage.removeItem(`ProductData_${userId}`);

      // Fetching failed, offline post, and offline edit orders
      const failedOrders = await AsyncStorage.getItem(`failedOrders_${userId}`);
      const parsedOrders = failedOrders ? JSON.parse(failedOrders) : [];

      const offlinePostOrders = await AsyncStorage.getItem(
        `offlineOrders_${userId}`,
      );
      const parsedOfflinePostOrders = offlinePostOrders
        ? JSON.parse(offlinePostOrders)
        : [];

      const offlineEditOrders = await AsyncStorage.getItem(
        `offlineEditOrders_${userId}`,
      );
      const parsedOfflineEditOrders = offlineEditOrders
        ? JSON.parse(offlineEditOrders)
        : [];

      // Check if parsed data is iterable
      if (!Array.isArray(parsedOrders)) {
        console.error('Failed Orders is not an array:', parsedOrders);
        throw new Error('Failed orders are not iterable.');
      }
      if (!Array.isArray(parsedOfflinePostOrders)) {
        console.error(
          'Offline Post Orders is not an array:',
          parsedOfflinePostOrders,
        );
        parsedOfflineEditOrders = [parsedOfflineEditOrders];
        throw new Error('Offline post orders are not iterable.');
      }
      if (!Array.isArray(parsedOfflineEditOrders)) {
        console.error(
          'Offline Edit Orders is not an array:',
          parsedOfflineEditOrders,
        );
        throw new Error('Offline edit orders are not iterable.');
      }

      // Sync Failed Orders
      for (const order of parsedOrders) {
        try {
          const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
          const response = await instance.post('/secondary_order', order, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          console.log('Failed order synced successfully:', response.data);
          if (response) {
            OrderSyncErrors = false;
          }
        } catch (error) {
          if (error.response && error.response.status === 401) {
            ToastAndroid.showWithGravity(
              'Please Log in again',
              ToastAndroid.LONG,
              ToastAndroid.CENTER,
            );
            TokenRenew();
          }
          console.log('Error syncing failed order:', error);
          OrderSyncErrors = true; // Mark error if failed
        }
      }

      // Sync Offline Post Orders
      for (const order of parsedOfflinePostOrders) {
        try {
          const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
          if (!authToken) {
            console.warn('Auth token is missing. Skipping order sync.');
            await saveFailedOrder(userId, order);
            continue;
          }

          const response = await instance.post('/secondary_order', order, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          console.log('Offline order synced successfully:', response.data);
          if (response) {
            OrderSyncErrors = false;
            await AsyncStorage.removeItem(`offlineOrders_${userId}`);
          }

          const postorderId = response.data.id;
          const shop_id = order.shop.id;
          await updateStoredOrderIds(userId, postorderId, shop_id);

          const storedTotalAmount = await AsyncStorage.getItem(
            `totalAmount_${userId}`,
          );
          let totalAmount = parseFloat(storedTotalAmount) || 0;
          totalAmount += parseFloat(order.totalPrice);
          await AsyncStorage.setItem(
            `totalAmount_${userId}`,
            totalAmount.toString(),
          );
          console.log(`Updated Total Amount: ${totalAmount}`);

          let orderCount = await AsyncStorage.getItem(`orderCount_${userId}`);
          orderCount = parseInt(orderCount) || 0;
          orderCount++;
          await AsyncStorage.setItem(
            `orderCount_${userId}`,
            orderCount.toString(),
          );
          console.log(`Updated Order Count: ${orderCount}`);

          addCartonValueToStorage(order.totalCarton);
        } catch (error) {
          if (error.response && error.response.status === 401) {
            ToastAndroid.showWithGravity(
              'Please Log in again',
              ToastAndroid.LONG,
              ToastAndroid.CENTER,
            );
            TokenRenew();
          }
          console.error('Error syncing offline order:', error);
          const failed = {
            order: order,
            error: error.message || 'Order creation failed',
          };
          await saveFailedOrder(userId, failed);
          await AsyncStorage.removeItem(`offlineOrders_${userId}`);
          OrderSyncErrors = true;
        }
      }

      // Sync Offline Edit Orders
      for (const order of parsedOfflineEditOrders) {
        console.log(order.id);
        console.log('Total Carton:', order.totalCarton);
        try {
          const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
          const data = {
            id: order.id,
            details: order.details,
            shop: order.shop,
            date: new Date().toISOString(), // Ensure the date is unique for every request
          };
          console.log(data, 'data');
          const response = await instance.put(
            `/secondary_order/${order.id}`,
            JSON.stringify(data),
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            },
          );

          if (response) {
            OrderSyncErrors = false;
            await AsyncStorage.removeItem(`offlineEditOrders_${userId}`);
          }

          const storedTotalAmount = await AsyncStorage.getItem(
            `totalAmount_${userId}`,
          );
          let totalAmount = parseFloat(storedTotalAmount) || 0;
          totalAmount += parseFloat(order.totalPrice);
          await AsyncStorage.setItem(
            `totalAmount_${userId}`,
            totalAmount.toString(),
          );
          console.log(`Updated Total Amount: ${totalAmount}`);

          const storedTotalCartons = await AsyncStorage.getItem(
            `totalCartons_${userId}`,
          );
          let previousTotalCartons = parseFloat(storedTotalCartons) || 0;
          const newTotalCartons = await calculateOrderForMultipleItems(order);
          const updatedTotalCartons = previousTotalCartons + newTotalCartons;
          setTotalCartons(updatedTotalCartons);
          await AsyncStorage.setItem(
            `totalCartons_${userId}`,
            updatedTotalCartons.toFixed(1),
          );
          console.log('Offline edit order synced successfully:', response.data);
        } catch (error) {
          if (error.response && error.response.status === 401) {
            ToastAndroid.showWithGravity(
              'Please Log in again',
              ToastAndroid.LONG,
              ToastAndroid.CENTER,
            );
            TokenRenew();
          }
          console.log('Error syncing offline edit order:', error);
          await saveFailedOrder(userId, order);
          await AsyncStorage.removeItem(`offlineEditOrders_${userId}`);
          OrderSyncErrors = true;
        }
      }

      await fetchAndStoreTerritorialData();
      await fetchAndStoreDiscountSlabData();
      await fetchAndStoreSpecialDiscountSlabData();
      await fetchAndStorePricingData();
      await fetchShopType();
      await FetchAllProductdata();
      await FetchLocalAPIdata();
      if (hasSyncErrors) {
        Alert.alert(
          'Sync Incomplete',
          'Data failed to sync. Check your internet connection and try again.',
        );
        // TokenRenew();
      } else {
        Alert.alert('Sync Complete', 'All orders synced and data retrieved.');
        refreshApp();
      }
    } catch (error) {
      console.log('Error during sync:', error);
      Alert.alert('Sync Failed', 'An error occurred while syncing orders.');
    } finally {
      setIsLoading(false);
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
              postorderIds.push({orderId: newOrderId, shopId: shopId});
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
  const addCartonValueToStorage = async newCartonValue => {
    if (!newCartonValue || newCartonValue <= 0) {
      console.log('Invalid carton value:', newCartonValue); // Debug statement
      return; // Exit if the value is invalid
    }

    try {
      const userId = await AsyncStorage.getItem('userId'); // Retrieve the userId from AsyncStorage
      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const storageKey = `totalCartons_${userId}`;
      const storedValue = await AsyncStorage.getItem(storageKey);
      console.log('Stored Carton Value:', storedValue); // Debug statement
      const previousCartonsValue = storedValue ? parseFloat(storedValue) : 0;
      console.log('Previous Cartons Value:', previousCartonsValue); // Debug statement

      const updatedTotalCartons = previousCartonsValue + newCartonValue;
      console.log('Updated Cartons Value:', updatedTotalCartons); // Debug statement

      await AsyncStorage.setItem(storageKey, updatedTotalCartons.toString());
      console.log(`Updated Total Cartons in Storage: ${updatedTotalCartons}`); // Confirmation statement
    } catch (e) {
      console.error('Failed to add carton value to storage:', e);
    }
  };
  const fetchAndStoreTerritorialData = async () => {
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const response = await instance.get(
        `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const rawTerritorialData = response.data;
      const territorialDataKey = `territorialData_${userId}`;
      await AsyncStorage.setItem(
        territorialDataKey,
        JSON.stringify(rawTerritorialData),
      );
      console.log(
        'Territorial data saved to AsyncStorage:',
        rawTerritorialData,
      );
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Please Log in again',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      }
      console.log('Error fetching territorial data:', error);
      hasSyncErrors = true;
    }
  };
  const fetchAndStoreDiscountSlabData = async () => {
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const distributorId = await AsyncStorage.getItem('distribution_id');
      const response = await instance.get(
        `/discount_slab/all?distribution_id=${distributorId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const discountSlabData = response.data;
      const discountSlabKey = `discountSlabData_${userId}`;
      await AsyncStorage.setItem(
        discountSlabKey,
        JSON.stringify(discountSlabData),
      );
      console.log(
        'Discount Slab data saved to AsyncStorage:',
        discountSlabData,
      );
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      console.log('Error fetching Discount Slab data:', error);
      hasSyncErrors = true;
    }
  };
  const fetchAndStoreSpecialDiscountSlabData = async () => {
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const distributorId = await AsyncStorage.getItem('distribution_id');
      const response = await instance.get(
        `/special_discount_slab/all?distribution_id=${distributorId}&include_detail=true`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const specialDiscountSlabData = response.data;
      const specialDiscountSlabKey = `specialDiscountSlabData_${userId}`;
      await AsyncStorage.setItem(
        specialDiscountSlabKey,
        JSON.stringify(specialDiscountSlabData),
      );
      console.log(
        'Special Discount Slab data saved to AsyncStorage:',
        specialDiscountSlabData,
      );
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      console.log('Error fetching Special Discount Slab data:', error);
      hasSyncErrors = true;
    }
  };
  const fetchAndStorePricingData = async () => {
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const response = await instance.get(
        `/distribution_trade/all?distribution_id=${distributor_id}&current=true`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const pricingData = response.data;
      const pricingDataKey = `pricingData_${userId}`;
      await AsyncStorage.setItem(pricingDataKey, JSON.stringify(pricingData));
      console.log('Pricing data saved to AsyncStorage:', pricingData);
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      console.log('Error fetching Pricing data:', error);
      hasSyncErrors = true;
    }
  };
  const fetchShopType = async () => {
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const response = await instance.get(
        '/shop_type/all?sort_alphabetically=true',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const ShopTypeData = response.data;
      const shopTypeDataKey = `ShopTypeData_${userId}`;
      await AsyncStorage.setItem(shopTypeDataKey, JSON.stringify(ShopTypeData));
      console.log('ShopType data saved to AsyncStorage:', ShopTypeData);
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      console.log('Error fetching Pricing data:', error);
      hasSyncErrors = true;
    }
  };
  const FetchAllProductdata = async () => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    try {
      const response = await instance.get(
        `/distribution_trade/all?distribution_id=${distributor_id}&current=true`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const ProductData = response.data;
      const ProductDatakey = `ProductData_${userId}`;
      await AsyncStorage.setItem(ProductDatakey, JSON.stringify(ProductData));
      console.log('Product data saved in Asyncstorage:', ProductData);
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      console.log('Error Fetching Product data', error);
      hasSyncErrors = true;
    }
  };
  const FetchLocalAPIdata = async () => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const fkEmployee = await AsyncStorage.getItem('fk_employee');
    const getCurrentDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
      const day = String(today.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    console.log(getCurrentDate()); // Output: 2024-12-17 (or current date)
    try {
      const formattedDate = getCurrentDate();
      const response = await instance.get(
        `/secondary_order/all?employee_id=${fkEmployee}&include_shop=true&include_detail=true&order_date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const LocalAPIData = response.data;
      const LocalAPIkey = `LocalAPI_${userId}`;
      await AsyncStorage.setItem(LocalAPIkey, JSON.stringify(LocalAPIData));
      console.log('LocalAPI data saved in Asyncstorage:', LocalAPIData);
      if (response) {
        hasSyncErrors = false;
      }
    } catch (error) {
      console.log('Error Fetching LocalAPI data', error);
      hasSyncErrors = true;
    }
  };
  const formatDate = date => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };
  const fetchTotalAmount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const storedDate = await AsyncStorage.getItem(`lastUpdated_${userId}`);
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Check if stored date is different from today's date (new day)
      if (storedDate !== today) {
        // New day, reset the total amount
        await AsyncStorage.removeItem(`totalAmount_${userId}`); // Clear previous total amount
        await AsyncStorage.setItem(`lastUpdated_${userId}`, today); // Update the date to today
        setTotalAmount(0); // Reset the displayed amount
      } else {
        // Fetch the total amount for the current day
        const amount = await AsyncStorage.getItem(`totalAmount_${userId}`);
        if (amount !== null) {
          setTotalAmount(parseFloat(amount)); // Set the total amount from AsyncStorage
        }
      }
    } catch (error) {
      console.error('Error fetching total amount:', error);
    }
  };
  const fetchOrderData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      // Get today's date in a simple format (e.g., YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];

      // Retrieve the last fetched date from AsyncStorage
      const lastDate = await AsyncStorage.getItem(`lastOrderDate_${userId}`);

      // Check if the last date is different from today
      if (lastDate !== today) {
        // If it's a new day, reset the order count and total amount
        await AsyncStorage.setItem(`orderCount_${userId}`, '0');
        await AsyncStorage.setItem(`totalAmount_${userId}`, '0');
        await AsyncStorage.setItem(`lastOrderDate_${userId}`, today); // Store today's date

        // Reset state values
        setOrderCount(0);
        setTotalAmount(0);
      } else {
        // If it's the same day, fetch the order count and total amount
        const storedOrderCount = await AsyncStorage.getItem(
          `orderCount_${userId}`,
        );
        if (storedOrderCount !== null) {
          setOrderCount(parseInt(storedOrderCount)); // Set the order count if found
        }

        const storedTotalAmount = await AsyncStorage.getItem(
          `totalAmount_${userId}`,
        );
        if (storedTotalAmount !== null) {
          setTotalAmount(parseFloat(storedTotalAmount)); // Set the total amount if found
        }
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };
  const fetchTotalCartons = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId'); // Retrieve the userId from AsyncStorage
      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const storageKey = `totalCartons_${userId}`; // Create the unique key using userId
      const storedValue = await AsyncStorage.getItem(storageKey);
      const cartonsValue = storedValue ? parseFloat(storedValue) : 0;

      // Check if it's a new day
      const currentDate = new Date().toDateString();
      const storedDate = await AsyncStorage.getItem('lastOrderDate');

      // If it's a new day, reset the total cartons
      if (storedDate !== currentDate) {
        await AsyncStorage.setItem(storageKey, '0'); // Reset cartons count
        await AsyncStorage.setItem('lastOrderDate', currentDate); // Update stored date
        setTotalCartons(0); // Update the state with the reset value
        console.log('New day detected. Total cartons reset.');
        await AsyncStorage.removeItem(`LocalAPI_${userId}`);
      } else {
        // If it's the same day, set the total cartons from AsyncStorage
        setTotalCartons(cartonsValue);
      }
    } catch (e) {
      console.error('Failed to fetch total cartons:', e);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      fetchOrderData();
      fetchTotalAmount();
      fetchTotalCartons();
    }, []), // Empty dependency array ensures it runs on screen focus only
  );
  const LocationPerm = () => {
    if (checkAttandance) {
      navigation.navigate('Order', {orderBokerId: orderBokerId});
    } else {
      Alert.alert(
        'Attendence Unmarked',
        'Please enable your location and mark your attendence',
        [
          {
            text: 'ok',
            onPress: () => getLocation(),
          },
        ],
      );
    }
  };
  return (
    <ImageBackground
      style={styles.image}
      resizeMode="cover"
      source={require('../../assets/Images/HomeBackground.jpeg')}>
      <StatusBar translucent backgroundColor="transparent" />

      <View style={styles.Container}>
        <View style={[styles.menu]}>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 160,
              }}>
              <Text style={[styles.MiddleTXT, {fontSize: 14}]}>
                Working Date:{' '}
              </Text>
              <Text style={[styles.MiddleTXT, {fontSize: 14}]}>
                {formatDate(currentDate)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                // alignSelf: 'flex-end',
                // marginRight: 20,
              }}>
              <Text style={[styles.MiddleTXT, {fontSize: 14}]}>Ver no: </Text>
              <Text style={[styles.MiddleTXT, {fontSize: 14}]}>0.74.5</Text>
            </View>
          </View>
          <Menu>
            <MenuTrigger style={{width: '100%'}}>
              <View>
                <Ionicons name="menu" color="#fff" size={30} />
              </View>
            </MenuTrigger>
            <MenuOptions style={styles.menuOptions}>
              <MenuOption onSelect={syncOrders}>
                <Text style={styles.singleMenuOption}>Sync</Text>
              </MenuOption>
              <MenuOption>
                <Text style={styles.singleMenuOption}>Settings</Text>
              </MenuOption>
              <MenuOption onSelect={handleLogout}>
                <Text style={styles.singleMenuOption}>Logout</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        <View style={{marginTop: 30}}>
          <Text style={[styles.HeadingTxt, {fontSize: 30, fontWeight: 'bold'}]}>
            {headingData.first_name} {headingData.last_name}
          </Text>
          <Text style={styles.HeadingTxt}>
            {headingData.designation ? headingData.designation : 'null'}
          </Text>
          <Text style={[styles.HeadingTxt, {fontWeight: 'normal'}]}>
            {DistributerName ? DistributerName : 'null'}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            // justifyContent: 'space-around',
            alignItems: 'center',
          }}>
          {checkAttandance ? (
            <View>
              <Text style={[styles.HeadingTxt, {fontSize: 20}]}>
                Attendance <Text style={{color: 'green'}}>Marked</Text>
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[styles.HeadingTxt, {fontSize: 20}]}>
                Attendance <Text style={{color: 'red'}}>Un Marked</Text>
              </Text>
            </View>
          )}
        </View>
        <View style={styles.MiddleContainer}>
          <View style={styles.MiddleLeft}>
            <Text style={styles.MiddleTXT}>TOTAL VISITS</Text>
            <Text style={styles.MiddleTXT}>{totalVisits}</Text>
            <Text style={styles.MiddleTXT}>ORDERS</Text>
            <Text style={styles.MiddleTXT}>{orderCount}</Text>
          </View>
          <View style={[styles.MiddleRight, {marginTop: 43}]}>
            <View style={{flexDirection: 'row'}}>
              <View style={{width: '50%'}}>
                <Text style={styles.MiddleTXT}>BOOKING</Text>
                <Text style={styles.MiddleTXT}>{totalCartons.toFixed(1)}</Text>
              </View>
              <View style={{width: '50%'}}>
                <Text style={styles.MiddleTXT}>AMOUNT</Text>
                <Text style={styles.MiddleTXT}>
                  Rs: {totalAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View>
          <View style={styles.BottomContainer}>
            <TouchableOpacity
              onPress={() => LocationPerm()}
              style={styles.ButtonContainer}>
              <Text style={styles.BtnTopTxt}>CREATE NEW ORDER</Text>
              <Text style={[styles.HeadingTxt, {color: '#000'}]}>Order</Text>
              <MaterialIcons
                style={{marginTop: 10, padding: 10}}
                name="mode-edit"
                color="#3f5cd1"
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ButtonContainer}
              onPress={() =>
                navigation.navigate('Shop', {orderBokerId: orderBokerId})
              }>
              <Text style={styles.BtnTopTxt}>MANAGE NEW SHOPS</Text>
              <Text style={[styles.HeadingTxt, {color: '#000'}]}>Shop</Text>
              <FontAwesome6
                style={{marginTop: 10, padding: 10}}
                name="shop"
                color="#096132"
                size={35}
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.BottomContainer, {marginTop: '4%'}]}>
            <TouchableOpacity
              style={styles.ButtonContainer}
              onPress={() => {
                navigation.navigate('Invoice', {orderBokerId: orderBokerId});
              }}>
              <Text style={styles.BtnTopTxt}>VIEW ORDER INVOICES</Text>
              <Text style={[styles.HeadingTxt, {color: '#000'}]}>Invoice</Text>
              <MaterialCommunityIcons
                style={{marginTop: 10, padding: 10}}
                name="file-search"
                color="#48f053"
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ButtonContainer}
              onPress={() => navigation.navigate('Failed', {userId})}>
              <Text style={styles.BtnTopTxt}>VIEW FAILED REQUESTS</Text>
              <Text style={[styles.HeadingTxt, {color: '#000'}]}>Failed</Text>
              <MaterialIcons
                style={{marginTop: 10, padding: 10}}
                name="error-outline"
                color="red"
                size={40}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            marginTop: '4%',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={[styles.ButtonContainer, {width: 170}]}
            onPress={() =>
              navigation.navigate('Target', {
                first: headingData.first_name,
                last: headingData.last_name,
              })
            }>
            <Text style={[styles.BtnTopTxt, {marginLeft: 10}]}>
              VIEW Targets
            </Text>
            <Text style={[styles.HeadingTxt, {color: '#000'}]}>
              Target vs Acheivement
            </Text>
            <Feather
              style={{marginTop: -10, padding: 10}}
              name="target"
              color="blue"
              size={40}
            />
          </TouchableOpacity>
        </View>
      </View>
      {isLoading ? <Loader /> : null}
    </ImageBackground>
  );
};
export default Home;
const styles = StyleSheet.create({
  image: {
    flex: 1,
  },
  Container: {
    marginTop: '10%',
    padding: 10,
  },
  HeadingTxt: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  BottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    alignSelf: 'center',
    marginTop: '10%',
  },
  ButtonContainer: {
    width: 160,
    height: 135,
    borderRadius: 15,
    // backgroundColor: '#393a3f',
    backgroundColor: '#fff',
  },
  BtnTopTxt: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    padding: 5,
  },
  menu: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    textAlign: 'right',
    justifyContent: 'space-evenly',
  },
  menuOptions: {
    position: 'absolute',
    top: 5,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    zIndex: 2,
  },
  singleMenuOption: {
    fontSize: 14,
    borderBottomColor: 'black',
    borderBottomWidth: 0.5,
    paddingLeft: 10,
    paddingRight: 20,
    paddingVertical: 10,
    color: '#000',
  },
  MiddleContainer: {
    flexDirection: 'row',
    marginTop: '7%',
    padding: 10,
  },
  MiddleLeft: {
    width: '40%',
    padding: 5,
  },
  MiddleTXT: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  MiddleRight: {
    width: '60%',
    padding: 5,
  },
});
