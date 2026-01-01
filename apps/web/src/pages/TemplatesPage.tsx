import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  getFeaturedTemplates,
  searchTemplates,
  getTemplatesByCategory,
  type TierTemplate,
  type TemplateCategory,
} from "@tiercade/core";
import { Button, Input } from "@tiercade/ui";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { loadProject, captureSnapshot } from "@tiercade/state";

// Category icons as SVG components
const CategoryIcon: React.FC<{ icon: string; className?: string }> = ({
  icon,
  className = "w-5 h-5",
}) => {
  const icons: Record<string, React.ReactNode> = {
    film: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    gamepad: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    trophy: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    utensils: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    music: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    laptop: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    heart: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    book: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    sparkles: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  };

  return <>{icons[icon] || icons.sparkles}</>;
};

export const TemplatesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [previewTemplate, setPreviewTemplate] = useState<TierTemplate | null>(null);

  const featuredTemplates = useMemo(() => getFeaturedTemplates(), []);

  const filteredTemplates = useMemo(() => {
    let templates = TEMPLATES;

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    } else if (selectedCategory !== "all") {
      templates = getTemplatesByCategory(selectedCategory);
    }

    return templates;
  }, [searchQuery, selectedCategory]);

  const handleUseTemplate = (template: TierTemplate) => {
    // Build tiers object with items in unranked
    const tiers: Record<string, typeof template.items> = {};
    for (const tier of [...template.tierOrder, "unranked"]) {
      tiers[tier] = [];
    }
    // Put all template items in unranked
    tiers["unranked"] = template.items.map((item) => ({
      ...item,
      id: `${item.id}-${Date.now()}`, // Generate new unique IDs
    }));

    dispatch(captureSnapshot("Load Template"));
    dispatch(
      loadProject({
        tiers,
        tierOrder: template.tierOrder,
        tierLabels: template.tierLabels,
        tierColors: template.tierColors,
        projectName: template.name,
      })
    );

    navigate("/");
  };

  const categories = Object.entries(TEMPLATE_CATEGORIES) as [
    TemplateCategory,
    { label: string; icon: string }
  ][];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text">Template Library</h1>
        <p className="text-text-muted">
          Get started quickly with pre-made templates or create your own
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSelectedCategory("all");
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setSelectedCategory("all");
            setSearchQuery("");
          }}
          className={`
            px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200 ease-spring
            ${
              selectedCategory === "all"
                ? "bg-accent text-white shadow-glow-accent"
                : "bg-surface-raised text-text-muted hover:text-text hover:bg-surface-soft"
            }
          `}
        >
          All Templates
        </button>
        {categories.map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedCategory(key);
              setSearchQuery("");
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              flex items-center gap-2
              transition-all duration-200 ease-spring
              ${
                selectedCategory === key
                  ? "bg-accent text-white shadow-glow-accent"
                  : "bg-surface-raised text-text-muted hover:text-text hover:bg-surface-soft"
              }
            `}
          >
            <CategoryIcon icon={icon} className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Featured Section (only when no search/filter) */}
      {!searchQuery && selectedCategory === "all" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <svg
              className="w-5 h-5 text-warning"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.slice(0, 6).map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onPreview={() => setPreviewTemplate(template)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Templates Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">
          {searchQuery
            ? `Search Results (${filteredTemplates.length})`
            : selectedCategory === "all"
            ? "All Templates"
            : TEMPLATE_CATEGORIES[selectedCategory].label}
        </h2>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-text-subtle"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>No templates found</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onPreview={() => setPreviewTemplate(template)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            handleUseTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: TierTemplate;
  index: number;
  onPreview: () => void;
  onUse: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  index,
  onPreview,
  onUse,
}) => {
  const categoryInfo = TEMPLATE_CATEGORIES[template.category];

  return (
    <article
      className="group relative bg-surface-raised border border-border rounded-xl overflow-hidden
        hover:border-accent hover:shadow-glow-accent transition-all duration-300 ease-spring
        opacity-0 animate-stagger-fade"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Color Preview */}
      <div className="h-3 flex">
        {template.tierOrder.slice(0, 6).map((tier) => (
          <div
            key={tier}
            className="flex-1"
            style={{ backgroundColor: template.tierColors[tier] }}
          />
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-soft flex items-center justify-center shrink-0">
            <CategoryIcon icon={categoryInfo.icon} className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate">{template.name}</h3>
            <p className="text-xs text-text-subtle">{categoryInfo.label}</p>
          </div>
          {template.featured && (
            <svg
              className="w-4 h-4 text-warning shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-muted line-clamp-2">{template.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-text-subtle">
          <span>{template.tierOrder.length} tiers</span>
          <span>{template.items.length} items</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onPreview} className="flex-1">
            Preview
          </Button>
          <Button variant="primary" size="sm" onClick={onUse} className="flex-1">
            Use Template
          </Button>
        </div>
      </div>
    </article>
  );
};

interface TemplatePreviewModalProps {
  template: TierTemplate;
  onClose: () => void;
  onUse: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose,
  onUse,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-border rounded-xl shadow-modal max-w-2xl w-full max-h-[80vh] overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tier colors */}
        <div className="h-4 flex">
          {template.tierOrder.map((tier) => (
            <div
              key={tier}
              className="flex-1"
              style={{ backgroundColor: template.tierColors[tier] }}
            />
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">{template.name}</h2>
              <p className="text-text-muted mt-1">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-text-subtle hover:text-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tier Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-muted">Tier Structure</h3>
            <div className="flex flex-wrap gap-2">
              {template.tierOrder.map((tier) => (
                <div
                  key={tier}
                  className="px-3 py-1.5 rounded-md text-sm font-semibold text-white"
                  style={{ backgroundColor: template.tierColors[tier] }}
                >
                  {template.tierLabels[tier]}
                </div>
              ))}
            </div>
          </div>

          {/* Items Preview */}
          {template.items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-muted">
                Included Items ({template.items.length})
              </h3>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {template.items.map((item) => (
                  <span
                    key={item.id}
                    className="px-2 py-1 bg-surface-soft rounded text-xs text-text-muted"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={onUse} className="flex-1">
              Use This Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
