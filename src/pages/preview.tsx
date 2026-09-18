import Head from "next/head";
import OverviewLayout from "../components/OverviewLayout";
import CreateProjectForm from "../components/CreateProjectForm";
import ProjectCards from "../components/ProjectCards";
import InvitesList from "../components/InvitesList";

const projects = [
  { id: "website", title: "Website redesign", deadline: "2026-10-16", owner: "you@example.com" },
  { id: "launch", title: "Product launch", deadline: "2026-11-06", owner: "you@example.com" },
];
const shared = [{ id: "brand", title: "Brand guidelines", deadline: "2026-10-30", owner: "alex@example.com" }];
const noop = () => {};

// Static sample data; shared presentation components never fetch or write user data.
export default function Preview() {
  return <>
    <Head><title>WogelPlanner workspace preview</title><meta name="robots" content="noindex" /></Head>
    <div inert>
      <OverviewLayout
        accountAction={<button type="button">Log Out</button>}
        createForm={<CreateProjectForm onCreate={noop} error="" projectOwner="you@example.com" />}
      >
        <ProjectCards projects={projects} completion={{ website: 62, launch: 25 }} />
        <ProjectCards projects={shared} completion={{ brand: 80 }} collaboration />
        <InvitesList invites={[]} onRespond={noop} />
      </OverviewLayout>
    </div>
  </>;
}
