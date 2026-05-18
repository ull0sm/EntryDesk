-- Add is_active column
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Function to evaluate activity for all students in a dojo
CREATE OR REPLACE FUNCTION evaluate_dojo_students_activity(target_dojo_id uuid)
RETURNS void AS $$
DECLARE
    recent_events_count int;
BEGIN
    -- Check how many distinct events this dojo has participated in (up to 2 most recent)
    SELECT COUNT(*) INTO recent_events_count
    FROM (
        SELECT ev.id
        FROM events ev
        JOIN entries e ON e.event_id = ev.id
        JOIN students s ON e.student_id = s.id
        WHERE s.dojo_id = target_dojo_id
        GROUP BY ev.id, ev.end_date
        ORDER BY ev.end_date DESC
        LIMIT 2
    ) as subquery;

    IF recent_events_count >= 2 THEN
        -- Evaluate students in this dojo
        -- A student is inactive if they have 0 entries in the 2 most recent events of the dojo
        UPDATE students st
        SET is_active = (
            CASE
                -- If the student was created AFTER the start date of the older of the 2 events, 
                -- they haven't had the chance to miss 2 events yet, so keep them active.
                WHEN st.created_at > (
                    SELECT MIN(start_date)::timestamptz
                    FROM (
                        SELECT ev.start_date
                        FROM events ev
                        JOIN entries e2 ON e2.event_id = ev.id
                        JOIN students s2 ON e2.student_id = s2.id
                        WHERE s2.dojo_id = target_dojo_id
                        GROUP BY ev.id, ev.end_date, ev.start_date
                        ORDER BY ev.end_date DESC
                        LIMIT 2
                    ) AS recent_two
                ) THEN true
                -- Otherwise, they must have attended at least 1 of the 2 recent events to remain active.
                ELSE
                    EXISTS (
                        SELECT 1
                        FROM entries my_e
                        WHERE my_e.student_id = st.id
                          AND my_e.event_id IN (
                              SELECT ev.id
                              FROM events ev
                              JOIN entries e2 ON e2.event_id = ev.id
                              JOIN students s2 ON e2.student_id = s2.id
                              WHERE s2.dojo_id = target_dojo_id
                              GROUP BY ev.id, ev.end_date
                              ORDER BY ev.end_date DESC
                              LIMIT 2
                          )
                    )
            END
        )
        WHERE st.dojo_id = target_dojo_id;
    ELSE
        -- If dojo hasn't participated in 2 events, everyone is active
        UPDATE students
        SET is_active = true
        WHERE dojo_id = target_dojo_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function that extracts the dojo_id from the entry's student and calls the evaluation
CREATE OR REPLACE FUNCTION trigger_evaluate_dojo_students_activity()
RETURNS trigger AS $$
DECLARE
    dojo_uuid uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT dojo_id INTO dojo_uuid FROM students WHERE id = OLD.student_id;
    ELSE
        SELECT dojo_id INTO dojo_uuid FROM students WHERE id = NEW.student_id;
    END IF;

    IF dojo_uuid IS NOT NULL THEN
        PERFORM evaluate_dojo_students_activity(dojo_uuid);
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors on multiple runs
DROP TRIGGER IF EXISTS evaluate_activity_on_entry ON entries;

-- Create the trigger on entries
CREATE TRIGGER evaluate_activity_on_entry
AFTER INSERT OR UPDATE OR DELETE ON entries
FOR EACH ROW
EXECUTE FUNCTION trigger_evaluate_dojo_students_activity();
