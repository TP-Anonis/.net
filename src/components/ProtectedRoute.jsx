import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  // Nếu không có người dùng hoặc vai trò không được phép, chuyển hướng về trang chủ
  if (!user || !allowedRoles.includes(user.roleId)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;