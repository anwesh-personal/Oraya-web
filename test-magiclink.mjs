import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const email = "anweshrath@gmail.com";

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  console.log("Link Data:", JSON.stringify(linkData, null, 2));
  if (!linkData || !linkData.properties) {
    console.log("Error generating link:", linkError?.message);
    return;
  }

  // Try 1: with email + token
  const res1 = await supabase.auth.verifyOtp({
    email,
    token: linkData.properties.hashed_token,
    type: "magiclink"
  });
  console.log("Res 1:", res1.error ? res1.error.message : "Success");

  // Need a new link to test the second one as magic links are single use
  const { data: linkData2 } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  // Try 2: with token_hash
  const res2 = await supabase.auth.verifyOtp({
    token_hash: linkData2.properties.hashed_token,
    type: "magiclink"
  });
  console.log("Res 2:", res2.error ? res2.error.message : "Success");
}

run();
