import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { NavBar } from "@/components/NavBar.tsx";
import { MyToastContainer } from "@/components/ToastContainer";

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <MyToastContainer />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  ),
});
