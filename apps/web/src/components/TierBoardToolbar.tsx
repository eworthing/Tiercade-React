import React from "react";
import {
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  MenuTrigger,
  Badge,
} from "@react-spectrum/s2";
import Add from "@react-spectrum/s2/icons/Add";
import Settings from "@react-spectrum/s2/icons/Settings";
import Share from "@react-spectrum/s2/icons/Share";
import Download from "@react-spectrum/s2/icons/Download";
import Copy from "@react-spectrum/s2/icons/Copy";
import LinkIcon from "@react-spectrum/s2/icons/Link";
import MovieCamera from "@react-spectrum/s2/icons/MovieCamera";

export interface TierBoardToolbarProps {
  totalItems: number;
  isExporting: boolean;
  isPresenting: boolean;
  onAddItem: () => void;
  onTierSettings: () => void;
  onExportPNG: () => void;
  onCopyImage: () => void;
  onCopyLink: () => void;
  onStreamMode: () => void;
}

/**
 * Top-level action toolbar for the tier board.
 * Pure props component: no state, no Redux, no effects.
 * Owns: Add item, Tier settings, Share menu (PNG/image/link), Stream mode button.
 */
export const TierBoardToolbar: React.FC<TierBoardToolbarProps> = ({
  totalItems,
  isExporting,
  isPresenting,
  onAddItem,
  onTierSettings,
  onExportPNG,
  onCopyImage,
  onCopyLink,
  onStreamMode,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <ButtonGroup>
        <Button variant="accent" size="S" onPress={onAddItem}>
          <Add /> Add item
        </Button>
        <Button variant="secondary" size="S" onPress={onTierSettings}>
          <Settings /> Tiers
        </Button>

        {totalItems > 0 && (
          <MenuTrigger>
            <Button variant="secondary" size="S" isDisabled={isExporting}>
              <Share /> Share
            </Button>
            <Menu
              aria-label="Share"
              onAction={(key) => {
                const action = String(key);
                if (action === "download") onExportPNG();
                if (action === "copy-image") onCopyImage();
                if (action === "copy-link") onCopyLink();
              }}
            >
              <MenuItem id="download">
                <Download /> Download PNG
              </MenuItem>
              <MenuItem id="copy-image">
                <Copy /> Copy image
              </MenuItem>
              <MenuItem id="copy-link">
                <LinkIcon /> Copy link
              </MenuItem>
            </Menu>
          </MenuTrigger>
        )}

        <Button
          variant={isPresenting ? "accent" : "secondary"}
          size="S"
          onPress={onStreamMode}
        >
          <MovieCamera /> {isPresenting ? "Live" : "Stream"}
        </Button>
      </ButtonGroup>

      <Badge variant="neutral" fillStyle="subtle">
        {totalItems} items
      </Badge>
    </div>
  );
};

TierBoardToolbar.displayName = "TierBoardToolbar";
