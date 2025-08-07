CREATE OR REPLACE FUNCTION find_available_position_v2(p_sponsor_sponsorship_number text)
    RETURNS TABLE (
                      parent_node_id uuid,
                      "position" text,
                      level integer
                  ) AS $$
DECLARE
    v_sponsor_node_id uuid;
    v_sponsor_level integer;
BEGIN
    -- Find sponsor's node in the tree
    SELECT tmt_id, tmt_level
    INTO v_sponsor_node_id, v_sponsor_level
    FROM tbl_mlm_tree
    WHERE tmt_sponsorship_number = p_sponsor_sponsorship_number
      AND tmt_is_active = true;

    IF v_sponsor_node_id IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found in MLM tree: %', p_sponsor_sponsorship_number;
    END IF;

    -- Use breadth-first search to find first available position
    WITH RECURSIVE tree_search AS (
        SELECT
            tmt_id,
            tmt_left_child_id,
            tmt_right_child_id,
            tmt_level,
            0 AS search_depth
        FROM tbl_mlm_tree
        WHERE tmt_id = v_sponsor_node_id

        UNION ALL

        SELECT
            mt.tmt_id,
            mt.tmt_left_child_id,
            mt.tmt_right_child_id,
            mt.tmt_level,
            ts.search_depth + 1
        FROM tbl_mlm_tree mt
                 JOIN tree_search ts
                      ON mt.tmt_id = ts.tmt_left_child_id OR mt.tmt_id = ts.tmt_right_child_id
        WHERE ts.search_depth < 10
    )
    SELECT
        ts.tmt_id,
        CASE
            WHEN ts.tmt_left_child_id IS NULL THEN 'left'
            WHEN ts.tmt_right_child_id IS NULL THEN 'right'
            ELSE NULL
            END,
        ts.tmt_level + 1
    INTO parent_node_id, "position", level
    FROM tree_search ts
    WHERE ts.tmt_left_child_id IS NULL OR ts.tmt_right_child_id IS NULL
    ORDER BY ts.search_depth, ts.tmt_id
    LIMIT 1;

    -- If no position found, fallback to sponsor node
    IF parent_node_id IS NULL OR "position" IS NULL THEN
        SELECT
            v_sponsor_node_id,
            CASE
                WHEN tmt_left_child_id IS NULL THEN 'left'
                WHEN tmt_right_child_id IS NULL THEN 'right'
                ELSE 'overflow'
                END,
            tmt_level + 1
        INTO parent_node_id, "position", level
        FROM tbl_mlm_tree
        WHERE tmt_id = v_sponsor_node_id;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
