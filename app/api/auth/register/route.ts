import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
    try {
        const { email, password, name, organization } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: {
                    full_name: name || "",
                    organization: organization || "",
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
            },
        });

        if (error) {
            console.error("Supabase signup error:", error.message);

            let message = "Registration failed";
            if (error.message.includes("already registered") || error.message.includes("already been registered")) {
                message = "An account with this email already exists";
            } else if (error.message.includes("password")) {
                message = "Password is too weak. Use at least 8 characters with a mix of letters and numbers";
            } else if (error.message.includes("valid email")) {
                message = "Please enter a valid email address";
            } else if (error.message.includes("rate limit") || error.message.includes("Too many")) {
                message = "Too many signup attempts. Please try again later";
            }

            return NextResponse.json({ error: message }, { status: 400 });
        }

        if (!data.user) {
            return NextResponse.json(
                { error: "Registration failed" },
                { status: 400 }
            );
        }

        // Check if email confirmation is required
        const needsEmailConfirmation = !data.session;

        return NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.full_name || null,
            },
            needsEmailConfirmation,
            message: needsEmailConfirmation
                ? "Account created! Please check your email to verify your account."
                : "Account created successfully!",
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
