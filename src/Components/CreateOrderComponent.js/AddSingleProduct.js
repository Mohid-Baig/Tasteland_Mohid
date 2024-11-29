import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, memo } from 'react';
import AntDesign from "react-native-vector-icons/AntDesign";
import { AddUnProductive } from '../redux/action';


// Memoize the component to avoid unnecessary re-renders
const AddSingleProduct = ({ boxInCtn, itemss, Val, del, dispatch}) => {
    
    const [Pack, setPack] = useState(0);
    const [carton, setCarton] = useState(0);
    const [addOn, setAddOn] = useState('pack');


    const AddProduct = () => {
        let item = {
            "carton_ordered": carton,
            "box_ordered": Pack,
            "pricing_id": itemss.item.id,
            "itemss": itemss.item,
            "pack_in_box": boxInCtn,
        };
        console.log(item , 'tm');
        // Val(item); // Callback to send data to parent
        dispatch(AddUnProductive(item));
    };

    const handleDelete = (id) => {
        del(id); // Callback to delete an item
    };

    const handlePackChange = (txt) => {
        let num = parseInt(txt);
        if (isNaN(num)) {
            setPack(0);
        } else if (num > 9999) {
            setPack(9999);
        } else {
            setPack(num);
        }
    };

    const handleCartonChange = (txt) => {
        let num = parseInt(txt);
        if (isNaN(num)) {
            setCarton(0);
        } else if (num > 9999) {
            setCarton(9999);
        } else {
            setCarton(num);
        }
    };

    const AddSub = (val) => {
        if (val === 'Add') {
            if (addOn === "pack") {
                setPack((prevPack) => {
                    if (prevPack >= boxInCtn) {
                        setCarton((prevCarton) => prevCarton + 1);
                        return 0;
                    } else {
                        return prevPack + 1;
                    }
                });
            } else if (addOn === "carton") {
                setCarton((prevCarton) => prevCarton + 1);
            }
        } else if (val === 'Sub') {
            if (addOn === "pack") {
                setPack((prevPack) => Math.max(prevPack - 1, 0)); // Ensure non-negative
            } else if (addOn === "carton") {
                setCarton((prevCarton) => Math.max(prevCarton - 1, 0)); // Ensure non-negative
            }
        }

    };

    useEffect(() => {
        if (Pack >= boxInCtn) {
            let val = Pack;
            let ctn = carton;
            while (val >= boxInCtn) {
                val -= boxInCtn;
                ctn += 1;
            }
            setPack(val);
            setCarton(ctn);
        }
        if (Pack>0 || carton>0) {
            AddProduct();
        }

    }, [Pack, boxInCtn]);

    useEffect(() => {
        if (carton > 9999) {
            setCarton(9999);
        }
        if (Pack>0 || carton>0) {
            AddProduct();
        }

   
    }, [carton]);

    return (
        <View style={{ marginTop: '2%', borderBottomColor: "#000", borderBottomWidth: 1 }}>
            <Text style={{ color: '#000', fontSize: 13 }}>
                {`${itemss.item.product.name} ${itemss.item.sku.name} ${itemss.item.variant.name}`}
            </Text>
            <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: "space-between" }}>
                <AntDesign name='delete' size={25} color={'red'} onPress={() => handleDelete(itemss.item.id)} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={{ padding: '1%' }} onPress={() => AddSub('Sub')}>
                        <AntDesign name='minuscircle' size={24} color={'#2196f3'} />
                    </TouchableOpacity>
                    <View style={{ padding: '1%', borderBottomColor: '#c0c0c0', borderBottomWidth: 1 }}>
                        <TextInput
                            value={carton.toString()}
                            onChangeText={handleCartonChange}
                            placeholder='0'
                            placeholderTextColor={"#000"}
                            keyboardType="numeric"
                            onFocus={() => setAddOn('carton')}
                        />
                    </View>
                    <View style={{ padding: '1%' }}>
                        <Text>-</Text>
                    </View>
                    <View style={{ padding: '1%', borderBottomColor: '#c0c0c0', borderBottomWidth: 1 }}>
                        <TextInput
                            value={Pack.toString()}
                            onChangeText={handlePackChange}
                            placeholder='0'
                            placeholderTextColor={"#000"}
                            keyboardType="numeric"
                            onFocus={() => setAddOn('pack')}
                        />
                    </View>
                    <TouchableOpacity style={{ padding: '1%' }} onPress={() => AddSub('Add')}>
                        <AntDesign name='pluscircle' size={24} color={'#2196f3'} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default AddSingleProduct;
