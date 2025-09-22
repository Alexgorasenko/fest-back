const paths = {
    create: require('./create'),
    signin: require('./signin'),
    assign_regions: require('./assign_regions'),
    init: require('./init'),
    queries_list: require('./queries_list'),
    queries_count: require('./queries_count'),
    query_item: require('./query_item'),
    remove_query: require('./remove_query'),
    apply_decision: require('./apply_decision'),
    patch_query: require('./patch_query'),
    report_activities: require('./report_activities'),
    load_query: require('./load_query'),
    available_samples: require('./available_samples'),
    report_queries: require('./report_queries'),
    users_count: require('./users_count'),
    report_emails: require('./report_emails'),
    fetch_users: require('./fetch_users'),
    patch: require('./patch'),
    resetpwd: require('./reset_pwd'),
    get_reports: require('./get_reports'),
    compose: require('./compose'),
    get_activity_report: require('./get_activity_report'),
    only_patch_query: require('./only_patch_query'),
    apply_activity_report: require('./apply_activity_report'),
    report_subject: require('./report_subject'),
    report_country: require('./report_country'),
    verify_init: require('./verify_init'),
    complete_init: require('./complete_init'),
    fix_attach_form_in_queries: require('./fix_attach_form_in_queries'),
    fest_board: require('./fest_board'),
    remove_doc: require('./remove_doc'),
    upload_doc: require('./upload_doc'),
    get_public_docs: require('./get_public_docs'),
    patch_doc: require('./patch_doc'),
    report_logs: require('./report_logs'),
    deactivate: require('./deactivate'),
    
}

module.exports = async (req, res) => {
    const { path } = req.params
    if (paths[path]) {
        await paths[path](req, res)
    } else {
        res.status(404).json({success: false, message: 'check rqst'})
    }

    return
}
