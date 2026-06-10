import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"

import { JobApplicationsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

type Props = {
  job: any
}

const EditJobApplication = ({ job }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [companyName, setCompanyName] = useState(job.company_name)
  const [jobTitle, setJobTitle] = useState(job.job_title)
  const [status, setStatus] = useState(job.status)

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () =>
      JobApplicationsService.updateJobApplication({
        id: job.id,
        requestBody: {
          company_name: companyName,
          job_title: jobTitle,
          status,
        },
      }),
    onSuccess: () => {
      showSuccessToast("Job application updated successfully")
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] })
    },
  })

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Application</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Company Name"
            />

            <Input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Job Title"
            />

            <Input
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              placeholder="Status"
            />

            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EditJobApplication