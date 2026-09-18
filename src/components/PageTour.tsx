import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiCheck, FiX } from "react-icons/fi";
import styles from "../styles/tour.module.css";

type TourPage = "overview" | "project" | "graph";
const guides: Record<TourPage, { label: string; steps: { title: string; text: string; target: string }[] }> = {
  overview: { label: "Your workspace", steps: [
    { title: "Start with a project", text: "Give your project a name, choose a kickoff date and deadline, then select Create Project. This is where your plan begins.", target: "create-project" },
    { title: "See the bigger picture", text: "Your projects appear here with deadlines and completion progress. Select a project title to open its tasks and timeline.", target: "project-list" },
    { title: "Work together", text: "Projects you join appear under Collaboration Projects. Accept or decline new invitations in Invites below.", target: "collaboration" },
  ] },
  project: { label: "Your project", steps: [
    { title: "Add your next task", text: "Enter a task title and description. Choose an existing category or create one, then select Add Task.", target: "create-task" },
    { title: "Set the direction", text: "Double-click the project title, kickoff date, or deadline to edit it. Click away from the field to save your change.", target: "project-details" },
    { title: "Plan your time", text: "The timeline shows each category’s place in the project. Colored segments below show task allocations. Double-click a segment to open its task.", target: "timeline" },
    { title: "Organize and complete work", text: "Drag category columns to reorder them. Select a task to see its details, edit fields with a double-click, or mark it complete. Completed tasks appear below the board.", target: "task-board" },
    { title: "Bring others in", text: "Enter an email address and select Invite to invite someone to this project. Use View Task Graph to explore connections between tasks.", target: "project-actions" },
  ] },
  graph: { label: "Your task graph", steps: [
    { title: "See the connections", text: "Each card represents a task. Green tasks are complete; red tasks are incomplete. Arrows show the connections you’ve created.", target: "task-graph" },
    { title: "Arrange your plan", text: "Drag cards to arrange the graph. Use the controls in the lower-left corner to zoom or fit the graph to the screen. Card positions save when you finish dragging.", target: "task-graph" },
    { title: "Connect and inspect tasks", text: "Drag from a card’s right connector to another card’s left connector to link them. Double-click an arrow to remove a connection, or double-click a card to open its details.", target: "task-graph" },
  ] },
};

export default function PageTour({ page }: { page: TourPage }) {
  const guide = guides[page];
  const storageKey = `wogelplanner:tour:v1:${page}`;
  const [welcome, setWelcome] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try { setWelcome(localStorage.getItem(storageKey) !== "seen"); }
    catch { setWelcome(true); }
  }, [storageKey]);

  const remember = () => {
    try { localStorage.setItem(storageKey, "seen"); } catch { /* Tours still work if storage is unavailable. */ }
    setWelcome(false);
  };
  const close = () => { remember(); setOpen(false); };
  const start = () => { remember(); setStep(0); setOpen(true); };

  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    title.current?.focus();
    const target = document.querySelector<HTMLElement>(`[data-tour="${guide.steps[step].target}"]`);
    target?.setAttribute("data-tour-highlight", "true");
    target?.scrollIntoView({ behavior: "instant", block: "center" });
    return () => { target?.removeAttribute("data-tour-highlight"); };
  }, [open, step, guide]);

  return <>
    {welcome && !open && <aside className={styles.welcome} aria-label="Optional page introduction">
      <button className={styles.dismiss} type="button" aria-label="Dismiss introduction" onClick={remember}><FiX aria-hidden="true" /></button>
      <span className={styles.kicker}><FiBookOpen aria-hidden="true" /> NEW HERE?</span>
      <h2>A quick tour of {guide.label.toLowerCase()}.</h2>
      <p>{guide.steps.length} short steps to help you get started. You can skip or replay it anytime.</p>
      <div className={styles.actions}><button type="button" onClick={start}>Show me around <FiArrowRight aria-hidden="true" /></button><button type="button" className={styles.secondary} onClick={remember}>Not now</button></div>
    </aside>}
    <button ref={launcher} className={styles.launcher} type="button" onClick={start} aria-haspopup="dialog"><FiBookOpen aria-hidden="true" /> Page guide</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`tour-title-${page}`} aria-describedby={`tour-text-${page}`} onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setOpen(false); launcher.current?.focus(); }}>
      <button type="button" className={styles.dismiss} aria-label="Close guide" onClick={close}><FiX aria-hidden="true" /></button>
      <span className={styles.kicker}>{guide.label} · Step {step + 1} of {guide.steps.length}</span>
      <progress className={styles.progress} value={step + 1} max={guide.steps.length} aria-label="Guide progress" />
      <div aria-live="polite" aria-atomic="true">
        <h2 ref={title} tabIndex={-1} id={`tour-title-${page}`}>{guide.steps[step].title}</h2>
        <p id={`tour-text-${page}`}>{guide.steps[step].text}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={close}>Skip tour</button>
        <div className={styles.navigation}>
          <button type="button" className={styles.secondary} disabled={step === 0} onClick={() => setStep(value => value - 1)} aria-label="Previous step"><FiArrowLeft aria-hidden="true" /></button>
          <button type="button" onClick={() => step === guide.steps.length - 1 ? close() : setStep(value => value + 1)}>{step === guide.steps.length - 1 ? <>Done <FiCheck aria-hidden="true" /></> : <>Next <FiArrowRight aria-hidden="true" /></>}</button>
        </div>
      </div>
    </dialog>
  </>;
}
