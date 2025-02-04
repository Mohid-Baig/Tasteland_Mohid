import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Loader from '../../Components/Loaders/Loader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import instance from '../../Components/BaseUrl';

const UnProductiveFail = ({userId}) => {
  const [failUNorders, setFailUNorders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFailedOrders = async () => {
    try {
      setIsLoading(true);
      const storedFailedUNOrders = await AsyncStorage.getItem(
        `failedUnProductiveOrders_${userId}`,
      );

      if (storedFailedUNOrders) {
        const parsedOrders = JSON.parse(storedFailedUNOrders);
        if (Array.isArray(parsedOrders)) {
          setFailUNorders(parsedOrders);
        }
        console.log(JSON.stringify(parsedOrders));
      } else {
        console.log('No failed unproductive orders found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error loading failed unproductive orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadFailedOrders();
    }
  }, [userId]);

  const Post = async (view, data) => {
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const fk_employee = await AsyncStorage.getItem('fk_employee');
    const userId = await AsyncStorage.getItem('userId');
    try {
      setIsLoading(true);
      const payload = {
        reason: data?.reason,
        rejection_type: data.rejection_type,
        lat: data.lat,
        lng: data.lng,
        fk_shop: data.fk_shop,
        fk_employee: data.fk_employee,
        details:
          data.details && data.details.length > 0
            ? data.details.map(item => ({
                carton: item.carton || 0,
                box: item.box || 0,
                fk_pricing: item.fk_pricing || 0,
              }))
            : [],
      };

      const response = await instance.post(
        '/unproductive_visit',
        JSON.stringify(payload),
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      console.log(response.status);
      if (response.status === 200) {
        console.log('Post successful', response.data);
        Alert.alert('Success', 'UnProductive Order created successfully!', [
          {text: 'OK'},
        ]);

        const storedOrders = await AsyncStorage.getItem(
          `failedUnProductiveOrders_${userId}`,
        );
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders);
          parsedOrders.splice(itemIndex, 1); // Remove the item at the specific index
          await AsyncStorage.setItem(
            `failedUnProductiveOrders_${userId}`,
            JSON.stringify(parsedOrders),
          );

          const updatedOrders = [...failUNorders];
          updatedOrders.splice(itemIndex, 1);
          setFailUNorders(updatedOrders);
        }
      }
    } catch (err) {
      console.log(err, 'error in unproductive fail screen');
      Alert.alert('Error', 'An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = item => {
    Post(item.View, item.Data);
  };

  const handleDeleteItem = async itemIndex => {
    try {
      const updatedOrders = [...failUNorders];
      updatedOrders.splice(itemIndex, 1); // Remove the item from the list
      setFailUNorders(updatedOrders); // Update state with the new list

      // Remove the specific item from AsyncStorage
      const storedOrders = await AsyncStorage.getItem(
        `failedUnProductiveOrders_${userId}`,
      );
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        parsedOrders.splice(itemIndex, 1); // Remove the item from the stored list
        await AsyncStorage.setItem(
          `failedUnProductiveOrders_${userId}`,
          JSON.stringify(parsedOrders),
        );
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Render Item with reload and delete buttons
  const renderItem = ({item, index}) => {
    const {View: viewName, Data} = item; // Destructure the data properly
    const isStockAlreadyExist = viewName === 'Stock Already Exist';

    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{viewName}</Text>

          {isStockAlreadyExist ? (
            <>
              {Data.details && Data.details.length > 0 ? (
                Data.details.map((detail, idx) => (
                  <View key={idx}>
                    <Text style={styles.cardText}>
                      Carton: {detail.carton || 'N/A'}
                    </Text>
                    <Text style={styles.cardText}>
                      Box: {detail.box || 'N/A'}
                    </Text>
                    <Text style={styles.cardText}>
                      Pricing: {detail.fk_pricing || 'N/A'}
                    </Text>
                    <Text style={styles.cardText}>
                      Shop_id: {Data?.fk_shop}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardText}>Carton: N/A</Text>
                  <Text style={styles.cardText}>Box: N/A</Text>
                  <Text style={styles.cardText}>Pricing: N/A</Text>
                  <Text style={styles.cardText}>
                    Shop_id: {Data.fk_shop || 'N/A'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.cardText}>
                Reason: {Data?.reason || 'N/A'}
              </Text>
              <Text style={styles.cardText}>
                Rejection Type: {Data?.rejection_type}
              </Text>
              <Text style={styles.cardText}>Shop Id: {Data?.fk_shop}</Text>
            </>
          )}

          <View
            style={{
              justifyContent: 'space-around',
              alignItems: 'flex-end',
              flexDirection: 'row',
              marginTop: 5,
            }}>
            <TouchableOpacity onPress={() => handleReload(item)}>
              <MaterialCommunityIcons
                name="reload"
                color={'#16a4dd'}
                size={25}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteItem(index)}>
              <Entypo name="circle-with-cross" color={'red'} size={25} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
              await AsyncStorage.removeItem(
                `failedUnProductiveOrders_${userId}`,
              );
              setFailUNorders([]);
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

  return (
    <View style={styles.container}>
      {failUNorders.length > 0 ? (
        <View>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Failed UnProductive Orders</Text>
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
          <Text style={styles.noDataText}>
            Failed UnProductive Orders will appear here
          </Text>
        </View>
      )}

      <FlatList
        showsVerticalScrollIndicator={false}
        data={failUNorders}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />

      {isLoading ? (
        <Loader backgroundColor={''} indicatorColor={'#16a4dd'} />
      ) : null}
    </View>
  );
};

export default UnProductiveFail;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  cardContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  card: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  cardText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
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
    // alignItems: 'center',
    top: '85%',
    flexDirection: 'row',
  },
  noDataText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
    marginLeft: 5,
    marginTop: 2,
    textAlign: 'center',
  },
});
