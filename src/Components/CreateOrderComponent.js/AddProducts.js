import React, {
  useEffect,
  useReducer,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import Collapsible from 'react-native-collapsible';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AddToCart } from '../redux/action';

// Reducer for managing counts
const countsReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_COUNT':
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          [action.countType]: action.value,
        },
      };
    default:
      return state;
  }
};

// Optimized TextInput component to prevent re-renders
const CountInput = React.memo(({
  value,
  onChangeText,
  onFocus,
  placeholder = "0"
}) => {
  return (
    <View
      style={{
        padding: '1%',
        borderBottomColor: '#c0c0c0',
        borderBottomWidth: 1,
      }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={'#000'}
        keyboardType="numeric"
        style={{ color: '#000' }}
        onFocus={onFocus}
      />
    </View>
  );
});

const AddSingleProduct = React.memo(
  ({ boxInCtn, itemss, Invoiceitems, datas }) => {
    const dispatch = useDispatch();
    const [counts, dispatchCounts] = useReducer(countsReducer, {});
    const [addOn, setAddOn] = useState('pack');

    // Pre-calculate item ID for performance
    const itemId = itemss.id;

    // Initialize counts from invoice items
    useEffect(() => {
      if (Invoiceitems?.details) {
        Invoiceitems.details.forEach(detail => {
          const matchedItem = datas.find(
            item =>
              item.pricing.product.name === detail.product &&
              item.pricing.sku.name === detail.sku &&
              item.pricing.variant.name === detail.variant,
          );
          if (matchedItem) {
            dispatchCounts({
              type: 'UPDATE_COUNT',
              id: matchedItem.id,
              countType: 'pack',
              value: detail.box_ordered,
            });
            dispatchCounts({
              type: 'UPDATE_COUNT',
              id: matchedItem.id,
              countType: 'carton',
              value: detail.carton_ordered,
            });
          }
        });
      }
    }, [Invoiceitems, datas]);

    // Memoized update counts function
    const updateCounts = useCallback(
      (type, value) => {
        dispatchCounts({
          type: 'UPDATE_COUNT',
          id: itemId,
          countType: type,
          value,
        });
      },
      [itemId],
    );

    // Memoized add product function
    const AddProduct = useCallback((carton, pack) => {
      const item = {
        carton_ordered: carton,
        box_ordered: pack,
        pricing_id: itemss.pricing.id,
        itemss: itemss,
        pack_in_box: boxInCtn,
      };
      dispatch(AddToCart(item));
    }, [dispatch, itemss, boxInCtn]);

    // Optimized AddSub function
    const AddSub = useCallback(val => {
      // Get counts from the current state
      const currentPack = counts[itemId]?.pack || 0;
      const currentCarton = counts[itemId]?.carton || 0;

      let updatedPack = currentPack;
      let updatedCarton = currentCarton;

      if (val === 'Add') {
        if (addOn === 'pack') {
          if (updatedPack >= boxInCtn - 1) {
            updatedCarton += 1;
            updatedPack = 0;
          } else {
            updatedPack += 1;
          }
        } else if (addOn === 'carton') {
          updatedCarton += 1;
        }
      } else if (val === 'Sub') {
        if (addOn === 'pack') {
          if (updatedPack === 0 && updatedCarton > 0) {
            updatedCarton -= 1;
            updatedPack = boxInCtn - 1;
          } else {
            updatedPack = Math.max(updatedPack - 1, 0);
          }
        } else if (addOn === 'carton') {
          updatedCarton = Math.max(updatedCarton - 1, 0);
        }
      }

      // Update local state immediately for responsiveness
      updateCounts('carton', updatedCarton);
      updateCounts('pack', updatedPack);

      // Defer Redux update to next animation frame for better performance
      requestAnimationFrame(() => {
        AddProduct(updatedCarton, updatedPack);
      });
    }, [counts, itemId, addOn, boxInCtn, updateCounts, AddProduct]);

    // Optimized input change handler
    const handleInputChange = useCallback((type, txt) => {
      let num = parseInt(txt);
      if (isNaN(num) || num < 0) {
        num = 0;
      } else if (num > 9999) {
        num = 9999;
      }

      // If type is 'pack' and number of boxes equals or exceeds boxInCtn
      if (type === 'pack' && num >= boxInCtn) {
        // Calculate cartons and remaining boxes
        const cartonsToAdd = Math.floor(num / boxInCtn);
        const remainingBoxes = num % boxInCtn;

        // Update carton count
        const currentCartons = counts[itemId]?.carton || 0;
        const newCartonValue = currentCartons + cartonsToAdd;

        // Update both values
        updateCounts('carton', newCartonValue);
        updateCounts('pack', remainingBoxes);

        // Update Redux
        requestAnimationFrame(() => {
          AddProduct(newCartonValue, remainingBoxes);
        });
      } else {
        // Original behavior for other cases
        updateCounts(type, num);

        // Get the current values for the other type
        const otherType = type === 'pack' ? 'carton' : 'pack';
        const otherValue = counts[itemId]?.[otherType] || 0;

        // Update Redux in the next frame
        requestAnimationFrame(() => {
          if (type === 'pack') {
            AddProduct(otherValue, num);
          } else {
            AddProduct(num, otherValue);
          }
        });
      }
    }, [counts, itemId, updateCounts, AddProduct, boxInCtn]);

    // Memoize values to prevent re-renders
    const cartonValue = useMemo(() =>
      counts[itemId]?.carton ? counts[itemId].carton.toString() : '',
      [counts, itemId]);

    const packValue = useMemo(() =>
      counts[itemId]?.pack ? counts[itemId].pack.toString() : '',
      [counts, itemId]);

    // Set addOn handlers
    const setToCarton = useCallback(() => setAddOn('carton'), []);
    const setToPack = useCallback(() => setAddOn('pack'), []);

    // Add/Sub handlers
    const handleAdd = useCallback(() => AddSub('Add'), [AddSub]);
    const handleSub = useCallback(() => AddSub('Sub'), [AddSub]);

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'flex-end',
        }}>
        <TouchableOpacity style={{ padding: '1%' }} onPress={handleSub}>
          <AntDesign name="minuscircle" size={24} color={'#2196f3'} />
        </TouchableOpacity>

        <CountInput
          value={cartonValue}
          onChangeText={txt => handleInputChange('carton', txt)}
          onFocus={setToCarton}
        />

        <View style={{ padding: '1%' }}>
          <Text>-</Text>
        </View>

        <CountInput
          value={packValue}
          onChangeText={txt => handleInputChange('pack', txt)}
          onFocus={setToPack}
        />

        <TouchableOpacity style={{ padding: '1%' }} onPress={handleAdd}>
          <AntDesign name="pluscircle" size={24} color={'#2196f3'} />
        </TouchableOpacity>
      </View>
    );
  },
  // Custom comparison function for the memo
  (prevProps, nextProps) => {
    return (
      prevProps.itemss.id === nextProps.itemss.id &&
      prevProps.boxInCtn === nextProps.boxInCtn &&
      JSON.stringify(prevProps.Invoiceitems?.details) === JSON.stringify(nextProps.Invoiceitems?.details)
    );
  }
);

const AccordionItem = React.memo(({ title, items, Invoiceitems, datas }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const boxFilter = useCallback(inputString => {
    const regex = /(\d+)pc.*?(\d+)bx/;
    const matches = inputString.match(regex);
    return matches && matches[2] !== undefined ? parseInt(matches[2]) : 96;
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <View key={item.pricing.id} style={{ padding: '5%' }}>
      <Text style={{ fontSize: 12, color: '#000' }}>
        {`${item.pricing.product.name} ${item.pricing.sku.name} ${item.pricing.variant.name}`}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <Text style={{ color: '#a0a0a0' }}>
          Trade Price: {item.pricing.trade_price}
        </Text>
        <Text style={{ marginLeft: 'auto', color: '#a0a0a0' }}>
          Trade Offer: {item.trade_offer}%
        </Text>
      </View>
      <AddSingleProduct
        boxInCtn={boxFilter(item.pricing.variant.name)}
        itemss={item}
        Invoiceitems={Invoiceitems}
        datas={datas}
      />
    </View>
  ), [boxFilter, Invoiceitems, datas]);

  return (
    <View style={{ marginBottom: 10, backgroundColor: '#fff' }}>
      <TouchableOpacity
        onPress={toggleCollapsed}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: '5%',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 18, color: isCollapsed ? '#000' : '#2196f3' }}>
          {title}
        </Text>
        <Icon
          name={isCollapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
          size={24}
          color={isCollapsed ? '#000' : '#2196f3'}
        />
      </TouchableOpacity>
      <Collapsible collapsed={isCollapsed}>
        <FlatList
          data={items}
          keyExtractor={item => item.pricing.id.toString()}
          renderItem={renderItem}
          removeClippedSubviews={true}
          initialNumToRender={items.length}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={10}
        />
      </Collapsible>
    </View>
  );
});

const AddProducts = ({ datas, allProduct, search, Invoiceitems }) => {
  // console.log(allProduct.length, '////dot length')
  const [ProductName, SetProductname] = useState([]);
  const order = useSelector(state => state.UnProductive_reducer, shallowEqual);

  const filter = useCallback(() => {
    let FinalProduct = [];

    if (Array.isArray(allProduct) && allProduct.length > 0) {
      allProduct.forEach((data, index) => {
        FinalProduct[index] = {
          title: data,
          item: [],
        };

        if (Array.isArray(datas)) {
          datas.forEach(item => {
            if (item.pricing.product.name === data) {
              FinalProduct[index].item.push(item);
            }
          });
        } else {
          console.warn(
            `Expected 'datas' to be an array, but got ${typeof datas}`,
          );
        }
      });

      // Filter based on search term if provided
      if (search) {
        FinalProduct = FinalProduct.filter(product =>
          product.title.toLowerCase().includes(search.toLowerCase()),
        );
      }

      SetProductname(FinalProduct);
    }
  }, [allProduct, datas, search]);

  useEffect(() => {
    filter();
  }, [filter]);

  // Optimized filtering with memoization
  const filteredProductName = useMemo(() => {
    if (!ProductName) return [];
    if (!search) return ProductName;

    return ProductName.filter(product =>
      product.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [ProductName, search]);

  // Optimized keyExtractor
  const keyExtractor = useCallback((item, index) => index.toString(), []);

  // Optimized renderItem
  const renderItem = useCallback(({ item }) => (
    <AccordionItem
      title={item.title}
      items={item.item}
      Invoiceitems={Invoiceitems}
      datas={datas}
    />
  ), [Invoiceitems, datas]);

  // Optimized FlatList configuration
  return (
    <FlatList
      data={filteredProductName}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialNumToRender={allProduct.length}
      maxToRenderPerBatch={5}
      windowSize={11}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
    />
  );
};

export default React.memo(AddProducts);