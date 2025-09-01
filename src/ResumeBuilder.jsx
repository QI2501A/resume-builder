import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Tailwind-updated Resume Builder
// NOTE: Ensure your project has Tailwind set up and that src/index.css contains:
// @tailwind base;
// @tailwind components;
// @tailwind utilities;
// Also add Inter font to your index.html:
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">

export default function ResumeBuilder() {
  const [form, setForm] = useState({
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

  const previewRef = useRef(null);

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

  async function downloadPDF() {
    const el = previewRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white font-sans text-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-1 bg-transparent rounded-2xl p-6 h-[calc(100vh-2rem)] sticky top-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Resume Builder</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fillSample}
                className="text-sm px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                Auto-fill
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <label className="block">
              <div className="text-sm text-slate-500 mb-1">
                {ICONS.name} Full name
              </div>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
              />
            </label>

            <label className="block">
              <div className="text-sm text-slate-500 mb-1">
                Professional title
              </div>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <div className="text-sm text-slate-500 mb-1">
                  {ICONS.phone} Phone
                </div>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
                />
              </label>
              <label>
                <div className="text-sm text-slate-500 mb-1">
                  {ICONS.email} Email
                </div>
                <input
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
                />
              </label>
            </div>

            <label>
              <div className="text-sm text-slate-500 mb-1">
                {ICONS.address} Address
              </div>
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <div className="text-sm text-slate-500 mb-1">
                  {ICONS.linkedin} LinkedIn
                </div>
                <input
                  value={form.linkedin}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                  className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
                />
              </label>
              <label>
                <div className="text-sm text-slate-500 mb-1">
                  {ICONS.github} GitHub
                </div>
                <input
                  value={form.github}
                  onChange={(e) => updateField("github", e.target.value)}
                  className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
                />
              </label>
            </div>

            <label>
              <div className="text-sm text-slate-500 mb-1">
                {ICONS.course} Course / Major
              </div>
              <input
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
                className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <div className="text-sm text-slate-500 mb-1">
                  {ICONS.gpa} GPA
                </div>
                <input
                  value={form.gpa}
                  onChange={(e) => updateField("gpa", e.target.value)}
                  className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
                />
              </label>
              <label>
                <div className="text-sm text-slate-500 mb-1">
                  {ICONS.summary} Short summary / objective
                </div>
                <input
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
                />
              </label>
            </div>

            <label>
              <div className="text-sm text-slate-500 mb-1">
                {ICONS.skills} Skills (comma / newline separated)
              </div>
              <textarea
                value={form.skillsInput}
                onChange={(e) => updateField("skillsInput", e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-white shadow-sm ring-1 ring-transparent focus:ring-2 focus:ring-indigo-200 border-transparent"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleSkillsCommit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow-sm"
                >
                  Save skills
                </button>
                <button
                  onClick={() =>
                    setForm((p) => ({ ...p, skillsInput: "", skills: [] }))
                  }
                  className="px-4 py-2 rounded-xl bg-white text-sm shadow-sm border border-slate-100"
                >
                  Clear
                </button>
              </div>
            </label>

            <section className="pt-2">
              <h3 className="font-medium text-slate-700 mb-2">Education</h3>
              {form.education.map((edu, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/90 ring-1 ring-slate-50 mb-3"
                >
                  <input
                    placeholder="School / Institute"
                    value={edu.school}
                    onChange={(e) =>
                      updateField(`education.${i}.school`, e.target.value)
                    }
                    className="w-full p-2 rounded-lg bg-white border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      placeholder="Degree / Diploma"
                      value={edu.degree}
                      onChange={(e) =>
                        updateField(`education.${i}.degree`, e.target.value)
                      }
                      className="w-full p-2 rounded-lg bg-white border-transparent"
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
                      className="w-full p-2 rounded-lg bg-white border-transparent"
                    />
                  </div>
                  <input
                    placeholder="Details (optional)"
                    value={edu.details}
                    onChange={(e) =>
                      updateField(`education.${i}.details`, e.target.value)
                    }
                    className="w-full p-2 rounded-lg bg-white border-transparent mt-2"
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
                <button
                  onClick={addEducation}
                  className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm shadow-sm"
                >
                  Add education
                </button>
              </div>
            </section>

            <section className="pt-3">
              <h3 className="font-medium text-slate-700 mb-2">
                Work Experience
              </h3>
              {form.experience.map((ex, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/90 ring-1 ring-slate-50 mb-3"
                >
                  <input
                    placeholder="Role"
                    value={ex.role}
                    onChange={(e) =>
                      updateField(`experience.${i}.role`, e.target.value)
                    }
                    className="w-full p-2 rounded-lg bg-white border-transparent mb-2"
                  />
                  <input
                    placeholder="Company"
                    value={ex.company}
                    onChange={(e) =>
                      updateField(`experience.${i}.company`, e.target.value)
                    }
                    className="w-full p-2 rounded-lg bg-white border-transparent mb-2"
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
                    className="w-full p-2 rounded-lg bg-white border-transparent mb-2"
                  />
                  <textarea
                    placeholder="Details / achievements (one per line)"
                    value={ex.details}
                    onChange={(e) =>
                      updateField(`experience.${i}.details`, e.target.value)
                    }
                    className="w-full p-2 rounded-lg bg-white border-transparent"
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
                <button
                  onClick={addExperience}
                  className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm shadow-sm"
                >
                  Add experience
                </button>
              </div>
            </section>

            <section className="pt-3">
              <h3 className="font-medium text-slate-700 mb-2">
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
                    className="flex-1 p-2 rounded-lg bg-white border-transparent"
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
                <button
                  onClick={addCertification}
                  className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm shadow-sm"
                >
                  Add certification
                </button>
              </div>
            </section>

            <div className="flex gap-3 mt-4">
              <button
                onClick={downloadPDF}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white"
              >
                Download PDF
              </button>
              <button
                onClick={downloadWord}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-white"
              >
                Download Word
              </button>
            </div>
          </div>
        </aside>

        {/* Preview */}
        <main className="col-span-12 md:col-span-1">
          <div className="bg-transparent p-2 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-slate-600 font-medium">Preview</h3>
              <div className="text-sm text-slate-400">
                What you see is exported
              </div>
            </div>

            <div
              id="resume-preview"
              ref={previewRef}
              className="w-full min-h-[70vh] bg-white p-12 rounded-none shadow-none"
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
                  <div>{form.phone}</div>
                  <div>{form.email}</div>
                  <div>{form.address}</div>
                  {form.linkedin && <div>LinkedIn: {form.linkedin}</div>}
                  {form.github && <div>GitHub: {form.github}</div>}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {form.summary && (
                    <section className="mb-4">
                      <h4 className="font-semibold text-slate-700">Profile</h4>
                      <p className="text-sm text-slate-700 mt-2">
                        {form.summary}
                      </p>
                    </section>
                  )}

                  <section className="mb-4">
                    <h4 className="font-semibold text-slate-700">
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
                                  <li key={idx}>{d}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )
                    )}
                  </section>

                  <section className="mb-4">
                    <h4 className="font-semibold text-slate-700">Education</h4>
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
                              <div className="text-sm text-slate-700 mt-1">
                                {edu.details}
                              </div>
                            )}
                          </div>
                        )
                    )}
                  </section>

                  <section>
                    <h4 className="font-semibold text-slate-700">
                      Certifications
                    </h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-2">
                      {form.certifications.filter(Boolean).length === 0 && (
                        <li className="text-slate-500">None added</li>
                      )}
                      {form.certifications.filter(Boolean).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <aside className="md:col-span-1">
                  <section className="mb-4">
                    <h4 className="font-semibold text-slate-700">Course</h4>
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
                    <h4 className="font-semibold text-slate-700">Skills</h4>
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

        <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
          <button
            onClick={downloadPDF}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white shadow-lg"
          >
            📄 PDF
          </button>
          <button
            onClick={downloadWord}
            className="px-4 py-2 rounded-full bg-amber-500 text-white shadow-lg"
          >
            📁 Word
          </button>
        </div>
      </div>
    </div>
  );
}
