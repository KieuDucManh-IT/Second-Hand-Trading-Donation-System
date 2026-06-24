import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />

        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </AuthProvider>
    </ThemeProvider>
  );
}