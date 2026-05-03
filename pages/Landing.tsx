import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === Role.ADMIN) {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } else {
      navigate("/login");
    }
  }, [navigate, isAuthenticated, user]);

  return null;
};

export default Landing;
