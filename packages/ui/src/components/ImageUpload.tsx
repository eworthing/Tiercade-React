import React, { useState, useCallback, useEffect } from "react";
import {
  Button,
  ButtonGroup,
  Content,
  DropZone,
  FileTrigger,
  Heading,
  IllustratedMessage,
  InlineAlert,
  Image,
  Text,
} from "@react-spectrum/s2";
import DropToUpload from "@react-spectrum/s2/illustrations/linear/DropToUpload";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

export interface ImageUploadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  maxSizeKB?: number;
  className?: string;
}

const previewFrame = style({
  width: "full",
  height: 128,
  borderRadius: "lg",
  overflow: "hidden",
  backgroundColor: "gray-100",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "gray-300",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxSizeKB = 500,
}) => {
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeKB * 1024;

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Validate size
      if (file.size > maxSizeBytes) {
        setError(`Image must be under ${maxSizeKB}KB`);
        return;
      }

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
      };
      reader.onerror = () => {
        setError("Failed to read image");
      };
      reader.readAsDataURL(file);
    },
    [maxSizeBytes, maxSizeKB, onChange]
  );

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile]);

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text>Image</Text>

      {value ? (
        <>
          <div className={previewFrame}>
            <Image src={value} alt="Item preview" />
          </div>
          <ButtonGroup>
            <FileTrigger
              acceptedFileTypes={["image/*"]}
              onSelect={(files) => {
                const file = files?.[0];
                if (file) processFile(file);
              }}
            >
              <Button variant="secondary">Replace</Button>
            </FileTrigger>
            <Button variant="negative" onPress={handleRemove}>
              Remove
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <DropZone
          aria-label="Upload image"
          onDrop={async (e) => {
            const files = await Promise.all(
              e.items
                .filter((item) => item.kind === "file")
                .map((item) => item.getFile())
            );
            const file = files[0];
            if (file) processFile(file);
          }}
        >
          <IllustratedMessage>
            <DropToUpload />
            <Heading>Drop image here</Heading>
            <Content>
              <Text>{`Max ${maxSizeKB}KB • PNG, JPG, GIF, WebP • Paste supported`}</Text>
            </Content>
            <FileTrigger
              acceptedFileTypes={["image/*"]}
              onSelect={(files) => {
                const file = files?.[0];
                if (file) processFile(file);
              }}
            >
              <Button variant="secondary">Browse…</Button>
            </FileTrigger>
          </IllustratedMessage>
        </DropZone>
      )}

      {error && (
        <InlineAlert variant="negative">{error}</InlineAlert>
      )}
    </div>
  );
};
