import {
  Add_To_Cart,
  Add_UnProductive,
  Get_All_Cart,
  Get_All_UnProductive,
  Remove_All_Cart,
  Remove_UnProductive,
} from './constants';
export const AddToCart = item => ({
  type: Add_To_Cart,
  payload: item,
});
export const RemoveAllCart = () => ({
  type: Remove_All_Cart,
});
export const getAllCart = () => ({
  type: Get_All_Cart,
});

// export const AddUnProductive = (item) => {
//     const sanitizedItem = {
//         id: item.itemss.id,  // Add only serializable properties
//         name: item.itemss.id
//         // Add other properties, but exclude functions like separators or highlight
//     };
//     return {
//         type: Add_UnProductive,
//         payload: sanitizedItem,
//     };
// };

export const AddUnProductive = item => ({
  type: Add_UnProductive,
  payload: item,
});
export const RemoveUnProductive = () => ({
  type: Remove_UnProductive,
});
export const GetUnProductive = () => ({
  type: Get_All_UnProductive,
});
// Action to delete a specific item by pricing_id or unique id
// action.js
export const RemoveFromCart = pricingId => ({
  type: 'REMOVE_FROM_CART',
  payload: pricingId,
});
