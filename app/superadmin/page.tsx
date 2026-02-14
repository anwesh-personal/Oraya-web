import { redirect } from "next/navigation";

// /superadmin redirects to superadmin login
export default function SuperadminPage() {
    redirect("/superadmin/login");
}
