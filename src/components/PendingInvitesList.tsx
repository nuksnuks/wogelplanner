import React from "react";

interface PendingInvite {
  email: string;
  invitedAt: number;
}

interface PendingInvitesListProps {
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  onRemove: (email: string) => void;
}

const PendingInvitesList: React.FC<PendingInvitesListProps> = ({ pendingInvites, isOwner, onRemove }) => (
  <div style={{ marginBottom: 24 }}>
    <h3>Pending Invites</h3>
    <ul>
      {pendingInvites.map(inv => (
        <li key={inv.email}>
          {inv.email} (invited {new Date(inv.invitedAt).toLocaleDateString()})
          {isOwner && (
            <button style={{ marginLeft: 8 }} onClick={() => onRemove(inv.email)}>Remove</button>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default PendingInvitesList;
