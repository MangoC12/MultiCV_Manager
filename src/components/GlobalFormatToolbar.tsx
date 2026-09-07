"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { defaultPhotoSettings } from "@/lib/photoSettings";
import { useEditorUiStore } from "@/store/useEditorUiStore";
import { useResumeStore } from "@/store/useResumeStore";
import type { PhotoSettings } from "@/types/resume";

const fontOptions = [
  {
    label: "宋体",
    inlineValue: "SimSun",
    globalValue: "SimSun, Songti SC, Noto Serif CJK SC, serif"
  },
  {
    label: "黑体",
    inlineValue: "SimHei",
    globalValue: "SimHei, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
  },
  {
    label: "微软雅黑",
    inlineValue: "Microsoft YaHei",
    globalValue: "Microsoft YaHei, Noto Sans CJK SC, sans-serif"
  },
  {
    label: "Arial",
    inlineValue: "Arial",
    globalValue: "Arial, sans-serif"
  },
  {
    label: "Times",
    inlineValue: "Times New Roman",
    globalValue: "Times New Roman, Times, serif"
  }
];

export function GlobalFormatToolbar() {
  const { t } = useI18n();
  const profile = useResumeStore((s) => s.profile);
  const updateProfile = useResumeStore((s) => s.updateProfile);
  const resumeTemplateId = useResumeStore((s) => s.resumeTemplateId);
  const resumeStyle = useResumeStore((s) => s.resumeStyle);
  const setResumeStyle = useResumeStore((s) => s.setResumeStyle);
  const draftPhotoSettings = useEditorUiStore((s) => s.draftPhotoSettings);
  const setDraftPhotoSettings = useEditorUiStore((s) => s.setDraftPhotoSettings);
  const updateDraftPhotoSetting = useEditorUiStore((s) => s.updateDraftPhotoSetting);
  const [mode, setMode] = useState<"global" | "local">("local");
  const [localFontSizeScale, setLocalFontSizeScale] = useState(1);
  const [localLineHeight, setLocalLineHeight] = useState(1.23);
  const [isPhotoPopoverOpen, setIsPhotoPopoverOpen] = useState(false);
  const savedSelection = useRef<Range | null>(null);
  const photoPopoverRef = useRef<HTMLDivElement>(null);
  const savedPhotoSettings = profile.photoSettings ?? defaultPhotoSettings;
  const activePhotoSettings = draftPhotoSettings ?? savedPhotoSettings;
  const canAdjustPhoto = resumeTemplateId === "chinese-compact" && Boolean(profile.photoDataUrl);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const element = node instanceof Element ? node : node.parentElement;
    if (!element?.closest("[data-rich-editor='true']")) return;
    savedSelection.current = range.cloneRange();
  };

  useEffect(() => {
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  useEffect(() => {
    if (!isPhotoPopoverOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (photoPopoverRef.current?.contains(event.target as Node)) return;
      setIsPhotoPopoverOpen(false);
      setDraftPhotoSettings(null);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isPhotoPopoverOpen, setDraftPhotoSettings]);

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedSelection.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelection.current);
  };

  const syncActiveEditor = () => {
    const node = savedSelection.current?.commonAncestorContainer;
    const element = node instanceof Element ? node : node?.parentElement;
    const editor = element?.closest<HTMLElement>("[data-rich-editor='true']");
    editor?.dispatchEvent(new InputEvent("input", { bubbles: true }));
  };

  const wrapSelectionWithStyle = (style: Partial<CSSStyleDeclaration>) => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    Object.assign(span.style, style);
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);
    syncActiveEditor();
    rememberSelection();
  };

  const applyCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    syncActiveEditor();
    rememberSelection();
  };
  const insertOrderedIndex = () => {
    restoreSelection();
    const selectedText = window.getSelection()?.toString();
    if (selectedText?.trim()) {
      const orderedText = selectedText
        .split(/\r?\n/)
        .map((line, index) => line.trim() ? `（${index + 1}）${line.trim()}` : "")
        .filter(Boolean)
        .join("\n");
      document.execCommand("insertText", false, orderedText);
    } else {
      document.execCommand("insertText", false, "（1）");
    }
    syncActiveEditor();
    rememberSelection();
  };
  const selectedGlobalFont = fontOptions.find((font) => font.globalValue === resumeStyle.fontFamily)?.globalValue ?? "";
  const applyFont = (value: string) => {
    const font = fontOptions.find((item) => item.globalValue === value || item.inlineValue === value);
    if (!font) return;
    if (mode === "global") {
      setResumeStyle({ fontFamily: font.globalValue });
      return;
    }
    applyCommand("fontName", font.inlineValue);
  };
  const updateFontSize = (value: number) => {
    if (mode === "global") {
      setResumeStyle({ fontSizeScale: value });
      return;
    }
    setLocalFontSizeScale(value);
    wrapSelectionWithStyle({ fontSize: `${Math.round(value * 100)}%` });
  };
  const updateLineHeight = (value: number) => {
    if (mode === "global") {
      setResumeStyle({ lineHeight: value });
      return;
    }
    setLocalLineHeight(value);
    wrapSelectionWithStyle({ lineHeight: String(value) });
  };
  const openPhotoPopover = () => {
    if (isPhotoPopoverOpen) {
      setIsPhotoPopoverOpen(false);
      setDraftPhotoSettings(null);
      return;
    }
    setDraftPhotoSettings(savedPhotoSettings);
    setIsPhotoPopoverOpen(true);
  };
  const savePhotoSettings = () => {
    updateProfile({ photoSettings: activePhotoSettings });
    setDraftPhotoSettings(null);
    setIsPhotoPopoverOpen(false);
  };
  const restoreDefaultPhotoSettings = () => {
    updateProfile({ photoSettings: defaultPhotoSettings });
    setDraftPhotoSettings(null);
    setIsPhotoPopoverOpen(false);
  };
  const photoControls: { key: keyof PhotoSettings; label: string; min: number; max: number; step: number; suffix: string }[] = [
    { key: "widthMm", label: t.photoSize, min: 10, max: 18, step: 0.5, suffix: "mm" },
    { key: "topMm", label: t.photoTop, min: -12, max: 1, step: 0.5, suffix: "mm" },
    { key: "rightMm", label: t.photoRight, min: 0, max: 16, step: 0.5, suffix: "mm" },
    { key: "objectX", label: t.photoFocusX, min: 0, max: 100, step: 1, suffix: "%" },
    { key: "objectY", label: t.photoFocusY, min: 0, max: 100, step: 1, suffix: "%" }
  ];

  return (
    <div className="globalFormatToolbar" onMouseUp={rememberSelection} onKeyUp={rememberSelection}>
      <div className="formatScopeToggle" aria-label={t.formatScope}>
        <button className={mode === "global" ? "active" : ""} onClick={() => setMode("global")}>
          {t.globalText}
        </button>
        <button className={mode === "local" ? "active" : ""} onClick={() => setMode("local")}>
          {t.localText}
        </button>
      </div>
      <select
        aria-label={t.fontFamily}
        value={mode === "global" ? selectedGlobalFont : ""}
        onMouseDown={rememberSelection}
        onChange={(event) => {
          if (!event.target.value) return;
          applyFont(event.target.value);
        }}
      >
        <option value="">{t.fontFamily}</option>
        {fontOptions.map((font) => (
          <option key={font.inlineValue} value={mode === "global" ? font.globalValue : font.inlineValue}>
            {font.label}
          </option>
        ))}
      </select>
      <div className="globalResumeSliders">
        <label>
          <span>{t.fontSize} {(mode === "global" ? resumeStyle.fontSizeScale : localFontSizeScale).toFixed(2)}x</span>
          <input
            type="range"
            min="0.88"
            max="1.18"
            step="0.01"
            value={mode === "global" ? resumeStyle.fontSizeScale : localFontSizeScale}
            onChange={(event) => updateFontSize(Number(event.target.value))}
          />
        </label>
        <label>
          <span>{t.lineHeight} {(mode === "global" ? resumeStyle.lineHeight : localLineHeight).toFixed(2)}</span>
          <input
            type="range"
            min="1.05"
            max="1.6"
            step="0.01"
            value={mode === "global" ? resumeStyle.lineHeight : localLineHeight}
            onChange={(event) => updateLineHeight(Number(event.target.value))}
          />
        </label>
      </div>
      <button title={t.bold} onMouseDown={(event) => { event.preventDefault(); applyCommand("bold"); }}>B</button>
      <button title={t.italic} onMouseDown={(event) => { event.preventDefault(); applyCommand("italic"); }}>I</button>
      <button title={t.underline} onMouseDown={(event) => { event.preventDefault(); applyCommand("underline"); }}>U</button>
      <button title={t.bulletSymbol} onMouseDown={(event) => { event.preventDefault(); applyCommand("insertText", "• "); }}>•</button>
      <button title={t.orderedSymbol} onMouseDown={(event) => { event.preventDefault(); insertOrderedIndex(); }}>1</button>
      <button title={t.clearFormat} onMouseDown={(event) => { event.preventDefault(); applyCommand("removeFormat"); }}>Tx</button>
      {canAdjustPhoto ? (
        <div className="photoPopoverHost" ref={photoPopoverRef}>
          <button
            className={isPhotoPopoverOpen ? "active" : ""}
            title={t.photoAdjustTitle}
            onClick={openPhotoPopover}
          >
            {t.photoAdjustButton}
          </button>
          {isPhotoPopoverOpen ? (
            <div className="photoAdjustPopover">
              <strong>{t.photoAdjustTitle}</strong>
              <span>{t.photoAdjustHint}</span>
              <div className="photoAdjustPopoverGrid">
                {photoControls.map((control) => (
                  <label key={control.key}>
                    <span>{control.label} · {activePhotoSettings[control.key]}{control.suffix}</span>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={activePhotoSettings[control.key]}
                      onChange={(event) => updateDraftPhotoSetting(control.key, Number(event.target.value))}
                    />
                  </label>
                ))}
              </div>
              <div className="photoAdjustPopoverActions">
                <button className="ghostButton" onClick={restoreDefaultPhotoSettings}>{t.restoreDefault}</button>
                <button className="primaryButton" onClick={savePhotoSettings}>{t.savePhotoSettings}</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
