
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/layout/MainLayout";
import Homepage from "./pages/Homepage";
import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/Dashboard";
import DonorSearch from "./pages/DonorSearch";
import BloodRequests from "./pages/BloodRequests";
import Emergency from "./pages/Emergency";
import Hospitals from "./pages/Hospitals";
import Map from "./pages/Map";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import HospitalLogin from "./pages/auth/HospitalLogin";
import HospitalRegistration from "./pages/auth/HospitalRegistration";
import HospitalAuth from "./pages/auth/HospitalAuth";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import NotFound from "./pages/NotFound";
import Awareness from "./pages/learn/Awareness";
import RequestPage from "./pages/Request";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/hospital-login" element={<HospitalLogin />} />
            <Route path="/auth/hospital-portal" element={<HospitalAuth />} />
            <Route path="/auth/hospital-registration" element={<HospitalRegistration />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/learn" element={<Awareness />} />
            <Route path="/request" element={<RequestPage />} />
            
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/donor-search" element={<DonorSearch />} />
              <Route path="/blood-requests" element={<BloodRequests />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/map" element={<Map />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
