import React, { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Notification from "../global/Notification";
import logo from "../../assets/logo.svg";

import CreatableSelect from "react-select/creatable";

const SupplierRegistration = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [crNumber, setCrNumber] = useState("");
  const [crLicense, setCrLicense] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [otherCitiesServed, setOtherCitiesServed] = useState([]);
  const [deliveryOption, setDeliveryOption] = useState("own");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationContent, setNotificationContent] = useState({
    title: "",
    message: "",
  });

  const navigate = useNavigate();

  const showNotification = (title, message) => {
    setNotificationContent({ title, message });
    setIsNotificationOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      showNotification(
        "Authentication Required",
        "User is not authenticated. Please log in."
      );
      navigate("/login");
      return;
    }

    if (!companyLogo) {
      showNotification("Please upload your company logo before proceeding.");
      return;
    }

    const fullPhoneNumber = localStorage.getItem("userPhone");
    if (!fullPhoneNumber) {
      showNotification("Error", "Phone number not found. Please log in again.");
      navigate("/login");
      return;
    }

    const uid = user.uid;
    const storage = getStorage();

    try {
      let companyLogoURL = null;
      let crLicenseURL = null;

      if (companyLogo) {
        const logoRef = ref(storage, `logos/${uid}-${companyLogo.name}`);
        const logoSnapshot = await uploadBytes(logoRef, companyLogo);
        companyLogoURL = await getDownloadURL(logoSnapshot.ref);
      }

      if (crLicense) {
        const licenseRef = ref(storage, `licenses/${uid}-${crLicense.name}`);
        const licenseSnapshot = await uploadBytes(licenseRef, crLicense);
        crLicenseURL = await getDownloadURL(licenseSnapshot.ref);
      }

      const validatedData = {
        role: "supplier",
        name: name || "Unknown",
        email: email || null,
        phone: fullPhoneNumber || "Unknown",
        companyName: companyName || "Unnamed Company",
        companyLogo: companyLogoURL || null,
        crNumber: crNumber || "Unknown",
        crLicense: crLicenseURL || null,
        address: address || "No Address",
        city: city || "No City",
        region: region || "No Region",
        otherCitiesServed: Array.isArray(otherCitiesServed)
          ? otherCitiesServed.map((option) => option.value)
          : [],
        deliveryOption: deliveryOption || "own",
        uid: uid || "Unknown",
        supplierId: uid || "Unknown",
      };

      // console.log("Validated Data for Firestore:", validatedData);

      await setDoc(doc(db, "users", uid), validatedData, { merge: true });

      showNotification(
        "Success",
        "Supplier registered successfully! Redirecting to your dashboard."
      );
      navigate("/supplier-dashboard");

      // Clear form fields
      setName("");
      setEmail("");
      setCompanyName("");
      setCompanyLogo(null);
      setCrNumber("");
      setCrLicense(null);
      setAddress("");
      setCity("");
      setRegion("");
      setOtherCitiesServed([]);
      setDeliveryOption("own");
    } catch (error) {
      console.error("Error registering supplier:", error.code, error.message);
      showNotification(
        "Error",
        "Failed to register supplier. Please try again."
      );
    }
  };

  const saudiCities = [
    "Riyadh",
    "Jeddah",
    "Mecca",
    "Medina",
    "Dammam",
    "Khobar",
    "Taif",
    "Tabuk",
    "Qatif",
    "Abha",
    "Khamis Mushait",
    "Al Khafji",
    "Hafar Al-Batin",
    "Al Qunfudhah",
    "Yanbu",
    "Najran",
    "Jizan",
    "Al Hasa",
    "Hail",
    "Al Baha",
    "Al Jubail",
  ];

  const saudiCityOptions = saudiCities.map((city) => ({
    label: city,
    value: city,
  }));

  return (
    <Container
      fluid
      className='d-flex flex-column align-items-center justify-content-center'
      style={{ minHeight: "100vh", backgroundColor: "#f7f7f7" }}
    >
      <div className='text-center mb-4 d-flex flex-column align-items-center'>
        <img
          src={logo}
          alt='Logo'
          style={{ width: "80px", marginBottom: "10px" }}
        />
        <h2 style={{ color: "#2d6a4f", fontWeight: "bold" }}>
          Supplier Registration
        </h2>
      </div>

      <Form
        onSubmit={handleSubmit}
        className='p-4 border rounded shadow-sm bg-white'
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "8px",
          margin: "0 auto",
        }}
      >
        <Form.Group controlId='formName' className='mb-3'>
          <Form.Control
            type='text'
            placeholder='Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId='formEmail' className='mb-3'>
          <Form.Control
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId='formCompanyName' className='mb-3'>
          <Form.Control
            type='text'
            placeholder='Company Name'
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId='formCompanyLogo' className='mb-3'>
          <div
            className='mb-1'
            style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#2d6a4f" }}
          >
            Upload your company logo (e.g., PNG or JPEG)
          </div>
          <Form.Control
            type='file'
            onChange={(e) => setCompanyLogo(e.target.files[0])}
            accept='image/*'
          />
        </Form.Group>

        <Form.Group controlId='formCrNumber' className='mb-3'>
          <Form.Control
            type='text'
            placeholder='CR Number'
            value={crNumber}
            onChange={(e) => setCrNumber(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId='formCrLicense' className='mb-3'>
          <div
            className='mb-1'
            style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#2d6a4f" }}
          >
            Upload CR document (e.g., PDF or JPEG)
          </div>
          <Form.Control
            type='file'
            onChange={(e) => setCrLicense(e.target.files[0])}
            accept='image/*,.pdf'
          />
        </Form.Group>

        <Form.Group controlId='formAddress' className='mb-3'>
          <Form.Control
            type='text'
            placeholder='Full Address'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId='formCity' className='mb-3'>
          <Form.Control
            type='text'
            placeholder='City'
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId='formRegion' className='mb-3'>
          <Form.Control
            type='text'
            placeholder='Region'
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId='formOtherCitiesServed' className='mb-3'>
          <CreatableSelect
            isMulti
            options={saudiCityOptions}
            value={otherCitiesServed}
            onChange={(selectedOptions) =>
              setOtherCitiesServed(selectedOptions || [])
            }
            placeholder='Other Cities Served'
          />
        </Form.Group>

        <Form.Group controlId='formDeliveryOption' className='mb-3'>
          <div>
            <Form.Check
              type='radio'
              label='Own Delivery'
              name='deliveryOption'
              value='own'
              checked={deliveryOption === "own"}
              onChange={(e) => setDeliveryOption(e.target.value)}
            />
            <Form.Check
              type='radio'
              label='Outside Delivery'
              name='deliveryOption'
              value='outside'
              checked={deliveryOption === "outside"}
              onChange={(e) => setDeliveryOption(e.target.value)}
            />
          </div>
        </Form.Group>

        <Button
          variant='success'
          type='submit'
          className='w-100'
          style={{ backgroundColor: "#2d6a4f", borderColor: "#2d6a4f" }}
        >
          Continue
        </Button>
      </Form>

      <Notification
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title={notificationContent.title}
        message={notificationContent.message}
        duration={300}
      />
    </Container>
  );
};

export default SupplierRegistration;
