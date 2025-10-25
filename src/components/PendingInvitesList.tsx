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
    <div>
      {pendingInvites.map(inv => (
        <span key={inv.email}>
          {inv.email}
          {isOwner && (
            <button className="deleteButton" onClick={() => onRemove(inv.email)}>Remove</button>
          )}
        </span>
      ))}
    </div>
  </div>
);

export default PendingInvitesList;
