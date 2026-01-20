import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

type Props = {
  title?: string;
  subtitleLines?: string[];
  role?: string;
};

export default function AppHeader({
  title = "Trackly Home",
  subtitleLines = [],
  role,
}: Props) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {role && (
          <div className="text-sm text-gray-600 capitalize">Role: {role}</div>
        )}
        {subtitleLines.map((l) => (
          <div key={l} className="text-sm text-gray-600">
            {l}
          </div>
        ))}
      </div>

      <button className="rounded-lg border px-3 py-2" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
