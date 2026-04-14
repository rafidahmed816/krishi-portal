"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { farmsApi, cropsApi, inventoryApi, type Farm, type Crop, type InventoryItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const HEALTH_COLORS: Record<string, { c: string; bg: string }> = {
  Healthy:  { c: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  Stressed: { c: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  Diseased: { c: "#f87171", bg: "rgba(248,113,113,0.1)" },
  Harvested:{ c: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
};

const STAGE_EMOJI: Record<string, string> = {
  Seedling: "🌱", Vegetative: "🌿", Flowering: "🌸", Fruiting: "🍎", Mature: "🌾", Harvested: "📦",
};

const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Mature", "Harvested"];
const HEALTH_OPTIONS = ["Healthy", "Stressed", "Diseased", "Harvested"];
const SEASONS = ["Kharif", "Rabi", "Zaid"];
const INV_CATEGORIES = ["Seed", "Fertilizer", "Pesticide", "Equipment", "Other"];
const INV_UNITS = ["kg", "litre", "piece", "bag", "bottle"];

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, tokens } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "crops" | "inventory">("overview");
  const [deleting, setDeleting] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Crop form
  const [showCropForm, setShowCropForm] = useState(false);
  const [cropForm, setCropForm] = useState({ name: "", variety: "", planting_date: "", expected_harvest_date: "", area_acres: "", season: "", notes: "" });
  const [cropSaving, setCropSaving] = useState(false);

  // Inventory form
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState({ item_name: "", category: "Seed", quantity: "", unit: "kg", purchase_price: "", purchase_date: "", notes: "" });
  const [invSaving, setInvSaving] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [farmRes, cropsRes, invRes] = await Promise.all([
        farmsApi.get(id),
        cropsApi.list(id),
        inventoryApi.list(id),
      ]);
      setFarm(farmRes.data);
      setCrops(cropsRes.data.crops);
      setInventory(invRes.data.items);
      setLowStockCount(invRes.data.low_stock_count);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const isOwner = user?.email === farm?.farmer_email;

  const handleAddCrop = async () => {
    if (!tokens?.access_token || !id) return;
    setCropSaving(true);
    try {
      await cropsApi.create(id, {
        name: cropForm.name,
        variety: cropForm.variety,
        planting_date: cropForm.planting_date,
        expected_harvest_date: cropForm.expected_harvest_date,
        area_acres: parseFloat(cropForm.area_acres) || 0,
        season: cropForm.season,
        notes: cropForm.notes,
      }, tokens.access_token);
      setShowCropForm(false);
      setCropForm({ name: "", variety: "", planting_date: "", expected_harvest_date: "", area_acres: "", season: "", notes: "" });
      await fetchAll();
    } catch { alert("Failed to add crop"); }
    finally { setCropSaving(false); }
  };

  const handleUpdateCrop = async (cropId: string, updates: Record<string, unknown>) => {
    if (!tokens?.access_token || !id) return;
    try {
      await cropsApi.update(id, cropId, updates, tokens.access_token);
      await fetchAll();
    } catch { alert("Failed to update crop"); }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!tokens?.access_token || !id || !confirm("Delete this crop?")) return;
    try {
      await cropsApi.delete(id, cropId, tokens.access_token);
      await fetchAll();
    } catch { alert("Failed to delete crop"); }
  };

  const handleAddInventory = async () => {
    if (!tokens?.access_token || !id) return;
    setInvSaving(true);
    try {
      await inventoryApi.create(id, {
        item_name: invForm.item_name,
        category: invForm.category,
        quantity: parseFloat(invForm.quantity) || 0,
        unit: invForm.unit,
        purchase_price: parseFloat(invForm.purchase_price) || 0,
        purchase_date: invForm.purchase_date,
        notes: invForm.notes,
      }, tokens.access_token);
      setShowInvForm(false);
      setInvForm({ item_name: "", category: "Seed", quantity: "", unit: "kg", purchase_price: "", purchase_date: "", notes: "" });
      await fetchAll();
    } catch { alert("Failed to add inventory"); }
    finally { setInvSaving(false); }
  };

  const handleDeleteFarm = async () => {
    if (!tokens?.access_token || !farm || !confirm("Delete this farm and all its data?")) return;
    setDeleting(true);
    try {
      await farmsApi.delete(farm.id, tokens.access_token);
      router.push("/farms");
    } catch { alert("Failed to delete farm"); setDeleting(false); }
  };

  if (loading) return <div className="landing-page"><Navbar /><div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}><span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div></div>;
  if (!farm) return <div className="landing-page"><Navbar /><div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}><span style={{ fontSize: "3rem" }}>❌</span><p style={{ color: "var(--text-secondary)" }}>Farm not found</p><Link href="/farms" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Back</Link></div></div>;

  const tabStyle = (t: string) => ({
    padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.88rem",
    border: "1px solid " + (tab === t ? "var(--accent-green)" : "var(--border-color)"),
    background: tab === t ? "rgba(22,163,74,0.1)" : "transparent",
    color: tab === t ? "var(--accent-green-light)" : "var(--text-muted)",
    cursor: "pointer", transition: "all 0.25s",
  });

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/farms" className="back-link">← Back to My Farms</Link>

        {/* Farm Header */}
        <div className="animate-fadeInUp" style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 18, flexShrink: 0,
            background: farm.image_url ? `url(${farm.image_url}) center/cover` : "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(14,165,233,0.1))",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: farm.image_url ? 0 : "2.5rem",
            border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)",
          }}>
            {!farm.image_url && "🏡"}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{farm.name}</h1>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span>📍 {farm.location}</span>
              <span>📐 {farm.size_acres} acres</span>
              {farm.soil_type && <span>🌱 {farm.soil_type}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setTab("overview")} style={tabStyle("overview")}>📊 Overview</button>
          <button onClick={() => setTab("crops")} style={tabStyle("crops")}>🌾 Crops ({crops.length})</button>
          <button onClick={() => setTab("inventory")} style={tabStyle("inventory")}>
            📦 Inventory ({inventory.length}) {lowStockCount > 0 && <span style={{ color: "#f87171", marginLeft: 4 }}>⚠️ {lowStockCount}</span>}
          </button>
        </div>

        {/* ────── OVERVIEW TAB ────── */}
        {tab === "overview" && (
          <div className="animate-fadeInUp">
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "🌾", label: "Crops", val: crops.length },
                { icon: "💚", label: "Healthy", val: crops.filter(c => c.health_status === "Healthy").length },
                { icon: "⚠️", label: "Needs Attention", val: crops.filter(c => c.health_status === "Stressed" || c.health_status === "Diseased").length },
                { icon: "📦", label: "Inventory", val: inventory.length },
                { icon: "🔴", label: "Low Stock", val: lowStockCount },
                { icon: "📐", label: "Total Area", val: `${farm.size_acres} ac` },
              ].map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: "1.25rem", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>{s.val}</div>
                </div>
              ))}
            </div>
            {farm.description && (
              <div className="glass-card" style={{ padding: "1.25rem", borderRadius: 16, marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>About</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.92rem" }}>{farm.description}</p>
              </div>
            )}
            {isOwner && (
              <button className="btn btn-danger" onClick={handleDeleteFarm} disabled={deleting} style={{ maxWidth: 250 }}>
                {deleting ? "Deleting..." : "🗑️ Delete Farm"}
              </button>
            )}
          </div>
        )}

        {/* ────── CROPS TAB ────── */}
        {tab === "crops" && (
          <div className="animate-fadeInUp">
            {isOwner && (
              <button onClick={() => setShowCropForm(!showCropForm)} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginBottom: "1rem" }}>
                {showCropForm ? "✕ Cancel" : "➕ Add Crop"}
              </button>
            )}

            {showCropForm && (
              <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 16, marginBottom: "1.5rem" }}>
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "1rem" }}>🌱 Add New Crop</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div><label className="form-label">Crop Name *</label><input className="form-input" value={cropForm.name} onChange={e => setCropForm({ ...cropForm, name: e.target.value })} placeholder="e.g. Rice" /></div>
                  <div><label className="form-label">Variety</label><input className="form-input" value={cropForm.variety} onChange={e => setCropForm({ ...cropForm, variety: e.target.value })} placeholder="e.g. BR-28" /></div>
                  <div><label className="form-label">Planting Date *</label><input className="form-input" type="date" value={cropForm.planting_date} onChange={e => setCropForm({ ...cropForm, planting_date: e.target.value })} /></div>
                  <div><label className="form-label">Expected Harvest</label><input className="form-input" type="date" value={cropForm.expected_harvest_date} onChange={e => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })} /></div>
                  <div><label className="form-label">Area (Acres)</label><input className="form-input" type="number" step="0.1" value={cropForm.area_acres} onChange={e => setCropForm({ ...cropForm, area_acres: e.target.value })} /></div>
                  <div><label className="form-label">Season</label><select className="form-input" value={cropForm.season} onChange={e => setCropForm({ ...cropForm, season: e.target.value })}><option value="">Select</option>{SEASONS.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
                <div style={{ marginTop: "0.75rem" }}><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={cropForm.notes} onChange={e => setCropForm({ ...cropForm, notes: e.target.value })} style={{ resize: "vertical" }} /></div>
                <button onClick={handleAddCrop} disabled={cropSaving || !cropForm.name || !cropForm.planting_date} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginTop: "0.75rem" }}>
                  {cropSaving ? "Saving..." : "🌾 Add Crop"}
                </button>
              </div>
            )}

            {crops.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 16 }}>
                <span style={{ fontSize: "3rem" }}>🌱</span>
                <h3 style={{ color: "var(--text-primary)", marginTop: "0.75rem" }}>No crops yet</h3>
                <p style={{ color: "var(--text-muted)" }}>Add your first crop to start tracking its lifecycle.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {crops.map(crop => {
                  const hc = HEALTH_COLORS[crop.health_status] || HEALTH_COLORS.Healthy;
                  return (
                    <div key={crop.id} className="glass-card" style={{ borderRadius: 16, padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            {STAGE_EMOJI[crop.growth_stage] || "🌿"} {crop.name}
                            {crop.variety && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.85rem" }}> · {crop.variety}</span>}
                          </h3>
                          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <span>📅 Planted {crop.planting_date}</span>
                            {crop.expected_harvest_date && <span>🎯 Harvest {crop.expected_harvest_date}</span>}
                            <span>📐 {crop.area_acres} acres</span>
                            {crop.season && <span>🗓️ {crop.season}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, color: hc.c, background: hc.bg, border: `1px solid ${hc.c}22` }}>
                            {crop.health_status}
                          </span>
                          <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-blue)", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>
                            {crop.growth_stage}
                          </span>
                        </div>
                      </div>
                      {crop.notes && <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>{crop.notes}</p>}
                      {isOwner && (
                        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                          <select style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            value={crop.growth_stage} onChange={e => handleUpdateCrop(crop.id, { growth_stage: e.target.value })}>
                            {STAGES.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <select style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            value={crop.health_status} onChange={e => handleUpdateCrop(crop.id, { health_status: e.target.value })}>
                            {HEALTH_OPTIONS.map(h => <option key={h}>{h}</option>)}
                          </select>
                          <button onClick={() => handleDeleteCrop(crop.id)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer" }}>
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ────── INVENTORY TAB ────── */}
        {tab === "inventory" && (
          <div className="animate-fadeInUp">
            {isOwner && (
              <button onClick={() => setShowInvForm(!showInvForm)} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginBottom: "1rem" }}>
                {showInvForm ? "✕ Cancel" : "➕ Add Item"}
              </button>
            )}

            {showInvForm && (
              <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 16, marginBottom: "1.5rem" }}>
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "1rem" }}>📦 Add Inventory Item</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div><label className="form-label">Item Name *</label><input className="form-input" value={invForm.item_name} onChange={e => setInvForm({ ...invForm, item_name: e.target.value })} placeholder="e.g. Urea Fertilizer" /></div>
                  <div><label className="form-label">Category *</label><select className="form-input" value={invForm.category} onChange={e => setInvForm({ ...invForm, category: e.target.value })}>{INV_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label className="form-label">Quantity *</label><input className="form-input" type="number" step="0.1" value={invForm.quantity} onChange={e => setInvForm({ ...invForm, quantity: e.target.value })} placeholder="50" /></div>
                  <div><label className="form-label">Unit</label><select className="form-input" value={invForm.unit} onChange={e => setInvForm({ ...invForm, unit: e.target.value })}>{INV_UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                  <div><label className="form-label">Purchase Price (৳)</label><input className="form-input" type="number" step="1" value={invForm.purchase_price} onChange={e => setInvForm({ ...invForm, purchase_price: e.target.value })} /></div>
                  <div><label className="form-label">Purchase Date</label><input className="form-input" type="date" value={invForm.purchase_date} onChange={e => setInvForm({ ...invForm, purchase_date: e.target.value })} /></div>
                </div>
                <button onClick={handleAddInventory} disabled={invSaving || !invForm.item_name || !invForm.quantity} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginTop: "0.75rem" }}>
                  {invSaving ? "Saving..." : "📦 Add Item"}
                </button>
              </div>
            )}

            {inventory.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 16 }}>
                <span style={{ fontSize: "3rem" }}>📦</span>
                <h3 style={{ color: "var(--text-primary)", marginTop: "0.75rem" }}>No inventory yet</h3>
                <p style={{ color: "var(--text-muted)" }}>Add seeds, fertilizers, or equipment to track your farm supplies.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {inventory.map(item => (
                  <div key={item.id} className="glass-card" style={{ borderRadius: 16, padding: "1.25rem", borderLeft: item.low_stock ? "3px solid #f87171" : "3px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          {item.item_name}
                          {item.low_stock && <span style={{ marginLeft: 6, color: "#f87171", fontSize: "0.8rem" }}>⚠️ Low Stock</span>}
                        </h3>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(14,165,233,0.08)", color: "var(--accent-blue)", fontWeight: 600 }}>{item.category}</span>
                          <span>📦 {item.quantity} {item.unit}</span>
                          {item.purchase_price > 0 && <span>💰 ৳{item.purchase_price}</span>}
                          {item.purchase_date && <span>📅 {item.purchase_date}</span>}
                        </div>
                      </div>
                      {isOwner && (
                        <button onClick={() => { if (confirm("Delete this item?")) { inventoryApi.delete(id, item.id, tokens!.access_token).then(fetchAll); } }}
                          style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer" }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
