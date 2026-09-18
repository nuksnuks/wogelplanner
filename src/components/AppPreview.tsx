import { useEffect, useRef, useState } from "react";
import styles from "../styles/appPreview.module.css";

const width = 1100;

const views = {
  overview: { src: "/preview", label: "YOUR WORKSPACE, AT A GLANCE", title: "Project overview" },
  project: { src: "/preview-project", label: "PROJECT BOARD", title: "Project board and timeline" },
  graph: { src: "/preview-graph", label: "TASK GRAPH", title: "Task graph" },
};

export default function AppPreview({ view = "overview" }: { view?: keyof typeof views }) {
  const example = views[view];
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <figure className={styles.preview}>
    <figcaption className={styles.caption}><span>{example.label}</span><span>Sample projects</span></figcaption>
    <div ref={container} className={styles.viewport}>
      <iframe
        src={example.src}
        loading={view === "overview" ? "eager" : "lazy"}
        title={`Actual WogelPlanner ${example.title} with sample data`}
        className={styles.frame}
        tabIndex={-1}
        inert
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  </figure>;
}
