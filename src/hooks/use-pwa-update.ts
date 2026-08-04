import { useRegisterSW } from "virtual:pwa-register/react";
import { useCallback, useEffect, useRef } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

export function usePwaUpdate() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, registration) {
			if (!registration) return;

			// Periodic update check
			setInterval(async () => {
				if (registration.installing || !navigator.onLine) return;

				try {
					const resp = await fetch(swUrl, {
						cache: "no-store",
						headers: { "cache-control": "no-cache" },
					});
					if (resp.status === 200) {
						await registration.update();
					}
				} catch {
					// Network error — skip this cycle
				}
			}, UPDATE_CHECK_INTERVAL_MS);
		},
	});

	const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

	// Capture registration for resume checks
	useEffect(() => {
		navigator.serviceWorker?.getRegistration().then((reg) => {
			registrationRef.current = reg ?? null;
		});
	}, []);

	// Check for updates when app resumes from background
	useEffect(() => {
		function checkOnResume() {
			if (document.visibilityState === "visible") {
				registrationRef.current?.update();
			}
		}

		function checkOnPageShow(e: PageTransitionEvent) {
			if (e.persisted) {
				registrationRef.current?.update();
			}
		}

		document.addEventListener("visibilitychange", checkOnResume);
		window.addEventListener("pageshow", checkOnPageShow);

		return () => {
			document.removeEventListener("visibilitychange", checkOnResume);
			window.removeEventListener("pageshow", checkOnPageShow);
		};
	}, []);

	const applyUpdate = useCallback(() => {
		if (needRefresh) {
			updateServiceWorker(true);
		}
	}, [needRefresh, updateServiceWorker]);

	return { needRefresh, applyUpdate };
}
