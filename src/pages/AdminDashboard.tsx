import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import OrdersManager from '../components/admin/OrdersManager';
import ProductsManager from '../components/admin/ProductsManager';
import ClientsManager from '../components/admin/ClientsManager';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Dashboard from '../components/admin/Dashboard';

const AdminDashboard: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<OrdersManager />} />
          <Route path="/products" element={<ProductsManager />} />
          <Route path="/clients" element={<ClientsManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;