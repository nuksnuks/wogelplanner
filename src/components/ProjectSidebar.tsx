import React from "react";
import TaskCreationForm from "./TaskCreationForm";
import CollaboratorsList from "./CollaboratorsList";
import PendingInvitesList from "./PendingInvitesList";

type Props = {
  // Task creation
  title: string;
  setTitle: (s: string) => void;
  description: string;
  setDescription: (s: string) => void;
  category: string;
  setCategory: (s: string) => void;
  newCategory: string;
  setNewCategory: (s: string) => void;
  categories: string[];
  error: string;
  onSubmit: (e: React.FormEvent) => void;

  // collaborators / invites
  collaborators: string[];
  projectOwner: string;
  userEmail?: string | null;
  onKick: (email: string) => void;
  onLeave: () => void;
  pendingInvites: { email: string; invitedAt: number }[];
  onRemoveInvite: (email: string) => void;
};

export default function ProjectSidebar(props: Props) {
  const { title, setTitle, description, setDescription, category, setCategory, newCategory, setNewCategory, categories, error, onSubmit, collaborators, projectOwner, userEmail, onKick, onLeave, pendingInvites, onRemoveInvite } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TaskCreationForm
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        category={category}
        setCategory={setCategory}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        categories={categories}
        error={error}
        onSubmit={onSubmit}
      />

      <CollaboratorsList
        collaborators={collaborators}
        projectOwner={projectOwner}
        userEmail={userEmail}
        onKick={onKick}
        onLeave={onLeave}
      />

      <PendingInvitesList
        pendingInvites={pendingInvites}
        isOwner={!!(userEmail && projectOwner && userEmail.trim().toLowerCase() === projectOwner.trim().toLowerCase())}
        onRemove={onRemoveInvite}
      />
    </div>
  );
}
