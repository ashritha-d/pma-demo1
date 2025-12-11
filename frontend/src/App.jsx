import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Index from "./pages/Index.jsx";
import AddOwner from "./pages/owners/AddOwner";
import ModifyOwner from "./pages/owners/ModifyOwner.jsx";
import DeleteOwner from "./pages/owners/DeleteOwner.jsx";
import OwnersList from "./pages/owners/OwnersList.jsx";
import AddProperty from "./pages/property/AddProperty.jsx";
import ModifyProperty from "./pages/property/ModifyProperty.jsx";
import DeleteProperty from "./pages/property/DeleteProperty.jsx";
import ListProperty from "./pages/property/ListProperty.jsx";
import AddTenant from "./pages/Tenants/AddTenant.jsx";
import ModifyTenant from "./pages/Tenants/ModifyTenant.jsx";
import DeleteTenant from "./pages/Tenants/DeleteTenant.jsx";
import ListTenant from "./pages/Tenants/ListTenant.jsx";
import AddContract from "./pages/contractmaster/AddContract.jsx";
import ModifyContract from "./pages/contractmaster/ModifyContract.jsx";
import DeleteContract from "./pages/contractmaster/DeleteContract.jsx";
import ListContract from "./pages/contractmaster/ListContract.jsx";
import ViewProperty from "./pages/property/ViewProperty.jsx";
import ViewTenant from "./pages/Tenants/ViewTenant.jsx";
import AddFinTrans from "./pages/FinTrans/AddFinTrans.jsx";
import EditFinTrans from "./pages/FinTrans/EditFinTrans.jsx";
import ListFinTrans from "./pages/FinTrans/ListFinTrans.jsx";
import AddServTrans from "./pages/ServiceTrans/AddServTrans.jsx";
import EditServTrans from "./pages/ServiceTrans/EditServTrans.jsx";
import ListServTrans from "./pages/ServiceTrans/ListServTrans.jsx";
import AddFin from "./pages/FinTrans/AddFin.jsx"
import UsersList from "./pages/users/UsersList";
import AddUser from "./pages/users/AddUser";
import EditUser from "./pages/users/EditUser";
import DeleteUser from "./pages/users/DeleteUser";



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} /> {/* default redirect */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/index" element={<Index />} />
        <Route path="/owners/AddOwner" element={<AddOwner />} />
        <Route path="/owners/ModifyOwner" element={<ModifyOwner />} />
        <Route path="/owners/DeleteOwner" element={<DeleteOwner />} />
        <Route path="/owners/OwnersList" element={<OwnersList />} />
        <Route path="/property/AddProperty" element={<AddProperty />} />
        <Route path="/property/ModifyProperty" element={<ModifyProperty />} />
        <Route path="/property/DeleteProperty" element={<DeleteProperty />} />
        <Route path="/property/ListProperty" element={<ListProperty />} />
        <Route path="/Tenants/AddTenant" element={<AddTenant />} />
        <Route path="/Tenants/ModifyTenant" element={<ModifyTenant />} />
        <Route path="/Tenants/DeleteTenant" element={<DeleteTenant />} />
        <Route path="/Tenants/ListTenant" element={<ListTenant />} />
        <Route path="/contractmaster/AddContract" element={<AddContract />} />
        <Route path="/contractmaster/ModifyContract" element={<ModifyContract />} />
        <Route path="/contractmaster/DeleteContract" element={<DeleteContract />} />
        <Route path="/contractmaster/ListContract" element={<ListContract />} />
         <Route path="/property/view_property/:property_code" element={<ViewProperty />} />
        <Route path="/Tenants/view_tenant/:tenant_id" element={<ViewTenant />} />
         <Route path="/FinTrans/AddFinTrans" element={<AddFinTrans />} />
<Route path="/fintrans/addfintrans/:contract_id" element={<AddFinTrans />} />
         <Route path="/FinTrans/EditFinTrans" element={<EditFinTrans />} />
         <Route path="/FinTrans/ListFinTrans" element={<ListFinTrans />} />
         <Route path="/ServiceTrans/AddServTrans" element={<AddServTrans />} />
         <Route path="/ServiceTrans/EditServTrans" element={<EditServTrans />} />
         <Route path="/ServiceTrans/ListServTrans" element={<ListServTrans />} />
         <Route path="/FinTrans/AddFin" element={<AddFin />} />
<Route path="/users/UsersList" element={<UsersList />} />
        <Route path="/users/AddUser" element={<AddUser />} />
        <Route path="/users/EditUser" element={<EditUser />} />
        <Route path="/users/DeleteUser" element={<DeleteUser />} />

      </Routes>
    </Router>
  );
};

export default App;
