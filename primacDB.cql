CREATE KEYSPACE IF NOT EXISTS primac_db
WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };

CREATE TABLE reclamos (
    reclamo_id UUID,
    cliente_id UUID,
    poliza_id UUID,
    fecha TIMESTAMP,
    estado TEXT,
    monto DECIMAL,
    descripcion TEXT,
    PRIMARY KEY ((cliente_id), fecha, reclamo_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

CREATE TABLE pagos (
    pago_id UUID,
    cliente_id UUID,
    poliza_id UUID,
    fecha TIMESTAMP,
    monto DECIMAL,
    metodo TEXT,
    estado TEXT,
    PRIMARY KEY ((cliente_id), fecha, pago_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

CREATE TABLE transaction_audit (
    audit_id UUID,
    servicio TEXT,
    operacion TEXT,
    entidad TEXT,
    referencia_id UUID,
    usuario_id UUID,
    fecha TIMESTAMP,
    detalle TEXT,
    PRIMARY KEY ((servicio), fecha, audit_id)
) WITH CLUSTERING ORDER BY (fecha DESC);

