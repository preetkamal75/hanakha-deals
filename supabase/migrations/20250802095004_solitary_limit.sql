CREATE OR REPLACE FUNCTION add_user_to_mlm_tree_v2(
    p_user_id uuid,
    p_sponsorship_number text,
    p_sponsor_sponsorship_number text
) RETURNS jsonb AS $$
DECLARE
    v_new_node_id uuid;
    v_parent_node_id uuid;
    v_position text;
    v_level integer;
    v_sponsor_user_id uuid;
BEGIN
    -- Check if user already exists in tree
    SELECT tmt_id INTO v_new_node_id
    FROM tbl_mlm_tree
    WHERE tmt_user_id = p_user_id;

    IF v_new_node_id IS NOT NULL THEN
        RETURN jsonb_build_object(
                'success', false,
                'error', 'User already exists in MLM tree',
                'node_id', v_new_node_id
               );
    END IF;

    -- Ensure sponsor exists in user profiles
    IF NOT EXISTS (
        SELECT 1 FROM tbl_user_profiles
        WHERE tup_sponsorship_number = p_sponsor_sponsorship_number
    ) THEN
        RETURN jsonb_build_object(
                'success', false,
                'error', 'Sponsor sponsorship number not found: ' || p_sponsor_sponsorship_number
               );
    END IF;

    -- Create root sponsor node if not in MLM tree
    IF NOT EXISTS (
        SELECT 1 FROM tbl_mlm_tree
        WHERE tmt_sponsorship_number = p_sponsor_sponsorship_number
    ) THEN
        SELECT tup_user_id INTO v_sponsor_user_id
        FROM tbl_user_profiles
        WHERE tup_sponsorship_number = p_sponsor_sponsorship_number;

        INSERT INTO tbl_mlm_tree (
            tmt_user_id,
            tmt_parent_id,
            tmt_left_child_id,
            tmt_right_child_id,
            tmt_level,
            tmt_position,
            tmt_sponsorship_number,
            tmt_is_active
        ) VALUES (
                     v_sponsor_user_id,
                     NULL,
                     NULL,
                     NULL,
                     0,
                     'root',
                     p_sponsor_sponsorship_number,
                     true
                 );

        RAISE NOTICE 'Created root node for sponsor: %', p_sponsor_sponsorship_number;
    END IF;

    -- Find available tree position
    SELECT parent_node_id, "position", level
    INTO v_parent_node_id, v_position, v_level
    FROM find_available_position_v2(p_sponsor_sponsorship_number);

    IF v_parent_node_id IS NULL OR v_position IS NULL THEN
        RETURN jsonb_build_object(
                'success', false,
                'error', 'No available position found for sponsor: ' || p_sponsor_sponsorship_number
               );
    END IF;

    IF v_position = 'overflow' THEN
        RETURN jsonb_build_object(
                'success', false,
                'error', 'Sponsor tree is full. Cannot place new user under: ' || p_sponsor_sponsorship_number
               );
    END IF;

    -- Insert new node
    INSERT INTO tbl_mlm_tree (
        tmt_user_id,
        tmt_parent_id,
        tmt_left_child_id,
        tmt_right_child_id,
        tmt_level,
        tmt_position,
        tmt_sponsorship_number,
        tmt_is_active
    ) VALUES (
                 p_user_id,
                 v_parent_node_id,
                 NULL,
                 NULL,
                 v_level,
                 v_position,
                 p_sponsorship_number,
                 true
             ) RETURNING tmt_id INTO v_new_node_id;

    -- Update parent node's child reference
    IF v_position = 'left' THEN
        UPDATE tbl_mlm_tree
        SET tmt_left_child_id = v_new_node_id,
            tmt_updated_at = now()
        WHERE tmt_id = v_parent_node_id;
    ELSE
        UPDATE tbl_mlm_tree
        SET tmt_right_child_id = v_new_node_id,
            tmt_updated_at = now()
        WHERE tmt_id = v_parent_node_id;
    END IF;

    RETURN jsonb_build_object(
            'success', true,
            'node_id', v_new_node_id,
            'parent_id', v_parent_node_id,
            'position', v_position,
            'level', v_level,
            'message', 'User successfully added to MLM tree'
           );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
