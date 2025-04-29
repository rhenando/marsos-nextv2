// app/product/[id]/page.jsx
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProductDetailsClient from "@/components/product/ProductDetailsClient"; // Client component

export default async function ProductPage({ params }) {
  const id = params.id;

  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return <p>Product not found.</p>;
  }

  const product = docSnap.data();

  return (
    <ProductDetailsClient
      product={{
        id,
        ...product,
        createdAt: product.createdAt?.toMillis?.() || null,
        updatedAt: product.updatedAt?.toMillis?.() || null,
      }}
    />
  );
}
