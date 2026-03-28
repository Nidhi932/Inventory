import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import "./Settings.css";

function splitName(full) {
  const t = (full || "").trim();
  if (!t) return { first: "", last: "" };
  const parts = t.split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

export default function Settings() {
  const { user, updateUser, changePassword } = useApp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const syncFromUser = useCallback(() => {
    if (!user) return;
    const { first, last } = splitName(user.name);
    setFirstName(first);
    setLastName(last);
  }, [user]);

  useEffect(() => {
    syncFromUser();
  }, [syncFromUser]);

  const handleSave = async () => {
    setErr("");
    setMsg("");

    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    if (!name) {
      setErr("Please enter at least a first or last name.");
      return;
    }

    const wantsPasswordChange =
      newPassword.length > 0 || confirmPassword.length > 0;

    if (wantsPasswordChange) {
      if (!newPassword || !confirmPassword) {
        setErr("Fill in password and confirmation.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErr("Passwords do not match.");
        return;
      }
      if (newPassword.length < 6) {
        setErr("Password must be at least 6 characters.");
        return;
      }
    }

    setSaving(true);
    try {
      await updateUser({
        name,
        phone: user?.phone ?? "",
        company: user?.company ?? "",
        location: user?.location ?? "",
      });

      if (wantsPasswordChange) {
        const currentPassword = window.prompt(
          "Enter your current password to confirm:",
        );
        if (currentPassword == null) {
          setErr("Password was not changed.");
          return;
        }
        if (currentPassword === "") {
          setErr("Current password is required.");
          return;
        }
        await changePassword(currentPassword, newPassword);
        setNewPassword("");
        setConfirmPassword("");
      }

      setMsg("Saved.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings fade-in">
      <div className="settings-card">
        <div className="settings-card__head">
          <span className="settings-card__tab">Edit Profile</span>
          <div className="settings-card__rule" />
        </div>

        <div className="settings-form">
          <label className="settings-row">
            <span className="settings-label">First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label className="settings-row">
            <span className="settings-label">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </label>
          <label className="settings-row">
            <span className="settings-label">Email</span>
            <input type="email" value={user?.email || ""} disabled readOnly />
          </label>
          <label className="settings-row">
            <span className="settings-label">Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>
          <label className="settings-row">
            <span className="settings-label">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>
        </div>

        {err ? <p className="settings-msg settings-msg--err">{err}</p> : null}
        {msg ? <p className="settings-msg settings-msg--ok">{msg}</p> : null}

        <div className="settings-footer">
          <button
            type="button"
            className="settings-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
