import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  Alert,
} from 'react-native';
import {TextInput, Button} from 'react-native-paper';
import {Picker} from '@react-native-picker/picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import moment from 'moment';
import {ScrollView} from 'react-native-gesture-handler';
import Loader from '../../Components/Loaders/Loader';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

const SHOPS_STORAGE_KEY = 'OFFLINE_SHOPS';
const SHOP_TYPES_STORAGE_KEY = 'SHOP_TYPES';
const ROUTES_STORAGE_KEY = 'ROUTES';
const PENDING_SHOP_EDITS_KEY = 'PENDING_SHOP_EDITS';
const AddNewShop = ({route}) => {
  const navigation = useNavigation();
  const [errors, setErrors] = useState({});
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState(null);
  const [category, setCategory] = useState('');
  const [shopRoute, setShopRoute] = useState('');
  const [owner, setOwner] = useState('');
  const [address, setAddress] = useState('');
  const [cell, setCell] = useState('');
  const [landline, setLandline] = useState(null);
  const [email, setEmail] = useState(null);
  const [shelf, setShelf] = useState(null);
  const [ntn, setntn] = useState(null);
  const [AllShops, setAllShops] = useState([]);
  const [territorialData, setTerritorialData] = useState(null);
  const [weekDates, setWeekDates] = useState({startDate: null, endDate: null});
  const [currentDate, setCurrentDate] = useState();
  const [shops, setshops] = useState(null);
  const [allroute, setAllRoute] = useState([]);
  const [pickerData, selectedPickerDate] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [offlineShops, setOfflineShops] = useState([]);
  const [shopData, setShopData] = useState(null);
  const [isSynced, setIsSynced] = useState(false);
  const {orderBokerId} = route.params;
  const [edited, isEdited] = useState(false);
  // console.log('Received orderBokerId in AddNewShop:', orderBokerId);
  // const  orderBokerId  =AsyncStorage.getItem('orderBokerId');
  // console.log(orderBokerId, 'orderBokerId');
  let isPendingEditsProcessing = false; // Declare the variable globally

  const validateForm = () => {
    const newErrors = {};
    if (!shopName.trim()) newErrors.shopName = 'Shop Name is required';
    if (!shopType) newErrors.shopType = 'Shop Type is required';
    if (!category) newErrors.category = 'Category is required';
    if (!shopRoute) newErrors.shopRoute = 'Shop Route is required';
    if (!owner.trim()) newErrors.owner = 'Owner is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!cell.trim()) newErrors.cell = 'Cell number is required';
    return newErrors;
  };

  const categories = [
    'Karyana Store',
    'General Store',
    'Pan Shop',
    'Tea Store',
    'Bakery',
    'Super Store',
    'Canteen',
    'Medical Store',
    'Tea Stall',
    'Others',
    'Mart',
    'Kiryana Store',
    'Departmental Store',
    'Bakers',
    'Book Depot',
    'Tuc Shop',
    'Confectionary',
    'Book Deport',
    'Tuck Shop',
    'Kiryana Shop',
    'Phototstate',
  ];

  const fetchShopType = async () => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const shopTypeDataKey = `ShopTypeData_${userId}`;
      const ShopTypeDataJson = await AsyncStorage.getItem(shopTypeDataKey);

      if (ShopTypeDataJson !== null) {
        const ShopTypeData = JSON.parse(ShopTypeDataJson);
        setAllShops(ShopTypeData);
        console.log('Offline shop type Data retrieved:', ShopTypeData);
        return ShopTypeData;
      } else {
        console.log('No offline data found for key:', shopTypeDataKey);
      }
    } catch (error) {
      console.error('Error fetching offline shop type data:', error);
    }
    return null;
  };

  const getAllShops = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);

      if (state.isConnected) {
        // Fetching data online
        const response = await instance.get(
          '/shop_type/all?sort_alphabetically=true',
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
        setAllShops(response.data);
        await saveShopTypesToAsyncStorage(response.data); // Save when online
        console.log('Online shop data:', response.data);
      } else {
        // Fetching offline data
        const shoptypeD = await fetchShopType();
        if (shoptypeD) {
          setAllShops(shoptypeD);
          console.log('Offline data set to state:', shoptypeD);
        } else {
          console.log('No offline data found to set.');
        }
      }
    } catch (error) {
      console.log('Error fetching shop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllShops();
  }, []);

  const handleDateChange = selectedDate => {
    console.log(selectedDate, 'selectedDate');
    selectedPickerDate(selectedDate); // Assuming this is a state setter or similar function
    if (selectedDate) {
      setshops(selectedDate);
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
    // console.log(currentDate, 'currentDate')
    if (currentDate) {
      const {startDate, endDate} = getMondayToSundayWeek(currentDate);
      setWeekDates({
        startDate: formatDateToYYYYMMDD(startDate),
        endDate: formatDateToYYYYMMDD(endDate),
      });
    }
  }, [currentDate]);

  const saveShopTypesToAsyncStorage = async shopTypes => {
    try {
      await AsyncStorage.setItem(
        SHOP_TYPES_STORAGE_KEY,
        JSON.stringify(shopTypes),
      );
      console.log('Shop types saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving shop types:', error);
    }
  };

  const getShopTypesFromAsyncStorage = async () => {
    try {
      const shopTypes = await AsyncStorage.getItem(SHOP_TYPES_STORAGE_KEY);
      return shopTypes ? JSON.parse(shopTypes) : [];
    } catch (error) {
      console.error('Error retrieving shop types:', error);
      return [];
    }
  };

  // Routes
  const saveRoutesToAsyncStorage = async routes => {
    try {
      await AsyncStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
      console.log('Routes saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving routes:', error);
    }
  };

  const getRoutesFromAsyncStorage = async () => {
    try {
      const routes = await AsyncStorage.getItem(ROUTES_STORAGE_KEY);
      return routes ? JSON.parse(routes) : [];
    } catch (error) {
      console.error('Error retrieving routes:', error);
      return [];
    }
  };

  const saveShopToAsyncStorage = async shop => {
    try {
      const existingShops = await AsyncStorage.getItem(SHOPS_STORAGE_KEY);
      let shops = existingShops ? JSON.parse(existingShops) : [];
      shops.push(shop);
      await AsyncStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(shops));
      // console.log('Shop saved to AsyncStorage');
      // console.log(JSON.stringify(shops), 'Stored Shops in Async storage');
    } catch (error) {
      console.log('Error saving shop to AsyncStorage:', error);
    }
  };

  // const getShopsFromAsyncStorage = async () => {
  //   try {
  //     const existingShops = await AsyncStorage.getItem(SHOPS_STORAGE_KEY);
  //     return existingShops ? JSON.parse(existingShops) : [];
  //   } catch (error) {
  //     console.log('Error retrieving shops from AsyncStorage:', error);
  //     return [];
  //   }
  // };

  const updateShopInAsyncStorage = async updatedShop => {
    try {
      const existingShops = await AsyncStorage.getItem(SHOPS_STORAGE_KEY);
      let shops = existingShops ? JSON.parse(existingShops) : [];
      const index = shops.findIndex(shop => shop.id === updatedShop.id);
      if (index !== -1) {
        shops[index] = updatedShop;
        await AsyncStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(shops));
        console.log('Shop updated in AsyncStorage');
      }
    } catch (error) {
      console.log('Error updating shop in AsyncStorage:', error);
    }
  };

  const saveMultipleShopsToAsyncStorage = async shops => {
    try {
      const existingShops = await AsyncStorage.getItem(SHOPS_STORAGE_KEY);
      let currentShops = existingShops ? JSON.parse(existingShops) : [];

      // Filter out any duplicates based on unique identifier, e.g., shop.id
      const newShops = shops.filter(
        newShop =>
          !currentShops.some(existingShop => existingShop.id === newShop.id),
      );

      currentShops = [...currentShops, ...newShops];

      await AsyncStorage.setItem(
        SHOPS_STORAGE_KEY,
        JSON.stringify(currentShops),
      );
      console.log('Multiple shops saved to AsyncStorage');
      // console.log(
      //   JSON.stringify(currentShops),
      //   'Exsisting shops that are saved in asyncStorage',
      // );
    } catch (error) {
      console.log('Error saving multiple shops to AsyncStorage:', error);
    }
  };

  useEffect(() => {
    // Load offline shops from AsyncStorage when component mounts
    const loadOfflineShops = async () => {
      try {
        const storedShops = await AsyncStorage.getItem('offlineShops');
        if (storedShops !== null) {
          setOfflineShops(JSON.parse(storedShops));
        }
      } catch (e) {
        console.error('Failed to load offline shops:', e);
      }
    };

    loadOfflineShops();

    // Subscribe to network status changes to sync offline shops
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncOfflineShops();
      }
    });

    return () => unsubscribe();
  }, []);

  const syncOfflineShops = async () => {
    if (offlineShops.length > 0) {
      // Automatically submit saved shops when back online
      offlineShops.forEach(async shop => {
        try {
          await submitShopToServer(shop);
        } catch (e) {
          console.error('Failed to sync shop:', e);
        }
      });
      // Clear offline shops after syncing
      await AsyncStorage.removeItem('offlineShops');
      setOfflineShops([]);
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

  const getTerritorial = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);

      if (state.isConnected) {
        const response = await instance.get(
          `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
        setTerritorialData(response.data);
      } else {
        const offlineData = await fetchOfflineRouteData();
        if (offlineData) {
          setTerritorialData(offlineData);
        } else {
          console.log('No offline data available.');
        }
      }
    } catch (error) {
      console.log('Error in route territorial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the processing of territorial data in a separate useEffect
  useEffect(() => {
    if (territorialData) {
      // Filtering routes
      let FilterRoute = [];
      territorialData?.pjp_shops?.forEach(val => {
        if (val?.pjp_shops?.route_shops?.length > 0) {
          val?.pjp_shops?.route_shops?.forEach(val_2 => {
            FilterRoute.push(val_2?.route);
          });
        }
      });
      setAllRoute(FilterRoute);
      saveRoutesToAsyncStorage(FilterRoute);

      // Saving shops data
      let exsistingShopsSaving = [];
      territorialData?.pjp_shops?.forEach(val => {
        if (val?.pjp_shops?.route_shops?.length > 0) {
          val?.pjp_shops?.route_shops?.forEach(val_2 => {
            val_2?.shops?.forEach(val_3 => {
              exsistingShopsSaving.push(val_3);
            });
          });
        }
      });
      saveMultipleShopsToAsyncStorage(exsistingShopsSaving);
    }
  }, [territorialData]); // This useEffect triggers when territorialData is updated

  // Fetch territorial data based on weekDates and orderBokerId
  useEffect(() => {
    if (weekDates.startDate && weekDates.endDate && orderBokerId) {
      console.log('Fetching territorial data...');
      getTerritorial();
    }
  }, [weekDates, orderBokerId]);
  // Remove extra logs

  const loadShopTypesAndRoutes = async () => {
    setIsLoading(true);
    try {
      // Attempt to retrieve Shop Types from AsyncStorage
      let storedShopTypes = await getShopTypesFromAsyncStorage();
      if (storedShopTypes.length === 0) {
        // If not found, fetch from API
        const fetchedShopTypes = await getAllShops();
        // await saveShopTypesToAsyncStorage(fetchedShopTypes);
        storedShopTypes = fetchedShopTypes;
      }
      setAllShops(storedShopTypes);

      // Attempt to retrieve Routes from AsyncStorage
      let storedRoutes = await getRoutesFromAsyncStorage();
      if (storedRoutes.length === 0) {
        // If not found, fetch from API
        const fetchedRoutes = await getTerritorial();
        // await saveRoutesToAsyncStorage(fetchedRoutes);
        storedRoutes = fetchedRoutes;
      }
      setAllRoute(storedRoutes);
    } catch (error) {
      console.error('Error loading shop types and routes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadShopTypesAndRoutes();
  }, []);

  const savePendingEdit = async editPayload => {
    try {
      const existingEdits = await AsyncStorage.getItem(PENDING_SHOP_EDITS_KEY);
      const pendingEdits = existingEdits ? JSON.parse(existingEdits) : [];
      pendingEdits.push(editPayload);
      await AsyncStorage.setItem(
        PENDING_SHOP_EDITS_KEY,
        JSON.stringify(pendingEdits),
      );
      console.log('Pending edit saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving pending edit:', error);
    }
  };

  const processPendingEdits = async () => {
    try {
      const existingEdits = await AsyncStorage.getItem(PENDING_SHOP_EDITS_KEY);
      const pendingEdits = existingEdits ? JSON.parse(existingEdits) : [];

      if (pendingEdits.length === 0) {
        console.log('No pending edits to process');
        return;
      }

      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

      for (const edit of pendingEdits) {
        try {
          if (edit.id) {
            // Existing shop: PUT request
            const response = await instance.put(`/shop/${edit.id}`, edit, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            });
            await updateShopInAsyncStorage(response.data);
          } else {
            // New shop: POST request
            const response = await instance.post('/shop/', edit, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            });
            await saveShopToAsyncStorage(response.data);
          }
          console.log('Pending edit synced:', edit);
        } catch (error) {
          console.error('Error syncing pending edit:', error);
          // Decide whether to continue or halt based on your requirements
          continue;
        }
      }

      // Clear all pending edits after processing
      await AsyncStorage.removeItem(PENDING_SHOP_EDITS_KEY);
      console.log('All pending edits have been processed and cleared');
    } catch (error) {
      console.error('Error processing pending edits:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !isPendingEditsProcessing) {
        isPendingEditsProcessing = true; // Set flag to prevent multiple calls
        console.log('Network connected. Attempting to sync pending edits...');
        processPendingEdits()
          .then(() => {
            isPendingEditsProcessing = false; // Reset flag
          })
          .catch(() => {
            isPendingEditsProcessing = false; // Reset flag in case of error
          });
      }
    });

    // Initial check
    NetInfo.fetch().then(state => {
      if (state.isConnected && !isPendingEditsProcessing) {
        isPendingEditsProcessing = true; // Set flag to prevent multiple calls
        processPendingEdits()
          .then(() => {
            isPendingEditsProcessing = false; // Reset flag
          })
          .catch(() => {
            isPendingEditsProcessing = false; // Reset flag in case of error
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const currentDate = moment().toISOString();
    const {Item} = route.params || {};
    // console.log(Item);
    const payload = {
      name: shopName,
      category: category,
      owner: owner,
      address: address,
      email: email,
      cell: cell,
      landline: landline,
      shelf: shelf,
      ntn: ntn,
      active: true,
      credit_active: false,
      lat: 0,
      lng: 0,
      register_date: currentDate,
      activation_date: currentDate,
      fk_shop_type: shopType,
      fk_town: shopRoute.fk_town,
      route: {
        id: shopRoute.id,
        name: shopRoute.name,
        fk_town: shopRoute.fk_town,
      },
    };

    const payloadEdit = Item ? {...payload, id: Item.id} : payload;

    try {
      setIsLoading(true);
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);

      if (state.isConnected) {
        // Online: Attempt to make the API call
        const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
        let response;

        if (Item) {
          // Editing an existing shop
          response = await instance.put(`/shop/${Item.id}`, payloadEdit, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          await AsyncStorage.setItem(
            'EditShopResponse',
            JSON.stringify(response.data),
          );
          Alert.alert(
            'Success',
            'Shop Edited successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  StateEmpty();
                  navigation.goBack();
                },
              },
            ],
            {cancelable: true},
          );
          await updateShopInAsyncStorage(response.data);
        } else {
          // Creating a new shop
          response = await instance.post('/shop/', payload, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          await AsyncStorage.setItem(
            'NewShopResponse',
            JSON.stringify(response.data),
          );
          Alert.alert(
            'Success',
            'Shop created successfully!',
            [
              {
                text: 'OK',
                onPress: async () => {
                  StateEmpty();
                  navigation.goBack();
                  await saveShopToAsyncStorage(response.data);
                  console.log(response.data, 'jjjj');
                  console.log(shopType);
                },
              },
            ],
            {cancelable: true},
          );
        }
      } else {
        // Offline: Save the payload to AsyncStorage
        await savePendingEdit(payloadEdit);
        Alert.alert(
          'No Internet Connection',
          'Your changes have been saved locally and will be synced to the server as soon as you have an internet connection.',
          [
            {
              text: 'OK',
              onPress: () => {
                StateEmpty();
                navigation.goBack();
              },
            },
          ],
          {cancelable: true},
        );
      }
    } catch (error) {
      console.log('Error', error);
      Alert.alert(
        'Error',
        'An error occurred while processing your request.',
        [
          {
            text: 'OK',
            onPress: () => console.log('Error alert Ok clicked'),
          },
        ],
        {cancelable: true},
      );
    } finally {
      setIsLoading(false);
    }
  };
  const StateEmpty = () => {
    console.log('Ok Pressed');
    setShopName('');
    setCategory('');
    setShopType('');
    setShopRoute('');
    setCell('');
    setOwner('');
    setAddress('');
    setLandline('');
    setEmail('');
    setShelf('');
    setntn('');
  };
  useEffect(() => {
    if (route.params.Item) {
      const {Item} = route.params;
      const {routes} = route.params;
      setShopName(Item.name);
      setCategory(Item.category);
      if (Item.shop_type) {
        setShopType(Item.shop_type.id);
      }
      if (routes) {
        setShopRoute(routes);
      }
      setCell(Item.cell);
      setOwner(Item.owner);
      setAddress(Item.address);
      setLandline(Item.landline);
      setEmail(Item.email);
      setShelf(Item.shelf);
      setntn(Item.ntn);
      isEdited(true);
    }
  }, [route.params]);
  return (
    <View>
      <View style={styles.Add_cont}>
        <View style={styles.Add_row}>
          {edited ? (
            <TouchableOpacity
              style={[
                styles.Add_col,
                {
                  height: 60,
                  width: 60,
                  borderRadius: 50,
                  backgroundColor: '#2196f3',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
              onPress={() => handleSubmit()}>
              <AntDesign name={'edit'} color={'#fff'} size={30} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.Add_col}
              onPress={() => handleSubmit()}>
              <AntDesign name={'checkcircle'} color={'#2196f3'} size={50} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {isLoading ? <Loader /> : null}
      <ScrollView style={styles.container}>
        <TextInput
          label="Shop Name *"
          value={shopName}
          onChangeText={setShopName}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />
        {errors.shopName && (
          <Text style={styles.errorText}>{errors.shopName}</Text>
        )}

        <View style={[styles.pickerContainer, styles.borderPickBottom]}>
          <Picker
            selectedValue={shopType} // Ensure this value is updated based on selection
            onValueChange={itemValue => {
              setShopType(itemValue);
              console.log(itemValue, 'shop picker');
            }}
            style={styles.picker}>
            <Picker.Item
              label="Select Shop Type"
              style={{color: '#000'}}
              value={null}
            />
            {AllShops?.length
              ? AllShops.map(shop => (
                  <Picker.Item
                    key={shop.id}
                    label={shop.name}
                    style={{color: 'grey'}}
                    value={shop.id}
                  />
                ))
              : null}
          </Picker>
        </View>
        {errors.shopType && (
          <Text style={styles.errorText}>{errors.shopType}</Text>
        )}

        <View style={[styles.pickerContainer, styles.borderPickBottom]}>
          <Picker
            selectedValue={category}
            onValueChange={itemValue => setCategory(itemValue)}
            style={styles.picker}>
            <Picker.Item
              label="Select Category"
              style={{color: '#000'}}
              value=""
            />
            {categories.map((category, index) => (
              <Picker.Item
                key={index}
                style={{color: 'grey'}}
                label={category}
                value={category}
              />
            ))}
          </Picker>
        </View>
        {errors.category && (
          <Text style={styles.errorText}>{errors.category}</Text>
        )}
        <View style={[styles.pickerContainer, styles.borderPickBottom]}>
          <Picker
            selectedValue={shopRoute} // The selected route will be shown here
            onValueChange={itemValue => {
              console.log(itemValue, 'Value of rout');
              setShopRoute(itemValue); // Update the picker display with the selected date
              handleDateChange(itemValue); // Update any other logic based on the selected route
            }}
            style={styles.picker}>
            <Picker.Item
              label="Select Route"
              style={{color: '#000'}}
              value=""
            />
            {allroute?.map((data, index) => (
              <Picker.Item
                key={index}
                style={{color: 'grey'}}
                label={data.name}
                value={data}
              />
            ))}
          </Picker>
        </View>
        {errors.shopRoute && (
          <Text style={styles.errorText}>{errors.shopRoute}</Text>
        )}

        <TextInput
          label="Owner *"
          value={owner}
          onChangeText={setOwner}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />
        {errors.owner && <Text style={styles.errorText}>{errors.owner}</Text>}

        <TextInput
          label="Address *"
          value={address}
          onChangeText={setAddress}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />
        {errors.address && (
          <Text style={styles.errorText}>{errors.address}</Text>
        )}

        <TextInput
          label="Cell *"
          value={cell}
          keyboardType="numeric"
          maxLength={11}
          onChangeText={setCell}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />
        {errors.cell && <Text style={styles.errorText}>{errors.cell}</Text>}

        <TextInput
          label="Landline"
          value={landline}
          keyboardType="numeric"
          onChangeText={setLandline}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
          maxLength={11}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />

        <TextInput
          label="Shelf"
          value={shelf}
          onChangeText={setShelf}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />

        <TextInput
          label="ntn"
          value={ntn}
          onChangeText={setntn}
          style={[styles.input, styles.borderBottom]}
          selectionColor="#000"
          cursorColor="#2196f3"
          activeUnderlineColor="#2196f3"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    padding: 16,
    backgroundColor: '#cccccc',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    color: '#000',
  },
  button: {
    marginTop: 16,
  },
  borderPickBottom: {
    borderBottomColor: 'black',
    borderBottomWidth: 1,
  },
  Add_cont: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 100,
  },
  Add_row: {
    marginRight: 20,
    marginBottom: 20,
  },
  Add_col: {},
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
});

export default AddNewShop;
