import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface Snapshot {
  totalNetWorth: number;
  accounts: Array<{
    name: string;
    category: string;
    taxTreatment: string;
    balance: number;
  }>;
  goals: Array<{
    name: string;
    type: string;
    targetNetWorth: number;
    progress: number;
    yearsToFire: number | null;
  }>;
  latestBudget: {
    month: string;
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
    topExpenses: Array<{ category: string; amount: number }>;
  } | null;
  accountBreakdown: {
    taxDeferred: number;
    taxFree: number;
    taxable: number;
    taxAdvantaged: number;
  };
}

interface RuleInsight {
  title: string;
  body: string;
  type: "positive" | "warning" | "tip";
}

function InsightsPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [ruleInsights, setRuleInsights] = useState<RuleInsight[] | null>(null);

  // Fetch financial snapshot
  const { data: snapshotData } = useQuery({
    queryKey: ["insights-snapshot"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/insights/snapshot`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch snapshot");
      return res.json() as Promise<{ snapshot: Snapshot }>;
    },
    enabled: !!session?.user,
  });

  const snapshot = snapshotData?.snapshot;

  // Generate AI insights (handles both streaming and rule-based)
  const generateInsights = useCallback(async () => {
    setAiResponse("");
    setRuleInsights(null);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_URL}/api/insights/generate`, {
        method: "POST",
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        // Rule-based response (no OpenAI key)
        const data = await res.json();
        setRuleInsights(data.insights);
      } else {
        // Streaming response from OpenAI
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let accumulated = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setAiResponse(accumulated);
          }
        }
      }
    } catch (err) {
      setAiResponse("Failed to generate insights. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  if (isPending) return <Loading />;
  if (!session?.user) {
    navigate({ to: "/login" });
    return null;
  }

  const hasData = snapshot && snapshot.accounts.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">🤖 AI Insights</h1>
      <p className="mt-1 text-gray-600">
        Get personalized analysis of your financial situation and FIRE progress.
      </p>

      {!hasData ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg text-gray-500">Not enough data yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Add accounts, set FIRE goals, and create a budget to unlock AI
            insights.
          </p>
        </div>
      ) : (
        <>
          {/* Financial Snapshot Summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SnapshotCard
              label="Net Worth"
              value={fmt(snapshot.totalNetWorth)}
              icon="💰"
            />
            {snapshot.goals[0] && (
              <SnapshotCard
                label={`${snapshot.goals[0].name} Progress`}
                value={`${snapshot.goals[0].progress}%`}
                sublabel={
                  snapshot.goals[0].yearsToFire
                    ? `~${snapshot.goals[0].yearsToFire} years to go`
                    : undefined
                }
                icon="🎯"
              />
            )}
            {snapshot.latestBudget && (
              <SnapshotCard
                label="Savings Rate"
                value={`${snapshot.latestBudget.savingsRate}%`}
                sublabel={`${snapshot.latestBudget.month}`}
                icon="📊"
              />
            )}
          </div>

          {/* Account breakdown mini-chart */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700">
              Asset Allocation by Tax Treatment
            </h2>
            <div className="mt-3 flex gap-1 overflow-hidden rounded-full h-6">
              {[
                {
                  key: "taxDeferred",
                  label: "Tax-Deferred",
                  color: "bg-amber-400",
                  value: snapshot.accountBreakdown.taxDeferred,
                },
                {
                  key: "taxFree",
                  label: "Tax-Free",
                  color: "bg-green-400",
                  value: snapshot.accountBreakdown.taxFree,
                },
                {
                  key: "taxable",
                  label: "Taxable",
                  color: "bg-indigo-400",
                  value: snapshot.accountBreakdown.taxable,
                },
                {
                  key: "taxAdvantaged",
                  label: "Tax-Advantaged",
                  color: "bg-blue-400",
                  value: snapshot.accountBreakdown.taxAdvantaged,
                },
              ]
                .filter((s) => s.value > 0)
                .map((s) => (
                  <div
                    key={s.key}
                    className={`${s.color} transition-all`}
                    style={{
                      width: `${(s.value / snapshot.totalNetWorth) * 100}%`,
                    }}
                    title={`${s.label}: ${fmt(s.value)}`}
                  />
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
              {snapshot.accountBreakdown.taxDeferred > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Tax-Deferred: {fmt(snapshot.accountBreakdown.taxDeferred)}
                </span>
              )}
              {snapshot.accountBreakdown.taxFree > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  Tax-Free: {fmt(snapshot.accountBreakdown.taxFree)}
                </span>
              )}
              {snapshot.accountBreakdown.taxable > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  Taxable: {fmt(snapshot.accountBreakdown.taxable)}
                </span>
              )}
              {snapshot.accountBreakdown.taxAdvantaged > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  Tax-Advantaged: {fmt(snapshot.accountBreakdown.taxAdvantaged)}
                </span>
              )}
            </div>
          </div>

          {/* Generate button */}
          <div className="mt-6">
            <button
              onClick={generateInsights}
              disabled={isStreaming}
              className="rounded-lg bg-fire-500 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-fire-600 disabled:opacity-50"
            >
              {isStreaming ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing your finances...
                </span>
              ) : aiResponse || ruleInsights ? (
                "Refresh Insights"
              ) : (
                "✨ Generate AI Insights"
              )}
            </button>
          </div>

          {/* Rule-based insights (cards) */}
          {ruleInsights && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-gray-400">
                💡 Rule-based insights (add OPENAI_API_KEY to .env for AI-powered analysis)
              </p>
              {ruleInsights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          )}

          {/* AI streaming response */}
          {aiResponse && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={aiResponse} />
              </div>
              {isStreaming && (
                <span className="mt-2 inline-block h-4 w-1 animate-pulse bg-fire-500" />
              )}
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400">
            ⚠️ This tool is for informational purposes only and is not financial
            advice. Consult a qualified financial advisor for personalized
            guidance.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function SnapshotCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: RuleInsight }) {
  const styles = {
    positive: {
      border: "border-green-200",
      bg: "bg-green-50",
      icon: "✅",
    },
    warning: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      icon: "⚠️",
    },
    tip: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      icon: "💡",
    },
  };

  const s = styles[insight.type];

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-5`}>
      <h3 className="flex items-center gap-2 font-semibold text-gray-800">
        <span>{s.icon}</span>
        {insight.title}
      </h3>
      <p className="mt-1 text-sm text-gray-600">{insight.body}</p>
    </div>
  );
}

/**
 * Simple markdown renderer — handles headers, bold, lists, paragraphs.
 * No dependency needed for basic formatting.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("### "))
          return (
            <h3 key={i} className="text-base font-semibold text-gray-800 mt-4">
              {line.slice(4)}
            </h3>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i} className="text-lg font-semibold text-gray-800 mt-4">
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("# "))
          return (
            <h1 key={i} className="text-xl font-bold text-gray-900 mt-4">
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <li key={i} className="ml-4 list-disc text-sm text-gray-700">
              <BoldText text={line.slice(2)} />
            </li>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm text-gray-700">
              <BoldText text={line.replace(/^\d+\.\s/, "")} />
            </li>
          );
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return (
          <p key={i} className="text-sm text-gray-700">
            <BoldText text={line} />
          </p>
        );
      })}
    </div>
  );
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
