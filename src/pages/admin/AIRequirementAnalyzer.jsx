import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FolderKanban,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/common/BackButton";
import {
  addNotification,
  getStore,
  subscribeToStore,
  updateStore,
} from "../../data/store";

const emptyProjectForm = {
  name: "",
  client: "",
  priority: "Medium",
  startDate: new Date().toISOString().split("T")[0],
  deadline: "",
};

function AIRequirementAnalyzer() {
  const navigate = useNavigate();

  const [store, setStore] = useState(getStore());

  const [requirement, setRequirement] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const [projectModal, setProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  const [selectedTasks, setSelectedTasks] = useState({});
  const [taskAssignees, setTaskAssignees] = useState({});

  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return subscribeToStore(setStore);
  }, []);

  const clients = store.clients || [];
  const interns = store.interns || [];
  const projects = store.projects || [];

  const suggestedTasks = useMemo(() => {
    if (!analysis?.suggestedTasks) return [];

    if (Array.isArray(analysis.suggestedTasks)) {
      return analysis.suggestedTasks;
    }

    return [];
  }, [analysis]);

  const selectedTaskList = suggestedTasks.filter(
    (_, index) => selectedTasks[index],
  );

  const analyzeRequirement = async () => {
    if (!requirement.trim()) {
      setErrorMessage("Please enter the client requirement first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/analyze-requirement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement: requirement.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to analyze the requirement.",
        );
      }

      setAnalysis(data);

      const initialSelection = {};
      const initialAssignees = {};

      (data.suggestedTasks || []).forEach((task, index) => {
        initialSelection[index] = true;
        initialAssignees[index] = interns[0]?.name || "";
      });

      setSelectedTasks(initialSelection);
      setTaskAssignees(initialAssignees);

      setSuccessMessage("Requirement analyzed successfully.");
    } catch (error) {
      setErrorMessage(
        error.message || "Something went wrong while analyzing.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openProjectModal = () => {
    if (!analysis) {
      setErrorMessage("Analyze a requirement before creating a project.");
      return;
    }

    const defaultClient = clients[0]?.name || "";

    setProjectForm({
      name: createProjectName(analysis),
      client: defaultClient,
      priority: "Medium",
      startDate: new Date().toISOString().split("T")[0],
      deadline: "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setProjectModal(true);
  };

  const closeProjectModal = () => {
    if (creatingProject || creatingTasks) return;

    setProjectModal(false);
  };

  const handleProjectChange = (event) => {
    const { name, value } = event.target;

    setProjectForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createProject = async (event) => {
    event.preventDefault();

    if (!projectForm.name.trim()) {
      setErrorMessage("Project name is required.");
      return;
    }

    if (!projectForm.client.trim()) {
      setErrorMessage("Please select a client.");
      return;
    }

    setCreatingProject(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let createdProject = null;

      updateStore((current) => {
        const existingProject = (current.projects || []).find(
          (project) =>
            project.name.trim().toLowerCase() ===
              projectForm.name.trim().toLowerCase() &&
            project.client.trim().toLowerCase() ===
              projectForm.client.trim().toLowerCase(),
        );

        if (existingProject) {
          createdProject = existingProject;

          return current;
        }

        createdProject = {
          id: `project-${Date.now()}`,
          name: projectForm.name.trim(),
          client: projectForm.client.trim(),
          description:
            analysis.summary ||
            requirement.trim(),
          priority: projectForm.priority,
          status: "Planning",
          startDate: projectForm.startDate,
          deadline: projectForm.deadline,
          progress: 0,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
          sourceRequirement: requirement.trim(),
        };

        return {
          ...current,
          projects: [
            createdProject,
            ...(current.projects || []),
          ],
        };
      });

      if (!createdProject) {
        throw new Error("Project could not be created.");
      }

      const tasksToCreate = selectedTaskList;

      if (tasksToCreate.length > 0) {
        setCreatingTasks(true);

        updateStore((current) => {
          const currentTasks = current.tasks || [];

          const newTasks = tasksToCreate.map((task, selectedIndex) => {
            const originalIndex = suggestedTasks.indexOf(task);

            const assignedIntern =
              taskAssignees[originalIndex] ||
              interns[0]?.name ||
              "";

            const priority = normalizePriority(task.priority);

            return {
              id: `task-ai-${Date.now()}-${selectedIndex}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

              title:
                task.title ||
                task.name ||
                `AI Generated Task ${selectedIndex + 1}`,

              description:
                task.description ||
                task.details ||
                "Task generated from AI requirement analysis.",

              projectId: createdProject.id,
              project: createdProject.name,
              client: createdProject.client,

              intern: assignedIntern,
              assignedTo: assignedIntern,

              status: "Pending",
              priority,

              dueDate: calculateTaskDueDate(
                projectForm.startDate,
                projectForm.deadline,
                task.estimatedDays,
                selectedIndex,
              ),

              progress: 0,

              createdDate: new Date()
                .toISOString()
                .split("T")[0],

              submission: "",
              feedback: "",

              estimatedDays:
                Number(task.estimatedDays) || 1,

              skills: Array.isArray(task.skills)
                ? task.skills
                : [],

              acceptanceCriteria: Array.isArray(
                task.acceptanceCriteria,
              )
                ? task.acceptanceCriteria
                : [],

              aiGenerated: true,
              generatedFromRequirement: true,
            };
          });

          return {
            ...current,
            tasks: [
              ...newTasks,
              ...currentTasks,
            ],
          };
        });
      }

      addNotification({
        recipientRole: "admin",
        recipient: "Admin",
        type: "project",
        title: "AI project created",
        message: `"${createdProject.name}" was created from the AI Requirement Analyzer.`,
      });

      if (tasksToCreate.length > 0) {
        interns.forEach((intern) => {
          const hasTask = tasksToCreate.some((task) => {
            const originalIndex = suggestedTasks.indexOf(task);

            return (
              (taskAssignees[originalIndex] ||
                interns[0]?.name) === intern.name
            );
          });

          if (hasTask) {
            addNotification({
              recipientRole: "intern",
              recipient: intern.name,
              type: "task",
              title: "AI-generated task assigned",
              message: `You have received a new AI-generated task for "${createdProject.name}".`,
            });
          }
        });
      }

      setProjectModal(false);
      setSuccessMessage(
        tasksToCreate.length
          ? `Project created with ${tasksToCreate.length} AI-generated task${
              tasksToCreate.length === 1 ? "" : "s"
            }.`
          : "Project created successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error.message || "Failed to create the project.",
      );
    } finally {
      setCreatingProject(false);
      setCreatingTasks(false);
    }
  };

  const toggleTask = (index) => {
    setSelectedTasks((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  const selectAllTasks = () => {
    const next = {};

    suggestedTasks.forEach((_, index) => {
      next[index] = true;
    });

    setSelectedTasks(next);
  };

  const deselectAllTasks = () => {
    setSelectedTasks({});
  };

  const updateTaskAssignee = (index, intern) => {
    setTaskAssignees((previous) => ({
      ...previous,
      [index]: intern,
    }));
  };

  const clearAnalysis = () => {
    setRequirement("");
    setAnalysis(null);
    setSelectedTasks({});
    setTaskAssignees({});
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <BackButton />

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Sparkles size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  AI Requirement Analyzer
                </h1>

                <p className="text-sm text-slate-500">
                  Convert client requirements into structured project
                  requirements and actionable tasks.
                </p>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearAnalysis}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <X size={17} />
                Clear
              </button>

              <button
                onClick={openProjectModal}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FolderKanban size={17} />
                Create Project
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <ClipboardCheck
              size={19}
              className="text-blue-600"
            />

            <h2 className="font-semibold text-slate-900">
              Client Requirement
            </h2>
          </div>

          <textarea
            value={requirement}
            onChange={(event) =>
              setRequirement(event.target.value)
            }
            placeholder="Paste or enter the client's requirement here...

Example:
The client needs a web-based workforce management system where administrators can manage interns, assign tasks, track progress and generate project reports."
            rows={8}
            className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              {requirement.length} characters
            </p>

            <button
              onClick={analyzeRequirement}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Requirement
                </>
              )}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="mt-6 space-y-6">
            <Section
              icon={<Sparkles size={19} />}
              title="Requirement Summary"
            >
              <p className="text-sm leading-7 text-slate-600">
                {analysis.summary ||
                  "No summary was returned."}
              </p>
            </Section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section
                icon={<ListChecks size={19} />}
                title="Functional Requirements"
              >
                <RequirementList
                  items={analysis.functionalRequirements}
                />
              </Section>

              <Section
                icon={<CheckCircle2 size={19} />}
                title="Non-Functional Requirements"
              >
                <RequirementList
                  items={analysis.nonFunctionalRequirements}
                />
              </Section>
            </div>

            <Section
              icon={<ClipboardCheck size={19} />}
              title="MoSCoW Priorities"
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <PriorityBox
                  title="Must Have"
                  items={analysis.priorities?.must}
                />

                <PriorityBox
                  title="Should Have"
                  items={analysis.priorities?.should}
                />

                <PriorityBox
                  title="Could Have"
                  items={analysis.priorities?.could}
                />

                <PriorityBox
                  title="Won't / Later"
                  items={
                    analysis.priorities?.wont ||
                    analysis.priorities?.wontHave ||
                    []
                  }
                />
              </div>
            </Section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section
                icon={<Sparkles size={19} />}
                title="Suggested Tech Stack"
              >
                <TechStack
                  items={analysis.techStack}
                />
              </Section>

              <Section
                icon={<AlertTriangle size={19} />}
                title="Potential Risks"
              >
                <RequirementList
                  items={analysis.risks}
                  emptyText="No major risks identified."
                />
              </Section>
            </div>

            <TaskGenerationSection
              tasks={suggestedTasks}
              selectedTasks={selectedTasks}
              taskAssignees={taskAssignees}
              interns={interns}
              toggleTask={toggleTask}
              selectAllTasks={selectAllTasks}
              deselectAllTasks={deselectAllTasks}
              updateTaskAssignee={updateTaskAssignee}
              openProjectModal={openProjectModal}
            />

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Ready to turn this analysis into a project?
                  </p>

                  <p className="mt-1 text-sm text-blue-700">
                    Create a project and automatically add the selected
                    AI-generated tasks.
                  </p>
                </div>

                <button
                  onClick={openProjectModal}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Create Project & Tasks
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {projectModal && (
        <ProjectCreationModal
          form={projectForm}
          clients={clients}
          selectedTaskCount={selectedTaskList.length}
          creating={creatingProject || creatingTasks}
          onChange={handleProjectChange}
          onClose={closeProjectModal}
          onSubmit={createProject}
        />
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>

        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function RequirementList({
  items,
  emptyText = "No items returned.",
}) {
  if (!Array.isArray(items) || !items.length) {
    return (
      <p className="text-sm text-slate-400">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${index}-${String(item)}`}
          className="flex gap-3 text-sm leading-6 text-slate-600"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span>
            {typeof item === "string"
              ? item
              : item?.description ||
                item?.requirement ||
                item?.title ||
                JSON.stringify(item)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PriorityBox({ title, items }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">
        {title}
      </p>

      <div className="mt-3">
        <RequirementList
          items={items}
          emptyText="None"
        />
      </div>
    </div>
  );
}

function TechStack({ items }) {
  if (!items) {
    return (
      <p className="text-sm text-slate-400">
        No technology recommendations returned.
      </p>
    );
  }

  if (Array.isArray(items)) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${index}-${String(item)}`}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {typeof item === "string"
              ? item
              : item?.name || item?.technology || JSON.stringify(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof items === "object") {
    return (
      <div className="space-y-3">
        {Object.entries(items).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl bg-slate-50 p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {key}
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {Array.isArray(value)
                ? value.join(", ")
                : String(value)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-600">
      {String(items)}
    </p>
  );
}

function TaskGenerationSection({
  tasks,
  selectedTasks,
  taskAssignees,
  interns,
  toggleTask,
  selectAllTasks,
  deselectAllTasks,
  updateTaskAssignee,
  openProjectModal,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ListChecks size={19} />
              </div>

              <h2 className="font-semibold text-slate-900">
                AI Suggested Tasks
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Select the tasks you want to add to the project and assign
              them to interns.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAllTasks}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Select All
            </button>

            <button
              onClick={deselectAllTasks}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>

            <button
              onClick={openProjectModal}
              disabled={!tasks.length}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FolderKanban size={15} />
              Create Project
            </button>
          </div>
        </div>
      </div>

      {!tasks.length ? (
        <div className="p-10 text-center">
          <ListChecks
            size={38}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-600">
            No suggested tasks were returned.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {tasks.map((task, index) => {
            const selected = Boolean(selectedTasks[index]);

            const title =
              task.title ||
              task.name ||
              `Suggested Task ${index + 1}`;

            const description =
              task.description ||
              task.details ||
              "No task description provided.";

            const priority = normalizePriority(task.priority);

            return (
              <div
                key={`${title}-${index}`}
                className={`p-5 transition ${
                  selected
                    ? "bg-blue-50/30"
                    : "bg-white"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <button
                    onClick={() => toggleTask(index)}
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                    aria-label={`Select ${title}`}
                  >
                    {selected && (
                      <CheckCircle2 size={15} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          priority === "High"
                            ? "bg-red-50 text-red-700"
                            : priority === "Low"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {priority}
                      </span>

                      {task.estimatedDays && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          <CalendarDays size={12} />
                          {task.estimatedDays} day
                          {Number(task.estimatedDays) === 1
                            ? ""
                            : "s"}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {description}
                    </p>

                    {Array.isArray(task.skills) &&
                      task.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.skills.map((skill, skillIndex) => (
                            <span
                              key={`${skill}-${skillIndex}`}
                              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                    {Array.isArray(
                      task.acceptanceCriteria,
                    ) &&
                      task.acceptanceCriteria.length > 0 && (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Acceptance Criteria
                          </p>

                          <ul className="mt-2 space-y-1.5">
                            {task.acceptanceCriteria.map(
                              (criterion, criterionIndex) => (
                                <li
                                  key={criterionIndex}
                                  className="flex gap-2 text-xs leading-5 text-slate-600"
                                >
                                  <span>•</span>
                                  <span>
                                    {typeof criterion ===
                                    "string"
                                      ? criterion
                                      : criterion?.description ||
                                        criterion?.title ||
                                        JSON.stringify(
                                          criterion,
                                        )}
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  <div className="w-full lg:w-56">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Assign Intern
                    </label>

                    <div className="relative">
                      <Users
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        value={taskAssignees[index] || ""}
                        onChange={(event) =>
                          updateTaskAssignee(
                            index,
                            event.target.value,
                          )
                        }
                        disabled={!selected}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {!interns.length && (
                          <option value="">
                            No interns available
                          </option>
                        )}

                        {interns.map((intern) => (
                          <option
                            key={intern.id}
                            value={intern.name}
                          >
                            {intern.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">
                {Object.values(selectedTasks).filter(Boolean).length}
              </span>{" "}
              of {tasks.length} tasks selected
            </p>

            <button
              onClick={openProjectModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Create Project with Selected Tasks
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProjectCreationModal({
  form,
  clients,
  selectedTaskCount,
  creating,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Create Project from AI Analysis
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              The project and selected AI tasks will be added to your
              workspace.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={creating}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Project Name">
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="form-input"
                placeholder="Enter project name"
                required
              />
            </FormField>

            <FormField label="Client">
              <select
                name="client"
                value={form.client}
                onChange={onChange}
                className="form-input"
                required
              >
                <option value="">Select client</option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.name}
                  >
                    {client.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Priority">
            <select
              name="priority"
              value={form.priority}
              onChange={onChange}
              className="form-input"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Start Date">
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={onChange}
                className="form-input"
              />
            </FormField>

            <FormField label="Deadline">
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={onChange}
                className="form-input"
              />
            </FormField>
          </div>

          <div className="rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600">
                <ListChecks size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  AI Tasks Selected
                </p>

                <p className="text-xs text-blue-700">
                  {selectedTaskCount} task
                  {selectedTaskCount === 1 ? "" : "s"} will be
                  created with this project.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <FolderKanban size={17} />
                  Create Project & Tasks
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function createProjectName(analysis) {
  const summary = String(analysis?.summary || "").trim();

  if (!summary) {
    return "AI Generated Project";
  }

  const cleaned = summary
    .replace(/\s+/g, " ")
    .replace(/[.!?].*$/, "")
    .trim();

  if (cleaned.length <= 55) {
    return cleaned;
  }

  return `${cleaned.slice(0, 52)}...`;
}

function normalizePriority(priority) {
  const value = String(priority || "")
    .trim()
    .toLowerCase();

  if (value === "high") return "High";
  if (value === "low") return "Low";

  return "Medium";
}

function calculateTaskDueDate(
  startDate,
  projectDeadline,
  estimatedDays,
  taskIndex,
) {
  if (projectDeadline) {
    return projectDeadline;
  }

  const baseDate = startDate
    ? new Date(`${startDate}T00:00:00`)
    : new Date();

  const days =
    Number(estimatedDays) > 0
      ? Number(estimatedDays)
      : taskIndex + 1;

  baseDate.setDate(baseDate.getDate() + days);

  return baseDate.toISOString().split("T")[0];
}

export default AIRequirementAnalyzer;