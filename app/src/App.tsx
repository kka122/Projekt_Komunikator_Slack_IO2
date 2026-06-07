import './App.css'
import {RouterProvider} from "react-router/dom";
import {createBrowserRouter} from "react-router";
import Root from "./layouts/Root.tsx";
import LoginScreen from "./pages/LoginScreen/LoginScreen.tsx";
import HomePage from "./pages/HomePage/HomePage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: HomePage
      },
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
