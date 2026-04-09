import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders correctly", () => {
    render(<App/>)
    const heading = screen.getByRole("heading", {name: /adasd/i})
    expect(heading).toBeInTheDocument()
  })
})