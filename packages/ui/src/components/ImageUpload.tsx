import React, { useRef, useState, useCallback, useEffect } from "react";

export interface ImageUploadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  maxSizeKB?: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxSizeKB = 500,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

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
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setError(null);
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--spectrum-gray-900)",
  };

  const previewContainerStyle: React.CSSProperties = {
    position: "relative",
  };

  const previewWrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: 128,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "var(--spectrum-gray-100)",
    border: "1px solid var(--spectrum-gray-300)",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    opacity: isHovered ? 1 : 0,
    transition: "opacity 0.15s ease",
    borderRadius: 8,
  };

  const overlayButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };

  const dropzoneStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    borderRadius: 8,
    border: "2px dashed",
    cursor: "pointer",
    transition: "all 0.15s ease",
    borderColor: isDragging ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-400)",
    backgroundColor: isDragging ? "rgba(var(--spectrum-blue-900-rgb, 20, 115, 230), 0.1)" : "transparent",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--spectrum-negative-visual-color, #d31510)",
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>Image</label>

      {value ? (
        // Image preview
        <div
          style={previewContainerStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={previewWrapperStyle}>
            <img
              src={value}
              alt="Item preview"
              style={imageStyle}
            />
          </div>
          <div style={overlayStyle}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                ...overlayButtonStyle,
                backgroundColor: "var(--spectrum-gray-100)",
                color: "var(--spectrum-gray-900)",
              }}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                ...overlayButtonStyle,
                backgroundColor: "var(--spectrum-negative-visual-color, #d31510)",
                color: "white",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        // Upload area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          style={dropzoneStyle}
        >
          <svg
            style={{ width: 32, height: 32, color: "var(--spectrum-gray-600)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>
              Drop image here, click to browse, or paste
            </p>
            <p style={{ fontSize: 12, color: "var(--spectrum-gray-600)", marginTop: 4 }}>
              Max {maxSizeKB}KB • PNG, JPG, GIF, WebP
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {error && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
