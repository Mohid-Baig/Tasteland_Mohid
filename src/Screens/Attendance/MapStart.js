import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import MapView, { Marker } from 'react-native-maps';
import instance from '../../Components/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import RNFS from 'react-native-fs';
const MapStart = ({ navigation, route }) => {
    // Define static latitude and longitude
    const { location } = route.params;
    const {orderBokerId}=route.params;
    // const markAttendance = async()=>{
    //     const date = moment().toISOString();
    //     const userId = await AsyncStorage.getItem('userId');
    //     const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
    //     launchCamera(
    //         {
    //           mediaType: 'photo',
    //           saveToPhotos: true,  // optional, save the photo to the user's gallery
    //         },
    //         (response) => {
    //           if (response.didCancel) {
    //             console.log('User cancelled image picker');
    //           } else if (response.error) {
    //             console.log('ImagePicker Error: ', response.error);
    //           } else {
    //             const data = new FormData();
    //             data.append('attendance_image', {
    //               uri: response.assets[0].uri,
    //               name: "Attachment",
    //               type: response.assets[0].type
    //             });
               
    //             data.append('user_id', parseInt(userId));
    //             data.append('attendance_check_in', date.toString());
    //             data.append('attendance_check_in_latitude', location.latitude.toString());
    //             data.append('attendance_check_in_longitude', location.longitude.toString());

    //             data.append('attendance_check_out', date.toString());
    //             data.append('attendance_check_out_latitude', 0);
    //             data.append('attendance_check_out_longitude', 0);


    //             data.append('distributor_id', parseInt(orderBokerId));
    //             data.append('attendance_check_out_longitude', 0);


    //             data.append('created_at',date);
    //             data.append('updated_at',date);
                
    //             //                     "updated_at": date,
    //             console.log(data._parts,"Data");
      
    //             // Send the image via API
    //             instance.post('/attendance/Create_attendances', data, {
    //               headers: {
    //                 'Content-Type': 'multipart/form-data',
    //                 'Accept': 'application/json',
    //                 Authorization: `Bearer ${authToken}`
    //               },
    //             })
    //             .then((response) => {
    //               console.log('Image uploaded successfully', response.data);
    //             })
    //             .catch((error) => {
    //               console.log('Error uploading image', error);
    //             });
    //           }
    //         }
    //       );

    // }
    const markAttendance = async () => {
      const date = moment().toISOString();
      const userId = await AsyncStorage.getItem('userId');
      const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
      
      launchCamera(
          {
              mediaType: 'photo',
              saveToPhotos: false,  // optional, save the photo to the user's gallery
          },
          async (response) => {
              if (response.didCancel) {
                  console.log('User cancelled image picker');
              } else if (response.error) {
                  console.log('ImagePicker Error: ', response.error);
              } else {
                  try {
                      // Convert image to base64
                      const base64Image = await RNFS.readFile(response.assets[0].uri, 'base64');
                      
                      // Prepare the data as a JSON object
                      const data = {
                          user_id: parseInt(userId),
                          attendance_check_in: date,
                          attendance_check_in_latitude: location.latitude.toString(),
                          attendance_check_in_longitude: location.longitude.toString(),
                          attendance_check_out: date,
                          attendance_check_out_latitude: 0,
                          attendance_check_out_longitude: 0,
                          distributor_id: parseInt(orderBokerId),
                          attendance_image: base64Image,
                          created_at: date,
                          updated_at: date,
                      };
                      
                      // console.log(data, "Data"); 
      
                      // Send the data via API as application/json
                      instance.post('/attendance/Create_attendances', JSON.stringify(data), {
                          headers: {
                              'Content-Type': 'application/json',
                              'Accept': 'application/json',
                              Authorization: `Bearer ${authToken}`
                          },
                      })
                      .then((response) => {
                          console.log('Data uploaded successfully', response.data);
                          navigation.replace('Home');
                      })
                      .catch((error) => {
                          console.log('Error uploading data', error);
                      });
                  } catch (error) {
                      console.log('Error converting image to base64', error);
                  }
              }
          }
      );
  }
    
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.0922,  // Controls the zoom level
                    longitudeDelta: 0.0421,
                }}
            >
                <Marker
                    coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                    title="Static Location"
                    description="This is a static location"
                />
            </MapView>
            <View style={styles.button_cont}>
                <View style={styles.btn_row}> 
                <TouchableOpacity style={styles.btn_col} onPress={markAttendance}>
                    <Text style={styles.btn_text}>
                        Start Day
                    </Text>
                </TouchableOpacity>
                </View>
               

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    button_cont: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        // backgroundColor: 'red',
        zIndex: 100

    },
    btn_row:{
       


    },
    btn_col:{
        backgroundColor:'green',
        height:40,
        width:90,
        alignItems:'center',
        justifyContent:'center',
        marginLeft:'8%',
        marginTop:'2%'
       

    },
    btn_text:{
        color:'#fff'

    },
});

export default MapStart;