import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ResumeBuilder() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    phone: "",
    email: "",
    address: "",
    linkedin: "",
    github: "",
    websites: [],
    photo: "",
    course: "",
    gpa: "",
    summary: "",
    skillsInput: "",
    skills: [],
    education: [{ school: "", degree: "", start: "", end: "", details: "" }],
    experience: [{ role: "", company: "", start: "", end: "", details: "" }],
    certifications: [""],
  });

  const previewRef = useRef(null);
  const [dark, setDark] = useState(false);
  const [pages, setPages] = useState(1);
  const [compact, setCompact] = useState(true); // default on to keep to 1 page when possible

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  // --- Persistence: load on mount, autosave on change ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem("rb.state.v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setForm(parsed.form || parsed);
          if (typeof parsed.dark === "boolean") setDark(parsed.dark);
          if (typeof parsed.compact === "boolean") setCompact(parsed.compact);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          "rb.state.v1",
          JSON.stringify({ form, dark, compact })
        );
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [form, dark, compact]);

  const ICONS = {
    name: "👤",
    phone: "📞",
    email: "✉️",
    address: "📍",
    linkedin: "🔗",
    github: "🐙",
    course: "🎓",
    gpa: "🧮",
    summary: "📝",
    skills: "🛠️",
  };

  function fillSample() {
    setForm({
      name: "Alex Student",
      title: "Software Engineer Intern",
      phone: "+1 555 123 4567",
      email: "alex@example.com",
      address: "123 Main St, City",
      linkedin: "linkedin.com/in/alex",
      github: "github.com/alex",
      websites: [{ label: "Portfolio", url: "https://alex.dev" }],
      course: "Computer Science",
      gpa: "3.8",
      summary:
        "Motivated computer science student with internship experience building web applications.",
      skillsInput: "JavaScript, React, Node.js, SQL",
      skills: ["JavaScript", "React", "Node.js", "SQL"],
      education: [
        {
          school: "State University",
          degree: "BSc Computer Science",
          start: "2021",
          end: "2024",
          details: "Relevant coursework: Algorithms, Databases",
        },
      ],
      experience: [
        {
          role: "Research Intern",
          company: "Acme Labs",
          start: "Jun 2023",
          end: "Aug 2023",
          details: "Built data pipeline\nImproved performance by 20%",
        },
      ],
      certifications: ["AWS Certified Cloud Practitioner"],
    });
  }

  function updateField(path, value) {
    setForm((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
  }

  function addEducation() {
    setForm((p) => ({
      ...p,
      education: [
        ...p.education,
        { school: "", degree: "", start: "", end: "", details: "" },
      ],
    }));
  }
  function removeEducation(i) {
    setForm((p) => ({
      ...p,
      education: p.education.filter((_, idx) => idx !== i),
    }));
  }

  function addExperience() {
    setForm((p) => ({
      ...p,
      experience: [
        ...p.experience,
        { role: "", company: "", start: "", end: "", details: "" },
      ],
    }));
  }
  function removeExperience(i) {
    setForm((p) => ({
      ...p,
      experience: p.experience.filter((_, idx) => idx !== i),
    }));
  }

  function addCertification() {
    setForm((p) => ({ ...p, certifications: [...p.certifications, ""] }));
  }
  function removeCertification(i) {
    setForm((p) => ({
      ...p,
      certifications: p.certifications.filter((_, idx) => idx !== i),
    }));
  }

  function handleSkillsCommit() {
    const raw = form.skillsInput;
    const arr = raw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((p) => ({ ...p, skills: arr }));
  }

  // Websites / portfolio helpers
  function addWebsite() {
    setForm((p) => ({
      ...p,
      websites: [...(p.websites || []), { label: "", url: "" }],
    }));
  }
  function removeWebsite(i) {
    setForm((p) => ({
      ...p,
      websites: (p.websites || []).filter((_, idx) => idx !== i),
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      updateField("photo", dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function removePhoto() {
    updateField("photo", "");
  }

  // --- Link helpers ---
  function normalizeUrl(input) {
    if (!input) return "";
    const s = String(input).trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("mailto:") || s.startsWith("tel:")) return s;
    if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(s)) return `mailto:${s}`;
    return `https://${s}`;
  }
  function normalizeTel(input) {
    if (!input) return "";
    const digits = String(input).replace(/[^+\d]/g, "");
    return digits ? `tel:${digits}` : "";
  }
  function linkify(text) {
    if (!text) return null;
    const regex = /((https?:\/\/[^\s]+)|(www\.[^\s]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}))/g;
    const parts = [];
    let last = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const start = m.index;
      if (start > last) parts.push(text.slice(last, start));
      const match = m[0];
      const href = normalizeUrl(match);
      parts.push(
        <a key={`l${start}`} href={href} target="_blank" rel="noreferrer">
          {match}
        </a>
      );
      last = regex.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  // --- Export: PDF / Word (.docx) / JSON ---
  async function downloadPDF() {
    const el = previewRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
    const w = imgProps.width * ratio;
    const h = imgProps.height * ratio;
    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    try {
      const elRect = el.getBoundingClientRect();
      const fx = w / elRect.width; // PDF units per CSS px (X)
      const fy = h / elRect.height; // PDF units per CSS px (Y)
      const anchors = el.querySelectorAll("a[href]");
      anchors.forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (!href || /^javascript:/i.test(href)) return;
        const r = a.getBoundingClientRect();
        const x = (r.left - elRect.left) * fx;
        const y = (r.top - elRect.top) * fy;
        const ww = r.width * fx;
        const hh = r.height * fy;
        if (ww > 2 && hh > 2) {
          pdf.link(x, y, ww, hh, { url: href });
        }
      });
    } catch {}
    pdf.save(`${(form.name || "resume").replace(/\s+/g, "_")}.pdf`);
  }

  function downloadWord() {
    const el = previewRef.current;
    if (!el) return;
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>${form.name} - Resume</title></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form.name || "resume").replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadDocx() {
    const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import(
      "docx"
    );
    const { saveAs } = await import("file-saver");
    const name = form.name || "Full Name";
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: name,
              heading: HeadingLevel.TITLE,
            }),
            form.title
              ? new Paragraph({ text: form.title })
              : new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            // Contact
            new Paragraph({ text: "Contact", heading: HeadingLevel.HEADING_2 }),
            ...(Array.from(
              [
                form.phone,
                form.email,
                form.address,
                form.linkedin,
                form.github,
                ...((form.websites || []).map((w) =>
                  `${w.label ? w.label + ": " : ""}${w.url}`
                )),
              ]
                .filter(Boolean)
                .map((v) => new Paragraph({ text: String(v) }))
            )),
            new Paragraph({ text: "" }),

            // Profile
            ...(form.summary
              ? [
                  new Paragraph({
                    text: "Profile",
                    heading: HeadingLevel.HEADING_2,
                  }),
                  new Paragraph({ text: form.summary }),
                  new Paragraph({ text: "" }),
                ]
              : []),

            // Experience
            new Paragraph({
              text: "Work Experience",
              heading: HeadingLevel.HEADING_2,
            }),
            ...form.experience
              .filter((ex) => ex.role || ex.company)
              .flatMap((ex) => {
                const header = `${ex.role || ""}${ex.company ? " — " + ex.company : ""}`.trim();
                const dates = `${ex.start || ""}${ex.end ? " - " + ex.end : ""}`.trim();
                const lines = (ex.details || "")
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                return [
                  new Paragraph({
                    children: [
                      new TextRun({ text: header, bold: true }),
                      dates ? new TextRun({ text: `  ${dates}`, italics: true }) : new TextRun("")
                    ],
                  }),
                  ...lines.map(
                    (l) => new Paragraph({ text: l, bullet: { level: 0 } })
                  ),
                ];
              }),
            new Paragraph({ text: "" }),

            // Education
            new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }),
            ...form.education
              .filter((e) => e.school || e.degree)
              .flatMap((e) => {
                const header = `${e.school || ""}${e.degree ? " — " + e.degree : ""}`.trim();
                const dates = `${e.start || ""}${e.end ? " - " + e.end : ""}`.trim();
                return [
                  new Paragraph({
                    children: [
                      new TextRun({ text: header, bold: true }),
                      dates ? new TextRun({ text: `  ${dates}`, italics: true }) : new TextRun("")
                    ],
                  }),
                  ...(e.details ? [new Paragraph({ text: e.details })] : []),
                ];
              }),
            new Paragraph({ text: "" }),

            // Skills
            new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
            ...(form.skills.length
              ? form.skills.map((s) =>
                  new Paragraph({ text: s, bullet: { level: 0 } })
                )
              : [new Paragraph({ text: "No skills" })]),

            // Certifications
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Certifications", heading: HeadingLevel.HEADING_2 }),
            ...(form.certifications.filter(Boolean).length
              ? form.certifications
                  .filter(Boolean)
                  .map((c) => new Paragraph({ text: c, bullet: { level: 0 } }))
              : [new Paragraph({ text: "None" })]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${(form.name || "resume").replace(/\s+/g, "_")}.docx`);
  }

  function exportJSON() {
    const data = { version: 1, dark, form };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form.name || "resume").replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        if (parsed.form) {
          setForm(parsed.form);
          if (typeof parsed.dark === "boolean") setDark(parsed.dark);
        } else {
          setForm(parsed);
        }
      } catch {}
    };
    reader.readAsText(file);
    // reset input so same file can be re-imported if needed
    e.target.value = "";
  }

  function resetAll() {
    setForm({
      name: "",
      title: "",
      phone: "",
      email: "",
      address: "",
      linkedin: "",
      github: "",
      course: "",
      gpa: "",
      summary: "",
      skillsInput: "",
      skills: [],
      education: [{ school: "", degree: "", start: "", end: "", details: "" }],
      experience: [{ role: "", company: "", start: "", end: "", details: "" }],
      certifications: [""],
    });
    try {
      localStorage.removeItem("rb.state.v1");
    } catch {}
  }

  // --- Page overflow indicator (estimates A4 pages) ---
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pxPerMm = rect.width / 210; // since .paper width is 210mm
    const a4HeightPx = 297 * pxPerMm;
    const pagesEst = Math.max(1, Math.ceil(rect.height / a4HeightPx));
    setPages(pagesEst);
  }, [form, previewRef]);

  return (
    <div className="min-h-screen font-sans">
      <div className="rb-shell">
        {/* Sidebar */}
        <aside className="rb-sidebar card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Resume Builder</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDark((d) => !d)}
                className="btn btn-neutral btn-sm"
                title="Toggle dark mode"
              >
                {dark ? "☀️ Light" : "🌙 Dark"}
              </button>
              <button
                onClick={fillSample}
                className="btn btn-neutral btn-sm"
              >
                Auto-fill
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={exportJSON} className="btn btn-neutral btn-sm">
                Export JSON
              </button>
              <label className="btn btn-neutral btn-sm" style={{ cursor: "pointer" }}>
                Import JSON
                <input
                  type="file"
                  accept="application/json"
                  onChange={importJSON}
                  style={{ display: "none" }}
                />
              </label>
              <button onClick={resetAll} className="btn btn-neutral btn-sm">
                Reset
              </button>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
              />
              <span className="text-sm text-slate-600">Keep to 1 page (compact)</span>
            </label>

            <h3 className="subsection">Basics</h3>
            <label className="block">
              <div className="section-title mb-1">{ICONS.name} Full name</div>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="input"
              />
            </label>

            <label className="block">
              <div className="section-title mb-1">Professional title</div>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="input"
              />
            </label>

            <div className="divider" />
            <h3 className="subsection">Photo</h3>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div>
                <label className="btn btn-neutral btn-sm" style={{ cursor: "pointer" }}>
                  Upload photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                </label>
                {form.photo && (
                  <div className="mt-2">
                    <button onClick={removePhoto} className="text-sm text-red-600">Remove photo</button>
                  </div>
                )}
              </div>
              {form.photo && (
                <img src={form.photo} alt="Passport" className="passport-photo" />
              )}
            </div>
            <h3 className="subsection">Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <div className="section-title mb-1">{ICONS.phone} Phone</div>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="input"
                />
              </label>
              <label>
                <div className="section-title mb-1">{ICONS.email} Email</div>
                <input
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="input"
                />
              </label>
            </div>

            <label>
              <div className="section-title mb-1">{ICONS.address} Address</div>
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="input"
              />
            </label>

            <div className="divider" />
            <h3 className="subsection">Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <div className="section-title mb-1">
                  {ICONS.linkedin} LinkedIn
                </div>
                <input
                  value={form.linkedin}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                  className="input"
                />
              </label>
              <label>
                <div className="section-title mb-1">{ICONS.github} GitHub</div>
                <input
                  value={form.github}
                  onChange={(e) => updateField("github", e.target.value)}
                  className="input"
                />
              </label>
            </div>
            <div className="mt-3">
              <div className="section-title mb-2">Websites / Portfolio</div>
              {(form.websites || []).map((w, i) => (
                <div className="grid grid-cols-2 gap-2 mb-2" key={i}>
                  <input
                    placeholder="Label (e.g. Portfolio)"
                    value={w.label}
                    onChange={(e) => updateField(`websites.${i}.label`, e.target.value)}
                    className="input px-2 py-2"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="https://example.com"
                      value={w.url}
                      onChange={(e) => updateField(`websites.${i}.url`, e.target.value)}
                      className="input px-2 py-2 flex-1"
                    />
                    <button onClick={() => removeWebsite(i)} className="text-red-600">Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={addWebsite} className="btn btn-success btn-sm">Add link</button>
            </div>

            <div className="divider" />
            <h3 className="subsection">Education & Course</h3>
            <label>
              <div className="section-title mb-1">
                {ICONS.course} Course / Major
              </div>
              <input
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
                className="input"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <div className="section-title mb-1">{ICONS.gpa} GPA</div>
                <input
                  value={form.gpa}
                  onChange={(e) => updateField("gpa", e.target.value)}
                  className="input"
                />
              </label>
              <label>
                <div className="section-title mb-1">
                  {ICONS.summary} Short summary / objective
                </div>
                <input
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className="input"
                />
              </label>
            </div>

            <div className="divider" />
            <h3 className="subsection">Skills</h3>
            <label>
              <div className="section-title mb-1">
                {ICONS.skills} Skills (comma / newline separated)
              </div>
              <textarea
                value={form.skillsInput}
                onChange={(e) => updateField("skillsInput", e.target.value)}
                rows={3}
                className="input"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleSkillsCommit}
                  className="btn btn-primary"
                >
                  Save skills
                </button>
                <button
                  onClick={() =>
                    setForm((p) => ({ ...p, skillsInput: "", skills: [] }))
                  }
                  className="btn btn-neutral"
                >
                  Clear
                </button>
              </div>
            </label>

            <div className="divider" />
            <section className="pt-2">
              <h3 className="font-medium text-slate-800 mb-2">Education</h3>
              {form.education.map((edu, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white ring-1 ring-slate-200 mb-3"
                >
                  <input
                    placeholder="School / Institute"
                    value={edu.school}
                    onChange={(e) =>
                      updateField(`education.${i}.school`, e.target.value)
                    }
                    className="input px-2 py-2"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      placeholder="Degree / Diploma"
                      value={edu.degree}
                      onChange={(e) =>
                        updateField(`education.${i}.degree`, e.target.value)
                      }
                      className="input px-2 py-2"
                    />
                    <input
                      placeholder="Start - End (eg 2021 - 2024)"
                      value={edu.start + (edu.end ? ` - ${edu.end}` : "")}
                      onChange={(e) => {
                        const parts = e.target.value
                          .split("-")
                          .map((s) => s.trim());
                        updateField(`education.${i}.start`, parts[0] || "");
                        updateField(`education.${i}.end`, parts[1] || "");
                      }}
                      className="input px-2 py-2"
                    />
                  </div>
                  <input
                    placeholder="Details (optional)"
                    value={edu.details}
                    onChange={(e) =>
                      updateField(`education.${i}.details`, e.target.value)
                    }
                    className="input px-2 py-2 mt-2"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => removeEducation(i)}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <button onClick={addEducation} className="btn btn-success">
                  Add education
                </button>
              </div>
            </section>

            <div className="divider" />
            <section className="pt-3">
              <h3 className="font-medium text-slate-800 mb-2">
                Work Experience
              </h3>
              {form.experience.map((ex, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white ring-1 ring-slate-200 mb-3"
                >
                  <input
                    placeholder="Role"
                    value={ex.role}
                    onChange={(e) =>
                      updateField(`experience.${i}.role`, e.target.value)
                    }
                    className="input px-2 py-2 mb-2"
                  />
                  <input
                    placeholder="Company"
                    value={ex.company}
                    onChange={(e) =>
                      updateField(`experience.${i}.company`, e.target.value)
                    }
                    className="input px-2 py-2 mb-2"
                  />
                  <input
                    placeholder="Start - End (eg Jun 2023 - Present)"
                    value={ex.start + (ex.end ? ` - ${ex.end}` : "")}
                    onChange={(e) => {
                      const parts = e.target.value
                        .split("-")
                        .map((s) => s.trim());
                      updateField(`experience.${i}.start`, parts[0] || "");
                      updateField(`experience.${i}.end`, parts[1] || "");
                    }}
                    className="input px-2 py-2 mb-2"
                  />
                  <textarea
                    placeholder="Details / achievements (one per line)"
                    value={ex.details}
                    onChange={(e) =>
                      updateField(`experience.${i}.details`, e.target.value)
                    }
                    className="input px-2 py-2"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => removeExperience(i)}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <button onClick={addExperience} className="btn btn-success">
                  Add experience
                </button>
              </div>
            </section>

            <div className="divider" />
            <section className="pt-3">
              <h3 className="font-medium text-slate-800 mb-2">
                Certifications
              </h3>
              {form.certifications.map((c, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input
                    placeholder="Certification name"
                    value={c}
                    onChange={(e) =>
                      updateField(`certifications.${i}`, e.target.value)
                    }
                    className="input px-2 py-2 flex-1"
                  />
                  <button
                    onClick={() => removeCertification(i)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="mt-2">
                <button onClick={addCertification} className="btn btn-success">
                  Add certification
                </button>
              </div>
            </section>

            <div className="flex gap-3 mt-4">
              <button onClick={downloadPDF} className="btn btn-primary">
                Download PDF
              </button>
              <button onClick={downloadDocx} className="btn btn-warning">
                Download DOCX
              </button>
            </div>
          </div>
        </aside>

        {/* Preview */}
        <main className="rb-preview">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-600 font-medium">Preview</h3>
            <div className="text-sm text-slate-400">
              {pages > 1
                ? `${pages} pages when printed — try compact`
                : "What you see is exported"}
            </div>
          </div>

          <div className="rb-preview-scroller">
            <div
              id="resume-preview"
              ref={previewRef}
              className={`paper card p-10 md:p-12 mx-auto ${compact ? "compact" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {form.name || "Full Name"}
                  </h1>
                  <div className="text-sm text-slate-600 mt-1">
                    {form.title}
                  </div>
                </div>
              <div className="text-sm text-right text-slate-600">
                {form.photo && (
                  <img src={form.photo} alt="Photo" className="passport-photo mx-auto mb-2" />
                )}
                  {form.phone && (
                    <div>
                      <a href={normalizeTel(form.phone)}>{form.phone}</a>
                    </div>
                  )}
                  {form.email && (
                    <div>
                      <a href={normalizeUrl(form.email)}>{form.email}</a>
                    </div>
                  )}
                  <div>{form.address}</div>
                  {form.linkedin && (
                    <div>
                      <a href={normalizeUrl(form.linkedin)} target="_blank" rel="noreferrer">
                        LinkedIn: {form.linkedin}
                      </a>
                    </div>
                  )}
                  {form.github && (
                    <div>
                      <a href={normalizeUrl(form.github)} target="_blank" rel="noreferrer">
                        GitHub: {form.github}
                      </a>
                    </div>
                  )}
                  {(form.websites || []).filter((w) => w.url).map((w, i) => (
                    <div key={i}>
                      <a href={normalizeUrl(w.url)} target="_blank" rel="noreferrer">
                        {w.label ? `${w.label}: ` : ""}
                        {w.url}
                      </a>
                    </div>
                  ))}
              </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {form.summary && (
                    <section className="mb-4">
                      <h4 className="font-semibold text-slate-800">Profile</h4>
                      <p className="text-sm text-slate-700 mt-2">{linkify(form.summary)}</p>
                    </section>
                  )}

                  <section className="mb-4">
                    <h4 className="font-semibold text-slate-800">
                      Work Experience
                    </h4>
                    {form.experience.filter((x) => x.role || x.company)
                      .length === 0 && (
                      <div className="text-sm text-slate-500 mt-2">
                        No experience added yet
                      </div>
                    )}
                    {form.experience.map(
                      (ex, i) =>
                        (ex.role || ex.company) && (
                          <div key={i} className="mt-3">
                            <div className="flex justify-between">
                              <div className="font-medium text-slate-900">
                                {ex.role}{" "}
                                <span className="text-slate-500">
                                  — {ex.company}
                                </span>
                              </div>
                              <div className="text-sm text-slate-500">
                                {ex.start}
                                {ex.end ? ` - ${ex.end}` : ""}
                              </div>
                            </div>
                            {ex.details && (
                              <ul className="list-disc list-inside text-sm text-slate-700 mt-2">
                                {ex.details.split("\n").map((d, idx) => (
                                  <li key={idx}>{linkify(d)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )
                    )}
                  </section>

                  <section className="mb-4">
                    <h4 className="font-semibold text-slate-800">Education</h4>
                    {form.education.map(
                      (edu, i) =>
                        (edu.school || edu.degree) && (
                          <div key={i} className="mt-3">
                            <div className="flex justify-between">
                              <div className="font-medium text-slate-900">
                                {edu.school}{" "}
                                <span className="text-slate-500">
                                  — {edu.degree}
                                </span>
                              </div>
                              <div className="text-sm text-slate-500">
                                {edu.start}
                                {edu.end ? ` - ${edu.end}` : ""}
                              </div>
                            </div>
                            {edu.details && (
                              <div className="text-sm text-slate-700 mt-1">{linkify(edu.details)}</div>
                            )}
                          </div>
                        )
                    )}
                  </section>

                  <section>
                    <h4 className="font-semibold text-slate-800">
                      Certifications
                    </h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-2">
                      {form.certifications.filter(Boolean).length === 0 && (
                        <li className="text-slate-500">None added</li>
                      )}
                      {form.certifications.filter(Boolean).map((c, i) => (
                        <li key={i}>{linkify(c)}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <aside className="md:col-span-1">
                  <section className="mb-4">
                    <h4 className="font-semibold text-slate-800">Course</h4>
                    <div className="text-sm text-slate-700 mt-2">
                      {form.course || "—"}
                    </div>
                    {form.gpa && (
                      <div className="text-sm text-slate-500 mt-1">
                        GPA: {form.gpa}
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="font-semibold text-slate-800">Skills</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.skills.length === 0 && (
                        <div className="text-sm text-slate-500">No skills</div>
                      )}
                      {form.skills.map((s, i) => (
                        <div
                          key={i}
                          className="text-xs px-2 py-1 border rounded-md bg-slate-50 text-slate-700"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </main>

        <div className="no-print fixed right-6 bottom-6 z-50 flex flex-col gap-3">
          <button onClick={downloadPDF} className="btn btn-primary rounded-full shadow-lg">
            📄 PDF
          </button>
          <button onClick={downloadDocx} className="btn btn-warning rounded-full shadow-lg">
            📁 DOCX
          </button>
        </div>
      </div>
    </div>
  );
}
