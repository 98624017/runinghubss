import { AcrylicCard } from '../../components/AcrylicCard';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import type { SiteConfig } from '../../types';

type CustomerBriefSectionProps = {
  site: SiteConfig;
};

export function CustomerBriefSection({ site }: CustomerBriefSectionProps) {
  return (
    <section className="page-section">
      <div className="page-section-header">
        <p className="hero-kicker">Customer Brief</p>
        <h2>{site.customerSummaryTitle}</h2>
        <p className="lead-text">{site.customerSummaryText}</p>
      </div>

      <div className="dashboard-app-grid">
        <AcrylicCard eyebrow="Audience" title={site.targetAudienceTitle} className="dashboard-app-card">
          <ul className="meta-list">
            {site.targetAudience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AcrylicCard>

        <AcrylicCard
          eyebrow="Highlights"
          title={site.solutionHighlightsTitle}
          className="dashboard-app-card"
        >
          <div className="form-stack">
            {site.solutionHighlights.map((item) => (
              <div key={`${item.title}-${item.tag ?? 'plain'}`} className="form-stack">
                <div className="button-row">
                  <strong>{item.title}</strong>
                  {item.tag ? <span className="glass-chip">{item.tag}</span> : null}
                </div>
                <p className="muted-text">{item.description}</p>
              </div>
            ))}
          </div>
        </AcrylicCard>

        <AcrylicCard eyebrow="Workflow" title={site.workflowTitle} className="dashboard-app-card">
          <ol className="console-ordered-list">
            {site.workflowSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </AcrylicCard>

        <AcrylicCard
          eyebrow="Reference"
          title={site.referenceGalleryTitle}
          className="dashboard-app-card"
        >
          <div className="dashboard-reference-grid">
            {site.referenceGallery.map((item) => (
              <article key={`${item.title}-${item.imageUrl}`} className="reference-card">
                <div className="reference-card-media">
                  <ImageWithFallback src={item.imageUrl} alt={item.title} />
                </div>
                <div className="form-stack">
                  <div className="button-row">
                    <strong>{item.title}</strong>
                    {item.badge ? <span className="glass-chip">{item.badge}</span> : null}
                  </div>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </AcrylicCard>
      </div>
    </section>
  );
}
