"""Add job link to job applications

Revision ID: 05885ab55e99
Revises: 1719911973e7
Create Date: 2026-06-10 23:40:24.998597

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '05885ab55e99'
down_revision = '1719911973e7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "jobapplication",
        sa.Column("job_link", sa.String(length=500), nullable=True),
    )


def downgrade():
    op.drop_column("jobapplication", "job_link")
