import { useState } from "react";
import { useNavigate } from "react-router-dom";export default function Cart() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Laptop Dell",
      price: 10000000,
      quantity: 1,
    },
    {
      id: 2,
      name: "iPhone 13",
      price: 12000000,
      quantity: 2,
    },
  ]);

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Shopping Cart
      </h1>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">{item.name}</td>

                <td>
                  {item.price.toLocaleString()}đ
                </td>

                <td>{item.quantity}</td>

                <td>
                  {(
                    item.price * item.quantity
                  ).toLocaleString()}
                  đ
                </td>

                <td>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold">
            Total: {total.toLocaleString()}đ
          </h2>

          <button
            onClick={() => navigate("/checkout")}
            className="bg-green-500 text-white px-6 py-3 rounded-lg"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}