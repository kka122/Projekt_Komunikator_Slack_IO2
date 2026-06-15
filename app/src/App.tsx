import './App.css'
import {createBrowserRouter, RouterProvider} from "react-router";
import Root from "./layouts/Root.tsx";
import RouteError from "./pages/RouteError/RouteError.tsx";
import RequireAuth from "./layouts/RequireAuth.tsx";
import WorkspaceLayout from "./layouts/WorkspaceLayout.tsx";
import HomePage from "./pages/HomePage/HomePage.tsx";
import LoginPage from "./pages/LoginPage/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.tsx";
import WorkspacesPage from "./pages/WorkspacesPage/WorkspacesPage.tsx";
import WorkspaceHome from "./pages/WorkspaceHome/WorkspaceHome.tsx";
import ChannelPage from "./pages/ChannelPage/ChannelPage.tsx";
import DirectChatPage from "./pages/DirectChatPage/DirectChatPage.tsx";
import MembersPage from "./pages/MembersPage/MembersPage.tsx";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage/WorkspaceSettingsPage.tsx";
import ProfileSettingsPage from "./pages/ProfileSettingsPage/ProfileSettingsPage.tsx";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <RouteError/>,
    children: [
      {index: true, Component: HomePage},
      {path: "auth/login", Component: LoginPage},
      {path: "auth/register", Component: RegisterPage},
      {
        Component: RequireAuth,
        children: [
          {path: "workspaces", Component: WorkspacesPage},
          {
            path: "workspaces/:workspaceId",
            Component: WorkspaceLayout,
            children: [
              {index: true, Component: WorkspaceHome},
              {path: "channels/:channelId", Component: ChannelPage},
              {path: "dms/:directChatId", Component: DirectChatPage},
              {path: "members", Component: MembersPage},
              {path: "settings", Component: WorkspaceSettingsPage},
            ],
          },
          {path: "settings", Component: ProfileSettingsPage},
        ],
      },
      {path: "*", Component: NotFoundPage},
    ]
  }
])

function App() {
  return <RouterProvider router={router}/>
}

export default App
