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
  const [isDataLoaded, setIsDataLoaded] = useState(false); // State to track if data is fully loaded

  // Function to reset state for a fresh user context
  const resetState = () => {
    setTotalVisits(0); // Reset visit count
    setLastVisitDate(null); // Reset last visit date
    setIsDataLoaded(false); // Reset loading state
  };

  // Function to load the last visit date and visits from AsyncStorage
  const loadVisitData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId'); // Fetch userId
      if (!userId) return; // If userId is not set, don't load data

      const savedDate = await AsyncStorage.getItem(`${userId}_lastVisitDate`);
      const savedVisits = await AsyncStorage.getItem(`${userId}_totalVisits`);

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
    try {
      const userId = await AsyncStorage.getItem('userId'); // Fetch userId
      if (!userId) return; // If userId is not set, don't save data

      await AsyncStorage.setItem(
        `${userId}_totalVisits`,
        newTotalVisits.toString(),
      );
      await AsyncStorage.setItem(`${userId}_lastVisitDate`, todayDate);
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

  // Reset state and load last visit data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      resetState(); // Reset state immediately
      await loadVisitData(); // Load visit data once userId is fetched
    };

    loadInitialData();
  }, []); // Run only on component mount

  return (
    <VisitContext.Provider value={{totalVisits, incrementVisits, isDataLoaded}}>
      {children}
    </VisitContext.Provider>
  );
};
