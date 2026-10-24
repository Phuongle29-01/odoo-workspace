import unicodedata
from odoo import api, fields, models


def normalized_name(value):
    text = unicodedata.normalize('NFD', value or '')
    return ''.join(c for c in text if unicodedata.category(c) != 'Mn').replace('đ', 'd').replace('Đ', 'D').lower()


class ProjectTask(models.Model):
    _inherit = 'project.task'

    workspace_search_name = fields.Char(
        compute='_compute_workspace_search_name', store=True,
        index='trigram', compute_sudo=False,
    )

    @api.depends('name')
    def _compute_workspace_search_name(self):
        for task in self:
            task.workspace_search_name = normalized_name(task.name)


class ProjectProject(models.Model):
    _inherit = 'project.project'

    workspace_search_name = fields.Char(
        compute='_compute_workspace_search_name', store=True,
        index='trigram', compute_sudo=False,
    )

    @api.depends('name')
    def _compute_workspace_search_name(self):
        for project in self:
            project.workspace_search_name = normalized_name(project.name)
