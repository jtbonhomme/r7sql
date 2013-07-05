select 
        db_remine.journals.journalized_id,
        db_remine.journals.created_on,
        db_remine.journal_details.old_value,
        db_remine.journal_details.value,
        db_remine.issues.subject, 
        db_remine.issues.created_on 
    from 
        db_remine.issues,
        db_remine.journals,
        db_remine.journal_details 
    where 
        db_remine.journals.journalized_id = db_remine.issues.id
        and
        db_remine.journals.id = db_remine.journal_details.journal_id
        and
        db_remine.journal_details.prop_key = 'status_id' and db_remine.issues.tracker_id='1' 
                and 
                db_remine.issues.project_id='9' 
                and db_remine.issues.status_id!='9';
