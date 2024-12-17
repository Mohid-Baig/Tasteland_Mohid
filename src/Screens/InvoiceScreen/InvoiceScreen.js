import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Button,
  TouchableWithoutFeedback,
} from 'react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import CalendarPicker from 'react-native-calendar-picker';
import {Picker} from '@react-native-picker/picker';
import MyTabs from '../../Navigations/TopTab/MyTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';
import Loader from '../../Components/Loaders/Loader';
import AntDesign from 'react-native-vector-icons/AntDesign';

const InvoiceScreen = ({route}) => {
  const [weekDates, setWeekDates] = useState({startDate: null, endDate: null});
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [shopRoute, setShopRoute] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [allroute, setAllRoute] = useState([]);
  const [AllShops, setAllShops] = useState([]);
  const [territorialData, setTerritorialData] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRouteCrossCircle, setShowRouteCrossCircle] = useState(false);
  const [showShopCrossCircle, setShowShopCrossCircle] = useState(false);
  const [routeID, setRouteID] = useState();
  const [shopID, setShopID] = useState();
  const {orderBokerId} = route.params;
  const sevenDaysFromToday = new Date();
  sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);

  const onDateChange = date => {
    setSelectedDate(date);
  };

  const routePickerRef = useRef();
  const shopPickerRef = useRef();
  const bottomSheetRef = useRef(null);
  const snapPoints = ['77%', '100%'];

  const handleSheetChanges = useCallback(index => {
    console.log('Bottom Sheet index: ', index);
  }, []);

  const handleOutsidePress = () => {
    if (isPickerOpen) {
      setIsPickerOpen(false);
    }
  };

  const handlePickerOpen = () => {
    setIsPickerOpen(true);
  };

  const handleDateChange = selectedDate => {
    console.log(selectedDate, 'selectedDate');
    if (selectedDate) {
      // setshops(selectedDate);
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

  const getTerritorial = async () => {
    setIsLoading(true);
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    try {
      const response = await instance.get(
        `/radar_flutter/territorial/${orderBokerId}?start_date=${weekDates.startDate}&end_date=${weekDates.endDate}`,
        {
          headers: {Authorization: `Bearer ${authToken}`},
        },
      );
      const rawTerritorialData = response.data;
      // console.log(JSON.stringify(response.data), 'Mohid Baig');

      let FilterRoute = [];
      rawTerritorialData.pjp_shops.forEach(val => {
        if (val.pjp_shops.route_shops.length > 0) {
          val.pjp_shops.route_shops.forEach(routeData => {
            FilterRoute.push(routeData.route);
          });
        }
      });
      setAllRoute(FilterRoute);

      setTerritorialData(rawTerritorialData);
    } catch (error) {
      console.error('Error in territorial data:', error);
      console.log('Error in territorial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (weekDates.startDate && weekDates.endDate && orderBokerId) {
      getTerritorial();
    }
  }, [weekDates, orderBokerId]);

  const handleRouteChange = itemValue => {
    console.log('Selected Route:', itemValue);
    setShopRoute(itemValue);
    const routeId = itemValue.id;
    // setRouteID(routeID);

    let FilterShops = [];
    territorialData.pjp_shops.forEach(val => {
      if (val.pjp_shops.route_shops.length > 0) {
        val.pjp_shops.route_shops.forEach(routeData => {
          if (routeData.route.id === routeId) {
            console.log('Route Matched:', routeData.route.id);
            setRouteID(routeData.route.id);
            routeData.shops.forEach(shop => {
              FilterShops.push(shop);
            });
          }
        });
      }
    });
    // console.log('Filtered Shops:', FilterShops); // Log filtered shops
    setAllShops(FilterShops);
    setSelectedShop(null);
    setShowRouteCrossCircle(true); // Show the cross icon for the route picker
    setShowShopCrossCircle(false);
  };
  const handleShopChange = itemValue => {
    console.log('Selected Shop:', itemValue);
    setSelectedShop(itemValue);
    setShopID(itemValue.id);
    setShowShopCrossCircle(true); // Show the cross icon for the shop picker
  };
  return (
    <TouchableWithoutFeedback onPress={() => handleOutsidePress()}>
      <View style={{flex: 1}}>
        <View style={styles.selection_main}>
          <View style={styles.chosen_container}>
            <View style={styles.option_container}>
              <Text style={[styles.option_text]}>Order Date</Text>
            </View>
            <View style={styles.selected_container}>
              <TouchableOpacity onPress={() => setIsCalendarVisible(true)}>
                <Text style={styles.selected_text}>
                  {selectedDate ? selectedDate.toDateString() : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <View style={styles.bottom_line} />
            </View>
          </View>

          {/* Route Picker */}
          <View style={styles.chosen_container}>
            <View style={styles.option_container}>
              <Text style={styles.option_text}>Route</Text>
              {showRouteCrossCircle && (
                <TouchableOpacity
                  onPress={() => {
                    setShopRoute(null);
                    setShowRouteCrossCircle(false);
                    setRouteID();
                  }}>
                  <AntDesign name="closecircle" size={24} color={'#fff'} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.selected_container}>
              <Picker
                selectedValue={shopRoute}
                onValueChange={itemValue => {
                  handleRouteChange(itemValue);
                }}
                style={styles.picker}>
                <Picker.Item label="Select Route" value={null} />
                {allroute.map((route, index) => (
                  <Picker.Item key={index} label={route.name} value={route} />
                ))}
              </Picker>
              <View style={styles.bottom_line} />
            </View>
          </View>

          {/* Shop Picker */}
          <View style={styles.chosen_container}>
            <View style={styles.option_container}>
              <Text style={styles.option_text}>Shop</Text>
              {showShopCrossCircle && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedShop(null);
                    setShowShopCrossCircle(false);
                    setShopID();
                  }}>
                  <AntDesign name="closecircle" size={24} color={'#fff'} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.selected_container}>
              <Picker
                selectedValue={selectedShop}
                onValueChange={itemValue => {
                  handleShopChange(itemValue);
                }}
                style={styles.picker}>
                <Picker.Item label="Select Shop" value={null} />
                {AllShops.map((shop, index) => (
                  <Picker.Item
                    key={index}
                    label={`${index + 1}.  ${shop.name} (${shop.category})`}
                    value={shop}
                  />
                ))}
              </Picker>
              <View style={styles.bottom_line} />
            </View>
          </View>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isCalendarVisible}
          onRequestClose={() => setIsCalendarVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setIsCalendarVisible(false)}>
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.calendarContainer}>
                  <CalendarPicker
                    startFromMonday={true}
                    allowRangeSelection={false}
                    minDate={new Date(2000, 0, 1)}
                    maxDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                    todayBackgroundColor="#f2e6ff"
                    selectedDayColor="#7300e6"
                    selectedDayTextColor="#FFFFFF"
                    onDateChange={date => {
                      onDateChange(date);
                      setIsCalendarVisible(false);
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enableOverDrag={false}
          handleComponent={null}>
          <MyTabs
            selectedDate={selectedDate}
            orderBokerId={orderBokerId}
            routeID={routeID}
          />
        </BottomSheet> */}
        <MyTabs
          selectedDate={selectedDate}
          orderBokerId={orderBokerId}
          routeID={routeID}
          shopID={shopID}
        />
        {isLoading ? <Loader /> : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default InvoiceScreen;
const styles = StyleSheet.create({
  selection_main: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  chosen_container: {
    width: '90%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  option_container: {
    width: '30%',
    height: 40,
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  selected_container: {
    width: '70%',
    height: 40,
    justifyContent: 'flex-end',
  },
  option_text: {
    color: 'white',
    fontSize: 17,
  },
  selected_text: {
    color: 'black',
    fontSize: 17,
    marginLeft: 16,
    marginBottom: 12,
  },
  bottom_line: {
    width: '100%',
    height: 1,
    backgroundColor: 'black',
  },
  picker_style: {
    height: 40,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '95%',
  },
});
