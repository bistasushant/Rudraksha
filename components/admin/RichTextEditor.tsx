"use client";

import React, { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  ImageIcon,
  Palette,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

// Custom marks for font styling
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

const FontFamily = Extension.create({
  name: "fontFamily",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {};
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },
});

// Color palette options
const colorOptions = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#008000",
  "#800000",
  "#008080",
  "#FFC0CB",
];

// Font size options
const fontSizeOptions = [
  { value: "12px", label: "12px" },
  { value: "14px", label: "14px" },
  { value: "16px", label: "16px" },
  { value: "18px", label: "18px" },
  { value: "20px", label: "20px" },
  { value: "24px", label: "24px" },
  { value: "28px", label: "28px" },
  { value: "32px", label: "32px" },
  { value: "36px", label: "36px" },
  { value: "42px", label: "42px" },
];

// Font family options
const fontFamilyOptions = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Impact, sans-serif", label: "Impact" },
];

// Define the props type
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  formErrors?: { [key: string]: string };
  isSubmitting?: boolean;
  maxLength?: number;
  simplified?: boolean;
  onBlur?: (value: string) => void; // Updated to accept string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  formErrors,
  isSubmitting,
  maxLength,
  simplified = false,
  onBlur,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState<string>("16px");
  const [currentFontFamily, setCurrentFontFamily] =
    useState<string>("Arial, sans-serif");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: simplified
          ? false
          : {
              keepMarks: true,
              keepAttributes: true,
              HTMLAttributes: {
                class: "list-disc pl-6",
              },
            },
        orderedList: simplified
          ? false
          : {
              keepMarks: true,
              keepAttributes: true,
              HTMLAttributes: {
                class: "list-decimal pl-6",
              },
            },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      ...(simplified
        ? []
        : [
            Image.configure({
              inline: true,
              allowBase64: true,
              HTMLAttributes: {
                style: "max-width: 300px; height: auto; margin: 8px 0;",
              },
            }),
          ]),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (maxLength) {
        const plainText = editor.getText();
        if (plainText.length <= maxLength) {
          onChange(html);
        } else {
          toast.error(`Content exceeds ${maxLength} characters.`);
          editor.commands.setContent(value);
        }
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class:
          "min-h-32 p-3 focus:outline-none prose prose-invert max-w-none text-white",
      },
    },
    editable: !isSubmitting,
    onBlur: () => {
      if (onBlur) {
        onBlur(value); // Pass current value as string
      }
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      // For smaller images, use base64 encoding
      if (file.size < 500 * 1024) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const imageUrl = readerEvent.target?.result as string;
          if (editor) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
          }
          setUploading(false);
          setImageDialogOpen(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // For larger images, upload to server
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      if (editor) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }

      setImageDialogOpen(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);

      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFontSizeChange = (size: string) => {
    setCurrentFontSize(size);
    if (editor) {
      editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
    }
  };

  const handleFontFamilyChange = (family: string) => {
    setCurrentFontFamily(family);
    if (editor) {
      editor.chain().focus().setMark("textStyle", { fontFamily: family }).run();
    }
  };

  return (
    <>
      <div
        className={`border rounded-lg focus-within:ring-2 focus-within:ring-gray-500 ${
          formErrors && Object.values(formErrors).some((err) => err)
            ? "border-red-500"
            : "border-white/20"
        }`}
      >
        {!simplified && (
          <div className="toolbar flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-gray-600/20 ${
                editor?.isActive("bold") ? "bg-white/20" : ""
              }`}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={!editor?.can().chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4 text-white" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-gray-600/20 ${
                editor?.isActive("italic") ? "bg-white/20" : ""
              }`}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={!editor?.can().chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4 text-white" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-gray-600/20 ${
                editor?.isActive("underline") ? "bg-white/20" : ""
              }`}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              disabled={!editor?.can().chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4 text-white" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-gray-600/20 ${
                editor?.isActive("bulletList") ? "bg-white/20" : ""
              }`}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              disabled={!editor?.can().chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4 text-white" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-gray-600/20 ${
                editor?.isActive("orderedList") ? "bg-white/20" : ""
              }`}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              disabled={
                !editor?.can().chain().focus().toggleOrderedList().run()
              }
            >
              <ListOrdered className="h-4 w-4 text-white" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-600/20"
              onClick={() => setImageDialogOpen(true)}
            >
              <ImageIcon className="h-4 w-4 text-white" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-600/20"
                >
                  <Palette className="h-4 w-4 text-white" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-slate-900 border border-white/20">
                <div className="grid grid-cols-7 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded-full border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor?.chain().focus().setColor(color).run();
                      } }
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="ml-1">
              <Select
                value={currentFontFamily}
                onValueChange={handleFontFamilyChange}
              >
                <SelectTrigger className="w-20 h-8 bg-white/5 border-white/20 text-white text-xs">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-white/20 text-white">
                  {fontFamilyOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-1">
              <Select
                value={currentFontSize}
                onValueChange={handleFontSizeChange}
              >
                <SelectTrigger className="w-20 h-8 bg-white/5 border-white/20 text-white text-xs">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-white/20 text-white">
                  {fontSizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <EditorContent
          editor={editor}
          className={`prose prose-invert max-w-none text-white ${
            simplified ? "min-h-16 p-2" : "min-h-32 p-3"
          }`}
        />
      </div>

      {!simplified && (
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 text-white">
            <DialogHeader>
              <DialogTitle>Upload Image</DialogTitle>
            </DialogHeader>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/20"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                  <p className="text-sm text-white/70">Uploading image...</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 mx-auto text-white/50 mb-4" />
                  <p className="text-white/70 mb-2">
                    Drag and drop your image here
                  </p>
                  <p className="text-white/50 text-sm mb-4">or</p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default RichTextEditor;
