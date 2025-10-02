import React from "react";

interface InviteFormProps {
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  onInvite: (e: React.FormEvent) => void;
  error?: string;
}

const InviteForm: React.FC<InviteFormProps> = ({ inviteEmail, setInviteEmail, onInvite, error }) => (
  <form onSubmit={onInvite} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
    <input
      type="email"
      placeholder="Invite user by email"
      value={inviteEmail}
      onChange={e => setInviteEmail(e.target.value)}
      required
    />
    <button type="submit">Invite</button>
    {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
  </form>
);

export default InviteForm;
