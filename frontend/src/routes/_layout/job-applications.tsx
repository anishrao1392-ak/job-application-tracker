import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search, Trash2 } from "lucide-react"
import { Suspense, useMemo, useState } from "react"

import { JobApplicationsService } from "@/client"
import AddJobApplication from "@/components/JobApplications/AddJobApplication"
import EditJobApplication from "@/components/JobApplications/EditJobApplication"
import PendingItems from "@/components/Pending/PendingItems"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

function getJobApplicationsQueryOptions() {
  return {
    queryFn: () =>
      JobApplicationsService.readJobApplications({ skip: 0, limit: 100 }),
    queryKey: ["job-applications"],
  }
}

export const Route = createFileRoute("/_layout/job-applications")({
  component: JobApplications,
  head: () => ({
    meta: [{ title: "Job Applications - FastAPI Template" }],
  }),
})

function getStatusBadgeVariant(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("interview")) return "secondary"
  if (normalizedStatus.includes("offer")) return "default"
  if (normalizedStatus.includes("reject")) return "destructive"

  return "outline"
}

function JobApplicationsContent() {
  const { data } = useSuspenseQuery(getJobApplicationsQueryOptions())
  const [searchText, setSearchText] = useState("")
  const [sortField, setSortField] = useState("company_name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const handleSort = (field: string) => {
  if (sortField === field) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  } else {
    setSortField(field)
    setSortDirection("asc")
  }
}
  const today = new Date().toISOString().split("T")[0]
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      JobApplicationsService.deleteJobApplication({ id }),
    onSuccess: () => {
      showSuccessToast("Job application deleted successfully")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] })
    },
  })

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job application?",
    )

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const filteredJobs = data.data.filter((job) => {
    const searchValue = searchText.toLowerCase()
    const matchesSearch =
      job.company_name?.toLowerCase().includes(searchValue) ||
      job.job_title?.toLowerCase().includes(searchValue) ||
      job.portal?.toLowerCase().includes(searchValue) ||
      job.status?.toLowerCase().includes(searchValue)

    const matchesStatus =
      selectedStatus === "All" ||
      job.status?.toLowerCase().includes(selectedStatus.toLowerCase())

    return matchesSearch && matchesStatus
  })

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      const aValue = String(a[sortField as keyof typeof a] ?? "")
      const bValue = String(b[sortField as keyof typeof b] ?? "")

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue)
      }

      return bValue.localeCompare(aValue)
    })
  }, [filteredJobs, sortField, sortDirection])

  const appliedCount = data.data.filter(
  (job) => job.status?.toLowerCase() === "applied",
  ).length

  const interviewCount = data.data.filter(
  (job) => job.status?.toLowerCase().includes("interview"),
  ).length

  const offerCount = data.data.filter(
  (job) => job.status?.toLowerCase().includes("offer"),
  ).length

  const rejectedCount = data.data.filter(
  (job) => job.status?.toLowerCase().includes("reject"),
  ).length

  const followUpTodayCount = data.data.filter(
  (job) => job.follow_up_date === today,
  ).length

  const overdueCount = data.data.filter(
  (job) =>
    job.follow_up_date &&
    job.follow_up_date < today,
  ).length

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          You don't have any job applications yet
        </h3>
        <p className="text-muted-foreground">
          Add a new job application to get started.
        </p>
      </div>
    )
  }

  return (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Applied</p>
        <p className="text-2xl font-bold">{appliedCount}</p>
      </div>

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Interview</p>
        <p className="text-2xl font-bold">{interviewCount}</p>
      </div>

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Offer</p>
        <p className="text-2xl font-bold">{offerCount}</p>
      </div>

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Rejected</p>
        <p className="text-2xl font-bold">{rejectedCount}</p>
      </div>

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Follow Up Today</p>
        <p className="text-2xl font-bold">{followUpTodayCount}</p>
      </div>

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Overdue</p>
        <p className="text-2xl font-bold">{overdueCount}</p>
      </div>
    </div>

    <input
        type="text"
        placeholder="Search company, title, portal, or status..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        className="w-full rounded-md border px-3 py-2"
      />
      <div className="flex flex-wrap gap-2">
          {["All", "Applied", "Interview", "Offer", "Rejected"].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </Button>
          ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No matching applications</h3>
          <p className="text-muted-foreground">
            Try searching with a different company, title, portal, or status.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">
                  <button onClick={() => handleSort("company_name")}>
                    Company {sortField === "company_name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="p-3 text-left">
                  <button onClick={() => handleSort("job_title")}>
                    Job Title {sortField === "job_title" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="p-3 text-left">Portal</th>
                <th className="p-3 text-left">
                  <button onClick={() => handleSort("status")}>
                    Status {sortField === "status" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="p-3 text-left">
                  <button onClick={() => handleSort("applied_date")}>
                    Applied Date {sortField === "applied_date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="p-3 text-left">Follow Up</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="p-3">{job.company_name}</td>
                  <td className="p-3">{job.job_title}</td>
                  <td className="p-3">{job.portal}</td>
                  <td className="p-3">
                    <Badge variant={getStatusBadgeVariant(job.status ?? "Applied")}>
                      {job.status ?? "Applied"}
                    </Badge>
                  </td>
                  <td className="p-3">{job.applied_date}</td>
                  <td className="p-3">{job.follow_up_date}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <EditJobApplication job={job} />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(job.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function JobApplications() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Job Applications
          </h1>
          <p className="text-muted-foreground">
            Track companies, roles, portals, statuses, and follow-ups
          </p>
        </div>

        <AddJobApplication />
      </div>

      <Suspense fallback={<PendingItems />}>
        <JobApplicationsContent />
      </Suspense>
    </div>
  )
}