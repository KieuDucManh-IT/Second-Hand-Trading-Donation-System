import { useNavigate } from "react-router-dom";
export default function Checkout() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-6">
          Checkout
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Shipping Address"
            className="w-full border p-3 rounded-lg"
          />

          <select className="w-full border p-3 rounded-lg">
            <option>Cash On Delivery</option>
            <option>Bank Transfer</option>
          </select>

          <button
            onClick={() => {
              alert("Order placed successfully!");
              navigate("/orders");
            }}
            className="bg-green-500 text-white px-6 py-3 rounded-lg"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}