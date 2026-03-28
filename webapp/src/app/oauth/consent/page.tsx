"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface AuthorizationDetails {
  client: { name: string };
  redirect_uri: string;
  scope: string;
}

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authorizationId = searchParams.get("authorization_id");

  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );

  useEffect(() => {
    if (!authorizationId) {
      setError("Parametro authorization_id mancante.");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login, preserving authorization_id
        router.push(`/login?redirect=/oauth/consent?authorization_id=${authorizationId}`);
        return;
      }

      // Get authorization details
      const { data, error: fetchError } = await (supabase.auth as any).oauth.getAuthorizationDetails(authorizationId);

      if (fetchError) {
        setError(fetchError.message ?? "Errore nel recupero dei dettagli.");
        setLoading(false);
        return;
      }

      setDetails(data);
      setLoading(false);
    };

    fetchDetails();
  }, [authorizationId]);

  const handleApprove = useCallback(async () => {
    if (!authorizationId) return;
    setSubmitting(true);

    const { data, error: approveError } = await (supabase.auth as any).oauth.approveAuthorization(authorizationId);

    if (approveError) {
      setError(approveError.message ?? "Errore nell'approvazione.");
      setSubmitting(false);
      return;
    }

    // Redirect back to the OAuth client (ChatGPT)
    if (data?.redirect_to) {
      window.location.href = data.redirect_to;
    }
  }, [authorizationId, supabase]);

  const handleDeny = useCallback(async () => {
    if (!authorizationId) return;
    setSubmitting(true);

    const { data, error: denyError } = await (supabase.auth as any).oauth.denyAuthorization(authorizationId);

    if (denyError) {
      setError(denyError.message ?? "Errore nel rifiuto.");
      setSubmitting(false);
      return;
    }

    if (data?.redirect_to) {
      window.location.href = data.redirect_to;
    }
  }, [authorizationId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const scopes = details?.scope?.split(" ").filter(Boolean) ?? [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold mb-2">Autorizza applicazione</h1>
        <p className="text-gray-600 text-sm mb-6">
          <strong>{details?.client?.name ?? "Un'applicazione"}</strong> vuole accedere al tuo Digital Twin.
        </p>

        {scopes.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Permessi richiesti:</p>
            <ul className="space-y-1">
              {scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">&#10003;</span>
                  {scope}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Rifiuta
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "..." : "Autorizza"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  );
}
