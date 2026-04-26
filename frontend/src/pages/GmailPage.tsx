import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { gmailApi } from "../api/client";
import type { GmailStatus } from "../types";

export default function GmailPage() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gmailApi.status();
      setStatus(res.data);
      setSubjectTemplate(res.data.email_subject_template);
      setBodyTemplate(res.data.email_body_template);
    } catch {
      toast.error("Failed to load Gmail status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    const load = async () => {
      await fetchStatus();
      if (gmailParam === "connected") {
        toast.success("Gmail account connected successfully!");
      } else if (gmailParam === "error") {
        const msg = searchParams.get("message") || "Failed to connect Gmail";
        toast.error(msg);
      }
    };
    void load();
  }, [searchParams.toString(), fetchStatus]);

  const handleConnect = async () => {
    try {
      const res = await gmailApi.authUrl();
      window.location.href = res.data.url;
    } catch {
      toast.error("Failed to get auth URL");
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Disconnect Gmail account? Email sending will be disabled.")) return;
    try {
      await gmailApi.revoke();
      toast.success("Gmail disconnected");
      fetchStatus();
    } catch {
      toast.error("Failed to disconnect Gmail");
    }
  };

  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTemplates(true);
    try {
      await gmailApi.updateTemplates({
        email_subject_template: subjectTemplate,
        email_body_template: bodyTemplate,
      });
      toast.success("Templates saved");
    } catch {
      toast.error("Failed to save templates");
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleSendToday = async () => {
    setSendingEmails(true);
    try {
      const res = await gmailApi.sendToday();
      toast.success(`Sent ${res.data.sent} email(s). Errors: ${res.data.errors}`);
    } catch {
      toast.error("Failed to send today's emails");
    } finally {
      setSendingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading Gmail settings…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Gmail Integration</h1>

      {/* Connection status */}
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Connection Status</h2>
        {status?.authorized ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
            <p className="text-sm text-gray-600">
              Sending as:{" "}
              <span className="font-medium text-gray-900">
                {status.authorized_email}
              </span>
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSendToday}
                disabled={sendingEmails}
                className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {sendingEmails ? "Sending…" : "📤 Send Today's Emails Now"}
              </button>
              <button
                onClick={handleRevoke}
                className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-500">Not connected</span>
            </div>
            <p className="text-sm text-gray-500">
              Connect a Gmail account to enable automatic email notifications for
              rotation events.
            </p>
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-white border-2 border-gray-200 hover:border-brand-400 text-gray-700 hover:text-brand-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"
                />
                <path
                  fill="#4A90D9"
                  d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ul className="space-y-1 list-disc list-inside text-blue-700">
          <li>Emails are automatically sent at <strong>7:00 AM</strong> each day to the assigned member.</li>
          <li>You can also manually trigger emails using the button above.</li>
          <li>Only events from <strong>active rotations</strong> trigger emails.</li>
          <li>Use <code className="bg-blue-100 px-1 rounded">{"{name}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{email}"}</code>, and <code className="bg-blue-100 px-1 rounded">{"{date}"}</code> as placeholders in templates.</li>
        </ul>
      </div>

      {/* Setup instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
        <h3 className="font-semibold mb-2">Setup: Google Cloud Console</h3>
        <ol className="space-y-1 list-decimal list-inside text-amber-700">
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">console.cloud.google.com</a></li>
          <li>Create a project, enable the <strong>Gmail API</strong></li>
          <li>Create OAuth 2.0 credentials (Web application type)</li>
          <li>Set redirect URI to <code className="bg-amber-100 px-1 rounded">http://your-domain/api/gmail/callback</code></li>
          <li>Copy <code className="bg-amber-100 px-1 rounded">GMAIL_CLIENT_ID</code> and <code className="bg-amber-100 px-1 rounded">GMAIL_CLIENT_SECRET</code> to your <code className="bg-amber-100 px-1 rounded">.env</code></li>
          <li>Restart the backend container, then click "Sign in with Google" above</li>
        </ol>
      </div>

      {/* Email templates */}
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Email Templates</h2>
        <form onSubmit={handleSaveTemplates} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Template
            </label>
            <input
              type="text"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="You are hosting the event on {date}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Template
            </label>
            <textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={8}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono resize-y"
              placeholder="Hi {name},..."
            />
          </div>
          <p className="text-xs text-gray-400">
            Available variables:{" "}
            <code className="bg-gray-100 px-1 rounded">{"{name}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded">{"{email}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded">{"{date}"}</code>
          </p>
          <button
            type="submit"
            disabled={savingTemplates}
            className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {savingTemplates ? "Saving…" : "Save Templates"}
          </button>
        </form>
      </div>
    </div>
  );
}
