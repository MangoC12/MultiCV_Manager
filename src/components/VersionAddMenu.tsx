"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function VersionAddMenu({
  knownNames,
  usedNames,
  onAdd
}: {
  knownNames: string[];
  usedNames: string[];
  onAdd: (name: string) => void;
}) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const availableNames = knownNames.filter((candidate) => !usedNames.includes(candidate));

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const add = (versionName: string) => {
    const normalized = versionName.trim();
    if (!normalized || usedNames.includes(normalized)) return;
    onAdd(normalized);
    setName("");
    setOpen(false);
  };

  return (
    <div className="versionAddControl" ref={rootRef}>
      <button
        className="versionAddButton"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ＋ {t.addVersion}
      </button>
      {open ? (
        <div className="versionAddPopover">
          <div className="versionNameCreateRow">
            <input
              value={name}
              placeholder={t.newVersionName}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add(name);
                }
              }}
              autoFocus
            />
            <button type="button" disabled={!name.trim()} onClick={() => add(name)} aria-label={t.add}>
              ＋
            </button>
          </div>
          <div className="availableVersionList">
            <span>{t.availableVersions}</span>
            {availableNames.length ? availableNames.map((versionName) => (
              <button key={versionName} type="button" onClick={() => add(versionName)}>
                {versionName}
              </button>
            )) : <small>{t.noAvailableVersions}</small>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function VersionManageMenu({
  currentName,
  knownNames,
  onRename,
  onCopy,
  onDelete,
  onClose
}: {
  currentName: string;
  knownNames: string[];
  onRename: (name: string) => boolean;
  onCopy: (name: string) => boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [renameName, setRenameName] = useState(currentName);
  const [copyName, setCopyName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [onClose]);

  const submitRename = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    if (onRename(normalized)) onClose();
  };

  const submitCopy = () => {
    const normalized = copyName.trim();
    if (!normalized) return;
    if (onCopy(normalized)) onClose();
    else setError(t.versionAlreadyExists);
  };

  return (
    <div className="versionManagePopover" ref={rootRef} onDoubleClick={(event) => event.stopPropagation()}>
      <strong>{t.manageVersion}</strong>
      <span className="versionManageLabel">{t.renameVersion}</span>
      <div className="versionManageRow">
        <input
          value={renameName}
          onChange={(event) => setRenameName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submitRename(renameName)}
          autoFocus
        />
        <button type="button" onClick={() => submitRename(renameName)}>{t.save}</button>
      </div>
      <div className="availableVersionList">
        <span>{t.changeToExistingVersion}</span>
        <div className="versionManageChoices">
          {knownNames.map((name) => (
            <button type="button" key={name} onClick={() => submitRename(name)}>{name}</button>
          ))}
        </div>
      </div>
      <span className="versionManageLabel">{t.copyAsNewVersion}</span>
      <div className="versionManageRow">
        <input
          value={copyName}
          placeholder={t.newVersionName}
          onChange={(event) => { setCopyName(event.target.value); setError(""); }}
          onKeyDown={(event) => event.key === "Enter" && submitCopy()}
        />
        <button type="button" onClick={submitCopy}>{t.copy}</button>
      </div>
      {error ? <small className="versionManageError">{error}</small> : null}
      <button
        type="button"
        className="versionDeleteButton"
        onClick={() => {
          if (!window.confirm(t.deleteVersionConfirm)) return;
          onDelete();
          onClose();
        }}
      >
        {t.deleteCurrentVersion}
      </button>
    </div>
  );
}
