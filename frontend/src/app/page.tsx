import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-bg">
      <div className="landing-hero" style={{ position: "relative", zIndex: 1 }}>
        <h1>AgroLink</h1>
        <p>
          The smart agricultural marketplace connecting farmers, buyers, and
          administrators — powered by modern technology.
        </p>
        <div className="landing-actions">
          <Link href="/register" className="cta-primary">
            Get Started
          </Link>
          <Link href="/login" className="cta-secondary">
            Sign In
          </Link>
        </div>

        {/* Feature highlights */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginTop: "4rem",
            maxWidth: 720,
            width: "100%",
          }}
        >
          <FeatureCard icon="🌾" title="For Farmers" desc="List your produce and connect directly with buyers." />
          <FeatureCard icon="🛒" title="For Buyers" desc="Browse fresh produce and place orders effortlessly." />
          <FeatureCard icon="⚙️" title="For Admins" desc="Manage the marketplace, users, and analytics." />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: 16,
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{icon}</div>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem" }}>{title}</h3>
      <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}
