export default function Notification() {
  const notifications = [
    {
      id: 1,
      message: "Your donation request has been approved",
    },
    {
      id: 2,
      message: "Order #1234 has been shipped",
    },
    {
      id: 3,
      message: "You received a new message",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Notifications
      </h1>

      <div className="space-y-4">
        {notifications.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded-lg p-4"
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}