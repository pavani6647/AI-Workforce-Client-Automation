import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  addNotification,
  getStore,
  updateStore,
} from "../../data/store";

function AITaskGenerator() {
  const navigate = useNavigate();

  const [project, setProject] = useState("");
  const [requirements, setRequirements] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [intern, setIntern] = useState("");

  const [generatedTask, setGeneratedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const store = useMemo(() => getStore(), []);

  const projects = store.projects || [];
  const interns = store.interns || [];

  const selectedProject = projects.find(
    (item) => item.name === project
  );

  const selectedIntern = interns.find(
    (item) => item.name === intern
  );

  const generateTask = async () => {
    if (!project.trim() || !requirements.trim()) {
      setError(
        "Please enter or select a project and enter the requirements."
      );
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedTask(null);
    setSaved(false);

    try {
      const response = await fetch("/api/generate-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
          requirements,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to generate task."
        );
      }

      setGeneratedTask(data);
    } catch (err) {
      console.error("AI Task Generator Error:", err);

      setError(
        err?.message || "Failed to generate task."
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateDueDate = (estimatedDays) => {
    const days = Number(estimatedDays) || 1;

    const date = new Date();
    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
  };

  const saveTask = () => {
    if (!generatedTask) {
      setError("Please generate a task first.");
      return;
    }

    if (!intern) {
      setError(
        "Please select an intern before saving the task."
      );
      return;
    }

    if (!selectedIntern) {
      setError(
        "The selected intern could not be found."
      );
      return;
    }

    const projectName =
      selectedProject?.name || project.trim();

    if (!projectName) {
      setError(
        "Please enter or select a project."
      );
      return;
    }

    const dueDate = calculateDueDate(
      generatedTask.estimatedDays
    );

    const newTask = {
      id: Date.now(),

      title: generatedTask.title,
      description: generatedTask.description,

      project: projectName,
      client: selectedProject?.client || "",

      intern: selectedIntern.name,

      status: "Pending",
      priority:
        generatedTask.priority || difficulty,

      dueDate,
      progress: 0,

      createdDate: new Date()
        .toISOString()
        .slice(0, 10),

      submission: "",
      feedback: "",

      estimatedDays:
        generatedTask.estimatedDays || 1,

      skills:
        generatedTask.skills || [],

      acceptanceCriteria:
        generatedTask.acceptanceCriteria || [],

      aiGenerated: true,
    };

    updateStore((current) => ({
      ...current,
      tasks: [
        ...(current.tasks || []),
        newTask,
      ],
    }));

    addNotification({
      recipientRole: "intern",
      recipient: selectedIntern.name,
      type: "task",
      title: "New AI-generated task assigned",
      message: `You have been assigned "${generatedTask.title}" in the ${projectName} project.`,
    });

    addNotification({
      recipientRole: "admin",
      recipient: "Admin",
      type: "task",
      title: "AI task created",
      message: `"${generatedTask.title}" was assigned to ${selectedIntern.name}.`,
    });

    setSaved(true);
    setError("");
  };

  const resetGenerator = () => {
    setGeneratedTask(null);
    setSaved(false);
    setError("");
    setIntern("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate("/admin")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <WandSparkles size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                AI Task Generator
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Generate structured development tasks from project
                requirements and assign them directly to interns.
              </p>
            </div>

          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* INPUT PANEL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Task Inputs
                </h2>

                <p className="text-xs text-slate-500">
                  Tell AI what needs to be built.
                </p>
              </div>

            </div>

            <div className="space-y-5">

              {/* PROJECT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Project
                </label>

                <input
                  list="project-options"
                  value={project}
                  onChange={(event) =>
                    setProject(event.target.value)
                  }
                  placeholder="Select or type a project name..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <datalist id="project-options">
                  {projects.map((item) => (
                    <option
                      key={item.id}
                      value={item.name}
                    />
                  ))}
                </datalist>

                <p className="mt-2 text-xs text-slate-400">
                  Select an existing project or type a new project name.
                </p>

              </div>

              {/* REQUIREMENTS */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Requirements
                </label>

                <textarea
                  value={requirements}
                  onChange={(event) =>
                    setRequirements(event.target.value)
                  }
                  placeholder="Describe what needs to be implemented..."
                  rows={7}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* DIFFICULTY */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>

              </div>

              {/* INTERN */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <UserRound size={16} />
                  Assign Intern
                </label>

                <select
                  value={intern}
                  onChange={(event) =>
                    setIntern(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Select an intern
                  </option>

                  {interns
                    .filter(
                      (item) =>
                        item.status === "Active"
                    )
                    .map((item) => (
                      <option
                        key={item.id}
                        value={item.name}
                      >
                        {item.name} — {item.role}
                      </option>
                    ))}

                </select>

                <p className="mt-2 text-xs text-slate-400">
                  The selected intern will receive the task
                  notification after saving.
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {/* GENERATE */}

              <button
                onClick={generateTask}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot size={18} />
                    Generate Task
                  </>
                )}

              </button>

            </div>
          </div>

          {/* RESULT PANEL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            {!generatedTask ? (

              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Bot size={30} />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-800">
                  No task generated yet
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Enter the project requirements and let AI
                  generate a structured task with priority,
                  estimated effort, skills and acceptance criteria.
                </p>

              </div>

            ) : (

              <div>

                {/* HEADER */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                  <div>

                    <div className="mb-3 flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        AI Generated
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {generatedTask.priority || difficulty}
                      </span>

                      {intern && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Assigned to {intern}
                        </span>
                      )}

                    </div>

                    <h2 className="text-2xl font-bold text-slate-900">
                      {generatedTask.title}
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      {generatedTask.description}
                    </p>

                  </div>

                  <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-center">

                    <p className="text-xs text-slate-500">
                      Estimated effort
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {generatedTask.estimatedDays || 1} days
                    </p>

                  </div>

                </div>

                {/* TASK DETAILS */}

                <div className="mt-8 grid gap-6 md:grid-cols-2">

                  {/* SKILLS */}

                  <div className="rounded-xl border border-slate-200 p-5">

                    <h3 className="font-semibold text-slate-900">
                      Required Skills
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {generatedTask.skills?.length ? (
                        generatedTask.skills.map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-400">
                          No skills specified.
                        </span>
                      )}

                    </div>

                  </div>

                  {/* ACCEPTANCE CRITERIA */}

                  <div className="rounded-xl border border-slate-200 p-5">

                    <h3 className="font-semibold text-slate-900">
                      Acceptance Criteria
                    </h3>

                    <div className="mt-4 space-y-3">

                      {generatedTask.acceptanceCriteria?.length ? (
                        generatedTask.acceptanceCriteria.map(
                          (criterion, index) => (
                            <div
                              key={`${criterion}-${index}`}
                              className="flex gap-3 text-sm text-slate-600"
                            >

                              <CheckCircle2
                                size={17}
                                className="mt-0.5 shrink-0 text-emerald-500"
                              />

                              <span>{criterion}</span>

                            </div>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-400">
                          No acceptance criteria generated.
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                {/* ASSIGNMENT SUMMARY */}

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <WandSparkles size={15} />
                      Project
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedProject?.name || project}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <UserRound size={15} />
                      Assigned Intern
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedIntern?.name || "Not assigned"}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarDays size={15} />
                      Suggested Deadline
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {calculateDueDate(
                        generatedTask.estimatedDays
                      )}
                    </p>

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

                  <button
                    onClick={resetGenerator}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Generate Another
                  </button>

                  <button
                    onClick={saveTask}
                    disabled={saved || !intern}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saved
                      ? "Saved & Assigned"
                      : "Save & Assign Task"}
                  </button>

                </div>

                {!intern && !saved && (
                  <p className="mt-3 text-center text-xs text-amber-600">
                    Select an intern from the left panel before
                    saving the generated task.
                  </p>
                )}

                {saved && (
                  <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-700 sm:flex-row">

                    <CheckCircle2 size={18} />

                    <span>
                      Task successfully added to the Task
                      Management system and assigned to{" "}
                      <strong>{selectedIntern?.name}</strong>.
                    </span>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default AITaskGenerator;
