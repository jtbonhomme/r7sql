select 
        db_remine.journals.journalized_id,
        db_remine.journals.created_on,
        db_remine.journal_details.old_value,
        db_remine.journal_details.value 
    from 
        db_remine.issues,
        db_remine.journals,
        db_remine.journal_details 
    where 
        db_remine.journals.journalized_id in (
            select 
                db_remine.issues.id 
            from 
                db_remine.issues 
            where 
                db_remine.issues.tracker_id='1' 
                and 
                db_remine.issues.project_id='9' 
                and db_remine.issues.status_id!='9'
        )
        and
        db_remine.journals.id = db_remine.journal_details.journal_id
        and
        db_remine.journal_details.prop_key = 'status_id' ;
