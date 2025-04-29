"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "firebase/auth";
import { db, auth } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { showSuccess, showError, showInfo } from "@/utils/toastUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const UserLogin = () => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          const role = userData.role || "buyer";
          router.push(role === "buyer" ? "/" : "/supplier-dashboard");
        } else {
          router.push("/register");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        }
      );
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 9) {
      showError("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const fullPhoneNumber = "+966" + phone;

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      showSuccess("OTP sent!");
      setShowOtpScreen(true);
    } catch (error) {
      showError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      showError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);

    try {
      const result = await window.confirmationResult.confirm(otp);
      showSuccess("Phone verified!");
    } catch (error) {
      showError("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <ToastContainer position='top-center' autoClose={3000} />
      <div id='recaptcha-container' />

      <Card className='w-[360px] shadow-lg'>
        <CardHeader>
          <CardTitle className='text-center text-2xl text-[#2c6449]'>
            {showOtpScreen ? "Enter OTP" : "Login with Phone"}
          </CardTitle>
        </CardHeader>

        <CardContent className='flex flex-col gap-4'>
          {showOtpScreen ? (
            <>
              <Input
                type='text'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <Button
                className='bg-[#2c6449] hover:bg-[#24523b]'
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className='animate-spin w-5 h-5' />
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold'>+966</span>
                <Input
                  type='tel'
                  placeholder='5XXXXXXXX'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <Button
                className='bg-[#2c6449] hover:bg-[#24523b]'
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className='animate-spin w-5 h-5' />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLogin;
