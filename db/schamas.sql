CREATE TYPE booking_status AS ENUM ('active', 'cancelled');

CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT slots_valid_time_range CHECK (ends_at > starts_at)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    status booking_status NOT NULL DEFAULT 'active',
    CONSTRAINT bookings_slot_fk FOREIGN KEY (slot_id)
        REFERENCES slots (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT bookings_customer_name_valid CHECK (
        customer_name = btrim(customer_name) AND length(customer_name) > 0
    ),
    CONSTRAINT bookings_customer_email_valid CHECK (
        customer_email = btrim(customer_email) AND length(customer_email) > 0
    )
);

CREATE UNIQUE INDEX bookings_one_active_per_slot
    ON bookings (slot_id)
    WHERE status = 'active';

CREATE INDEX slots_starts_at_id_idx ON slots (starts_at, id);

CREATE INDEX bookings_slot_id_idx ON bookings (slot_id);
