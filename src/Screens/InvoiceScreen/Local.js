import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Local = ({selectedDate}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [LocalApi, setLocalApi] = useState([]);
  const [formattedDate, setFormattedDate] = useState('');

  // Helper function to format the date to 'YYYY-MM-DD'
  const formatDateToYYYYMMDD = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to save both data and date to AsyncStorage
  const saveDataToLocalStorage = async (data, date) => {
    try {
      const stringifyData = JSON.stringify({data, date});
      const userId = await AsyncStorage.getItem('userId');
      await AsyncStorage.setItem(`LocalApiData_${userId}`, stringifyData);
      console.log('Data and date saved to local storage');
    } catch (error) {
      console.error('Error saving data to AsyncStorage', error);
    }
  };

  // Function to load both data and date from AsyncStorage
  const loadDataFromLocalStorage = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log(userId);
      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const savedData = await AsyncStorage.getItem(`LocalApiData_${userId}`);
      if (savedData) {
        const {data, date} = JSON.parse(savedData);
        setLocalApi(data);
        setFormattedDate(date);
        console.log('Loaded data and date from local storage');
      } else {
        setLocalApi([]);
        setFormattedDate('');
        console.log('No data found in local storage');
      }
    } catch (error) {
      console.error('Error loading data from AsyncStorage', error);
    }
  };

  // Function to fetch data from the API
  const getLocalData = async () => {
    setIsLoading(true);
    try {
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const fkEmployee = await AsyncStorage.getItem('fk_employee');
      const formattedDateStr = selectedDate
        ? formatDateToYYYYMMDD(selectedDate)
        : '';

      if (!formattedDateStr) {
        console.warn('Selected date is not provided');
        setLocalApi([]);
        return;
      }

      const response = await instance.get(
        `/secondary_order/all?employee_id=${fkEmployee}&include_shop=true&include_detail=true&order_date=${formattedDateStr}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        setLocalApi(response.data);
        setFormattedDate(formattedDateStr);
        await saveDataToLocalStorage(response.data, formattedDateStr); // Save data and date
        console.log('Data fetched and saved successfully');
      } else {
        throw new Error(`API responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching data from API in local screen:', error);
      await loadDataFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      getLocalData();
    } else {
      loadDataFromLocalStorage();
    }
  }, [selectedDate]);

  return (
    <View style={styles.main}>
      {isLoading ? (
        <ActivityIndicator size={60} color={'#ccc'} />
      ) : (
        <FlatList
          contentContainerStyle={{paddingBottom: 60}}
          data={LocalApi}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <View style={styles.flatlistbackground}>
              <View style={styles.FlatList}>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Invoice #</Text>
                  <Text style={{color: 'black'}}>{item.id}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Shop</Text>
                  <Text style={{color: 'black'}}>{item.shop.name}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Order Date</Text>
                  <Text style={{color: 'black'}}>{formattedDate}</Text>
                </View>
              </View>
              <View style={styles.FlatList}>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Status</Text>
                  <Text style={{color: 'black'}}>{item.status}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Gross Amount</Text>
                  <Text
                    style={{color: 'black'}}>{`${item.gross_amount}.00`}</Text>
                </View>
                <View style={styles.centre}>
                  <Text style={{color: 'black'}}>Net Amount</Text>
                  <Text style={{color: 'black'}}>{item.net_amount}</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={item => item.id.toString()}
        />
      )}
    </View>
  );
};

export default Local;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  FlatList: {
    paddingVertical: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  flatlistbackground: {
    backgroundColor: '#f8f8f8',
    borderRadius: 1,
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderBottomWidth: 0.5,
    // marginBottom: 1,
    marginVertical: 2,
  },
  centre: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
