import { useState, useEffect, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "#/lib/supabase";

type AuthState = {
	session: Session | null;
	user: User | null;
	loading: boolean;
};

export function useAuth() {
	const [state, setState] = useState<AuthState>({
		session: null,
		user: null,
		loading: true,
	});

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setState({ session, user: session?.user ?? null, loading: false });
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setState({ session, user: session?.user ?? null, loading: false });
		});

		return () => subscription.unsubscribe();
	}, []);

	const signIn = useCallback(async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		return { error };
	}, []);

	const signOut = useCallback(async () => {
		await supabase.auth.signOut();
	}, []);

	return { ...state, signIn, signOut };
}
