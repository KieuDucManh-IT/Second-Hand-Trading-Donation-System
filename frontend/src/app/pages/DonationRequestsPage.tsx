import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Donation {
  _id: string;
  productId: {
    _id: string;
    title: string;
  };
  donorId: {
    _id: string;
    fullName: string;
  };
  requesterId: {
    _id: string;
    fullName: string;
  };
  message: string;
  status: string;
}

export default function DonationRequestsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDonations = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/donations"
      );

      const data = await res.json();

      setDonations(data);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const acceptDonation = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/donations/accept/${id}`,
        {
          method: "PUT",
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Đã chấp nhận yêu cầu");

      loadDonations();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const rejectDonation = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/donations/reject/${id}`,
        {
          method: "PUT",
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Đã từ chối yêu cầu");

      loadDonations();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Donation Requests
      </h1>

      {donations.length === 0 ? (
        <p>Chưa có yêu cầu nào.</p>
      ) : (
        donations.map((item) => (
          <div
            key={item._id}
            className="border rounded-lg p-4 mb-4 shadow"
          >
            <h2 className="text-xl font-semibold">
              {item.productId?.title}
            </h2>

            <p>
              Người yêu cầu:
              {" "}
              {item.requesterId?.fullName}
            </p>

            <p>
              Người đăng:
              {" "}
              {item.donorId?.fullName}
            </p>

            <p>
              Tin nhắn:
              {" "}
              {item.message}
            </p>

            <p>
              Trạng thái:
              {" "}
              <strong>{item.status}</strong>
            </p>

            {item.status === "pending" && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() =>
                    acceptDonation(item._id)
                  }
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    rejectDonation(item._id)
                  }
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}