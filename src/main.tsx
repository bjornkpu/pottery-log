import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element in index.html");

ReactDOM.createRoot(rootElement).render(
	<QueryClientProvider client={router.options.context.queryClient}>
		<RouterProvider router={router} />
	</QueryClientProvider>,
);
