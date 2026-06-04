import Link from "next/link"
import { redirect } from "next/navigation"

export default function AdminPage() {
  redirect("/admin/users")
}
