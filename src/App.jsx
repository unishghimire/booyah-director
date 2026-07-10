import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import ControlPanel from "./pages/ControlPanel";
import Overlay from "./pages/Overlay";

function NavBar() {
  const loc = useLocation();
  if (loc.pathname === "/overlay") return null;
  return (
    <nav style={{background:"#07070f",borderBottom:"1px solid rgba(249,115,22,0.2)",padding:"0 24px",height:"40px",display:"flex",alignItems:"center",gap:"24px",position:"fixed",top:0,left:0,right:0,zIndex:1000}}>
      <span style={{color:"#f97316",fontWeight:"black",fontSize:"13px",letterSpacing:"0.2em",fontFamily:"monospace"}}>⚡ BOOYAH DIRECTOR</span>
      <Link to="/control-panel" style={{color:loc.pathname==="/control-panel"?"#f97316":"rgba(255,255,255,0.5)",textDecoration:"none",fontSize:"12px",fontWeight:"bold",letterSpacing:"0.1em"}}>CONTROL PANEL</Link>
      <Link to="/overlay" target="_blank" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none",fontSize:"12px",letterSpacing:"0.1em"}}>OVERLAY ↗</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div style={{paddingTop:"40px",minHeight:"100vh"}}>
        <Routes>
          <Route path="/" element={<ControlPanel />} />
          <Route path="/control-panel" element={<ControlPanel />} />
          <Route path="/overlay" element={<Overlay />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
