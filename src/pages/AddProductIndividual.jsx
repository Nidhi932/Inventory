import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./Products.css";

const CATS = [
  "Fruits",
  "Dairy",
  "Grains",
  "Oils",
  "Nuts",
  "Beverages",
  "Vegetables",
  "Snacks",
  "Condiments",
  "Household",
  "Other",
];

export default function AddProductIndividual() {
  const navigate = useNavigate();
  const { addProduct } = useApp();

  const [form, setForm] = useState({
    name: "",
    customId: "",
    category: "",
    price: "",
    quantity: "",
    unit: "",
    expiry: "",
    threshold: "",
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Product name is required.";
    if (!form.category) next.category = "Select a category.";
    if (form.price === "" || Number(form.price) < 0)
      next.price = "Enter a valid price.";
    if (form.quantity === "" || Number(form.quantity) < 0)
      next.quantity = "Enter a valid quantity.";
    if (form.threshold === "" || Number(form.threshold) < 0)
      next.threshold = "Enter threshold value.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    try {
      let imageData = null;
      if (imageFile) {
        imageData = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(imageFile);
        });
      }
      await addProduct({
        name: form.name.trim(),
        customId: form.customId.trim() || undefined,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        unit: form.unit.trim() || "pcs",
        expiryDate: form.expiry || "",
        threshold: Number(form.threshold),
        image: imageData,
      });
      navigate("/products", { replace: true });
    } catch (err) {
      window.alert(err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    navigate("/products");
  }

  return (
    <div className="store add-page">
      <nav className="add-crumb" aria-label="Breadcrumb">
        <span>Add Product</span>
        <span className="add-sep" aria-hidden>
          &gt;
        </span>
        <span>Individual Product</span>
      </nav>

      <div className="add-card">
        <h2 className="add-title">New Product</h2>

        <div className="pform-row-img">
          <div
            className="pform-drop"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {preview ? (
              <img src={preview} alt="" className="pform-preview" />
            ) : (
              <span className="pform-placeholder" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImage}
            />
          </div>
          <p className="pform-hint">
            Drag image here or{" "}
            <button
              type="button"
              className="pform-link"
              onClick={() => fileRef.current?.click()}
            >
              Browse image
            </button>
          </p>
        </div>

        <div className="pform-grid pform-grid-page">
          <label className="pform-pair">
            <span className="pform-label">Product Name</span>
            <input
              name="name"
              className={
                errors.name
                  ? "pform-input pform-input-err"
                  : "pform-input"
              }
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
            />
            {errors.name ? (
              <span className="pform-err">{errors.name}</span>
            ) : null}
          </label>

          <label className="pform-pair">
            <span className="pform-label">Product ID</span>
            <input
              name="customId"
              className="pform-input"
              value={form.customId}
              onChange={handleChange}
              placeholder="Enter product ID"
            />
          </label>

          <label className="pform-pair">
            <span className="pform-label">Category</span>
            <select
              name="category"
              className={
                errors.category
                  ? "pform-input pform-input-err"
                  : "pform-input"
              }
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select product category</option>
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category ? (
              <span className="pform-err">{errors.category}</span>
            ) : null}
          </label>

          <label className="pform-pair">
            <span className="pform-label">Price</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              className={
                errors.price
                  ? "pform-input pform-input-err"
                  : "pform-input"
              }
              value={form.price}
              onChange={handleChange}
              placeholder="Enter price"
            />
            {errors.price ? (
              <span className="pform-err">{errors.price}</span>
            ) : null}
          </label>

          <label className="pform-pair">
            <span className="pform-label">Quantity</span>
            <input
              name="quantity"
              type="number"
              min="0"
              className={
                errors.quantity
                  ? "pform-input pform-input-err"
                  : "pform-input"
              }
              value={form.quantity}
              onChange={handleChange}
              placeholder="Enter product quantity"
            />
            {errors.quantity ? (
              <span className="pform-err">{errors.quantity}</span>
            ) : null}
          </label>

          <label className="pform-pair">
            <span className="pform-label">Unit</span>
            <input
              name="unit"
              className="pform-input"
              value={form.unit}
              onChange={handleChange}
              placeholder="Enter product unit"
            />
          </label>

          <label className="pform-pair">
            <span className="pform-label">Expiry Date</span>
            <input
              name="expiry"
              type="date"
              className="pform-input"
              value={form.expiry}
              onChange={handleChange}
            />
          </label>

          <label className="pform-pair">
            <span className="pform-label">Threshold Value</span>
            <input
              name="threshold"
              type="number"
              min="0"
              className={
                errors.threshold
                  ? "pform-input pform-input-err"
                  : "pform-input"
              }
              value={form.threshold}
              onChange={handleChange}
              placeholder="Enter threshold value"
            />
            {errors.threshold ? (
              <span className="pform-err">{errors.threshold}</span>
            ) : null}
          </label>
        </div>

        <div className="pform-actions">
          <button
            type="button"
            className="pform-discard"
            onClick={discard}
          >
            Discard
          </button>
          <button
            type="button"
            className="pform-submit"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Saving…" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
