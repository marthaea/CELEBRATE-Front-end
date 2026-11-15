import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Footer, Header } from "./components.jsx";
import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import Service from "./pages/Service.jsx";
import Plan from "./pages/Plan.jsx";
import Pay from "./pages/Pay.jsx";
import Receipt from "./pages/Receipt.jsx";
import Bookings from "./pages/Bookings.jsx";
import Budget from "./pages/Budget.jsx";
import { Account, NotFound, Vendors } from "./pages/Simple.jsx";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Header overHero={pathname === "/"} />
      <main id="main" key={pathname} className="fade">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:category" element={<Services />} />
          <Route path="/service/:id" element={<Service />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/pay" element={<Pay />} />
          <Route path="/receipt/:id" element={<Receipt />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
