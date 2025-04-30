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

import { showSuccess, showError } from "@/utils/toastUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const UserLogin = () => {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+966");
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
    if (!phone || phone.length < 7) {
      showError("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const fullPhoneNumber = `${countryCode}${phone}`;

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
      await window.confirmationResult.confirm(otp);
      showSuccess("Phone verified!");
    } catch (error) {
      showError("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full lg:grid lg:min-h-screen lg:grid-cols-2'>
      {/* Left Side: Form */}
      <div className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white'>
        <Card className='w-full max-w-md shadow-xl rounded-xl p-6'>
          <CardHeader>
            <CardTitle className='text-center text-3xl text-[#2c6449]'>
              {showOtpScreen ? "Enter OTP" : "Login with Phone"}
            </CardTitle>
          </CardHeader>

          <CardContent className='mt-6 space-y-6'>
            {showOtpScreen ? (
              <>
                <div className='flex justify-center'>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    className='mx-auto'
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className='w-full bg-[#2c6449] hover:bg-[#24523b]'
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
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className='border rounded px-2 py-2 bg-white text-sm'
                  >
                    <option value='+966'>🇸🇦 +966</option>
                    <option value='+971'>🇦🇪 +971</option>
                    <option value='+965'>🇰🇼 +965</option>
                    <option value='+973'>🇧🇭 +973</option>
                    <option value='+968'>🇴🇲 +968</option>
                    <option value='+974'>🇶🇦 +974</option>
                  </select>
                  <Input
                    type='tel'
                    placeholder='5XXXXXXXX'
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className='w-full bg-[#2c6449] hover:bg-[#24523b]'
                >
                  {loading ? (
                    <Loader2 className='animate-spin w-5 h-5' />
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </>
            )}

            <p className='text-center text-sm text-gray-500'>
              Don’t have an account?{" "}
              <a
                href='/register'
                className='font-medium text-[#2c6449] hover:underline'
              >
                Sign up
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right Side: Image */}
      <div className='hidden lg:block bg-muted'>
        <img
          src='https://source.unsplash.com/800x800/?login,security,technology'
          alt='Login Illustration'
          className='h-full w-full object-cover'
        />
      </div>

      {/* Hidden Toast & Recaptcha containers */}
      <div className='hidden'>
        <ToastContainer position='top-center' autoClose={3000} />
        <div id='recaptcha-container' />
      </div>
    </div>
  );
};

export default UserLogin;
