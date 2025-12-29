import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import NewUser from "./components/NewUser";
import InvoiceList from "./components/InvoiceList";
import UserList from "./components/UserList";
import Layout from "./components/Layout";
const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/user/create" element={<NewUser />} />
        <Route path="/invoice/list" element={<InvoiceList />} />
        <Route path="/user/list" element={<UserList />} />
      </Route>
    </Routes>
  );
};

export default App;
