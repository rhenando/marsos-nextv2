// store/cartThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { removeSupplierItems } from "./cartSlice";

export const clearSupplierCart = createAsyncThunk(
  "cart/clearSupplierCart",
  async ({ userId, supplierId, items }, { dispatch }) => {
    // 1) batch-delete all Firestore docs for this supplier
    const batch = writeBatch(db);
    items
      .filter((i) => i.supplierId === supplierId)
      .forEach((i) => {
        const ref = doc(db, "carts", userId, "items", i.id);
        batch.delete(ref);
      });
    await batch.commit();

    // 2) update Redux immediately
    dispatch(removeSupplierItems(supplierId));
  }
);
