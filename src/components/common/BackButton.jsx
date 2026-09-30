import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function BackButton({ label = "Back" }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}

export default BackButton;