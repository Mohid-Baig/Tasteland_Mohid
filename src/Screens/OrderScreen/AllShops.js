import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
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
import {SearchBar, Header, Button, Icon} from 'react-native-elements';
// import { TextInput } from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {RemoveAllCart} from '../../Components/redux/action';

import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import CheckBox from '@react-native-community/checkbox';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import GetLocation from 'react-native-get-location';
import Loader from '../../Components/Loaders/Loader';
import {VisitContext} from '../DashboardScreens/VisitContext';
let StockAlreadyExist = [];
const Add_Left_Stock = payload => {
  if (payload) {
    // Find the index of the existing item in the state
    const existingIndex = StockAlreadyExist.findIndex(
      item => item.pricing_id === payload.pricing_id,
    );

    // If the item has both 'carton_ordered' and 'box_ordered' as 0, remove it from the state
    if (payload.carton_ordered === 0 && payload.box_ordered === 0) {
      StockAlreadyExist = StockAlreadyExist.filter(
        item => item.pricing_id !== payload.pricing_id,
      );
      return StockAlreadyExist;
    }

    if (existingIndex !== -1) {
      // If item exists, replace it with the new payload
      StockAlreadyExist[existingIndex] = payload;
    } else {
      // If item doesn't exist, add the new item to the state
      StockAlreadyExist = [...StockAlreadyExist, payload];
    }
  }
  console.log(StockAlreadyExist, 'StockAlreadyExist');

  return StockAlreadyExist;
};
const Remove_Left_Stock = () => {
  StockAlreadyExist = [];
};
const removeById = id => {
  const updatedArray = StockAlreadyExist.filter(
    stock => stock.itemss.id !== id,
  );
  StockAlreadyExist = updatedArray;
};

// import AntDesign from 'react-native-vector-icons/AntDesign'
const AllShops = ({navigation, route}) => {
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
  const [view, setView] = useState('Shop Closed'); // State to manage which view to show
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
  const {incrementVisits} = useContext(VisitContext);
  useEffect(() => {
    console.log(selectedProduct, 'selected product');
  });
  const getorderBookerId = async () => {
    const id = await AsyncStorage.getItem('orderbooker');
    // console.log(id,"Id id ")
    setOrderBokerId(parseInt(id));
  };
  // Function to handle the button press and update the view
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
    // console.log(search, "search")
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

  // const filteredStores = stores.filter((store) =>
  //     store.name.toLowerCase().includes(search.toLowerCase())
  // );
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
  useEffect(() => {
    const {Shops, RouteName, RouteDate} = route.params;
    // console.log(RouteDate, 'Date');
    // console.log('Shop route', Shops);
    // console.log(RouteName, 'RouteName');
    setStores(Shops);
    setFilteredStores(Shops); // Initialize filteredStores with the complete list
    setSelectedRoute(RouteName);
    setRouteDate(RouteDate);
  }, [route]);
  // useEffect(()=>{
  //     dispatch(RemoveAllCart());

  // },[])
  useFocusEffect(
    React.useCallback(() => {
      dispatch(RemoveAllCart());
    }, [dispatch]),
  );
  useEffect(() => {
    getorderBookerId();
  }, []);

  const AddSingleProduct = ({boxInCtn, itemss, Val, del}) => {
    console.log(itemss, 'Itemss in All shop screen');
    const [Pack, setPack] = useState(0);
    const [carton, setCarton] = useState(0);
    const [addOn, setAddOn] = useState('pack');

    const AddProduct = () => {
      let item = {
        carton_ordered: carton,
        box_ordered: Pack,
        pricing_id: itemss.id,
        itemss: itemss,
        pack_in_box: boxInCtn,
      };
      Add_Left_Stock(item);
      // console.log(StockAlreadyExist, 'tm');
      // StockAlreadyExist.push(item);
      // const stock = Add_Left_Stock(item);
      // console.log(stock, 'ext')

      // Val(item); // Callback to send data to parent
      // dispatch(AddUnProductive(item));
    };

    const handleDelete = id => {
      del(id); // Callback to delete an item

      removeById(id);
    };

    const handlePackChange = txt => {
      let num = parseInt(txt);
      if (isNaN(num)) {
        setPack(0);
      } else if (num > 9999) {
        setPack(9999);
      } else {
        setPack(num);
      }
    };

    const handleCartonChange = txt => {
      let num = parseInt(txt);
      if (isNaN(num)) {
        setCarton(0);
      } else if (num > 9999) {
        setCarton(9999);
      } else {
        setCarton(num);
      }
    };

    const AddSub = val => {
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
    };

    useEffect(() => {
      if (Pack >= boxInCtn) {
        let val = Pack;
        let ctn = carton;
        while (val >= boxInCtn) {
          val -= boxInCtn;
          ctn += 1;
        }
        setPack(val);
        setCarton(ctn);
      }
      if (Pack > 0 || carton > 0) {
        AddProduct();
      }
    }, [Pack, boxInCtn]);

    useEffect(() => {
      if (carton > 9999) {
        setCarton(9999);
      }
      if (Pack > 0 || carton > 0) {
        AddProduct();
      }
    }, [carton]);

    return (
      <View
        style={{
          marginTop: '2%',
          borderBottomColor: '#000',
          borderBottomWidth: 1,
        }}>
        <Text style={{color: '#000', fontSize: 13}}>
          {`${itemss.product.name} ${itemss.sku.name} ${itemss.variant.name}`}
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
            onPress={() => handleDelete(itemss.id)}
          />
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              style={{padding: '1%'}}
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
                style={{color: '#000'}}
              />
            </View>
            <View style={{padding: '1%'}}>
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
                style={{color: '#000'}}
              />
            </View>
            <TouchableOpacity
              style={{padding: '1%'}}
              onPress={() => AddSub('Add')}>
              <AntDesign name="pluscircle" size={24} color={'#2196f3'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({item, index}) => (
    <View style={styles.listItem}>
      <View>
        <Text style={styles.storeName}>
          {index + 1}. {item.name}
        </Text>
        <Text style={styles.storeType}>{item.category}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            handleVisit(item);
            setSingleId(item.id);
          }}>
          <Text style={styles.buttonText}>VISIT</Text>
        </TouchableOpacity>
        <View style={{width: 20}}></View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {
            console.log(Selectedroute, 'hello');
            navigation.navigate('AddNewShop', {
              Item: item,
              orderBokerId: orderBokerId,
              routes: Selectedroute,
            });
          }}>
          <FontAwesome6 name={'circle-info'} size={20} color={'#2196f3'} />
        </TouchableOpacity>
      </View>
    </View>
  );

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
      setFilteredProducts(response.data);
      //   console.log(JSON.stringify(response.data), 'Hello');
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
  }, []);

  const toggleSelect = skuId => {
    if (selectedSKUs.includes(skuId)) {
      setSelectedSKUs(selectedSKUs.filter(id => id !== skuId));
    } else {
      setSelectedSKUs([...selectedSKUs, skuId]);
    }
    let productsForUnmark = [];
    selectedSKUs.forEach(sku => [
      allProducts.forEach(product => {
        if (product.id === sku) {
          productsForUnmark.push(product);
        }
      }),
    ]);
    console.log(productsForUnmark, 'Product');
    // console.log(JSON.stringify(allProducts));
  };

  const filterProducts = query => {
    if (query) {
      const filtered = allProducts.filter(item =>
        item.product.name.toLowerCase().includes(query.toLowerCase()),
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
    } finally {
      setIsLoading(false);
    }
  };

  const PostReason = async currentLocation => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const fk_employee = await AsyncStorage.getItem('fk_employee');
    if (view === 'Shop Closed') {
      try {
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
        closeModal();
      } catch (error) {
        if (error.response && error.response.status === 401) {
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
          ToastAndroid.showWithGravity(
            'Unable to post Mark UnProductive Visit.',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
        }
      }
    } else if (view === 'Customer Refused') {
      try {
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
        // console.log(response.data)
        closeModal();
      } catch (error) {
        if (error.response && error.response.status === 401) {
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
          ToastAndroid.showWithGravity(
            'Unable to post Mark UnProductive Visit.',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
        }
      }
    } else if (view === 'Stock Already Exist') {
      // StockAlreadyExist
      let details = [];
      StockAlreadyExist.forEach(item => {
        console.log(item, 'Id');
        details.push({
          carton: item.carton_ordered,
          box: item.box_ordered,
          fk_pricing: item.pricing_id,
        });
      });
      try {
        const data = {
          reason: customerRefused,
          rejection_type: 'stock_exists',
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          fk_shop: singleId,
          fk_employee: fk_employee,
          details: details,
        };

        // console.log(JSON.stringify(data), "Data");
        closeModal();

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
      } catch (error) {
        if (error.response && error.response.status === 401) {
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
          ToastAndroid.showWithGravity(
            'Unable to post Mark UnProductive Visit.',
            ToastAndroid.LONG,
            ToastAndroid.CENTER,
          );
        }
      }
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
            <View style={{width: '70%', justifyContent: 'center'}}>
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

        <TouchableOpacity
          style={{width: '15%', alignItems: 'center', justifyContent: 'center'}}
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
          <Text style={{color: '#fff', fontSize: 20}}>
            {Selectedroute?.name}
          </Text>
        </View>
        <TouchableOpacity
          style={{width: '15%', alignItems: 'center', justifyContent: 'center'}}
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
      />
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeModal}>
        {/* <TouchableOpacity style={styles.modalOverlay} onPress={closeModal}> */}

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
                    incrementVisits(); // Call the function properly
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
                  <Text style={styles.buttonText}>Mark Unproductive Visit</Text>
                </TouchableOpacity>
                <View style={{flexDirection: 'row', width: '100%'}}>
                  <TouchableOpacity onPress={closeModal}>
                    <Text style={{color: 'red', marginTop: 20}}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={{marginLeft: 'auto'}}>
                    <Text style={{color: 'red', marginTop: 20}}>Confirm</Text>
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
                            view === 'Customer Refused' && styles.selected_btn,
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
                          <Text style={{color: '#a0a0a0'}}>Reason :</Text>
                          <View
                            style={{
                              borderBottomColor: '#000',
                              borderBottomWidth: 1,
                            }}>
                            <TextInput
                              style={{backgroundColor: '#fff', color: '#000'}}
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
                          <Text style={{color: '#a0a0a0'}}>Reason*:</Text>
                          <View
                            style={{
                              borderBottomColor: '#000',
                              borderBottomWidth: 1,
                            }}>
                            <TextInput
                              style={{backgroundColor: '#fff', color: '#000'}}
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
                                style={{width: '80%', justifyContent: 'center'}}
                                onPress={() => setSKUView(true)}>
                                <Text style={{color: '#000'}}>Select SKU</Text>
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
                                  style={{marginLeft: 9}}
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
                          <View style={{height: '80%'}}>
                            <FlatList
                              showsVerticalScrollIndicator={false}
                              data={selectedProduct}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={({item}) => (
                                <AddSingleProduct
                                  itemss={item}
                                  boxInCtn={boxFilter(item.variant.name)}
                                  del={id => {
                                    // Remove from existingProduct
                                    setExistingProduct(prevProducts =>
                                      prevProducts.filter(
                                        existingItem =>
                                          existingItem.itemss.item.id !== id,
                                      ),
                                    );

                                    // Remove from selectedProduct
                                    setSelectedProduct(prevProducts =>
                                      prevProducts.filter(
                                        selectedItem => selectedItem.id !== id,
                                      ),
                                    );

                                    // Remove from selectedSKUs
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
                              <Text style={{color: 'red'}}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                getLocation();
                              }}>
                              <Text style={{color: '#a0a0a0'}}>Confirm</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                  {view !== 'Stock Already Exist' ? ( // Removed extra space
                    <View style={{flexDirection: 'row', width: '100%'}}>
                      <TouchableOpacity
                        onPress={() => {
                          setMarkUnproductiveButton(false);
                        }}>
                        <Text style={{color: 'red', marginTop: 20}}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          getLocation();
                        }}
                        style={{marginLeft: 'auto'}}>
                        <Text style={{color: 'red', marginTop: 20}}>
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
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={SKUview}
        onRequestClose={closeSKUModal}>
        <View style={styles.modalSKUContainer}>
          <View style={styles.modalSKUContent}>
            <View style={styles.container}>
              <View style={{flexDirection: 'row'}}>
                <View style={{width: '75%'}}>
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
                    <Text style={{color: '#a0a0a0'}}>Done</Text>
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
                keyExtractor={(item, index) => index}
                renderItem={({item}) => (
                  <View style={styles.skuItem}>
                    <View style={{width: '10%'}}>
                      {/* {console.log(item)} */}
                      <CheckBox
                        value={selectedSKUs.includes(item.id)}
                        tintColors={'#9E663C'}
                        onCheckColor={'#6F763F'}
                        onFillColor={'#4DABEC'}
                        onTintColor={'#F4DCF8'}
                        onValueChange={() => toggleSelect(item.id)}
                      />
                    </View>
                    <TouchableOpacity
                      style={{width: '90%'}}
                      onPress={() => {
                        selectedSKUs.includes(item.id);
                        toggleSelect(item.id);
                        // console.log(selectedProduct, 'pp')

                        setSelectedProduct(prevProducts => [
                          ...prevProducts,
                          item,
                        ]);
                      }}>
                      <Text
                        style={
                          styles.skuText
                        }>{`${item.product.name} ${item.sku.name} ${item.variant.name}`}</Text>
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
                  <Text style={{fontSize: 16}}>
                    {selectedSKUs.length === 0 && (
                      <Text style={{color: '#000'}}>
                        Save without Selection
                      </Text>
                    )}
                    {selectedSKUs.length === 1 && (
                      <Text style={{color: '#000'}}>
                        Save SKU "{selectedSKUs[0]}"
                      </Text>
                    )}
                    {selectedSKUs.length > 1 && (
                      <Text style={{color: '#000'}}>
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
      </Modal>

      {isLoading ? <Loader /> : null}
    </View>
  );
};
const {height, width} = Dimensions.get('window');

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
