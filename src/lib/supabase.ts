import { createClient } from "@supabase/supabase-js";

declare global {
	interface Window {
		__CONFIG__?: {
			SUPABASE_URL?: string;
			SUPABASE_ANON_KEY?: string;
		};
	}
}

const supabaseUrl =
	window.__CONFIG__?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
	window.__CONFIG__?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY (Docker) or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (.env)",
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = supabase.schema("pottery");
