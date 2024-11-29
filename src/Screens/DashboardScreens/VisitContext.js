import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const VisitContext = createContext();

// Helper function to get today's date as a string (e.g., "2024-11-22")
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Only get the date part (YYYY-MM-DD)
};

// Create the provider component
export const VisitProvider = ({children}) => {
  const [totalVisits, setTotalVisits] = useState(0);
  const [lastVisitDate, setLastVisitDate] = useState(null);
  const [userId, setUserId] = useState(null); // State for userId
  const [isDataLoaded, setIsDataLoaded] = useState(false); // State to track if data is fully loaded

  // Helper function to get the storage key based on the user ID
  const getStorageKey = key => `${userId}_${key}`; // Unique key for each user

  // Function to reset state for a fresh user context
  const resetState = () => {
    setTotalVisits(0); // Reset visit count
    setLastVisitDate(null); // Reset last visit date
    setIsDataLoaded(false); // Reset loading state
  };

  // Function to load the last visit date and visits from AsyncStorage
  const loadVisitData = async () => {
    if (!userId) return; // If userId is not set, don't load data

    try {
      const savedDate = await AsyncStorage.getItem(
        getStorageKey('lastVisitDate'),
      );
      const savedVisits = await AsyncStorage.getItem(
        getStorageKey('totalVisits'),
      );

      if (savedDate) {
        setLastVisitDate(savedDate);
      } else {
        setLastVisitDate(null); // Reset if no saved date
      }

      if (savedVisits) {
        setTotalVisits(Number(savedVisits));
      } else {
        setTotalVisits(0); // Reset if no saved visits
      }
    } catch (error) {
      console.error('Error loading last visit date:', error);
    } finally {
      setIsDataLoaded(true); // Mark as loaded
    }
  };

  // Function to save the current visit count and date to AsyncStorage
  const saveVisitData = async (newTotalVisits, todayDate) => {
    if (!userId) return; // If userId is not set, don't save data

    try {
      await AsyncStorage.setItem(
        getStorageKey('totalVisits'),
        newTotalVisits.toString(),
      );
      await AsyncStorage.setItem(getStorageKey('lastVisitDate'), todayDate);
    } catch (error) {
      console.error('Error saving visit data:', error);
    }
  };

  // Function to increase visits and reset if it's a new day
  const incrementVisits = () => {
    if (!isDataLoaded) return; // Ensure data is fully loaded before incrementing

    const todayDate = getTodayDateString();

    // Check if the date has changed (i.e., a new day has started)
    if (lastVisitDate !== todayDate) {
      // Reset total visits for the new day
      setTotalVisits(1); // Set to 1 since the user just made their first visit for the day
      setLastVisitDate(todayDate);
      saveVisitData(1, todayDate);
    } else {
      // Increment total visits if it's the same day
      const newTotalVisits = totalVisits + 1;
      setTotalVisits(newTotalVisits);
      saveVisitData(newTotalVisits, todayDate);
    }
  };

  // Load userId and initial visit data when the component mounts
  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId'); // Retrieve userId from AsyncStorage
      console.log('Fetched userId: ', storedUserId); // Log userId for debugging
      setUserId(storedUserId);
    };

    getUserId(); // Load userId on component mount
  }, []);

  // Reset state and load last visit data after userId is fetched or changes
  useEffect(() => {
    if (userId) {
      resetState(); // Reset state immediately when userId changes
      loadVisitData(); // Load data only after the userId is set
    }
  }, [userId]); // Run only when userId changes

  return (
    <VisitContext.Provider value={{totalVisits, incrementVisits, isDataLoaded}}>
      {children}
    </VisitContext.Provider>
  );
};
