import { useState } from "react";
import { Field, NumInput, Panel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { How } from "@/components/result";
import { loadNotes, saveNotes, newId, type FieldNote } from "@/lib/survbox/persist";

function stamp(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ToolNotes() {
  const [rows, setRows] = useState<FieldNote[]>(() => loadNotes());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  function persist(next: FieldNote[]) {
    setRows(next);
    saveNotes(next);
  }

  function save() {
    const t = title.trim() || "Note";
    const b = body.trim();
    if (!b && !title.trim()) return;
    if (editId) {
      persist(rows.map((n) => (n.id === editId ? { ...n, title: t, body: b, at: Date.now() } : n)));
    } else {
      persist([{ id: newId("nt"), title: t, body: b, at: Date.now() }, ...rows]);
    }
    setTitle("");
    setBody("");
    setEditId(null);
  }

  function open(n: FieldNote) {
    setEditId(n.id);
    setTitle(n.title);
    setBody(n.body);
  }

  return (
    <div className="grid gap-4">
      <How>
        Scratch paper for this phone. Not a cloud. Not a report. If it matters,
        copy it out later.
      </How>
      <Panel className="grid gap-3">
        <Field label="Title">
          <NumInput
            inputMode="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="trail, radio, kit"
          />
        </Field>
        <Field label="Note">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="min-h-32 w-full rounded-sm border border-border bg-bg px-3 py-2 font-mono text-base text-fg outline-none ring-accent/40 placeholder:text-subtle focus:ring-2"
            placeholder="What you saw. What you did."
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Button className="w-full" onClick={save}>
            {editId ? "Update" : "Save note"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setEditId(null);
              setTitle("");
              setBody("");
            }}
          >
            Clear
          </Button>
        </div>
      </Panel>
      <div className="grid gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No notes on this phone.</p>
        ) : (
          rows.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n)}
              className="grid gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-left"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium">{n.title}</span>
                <span className="font-mono text-xs text-subtle">{stamp(n.at)}</span>
              </span>
              <span className="line-clamp-3 whitespace-pre-wrap text-sm text-muted">{n.body}</span>
              <span className="flex justify-end">
                <span
                  role="button"
                  className="text-xs text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    persist(rows.filter((x) => x.id !== n.id));
                    if (editId === n.id) {
                      setEditId(null);
                      setTitle("");
                      setBody("");
                    }
                  }}
                >
                  Delete
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
