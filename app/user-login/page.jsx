"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Phone, Lock } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("phone"); // "phone" | "otp" | "register"
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");

  const fullPhoneNumber = `${countryCode}${phone}`;

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible", callback: () => {} }
      );
    }
  };

  const handleSendOtp = async () => {
    if (!termsAccepted) {
      toast.error("You must accept the terms and privacy policy.");
      return;
    }
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
        const data = userDoc.data();
        toast.success("Welcome back!");
        router.push(data.role === "supplier" ? "/supplier-dashboard" : "/");
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
    <div className='lg:grid lg:grid-cols-2 min-h-screen'>
      {/* Left: Auth Form */}
      <div className='bg-gray-50 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='w-full max-w-md space-y-8'>
            {/* Heading */}
            <div className='text-center mt-4'>
              <h2 className='text-xl sm:text-2xl font-extrabold text-gray-900'>
                {stage === "phone"
                  ? "Login to your account"
                  : stage === "otp"
                  ? "Enter OTP"
                  : "Complete Profile"}
              </h2>
              <p className='mt-2 text-sm text-gray-600'>
                {stage === "phone"
                  ? "Enter your phone number to continue"
                  : stage === "otp"
                  ? "We’ve sent you a 6-digit code"
                  : "Fill in your details"}
              </p>
            </div>

            {/* Form Card */}
            <Card className='bg-white shadow-lg rounded-lg overflow-hidden'>
              <CardContent className='px-6 py-8 space-y-6'>
                {stage === "phone" && (
                  <>
                    <div className='relative flex gap-2'>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className='border rounded-md bg-white px-3 py-2 text-sm w-28'
                      >
                        <option value='+966'>🇸🇦 +966</option>
                        <option value='+971'>🇦🇪 +971</option>
                      </select>

                      <div className='relative flex-1'>
                        <Input
                          type='tel'
                          placeholder='5XXXXXXXX'
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, ""))
                          }
                          className='pr-10'
                        />
                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                          <Phone className='h-5 w-5 text-gray-400' />
                        </div>
                      </div>
                    </div>

                    <label className='flex items-center space-x-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className='h-4 w-4 text-black border-gray-300 rounded'
                      />
                      <span>
                        I accept the{" "}
                        <a
                          href='/terms'
                          target='_blank'
                          className='text-primary font-medium hover:underline'
                        >
                          Terms & Conditions
                        </a>{" "}
                        and{" "}
                        <a
                          href='/privacy'
                          target='_blank'
                          className='text-primary font-medium hover:underline'
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>

                    <Button
                      onClick={handleSendOtp}
                      disabled={loading || !termsAccepted}
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900 disabled:opacity-50'
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </Button>
                  </>
                )}

                {stage === "otp" && (
                  <>
                    <div className='flex justify-center'>
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className='flex justify-center space-x-2'>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className='w-10 h-10 text-center border rounded-md'
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900'
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </>
                )}

                {stage === "register" && (
                  <>
                    <div className='relative'>
                      <Input
                        placeholder='Full Name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='pr-10'
                      />
                      <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                        <Lock className='h-5 w-5 text-gray-400' />
                      </div>
                    </div>

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
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900'
                    >
                      {loading ? "Saving..." : "Create Account"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Panel fills entire right column */}
      <div className='hidden lg:flex bg-gradient-to-br from-[#2c6449] to-green-400 text-white flex-col items-center justify-center p-10'>
        <img src='/logo.svg' alt='Marsos Logo' className='w-28 mb-4' />
        <h1 className='text-4xl font-bold mb-4'>Welcome to Marsos</h1>
        <p className='text-lg max-w-sm text-center opacity-80'>
          Trust made visible. Trade made simple.
        </p>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id='recaptcha-container' className='hidden' />
    </div>
  );
}
