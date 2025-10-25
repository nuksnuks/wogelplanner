import React from "react";

interface CollaboratorsListProps {
  collaborators: string[];
  projectOwner: string;
  userEmail: string | null | undefined;
  onKick: (email: string) => void;
  onLeave: () => void;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  collaborators,
  projectOwner,
  userEmail,
  onKick,
  onLeave,
}) => (
  <>
    <h3>Collaborators</h3>
    <div>
      {collaborators.map(email => (
        <p key={email}>
          {email}
          {projectOwner && email && email.trim().toLowerCase() === projectOwner.trim().toLowerCase()}
          {/* Show Kick button for all collaborators except the owner, if current user is the owner */}
          {userEmail && projectOwner && userEmail.trim().toLowerCase() === projectOwner.trim().toLowerCase() && email.trim().toLowerCase() !== projectOwner.trim().toLowerCase() && (
            <button className="deleteButton" onClick={() => onKick(email)}>Kick</button>
          )}
          
          {/* Show Leave button for collaborators (not owner) */}
          {userEmail && userEmail.trim().toLowerCase() === email.trim().toLowerCase() && email.trim().toLowerCase() !== projectOwner.trim().toLowerCase() && (
            <button className="deleteButton" onClick={onLeave}>Leave</button>
          )}
        </p>
      ))}
    </div>
  </>
);

export default CollaboratorsList;
