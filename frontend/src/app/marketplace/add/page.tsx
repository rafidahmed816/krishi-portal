"use client";

import React, { useState, FormEvent, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import axios from "axios";

const CATEGORIES = ["Rice", "Vegetables", "Fruits", "Fish", "Dairy", "Spices", "Grains", "Poultry", "Other"];
const UNITS = ["kg", "piece", "dozen", "liter", "bundle", "bag", "ton"];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AddProductPage() {
  const router = useRouter();
  const { tokens, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("Vegetables");
  const [quantity, setQuantity] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tokens?.access_token) {
      setError("You must be logged in to add products.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;

      // Upload image first if selected
      if (imageFile) {
        setUploadProgress("Uploading image...");
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await axios.post(`${API_URL}/api/upload/image`, formData, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        imageUrl = uploadRes.data.image_url;
        setUploadProgress("Image uploaded! Creating product...");
      } else {
        setUploadProgress("Creating product...");
      }

      await productsApi.create(
        {
          title,
          description: description || undefined,
          price: parseFloat(price),
          unit,
          category,
          quantity: parseInt(quantity),
          image_url: imageUrl,
        },
        tokens.access_token,
      );
      router.push("/marketplace");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  if (!user || user.user_type !== "farmer") {
    return (
      <div className="landing-page">
        <Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span style={{ fontSize: "3rem" }}>🚫</span>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Only farmers can add products.</p>
          <Link href="/marketplace" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "6rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: 580, padding: "2.5rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "2.5rem" }}>🌾</span>
            <h1 style={{
              fontSize: "1.5rem", fontWeight: 800, marginTop: "0.5rem",
              background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              List New Product
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Add your produce to the AgroLink marketplace
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Image upload */}
            <div>
              <label className="form-label">Product Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed",
                  borderColor: imagePreview ? "#16a34a" : "rgba(148,163,184,0.2)",
                  borderRadius: 14,
                  padding: imagePreview ? 0 : "2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(15, 23, 42, 0.4)",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {imagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "8px", background: "rgba(0,0,0,0.6)",
                      color: "#e2e8f0", fontSize: "0.8rem", textAlign: "center",
                    }}>
                      Click to change image
                    </div>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: "2rem" }}>📷</span>
                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                      Click to upload product image
                    </p>
                    <p style={{ color: "#475569", fontSize: "0.75rem" }}>
                      JPG, PNG up to 5MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            <div>
              <label className="form-label">Product Name</label>
              <input className="form-input" type="text" placeholder="e.g. Premium Basmati Rice" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" placeholder="Describe quality, origin, freshness..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label">Price (৳)</label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <select className="form-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label">Category</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Quantity Available</label>
                <input className="form-input" type="number" min="0" placeholder="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
              {loading ? (<><span className="spinner" /> {uploadProgress || "Publishing..."}</>) : "🚀 Publish to Marketplace"}
            </button>

            <Link href="/marketplace" style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem", textDecoration: "none" }}>
              ← Back to Marketplace
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
