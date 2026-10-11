import type { ReactNode } from "react";

type LoadingVariant =
  | "home" | "catalog" | "detail" | "admin" | "auth" | "account" | "employee"
  | "admin-services" | "admin-categories" | "admin-employees" | "admin-schedules" | "admin-metrics"
  | "profile" | "reservations" | "checkout" | "employee-home" | "scanner"
  | "login" | "register" | "forgot-password" | "verify-email" | "reset-password";

function Block({ className = "" }: { className?: string }) {
  return <span className={`skeleton-block ${className}`} aria-hidden="true" />;
}

function Heading({ lines = 2, className = "" }: { lines?: number; className?: string }) {
  return <div className={`skeleton-heading ${className}`}><Block className="skeleton-line skeleton-line-title" />{lines > 1 && <Block className="skeleton-line skeleton-line-long" />}</div>;
}

function Cards({ count = 4 }: { count?: number }) {
  return <div className="skeleton-card-grid" aria-hidden="true">{Array.from({ length: count }, (_, i) => <div className="skeleton-service-card" key={i}><Block className="skeleton-card-image" /><div className="skeleton-card-copy"><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line" /><Block className="skeleton-line skeleton-line-long" /></div></div>)}</div>;
}

function Tabs() {
  return <div className="skeleton-tabs" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Block className="skeleton-tab" key={i} />)}</div>;
}

function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`club-container page-skeleton ${className}`} aria-busy="true" aria-label="Cargando contenido">{children}</main>;
}

function AdminTop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Shell className={`admin-wrap ${className}`}><Heading /><Tabs />{children}</Shell>;
}

function AdminCatalogSkeleton({ categories = false }: { categories?: boolean }) {
  const rows = categories ? 5 : 6;
  return <div className="skeleton-admin-grid">
    <section className="skeleton-panel skeleton-form-panel skeleton-admin-editor">
      <Block className="skeleton-line skeleton-line-medium" />
      <Block className="skeleton-field" />
      {categories ? <Block className="skeleton-field skeleton-field-large" /> : <><Block className="skeleton-field skeleton-field-large" /><Block className="skeleton-field" /><div className="skeleton-field-pair"><Block className="skeleton-field" /><Block className="skeleton-field" /></div><Block className="skeleton-image-upload" /><Block className="skeleton-field skeleton-field-large" /></>}
      <Block className="skeleton-field skeleton-button" />
    </section>
    <section className={`skeleton-panel skeleton-list-panel ${categories ? "skeleton-category-list" : "skeleton-service-list"}`}>
      <div className="skeleton-list-heading"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-field skeleton-search" /></div>
      {Array.from({ length: rows }, (_, i) => <div className="skeleton-admin-item" key={i}>
        {!categories && <Block className="skeleton-admin-thumb" />}
        <div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" /></div>
        <Block className="skeleton-status" /><Block className="skeleton-action" />
      </div>)}
    </section>
  </div>;
}

function AuthCard({ variant }: { variant: "login" | "register" | "forgot-password" | "reset-password" | "verify-email" }) {
  const fields = variant === "register" ? 4 : variant === "login" ? 2 : variant === "reset-password" ? 2 : 1;
  return <main className={`page-skeleton auth-skeleton auth-skeleton-${variant}`} aria-busy="true" aria-label="Cargando contenido">
    {variant === "register" && <section className="register-skeleton-intro"><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-title" /><Block className="skeleton-line skeleton-line-long" /><Block className="skeleton-line skeleton-line-medium" /></section>}
    {variant === "verify-email" && <section className="verify-skeleton-intro"><Block className="skeleton-avatar skeleton-avatar-large" /><Block className="skeleton-line skeleton-line-title" /><Block className="skeleton-line skeleton-line-medium" /></section>}
    <section className="skeleton-panel auth-skeleton-card">
      <Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-title" />
      {variant !== "forgot-password" && variant !== "verify-email" && <Block className="skeleton-line skeleton-line-long" />}
      {variant === "verify-email" ? <div className="skeleton-otp-inputs">{Array.from({ length: 8 }, (_, i) => <Block className="skeleton-otp-digit" key={i} />)}</div> : Array.from({ length: fields }, (_, i) => <Block className="skeleton-field" key={i} />)}
      {variant === "login" && <Block className="skeleton-line skeleton-line-short" />}
      {variant === "register" && <Block className="skeleton-terms" />}
      <Block className="skeleton-field skeleton-button" />
      {variant === "login" && <><Block className="skeleton-auth-divider" /><Block className="skeleton-field" /><Block className="skeleton-field" /></>}
      <Block className="skeleton-line skeleton-line-medium" />
    </section>
  </main>;
}

export function SiteHeaderLoadingSkeleton() {
  return <header className="site-header site-header-loading" aria-hidden="true"><div className="club-container site-header-inner"><div className="skeleton-header-brand"><Block className="skeleton-header-logo" /><Block className="skeleton-line skeleton-line-medium" /></div><div className="skeleton-header-nav"><Block /><Block /><Block /></div><Block className="skeleton-header-account" /></div></header>;
}

export function PageLoadingSkeleton({ variant }: { variant: LoadingVariant }) {
  if (variant === "admin-services" || variant === "admin-categories") return <AdminTop><AdminCatalogSkeleton categories={variant === "admin-categories"} /></AdminTop>;

  if (variant === "admin-metrics") return <AdminTop><div className="skeleton-metric-grid">{Array.from({ length: 7 }, (_, i) => <section className="skeleton-panel skeleton-metric" key={i}><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></section>)}</div><div className="skeleton-chart-grid">{Array.from({ length: 4 }, (_, i) => <section className="skeleton-panel skeleton-chart" key={i}><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-chart-visual" /></section>)}</div><section className="skeleton-panel skeleton-table"><Block className="skeleton-line skeleton-line-medium" />{Array.from({ length: 5 }, (_, i) => <div className="skeleton-table-row" key={i}>{Array.from({ length: 5 }, (_, j) => <Block className="skeleton-line" key={j} />)}</div>)}</section></AdminTop>;

  if (variant === "admin-employees") return <AdminTop><div className="skeleton-admin-grid"><section className="skeleton-panel skeleton-form-panel skeleton-employee-form"><Block className="skeleton-line skeleton-line-medium" />{Array.from({ length: 4 }, (_, i) => <Block className="skeleton-field" key={i} />)}<Block className="skeleton-field skeleton-button" /></section><section className="skeleton-panel skeleton-list-panel"><div className="skeleton-list-heading"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></div>{Array.from({ length: 5 }, (_, i) => <div className="skeleton-employee-row" key={i}><Block className="skeleton-avatar" /><div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></div><Block className="skeleton-field skeleton-assignment" /><Block className="skeleton-action" /></div>)}</section></div></AdminTop>;

  if (variant === "admin-schedules") return <AdminTop><div className="skeleton-schedule-layout"><section className="skeleton-panel skeleton-schedule-list"><div className="skeleton-list-heading"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></div>{Array.from({ length: 7 }, (_, i) => <div className="skeleton-schedule-row" key={i}><div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></div><Block className="skeleton-line skeleton-line-medium" /></div>)}</section><section className="skeleton-panel skeleton-closure-form"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" />{Array.from({ length: 5 }, (_, i) => <Block className="skeleton-field" key={i} />)}<Block className="skeleton-field skeleton-button" /></section></div><section className="skeleton-panel skeleton-lower-panel"><Block className="skeleton-line skeleton-line-medium" />{Array.from({ length: 3 }, (_, i) => <div className="skeleton-list-row" key={i}><Block className="skeleton-line skeleton-line-long" /><Block className="skeleton-action" /></div>)}</section></AdminTop>;

  if (variant === "profile") return <Shell><Heading /><div className="skeleton-profile-grid"><section className="skeleton-panel"><div className="skeleton-profile-person"><Block className="skeleton-avatar skeleton-avatar-large" /><div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></div></div>{Array.from({ length: 6 }, (_, i) => <div className="skeleton-list-row" key={i}><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-medium" /></div>)}<Block className="skeleton-field skeleton-button" /></section><section className="skeleton-panel skeleton-password-panel"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" />{Array.from({ length: 3 }, (_, i) => <Block className="skeleton-field" key={i} />)}<Block className="skeleton-field skeleton-button" /></section></div></Shell>;

  if (variant === "reservations") return <Shell><Heading /><div className="skeleton-reservation-toolbar"><Block className="skeleton-field" /><Block className="skeleton-field skeleton-button" /></div><section className="skeleton-panel skeleton-reservations">{Array.from({ length: 5 }, (_, i) => <div className="skeleton-reservation-row" key={i}><Block className="skeleton-date-block" /><div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" /><Block className="skeleton-line skeleton-line-short" /></div><Block className="skeleton-status" /><Block className="skeleton-action" /></div>)}</section></Shell>;

  if (variant === "checkout") return <Shell className="skeleton-checkout"><Block className="skeleton-line skeleton-line-short" /><Heading /><section className="skeleton-panel"><div className="skeleton-checkout-brand"><Block className="skeleton-avatar" /><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-status" /></div><div className="skeleton-checkout-details">{Array.from({ length: 6 }, (_, i) => <div key={i}><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-medium" /></div>)}</div><div className="skeleton-checkout-total"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-medium" /></div><Block className="skeleton-field skeleton-button" /><div className="skeleton-ticket-grid">{Array.from({ length: 2 }, (_, i) => <Block className="skeleton-ticket" key={i} />)}</div></section></Shell>;

  if (variant === "scanner" || variant === "employee") return <Shell className="skeleton-scanner"><Heading /><section className="skeleton-panel"><div className="skeleton-scanner-head"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-status" /></div><Block className="skeleton-scanner-view" /><Block className="skeleton-line skeleton-line-long" /><div className="skeleton-scanner-controls"><Block className="skeleton-field" /><Block className="skeleton-field skeleton-button" /></div></section></Shell>;

  if (variant === "employee-home") return <Shell className="skeleton-employee-home"><Heading /><div className="skeleton-employee-summary"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-short" /></div><div className="skeleton-metric-grid">{Array.from({ length: 4 }, (_, i) => <section className="skeleton-panel skeleton-metric" key={i}><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-title" /></section>)}</div><section className="skeleton-panel skeleton-lower-panel"><div className="skeleton-list-heading"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-action" /></div>{Array.from({ length: 5 }, (_, i) => <div className="skeleton-activity-row" key={i}><Block className="skeleton-avatar" /><div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" /></div></div>)}</section></Shell>;

  if (variant === "login" || variant === "register" || variant === "forgot-password" || variant === "verify-email" || variant === "reset-password") return <AuthCard variant={variant} />;
  if (variant === "auth") return <AuthCard variant="login" />;
  if (variant === "account") return <PageLoadingSkeleton variant="profile" />;

  if (variant === "detail") return <Shell><div className="skeleton-detail-back"><Block className="skeleton-line skeleton-line-short" /><Block className="skeleton-line skeleton-line-medium" /></div><div className="skeleton-detail-grid"><section className="skeleton-panel"><Block className="skeleton-detail-image" /><Block className="skeleton-line skeleton-line-title" /><Block className="skeleton-line skeleton-line-long" /><Block className="skeleton-line skeleton-line-medium" /><div className="skeleton-fact-chips">{Array.from({ length: 3 }, (_, i) => <Block className="skeleton-chip" key={i} />)}</div></section><section className="skeleton-panel skeleton-booking-panel"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-field" /><Block className="skeleton-line skeleton-line-short" /><div className="skeleton-slot-grid">{Array.from({ length: 6 }, (_, i) => <Block className="skeleton-slot" key={i} />)}</div>{Array.from({ length: 3 }, (_, i) => <Block className="skeleton-field" key={i} />)}<Block className="skeleton-field skeleton-button" /></section></div></Shell>;

  if (variant === "home") return <main className="page-skeleton" aria-busy="true" aria-label="Cargando contenido"><section className="skeleton-hero"><div className="club-container skeleton-hero-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-title" /><Block className="skeleton-line skeleton-line-title skeleton-line-short" /><Block className="skeleton-line skeleton-line-long" /><Block className="skeleton-field skeleton-button" /></div></section><section className="club-container skeleton-home-content"><div className="skeleton-home-stats">{Array.from({ length: 3 }, (_, i) => <Block className="skeleton-stat" key={i} />)}</div><Heading /><Cards count={4} /><div className="skeleton-flow-strip">{Array.from({ length: 3 }, (_, i) => <Block className="skeleton-stat" key={i} />)}</div></section></main>;

  return <Shell className="skeleton-catalog"><Heading /><section className="skeleton-catalog-section">{Array.from({ length: 3 }, (_, i) => <div className="skeleton-catalog-group" key={i}><div className="skeleton-catalog-heading"><div><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" /></div><Block className="skeleton-line skeleton-line-short" /></div><Cards count={3} /></div>)}</section><div className="skeleton-policy"><Block className="skeleton-avatar" /><div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-medium" /><Block className="skeleton-line skeleton-line-long" /></div></div></Shell>;
}
