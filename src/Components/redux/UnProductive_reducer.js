import { Add_UnProductive, Get_All_UnProductive, Remove_UnProductive } from "./constants";


const initialState = [];

export const UnProductive_reducer = (state = initialState, action) => {
    //   console.log(state,'bbb')
    switch (action.type) {
        case Add_UnProductive:
            if (!action.payload) return state;

            // Find the index of the existing item in the state
            const existingIndex = state.findIndex(item => item.pricing_id === action.payload.pricing_id);

            // If the item has both 'carton_ordered' and 'box_ordered' as 0, remove it from the state
            console.log(action.payload.carton_ordered, "!9", action.payload.box_ordered === 0)
            if (action.payload.carton_ordered === 0 && action.payload.box_ordered === 0) {
                // Return a new state excluding the item with 'pricing_id' that matches the payload
                return state.filter(item => item.pricing_id !== action.payload.pricing_id);
            }

            if (existingIndex !== -1) {
                // If item exists, replace it with the new payload
                const updatedState = [...state];
                updatedState[existingIndex] = action.payload;
                return updatedState;
            } else {
                // If item doesn't exist, add the new item to the state
                return [...state, action.payload];
            }


        case Get_All_UnProductive:
            return state
        case Remove_UnProductive:
            return [];
        default:
            return state;
    }
};