import React, { useMemo, useState } from "react";
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
  Badge,
  Button,
  Card,
  CardView,
  SearchField,
  Picker,
  PickerItem,
  Dialog,
  DialogTrigger,
  Heading,
  Content,
  ButtonGroup,
  Text,
} from "@react-spectrum/s2";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { loadProject, captureSnapshot } from "@tiercade/state";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

const page = style({
  display: "flex",
  flexDirection: "column",
  gap: 24,
});

const header = style({
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

const filters = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "end",
});

const section = style({
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

const cardHeaderRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
});

const cardMetaRow = style({
  display: "flex",
  gap: 12,
  color: "gray-600",
  font: { size: "ui-sm" },
});

const cardViewTall = style({ height: 560 });
const cardViewShort = style({ height: 320 });

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
    <div className={page}>
      <div className={header}>
        <Heading level={1} UNSAFE_style={{ fontFamily: "var(--font-display)" }}>Template Library</Heading>
        <Text>Get started quickly with pre-made templates or create your own.</Text>
      </div>

      <div className={filters}>
        <SearchField
          aria-label="Search templates"
          placeholder="Search templates…"
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            if (value) setSelectedCategory("all");
          }}
        />

        <Picker
          label="Category"
          selectedKey={selectedCategory}
          onSelectionChange={(key) => {
            setSelectedCategory(key as TemplateCategory | "all");
            setSearchQuery("");
          }}
        >
          <PickerItem id="all">All templates</PickerItem>
          {categories.map(([key, { label }]) => (
            <PickerItem key={key} id={key}>
              {label}
            </PickerItem>
          ))}
        </Picker>
      </div>

      {/* Featured Section (only when no search/filter) */}
      {!searchQuery && selectedCategory === "all" && (
        <section className={section}>
          <Heading level={2}>Featured templates</Heading>
          <CardView
            aria-label="Featured templates"
            items={featuredTemplates.slice(0, 6)}
            styles={cardViewShort}
          >
            {(template) => (
              <TemplateCard
                template={template}
                onPreview={() => setPreviewTemplate(template)}
                onUse={() => handleUseTemplate(template)}
              />
            )}
          </CardView>
        </section>
      )}

      {/* All Templates Grid */}
      <section className={section}>
        <Heading level={2}>
          {searchQuery
            ? `Search Results (${filteredTemplates.length})`
            : selectedCategory === "all"
            ? "All Templates"
            : TEMPLATE_CATEGORIES[selectedCategory].label}
        </Heading>

        <CardView
          aria-label="Templates"
          items={filteredTemplates}
          styles={cardViewTall}
          renderEmptyState={() => (
            <div>
              <Text>No templates found.</Text>
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
          )}
        >
          {(template) => (
            <TemplateCard
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onUse={() => handleUseTemplate(template)}
            />
          )}
        </CardView>
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
    <Card id={template.id} data-testid={`template-card-${template.id}`}>
      <div className={cardHeaderRow}>
        <Heading level={3}>{template.name}</Heading>
        {template.featured && (
          <Badge variant="notice" fillStyle="subtle">
            Featured
          </Badge>
        )}
      </div>
      <Text>{categoryInfo.label}</Text>
      <Text>{template.description}</Text>
      <div className={cardMetaRow}>
        <span>{template.tierOrder.length} tiers</span>
        <span>{template.items.length} items</span>
      </div>
      <ButtonGroup>
        <Button variant="secondary" size="S" onPress={onPreview}>
          Preview
        </Button>
        <Button variant="accent" size="S" onPress={onUse}>
          Use
        </Button>
      </ButtonGroup>
    </Card>
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
      <Dialog size="L" data-testid="template-preview-dialog">
        <Heading>{template.name}</Heading>
        <Content>
          <div style={{ height: 16, display: "flex", marginBottom: 16, borderRadius: 4, overflow: "hidden" }}>
            {template.tierOrder.map((tier) => (
              <div
                key={tier}
                style={{ flex: 1, backgroundColor: template.tierColors[tier] }}
              />
            ))}
          </div>

          <Text>{template.description}</Text>

          <div style={{ marginTop: 16 }}>
            <Heading level={3}>Tier structure</Heading>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {template.tierOrder.map((tier) => (
                <div
                  key={tier}
                  data-testid="template-preview-tier"
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
            <div style={{ marginTop: 16 }}>
              <Heading level={3}>{`Included items (${template.items.length})`}</Heading>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
                {template.items.map((item) => (
                  <span
                    key={item.id}
                    data-testid="template-preview-item"
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
