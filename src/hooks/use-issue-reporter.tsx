import { createContext, useContext, useState } from "react";

type IssueReporterContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

const IssueReporterContext = createContext<IssueReporterContextValue>({
	open: false,
	setOpen: () => {},
});

export function IssueReporterProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	return (
		<IssueReporterContext.Provider value={{ open, setOpen }}>
			{children}
		</IssueReporterContext.Provider>
	);
}

export function useIssueReporter() {
	return useContext(IssueReporterContext);
}
