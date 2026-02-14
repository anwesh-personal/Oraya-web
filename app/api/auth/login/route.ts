import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
        });

        if (error) {
            console.error("Supabase auth error:", error.message);

            // Map Supabase errors to user-friendly messages
            let message = "Invalid email or password";
            if (error.message.includes("Email not confirmed")) {
                message = "Please verify your email address before signing in";
            } else if (error.message.includes("Invalid login credentials")) {
                message = "Invalid email or password";
            } else if (error.message.includes("Too many requests")) {
                message = "Too many login attempts. Please try again later";
            }

            return NextResponse.json({ error: message }, { status: 401 });
        }

        if (!data.user || !data.session) {
            return NextResponse.json(
                { error: "Authentication failed" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
                avatar_url: data.user.user_metadata?.avatar_url || null,
            },
            message: "Login successful",
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
