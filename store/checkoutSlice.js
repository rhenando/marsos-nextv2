// store/checkoutSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "@/firebase/config";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

// Base URL for your external Express server
const API_BASE = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:5001";

// --- Async thunk for SADAD orders ---
export const createSadadOrder = createAsyncThunk(
  "checkout/createSadadOrder",
  async ({ base, form }, { rejectWithValue }) => {
    try {
      // Proxy to external Express invoice endpoint
      const res = await fetch(`${API_BASE}/api/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...base,
          ...form,
          billNumber: Date.now().toString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const invoice = await res.json();

      // Save order to Firestore
      await setDoc(doc(db, "orders", invoice.billNumber), {
        orderId: invoice.billNumber,
        method: "sadad",
        ...base,
        customer: {
          uid: form.uid,
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
          address: {
            address: form.address,
            suite: form.suite,
            city: form.city,
            state: form.state,
            zip: form.zip,
          },
        },
        sadadNumber: invoice.billNumber,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      return invoice.billNumber;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  suite: "",
  city: "",
  state: "",
  zip: "",
  isGift: false,
  uid: "",
};

const slice = createSlice({
  name: "checkout",
  initialState: {
    form: { ...initialForm },
    paymentMethod: "hyperpay",
    loading: false,
    error: null,
    orderId: null,
  },
  reducers: {
    updateField(state, { payload: { name, value } }) {
      state.form[name] = value;
    },
    setPaymentMethod(state, { payload }) {
      state.paymentMethod = payload;
    },
    resetCheckout(state) {
      state.form = { ...initialForm };
      state.paymentMethod = "hyperpay";
      state.loading = false;
      state.error = null;
      state.orderId = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createSadadOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSadadOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orderId = action.payload;
      })
      .addCase(createSadadOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateField, setPaymentMethod, resetCheckout } = slice.actions;
export default slice.reducer;
