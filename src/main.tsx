import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={router.options.context.queryClient}>
		<RouterProvider router={router} />
	</QueryClientProvider>,
);
