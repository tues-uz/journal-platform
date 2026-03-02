import { useState } from "react";

export function useEditorState() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState(21);
  const [lineHeight] = useState(1.58);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColor, setTextColor] = useState("#000000");

  const categories = [
    "Macroeconomics",
    "Microeconomics",
    "Policy & Reform",
    "Data Analysis",
    "Behavioral Economics",
    "International Trade",
    "Development Economics",
    "Financial Markets",
    "Public Policy",
    "Research",
  ];

  const adjustFontSize = (increase: boolean) => {
    const newSize = increase ? fontSize + 1 : Math.max(16, fontSize - 1);
    setFontSize(newSize);
  };

  return {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    category,
    setCategory,
    tags,
    setTags,
    content,
    setContent,
    isSaving,
    setIsSaving,
    fontSize,
    lineHeight,
    showColorPicker,
    setShowColorPicker,
    textColor,
    setTextColor,
    categories,
    adjustFontSize,
  };
}
