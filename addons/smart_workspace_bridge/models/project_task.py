from odoo import api, fields, models
from odoo.exceptions import UserError, AccessError


class ProjectTask(models.Model):
    _inherit = 'project.task'

    workspace_revision = fields.Char(compute='_compute_workspace_revision')

    @api.depends('write_date')
    def _compute_workspace_revision(self):
        for task in self:
            task.workspace_revision = task.write_date.isoformat(timespec='microseconds') if task.write_date else ''

    def workspace_write(self, expected_revision, values):
        """Atomic optimistic update; never elevates the caller's privileges."""
        self.ensure_one()
        self.check_access_rights('write')
        self.check_access_rule('write')
        allowed = {'name', 'description', 'user_ids', 'stage_id', 'state', 'date_deadline', 'priority'}
        if not values or not set(values).issubset(allowed):
            raise AccessError('Unsupported workspace update')
        # SQL only locks a record already checked through the ORM. All writes use ORM.
        self.env.cr.execute('SELECT id FROM project_task WHERE id = %s FOR UPDATE', [self.id])
        self.invalidate_recordset()
        self.check_access_rule('write')
        if self.workspace_revision != expected_revision:
            raise UserError('WORKSPACE_CONFLICT')
        self.write(values)
        return True
