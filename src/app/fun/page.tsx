import { redirect } from "next/navigation";

/** Old Fun corner URL — wishes moved to `/wishes`; Fun Lab games come later for signed-in users. */
export default function FunRedirectPage() {
  redirect("/wishes");
}
