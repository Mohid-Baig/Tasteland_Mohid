// syncService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Components/BaseUrl';

const PENDING_SHOP_EDITS_KEY = 'PENDING_SHOP_EDITS';
let isProcessing = false; // Lock variable to prevent multiple concurrent calls

/**
 * Saves a pending shop edit to AsyncStorage.
 * @param {Object} edit - The shop edit data to save.
 */
export const savePendingEdit = async edit => {
  try {
    const existingEdits = await AsyncStorage.getItem(PENDING_SHOP_EDITS_KEY);
    const editsArray = existingEdits ? JSON.parse(existingEdits) : [];

    editsArray.push(edit); // Add the new edit to the array
    await AsyncStorage.setItem(
      PENDING_SHOP_EDITS_KEY,
      JSON.stringify(editsArray),
    );
    console.log('Pending edit saved successfully');
  } catch (error) {
    console.error('Error saving pending edit:', error);
  }
};

/**
 * Processes pending edits saved in AsyncStorage and syncs them with the backend.
 */
export const processPendingEdits = async () => {
  if (isProcessing) {
    // If the function is already running, don't allow it to run again
    console.log('Already processing pending edits...');
    return;
  }

  isProcessing = true; // Lock the process

  try {
    const existingEdits = await AsyncStorage.getItem(PENDING_SHOP_EDITS_KEY);
    const pendingEdits = existingEdits ? JSON.parse(existingEdits) : [];

    if (pendingEdits.length === 0) {
      console.log('No pending edits to process');
      isProcessing = false; // Release the lock
      return;
    }

    const authToken = await AsyncStorage.getItem('AUTH_TOKEN');

    for (const edit of pendingEdits) {
      try {
        if (edit.id) {
          // If an id exists, update the shop
          const response = await instance.put(`/shop/${edit.id}`, edit, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          console.log('Shop updated successfully:', response.data);
          if (response.status == 200) {
            await AsyncStorage.removeItem(PENDING_SHOP_EDITS_KEY);
          }
        } else {
          // Otherwise, create a new shop
          const response = await instance.post('/shop/', edit, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          console.log('New shop created successfully:', response.data);
          if (response.status == 200) {
            await AsyncStorage.removeItem(PENDING_SHOP_EDITS_KEY);
          }
        }

      } catch (error) {
        console.error('Error syncing pending edit:', error);
        continue; // Continue with the next edit if there's an error
      }
    }

    // Clear pending edits after processing
    console.log('All pending edits have been processed and cleared');
  } catch (error) {
    console.error('Error processing pending edits:', error);
  } finally {
    isProcessing = false; // Release the lock after processing
  }
};
