import React, {
  useEffect,
  useReducer,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {View, Text, TouchableOpacity, FlatList, TextInput} from 'react-native';
import Collapsible from 'react-native-collapsible';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {AddToCart} from '../redux/action';

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

const AddSingleProduct = React.memo(
  ({boxInCtn, itemss, Invoiceitems, datas}) => {
    const dispatch = useDispatch();
    const [counts, dispatchCounts] = useReducer(countsReducer, {});
    const [addOn, setAddOn] = useState('pack');
    const previousCounts = useRef({});

    useEffect(() => {
      previousCounts.current = counts;
    }, [counts]);

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

    const updateCounts = useCallback(
      (type, value) => {
        dispatchCounts({
          type: 'UPDATE_COUNT',
          id: itemss.id,
          countType: type,
          value,
        });
      },
      [itemss.id],
    );

    const AddProduct = (carton, pack) => {
      console.log(carton, pack, '-3-3');
      // console.log(itemss.id, 'itemms id');
      // console.log(boxInCtn, 'boxincation');
      console.log(itemss, 'itemss');
      const item = {
        carton_ordered: carton,
        box_ordered: pack,
        pricing_id: itemss.pricing.id,
        itemss: itemss,
        pack_in_box: boxInCtn,
      };
      dispatch(AddToCart(item));
    };

    const AddSub = val => {
      const currentCounts = previousCounts.current[itemss.id] || {
        pack: 0,
        carton: 0,
      };
      let updatedPack = currentCounts.pack;
      let updatedCarton = currentCounts.carton;

      if (val === 'Add') {
        // Logic to increase the counts
        if (addOn === 'pack') {
          if (updatedPack >= 23) {
            updatedPack = 0;
            updatedCarton += 1; // Increment carton when pack goes beyond limit
          } else {
            updatedPack += 1;
          }
        } else if (addOn === 'carton') {
          updatedCarton += 1;
        }
      } else if (val === 'Sub') {
        // Logic to decrease the counts
        if (addOn === 'pack') {
          if (updatedPack === 0 && updatedCarton > 0) {
          } else {
            updatedPack = Math.max(updatedPack - 1, 0); // Ensure pack doesn't go below 0
          }
        } else if (addOn === 'carton') {
          updatedCarton = Math.max(updatedCarton - 1, 0); // Ensure carton doesn't go below 0
        }
      }

      // Update the counts and call the AddProduct function with the new values
      AddProduct(updatedCarton, updatedPack);
      updateCounts('carton', updatedCarton);
      updateCounts('pack', updatedPack);
    };
    const handleInputChange = (type, txt) => {
      let num = parseInt(txt);
      if (isNaN(num) || num < 0) {
        num = 0;
      } else if (num > 9999) {
        num = 9999;
      }

      const newCounts = {
        ...previousCounts.current,
        [itemss.id]: {
          ...previousCounts.current?.[itemss.id],
          [type]: num,
        },
      };

      dispatchCounts({
        type: 'UPDATE_COUNT',
        id: itemss.id,
        countType: type,
        value: num,
      });

      const updatedPack = newCounts[itemss.id]?.pack || 0;
      const updatedCarton = newCounts[itemss.id]?.carton || 0;
      AddProduct(updatedCarton, updatedPack);
    };

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'flex-end',
        }}>
        <TouchableOpacity style={{padding: '1%'}} onPress={() => AddSub('Sub')}>
          <AntDesign name="minuscircle" size={24} color={'#2196f3'} />
        </TouchableOpacity>
        <View
          style={{
            padding: '1%',
            borderBottomColor: '#c0c0c0',
            borderBottomWidth: 1,
          }}>
          <TextInput
            value={
              counts[itemss.id]?.carton
                ? counts[itemss.id].carton.toString()
                : ''
            }
            onChangeText={txt => handleInputChange('carton', txt)}
            placeholder="0"
            placeholderTextColor={'#000'}
            keyboardType="numeric"
            style={{color: '#000'}}
            onFocus={() => setAddOn('carton')}
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
            value={
              counts[itemss.id]?.pack ? counts[itemss.id].pack.toString() : ''
            }
            onChangeText={txt => handleInputChange('pack', txt)}
            placeholder="0"
            style={{color: '#000'}}
            placeholderTextColor={'#000'}
            keyboardType="numeric"
            onFocus={() => setAddOn('pack')}
          />
        </View>
        <TouchableOpacity style={{padding: '1%'}} onPress={() => AddSub('Add')}>
          <AntDesign name="pluscircle" size={24} color={'#2196f3'} />
        </TouchableOpacity>
      </View>
    );
  },
);
const AccordionItem = React.memo(({title, items, Invoiceitems, datas}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const boxFilter = useCallback(inputString => {
    const regex = /(\d+)pc.*?(\d+)bx/;
    const matches = inputString.match(regex);
    return matches && matches[2] !== undefined ? parseInt(matches[2]) : 96;
  }, []);

  const renderItem = ({item}) => (
    <View key={item.pricing.id} style={{padding: '5%'}}>
      <Text style={{fontSize: 12, color: '#000'}}>
        {`${item.pricing.product.name} ${item.pricing.sku.name} ${item.pricing.variant.name}`}
      </Text>
      <View style={{flexDirection: 'row'}}>
        <Text style={{color: '#a0a0a0'}}>
          Trade Price: {item.pricing.trade_price}
        </Text>
        <Text style={{marginLeft: 'auto', color: '#a0a0a0'}}>
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
  );

  return (
    <View style={{marginBottom: 10, backgroundColor: '#fff'}}>
      <TouchableOpacity
        onPress={() => setIsCollapsed(prev => !prev)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: '5%',
          alignItems: 'center',
        }}>
        <Text style={{fontSize: 18, color: isCollapsed ? '#000' : '#2196f3'}}>
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
          keyExtractor={item => item.pricing.id.toString()} // Assuming item has a unique id
          renderItem={renderItem}
        />
      </Collapsible>
    </View>
  );
});

const AddProducts = ({datas, allProduct, search, Invoiceitems}) => {
  // console.log(datas.length, 'datas length');
  // console.log(allProduct.length, 'allProduct length');

  const [ProductName, SetProductname] = useState([]);
  const order = useSelector(state => state.UnProductive_reducer, shallowEqual);

  const filter = useCallback(() => {
    let productName = [];
    let FinalProduct = [];

    allProduct.forEach((data, index) => {
      productName.push(data);
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

    if (search) {
      FinalProduct = FinalProduct.filter(product =>
        product.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // console.log('FinalProduct:', FinalProduct);
    /* The code is logging the length of the variable `FinalProduct` to the console. */
    // console.log('FinalProduct Length:', FinalProduct.length);

    SetProductname(FinalProduct);
  }, [allProduct, datas, search]);

  useEffect(() => {
    filter();
  }, [datas, search, filter]);

  const filteredProductName = useMemo(() => {
    return ProductName?.filter(product =>
      product.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [ProductName, search]);

  // console.log('filteredProductName Length', filteredProductName?.length);

  return (
    <FlatList
      data={filteredProductName} // Pass all filtered items here
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => {
        // console.log(
        //   'filteredProductName Length in flatlist',
        //   filteredProductName?.length,
        // );
        // console.log('Rendering item:', JSON.stringify(item));
        // console.log(item.title, '--3-');

        return (
          <AccordionItem
            title={item.title}
            items={item.item}
            Invoiceitems={Invoiceitems}
            datas={datas}
          />
        );
      }}
      initialNumToRender={14} // Ensure the list starts with all 14 items
      maxToRenderPerBatch={14} // Render all items per batch (no batching restriction)
      windowSize={21} // Ensure we load items beyond the viewport
      removeClippedSubviews={false} // Prevent clipping of items
    />
  );
};

export default AddProducts;
