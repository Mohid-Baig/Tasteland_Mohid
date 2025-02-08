import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';

const ShopInvoiceCreate = ({datas, allProduct}) => {
  // console.log(allProduct, 'blbla');
  console.log(datas, 'datas');
  const [ProductName, SetProductname] = useState();
  const filter = () => {
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
          // console.log('Checking item:', item);
          if (item?.itemss?.pricing.product.name === data) {
            // console.log('Match found for:', item.product.name);
            FinalProduct[index].item.push(item);
          } else {
            // console.log(`No match for item.product.name (${item.product.name}) with data.name (${data.name})`);
          }
        });
      } else {
        console.warn(
          `Expected 'datas' to be an array, but got ${typeof datas}`,
        );
      }
    });

    // console.log('FinalProduct:',JSON.stringify(FinalProduct));
    SetProductname(FinalProduct);
  };

  useEffect(() => {
    if (allProduct && datas) {
      filter();
    }
  }, [allProduct, datas]);
  const RanderData = ({title, items}) => {
    // console.log(items)

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <View style={styles.productBlock}>
              <Text
                style={
                  styles.productTitle
                }>{`${item.itemss.pricing.product.name} ${item.itemss.pricing.sku.name} ${item.itemss.pricing.variant.name}`}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: '2%',
                }}>
                <View style={styles.row}>
                  <Text style={styles.label}>Quantity</Text>
                  <Text style={styles.value}>
                    {item.carton_ordered} - {item.box_ordered}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Trade Price</Text>
                  <Text style={styles.value}>
                    {item.itemss.pricing.trade_price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Trade Offer</Text>
                  <Text style={styles.value}>
                    {(
                      item.itemss.pricing.trade_price *
                      (item.itemss.trade_offer / 100) *
                      (item.carton_ordered * item.itemss.pricing.box_in_carton +
                        item.box_ordered)
                    ).toFixed(2)}{' '}
                    ({item.itemss.trade_offer.toFixed(2)}%)
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View style={[styles.row, {marginLeft: 5, marginRight: 5}]}>
                  <Text style={styles.label}>Gross Amount</Text>
                  <Text style={styles.value}>
                    {(
                      item.itemss.pricing.trade_price *
                      (item.carton_ordered * item.itemss.pricing.box_in_carton +
                        item.box_ordered)
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.row, {marginLeft: 5, marginRight: 5}]}>
                  <Text style={styles.label}>After T.O Amount</Text>
                  <Text style={styles.value}>
                    {(
                      item.itemss.pricing.trade_price *
                        (item.carton_ordered *
                          item.itemss.pricing.box_in_carton +
                          item.box_ordered) -
                      item.itemss.pricing.trade_price *
                        (item.itemss.trade_offer / 100) *
                        (item.carton_ordered *
                          item.itemss.pricing.box_in_carton +
                          item.box_ordered)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
        {/* First Product Block */}
      </View>
    );
  };
  return (
    <FlatList
      data={ProductName}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => (
        <View>
          <RanderData title={item?.title} items={item.item} />
        </View>
      )}
      contentContainerStyle={{padding: '2%'}}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    color: '#000',
  },
  productBlock: {
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 10,
    color: '#000',
  },
  row: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: '#000',
    fontWeight: '800',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default ShopInvoiceCreate;
