import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { RecievedUser } from "$lib/db_types";

const RegisterPageSchema = z
	.object({
		email: z.string().email(),
		name: z.string().min(3).max(48),
		password: z.string().min(6).max(64),
		passwordConfirm: z.string().min(6).max(64)
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: "Passwords don't match",
		path: ["confirm"]
	});
export const load = async () => {
	// Server API:
	const form = await superValidate(RegisterPageSchema);

	// Unless you throw, always return { form } in load and form actions.
	return { form };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await superValidate(request, RegisterPageSchema);
		console.log("POST", form);

		// Convenient validation check:
		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}
		await locals.pb.collection<RecievedUser>("users").create(form.data); // create user
		await locals.pb.collection("users").authWithPassword(form.data.email, form.data.password); // login
		throw redirect(303, "/");
		// return { form };
	}
};