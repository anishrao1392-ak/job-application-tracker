import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    JobApplication,
    JobApplicationCreate,
    JobApplicationPublic,
    JobApplicationsPublic,
    JobApplicationUpdate,
)

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


@router.get("/", response_model=JobApplicationsPublic)
def read_job_applications(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> JobApplicationsPublic:
    count_statement = (
        select(func.count())
        .select_from(JobApplication)
        .where(JobApplication.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(JobApplication)
        .where(JobApplication.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    job_applications = session.exec(statement).all()

    return JobApplicationsPublic(data=job_applications, count=count)


@router.post("/", response_model=JobApplicationPublic)
def create_job_application(
    *, session: SessionDep, current_user: CurrentUser, job_application_in: JobApplicationCreate
) -> JobApplication:
    job_application = JobApplication.model_validate(
        job_application_in, update={"owner_id": current_user.id}
    )
    session.add(job_application)
    session.commit()
    session.refresh(job_application)
    return job_application


@router.get("/{id}", response_model=JobApplicationPublic)
def read_job_application(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> JobApplication:
    job_application = session.get(JobApplication, id)
    if not job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    if job_application.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return job_application


@router.patch("/{id}", response_model=JobApplicationPublic)
def update_job_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    job_application_in: JobApplicationUpdate,
) -> JobApplication:
    job_application = session.get(JobApplication, id)
    if not job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    if job_application.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_dict = job_application_in.model_dump(exclude_unset=True)
    job_application.sqlmodel_update(update_dict)
    session.add(job_application)
    session.commit()
    session.refresh(job_application)
    return job_application


@router.delete("/{id}")
def delete_job_application(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> dict[str, str]:
    job_application = session.get(JobApplication, id)
    if not job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    if job_application.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    session.delete(job_application)
    session.commit()
    return {"message": "Job application deleted successfully"}