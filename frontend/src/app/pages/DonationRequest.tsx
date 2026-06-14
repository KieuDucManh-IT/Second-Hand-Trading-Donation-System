import { useState } from "react";

export default function DonationRequest() {
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    image: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(formData);

    alert("Donation request submitted!");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">
          Donation Request
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Item Name"
            className="w-full border p-3 rounded-lg"
            onChange={(e) =>
              setFormData({
                ...formData,
                itemName: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Description"
            rows={5}
            className="w-full border p-3 rounded-lg"
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Image URL"
            className="w-full border p-3 rounded-lg"
            onChange={(e) =>
              setFormData({
                ...formData,
                image: e.target.value,
              })
            }
          />

          <button
            className="bg-green-500 text-white px-6 py-3 rounded-lg"
            type="submit"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}