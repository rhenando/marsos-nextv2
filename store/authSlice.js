// store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

// 1️⃣ Thunk to watch auth state
export const watchAuthState = createAsyncThunk(
  "auth/watchAuthState",
  async (_, { dispatch }) => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // pull Firestore profile
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const profile = userSnap.exists() ? userSnap.data() : {};

        // convert createdAt to a serializable number (ms since epoch)
        const createdAtRaw = profile.createdAt;
        const createdAt = createdAtRaw?.toMillis?.() ?? null;

        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName:
              profile.displayName ?? profile.name ?? user.displayName ?? "",
            role: profile.role ?? "",
            createdAt, // now a plain number
          })
        );
      } else {
        dispatch(clearUser());
      }
    });
  }
);

// 2️⃣ Thunk to log in (also fetch your profile)
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // fetch Firestore profile
      const userDocRef = doc(db, "users", cred.user.uid);
      const userSnap = await getDoc(userDocRef);
      const profile = userSnap.exists() ? userSnap.data() : {};

      const createdAtRaw = profile.createdAt;
      const createdAt = createdAtRaw?.toMillis?.() ?? null;

      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName:
          profile.displayName ?? profile.name ?? cred.user.displayName ?? "",
        role: profile.role ?? "",
        createdAt,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 3️⃣ Thunk to log out
export const logout = createAsyncThunk("auth/logout", async () => {
  const auth = getAuth();
  await signOut(auth);
});

const slice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      // logout
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
      })
      // watchAuthState
      .addCase(watchAuthState.pending, (s) => {
        s.loading = true;
      })
      .addCase(watchAuthState.fulfilled, (s) => {
        s.loading = false;
      });
  },
});

export const { setUser, clearUser } = slice.actions;
export default slice.reducer;
