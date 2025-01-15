import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert, // Import Alert for user notifications
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import {Picker} from '@react-native-picker/picker';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo
import Loader from '../../Components/Loaders/Loader';
import AddNewShop from '../ShopScreen/AddNewShop';

// const STORAGE_KEYS = {
//   DATES: 'ALL_DATES',
//   ROUTES: 'ALL_ROUTES',
//   SHOPS: 'ALL_SHOPS',
// };
const getDayName = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {weekday: 'long'});
};

const Order = ({route, navigation}) => {
  const [weekDates, setWeekDates] = useState({startDate: null, endDate: null});
  const [isLoading, setIsLoading] = useState(false);
  const [allDates, setAllDates] = useState([]);
  const [allroute, setAllRoute] = useState([]);
  const [AllShops, setAllShops] = useState([]);
  const [territorialData, setTerritorialData] = useState(null);
  const [pickerData, selectedPickerDate] = useState(null); // selected date string
  const [shops, setshops] = useState(null); // array of { date, route }
  const {orderBokerId} = route.params;
  const [userId, setUserId] = useState(null); // Initialize userId state
  // Network status state
  const [isConnected, setIsConnected] = useState(true);
  const [teerr, setteerr] = useState(null);

  // useEffect(() => {
  //   const fetchUserId = async () => {
  //     const storedUserId = await AsyncStorage.getItem('userId');
  //     console.log(storedUserId, 'userId');
  //     setUserId(storedUserId); // Store the userId to use in AsyncStorage keys
  //   };

  //   fetchUserId();
  // }, []);
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
        console.log('Error', error);
      }
    }
  };
  const fetchOfflineRouteData = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const territorialDataKey = `territorialData_${userId}`;
      const territorialDataJson = await AsyncStorage.getItem(
        territorialDataKey,
      );
      if (territorialDataJson !== null) {
        const territorialData = JSON.parse(territorialDataJson);
        console.log('Offline Territorial Data:', territorialData);
        return territorialData;
      } else {
        console.log('No offline data found for key:', territorialDataKey);
      }
    } catch (error) {
      console.error('Error fetching offline territorial data:', error);
    }
    return null;
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

  // Function to save all data at once with timestamps
  // const saveAllDataToStorage = async (dates, routes, shops) => {
  //   const userId = await AsyncStorage.getItem('userId');
  //   try {
  //     const timestamp = new Date().toISOString();
  //     const dataToStore = [
  //       [STORAGE_KEYS.DATES + userId, JSON.stringify({data: dates, timestamp})],
  //       [
  //         STORAGE_KEYS.ROUTES + userId,
  //         JSON.stringify({data: routes, timestamp}),
  //       ],
  //       [STORAGE_KEYS.SHOPS + userId, JSON.stringify({data: shops, timestamp})],
  //     ];
  //     await AsyncStorage.multiSet(dataToStore);
  //     console.log('All data saved to AsyncStorage successfully.');
  //   } catch (error) {
  //     console.log('Error saving all data to AsyncStorage:', error);
  //   }
  // };

  // Function to fetch data from API
  const getTerritorial = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    try {
      const response = await instance.get(
        `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const rawTerritorialData = response.data;
      // console.log(JSON.stringify(response.data), '-*-*-*-');

      // Populate allDates
      const FilterDates = rawTerritorialData.pjp_shops.map(val => val.pjp_date);
      setAllDates(FilterDates);
      console.log(FilterDates, 'FilterDates');

      // Populate allroute with date information
      const FilterRoute = [];
      rawTerritorialData.pjp_shops.forEach(val => {
        if (val.pjp_shops.route_shops.length > 0) {
          val.pjp_shops.route_shops.forEach(routeData => {
            FilterRoute.push({date: val.pjp_date, route: routeData.route});
          });
        }
      });
      setAllRoute(FilterRoute);

      // Populate AllShops with date and route information
      const FilterShops = [];
      rawTerritorialData.pjp_shops.forEach(val => {
        if (val.pjp_shops.route_shops.length > 0) {
          val.pjp_shops.route_shops.forEach(routeData => {
            routeData.shops.forEach(shopItem => {
              FilterShops.push({
                date: val.pjp_date,
                route: routeData.route,
                shop: shopItem,
              });
            });
          });
        }
      });
      setAllShops(FilterShops);

      setTerritorialData(rawTerritorialData);

      // Save all data to AsyncStorage at once with timestamps
      // await saveAllDataToStorage(FilterDates, FilterRoute, FilterShops);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        TokenRenew();
      } else {
        console.log('Error', error);
      }
      console.log('Error fetching territorial data:', error);
      Alert.alert('Error', 'Failed to fetch data from the server.', [
        {
          text: 'ok',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);

      if (state.isConnected) {
        console.log('Device is online. Fetching data from API.');
        await getTerritorial();
      } else {
        console.log('Device is offline. Loading data from AsyncStorage.');
        const offlineData = await fetchOfflineRouteData(); // Use the offline function here
        if (offlineData) {
          setTerritorialData(offlineData);
          // Process your data as required, e.g., setting allDates, allRoutes, etc.
          const FilterDates = offlineData.pjp_shops.map(val => val.pjp_date);
          setAllDates(FilterDates);

          const FilterRoute = [];
          offlineData.pjp_shops.forEach(val => {
            if (val.pjp_shops.route_shops.length > 0) {
              val.pjp_shops.route_shops.forEach(routeData => {
                FilterRoute.push({date: val.pjp_date, route: routeData.route});
              });
            }
          });
          setAllRoute(FilterRoute);

          const FilterShops = [];
          offlineData.pjp_shops.forEach(val => {
            if (val.pjp_shops.route_shops.length > 0) {
              val.pjp_shops.route_shops.forEach(routeData => {
                routeData.shops.forEach(shopItem => {
                  FilterShops.push({
                    date: val.pjp_date,
                    route: routeData.route,
                    shop: shopItem,
                  });
                });
              });
            }
          });
          setAllShops(FilterShops);
        } else {
          Alert.alert(
            'No offline data available',
            'Please connect to the internet to fetch fresh data.',
          );
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      setIsConnected(state.isConnected);
      console.log(
        'Network connectivity changed:',
        state.isConnected ? 'Online' : 'Offline',
      );

      // Optional: If the device reconnects, fetch fresh data
      if (!wasConnected && state.isConnected) {
        console.log('Device reconnected. Fetching fresh data.');
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  useEffect(() => {
    if (weekDates.startDate && weekDates.endDate && orderBokerId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, orderBokerId]);

  const handleDateChange = selectedDate => {
    console.log(`${selectedDate} selectedDate`);
    selectedPickerDate(selectedDate); // Set selected date string
    if (selectedDate) {
      // Filter routes for the selected date
      const filteredRoutes = allroute.filter(
        routeItem => routeItem.date === selectedDate,
      );
      setshops(filteredRoutes); // setshops to array of { date, route }
    } else {
      setshops(null); // Reset if no date selected
    }
  };
  useEffect(() => {
    // Get today's date in the same format as your dates array
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Check if today's date exists in the `allDates` array
    if (allDates.includes(today)) {
      selectedPickerDate(today);
      handleDateChange(today);
    }
  }, [allDates]);

  const onValueChange = itemValue => {
    console.log(itemValue, 'itemValue');
    selectedPickerDate(itemValue);
    handleDateChange(itemValue); // Pass the selected value to your handler
  };

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, backgroundColor: '#fff', paddingHorizontal: 10}}>
        <View style={[styles.pickerContainer, styles.borderPickBottom]}>
          <Picker
            selectedValue={pickerData}
            onValueChange={onValueChange}
            style={styles.picker}>
            <Picker.Item
              label={'Select Date'}
              style={{color: '#000'}}
              value={null}
            />
            {allDates.map((date, index) => (
              <Picker.Item
                key={index}
                label={`${getDayName(date)}, ${date}`} // Display day name + date
                style={{color: 'grey'}}
                value={date} // Keep value as the original date
              />
            ))}
          </Picker>
        </View>

        {shops && shops.length > 0 ? (
          <FlatList
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={
              Platform.OS !== 'android' &&
              (({highlighted}) => (
                <View
                  style={[styles.separator, highlighted && {marginLeft: 0}]}
                />
              ))
            }
            data={shops}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity
                style={styles.routeContainer}
                key={index}
                onPress={() => {
                  const selectedRoute = item.route;
                  const selectedDate = pickerData;
                  const filteredShops = AllShops.filter(
                    shopItem =>
                      shopItem.date === selectedDate &&
                      shopItem.route.name === selectedRoute.name,
                  ).map(shopItem => shopItem.shop);
                  console.log(`${selectedDate} selectedDate`);
                  navigation.navigate('AllShops', {
                    Shops: filteredShops,
                    RouteName: selectedRoute,
                    RouteDate: selectedDate,
                  });
                }}>
                <View style={styles.routeInnerContainer}>
                  <Text style={styles.routeName}>{item.route.name}</Text>
                  <Text style={{color: '#000'}}>
                    Shop Count:{' '}
                    {
                      AllShops.filter(
                        shopItem =>
                          shopItem.date === pickerData &&
                          shopItem.route.name === item.route.name,
                      ).length
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : // pickerData && (
        //   <Text style={styles.noDataText}>
        //     No routes available for this date
        //   </Text>
        // )
        null}
      </View>
      {isLoading && <Loader />}
    </View>
  );
};

export default Order;

const styles = StyleSheet.create({
  pickerContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#cccccc',
  },
  borderPickBottom: {
    borderBottomColor: 'black',
    borderBottomWidth: 1,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  routeContainer: {
    padding: '2%',
    backgroundColor: '#f8f8f8',
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  routeName: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#CED0CE',
    marginLeft: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  routeInnerContainer: {
    flexDirection: 'column',
  },
});
