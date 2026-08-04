import type * as React from "react";
import { useLayoutEffect, useRef } from "react";

import { cn } from "#/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Grows the field with its content. CSS field-sizing would do this without
	// JS, but it only shipped in Safari 26.2 and Firefox 152, and the app is
	// used on older iOS. Keyed on the value rather than an onInput handler so
	// that mounting with saved notes resizes too, not just typing. The
	// "auto" reset is required: scrollHeight on an element with an explicit
	// height reports only the overflow beyond it, so without the reset the
	// field would grow and never shrink.
	/* biome-ignore lint/correctness/useExhaustiveDependencies: props.value is the
	   trigger, not a value the effect reads. The new text is already in the DOM
	   node by the time this runs, so the measurement comes from the element. */
	useLayoutEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, [props.value]);

	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex max-h-64 min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
				className,
			)}
			{...props}
			ref={textareaRef}
		/>
	);
}

export { Textarea };
