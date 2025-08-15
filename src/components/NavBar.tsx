// src/components/NavBar.tsx

type Props = {
    activeTab?: "Mobile Weapons" | "MS" | "MA";
  };
  
  export default function NavBar({ activeTab = "Mobile Weapons" }: Props) {
    return (
      <nav className="nav">
        <div className="page-inner nav-inner">
          <div className="brand">
            <span className="brand-badge" />
            <span className="brand-title">DuelRank</span>
          </div>
          <div className="nav-right">
            <span className={`nav-chip ${activeTab === "Mobile Weapons" ? "active" : ""}`}>
              Mobile Weapons
            </span>
            <span className={`nav-chip ${activeTab === "MS" ? "active" : ""}`}>MS</span>
            <span className={`nav-chip ${activeTab === "MA" ? "active" : ""}`}>MA</span>
          </div>
        </div>
      </nav>
    );
  }
  