import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
  useRef,
  memo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  PermissionsAndroid,
  ToastAndroid,
} from 'react-native';
import { SearchBar, Header, Button, Icon } from 'react-native-elements';
// import { TextInput } from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { RemoveAllCart } from '../../Components/redux/action';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import CheckBox from '@react-native-community/checkbox';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import GetLocation from 'react-native-get-location';
import Loader from '../../Components/Loaders/Loader';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import NetInfo from '@react-native-community/netinfo';
import { Remove_All_Cart } from '../../Components/redux/constants';
import { AddToCart } from '../../Components/redux/action';

// let StockAlreadyExist = [];
// const Add_Left_Stock = payload => {
//   if (payload) {
//     // Find the index of the existing item in the state
//     const existingIndex = StockAlreadyExist.findIndex(
//       item => item.pricing_id === payload.pricing_id,
//     );

//     // If the item has both 'carton_ordered' and 'box_ordered' as 0, remove it from the state
//     if (payload.carton_ordered === 0 && payload.box_ordered === 0) {
//       StockAlreadyExist = StockAlreadyExist.filter(
//         item => item.pricing_id !== payload.pricing_id,
//       );
//       return StockAlreadyExist;
//     }

//     if (existingIndex !== -1) {
//       // If item exists, replace it with the new payload
//       StockAlreadyExist[existingIndex] = payload;
//     } else {
//       // If item doesn't exist, add the new item to the state
//       StockAlreadyExist = [...StockAlreadyExist, payload];
//     }
//   }
//   console.log(StockAlreadyExist, 'StockAlreadyExist in');

//   return StockAlreadyExist;
// };

// const Remove_Left_Stock = () => {
//   StockAlreadyExist = [];
// };

// const removeById = id => {
//   const updatedArray = StockAlreadyExist.filter(
//     stock => stock.itemss.id !== id,
//   );
//   StockAlreadyExist = updatedArray;
// };

const AddSingleProduct = memo(
  ({ boxInCtn, itemss, del, StockAlreadyExist, Add_Left_Stock }) => {
    const [Pack, setPack] = useState(0);
    const [carton, setCarton] = useState(0);
    const [addOn, setAddOn] = useState('pack');

    useEffect(() => {
      console.log('StockAlreadyExist:', JSON.stringify(StockAlreadyExist));
      const existingProduct = StockAlreadyExist.find(
        sku => sku.itemss?.pricing.id === itemss.pricing.id,
      );
      if (existingProduct) {
        console.log('Existing Product:', existingProduct);
        setPack(existingProduct.box_ordered || 0);
        setCarton(existingProduct.carton_ordered || 0);
      } else {
        setPack(0);
        setCarton(0);
      }
    }, [StockAlreadyExist, itemss.pricing.id]);

    const AddProduct = useCallback(() => {
      let item = {
        carton_ordered: carton,
        box_ordered: Pack,
        pricing_id: itemss.pricing.id,
        itemss: itemss,
        pack_in_box: boxInCtn,
      };
      console.log('Adding Product:', item);
      Add_Left_Stock(item);
    }, [Pack, carton, itemss, Add_Left_Stock, boxInCtn]);

    const handleDelete = useCallback(
      id => {
        console.log('Deleting Product with ID:', id);
        del(id);
        removeById(id);
      },
      [del],
    );

    const handlePackChange = useCallback(txt => {
      let num = parseInt(txt);
      if (isNaN(num)) {
        setPack(0);
      } else if (num > 9999) {
        setPack(9999);
      } else {
        setPack(num);
      }
    }, []);

    const handleCartonChange = useCallback(txt => {
      let num = parseInt(txt);
      if (isNaN(num)) {
        setCarton(0);
      } else if (num > 9999) {
        setCarton(9999);
      } else {
        setCarton(num);
      }
    }, []);

    const AddSub = useCallback(
      val => {
        if (val === 'Add') {
          if (addOn === 'pack') {
            setPack(prevPack => {
              if (prevPack >= boxInCtn) {
                setCarton(prevCarton => prevCarton + 1);
                return 0;
              } else {
                return prevPack + 1;
              }
            });
          } else if (addOn === 'carton') {
            setCarton(prevCarton => prevCarton + 1);
          }
        } else if (val === 'Sub') {
          if (addOn === 'pack') {
            setPack(prevPack => Math.max(prevPack - 1, 0)); // Ensure non-negative
          } else if (addOn === 'carton') {
            setCarton(prevCarton => Math.max(prevCarton - 1, 0)); // Ensure non-negative
          }
        }
      },
      [addOn, boxInCtn],
    );

    useEffect(() => {
      if (Pack >= boxInCtn) {
        let val = Pack;
        let ctn = carton;
        while (val >= boxInCtn) {
          val -= boxInCtn;
          ctn += 1;
        }
        setCarton(ctn);
        setPack(val);
      }
    }, [Pack, boxInCtn]);

    useEffect(() => {
      AddProduct();
    }, [Pack, carton, AddProduct]);

    return (
      <View
        style={{
          marginTop: '2%',
          borderBottomColor: '#000',
          borderBottomWidth: 1,
        }}>
        <Text style={{ color: '#000', fontSize: 13 }}>
          {`${itemss.pricing.product.name} ${itemss.pricing.sku.name} ${itemss.pricing.variant.name}`}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <AntDesign
            name="delete"
            size={25}
            color={'red'}
            onPress={() => handleDelete(itemss.pricing.id)}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ padding: '1%' }}
              onPress={() => AddSub('Sub')}>
              <AntDesign name="minuscircle" size={24} color={'#2196f3'} />
            </TouchableOpacity>
            <View
              style={{
                padding: '1%',
                borderBottomColor: '#c0c0c0',
                borderBottomWidth: 1,
              }}>
              <TextInput
                value={carton.toString()}
                onChangeText={handleCartonChange}
                placeholder="0"
                placeholderTextColor={'#000'}
                keyboardType="numeric"
                onFocus={() => setAddOn('carton')}
                style={{ color: '#000' }}
              />
            </View>
            <View style={{ padding: '1%' }}>
              <Text>-</Text>
            </View>
            <View
              style={{
                padding: '1%',
                borderBottomColor: '#c0c0c0',
                borderBottomWidth: 1,
              }}>
              <TextInput
                value={Pack.toString()}
                onChangeText={handlePackChange}
                placeholder="0"
                placeholderTextColor={'#000'}
                keyboardType="numeric"
                onFocus={() => setAddOn('pack')}
                style={{ color: '#000' }}
              />
            </View>
            <TouchableOpacity
              style={{ padding: '1%' }}
              onPress={() => AddSub('Add')}>
              <AntDesign name="pluscircle" size={24} color={'#2196f3'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

// import AntDesign from 'react-native-vector-icons/AntDesign'
const AllShops = ({ route }) => {
  const [search, setSearch] = useState('');
  const [openclosesearch, setopenclosesearch] = useState(false);
  const [stores, setStores] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filteredStores, setFilteredStores] = useState([]);
  const [markUnproductiveButton, setMarkUnproductiveButton] = useState(false);
  const [Selectedroute, setSelectedRoute] = useState('');
  const [routeDate, setRouteDate] = useState('');
  const [toggleBtn, settoggleBtn] = useState('');
  const [view, setView] = useState('Shop Closed');
  const [shopcloseReason, setshopCloseReason] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [SKUview, setSKUView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSKUs, setSelectedSKUs] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [orderBokerId, setOrderBokerId] = useState([]);
  const [existingProduct, setExistingProduct] = useState([]);
  const [customerRefused, setCustomerRefused] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [singleId, setSingleId] = useState(null);
  const [confirmBtn, setconfirmBtn] = useState(false);
  const [StockAlreadyExist, setStockAlreadyExist] = useState([]);
  const [rerender, setRerender] = useState(0);
  const [gst, setGst] = useState(0);
  const [totalprice, setTotalprice] = useState(0);
  const [GrossAmount, setGrossAmount] = useState(0);
  const [MModalVisible, setMModalVisible] = useState(false);
  const [sselectedShop, setSSelectedShop] = useState(null);
  const [alllProducts, setAlllProducts] = useState([]);
  const [sending, setsending] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [unproductiveShops, setUnproductiveShops] = useState([]);
  const [matchingOrderID, setMatchingOrderID] = useState();
  const [unOfflineShops, setunOfflineShops] = useState();
  const [isConnected, setIsConnected] = useState(true);
  const [weekDates, setWeekDates] = useState({ startDate: null, endDate: null });
  const [OrderBokerId, setorderBokerId] = useState();
  const [cartITT, setCariTT] = useState();
  const [onlineOrder, setOnlineOrder] = useState();
  const [internetapi, setinternetapi] = useState();
  const [navigateToInvoice, setNavigateToInvoice] = useState(false);
  const [order, setOrder] = useState(null);
  const gstRef = useRef(0);
  const navigation = useNavigation()
  // console.log(selectedProduct, 'selectedproduct');
  // console.log(existingProduct, 'exsistikj0');
  // console.log(selectedSKUs, 'sesku');

  const cartItemss = useSelector(state => state.reducer);


  const Add_Left_Stock = useCallback(payload => {
    if (!payload) return;
    console.log(payload, 'payload of add legt stock');

    setStockAlreadyExist(prevStock => {
      const existingIndex = prevStock.findIndex(
        item => item.pricing_id === payload.pricing_id,
      );

      if (payload.carton_ordered === 0 && payload.box_ordered === 0) {
        return prevStock.filter(item => item.pricing_id !== payload.pricing_id);
      }

      if (existingIndex !== -1) {
        return prevStock.map((item, index) =>
          index === existingIndex ? payload : item,
        );
      } else {
        return [...prevStock, payload];
      }
    });
    setRerender(prev => prev + 1); // Force rerender after state update
  }, []);

  const Remove_Left_Stock = useCallback(() => {
    setStockAlreadyExist([]);
    setRerender(prev => prev + 1);
  }, []);

  const removeById = useCallback(id => {
    setStockAlreadyExist(prevStock =>
      prevStock.filter(stock => stock.itemss.pricing.id !== id),
    );
    setRerender(prev => prev + 1);
  }, []);
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
            },
          },
        ]);
      } else {
        console.log('Error', error);
      }
    }
  };

  const getorderBookerId = async () => {
    const id = await AsyncStorage.getItem('orderbooker');
    setOrderBokerId(parseInt(id));
  };

  const handlePress = newView => {
    setView(newView);
  };

  const openSKUModal = () => {
    setSKUView(true);
  };

  const closeSKUModal = () => {
    setSKUView(false);
  };

  const dispatch = useDispatch();

  const updateSearch = search => {
    setSearch(search);
    if (search) {
      const filteredData = stores.filter(store =>
        store.name.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredStores(filteredData);
    } else {
      setFilteredStores(stores);
    }
  };

  const togglesearch = () => {
    setopenclosesearch(!openclosesearch);
  };

  const handleVisit = store => {
    setSelectedStore(store);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setMarkUnproductiveButton(false);
    setSelectedStore(null);
    setView('Shop Closed');
    setSelectedSKUs([]);
    setSelectedProduct([]);
    setSingleId(null);
    setCustomerRefused('');
    setshopCloseReason(null);
    Remove_Left_Stock();
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

    return { startDate, endDate };
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
      const { startDate, endDate } = getMondayToSundayWeek(currentDate);
      setWeekDates({
        startDate: formatDateToYYYYMMDD(startDate),
        endDate: formatDateToYYYYMMDD(endDate),
      });
    }
  }, []);

  const getTerritorial = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const { Shops, RouteName, RouteDate, orderBokerId } = route.params;
    const orderbookerID = await AsyncStorage.getItem('orderBokerId');
    try {
      // console.log(
      //   `/radar_flutter/territorial/${orderbookerID}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
      // );
      const response = await instance.get(
        `/radar_flutter/territorial/${orderbookerID}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const rawTerritorialData = response.data;
      // console.log(JSON.stringify(rawTerritorialData))
      response.data.pjp_shops.forEach(it => {
        if (it?.pjp_date === RouteDate) {
          it?.pjp_shops?.route_shops?.forEach(item => {
            if (item.route.name === RouteName.name) {
              console.log(item.route.name, 'route name')
              if (item?.shops?.length > 0) {
                setSelectedRoute(item?.route);
                setStores(item?.shops);
                setFilteredStores(item?.shops);
                console.log(Selectedroute, 'route')
                console.log('Data successfully set');
              } else {
                console.log('No shops available');
              }
            }
          });
        }
      });

    } catch (error) {
      console.log('Error fetching territorial data:', error);
      Alert.alert('Error', 'Failed to fetch data from the server.', [
        {
          text: 'ok',
          onPress: () => navigation.goBack(),
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
          offlineData.pjp_shops.forEach(it => {
            if (it?.pjp_date === RouteDate) {
              it?.pjp_shops?.route_shops?.forEach(item => {
                if (item.route.name === RouteName.name) {
                  console.log(item.route.name, 'route name')
                  if (item?.shops?.length > 0) {
                    setSelectedRoute(item?.route);
                    setStores(item?.shops);
                    setFilteredStores(item?.shops);
                    console.log(Selectedroute, 'route')
                    console.log('Data successfully set');
                  } else {
                    console.log('No shops available');
                  }
                }
              });
            }
          });
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

  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener(state => {
  //     const wasConnected = isConnected;
  //     setIsConnected(state.isConnected);
  //     console.log(
  //       'Network connectivity changed:',
  //       state.isConnected ? 'Online' : 'Offline',
  //     );

  //     // Optional: If the device reconnects, fetch fresh data
  //     if (!wasConnected && state.isConnected) {
  //       console.log('Device reconnected. Fetching fresh data.');
  //       loadData();
  //     }
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
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
    }, [isConnected]) // Keep the dependency on isConnected
  );
  const { Shops, RouteName, RouteDate } = route.params;

  // useEffect(() => {
  //   // console.log('Shops:', Shops);
  //   console.log('RouteName:', RouteName);
  //   // if (!Shops || !RouteName) {
  //   if (weekDates.startDate && weekDates.endDate && orderBokerId) {
  //     loadData();
  //     // }
  //   }
  // }, [RouteDate, weekDates, orderBokerId]);

  useFocusEffect(
    useCallback(() => {
      console.log('RouteName:', RouteName);

      if (weekDates.startDate && weekDates.endDate && orderBokerId) {
        loadData();
      }

    }, [RouteDate, weekDates, orderBokerId])
  );

  useEffect(() => {
    const { Shops, RouteName, RouteDate, orderBokerId } = route.params;
    // console.log(Shops);
    // console.log(RouteName, 'RouteName in aaaallshops');
    // console.log(RouteDate);
    // setStores(Shops);
    // setFilteredStores(Shops);
    // setSelectedRoute(RouteName);
    setRouteDate(RouteDate);
    // setorderBokerId(orderBokerId);
  }, [route]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(RemoveAllCart());
    }, [dispatch]),
  );

  useEffect(() => {
    getorderBookerId();
  }, []);

  // const AddSingleProduct = ({boxInCtn, itemss, Val, del}) => {
  //   console.log('Rendering AddSingleProduct component');
  //   console.log(boxInCtn, 'boxinctn');
  //   console.log(itemss, 'itemss');
  //   console.log(del, 'del');
  //   const [Pack, setPack] = useState(0);
  //   const [carton, setCarton] = useState(0);
  //   const [addOn, setAddOn] = useState('pack');

  //   useEffect(() => {
  //     const existingProduct = StockAlreadyExist.find(
  //       sku => sku.itemss?.id === itemss.id,
  //     ); // Optional chaining
  //     if (existingProduct) {
  //       setPack(existingProduct.box_ordered || 0);
  //       setCarton(existingProduct.carton_ordered || 0);
  //     } else {
  //       setPack(0);
  //       setCarton(0);
  //     }
  //   }, [StockAlreadyExist, itemss.id]);
  //   const AddProduct = useCallback(() => {
  //     // useCallback here
  //     let item = {
  //       carton_ordered: carton,
  //       box_ordered: Pack,
  //       pricing_id: itemss.id,
  //       itemss: itemss,
  //       pack_in_box: boxInCtn,
  //     };
  //     Add_Left_Stock(item);
  //   }, [Pack, carton, itemss, Add_Left_Stock, boxInCtn]);

  //   const handleDelete = id => {
  //     del(id);
  //     removeById(id);
  //   };

  //   const handlePackChange = txt => {
  //     let num = parseInt(txt);
  //     if (isNaN(num)) {
  //       setPack(0);
  //     } else if (num > 9999) {
  //       setPack(9999);
  //     } else {
  //       setPack(num);
  //     }
  //   };

  //   const handleCartonChange = txt => {
  //     let num = parseInt(txt);
  //     if (isNaN(num)) {
  //       setCarton(0);
  //     } else if (num > 9999) {
  //       setCarton(9999);
  //     } else {
  //       setCarton(num);
  //     }
  //   };

  //   const AddSub = val => {
  //     if (val === 'Add') {
  //       if (addOn === 'pack') {
  //         setPack(prevPack => {
  //           if (prevPack >= boxInCtn) {
  //             setCarton(prevCarton => prevCarton + 1);
  //             return 0;
  //           } else {
  //             return prevPack + 1;
  //           }
  //         });
  //       } else if (addOn === 'carton') {
  //         setCarton(prevCarton => prevCarton + 1);
  //       }
  //     } else if (val === 'Sub') {
  //       if (addOn === 'pack') {
  //         setPack(prevPack => Math.max(prevPack - 1, 0)); // Ensure non-negative
  //       } else if (addOn === 'carton') {
  //         setCarton(prevCarton => Math.max(prevCarton - 1, 0)); // Ensure non-negative
  //       }
  //     }
  //   };

  //   useEffect(() => {
  //     if (Pack >= boxInCtn) {
  //       let val = Pack;
  //       let ctn = carton;
  //       while (val >= boxInCtn) {
  //         val -= boxInCtn;
  //         ctn += 1;
  //       }
  //       setCarton(ctn);
  //       setPack(val);
  //     }
  //   }, [Pack]);

  //   useEffect(() => {
  //     AddProduct();
  //   }, [Pack, carton]);

  //   return (
  //     <View
  //       style={{
  //         marginTop: '2%',
  //         borderBottomColor: '#000',
  //         borderBottomWidth: 1,
  //       }}>
  //       <Text style={{color: '#000', fontSize: 13}}>
  //         {`${itemss.product.name} ${itemss.sku.name} ${itemss.variant.name}`}
  //       </Text>
  //       <View
  //         style={{
  //           flexDirection: 'row',
  //           alignItems: 'center',
  //           justifyContent: 'space-between',
  //         }}>
  //         <AntDesign
  //           name="delete"
  //           size={25}
  //           color={'red'}
  //           onPress={() => handleDelete(itemss.id)}
  //         />
  //         <View style={{flexDirection: 'row', alignItems: 'center'}}>
  //           <TouchableOpacity
  //             style={{padding: '1%'}}
  //             onPress={() => AddSub('Sub')}>
  //             <AntDesign name="minuscircle" size={24} color={'#2196f3'} />
  //           </TouchableOpacity>
  //           <View
  //             style={{
  //               padding: '1%',
  //               borderBottomColor: '#c0c0c0',
  //               borderBottomWidth: 1,
  //             }}>
  //             <TextInput
  //               value={carton.toString()}
  //               onChangeText={handleCartonChange}
  //               placeholder="0"
  //               placeholderTextColor={'#000'}
  //               keyboardType="numeric"
  //               onFocus={() => setAddOn('carton')}
  //               style={{color: '#000'}}
  //             />
  //           </View>
  //           <View style={{padding: '1%'}}>
  //             <Text>-</Text>
  //           </View>
  //           <View
  //             style={{
  //               padding: '1%',
  //               borderBottomColor: '#c0c0c0',
  //               borderBottomWidth: 1,
  //             }}>
  //             <TextInput
  //               value={Pack.toString()}
  //               onChangeText={handlePackChange}
  //               placeholder="0"
  //               placeholderTextColor={'#000'}
  //               keyboardType="numeric"
  //               onFocus={() => setAddOn('pack')}
  //               style={{color: '#000'}}
  //             />
  //           </View>
  //           <TouchableOpacity
  //             style={{padding: '1%'}}
  //             onPress={() => AddSub('Add')}>
  //             <AntDesign name="pluscircle" size={24} color={'#2196f3'} />
  //           </TouchableOpacity>
  //         </View>
  //       </View>
  //     </View>
  //   );
  // };

  const FetchProduct = async () => {
    const userId = await AsyncStorage.getItem('userId');
    const state = await NetInfo.fetch();
    try {
      if (!state.isConnected) {
        const ProductDatakey = `ProductData_${userId}`;
        const ProductDataJSON = await AsyncStorage.getItem(ProductDatakey);
        const ProductData = JSON.parse(ProductDataJSON);
        let products = [];
        ProductData?.forEach(it => {
          if (it.pricing.active == true) {
            products.push(it);
          }
        });
        setAllProducts(products);
        setFilteredProducts(products);
      }
    } catch (error) {
      console.error('Error getting data of all products', error);
    }
  };

  useEffect(() => {
    FetchProduct();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen Focused - Resetting States');

      // Reset states to avoid using old data
      setTotalprice(0);
      setGrossAmount(0);
      setGst(0);
      gstRef.current = 0;
    }, []),
  );

  const offline = async item => {
    const userId = await AsyncStorage.getItem('userId');
    const state = await NetInfo.fetch();

    if (state.isConnected) {
      handleVisit(item);
      setSingleId(item.id);
      handleVisitButtonClick(item.id);
    } else {
      const offlinePostOrders = await AsyncStorage.getItem(
        `localofflinedata_${userId}`,
      );

      if (offlinePostOrders) {
        const parsedOfflinePostOrders = JSON.parse(offlinePostOrders) || [];

        if (
          Array.isArray(parsedOfflinePostOrders) &&
          parsedOfflinePostOrders.length > 0
        ) {
          // Find the specific order for this shop
          const shopOrder = parsedOfflinePostOrders.find(
            order => order.shop && order.shop.id === item.id
          );

          if (shopOrder) {
            // This shop has an offline order, process it
            const cartItems = shopOrder.cartItems;
            const details = shopOrder.details || [];
            let itemss = {};

            if (cartItems) {
              cartItems.forEach(cartItem => {
                itemss = cartItem.itemss;
              });
            }

            console.log('Shop order found:', shopOrder);
            console.log('itemss:', itemss);

            details.forEach(val => {
              console.log('Processing detail:', val);

              const product = allProducts.find(
                prod => prod.pricing.id === val.pricing_id || prod.pricing_id === val.pricing_id
              );

              if (product) {
                console.log('Product found:', product);
                const uniqueItemss = JSON.parse(JSON.stringify(product));

                const cartItem = {
                  carton_ordered: val.carton_ordered,
                  box_ordered: val.box_ordered,
                  pricing_id: val.pricing_id,
                  itemss: uniqueItemss,
                  pack_in_box: val.box_ordered,
                };

                console.log('Dispatching cart item:', cartItem);
                dispatch(AddToCart(cartItem));
              } else {
                console.warn(`Product not found for pricing_id: ${val.pricing_id}`);
              }
            });

            // Calculate values for this specific shop order
            let Product_Count = 0;
            let GrossAmount = 0;
            let gst = 0;

            cartItems.forEach(item => {
              const { carton_ordered, box_ordered, itemss } = item;
              const { trade_offer, pricing } = itemss;
              const { trade_price, box_in_carton, pricing_gst, gst_base, retail_price } = pricing;

              let quantity = 0;
              if (carton_ordered > 0) {
                quantity = carton_ordered * box_in_carton + box_ordered;
              } else {
                quantity = box_ordered;
              }

              const itemGrossAmount = trade_price * quantity;
              GrossAmount += itemGrossAmount;

              const itemTODiscount = (trade_offer / 100) * itemGrossAmount;
              Product_Count += itemGrossAmount - itemTODiscount;

              if (gst_base === 'Retail Price') {
                const itemGST = retail_price * quantity * (pricing_gst / 100);
                gst += itemGST;
              }
            });

            setTotalprice(Product_Count);
            setGrossAmount(GrossAmount);
            setGst(gst);
            gstRef.current = gst;

            console.log('Current GST after setting:', gstRef.current);
            navigation.navigate('AllShopsInvoice', {
              cartItems: shopOrder,
              Gst: gstRef.current,
              grossAmount: GrossAmount,
            });
          } else {
            // No offline order for this shop
            handleVisit(item);
            setSingleId(item.id);
            handleVisitButtonClick(item.id);
          }
        } else {
          handleVisit(item);
          setSingleId(item.id);
          handleVisitButtonClick(item.id);
        }
      } else {
        handleVisit(item);
        setSingleId(item.id);
        handleVisitButtonClick(item.id);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchOfflineOrders = async () => {
        const userId = await AsyncStorage.getItem('userId');
        const orders = await AsyncStorage.getItem(`localofflinedata_${userId}`);
        setOfflineOrders(JSON.parse(orders) || []);
      };

      const unsubscribeNetInfo = NetInfo.addEventListener(state => {
        setIsOffline(!state.isConnected);
      });

      fetchOfflineOrders();

      return () => {
        unsubscribeNetInfo(); // Unsubscribe NetInfo when component unmounts
      };
    }, []), // Empty dependency array ensures this only runs when the screen is focused
  );


  const getInternetAPi = async () => {
    const fkEmployee = await AsyncStorage.getItem('fk_employee');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const state = await NetInfo.fetch();
    const userId = await AsyncStorage.getItem('userId');
    const getFormattedDate = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`; // Return formatted date
    };
    try {
      if (state.isConnected) {

        const response = await instance.get(`/secondary_order/all?employee_id=${fkEmployee}&include_shop=true&include_detail=true&order_date=${getFormattedDate()}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        console.log(JSON.stringify(response.data), 'response . data ')
        setinternetapi(response.data)
      } else {
        const localonlineorder = await AsyncStorage.getItem(`LocalAPI_${userId}`)
        const parsedlocalonline = localonlineorder ? JSON.parse(localonlineorder) : [];
        setinternetapi(parsedlocalonline)
      }


    } catch (error) {
      console.log('Error in get internet api line 1023', error)
    }
  }
  // useEffect(() => {
  //   getInternetAPi()
  // }, [])
  useFocusEffect(
    useCallback(() => {
      getInternetAPi()
    }, [])
  )
  useFocusEffect(
    useCallback(() => {
      console.log('Screen Focused - Resetting States');
      setOrder(null);
      setTotalprice(0);
      setGrossAmount(0);
      setGst(0);
      gstRef.current = 0;
      dispatch(RemoveAllCart());
    }, [])
  );

  const onlineordercheck = async (itemm) => {
    try {
      const foundOrder = internetapi.find(order => order.fk_shop === itemm.id);

      if (!foundOrder) {
        console.log('No matching order found');
        return;
      }

      const orderDetails = foundOrder.details || [];

      for (const item of orderDetails) {
        const product = allProducts.find(prod => prod.pricing.id === item.pricing_id);

        if (!product) {
          console.log('Product not found for pricing_id:', item.pricing_id);
          continue;
        }

        const cartItem = {
          carton_ordered: item.carton_ordered,
          box_ordered: item.box_ordered,
          pricing_id: item.pricing_id,
          itemss: JSON.parse(JSON.stringify(product)),
          pack_in_box: item.box_ordered,
        };

        dispatch(AddToCart(cartItem));
      }

      let Product_Count = 0;
      let GrossAmount = 0;
      let gst = 0;

      orderDetails.forEach(val => {
        const product = allProducts.find(prod => prod.pricing.id === val.pricing_id);

        if (product) {
          const { trade_offer, pricing } = product;
          const { trade_price, box_in_carton, pricing_gst, gst_base, retail_price } = pricing;

          const quantity = val.carton_ordered > 0 ? val.carton_ordered * box_in_carton + val.box_ordered : val.box_ordered;
          const itemGrossAmount = trade_price * quantity;
          GrossAmount += itemGrossAmount;

          const itemTODiscount = (trade_offer / 100) * itemGrossAmount;
          Product_Count += itemGrossAmount - itemTODiscount;

          if (gst_base === 'Retail Price') {
            const itemGST = retail_price * quantity * (pricing_gst / 100);
            gst += itemGST;
          }
        }
      });

      setTotalprice(Product_Count);
      setGrossAmount(GrossAmount);
      setGst(gst);
      gstRef.current = gst;

      navigation.navigate('ViewInvoice', {
        cartItems: foundOrder,
        Gst: gstRef.current,
        grossAmount: GrossAmount,
        RouteDate: RouteDate
      });
    } catch (error) {
      console.log(error, 'error in online order check');
    }
  };

  // React to changes in cartItems
  useEffect(() => {
    if (order && cartItemss.length > 0) {
      console.log('cartItems found, recalculating values');

      let Product_Count = 0;
      let GrossAmount = 0;
      let gst = 0;

      for (const item of cartItemss) {
        const { carton_ordered, box_ordered, itemss } = item;
        const { trade_offer, pricing } = itemss;
        const { trade_price, box_in_carton, pricing_gst, gst_base, retail_price } = pricing;

        const quantity = carton_ordered > 0 ? carton_ordered * box_in_carton + box_ordered : box_ordered;
        const itemGrossAmount = trade_price * quantity;
        GrossAmount += itemGrossAmount;

        const itemTODiscount = (trade_offer / 100) * itemGrossAmount;
        Product_Count += itemGrossAmount - itemTODiscount;

        if (gst_base === 'Retail Price') {
          const itemGST = retail_price * quantity * (pricing_gst / 100);
          gst += itemGST;
        }
      }

      setTotalprice(Product_Count);
      setGrossAmount(GrossAmount);
      setGst(gst);
      gstRef.current = gst;

      // Navigate to ViewInvoice with updated values
      navigation.navigate('ViewInvoice', {
        cartItems: order,
        Gst: gstRef.current,
        grossAmount: GrossAmount,
        RouteDate: RouteDate,
      });
    }
  }, [cartItemss, order, navigation]);

  // Reset order state when navigating back to ConfirmOrder screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setOrder(null); // Reset order state
    });

    return unsubscribe;
  }, [navigation]);




  useFocusEffect(
    useCallback(() => {
      const matchOrderID = async () => {
        const userId = await AsyncStorage.getItem('userId');
        const matching = await AsyncStorage.getItem(`localofflinedata_${userId}`);
        setMatchingOrderID(JSON.parse(matching) || []);
        console.log(matching, 'matching');
      };
      matchOrderID();
    }, []), // Empty dependency array ensures this only runs when the screen is focused
  );

  const storeUnproductiveShops = async shopId => {
    if (!shopId) {
      console.log('Invalid shop ID, not saving to AsyncStorage');
      return; // Exit early if shopId is invalid
    }

    const userId = await AsyncStorage.getItem('userId');

    try {
      // Get existing unproductive shops from AsyncStorage
      const existingShops = await AsyncStorage.getItem(
        `unproductiveShops_${userId}`,
      );
      const unproductiveShops = existingShops ? JSON.parse(existingShops) : [];

      // Add the new shop to the array
      const updatedShops = [...unproductiveShops, shopId];

      // Save the updated array back to AsyncStorage
      await AsyncStorage.setItem(
        `unproductiveShops_${userId}`,
        JSON.stringify(updatedShops),
      );

      console.log('Unproductive shops saved to AsyncStorage:', updatedShops);
    } catch (error) {
      console.log('Error saving unproductive shops:', error);
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

  useFocusEffect(
    useCallback(() => {
      loadUnproductiveShops();
    }, []),
  );

  // Function to store unproductive shops
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const userId = await AsyncStorage.getItem('userId');

        // Fetch offline orders
        const offlineOrders = await AsyncStorage.getItem(
          `offlineOrders_${userId}`,
        );
        setOfflineOrders(JSON.parse(offlineOrders) || []);

        // Fetch unproductive shops
        // const unproductiveShops = await AsyncStorage.getItem(
        //   `unproductiveShops_${userId}`,
        // );
        // setUnproductiveShops(JSON.parse(unproductiveShops) || []);

        // Fetch offline unproductive shops
        // const unOfflineShops = await AsyncStorage.getItem(
        //   `OfflinefailedUnProductiveOrders_${userId}`,
        // );
        // setunOfflineShops(JSON.parse(unOfflineShops) || []);
      };
      // loadUnproductiveShops();
      fetchData();
      loadUnproductiveOfflineOrders();
    }, []),
  ); // Empty dependency array ensures it runs only on component mount

  // Function to handle shop visit button click and set singleId
  const handleVisitButtonClick = shopId => {
    if (!shopId) {
      console.log('Invalid shop ID, not visiting');
      return;
    }

    setUnproductiveShops(prev => {
      const updatedShops = [...prev, shopId];
      storeUnproductiveShops(shopId); // Save the shop ID to AsyncStorage
      return updatedShops;
    });
  };

  // const renderItem = ({ item, index }) => {
  //   const matchingOrder = offlineOrders.find(
  //     order => order.shop.id === item.id,
  //   );
  //   const isUnproductive = unproductiveShops.includes(item.id);
  //   const matchingOrderbyID = Array.isArray(matchingOrderID)
  //     ? matchingOrderID.find(order => order.shopId === item.id)
  //     : null;
  //   const matchingUNOfflineOrderbyID = Array.isArray(unOfflineShops)
  //     ? unOfflineShops.find(order => order.fk_shop === item.id)
  //     : null;

  //   // if (matchingOrderbyID) {
  //   //   console.log('Matching order found:', matchingOrderbyID);
  //   // } else {
  //   //   console.log('No matching order found for shopId:', item.id);
  //   // }
  //   return (
  //     <View style={styles.listItem}>
  //       <View>
  //         <Text style={styles.storeName}>
  //           {index + 1}. {item.name}
  //         </Text>
  //         <Text style={styles.storeType}>{item.category}</Text>
  //       </View>

  //       <View style={styles.actions}>
  //         <View
  //           style={{
  //             justifyContent: 'center',
  //             alignItems: 'center',
  //             marginTop: 10,
  //           }}>
  //           <View
  //             style={{
  //               flexDirection: 'row',
  //               justifyContent: 'center',
  //               alignItems: 'center',
  //             }}>
  //             {matchingOrderbyID || matchingOrder ? (
  //               <FontAwesome name="check" size={25} color={'green'} />
  //             ) : isUnproductive || matchingUNOfflineOrderbyID ? (
  //               <FontAwesome name="check" size={25} color={'red'} />
  //             ) : null}
  //             <View style={{ marginLeft: 10 }}>
  //               <TouchableOpacity
  //                 style={[styles.button, { marginBottom: 5 }]}
  //                 onPress={() => {
  //                   console.log(item);
  //                   if (isOffline && matchingOrder) {
  //                     console.log('Invoice Action for Offline Order');
  //                     offline(item);
  //                   } else {
  //                     console.log('Visit Action');
  //                     handleVisit(item);
  //                     setSingleId(item.id); // Set selected shop's ID
  //                   }
  //                 }}>
  //                 <Text style={styles.buttonText}>
  //                   {isOffline && matchingOrder ? 'INVOICE' : 'VISIT'}
  //                 </Text>
  //               </TouchableOpacity>
  //               {item.pending_order > 0 ? (
  //                 <View
  //                   style={{
  //                     backgroundColor: 'red',
  //                     width: 70,
  //                     height: 15,
  //                     borderRadius: 10,
  //                     justifyContent: 'center',
  //                     alignItems: 'center',
  //                   }}>
  //                   <Text style={{ fontSize: 9, color: '#fff' }}>pending</Text>
  //                 </View>
  //               ) : (
  //                 <View
  //                   style={{
  //                     backgroundColor: 'green',
  //                     width: 70,
  //                     height: 15,
  //                     borderRadius: 10,
  //                     justifyContent: 'center',
  //                     alignItems: 'center',
  //                   }}>
  //                   <Text style={{ fontSize: 9, color: '#fff' }}>No pending</Text>
  //                 </View>
  //               )}
  //             </View>
  //           </View>
  //         </View>

  //         <View style={{ width: 20 }}></View>

  //         {/* Info button to show more details in a modal */}
  //         <TouchableOpacity
  //           style={styles.infoButton}
  //           onPress={() => {
  //             console.log(item, 'item');
  //             setSSelectedShop(item); // Set the selected shop data
  //             setMModalVisible(true); // Show the modal
  //           }}>
  //           <FontAwesome6 name={'circle-info'} size={20} color={'#2196f3'} />
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // };
  const selectedShopRef = useRef(null);

  const renderItem = ({ item, index }) => {
    const matchingOrder = offlineOrders.find(order => order.fk_shop === item.id);
    const isUnproductive = unproductiveShops.includes(item.id);
    const matchingOrderbyID = Array.isArray(matchingOrderID)
      ? matchingOrderID.find(order => order.fk_shop === item.id)
      : null;
    const matchingUNOfflineOrderbyID = Array.isArray(unOfflineShops)
      ? unOfflineShops.find(order => order.fk_shop === item.id)
      : null;
    const internetordermatch = Array.isArray(internetapi) ? internetapi.find(order => order.fk_shop == item.id) : [];

    const handleVisitPress = async () => {
      selectedShopRef.current = item
      const state = await NetInfo.fetch();
      const isOffline = !state.isConnected;

      if (isOffline && matchingOrder) {
        console.log('Invoice Action for Offline Order');
        await offline(selectedShopRef.current);
      } else if (internetordermatch) {
        await onlineordercheck(item)
      }
      else {
        console.log('Visit Action');
        handleVisit(selectedShopRef.current);
        setSingleId(selectedShopRef.current.id);
      }
    };

    return (
      <View style={styles.listItem}>
        <View>
          <Text style={styles.storeName}>
            {index + 1}. {item.name}
          </Text>
          <Text style={styles.storeType}>{item.category}</Text>
        </View>

        <View style={styles.actions}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {matchingOrderbyID || matchingOrder ? (
                <FontAwesome name="check" size={25} color={'green'} />
              ) : isUnproductive || matchingUNOfflineOrderbyID ? (
                <FontAwesome name="check" size={25} color={'red'} />
              ) : null}
              <View style={{ marginLeft: 10 }}>
                <TouchableOpacity
                  style={[styles.button, { marginBottom: 5 }]}
                  onPress={handleVisitPress}>
                  <Text style={styles.buttonText}>
                    {isOffline && matchingOrder || internetordermatch ? 'INVOICE' : 'VISIT'}
                  </Text>
                </TouchableOpacity>
                {item.pending_order > 0 ? (
                  <View
                    style={{
                      backgroundColor: 'red',
                      width: 70,
                      height: 15,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontSize: 9, color: '#fff' }}>pending</Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: 'green',
                      width: 70,
                      height: 15,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontSize: 9, color: '#fff' }}>No pending</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ width: 20 }}></View>

          {/* Info button to show more details in a modal */}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              console.log(item, 'item');
              setSSelectedShop(item); // Set the selected shop data
              setMModalVisible(true); // Show the modal
            }}>
            <FontAwesome6 name={'circle-info'} size={20} color={'#2196f3'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderModal = () => (
    <Modal
      visible={MModalVisible}
      onRequestClose={() => setMModalVisible(false)}
      animationType="slide"
      transparent={true}>
      <TouchableOpacity
        style={styles.modalOOverlay}
        onPress={() => setMModalVisible(false)} // Close modal when tapping outside
      >
        <View
          style={{
            width: '80%',
            padding: 20,
            backgroundColor: '#fff',
            borderRadius: 10,
            position: 'relative',
          }}>
          {sselectedShop && (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#000',
                  textAlign: 'center',
                  color: '#000',
                  marginBottom: 17,
                }}>
                {sselectedShop.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#000', marginBottom: 17 }}>
                ID: {sselectedShop.id}
              </Text>
              <Text style={{ fontSize: 14, color: '#000', marginBottom: 17 }}>
                Shop Type: {sselectedShop.category}
              </Text>
              <Text style={{ fontSize: 14, color: '#000', marginBottom: 17 }}>
                Owner Name: {sselectedShop.owner}
              </Text>
              <Text style={{ fontSize: 14, color: '#000', marginBottom: 17 }}>
                Address: {sselectedShop.address}
              </Text>
              <Text style={{ fontSize: 14, color: '#000', marginBottom: 17 }}>
                Cell No: {sselectedShop.cell}
              </Text>

              <TouchableOpacity
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                  height: 40,
                  width: 100,
                  borderWidth: 1,
                }}
                onPress={() => {
                  navigation.navigate('AddNewShop', {
                    Item: sselectedShop,
                    orderBokerId: orderBokerId,
                    routes: Selectedroute,
                  });
                  setMModalVisible(false);
                }}>
                <Text style={[styles.modifyButtonText, { color: '#000' }]}>
                  Modify
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getProduct = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    try {
      const response = await instance.get(
        `/distribution_trade/all_trade_pricing_active?distribution_id=${distributor_id}&current=true`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      // console.log(
      //   JSON.stringify(response.data),
      //   'response of get products in All shops',
      // );
      let products = [];
      response.data.forEach(it => {
        if (it.pricing.active == true) {
          products.push(it);
        }
      });
      setAllProducts(products);
      setFilteredProducts(products);
      // console.log(JSON.stringify(response.data), 'Hello');
      console.log('getProduct api successful');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Session Expired',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      } else {
        console.log('Error', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   getProduct();
  // }, []);
  useFocusEffect(
    useCallback(() => {
      getProduct()
    }, [])
  )

  const toggleSelect = skuId => {
    // Check if SKU is already selected
    if (selectedSKUs.includes(skuId)) {
      // If selected, unselect it
      setSelectedSKUs(selectedSKUs.filter(id => id !== skuId));
    } else {
      // If not selected, add it
      setSelectedSKUs([...selectedSKUs, skuId]);
    }
  };

  useEffect(() => {
    // Whenever the selectedSKUs change, we can update the list of products for unmarking
    let productsForUnmark = allProducts.filter(product =>
      selectedSKUs.includes(product.pricing.id),
    );

    // console.log(productsForUnmark, 'Product set');
  }, [selectedSKUs]); // This useEffect runs when selectedSKUs changes

  const filterProducts = query => {
    if (query) {
      const filtered = allProducts.filter(item =>
        item.pricing.product.name.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(allProducts); // Show all products if search query is empty
    }
  };

  const boxFilter = inputString => {
    // console.log(inputString, 'input string is')
    const regex = /(\d+)pc.*?(\d+)bx/;
    const matches = inputString.match(regex);

    if (matches) {
      //   setPieces(parseInt(matches[1])); // Extract and store pc value
      return matches[2] !== undefined ? parseInt(matches[2]) : 96;
    } else {
      return 96;
    }
    // return 24
  };
  const memoizedVal = useCallback(
    item => {
      // Your logic for handling the data in the parent
      setExistingProduct(prevUnproductive => [...prevUnproductive, item]);
    },
    [existingProduct],
  );
  // const order = useSelector(state => state.UnProductive_reducer, shallowEqual);

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
      // For iOS, no need for explicit permission request, it's handled automatically.
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getLocation = async () => {
    console.log(StockAlreadyExist, 'StockAlreadyExist');
    setIsLoading(true);
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

      console.log('Current Location:', currentLocation);

      // Example: Navigate to a different screen with the location data
      PostReason(currentLocation);
    } catch (error) {
      if (error.code === 'CANCELLED') {
        console.log('Location request was cancelled by the user.');
      } else {
        Alert.alert('Error', 'Unable to fetch location. Please try again.');
      }
      console.warn(error);
    }
  };

  const PostReason = async currentLocation => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const fk_employee = await AsyncStorage.getItem('fk_employee');
    const userId = await AsyncStorage.getItem('userId');
    const state = await NetInfo.fetch();
    if (view === 'Shop Closed') {
      try {
        if (state.isConnected) {
          setIsLoading(true);
          const data = {
            reason: shopcloseReason,
            rejection_type: 'closed',
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            fk_shop: singleId,
            fk_employee: fk_employee,
            details: [
              // {
              //     "box": 0,
              //     "carton": 0,
              //     "fk_pricing": 0
              // }
            ],
          };
          if (shopcloseReason) {
            const response = await instance.post(
              '/unproductive_visit',
              JSON.stringify(data),
              {
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              },
            );
            console.log(response.data);
            console.log(response.status);
            // incrementTotalVisits();
            closeModal();
            setUnproductiveShops(prev => {
              const updatedShops = [...prev, singleId];
              storeUnproductiveShops(singleId);
              return updatedShops;
            });
            setIsLoading(false);
          } else {
            Alert.alert('Add Reason');
            setModalVisible(false);
            setIsLoading(false);
          }
        } else {
          const data = {
            reason: shopcloseReason,
            rejection_type: 'closed',
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            fk_shop: singleId,
            fk_employee: fk_employee,
            details: [
              // {
              //     "box": 0,
              //     "carton": 0,
              //     "fk_pricing": 0
              // }
            ],
          };
          saveOfflineFailedUnproductive(userId, data);
          Alert.alert(
            'Order Saved',
            'Order has been saved locally for syncing.',
            [
              {
                onPress: () => {
                  loadUnproductiveShops();
                  loadUnproductiveOfflineOrders();
                },
              },
            ],
          );
          closeModal();
          incrementTotalVisits();
          setIsLoading(false);
        }
      } catch (error) {
        // incrementTotalVisits();
        const data = {
          reason: shopcloseReason,
          rejection_type: 'closed',
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          fk_shop: singleId,
          fk_employee: fk_employee,
          details: [],
        };
        const failunorder = {
          View: 'Shop Closed',
          Data: data,
        };
        saveFailedUnproductive(userId, failunorder);
        closeModal();
        setIsLoading(false);
        Alert.alert('Error', 'Error posting reason');
        if (error.response && error.response.status === 401) {
          ToastAndroid.showWithGravity(
            'Session Expired',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
          TokenRenew();
        } else {
          console.log('Error', error);
          ToastAndroid.showWithGravity(
            'Unable to post Mark UnProductive Visit.',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
        }
        if (error.response && error.response.status === 400) {
          Alert.alert(
            'Error',
            'Please Check if your input is empty or Check if any order or reason is pending',
          );
        }
      }
    } else if (view === 'Customer Refused') {
      try {
        if (state.isConnected) {
          setIsLoading(true);
          const data = {
            reason: customerRefused,
            rejection_type: 'refused',
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            fk_shop: singleId,
            fk_employee: fk_employee,
            details: [
              // {
              //     "box": 0,
              //     "carton": 0,
              //     "fk_pricing": 0
              // }
            ],
          };

          console.log(JSON.stringify(data), 'Data');
          if (customerRefused) {
            const response = await instance.post(
              '/unproductive_visit',
              JSON.stringify(data),
              {
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
              },
            );
            console.log(response.data);
            console.log(response.status);
            closeModal();
            // incrementTotalVisits();
            setUnproductiveShops(prev => {
              const updatedShops = [...prev, singleId];
              storeUnproductiveShops(singleId);
              return updatedShops;
            });
            setIsLoading(false);
          } else {
            Alert.alert('Add Reason');
            setModalVisible(false);
            setIsLoading(false);
          }
        } else {
          const data = {
            reason: customerRefused,
            rejection_type: 'refused',
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            fk_shop: singleId,
            fk_employee: fk_employee,
            details: [
              // {
              //     "box": 0,
              //     "carton": 0,
              //     "fk_pricing": 0
              // }
            ],
          };
          saveOfflineFailedUnproductive(userId, data);
          Alert.alert(
            'Order Saved',
            'Order has been saved locally for syncing.',
            [
              {
                onPress: () => {
                  loadUnproductiveShops();
                  loadUnproductiveOfflineOrders();
                },
              },
            ],
          );
          closeModal();
          incrementTotalVisits();
          setIsLoading(false);
        }
      } catch (error) {
        const data = {
          reason: customerRefused,
          rejection_type: 'refused',
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          fk_shop: singleId,
          fk_employee: fk_employee,
          details: [
            // {
            //     "box": 0,
            //     "carton": 0,
            //     "fk_pricing": 0
            // }
          ],
        };
        const failunorder = {
          View: 'Customer Refused',
          Data: data,
        };
        saveFailedUnproductive(userId, failunorder);
        closeModal();
        setIsLoading(false);
        Alert.alert('Error', 'Error posting Reason');
        if (error.response && error.response.status === 401) {
          ToastAndroid.showWithGravity(
            'Session Expired',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
          TokenRenew();
        } else {
          console.log('Error', error);
          ToastAndroid.showWithGravity(
            'Unable to post Mark UnProductive Visit.',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
        }
        if (error.response && error.response.status === 400) {
          Alert.alert(
            'Please Check is your input is empty or Check if any order or reason is pending',
          );
        }
      }
    } else if (view === 'Stock Already Exist') {
      // StockAlreadyExist
      let details = [];
      StockAlreadyExist.forEach(item => {
        console.log(item, ' stock Id'); //Good for debugging
        details.push({
          carton: item.carton_ordered,
          box: item.box_ordered,
          fk_pricing: item.itemss.fk_pricing,
        });
      });
      try {
        console.log('Detail', details);
        console.log(StockAlreadyExist, 'StockAlreadyexsists');
        if (state.isConnected) {
          setIsLoading(true);
          const data = {
            reason: customerRefused,
            rejection_type: 'stock_exists',
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            fk_shop: singleId,
            fk_employee: fk_employee,
            details: details,
          };

          console.log(JSON.stringify(data), ' stockData');

          const response = await instance.post(
            '/unproductive_visit',
            JSON.stringify(data),
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            },
          );
          console.log(response.data);
          console.log(response.status);
          closeModal();
          // incrementTotalVisits();
          setUnproductiveShops(prev => {
            const updatedShops = [...prev, singleId];
            storeUnproductiveShops(singleId);
            return updatedShops;
          });
          setIsLoading(false);
        } else {
          const data = {
            reason: customerRefused,
            rejection_type: 'stock_exists',
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            fk_shop: singleId,
            fk_employee: fk_employee,
            details: details,
          };
          saveOfflineFailedUnproductive(userId, data);
          Alert.alert(
            'Order Saved',
            'Order has been saved locally for syncing.',
            [
              {
                onPress: () => {
                  loadUnproductiveShops();
                  loadUnproductiveOfflineOrders();
                },
              },
            ],
          );
          incrementTotalVisits();
          closeModal();
          setIsLoading(false);
        }
      } catch (error) {
        const data = {
          reason: customerRefused,
          rejection_type: 'stock_exists',
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          fk_shop: singleId,
          fk_employee: fk_employee,
          details: details,
        };
        const failunorder = {
          View: 'Stock Already Exist',
          Data: data,
        };
        saveFailedUnproductive(userId, failunorder);
        closeModal();
        setIsLoading(false);
        Alert.alert('Error', 'Error posting products');
        if (error.response && error.response.status === 401) {
          ToastAndroid.showWithGravity(
            'Session Expired',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
          TokenRenew();
        } else {
          console.log('Error', error);
          ToastAndroid.showWithGravity(
            'Unable to post Mark UnProductive Visit.',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
        }
        if (error.response && error.response.status === 400) {
          Alert.alert(
            'Please Check is your input is empty or Check if any order is pending',
          );
        }
      }
    }
  };
  const saveFailedUnproductive = async (userId, UnproductiveOrder) => {
    try {
      const key = `failedUnProductiveOrders_${userId}`;
      const existingFailedOrders = await AsyncStorage.getItem(key);

      // Initialize failedUnProductiveOrders as an empty array if nothing is found
      let failedUnProductiveOrders = [];

      // If existingFailedOrders is not null and is a valid JSON string, parse it
      if (existingFailedOrders) {
        try {
          failedUnProductiveOrders = JSON.parse(existingFailedOrders);
          if (!Array.isArray(failedUnProductiveOrders)) {
            failedUnProductiveOrders = [];
          }
        } catch (e) {
          console.error('Error parsing existing orders', e);
        }
      }

      // Add the new failed order to the array
      failedUnProductiveOrders.push(UnproductiveOrder);

      // Save the updated array back to AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(failedUnProductiveOrders));
      console.log('failedUnProductiveOrders order saved successfully');
    } catch (error) {
      console.error('Error saving failedUnProductiveOrders order:', error);
    }
  };
  const saveOfflineFailedUnproductive = async (userId, UnproductiveOrder) => {
    try {
      const key = `OfflinefailedUnProductiveOrders_${userId}`;
      const existingFailedOrders = await AsyncStorage.getItem(key);

      // Initialize failedUnProductiveOrders as an empty array if nothing is found
      let failedUnProductiveOrders = [];

      // If existingFailedOrders is not null and is a valid JSON string, parse it
      if (existingFailedOrders) {
        try {
          failedUnProductiveOrders = JSON.parse(existingFailedOrders);
          if (!Array.isArray(failedUnProductiveOrders)) {
            failedUnProductiveOrders = [];
          }
        } catch (e) {
          console.error('Error parsing existing orders', e);
        }
      }

      // Add the new failed order to the array
      failedUnProductiveOrders.push(UnproductiveOrder);

      // Save the updated array back to AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(failedUnProductiveOrders));
      console.log('failedUnProductiveOrders order saved successfully');
    } catch (error) {
      console.error('Error saving failedUnProductiveOrders order:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="black"
        barStyle="light-content"
        translucent={false}
      />

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#2196f3',
          height: 70,
          position: 'relative',
        }}>
        {openclosesearch ? (
          <View
            style={{
              position: 'absolute',
              height: 70,
              backgroundColor: '#2196f3',
              zIndex: 10,
              width: '100%',
              flexDirection: 'row',
            }}>
            <TouchableOpacity
              style={{
                width: '15%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                togglesearch();
              }}>
              <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
            </TouchableOpacity>
            <View style={{ width: '70%', justifyContent: 'center' }}>
              <TextInput
                placeholder="Search..."
                placeholderTextColor={'#fff'}
                onChangeText={txt => {
                  updateSearch(txt);
                }}
              />
            </View>
          </View>
        ) : null}
        {renderModal()}
        <TouchableOpacity
          style={{ width: '15%', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            navigation.goBack();
          }}>
          <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
        </TouchableOpacity>
        <View
          style={{
            width: '70%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: '#fff', fontSize: 20 }}>
            {Selectedroute?.name}
          </Text>
        </View>
        <TouchableOpacity
          style={{ width: '15%', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            togglesearch();
          }}>
          <AntDesign name="search1" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={filteredStores}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id.toString()}
      // keyExtractor={(item, index) => item}

      />
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeModal}>
        {/* <TouchableOpacity style={styles.modalOverlay} onPress={closeModal}> */}

        {isLoading ? (
          <Loader />
        ) : (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {!markUnproductiveButton ? (
                <View style={styles.Create_order_cont}>
                  <Text style={styles.modalText}>
                    RECORD VISIT: {selectedStore?.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.createOrderButton}
                    onPress={() => {
                      // incrementTotalVisits();
                      navigation.navigate('CreateOrder', {
                        Store: selectedStore,
                        RouteDate: routeDate,
                      });
                      closeModal();
                    }}>
                    <Text style={styles.buttonText}>Create Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.markUnproductiveButton}
                    onPress={() => {
                      setMarkUnproductiveButton(true);
                    }}>
                    <Text style={styles.buttonText}>
                      Mark Unproductive Visit
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', width: '100%' }}>
                    <TouchableOpacity onPress={closeModal}>
                      <Text style={{ color: 'red', marginTop: 20 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={{ marginLeft: 'auto' }}>
                      <Text style={{ color: 'red', marginTop: 20 }}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.UnProductive_cont}>
                  <View style={styles.UnProductive_row}>
                    <View style={styles.UnProductive_col}>
                      <View style={{}}>
                        <View style={styles.btn_parent_cont}>
                          <TouchableOpacity
                            style={[
                              styles.btn_cont,
                              view === 'Shop Closed' && styles.selected_btn,
                            ]}
                            onPress={() => handlePress('Shop Closed')}>
                            <Text
                              style={[
                                styles.btn_txt,
                                view === 'Shop Closed' && styles.selected_txt,
                              ]}>
                              Shop Closed
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.btn_cont,
                              view === 'Customer Refused' &&
                              styles.selected_btn,
                            ]}
                            onPress={() => handlePress('Customer Refused')}>
                            <Text
                              style={[
                                styles.btn_txt,
                                view === 'Customer Refused' &&
                                styles.selected_txt,
                              ]}>
                              Customer
                            </Text>
                            <Text
                              style={[
                                styles.btn_txt,
                                view === 'Customer Refused' &&
                                styles.selected_txt,
                              ]}>
                              Refused
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.btn_cont,
                              view === 'Stock Already Exist' &&
                              styles.selected_btn,
                            ]}
                            onPress={() => handlePress('Stock Already Exist')}>
                            <Text
                              style={[
                                styles.btn_txt,
                                view === 'Stock Already Exist' &&
                                styles.selected_txt,
                              ]}>
                              Stock Already
                            </Text>
                            <Text
                              style={[
                                styles.btn_txt,
                                view === 'Stock Already Exist' &&
                                styles.selected_txt,
                              ]}>
                              Exist
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {view === 'Shop Closed' && (
                          <View style={styles.view_cont}>
                            <Text style={{ color: '#a0a0a0' }}>Reason :</Text>
                            <View
                              style={{
                                borderBottomColor: '#000',
                                borderBottomWidth: 1,
                              }}>
                              <TextInput
                                style={{ backgroundColor: '#fff', color: '#000' }}
                                value={shopcloseReason}
                                textColor={'#000'}
                                // activeUnderlineColor='#3ef0c0'
                                onChangeText={password =>
                                  setshopCloseReason(password)
                                }
                              />
                            </View>
                          </View>
                        )}

                        {view === 'Customer Refused' && (
                          <View style={styles.view_cont}>
                            <Text style={{ color: '#a0a0a0' }}>Reason*:</Text>
                            <View
                              style={{
                                borderBottomColor: '#000',
                                borderBottomWidth: 1,
                              }}>
                              <TextInput
                                style={{ backgroundColor: '#fff', color: '#000' }}
                                value={customerRefused}
                                textColor={'#000'}
                                // activeUnderlineColor='#3ef0c0'
                                onChangeText={password =>
                                  setCustomerRefused(password)
                                }
                              />
                            </View>
                          </View>
                        )}

                        {view === 'Stock Already Exist' && (
                          <View
                            style={[
                              styles.view_cont,
                              {
                                height: '88%',
                                padding: 0,
                                position: 'relative',
                              },
                            ]}>
                            <View style={{}}>
                              <View
                                style={{
                                  width: '100%',
                                  flexDirection: 'row',
                                  height: 50,
                                  borderBottomWidth: 1,
                                  borderBottomColor: '#a0a0a0',
                                }}>
                                <TouchableOpacity
                                  style={{
                                    width: '80%',
                                    justifyContent: 'center',
                                  }}
                                  onPress={() => setSKUView(true)}>
                                  <Text style={{ color: '#000' }}>
                                    Select SKU
                                  </Text>
                                </TouchableOpacity>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}>
                                  <TouchableOpacity
                                    onPress={() => setSKUView(true)}>
                                    <AntDesign
                                      name="caretdown"
                                      size={18}
                                      color={'#000'}
                                    />
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={{ marginLeft: 9 }}
                                    onPress={() => {
                                      setExistingProduct([]);

                                      // Remove from selectedProduct
                                      setSelectedProduct([]);

                                      // Remove from selectedSKUs
                                      setSelectedSKUs([]);
                                    }}>
                                    <AntDesign
                                      name="close"
                                      size={18}
                                      color={'#000'}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                            <View style={{ height: '80%' }}>
                              <FlatList
                                showsVerticalScrollIndicator={false}
                                data={selectedProduct} // Ensure this contains the expected data
                                keyExtractor={(item, index) =>
                                  item?.pricing.id?.toString() ||
                                  index.toString()
                                }
                                renderItem={({ item }) => (
                                  <AddSingleProduct
                                    itemss={item}
                                    boxInCtn={boxFilter(
                                      item.pricing.variant.name,
                                    )}
                                    StockAlreadyExist={StockAlreadyExist} // Pass StockAlreadyExist as prop
                                    Add_Left_Stock={Add_Left_Stock}
                                    del={id => {
                                      console.log(
                                        'Delete called for SKU with id:',
                                        id,
                                        existingProduct,
                                        'expr',
                                        selectedProduct,
                                        'selepr',
                                        selectedSKUs,
                                      );
                                      setExistingProduct(prevProducts =>
                                        prevProducts.filter(
                                          existingItem =>
                                            existingItem.itemss.pricing.id !==
                                            id,
                                        ),
                                      );
                                      setSelectedProduct(prevProducts =>
                                        prevProducts.filter(
                                          selectedItem =>
                                            selectedItem.pricing.id !== id,
                                        ),
                                      );
                                      setSelectedSKUs(prevSKUs =>
                                        prevSKUs.filter(skuId => skuId !== id),
                                      );
                                    }}
                                  />
                                )}
                              />
                            </View>
                            <View
                              style={{
                                flexDirection: 'row',
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 110,
                                justifyContent: 'space-between',
                              }}>
                              <TouchableOpacity onPress={closeModal}>
                                <Text style={{ color: 'red' }}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  getLocation();
                                }}>
                                <Text style={{ color: '#a0a0a0' }}>Confirm</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                    {view !== 'Stock Already Exist' ? ( // Removed extra space
                      <View style={{ flexDirection: 'row', width: '100%' }}>
                        <TouchableOpacity
                          onPress={() => {
                            setMarkUnproductiveButton(false);
                          }}>
                          <Text style={{ color: 'red', marginTop: 20 }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            getLocation();
                          }}
                          style={{ marginLeft: 'auto' }}>
                          <Text style={{ color: 'red', marginTop: 20 }}>
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View></View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={SKUview}
        onRequestClose={closeSKUModal}>
        {isLoading ? (
          <Loader />
        ) : (
          <View style={styles.modalSKUContainer}>
            <View style={styles.modalSKUContent}>
              <View style={styles.container}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: '75%' }}>
                    <Text style={styles.title}>Select SKU</Text>
                  </View>
                  <View
                    style={{
                      width: '25%',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        closeSKUModal();
                      }}>
                      <View>
                        <AntDesign name="close" size={20} color={'#a0a0a0'} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        closeSKUModal();
                      }}>
                      <Text style={{ color: '#a0a0a0' }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Search Input */}

                <TextInput
                  style={styles.searchInput}
                  placeholder="Search SKU"
                  placeholderTextColor={'#000'}
                  value={searchQuery}
                  onChangeText={text => {
                    setSearchQuery(text);
                    filterProducts(text);
                  }}
                />

                {/* SKU List */}

                <FlatList
                  showsVerticalScrollIndicator={false}
                  data={filteredProducts}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.skuItem}>
                      <View style={{ width: '10%' }}>
                        <CheckBox
                          value={selectedSKUs.includes(item.pricing.id)}
                          onValueChange={() => {
                            console.log(item, 'item in toggle search');
                            toggleSelect(item.pricing.id); // Update SKU selection on press
                            setSelectedProduct(prevProducts => [
                              ...prevProducts,
                              item,
                            ]);
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={{ width: '90%' }}
                        onPress={() => {
                          console.log(item, 'item in toggle search');
                          toggleSelect(item.pricing.id); // Update SKU selection on press
                          setSelectedProduct(prevProducts => [
                            ...prevProducts,
                            item,
                          ]);
                        }}>
                        <Text style={styles.skuText}>
                          {`${item.pricing.product.name} ${item.pricing.sku.name} ${item.pricing.variant.name}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />

                {/* Save & Cancel Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      closeSKUModal();
                    }}>
                    {/* {console.log(selectedSKUs, 'selectedSKUs')} */}
                    <Text style={{ fontSize: 16 }}>
                      {selectedSKUs.length === 0 && (
                        <Text style={{ color: '#000' }}>
                          Save without Selection
                        </Text>
                      )}
                      {selectedSKUs.length === 1 && (
                        <Text style={{ color: '#000' }}>
                          Save SKU "{selectedSKUs[0]}"
                        </Text>
                      )}
                      {selectedSKUs.length > 1 && (
                        <Text style={{ color: '#000' }}>
                          Save SKU ({selectedSKUs.length})
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                  {/* <Button title="Save SKU" onPress={() => console.log('Selected SKUs:', selectedSKUs)} /> */}
                </View>
              </View>
            </View>
            {isLoading ? <Loader /> : null}
          </View>
        )}
      </Modal>

      {isLoading ? <Loader /> : null}
    </View>
  );
};
const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f5f5f5',
  },
  listItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    color: '#000',
  },
  storeType: {
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2196f3',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10, // Center text
  },
  buttonText: {
    color: 'white', // Text color
    fontWeight: 'bold', // Bold text
  },
  // button: {
  //     backgroundColor: '#2196f3',
  //     padding: 10,
  //     borderRadius: 5,
  //     alignItems: 'center',
  // },
  // buttonText: {
  //     color: 'white',
  //     fontWeight: 'bold',
  // },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 20,
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#000',
  },
  createOrderButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  markUnproductiveButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  UnProductive_cont: {
    // position: "absolute",
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  UnProductive_row: {},
  UnProductive_col: {},
  Create_order_cont: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  btn_cont: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 50,
    width: 100,
    borderColor: '#000',
    borderWidth: 0.5,
  },
  btn_txt: {
    textAlign: 'center',
    color: '#000',
  },
  btn_parent_cont: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view_cont: {
    marginTop: 20,
    padding: 20,
    // backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  view_txt: {
    fontSize: 18,
    textAlign: 'center',
  },
  selected_btn: {
    backgroundColor: '#2196f3', // selected button background color
  },
  selected_txt: {
    color: 'white', // selected text color
  },
  openModalSKUButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalSKUContainer: {
    // flex: 1,
    justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
    // position:'absolute',
    // marginLeft:'auto',
    // marginRight:"auto"
  },
  modalSKUContent: {
    width: width,
    height: height,
    // width:'100%',
    // height:"100%",
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'space-between',
  },
  modalSKUText: {
    fontSize: 18,
    textAlign: 'center',
  },
  buttonSKUContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  closeSKUButton: {
    backgroundColor: '#FF5252',
    padding: 10,
    borderRadius: 5,
  },
  confirmSKUButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 8,
    marginBottom: 10,
    color: '#000',
  },
  skuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    // backgroundColor:"#fff"
  },
  skuText: {
    // marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    marginLeft: 'auto',
    marginTop: 20,
  },
});

export default AllShops;
