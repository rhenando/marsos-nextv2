"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function AuthPage() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("phone"); // phone | otp | register

  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");

  const fullPhoneNumber = `${countryCode}${phone}`;

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
      toast.error("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      toast.success("OTP sent!");
      setStage("otp");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      setUserId(user.uid);

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        toast.success("Welcome back!");
        router.push(userData.role === "supplier" ? "/supplier-dashboard" : "/");
      } else {
        setStage("register");
      }
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    try {
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        name,
        phone: fullPhoneNumber,
        role,
        createdAt: new Date(),
      });

      toast.success("Account created!");
      router.push(role === "supplier" ? "/supplier-dashboard" : "/");
    } catch (err) {
      console.error(err);
      toast.error("Error saving user data.");
    }
  };

  return (
    <div className='w-full lg:grid lg:min-h-screen lg:grid-cols-2'>
      {/* Left Side */}
      <div className='flex items-center justify-center px-4 py-12 bg-white'>
        <Card className='w-full max-w-md shadow-xl rounded-xl p-6'>
          <CardHeader>
            <CardTitle className='text-center text-2xl text-[#2c6449]'>
              {stage === "phone"
                ? "Login or Register"
                : stage === "otp"
                ? "Enter OTP"
                : "Complete Profile"}
            </CardTitle>
          </CardHeader>

          <CardContent className='mt-6 space-y-6'>
            {stage === "phone" && (
              <>
                <div className='flex gap-2'>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className='border rounded px-2 py-2 bg-white text-sm'
                  >
                    <option value='+966'>🇸🇦 +966</option>
                    <option value='+971'>🇦🇪 +971</option>
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
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </>
            )}

            {stage === "otp" && (
              <>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className='w-full bg-[#2c6449] hover:bg-[#24523b]'
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}

            {stage === "register" && (
              <>
                <Input
                  placeholder='Full Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className='flex gap-2'>
                  <Button
                    variant={role === "buyer" ? "default" : "outline"}
                    onClick={() => setRole("buyer")}
                    className='flex-1'
                  >
                    Buyer
                  </Button>
                  <Button
                    variant={role === "supplier" ? "default" : "outline"}
                    onClick={() => setRole("supplier")}
                    className='flex-1'
                  >
                    Supplier
                  </Button>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className='w-full bg-[#2c6449] hover:bg-[#24523b]'
                >
                  {loading ? "Saving..." : "Create Account"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side Illustration */}
      <div className='hidden lg:block bg-muted'>
        <img
          src='https://source.unsplash.com/800x800/?commerce,login'
          alt='Login Illustration'
          className='h-full w-full object-cover'
        />
      </div>

      {/* Recaptcha container */}
      <div id='recaptcha-container' />
    </div>
  );
}
