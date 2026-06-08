import './App.css'
import {RouterProvider} from "react-router/dom";
import {createBrowserRouter, Navigate} from "react-router";
import Root from "./layouts/Root.tsx";
import HomePage from "./pages/HomePage/HomePage.tsx";
import LoginPage from "./pages/LoginPage/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <Navigate to={"/"}/>,
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
            Component: LoginPage
          },
          {
            path: "register",
            Component: RegisterPage
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
