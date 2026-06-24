import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, Lock, MapPin, Phone, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

type LocationItem = {
    _id: string;
    phoneNumber: string;
    address: string;
};

export function AccountSettingsPage() {
    const [activeTab, setActiveTab] = useState<"password" | "location">("password");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [phoneNumber, setPhoneNumber] = useState("");
    const [location, setLocation] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordError, setPasswordError] = useState("");
    const [locationError, setLocationError] = useState("");

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

    const { user, updateProfile } = useAuth();

    const fetchMyLocations = async () => {
        try {
            setListLoading(true);
            setLocationError("");

            const token = sessionStorage.getItem("token");

            if (!token) {
                throw new Error("You are not logged in");
            }

            const res = await fetch("http://localhost:5000/api/location/my-locations", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Backend không trả về JSON. Kiểm tra lại API get locations.");
            }

            if (!res.ok) {
                throw new Error(data.message || "Get locations failed");
            }

            setLocations(data.locations || []);
        } catch (err: any) {
            setLocationError(err.message || "Get locations failed");
            toast.error(err.message || "Get locations failed");
        } finally {
            setListLoading(false);
        }
    };

    const handleDeleteLocation = async (locationId: string) => {
        try {
            setDeleteLoadingId(locationId);
            setLocationError("");

            const token = sessionStorage.getItem("token");

            if (!token) {
                throw new Error("You are not logged in");
            }

            const res = await fetch(
                `http://localhost:5000/api/location/delete-location/${locationId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Backend không trả về JSON. Kiểm tra lại API delete location.");
            }

            if (!res.ok) {
                throw new Error(data.message || "Delete location failed");
            }

            toast.success(data.message || "Location deleted successfully!");

            setLocations(data.locations || []);
        } catch (err: any) {
            setLocationError(err.message || "Delete location failed");
            toast.error(err.message || "Delete location failed");
        } finally {
            setDeleteLoadingId(null);
        }
    };
    useEffect(() => {
        if (activeTab === "location") {
            fetchMyLocations();
        }
    }, [activeTab]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");

        const isCreatingPassword = user?.hasPassword === false;

        if (!isCreatingPassword && !currentPassword) {
            setPasswordError("Please enter your current password");
            return;
        }

        if (!newPassword || !confirmPassword) {
            setPasswordError("Please fill in new password and confirm password");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Confirm password does not match");
            return;
        }

        if (!isCreatingPassword && currentPassword === newPassword) {
            setPasswordError("New password cannot be the same as current password");
            return;
        }

        try {
            setPasswordLoading(true);

            const token = sessionStorage.getItem("token");

            if (!token) {
                throw new Error("You are not logged in");
            }

            const res = await fetch("http://localhost:5000/api/auth/change-password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: isCreatingPassword ? "" : currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Change password failed");
            }

            toast.success(data.message || "Password updated successfully!");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            updateProfile({
                hasPassword: true,
            });
        } catch (err: any) {
            setPasswordError(err.message || "Change password failed");
            toast.error(err.message || "Change password failed");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationError("");

    if (!phoneNumber.trim()) {
        setLocationError("Please enter your phone number");
        return;
    }

    if (!location.trim()) {
        setLocationError("Please enter your address");
        return;
    }

    try {
        setLocationLoading(true);

        const token = sessionStorage.getItem("token");

        if (!token) {
            throw new Error("You are not logged in");
        }

        const res = await fetch("http://localhost:5000/api/location/add-location", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                phoneNumber,
                address: location,
            }),
        });

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("Backend không trả về JSON. Kiểm tra lại API URL hoặc route backend.");
        }

        if (!res.ok) {
            throw new Error(data.message || "Update location failed");
        }

        toast.success(data.message || "Location added successfully!");

        await fetchMyLocations();

        setPhoneNumber("");
        setLocation("");
    } catch (err: any) {
        setLocationError(err.message || "Update location failed");
        toast.error(err.message || "Update location failed");
    } finally {
        setLocationLoading(false);
    }
};


    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        Account Settings
                    </CardTitle>

                    <CardDescription>
                        Manage your password, phone number and address
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant={activeTab === "password" ? "default" : "outline"}
                            onClick={() => setActiveTab("password")}
                            className={
                                activeTab === "password"
                                    ? "bg-gradient-to-r from-green-500 to-blue-500"
                                    : ""
                            }
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                        </Button>

                        <Button
                            type="button"
                            variant={activeTab === "location" ? "default" : "outline"}
                            onClick={() => setActiveTab("location")}
                            className={
                                activeTab === "location"
                                    ? "bg-gradient-to-r from-green-500 to-blue-500"
                                    : ""
                            }
                        >
                            <MapPin className="w-4 h-4 mr-2" />
                            Location
                        </Button>
                    </div>

                    {activeTab === "password" && (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{passwordError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>

                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        autoComplete="current-password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>

                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>

                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? "Updating password..." : "Update Password"}
                            </Button>
                        </form>
                    )}

                    {activeTab === "location" && (
                        <div className="space-y-6">
                            <form onSubmit={handleUpdateLocation} className="space-y-4">
                                {locationError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{locationError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>

                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                        <Input
                                            id="phoneNumber"
                                            type="text"
                                            placeholder="Enter your phone number"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Address</Label>

                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                        <Input
                                            id="location"
                                            type="text"
                                            placeholder="Enter your address"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? "Saving..." : "Save Location"}
                                </Button>
                            </form>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">My Locations</h3>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchMyLocations}
                                        disabled={listLoading}
                                    >
                                        {listLoading ? "Loading..." : "Refresh"}
                                    </Button>
                                </div>

                                {listLoading ? (
                                    <p className="text-sm text-gray-500">Loading locations...</p>
                                ) : locations.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-500">
                                        You do not have any saved locations yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {locations.map((item) => (
                                            <div
                                                key={item._id}
                                                className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-900"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="w-4 h-4 text-green-500" />
                                                        <span className="font-medium">{item.phoneNumber}</span>
                                                    </div>

                                                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                                                        <span>{item.address}</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteLocation(item._id)}
                                                    disabled={deleteLoadingId === item._id}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    {deleteLoadingId === item._id ? "Deleting..." : "Delete"}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link
                            to="/"
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}