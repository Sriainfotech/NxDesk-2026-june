import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const compressImage = async (file, maxSize = 1024 * 1024, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.onload = () => {
      try {
        // Calculate optimal dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;

        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        // Progressive compression
        const compress = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Compression failed"));
                return;
              }
              if (blob.size <= maxSize || currentQuality <= 0.1) {
                const reader = new FileReader();
                reader.onload = () =>
                  resolve({
                    dataUrl: reader.result,
                    width,
                    height,
                    originalSize: file.size,
                    compressedSize: blob.size,
                  });
                reader.onerror = () =>
                  reject(new Error("Failed to read compressed image"));
                reader.readAsDataURL(blob);
              } else {
                compress(Math.max(0.1, currentQuality - 0.1));
              }
            },
            "image/jpeg",
            currentQuality
          );
        };
        compress(quality);
      } catch (error) {
        reject(error);
      }
    };
    img.src = URL.createObjectURL(file);
  });
};

const QuillTextEditor = ({
  label,
  id,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  required = false,
  requiredFields = [],
  className = "",
  allowPdf = true,
}) => {
  const [editorContent, setEditorContent] = useState(value || "");
  const [pdfFile, setPdfFile] = useState(null);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const isRequired = required || requiredFields.includes(name);

  // Fix the isEmpty check - use useMemo and a safer regex
  const isEmpty = useMemo(() => {
    if (!editorContent) return true;

    // Use a safer regex pattern that won't cause infinite recursion
    const textContent = editorContent
      .replace(/<br\s*\/?>/gi, "") // Remove br tags
      .replace(/<p[^>]*><\/p>/gi, "") // Remove empty p tags
      .replace(/<div[^>]*><\/div>/gi, "") // Remove empty div tags
      .replace(/<[^>]+>/g, "") // Remove all HTML tags (safer pattern)
      .replace(/&nbsp;/g, "") // Remove non-breaking spaces
      .trim();

    return textContent === "";
  }, [editorContent]);

  const showError = touched && isRequired && isEmpty;

  const handleChange = useCallback(
    (content, delta, source, editor) => {
      // Prevent infinite loops during programmatic updates
      if (source === "api") return;

      setEditorContent(content);
      const syntheticEvent = {
        target: {
          name: name,
          value: content,
        },
      };
      onChange(syntheticEvent);
      if (!touched) setTouched(true);
    },
    [name, onChange, touched]
  );

  const handlePdfChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file && file.type === "application/pdf") {
        setPdfFile(file);

        const syntheticEvent = {
          target: {
            name: `${name}_pdf`,
            value: file,
          },
        };
        onChange(syntheticEvent);
      }
    },
    [name, onChange]
  );

  // Image preview handlers
  const handleImagePreview = useCallback((imageSrc) => {
    setPreviewImage(imageSrc);
    setShowPreview(true);
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImage(null);
  }, []);

  // Process and insert image with compression
  const processAndInsertImage = useCallback(
    async (file, range) => {
      try {
        // Compress the image first
        const compressedResult = await compressImage(file);

        const img = new Image();
        img.onload = () => {
          // Use compressed dimensions or resize if needed (max 800x600)
          let width = compressedResult.width;
          let height = compressedResult.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }

          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }

          const editor = quillRef.current.getEditor();

          // Insert compressed image
          editor.insertEmbed(
            range.index,
            "image",
            compressedResult.dataUrl,
            "user"
          );

          // Apply styles immediately after insertion
          requestAnimationFrame(() => {
            const imgElements = editor.root.querySelectorAll("img");
            const lastImg = imgElements[imgElements.length - 1];

            if (lastImg && lastImg.src === compressedResult.dataUrl) {
              lastImg.style.maxWidth = "100%";
              lastImg.style.height = "auto";
              lastImg.style.display = "block";
              lastImg.style.margin = "10px 0";
              lastImg.style.cursor = "pointer";

              // Add click handler for preview
              lastImg.onclick = () =>
                handleImagePreview(compressedResult.dataUrl);

              // Add data attributes for original dimensions
              lastImg.setAttribute(
                "data-original-width",
                compressedResult.width
              );
              lastImg.setAttribute(
                "data-original-height",
                compressedResult.height
              );

              // Set dimensions
              if (width > 0 && height > 0) {
                lastImg.style.width = `${width}px`;
                lastImg.style.maxWidth = "100%";
              }
            }

            // Move cursor after the image
            editor.setSelection(range.index + 1);
          });
        };
        img.src = compressedResult.dataUrl;
      } catch (error) {
        console.error("Image compression failed:", error);
        // Fallback to original method if compression fails
        const reader = new FileReader();

        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            // Resize image if needed (max 800x600)
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 600;

            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }

            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }

            const editor = quillRef.current.getEditor();

            // Insert image
            editor.insertEmbed(range.index, "image", reader.result, "user");

            // Apply styles immediately after insertion
            requestAnimationFrame(() => {
              const imgElements = editor.root.querySelectorAll("img");
              const lastImg = imgElements[imgElements.length - 1];

              if (lastImg && lastImg.src === reader.result) {
                lastImg.style.maxWidth = "100%";
                lastImg.style.height = "auto";
                lastImg.style.display = "block";
                lastImg.style.margin = "10px 0";
                lastImg.style.cursor = "pointer";

                // Add click handler for preview
                lastImg.onclick = () => handleImagePreview(reader.result);

                // Add data attributes for original dimensions
                lastImg.setAttribute("data-original-width", img.width);
                lastImg.setAttribute("data-original-height", img.height);

                // Set dimensions
                if (width > 0 && height > 0) {
                  lastImg.style.width = `${width}px`;
                  lastImg.style.maxWidth = "100%";
                }
              }

              // Move cursor after the image
              editor.setSelection(range.index + 1);
            });
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    },
    [handleImagePreview]
  );

  // Setup image handler and modify toolbar
  useEffect(() => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();

    // Setup image resize module
    if (editor) {
      // Add image resize capability
      editor.getModule("toolbar").addHandler("image", () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = () => {
          if (input.files != null && input.files[0] != null) {
            const file = input.files[0];
            const range = editor.getSelection() || {
              index: editor.getLength(),
            };
            processAndInsertImage(file, range);
          }
        };
      });

      // Handle pasted images with compression
      editor.clipboard.addMatcher("img", (node, delta) => {
        const imgSrc = node.getAttribute("src");

        // If it's a data URL, try to convert back to file for compression
        if (imgSrc && imgSrc.startsWith("data:image/")) {
          // For pasted images, we'll handle compression in a different way
          const img = new Image();
          img.src = imgSrc;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

          // Process image dimensions
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }

            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }

            // Find and update the pasted image
            setTimeout(() => {
              const images = editor.root.querySelectorAll("img");
              const lastImg = images[images.length - 1];

              if (lastImg) {
                lastImg.style.maxWidth = "100%";
                lastImg.style.height = "auto";
                lastImg.style.display = "block";
                lastImg.style.margin = "10px 0";
                lastImg.style.cursor = "pointer";
                lastImg.onclick = () => handleImagePreview(lastImg.src);

                if (width > 0 && height > 0) {
                  lastImg.style.width = `${width}px`;
                  lastImg.style.maxWidth = "100%";
                }
              }
            }, 0);
          };
        }

        return delta;
      });

      // Handle drag and drop with compression
      editor.root.addEventListener("drop", (e) => {
        if (
          e.dataTransfer &&
          e.dataTransfer.files &&
          e.dataTransfer.files.length > 0
        ) {
          if (e.dataTransfer.files[0].type.match(/^image\//)) {
            e.preventDefault();
            e.stopPropagation();

            const file = e.dataTransfer.files[0];
            const range = editor.getSelection() || {
              index: editor.getLength(),
            };
            processAndInsertImage(file, range);
          }
        }
      });

      // Add click handlers to existing images
      const addClickHandlersToImages = () => {
        const images = editor.root.querySelectorAll("img");
        images.forEach((img) => {
          if (!img.onclick) {
            img.style.cursor = "pointer";
            img.onclick = () => handleImagePreview(img.src);
          }
        });
      };

      // Initial setup for existing images
      setTimeout(addClickHandlersToImages, 100);

      // Watch for new images
      const observer = new MutationObserver(addClickHandlersToImages);
      observer.observe(editor.root, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, [processAndInsertImage, handleImagePreview]);

  useEffect(() => {
    if (value !== undefined && value !== editorContent) {
      // Only update if we're not currently editing
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor && !editor.hasFocus()) {
          setEditorContent(value);
        }
      } else {
        setEditorContent(value);
      }
    }
  }, [value]);

  useEffect(() => {
    // Handle clicks outside the editor component
    const handleClickOutside = (event) => {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        setFocused(false);
        if (onBlur) onBlur();
      }
    };

    // Add event listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    if (onFocus) onFocus();
  }, [onFocus]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "bullet",
      "link",
      "image",
      "color",
      "background",
    ],
    []
  );

  // Replace the customStyles section in your code with this:

  // const customStyles = `
  //     .quill-wrapper-${id} {
  //       position: relative;
  //       width: 100%;
  //     }

  //     .quill-editor-${id} {
  //       border: 1px solid #e2e8f0;
  //       border-radius: 4px;
  //       position: relative;
  //       left: 0;
  //       right: 0;
  //       width: 100%;
  //       height: 250px;
  //       overflow: visible;
  //     }

  //     .quill-editor-${id} .ql-container {
  //       border: none !important;
  //       position: absolute !important;
  //       top: 0 !important;
  //       left: 0 !important;
  //       right: 0 !important;
  //       bottom: 0 !important;
  //       width: 100% !important;
  //       height: 100% !important;
  //       overflow: hidden !important;
  //     }

  //     .quill-editor-${id} .ql-toolbar {
  //       border: none !important;
  //       border-bottom: 1px solid #f3f3f3 !important;
  //       position: absolute !important;
  //       top: 0 !important;
  //       left: 0 !important;
  //       right: 0 !important;
  //       background: white !important;
  //       z-index: 10 !important;
  //       max-height: 42px !important;
  //       overflow: visible !important;
  //       flex-wrap: wrap !important;
  //     }

  //     .quill-editor-${id} .ql-editor {
  //       position: absolute !important;
  //       top: 42px !important;
  //       left: 0 !important;
  //       right: 0 !important;
  //       bottom: 0 !important;
  //       overflow-y: auto !important;
  //       overflow-x: hidden !important;
  //       border: none !important;
  //       padding: 12px 12px 12px 12px !important;
  //       word-wrap: break-word !important;
  //       overflow-wrap: break-word !important;
  //       white-space: pre-wrap !important;
  //     }

  //     /* Color picker dropdown fix */
  //     .quill-editor-${id} .ql-toolbar .ql-picker {
  //       max-width: 100px !important;
  //       flex-shrink: 1 !important;
  //     }

  //     .quill-editor-${id} .ql-toolbar .ql-picker-options {
  //       z-index: 1000 !important;
  //       position: absolute !important;
  //       background: white !important;
  //       border: 1px solid #ccc !important;
  //       border-radius: 4px !important;
  //       box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
  //       max-height: 200px !important;
  //       overflow-y: auto !important;
  //     }

  //     .quill-editor-${id} .ql-toolbar .ql-color-picker .ql-picker-options,
  //     .quill-editor-${id} .ql-toolbar .ql-background .ql-picker-options {
  //       padding: 5px !important;
  //     }

  //     /* When focused, change the border color */
  //     .quill-editor-${id}.focused {
  //       border-color: #60a5fa;
  //       box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  //     }

  //     /* Image styling */
  //     .quill-editor-${id} .ql-editor img {
  //       max-width: calc(100% - 24px) !important;
  //       height: auto !important;
  //       display: block !important;
  //       margin: 10px 0 !important;
  //       pointer-events: auto !important;
  //       cursor: pointer !important;
  //       border-radius: 4px;
  //       transition: opacity 0.2s ease;
  //     }

  //     .quill-editor-${id} .ql-editor img:hover {
  //       opacity: 0.8;
  //     }

  //     /* Prevent image removal during re-renders */
  //     .quill-editor-${id} .ql-editor img[src*="data:image"] {
  //       opacity: 1 !important;
  //       visibility: visible !important;
  //     }

  //     /* Make toolbar buttons more visible */
  //     .quill-editor-${id} .ql-toolbar button {
  //       width: 28px;
  //       height: 28px;
  //       display: inline-flex;
  //       align-items: center;
  //       justify-content: center;
  //       flex-shrink: 0;
  //     }

  //     .quill-editor-${id} .ql-toolbar button:hover {
  //       background-color: #f3f3f3;
  //       border-radius: 3px;
  //     }

  //     /* Fix spacing in toolbar */
  //     .quill-editor-${id} .ql-formats {
  //       margin-right: 8px !important;
  //       margin-bottom: 0 !important;
  //       flex-shrink: 1 !important;
  //       display: inline-flex !important;
  //     }

  //     /* Force content wrapping */
  //     .quill-editor-${id} .ql-editor * {
  //       max-width: 100% !important;
  //       word-wrap: break-word !important;
  //       overflow-wrap: break-word !important;
  //       box-sizing: border-box !important;
  //     }

  //     .quill-editor-${id} .ql-editor p,
  //     .quill-editor-${id} .ql-editor div,
  //     .quill-editor-${id} .ql-editor span,
  //     .quill-editor-${id} .ql-editor h1,
  //     .quill-editor-${id} .ql-editor h2,
  //     .quill-editor-${id} .ql-editor h3,
  //     .quill-editor-${id} .ql-editor ul,
  //     .quill-editor-${id} .ql-editor ol,
  //     .quill-editor-${id} .ql-editor li {
  //       max-width: 100% !important;
  //       word-wrap: break-word !important;
  //       overflow-wrap: break-word !important;
  //       white-space: pre-wrap !important;
  //     }

  //     /* Image preview modal styles */
  //     .image-preview-modal {
  //       position: fixed;
  //       top: 0;
  //       left: 0;
  //       right: 0;
  //       bottom: 0;
  //       background: rgba(0, 0, 0, 0.8);
  //       display: flex;
  //       align-items: center;
  //       justify-content: center;
  //       z-index: 1000;
  //       padding: 20px;
  //       box-sizing: border-box;
  //     }

  //     .image-preview-content {
  //       position: relative;
  //       max-width: 90vw;
  //       max-height: 90vh;
  //       background: white;
  //       border-radius: 8px;
  //       padding: 4px;
  //       box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  //     }

  //     .image-preview-content img {
  //       max-width: 100%;
  //       max-height: calc(90vh - 8px);
  //       width: auto;
  //       height: auto;
  //       display: block;
  //       border-radius: 4px;
  //     }

  //     .image-preview-close {
  //       position: absolute;
  //       top: -10px;
  //       right: -10px;
  //       width: 32px;
  //       height: 32px;
  //       background: white;
  //       border: 2px solid #e2e8f0;
  //       border-radius: 50%;
  //       display: flex;
  //       align-items: center;
  //       justify-content: center;
  //       cursor: pointer;
  //       font-size: 18px;
  //       font-weight: bold;
  //       color: #666;
  //       transition: all 0.2s ease;
  //     }

  //     .image-preview-close:hover {
  //       background: #f3f4f6;
  //       color: #333;
  //       transform: scale(1.1);
  //     }
  //   `;

  const customStyles = `
  .quill-wrapper-${id} {
    position: relative;
    width: 100%;
  }

  .quill-editor-${id} {
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    position: relative;
    width: 100%;
    height: 250px;
    overflow: visible;
  }

  .quill-editor-${id} .ql-container {
    border: none !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    padding-top: 42px !important; /* ✅ Fix for toolbar overlap */
    box-sizing: border-box !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .quill-editor-${id} .ql-toolbar {
    border: none !important;
    border-bottom: 1px solid #f3f3f3 !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 42px !important;
    background: white !important;
    z-index: 10 !important;
    max-height: 42px !important;
    overflow: visible !important;
    flex-wrap: wrap !important;
  }

  .quill-editor-${id} .ql-editor {
    position: relative !important;
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    border: none !important;
    padding: 12px !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    box-sizing: border-box !important;
  }

  .quill-editor-${id}.focused {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }

  .quill-editor-${id} .ql-editor img {
    max-width: calc(100% - 24px) !important;
    height: auto !important;
    display: block !important;
    margin: 10px 0 !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    border-radius: 4px;
    transition: opacity 0.2s ease;
  }

  .quill-editor-${id} .ql-editor img:hover {
    opacity: 0.8;
  }

  .quill-editor-${id} .ql-editor img[src*="data:image"] {
    opacity: 1 !important;
    visibility: visible !important;
  }

  .quill-editor-${id} .ql-toolbar button {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .quill-editor-${id} .ql-toolbar button:hover {
    background-color: #f3f3f3;
    border-radius: 3px;
  }

  .quill-editor-${id} .ql-formats {
    margin-right: 8px !important;
    margin-bottom: 0 !important;
    flex-shrink: 1 !important;
    display: inline-flex !important;
  }

  .quill-editor-${id} .ql-toolbar .ql-picker {
    max-width: 100px !important;
    flex-shrink: 1 !important;
  }

  .quill-editor-${id} .ql-toolbar .ql-picker-options {
    z-index: 1000 !important;
    position: absolute !important;
    background: white !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    max-height: 200px !important;
    overflow-y: auto !important;
  }

  .quill-editor-${id} .ql-toolbar .ql-color-picker .ql-picker-options,
  .quill-editor-${id} .ql-toolbar .ql-background .ql-picker-options {
    padding: 5px !important;
  }

  .quill-editor-${id} .ql-editor * {
    max-width: 100% !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    box-sizing: border-box !important;
  }

  .quill-editor-${id} .ql-editor p,
  .quill-editor-${id} .ql-editor div,
  .quill-editor-${id} .ql-editor span,
  .quill-editor-${id} .ql-editor h1,
  .quill-editor-${id} .ql-editor h2,
  .quill-editor-${id} .ql-editor h3,
  .quill-editor-${id} .ql-editor ul,
  .quill-editor-${id} .ql-editor ol,
  .quill-editor-${id} .ql-editor li {
    max-width: 100% !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
  }

  .image-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  }

  .image-preview-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: white;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .image-preview-content img {
    max-width: 100%;
    max-height: calc(90vh - 8px);
    width: auto;
    height: auto;
    display: block;
    border-radius: 4px;
  }

  .image-preview-close {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 32px;
    height: 32px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    color: #666;
    transition: all 0.2s ease;
  }

  .image-preview-close:hover {
    background: #f3f4f6;
    color: #333;
    transform: scale(1.1);
  }
`;

  return (
    <div
      ref={editorRef}
      className={`quill-wrapper-${id} ${label ? "space-y-4 mb-8" : ""}`}
    >
      {/* Add custom CSS */}
      <style>{customStyles}</style>

      {label && (
        <div className="flex items-center mb-2">
          <label htmlFor={id} className="font-medium flex items-center">
            {label}
            {isRequired && (
              <span className="text-amber-500 ml-1 text-lg">*</span>
            )}
          </label>
        </div>
      )}

      <div
        className={`
          ${error || showError ? "ring-2 ring-red-200" : ""}
          ${className}
          quill-editor-${id}
          ${focused ? "focused" : ""}
        `}
      >
        <ReactQuill
          ref={quillRef}
          id={id}
          theme="snow"
          value={editorContent}
          onChange={handleChange}
          onBlur={() => {
            setTouched(true);
            if (onBlur) onBlur();
          }}
          onFocus={handleFocus}
          modules={modules}
          formats={formats}
          preserveWhitespace={true}
        />
      </div>

      {(showError || error) && (
        <div className="text-red-500 text-sm">{label || name} is required</div>
      )}

      {isRequired && (
        <input
          type="hidden"
          name={name}
          value={editorContent}
          required={true}
          aria-hidden="true"
        />
      )}

      {/* <div className="text-xs text-gray-500 mt-2">
        You can paste, drag & drop, or upload images.
      </div> */}

      {/* Image Preview Modal */}
      {showPreview && previewImage && (
        <div className="image-preview-modal" onClick={closePreview}>
          <div
            className="image-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="image-preview-close" onClick={closePreview}>
              ×
            </button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuillTextEditor;
