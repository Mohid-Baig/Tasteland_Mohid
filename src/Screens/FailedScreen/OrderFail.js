import React, {useEffect, useState} from 'react';
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
import {Remove_All_Cart} from '../../Components/redux/constants';
import {useSelector, useDispatch} from 'react-redux';
import {AddToCart} from '../../Components/redux/action';
const FailedOrdersScreen = ({route, navigation, userId}) => {
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
      dispatch({type: Remove_All_Cart}); // Clear cart when leaving the screen
    };
  }, [dispatch]);
  const loadFailedOrders = async () => {
    try {
      const storedFailedOrders = await AsyncStorage.getItem(
        `failedOrders_${userId}`,
      );

      if (storedFailedOrders) {
        const parsedOrders = JSON.parse(storedFailedOrders);
        // console.log(JSON.stringify(parsedOrders));

        if (Array.isArray(parsedOrders)) {
          setFailedOrders(parsedOrders);

          parsedOrders.forEach(item => {
            setdate(item.date);
            setLocation(item.location);
            setcartItems(item.cartItems);
          });
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

  const getProduct = async () => {
    setIsLoading(true);
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
      setAllProducts(response.data);
      // console.log(JSON.stringify(response.data), '---111----');
      console.log('data of allProducts successfully coming');
    } catch (error) {
      console.log('Error', error);
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
              order => order.unid !== uniqueId,
            );

            // Save the updated orders back to AsyncStorage
            saveFailedOrders(updatedOrders);

            Alert.alert('Success', 'Failed order deleted successfully!');
          },
        },
      ],
      {cancelable: true},
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
      {cancelable: true},
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
        Alert.alert('Success', 'Order created successfully!', [{text: 'OK'}]);

        // Remove the order from failed orders after a successful post
        const updatedOrders = failedOrders.filter(
          failedOrder => failedOrder.shop.id !== order.shop.id,
        );
        saveFailedOrders(updatedOrders); // Save updated orders to AsyncStorage
      } else {
        Alert.alert(
          'Error',
          'An error occurred while processing your request.',
        );
      }
    } catch (error) {
      console.log(error);
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
          failedOrder => failedOrder.shop.id !== item.shop.id,
        );
        saveFailedOrders(updatedOrders); // Save updated orders to AsyncStorage
      } else {
        Alert.alert('Error', 'An error occurred while updating the order.');
      }
    } catch (error) {
      console.log(error, 'error in updating fail edit data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadFailedOrders();
    }
  }, [userId]);

  const renderItem = ({item}) => {
    // console.log(item.totalPrice);
    const shopName = item?.shop ? item?.shop?.name : 'No Shop Info';
    const orderDate = item?.date ? formatDate(item.date) : 'No Date';

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
              {item.net_amount ?? item.totalPrice ?? '--'}
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
          <Text style={styles.errorText}>{item.error}</Text>
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={() => {
              if (item.id) {
                updateOrder(item);
              } else {
                postOrder(item);
              }
            }}>
            <MaterialCommunityIcons name="reload" color={'#16a4dd'} size={25} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              // console.log(JSON.stringify(item), 'Selected order');
              // console.log(JSON.stringify(cartItems), 'cartItems');
              console.log(
                item.details.forEach(it => {
                  it.id;
                }),
                'hello',
              );
              dispatch({type: Remove_All_Cart});
              item.details.forEach(val => {
                let pro = allProducts.filter(
                  valfil => valfil.pricing.id === val.pricing_id,
                );
                console.log(JSON.stringify(pro), 'pro');
                console.log(JSON.stringify(val), 'val');

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
                // cartItems: item,
                existingOrderId: item.id,
                Invoiceitems: {
                  date: item.date,
                  details: item.details,
                  id: item.id,
                  shop: item.shop,
                  totalCarton: item.totalCarton,
                  totalPrice: item.totalPrice,
                },
                Store: item.shop,
                RouteDate: orderDate,
                // cItems: item.cartItems,
              });
            }}>
            <MaterialIcons name="edit" color={'#16a4dd'} size={25} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log(item.unid);
              if (item.details && item.details.length > 0 && item.unid) {
                handleDeleteOrder(item.unid);
              } else {
                console.error('Order details are missing or invalid.');
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
            <Text style={styles.headerText}>Failed Requests</Text>
          </View>
          <TouchableOpacity
            style={[styles.DeleteContainer]}
            onPress={handleDeleteAllOrders}>
            <Text style={[styles.headerText, {fontSize: 13, marginRight: 12}]}>
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
          item.shop && item.shop.id
            ? item.shop.id.toString()
            : item.details && item.details[0]
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
    shadowOffset: {width: 0, height: 4},
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
