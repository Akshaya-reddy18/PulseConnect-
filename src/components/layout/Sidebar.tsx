import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Heart,
  Home,
  LogOut,
  Map,
  MessageCircle,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
}

const SidebarLink = ({ to, icon, label, isActive }: SidebarLinkProps) => (
  <Link to={to}>
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 my-1",
        isActive ? "bg-blood-50 text-blood hover:bg-blood-50 hover:text-blood" : ""
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  </Link>
);

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const links = [
    { to: "/dashboard", icon: <Home size={20} />, label: "Dashboard" },
    { to: "/plasma", icon: <UserPlus size={20} />, label: "Plasma Center" },
    { to: "/donor-search", icon: <Users size={20} />, label: "Donor Search" },
    { to: "/blood-requests", icon: <Heart size={20} />, label: "Blood Requests" },
    { to: "/emergency", icon: <AlertTriangle size={20} />, label: "Emergency" },
    { to: "/hospitals", icon: <Activity size={20} />, label: "Hospitals" },
    { to: "/map", icon: <Map size={20} />, label: "Map" },
    { to: "/profile", icon: <User size={20} />, label: "Profile" },
    { to: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Heart className="text-blood" size={24} />
          <h1 className="font-bold text-xl">PulseConnect+</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Emergency Support System</p>
      </div>

      <div className="flex-1 py-4 px-2 overflow-y-auto">
        {links.map((link) => (
          <SidebarLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            isActive={path === link.to}
          />
        ))}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-500"
          onClick={async () => { await signOut(); navigate('/auth'); }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
