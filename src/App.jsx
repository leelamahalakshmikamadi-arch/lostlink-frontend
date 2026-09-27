import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import LostItem from "./pages/LostItem";
import FoundItem from "./pages/FoundItem";
import Search from "./pages/Search";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ItemDetails from "./pages/ItemDetails";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lost-item" element={<LostItem />} />
          <Route path="/found-item" element={<FoundItem />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search/items/:id" element={<ItemDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;