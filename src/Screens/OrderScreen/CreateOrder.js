import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AddProducts from '../../Components/CreateOrderComponent.js/AddProducts';
import BottomSheet from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ShowValues from '../../Components/CreateOrderComponent.js/ShowValues';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../../Components/Loaders/Loader';
import {useDispatch, useSelector} from 'react-redux';
import {AddToCart, RemoveAllCart} from '../../Components/redux/action';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {calendarFormat} from 'moment';
import SpecialDis from '../../Components/CreateOrderComponent.js/SpecialDis';
const CreateOrder = ({navigation, route}) => {
  const [openclosesearch, setopenclosesearch] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [productNaame, SetProductname] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [SelectedProductData, setSelectedProductData] = useState([]);
  const [totalPrice, setTotalprice] = useState(0);
  const {Store, shopData, Invoiceitems, existingOrderId, cItems} = route.params;
  const [searchText, setSearchText] = useState('');
  const [GrossAmount, setGrossAmount] = useState(0);
  const [distributiveDiscount, setDistributiveDiscount] = useState(null);
  const [FinalDistributiveDiscount, setFinalDistributiveDiscount] = useState(0);
  const [SpecaialDiscount, setSpecialDiscount] = useState([]);
  const [applySpecialDiscount, setApplySpecialDiscount] = useState(0);
  const [edited, isEdited] = useState(false);
  const dispatch = useDispatch();
  const [gst, setGst] = useState(0);
  const bottomSheetRef = useRef(null);
  const handleOpenPress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);
  // const cartItems =
  // const cartItems = route.params.cartItems;
  // console.log(Store, '///');
  // console.log(items);
  // console.log(cartItems, 'cartItems');
  // console.log(existingOrderId, 'Exsisting order id');
  // console.log(Invoiceitems, 'InvoiceItems');
  // Handle closing the Bottom Sheet

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
            },
          },
        ]);
      } else {
        console.log('Error in tokenRenew', error);
      }
    }
  };
  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);
  const handleBackdropPress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);
  const renderBackdrop = useCallback(
    props => (
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </TouchableWithoutFeedback>
    ),
    [handleBackdropPress],
  );
  // const cartItems = useSelector(state => state.reducer);
  const cartItems = route.params?.cItems || useSelector(state => state.reducer);

  // let cartItems; // Declare outside the block

  // if (route.params.cItems) {
  //   cartItems = route.params.cItems; // Assign conditionally
  // } else {
  //   cartItems = useSelector(state => state.reducer); // Assign conditionally
  // }
  // console.log(JSON.stringify(cartItems), 'cartItems...');
  useEffect(() => {
    // console.log(cartItems, 'Item');
    if (cartItems.length > 0) {
      // console.log(cartItems.length,'suh')
      let Product_Count = 0;
      let GrossAmount = 0;
      let TO_Discount = 0;
      let gst = 0;
      cartItems.forEach(item => {
        // console.log(item, 'Item kkk');
        Product_Count +=
          item?.itemss?.pricing?.trade_price *
            (item?.pack_in_box * item?.carton_ordered + item?.box_ordered) -
          (item?.itemss?.trade_offer / 100) *
            item?.itemss?.pricing?.trade_price;
        GrossAmount +=
          item?.itemss?.pricing?.trade_price *
          (item?.pack_in_box * item?.carton_ordered + item?.box_ordered);
        // console.log(
        //   item?.itemss?.pricing?.gst_base,
        //   'gst base console for time being',
        // );
        if (item?.itemss?.pricing?.gst_base === 'Retail Price') {
          gst =
            gst +
            item.itemss.pricing?.retail_price *
              (item?.pack_in_box * item?.carton_ordered + item?.box_ordered) *
              (item?.itemss?.pricing?.pricing_gst / 100);
          // console.log(gst, 'GST Price');
          // console.log(GrossAmount, '==');
        }
      });
      setTotalprice(Product_Count);
      setGrossAmount(GrossAmount);
      setSelectedProductData(cartItems);
      setGst(gst);
      // console.log(Product_Count,"Product Count");
      // dispatch(AddToCart(filteredData));
    } else {
      setTotalprice(0);
      setTotalprice(0);
      setGrossAmount(0);
      setGst(0);
    }
  }, [cartItems]);
  const updateSearch = search => {
    // setSearch(search);
    setSearchText(search);
    // console.log(search, 'search');
  };
  const togglesearch = () => {
    setopenclosesearch(!openclosesearch);
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
          `/distribution_trade/all?distribution_id=${distributor_id}&current=true`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        // console.log(JSON.stringify(response.data), '-----');

        let products = [];
        response.data.forEach(it => {
          if (it.pricing.active || it?.active == true) {
            products.push(it);
          }
        });
        console.log(JSON.stringify(products), 'products');
        console.log(products.length, 'products length');
        setAllProducts(products);
        // setAllProducts(response.data);

        const filteredData = [];
        const productNames = new Set();
        products.forEach(item => {
          if (!productNames.has(item.pricing.product.name)) {
            filteredData.push(item.pricing.product.name);
            productNames.add(item.pricing.product.name);
          }
        });
        SetProductname(filteredData);

        // Save the fetched data in AsyncStorage
      } else {
        // If no internet, fetch from AsyncStorage
        const pricingDataKey = `pricingData_${userId}`;
        const storedProducts = await AsyncStorage.getItem(pricingDataKey);
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          let products = [];
          parsedProducts.forEach(it => {
            if (it.pricing.active == true) {
              products.push(it);
            }
          });
          setAllProducts(products);
          const filteredData = [];
          const productNames = new Set();
          products.forEach(item => {
            if (!productNames.has(item.pricing.product.name)) {
              filteredData.push(item.pricing.product.name);
              productNames.add(item.pricing.product.name);
            }
          });
          // console.log(filteredData, 'filteredData');
          SetProductname(filteredData);
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

  const getDistributionDiscount = async () => {
    setIsLoading(true);
    const state = await NetInfo.fetch(); // Check network connectivity
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const userId = await AsyncStorage.getItem('userId');
    try {
      if (state.isConnected) {
        // If there's network, fetch data from API
        const response = await instance.get(
          `/discount_slab/all?distribution_id=${distributor_id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        console.log(response.data, 'distributerdiscount - -');

        // Ensure the response is in array format
        const discountData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Clear existing discount data
        setDistributiveDiscount([]);

        // Loop through the discount data to set distributive discounts
        discountData.forEach(item => {
          if (
            item?.shop_type?.id === Store?.shop_type?.id ||
            Store?.fk_shop_type
          ) {
            // Only set distributiveDiscount for the matching store/shop type
            setDistributiveDiscount(prev => [...prev, item]); // Append item to the state
          }
        });

        // Save the fetched data in AsyncStorage for offline use
        await AsyncStorage.setItem(
          `discountSlabData_${userId}`,
          JSON.stringify(discountData),
        );
      } else {
        // If no internet, fetch from AsyncStorage
        const discountSlabKey = `discountSlabData_${userId}`;
        const storedDiscount = await AsyncStorage.getItem(discountSlabKey);
        if (storedDiscount) {
          const parsedDiscount = JSON.parse(storedDiscount);

          // Clear existing discount data
          setDistributiveDiscount([]);

          // Loop through the stored discount data to set distributive discounts
          parsedDiscount.forEach(item => {
            if (
              item.shop_type?.id === Store.shop_type?.id ||
              Store.fk_shop_type
            ) {
              // Set distributiveDiscount from stored data
              setDistributiveDiscount(prev => [...prev, item]); // Append item to the state
            }
          });
        } else {
          console.log('No distribution discount in AsyncStorage');
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

  const getSpecialDiscount = async () => {
    setIsLoading(true);
    const state = await NetInfo.fetch(); // Check network connectivity
    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    const distributor_id = await AsyncStorage.getItem('distribution_id');
    const userId = await AsyncStorage.getItem('userId');
    try {
      if (state.isConnected) {
        // If there's network, fetch data from API
        const response = await instance.get(
          `/special_discount_slab/all?distribution_id=${distributor_id}&include_detail=true`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        console.log(response.data, 'getSpecialDiscount');
        setSpecialDiscount(response.data);

        // Save the fetched data in AsyncStorage
      } else {
        // If no internet, fetch from AsyncStorage
        const specialDiscountSlabKey = `specialDiscountSlabData_${userId}`;
        const storedSpecialDiscount = await AsyncStorage.getItem(
          specialDiscountSlabKey,
        );
        if (storedSpecialDiscount) {
          const parsedSpecialDiscount = JSON.parse(storedSpecialDiscount);
          setSpecialDiscount(parsedSpecialDiscount);
        } else {
          console.log('No special discount in AsyncStorage');
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
    getDistributionDiscount();
    getSpecialDiscount();
  }, []);
  useEffect(() => {
    // Debugging logs to track values
    console.log('GrossAmount:', GrossAmount); // Logs the gross amount
    console.log('Distributive Discount:', distributiveDiscount);
    console.log('Special Discounts:', SpecaialDiscount);
    console.log('Store:', Store);

    if (
      distributiveDiscount &&
      Array.isArray(distributiveDiscount) &&
      distributiveDiscount.length > 0
    ) {
      let distributiveDiscountApplied = false; // Flag to check if a discount is applied

      // Loop through each distributive discount range
      distributiveDiscount.forEach(discount => {
        console.log('Checking Distributive Discount entry:', discount); // Log the full discount entry
        console.log(
          'Checking Distributive Discount limits:',
          discount.lower_limit,
          discount.upper_limit,
        );

        // Check if GrossAmount falls within the range
        if (
          GrossAmount >= discount?.lower_limit &&
          GrossAmount <= discount?.upper_limit
        ) {
          const calculatedDiscount = GrossAmount * (discount?.rate / 100);
          console.log(
            `Calculated Distributive Discount for range ${discount.lower_limit}-${discount.upper_limit}:`,
            calculatedDiscount,
          );
          setFinalDistributiveDiscount(calculatedDiscount);
          distributiveDiscountApplied = true; // Set flag if discount is applied
        }
      });

      // If no distributive discount was applied, set it to 0
      if (!distributiveDiscountApplied) {
        console.log('No applicable distributive discount for this GrossAmount');
        setFinalDistributiveDiscount(0);
      }
    } else {
      console.log('No distributive discounts found or invalid structure');
      setFinalDistributiveDiscount(0);
    }

    // Handle special discounts
    if (SpecaialDiscount && SpecaialDiscount.length > 0) {
      let finalDiscount = 0; // Store the highest applicable discount

      SpecaialDiscount.forEach((item, index) => {
        console.log(`Checking Special Discount Item ID: ${item.id}`);
        console.log(
          `Item Gross Amount: ${item.gross_amount}, Item Rate: ${item.rate}, Item Amount: ${item.amount}`,
        );
        console.log(
          `Current Gross Amount: ${GrossAmount}, Shop Type: ${Store?.fk_shop_type}`,
        );

        // Check if the item matches the shop type and gross amount condition
        if (item?.fk_shop_type === Store?.fk_shop_type) {
          console.log('Shop types match!');

          if (GrossAmount >= item.gross_amount) {
            let discount = 0;

            if (item.rate) {
              discount = GrossAmount * (item.rate / 100); // Calculate discount based on rate
              console.log(
                `Rate-based Discount for Item ID: ${item.id} = ${discount}`,
              );
            } else if (item.amount) {
              discount = item.amount; // Apply flat amount if no rate
              console.log(
                `Amount-based Discount for Item ID: ${item.id} = ${discount}`,
              );
            }

            // Set the highest discount
            finalDiscount = Math.max(finalDiscount, discount);
            console.log(
              `Updated Final Discount after Item ID ${item.id}: ${finalDiscount}`,
            );
          } else {
            console.log(
              `GrossAmount ${GrossAmount} is less than required item.gross_amount ${item.gross_amount}`,
            );
          }
        } else {
          console.log(
            `Shop type mismatch! Item shop type: ${item.fk_shop_type}, Store shop type: ${Store?.fk_shop_type}`,
          );
        }
      });

      // Set the calculated special discount
      if (finalDiscount > 0) {
        console.log('Final Special Discount Applied:', finalDiscount);
        setApplySpecialDiscount(finalDiscount);
      } else {
        console.log('No applicable special discount after checking all items');
        setApplySpecialDiscount(0);
      }
    } else {
      // No special discounts found
      console.log('No special discounts found');
      setApplySpecialDiscount(0);
    }
  }, [GrossAmount, distributiveDiscount, SpecaialDiscount, Store]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="black"
        barStyle="light-content"
        translucent={false}
      />
      <View style={styles.header}>
        {openclosesearch ? (
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={togglesearch}>
              <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <TextInput
                placeholder="Search..."
                placeholderTextColor={'#fff'}
                onChangeText={txt => updateSearch(txt)}
                style={styles.searchInput}
              />
            </View>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
        </TouchableOpacity>
        <View style={styles.storeNameContainer}>
          <Text style={styles.storeNameText}>{Store.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={togglesearch}>
          <AntDesign name="search1" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.productsContainer}>
        <AddProducts
          datas={allProducts}
          allProduct={productNaame}
          search={searchText}
          Invoiceitems={Invoiceitems}
          isLoading={isLoading}
        />
      </View>
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleOpenPress} style={styles.footerButton}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Net Amount:{' '}
              {(
                totalPrice -
                applySpecialDiscount -
                FinalDistributiveDiscount
              ).toFixed(2)}
            </Text>
            <AntDesign name="right" size={10} color={'#fff'} />
          </View>
        </TouchableOpacity>
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['25%', '55%']}
        backdropComponent={renderBackdrop}
        enablePanDownToClose>
        <View>
          <View style={styles.confirmOrderHeader}>
            <Text style={styles.confirmOrderText}>Confirm Order</Text>
            <MaterialCommunityIcons
              name="delete"
              size={30}
              color={'#a0a0a0'}
              onPress={() => dispatch(RemoveAllCart())}
            />
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderStoreName}>{Store.name}</Text>
            <View style={styles.separator}></View>
          </View>
          <ShowValues
            Lefttxt={'T.O Discount:'}
            RightText={(GrossAmount - totalPrice).toFixed(2)}
          />
          <ShowValues
            Lefttxt={'Distribution Discount:'}
            RightText={FinalDistributiveDiscount.toFixed(2)}
            percent={distributiveDiscount}
            gross={GrossAmount.toFixed(2)}
          />
          <SpecialDis
            Lefttxt={'Special Discount:'}
            RightText={applySpecialDiscount.toFixed(2)}
            percent={SpecaialDiscount}
            gross={GrossAmount.toFixed(2)}
          />
          <ShowValues Lefttxt={'Total GST:'} RightText={gst.toFixed(2)} />
          <View style={styles.separator}></View>
          <ShowValues
            Lefttxt={'Gross Amount:'}
            RightText={GrossAmount.toFixed(2)}
            leftStyle={styles.boldText}
          />
          <ShowValues
            Lefttxt={'Total Discount:'}
            RightText={(
              GrossAmount -
              totalPrice +
              applySpecialDiscount +
              FinalDistributiveDiscount
            ).toFixed(2)}
            leftStyle={styles.boldText}
          />
          <ShowValues
            Lefttxt={'Net Amount:'}
            RightText={(
              totalPrice -
              applySpecialDiscount -
              FinalDistributiveDiscount
            ).toFixed(2)}
            leftStyle={styles.boldText}
            rightStyle={styles.boldText}
          />
          <TouchableOpacity
            onPress={() => {
              const {RouteDate} = route.params;
              navigation.navigate('ConfirmOrder', {
                Store: Store,
                RouteDate: RouteDate,
                applySpecialDiscount: applySpecialDiscount,
                FinalDistributiveDiscount: FinalDistributiveDiscount,
                GST: gst,
                cItems: cartItems,
                orderId: existingOrderId,
                SpecaialDiscount: SpecaialDiscount,
                distributiveDiscount: distributiveDiscount,
              });
            }}
            style={styles.createOrderButton}>
            <Text style={styles.createOrderText}>Create Order</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
      {isLoading ? <Loader /> : null}
    </View>
  );
};
export default CreateOrder;
const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    backgroundColor: '#2196f3',
    height: 70,
    position: 'relative',
    // marginTop: 10,
  },
  searchContainer: {
    position: 'absolute',
    height: 70,
    backgroundColor: '#2196f3',
    zIndex: 10,
    width: '100%',
    flexDirection: 'row',
  },
  searchButton: {width: '15%', alignItems: 'center', justifyContent: 'center'},
  searchInputContainer: {width: '70%', justifyContent: 'center'},
  searchInput: {color: '#fff'},
  backButton: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  storeNameContainer: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  storeNameText: {color: '#fff', fontSize: 20},
  searchIconButton: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  productsContainer: {height: '80%'},
  footer: {position: 'absolute', bottom: 0, width: '100%'},
  footerButton: {
    backgroundColor: '#607D8B',
    width: '100%',
    padding: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    padding: 10,
  },
  footerText: {color: '#fff'},
  confirmOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2%',
  },
  confirmOrderText: {color: '#000', fontSize: 25},
  orderDetails: {padding: '2%'},
  orderStoreName: {color: '#c0c0c0', fontSize: 25},
  separator: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: '2%',
  },
  boldText: {fontWeight: 'bold', color: '#000'},
  createOrderButton: {
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
  },
  createOrderText: {color: '#fff'},
});
