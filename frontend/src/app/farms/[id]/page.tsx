"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { farmsApi, cropsApi, inventoryApi, alarmsApi, type Farm, type Crop, type InventoryItem, type Alarm } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

/* ──── helpers ──── */
const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // already dd/mm/yyyy or yyyy-mm-dd
    const parts = iso.split(/[-/]/);
    if (parts.length === 3) {
      const [a, b, c] = parts;
      if (a.length === 4) return `${c.padStart(2,"0")}/${b.padStart(2,"0")}/${a}`;
      return iso;
    }
    return iso;
  }
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

const daysBetween = (a: string, b: string) => {
  const d1 = new Date(a), d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
};

const HEALTH_COLORS: Record<string, { c: string; bg: string }> = {
  Healthy:  { c: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  Stressed: { c: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  Diseased: { c: "#f87171", bg: "rgba(248,113,113,0.1)" },
  Harvested:{ c: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
};
const STAGE_EMOJI: Record<string, string> = { Seedling: "🌱", Vegetative: "🌿", Flowering: "🌸", Fruiting: "🍎", Mature: "🌾", Harvested: "📦" };
const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Mature", "Harvested"];
const HEALTH_OPTIONS = ["Healthy", "Stressed", "Diseased", "Harvested"];
const SEASONS = ["Kharif", "Rabi", "Zaid"];
const INV_CATEGORIES = ["Seed", "Fertilizer", "Pesticide", "Equipment", "Other"];
const INV_UNITS = ["kg", "litre", "piece", "bag", "bottle"];
const CAT_EMOJI: Record<string, string> = { Seed: "🌰", Fertilizer: "🧪", Pesticide: "🐛", Equipment: "🔧", Other: "📋" };

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, tokens } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "crops" | "inventory" | "alarms">("overview");
  const [deleting, setDeleting] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Crop form
  const [showCropForm, setShowCropForm] = useState(false);
  const [cropForm, setCropForm] = useState({ name: "", variety: "", planting_date: "", expected_harvest_date: "", area_acres: "", season: "", notes: "" });
  const [cropSaving, setCropSaving] = useState(false);
  const [editingCrop, setEditingCrop] = useState<string | null>(null);
  const [editCropForm, setEditCropForm] = useState<Record<string, string>>({});

  // Inventory form
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState({ item_name: "", category: "Seed", quantity: "", unit: "kg", purchase_price: "", purchase_date: "", notes: "" });
  const [invSaving, setInvSaving] = useState(false);
  const [editingInv, setEditingInv] = useState<string | null>(null);
  const [editInvForm, setEditInvForm] = useState<Record<string, string>>({});
  const [adjustingInv, setAdjustingInv] = useState<string | null>(null);
  const [adjustAmt, setAdjustAmt] = useState("");

  // Alarm form
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [alarmForm, setAlarmForm] = useState({ crop_id: "", title: "", message: "", alarm_date: "", alarm_time: "09:00" });
  const [alarmSaving, setAlarmSaving] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [farmRes, cropsRes, invRes, alarmsRes] = await Promise.all([
        farmsApi.get(id), cropsApi.list(id), inventoryApi.list(id), alarmsApi.list(id),
      ]);
      setFarm(farmRes.data);
      setCrops(cropsRes.data.crops);
      setInventory(invRes.data.items);
      setLowStockCount(invRes.data.low_stock_count);
      setAlarms(alarmsRes.data.alarms);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, [id]);

  const isOwner = user?.email === farm?.farmer_email;
  const tk = tokens?.access_token || "";

  const handleAddCrop = async () => {
    if (!tk || !id) return;
    setCropSaving(true);
    try {
      await cropsApi.create(id, { name: cropForm.name, variety: cropForm.variety, planting_date: cropForm.planting_date, expected_harvest_date: cropForm.expected_harvest_date, area_acres: parseFloat(cropForm.area_acres) || 0, season: cropForm.season, notes: cropForm.notes }, tk);
      setShowCropForm(false);
      setCropForm({ name: "", variety: "", planting_date: "", expected_harvest_date: "", area_acres: "", season: "", notes: "" });
      await fetchAll();
    } catch { alert("Failed to add crop"); }
    finally { setCropSaving(false); }
  };

  const handleUpdateCrop = async (cropId: string, updates: Record<string, unknown>) => {
    if (!tk || !id) return;
    try { await cropsApi.update(id, cropId, updates, tk); await fetchAll(); }
    catch { alert("Failed to update crop"); }
  };

  const startEditCrop = (crop: Crop) => {
    setEditingCrop(crop.id);
    setEditCropForm({ name: crop.name, variety: crop.variety, planting_date: crop.planting_date, expected_harvest_date: crop.expected_harvest_date, area_acres: String(crop.area_acres), season: crop.season, notes: crop.notes });
  };
  const saveEditCrop = async (cropId: string) => {
    await handleUpdateCrop(cropId, { name: editCropForm.name, variety: editCropForm.variety, planting_date: editCropForm.planting_date, expected_harvest_date: editCropForm.expected_harvest_date, area_acres: parseFloat(editCropForm.area_acres) || 0, season: editCropForm.season, notes: editCropForm.notes });
    setEditingCrop(null);
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!tk || !id || !confirm("Delete this crop?")) return;
    try { await cropsApi.delete(id, cropId, tk); await fetchAll(); }
    catch { alert("Failed to delete crop"); }
  };

  const handleAddInventory = async () => {
    if (!tk || !id) return;
    setInvSaving(true);
    try {
      await inventoryApi.create(id, { item_name: invForm.item_name, category: invForm.category, quantity: parseFloat(invForm.quantity) || 0, unit: invForm.unit, purchase_price: parseFloat(invForm.purchase_price) || 0, purchase_date: invForm.purchase_date, notes: invForm.notes }, tk);
      setShowInvForm(false);
      setInvForm({ item_name: "", category: "Seed", quantity: "", unit: "kg", purchase_price: "", purchase_date: "", notes: "" });
      await fetchAll();
    } catch { alert("Failed to add inventory"); }
    finally { setInvSaving(false); }
  };

  const startEditInv = (item: InventoryItem) => {
    setEditingInv(item.id);
    setEditInvForm({ item_name: item.item_name, category: item.category, unit: item.unit, purchase_price: String(item.purchase_price), notes: item.notes });
  };

  const handleAdjustInv = async (itemId: string) => {
    if (!tk || !id) return;
    const a = parseFloat(adjustAmt);
    if (isNaN(a) || a === 0) return;
    try { await inventoryApi.adjust(id, itemId, a, "", tk); setAdjustingInv(null); setAdjustAmt(""); await fetchAll(); }
    catch { alert("Failed to adjust"); }
  };

  const handleAddAlarm = async () => {
    if (!tk || !id) return;
    setAlarmSaving(true);
    try {
      await alarmsApi.create(id, { crop_id: alarmForm.crop_id, title: alarmForm.title, message: alarmForm.message, alarm_date: alarmForm.alarm_date, alarm_time: alarmForm.alarm_time }, tk);
      setShowAlarmForm(false);
      setAlarmForm({ crop_id: "", title: "", message: "", alarm_date: "", alarm_time: "09:00" });
      await fetchAll();
    } catch { alert("Failed to create alarm"); }
    finally { setAlarmSaving(false); }
  };

  const handleTriggerAlarms = async () => {
    if (!tk || !id) return;
    try {
      const res = await alarmsApi.trigger(id, tk);
      alert(`Sent ${(res.data as {sent: number}).sent} notification(s)`);
      await fetchAll();
    } catch { alert("Failed to trigger alarms"); }
  };

  const handleDeleteFarm = async () => {
    if (!tk || !farm || !confirm("Delete this farm and all its data?")) return;
    setDeleting(true);
    try { await farmsApi.delete(farm.id, tk); router.push("/farms"); }
    catch { alert("Failed to delete farm"); setDeleting(false); }
  };

  if (loading) return <div className="landing-page"><Navbar /><div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}><span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div></div>;
  if (!farm) return <div className="landing-page"><Navbar /><div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}><span style={{ fontSize: "3rem" }}>❌</span><p style={{ color: "var(--text-secondary)" }}>Farm not found</p><Link href="/farms" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Back</Link></div></div>;

  const tabStyle = (t: string) => ({
    padding: "10px 20px", borderRadius: 10, fontWeight: 700 as const, fontSize: "0.88rem",
    border: "1px solid " + (tab === t ? "var(--accent-green)" : "var(--border-color)"),
    background: tab === t ? "rgba(22,163,74,0.1)" : "transparent",
    color: tab === t ? "var(--accent-green-light)" : "var(--text-muted)",
    cursor: "pointer", transition: "all 0.25s",
  });

  // crop progress bar
  const cropProgress = (c: Crop) => {
    const idx = STAGES.indexOf(c.growth_stage);
    return ((idx + 1) / STAGES.length) * 100;
  };

  // days to harvest
  const daysToHarvest = (c: Crop) => {
    if (!c.expected_harvest_date) return null;
    const today = new Date().toISOString().split("T")[0];
    return daysBetween(today, c.expected_harvest_date);
  };

  // total inventory value
  const totalInvValue = inventory.reduce((s, i) => s + i.purchase_price * i.quantity, 0);

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/farms" className="back-link">← Back to My Farms</Link>

        {/* Farm Header */}
        <div className="animate-fadeInUp" style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 18, flexShrink: 0, background: farm.image_url ? `url(${farm.image_url}) center/cover` : "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(14,165,233,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: farm.image_url ? 0 : "2.5rem", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)" }}>
            {!farm.image_url && "🏡"}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{farm.name}</h1>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span>📍 {farm.location}</span><span>📐 {farm.size_acres} acres</span>
              {farm.soil_type && <span>🌱 {farm.soil_type}</span>}
              <span>📅 Since {fmt(farm.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setTab("overview")} style={tabStyle("overview")}>📊 Overview</button>
          <button onClick={() => setTab("crops")} style={tabStyle("crops")}>🌾 Crops ({crops.length})</button>
          <button onClick={() => setTab("inventory")} style={tabStyle("inventory")}>📦 Inventory ({inventory.length}) {lowStockCount > 0 && <span style={{ color: "#f87171", marginLeft: 4 }}>⚠️ {lowStockCount}</span>}</button>
          {isOwner && <button onClick={() => setTab("alarms")} style={tabStyle("alarms")}>🔔 Reminders ({alarms.length})</button>}
        </div>

        {/* ────── OVERVIEW ────── */}
        {tab === "overview" && (
          <div className="animate-fadeInUp">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "🌾", label: "Crops", val: crops.length },
                { icon: "💚", label: "Healthy", val: crops.filter(c => c.health_status === "Healthy").length },
                { icon: "⚠️", label: "Needs Attention", val: crops.filter(c => ["Stressed","Diseased"].includes(c.health_status)).length },
                { icon: "📦", label: "Harvested", val: crops.filter(c => c.growth_stage === "Harvested").length },
                { icon: "🏪", label: "Inventory Items", val: inventory.length },
                { icon: "🔴", label: "Low Stock", val: lowStockCount },
                { icon: "💰", label: "Inventory Value", val: `৳${totalInvValue.toLocaleString()}` },
                { icon: "📐", label: "Total Area", val: `${farm.size_acres} ac` },
              ].map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: "1rem", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Crop health distribution bar */}
            {crops.length > 0 && (
              <div className="glass-card" style={{ padding: "1rem", borderRadius: 14, marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Crop Health Distribution</h4>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 20 }}>
                  {Object.entries(HEALTH_COLORS).map(([status, { c }]) => {
                    const count = crops.filter(cr => cr.health_status === status).length;
                    if (count === 0) return null;
                    return <div key={status} title={`${status}: ${count}`} style={{ flex: count, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{count}</div>;
                  })}
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: 6, flexWrap: "wrap" }}>
                  {Object.entries(HEALTH_COLORS).map(([status, { c }]) => (
                    <span key={status} style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />{status}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {farm.description && (
              <div className="glass-card" style={{ padding: "1rem", borderRadius: 14, marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>About</h4>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem" }}>{farm.description}</p>
              </div>
            )}
            {isOwner && <button className="btn btn-danger" onClick={handleDeleteFarm} disabled={deleting} style={{ maxWidth: 250 }}>{deleting ? "Deleting..." : "🗑️ Delete Farm"}</button>}
          </div>
        )}

        {/* ────── CROPS ────── */}
        {tab === "crops" && (
          <div className="animate-fadeInUp">
            {isOwner && <button onClick={() => setShowCropForm(!showCropForm)} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginBottom: "1rem" }}>{showCropForm ? "✕ Cancel" : "➕ Add Crop"}</button>}

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
                <button onClick={handleAddCrop} disabled={cropSaving || !cropForm.name || !cropForm.planting_date} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginTop: "0.75rem" }}>{cropSaving ? "Saving..." : "🌾 Add Crop"}</button>
              </div>
            )}

            {crops.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 16 }}>
                <span style={{ fontSize: "3rem" }}>🌱</span>
                <h3 style={{ color: "var(--text-primary)", marginTop: "0.75rem" }}>No crops yet</h3>
                <p style={{ color: "var(--text-muted)" }}>Add your first crop to start tracking its lifecycle.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {crops.map(crop => {
                  const hc = HEALTH_COLORS[crop.health_status] || HEALTH_COLORS.Healthy;
                  const progress = cropProgress(crop);
                  const dth = daysToHarvest(crop);
                  const isEditing = editingCrop === crop.id;

                  return (
                    <div key={crop.id} className="glass-card" style={{ borderRadius: 16, padding: "1.25rem", borderLeft: `3px solid ${hc.c}` }}>
                      {isEditing ? (
                        /* ── Edit mode ── */
                        <div>
                          <h4 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.75rem" }}>✏️ Edit Crop</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                            <div><label className="form-label">Name</label><input className="form-input" value={editCropForm.name} onChange={e => setEditCropForm({ ...editCropForm, name: e.target.value })} /></div>
                            <div><label className="form-label">Variety</label><input className="form-input" value={editCropForm.variety} onChange={e => setEditCropForm({ ...editCropForm, variety: e.target.value })} /></div>
                            <div><label className="form-label">Planting Date</label><input className="form-input" type="date" value={editCropForm.planting_date} onChange={e => setEditCropForm({ ...editCropForm, planting_date: e.target.value })} /></div>
                            <div><label className="form-label">Harvest Date</label><input className="form-input" type="date" value={editCropForm.expected_harvest_date} onChange={e => setEditCropForm({ ...editCropForm, expected_harvest_date: e.target.value })} /></div>
                            <div><label className="form-label">Area (Acres)</label><input className="form-input" type="number" step="0.1" value={editCropForm.area_acres} onChange={e => setEditCropForm({ ...editCropForm, area_acres: e.target.value })} /></div>
                            <div><label className="form-label">Season</label><select className="form-input" value={editCropForm.season} onChange={e => setEditCropForm({ ...editCropForm, season: e.target.value })}><option value="">Select</option>{SEASONS.map(s => <option key={s}>{s}</option>)}</select></div>
                          </div>
                          <div style={{ marginTop: "0.5rem" }}><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={editCropForm.notes} onChange={e => setEditCropForm({ ...editCropForm, notes: e.target.value })} style={{ resize: "vertical" }} /></div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                            <button onClick={() => saveEditCrop(crop.id)} className="btn btn-primary" style={{ width: "auto", padding: "8px 20px", fontSize: "0.82rem" }}>💾 Save</button>
                            <button onClick={() => setEditingCrop(null)} style={{ padding: "8px 20px", borderRadius: 8, fontSize: "0.82rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* ── View mode ── */
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                                {STAGE_EMOJI[crop.growth_stage] || "🌿"} {crop.name}
                                {crop.variety && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.85rem" }}> · {crop.variety}</span>}
                              </h3>
                              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                <span>📅 Planted {fmt(crop.planting_date)}</span>
                                {crop.expected_harvest_date && <span>🎯 Harvest {fmt(crop.expected_harvest_date)}</span>}
                                <span>📐 {crop.area_acres} acres</span>
                                {crop.season && <span>🗓️ {crop.season}</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.73rem", fontWeight: 700, color: hc.c, background: hc.bg, border: `1px solid ${hc.c}22` }}>{crop.health_status}</span>
                              <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.73rem", fontWeight: 700, color: "var(--accent-blue)", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>{crop.growth_stage}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ marginTop: "0.6rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 3 }}>
                              <span>Growth Progress</span>
                              <span>{Math.round(progress)}%{dth !== null && dth > 0 && ` · ${dth} days to harvest`}{dth !== null && dth <= 0 && ` · Ready to harvest!`}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: "var(--border-color)", overflow: "hidden" }}>
                              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${hc.c}, #0ea5e9)`, transition: "width 0.5s" }} />
                            </div>
                          </div>

                          {crop.notes && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem", fontStyle: "italic" }}>📝 {crop.notes}</p>}

                          {isOwner && (
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                              <select style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} value={crop.growth_stage} onChange={e => handleUpdateCrop(crop.id, { growth_stage: e.target.value })}>
                                {STAGES.map(s => <option key={s}>{s}</option>)}
                              </select>
                              <select style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} value={crop.health_status} onChange={e => handleUpdateCrop(crop.id, { health_status: e.target.value })}>
                                {HEALTH_OPTIONS.map(h => <option key={h}>{h}</option>)}
                              </select>
                              <button onClick={() => startEditCrop(crop)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", color: "var(--accent-blue)", cursor: "pointer" }}>✏️ Edit</button>
                              <button onClick={() => handleDeleteCrop(crop.id)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer" }}>🗑️</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ────── INVENTORY ────── */}
        {tab === "inventory" && (
          <div className="animate-fadeInUp">
            {/* summary strip */}
            {inventory.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {INV_CATEGORIES.map(cat => {
                  const count = inventory.filter(i => i.category === cat).length;
                  if (count === 0) return null;
                  return <span key={cat} style={{ padding: "4px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>{CAT_EMOJI[cat]} {cat}: {count}</span>;
                })}
                <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.15)", color: "var(--accent-green-light)" }}>💰 Total: ৳{totalInvValue.toLocaleString()}</span>
              </div>
            )}

            {isOwner && <button onClick={() => setShowInvForm(!showInvForm)} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginBottom: "1rem" }}>{showInvForm ? "✕ Cancel" : "➕ Add Item"}</button>}

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
                <div style={{ marginTop: "0.5rem" }}><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={invForm.notes} onChange={e => setInvForm({ ...invForm, notes: e.target.value })} style={{ resize: "vertical" }} placeholder="Brand, supplier, batch number..." /></div>
                <button onClick={handleAddInventory} disabled={invSaving || !invForm.item_name || !invForm.quantity} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginTop: "0.75rem" }}>{invSaving ? "Saving..." : "📦 Add Item"}</button>
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
                {inventory.map(item => {
                  const isEditingThis = editingInv === item.id;
                  const isAdjusting = adjustingInv === item.id;

                  return (
                    <div key={item.id} className="glass-card" style={{ borderRadius: 16, padding: "1.25rem", borderLeft: item.low_stock ? "3px solid #f87171" : `3px solid var(--border-color)` }}>
                      {isEditingThis ? (
                        /* ── Edit inventory ── */
                        <div>
                          <h4 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.75rem" }}>✏️ Edit Item</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                            <div><label className="form-label">Name</label><input className="form-input" value={editInvForm.item_name} onChange={e => setEditInvForm({ ...editInvForm, item_name: e.target.value })} /></div>
                            <div><label className="form-label">Category</label><select className="form-input" value={editInvForm.category} onChange={e => setEditInvForm({ ...editInvForm, category: e.target.value })}>{INV_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                            <div><label className="form-label">Unit</label><select className="form-input" value={editInvForm.unit} onChange={e => setEditInvForm({ ...editInvForm, unit: e.target.value })}>{INV_UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                            <div><label className="form-label">Price (৳)</label><input className="form-input" type="number" value={editInvForm.purchase_price} onChange={e => setEditInvForm({ ...editInvForm, purchase_price: e.target.value })} /></div>
                          </div>
                          <div style={{ marginTop: "0.5rem" }}><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={editInvForm.notes || ""} onChange={e => setEditInvForm({ ...editInvForm, notes: e.target.value })} style={{ resize: "vertical" }} /></div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                            <button onClick={async () => { try { await inventoryApi.update(id, item.id, { item_name: editInvForm.item_name, category: editInvForm.category, unit: editInvForm.unit, purchase_price: parseFloat(editInvForm.purchase_price) || 0, notes: editInvForm.notes }, tk); setEditingInv(null); await fetchAll(); } catch { alert("Failed to update"); } }} className="btn btn-primary" style={{ width: "auto", padding: "8px 20px", fontSize: "0.82rem" }}>💾 Save</button>
                            <button onClick={() => setEditingInv(null)} style={{ padding: "8px 20px", borderRadius: 8, fontSize: "0.82rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                                {CAT_EMOJI[item.category] || "📋"} {item.item_name}
                                {item.low_stock && <span style={{ marginLeft: 6, color: "#f87171", fontSize: "0.78rem", fontWeight: 600 }}>⚠️ Low Stock</span>}
                              </h3>
                              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.35rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(14,165,233,0.08)", color: "var(--accent-blue)", fontWeight: 600 }}>{item.category}</span>
                                <span>📦 {item.quantity} {item.unit}</span>
                                {item.purchase_price > 0 && <span>💰 ৳{item.purchase_price.toLocaleString()}</span>}
                                {item.purchase_date && <span>📅 {fmt(item.purchase_date)}</span>}
                              </div>
                              {item.notes && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4, fontStyle: "italic" }}>📝 {item.notes}</p>}
                            </div>

                            {/* Quantity badge */}
                            <div style={{ textAlign: "center", minWidth: 55 }}>
                              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: item.low_stock ? "#f87171" : "var(--text-primary)" }}>{item.quantity}</div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{item.unit}</div>
                            </div>
                          </div>

                          {/* Adjust quantity inline */}
                          {isAdjusting && (
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                              <input type="number" className="form-input" placeholder="+10 or -5" value={adjustAmt} onChange={e => setAdjustAmt(e.target.value)} style={{ width: 120, padding: "6px 10px", fontSize: "0.82rem" }} />
                              <button onClick={() => handleAdjustInv(item.id)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "var(--accent-green-light)", cursor: "pointer" }}>Apply</button>
                              <button onClick={() => { setAdjustingInv(null); setAdjustAmt(""); }} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>+ to add, - to deduct</span>
                            </div>
                          )}

                          {isOwner && !isAdjusting && (
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                              <button onClick={() => { setAdjustingInv(item.id); setAdjustAmt(""); }} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "var(--accent-green-light)", cursor: "pointer" }}>📊 Adjust Qty</button>
                              <button onClick={() => startEditInv(item)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", color: "var(--accent-blue)", cursor: "pointer" }}>✏️ Edit</button>
                              <button onClick={() => { if (confirm("Delete this item?")) { inventoryApi.delete(id, item.id, tk).then(fetchAll); } }} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer" }}>🗑️ Delete</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ────── ALARMS TAB ────── */}
        {tab === "alarms" && (
          <div className="animate-fadeInUp">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => setShowAlarmForm(!showAlarmForm)} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px" }}>{showAlarmForm ? "✕ Cancel" : "🔔 Add Reminder"}</button>
              {alarms.length > 0 && <button onClick={handleTriggerAlarms} style={{ padding: "10px 24px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", cursor: "pointer" }}>📧 Send Due Reminders</button>}
            </div>

            {showAlarmForm && (
              <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 16, marginBottom: "1.5rem" }}>
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "1rem" }}>🔔 Create Crop Reminder</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>Set a reminder — you'll receive an email on the date via AWS SNS.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div><label className="form-label">Crop *</label><select className="form-input" value={alarmForm.crop_id} onChange={e => setAlarmForm({ ...alarmForm, crop_id: e.target.value })}><option value="">Select a crop</option>{crops.map(c => <option key={c.id} value={c.id}>{c.name} {c.variety ? `(${c.variety})` : ""}</option>)}</select></div>
                  <div><label className="form-label">Title *</label><input className="form-input" value={alarmForm.title} onChange={e => setAlarmForm({ ...alarmForm, title: e.target.value })} placeholder="e.g. Apply Fertilizer" /></div>
                  <div><label className="form-label">Date *</label><input className="form-input" type="date" value={alarmForm.alarm_date} onChange={e => setAlarmForm({ ...alarmForm, alarm_date: e.target.value })} /></div>
                  <div><label className="form-label">Time</label><input className="form-input" type="time" value={alarmForm.alarm_time} onChange={e => setAlarmForm({ ...alarmForm, alarm_time: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: "0.75rem" }}><label className="form-label">Message *</label><textarea className="form-input" rows={2} value={alarmForm.message} onChange={e => setAlarmForm({ ...alarmForm, message: e.target.value })} style={{ resize: "vertical" }} placeholder="What do you need to do? e.g. Apply NPK 20-10-10 at 50kg per acre" /></div>
                <button onClick={handleAddAlarm} disabled={alarmSaving || !alarmForm.crop_id || !alarmForm.title || !alarmForm.alarm_date || !alarmForm.message} className="btn btn-primary" style={{ width: "auto", padding: "10px 24px", marginTop: "0.75rem" }}>{alarmSaving ? "Saving..." : "🔔 Create Reminder"}</button>
              </div>
            )}

            {alarms.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 16 }}>
                <span style={{ fontSize: "3rem" }}>🔔</span>
                <h3 style={{ color: "var(--text-primary)", marginTop: "0.75rem" }}>No reminders yet</h3>
                <p style={{ color: "var(--text-muted)" }}>Set reminders for your crops — fertilizer, watering, harvesting.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {alarms.map(alarm => (
                  <div key={alarm.id} className="glass-card" style={{ borderRadius: 16, padding: "1.25rem", borderLeft: alarm.sent ? "3px solid #4ade80" : "3px solid #fbbf24" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          {alarm.sent ? "✅" : "⏰"} {alarm.title}
                        </h3>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.35rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          <span>🌾 {alarm.crop_name}</span>
                          <span>📅 {fmt(alarm.alarm_date)}</span>
                          <span>⏰ {alarm.alarm_time}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontWeight: 600, background: alarm.sent ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)", color: alarm.sent ? "#4ade80" : "#fbbf24" }}>{alarm.sent ? "Sent" : "Pending"}</span>
                        </div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.4rem" }}>📝 {alarm.message}</p>
                      </div>
                      <button onClick={() => { if (confirm("Delete this reminder?")) { alarmsApi.delete(id, alarm.id, tk).then(fetchAll); } }} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.76rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer" }}>🗑️</button>
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
