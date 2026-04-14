import './App.css'
import {RouterProvider} from "react-router/dom";
import {createBrowserRouter} from "react-router";
import Root from "./Root.tsx";
import LoginScreen from "./pages/LoginScreen/LoginScreen.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: () => <div>Spierdzielaj</div>,
    children: [
      {
        path: "auth",
        children: [
          {
            path: "login",
            Component: LoginScreen
          },
          {
            path: "register",
            Component: () => <div>Register</div>
          },
        ]
      }
    ]
  }
])

function App() {
  return <RouterProvider router={router}/>
}

export default App
