import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { File, Image, MapPin } from "feather-icons-react";

const SupplierChatPage = () => {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [buyerName, setBuyerName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUserName = async (userId, setName) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setName(userData.name || "Unknown User");
      } else {
        setName("Unknown User");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
      setName("Unknown User");
    }
  };

  useEffect(() => {
    const chatRef = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(chatRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCartItems(data.cartItems || []);
        setMessages(data.messages || []);

        if (data.buyerId) await fetchUserName(data.buyerId, setBuyerName);
        if (data.supplierId)
          await fetchUserName(data.supplierId, setSupplierName);
      } else {
        console.warn("Chat document does not exist.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleFieldChange = async (itemId, field, value) => {
    const updatedCartItems = cartItems.map((item) =>
      item.cartId === itemId ? { ...item, [field]: value } : item
    );

    // Recalculate Subtotal
    const item = updatedCartItems.find((item) => item.cartId === itemId);
    if (["price", "shippingCost", "quantity"].includes(field)) {
      item.subtotal = (
        item.quantity * item.price +
        (item.shippingCost || 0)
      ).toFixed(2);
    }

    setCartItems(updatedCartItems);

    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, { cartItems: updatedCartItems });

      // Also update buyer's cart
      const buyerId = cartItems[0]?.buyerId;
      const cartRef = doc(db, "carts", buyerId);
      await updateDoc(cartRef, { items: updatedCartItems });
    } catch (error) {
      console.error("Error updating field:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatRef = doc(db, "chats", chatId);

    try {
      await updateDoc(chatRef, {
        messages: arrayUnion({
          senderId: currentUser.uid,
          senderName: currentUser.displayName || supplierName,
          message: newMessage,
          timestamp: new Date().toISOString(),
        }),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleUploadFile = () => {
    console.log("Upload File clicked");
  };

  const handleUploadImage = () => {
    console.log("Upload Image clicked");
  };

  const handleUploadLocation = () => {
    console.log("Upload Location clicked");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className='container my-4'>
      <h2 className='mb-4'>Manage Buyer Cart</h2>
      <h3>Cart Details</h3>
      <table className='table table-bordered'>
        <thead>
          <tr>
            <th>Image</th>
            <th>Item</th>
            <th>Size</th>
            <th>Color</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Shipping</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.cartId}>
              <td>
                <img
                  src={item.mainImageUrl || "https://via.placeholder.com/100"}
                  alt={item.name}
                  style={{ width: "50px", height: "50px" }}
                />
              </td>
              <td>{item.name}</td>
              <td>{item.size || "Not selected"}</td>
              <td>{item.color || "Not selected"}</td>
              <td>
                <input
                  type='number'
                  value={item.quantity}
                  min='1'
                  onChange={(e) =>
                    handleFieldChange(
                      item.cartId,
                      "quantity",
                      parseInt(e.target.value, 10)
                    )
                  }
                  className='form-control form-control-sm'
                />
              </td>
              <td>
                <input
                  type='number'
                  value={item.price}
                  onChange={(e) =>
                    handleFieldChange(
                      item.cartId,
                      "price",
                      parseFloat(e.target.value)
                    )
                  }
                  className='form-control form-control-sm'
                />
              </td>
              <td>
                <input
                  type='number'
                  value={item.shippingCost || 0}
                  onChange={(e) =>
                    handleFieldChange(
                      item.cartId,
                      "shippingCost",
                      parseFloat(e.target.value)
                    )
                  }
                  className='form-control form-control-sm'
                />
              </td>
              <td>${item.subtotal || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className='mt-4'>Messages</h3>
      <div
        className='chat-box border rounded p-3 mb-3 bg-light'
        style={{
          height: "350px",
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.length ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`d-flex flex-column mb-3 ${
                msg.senderId === currentUser.uid
                  ? "align-items-end"
                  : "align-items-start"
              }`}
            >
              <div className='text-muted small mb-1'>
                {msg.senderId === currentUser.uid
                  ? "You"
                  : msg.senderName || buyerName}
              </div>

              <div className='bg-white border rounded px-3 py-2'>
                <div>{msg.message}</div>
                <div className='text-end mt-2'>
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className='text-muted text-center'>No messages yet.</p>
        )}
      </div>

      <div className='input-group'>
        <input
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className='form-control'
          placeholder='Type your message...'
        />
        <button onClick={handleSendMessage} className='btn btn-primary'>
          Send
        </button>
        <div className='d-flex align-items-center ms-2'>
          <button
            className='btn btn-light'
            onClick={handleUploadFile}
            title='Upload File'
          >
            <File />
          </button>
          <button
            className='btn btn-light mx-2'
            onClick={handleUploadImage}
            title='Upload Image'
          >
            <Image />
          </button>
          <button
            className='btn btn-light'
            onClick={handleUploadLocation}
            title='Upload Location'
          >
            <MapPin />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierChatPage;
