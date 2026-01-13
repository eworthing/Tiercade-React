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
import {
  Button,
  TextField,
  Dialog,
  DialogTrigger,
  Heading,
  Content,
  ButtonGroup,
} from "@react-spectrum/s2";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { loadProject, captureSnapshot } from "@tiercade/state";

// Category icons as SVG components
const CategoryIcon: React.FC<{ icon: string; style?: React.CSSProperties }> = ({
  icon,
  style = { width: 20, height: 20 },
}) => {
  const icons: Record<string, React.ReactNode> = {
    film: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    gamepad: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    trophy: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    utensils: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    music: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    laptop: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    heart: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    book: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    sparkles: (
      <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--spectrum-gray-900)" }}>Template Library</h1>
        <p style={{ color: "var(--spectrum-gray-700)" }}>
          Get started quickly with pre-made templates or create your own
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <TextField
            aria-label="Search templates"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              if (value) setSelectedCategory("all");
            }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          onClick={() => {
            setSelectedCategory("all");
            setSearchQuery("");
          }}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "all 200ms",
            backgroundColor: selectedCategory === "all" ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-200)",
            color: selectedCategory === "all" ? "white" : "var(--spectrum-gray-700)"
          }}
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
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 200ms",
              backgroundColor: selectedCategory === key ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-200)",
              color: selectedCategory === key ? "white" : "var(--spectrum-gray-700)"
            }}
          >
            <CategoryIcon icon={icon} style={{ width: 16, height: 16 }} />
            {label}
          </button>
        ))}
      </div>

      {/* Featured Section (only when no search/filter) */}
      {!searchQuery && selectedCategory === "all" && (
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--spectrum-gray-900)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg
              style={{ width: 20, height: 20, color: "var(--spectrum-orange-700)" }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Templates
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16
          }}>
            {featuredTemplates.slice(0, 6).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setPreviewTemplate(template)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Templates Grid */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--spectrum-gray-900)" }}>
          {searchQuery
            ? `Search Results (${filteredTemplates.length})`
            : selectedCategory === "all"
            ? "All Templates"
            : TEMPLATE_CATEGORIES[selectedCategory].label}
        </h2>

        {filteredTemplates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--spectrum-gray-700)" }}>
            <svg
              style={{ width: 48, height: 48, margin: "0 auto 16px", color: "var(--spectrum-gray-500)" }}
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
            <div style={{ marginTop: 16 }}>
              <Button
                variant="secondary"
                size="S"
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16
          }}>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
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
  onPreview: () => void;
  onUse: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onUse,
}) => {
  const categoryInfo = TEMPLATE_CATEGORIES[template.category];

  return (
    <article
      style={{
        position: "relative",
        backgroundColor: "var(--spectrum-gray-100)",
        border: "1px solid var(--spectrum-gray-300)",
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 300ms, box-shadow 300ms"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--spectrum-blue-600)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--spectrum-gray-300)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Color Preview */}
      <div style={{ height: 12, display: "flex" }}>
        {template.tierOrder.slice(0, 6).map((tier) => (
          <div
            key={tier}
            style={{ flex: 1, backgroundColor: template.tierColors[tier] }}
          />
        ))}
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: "var(--spectrum-gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <CategoryIcon icon={categoryInfo.icon} style={{ width: 20, height: 20, color: "var(--spectrum-blue-800)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 600, color: "var(--spectrum-gray-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</h3>
            <p style={{ fontSize: 12, color: "var(--spectrum-gray-600)" }}>{categoryInfo.label}</p>
          </div>
          {template.featured && (
            <svg
              style={{ width: 16, height: 16, color: "var(--spectrum-orange-700)", flexShrink: 0 }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: "var(--spectrum-gray-700)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{template.description}</p>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--spectrum-gray-600)" }}>
          <span>{template.tierOrder.length} tiers</span>
          <span>{template.items.length} items</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <div style={{ flex: 1 }}>
            <Button variant="secondary" size="S" onPress={onPreview}>
              Preview
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="accent" size="S" onPress={onUse}>
              Use Template
            </Button>
          </div>
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
    <DialogTrigger isOpen={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
      <Dialog size="L">
        <Heading>{template.name}</Heading>
        <Content>
          {/* Header with tier colors */}
          <div style={{ height: 16, display: "flex", marginBottom: 16, borderRadius: 4, overflow: "hidden" }}>
            {template.tierOrder.map((tier) => (
              <div
                key={tier}
                style={{ flex: 1, backgroundColor: template.tierColors[tier] }}
              />
            ))}
          </div>

          <p style={{ color: "var(--spectrum-gray-700)", marginBottom: 16 }}>
            {template.description}
          </p>

          {/* Tier Preview */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--spectrum-gray-600)", marginBottom: 8 }}>
              Tier Structure
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {template.tierOrder.map((tier) => (
                <div
                  key={tier}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: template.tierColors[tier],
                  }}
                >
                  {template.tierLabels[tier]}
                </div>
              ))}
            </div>
          </div>

          {/* Items Preview */}
          {template.items.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--spectrum-gray-600)", marginBottom: 8 }}>
                Included Items ({template.items.length})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                {template.items.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "var(--spectrum-gray-200)",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "var(--spectrum-gray-700)",
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Content>
        <ButtonGroup>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onPress={onUse}>
            Use This Template
          </Button>
        </ButtonGroup>
      </Dialog>
    </DialogTrigger>
  );
};
