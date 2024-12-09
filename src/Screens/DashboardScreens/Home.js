import React, {useEffect, useState, useContext} from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
import {VisitContext} from './VisitContext';

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
  const {totalVisits} = useContext(VisitContext);
  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    // await AsyncStorage.removeItem(`failedOrders_${userId}`);
    // await AsyncStorage.removeItem(`offlineOrders_${userId}`);
    navigation.replace('Login');
  };

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
        Alert.alert('Session Expired', 'Please log in again.', [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('access_token');
              navigation.replace('Login');
            },
          },
        ]);
      } else {
        console.log('Error', error);
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
      console.log('Error', error);
    } finally {
      // setIsLoading(false);
    }
  };

  const getNameData = async () => {
    // setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const start = formatDate(weekDates?.startDate);
    const end = formatDate(weekDates?.endDate);
    try {
      const response = await axiosInstance.get(
        `/radar_flutter/territorial/${orderBokerId}?start_date=${'2024-08-26'}&end_date=${'2024-08-26'}&sort_alphabetically=true`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      setDistributerName(response?.data?.distribution?.name);
    } catch (error) {
      console.log('Error', error);
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
      // console.log(response.data, "Attandance");
      if (response.data?.attendance_check_in) {
        setCheckAttandance(true);
      } else if (response.data?.message) {
        getLocation();
      }
    } catch (error) {
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
    if (!hasPermission) return;

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
      const {code, message} = error;
      console.warn(code, message);
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

  const syncOrders = async () => {
    setIsLoading(true);
    try {
      // Fetching failed orders from AsyncStorage
      const failedOrders = await AsyncStorage.getItem(`failedOrders_${userId}`);
      const parsedOrders = failedOrders ? JSON.parse(failedOrders) : [];

      // Fetching offline orders from AsyncStorage
      const offlinePostOrders = await AsyncStorage.getItem(
        `offlineOrders_${userId}`,
      );
      const parsedOfflinePostOrders = offlinePostOrders
        ? JSON.parse(offlinePostOrders)
        : [];

      // Sync failed orders first
      for (const order of parsedOrders) {
        try {
          const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
          const response = await instance.post('/secondary_order', order, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          console.log('Failed order synced successfully:', response.data);
        } catch (error) {
          console.log('Error syncing failed order:', error);
        }
      }

      // Sync offline orders next
      for (const order of parsedOfflinePostOrders) {
        try {
          const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
          const response = await instance.post('/secondary_order', order, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          console.log('Offline order synced successfully:', response.data);
        } catch (error) {
          console.log('Error syncing offline order:', error);
        }
      }

      // After syncing, clear both failed and offline orders
      await AsyncStorage.removeItem(`failedOrders_${userId}`);
      await AsyncStorage.removeItem(`offlineOrders_${userId}`);

      // Fetch and store other necessary data after syncing
      await fetchAndStoreTerritorialData();
      await fetchAndStoreDiscountSlabData();
      await fetchAndStoreSpecialDiscountSlabData();
      await fetchAndStorePricingData();

      Alert.alert('Sync Complete', 'All orders synced and data retrieved.');
    } catch (error) {
      console.log('Error during sync:', error);
      Alert.alert('Sync Failed', 'An error occurred while syncing orders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch and store Territorial data
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
    } catch (error) {
      console.log('Error fetching territorial data:', error);
    }
  };

  // Function to fetch and store Discount Slab data
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
    } catch (error) {
      console.log('Error fetching Discount Slab data:', error);
    }
  };

  // Function to fetch and store Special Discount Slab data
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
    } catch (error) {
      console.log('Error fetching Special Discount Slab data:', error);
    }
  };

  // Function to fetch and store Pricing data
  const fetchAndStorePricingData = async () => {
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const response = await instance.get(
        '/pricing/all?sort_alphabetically=true&active=true',
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
    } catch (error) {
      console.log('Error fetching Pricing data:', error);
    }
  };

  // const syncOrders = async () => {
  //   setIsLoading(true);
  //   try {
  //     // Retrieve failed, offline edit, and post orders from AsyncStorage
  //     const failedOrders = await AsyncStorage.getItem(`failedOrders_${userId}`);
  //     const parsedFailedOrders = failedOrders ? JSON.parse(failedOrders) : [];

  //     const offlineEditOrders = await AsyncStorage.getItem(
  //       `offlineEditOrders_${userId}`,
  //     );
  //     const parsedOfflineEditOrders = offlineEditOrders
  //       ? JSON.parse(offlineEditOrders)
  //       : [];

  //     const offlinePostOrders = await AsyncStorage.getItem(
  //       `offlineOrders_${userId}`,
  //     );
  //     const parsedOfflinePostOrders = offlinePostOrders
  //       ? JSON.parse(offlinePostOrders)
  //       : [];

  //     // Combine all orders (failed, offline edits, post orders) into one list
  //     const ordersToSync = [
  //       ...parsedFailedOrders,
  //       ...parsedOfflineEditOrders,
  //       ...parsedOfflinePostOrders,
  //     ];

  //     // If there are no orders to sync, show an alert and return
  //     if (ordersToSync.length === 0) {
  //       Alert.alert('Sync Complete', 'No orders to sync.');
  //       return;
  //     }

  //     // Iterate over the orders and process each one
  //     for (const order of ordersToSync) {
  //       try {
  //         const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

  //         let response;

  //         if (order.error) {
  //           // Failed orders - Retry creation (POST)
  //           response = await instance.post('/secondary_order', order, {
  //             headers: {
  //               Authorization: `Bearer ${authToken}`,
  //             },
  //           });
  //         } else if (order.id) {
  //           // Offline edit orders - Use PUT API to update the order
  //           console.log(order.id);
  //           const data = {
  //             id: order.id,
  //             details: order.details,
  //             shop: order.shop,
  //           };
  //           // Perform the PUT request for offline edit orders
  //           response = await instance.put(
  //             `/secondary_order/${order.id}`,
  //             JSON.stringify(data),
  //             {
  //               headers: {
  //                 'Content-Type': 'application/json',
  //                 Accept: 'application/json',
  //                 Authorization: `Bearer ${authToken}`,
  //               },
  //             },
  //           );
  //         } else {
  //           // Post orders - Create order (POST)
  //           response = await instance.post('/secondary_order', order, {
  //             headers: {
  //               Authorization: `Bearer ${authToken}`,
  //             },
  //           });
  //         }

  //         console.log('Order synced successfully:', response.data);
  //       } catch (error) {
  //         console.log('Error syncing order:', error);
  //       }
  //     }

  //     // After successful sync, remove all orders from AsyncStorage
  //     await AsyncStorage.removeItem(`failedOrders_${userId}`);
  //     await AsyncStorage.removeItem(`offlineEditOrders_${userId}`);
  //     await AsyncStorage.removeItem(`offlineOrders_${userId}`);
  //     Alert.alert('Sync Complete', 'All orders have been processed.');
  //   } catch (error) {
  //     console.log('Error during sync:', error);
  //     Alert.alert('Sync Failed', 'An error occurred while syncing orders.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //     if (isInitialDataLoaded) {
  //         const getMondayToSundayWeek = (date) => {
  //             const dateObj = new Date(date);
  //             const dayOfWeek = dateObj.getDay();
  //             const monday = 1;
  //             let daysUntilMonday = dayOfWeek - monday;
  //             if (daysUntilMonday < 0) {
  //                 daysUntilMonday += 7;
  //             }
  //             const startDate = new Date(dateObj);
  //             startDate.setDate(dateObj.getDate() - daysUntilMonday);

  //             const endDate = new Date(startDate);
  //             endDate.setDate(startDate.getDate() + 6);

  //             return { startDate, endDate };
  //         };
  //         const { startDate, endDate } = getMondayToSundayWeek(currentDate);
  //         setWeekDates({ startDate, endDate });
  //     }
  // }, [currentDate, isInitialDataLoaded]);

  // useEffect(() => {
  //     if (weekDates.startDate && weekDates.endDate) {
  //         getNameData();
  //     }
  // }, [weekDates]);

  const formatDate = date => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  return (
    <ImageBackground
      style={styles.image}
      resizeMode="cover"
      source={require('../../assets/Images/HomeBackground.jpeg')}>
      <StatusBar translucent backgroundColor="transparent" />

      <View style={styles.Container}>
        <Menu style={styles.menu}>
          <MenuTrigger style={{width: '100%'}}>
            <View>
              <Ionicons name="menu" color="#fff" size={35} />
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

        <View>
          <Text style={styles.HeadingTxt}>
            {headingData.first_name}
            {headingData.last_name}
          </Text>
          <Text style={styles.HeadingTxt}>
            {headingData.designation ? headingData.designation : 'null'}
          </Text>
          <Text style={[styles.HeadingTxt, {fontWeight: 'normal'}]}>
            {DistributerName ? DistributerName : 'null'}
          </Text>
        </View>
        {checkAttandance ? (
          <View>
            <Text style={[styles.HeadingTxt]}>
              Attendance <Text style={{color: 'green'}}>Marked</Text>
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.HeadingTxt}>
              Attendance <Text style={{color: 'red'}}>Un Marked</Text>
            </Text>
          </View>
        )}

        <View style={styles.MiddleContainer}>
          <View style={styles.MiddleLeft}>
            <Text style={styles.MiddleTXT}>TOTAL VISITS</Text>
            <Text style={styles.MiddleTXT}>{totalVisits}</Text>
            <Text style={styles.MiddleTXT}>ORDERS</Text>
            <Text style={styles.MiddleTXT}>0</Text>
          </View>
          <View style={styles.MiddleRight}>
            <Text style={styles.MiddleTXT}>Working Date</Text>
            <Text style={styles.MiddleTXT}>{formatDate(currentDate)}</Text>
            <View style={{flexDirection: 'row'}}>
              <View style={{width: '50%'}}>
                <Text style={styles.MiddleTXT}>BOOKING</Text>
                <Text style={styles.MiddleTXT}>0.0</Text>
              </View>
              <View style={{width: '50%'}}>
                <Text style={styles.MiddleTXT}>AMOUNT</Text>
                <Text style={styles.MiddleTXT}>RS.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View>
          <View style={styles.BottomContainer}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Order', {orderBokerId: orderBokerId})
              }
              style={styles.ButtonContainer}>
              <Text style={styles.BtnTopTxt}>CREATE NEW ORDER</Text>
              <Text style={styles.HeadingTxt}>Order</Text>
              <MaterialIcons
                style={{marginTop: 10, padding: 10}}
                name="mode-edit"
                color="#3f5cd1"
                size={45}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ButtonContainer}
              onPress={() =>
                navigation.navigate('Shop', {orderBokerId: orderBokerId})
              }>
              <Text style={styles.BtnTopTxt}>MANAGE NEW SHOPS</Text>
              <Text style={styles.HeadingTxt}>Shop</Text>
              <FontAwesome6
                style={{marginTop: 10, padding: 10}}
                name="shop"
                color="#096132"
                size={45}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.BottomContainer}>
            <TouchableOpacity
              style={styles.ButtonContainer}
              onPress={() => {
                navigation.navigate('Invoice', {orderBokerId: orderBokerId});
              }}>
              <Text style={styles.BtnTopTxt}>VIEW ORDER INVOICES</Text>
              <Text style={styles.HeadingTxt}>Invoice</Text>
              <MaterialCommunityIcons
                style={{marginTop: 10, padding: 10}}
                name="file-search"
                color="#48f053"
                size={45}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ButtonContainer}
              onPress={() => navigation.navigate('Failed', {userId})}>
              <Text style={styles.BtnTopTxt}>VIEW FAILED REQUESTS</Text>
              <Text style={styles.HeadingTxt}>Failed</Text>
              <MaterialIcons
                style={{marginTop: 10, padding: 10}}
                name="error-outline"
                color="red"
                size={45}
              />
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#393a3f',
  },
  BtnTopTxt: {
    color: '#fff',
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
    justifyContent: 'flex-end',
  },
  menuOptions: {
    position: 'absolute',
    top: 5,
    right: 10,
    backgroundColor: '#363232',
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
    color: '#fff',
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
    fontSize: 18,
  },
  MiddleRight: {
    width: '60%',
    padding: 5,
  },
});
