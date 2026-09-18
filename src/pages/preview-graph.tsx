import Head from "next/head";
import BackButton from "../components/BackButton";
import dynamic from "next/dynamic";
import { previewTasks, previewEdges, previewNoop } from "../components/previewData";

// System color mode depends on the browser and cannot be known during prerendering.
const TaskFlow = dynamic(() => import("../components/TaskFlow"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: 680 }} />,
});

export default function GraphPreview() {
  return <>
    <Head><title>WogelPlanner task graph preview</title><meta name="robots" content="noindex" /></Head>
    <div inert>
      <BackButton />
      <h1>Task Graph</h1>
      <TaskFlow tasks={previewTasks} edges={previewEdges} setEdges={previewNoop} />
    </div>
  </>;
}
