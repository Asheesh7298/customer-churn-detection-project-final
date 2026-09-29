import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";

// Each page is loaded on demand the first time it's visited (code splitting),
// so the initial download stays small — e.g. the charting library only loads
// on pages that draw charts.
const Overview = lazy(() => import("@/pages/Overview"));
const Predict = lazy(() => import("@/pages/Predict"));
const BatchScoring = lazy(() => import("@/pages/BatchScoring"));
const WhatIf = lazy(() => import("@/pages/WhatIf"));
const BusinessImpact = lazy(() => import("@/pages/BusinessImpact"));
const ModelReport = lazy(() => import("@/pages/ModelReport"));
const Cohorts = lazy(() => import("@/pages/Cohorts"));
const Segments = lazy(() => import("@/pages/Segments"));
const RiskCharts = lazy(() => import("@/pages/RiskCharts"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/batch" element={<BatchScoring />} />
          <Route path="/what-if" element={<WhatIf />} />
          <Route path="/business-impact" element={<BusinessImpact />} />
          <Route path="/model" element={<ModelReport />} />
          <Route path="/cohorts" element={<Cohorts />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/risk-charts" element={<RiskCharts />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

function PageLoading() {
  return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-3 p-8 text-center">
      <h1 className="font-display text-2xl">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That page doesn&apos;t exist. Head back to the overview to keep going.
      </p>
      <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">
        Go to overview
      </Link>
    </div>
  );
}
