import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../../Components/Loaders/Loader';
import instance from '../../Components/BaseUrl';
import ViewInvoice from '../InvoiceScreen/ViewInvoice';
import { Remove_All_Cart } from '../../Components/redux/constants';
import { useSelector, useDispatch } from 'react-redux';
import { AddToCart } from '../../Components/redux/action';
import NetInfo from '@react-native-community/netinfo';
const FailedOrdersScreen = ({ route, navigation, userId }) => {
  //   const {userId} = route.params;
  const [failedOrders, setFailedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setdate] = useState();
  const [cartItems, setcartItems] = useState();
  const [details, setDetails] = useState();
  const [location, setLocation] = useState();
  const [allProducts, setAllProducts] = useState([]);
  const dispatch = useDispatch();

  const formatDate = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    return () => {
      dispatch({ type: Remove_All_Cart }); // Clear cart when leaving the screen
    };
  }, [dispatch]);
  useEffect(() => {
    if (userId) {
      loadFailedOrders();
    }
  }, [userId]);

  const loadFailedOrders = async () => {
    try {
      const storedFailedOrders = await AsyncStorage.getItem(`failedOrders_${userId}`);
      console.log('Stored Failed Orders:', storedFailedOrders); // Log the stored data

      if (storedFailedOrders) {
        const parsedOrders = JSON.parse(storedFailedOrders);
        console.log('Parsed Orders:', JSON.stringify(parsedOrders)); // Log the parsed data

        if (Array.isArray(parsedOrders)) {
          setFailedOrders(parsedOrders);
        } else {
          console.error('Parsed data is not an array:', parsedOrders);
        }
      } else {
        console.log('No failed orders found in AsyncStorage.');
        setFailedOrders([]);
      }
    } catch (error) {
      console.error('Error loading failed orders:', error);
    }
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
  const getProduct = async () => {
    setIsLoading(true);
    const state = await NetInfo.fetch(); // Check network connectivity
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const userId = await AsyncStorage.getItem('userId');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    try {
      if (state.isConnected) {
        // If there's network, fetch data from API
        const response = await instance.get(
          `/distribution_trade/all_trade_pricing_active?distribution_id=${distributor_id}&current=true`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        // console.log(JSON.stringify(response.data), '-----');

        setAllProducts(response.data);
      } else {
        // If no internet, fetch from AsyncStorage
        const pricingDataKey = `pricingData_${userId}`;
        const storedProducts = await AsyncStorage.getItem(pricingDataKey);
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);

          setAllProducts(parsedProducts);
        } else {
          console.log('No products in AsyncStorage');
        }
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
  }, []);

  const saveFailedOrders = async updatedOrders => {
    try {
      await AsyncStorage.setItem(
        `failedOrders_${userId}`,
        JSON.stringify(updatedOrders),
      );
      setFailedOrders(updatedOrders);
    } catch (error) {
      console.error('Error saving failed orders:', error);
    }
  };

  const handleDeleteOrder = uniqueId => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this order?',
      [
        {
          text: 'No',
          onPress: () => console.log('Delete cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            console.log('Deleting order with uniqueId:', uniqueId);

            // Filter out the order using uniqueId
            const updatedOrders = failedOrders.filter(
              order => order?.order?.unid || order?.unid !== uniqueId,
            );

            // Save the updated orders back to AsyncStorage
            saveFailedOrders(updatedOrders);

            Alert.alert('Success', 'Failed order deleted successfully!');
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleDeleteAllOrders = async () => {
    Alert.alert(
      'Confirm Delete All',
      'Are you sure you want to delete all orders?',
      [
        {
          text: 'No',
          onPress: () => console.log('Delete all cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`failedOrders_${userId}`);
              setFailedOrders([]);
              Alert.alert('Success', 'All failed orders have been deleted!');
            } catch (error) {
              console.error('Error clearing all orders:', error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };
  const postOrder = async order => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const userId = await AsyncStorage.getItem('userId');
    if (!order || !authToken) {
      setIsLoading(false);
      Alert.alert('Error', 'Invalid order or missing authentication token.');
      return;
    }

    const payload = {
      date: order.date,
      lng: order.location.longitude,
      lat: order.location.latitude,
      fk_distribution: order.fk_distribution,
      fk_shop: order.shop.id,
      fk_orderbooker_employee: order.fk_orderbooker_employee,
      details: order.details.map(item => ({
        pricing_id: item.pricing_id,
        carton_ordered: item.carton_ordered,
        box_ordered: item.box_ordered,
      })),
    };

    console.log('Payload:', payload);

    try {
      const response = await instance.post(
        '/secondary_order',
        JSON.stringify(payload),
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      // console.log('Post Data', response.data);
      console.log(response.status, 'status');

      if (response.status === 200) {
        Alert.alert('Success', 'Order created successfully!', [{ text: 'OK' }]);

        // Remove the order from failed orders after a successful post
        const updatedOrders = failedOrders.filter(
          failedOrder => failedOrder.order.shop.id || failedOrder.shop.id !== order.shop.id,
        );
        saveFailedOrders(updatedOrders); // Save updated orders to AsyncStorage
        const postorderId = response.data.id;
        const shop_id = order.shop.id;
        const date = response.data.date
        const status = response.data.status
        await updateStoredOrderIds(userId, postorderId, shop_id, date, status);
      } else {
        Alert.alert(
          'Error',
          'An error occurred while processing your request.',
        );
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Session Expired',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      } else {
        console.log('Error in get product of failed screen', error);
      }
      Alert.alert('Error', 'An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrder = async item => {
    setIsLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    const data = {
      id: item.id,
      details: item.details,
      shop: item.shop,
    };

    try {
      const response = await instance.put(
        `/secondary_order/${item.id}`,
        JSON.stringify(data),
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      // console.log(response.data, 'Put data');
      console.log(response.status, 'status');

      if (response.status === 200) {
        Alert.alert('Success', 'Order updated successfully!');

        // Remove the order from failed orders after a successful update
        const updatedOrders = failedOrders.filter(
          failedOrder => failedOrder.order.shop.id || failedOrder.shop.id !== item.shop.id || item.order.shop.id,
        );
        saveFailedOrders(updatedOrders); // Save updated orders to AsyncStorage
      } else {
        Alert.alert('Error', 'An error occurred while updating the order.');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        ToastAndroid.showWithGravity(
          'Session Expired',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        TokenRenew();
      } else {
        console.log('Error in get product of failed screen', error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const updateStoredOrderIds = async (userId, newOrderId, shopId, date, status) => {
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
              postorderIds.push({ orderId: newOrderId, shopId: shopId, date: date, status: status });
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

  useEffect(() => {
    if (userId) {
      loadFailedOrders();
    }
  }, [userId]);

  const renderItem = ({ item }) => {
    const order = item.order || item; // Access the nested `order` object
    const shopName = order?.shop ? order?.shop?.name : 'No Shop Info';
    const orderDate = order?.date ? formatDate(order.date) : 'No Date';
    console.log(JSON.stringify(order), 'order it'); // Log the order data
    console.log(order.unid)
    return (
      <View style={styles.orderDetailContainer}>
        <View style={styles.orderInfoContainer}>
          <View style={[styles.center]}>
            <Text style={styles.infoLabel}>Shop</Text>
            <Text style={styles.infoValue}>{shopName}</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{orderDate}</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.infoLabel}>Net Amount</Text>
            <Text style={styles.infoValue}>
              {order.net_amount ?? order.totalPrice ?? '--'}
            </Text>
          </View>
        </View>
        <View style={styles.errorMessageContainer}>
          <Text style={styles.errorText}>
            Error: Pending order for shop: {shopName} exists on date:
          </Text>
          <Text style={styles.errorText}>{orderDate}</Text>
        </View>
        <View style={styles.errorMessageContainer}>
          <Text style={styles.errorText}>{order.error}</Text>
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={() => {
              if (order.id) {
                updateOrder(order);
              } else {
                postOrder(order);
              }
            }}>
            <MaterialCommunityIcons name="reload" color={'#16a4dd'} size={25} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              dispatch({ type: Remove_All_Cart });
              if (order.details && Array.isArray(order.details)) {
                order.details.forEach(val => {
                  let pro = allProducts.filter(
                    valfil => valfil.pricing.id === val.pricing_id,
                  );
                  let items = {
                    carton_ordered: val.carton_ordered,
                    box_ordered: val.box_ordered,
                    pricing_id: val.pricing_id,
                    itemss: pro[0],
                    pack_in_box: val.box_ordered,
                  };
                  dispatch(AddToCart(items));
                });

                navigation.navigate('CreateOrder', {
                  existingOrderId: order.id,
                  Invoiceitems: {
                    date: order.date,
                    details: order.details,
                    id: order.id,
                    shop: order.shop,
                    totalCarton: order.totalCarton,
                    totalPrice: order.totalPrice,
                  },
                  Store: order.shop,
                  RouteDate: orderDate,
                });
              } else {
                console.error('Order details are missing or invalid.');
              }
            }}>
            <MaterialIcons name="edit" color={'#16a4dd'} size={25} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (order.unid) {
                handleDeleteOrder(order.unid);
              } else {
                console.error('Order unique ID is missing.');
              }
            }}>
            <Entypo name="circle-with-cross" color={'red'} size={25} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {failedOrders.length > 0 ? (
        <View>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Failed Orders</Text>
          </View>
          <TouchableOpacity
            style={[styles.DeleteContainer]}
            onPress={handleDeleteAllOrders}>
            <Text style={[styles.headerText, { fontSize: 13, marginRight: 12 }]}>
              Delete All Orders
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <FontAwesome5
            name="exclamation-triangle"
            size={23}
            color={'#ff3333'}
          />
          <Text style={styles.noDataText}>Failed Orders will appear here</Text>
        </View>
      )}
      <FlatList
        showsVerticalScrollIndicator={false}
        data={failedOrders}
        keyExtractor={item =>
          item.order?.shop?.id
            ? item.order.shop.id.toString()
            : item.order?.details?.[0]?.pricing_id
              ? item.order.details[0].pricing_id.toString()
              : 'defaultKey' || item?.shop?.id
                ? item.shop.id.toString()
                : item?.details?.[0]?.pricing_id
                  ? item.details[0].pricing_id.toString()
                  : 'defaultKey'
        }
        renderItem={renderItem}
      />
      {isLoading ? (
        <Loader backgroundColor={''} indicatorColor={'#16a4dd'} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f2f2f2',
  },
  headerContainer: {
    paddingVertical: 8,
    backgroundColor: '#000',
    width: '100%',
    justifyContent: 'center',
    borderRadius: 5,
  },
  DeleteContainer: {
    paddingVertical: 8,
    backgroundColor: '#ff3333',
    width: '40%',
    justifyContent: 'center',
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 15,
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    top: '85%',
    flexDirection: 'row',
  },
  noDataText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
    marginLeft: 5,
    marginTop: 2,
  },
  orderDetailContainer: {
    paddingVertical: 10,
    width: '100%',
    backgroundColor: '#f8f8f8',
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  orderInfoContainer: {
    justifyContent: 'space-around',
    // alignItems: 'center',
    flexDirection: 'row',
    width: '100%', // Ensure it takes full width
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '33.33%',
    // height: '50%',
  },
  infoLabel: {
    fontSize: 16,
    color: '#000',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    flexWrap: 'wrap', // Ensures long text wraps
    width: '100%', // Allows the content to span the full width if needed
    textAlign: 'center', // Centers the wrapped text
  },
  errorMessageContainer: {
    marginLeft: 10,
    marginTop: 5,
  },
  errorText: {
    fontSize: 13,
    color: '#000',
  },
  actionContainer: {
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 5,
  },
});

export default FailedOrdersScreen;
