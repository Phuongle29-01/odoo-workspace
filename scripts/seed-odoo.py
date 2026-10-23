"""Fixtures for the hardcoded disposable database only. Never connects to a remote URL."""
import json
import os
import odoo
from odoo import api, SUPERUSER_ID

odoo.tools.config.parse_config([
    '--db_host=db', '--db_user=workspace', '--db_password=' + os.environ['PASSWORD'],
    '--addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons',
])
registry = odoo.registry('workspace_test')
with registry.cursor() as cr:
    env = api.Environment(cr, SUPERUSER_ID, {})
    env.ref('base.user_admin').write({'password': os.environ['LOCAL_ODOO_ADMIN_PASSWORD']})
    groups = [env.ref('base.group_user').id, env.ref('project.group_project_user').id]
    users = []
    for key, name in [('A', 'Nguyễn Minh Anh'), ('B', 'Trần Quốc Bảo')]:
        login = 'workspace.' + key.lower() + '@example.test'
        user = env['res.users'].with_context(no_reset_password=True).search([('login', '=', login)], limit=1)
        if not user:
            user = env['res.users'].with_context(no_reset_password=True).create({'name': name, 'login': login, 'email': login, 'groups_id': [(6, 0, groups)]})
        user.write({'password': os.environ['LOCAL_TEST_PASSWORD_' + key]})
        users.append(user)
    stored = env['ir.config_parameter'].sudo().get_param('workspace.fixture')
    if stored:
        print('Local fixtures already exist; tasks and discussions preserved.')
    else:
        stage = env['project.task.type'].create({'name': 'Đang thực hiện', 'sequence': 10})
        projects = [env['project.project'].create({'name': n, 'privacy_visibility': 'employees', 'type_ids': [(4, stage.id)]}) for n in ['Tòa nhà A', 'Nhà máy B']]
        private = env['project.project'].create({'name': 'Hồ sơ hạn chế', 'privacy_visibility': 'followers', 'user_id': users[0].id, 'type_ids': [(4, stage.id)]})
        private.message_subscribe(partner_ids=[users[0].partner_id.id])
        parent = env['project.task'].create({'name': 'Rà soát hồ sơ', 'project_id': projects[0].id, 'stage_id': stage.id, 'user_ids': [(6, 0, [users[0].id])]})
        child = env['project.task'].create({'name': 'Kiểm tra hồ sơ thiết kế', 'parent_id': parent.id, 'project_id': projects[1].id, 'stage_id': stage.id, 'user_ids': [(6, 0, [users[0].id, users[1].id])], 'description': '<p>Đối chiếu bản vẽ và lập danh sách nội dung cần bổ sung.</p>'})
        duplicates = [env['project.task'].create({'name': 'Kiểm tra hồ sơ', 'project_id': p.id, 'stage_id': stage.id}) for p in projects]
        secret = env['project.task'].create({'name': 'Kiểm tra hồ sơ mật', 'project_id': private.id, 'stage_id': stage.id, 'user_ids': [(6, 0, [users[0].id])]})
        child.message_post(body='Đã nhận hồ sơ. Vui lòng kiểm tra hạng mục kỹ thuật.', message_type='comment', subtype_xmlid='mail.mt_comment')
        env['mail.activity'].create({'res_model_id': env['ir.model']._get_id('project.task'), 'res_id': child.id, 'user_id': users[0].id, 'summary': 'Rà soát bản vẽ', 'activity_type_id': env.ref('mail.mail_activity_data_todo').id})
        ids = {'parent': parent.id, 'child': child.id, 'secret': secret.id, 'duplicates': [t.id for t in duplicates], 'projects': [p.id for p in projects], 'users': [u.id for u in users]}
        env['ir.config_parameter'].sudo().set_param('workspace.fixture', json.dumps(ids))
        print('Created isolated local projects, cross-project subtask, duplicate names and private task.')
    cr.commit()
print('Local Odoo test accounts ready. Passwords are available only in .env.local.')
