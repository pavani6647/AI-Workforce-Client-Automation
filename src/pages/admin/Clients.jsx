import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BackButton from "../../components/common/BackButton";
import {
  getStore,
  subscribeToStore,
  updateStore,
} from "../../data/store";

const emptyForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  industry: "",
  location: "",
  status: "Active",
  description: "",
};

function Clients() {
  const [store, setStore] = useState(() => getStore());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    return subscribeToStore(setStore);
  }, []);

  const clients = store.clients || [];
  const projects = store.projects || [];

  const industries = useMemo(() => {
    return [
      "All",
      ...new Set(
        clients
          .map((client) => client.industry)
          .filter(Boolean)
      ),
    ];
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        client.name?.toLowerCase().includes(searchValue) ||
        client.contactPerson
          ?.toLowerCase()
          .includes(searchValue) ||
        client.email?.toLowerCase().includes(searchValue) ||
        client.industry?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        client.status === statusFilter;

      const matchesIndustry =
        industryFilter === "All" ||
        client.industry === industryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesIndustry
      );
    });
  }, [
    clients,
    search,
    statusFilter,
    industryFilter,
  ]);

  const activeClients = clients.filter(
    (client) => client.status === "Active"
  ).length;

  const pendingClients = clients.filter(
    (client) => client.status === "Pending"
  ).length;

  const totalProjects = projects.filter((project) =>
    clients.some(
      (client) =>
        client.name === project.client
    )
  ).length;

  const getClientProjectCount = (clientName) => {
    return projects.filter(
      (project) => project.client === clientName
    ).length;
  };

  const openAddForm = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (client) => {
    setEditingClient(client);

    setForm({
      name: client.name || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      industry: client.industry || "",
      location: client.location || "",
      status: client.status || "Active",
      description: client.description || "",
    });

    setShowForm(true);
  };

  const openDetails = (client) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const closeModals = () => {
    setShowForm(false);
    setShowDetails(false);
    setEditingClient(null);
    setSelectedClient(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const clientName = form.name.trim();
    const contactPerson = form.contactPerson.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const industry = form.industry.trim();
    const location = form.location.trim();
    const description = form.description.trim();

    if (
      !clientName ||
      !contactPerson ||
      !email ||
      !phone ||
      !industry ||
      !location
    ) {
      return;
    }

    if (editingClient) {
      updateStore((current) => ({
        ...current,
        clients: (current.clients || []).map(
          (client) =>
            client.id === editingClient.id
              ? {
                  ...client,
                  name: clientName,
                  contactPerson,
                  email,
                  phone,
                  industry,
                  location,
                  status: form.status,
                  description,
                }
              : client
        ),
      }));
    } else {
      const newClient = {
        id: Date.now() + Math.random(),
        name: clientName,
        contactPerson,
        email,
        phone,
        industry,
        location,
        status: form.status,
        projects: 0,
        joinedDate: new Date().toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ),
        description,
      };

      updateStore((current) => ({
        ...current,
        clients: [
          newClient,
          ...(current.clients || []),
        ],
      }));
    }

    closeModals();
  };

  const handleDelete = (client) => {
    const confirmed = window.confirm(
      `Delete ${client.name}?`
    );

    if (!confirmed) {
      return;
    }

    updateStore((current) => ({
      ...current,
      clients: (current.clients || []).filter(
        (item) => item.id !== client.id
      ),
    }));

    if (selectedClient?.id === client.id) {
      closeModals();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-6">
            <BackButton />

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold text-blue-600">
                  Workforce Management
                </p>

                <h1 className="text-3xl font-bold text-slate-900">
                  Clients
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Manage client organizations, contacts and projects.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddForm}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Client
              </button>
            </div>
          </div>

          {/* SUMMARY */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Building2}
              title="Total Clients"
              value={clients.length}
            />

            <SummaryCard
              icon={CheckCircle2}
              title="Active Clients"
              value={activeClients}
            />

            <SummaryCard
              icon={BriefcaseBusiness}
              title="Total Projects"
              value={totalProjects}
            />

            <SummaryCard
              icon={Clock3}
              title="Pending Clients"
              value={pendingClients}
            />
          </div>

          {/* FILTERS */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search clients..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">
                  All Status
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>

              <select
                value={industryFilter}
                onChange={(event) =>
                  setIndustryFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {industries.map((industry) => (
                  <option
                    key={industry}
                    value={industry}
                  >
                    {industry === "All"
                      ? "All Industries"
                      : industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CLIENT TABLE */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Client Directory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing {filteredClients.length} of{" "}
                {clients.length} clients
              </p>
            </div>

            {filteredClients.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Search
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-semibold text-slate-800">
                  No clients found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500">
                        Client
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500">
                        Contact
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500">
                        Industry
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500">
                        Projects
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              openDetails(client)
                            }
                            className="flex items-center gap-3 text-left"
                          >
                            <ClientAvatar
                              name={client.name}
                            />

                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {client.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {client.location}
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {client.contactPerson}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {client.email}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                            {client.industry}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {getClientProjectCount(
                            client.name
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={client.status}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openDetails(client)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(client)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(client)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI SECTION */}

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BriefcaseBusiness size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  AI Client Automation
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  AI features such as requirement analysis,
                  proposal generation, client insights and
                  automated follow-ups will be connected later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                {editingClient
                  ? "Edit Client"
                  : "Add New Client"}
              </h2>

              <button
                type="button"
                onClick={closeModals}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">

                <InputField
                  label="Company Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="ABC Technologies"
                />

                <InputField
                  label="Contact Person"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="Rahul Mehta"
                />

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                />

                <InputField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />

                <InputField
                  label="Industry"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Technology"
                />

                <InputField
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Hyderabad, India"
                />

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Brief description about the client..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingClient
                    ? "Save Changes"
                    : "Add Client"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}

      {showDetails && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Client Details
              </h2>

              <button
                type="button"
                onClick={closeModals}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5 sm:p-6">

              <div className="flex items-center gap-4">
                <ClientAvatar
                  name={selectedClient.name}
                  large
                />

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedClient.name}
                  </h3>

                  <div className="mt-2">
                    <StatusBadge
                      status={selectedClient.status}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                <DetailItem
                  icon={Users}
                  label="Contact"
                  value={
                    selectedClient.contactPerson
                  }
                />

                <DetailItem
                  icon={BriefcaseBusiness}
                  label="Industry"
                  value={selectedClient.industry}
                />

                <DetailItem
                  icon={Mail}
                  label="Email"
                  value={selectedClient.email}
                />

                <DetailItem
                  icon={Phone}
                  label="Phone"
                  value={selectedClient.phone}
                />

                <DetailItem
                  icon={MapPin}
                  label="Location"
                  value={selectedClient.location}
                />

                <DetailItem
                  icon={BriefcaseBusiness}
                  label="Projects"
                  value={getClientProjectCount(
                    selectedClient.name
                  )}
                />

              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedClient.description ||
                    "No description provided."}
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    openEditForm(selectedClient);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Edit3 size={16} />
                  Edit Client
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={20} />
        </div>

      </div>
    </div>
  );
}

function ClientAvatar({
  name,
  large = false,
}) {
  const initials = (name || "Client")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700 ${
        large
          ? "h-14 w-14 text-base"
          : "h-10 w-10 text-xs"
      }`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    Inactive: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] || styles.Inactive
      }`}
    >
      {status}
    </span>
  );
}

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={15} />

        <p className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default Clients;